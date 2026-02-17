const ports = ["焼津", "枕崎", "山川"];
const sizes = ["1.8kg上", "2.5kg上", "4.5kg上"];

// テーマごとの配色設定
const themes = {
    dark: {
        text: "#8b949e",
        grid: "rgba(48, 54, 61, 0.3)",
        tooltipBg: "rgba(13, 17, 23, 0.9)"
    },
    light: {
        text: "#656d76",
        grid: "rgba(208, 215, 222, 0.5)",
        tooltipBg: "rgba(255, 255, 255, 0.95)"
    },
    ocean: {
        text: "#aabccf",
        grid: "rgba(0, 77, 153, 0.4)",
        tooltipBg: "rgba(0, 26, 51, 0.95)"
    }
};

const colors = {
    "1.8kg上": { price: "rgba(75, 192, 192, 1)", vol: "rgba(75, 192, 192, 0.2)" },
    "2.5kg上": { price: "rgba(255, 159, 64, 1)", vol: "rgba(255, 159, 64, 0.2)" },
    "4.5kg上": { price: "rgba(153, 102, 255, 1)", vol: "rgba(153, 102, 255, 0.2)" }
};

let currentData = null;
let currentRange = 'all';
let currentTheme = 'dark';
let charts = {};

async function initDashboard() {
    try {
        // スプラッシュ画面の演出（最低1.5秒表示）
        const startTime = Date.now();

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
        setupThemeSwitcher();

        // 読み込み完了後、スプラッシュ画面を消す
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, 1500 - elapsed);
        setTimeout(() => {
            document.getElementById('splash-screen').classList.add('fade-out');
        }, delay);

    } catch (error) {
        console.error('Error initializing dashboard:', error);
        document.getElementById('splash-screen').classList.add('fade-out');
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
    const theme = themes[currentTheme];

    sizes.forEach(size => {
        if (portData && portData[size]) {
            const sizeData = portData[size];
            const pricePoints = sizeData.map(d => ({ x: d.date, y: d.price }));

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

            datasets.push({
                label: `${size} 水揚量`,
                data: sizeData.map(d => ({ x: d.date, y: d.volume })),
                backgroundColor: colors[size].vol.replace('0.2', currentTheme === 'light' ? '0.4' : '0.2'),
                borderColor: colors[size].vol.replace('0.2', '0.5'),
                borderWidth: 1,
                yAxisID: 'yVolume',
                type: 'bar',
                hidden: false
            });
        }
    });

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { position: 'top', labels: { color: theme.text, font: { family: "'Inter', sans-serif" } } },
            tooltip: {
                backgroundColor: theme.tooltipBg,
                titleColor: currentTheme === 'light' ? '#000' : '#58a6ff',
                bodyColor: currentTheme === 'light' ? '#333' : '#e6edf3',
                borderColor: theme.text,
                borderWidth: 1,
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
                grid: { color: theme.grid },
                ticks: { color: theme.text }
            },
            y: {
                title: { display: true, text: '単価 (円/kg)', color: theme.text },
                grid: { color: theme.grid },
                ticks: { color: theme.text },
                position: 'left'
            },
            yVolume: {
                title: { display: true, text: '水揚量 (t)', color: theme.text },
                grid: { display: false },
                ticks: { color: theme.text },
                position: 'right',
                beginAtZero: true
            }
        }
    };

    if (charts[port]) {
        charts[port].data.datasets = datasets;
        charts[port].options = chartOptions;
        charts[port].update();
    } else {
        charts[port] = new Chart(ctx, { data: { datasets }, options: chartOptions });
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

    const refreshBtn = document.getElementById('btn-refresh');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshBtn.textContent = '🔄 更新中...';
            location.reload();
        });
    }
}

function setupThemeSwitcher() {
    const buttons = document.querySelectorAll('.btn-theme');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Bodyのクラスを入れ替え
            document.body.className = `theme-${theme}`;
            currentTheme = theme;

            // グラフを再描画して色を反映
            renderDashboard();
        });
    });
}

function updateInsights() {
    const insightContent = document.getElementById('insight-content');
    if (!currentData || !insightContent) return;

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
        trend = "➡️ **横ばい**: 相場は拮抗しており、現状維持の展開が予想されます。";
    }

    insightContent.innerHTML = `
        <p><strong>現在の市場概況:</strong></p>
        <p>${trend}</p>
        <p>💡 <strong>今後の予想に向けたメモ:</strong> 現在${latest.date}時点のデータまで反映済み。移動平均線（点線）を上抜けるかどうかに注目です。</p>
    `;
}

document.addEventListener('DOMContentLoaded', initDashboard);
