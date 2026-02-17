const ports = ["焼津", "枕崎", "山川"];
const sizes = ["1.8kg上", "2.5kg上", "4.5kg上"];
const colors = {
    "1.8kg上": { price: "rgba(75, 192, 192, 1)", vol: "rgba(75, 192, 192, 0.2)" },
    "2.5kg上": { price: "rgba(255, 159, 64, 1)", vol: "rgba(255, 159, 64, 0.2)" },
    "4.5kg上": { price: "rgba(153, 102, 255, 1)", vol: "rgba(153, 102, 255, 0.2)" }
};

let currentData = null;
let currentRange = 'all'; // 'all', '30', '7'
let charts = {};

async function initDashboard() {
    try {
        const response = await fetch('../data/katsuo_market_data.json');
        if (!response.ok) {
            const fallbackResponse = await fetch('/data/katsuo_market_data.json');
            if (!fallbackResponse.ok) throw new Error('Data not found');
            currentData = await fallbackResponse.json();
        } else {
            currentData = await response.json();
        }

        renderDashboard();
        updateInsights();
        setupFilters();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        if (document.getElementById('error-msg')) {
            document.getElementById('error-msg').style.display = 'block';
        }
    }
}

function renderDashboard() {
    ports.forEach(port => {
        const filteredPortData = filterDataByRange(currentData[port], currentRange);
        updateOrCreateChart(port, filteredPortData);
    });
}

function filterDataByRange(portData, range) {
    if (!portData || range === 'all') return portData;

    const now = moment();
    const result = {};

    sizes.forEach(size => {
        if (portData[size]) {
            result[size] = portData[size].filter(d => {
                const date = moment(d.date);
                return now.diff(date, 'days') <= parseInt(range);
            });
        }
    });
    return result;
}

function calculateMovingAverage(data, windowSize = 5) {
    return data.map((val, index, array) => {
        const start = Math.max(0, index - windowSize + 1);
        const sub = array.slice(start, index + 1);
        const sum = sub.reduce((a, b) => a + b.y, 0);
        return { x: val.x, y: Math.round(sum / sub.length) };
    });
}

function updateOrCreateChart(port, portData) {
    const canvasId = `chart-${port}`;
    const ctx = document.getElementById(canvasId).getContext('2d');
    const datasets = [];

    sizes.forEach(size => {
        if (portData && portData[size]) {
            const sizeData = portData[size];
            const pricePoints = sizeData.map(d => ({ x: d.date, y: d.price }));

            // 移動平均線 (点線)
            datasets.push({
                label: `${size} 5日移動平均`,
                data: calculateMovingAverage(pricePoints, 5),
                borderColor: colors[size].price,
                borderDash: [5, 5],
                borderWidth: 2,
                pointRadius: 0,
                fill: false,
                tension: 0.4,
                yAxisID: 'y',
                type: 'line'
            });

            // 価格の折れ線グラフ
            datasets.push({
                label: `${size} 単価`,
                data: pricePoints,
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
                hidden: false
            });
        }
    });

    if (charts[port]) {
        charts[port].data.datasets = datasets;
        charts[port].update();
    } else {
        charts[port] = new Chart(ctx, {
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { position: 'top', labels: { color: '#8b949e' } },
                    tooltip: {
                        backgroundColor: 'rgba(13, 17, 23, 0.9)',
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (context.dataset.type === 'line') {
                                    return label + ': ' + context.parsed.y + ' 円/kg';
                                } else {
                                    return label + ': ' + context.parsed.y + ' t';
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: { unit: 'day', displayFormats: { day: 'MM/DD' } },
                        grid: { color: 'rgba(48, 54, 61, 0.3)' },
                        ticks: { color: '#8b949e' }
                    },
                    y: {
                        title: { display: true, text: '単価 (円/kg)', color: '#8b949e' },
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
}

function setupFilters() {
    const buttons = document.querySelectorAll('.btn-filter');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRange = btn.dataset.range;
            renderDashboard();
        });
    });
}

function updateInsights() {
    const insightContent = document.getElementById('insight-content');
    if (!currentData || !insightContent) return;

    // 簡易的な初期分析エンジンの例
    // 焼津の4.5kgを例に直近トレンドを判定
    const yaizu45 = currentData["焼津"]["4.5kg上"];
    if (!yaizu45 || yaizu45.length < 2) return;

    const latest = yaizu45[yaizu45.length - 1];
    const prev = yaizu45[yaizu45.length - 2];

    let trend = "";
    if (latest.price > prev.price) {
        trend = "📈 **上昇傾向**: 直近の水揚量減少に伴い、単価が反発しています。";
    } else if (latest.price < prev.price) {
        trend = "📉 **下落傾向**: 水揚が安定しており、単価は落ち着いた動きを見せています。";
    } else {
        trend = "➡️ **横ばい**: 相場は拮抗しており、しばらくは現状維持の展開が予想されます。";
    }

    insightContent.innerHTML = `
        <p><strong>現在の市場概況:</strong></p>
        <p>${trend}</p>
        <p>💡 <strong>今後の予想に向けたメモ:</strong> 現在${latest.date}時点のデータまで反映済み。水揚量（棒グラフ）の増加後に価格が下がる傾向が確認できれば、より高精度な予測が可能になります。移動平均線（点線）を上抜けるかどうかに注目です。</p>
    `;
}

document.addEventListener('DOMContentLoaded', initDashboard);
