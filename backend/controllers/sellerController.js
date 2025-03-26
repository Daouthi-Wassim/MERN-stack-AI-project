const bcrypt = require('bcrypt');
const Seller = require('../models/sellerSchema.js');
const Admin = require('../models/adminSchema.js');
const Return = require("../models/returnSchema");
const Notification = require("../models/notificationSchema");
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
const handleReturn = async(req, res) => {
    try {
        const { returnId, action } = req.body;

        const returnRequest = await Return.findById(returnId)
            // .populate("customer");

        if (action === "approve") {
            returnRequest.status = "approved";

            // Notifier le client
            await Notification.create({
                // recipient: returnRequest.customer._id,
                // recipientModel: "Customer",
                type: "return_update",
                content: {
                    title: "Retour approuvé",
                    message: `Votre retour a été approuvé. Montant: ${returnRequest.requestedAmount || "Full"} TND`
                }
            });
        } else {
            returnRequest.status = "rejected";
        }

        await returnRequest.save();

        res.json({ success: true, data: returnRequest });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
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

const processReturn = async(req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { returnId, action } = req.body;
        const returnRequest = await ReturnRequest.findById(returnId)
            .populate("order")
            .session(session);

        // Validation
        if (!returnRequest || returnRequest.order.seller.toString() !== req.user.id) {
            await session.abortTransaction();
            return res.status(403).json({
                success: false,
                message: "Action non autorisée"
            });
        }

        // Traitement
        if (action === "approve") {
            const seller = await Seller.findById(req.user.id).session(session);

            if (seller.balance < returnRequest.requestedAmount) {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: "Solde insuffisant"
                });
            }

            seller.balance -= returnRequest.requestedAmount;
            await seller.save({ session });

            returnRequest.status = "approved";
            await returnRequest.save({ session });

            // Notification client
            await NotificationService.create({
                destinataire: returnRequest.customer,
                modeleDestinataire: "Customer",
                type: "RETURN_APPROVED",
                contenu: {
                    titre: "Retour approuvé",
                    message: `Montant remboursé : ${returnRequest.requestedAmount}€`
                },
                channel: ["EMAIL", "IN_APP"]
            }, { session });

        } else {
            returnRequest.status = "rejected";
            await returnRequest.save({ session });

            // Notification client
            await NotificationService.create({
                destinataire: returnRequest.customer,
                modeleDestinataire: "Customer",
                type: "RETURN_REJECTED",
                contenu: {
                    titre: "Retour refusé",
                    message: "Contactez l'admin pour réclamation"
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
        session.endSession();
    }
};
module.exports = {
    sellerRegister,
    sellerLogIn,
    handleReturn,
    getPayments,
    processReturn
};