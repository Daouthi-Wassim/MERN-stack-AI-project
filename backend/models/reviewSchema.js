const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 500
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'subjectType'
    },
    subjectType: {
        type: String,
        required: true,
        enum: ['Product']
    },
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    verifiedPurchase: {
        type: Boolean,
        default: false
    },
    orderReference: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);