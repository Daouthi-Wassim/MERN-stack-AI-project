import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper } from '@mui/material';
import axios from 'axios';

const AddUser = ({ onUserAdded }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/addUser', { name, email, role, password });
            onUserAdded();
        } catch (error) {
            console.error('Error adding user:', error);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Add User</Typography>
            <Box component="form" onSubmit={handleSubmit}>
                <TextField
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    sx={{ mb: 2 }}
                />
                <TextField
                    label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    sx={{ mb: 2 }}
                />
                <TextField
                    label="Role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    fullWidth
                    sx={{ mb: 2 }}
                />
                <TextField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    sx={{ mb: 2 }}
                />
                <Button type="submit" variant="contained" color="primary">
                    Add User
                </Button>
            </Box>
        </Paper>
    );
};

export default AddUser;