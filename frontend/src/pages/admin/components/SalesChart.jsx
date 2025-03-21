import React, { useEffect, useState } from 'react';
import {
    Button,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Divider,
    SvgIcon
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import Chart from 'react-apexcharts';
import { ChartDatabyYear, updateChartDataWithAIResults } from '../../../utils/chartData';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const SalesChart = ({ type }) => {
    const navigate = useNavigate();
    const [chartData, setChartData] = useState(ChartDatabyYear);

    useEffect(() => {
      
        const aiModelResultsJSON = `{
            "past_sales": {
                "2022-03": 156,
                "2022-04": 44206,
                "2022-05": 38011,
                "2022-06": 34276
            },
            "forecasts": {
                "2022-07": 29143.83285367777,
                "2022-08": 34933.315790405606,
                "2022-09": 32442.23557261066,
                "2022-10": 33514.0896085078,
                "2022-11": 33052.89567903814,
                "2022-12": 33251.33672927091,
                "2023-01": 33165.95214829265,
                "2023-02": 33202.69115295062,
                "2023-03": 33186.88321142541,
                "2023-04": 33193.6850019908,
                "2023-05": 33190.758349281365,
                "2023-06": 33192.01762005709,
                "2024-03": 33186.88321142541,
                "2024-04": 33193.6850019908,
                "2024-05": 33190.758349281365,
                "2024-06": 33192.01762005709
            }
        }`;

    
        const aiModelResults = JSON.parse(aiModelResultsJSON);
        const updatedChartData = { ...ChartDatabyYear };
        updateChartDataWithAIResults(aiModelResults, updatedChartData);
        setChartData(updatedChartData);
    }, []);

    return (
        <Card sx={{ backgroundImage: "linear-gradient(320deg, rgb(58 163 171 / 32%) 0%, rgb(8 23 198 / 32%) 100%)" }}>
            <CardHeader
                action={(
                    <Button
                        color="inherit"
                        size="small"
                        startIcon={(
                            <SvgIcon fontSize="small">
                                <RefreshIcon />
                            </SvgIcon>
                        )}
                    >
                        Refresh
                    </Button>
                )}
            />
            <CardContent sx={{ display: "flex", justifyContent: 'center', alignItems: "center", height: 310 }}>
                <ResponsiveChart
                    options={chartData.options}
                    series={chartData.series}
                    type={type}
                />
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
                    onClick={() => navigate("/Seller/orders")}
                >
                    Details
                </Button>
            </CardActions>
        </Card>
    );
};

export default SalesChart;


const ResponsiveChart = styled(Chart)`
    width: 550px;

    @media (max-width: 600px) {
        width: 350px;
    }
`;