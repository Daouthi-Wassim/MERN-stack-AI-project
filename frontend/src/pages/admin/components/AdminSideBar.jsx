import * as React from 'react';
import { Divider, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
//import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import AnalyticsIcon from '@mui/icons-material/Analytics';


const AdminSideBar = () => {
    const location = useLocation();


    return (
        <>
            <React.Fragment>
                <ListItemButton
                    component={Link} to="/admin/dashboard"
                    sx={location.pathname === "/admin/dashboard" ? styles.currentStyle : styles.normalStyle}
                >
                    <ListItemIcon>
                        <DashboardIcon sx={{ color: location.pathname === "/admin/dashboard" ? '#4d1c9c' : 'inherit' }} />
                    </ListItemIcon>
                    <ListItemText primary="Dashboard" />
                </ListItemButton>

                <ListItemButton
                    component={Link} to="/admin/users"
                    sx={location.pathname.startsWith('/admin/users') ? styles.currentStyle : styles.normalStyle}
                >
                    <ListItemIcon>
                        <PeopleIcon sx={{ color: location.pathname.startsWith('/admin/users') ? '#4d1c9c' : 'inherit' }} />
                    </ListItemIcon>
                    <ListItemText primary="Users" />
                </ListItemButton>

                <ListItemButton
                    component={Link} to="/admin/products"
                    sx={location.pathname.startsWith('/admin/products') ? styles.currentStyle : styles.normalStyle}
                >
                    <ListItemIcon>
                        <ShoppingCartIcon sx={{ color: location.pathname.startsWith('/admin/products') ? '#4d1c9c' : 'inherit' }} />
                    </ListItemIcon>
                    <ListItemText primary="Products" />
                </ListItemButton>

                <ListItemButton
                    component={Link} to="/admin/analytics"
                    sx={location.pathname.startsWith('/admin/analytics') ? styles.currentStyle : styles.normalStyle}
                >
                    <ListItemIcon>
                        <AnalyticsIcon sx={{ color: location.pathname.startsWith("/admin/analytics") ? '#4d1c9c' : 'inherit' }} />
                    </ListItemIcon>
                    <ListItemText primary="Analytics" />
                </ListItemButton>

                <ListItemButton
                    component={Link} to="/admin/ordres"
                    sx={location.pathname.startsWith('/admin/ordres') ? styles.currentStyle : styles.normalStyle}
                >
                    <ListItemIcon>
                        <AnalyticsIcon sx={{ color: location.pathname.startsWith("/admin/ordres") ? '#4d1c9c' : 'inherit' }} />
                    </ListItemIcon>
                    <ListItemText primary="Orders" />
                </ListItemButton>
            </React.Fragment>

            <Divider sx={{ my: 1 }} />

            <React.Fragment>
              

                <ListItemButton
                    component={Link} to="/logout"
                    sx={location.pathname.startsWith('/logout') ? styles.currentStyle : styles.normalStyle}
                >
                    <ListItemIcon>
                        <LogoutIcon sx={{ color: location.pathname.startsWith("/logout") ? '#4d1c9c' : 'inherit' }} />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                </ListItemButton>
            </React.Fragment>
        </>
    );
}

export default AdminSideBar;

const styles = {
    normalStyle: {
        color: "inherit",
        backgroundColor: "inherit"
    },
    currentStyle: {
        color: "#4d1c9c",
        backgroundColor: "#ebebeb"
    },
}