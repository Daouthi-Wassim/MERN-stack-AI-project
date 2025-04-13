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


const customerRegister = async(req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(req.body.password, salt);

        const customer = new Customer({
            ...req.body,
            password: hashedPass
        });

        const existingcustomerByEmail = await Customer.findOne({ email: req.body.email });

        if (existingcustomerByEmail) {
            res.send({ message: 'Email already exists' });
        } else {
            let result = await customer.save();
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


const customerLogIn = async(req, res) => {
    try {
        if (!req.body.email || !req.body.password) {
            return res.status(400).json({ message: "Email and password are required" });
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

        // If not admin, try customer login
        let customer = await Customer.findOne({ email: req.body.email });
        if (customer) {
            const validated = await bcrypt.compare(req.body.password, customer.password);
            if (validated) {
                customer.password = undefined;
                const token = createNewToken({
                    id: customer._id,
                    role: 'Customer'
                });

                return res.status(200).json({
                    ...customer._doc,
                    token,
                    role: 'Customer'
                });
            } else {
                return res.status(401).json({ message: "Invalid password" });
            }
        }

        return res.status(404).json({ message: "User not found" });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};


const getCartDetail = async(req, res) => {
    try {
        let customer = await Customer.findById(req.params.id)
        if (customer) {
            res.send(customer.cartDetails);
        } else {
            res.send({ message: "No customer found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
}

const cartUpdate = async(req, res) => {
    try {
        const customer = await Customer.findByIdAndUpdate(
            req.params.id, { $set: req.body }, { new: true }
        );
        res.send(customer);
    } catch (err) {
        res.status(500).json(err);
    }
}

const createPayment = async(req, res) => {
    const session = await mongoose.startSession();

    try {
        await session.startTransaction();

        // 1. Validation initiale
        const { orderId } = req.body;
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "order ID invalid"
            });
        }

        // 2. Récupération de la commande
        const order = await Order.findById(orderId)
            .populate({
                path: 'buyer',
                select: '_id email',
                options: { lean: true }
            })
            .populate({
                path: 'orderedProducts.seller',
                select: '_id stripeAccountId balance',
                options: { allowNull: false }
            })
            .populate({
                path: 'orderedProducts.product',
                select: 'productName price',
                model: Product
            })
            .session(session);



        // 4. Validation du montant
        if (order.totalPrice <= 5) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "invalid amount"
            });
        }
        if (order.orderStatus !== "Processing") {
            return res.status(400).json({
                success: false,
                message: ` payement possible just with this order statut "Processing". your Statut is : ${order.orderStatus}`
            });
        }

        // 5. Création du paiement Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(order.totalPrice * 100),
            currency: 'usd',
            payment_method_types: ['card'],
            metadata: {
                orderId: order._id.toString(),
                customerId: order.buyer._id.toString(),
                sellerId: order.orderedProducts[0].seller._id.toString()
            }
        });

        // 6. Création de l'enregistrement de paiement
        const payment = await Payment.create([{
            order: orderId,
            customer: order.buyer._id,
            seller: order.orderedProducts[0].seller._id,
            amount: order.totalPrice,
            currency: 'usd',
            transactionId: paymentIntent.id,
            status: 'pending',
            stripePaymentId: paymentIntent.id
        }], { session });

        // 7. Mise à jour de la commande
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId, {
                paymentStatus: payment[0]._id,
                $push: { transactions: payment[0]._id },
                orderStatus: "Shipped"
            }, { session, new: true }
        );

        if (!updatedOrder) {
            await session.abortTransaction();
            return res.status(500).json({
                success: false,
                message: "update order failure"
            });
        }

        // 8. Calcul des commissions
        const commission = Number((order.totalPrice * 0.2).toFixed(2));
        const sellerAmount = Number((order.totalPrice - commission).toFixed(2));

        // 9. Vérification des comptes avant mise à jour
        const [sellerAccount, adminAccount] = await Promise.all([
            Seller.findById(order.orderedProducts[0].seller._id).session(session),
            Admin.findById(process.env.ADMIN_ID).session(session)
        ]);

        if (!sellerAccount || !adminAccount) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "account not found",
                missing: {
                    seller: !sellerAccount,
                    admin: !adminAccount
                }
            });
        }

        // 10. Mise à jour atomique des soldes
        const [updatedSeller, updatedAdmin] = await Promise.all([
            Seller.findByIdAndUpdate(
                sellerAccount._id, { $inc: { balance: sellerAmount } }, { session, new: true }
            ),
            Admin.findByIdAndUpdate(
                adminAccount._id, { $inc: { platformBalance: commission } }, { session, new: true }
            )
        ]);

        // 11. Vérification finale
        if (!updatedSeller || !updatedAdmin) {
            await session.abortTransaction();
            return res.status(500).json({
                success: false,
                message: "critical update failure "
            });
        }

        // 12. Notifications
        await Promise.all([
            NotificationService.create({
                recipent: order.buyer._id,
                recipentmodel: 'Customer',
                type: 'PAIEMENT_REUSSI',
                contenu: {
                    titre: `Payment Confirmed #${payment.transactionId}`,
                    message: "Thank you for your purchase!",
                    metadata: {
                        transactionId: payment.transactionId,
                        total: order.totalPrice.toFixed(2),
                        items: order.orderedProducts.map(p => ({
                            product: p.product.productName,
                            quantity: p.quantity,
                            unitPrice: p.product.price,
                            total: (p.product.price * p.quantity).toFixed(2)
                        }))

                    }
                },
                channel: ['EMAIL', 'IN_APP']
            }, { session }),

            NotificationService.create({

                recipent: updatedSeller._id,
                recipentmodel: 'Seller',
                type: 'CREDIT_SOLDE',
                contenu: {

                    titre: `Hello, 
                    Other order confirmed #${order._id}`,
                    message: `Your balance has increased by  ${sellerAmount}$`,
                    metadata: {
                        orderId: order._id,
                        totalAmount: order.totalPrice.toFixed(2) - commission.toFixed(2),
                        items: order.orderedProducts.map(p => ({
                            name: p.product.productName,
                            quantity: p.quantity
                        }))
                    }

                },
                channel: ['EMAIL', 'IN_APP']
            }, { session }),

            NotificationService.create({
                recipent: updatedAdmin._id,
                recipentmodel: 'Admin',
                type: 'COMMISSION',
                contenu: {
                    titre: `New Commission #${payment.transactionId}`,
                    message: `Commission received: ${commission.toFixed(2)}$`,
                    metadata: {
                        seller: Seller.shopName,
                        orderTotal: order.totalPrice.toFixed(2),
                        commissionRate: "20%"
                    }
                },
                channel: ['EMAIL', 'IN_APP']
            }, { session })
        ]);

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            balances: {
                seller: updatedSeller.balance,
                admin: updatedAdmin.platformBalance
            }
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Payment Error:', error);
        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'development' ?
                error.message : "system Erreur"
        });
    } finally {
        await session.endSession();
    }
}


