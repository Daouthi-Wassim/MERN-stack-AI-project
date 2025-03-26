const jwt = require('jsonwebtoken');

const createNewToken = (user) => {
    try {
        // Verify JWT_SECRET exists
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is missing in environment variables');
        }

        // Create a clean payload object
        const payload = {
            id: user._id ? user._id.toString() : "errreur", // Fixed syntax error in optional chaining
            email: user.email,
            role: user.role
        };

        // Generate token with explicit options
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '7d',
            algorithm: 'HS256'
        });

        return token;
    } catch (error) {
        console.error('Token generation error:', error.message);
        throw error;
    }
};

module.exports = { createNewToken };