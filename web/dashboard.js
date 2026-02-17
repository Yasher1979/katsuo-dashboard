const ports = ["枕崎", "焼津", "山川"];
const mainSizesForSummary = ["1.8kg下", "1.8kg上", "2.5kg上", "4.5kg上"];

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

const baseColors = [
    "rgba(75, 192, 192, 1)",
    "rgba(255, 159, 64, 1)",
    "rgba(153, 102, 255, 1)",
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

        // キャッシュ回避のためにタイムスタンプを付与
        const response = await fetch(`../data/katsuo_market_data.json?v=${Date.now()}`);
        if (!response.ok) {
            const fallbackResponse = await fetch(`/data/katsuo_market_data.json?v=${Date.now()}`);
            if (!fallbackResponse.ok) throw new Error('Data not found');
            currentData = await fallbackResponse.json();
        } else {
            currentData = await response.json();
        }

        renderDashboard();
        renderSummary();
        updateInsights();
        setupFilters();
        setupThemeSwitcher();
        setupTabs();
        setupModal();

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
        card.onclick = () => showDetail(port, portData, latestDateStr);

        let rowsHtml = '';
        // 概要版では主要3サイズのみ表示
        mainSizesForSummary.forEach(size => {
            const dataArr = portData[size] || [];
            const latestEntry = dataArr.find(v => v.date === latestDateStr);
            const prevEntry = dataArr.length > 1 ? (latestEntry ? dataArr[dataArr.length - 2] : dataArr[dataArr.length - 1]) : null;

            let priceHtml = '-';
            let volHtml = '-';
            let diffHtml = '';

            if (latestEntry) {
                priceHtml = `${latestEntry.price.toFixed(1)}`;
                volHtml = `${latestEntry.volume.toFixed(1)}`;
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
                        <div class="price-vol-group">
                            <span class="now-price">${priceHtml}<span class="currency">円</span></span>
                        </div>
                        <div class="now-volume">${volHtml}<span class="currency">t</span></div>
                    </div>

                    <div class="diff-area">
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

function showDetail(port, portData, latestDateStr) {
    const modal = document.getElementById('detail-modal');
    const modalBody = document.getElementById('modal-body');
    if (!modal || !modalBody) return;

    let rowsHtml = '';
    const allSizes = Object.keys(portData);

    allSizes.forEach(size => {
        const dataArr = portData[size] || [];
        const latestEntry = dataArr.find(v => v.date === latestDateStr);
        const prevEntry = dataArr.length > 1 ? (latestEntry ? dataArr[dataArr.length - 2] : dataArr[dataArr.length - 1]) : null;

        let priceHtml = '-';
        let volHtml = '-';
        let diffHtml = '';

        if (latestEntry) {
            priceHtml = `${latestEntry.price.toFixed(1)}`;
            volHtml = `${latestEntry.volume.toFixed(1)}`;
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
                    <div class="price-vol-group">
                        <span class="now-price">${priceHtml}<span class="currency">円</span></span>
                    </div>
                    <div class="now-volume">${volHtml}<span class="currency">t</span></div>
                </div>

                <div class="diff-area">
                    ${diffHtml}
                </div>
            </div>
        `;
    });

    modalBody.innerHTML = `
        <div class="summary-port">${port} 全サイズ一覧</div>
        <div class="summary-date">取引日: ${latestDateStr}</div>
        <div class="summary-rows-container">
            ${rowsHtml}
        </div>
    `;

    modal.classList.add('active');
}

function setupModal() {
    const modal = document.getElementById('detail-modal');
    const closeBtn = document.getElementById('modal-close');

    if (closeBtn && modal) {
        closeBtn.onclick = () => modal.classList.remove('active');
        modal.onclick = (e) => {
            if (e.target === modal) modal.classList.remove('active');
        };
    }
}

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-item');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            if (tabId === activeTab) return;

            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
            document.getElementById(`view-${tabId}`).classList.add('active');

            activeTab = tabId;

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



// 単純移動平均 (SMA) を計算する関数
function calculateSimpleMovingAverage(data, windowSize) {
    if (!data || data.length < windowSize) return data.map(d => ({ x: d.date, y: null }));

    let smaData = [];
    for (let i = 0; i < data.length; i++) {
        if (i < windowSize - 1) {
            smaData.push({ x: data[i].date, y: null });
            continue;
        }
        let sum = 0;
        for (let j = 0; j < windowSize; j++) {
            sum += data[i - j].price;
        }
        smaData.push({ x: data[i].date, y: sum / windowSize });
    }
    return smaData;
}

const mainSizesForCharts = ['1.8kg下', '1.8kg上', '2.5kg上', '4.5kg上'];

const chartColors = {
    '1.8kg下': { border: 'rgb(255, 99, 132)', bg: 'rgba(255, 99, 132, 0.5)' }, // 赤
    '1.8kg上': { border: 'rgb(54, 162, 235)', bg: 'rgba(54, 162, 235, 0.5)' }, // 青
    '2.5kg上': { border: 'rgb(255, 206, 86)', bg: 'rgba(255, 206, 86, 0.5)' }, // 黄
    '4.5kg上': { border: 'rgb(75, 192, 192)', bg: 'rgba(75, 192, 192, 0.5)' }  // 緑
};

function updateOrCreateChart(port, portData) {
    const ctx = document.getElementById(`chart-${port}`);
    if (!ctx) return;

    const datasets = [];

    mainSizesForCharts.forEach(size => {
        const dataArr = portData[size];
        if (!dataArr || dataArr.length === 0) return;

        const color = chartColors[size] || { border: '#999', bg: '#999' };

        // 1. 価格推移（折れ線）
        datasets.push({
            type: 'line',
            label: `${size} 価格`,
            data: dataArr.map(d => ({ x: d.date, y: d.price })),
            borderColor: color.border,
            backgroundColor: color.border,
            borderWidth: 2,
            tension: 0.1,
            yAxisID: 'y',
            pointRadius: 6,
            pointHoverRadius: 8,
            fill: false
        });

        // 2. 5日移動平均（点線）
        const smaData = calculateSimpleMovingAverage(dataArr, 5);
        datasets.push({
            type: 'line',
            label: `${size} 5日平均`,
            data: smaData,
            borderColor: color.border,
            borderWidth: 1,
            borderDash: [5, 5],
            pointRadius: 0,
            yAxisID: 'y',
            fill: false,
            hidden: false
        });

        // 3. 水揚げ量（棒グラフ）
        datasets.push({
            type: 'bar',
            label: `${size} 水揚量`,
            data: dataArr.map(d => ({ x: d.date, y: d.volume })),
            backgroundColor: color.bg,
            borderColor: 'transparent',
            yAxisID: 'yVolume',
            barPercentage: 0.5,
            hidden: true // デフォルトでは非表示
        });
    });

    const theme = themes[currentTheme];
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: theme.text,
                    boxWidth: 12,
                    font: { size: 10 },
                    filter: function (item, chart) {
                        return true;
                    }
                }
            },
            tooltip: {
                backgroundColor: theme.tooltipBg,
                padding: 10,
                callbacks: {
                    label: (context) => {
                        const label = context.dataset.label || '';
                        const val = context.parsed.y !== null ? context.parsed.y.toFixed(1) : '-';
                        if (label.includes('価格') || label.includes('平均')) {
                            return `${label}: ${val} 円`;
                        } else {
                            return `${label}: ${val} t`;
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
                title: { display: true, text: '単価 (円)', color: theme.text },
                grid: { color: theme.grid },
                ticks: { color: theme.text },
                position: 'left',
                suggestedMin: 100
            },
            yVolume: {
                title: { display: true, text: '水揚量 (t)', color: theme.text },
                grid: { display: false },
                ticks: { color: theme.text },
                position: 'right',
                beginAtZero: true,
                suggestedMax: 1000
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

    const yaizuData = currentData["焼津"];
    const keySize = "4.5kg上";
    const data = yaizuData[keySize];
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
        <p><strong>現在の市場概況 (焼津魚市場市況 ${keySize}):</strong></p>
        <p>${trend}</p>
        <p>💡 <strong>今後の予想に向けたメモ:</strong> 現在${latest.date}時点のデータまで反映済み。</p>
    `;
}

document.addEventListener('DOMContentLoaded', initDashboard);