const requestReturn = async(req, res) => {
    try {
        const { orderId, type, amount, reason } = req.body;

        const newReturn = new Return({
            order: orderId,
            customer: req.params.id,
            type,
            requestedAmount: type === "partial" ? amount : null,
            reason
        });

        await newReturn.save();

        res.status(201).json({ success: true, data: newReturn });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
}
const createReturn = async(req, res) => {
    const session = await mongoose.startSession();

    try {
        await session.startTransaction();

        const { orderId, type, reason, requestedAmount } = req.body;

        // 1. Validation initiale
        const order = await Order.findById(orderId)
            .populate({
                path: 'buyer',
                select: '_id email'
            })
            .populate({
                path: 'orderedProducts.seller',
                select: '_id balance'
            })
            .populate('paymentStatus')
            .session(session);



        // 2. Vérification du statut
        if (order.orderStatus !== "Shipped") {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Les retours ne sont possibles que pour les commandes livrées"
            });
        }

        // 3. Validation du montant pour les remboursements
        if (type !== "exchange" && requestedAmount > order.paymentStatus.amount) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Le montant demandé dépasse le montant initial"
            });
        }

        // 4. Création de la demande
        const returnRequest = await ReturnRequest.create([{
            order: orderId,
            customer: order.buyer._id,
            type,
            reason,
            requestedAmount: type !== "exchange" ? requestedAmount : 0,
            paymentReference: order.paymentStatus._id
        }], { session });

        // 5. Notification au vendeur
        await NotificationService.create({
            recipent: order.orderedProducts[0].seller._id,
            recipentmodel: "Seller",
            type: "RETURN_REQUEST",
            contenu: {
                titre: "Nouvelle demande de retour",
                message: `Type: ${type} | Raison: ${reason}`,
                metadata: {
                    returnId: returnRequest[0]._id,
                    orderId,
                    customer: order.buyer.email,
                    amount: type !== "exchange" ? requestedAmount : "Échange"
                }
            },
            channel: ["EMAIL", "IN_APP"]
        }, { session });

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            data: returnRequest[0]
        });

    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({
            success: false,
            message: error.message
        });
    } finally {
        await session.endSession();
    }
};

