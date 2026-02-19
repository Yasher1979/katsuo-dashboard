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
let bidScheduleData = null;
let currentRange = '30'; // デフォルトを1ヶ月に変更
let currentTheme = 'dark';
let activeTab = 'summary';
let charts = {};

async function initDashboard() {
    try {
        const startTime = Date.now();

        // データの並列ロード
        const [marketRes, bidRes] = await Promise.all([
            fetch(`../data/katsuo_market_data.json?v=${Date.now()}`),
            fetch(`../data/bid_schedule.json?v=${Date.now()}`)
        ]);

        let marketDataResponse = marketRes;
        if (!marketDataResponse.ok) {
            marketDataResponse = await fetch(`/data/katsuo_market_data.json?v=${Date.now()}`);
        }
        currentData = await marketDataResponse.json();

        if (bidRes.ok) {
            bidScheduleData = await bidRes.json();
        } else {
            const bidResAlt = await fetch(`/data/bid_schedule.json?v=${Date.now()}`);
            if (bidResAlt.ok) bidScheduleData = await bidResAlt.json();
        }

        renderDashboard();
        renderSummary();
        renderBidSchedule();
        updateInsights();
        setupFilters();
        setupThemeSwitcher();
        setupTabs();
        setupModal();
        setupMemoModal();

        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, 1500 - elapsed);
        setTimeout(() => {
            const splash = document.getElementById('splash-screen');
            if (splash) splash.classList.add('fade-out');
        }, delay);

        const hideTooltips = (e) => {
            if (e.target.tagName !== 'CANVAS') {
                Object.values(charts).forEach(chart => {
                    if (chart.tooltip && chart.tooltip.getActiveElements().length > 0) {
                        chart.tooltip.setActiveElements([], { x: 0, y: 0 });
                        chart.update();
                    }
                });
            }
        };

        document.addEventListener('click', hideTooltips);
        document.addEventListener('touchstart', hideTooltips, { passive: true });

    } catch (error) {
        console.error('Error initializing dashboard:', error);
        const splash = document.getElementById('splash-screen');
        if (splash) splash.classList.add('fade-out');
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

            let vesselHtml = '';
            if (latestEntry && latestEntry.vessel) {
                vesselHtml = `<span class="vessel-badge">🚢 ${latestEntry.vessel}</span>`;
            }

            rowsHtml += `
                <div class="summary-row">
                    <div class="summary-label-group">
                        <div class="summary-label">${size}</div>
                        ${vesselHtml}
                    </div>
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

        const memo = getMemo(latestDateStr, port);
        const memoIcon = memo ? '📝' : '';

        card.innerHTML = `
            <div class="summary-card-header">
                <div>
                    <div class="summary-port">${port}</div>
                    <div class="summary-date">最新取引日: ${latestDateStr}</div>
                </div>
                <button class="btn-memo" onclick="event.stopPropagation(); openMemoModal('${latestDateStr}', '${port}')" title="メモを追加">${memoIcon || '📝'}</button>
            </div>
            ${memo ? `<div class="memo-preview">📝 ${memo}</div>` : ''}
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

        let vesselHtml = '';
        if (latestEntry && latestEntry.vessel) {
            vesselHtml = `<span class="vessel-badge">🚢 ${latestEntry.vessel}</span>`;
        }

        rowsHtml += `
            <div class="summary-row">
                <div class="summary-label-group">
                    <div class="summary-label">${size}</div>
                    ${vesselHtml}
                </div>
                <div class="summary-values">
                    <div class="price-vol-group">
                        <span class="now-price">${priceHtml}<span class="currency">円</span></span>
                    </div>
                    <div class="now-volume">${volHtml}<span class="currency">t</span></div>
                </div>
                <div class="diff-area">${diffHtml}</div>
            </div>
        `;
    });

    modalBody.innerHTML = `
        <div class="summary-port">${port} 全サイズ一覧</div>
        <div class="summary-date">取引日: ${latestDateStr}</div>
        <div class="summary-rows-container">${rowsHtml}</div>
    `;

    modal.classList.add('active');
}

