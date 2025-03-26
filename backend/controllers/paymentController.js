const mongoose = require("mongoose");
const Payment = require("../models/paymentSchema");
const Order = require("../models/orderSchema");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const paymentController = {
    createPayment: async(req, res) => {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { orderId } = req.body;

            // Validation
            if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
                return res.status(400).json({ message: "ID de commande invalide" });
            }

            // Récupération de la commande
            const order = await Order.findById(orderId)
                .populate("orderedProducts.product")
                .populate("seller", "stripeAccountId")
                .session(session);

            if (!order) {
                return res.status(404).json({ message: "Commande introuvable" });
            }

            // Calculs financiers
            const TAX_RATE = 0.20;
            const ADMIN_FEE_PERCENT = 0.10;

            const subtotal = Order.orderedProducts.reduce(
                (sum, item) => sum + item.product.price * item.quantity, 0
            );

            const tax = subtotal * TAX_RATE;
            const adminFee = (subtotal + tax) * ADMIN_FEE_PERCENT;
            const total = subtotal + tax + adminFee;
            const netAmount = subtotal + tax - adminFee;

            // Vérification cohérence montant
            if (total !== order.totalPrice) {
                throw new Error("Incohérence de montant avec la commande");
            }

            // Création du paiement Stripe
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(total * 100),
                currency: "usd",
                payment_method_types: ["card"],
                metadata: {
                    orderId: order._id.toString(),
                    adminFee: adminFee.toFixed(2),
                    userId: req.user.id.toString()
                }
            });

            // Création de l'enregistrement
            const payment = await Payment.create([{
                order: orderId,
                customer: req.user.id,
                seller: order.seller._id,
                amount: total,
                breakdown: { subtotal, tax, adminFee, total },
                netAmount,
                paymentMethod: "Stripe",
                transactionId: paymentIntent.id,
                status: "pending"
            }], { session });

            // Mise à jour commande
            await Order.findByIdAndUpdate(
                orderId, {
                    paymentStatus: payment[0]._id,
                    totalPrice: total,
                    $push: { transactions: payment[0]._id }
                }, { session }
            );

            await session.commitTransaction();

            res.status(201).json({
                clientSecret: paymentIntent.client_secret,
                paymentDetails: {
                    subtotal: subtotal.toFixed(2),
                    tax: tax.toFixed(2),
                    adminFee: adminFee.toFixed(2),
                    total: total.toFixed(2),
                    netAmount: netAmount.toFixed(2)
                }
            });

        } catch (error) {
            await session.abortTransaction();
            console.error("Erreur de paiement:", error.message);
            res.status(500).json({
                message: "Échec du traitement du paiement",
                error: process.env.NODE_ENV === "development" ? error.message : null
            });
        } finally {
            session.endSession();
        }
    },

    handleWebhook: async(req, res) => {
        const sig = req.headers["stripe-signature"];

        try {
            const event = stripe.webhooks.constructEvent(
                req.rawBody,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );

            switch (event.type) {
                case "payment_intent.succeeded":
                    const paymentIntent = event.data.object;

                    const payment = await Payment.findOneAndUpdate({ transactionId: paymentIntent.id }, { status: "succeeded" }, { new: true }).populate("seller");

                    // Transférer les fonds
                    await Promise.all([
                        stripe.transfers.create({
                            amount: Math.round(payment.breakdown.adminFee * 100),
                            currency: "usd",
                            destination: process.env.ADMIN_STRIPE_ACCOUNT
                        }),
                        stripe.transfers.create({
                            amount: Math.round(payment.netAmount * 100),
                            currency: "usd",
                            destination: payment.seller.stripeAccountId
                        })
                    ]);
                    break;

                case "payment_intent.payment_failed":
                    await Payment.findOneAndUpdate({ transactionId: event.data.object.id }, { status: "failed" });
                    break;
            }

            res.json({ received: true });

        } catch (error) {
            console.error("Erreur webhook:", error);
            res.status(500).json({ error: "Échec du traitement" });
        }
    },

    getAllPayments: async(req, res) => {
        try {
            const payments = await Payment.find()
                .populate("customer", "name email")
                .populate("order", "totalPrice")
                .populate("seller", "shopName");

            res.json({
                success: true,
                data: payments.map(p => ({
                    id: p._id,
                    amount: p.amount,
                    status: p.status,
                    date: p.createdAt,
                    seller: p.seller ? p.seller.shopName : "no shop"
                }))
            });
        } catch (error) {
            res.status(500).json({ success: false, message: "Erreur de récupération" });
        }
    }
};

module.exports = paymentController;