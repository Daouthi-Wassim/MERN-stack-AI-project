import * as React from 'react';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { NavLogo } from '../utils/styles';
import { Link, useNavigate } from 'react-router-dom';
import TwitterIcon from '@mui/icons-material/Twitter';
import YouTubeIcon from '@mui/icons-material/YouTube';
import LocalMallIcon from '@mui/icons-material/LocalMall';
const Footer = () => {
     const navigate = useNavigate()
  const homeHandler = () => {
    navigate("/");
  };

  return (
    <Container maxWidth="xl" sx={{ backgroundColor: "#4d1c9c", color: "white", padding: "2rem 0" }}>
      <Toolbar >
        
          <Typography
            variant="h6"
            noWrap
            sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
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
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2  }}>
          <Link to="https://twitter.com" target="_blank" rel="noopener noreferrer">
          <TwitterIcon sx={{ color: 'white', fontSize: 30 }} />
        </Link>
        <Link to="https://youtube.com" target="_blank" rel="noopener noreferrer">
          <YouTubeIcon sx={{ color: 'white', fontSize: 30 }} />
          </Link>
      </Box>

        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'space-around' }}>
        
          <div className="text-center md:text-left">
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
            <li> <Link to="/">
            About Us
                </Link></li>
                <li> <Link to="/">
                Our Offers
                </Link></li>
                <li> <Link to="/">
                Our Support
                </Link></li>
       
            </ul>
          </div>

         
          <div className="text-center md:text-left">
            <h3 className="text-xl font-semibold mb-4">Additional Links</h3>
            <ul className="space-y-2">
              <li> <Link to="/">
              Privacy Policy
                </Link></li>
                <li> <Link to="/">
                Terms of Service
                </Link></li>
                <li> <Link to="/">
                Contact Us
                </Link></li>
            
            </ul>
          </div>
          </Box>
          </Toolbar>
     <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem 0' }}>
        <Typography variant="body2" color="inherit">
          &copy; {new Date().getFullYear()} SHOPPINGI All rights reserved.
        </Typography>
        </Box>
      
     

    </Container>
  );
}

export default Footer;