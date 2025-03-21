import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useSelector } from 'react-redux';

const Profile = () => {
    const { currentUser } = useSelector(state => state.user);

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3 }}>Admin Profile</Typography>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6">Name: {currentUser?.name}</Typography>
                <Typography variant="h6">Email: {currentUser?.email}</Typography>
                <Typography variant="h6">Role: {currentUser?.role}</Typography>
            </Paper>
        </Box>
    );
};

export default Profile;