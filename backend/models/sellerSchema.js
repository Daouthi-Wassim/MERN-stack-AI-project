const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

const sellerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: "Seller"
    },
    shopName: {
        type: String,
        unique: true,
        required: true
    },
    balance: {
        type: Number,
        default: 0,
        min: 0
    },
    stripeAccountId: {
        type: String,
        required: true
    }
}, { timestamps: true });


sellerSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        this.password = await bcrypt.hash(this.password, 12);
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model("Seller", sellerSchema);