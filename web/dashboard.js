const ports = ["枕崎", "焼津", "山川"];
const mainSizes = ["1.8kg上", "2.5kg上", "4.5kg上", "1.8kg下"];

// テーマごとの配色設定（グラフのグリッドやテキスト用）
const themes = {
    dark: { text: "#8b949e", grid: "rgba(48, 54, 61, 0.3)", tooltipBg: "rgba(13, 17, 23, 0.9)" },
    light: { text: "#656d76", grid: "rgba(208, 215, 222, 0.5)", tooltipBg: "rgba(255, 255, 255, 0.95)" },
    ocean: { text: "#aabccf", grid: "rgba(0, 77, 153, 0.4)", tooltipBg: "rgba(0, 26, 51, 0.95)" }
};

let currentData = null;
let bidScheduleData = null;

let currentRange = '30';
let currentSize = '2.5kg上';
let currentTheme = 'dark';
let currentCompare = 'none';
let activeTab = 'summary';
let mainChart = null;

async function initDashboard() {
    console.log("Initializing Dashboard...");
    try {
        const startTime = Date.now();

        // データの並列ロード
        const [marketRes, bidRes] = await Promise.all([
            fetch(`../data/katsuo_market_data.json?v=${Date.now()}`).catch(e => ({ ok: false })),
            fetch(`../data/bid_schedule.json?v=${Date.now()}`).catch(e => ({ ok: false }))
        ]);

        let mRes = marketRes;
        if (!mRes.ok) mRes = await fetch(`/data/katsuo_market_data.json?v=${Date.now()}`).catch(e => ({ ok: false }));
        if (mRes.ok) currentData = await mRes.json();

        let bRes = bidRes;
        if (!bRes.ok) bRes = await fetch(`/data/bid_schedule.json?v=${Date.now()}`).catch(e => ({ ok: false }));
        if (bRes.ok) bidScheduleData = await bRes.json();

        if (!currentData) throw new Error("Market data could not be loaded.");

        // データ最終更新日の特定とヘッダーへの表示
        updateLastUpdateTime();

        // テーマの読み込み
        let savedTheme = 'dark';
        try { savedTheme = localStorage.getItem('katsuo_theme') || 'dark'; } catch(e) {}
        currentTheme = savedTheme;
        document.body.className = `theme-${savedTheme}`;

        // 各種セットアップ
        setupFilters();
        setupThemeSwitcher();
        setupTabs();
        setupModal();
        setupSpeciesModal();
        setupHolidayModal();
        setupMemoModal();
        setupSettings();
        loadAllSettings();

        // 初回レンダリング
        renderDashboard();

        // スプラッシュ解除
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, 800 - elapsed);
        setTimeout(() => {
            const splash = document.getElementById('splash-screen');
            if (splash) splash.classList.add('fade-out');
        }, delay);

    } catch (error) {
        console.error('Fatal Error during Dashboard Init:', error);
        const splash = document.getElementById('splash-screen');
        if (splash) splash.classList.add('fade-out');
        const container = document.getElementById('summary-container');
        if (container) container.innerHTML = `<p style="color:red;padding:20px;">エラーが発生しました: ${error.message}</p>`;
    }
}

function updateLastUpdateTime() {
    let latestDates = [];
    ports.forEach(p => {
        Object.keys(currentData[p] || {}).forEach(s => {
            const arr = currentData[p][s];
            if (arr && arr.length > 0) latestDates.push(arr[arr.length - 1].date);
        });
    });
    const maxDate = latestDates.sort().reverse()[0] || "不明";
    const el = document.getElementById('last-update-time');
    if (el) el.textContent = maxDate;
}

function renderDashboard() {
    if (!currentData) return;
    renderSummary();
    renderMainChart();
    renderAllSizesTable();
    renderBidSchedule();
}

