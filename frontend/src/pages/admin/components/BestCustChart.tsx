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
    Typography,
    Stack
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import StarIcon from '@mui/icons-material/Star';
import Chart from 'react-apexcharts';
import styled from 'styled-components';

const bestCustomerData = {
    series: [{
        name: 'Purchase Value',
        data: [
            { x: "Hadil Khouni", y: 5200, avatar: "JD" },
            { x: "Alice Smith", y: 4800, avatar: "AS" },
            { x: "Bob Johnson", y: 4500, avatar: "BJ" },
            { x: "Emma Wilson", y: 4200, avatar: "EW" },
            { x: "Mike Brown", y: 4000, avatar: "MB" }
        ]
    }],
    options: {
        chart: {
            type: 'bar',
            toolbar: { show: false }
        },
        plotOptions: {
            bar: {
                horizontal: true,
                barHeight: '70%',
                distributed: true,
                dataLabels: {
                    position: 'bottom'
                }
            }
        },
        colors: ['#7F56DA', '#4ECDC4', '#45B7D1', '#96C0FF', '#FFB547'],
        dataLabels: {
            enabled: true,
            textAnchor: 'start',
            style: {
                colors: ['#333']
            },
            formatter: function(val: number) {
                return `$${val}`;
            },
            offsetX: 0
        },
        xaxis: {
            categories: ['Hadil K.', 'Alice S.', 'Bob J.', 'Emma W.', 'Mike B.'],
            labels: {
                show: true
            }
        },
        yaxis: {
            labels: {
                show: false
            }
        },
        grid: {
            show: false
        },
        tooltip: {
            theme: 'dark',
            y: {
                formatter: function(val: number) {
                    return `$${val} total purchases`;
                }
            }
        }
    },
    analytics: {
        totalSpent: 22700,
        period: 'Last 30 days',
        growth: 15.8
    }
};

const BestCustChart: React.FC = () => {
    const [chartData] = useState(bestCustomerData);

    const handleRefresh = () => {
        console.log('Refreshing best customers data...');
    };

    return (
        <Card sx={{ 
            backgroundImage: "linear-gradient(320deg, rgb(58 163 171 / 32%) 0%, rgb(8 23 198 / 32%) 100%)",
            height: '100%'
        }}>
            <CardHeader
                title="Top Customers"
                subheader={`Total spent: $${chartData.analytics.totalSpent.toLocaleString()} | ${chartData.analytics.period}`}
                action={(
                    <Button
                        color="inherit"
                        size="small"
                        startIcon={<SvgIcon fontSize="small"><RefreshIcon /></SvgIcon>}
                        onClick={handleRefresh}
                    >
                        Refresh
                    </Button>
                )}
            />
            <CardContent sx={{ 
                display: "flex", 
                flexDirection: "column",
                alignItems: "center", 
                height: 310
            }}>
                <Box sx={{ width: '100%' }}>
                    <ResponsiveChart
                        options={chartData.options}
                        series={chartData.series}
                        type="bar"
                        height="280"
                    />
                </Box>
            </CardContent>
            <Divider />
            <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <StarIcon color="warning" fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                        Top Customer:
                    </Typography>
                    <Typography variant="body2" fontWeight="600">
                        Hadil Khouni
                    </Typography>
                </Stack>
                <Typography variant="subtitle2" color="success.main">
                    +{chartData.analytics.growth}% spending
                </Typography>
            </CardActions>
        </Card>
    );
};

export default BestCustChart;

const ResponsiveChart = styled(Chart)`
    width: 100%;
    max-width: 500px;
    margin: 0 auto;

    @media (max-width: 600px) {
        max-width: 450px;
    }
`;