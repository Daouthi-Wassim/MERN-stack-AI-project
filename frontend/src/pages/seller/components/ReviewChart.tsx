import React, { useState } from 'react';
import {
    Button,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Divider,
    SvgIcon,
    Box,
    Typography
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Chart from 'react-apexcharts';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ReviewChartData } from '../../../utils/chartData';

interface ChartOptions {
    options: any;
    series: number[];
}

const ReviewChart: React.FC = () => {
    const navigate = useNavigate();
    const [chartData] = useState<ChartOptions & { totalReviews: number }>(ReviewChartData);

    const handleRefresh = () => {
        // Add refresh logic here
        console.log('Refreshing chart data...');
    };

    return (
        <Card sx={{ 
            backgroundImage: "linear-gradient(320deg, rgb(58 163 171 / 32%) 0%, rgb(8 23 198 / 32%) 100%)",
            height: '100%'
        }}>
            <CardHeader
                title="Customer Reviews"
                action={(
                    <Button
                        color="inherit"
                        size="small"
                        startIcon={(
                            <SvgIcon fontSize="small">
                                <RefreshIcon />
                            </SvgIcon>
                        )}
                        onClick={handleRefresh}
                    >
                        Refresh
                    </Button>
                )}
            />
            <CardContent sx={{ 
                display: "flex", 
                justifyContent: 'center', 
                alignItems: "center", 
                height: 310,
                position: 'relative'
            }}>
                <Box sx={{ 
                    position: 'relative', 
                    display: 'inline-flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    width: '100%'
                }}>
                    <ResponsiveChart
                        options={chartData.options}
                        series={chartData.series}
                        type="radialBar"
                    />
                    <Box sx={{ 
                        textAlign: 'center', 
                        mt: 2,
                        position: 'absolute',
                        bottom: -20
                    }}>
                        <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                        >
                            Total Reviews: {chartData.totalReviews}
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
            <Divider />
            <CardActions sx={{ justifyContent: 'flex-end' }}>
                <Button
                    color="inherit"
                    endIcon={(
                        <SvgIcon fontSize="small">
                            <ArrowForwardIcon />
                        </SvgIcon>
                    )}
                    size="small"
                    onClick={() => navigate("/Seller/reviews")}
                >
                    View All Reviews
                </Button>
            </CardActions>
        </Card>
    );
};

export default ReviewChart;

const ResponsiveChart = styled(Chart)`
    width: 100%;
    max-width: 300px;
    margin: 0 auto;

    @media (max-width: 600px) {
        max-width: 250px;
    }
`;