// 3市場の最新相場カードの描画
function renderSummary() {
    const container = document.getElementById('summary-container');
    if (!container || !currentData) return;
    container.innerHTML = '';

    ports.forEach(port => {
        // 設定で非表示になっている港はスキップ
        if (!appSettings.ports.includes(port)) return;

        try {
            const portData = currentData[port];
            if (!portData) return;

            // 港の最新取引日を取得
            let latestDateStr = "";
            Object.keys(portData).forEach(size => {
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
            
            // 主要サイズをループして行を生成
            mainSizes.forEach(size => {
                const dataArr = portData[size] || [];
                const latestEntry = dataArr.find(v => v.date === latestDateStr);
                const prevEntry = dataArr.length > 1 ? (latestEntry ? dataArr[dataArr.indexOf(latestEntry) - 1] : dataArr[dataArr.length - 1]) : null;

                let priceHtml = '-', volHtml = '-', diffHtml = '', trendHtml = '', trendClass = 'trend-equal';
                if (latestEntry) {
                    priceHtml = `${latestEntry.price.toFixed(0)}<span class="currency">円</span>`;
                    volHtml = `${latestEntry.volume.toFixed(1)}t`;
                    
                    if (prevEntry) {
                        const diff = latestEntry.price - prevEntry.price;
                        if (diff > 0) {
                            diffHtml = `<span class="price-diff diff-up">+${diff.toFixed(0)}</span>`;
                            trendHtml = '上昇 ↗';
                            trendClass = 'trend-up';
                        } else if (diff < 0) {
                            diffHtml = `<span class="price-diff diff-down">${diff.toFixed(0)}</span>`;
                            trendHtml = '下落 ↘';
                            trendClass = 'trend-down';
                        } else {
                            diffHtml = `<span class="price-diff diff-equal">±0</span>`;
                            trendHtml = '横ばい →';
                            trendClass = 'trend-equal';
                        }
                    } else {
                        diffHtml = `<span class="price-diff diff-equal">-</span>`;
                        trendHtml = '-';
                    }
                } else {
                    priceHtml = `<span class="no-data">取引なし</span>`;
                }

                rowsHtml += `
                    <div class="summary-row">
                        <div class="summary-size-name">${size}</div>
                        <div class="summary-values-group">
                            <div class="summary-price">${priceHtml}</div>
                            <div class="summary-diff">${diffHtml}</div>
                            <div class="summary-trend ${trendClass}">${trendHtml}</div>
                            <div class="summary-volume">${volHtml}</div>
                        </div>
                    </div>`;
            });

            const memo = getMemo(latestDateStr, port);
            card.innerHTML = `
                <div class="summary-card-header">
                    <div>
                        <div class="summary-port-title">${port}</div>
                        <div class="summary-date-sub">最新取引日: ${latestDateStr}</div>
                    </div>
                    <button class="btn-memo" onclick="event.stopPropagation(); openMemoModal('${latestDateStr}', '${port}')">${memo ? '📝 メモあり' : '📝 メモ追加'}</button>
                </div>
                ${memo ? `<div class="memo-preview">📝 ${memo}</div>` : ''}
                <div class="summary-rows-container">${rowsHtml}</div>`;
            container.appendChild(card);
        } catch (e) { console.warn(`Summary rendering failed for ${port}:`, e); }
    });

    if (container.innerHTML === '') container.innerHTML = '<p>表示対象の港がありません。設定から表示する港を有効にしてください。</p>';
}

// 統合折れ線グラフの描画
function renderMainChart() {
    const ctx = document.getElementById('main-chart');
    if (!ctx || !currentData) return;

    const datasets = [];
    const portColors = {
        '枕崎': { border: '#00d4ff', bg: 'rgba(0, 212, 255, 0.1)' },
        '焼津': { border: '#ffaa00', bg: 'rgba(255, 170, 0, 0.1)' },
        '山川': { border: '#3fb950', bg: 'rgba(63, 185, 80, 0.1)' }
    };

    // 日付オフセット（日数）を取得
    const dayOffset = getComparisonDayOffset(currentCompare);

    ports.forEach(port => {
        if (!appSettings.ports.includes(port)) return;

        const portData = currentData[port] ? currentData[port][currentSize] : null;
        if (!portData || portData.length === 0) return;

        // 現在のデータ（実線）を追加
        const filteredData = filterDataByRange(portData, currentRange);
        if (filteredData.length === 0) return;

        const color = portColors[port] || { border: '#999', bg: 'rgba(150, 150, 150, 0.1)' };

        datasets.push({
            label: `${port} (${currentSize})`,
            data: filteredData.map(d => ({ x: d.date, y: d.price, volume: d.volume, prevPrice: d.prevPrice })),
            borderColor: color.border,
            backgroundColor: color.bg,
            borderWidth: 3,
            borderDash: [],
            tension: 0.2,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false
        });

        // 過去データ（点線）を追加（比較対象が指定されている場合）
        if (currentCompare !== 'none' && dayOffset > 0) {
            const historicalData = getHistoricalData(portData, dayOffset, currentRange);
            if (historicalData.length > 0) {
                const historicalColorValue = parseInt(color.border.substring(1), 16);
                const r = (historicalColorValue >> 16) & 255;
                const g = (historicalColorValue >> 8) & 255;
                const b = historicalColorValue & 255;
                const historicalColor = `rgba(${r}, ${g}, ${b}, 0.35)`;

                datasets.push({
                    label: `${port} (${getComparisonLabel(currentCompare)})`,
                    data: historicalData.map(d => ({ x: d.date, y: d.price, volume: d.volume, prevPrice: d.prevPrice, isHistorical: true })),
                    borderColor: historicalColor,
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.2,
                    pointRadius: 2,
                    pointHoverRadius: 4,
                    fill: false
                });
            }
        }
    });

    const theme = themes[currentTheme] || themes.dark;
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                labels: {
                    color: theme.text,
                    font: { size: 12, weight: 'bold' }
                }
            },
            tooltip: {
                enabled: true,
                backgroundColor: theme.tooltipBg,
                titleColor: theme.text,
                bodyColor: theme.text,
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                callbacks: {
                    title: function(context) {
                        if (context.length > 0) {
                            const dataPoint = context[0].raw;
                            const isHistorical = dataPoint.isHistorical;
                            const baseDate = new Date(context[0].label);
                            const dayOffset = getComparisonDayOffset(currentCompare);
                            const offsetDate = isHistorical ? new Date(baseDate.getTime() + dayOffset * 24 * 60 * 60 * 1000) : baseDate;
                            return offsetDate.toISOString().split('T')[0];
                        }
                        return '';
                    },
                    label: function(context) {
                        const dataPoint = context.raw;
                        const label = `${context.dataset.label}: ${dataPoint.y}円`;
                        if (dataPoint.volume) {
                            return label + ` (水揚: ${dataPoint.volume.toFixed(1)}t)`;
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'day',
                    displayFormats: { day: 'M/D' },
                    tooltipFormat: 'YYYY/MM/DD'
                },
                grid: { color: theme.grid, borderDash: [2, 2] },
                ticks: { color: theme.text, font: { size: 10 } }
            },
            y: {
                grid: { color: theme.grid },
                ticks: {
                    color: theme.text,
                    font: { size: 10 },
                    callback: function(value) { return value + '円'; }
                }
            }
        }
    };

    if (mainChart) {
        mainChart.destroy();
    }

    if (typeof Chart !== 'undefined' && datasets.length > 0) {
        mainChart = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: options
        });

        // グラフ外のクリック・タップ時にツールチップを非表示にする
        const chartContainer = document.querySelector('.main-chart-container');
        if (chartContainer) {
            const dismissTooltip = function(event) {
                // グラフコンテナ内のクリックは無視
                if (chartContainer.contains(event.target)) return;
                
                // グラフ外がクリック/タップされた場合
                if (mainChart) {
                    // アクティブな要素をクリア（ツールチップを消す）
                    mainChart.setActiveElements([]);
                    mainChart.update('none'); // アニメーションなしで更新
                }
            };

            // クリック・タップ両対応
            document.addEventListener('click', dismissTooltip);
            document.addEventListener('touchend', dismissTooltip);
        }
    }
}