function renderBidSchedule() {
    const latestContainer = document.getElementById('latest-bid-container');
    const archiveContainer = document.getElementById('archive-bid-container');
    if (!latestContainer || !bidScheduleData) return;

    latestContainer.innerHTML = '';
    archiveContainer.innerHTML = '';

    const sortedData = [...bidScheduleData].sort((a, b) => new Date(b.bid_date) - new Date(a.bid_date));

    sortedData.forEach((bid, index) => {
        const card = document.createElement('div');
        card.className = `bid-card ${index > 0 ? 'archive' : ''}`;

        let itemsHtml = '';
        bid.items.forEach(item => {
            if (item.category === 'PS カツオ' || item.volume <= 0) return;
            itemsHtml += `
                <tr>
                    <td>${item.category}</td>
                    <td>${item.size}</td>
                    <td>${item.type}</td>
                    <td class="volume-val">${item.volume.toFixed(1)}<span class="volume-unit">t</span></td>
                </tr>
            `;
        });

        card.innerHTML = `
            <div class="bid-card-header">
                <div class="bid-info-main">
                    <h2>${bid.vessel_name}</h2>
                    <div class="bid-dates">
                        <span><span class="bid-date-item-label">入札予定日:</span>${bid.bid_date}</span>
                        <span><span class="bid-date-item-label">情報提供:</span>${bid.delivery_date}</span>
                    </div>
                </div>
                <div class="vessel-badge" style="font-size: 1rem; padding: 5px 12px;">🚢 ${bid.tonnage}t積</div>
            </div>
            <div class="bid-sea-area">
                <span class="sea-area-title">📍 操業海域</span>
                <div class="sea-area-coords">
                    <span>${bid.sea_area.lat}</span>
                    <span>${bid.sea_area.lon}</span>
                </div>
            </div>
            <div class="bid-table-container">
                <table class="bid-table">
                    <thead>
                        <tr><th>カテゴリ</th><th>サイズ</th><th>区分</th><th style="text-align: right;">数量</th></tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                        <tr class="category-row">
                            <td colspan="3">合計重量 (Bカツオ等)</td>
                            <td class="volume-val">${bid.total_volume.toFixed(1)}<span class="volume-unit">t</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;

        if (index === 0) {
            latestContainer.appendChild(card);
        } else {
            archiveContainer.appendChild(card);
        }
    });

    if (sortedData.length <= 1) {
        const archiveSection = document.querySelector('.archive-section');
        if (archiveSection) archiveSection.style.display = 'none';
    }
}

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
    '1.8kg下': { border: 'rgb(255, 99, 132)', bg: 'rgba(255, 99, 132, 0.5)' },
    '1.8kg上': { border: 'rgb(54, 162, 235)', bg: 'rgba(54, 162, 235, 0.5)' },
    '2.5kg上': { border: 'rgb(255, 206, 86)', bg: 'rgba(255, 206, 86, 0.5)' },
    '4.5kg上': { border: 'rgb(75, 192, 192)', bg: 'rgba(75, 192, 192, 0.5)' }
};

function updateOrCreateChart(port, portData) {
    const ctx = document.getElementById(`chart-${port}`);
    if (!ctx) return;
    const datasets = [];
    mainSizesForCharts.forEach(size => {
        const dataArr = portData[size];
        if (!dataArr || dataArr.length === 0) return;
        const color = chartColors[size] || { border: '#999', bg: '#999' };
        datasets.push({
            type: 'line',
            label: `${size} 価格`,
            data: dataArr.map(d => ({ x: d.date, y: d.price })),
            borderColor: color.border,
            backgroundColor: color.border,
            borderWidth: 2,
            tension: 0.4,
            spanGaps: true,
            yAxisID: 'y',
            pointRadius: 5,
            pointHoverRadius: 8,
            fill: false
        });
        const smaData = calculateSimpleMovingAverage(dataArr, 5);
        datasets.push({
            type: 'line',
            label: `${size} 5日平均`,
            data: smaData,
            borderColor: color.border,
            borderWidth: 1,
            borderDash: [5, 5],
            tension: 0.4,
            spanGaps: true,
            pointRadius: 0,
            yAxisID: 'y',
            fill: false
        });
        datasets.push({
            type: 'bar',
            label: `${size} 水揚量`,
            data: dataArr.map(d => ({ x: d.date, y: d.volume })),
            backgroundColor: color.bg,
            borderColor: 'transparent',
            yAxisID: 'yVolume',
            barPercentage: 0.5
        });
    });

    let minPrice = Infinity, maxPrice = -Infinity, maxVolume = 0;
    datasets.forEach(ds => {
        if (ds.yAxisID === 'y') {
            ds.data.forEach(p => {
                if (p.y !== null) {
                    if (p.y < minPrice) minPrice = p.y;
                    if (p.y > maxPrice) maxPrice = p.y;
                }
            });
        }
        if (ds.yAxisID === 'yVolume') {
            ds.data.forEach(p => {
                if (p.y !== null && p.y > maxVolume) maxVolume = p.y;
            });
        }
    });

    if (minPrice === Infinity) { minPrice = 200; maxPrice = 250; }
    if (maxVolume === 0) maxVolume = 100;

    const theme = themes[currentTheme];
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: true },
        plugins: {
            legend: { position: 'top', labels: { color: theme.text, font: { size: 10 } } },
            tooltip: {
                backgroundColor: theme.tooltipBg,
                callbacks: {
                    label: (context) => {
                        const label = context.dataset.label || '';
                        const val = context.parsed.y !== null ? context.parsed.y.toFixed(1) : '-';
                        return label.includes('価格') || label.includes('平均') ? `${label}: ${val} 円` : `${label}: ${val} t`;
                    }
                }
            }
        },
        scales: {
            x: { type: 'time', grid: { color: theme.grid }, ticks: { color: theme.text } },
            y: { position: 'left', grid: { color: theme.grid }, ticks: { color: theme.text }, min: Math.floor(minPrice - 10), max: Math.ceil(maxPrice + 10) },
            yVolume: { position: 'right', grid: { display: false }, ticks: { color: theme.text }, beginAtZero: true, max: Math.ceil(maxVolume * 1.2) }
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
    document.getElementById('btn-refresh')?.addEventListener('click', () => location.reload());
    document.getElementById('btn-reload-insight')?.addEventListener('click', () => updateInsights());
    document.getElementById('btn-pdf')?.addEventListener('click', () => generateWeeklyReport());
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
    let insights = [].concat(analyzeVolatility(currentData), analyzeSupplyDemand(currentData), analyzePortSpread(currentData), analyzeSizeTrend(currentData));
    if (insights.length === 0) insights.push({ title: "市場概況", text: "➡️ **横ばい**: 目立った変動なし。", memo: "安定期" });
    const selected = insights[Math.floor(Math.random() * insights.length)];
    insightContent.innerHTML = `<p><strong>💡 AIアナリストの視点 (${selected.title}):</strong></p><p class="insight-text">${selected.text}</p><p class="insight-memo">Memo: ${selected.memo}</p>`;
}

function analyzeVolatility(data) {
    const results = [];
    ports.forEach(port => {
        Object.keys(data[port] || {}).forEach(size => {
            const arr = data[port][size];
            if (arr.length < 2) return;
            const diff = arr[arr.length - 1].price - arr[arr.length - 2].price;
            if (Math.abs(diff) >= 10) results.push({ title: diff > 0 ? "急騰アラート" : "急落アラート", text: `📊 **${port} ${size}** が前日比 ${diff > 0 ? '+' : ''}${diff.toFixed(1)}円。`, memo: `${arr[arr.length - 1].date}` });
        });
    });
    return results;
}

function analyzeSupplyDemand(data) {
    const results = [];
    ports.forEach(port => {
        Object.keys(data[port] || {}).forEach(size => {
            const arr = data[port][size];
            if (arr.length < 2) return;
            const priceDiff = arr[arr.length - 1].price - arr[arr.length - 2].price;
            const volDiff = arr[arr.length - 1].volume - arr[arr.length - 2].volume;
            if (volDiff >= 20 && priceDiff >= 2) results.push({ title: "需給ギャップ（強気）", text: `🔥 **${port} ${size}** 水揚げ増(+${volDiff.toFixed(0)}t)でも単価上昇。実需強。`, memo: "底堅い推移" });
        });
    });
    return results;
}

function analyzePortSpread(data) {
    const results = [];
    ["4.5kg上", "2.5kg上", "1.8kg上"].forEach(size => {
        const p1 = getLatestData(data, "焼津", size), p2 = getLatestData(data, "枕崎", size);
        if (!p1 || !p2 || p1.date !== p2.date) return;
        const spread = p1.price - p2.price;
        if (Math.abs(spread) >= 20) results.push({ title: "港間格差", text: `⚖️ **${size}** において、${spread > 0 ? '焼津' : '枕崎'}が他方より ${Math.abs(spread).toFixed(1)}円 高くなっています。`, memo: `${p1.price}円 vs ${p2.price}円` });
    });
    return results;
}

function analyzeSizeTrend(data) {
    const results = [];
    ports.forEach(port => {
        const large = getLatestData(data, port, "4.5kg上"), small = getLatestData(data, port, "1.8kg下");
        const lPrev = getPrevData(data, port, "4.5kg上"), sPrev = getPrevData(data, port, "1.8kg下");
        if (large && small && lPrev && sPrev && (large.price - lPrev.price >= 5) && (small.price - sPrev.price <= 0))
            results.push({ title: "サイズ選別", text: `📏 **${port}** 大型魚は独歩高。小型魚との二極化。`, memo: "大型人気集中" });
    });
    return results;
}

function getLatestData(data, port, size) { const arr = (data[port] || {})[size]; return arr && arr.length > 0 ? arr[arr.length - 1] : null; }
function getPrevData(data, port, size) { const arr = (data[port] || {})[size]; return arr && arr.length > 1 ? arr[arr.length - 2] : null; }

async function generateWeeklyReport() {
    const btn = document.getElementById('btn-pdf');
    if (btn) { btn.textContent = '… 戦略レポート生成中'; btn.disabled = true; }
    try {
        const { jsPDF } = window.jspdf;
        const pageW = 210, pageH = 297, margin = 15, contentW = pageW - margin * 2;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        doc.setFillColor(13, 17, 23); doc.rect(0, 0, pageW, 25, 'F');
        doc.setTextColor(88, 166, 255); doc.setFontSize(18); doc.text("鰹相場 戦略分析レポート (Weekly Insights)", margin, 17);
        doc.setFontSize(8); doc.setTextColor(139, 148, 158); doc.text(`発行日: ${moment().format('YYYY/MM/DD')} | Confidential`, pageW - margin - 50, 17);
        let yPos = 35;
        const insightCard = document.querySelector('.insight-card');
        if (insightCard) {
            const canvas = await html2canvas(insightCard, { scale: 2, backgroundColor: '#0d1117' });
            const imgH = contentW * (canvas.height / canvas.width);
            doc.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, yPos, contentW, imgH);
            yPos += imgH + 10;
        }
        const summaryGrid = document.getElementById('summary-container');
        if (summaryGrid) {
            const canvas = await html2canvas(summaryGrid, { scale: 1.5, backgroundColor: '#0d1117' });
            const imgH = contentW * (canvas.height / canvas.width);
            if (yPos + imgH > pageH - 20) { doc.addPage(); yPos = margin; }
            doc.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', margin, yPos, contentW, imgH);
            yPos += imgH + 10;
        }
        const latestBid = document.getElementById('latest-bid-container');
        if (latestBid && latestBid.children.length > 0) {
            doc.addPage(); yPos = 20; doc.setFontSize(14); doc.setTextColor(88, 166, 255); doc.text("🚢 今後の入札予定・供給予測", margin, yPos);
            const canvas = await html2canvas(latestBid.firstChild, { scale: 1.5, backgroundColor: '#0d1117' });
            doc.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', margin, yPos + 8, contentW, contentW * (canvas.height / canvas.width));
        }
        for (const port of ["枕崎", "焼津"]) {
            const card = document.getElementById(`chart-${port}`)?.closest('.chart-card');
            if (!card) continue;
            doc.addPage(); doc.setFontSize(14); doc.setTextColor(88, 166, 255); doc.text(`📈 推移分析: ${port}`, margin, 20);
            const canvas = await html2canvas(card, { scale: 1.5, backgroundColor: '#161b22' });
            doc.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', margin, 30, contentW, contentW * (canvas.height / canvas.width));
        }
        doc.save(`鰹相場レポート_${moment().format('YYYYMMDD')}.pdf`);
    } catch (err) { alert(`生成失敗: ${err.message}`); }
    finally { if (btn) { btn.textContent = '📄 週報PDF (高度分析)'; btn.disabled = false; } }
}

function setupModal() {
    const modal = document.getElementById('detail-modal'), btn = document.getElementById('modal-close');
    if (btn && modal) { btn.onclick = () => modal.classList.remove('active'); modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); }; }
}

function setupTabs() {
    const btns = document.querySelectorAll('.tab-item');
    btns.forEach(btn => btn.addEventListener('click', () => {
        const id = btn.dataset.tab; if (id === activeTab) return;
        btns.forEach(b => b.classList.remove('active')); btn.classList.add('active');
        document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active')); document.getElementById(`view-${id}`).classList.add('active');
        activeTab = id; if (id === 'charts') renderDashboard();
    }));
}

const MEMO_KEY = 'katsuo_memos';
function getAllMemos() { try { return JSON.parse(localStorage.getItem(MEMO_KEY) || '{}'); } catch { return {}; } }
function getMemo(d, p) { return (getAllMemos()[d] || {})[p] || ''; }
function saveMemo(d, p, t) { const m = getAllMemos(); if (!m[d]) m[d] = {}; if (t.trim()) m[d][p] = t.trim(); else { delete m[d][p]; if (!Object.keys(m[d]).length) delete m[d]; } localStorage.setItem(MEMO_KEY, JSON.stringify(m)); }
function openMemoModal(d, p) { const m = document.getElementById('memo-modal'), t = document.getElementById('memo-textarea'); if (!m || !t) return; document.getElementById('memo-date').textContent = `${p} / ${d}`; const pe = document.getElementById('memo-port'); pe.dataset.date = d; pe.dataset.port = p; t.value = getMemo(d, p); m.classList.add('active'); t.focus(); }
function setupMemoModal() {
    const m = document.getElementById('memo-modal'), s = document.getElementById('memo-save-btn'), c = document.getElementById('memo-cancel-btn'), p = document.getElementById('memo-port');
    if (!m) return; s && s.addEventListener('click', () => { saveMemo(p.dataset.date, p.dataset.port, document.getElementById('memo-textarea').value); m.classList.remove('active'); renderSummary(); });
    c && c.addEventListener('click', () => m.classList.remove('active')); m.addEventListener('click', (e) => { if (e.target === m) m.classList.remove('active'); });
}

document.addEventListener('DOMContentLoaded', initDashboard);