const processReturn = async(req, res) => {
    const session = await mongoose.startSession();

    try {
        await session.startTransaction();

        const { returnId, action } = req.body;

        // Fetch return request without populating customer (to preserve its ObjectId)
        const returnRequest = await ReturnRequest.findById(returnId)
            .populate({
                path: "order",
                populate: {
                    path: "orderedProducts.seller",
                    select: "_id balance"
                }
            })
            .session(session);

        // Validate return request and ensure required customer field exists
        if (!returnRequest || returnRequest.status !== "pending") {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Invalid return request or already processed"
            });
        }

        if (!returnRequest.customer) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Return request is missing customer information."
            });
        }

        // Extract seller from the populated order (assuming a single seller per order)
        const seller = returnRequest.order.orderedProducts[0].seller;
        if (!seller) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Seller not found"
            });
        }

        if (action === "approve") {
            if (seller.balance < returnRequest.requestedAmount) {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: `Insufficient balance (${seller.balance}€ < ${returnRequest.requestedAmount}€)`
                });
            }

            // Deduct refund amount from seller's balance
            seller.balance -= returnRequest.requestedAmount;
            await seller.save({ session });

            // Update return request status to approved
            returnRequest.status = "approved";
            await returnRequest.save({ session });

            // Notify customer about approval
            await NotificationService.create({
                recipent: returnRequest.customer, // remains an ObjectId from the original document
                recipentmodel: "Customer",
                type: "RETURN_APPROVED",
                contenu: {
                    titre: "Return Approved",
                    message: `Refunded amount: ${returnRequest.requestedAmount}€`,
                    metadata: {
                        returnId,
                        amount: returnRequest.requestedAmount,
                        transactionDate: new Date()
                    }
                },
                channel: ["EMAIL", "IN_APP"]
            }, { session });

        } else if (action === "reject") {
            // Update return request status to rejected
            returnRequest.status = "rejected";
            await returnRequest.save({ session });


            await NotificationService.create({
                recipent: returnRequest.customer,
                recipentmodel: "Customer",
                type: "RETURN_REJECTED",
                contenu: {
                    titre: "Return Rejected",
                    message: "Contact admin for further inquiries",
                    metadata: {
                        returnId,
                        adminContact: process.env.ADMIN_EMAIL
                    }
                },
                channel: ["EMAIL", "IN_APP"]
            }, { session });
        }

        await session.commitTransaction();
        res.json({ success: true, data: returnRequest });

    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({
            success: false,
            message: error.message
        });
    } finally {
        await session.endSession();
    }
};

const getcustomerNotification = async(req, res) => {
    try {
        const notifications = await Notification.find({
                recipentmodel: 'Customer',
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

const getcustomerReturnRequests = async(req, res) => {
    try {

        const { customerId } = req.query;
        let pipeline = [];
        pipeline.push({
            $match: { customer: new mongoose.Types.ObjectId(customerId) }
        });


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
};
const createReview = async(req, res) => {
    const session = await mongoose.startSession();

    try {
        await session.startTransaction();


        const { orderId, productId, rating, comment } = req.body;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "ID invalid"
            });
        }

        const order = await Order.findById(orderId)
            .populate({
                path: 'buyer',
                select: '_id name',
                options: { lean: true }
            })
            .populate({
                path: 'orderedProducts.product',
                select: 'productName seller',
                model: Product
            })
            .session(session);


        if (!order || order.orderStatus !== "Delivered") {
            await session.abortTransaction();
            return res.status(403).json({
                success: false,
                message: "  This order not delivered "
            });
        }

        const orderedProduct = order.orderedProducts.find(p =>
            p.product._id.toString() === productId
        );

        if (!orderedProduct) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "This Product not exist"
            });
        }

        // 5. Vérification d'avis existant
        const existingReview = await Review.findOne({
            orderReference: orderId,
            product: productId,
            reviewer: req.user._id
        }).session(session);

        if (existingReview) {
            await session.abortTransaction();
            return res.status(409).json({
                success: false,
                message: "This order already reviewed"
            });
        }

        // 6. Création de l'avis
        const newReview = await Review.create([{
            rating,
            comment,
            product: productId,
            seller: orderedProduct.product.seller,
            reviewer: order.buyer._id,
            orderReference: orderId,
            verifiedPurchase: true,
            subject: productId,
            subjectType: 'Product'
        }], { session });

        // 7. Mise à jour des statistiques du produit
        const updatedProduct = await Product.findByIdAndUpdate(
            productId, {
                $push: { reviews: newReview[0]._id },
                $inc: { totalRatings: rating, ratingCount: 1 }
            }, { new: true, session }
        );

        // 8. Notification au vendeur
        await NotificationService.create({
            recipent: orderedProduct.product.seller,
            recipentmodel: 'Seller',
            type: 'NEW_REVIEW',
            contenu: {
                titre: "New review",
                message: `${order.buyer.name} reviewed the  "${orderedProduct.product.productName}"`,
                metadata: {
                    customerName: order.buyer.name,
                    productName: orderedProduct.product.productName,
                    rating: rating,
                    comment: comment,
                    productId: productId,
                    orderId: orderId,
                    reviewId: newReview[0]._id
                }
            },
            channel: ['IN_APP', 'EMAIL']
        }, { session });

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            data: {
                review: newReview[0],
                averageRating: updatedProduct.totalRatings / updatedProduct.ratingCount
            }
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Review Error:', error);
        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'development' ?
                error.message : "Erreur lors de la création de l'avis"
        });
    } finally {
        await session.endSession();
    }
};
module.exports = {
    customerRegister,
    customerLogIn,
    getCartDetail,
    cartUpdate,
    requestReturn,
    createPayment,
    createReturn,
    processReturn,
    getcustomerNotification,
    getcustomerReturnRequests,
    createReview
};