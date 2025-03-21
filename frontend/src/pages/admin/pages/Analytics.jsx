import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Grid, 
    Paper,
    Alert
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    ShoppingCart as ShoppingCartIcon,
    People as PeopleIcon,
    Store as StoreIcon
} from '@mui/icons-material';
import { fetchAnalytics } from '../../../redux/AdminApi';

const StatCard = ({ title, value, icon, color }) => (
    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <Box sx={{ 
            p: 1, 
            borderRadius: 1, 
            backgroundColor: `${color}20`, 
            mr: 2 
        }}>
            {icon}
        </Box>
        <Box>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="h4">{value}</Typography>
        </Box>
    </Paper>
);

const Analytics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            const data = await fetchAnalytics();
            setStats(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Typography>Loading analytics...</Typography>;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3 }}>Analytics Dashboard</Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6} lg={3}>
                    <StatCard
                        title="Total Revenue"
                        value={`$${stats.totalRevenue}`}
                        icon={<TrendingUpIcon sx={{ color: '#4caf50' }} />}
                        color="#4caf50"
                    />
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                    <StatCard
                        title="Total Orders"
                        value={stats.totalOrders}
                        icon={<ShoppingCartIcon sx={{ color: '#2196f3' }} />}
                        color="#2196f3"
                    />
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                    <StatCard
                        title="Total Customers"
                        value={stats.totalCustomers}
                        icon={<PeopleIcon sx={{ color: '#9c27b0' }} />}
                        color="#9c27b0"
                    />
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                    <StatCard
                        title="Total Sellers"
                        value={stats.totalSellers}
                        icon={<StoreIcon sx={{ color: '#ff9800' }} />}
                        color="#ff9800"
                    />
                </Grid>
            </Grid>
            {/* Add more analytics sections as needed */}
        </Box>
    );
};

export default Analytics;