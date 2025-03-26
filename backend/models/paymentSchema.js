const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seller",
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 10
    },
    currency: {
        type: String,
        default: "usd",
        enum: ["usd"]
    },
    status: {
        type: String,
        enum: ["pending", "succeeded", "failed", "refunded"],
        default: "pending"
    },
    transactionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    stripePaymentId: String,
    refunds: [{
        amount: Number,
        reason: String,
        created: Date
    }]
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);