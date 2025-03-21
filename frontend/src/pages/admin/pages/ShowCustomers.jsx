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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Snackbar
} from '@mui/material';
import { Delete as DeleteIcon, ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import { fetchCustomers, deleteCustomer } from '../../../redux/AdminApi';
import { useNavigate } from 'react-router-dom';

const ShowCustomers = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, customer: null });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            const data = await fetchCustomers();
            setCustomers(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (customer) => {
        setDeleteDialog({ open: true, customer });
    };

    const confirmDelete = async () => {
        try {
            await deleteCustomer(deleteDialog.customer._id);
            setSnackbar({
                open: true,
                message: 'Customer deleted successfully',
                severity: 'success'
            });
            loadCustomers();
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.message || 'Error deleting customer',
                severity: 'error'
            });
        } finally {
            setDeleteDialog({ open: false, customer: null });
        }
    };

    const viewOrders = (customerId) => {
        navigate(`/admin/customer-orders/${customerId}`);
    };

    if (loading) return <Typography>Loading customers...</Typography>;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3 }}>Customer Management</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Join Date</TableCell>
                            <TableCell>Orders</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {customers.map((customer) => (
                            <TableRow key={customer._id}>
                                <TableCell>{customer.name}</TableCell>
                                <TableCell>{customer.email}</TableCell>
                                <TableCell>
                                    {new Date(customer.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{customer.orders?.length || 0}</TableCell>
                                <TableCell>
                                    <Button
                                        startIcon={<ShoppingCartIcon />}
                                        onClick={() => viewOrders(customer._id)}
                                        sx={{ mr: 1 }}
                                    >
                                        View Orders
                                    </Button>
                                    <IconButton 
                                        color="error"
                                        onClick={() => handleDelete(customer)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, customer: null })}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete customer {deleteDialog.customer?.name}?
                    This action cannot be undone.
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, customer: null })}>
                        Cancel
                    </Button>
                    <Button onClick={confirmDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                message={snackbar.message}
                severity={snackbar.severity}
            />
        </Box>
    );
};

export default ShowCustomers;