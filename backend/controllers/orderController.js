const mongoose = require("mongoose");
const Product = require('../models/productSchema.js')
const Order = require('../models/orderSchema');
const Customer = require('../models/customerSchema.js');
const Admin = require('../models/adminSchema.js');
const Seller = require('../models/sellerSchema');
const NotificationService = require('../routes/notificationService.js');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Payment = require("../models/paymentSchema");
const ReturnRequest = require("../models/returnSchema");
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
                recipent: sellerId,
                recipentmodel: "Seller",
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
            recipent: process.env.ADMIN_ID,
            recipentmodel: "Admin",
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
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const { status } = req.body;
        const validStatuses = ["Processing", "Shipped", "Delivered", "Cancelled"];

        // Validation
        if (!validStatuses.includes(status)) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: `Invalid status. Valid options: ${validStatuses.join(", ")}`
            });
        }

        const order = await Order.findById(req.params.id)
            .session(session)
            .populate('Customer')
            .populate('paymentStatus');

        // Cancellation handling
        if (status === "Cancelled") {
            if (order.orderStatus === "Delivered") {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: "Cannot cancel a delivered order"
                });
            }

            // Update order status
            order.orderStatus = "Cancelled";
            await order.save({ session });

            // Process refund
            await Payment.findByIdAndUpdate(
                order.paymentStatus._id, {
                    status: 'refunded',
                    refundDate: new Date(),
                    refundReason: "Customer cancellation"
                }, { session }
            );

            // Customer notification
            await NotificationService.create({
                recipent: order.buyer._id,
                recipentmodel: 'Customer',
                type: 'ORDER_CANCELLED',
                content: {
                    title: `Order #${order._id.toString().slice(-6)} cancelled`,
                    message: "Your refund will be processed within 5-7 business days",
                    metadata: { orderId: order._id }
                },
                channels: ['EMAIL', 'IN_APP']
            });

            // Seller notifications (informational)
            const sellers = [...new Set(order.orderedProducts.map(p => p.seller))];
            await Promise.all(sellers.map(async(sellerId) => {
                await NotificationService.create({
                    recipent: sellerId,
                    recipentmodel: 'Seller',
                    type: 'ORDER_CANCELLED',
                    content: {
                        title: `Order #${order._id.toString().slice(-6)} cancelled`,
                        message: "Customer initiated cancellation - refund processed",
                        metadata: { orderId: order._id }
                    },
                    channels: ['IN_APP']
                });
            }));

            await session.commitTransaction();
            return res.json({
                success: true,
                message: "Cancellation confirmed. Refund initiated successfully",
                data: {
                    orderId: order._id,
                    refundEta: "5-7 business days"
                }
            });
        }

        // Regular status update
        order.orderStatus = status;
        await order.save({ session });
        await session.commitTransaction();

        res.json({
            success: true,
            message: "Order status updated successfully",
            data: order
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("Server Error:", error);
        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'development' ?
                `Server Error: ${error.message}` : "Internal server error"
        });
    } finally {
        session.endSession();
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