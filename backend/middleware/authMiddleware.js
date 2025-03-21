const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'No token provided or invalid format'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if decoded token has required fields
        if (!decoded.id || !decoded.role) {
            return res.status(401).json({
                message: 'Invalid token structure'
            });
        }

        // Verify admin role
        /* if (decoded.role !== 'Admin') {
            return res.status(403).json({
                message: 'Access denied. Admin only.'
            });
        }*/

        req.user = decoded;
        next();
    } catch (error) {
        console.error('Auth error:', error.message);
        res.status(401).json({
            message: 'Invalid token',
            error: error.message
        });
    }
};
const isSeller = (req, res, next) => {
    if (req.user.role === 'Seller') return next();
    res.status(403).json({ success: false, message: "Accès vendeur requis" });
};

const isAdmin = (req, res, next) => {
    if (req.user.role === 'Admin') return next();
    res.status(403).json({ success: false, message: "Accès admin requis" });
};
module.exports = {
    authMiddleware,
    isAdmin,
    isSeller
};