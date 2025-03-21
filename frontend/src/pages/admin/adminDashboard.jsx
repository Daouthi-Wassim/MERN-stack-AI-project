import React, { useState } from 'react';
import {
    CssBaseline,
    Box,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
} from '@mui/material';
import ListIcon from '@mui/icons-material/List';
import CloseIcon from '@mui/icons-material/Close';
import {  Route, Routes, useNavigate } from 'react-router-dom';
import { AppBar, Drawer, NavLogo } from '../../utils/styles';
import LocalMallIcon from '@mui/icons-material/LocalMall';
import Logout from '../Logout';
import AdminSideBar from './components/AdminSideBar';
import Dashboard from './pages/adminHomePage';
import ShowUsers from './pages/ShowUsers';
import AddUser from './pages/AddUser';

import Products from './pages/ShowProducts';
import Analytics from './pages/Analytics';
import Profile from './pages/adminProfile';
import ShowOrders from './pages/ShowOrders';

const AdminDashboard = () => {
    const [open, setOpen] = useState(true);
    const toggleDrawer = () => {
        setOpen(!open);
    };

    const navigate = useNavigate();

    const homeHandler = () => {
        navigate("/");
    };

    return (
        <>
            <Box sx={{ display: 'flex' }}>
                <CssBaseline />
                <AppBar open={open} position='absolute' sx={{ backgroundColor: "#4d1c9c" }}>
                    <Toolbar sx={{ pr: '24px' }}>
                        <IconButton
                            edge="start"
                            color="inherit"
                            aria-label="open drawer"
                            onClick={toggleDrawer}
                            sx={{
                                marginRight: '36px',
                                ...(open && { display: 'none' }),
                            }}
                        >
                            <ListIcon />
                        </IconButton>
                        <Typography
                            component="h1"
                            variant="h6"
                            color="inherit"
                            noWrap
                            sx={{
                                mr: 2,
                                flexGrow: 1,
                                display: { xs: 'none', md: 'flex' },
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                letterSpacing: '.3rem',
                                color: 'inherit',
                                textDecoration: 'none',
                                cursor: "pointer"
                            }}
                        >
                            <NavLogo
                                to="top"
                                activeClass="active"
                                spy={true}
                                smooth={true}
                                offset={-70}
                                duration={500}
                                onClick={homeHandler}
                            >
                                <LocalMallIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
                                SHOPPINGI
                            </NavLogo>
                        </Typography>
                       
                    </Toolbar>
                </AppBar>
                <Drawer variant="permanent" open={open} sx={open ? styles.drawerStyled : styles.hideDrawer}>
                    <Toolbar sx={styles.toolBarStyled}>
                        <IconButton onClick={toggleDrawer}>
                            <CloseIcon />
                        </IconButton>
                    </Toolbar>
                    <Divider />
                    <List component="nav">
                        <AdminSideBar />
                    </List>
                </Drawer>
                <Box component="main" sx={styles.boxStyled}>
                    <Toolbar />
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/users" element={<ShowUsers />} />
                        <Route path="/ordres" element={<ShowOrders />} />
                        <Route path="/users/add" element={<AddUser />} />

                        <Route path="/products" element={<Products />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/logout" element={<Logout />} />
                  
                    </Routes>
                </Box>
            </Box>
        </>
    );
};

export default AdminDashboard;

const styles = {
    drawerStyled: {
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
        },
    },
    hideDrawer: {
        display: 'none',
    },
    toolBarStyled: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        px: [1],
    },
    boxStyled: {
        flexGrow: 1,
        p: 3,
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
    },
};