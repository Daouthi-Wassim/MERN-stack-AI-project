const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const Review = require('../models/reviewSchema');
const Product = require('../models/productSchema.js')
const Order = require('../models/orderSchema');
const Customer = require('../models/customerSchema.js');
const Admin = require('../models/adminSchema.js');
const Seller = require('../models/sellerSchema');
const Notification = require("../models/notificationSchema");
const NotificationService = require('../routes/notificationService.js');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Payment = require("../models/paymentSchema");
const ReturnRequest = require("../models/returnSchema");
const { createNewToken } = require('../utils/token.js');

const sellerRegister = async(req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(req.body.password, salt);

        const seller = new Seller({
            ...req.body,
            password: hashedPass
        });

        const existingSellerByEmail = await Seller.findOne({ email: req.body.email });
        const existingShop = await Seller.findOne({ shopName: req.body.shopName });

        if (existingSellerByEmail) {
            res.send({ message: 'Email already exists' });
        } else if (existingShop) {
            res.send({ message: 'Shop name already exists' });
        } else {
            let result = await seller.save();
            result.password = undefined;

            const token = createNewToken(result._id)

            result = {
                ...result._doc,
                token: token
            };

            res.send(result);
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const sellerLogIn = async(req, res) => {
    try {
        if (!req.body.email || !req.body.password) {
            return res.status(400).send({ message: "Email and password are required" });
        }

        // First try to find admin
        let admin = await Admin.findOne({ email: req.body.email });
        if (admin) {
            const validated = await bcrypt.compare(req.body.password, admin.password);
            if (validated) {
                admin.password = undefined;
                const token = createNewToken({
                    id: admin._id,
                    role: 'Admin'
                });

                return res.status(200).json({
                    ...admin._doc,
                    token,
                    role: 'Admin'
                });
            }
        }

        // If not admin, try seller login
        let seller = await Seller.findOne({ email: req.body.email });
        if (seller) {
            const validated = await bcrypt.compare(req.body.password, seller.password);
            if (validated) {
                seller.password = undefined;
                const token = createNewToken({
                    id: seller._id,
                    role: 'Seller'
                });

                return res.status(200).json({
                    ...seller._doc,
                    token,
                    role: 'Seller'
                });
            } else {
                return res.status(401).send({ message: "Invalid password" });
            }
        }

        return res.status(404).send({ message: "User not found" });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};


const getPayments = async(req, res) => {
    try {
        const payments = await Payment.find({ seller: req.user.id })
            .populate("Customer", "name");

        res.json({
            success: true,
            data: payments.map(p => ({
                amount: p.amount + " usd",
                date: p.createdAt,
                status: p.status
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const getAVGreviews = async(req, res) => {
    try {
        const stats = await Review.aggregate([
            { $match: { seller: new mongoose.Types.ObjectId(req.user.id) } },
            {
                $group: {
                    _id: "$product",
                    averageRating: { $avg: "$rating" },
                    totalReviews: { $sum: 1 },
                    lastReview: { $max: "$createdAt" }
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $project: {
                    productName: { $arrayElemAt: ["$product.productName", 0] },
                    averageRating: { $round: ["$averageRating", 1] },
                    totalReviews: 1,
                    lastReview: 1
                }
            }
        ]);

        res.json({ success: true, data: stats });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const getSellerNotification = async(req, res) => {
    try {
        const notifications = await Notification.find({

                recipentmodel: 'Seller',
            })
            .sort("-createdAt")
            .limit(100);

        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
module.exports = {
    sellerRegister,
    sellerLogIn,
    getAVGreviews,
    getPayments,
    getSellerNotification
};