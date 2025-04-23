import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DataGrid, 
  GridToolbar,
  GridActionsCellItem 
} from '@mui/x-data-grid';
import { 
  Box, 
  Tabs, 
  Tab, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  TextField,
  Alert,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
//import seller from'../components/SellerDetails';
//import customer from'../components/CustomerDetails';
import { Delete, PersonAdd,
  Store,
  ShoppingCart  } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { 
  getUsers, 
  deleteUser, 
  createUser 
} from '../../../redux/userHandle';

const ShowUsers = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { usersList, loading, error } = useSelector(state => state.user);
  const [tabValue, setTabValue] = useState('admins');
  const [openDialog, setOpenDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    phone: '',
    address: '',
    company: '',
    shopName: '',
    description: '',
    category: '',
    subCategory: '',
    website: ''
  });

 

  const loadUsers = useCallback(async () => {
    try {
      const response = await dispatch(getUsers(tabValue)).unwrap();
      console.log('Users loaded:', response);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }, [dispatch, tabValue]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleViewDetails = (userId) => {
    const userType = tabValue.slice(0, -1);
    if (userType === 'seller') {
      navigate(`/admin/Seller/${userId}`, { 
        state: { 
          sections: ['profile', 'products', 'reviews', 'orders', 'revenue']
        }
      });
    } else if (userType === 'customer') {
      navigate(`/admin/getallcusdetails/${userId}`, {
        state: {
          sections: ['profile', 'orders', 'cart', 'satisfaction']
        }
      });
    }
  };

  const handleDelete = (id) => {
    if(window.confirm('Are you sure you want to delete this user?')) {
      dispatch(deleteUser(tabValue.slice(0, -1), id))
        .then(() => {
          loadUsers();
        })
        .catch((error) => {
          console.error('Error deleting user:', error);
        });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = {
        ...newUser,
        role: tabValue.slice(0, -1)
      };

      // Remove unnecessary fields based on role
      if (tabValue === 'admins') {
        delete userData.phone;
        delete userData.address;
        delete userData.company;
        delete userData.shopName;
        delete userData.description;
        delete userData.category;
        delete userData.subCategory;
        delete userData.website;
      } else if (tabValue === 'customers') {
        delete userData.company;
        delete userData.shopName;
        delete userData.description;
        delete userData.category;
        delete userData.subCategory;
        delete userData.website;
      }

      await dispatch(createUser(tabValue.slice(0, -1), userData));
      setOpenDialog(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'admin',
        phone: '',
        address: '',
        company: '',
        shopName: '',
        description: '',
        category: '',
        subCategory: '',
        website: ''
      });
      loadUsers();
    } catch (err) {
      console.error('Error creating user:', err);
    }
  };

  const getUserFields = () => {
    const commonFields = (
      <>
        <TextField
          fullWidth
          label="Full Name"
          margin="normal"
          required
          value={newUser.name}
          onChange={(e) => setNewUser({...newUser, name: e.target.value})}
        />
        <TextField
          fullWidth
          type="email"
          label="Email"
          margin="normal"
          required
          value={newUser.email}
          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
        />
        <TextField
          fullWidth
          type="password"
          label="Password"
          margin="normal"
          required
          value={newUser.password}
          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
        />
      </>
    );

    if (tabValue === 'sellers') {
      return (
        <>
          {commonFields}
          <TextField
            fullWidth
            label="Shop Name"
            margin="normal"
            required
            value={newUser.shopName}
            onChange={(e) => setNewUser({...newUser, shopName: e.target.value})}
          />
          <TextField
            fullWidth
            label="Company"
            margin="normal"
            required
            value={newUser.company}
            onChange={(e) => setNewUser({...newUser, company: e.target.value})}
          />
          <TextField
            fullWidth
            label="Phone"
            margin="normal"
            required
            value={newUser.phone}
            onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
          />
          <TextField
            fullWidth
            label="Address"
            margin="normal"
            required
            value={newUser.address}
            onChange={(e) => setNewUser({...newUser, address: e.target.value})}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select
              value={newUser.category}
              label="Category"
              onChange={(e) => setNewUser({...newUser, category: e.target.value})}
            >
              <MenuItem value="electronics">Electronics</MenuItem>
              <MenuItem value="clothing">Clothing</MenuItem>
              <MenuItem value="food">Food</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Website"
            margin="normal"
            value={newUser.website}
            onChange={(e) => setNewUser({...newUser, website: e.target.value})}
          />
          <TextField
            fullWidth
            label="Description"
            margin="normal"
            multiline
            rows={3}
            value={newUser.description}
            onChange={(e) => setNewUser({...newUser, description: e.target.value})}
          />
        </>
      );
    }

    if (tabValue === 'customers') {
      return (
        <>
          {commonFields}
          <TextField
            fullWidth
            label="Phone"
            margin="normal"
            required
            value={newUser.phone}
            onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
          />
          <TextField
            fullWidth
            label="Address"
            margin="normal"
            required
            value={newUser.address}
            onChange={(e) => setNewUser({...newUser, address: e.target.value})}
          />
        </>
      );
    }

    return commonFields;
  };

  const columns = [
    { field: '_id', headerName: 'ID', width: 220 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'email', headerName: 'Email', width: 250 },
    { 
      field: 'createdAt', 
      headerName: 'Created At', 
      width: 200,
      //valueFormatter: (params) => new Date(params.value).toLocaleDateString() 
    },
    ...(tabValue === 'sellers' ? [
      { field: 'shopName', headerName: 'Shop Name', width: 200 },
      { field: 'company', headerName: 'Company', width: 200 }
    ] : []),
    ...(tabValue !== 'admins' ? [
      { field: 'phone', headerName: 'Phone', width: 150 }
    ] : []),
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          icon={
            <Tooltip title="View Details">
              <IconButton size="small">
                {tabValue === 'sellers' ? <Store /> : <ShoppingCart />}
              </IconButton>
            </Tooltip>
          }
          onClick={() => handleViewDetails(params.id)}
          label="View Details"
        />,
        <GridActionsCellItem
        icon={
          <Tooltip title="Delete">
            <IconButton size="small" color="error">
              <Delete />
            </IconButton>
          </Tooltip>
        }
        onClick={() => handleDelete(params.id)}
        label="Delete"
      />
      ]
    }
  ];
  const getGridRows = () => {
    if (!usersList) return [];
    return Array.isArray(usersList) ? usersList : 
           usersList.users ? usersList.users :
           usersList.data ? usersList.data : [];
  };

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        mb: 3,
        borderBottom: 1, 
        borderColor: 'divider' 
      }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
        >
          <Tab label="Admins" value="admins" />
          <Tab label="Sellers" value="sellers" />
          <Tab label="Customers" value="customers" />
        </Tabs>
        
        <Button 
          variant="contained" 
          startIcon={<PersonAdd />}
          onClick={() => setOpenDialog(true)}
        >
          Add {tabValue.slice(0, -1)}
        </Button>
      </Box>

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={getGridRows()}
          columns={columns}
          loading={loading}
          getRowId={(row) => row._id}
          components={{ Toolbar: GridToolbar }}
          disableSelectionOnClick
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Box>

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
       <DialogTitle>
          Add New {tabValue.slice(0, -1)}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            {getUserFields()}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
            >
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ShowUsers;