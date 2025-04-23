import React, { useEffect, useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Typography, Box, Button, CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { handleStripePayment } from '../../../redux/userHandle';
import Popup from '../../../components/Popup';
import { removeAllFromCart} from '../../../redux/userSlice';

const PaymentForm = ({ handleBack }) => {
    const stripe = useStripe();
    const elements = useElements();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id: productID } = useParams();

    const { status, currentUser, productDetailsCart } = useSelector(state => state.user);
    const [message, setMessage] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [processing, setProcessing] = useState(false);

    const calculateTotal = () => {
        if (productID) {
            return productDetailsCart?.price?.cost * productDetailsCart?.quantity || 0;
        }
        return currentUser.cartDetails.reduce((total, item) => total + (item.quantity * item.price.cost), 0);
    };

   /* const createOrderData = () => {
        const baseData = {
            buyer: currentUser._id,
            shippingData: currentUser.shippingData,
            paymentInfo: { status: 'Pending' }
        };

        return productID ? {
            ...baseData,
            orderedProducts: [productDetailsCart],
            productsQuantity: productDetailsCart.quantity,
            totalPrice: calculateTotal()
        } : {
            ...baseData,
            orderedProducts: currentUser.cartDetails,
            productsQuantity: currentUser.cartDetails.reduce((total, item) => total + item.quantity, 0),
            totalPrice: calculateTotal()
        };
    };*/
    
    
    const orderId = localStorage.getItem('currentOrderId');
    const orderAmount = parseFloat(localStorage.getItem('orderAmount')) || 0;
  
    const handleSubmit = async (event) => {
        event.preventDefault();
        setProcessing(true);

        if (!stripe || !elements) {
            return;
        }

        try {
          
            const { payload } = await dispatch(handleStripePayment({
              orderId,
              amount: orderAmount * 100,
              currency: 'usd'
            }));
      
            if (!payload.clientSecret) {
              throw new Error('Failed to create payment intent');
            }

            // Confirm card payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        payload.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: currentUser.name,
              email: currentUser.email
            }
          }
        }
      );
      if (error) {
        throw error;
      }

      if (paymentIntent.status === 'succeeded') {
        // Clear stored order info

        localStorage.removeItem('currentOrderId');
        localStorage.removeItem('orderAmount');
        
        // Clear cart
        dispatch(removeAllFromCart());
        
        // Navigate to success page
        navigate('/Aftermath');
      }


    } catch (error) {
        setMessage(error.message || 'Payment failed');
        setShowPopup(true);
      } finally {
        setProcessing(false);
      }
    };

    useEffect(() => {
        if (status === 'added') {
            navigate('/Aftermath');
        }
    }, [status, navigate]);

    return (
        <Box sx={{ maxWidth: 600, margin: '0 auto' }}>
            <Typography variant="h5" gutterBottom>
                Secure Payment
            </Typography>

            <form onSubmit={handleSubmit}>
                <Box sx={{ mb: 3 }}>
                    <CardElement
                        options={{
                            style: {
                                base: {
                                    fontSize: '16px',
                                    color: '#424770',
                                    '::placeholder': { color: '#aab7c4' }
                                },
                                invalid: {
                                    color: '#9e2146'
                                }
                            }
                        }}
                    />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button 
                        variant="outlined" 
                        onClick={handleBack}
                        disabled={processing}
                    >
                        Back
                    </Button>
                    
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={!stripe || processing}
                        startIcon={processing && <CircularProgress size={20} />}
                    >
                        {processing ? 'Processing...' : `Pay $${calculateTotal().toFixed(2)}`}
                    </Button>
                </Box>
            </form>

            <Popup 
                message={message} 
                showPopup={showPopup} 
                setShowPopup={setShowPopup} 
            />
        </Box>
    );
};

export default PaymentForm;