// 比較値から日数オフセットを取得
function getComparisonDayOffset(compareValue) {
    const offsets = {
        'none': 0,
        '1m': 30,
        '3m': 91,
        '6m': 182,
        '1y': 365
    };
    return offsets[compareValue] || 0;
}

// 比較ラベルを取得
function getComparisonLabel(compareValue) {
    const labels = {
        'none': 'なし',
        '1m': '1ヶ月前',
        '3m': '3ヶ月前',
        '6m': '半年前',
        '1y': '1年前'
    };
    return labels[compareValue] || 'なし';
}

// 過去データを抽出（日付をオフセットして現在のグラフX軸に合わせる）
function getHistoricalData(portData, dayOffset, currentRange) {
    if (!portData || dayOffset <= 0) return [];

    // 現在の時間範囲の最新日を取得
    let latestDate = null;
    portData.forEach(d => {
        const date = new Date(d.date);
        if (!latestDate || date > latestDate) latestDate = date;
    });
    
    if (!latestDate) return [];

    // 過去のデータ期間を計算
    const targetEndDate = new Date(latestDate.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    const rangeMs = currentRange === 'all' ? Infinity : parseInt(currentRange) * 24 * 60 * 60 * 1000;
    const targetStartDate = new Date(targetEndDate.getTime() - rangeMs);

    // 過去のデータを抽出
    const historicalData = portData.filter(d => {
        const date = new Date(d.date);
        return date >= targetStartDate && date <= targetEndDate;
    });

    // 日付を現在のグラフに合わせてオフセット
    const offsetData = historicalData.map(d => {
        const pastDate = new Date(d.date);
        const currentDate = new Date(pastDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
        return {
            date: currentDate.toISOString().split('T')[0],
            price: d.price,
            volume: d.volume,
            prevPrice: d.prevPrice
        };
    });

    return offsetData;
}

// 全サイズ最新相場一覧テーブルの描画
function renderAllSizesTable() {
    const tbody = document.getElementById('all-sizes-table-body');
    if (!tbody || !currentData) return;

    tbody.innerHTML = '';
    const rows = [];

    ports.forEach(port => {
        if (!appSettings.ports.includes(port)) return;

        const portData = currentData[port];
        if (!portData) return;

        Object.keys(portData).forEach(size => {
            const arr = portData[size];
            if (!arr || arr.length === 0) return;

            const latest = arr[arr.length - 1];
            const prev = arr.length > 1 ? arr[arr.length - 2] : null;
            let diffVal = '-';
            let diffClass = '';

            if (prev) {
                const diff = latest.price - prev.price;
                if (diff > 0) {
                    diffVal = `+${diff.toFixed(0)}`;
                    diffClass = 'diff-up';
                } else if (diff < 0) {
                    diffVal = `${diff.toFixed(0)}`;
                    diffClass = 'diff-down';
                } else {
                    diffVal = '±0';
                    diffClass = 'diff-equal';
                }
            }

            rows.push({
                port,
                size,
                price: latest.price,
                diffVal,
                diffClass,
                volume: latest.volume,
                vessel: latest.vessel || '-',
                date: latest.date
            });
        });
    });

    // 日付と市場、サイズで並べ替え
    rows.sort((a, b) => b.date.localeCompare(a.date) || a.port.localeCompare(b.port));

    if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">表示可能なデータがありません</td></tr>';
        return;
    }

    rows.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${r.port}</strong></td>
            <td>${r.size}</td>
            <td class="table-price-val">${r.price.toFixed(0)}円</td>
            <td class="${r.diffClass}">${r.diffVal}</td>
            <td>${r.volume.toFixed(1)}t</td>
            <td><span class="vessel-text">${r.vessel}</span></td>
            <td class="table-date-val">${r.date}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filterDataByRange(data, range) {
    if (!data || range === 'all') return data;
    const now = typeof moment !== 'undefined' ? moment() : new Date();
    return data.filter(d => {
        const date = new Date(d.date);
        const diffDays = (now - date) / (1000 * 60 * 60 * 24);
        return diffDays <= parseInt(range);
    });
}

function showDetail(port, portData, latestDateStr) {
    const modal = document.getElementById('detail-modal'), modalBody = document.getElementById('modal-body');
    if (!modal || !modalBody || !portData) return;

    let rowsHtml = '';
    Object.keys(portData).forEach(size => {
        const arr = portData[size], latest = arr.find(v => v.date === latestDateStr);
        if (!latest) return;
        const prev = arr.length > 1 ? (arr[arr.indexOf(latest) - 1] || arr[arr.length - 2]) : null;
        let diffHtml = '';
        if (prev) {
            const diff = latest.price - prev.price;
            diffHtml = diff > 0 ? `<span class="price-diff diff-up">+${diff.toFixed(0)}</span>` : (diff < 0 ? `<span class="price-diff diff-down">${diff.toFixed(0)}</span>` : `<span class="price-diff diff-equal">±0</span>`);
        }
        rowsHtml += `
            <div class="summary-row">
                <div class="summary-size-name">${size} ${latest.vessel ? `<span class="vessel-badge">🚢 ${latest.vessel}</span>` : ''}</div>
                <div class="summary-values-group">
                    <span class="now-price">${latest.price.toFixed(0)}<span class="currency">円</span></span>
                    <span class="now-volume">${latest.volume.toFixed(1)}t</span>
                    <div class="diff-area">${diffHtml}</div>
                </div>
            </div>`;
    });
    modalBody.innerHTML = `<div class="summary-port-title" style="margin-bottom:8px;">${port} 全サイズ一覧</div><div class="summary-date-sub" style="margin-bottom:15px;">取引日: ${latestDateStr}</div><div class="summary-rows-container">${rowsHtml}</div>`;
    modal.classList.add('active');
}

function renderBidSchedule() {
    const latestC = document.getElementById('latest-bid-container'), archiveC = document.getElementById('archive-bid-container');
    if (!latestC || !bidScheduleData) return;
    latestC.innerHTML = ''; archiveC.innerHTML = '';

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const upcomingBids = [];
    const pastBids = [];

    bidScheduleData.forEach(bid => {
        if (bid.bid_date >= todayStr) {
            upcomingBids.push(bid);
        } else {
            pastBids.push(bid);
        }
    });

    upcomingBids.sort((a, b) => new Date(a.bid_date) - new Date(b.bid_date));
    pastBids.sort((a, b) => new Date(b.bid_date) - new Date(a.bid_date));

    let activeBids = upcomingBids.length > 0 ? upcomingBids : (pastBids.length > 0 ? [pastBids[0]] : []);
    let archivedBids = upcomingBids.length > 0 ? pastBids : (pastBids.length > 0 ? pastBids.slice(1) : []);

    const createBidCard = (bid, isArchive) => {
        let itemsH = '';
        (bid.items || []).forEach(item => {
            itemsH += `<tr><td>${item.category}</td><td>${item.size}</td><td>${item.type}</td><td class="volume-val">${(item.volume || 0).toFixed(1)}<span class="volume-unit">t</span></td></tr>`;
        });

        const calculatedTotal = (bid.items || []).reduce((sum, item) => sum + (parseFloat(item.volume) || 0), 0);
        const displayTotal = (bid.total_volume !== undefined && bid.total_volume !== null) ? bid.total_volume : calculatedTotal;

        const card = document.createElement('div');
        card.className = `bid-card ${isArchive ? 'archive' : ''}`;
        card.innerHTML = `
            <div class="bid-card-header">
                <div class="bid-info-main">
                    <h2>${bid.vessel_name}</h2>
                    <div class="bid-dates">
                        <span class="bid-date-highlight">入札予定日: ${bid.bid_date}</span>
                        <span>情報:${bid.delivery_date}</span>
                    </div>
                </div>
                <div class="vessel-badge">🚢 ${bid.tonnage}t積</div>
            </div>
            <div class="bid-table-container">
                <table class="bid-table"><thead><tr><th>カテゴリ</th><th>サイズ</th><th>区分</th><th style="text-align:right;">数量</th></tr></thead>
                <tbody>${itemsH}<tr class="category-row"><td colspan="3">合計重量 (Bカツオ等)</td><td class="volume-val">${displayTotal.toFixed(1)}<span class="volume-unit">t</span></td></tr></tbody>
                </table>
            </div>`;
        return card;
    };

    activeBids.forEach(bid => latestC.appendChild(createBidCard(bid, false)));
    archivedBids.forEach(bid => archiveC.appendChild(createBidCard(bid, true)));

    const arcSec = document.querySelector('.archive-section');
    if (arcSec) arcSec.style.display = archivedBids.length > 0 ? 'block' : 'none';
}

function setupFilters() {
    // 期間フィルター
    document.querySelectorAll('.btn-filter').forEach(btn => btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentRange = btn.dataset.range;
        renderMainChart();
    }));

    // サイズフィルター
    const sizeSelector = document.getElementById('chart-size-selector');
    if (sizeSelector) {
        sizeSelector.addEventListener('change', (e) => {
            currentSize = e.target.value;
            renderMainChart();
        });
    }

    // 過去比較フィルター
    const compareSelector = document.getElementById('chart-compare-selector');
    if (compareSelector) {
        compareSelector.addEventListener('change', (e) => {
            currentCompare = e.target.value;
            renderMainChart();
        });
    }

    document.querySelectorAll('#btn-refresh').forEach(btn => {
        btn.addEventListener('click', () => location.reload());
    });
}

