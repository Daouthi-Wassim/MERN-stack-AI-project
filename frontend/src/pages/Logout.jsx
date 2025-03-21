import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authLogout } from '../redux/userSlice';
import styled from 'styled-components';
import { updateCustomer } from '../redux/userHandle';

const Logout = () => {
  const { currentUser, currentRole } = useSelector(state => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    // Save customer data before logout
    if (currentRole === "Customer") {
      dispatch(updateCustomer(currentUser, currentUser._id));
    }
  }, [currentRole, currentUser, dispatch]);

  const handleLogout = () => {
    dispatch(authLogout());
    // Redirect based on role
    if (currentRole === "Admin") {
      localStorage.removeItem('adminToken');
      navigate('/admin/login');
    } else {
      navigate('/');
    }
  };

  const handleCancel = () => {
    // Return to appropriate dashboard based on role
    if (currentRole === "Admin") {
      navigate('/admin/dashboard');
    } else if (currentRole === "Seller") {
      navigate('/seller/dashboard');
    } else {
      navigate(-1);
    }
  };

  return (
    <LogoutContainer role={currentRole}>
      <LogoutHeader>Logout {currentRole}</LogoutHeader>
      <UserName>{currentUser?.name}</UserName>
      <LogoutMessage>Are you sure you want to log out?</LogoutMessage>
      <ButtonContainer>
        <LogoutButtonLogout onClick={handleLogout}>Log Out</LogoutButtonLogout>
        <LogoutButtonCancel onClick={handleCancel}>Cancel</LogoutButtonCancel>
      </ButtonContainer>
    </LogoutContainer>
  );
};

export default Logout;

const LogoutContainer = styled.div`
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.2);
  background-color: ${props => 
    props.role === "Admin" ? '#4a366666' : 
    props.role === "Seller" ? '#366c6666' : 
    '#8966c666'};
  color: black;
  max-width: 400px;
  margin: 100px auto;
`;

const LogoutHeader = styled.h1`
  font-size: 24px;
  margin-bottom: 10px;
  color: #333;
`;

const UserName = styled.h2`
  font-size: 20px;
  margin-bottom: 20px;
  color: #666;
`;

const LogoutMessage = styled.p`
  margin-bottom: 20px;
  font-size: 16px;
  text-align: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
`;

const LogoutButton = styled.button`
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 16px;
  color: #fff;
  cursor: pointer;
  border: none;
  transition: background-color 0.3s ease;
`;

const LogoutButtonLogout = styled(LogoutButton)`
  background-color: #ea0606;
  &:hover {
    background-color: #770000;
  }
`;

const LogoutButtonCancel = styled(LogoutButton)`
  background-color: #0505ba;
  &:hover {
    background-color: rgb(10, 2, 69);
  }
`;