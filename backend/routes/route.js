const router = require('express').Router();
const {
    isAdmin,
    isCustomer,
    authMiddleware,
    isSeller,
    //validateAdminFee
} = require('../middleware/authMiddleware.js');



const {

    getDashboardStats,

    deleteUser,
    getAllProducts,
    createAdmin,
    toggleProductStatus,
    getAVGReviewSellers,
    getAVGReviewProducts,
    addSeller,
    addcustomer,
    getsellers,
    getcustomers,
    getCustomerDetails,
    getPaymentDetails,
    getallReturnRequests,
    getAdminNotifications,
    getAdminStats,
    updateReview,
    deleteReview

} = require('../controllers/adminController.js');

const {
    sellerRegister,
    sellerLogIn,
    getAVGreviews,
    getPayments
} = require('../controllers/sellerController.js');

const {
    productCreate,
    getProducts,
    getProductDetail,
    searchProduct,
    searchProductbyCategory,
    searchProductbySubCategory,
    getSellerProducts,
    updateProduct,
    deleteProduct,
    deleteProducts,
    // deleteProductReview,
    //deleteAllProductReviews,
    addReview,
    getInterestedCustomers,
    getAddedToCartProducts,
} = require('../controllers/productController.js');

const {
    customerRegister,
    customerLogIn,
    getCartDetail,
    cartUpdate,
    requestReturn,
    createPayment,
    createReturn,
    processReturn,
    createReview,
    getcustomerNotification,
    getcustomerReturnRequests
} = require('../controllers/customerController.js');

const {
    newOrder,
    updateOrderStatus,
    getOrderDetails,
    getOrderedProductsByCustomer,
    getOrderedProductsBySeller
} = require('../controllers/orderController.js');



/////return////////////

router.post("/customer/createpayment", authMiddleware, isCustomer, createPayment);
router.post("/returns", authMiddleware, isCustomer, requestReturn);
router.post("/createreturns", authMiddleware, isCustomer, createReturn);
router.post("/procereturns", authMiddleware, isSeller, processReturn);







///////reviews ////////////////////////

// Seller routes
router.get('/sellerReviews', authMiddleware, isSeller, getAVGreviews);
router.get("/seller/payments", authMiddleware, isSeller, getPayments);

// Admin routes
router.get('/admin/getsellersrev', authMiddleware, isAdmin, getAVGReviewSellers);
router.get('/admin/getproductsrev', authMiddleware, isAdmin, getAVGReviewProducts);
router.get('/admin/getallcusdetails/:id', authMiddleware, isAdmin, getCustomerDetails);
router.put('/updaterev/:id', authMiddleware, isAdmin, updateReview);
router.delete('/deleterev/:id', authMiddleware, isAdmin, deleteReview);

router.post('/createReview', authMiddleware, isCustomer, createReview);

/*
router.get('/getuserrev', authMiddleware, getUserReviews);
router.get('/getev/:subjectType/:subjectId', getReviews);
*/

/////////////////////////////////////////////////

// Admin Routes
router.post('/admin/createadmin', authMiddleware, isAdmin, createAdmin);
router.post('/admin/createseller', authMiddleware, isAdmin, addSeller);
router.post('/admin/createcustomer', authMiddleware, isAdmin, addcustomer);
router.get('/admin/getsellers', authMiddleware, isAdmin, getsellers);
router.get('/admin/getcustomers', authMiddleware, isAdmin, getcustomers);
router.get('/admin/getAdminnotif', authMiddleware, isAdmin, getAdminNotifications);
router.get('/admin/getallreturn', authMiddleware, isAdmin, getallReturnRequests);

router.get('/admin/getallpayments', authMiddleware, isAdmin, getPaymentDetails);
router.get('/admin/dashboard-stats', authMiddleware, getDashboardStats);

router.delete('/admin/deleteUsers/:role/:id', authMiddleware, deleteUser);
router.get('/admin/products', authMiddleware, getAllProducts);
router.patch('/admin/products/:id/status', authMiddleware, toggleProductStatus);
router.get('/admin/:id', authMiddleware, getOrderDetails);
router.put('/seller/orders/:id/status', authMiddleware, isSeller, updateOrderStatus);

// Seller
router.post('/SellerRegister', sellerRegister);
router.post('/SellerLogin', sellerLogIn);

// Product
router.post('/ProductCreate', authMiddleware, isSeller, productCreate);
router.get('/getSellerProducts/:id', getSellerProducts);
router.get('/getProducts', getProducts);
router.get('/getProductDetail/:id', getProductDetail);
router.get('/getInterestedCustomers/:id', getInterestedCustomers);
router.get('/getAddedToCartProducts/:id', authMiddleware, isCustomer, getAddedToCartProducts);

router.put('/ProductUpdate/:id', authMiddleware, isSeller, updateProduct);
router.put('/addReview/:id', addReview);

router.get('/searchProduct/:key', searchProduct);
router.get('/searchProductbyCategory/:key', searchProductbyCategory);
router.get('/searchProductbySubCategory/:key', searchProductbySubCategory);

router.delete('/DeleteProduct/:id', deleteProduct);
router.delete('/DeleteProducts/:id', deleteProducts);
//router.put('/deleteProductReview/:id', deleteProductReview);
//router.delete('/deleteAllProductReviews/:id', deleteAllProductReviews);

// Customer
router.post('/CustomerRegister', customerRegister);
router.post('/CustomerLogin', customerLogIn);
router.get('/getCartDetail/:id', getCartDetail);
router.put('/CustomerUpdate/:id', cartUpdate);

// Order
router.post('/newOrder', authMiddleware, newOrder);
router.get('/getOrderedProductsByCustomer/:id', authMiddleware, isAdmin, getOrderedProductsByCustomer);
router.get('/getOrderedProductsBySeller/:id', authMiddleware, getOrderedProductsBySeller);


module.exports = router;