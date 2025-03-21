import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});




export const fetchCustomers = async() => {
    const response = await api.get('/admin/users');
    return response.data;
};
export const deleteSeller = async(id) => {
    const response = await api.delete(`/admin/users/seller/${id}`);
    return response.data;
};
export const fetchSellers = async() => {
    const response = await api.get('/admin/users');
    return response.data;
};
export const fetchSellerDetails = async(id) => {
    const response = await api.get(`/admin/users/sellers/${id}`);
    return response.data;
};
export const fetchSellerProducts = async(sellerId) => {
    const response = await api.get(`/admin/users/seller//${sellerId}`);
    return response.data;
};
export const fetchSellerStats = async(sellerId) => {
    const response = await api.get(`/admin/users/seller-stats/${sellerId}`);
    return response.data;
};



export const fetchOrders = async() => {
    const response = await api.get('/admin/orders');
    return response.data;
};

export const fetchAnalytics = async() => {
    const response = await api.get('/admin/dashboard-stats');
    return response.data;
};
export const updateOrderStatus = async(orderId, status) => {
    const response = await api.put(`/admin/orders/${orderId}`, { status });
    return response.data;
};
export const deleteOrder = async(orderId) => {
    const response = await api.delete(`/admin/orders/${orderId}`);
    return response.data;
};


export const fetchProducts = async() => {
    try {
        const response = await api.get('/admin/products');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const deleteProduct = async(productId) => {
    try {
        const response = await api.delete(`/admin/products/${productId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};