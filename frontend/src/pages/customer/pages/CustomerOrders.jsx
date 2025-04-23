import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Box, Tabs, Tab, 
  Stack, Button, Menu, MenuItem, Card, 
  CardContent, Chip, Grid, CircularProgress 
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { getSpecificProducts } from '../../../redux/userHandle';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';

const OrderStatusChip = ({ status }) => {
  const getColor = (status) => {
    switch (status) {
      case 'Processing': return 'warning';
      case 'Shipped': return 'info';
      case 'Delivered': return 'success';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <Chip 
      label={status} 
      color={getColor(status)} 
      variant="outlined" 
      size="small" 
    />
  );
};

const OrderCard = ({ order }) => {
    if (!order) return null;
  
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1">
              Order ID: {order._id?.slice(-8)}
            </Typography>
            <OrderStatusChip status={order.orderStatus} />
          </Box>
          
        
          {order.orderedProducts?.map((item, index) => (
          <Box key={index} sx={{ mb: 1 }}>
            <Typography variant="body2">
              Product: {item.product?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quantity: {item.quantity}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Price: ${item.product?.price?.cost || 0}
            </Typography>
          </Box>
        ))}

<Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Order Date: {new Date(order.createdAt).toLocaleDateString()}
          </Typography>
          <Typography variant="subtitle1" color="primary">
            Total: ${order.totalPrice}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const CustomerOrders = () => {
    const dispatch = useDispatch();
    const [tabValue, setTabValue] = useState(0);
    const [sortOption, setSortOption] = useState('newest');
    const [sortAnchorEl, setSortAnchorEl] = useState(null);
    const { currentUser, loading, error } = useSelector(state => ({
        currentUser: state.user.currentUser,
        loading: state.user.loading,
        error: state.user.error,
    }));
    
    const orders = useSelector(state => state.user.orders);

    useEffect(() => {
        if (currentUser?._id) {
            dispatch(getSpecificProducts({
                customerId: currentUser._id
            }));
        }
    }, [dispatch, currentUser]);



 // Filter orders by status
 const filterOrdersByStatus = (orders, status) => {
    console.log('Filtering orders:', { orders, status });
    if (!Array.isArray(orders)) return [];
    if (status === 'all') return orders;
    return orders.filter(order => order.orderStatus === status);
};

   // Sort orders
   const sortOrders = (orders) => {
    if (!Array.isArray(orders) || orders.length === 0) return [];
    return [...orders].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOption === 'newest' ? dateB - dateA : dateA - dateB;
    });
};

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSortClick = (event) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = (option) => {
    if (option) {
      setSortOption(option);
    }
    setSortAnchorEl(null);
  };

  const statuses = ['all', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  const currentStatus = statuses[tabValue];
  const filteredOrders = filterOrdersByStatus(orders, currentStatus);
    const sortedOrders = sortOrders(filteredOrders);

  console.log('Orders data:', { orders, filteredOrders, sortedOrders });

  if (loading) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

 
  
  return (
    <Container>
      <Typography variant="h4" sx={{ mb: 4, textAlign: "center" }}>
        My Orders
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {statuses.map((status, index) => (
            <Tab key={status} label={status === 'all' ? 'All Orders' : status} />
          ))}
        </Tabs>
        </Box>

{loading ? (
  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
    <CircularProgress />
  </Box>
) : error ? (
  <Typography color="error" textAlign="center">
    {error}
  </Typography>
) : (
  <>
              <Stack 
            direction="row" 
            justifyContent="flex-end" 
            sx={{ mb: 2 }}
          >
            <Button
              endIcon={sortAnchorEl ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
              onClick={handleSortClick}
            >
              Sort by: {sortOption === 'newest' ? 'Newest First' : 'Oldest First'}
            </Button>
            <Menu
              anchorEl={sortAnchorEl}
              open={Boolean(sortAnchorEl)}
              onClose={() => handleSortClose()}
            >
              <MenuItem onClick={() => handleSortClose('newest')}>
                Newest First

                </MenuItem>
              <MenuItem onClick={() => handleSortClose('oldest')}>
                Oldest First
              </MenuItem>
            </Menu>
          </Stack>

          {Array.isArray(sortedOrders) && sortedOrders.length > 0 ? (
            <Grid container spacing={2}>
              {sortedOrders.map((order) => (
                <Grid item xs={12} key={order._id}>
                  <OrderCard order={order} />
                </Grid>
              ))}
            </Grid>
    ) : (
        <Typography textAlign="center" color="text.secondary">
          No orders found
        </Typography>
      )}
    </>
  )}
</Container>
);
};

export default CustomerOrders;