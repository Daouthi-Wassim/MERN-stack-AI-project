const mongoose = require("mongoose");
const notificationSchema = new mongoose.Schema({
    recipent: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'recipentmodel'
    },
    recipentmodel: {
        type: String,
        required: true,
        enum: ['Customer', 'Seller', 'Admin']
    },
    type: {
        type: String,
        enum: ['PROMOTION', 'PAIEMENT_REUSSI', 'CREDIT_SOLDE', 'NOUVELLE_COMMANDE', 'COMMISSION', 'RETURN_REQUEST', 'RETURN_APPROVED', 'RETURN_REJECTED', 'ORDER_CANCELLED', 'ORDER_DELIVERED', 'NEW_REVIEW'],
        required: true
    },
    contenu: {
        titre: String,
        message: String,
        metadata: mongoose.Schema.Types.Mixed
    },
    channel: {
        type: [String],
        enum: ['EMAIL', 'IN_APP'],
        default: ['IN_APP']
    },
    status: {
        type: String,
        enum: ['Failed', 'Sended', 'loading'],
        default: 'loading'
    },
    lue: {
        type: Boolean,
        default: false
    },
    isSystemGenerated: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });
module.exports = mongoose.model("notifications", notificationSchema);