import axios from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';

import {


    authRequest,
    authSuccess,
    authFailed,
    authError,
    stuffAdded,
    getDeleteSuccess,
    getRequest,
    getFailed,
    getError,
    productSuccess,
    productDetailsSuccess,
    getProductDetailsFailed,
    getProductsFailed,
    setFilteredProducts,
    getSearchFailed,
    sellerProductSuccess,
    getSellerProductsFailed,
    stuffUpdated,
    updateFailed,
    getCustomersListFailed,
    customersListSuccess,


    updateCurrentUser,
} from './userSlice';

const REACT_APP_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
    baseURL: REACT_APP_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const addStuff = (address, fields) => async(dispatch) => {
    dispatch(authRequest());

    try {
        const result = await axios.post(`${REACT_APP_BASE_URL}/${address}`, fields, {
            headers: { 'Content-Type': 'application/json' },
        });

        if (result.data.message) {
            dispatch(authFailed(result.data.message));
        } else {
            dispatch(stuffAdded());
        }
    } catch (error) {
        dispatch(authError(error));
    }
};

export const updateStuff = (fields, id, address) => async(dispatch) => {

    try {
        const result = await axios.put(`${REACT_APP_BASE_URL}/${address}/${id}`, fields, {
            headers: { 'Content-Type': 'application/json' },
        });
        if (result.data.message) {
            dispatch(updateFailed(result.data.message));
        } else {
            dispatch(stuffUpdated());
        }

    } catch (error) {
        dispatch(getError(error));
    }
}

export const deleteStuff = (id, address) => async(dispatch) => {
    dispatch(getRequest());

    try {
        const result = await axios.delete(`${REACT_APP_BASE_URL}/${address}/${id}`);
        if (result.data.message) {
            dispatch(getFailed(result.data.message));
        } else {
            dispatch(getDeleteSuccess());
        }
    } catch (error) {
        dispatch(getError(error));
    }
}

export const updateCustomer = (fields, id) => async(dispatch) => {
    dispatch(updateCurrentUser(fields));

    const newFields = {...fields };
    delete newFields.token;

    try {
        await axios.put(`${REACT_APP_BASE_URL}/CustomerUpdate/${id}`, newFields, {
            headers: { 'Content-Type': 'application/json' },
        });

        dispatch(stuffUpdated());

    } catch (error) {
        dispatch(getError(error));
    }
}

export const getProductsbySeller = (id) => async(dispatch) => {
    dispatch(getRequest());

    try {
        const result = await axios.get(`${REACT_APP_BASE_URL}/getSellerProducts/${id}`);
        if (result.data.message) {
            dispatch(getSellerProductsFailed(result.data.message));
        } else {
            dispatch(sellerProductSuccess(result.data));
        }
    } catch (error) {
        dispatch(getError(error));
    }
}

export const getProducts = () => async(dispatch) => {
        dispatch(getRequest());

        try {
            const result = await api.get('/getProducts');

            if (!result.data) {
                throw new Error('No data received from server');
            }
            if (result.data.message) {
                dispatch(getProductsFailed(result.data.message));
                return null;
            }

            dispatch(productSuccess(result.data));
            return result.data;

        } catch (error) {
            const errorMessage = error.response ? {}.data ? {}.message : error.message : 'Failed to fetch products';
            dispatch(getError(errorMessage));
            console.error('Error fetching products:', errorMessage);
            return null;
        }
    }
    //  request interceptor for debugging
api.interceptors.request.use(request => {
    console.log('API Request:', {
        url: request.url,
        method: request.method,
        headers: request.headers
    });
    return request;
});

// Add response interceptor for debugging
api.interceptors.response.use(
    response => {
        console.log('API Response:', {
            status: response.status,
            data: response.data
        });
        return response;
    },
    error => {
        console.error('API Error:', {
            status: error.response ? error.response.status : 'No response',
            message: error.response && error.response.data ? error.response.data.message : error.message,
            url: error.config ? error.config.url : 'No URL'
        });
        return Promise.reject(error);
    }
);


// Update all other API calls to use the api instance
export const authUser = (fields, role, mode) => async(dispatch) => {
    dispatch(authRequest());
    try {
        const result = await api.post(`/${role}${mode}`, fields);

        if (result.data.role) {

            localStorage.setItem('token', result.data.token);

            dispatch(authSuccess(result.data));
            return result.data;
        }

        dispatch(authFailed(result.data.message));
        return null;
    } catch (error) {
        const errorMessage = error.response ? error.response.data ? error.response.message : 'Authentication failed' : 'Authentication failed';
        dispatch(authError(errorMessage));
        return null;
    }
};