function setupThemeSwitcher() {
    document.querySelectorAll('.theme-option').forEach(btn => btn.addEventListener('click', () => {
        const t = btn.dataset.theme;
        document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.body.className = `theme-${t}`;
        currentTheme = t;
        try { localStorage.setItem('katsuo_theme', t); } catch(e) {}
        renderDashboard();
    }));
}

function setupTabs() {
    document.querySelectorAll('.tab-item').forEach(btn => btn.addEventListener('click', () => {
        const id = btn.dataset.tab;
        if (activeTab === id) return;
        document.querySelectorAll('.tab-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
        document.getElementById(`view-${id}`).classList.add('active');
        activeTab = id;
        if (id === 'summary') {
            renderDashboard();
        }
    }));
}

function setupModal() {
    const m = document.getElementById('detail-modal'), c = document.getElementById('modal-close');
    if (c && m) { c.onclick = () => m.classList.remove('active'); m.onclick = (e) => { if (e.target === m) m.classList.remove('active'); }; }
}

function setupSpeciesModal() {
    const modal = document.getElementById('species-modal');
    const btnOpen = document.getElementById('btn-species-list');
    const btnClose = document.getElementById('species-close');
    if (!modal || !btnOpen || !btnClose) return;

    btnOpen.onclick = () => modal.classList.add('active');
    btnClose.onclick = () => modal.classList.remove('active');
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };
}

