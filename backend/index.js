const express = require('express');
const mongoose = require('mongoose');
mongoose.set('strictPopulate', false);
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Add this before routes
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});
// Routes
app.use('/api', require('./routes/route'));

// MongoDB connection
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});




const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/stripe-webhook',
    express.raw({ type: 'application/json' }),
    async(req, res) => {
        const sig = req.headers['stripe-signature'];
        let event;
        const rawBody = req.body.toString();

        try {
            event = stripe.webhooks.constructEvent(
                rawBody,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.error(` Webhook signature verification failed: ${err.message}`);
            return res.status(400).json({
                success: false,
                error: `Webhook Error: ${err.message}`
            });
        }

        try {
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await handleSuccessfulPayment(event.data.object);
                    break;

                case 'payment_intent.payment_failed':
                    await handleFailedPayment(event.data.object);
                    break;

                case 'charge.refunded':
                    await handleRefund(event.data.object);
                    break;

                default:
                    console.log(` Unhandled event type: ${event.type}`);
            }

            res.json({ received: true });
        } catch (error) {
            console.error(` Webhook processing failed: ${error.message}`);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
);

// Gestion des paiements réussis
async function handleSuccessfulPayment(paymentIntent) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Trouver le paiement dans la base de données
        const payment = await Payment.findOne({ transactionId: paymentIntent.id })
            .populate('seller')
            .session(session);

        if (!payment) throw new Error('Payment not found');
        if (payment.status === 'Completed') return;

        // 2. Valider les montants
        const expectedAmount = payment.breakdown.total * 100;
        if (paymentIntent.amount !== expectedAmount) {
            throw new Error(`Amount mismatch: ${paymentIntent.amount} vs ${expectedAmount}`);
        }

        // 3. Effectuer les transferts
        const [adminTransfer, sellerTransfer] = await Promise.all([
            stripe.transfers.create({
                amount: Math.round(payment.breakdown.adminFee * 100),
                currency: 'eur',
                destination: process.env.ADMIN_STRIPE_ACCOUNT,
                metadata: { paymentId: payment._id }
            }),
            stripe.transfers.create({
                amount: Math.round(payment.netAmount * 100),
                currency: 'eur',
                destination: payment.seller.stripeAccountId,
                metadata: { paymentId: payment._id }
            })
        ]);

        // 4. Mettre à jour la base de données
        await Payment.findByIdAndUpdate(
            payment._id, {
                status: 'Completed',
                transfers: {
                    admin: adminTransfer.id,
                    seller: sellerTransfer.id
                },
                transferredAt: new Date()
            }, { session }
        );

        await session.commitTransaction();
        console.log(` Payment ${paymentIntent.id} processed successfully`);

    } catch (error) {
        await session.abortTransaction();
        console.error(` Transaction failed: ${error.message}`);
        throw error;
    } finally {
        session.endSession();
    }
}

// Gestion des échecs de paiement
async function handleFailedPayment(paymentIntent) {
    await Payment.findOneAndUpdate({ transactionId: paymentIntent.id }, {
        status: 'Failed',
        error: paymentIntent.last_payment_error ? paymentIntent.last_payment_error.message : 'Unknown error'
    });
    console.log(`Payment failed: ${paymentIntent.id}`);
}

// Gestion des remboursements
async function handleRefund(charge) {
    const refund = charge.refunds.data[0];

    await Payment.findOneAndUpdate({ transactionId: charge.payment_intent }, {
        $push: {
            refunds: {
                id: refund.id,
                amount: refund.amount / 100,
                reason: refund.reason
            }
        }
    });
    console.log(` Refund processed: ${refund.id}`);
}