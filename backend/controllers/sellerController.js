const bcrypt = require('bcrypt');
const Seller = require('../models/sellerSchema.js');
const Admin = require('../models/adminSchema.js');
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

module.exports = { sellerRegister, sellerLogIn };