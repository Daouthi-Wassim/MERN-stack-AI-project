export const ChartDatabyYear = {
    options: {
        xaxis: {
            categories: ["2020", "2021", "2022", "2023", "2024", "2025", "2026"],
            axisBorder: { show: true },
            axisTicks: { show: true },
            labels: { show: true }
        },
        yaxis: {
            min: 0,
            max: 45000,
        },
        grid: { show: false },
        chart: {
            sparkline: {
                enabled: false
            },

        }
    },
    series: [{
        name: "series-1",
        data: [100, 170, 200, 450, 300, 400, 500]
    }]
};



export const ReviewChartData = {
    series: [75],
    options: {
        chart: {
            type: 'radialBar',
            height: 350
        },
        plotOptions: {
            radialBar: {
                startAngle: -135,
                endAngle: 135,
                hollow: {
                    margin: 0,
                    size: '70%',
                    background: '#fff',
                    position: 'front',
                    dropShadow: {
                        enabled: true,
                        top: 3,
                        left: 0,
                        blur: 4,
                        opacity: 0.24
                    }
                },
                track: {
                    background: '#fff',
                    strokeWidth: '67%',
                    margin: 0,
                    dropShadow: {
                        enabled: true,
                        top: -3,
                        left: 0,
                        blur: 4,
                        opacity: 0.35
                    }
                },
                dataLabels: {
                    show: true,
                    name: {
                        offsetY: -10,
                        show: true,
                        color: '#888',
                        fontSize: '17px'
                    },
                    value: {
                        formatter: function(val) {
                            return val + "%";
                        },
                        color: '#111',
                        fontSize: '36px',
                        show: true,
                    }
                }
            }
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'dark',
                type: 'horizontal',
                shadeIntensity: 0.5,
                gradientToColors: ['#ABE5A1'],
                inverseColors: true,
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0, 100]
            }
        },
        stroke: {
            lineCap: 'round'
        },
        labels: ['Customer Satisfaction']
    },
    totalReviews: 150
};
export const CustomerFunnelData = {
    series: [{
        name: 'Customer Activity',
        data: [{
                x: "VIP Customers",
                y: 120,
                fillColor: '#7F56DA'
            },
            {
                x: "Regular Buyers",
                y: 435,
                fillColor: '#4ECDC4'
            },
            {
                x: "Active Browsers",
                y: 784,
                fillColor: '#45B7D1'
            },
            {
                x: "New Visitors",
                y: 1200,
                fillColor: '#96C0FF'
            }
        ]
    }],
    options: {
        chart: {
            type: 'funnel',
            toolbar: {
                show: false
            }
        },
        plotOptions: {
            funnel: {
                distributed: true,
                width: '70%',
                height: '75%',
                neckWidth: '30%',
                neckHeight: '25%'
            }
        },
        dataLabels: {
            enabled: true,
            formatter: function(val, opt) {
                return `${opt.w.globals.labels[opt.dataPointIndex]}\n${val}`
            },
            style: {
                fontSize: '14px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontWeight: 600
            },
            dropShadow: {
                enabled: true
            }
        },
        title: {
            text: 'Monthly Customer Activity',
            align: 'center',
            style: {
                fontSize: '16px',
                fontWeight: 600
            }
        },
        animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800,
            animateGradually: {
                enabled: true,
                delay: 150
            }
        },
        legend: {
            show: false
        },
        tooltip: {
            enabled: true,
            y: {
                formatter: function(value) {
                    return value + ' customers'
                }
            }
        }
    },
    analytics: {
        totalCustomers: 2539,
        growthRate: 12.5,
        period: 'Last 30 days',
        conversionRate: 8.4
    }
};
export const updateChartDataWithAIResults = (aiResults, chartData) => {
    const pastSales = aiResults.past_sales;
    const forecasts = aiResults.forecasts;


    const combinedData = [...Object.values(pastSales), ...Object.values(forecasts)];


    chartData.series[0].data = combinedData;
};