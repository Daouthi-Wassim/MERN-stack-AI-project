const router = require('express').Router();
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    sendAnnouncement
} = require('../controllers/notificationController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Routes utilisateur
router.get('/', authMiddleware, getNotifications);
router.patch('/:id/read', authMiddleware, markAsRead);
router.patch('/mark-read/all', authMiddleware, markAllAsRead);

// Route admin
router.post('/announce',
    authMiddleware,

    sendAnnouncement
);

module.exports = router;