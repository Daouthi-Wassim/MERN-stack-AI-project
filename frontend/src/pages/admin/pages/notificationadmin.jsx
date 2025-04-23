import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Paper,
  Divider,
  Chip,
  Alert
} from '@mui/material';
import {
  ShoppingCart as OrderIcon,
  Person as UserIcon,
  Assignment as ReturnIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  Notifications as SystemIcon,
  Email as EmailIcon,
  NotificationsActive as UnreadIcon,
  NotificationsOff as ReadIcon
} from '@mui/icons-material';
import { api } from '../../../redux/userHandle';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/notifications');
      console.log('Notifications:', response.data);
      setNotifications(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type, channel) => {
    if (channel === 'email') return <EmailIcon color="primary" />;
    
    switch (type) {
      case 'order':
        return <OrderIcon color="primary" />;
      case 'user':
        return <UserIcon color="secondary" />;
      case 'return':
        return <ReturnIcon color="warning" />;
      case 'payment':
        return <PaymentIcon color="success" />;
      case 'system':
        return <SystemIcon color="info" />;
      default:
        return null;
    }
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await api.delete(`/admin/notifications/${notificationId}`);
      setNotifications(notifications.filter(notif => notif._id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/admin/getAdminnotif/${notificationId}`, { lue: true });
      setNotifications(notifications.map(notif => 
        notif._id === notificationId ? { ...notif, lue: true } : notif
      ));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  if (loading) return <Typography>Loading notifications...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Notifications
        <Chip 
          sx={{ ml: 2 }}
          label={`${notifications.filter(n => !n.lue).length} unread`}
          color="primary"
          size="small"
        />
      </Typography>

      <Paper elevation={3}>
        <List>
          {notifications.map((notification, index) => (
            <React.Fragment key={notification._id}>
              {index > 0 && <Divider />}
              <ListItem
                sx={{ 
                  bgcolor: notification.lue ? 'inherit' : 'action.hover',
                  transition: 'background-color 0.3s'
                }}
                secondaryAction={
                  <Box>
                    <IconButton
                      onClick={() => markAsRead(notification._id)}
                      sx={{ mr: 1 }}
                      disabled={notification.lue}
                    >
                      {notification.lue ? <ReadIcon /> : <UnreadIcon color="primary" />}
                    </IconButton>
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={() => handleDelete(notification._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemIcon>
                  {getNotificationIcon(notification.type, notification.channel)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>
                        {notification.type}
                      </Typography>
                      {notification.isSystemGenerated && 
                        <Chip size="small" label="System" color="info" />
                      }
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(notification.createdAt).toLocaleString()}
                      </Typography>
                      <Chip 
                        size="small"
                        label={notification.status}
                        color={getStatusChipColor(notification.status)}
                      />
                    </Box>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
          {notifications.length === 0 && (
            <ListItem>
              <ListItemText primary="No notifications found" />
            </ListItem>
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default Notifications;