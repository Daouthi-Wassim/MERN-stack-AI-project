import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../redux/userSlice';
import styled from 'styled-components';
import { BasicButton } from '../utils/buttonStyles';
import { getProductDetails, updateStuff } from '../redux/userHandle';
import { 
    Avatar, 
    Card, 
    IconButton, 
    Menu, 
    MenuItem, 
    Typography,
    Box,
     CircularProgress
} from '@mui/material';
import { generateRandomColor, timeAgo } from '../utils/helperFunctions';
import { MoreVert } from '@mui/icons-material';
import Rating from '../components/Rating';
import axios from 'axios';
import Slide from './Slide';
const ViewProduct = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const params = useParams();
    const productID = params.id;
    const [similarProductsLoading, setSimilarProductsLoading] = useState(false);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [avgRating, setAvgRating] = useState(0);
    const [anchorElMenu, setAnchorElMenu] = useState(null);

    const { currentUser, currentRole, productDetails, loading, responseDetails } = useSelector(state => state.user);

    useEffect(() => {
        const fetchSimilarProducts = async () => {
            if (productDetails?.category) {
                setSimilarProductsLoading(true);
                try {
                    const response = await axios.post(
                        'http://localhost:8000/content-recommendations',
                        {
                            search_term:productDetails.description
                        }
                    );
                     
                    const productsWithRatings = response.data.recommendations.map(product => ({
                        ...product,
                        avgRating: product.reviews?.reduce((acc, review) => acc + review.rating, 0) / 
                                  (product.reviews?.length || 1) || 0
                    }));
                    
                    setSimilarProducts(productsWithRatings);
                } catch (error) {
                    console.error('Error fetching similar products:', error);
                    setSimilarProducts([]);
                } finally {
                    setSimilarProductsLoading(false);
                }
            }
        };

        

        fetchSimilarProducts();
    }, [productDetails]);

    useEffect(() => {
        dispatch(getProductDetails(productID));
    }, [productID, dispatch]);

    const handleOpenMenu = (event) => {
        setAnchorElMenu(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorElMenu(null);
    };

    const deleteHandler = (reviewId) => {
        const fields = { reviewId };
        dispatch(updateStuff(fields, productID, "deleteProductReview"));
    };

    const reviewer = currentUser && currentUser._id;

    return (
        <>
            {loading ? (
                <div>Loading...</div>
            ) : (
                <>
                    {responseDetails ? (
                        <div>Product not found</div>
                    ) : (
                        <>
                            <ProductContainer>
                                <ProductImage 
                                    src={productDetails?.productImage} 
                                    alt={productDetails?.productName} 
                                />
                                <ProductInfo>
                                    <ProductName>{productDetails?.productName}</ProductName>
                                    <PriceContainer>
                                        <PriceCost>TND {productDetails?.price?.cost}</PriceCost>
                                        <PriceMrp>TND {productDetails?.price?.mrp}</PriceMrp>
                                        <PriceDiscount>
                                            {productDetails?.price?.discountPercent}% off
                                        </PriceDiscount>
                                    </PriceContainer>
                                    <RatingContainer>
                                        <Rating value={avgRating} />
                                        <span>({productDetails?.reviews?.length || 0} reviews)</span>
                                    </RatingContainer>
                                    <Description>{productDetails?.description}</Description>
                                    <ProductDetails>
                                        <p>Category: {productDetails?.category}</p>
                                        <p>Subcategory: {productDetails?.subcategory}</p>
                                    </ProductDetails>
                                </ProductInfo>
                            </ProductContainer>

                            {currentRole === "Customer" && (
                                <ButtonContainer>
                                    <BasicButton onClick={() => dispatch(addToCart(productDetails))}>
                                        Add to Cart
                                    </BasicButton>
                                </ButtonContainer>
                            )}

                            <ReviewWritingContainer>
                                <Typography variant="h4">Reviews</Typography>
                            </ReviewWritingContainer>

                            {productDetails?.reviews?.length > 0 ? (
                                <ReviewContainer>
                                    {productDetails.reviews.map((review, index) => (
                                        <ReviewCard key={index}>
                                            <ReviewCardDivision>
                                                <Avatar 
                                                    sx={{ 
                                                        width: "60px", 
                                                        height: "60px", 
                                                        marginRight: "1rem",
                                                        backgroundColor: generateRandomColor(review._id) 
                                                    }}
                                                >
                                                    {String(review.reviewer.name).charAt(0)}
                                                </Avatar>
                                                <ReviewDetails>
                                                    <Typography variant="h6">
                                                        {review.reviewer.name}
                                                    </Typography>
                                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                                                        <Typography variant="body2">
                                                            {timeAgo(review.date)}
                                                        </Typography>
                                                    </div>
                                                    <Rating value={review.rating} />
                                                    <Typography variant="body1">
                                                        {review.comment}
                                                    </Typography>
                                                </ReviewDetails>
                                                {review.reviewer._id === reviewer && (
                                                    <>
                                                        <IconButton 
                                                            onClick={handleOpenMenu} 
                                                            sx={{ width: "4rem", color: 'inherit', p: 0 }}
                                                        >
                                                            <MoreVert sx={{ fontSize: "2rem" }} />
                                                        </IconButton>
                                                        <Menu
                                                            id="menu-appbar"
                                                            anchorEl={anchorElMenu}
                                                            anchorOrigin={{
                                                                vertical: 'bottom',
                                                                horizontal: 'left',
                                                            }}
                                                            keepMounted
                                                            transformOrigin={{
                                                                vertical: 'top',
                                                                horizontal: 'left',
                                                            }}
                                                            open={Boolean(anchorElMenu)}
                                                            onClose={handleCloseMenu}
                                                            onClick={handleCloseMenu}
                                                        >
                                                            <MenuItem onClick={handleCloseMenu}>
                                                                <Typography textAlign="center">Edit</Typography>
                                                            </MenuItem>
                                                            <MenuItem onClick={() => {
                                                                deleteHandler(review._id);
                                                                handleCloseMenu();
                                                            }}>
                                                                <Typography textAlign="center">Delete</Typography>
                                                            </MenuItem>
                                                        </Menu>
                                                    </>
                                                )}
                                            </ReviewCardDivision>
                                        </ReviewCard>
                                    ))}
                                </ReviewContainer>
                            ) : (
                                <ReviewWritingContainer>
                                    <Typography variant="h6">
                                        No Reviews Found. Add a review.
                                    </Typography>
                                </ReviewWritingContainer>
                            )}

{similarProductsLoading ? (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
    </Box>
) : similarProducts.length > 0 ? (
    <Box sx={{ background: '#f5f5f5', padding: '20px 0' }}>
        <Slide 
            products={similarProducts} 
            title="Similar Products" 
        />
    </Box>
) : (
    <Box sx={{ textAlign: 'center', py: 3 }}>
        <Typography variant="body1" color="text.secondary">
            No similar products found
        </Typography>
    </Box>
)}
                        </>
                    )}
                </>
            )}
        </>
    );
};

