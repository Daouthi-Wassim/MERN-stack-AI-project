import React, { useEffect, useState } from 'react';
import { Box, Container, styled } from '@mui/material';
import Slide from './Slide';
import Banner from './Banner';
import { useDispatch, useSelector } from 'react-redux';
import { getProducts } from '../redux/userHandle';
import ProductsMenu from './customer/components/ProductsMenu';
import { NewtonsCradle } from '@uiball/loaders';
import { Link } from 'react-router-dom';

const Home = () => {
  const adURL =
    'https://th.bing.com/th/id/R.5c620898c45fca78602864623b251ffc?rik=lcchfNLhDRou9g&riu=http%3a%2f%2flaviedelisa.l.a.pic.centerblog.net%2fthxtrv2m.gif&ehk=Y8%2bThqv%2fwlmfIWrDDLMS4eChodK%2bsyrhELhLducZLbA%3d&risl=&pid=ImgRaw&r=0';

  const dispatch = useDispatch();

  const { productData, responseProducts, error } = useSelector((state) => state.user);

  const [showNetworkError, setShowNetworkError] = useState(false);

  useEffect(() => {
    dispatch(getProducts());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      const timeoutId = setTimeout(() => {
        setShowNetworkError(true);
      }, 40000);

      return () => clearTimeout(timeoutId);
    }
  }, [error]);

  return (
    <div id="top">
      <Container
        sx={{
          display: 'none',
          '@media (max-width: 600px)': {
            display: 'flex',
          },
        }}
      >
        <ProductsMenu dropName="Categories" />
        <ProductsMenu dropName="Products" />
        
      </Container>
      <BannerBox>
        <Banner />
      </BannerBox>

      {showNetworkError ? (
        <StyledContainer>
          <h1>Sorry, network error.</h1>
        </StyledContainer>
      ) : error ? (
        <StyledContainer>
          <h1>Please Wait A Second</h1>
          <NewtonsCradle size={70} speed={1.4} color="black" />
        </StyledContainer>
      ) : (
        <>
          {responseProducts ? (
            <>
              <StyledContainer>No products found right now</StyledContainer>
              <StyledContainer>
                Become a seller to add products
                <Link to={"/Sellerregister"}>
                  Join
                </Link>
              </StyledContainer>
            </>
          ) : (
            <>
              <Component>
                <LeftComponent>
                  <Slide products={productData} title= "For you"/>
                </LeftComponent>
                  <hr/>
                <RightComponent>
                  <img src={adURL} alt="" style={{ width: 217 }} />
                </RightComponent>
              </Component>

              <Slide products={productData} title="Top Selection" /><hr />
              <Slide products={productData} title="Discounts for You" /><hr />
              <Slide products={productData} title="Recommended Items" /><hr />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Home;

const StyledContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  justify-content: center;
  align-items: center;
`;

const BannerBox = styled(Box)`
  padding: 20px 10px;
  background:rgb(55, 11, 86);
`;

const Component = styled(Box)`
  display: flex;
`;

const LeftComponent = styled(Box)(({ theme }) => ({
  width: '85%',
  [theme.breakpoints.down('md')]: {
    width: '100%',
  },
}));

const RightComponent = styled(Box)(({ theme }) => ({
  marginTop: 10,
  background: '#FFFFFF',
  width: '17%',
  marginLeft: 10,
  padding: 5,
  textAlign: 'center',
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));