function setupHolidayModal() {
    const modal = document.getElementById('holiday-modal');
    const btnOpen = document.getElementById('btn-holiday-list');
    const btnClose = document.getElementById('holiday-close');
    if (!modal || !btnOpen || !btnClose) return;

    btnOpen.onclick = () => modal.classList.add('active');
    btnClose.onclick = () => modal.classList.remove('active');
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };
}

// --- メモ機能 (localStorage) ---
const MEMO_KEY = 'katsuo_memos';
function getMemo(d, p) { try { return (JSON.parse(localStorage.getItem(MEMO_KEY) || '{}')[d] || {})[p] || ''; } catch { return ''; } }
function saveMemo(d, p, t) { try { const m = JSON.parse(localStorage.getItem(MEMO_KEY) || '{}'); if (!m[d]) m[d] = {}; if (t.trim()) m[d][p] = t; else delete m[d][p]; localStorage.setItem(MEMO_KEY, JSON.stringify(m)); } catch { } }
function openMemoModal(d, p) {
    const m = document.getElementById('memo-modal'), t = document.getElementById('memo-textarea');
    if (!m || !t) return;
    document.getElementById('memo-date').textContent = `${p} / ${d}`;
    const pe = document.getElementById('memo-port');
    pe.dataset.date = d;
    pe.dataset.port = p;
    t.value = getMemo(d, p);
    m.classList.add('active');
    t.focus();
}
function setupMemoModal() {
    const m = document.getElementById('memo-modal'), s = document.getElementById('memo-save-btn'), c = document.getElementById('memo-cancel-btn'), p = document.getElementById('memo-port');
    if (!m) return;
    s.onclick = () => {
        saveMemo(p.dataset.date, p.dataset.port, document.getElementById('memo-textarea').value);
        m.classList.remove('active');
        renderSummary();
    };
    c.onclick = () => m.classList.remove('active');
    m.onclick = (e) => { if (e.target === m) m.classList.remove('active'); };
}

