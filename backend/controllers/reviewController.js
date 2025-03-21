const mongoose = require('mongoose');
const Review = require('../models/reviewSchema');
const Product = require('../models/productSchema');
const Order = require('../models/orderSchema');

const reviewController = {

    createReview: async(req, res) => {
        try {
            const { rating, comment, productId } = req.body;

            // 1. Vérifier l'existence du produit
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Produit introuvable"
                });
            }

            // 2. Vérifier commande "Delivered"
            /*const validOrder = await Order.findOne({
                buyer: req.user.id,
                "orderedProducts.product": productId,
                orderStatus: "Delivered"
            });

            if (!validOrder) {
                return res.status(403).json({
                    success: false,
                    message: "Vous devez avoir reçu ce produit pour le noter"
                });
            }
*/
            // 3. Vérifier review existante
            const existingReview = await Review.findOne({
                product: productId,
                reviewer: req.user.id
            });

            if (existingReview) {
                return res.status(400).json({
                    success: false,
                    message: "Vous avez déjà noté ce produit"
                });
            }

            // 4. Créer la review
            const newReview = await Review.create({
                rating,
                comment,
                product: productId,
                seller: product.seller, // Récupéré du produit
                reviewer: req.user.id
            });

            res.status(201).json({
                success: true,
                data: newReview
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Stats pour vendeur
    getSellerStats: async(req, res) => {
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
    },

    // Stats pour admin
    getAdminStats: async(req, res) => {
        try {
            const stats = await Review.aggregate([{
                    $group: {
                        _id: "$product",
                        averageRating: { $avg: "$rating" },
                        totalReviews: { $sum: 1 },
                        lowRatings: {
                            $sum: { $cond: [{ $lte: ["$rating", 2] }, 1, 0] }
                        }
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
                    $lookup: {
                        from: "sellers",
                        localField: "product.seller",
                        foreignField: "_id",
                        as: "seller"
                    }
                },
                {
                    $project: {
                        productName: { $arrayElemAt: ["$product.productName", 0] },
                        seller: { $arrayElemAt: ["$seller.shopName", 0] },
                        averageRating: 1,
                        totalReviews: 1,
                        lowRatings: 1
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
    },

    // Mettre à jour une review (Admin seulement)
    updateReview: async(req, res) => {
        try {
            const updatedReview = await Review.findByIdAndUpdate(
                req.params.id,
                req.body, { new: true, runValidators: true }
            );

            if (!updatedReview) {
                return res.status(404).json({
                    success: false,
                    message: "Review introuvable"
                });
            }

            res.json({
                success: true,
                data: updatedReview
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Supprimer une review (Admin seulement)
    deleteReview: async(req, res) => {
        try {
            const deletedReview = await Review.findByIdAndDelete(req.params.id);

            if (!deletedReview) {
                return res.status(404).json({
                    success: false,
                    message: "Review introuvable"
                });
            }

            res.json({
                success: true,
                message: "Review supprimée avec succès"
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = reviewController;