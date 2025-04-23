import React from 'react';
import { Box } from '@mui/material';
import { Star, StarBorder, StarHalf } from '@mui/icons-material';

const Rating = ({ value, color = "#FFA41C" }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Box key={star} component="span">
          {value >= star ? (
            <Star sx={{ color }} />
          ) : value >= star - 0.5 ? (
            <StarHalf sx={{ color }} />
          ) : (
            <StarBorder sx={{ color }} />
          )}
        </Box>
      ))}
    </Box>
  );
};

export default Rating;