// --- 設定機能 ---
const SETTINGS_KEY = 'katsuo_app_settings';
let appSettings = {
    theme: 'dark',
    fontSize: 'medium',
    ports: ['枕崎', '焼津', '山川']
};

function setupSettings() {
    const modal = document.getElementById('settings-modal');
    const btnOpen = document.getElementById('btn-settings');
    const btnClose = document.getElementById('settings-close');

    if (btnOpen) btnOpen.onclick = () => modal.classList.add('active');
    if (btnClose) btnClose.onclick = () => modal.classList.remove('active');
    if (modal) modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };

    // テーマ選択
    document.querySelectorAll('.theme-option').forEach(btn => btn.addEventListener('click', () => {
        appSettings.theme = btn.dataset.theme;
        applyAppSettings();
        saveAppSettings();
    }));

    // 文字サイズ
    document.querySelectorAll('.btn-setting-toggle[data-font]').forEach(btn => btn.addEventListener('click', () => {
        appSettings.fontSize = btn.dataset.font;
        applyAppSettings();
        saveAppSettings();
    }));

    // 港チェックボックス
    const setupCheckbox = (id, val) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.onchange = () => {
            if (el.checked) {
                if (!appSettings.ports.includes(val)) appSettings.ports.push(val);
            } else {
                appSettings.ports = appSettings.ports.filter(v => v !== val);
            }
            applyAppSettings();
            saveAppSettings();
        };
    };

    setupCheckbox('check-port-makurazaki', '枕崎');
    setupCheckbox('check-port-yaizu', '焼津');
    setupCheckbox('check-port-yamagawa', '山川');
}

function applyAppSettings() {
    document.body.className = `theme-${appSettings.theme}`;
    document.querySelectorAll('.theme-option').forEach(b => b.classList.toggle('active', b.dataset.theme === appSettings.theme));

    document.documentElement.className = `font-${appSettings.fontSize}`;
    document.querySelectorAll('.btn-setting-toggle[data-font]').forEach(b => b.classList.toggle('active', b.dataset.font === appSettings.fontSize));

    const syncPort = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.checked = appSettings.ports.includes(val);
    };
    syncPort('check-port-makurazaki', '枕崎');
    syncPort('check-port-yaizu', '焼津');
    syncPort('check-port-yamagawa', '山川');

    renderDashboard();
}

function saveAppSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(appSettings)); } catch(e) {}
}

function loadAllSettings() {
    let saved = null;
    try { saved = localStorage.getItem(SETTINGS_KEY); } catch(e) {}
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            appSettings = { ...appSettings, ...parsed };
        } catch (e) { console.warn("Failed to parse settings", e); }
    }
    applyAppSettings();
}

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});
