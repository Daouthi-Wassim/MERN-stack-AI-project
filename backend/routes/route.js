const router = require('express').Router();
const {
    isAdmin,
    authMiddleware,
    isSeller
} = require('../middleware/authMiddleware.js');


const {
    createReview,
    getSellerStats,
    getAdminStats,
    updateReview,
    deleteReview
} = require('../controllers/reviewController');

const {
    adminLogin,
    getDashboardStats,
    getAllUsers,
    deleteUser,
    getAllProducts,
    createAdmin,
    toggleProductStatus

} = require('../controllers/adminController.js');

const {
    sellerRegister,
    sellerLogIn
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
    cartUpdate
} = require('../controllers/customerController.js');

const {
    newOrder,
    updateOrderStatus,
    getOrderDetails,
    getOrderedProductsByCustomer,
    getOrderedProductsBySeller
} = require('../controllers/orderController.js');


// Seller routes
router.get('/sellerReviews', authMiddleware, isSeller, getSellerStats);

// Admin routes
router.get('/allrev/admin-stats', authMiddleware, isAdmin, getAdminStats);

router.put('/updaterev/:id', authMiddleware, isAdmin, updateReview);

router.delete('/deleterev/:id', authMiddleware, isAdmin, deleteReview);
router.post('/createReview', authMiddleware, createReview);
/*reviews

router.get('/getuserrev', authMiddleware, getUserReviews);
router.get('/getev/:subjectType/:subjectId', getReviews);
*/
// Admin Routes
router.post('/AdminLogin', authMiddleware, adminLogin);
router.post('/admin/create', authMiddleware, createAdmin);
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
router.post('/newOrder', newOrder);
router.get('/getOrderedProductsByCustomer/:id', getOrderedProductsByCustomer);
router.get('/getOrderedProductsBySeller/:id', getOrderedProductsBySeller);


module.exports = router;