export const getProductDetails = (id) => async(dispatch) => {
    dispatch(getRequest());

    try {
        const result = await axios.get(`${REACT_APP_BASE_URL}/getProductDetail/${id}`);
        if (result.data.message) {
            dispatch(getProductDetailsFailed(result.data.message));
        } else {
            dispatch(productDetailsSuccess(result.data));
        }

    } catch (error) {
        dispatch(getError(error));
    }
}

export const getCustomers = (id, address) => async(dispatch) => {
    dispatch(getRequest());

    try {
        const result = await axios.get(`${REACT_APP_BASE_URL}/${address}/${id}`);
        if (result.data.message) {
            dispatch(getCustomersListFailed(result.data.message));
        } else {
            dispatch(customersListSuccess(result.data));
        }

    } catch (error) {
        dispatch(getError(error));
    }
}



export const getSearchedProducts = (address, key) => async(dispatch) => {
        dispatch(getRequest());

        try {
            const result = await axios.get(`${REACT_APP_BASE_URL}/${address}/${key}`);
            if (result.data.message) {
                dispatch(getSearchFailed(result.data.message));
            } else {
                dispatch(setFilteredProducts(result.data));
            }

        } catch (error) {
            dispatch(getError(error));
        }
    }
    // userHandle.js





// Paiement Stripe
export const handleStripePayment = (paymentData) => async(dispatch) => {
    dispatch(authRequest());
    try {

        const token = localStorage.getItem('token');
        console.log("Données envoyées à l'API :", paymentData);
        const response = await api.post('/customer/createpayment', paymentData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.data.clientSecret) {
            dispatch({
                type: 'PAYMENT_INTENT_CREATED',
                payload: response.data
            });
            return response.data.clientSecret;
        }

    } catch (error) {
        dispatch(authError(error.response ? error.response.data.message : error.message));
        throw error;
    }
};

// Gestion des avis
export const submitProductReview = (reviewData) => async(dispatch) => {
    dispatch(authRequest());
    try {
        const response = await api.post('/createReview', reviewData);
        dispatch({
            type: 'REVIEW_SUBMITTED',
            payload: response.data
        });
        return response.data;
    } catch (error) {
        dispatch(authError(error.response ? error.response.data ? error.response.message : error.message : error.message));
        throw error;
    }
};

// Récupération des commandes client
export const fetchCustomerOrders = (customerId) => async(dispatch) => {
    dispatch(getRequest());
    try {
        const response = await api.get(`/getOrderedProductsByCustomer/${customerId}`);
        dispatch({
            type: 'ORDERS_LOADED',
            payload: response.data
        });
    } catch (error) {
        dispatch(getError(error.response ? error.response.data ? error.response.message : error.message : error.message));
        throw error;
    }
};

// Mise à jour du profil client
export const updateCustomerProfile = (userId, updateData) => async(dispatch) => {
    dispatch(authRequest());
    try {
        const response = await api.put(`/CustomerUpdate/${userId}`, updateData);
        dispatch(authSuccess(response.data));
        return response.data;
    } catch (error) {
        dispatch(authError(error.response ? error.response.data ? error.response.message : error.message : error.message));
        throw error;
    }
};

// Récupération des statistiques vendeur
export const fetchSellerStats = (sellerId) => async(dispatch) => {
    dispatch(getRequest());
    try {
        const response = await api.get(`/seller/payments`);
        dispatch({
            type: 'SELLER_STATS_LOADED',
            payload: response.data.data
        });
    } catch (error) {
        dispatch(getError(error.response ? error.response.data ? error.response.message : error.message : error.message));
    }
};



