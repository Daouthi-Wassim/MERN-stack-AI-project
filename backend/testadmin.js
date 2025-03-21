const axios = require('axios');
const colors = require('colors');
require('dotenv').config();

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

async function testAdminFunctions() {
    try {
        // 1. Login Test
        console.log('\nTesting Admin Login...'.cyan);
        const loginData = {
            email: 'hadil@gmail.com',
            password: 'admin'
        };

        const loginResponse = await api.post('/AdminLogin', loginData);
        console.log('\n✓ Login successful!'.green);

        // Set token for subsequent requests
        const token = loginResponse.data.token;
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // 2. Test Protected Routes
        const routes = [{
                name: 'Dashboard Stats',
                method: 'get',
                path: '/admin/dashboard-stats',
            },
            {
                name: 'All Users',
                method: 'get',
                path: '/admin/users',
            },
            {
                name: 'All Orders',
                method: 'get',
                path: '/admin/orders',
            },
            {
                name: 'Delete User',
                method: 'delete',
                path: '/admin/users/Customer/someUserId', // Replace with actual user ID
                skip: true // Skip this test for now
            }
        ];

        console.log('\nTesting Protected Routes:'.yellow);
        for (const route of routes) {
            if (route.skip) continue;

            try {
                console.log(`\nTesting ${route.name}...`.cyan);
                const response = await api[route.method](route.path);
                console.log(`✓ ${route.name} successful!`.green);
                console.log('Response:', JSON.stringify(response.data, null, 2));
            } catch (error) {
                console.log(`✗ ${route.name} failed!`.red);
                // Improved error logging
                if (error.response) {
                    console.error('Response Status:', error.response.status);
                    console.error('Response Message:', error.response.data.message);
                    console.error('Full Response:', JSON.stringify(error.response.data, null, 2));
                } else if (error.request) {
                    console.error('No response received from server:', error.request);
                } else {
                    console.error('Request error:', error.message);
                }
            }
        }

    } catch (error) {
        console.log('\n✗ Test failed!'.red);
        if (error.response) {
            console.error('Server error:'.yellow);
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data.message);

            if (error.response.status === 500) {
                console.error('\nTroubleshooting steps:'.cyan);
                console.error('1. Check JWT_SECRET in .env file');
                console.error('2. Verify MongoDB connection');
                console.error('3. Check admin user exists in database');
            }
        } else if (error.request) {
            console.error('No response from server. Is it running?'.yellow);
        } else {
            console.error('Request error:'.yellow, error.message);
        }
        process.exit(1);
    }
}

// Run all tests
console.log('Starting Admin API Tests...'.cyan);
testAdminFunctions();