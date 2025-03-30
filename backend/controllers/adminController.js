const mongoose = require("mongoose");
const Admin = require('../models/adminSchema');
const Seller = require('../models/sellerSchema');
const Customer = require('../models/customerSchema');
const Product = require('../models/productSchema');
const Order = require('../models/orderSchema');
const Review = require('../models/reviewSchema');
const ReturnRequest = require("../models/returnSchema");
const Payment = require("../models/paymentSchema");
const Notification = require("../models/notificationSchema");

const bcrypt = require('bcryptjs');


const { createNewToken } = require('../utils/token');

const adminController = {
    // Authentication
    adminLogin: async(req, res) => {
        try {
            const { email, password } = req.body;

            // Input validation
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            // Find admin with detailed error handling
            const admin = await Admin.findOne({ email }).select('+password');
            if (!admin) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Verify password with error handling
            try {
                const isMatch = await admin.comparePassword(password);
                if (!isMatch) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid credentials'
                    });
                }
            } catch (passwordError) {
                console.error('Password comparison error:', passwordError);
                return res.status(500).json({
                    success: false,
                    message: 'Error verifying credentials'
                });
            }

            // Generate token with error handling
            try {
                const token = createNewToken({
                    id: admin._id,
                    email: admin.email,
                    role: admin.role
                });

                return res.json({
                    success: true,
                    token,
                    user: {
                        id: admin._id,
                        name: admin.name,
                        email: admin.email,
                        role: admin.role
                    }
                });
            } catch (tokenError) {
                console.error('Token generation error:', tokenError);
                return res.status(500).json({
                    success: false,
                    message: 'Error generating authentication token'
                });
            }

        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error during login',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },
    // Create new admin (admin-only)
    createAdmin: async(req, res) => {
        try {
            // Vérifier le rôle de l'admin
            if (req.user.role !== 'Admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé'
                });
            }

            // Hacher le mot de passe
            const hashedPassword = await bcrypt.hash(req.body.password, 12);

            // Créer l'admin avec le mot de passe haché
            const newAdmin = await Admin.create({
                ...req.body,
                password: hashedPassword
            });

            newAdmin.password = undefined; // Ne pas renvoyer le mot de passe
            res.status(201).json({
                success: true,
                data: newAdmin
            });

        } catch (error) {
            // Gérer les erreurs de duplication d'email
            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: 'Cet email est déjà utilisé'
                });
            }

            // Gérer les erreurs de validation Mongoose
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(val => val.message);
                return res.status(400).json({
                    success: false,
                    message: messages.join(', ')
                });
            }

            res.status(500).json({
                success: false,
                message: 'Erreur serveur'
            });
        }
    },
    // Toggle product status
    toggleProductStatus: async(req, res) => {
        try {
            const product = await Product.findById(req.params.id);
            product.isActive = !product.isActive;
            await product.save();
            res.json({ success: true, isActive: product.isActive });
        } catch (error) {
            res.status(500).json({ message: 'Error updating product' });
        }
    },
    // Update order status
    updateOrderStatus: async(req, res) => {
        try {
            const { status } = req.body;
            const validStatuses = ["Processing", "Shipped", "Delivered", "Cancelled"];

            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Statut invalide. Options: Processing, Shipped, Delivered, Cancelled'
                });
            }

            const order = await Order.findByIdAndUpdate(
                req.params.id, { orderStatus: status }, { new: true, runValidators: true } // <-- Validation activée
            ).populate('buyer seller');

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Commande introuvable'
                });
            }

            res.json({ success: true, data: order });
        } catch (error) {
            console.error('Erreur mise à jour commande:', error);
            res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
    },

    // Dashboard Statistics

    getDashboardStats: async(req, res) => {
        try {
            const [
                totalCustomers,
                totalSellers,
                totalProducts,
                totalOrders,
                revenueResult,
                recentOrders,
                topSellers,
                paymentStats
            ] = await Promise.all([
                Customer.countDocuments(),
                Seller.countDocuments(),
                Product.countDocuments(),
                Order.countDocuments(),
                Order.aggregate([
                    { $match: { orderStatus: "Delivered" } },
                    {
                        $group: {
                            _id: null,
                            totalRevenue: { $sum: "$totalPrice" },
                            averageOrder: { $avg: "$totalPrice" },
                            totalOrders: { $sum: 1 }
                        }
                    }
                ]),
                Order.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('buyer', 'name email')
                .populate({
                    path: 'orderedProducts.seller',
                    select: 'shopName',
                    model: 'Seller'
                })
                .lean(),
                Order.aggregate([
                    { $unwind: "$orderedProducts" },
                    {
                        $group: {
                            _id: "$orderedProducts.seller",
                            totalSales: { $sum: "$orderedProducts.price.cost" },
                            totalOrders: { $sum: 1 },
                            productsSold: { $sum: "$orderedProducts.quantity" }
                        }
                    },
                    {
                        $lookup: {
                            from: "sellers",
                            localField: "_id",
                            foreignField: "_id",
                            as: "sellerDetails"
                        }
                    },
                    { $unwind: "$sellerDetails" },
                    {
                        $project: {
                            shopName: "$sellerDetails.shopName",
                            totalSales: 1,
                            totalOrders: 1,
                            productsSold: 1
                        }
                    },
                    { $sort: { totalSales: -1 } },
                    { $limit: 5 }
                ]),
                Payment.aggregate([{
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$breakdown.total" },
                        totalFees: { $sum: "$breakdown.adminFee" },
                        totalNet: { $sum: "$netAmount" }
                    }
                }])
            ]);

            // Fonction helper pour formater les nombres
            const safeFormat = (value, defaultValue = 0) => {
                const num = Number(value);
                return !isNaN(num) ? num.toFixed(2) : defaultValue.toFixed(2);
            };

            const stats = {
                users: {
                    customers: totalCustomers,
                    sellers: totalSellers
                },
                products: totalProducts,
                orders: {
                    total: totalOrders,
                    average: revenueResult[0] && typeof revenueResult[0].averageOrder !== 'undefined' ?
                        Number(revenueResult[0].averageOrder.toFixed(2)) : 0,
                    revenue: revenueResult[0] && typeof revenueResult[0].totalRevenue !== 'undefined' ?
                        Number(revenueResult[0].totalRevenue.toFixed(2)) : 0
                },
                payments: {
                    gross: paymentStats[0] && paymentStats[0].totalRevenue ?
                        Number(paymentStats[0].totalRevenue.toFixed(2)) : 0,
                    fees: paymentStats[0] && paymentStats[0].totalFees ?
                        Number(paymentStats[0].totalFees.toFixed(2)) : 0,
                    net: paymentStats[0] && paymentStats[0].totalNet ?
                        Number(paymentStats[0].totalNet.toFixed(2)) : 0
                },

                recentOrders: await Order.find()
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .populate('buyer', 'name email')
                    .populate({
                        path: 'orderedProducts.seller',
                        select: 'shopName',
                        model: 'Seller'
                    })
                    .lean(),
                topSellers: topSellers.map(seller => ({
                    shopName: seller.shopName,
                    sales: safeFormat(seller.totalSales),
                    orders: seller.totalOrders || 0,
                    products: seller.productsSold || 0
                }))
            };

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Dashboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur de récupération des données',
                error: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    },


    // User Management
    getcustomers: async(req, res) => {
        try {
            const { sort, page = 1, limit = 10 } = req.query;
            let users = [],
                total = 0;


            users = await Customer.find()
                .select('-password')
                .sort(sort ? {
                    [sort]: 1
                } : { createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit));
            total = await Customer.countDocuments();



            res.json({
                success: true,
                data: {
                    users,
                    total,
                    pages: Math.ceil(total / limit),
                    currentPage: parseInt(page)
                }
            });
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({ message: 'Error fetching users' });
        }
    },
    getsellers: async(req, res) => {
        try {
            const { sort, page = 1, limit = 10 } = req.query;
            let users = [],
                total = 0;


            users = await Seller.find()
                .select('-password')
                .sort(sort ? {
                    [sort]: 1
                } : { createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit));
            total = await Seller.countDocuments();



            res.json({
                success: true,
                data: {
                    users,
                    total,
                    pages: Math.ceil(total / limit),
                    currentPage: parseInt(page)
                }
            });
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({ message: 'Error fetching users' });
        }
    },

    deleteUser: async(req, res) => {
        try {
            const { id, role } = req.params;
            let user;

            if (role === 'Seller') {
                user = await Seller.findById(id);
                if (user) {
                    await Promise.all([
                        Order.deleteMany({ seller: id }),
                        Product.deleteMany({ seller: id }),
                        Seller.findByIdAndDelete(id)
                    ]);
                }
            } else if (role === 'Customer') {
                user = await Customer.findById(id);
                if (user) {
                    await Promise.all([
                        Order.deleteMany({ customer: id }),
                        Customer.findByIdAndDelete(id)
                    ]);
                }
            }

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json({
                success: true,
                message: 'User and related data deleted successfully'
            });
        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({ message: 'Error deleting user' });
        }
    },


    // Product Management
    getAllProducts: async(req, res) => {
        try {
            const { category, seller, sort, page = 1, limit = 10 } = req.query;
            const query = {};

            if (category) query.category = category;
            if (seller) query.seller = seller;

            const products = await Product.find(query)
                .populate('seller', 'name email')
                .sort(sort ? {
                    [sort]: 1
                } : { createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit));

            const total = await Product.countDocuments(query);

            res.json({
                success: true,
                data: {
                    products,
                    total,
                    pages: Math.ceil(total / limit),
                    currentPage: page
                }
            });
        } catch (error) {
            console.error('Get products error:', error);
            res.status(500).json({ message: 'Error fetching products' });
        }
    },

    // Order Management
    getAllOrders: async(req, res) => {
        try {
            const { status, seller, customer, sort, page = 1, limit = 10 } = req.query;
            const query = {};

            if (status) query.status = status;
            if (seller) query.seller = seller;
            if (customer) query.customer = customer;

            const orders = await Order.find(query)
                .populate('customer', 'name email')
                .populate('seller', 'name email')
                .populate('products.product')
                .sort(sort ? {
                    [sort]: 1
                } : { createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit));

            const total = await Order.countDocuments(query);

            res.json({
                success: true,
                data: {
                    orders,
                    total,
                    pages: Math.ceil(total / limit),
                    currentPage: page
                }
            });
        } catch (error) {
            console.error('Get orders error:', error);
            res.status(500).json({ message: 'Error fetching orders' });
        }
    },


    getReviewSellers: async(req, res) => {
        try {
            const sellerStats = await Review.aggregate([{
                    $group: {
                        _id: "$seller",
                        averageRating: { $avg: "$rating" },
                        totalReviews: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: "sellers",
                        localField: "_id",
                        foreignField: "_id",
                        as: "seller"
                    }
                },
                {
                    $project: {
                        sellerId: "$_id",
                        sellerName: { $arrayElemAt: ["$seller.shopName", 0] },
                        averageRating: { $round: ["$averageRating", 1] },
                        totalReviews: 1,
                        _id: 0
                    }
                }
            ]);

            res.json({
                success: true,
                data: sellerStats
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message // Correction de 'messsage' à 'message'
            });
        }
    },

    getReviewProducts: async(req, res) => {
        try {
            const productStats = await Review.aggregate([{
                    $group: {
                        _id: "$product",
                        averageRating: { $avg: "$rating" },
                        totalReviews: { $sum: 1 }
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
                        productId: "$_id",
                        productName: { $arrayElemAt: ["$product.productName", 0] },
                        averageRating: { $round: ["$averageRating", 1] },
                        totalReviews: 1,
                        _id: 0
                    }
                }
            ]);

            res.json({
                success: true,
                data: productStats
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message // Correction de 'messsage' à 'message'
            });
        }
    },
    addSeller: async(req, res) => {
        try {
            const { name, email, password, shopName } = req.body;
            const hashedPassword = await bcrypt.hash(password, 12);

            const newSeller = await Seller.create({
                name,
                email,
                password: hashedPassword,
                shopName
            });

            newSeller.password = undefined;
            res.status(201).json({
                success: true,
                data: newSeller
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },
    addcustomer: async(req, res) => {
        try {
            const { name, email, password } = req.body;
            const hashedPassword = await bcrypt.hash(password, 12);

            const newCustomer = await Customer.create({
                name,
                email,
                password: hashedPassword,

            });

            newCustomer.password = undefined;
            res.status(201).json({
                success: true,
                data: newCustomer
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    getCustomerDetails: async(req, res) => {
        try {
            const customer = await Customer.findById(req.params.id)
                .select('-password')
                .populate({
                    path: 'cartDetails.Seller',
                    select: 'shopName'
                })
                .populate({
                    path: 'orders',
                    select: 'totalPrice orderStatus createdAt'
                });

            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: "Acheteur non trouvé"
                });
            }

            res.json({ success: true, data: customer });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getPaymentDetails: async(req, res) => {
        try {
            let query = {};

            if (req.query.status) {
                query.status = req.query.status;
            }
            const payments = await Payment.find(query)
                .populate("seller")
                .populate("customer", "email");

            if (payments.length === 0) {
                return res.status(404).json({ success: false, message: "Payment status no found " });
            }
            res.json({
                success: true,
                data: payments.map(p => ({
                    amount: p.amount,
                    currency: p.currency,
                    status: p.status,
                    date: p.createdAt,
                }))
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },



    getallReturnRequests: async(req, res) => {
        try {

            let pipeline = [];
            const returns = await ReturnRequest.aggregate(pipeline)
                .sort("-createdAt")
                .limit(50);

            res.json({
                success: true,
                data: returns
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },


    getAdminNotifications: async(req, res) => {
        try {
            const notifications = await Notification.find({

                    modeleDestinataire: 'Admin',
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
    },


}
module.exports = adminController;