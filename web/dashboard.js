const ports = ["枕崎", "焼津", "山川"];

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

// 基本の配色（定義外のサイズが来たらランダムまたは生成）
const baseColors = [
    "rgba(75, 192, 192, 1)",   // 1.8kg相当
    "rgba(255, 159, 64, 1)",   // 2.5kg相当
    "rgba(153, 102, 255, 1)",  // 4.5kg相当
    "rgba(255, 99, 132, 1)",
    "rgba(54, 162, 235, 1)",
    "rgba(255, 206, 86, 1)",
    "rgba(231, 76, 60, 1)",
    "rgba(46, 204, 113, 1)"
];

let currentData = null;
let currentRange = 'all';
let currentTheme = 'dark';
let activeTab = 'summary';
let charts = {};

async function initDashboard() {
    try {
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
        renderSummary(); // 最新一覧の描画
        updateInsights();
        setupFilters();
        setupThemeSwitcher();
        setupTabs();

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

// 三拠点の最新相場一覧（サマリー）を描画する関数
function renderSummary() {
    const container = document.getElementById('summary-container');
    if (!container || !currentData) return;

    container.innerHTML = '';

    ports.forEach(port => {
        const portData = currentData[port];
        if (!portData) return;

        // 全サイズの中から最も新しい取引日を探す
        const availableSizes = Object.keys(portData);
        let latestDateStr = "";
        availableSizes.forEach(size => {
            if (portData[size] && portData[size].length > 0) {
                const date = portData[size][portData[size].length - 1].date;
                if (!latestDateStr || date > latestDateStr) latestDateStr = date;
            }
        });

        if (!latestDateStr) return;

        const card = document.createElement('div');
        card.className = 'summary-card';

        let rowsHtml = '';
        // JSONに含まれるすべてのサイズをループ
        availableSizes.forEach(size => {
            const dataArr = portData[size] || [];
            const latestEntry = dataArr.find(v => v.date === latestDateStr);
            const prevEntry = dataArr.length > 1 ? (latestEntry ? dataArr[dataArr.length - 2] : dataArr[dataArr.length - 1]) : null;

            let priceHtml = '-';
            let diffHtml = '';

            if (latestEntry) {
                priceHtml = `${latestEntry.price}`;
                if (prevEntry) {
                    const diff = latestEntry.price - prevEntry.price;
                    if (diff > 0) {
                        diffHtml = `<span class="price-diff diff-up">▲${diff.toFixed(1)}</span>`;
                    } else if (diff < 0) {
                        diffHtml = `<span class="price-diff diff-down">▼${Math.abs(diff).toFixed(1)}</span>`;
                    } else {
                        diffHtml = `<span class="price-diff diff-equal">±0</span>`;
                    }
                }
            }

            rowsHtml += `
                <div class="summary-row">
                    <div class="summary-label">${size}</div>
                    <div class="summary-values">
                        <div class="now-price">${priceHtml}<span class="currency">円/kg</span></div>
                        ${diffHtml}
                    </div>
                </div>
            `;
        });

        card.innerHTML = `
            <div class="summary-port">${port}</div>
            <div class="summary-date">最新取引日: ${latestDateStr}</div>
            <div class="summary-rows-container">
                ${rowsHtml}
            </div>
        `;
        container.appendChild(card);
    });
}

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-item');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            if (tabId === activeTab) return;

            // ボタンの装飾
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // 表示の切り替え
            document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
            document.getElementById(`view-${tabId}`).classList.add('active');

            activeTab = tabId;

            // グラフタブに戻った場合は再描画（サイズ調整のため）
            if (tabId === 'charts') {
                renderDashboard();
            }
        });
    });
}

function filterDataByRange(portData, range) {
    if (!portData || range === 'all') return portData;
    const now = moment();
    const result = {};
    const availableSizes = Object.keys(portData);
    availableSizes.forEach(size => {
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

function getPriceColor(size, index) {
    // 特定のキーワードがあれば固定色
    if (size.includes("1.8")) return baseColors[0];
    if (size.includes("2.5")) return baseColors[1];
    if (size.includes("4.5")) return baseColors[2];
    // それ以外はインデックスで回す
    return baseColors[index % baseColors.length];
}

function updateOrCreateChart(port, portData) {
    const canvasId = `chart-${port}`;
    const target = document.getElementById(canvasId);
    if (!target) return;
    const ctx = target.getContext('2d');
    const datasets = [];
    const theme = themes[currentTheme];

    if (portData) {
        const availableSizes = Object.keys(portData);
        availableSizes.forEach((size, idx) => {
            const sizeData = portData[size];
            if (sizeData.length === 0) return;

            const pricePoints = sizeData.map(d => ({ x: d.date, y: d.price }));
            const baseColor = getPriceColor(size, idx);

            datasets.push({
                label: `${size} 5日移動平均`,
                data: calculateMovingAverage(pricePoints, 5),
                borderColor: baseColor,
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
                borderColor: baseColor,
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
                backgroundColor: baseColor.replace('1)', currentTheme === 'light' ? '0.4)' : '0.2)'),
                borderColor: baseColor.replace('1)', '0.5)'),
                borderWidth: 1,
                yAxisID: 'yVolume',
                type: 'bar',
                hidden: idx > 0 // 初期の煩雑さを避けるため最初のサイズ以外は非表示
            });
        });
    }

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

            document.body.className = `theme-${theme}`;
            currentTheme = theme;

            renderDashboard();
            renderSummary();
        });
    });
}

function updateInsights() {
    const insightContent = document.getElementById('insight-content');
    if (!currentData || !insightContent) return;

    // 分析は主要な拠点の代表的なサイズで行う
    const yaizu = currentData["焼津"];
    const keySize = Object.keys(yaizu)[0] || "4.5kg上";
    const data = yaizu[keySize];
    if (!data || data.length < 2) return;

    const latest = data[data.length - 1];
    const prev = data[data.length - 2];

    let trend = "";
    if (latest.price > prev.price) {
        trend = "📈 **上昇傾向**: 直近の水揚量減少に伴い、単価が反発しています。";
    } else if (latest.price < prev.price) {
        trend = "📉 **下落傾向**: 水揚が安定しており、単価は落ち着いた動きを見せています。";
    } else {
        trend = "➡️ **横ばい**: 相場は拮抗しており、現状維持の展開が予想されます。";
    }

    insightContent.innerHTML = `
        <p><strong>現在の市場概況 (${keySize}):</strong></p>
        <p>${trend}</p>
        <p>💡 <strong>今後の予想に向けたメモ:</strong> 現在${latest.date}時点のデータまで反映済み。移動平均線（点線）を上抜けるかどうかに注目です。</p>
    `;
}

document.addEventListener('DOMContentLoaded', initDashboard);
