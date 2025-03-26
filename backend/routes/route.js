const router = require('express').Router();
const {
    isAdmin,
    isCustomer,
    authMiddleware,
    isSeller,
    //validateAdminFee
} = require('../middleware/authMiddleware.js');

/* //////////// payment/////////////////////////
const {
    createPayment,
    getAllPayments
} = require("../controllers/paymentController");

router.post("/payments/create",
    authMiddleware,
    validateAdminFee,
    createPayment
);

*/ ////////////////////

const {
    createReview,
    getSellerStats,
    getAdminStats,
    updateReview,
    deleteReview
} = require('../controllers/reviewController');

const {

    getDashboardStats,
    getAllUsers,
    deleteUser,
    getAllProducts,
    createAdmin,
    toggleProductStatus

} = require('../controllers/adminController.js');

const {
    sellerRegister,
    sellerLogIn,
    handleReturn,
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
    processReturn
} = require('../controllers/customerController.js');

const {
    newOrder,
    updateOrderStatus,
    getOrderDetails,
    getOrderedProductsByCustomer,
    getOrderedProductsBySeller
} = require('../controllers/orderController.js');

// Client
//router.post("/create", createPayment);

// Admin
//router.get("/", authMiddleware, isAdmin, getAllPayments);

/////return////////////
const {

    //updateReturnRequest
} = require("../controllers/returnController");

router.post("/customer/payments", authMiddleware, isCustomer, createPayment);
router.post("/returns", authMiddleware, isCustomer, requestReturn);
router.post("/createreturns", authMiddleware, isCustomer, createReturn);

router.post("/procereturns", authMiddleware, processReturn);

// Client


// Admin
//router.put("/updatereturn/:id", authMiddleware, updateReturnRequest);

///////////////////////////////////






///////reviews ////////////////////////

// Seller routes
router.get('/sellerReviews', authMiddleware, isSeller, getSellerStats);
router.put("/returns/:id", authMiddleware, isSeller, handleReturn);
router.get("/seller/payments", authMiddleware, isSeller, getPayments);

// Admin routes
router.get('/allrev/admin-stats', authMiddleware, isAdmin, getAdminStats);

router.put('/updaterev/:id', authMiddleware, isAdmin, updateReview);

router.delete('/deleterev/:id', authMiddleware, isAdmin, deleteReview);
router.post('/createReview', authMiddleware, createReview);

/*
router.get('/getuserrev', authMiddleware, getUserReviews);
router.get('/getev/:subjectType/:subjectId', getReviews);
*/

/////////////////////////////////////////////////

// Admin Routes
router.post('/admin/create', authMiddleware, isAdmin, createAdmin);
router.get('/admin/dashboard-stats', authMiddleware, getDashboardStats);
router.get('/admin/users', authMiddleware, getAllUsers);
router.delete('/admin/users/:role/:id', authMiddleware, deleteUser);
router.get('/admin/products', authMiddleware, getAllProducts);
router.patch('/admin/products/:id/status', authMiddleware, toggleProductStatus);
router.get('/admin/:id', authMiddleware, getOrderDetails);
router.patch('/admin/orders/:id/status', authMiddleware, updateOrderStatus);

// Seller
router.post('/SellerRegister', sellerRegister);
router.post('/SellerLogin', sellerLogIn);

// Product
router.post('/ProductCreate', productCreate);
router.get('/getSellerProducts/:id', getSellerProducts);
router.get('/getProducts', getProducts);
router.get('/getProductDetail/:id', getProductDetail);
router.get('/getInterestedCustomers/:id', getInterestedCustomers);
router.get('/getAddedToCartProducts/:id', getAddedToCartProducts);

router.put('/ProductUpdate/:id', updateProduct);
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