const ports = ["焼津", "枕崎", "山川"];
const sizes = ["1.8kg上", "2.5kg上", "4.5kg上"];
const colors = {
    "1.8kg上": { price: "rgba(75, 192, 192, 1)", vol: "rgba(75, 192, 192, 0.2)" },
    "2.5kg上": { price: "rgba(255, 159, 64, 1)", vol: "rgba(255, 159, 64, 0.2)" },
    "4.5kg上": { price: "rgba(153, 102, 255, 1)", vol: "rgba(153, 102, 255, 0.2)" }
};

async function initDashboard() {
    try {
        const response = await fetch('../data/katsuo_market_data.json');
        let data;
        if (!response.ok) {
            const fallbackResponse = await fetch('/data/katsuo_market_data.json');
            if (!fallbackResponse.ok) throw new Error('Data not found');
            data = await fallbackResponse.json();
        } else {
            data = await response.json();
        }

        ports.forEach(port => {
            createChart(port, data[port]);
        });
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        document.getElementById('error-msg').style.display = 'block';
    }
}

function createChart(port, portData) {
    const canvasId = `chart-${port}`;
    const ctx = document.getElementById(canvasId).getContext('2d');

    const datasets = [];

    sizes.forEach(size => {
        if (portData && portData[size]) {
            const sizeData = portData[size];

            // 価格の折れ線グラフ
            datasets.push({
                label: `${size} 単価`,
                data: sizeData.map(d => ({ x: d.date, y: d.price })),
                borderColor: colors[size].price,
                backgroundColor: 'transparent',
                tension: 0.3,
                borderWidth: 3,
                yAxisID: 'y',
                type: 'line',
                pointRadius: 4,
                pointHoverRadius: 6
            });

            // 水揚量の棒グラフ (二次軸)
            datasets.push({
                label: `${size} 水揚量`,
                data: sizeData.map(d => ({ x: d.date, y: d.volume })),
                backgroundColor: colors[size].vol,
                borderColor: colors[size].vol.replace('0.2', '0.5'),
                borderWidth: 1,
                yAxisID: 'yVolume',
                type: 'bar',
                hidden: false // 最初から表示する
            });
        }
    });

    new Chart(ctx, {
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#8b949e', font: { family: "'Inter', sans-serif" } }
                },
                tooltip: {
                    backgroundColor: 'rgba(13, 17, 23, 0.9)',
                    titleColor: '#58a6ff',
                    bodyColor: '#e6edf3',
                    borderColor: '#30363d',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.dataset.type === 'line') {
                                label += context.parsed.y + ' 円/kg';
                            } else {
                                label += context.parsed.y + ' t';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: { unit: 'day', displayFormats: { day: 'MM/DD', month: 'YYYY年MM月' } },
                    grid: { color: 'rgba(48, 54, 61, 0.5)', drawBorder: false },
                    ticks: { color: '#8b949e' }
                },
                y: {
                    title: { display: true, text: '単価 (円/kg)', color: '#8b949e' },
                    grid: { color: 'rgba(48, 54, 61, 0.5)', drawBorder: false },
                    ticks: { color: '#8b949e' },
                    position: 'left'
                },
                yVolume: {
                    title: { display: true, text: '水揚量 (t)', color: '#8b949e' },
                    grid: { display: false },
                    ticks: { color: '#8b949e' },
                    position: 'right',
                    beginAtZero: true
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', initDashboard);
