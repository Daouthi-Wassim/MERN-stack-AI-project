import { createSlice } from '@reduxjs/toolkit';
import jwtDecode from 'jwt-decode';
import { getUsers, getSpecificProducts, createNewOrder } from './userHandle';
const initialState = {
    status: 'idle',
    loading: false,
    currentUser: JSON.parse(localStorage.getItem('user')) || null,
    currentRole: (JSON.parse(localStorage.getItem('user')) || {}).role || null,
    currentToken: (JSON.parse(localStorage.getItem('user')) || {}).token || null,
    isLoggedIn: false,
    error: null,
    response: null,
    currentOrder: null,
    responseReview: null,
    responseProducts: null,
    responseSellerProducts: null,
    responseSpecificProducts: null,
    responseDetails: null,
    responseSearch: null,
    responseCustomersList: null,

    productData: [],
    sellerProductData: [],
    specificProductData: [],
    productDetails: {},
    productDetailsCart: {},
    filteredProducts: [],
    customersList: [],

    orderLoading: false,
    orderError: null,
    orders: [],

    users: [],
    usersList: [],
    sellers: [],
    adminProducts: [],
    adminOrders: [],

    notifications: [],
    paymentIntent: null,
    returns: [],

    sellerStats: null
};

const updateCartDetailsInLocalStorage = (cartDetails) => {
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};
    currentUser.cartDetails = cartDetails;
    localStorage.setItem('user', JSON.stringify(currentUser));
};




export const updateShippingDataInLocalStorage = (shippingData) => {
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};
    const updatedUser = {
        ...currentUser,
        shippingData: shippingData
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));
};

