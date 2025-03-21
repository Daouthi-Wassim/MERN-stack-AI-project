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

        const order = await Order.create({
            buyer,
            shippingData,
            orderedProducts,
            paymentInfo,
            paidAt: Date.now(),
            productsQuantity,
            totalPrice,
        });

        return res.send(order);

    } catch (err) {
        res.status(500).json(err);
    }
}

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

        // Validation renforcée
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Statut invalide. Options valides: Processing, Shipped, Delivered, Cancelled"
            });
        }

        const order = await Order.findByIdAndUpdate(
                req.params.id, { orderStatus: status }, {
                    new: true,
                    runValidators: true // Active les validateurs Mongoose
                }
            )
            .populate('buyer', 'name email')
            .populate('orderedProducts.product', 'productName price');

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
        console.error("Erreur mise à jour statut:", error);
        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'development' ?
                error.message : "Erreur serveur"
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