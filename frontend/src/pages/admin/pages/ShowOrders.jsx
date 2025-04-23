import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Alert,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { fetchOrders } from '../../../redux/AdminApi';

const ShowOrders = () => {
    const [orders, setOrders] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await fetchOrders();
            console.log('Orders:', response); 

            setOrders(Array.isArray(response.data.orders) ? response.data.orders : []); 
            setError(null);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Typography>Loading orders...</Typography>;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!orders || orders.length === 0) return <Typography>No orders found</Typography>;

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3 }}>Order Management</Typography>
            
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell>Order ID</TableCell>
                            <TableCell>Buyer</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Total</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order._id}>
                                <TableCell>{order._id}</TableCell>
                                <TableCell>{order.buyer || 'N/A'}</TableCell>
                                <TableCell>
                                    {new Date(order.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>${order.totalPrice}</TableCell>
                                <TableCell>{order.orderStatus}</TableCell>
                                <TableCell>
                                    <IconButton>
                                        <VisibilityIcon />
                                    </IconButton>
                                    <IconButton color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default ShowOrders;