const userSlice = createSlice({
    name: 'user',

    initialState,
    reducers: {

        setUsers: (state, action) => {
            state.usersList = action.payload;
            state.loading = false;
            state.error = null;
        },
        setLoading: (state) => {
            state.loading = true;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
        GET_SELLERS_SUCCESS: (state, action) => {
            state.loading = false;
            state.sellers = action.payload;
            state.error = null;
        },
        adminProductsSuccess: (state, action) => {
            state.loading = false;
            state.adminProducts = action.payload;
            state.error = null;
        },
        adminProductsFailed: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        adminOrdersSuccess: (state, action) => {
            state.loading = false;
            state.adminOrders = action.payload;
            state.error = null;
        },
        adminOrdersFailed: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },



        authRequest: (state) => {
            state.status = 'loading';
        },
        underControl: (state) => {
            state.status = 'idle';
            state.response = null;
        },
        stuffAdded: (state) => {
            state.status = 'added';
            state.response = null;
            state.error = null;
        },
        stuffUpdated: (state) => {
            state.status = 'updated';
            state.response = null;
            state.error = null;
        },
        updateFailed: (state, action) => {
            state.status = 'failed';
            state.responseReview = action.payload;
            state.error = null;
        },
        updateCurrentUser: (state, action) => {
            state.currentUser = action.payload;
            localStorage.setItem('user', JSON.stringify(action.payload));
        },
        authSuccess: (state, action) => {
            localStorage.setItem('user', JSON.stringify(action.payload));
            state.currentUser = action.payload;
            state.currentRole = action.payload.role;
            state.currentToken = action.payload.token;
            state.status = 'success';
            state.response = null;
            state.error = null;
            state.isLoggedIn = true;
        },
        addToCart: (state, action) => {
            const existingProduct = state.currentUser.cartDetails.find(
                (cartItem) => cartItem._id === action.payload._id
            );

            if (existingProduct) {
                existingProduct.quantity += 1;
            } else {
                const newCartItem = {...action.payload };
                state.currentUser.cartDetails.push(newCartItem);
            }

            updateCartDetailsInLocalStorage(state.currentUser.cartDetails);
        },
        removeFromCart: (state, action) => {
            const existingProduct = state.currentUser.cartDetails.find(
                (cartItem) => cartItem._id === action.payload._id
            );

            if (existingProduct) {
                if (existingProduct.quantity > 1) {
                    existingProduct.quantity -= 1;
                } else {
                    const index = state.currentUser.cartDetails.findIndex(
                        (cartItem) => cartItem._id === action.payload._id
                    );
                    if (index !== -1) {
                        state.currentUser.cartDetails.splice(index, 1);
                    }
                }
            }

            updateCartDetailsInLocalStorage(state.currentUser.cartDetails);
        },

        removeSpecificProduct: (state, action) => {
            const productIdToRemove = action.payload;
            const updatedCartDetails = state.currentUser.cartDetails.filter(
                (cartItem) => cartItem._id !== productIdToRemove
            );

            state.currentUser.cartDetails = updatedCartDetails;
            updateCartDetailsInLocalStorage(updatedCartDetails);
        },

        fetchProductDetailsFromCart: (state, action) => {
            const productIdToFetch = action.payload;
            const productInCart = state.currentUser.cartDetails.find(
                (cartItem) => cartItem._id === productIdToFetch
            );

            if (productInCart) {
                state.productDetailsCart = {...productInCart };
            } else {
                state.productDetailsCart = null;
            }
        },

        removeAllFromCart: (state) => {
            state.currentUser.cartDetails = [];
            updateCartDetailsInLocalStorage([]);
        },

        authFailed: (state, action) => {
            state.status = 'failed';
            state.response = action.payload;
            state.error = null;
        },
        authError: (state, action) => {
            state.status = 'error';
            state.response = null;
            state.error = action.payload;
        },
        authLogout: (state) => {
            localStorage.removeItem('user');
            state.status = 'idle';
            state.loading = false;
            state.currentUser = null;
            state.currentRole = null;
            state.currentToken = null;
            state.error = null;
            state.response = true;
            state.isLoggedIn = false;
        },

        isTokenValid: (state) => {
            const decodedToken = jwtDecode(state.currentToken);

            if (state.currentToken && decodedToken.exp * 1000 > Date.now()) {
                state.isLoggedIn = true;
            } else {
                localStorage.removeItem('user');
                state.currentUser = null;
                state.currentRole = null;
                state.currentToken = null;
                state.status = 'idle';
                state.response = null;
                state.error = null;
                state.isLoggedIn = false;
            }
        },

        getRequest: (state) => {
            state.loading = true;
        },
        getFailed: (state, action) => {
            state.response = action.payload;
            state.loading = false;
            state.error = null;
        },
        getError: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },

        getDeleteSuccess: (state) => {
            state.status = 'deleted';
            state.loading = false;
            state.error = null;
            state.response = null;
        },

        productSuccess: (state, action) => {
            state.productData = action.payload;
            state.responseProducts = null;
            state.loading = false;
            state.error = null;
        },
        getProductsFailed: (state, action) => {
            state.responseProducts = action.payload;
            state.loading = false;
            state.error = null;
        },

        sellerProductSuccess: (state, action) => {
            state.sellerProductData = action.payload;
            state.responseSellerProducts = null;
            state.loading = false;
            state.error = null;
        },
        getSellerProductsFailed: (state, action) => {
            state.responseSellerProducts = action.payload;
            state.loading = false;
            state.error = null;
        },

        specificProductSuccess: (state, action) => {
            state.specificProductData = action.payload;
            state.responseSpecificProducts = null;
            state.loading = false;
            state.error = null;
        },
        getSpecificProductsFailed: (state, action) => {
            state.responseSpecificProducts = action.payload;
            state.loading = false;
            state.error = null;
        },

        productDetailsSuccess: (state, action) => {
            state.productDetails = action.payload;
            state.responseDetails = null;
            state.loading = false;
            state.error = null;
        },
        getProductDetailsFailed: (state, action) => {
            state.responseDetails = action.payload;
            state.loading = false;
            state.error = null;
        },

        customersListSuccess: (state, action) => {
            state.customersList = action.payload;
            state.responseCustomersList = null;
            state.loading = false;
            state.error = null;
        },

        getCustomersListFailed: (state, action) => {
            state.responseCustomersList = action.payload;
            state.loading = false;
            state.error = null;
        },

        setFilteredProducts: (state, action) => {
            state.filteredProducts = action.payload;
            state.responseSearch = null;
            state.loading = false;
            state.error = null;
        },
        getSearchFailed: (state, action) => {
            state.responseSearch = action.payload;
            state.loading = false;
            state.error = null;
        },

    },
    // userSlice.js

    extraReducers: (builder) => {
        builder
            .addCase('NOTIFICATIONS_LOADED', (state, action) => {
                state.notifications = action.payload;
                state.loading = false;
                state.error = null;
            })
            .addCase('RETURN_CREATED', (state, action) => {
                state.returns.push(action.payload);
                state.status = 'succeeded';
                state.error = null;
            })
            .addCase('ORDERS_LOADED', (state, action) => {
                state.orders = action.payload;
                state.loading = false;
                state.error = null;
            })
            .addCase('PAYMENT_INTENT_CREATED', (state, action) => {
                state.paymentIntent = action.payload;
                state.loading = false;
                state.error = null;
            })

        .addCase('USERS_LOADED', (state, action) => {
                state.usersList = action.payload;
                state.loading = false;
            })
            .addCase(getUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getUsers.fulfilled, (state, action) => {
                state.loading = false;

                state.usersList = Array.isArray(action.payload) ? action.payload :
                    action.payload ? action.payload.users ? action.payload.users :
                    action.payload ? action.payload.data ? action.payload.data : [] : [] : [];
            })
            .addCase(getUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(createNewOrder.pending, (state) => {
                state.orderLoading = true;
                state.orderError = null;
            })
            .addCase(createNewOrder.fulfilled, (state, action) => {
                state.orderLoading = false;
                state.currentOrder = action.payload;
                state.orderError = null;
            })
            .addCase(createNewOrder.rejected, (state, action) => {
                state.orderLoading = false;
                state.orderError = action.payload;
            })
            .addCase(getSpecificProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getSpecificProducts.fulfilled, (state, action) => {
                state.loading = false;
                state.orders = action.payload.data || [];
                state.error = null;
            })
            .addCase(getSpecificProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const {
    authRequest,
    underControl,
    stuffAdded,
    stuffUpdated,
    updateFailed,
    authSuccess,
    authFailed,
    authError,
    authLogout,
    isTokenValid,
    doneSuccess,
    getDeleteSuccess,
    getRequest,
    productSuccess,
    sellerProductSuccess,
    productDetailsSuccess,
    getProductsFailed,
    getSellerProductsFailed,
    getProductDetailsFailed,
    getFailed,
    getError,
    getSearchFailed,
    setFilteredProducts,
    getCustomersListFailed,
    customersListSuccess,
    getSpecificProductsFailed,
    specificProductSuccess,
    setUsers,
    setLoading,
    setError,
    addToCart,
    removeFromCart,
    removeSpecificProduct,
    removeAllFromCart,
    fetchProductDetailsFromCart,
    updateCurrentUser,


    adminProductsSuccess,
    adminProductsFailed,
    adminOrdersSuccess,
    adminOrdersFailed,
} = userSlice.actions;

export const userReducer = userSlice.reducer;

export const selectCurrentUser = (state) => state.user.currentUser;
export const selectCartTotal = (state) =>
    state.user.currentUser ? state.user.currentUser.cartDetails ? state.user.currentUser.reduce(
        (total, item) => total + (item.quantity * item.price.cost),
        0
    ) : 0 : 0;
export const selectNotifications = (state) => state.user.notifications;