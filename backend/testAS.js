const axios = require('axios');
const colors = require('colors');

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

async function testSellerAuth() {
    try {
        console.log('\nTesting Seller Authentication...'.cyan);

        // 1. Test Admin Login via Seller Route
        console.log('\nTesting Admin Login via Seller Route:'.yellow);
        const adminLoginData = {
            email: 'hadil@gmail.com',
            password: 'admin'
        };

        const adminResponse = await api.post('/SellerLogin', adminLoginData);
        console.log('✓ Admin Login via Seller Route Successful!'.green);
        console.log('Response:', JSON.stringify(adminResponse.data, null, 2));

        // 2. Test Seller Registration
        console.log('\nTesting Seller Registration:'.yellow);
        const sellerData = {
            name: 'Test Seller',
            email: `seller${Date.now()}@test.com`,
            password: 'password123',
            shopName: `TestShop${Date.now()}`
        };

        const registerResponse = await api.post('/SellerRegister', sellerData);
        console.log('✓ Seller Registration Successful!'.green);
        console.log('Response:', JSON.stringify(registerResponse.data, null, 2));

        // 3. Test Seller Login
        console.log('\nTesting Seller Login:'.yellow);
        const sellerLoginData = {
            email: sellerData.email,
            password: sellerData.password
        };

        const loginResponse = await api.post('/SellerLogin', sellerLoginData);
        console.log('✓ Seller Login Successful!'.green);
        console.log('Response:', JSON.stringify(loginResponse.data, null, 2));

        // 4. Test Invalid Login Attempts
        console.log('\nTesting Invalid Login Attempts:'.yellow);

        // Wrong password
        try {
            await api.post('/SellerLogin', {
                email: sellerData.email,
                password: 'wrongpassword'
            });
        } catch (error) {
            console.log('✓ Wrong password rejected correctly!'.green);
            console.log('Error:', error.response.data.message);
        }

        // Non-existent user
        try {
            await api.post('/SellerLogin', {
                email: 'nonexistent@test.com',
                password: 'password123'
            });
        } catch (error) {
            console.log('✓ Non-existent user rejected correctly!'.green);
            console.log('Error:', error.response.data.message);
        }

    } catch (error) {
        console.log('\n✗ Test failed!'.red);
        if (error.response) {
            console.error('Server error:'.yellow);
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data.message || error.response.data);
            console.error('\nTroubleshooting steps:'.cyan);
            console.error('1. Check if server is running'.cyan);
            console.error('2. Verify routes in route.js:'.cyan);
            console.error('   - POST /api/SellerRegister'.cyan);
            console.error('   - POST /api/SellerLogin'.cyan);
            console.error('3. Check MongoDB connection'.cyan);
        } else if (error.request) {
            console.error('No response from server. Is it running?'.yellow);
        } else {
            console.error('Request error:'.yellow, error.message);
        }
    }
}

// Run tests
console.log('Starting Seller Authentication Tests...'.cyan);
testSellerAuth();