const axios = require('axios');
const colors = require('colors');

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

async function testCustomerController() {
    try {
        console.log('\nTesting Customer Controller...'.cyan);

        // 1. Test Admin Login via Customer Route
        console.log('\nTesting Admin Login via Customer Route:'.yellow);
        const adminLoginData = {
            email: 'hadil@gmail.com',
            password: 'admin'
        };

        // Using the correct route path for customer login
        const adminResponse = await api.post('/CustomerLogin', adminLoginData);
        console.log('✓ Admin Login Successful!'.green);
        console.log('Response:', JSON.stringify(adminResponse.data, null, 2));

        // 2. Test Customer Registration
        console.log('\nTesting Customer Registration:'.yellow);
        const customerData = {
            name: 'Test Customer',
            email: `customer${Date.now()}@test.com`,
            password: 'password123'
        };

        // Using the correct route path for customer registration
        const registerResponse = await api.post('/CustomerRegister', customerData);
        console.log('✓ Customer Registration Successful!'.green);
        console.log('Response:', JSON.stringify(registerResponse.data, null, 2));

        // 3. Test Customer Login
        console.log('\nTesting Customer Login:'.yellow);
        const customerLoginData = {
            email: customerData.email,
            password: customerData.password
        };

        const loginResponse = await api.post('/CustomerLogin', customerLoginData);
        console.log('✓ Customer Login Successful!'.green);
        console.log('Response:', JSON.stringify(loginResponse.data, null, 2));

        // Store customer ID and token for cart operations
        const customerId = loginResponse.data._id;
        const customerToken = loginResponse.data.token;
        api.defaults.headers.common['Authorization'] = `Bearer ${customerToken}`;

        // 4. Test Cart Operations
        console.log('\nTesting Cart Operations:'.yellow);
        const cartData = {
            cartDetails: [{
                productId: '123',
                quantity: 2,
                price: 99.99
            }]
        };


        // Using the correct route paths for cart operations based on your API
        const cartUpdateResponse = await api.put(`/CustomerUpdate/${customerId}`, cartData);
        console.log('✓ Cart Update Successful!'.green);
        console.log('Response:', JSON.stringify(cartUpdateResponse.data, null, 2));

        const cartDetailsResponse = await api.get(`/getCartDetail/${customerId}`);
        console.log('✓ Cart Details Retrieved!'.green);
        console.log('Response:', JSON.stringify(cartDetailsResponse.data, null, 2));

    } catch (error) {
        console.log('\n✗ Test failed!'.red);
        if (error.response) {
            console.error('Server error:'.yellow);
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data.message || error.response.data);
            console.error('\nTroubleshooting steps:'.cyan);
            console.error('1. Check if routes are correctly defined in route.js:'.cyan);
            console.error('   - GET /api/getCartDetail/:id'.cyan);
            console.error('   - PUT /api/cartUpdate/:id'.cyan);
            console.error('2. Verify token is being sent in headers'.cyan);
            console.error('3. Check if customerId is valid'.cyan);
            console.error('\nCustomer ID being used:', customerId.cyan);
            console.error('Token being used:', api.defaults.headers.common['Authorization'].substring(0, 20) + '...'.cyan);
        } else if (error.request) {
            console.error('No response from server. Is it running?'.yellow);
        } else {
            console.error('Request error:'.yellow, error.message);
        }
    }
}
// Run tests
console.log('Starting Customer Controller Tests...'.cyan);
testCustomerController();