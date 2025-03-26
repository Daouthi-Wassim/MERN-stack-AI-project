const Notification = require("../models/notificationSchema.js");


const notificationController = {
    getNotifications: async(req, res) => {
        try {
            const { page = 1, limit = 10 } = req.query;
            const notifications = await Notification.find({
                    destinataire: req.user.id,
                })
                .sort("-createdAt")
                .skip((page - 1) * limit)
                .limit(parseInt(limit));

            const count = await Notification.countDocuments({
                destinataire: req.user.id,
            });

            res.json({
                success: true,
                data: notifications,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: count,
                    pages: Math.ceil(count / limit),
                },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Erreur serveur",
                error: process.env.NODE_ENV === "development" ? error.message : null,
            });
        }
    },

    markAsRead: async(req, res) => {
        try {
            const notification = await Notification.findOneAndUpdate({ _id: req.params.id, destinataire: req.user.id }, { lue: true }, { new: true });

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: "Notification non trouvée",
                });
            }

            res.json({ success: true, data: notification });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Erreur serveur",
                error: process.env.NODE_ENV === "development" ? error.message : null,
            });
        }
    }
};

module.exports = notificationController;