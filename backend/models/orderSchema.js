const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },
    orderedProducts: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Seller",
            required: true
        }
    }],
    totalPrice: {
        type: Number,
        required: true,
        min: 10
    },
    paymentStatus: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment"
    },
    transactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment"
    }],
    orderStatus: {
        type: String,
        enum: ["Processing", "Shipped", "Delivered", "Cancelled"],
        default: "Processing"
    }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);