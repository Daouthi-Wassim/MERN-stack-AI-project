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
    Button,
    
    Select,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Snackbar
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Visibility as VisibilityIcon
} from '@mui/icons-material';
import { fetchOrders, updateOrderStatus, deleteOrder } from '../../../redux/AdminApi';

const ShowOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, order: null });
    const [viewDialog, setViewDialog] = useState({ open: false, order: null });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const data = await fetchOrders();
            setOrders(data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await updateOrderStatus(orderId, newStatus);
            setSnackbar({
                open: true,
                message: 'Order status updated successfully',
                severity: 'success'
            });
            loadOrders();
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.message || 'Error updating order status',
                severity: 'error'
            });
        }
    };

    const handleDelete = async () => {
        try {
            await deleteOrder(deleteDialog.order._id);
            setSnackbar({
                open: true,
                message: 'Order deleted successfully',
                severity: 'success'
            });
            loadOrders();
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.message || 'Error deleting order',
                severity: 'error'
            });
        } finally {
            setDeleteDialog({ open: false, order: null });
        }
    };

    if (loading) return <Typography>Loading orders...</Typography>;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3 }}>Order Management</Typography>
            
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell>Order ID</TableCell>
                            <TableCell>Customer</TableCell>
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
                                <TableCell>{order.customer?.name}</TableCell>
                                <TableCell>
                                    {new Date(order.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>${order.total}</TableCell>
                                <TableCell>
                                    <Select
                                        value={order.status}
                                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                        size="small"
                                    >
                                        <MenuItem value="pending">Pending</MenuItem>
                                        <MenuItem value="processing">Processing</MenuItem>
                                        <MenuItem value="shipped">Shipped</MenuItem>
                                        <MenuItem value="delivered">Delivered</MenuItem>
                                        <MenuItem value="cancelled">Cancelled</MenuItem>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        onClick={() => setViewDialog({ open: true, order })}
                                        sx={{ mr: 1 }}
                                    >
                                        <VisibilityIcon />
                                    </IconButton>
                                    <IconButton
                                        color="error"
                                        onClick={() => setDeleteDialog({ open: true, order })}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* View Order Dialog */}
            <Dialog
                open={viewDialog.open}
                onClose={() => setViewDialog({ open: false, order: null })}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Order Details</DialogTitle>
                <DialogContent>
                    {viewDialog.order && (
                        <Box sx={{ p: 2 }}>
                            <Typography variant="h6">Order #{viewDialog.order._id}</Typography>
                            <Typography>Customer: {viewDialog.order.customer?.name}</Typography>
                            <Typography>Email: {viewDialog.order.customer?.email}</Typography>
                            <Typography>Date: {new Date(viewDialog.order.createdAt).toLocaleString()}</Typography>
                            <Typography>Status: {viewDialog.order.status}</Typography>
                            <Typography variant="h6" sx={{ mt: 2 }}>Items:</Typography>
                            {viewDialog.order.items?.map((item, index) => (
                                <Box key={index} sx={{ mt: 1 }}>
                                    <Typography>
                                        {item.product.name} - {item.quantity} x ${item.price}
                                    </Typography>
                                </Box>
                            ))}
                            <Typography variant="h6" sx={{ mt: 2 }}>
                                Total: ${viewDialog.order.total}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewDialog({ open: false, order: null })}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, order: null })}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete this order? This action cannot be undone.
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, order: null })}>
                        Cancel
                    </Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ShowOrders;