import axios from 'axios';
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
    getSpecificProductsFailed,
    specificProductSuccess,
    updateCurrentUser,
} from './userSlice';

const REACT_APP_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
    baseURL: REACT_APP_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
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
            message: error.response ? {}.data ? {}.message : error.response.data : error.message,
            url: error.config ? error.config.url : 'No URL'
        });
        return Promise.reject(error);
    }
)

// Update all other API calls to use the api instance
export const authUser = (fields, role, mode) => async(dispatch) => {
    dispatch(authRequest());
    try {
        const result = await api.post(`/${role}${mode}`, fields);
        if (result.data.role) {
            dispatch(authSuccess(result.data));
            return result.data;
        }
        dispatch(authFailed(result.data.message));
        return null;
    } catch (error) {
        dispatch(authError(error.response ? {}.data ? {}.message : 'Authentication failed' : error.message));
        return null;
    }
}



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

export const getSpecificProducts = (id, address) => async(dispatch) => {
    dispatch(getRequest());
    try {
        const result = await axios.get(`${REACT_APP_BASE_URL}/${address}/${id}`);
        if (result.data.message) {
            dispatch(getSpecificProductsFailed(result.data.message));
        } else {
            dispatch(specificProductSuccess(result.data));
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

// Action pour récupérer les utilisateurs
export const getUsers = () => async(dispatch) => {
    try {
        dispatch({ type: 'GET_USERS_REQUEST' });

        const response = await axios.get('/admin/users'); // Assure-toi que cette URL est correcte

        dispatch({
            type: 'GET_USERS_SUCCESS',
            payload: response.data, // Les utilisateurs récupérés depuis l'API
        });
    } catch (error) {
        dispatch({
            type: 'GET_USERS_FAILURE',
            payload: error.message,
        });
    }
};
// Action pour ajouter un utilisateur
export const addUser = (user) => async(dispatch) => {
    try {
        const response = await axios.post('/api/users', user);
        dispatch({
            type: 'ADD_USER_SUCCESS',
            payload: response.data,
        });
    } catch (error) {
        dispatch({
            type: 'ADD_USER_ERROR',
            payload: error.message,
        });
    }
};

// Action pour mettre à jour un utilisateur
export const updateUser = (user, id) => async(dispatch) => {
    try {
        const response = await axios.put(`/api/users/${id}`, user);
        dispatch({
            type: 'UPDATE_USER_SUCCESS',
            payload: response.data,
        });
    } catch (error) {
        dispatch({
            type: 'UPDATE_USER_ERROR',
            payload: error.message,
        });
    }
};

// Action pour supprimer un utilisateur
export const deleteUser = (id) => async(dispatch) => {
    try {
        await axios.delete(`/api/users/${id}`);
        dispatch({
            type: 'DELETE_USER_SUCCESS',
            payload: id,
        });
    } catch (error) {
        dispatch({
            type: 'DELETE_USER_ERROR',
            payload: error.message,
        });
    }
};
// ...existing code...

export const getSellers = () => async(dispatch) => {
    dispatch(getRequest());
    try {
        const response = await api.get('/admin/users');
        dispatch({
            type: 'GET_SELLERS_SUCCESS',
            payload: response.data
        });
    } catch (error) {
        dispatch(getError(error.response ? {}.data ? {}.message : error.message : error.message));
    }
};

export const deleteSeller = async(sellerId) => {
    try {
        const response = await api.delete(`/admin/users/sellers/${sellerId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getSellerStats = async(sellerId) => {
    try {
        const response = await api.get(`/admin/users/seller-stats/${sellerId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// ...existing code...