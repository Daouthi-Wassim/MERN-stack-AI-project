const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema({
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
    type: {
        type: String,
        enum: ["full refund", "partial refund", "exchange"],
        required: true
    },
    reason: {
        type: String,
        required: true,
        maxlength: 500
    },
    requestedAmount: {
        type: Number,
        min: 0,
        required: function() {
            return this.type !== "exchange";
        }
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "admin_review"],
        default: "pending"
    },
    evidence: [String],
    paymentReference: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment"
    }
}, { timestamps: true });

module.exports = mongoose.model("ReturnRequest", returnSchema);