// Intégration des webhooks Stripe
export const handleStripeWebhook = (signature, payload) => async() => {
    try {
        const response = await api.post('/stripe-webhook', payload, {
            headers: {
                'stripe-signature': signature,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Webhook error:', error);
        throw error;
    }
};

// Synchronisation du panier
export const syncCartWithBackend = (cartData) => async(dispatch, getState) => {
    try {
        const { currentUser } = getState().user;
        const response = await api.put(`/CustomerUpdate/${currentUser._id}`, {
            cartDetails: cartData
        });
        dispatch(updateCurrentUser(response.data));
    } catch (error) {
        console.error('Cart sync failed:', error);
    }
};

// Récupération des demandes de retour client
export const fetchCustomerReturns = (customerId) => async(dispatch) => {
    dispatch(getRequest());
    try {
        const response = await api.get(`/getreturnscust?customerId=${customerId}`);
        dispatch({
            type: 'RETURNS_LOADED',
            payload: response.data.data
        });
    } catch (error) {
        dispatch(getError(error.response ? error.response.data ? error.response.message : error.message : error.message));
    }
};
export const createNewOrder = createAsyncThunk(
    'order/createNewOrder',
    async(orderData, { rejectWithValue }) => {
        try {
            console.log('Creating order with data:', orderData);
            const response = await api.post('/newOrder', orderData);

            if (!response.data) {
                throw new Error('No response from server');
            }

            console.log('Order creation response:', response.data);
            return response.data;

        } catch (error) {
            console.error('Order creation error:', error);
            return rejectWithValue(error.response ? error.response.data : {
                success: false,
                message: error.message
            });
        }
    }
);

export const getSpecificProducts = createAsyncThunk(
    'user/getSpecificProducts',
    async({ customerId }, { rejectWithValue }) => {
        try {
            const response = await api.get(`/getOrderedProductsByCustomer/${customerId}`);
            console.log('API Response:', response.data);

            if (!response.data.success) {
                throw new Error(response.data.message);
            }

            return response.data;
        } catch (error) {
            console.error('API Error:', error);
            return rejectWithValue(error.message);
        }
    }
);
// ADMIN ACTIONS
export const getAdminStats = async() => {
    try {
        const response = await api.get('/admin/dashboard-stats');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getAdminNotifications = async() => {
    try {
        const response = await api.get('/admin/getAdminnotif');
        return response.data;
    } catch (error) {
        throw error;
    }
};
export const getUsers = createAsyncThunk(
    'users/getUsers',
    async(role) => {
        try {
            const endpoint = {
                'admins': '/admin/getadmins',
                'sellers': '/admin/getsellers',
                'customers': '/admin/getcustomers'
            }[role];

            const response = await api.get(endpoint);
            console.log('API Response:', response.data);
            if (Array.isArray(response.data)) return response.data;
            if (response.data.users) return response.data.users;
            if (response.data.data) return response.data.data;
            return [];
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
);

// SELLER ACTIONS
export const getSellerStats = async(sellerId) => {
    try {
        const response = await api.get('/seller/payments');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getSellerNotifications = async() => {
    try {
        const response = await api.get('/sellernotif');
        return response.data;
    } catch (error) {
        throw error;
    }
};

// CUSTOMER ACTIONS
export const getCustomerNotifications = async() => {
    try {
        const response = await api.get('/getnotifcust');
        return response.data;
    } catch (error) {
        throw error;
    }
};

// ORDER ACTIONS
export const createOrder = async(orderData) => {
    try {
        const response = await api.post('/newOrder', orderData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateOrderStatus = async(orderId, status) => {
    try {
        const response = await api.put(`/seller/orders/${orderId}/status`, { status });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// PRODUCT ACTIONS
export const createProduct = async(productData) => {
    try {
        const response = await api.post('/ProductCreate', productData);
        return response.data;
    } catch (error) {
        throw error;
    }
};



// RETURN REQUEST ACTIONS
export const createReturnRequest = async(returnData) => {
    try {
        const response = await api.post('/createreturns', returnData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const processReturn = async(returnData) => {
    try {
        const response = await api.post('/procereturns', returnData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// REVIEW ACTIONS
export const createReview = async(reviewData) => {
    try {
        const response = await api.post('/createReview', reviewData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// PAYMENT ACTIONS
export const createPayment = async(paymentData) => {
    try {
        const response = await api.post('/customer/createpayment', paymentData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// USER MANAGEMENT ACTIONS
export const deleteUser = (role, id) => async(dispatch) => {
    try {
        await api.delete(`/admin/deleteUsers/${role}/${id}`);
        dispatch(getDeleteSuccess());
        dispatch(getUsers(role));
    } catch (error) {
        dispatch(getError(error.message));
    }
};

export const createUser = (role, userData) => async(dispatch) => {
    try {
        const endpoints = {
            customer: '/admin/createcustomer',
            seller: '/admin/createseller',
            admin: '/admin/createadmin'
        };

        await api.post(endpoints[role], userData);
        dispatch(stuffAdded());
    } catch (error) {
        dispatch(authError(error.message));
    }
};

// SEARCH ACTIONS
export const searchProducts = async(key) => {
    try {
        const response = await api.get(`/searchProduct/${key}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const searchByCategory = async(category) => {
    try {
        const response = await api.get(`/searchProductbyCategory/${category}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Add these functions to your existing userHandle.js

// Admin Detail View Actions
export const getCustomerDetails = async(id) => {
    try {
        const response = await api.get(`/admin/getallcusdetails/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getSellerReviews = async(id) => {
    try {
        const response = await api.get(`/admin/getsellersrev`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getSellerProducts = async(id) => {
    try {
        const response = await api.get(`/getSellerProducts/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getOrderedProductsBySeller = async(id) => {
    try {
        const response = await api.get(`/getOrderedProductsBySeller/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getOrderedProductsByCustomer = async(id) => {
    try {
        const response = await api.get(`/getOrderedProductsByCustomer/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getCartDetail = async(id) => {
    try {
        const response = await api.get(`/getCartDetail/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getCustomerReturnRequests = async() => {
    try {
        const response = await api.get('/getreturnscust');
        return response.data;
    } catch (error) {
        throw error;
    }
};