// Styled Components
const ProductContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin: 20px;
    justify-content: center;
    align-items: center;
    @media (min-width: 768px) {
        flex-direction: row;
    }
`;

const ProductImage = styled.img`
    max-width: 300px;
    margin-bottom: 20px;
`;

const ProductInfo = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0 20px;
`;

const ProductName = styled.h1`
    font-size: 24px;
    margin-bottom: 16px;
`;

const PriceContainer = styled.div`
    display: flex;
    gap: 8px;
    margin-top: 8px;
    align-items: center;
`;

const PriceMrp = styled.p`
    text-decoration: line-through;
    color: #525050;
`;

const PriceCost = styled.h3`
    color: #1a73e8;
`;

const PriceDiscount = styled.p`
    color: #0f9d58;
`;

const Description = styled.p`
    margin: 16px 0;
    line-height: 1.6;
`;

const ProductDetails = styled.div`
    margin: 16px 0;
`;

const ButtonContainer = styled.div`
    margin: 16px;
    display: flex;
    justify-content: center;
`;

const RatingContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 8px 0;
`;

const ReviewWritingContainer = styled.div`
    margin: 6rem;
    display: flex;
    gap: 2rem;
    justify-content: center;
    align-items: center;
    flex-direction: column;
`;

const ReviewContainer = styled.div`
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
`;

const ReviewCard = styled(Card)`
    && {
        background-color: white;
        margin-bottom: 2rem;
        padding: 1rem;
    }
`;

const ReviewCardDivision = styled.div`
    display: flex;
    align-items: flex-start;
    margin-bottom: 1rem;
`;

const ReviewDetails = styled.div`
    flex: 1;
    padding: 0 16px;
`;

const SimilarProductsSection = styled.div`
    margin: 2rem auto;
    padding: 1rem;
    max-width: 1200px;
`;

export default ViewProduct;