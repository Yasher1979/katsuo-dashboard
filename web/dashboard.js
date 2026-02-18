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

        // --- グラフ外タップ、またはグラフ内空白タップでツールチップを消す処理 ---
        const hideTooltips = (e) => {
            if (e.target.tagName === 'CANVAS') {
                // グラフ内タップの場合:
                // "点の上"を直接タップしていない限り消す (intersect: true で厳密判定)
                const chart = Object.values(charts).find(c => c.canvas === e.target);
                if (chart) {
                    // ここでのポイント: intersect: true にすることで「点の上」だけを検出
                    const activePoints = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);

                    if (activePoints.length === 0) {
                        // 点の上でなければ非表示にする
                        chart.tooltip.setActiveElements([], { x: 0, y: 0 });
                        chart.update();
                    }
                }
            } else {
                // グラフ外タップの場合: 全チャートのツールチップを消す
                Object.values(charts).forEach(chart => {
                    if (chart.tooltip && chart.tooltip.getActiveElements().length > 0) {
                        chart.tooltip.setActiveElements([], { x: 0, y: 0 });
                        chart.update();
                    }
                });
            }
        };

        // click イベントで制御
        document.addEventListener('click', hideTooltips);
        // タッチデバイスでの即応性向上のため touchstart も追加 (passive: true)
        document.addEventListener('touchstart', hideTooltips, { passive: true });

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
            tension: 0.4, // 滑らかな曲線に
            spanGaps: true, // データがない期間も線でつなぐ
            yAxisID: 'y',
            pointRadius: 5,
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
            tension: 0.4, // 滑らかに
            spanGaps: true,
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
            hidden: false // デフォルトで表示
        });
    });

    // --- 自動スケーリング計算 ---
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    datasets.forEach(ds => {
        if (ds.yAxisID === 'y' && !ds.hidden) {
            ds.data.forEach(p => {
                if (p.y !== null) {
                    if (p.y < minPrice) minPrice = p.y;
                    if (p.y > maxPrice) maxPrice = p.y;
                }
            });
        }
        if (ds.yAxisID === 'yVolume' && !ds.hidden) {
            ds.data.forEach(p => {
                if (p.y !== null && p.y > maxVolume) maxVolume = p.y;
            });
        }
    });

    // データがない場合のデフォルト
    if (minPrice === Infinity) { minPrice = 200; maxPrice = 250; }
    if (maxVolume === 0) maxVolume = 100;

    // マージン設定 (価格: ±10円程度, 水揚: +20%)
    const suggestedMinPrice = Math.floor(minPrice - 10);
    const suggestedMaxPrice = Math.ceil(maxPrice + 10);
    const suggestedMaxVolume = Math.ceil(maxVolume * 1.2);

    const theme = themes[currentTheme];
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        // グラフ内タップ時の挙動を制御（ドキュメントレベルのイベントリスナーに委譲）
        // onClick: (e, activeElements, chart) => {}, 

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
                // 自動計算した範囲を適用
                min: suggestedMinPrice,
                max: suggestedMaxPrice
            },
            yVolume: {
                title: { display: true, text: '水揚量 (t)', color: theme.text },
                grid: { display: false },
                ticks: { color: theme.text },
                position: 'right',
                beginAtZero: true,
                // 自動計算した最大値を適用
                max: suggestedMaxVolume
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

    const reloadInsightBtn = document.getElementById('btn-reload-insight');
    if (reloadInsightBtn) {
        reloadInsightBtn.addEventListener('click', () => {
            // ボタンを回転させるアニメーションクラスを一瞬付与（CSSでrotate定義済みならクラス切り替えもありだが、今回はtransformで対応済み）
            // 再度 updateInsights を呼び出す
            updateInsights();
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

// --- データ駆動型 AI風分析ロジック ---

function updateInsights() {
    const insightContent = document.getElementById('insight-content');
    if (!currentData || !insightContent) return;

    // 全ての分析を実行してインサイト候補を収集
    let insights = [];
    insights = insights.concat(analyzeVolatility(currentData));
    insights = insights.concat(analyzeSupplyDemand(currentData));
    insights = insights.concat(analyzePortSpread(currentData));
    insights = insights.concat(analyzeSizeTrend(currentData));

    // インサイトがない場合のデフォルトメッセージ
    if (insights.length === 0) {
        insights.push({
            title: "市場概況",
            text: "➡️ **横ばい**: 目立った価格変動は見られず、全般的に様子見ムードが漂っています。次回の水揚げ情報が待たれます。",
            memo: "特筆すべき変動なし"
        });
    }

    // ランダムに1つ選択して表示
    const selected = insights[Math.floor(Math.random() * insights.length)];

    insightContent.innerHTML = `
        <p><strong>💡 AIアナリストの視点 (${selected.title}):</strong></p>
        <p class="insight-text">${selected.text}</p>
        <p class="insight-memo">Memo: ${selected.memo}</p>
    `;
}

// 1. 急騰・急落アラート（前日比 ±10円以上）
function analyzeVolatility(data) {
    const results = [];
    ports.forEach(port => {
        const portData = data[port];
        if (!portData) return;
        Object.keys(portData).forEach(size => {
            const arr = portData[size];
            if (arr.length < 2) return;
            const latest = arr[arr.length - 1];
            const prev = arr[arr.length - 2];
            const diff = latest.price - prev.price;

            if (diff >= 10) {
                results.push({
                    title: "急騰アラート",
                    text: `📈 **${port} ${size}** が前日比 <span class="diff-up">+${diff.toFixed(1)}円</span> の急騰！供給不足により買い注文が殺到している可能性があります。`,
                    memo: `${latest.date}時点`
                });
            } else if (diff <= -10) {
                results.push({
                    title: "急落アラート",
                    text: `📉 **${port} ${size}** が前日比 <span class="diff-down">${diff.toFixed(1)}円</span> の急落。まとまった水揚げにより相場が一時的に崩れています。`,
                    memo: `${latest.date}時点`
                });
            }
        });
    });
    return results;
}

// 2. 需給ギャップ分析（水揚げ増なのに価格上昇、またはその逆）
function analyzeSupplyDemand(data) {
    const results = [];
    ports.forEach(port => {
        const portData = data[port];
        if (!portData) return;
        Object.keys(portData).forEach(size => {
            const arr = portData[size];
            if (arr.length < 2) return;
            const latest = arr[arr.length - 1];
            const prev = arr[arr.length - 2];
            const priceDiff = latest.price - prev.price;
            const volDiff = latest.volume - prev.volume;

            // 水揚げ増 (+20t以上) なのに 価格上昇 (+2円以上)
            if (volDiff >= 20 && priceDiff >= 2) {
                results.push({
                    title: "需給ギャップ（強気）",
                    text: `🔥 **${port} ${size}** は水揚げが増加（+${volDiff.toFixed(0)}t）したにも関わらず、単価が上昇しています。実需が非常に強く、相場は底堅い動きです。`,
                    memo: "供給増を吸収する強い需要あり"
                });
            }
            // 水揚げ減 (-20t以下) なのに 価格下落 (-2円以上)
            if (volDiff <= -20 && priceDiff <= -2) {
                results.push({
                    title: "需給ギャップ（弱気）",
                    text: `❄️ **${port} ${size}** は水揚げが減少しましたが、単価は下落しました。買い気が薄く、市場の関心が低下している恐れがあります。`,
                    memo: "供給減でも買われない展開"
                });
            }
        });
    });
    return results;
}

// 3. 港間スプレッド分析（同サイズの価格差が20円以上）
function analyzePortSpread(data) {
    const results = [];
    const targetSizes = ["4.5kg上", "2.5kg上", "1.8kg上"];

    // 焼津 vs 枕崎
    targetSizes.forEach(size => {
        const p1 = getLatestData(data, "焼津", size);
        const p2 = getLatestData(data, "枕崎", size);
        if (!p1 || !p2 || p1.date !== p2.date) return; // 日付がズレている場合は除外

        const spread = p1.price - p2.price;
        if (spread >= 20) {
            results.push({
                title: "港間格差（焼津高・枕崎安）",
                text: `⚖️ **${size}** において、焼津が枕崎より <span class="diff-up">${spread.toFixed(1)}円</span> 高くなっています。枕崎での仕入れに割安感が出ています。`,
                memo: `焼津:${p1.price}円 vs 枕崎:${p2.price}円`
            });
        } else if (spread <= -20) {
            results.push({
                title: "港間格差（枕崎高・焼津安）",
                text: `⚖️ **${size}** において、枕崎が焼津より <span class="diff-up">${Math.abs(spread).toFixed(1)}円</span> 高値をつけています。焼津相場の出遅れ感が意識される展開です。`,
                memo: `枕崎:${p2.price}円 vs 焼津:${p1.price}円`
            });
        }
    });
    return results;
}

// 4. サイズ別トレンド分析（大型 vs 小型）
function analyzeSizeTrend(data) {
    const results = [];
    ports.forEach(port => {
        const large = getLatestData(data, port, "4.5kg上");
        const small = getLatestData(data, port, "1.8kg下");
        if (!large || !small || large.date !== small.date) return;

        // 前日比が取得できるか確認
        const largePrev = getPrevData(data, port, "4.5kg上");
        const smallPrev = getPrevData(data, port, "1.8kg下");
        if (!largePrev || !smallPrev) return;

        const largeDiff = large.price - largePrev.price;
        const smallDiff = small.price - smallPrev.price;

        // 大型が上がって(+5以上)、小型が下がったor変わらず(0以下)
        if (largeDiff >= 5 && smallDiff <= 0) {
            results.push({
                title: "サイズ選別（大型高）",
                text: `📏 **${port}** では大型魚（4.5kg上）に人気が集中し独歩高となっています。小型魚との価格差が拡大しており、サイズによる二極化が進行中です。`,
                memo: `大型:+${largeDiff}円 / 小型:${smallDiff}円`
            });
        }
    });
    return results;
}

function getLatestData(data, port, size) {
    if (!data[port] || !data[port][size]) return null;
    const arr = data[port][size];
    return arr.length > 0 ? arr[arr.length - 1] : null;
}

function getPrevData(data, port, size) {
    if (!data[port] || !data[port][size]) return null;
    const arr = data[port][size];
    return arr.length > 1 ? arr[arr.length - 2] : null;
}

document.addEventListener('DOMContentLoaded', initDashboard);
