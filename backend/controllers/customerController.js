const bcrypt = require('bcrypt');
const Customer = require('../models/customerSchema.js');
const Admin = require('../models/adminSchema.js');
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

        let customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true })

        return res.send(customer.cartDetails);

    } catch (err) {
        res.status(500).json(err);
    }
}

module.exports = {
    customerRegister,
    customerLogIn,
    getCartDetail,
    cartUpdate,
};