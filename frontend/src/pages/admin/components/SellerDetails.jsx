import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Card,
  CardContent,
  Grid,
  Rating,
  List,
  Chip,
  Stack
} from '@mui/material';
import {
  DataGrid,
  GridToolbar
} from '@mui/x-data-grid';
import { 
  Store,
  ShoppingBag,
  Star,
  LocalShipping,
  AttachMoney
} from '@mui/icons-material';
import { 
    getCustomerDetails,
    getProductsbySeller,
    getSellerReviews,
    getOrderedProductsBySeller,
    getSellerStats
  } from '../../../redux/userHandle';
const SellerDetails = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('profile');
  const [sellerData, setSellerData] = useState({
    profile: null,
    products: [],
    reviews: [],
    orders: [],
    revenue: null
  });



  const loadSellerData = async () => {
    try {
        const [profile, products, reviews, orders, stats] = await Promise.all([
          getCustomerDetails(id), // For seller profile
          getProductsbySeller(id), // For seller products
          getSellerReviews(id), // For seller reviews
          getOrderedProductsBySeller(id), // For seller orders
          getSellerStats(id) // For revenue and stats
        ]);

        setSellerData({
            profile,
            products,
            reviews,
            orders,
            revenue: {
              total: stats.totalRevenue || 0,
              monthly: stats.monthlyRevenue || 0
            }
          });
        } catch (error) {
          console.error('Error loading seller data:', error);
        }
      };
  useEffect(() => {
    loadSellerData();
  }, {id});


  const productColumns = [
    { field: '_id', headerName: 'ID', width: 200 },
    { field: 'name', headerName: 'Product Name', width: 200 },
    { field: 'price', headerName: 'Price', width: 100,
      valueFormatter: (params) => `$${params.value}` },
    { field: 'category', headerName: 'Category', width: 150 },
    { field: 'stock', headerName: 'Stock', width: 100 },
    { field: 'status', headerName: 'Status', width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={params.value === 'active' ? 'success' : 'error'}
          size="small"
        />
      )
    }
  ];

  const orderColumns = [
    { field: '_id', headerName: 'Order ID', width: 200 },
    { field: 'createdAt', headerName: 'Date', width: 150,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString() },
    { field: 'totalAmount', headerName: 'Amount', width: 120,
      valueFormatter: (params) => `$${params.value}` },
    { field: 'status', headerName: 'Status', width: 130,
      renderCell: (params) => (
        <Chip 
          label={params.value}
          color={
            params.value === 'delivered' ? 'success' :
            params.value === 'pending' ? 'warning' : 'primary'
          }
          size="small"
        />
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Seller Details
      </Typography>
      
      <Tabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab icon={<Store />} label="Profile" value="profile" />
        <Tab icon={<ShoppingBag />} label="Products" value="products" />
        <Tab icon={<Star />} label="Reviews" value="reviews" />
        <Tab icon={<LocalShipping />} label="Orders" value="orders" />
        <Tab icon={<AttachMoney />} label="Revenue" value="revenue" />
      </Tabs>

      <Box sx={{ mt: 3 }}>
        {activeTab === 'profile' && (
          <Card>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Basic Information</Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                      <Typography>{sellerData.profile?.name}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                      <Typography>{sellerData.profile?.email}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                      <Typography>{sellerData.profile?.phone}</Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Shop Information</Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Shop Name</Typography>
                      <Typography>{sellerData.profile?.shopName}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                      <Typography>{sellerData.profile?.category}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                      <Typography>{sellerData.profile?.description}</Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
        
        {activeTab === 'products' && (
          <DataGrid
            rows={sellerData.products}
            columns={productColumns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            components={{ Toolbar: GridToolbar }}
            getRowId={(row) => row._id}
            autoHeight
          />
        )}
        
        {activeTab === 'reviews' && (
          <Box>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Overall Rating</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Rating value={sellerData.reviews.avgRating} readOnly precision={0.5} />
                  <Typography variant="h4">{sellerData.reviews.avgRating}</Typography>
                  <Typography color="text.secondary">
                    ({sellerData.reviews.length} reviews)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
            
            <List>
              {sellerData.reviews.map((review) => (
                <Card key={review._id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1">{review.customer.name}</Typography>
                      <Rating value={review.rating} readOnly size="small" />
                    </Box>
                    <Typography color="text.secondary" variant="body2">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography sx={{ mt: 1 }}>{review.comment}</Typography>
                  </CardContent>
                </Card>
              ))}
            </List>
          </Box>
        )}
        
        {activeTab === 'orders' && (
          <DataGrid
            rows={sellerData.orders}
            columns={orderColumns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            components={{ Toolbar: GridToolbar }}
            getRowId={(row) => row._id}
            autoHeight
          />
        )}
        
        {activeTab === 'revenue' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Total Revenue</Typography>
                  <Typography variant="h3">
                    ${sellerData.revenue?.total.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Monthly Revenue</Typography>
                  <Typography variant="h4">
                    ${sellerData.revenue?.monthly.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* Add more revenue statistics as needed */}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default SellerDetails;