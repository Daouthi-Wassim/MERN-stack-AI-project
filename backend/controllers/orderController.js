const Order = require('../models/orderSchema.js');

const newOrder = async(req, res) => {
    try {
        const {
            buyer,
            shippingData,
            orderedProducts,
            paymentInfo,
            productsQuantity,
            totalPrice,
        } = req.body;

        // Validation des produits
        if (!orderedProducts || orderedProducts.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Le panier ne peut pas être vide"
            });
        }

        // Création de la commande avec statut par défaut
        const order = await Order.create({
            buyer,
            shippingData,
            orderedProducts,
            paymentInfo,
            productsQuantity,
            totalPrice,
            orderStatus: "Processing",
            paidAt: Date.now()
        });

        // Notification aux vendeurs
        const uniqueSellerIds = [...new Set(
            orderedProducts.map(p => p.seller.toString())
        )];

        for (const sellerId of uniqueSellerIds) {
            const sellerProducts = orderedProducts.filter(p =>
                p.seller.toString() === sellerId
            );

            await NotificationService.create({
                destinataire: sellerId,
                modeleDestinataire: "Seller",
                type: "NOUVELLE_COMMANDE",
                contenu: {
                    titre: "Nouvelle commande 📦",
                    message: `Vous avez ${sellerProducts.length} article(s) à préparer pour la commande #${order._id.toString().slice(-6)}`
                },
                channel: ["EMAIL", "IN_APP"]
            });
        }

        // Notification à l'admin
        await NotificationService.create({
            destinataire: process.env.ADMIN_ID,
            modeleDestinataire: "Admin",
            type: "NOUVELLE_COMMANDE",
            contenu: {
                titre: "Nouvelle transaction 💰",
                message: `Commande #${order._id.toString().slice(-6)} créée - Montant : ${totalPrice}€`
            },
            channel: ["EMAIL", "IN_APP"]
        });

        res.status(201).json({
            success: true,
            data: order,
            message: "Commande créée avec succès"
        });

    } catch (err) {
        console.error("Erreur création commande:", err);

        // Gestion des erreurs de validation
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: "Données de commande invalides",
                errors: Object.values(err.errors).map(e => e.message)
            });
        }

        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'development' ?
                err.message : "Erreur lors de la création de la commande"
        });
    }
};

const getOrderedProductsByCustomer = async(req, res) => {
    try {
        let orders = await Order.find({ buyer: req.params.id });

        if (orders.length > 0) {
            const orderedProducts = orders.reduce((accumulator, order) => {
                accumulator.push(...order.orderedProducts);
                return accumulator;
            }, []);
            res.send(orderedProducts);
        } else {
            res.send({ message: "No products found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const getOrderedProductsBySeller = async(req, res) => {
    try {
        const sellerId = req.params.id;

        const ordersWithSellerId = await Order.find({
            'orderedProducts.seller': sellerId
        });

        if (ordersWithSellerId.length > 0) {
            const orderedProducts = ordersWithSellerId.reduce((accumulator, order) => {
                order.orderedProducts.forEach(product => {
                    const existingProductIndex = accumulator.findIndex(p => p._id.toString() === product._id.toString());
                    if (existingProductIndex !== -1) {
                        // If product already exists, merge quantities
                        accumulator[existingProductIndex].quantity += product.quantity;
                    } else {
                        // If product doesn't exist, add it to accumulator
                        accumulator.push(product);
                    }
                });
                return accumulator;
            }, []);
            res.send(orderedProducts);
        } else {
            res.send({ message: "No products found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
};
const updateOrderStatus = async(req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ["Processing", "Shipped", "Delivered", "Cancelled"];
        const STATUS_LABELS = {
            Processing: "en traitement",
            Shipped: "expédiée",
            Delivered: "livrée",
            Cancelled: "annulée"
        };

        // Validation du statut
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Statut invalide. Options valides : ${validStatuses.join(", ")}`
            });
        }

        // Récupération et mise à jour avec population corrigée
        const order = await Order.findByIdAndUpdate(
            req.params.id, { orderStatus: status }, {
                new: true,
                runValidators: true,
                populate: [
                    { path: 'buyer', select: 'name email phone' },
                    {
                        path: 'orderedProducts.product',
                        select: 'productName price',
                        populate: {
                            path: 'seller',
                            select: 'shopName email'
                        }
                    }
                ]
            }
        ).lean();

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Commande introuvable"
            });
        }

        // Notification client
        await NotificationService.create({
            destinataire: order.buyer._id,
            modeleDestinataire: 'Customer',
            type: 'STATUT_COMMANDE',
            contenu: {
                titre: `Commande #${order._id.toString().slice(-6)}`,
                message: `Votre commande est maintenant ${STATUS_LABELS[status]}`,
                metadata: { idCommande: order._id }
            },
            channel: ['EMAIL', 'IN_APP']
        });

        // Notification vendeur(s)
        if (['Shipped', 'Delivered'].includes(status)) {
            const uniqueSellers = [...new Set(
                order.orderedProducts.map(p => p.product.seller._id.toString())
            )];

            for (const sellerId of uniqueSellers) {
                await NotificationService.create({
                    destinataire: sellerId,
                    modeleDestinataire: 'Seller',
                    type: 'STATUT_COMMANDE',
                    contenu: {
                        titre: `Mise à jour commande #${order._id.toString().slice(-6)}`,
                        message: `Statut changé à : ${STATUS_LABELS[status]}`,
                        metadata: { idCommande: order._id }
                    }
                });
            }
        }

        // Notification admin pour annulation
        if (status === 'Cancelled') {
            await NotificationService.create({
                destinataire: process.env.ADMIN_ID,
                modeleDestinataire: 'Admin',
                type: 'ALERTE_SYSTEME',
                contenu: {
                    titre: 'Annulation de commande',
                    message: `Commande #${order._id.toString().slice(-6)} annulée par ${order.buyer.name}`
                },
                channel: ['EMAIL']
            });
        }

        res.json({
            success: true,
            data: order,
            notification: "Statut mis à jour et notifications envoyées"
        });

    } catch (error) {
        console.error("Erreur mise à jour statut:", error);

        // Gestion des erreurs de monitoring
        if (process.env.NODE_ENV === 'production' && typeof captureError === 'function') {
            captureError(error);
        }

        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'development' ?
                `Erreur serveur : ${error.message}` : "Une erreur est survenue lors de la mise à jour"
        });
    }
};
const getOrderDetails = async(req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('buyer', 'name email')
            .populate('orderedProducts.product', 'productName price images')
            .populate('orderedProducts.seller', 'shopName');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Commande introuvable"
            });
        }

        res.json({
            success: true,
            data: order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur de récupération"
        });
    }
};
module.exports = {
    newOrder,
    getOrderDetails,
    updateOrderStatus,
    getOrderedProductsByCustomer,
    getOrderedProductsBySeller
};