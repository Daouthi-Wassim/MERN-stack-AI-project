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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    Chip
} from '@mui/material';
import { 
    Delete as DeleteIcon,
    BarChart as BarChartIcon,
    ShoppingCart as ShoppingCartIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getSellers, deleteSeller, getSellerStats } from '../../../redux/userHandle';

const ShowSellers = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { loading, error, sellers } = useSelector((state) => state.user);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, seller: null });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [statsDialog, setStatsDialog] = useState({ open: false, stats: null });

    useEffect(() => {
        dispatch(getSellers());
    }, [dispatch]);

    const handleDelete = async () => {
        try {
            await deleteSeller(deleteDialog.seller._id);
            setSnackbar({
                open: true,
                message: 'Seller deleted successfully',
                severity: 'success'
            });
            dispatch(getSellers());
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.response?.data?.message || 'Error deleting seller',
                severity: 'error'
            });
        } finally {
            setDeleteDialog({ open: false, seller: null });
        }
    };

    const viewProducts = (sellerId) => {
        navigate(`/admin/seller-products/${sellerId}`);
    };

    const viewStats = async (sellerId) => {
        try {
            const stats = await getSellerStats(sellerId);
            setStatsDialog({ open: true, stats });
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.message || 'Error loading seller stats',
                severity: 'error'
            });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    if (loading) return <Typography>Loading sellers...</Typography>;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3 }}>Seller Management</Typography>
            
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Join Date</TableCell>
                            <TableCell>Products</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sellers?.map((seller) => (
                            <TableRow key={seller._id}>
                                <TableCell>{seller.name}</TableCell>
                                <TableCell>{seller.email}</TableCell>
                                <TableCell>
                                    {new Date(seller.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{seller.products?.length || 0}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={seller.isActive ? 'Active' : 'Inactive'}
                                        color={seller.isActive ? 'success' : 'error'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        onClick={() => viewProducts(seller._id)}
                                        title="View Products"
                                        sx={{ mr: 1 }}
                                    >
                                        <ShoppingCartIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => viewStats(seller._id)}
                                        title="View Stats"
                                        sx={{ mr: 1 }}
                                    >
                                        <BarChartIcon />
                                    </IconButton>
                                    <IconButton 
                                        color="error"
                                        onClick={() => setDeleteDialog({ open: true, seller })}
                                        title="Delete Seller"
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
            <Dialog 
                open={deleteDialog.open} 
                onClose={() => setDeleteDialog({ open: false, seller: null })}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete seller {deleteDialog.seller?.name}? 
                    This action cannot be undone and will remove all their products.
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, seller: null })}>
                        Cancel
                    </Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Stats Dialog */}
            <Dialog 
                open={statsDialog.open} 
                onClose={() => setStatsDialog({ open: false, stats: null })}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Seller Statistics</DialogTitle>
                <DialogContent>
                    {statsDialog.stats && (
                        <Box sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Total Revenue: ${statsDialog.stats.totalRevenue}
                            </Typography>
                            <Typography variant="h6" gutterBottom>
                                Total Orders: {statsDialog.stats.totalOrders}
                            </Typography>
                            <Typography variant="h6" gutterBottom>
                                Active Products: {statsDialog.stats.activeProducts}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStatsDialog({ open: false, stats: null })}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ShowSellers;