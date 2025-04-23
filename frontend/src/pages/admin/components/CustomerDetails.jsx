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
    Chip,
    Stack,
    CircularProgress,
    Alert,
    Rating,
    IconButton
} from '@mui/material';
import {
    DataGrid,
    GridToolbar
} from '@mui/x-data-grid';
import {
    Person,
    ShoppingCart,
    LocalShipping,
    AssignmentReturn,
    Refresh
} from '@mui/icons-material';
import {
    getCustomerDetails,
    getOrderedProductsByCustomer,
    getCartDetail,
    getCustomerReturnRequests
} from '../../../redux/userHandle';

const CustomerDetails = () => {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [customerData, setCustomerData] = useState({
        profile: null,
        orders: [],
        cart: [],
        returns: []
    });

    const loadCustomerData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [profile, orders, cart, returns] = await Promise.all([
                getCustomerDetails(id),
                getOrderedProductsByCustomer(id),
                getCartDetail(id),
                getCustomerReturnRequests()
            ]);

            setCustomerData({ profile, orders, cart, returns });
        } catch (error) {
            console.error('Error loading customer data:', error);
            setError(error.message || 'Error loading customer data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCustomerData();
    }, [id]);

    const orderColumns = [
        { field: '_id', headerName: 'Order ID', width: 200 },
        {
            field: 'createdAt',
            headerName: 'Date',
            width: 150,
            valueFormatter: (params) => new Date(params.value).toLocaleDateString()
        },
        {
            field: 'totalAmount',
            headerName: 'Amount',
            width: 120,
            valueFormatter: (params) => `$${params.value.toFixed(2)}`
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 130,
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

    const cartColumns = [
        { field: 'product.name', headerName: 'Product', width: 200,
            valueGetter: (params) => params.row.product?.name },
        { field: 'product.price', headerName: 'Price', width: 120,
            valueGetter: (params) => params.row.product?.price,
            valueFormatter: (params) => `$${params.value}` },
        { field: 'quantity', headerName: 'Quantity', width: 100 }
    ];

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">
                    Customer Details
                </Typography>
                <IconButton onClick={loadCustomerData}>
                    <Refresh />
                </IconButton>
            </Box>

            <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{ mb: 3 }}
            >
                <Tab icon={<Person />} label="Profile" value="profile" />
                <Tab icon={<LocalShipping />} label="Orders" value="orders" />
                <Tab icon={<ShoppingCart />} label="Cart" value="cart" />
                <Tab icon={<AssignmentReturn />} label="Returns" value="returns" />
            </Tabs>

            <Box sx={{ mt: 3 }}>
                {activeTab === 'profile' && (
                    <Card>
                        <CardContent>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="h6" gutterBottom>Personal Information</Typography>
                                    <Stack spacing={2}>
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                                            <Typography>{customerData.profile?.name}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                                            <Typography>{customerData.profile?.email}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                                            <Typography>{customerData.profile?.phone}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                                            <Typography>{customerData.profile?.address}</Typography>
                                        </Box>
                                    </Stack>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="h6" gutterBottom>Account Statistics</Typography>
                                    <Stack spacing={2}>
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">Total Orders</Typography>
                                            <Typography variant="h4">{customerData.orders?.length || 0}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">Cart Items</Typography>
                                            <Typography variant="h4">{customerData.cart?.length || 0}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">Return Requests</Typography>
                                            <Typography variant="h4">{customerData.returns?.length || 0}</Typography>
                                        </Box>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'orders' && (
                    <DataGrid
                        rows={customerData.orders || []}
                        columns={orderColumns}
                        pageSize={10}
                        rowsPerPageOptions={[10, 25, 50]}
                        components={{ Toolbar: GridToolbar }}
                        getRowId={(row) => row._id}
                        autoHeight
                    />
                )}

                {activeTab === 'cart' && (
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Shopping Cart ({customerData.cart?.length || 0} items)
                            </Typography>
                            <DataGrid
                                rows={customerData.cart || []}
                                columns={cartColumns}
                                pageSize={10}
                                components={{ Toolbar: GridToolbar }}
                                getRowId={(row) => row._id}
                                autoHeight
                            />
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'returns' && (
                    <Stack spacing={3}>
                        {customerData.returns?.map((returnRequest) => (
                            <Card key={returnRequest._id}>
                                <CardContent>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Order ID
                                            </Typography>
                                            <Typography>{returnRequest.order}</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Status
                                            </Typography>
                                            <Chip
                                                label={returnRequest.status}
                                                color={returnRequest.status === 'approved' ? 'success' : 'warning'}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Reason
                                            </Typography>
                                            <Typography>{returnRequest.reason}</Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                )}
            </Box>
        </Box>
    );
};

export default CustomerDetails;