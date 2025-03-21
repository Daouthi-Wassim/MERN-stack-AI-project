const mongoose = require('mongoose');
const Admin = require('./models/adminSchema');
const colors = require('colors');
require('dotenv').config();

async function createAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✓ Connected to MongoDB'.green);

        // Create new admin
        const newAdmin = new Admin({
            name: 'Admin',
            email: 'root',
            password: 'root',
            role: 'Admin'
        });

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: newAdmin.email });
        if (existingAdmin) {
            console.log('\nℹ Admin already exists:'.cyan);
            console.log({
                id: existingAdmin._id,
                email: existingAdmin.email,
                role: existingAdmin.role
            });
            return;
        }

        // Save new admin
        await newAdmin.save();
        console.log('\n✓ Admin created successfully:'.green);
        console.log({
            id: newAdmin._id,
            email: newAdmin.email,
            role: newAdmin.role
        });

    } catch (error) {
        console.error('\n✗ Error creating admin:'.red, error.message);
        if (error.code === 11000) {
            console.error('Admin with this email already exists'.yellow);
        }
    } finally {
        await mongoose.connection.close();
        console.log('\nℹ MongoDB connection closed'.gray);
    }
}

// First install required packages if not present
if (!require.resolve('colors')) {
    console.log('Installing required packages...');
    require('child_process').execSync('npm install mongoose colors dotenv bcryptjs');
}

console.log('Starting Admin Creation...'.cyan);
createAdmin();