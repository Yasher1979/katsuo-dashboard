const ports = ["枕崎", "焼津", "山川"];
const mainSizesForSummary = ["1.8kg下", "1.8kg上", "2.5kg上", "4.5kg上"];

// テーマごとの配色設定
const themes = {
    dark: { text: "#8b949e", grid: "rgba(48, 54, 61, 0.3)", tooltipBg: "rgba(13, 17, 23, 0.9)" },
    light: { text: "#656d76", grid: "rgba(208, 215, 222, 0.5)", tooltipBg: "rgba(255, 255, 255, 0.95)" },
    ocean: { text: "#aabccf", grid: "rgba(0, 77, 153, 0.4)", tooltipBg: "rgba(0, 26, 51, 0.95)" }
};

let currentData = null;
let bidScheduleData = null;
let currentRange = '30';
let currentTheme = 'dark';
let activeTab = 'summary';
let charts = {};

async function initDashboard() {
    console.log("Initializing Dashboard...");
    try {
        const startTime = Date.now();

        // データの並列ロード
        const [marketRes, bidRes, newsRes] = await Promise.all([
            fetch(`../data/katsuo_market_data.json?v=${Date.now()}`).catch(e => ({ ok: false })),
            fetch(`../data/bid_schedule.json?v=${Date.now()}`).catch(e => ({ ok: false })),
            fetch(`../data/katsuo_news.json?v=${Date.now()}`).catch(e => ({ ok: false }))
        ]);

        let mRes = marketRes;
        if (!mRes.ok) mRes = await fetch(`/data/katsuo_market_data.json?v=${Date.now()}`).catch(e => ({ ok: false }));
        if (mRes.ok) currentData = await mRes.json();

        let bRes = bidRes;
        if (!bRes.ok) bRes = await fetch(`/data/bid_schedule.json?v=${Date.now()}`).catch(e => ({ ok: false }));
        if (bRes.ok) bidScheduleData = await bRes.json();

        let nRes = newsRes;
        if (!nRes.ok) nRes = await fetch(`/data/katsuo_news.json?v=${Date.now()}`).catch(e => ({ ok: false }));

        if (nRes.ok) {
            window.katsuoNewsData = await nRes.json();
            console.log("News data loaded:", window.katsuoNewsData);
        } else {
            console.warn("News data load failed.");
        }

        if (!currentData) throw new Error("Market data could not be loaded.");

        // テーマの読み込み
        const savedTheme = localStorage.getItem('katsuo_theme') || 'dark';
        currentTheme = savedTheme;
        document.body.className = `theme-${savedTheme}`;
        document.querySelectorAll('.btn-theme').forEach(b => b.classList.toggle('active', b.dataset.theme === savedTheme));

        renderDashboard();
        renderSummary();
        renderBidSchedule();
        renderNews();
        updateInsights();
        setupFilters();
        setupThemeSwitcher();
        setupTabs();
        setupModal();
        setupMemoModal();
        setupSettings(); // 設定機能の初期化
        loadAllSettings(); // 全設定の読み込み

        // 初期タブに応じたコントロール表示
        updateControlVisibility(activeTab);

        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, 1000 - elapsed);
        setTimeout(() => {
            const splash = document.getElementById('splash-screen');
            if (splash) splash.classList.add('fade-out');
        }, delay);

        const hideTooltips = (e) => {
            if (e.target.tagName !== 'CANVAS') {
                Object.values(charts).forEach(chart => {
                    if (chart?.tooltip?.getActiveElements().length > 0) {
                        chart.tooltip.setActiveElements([], { x: 0, y: 0 });
                        chart.update();
                    }
                });
            }
        };
        document.addEventListener('click', hideTooltips);
        document.addEventListener('touchstart', hideTooltips, { passive: true });

    } catch (error) {
        console.error('Fatal Error during Dashboard Init:', error);
        const splash = document.getElementById('splash-screen');
        if (splash) splash.classList.add('fade-out');
        const container = document.getElementById('summary-container');
        if (container) container.innerHTML = `<p style="color:red;padding:20px;">エラーが発生しました: ${error.message}<br>キャッシュをクリアして再読み込みしてください。</p>`;
    }
}

function renderDashboard() {
    if (!currentData) return;
    ports.forEach(port => {
        try {
            const filteredPortData = filterDataByRange(currentData[port], currentRange);
            updateOrCreateChart(port, filteredPortData);
        } catch (e) { console.warn(`Chart rendering failed for ${port}:`, e); }
    });
}

function renderSummary() {
    const container = document.getElementById('summary-container');
    if (!container || !currentData) return;
    container.innerHTML = '';

    ports.forEach(port => {
        try {
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

                let priceHtml = '-', volHtml = '-', diffHtml = '', vesselHtml = '';
                if (latestEntry) {
                    priceHtml = latestEntry.price.toFixed(1);
                    volHtml = latestEntry.volume.toFixed(1);
                    if (prevEntry) {
                        const diff = latestEntry.price - prevEntry.price;
                        if (diff > 0) diffHtml = `<span class="price-diff diff-up">▲${diff.toFixed(1)}</span>`;
                        else if (diff < 0) diffHtml = `<span class="price-diff diff-down">▼${Math.abs(diff).toFixed(1)}</span>`;
                        else diffHtml = `<span class="price-diff diff-equal">±0</span>`;
                    }
                    if (latestEntry.vessel) vesselHtml = `<span class="vessel-badge">🚢 ${latestEntry.vessel}</span>`;
                }

                rowsHtml += `
                    <div class="summary-row">
                        <div class="summary-label-group"><div class="summary-label">${size}</div>${vesselHtml}</div>
                        <div class="summary-values">
                            <div class="price-vol-group"><span class="now-price">${priceHtml}<span class="currency">円</span></span></div>
                            <div class="now-volume">${volHtml}<span class="currency">t</span></div>
                        </div>
                        <div class="diff-area">${diffHtml}</div>
                    </div>`;
            });

            const memo = getMemo(latestDateStr, port);
            card.innerHTML = `
                <div class="summary-card-header">
                    <div><div class="summary-port">${port}</div><div class="summary-date">最新取引日: ${latestDateStr}</div></div>
                    <button class="btn-memo" onclick="event.stopPropagation(); openMemoModal('${latestDateStr}', '${port}')">${memo ? '📝' : '📝'}</button>
                </div>
                ${memo ? `<div class="memo-preview">📝 ${memo}</div>` : ''}
                <div class="summary-rows-container">${rowsHtml}</div>`;
            container.appendChild(card);
        } catch (e) { console.warn(`Summary rendering failed for ${port}:`, e); }
    });
    if (container.innerHTML === '') container.innerHTML = '<p>表示可能なデータがありません。</p>';
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
            diffHtml = diff > 0 ? `<span class="price-diff diff-up">▲${diff.toFixed(1)}</span>` : (diff < 0 ? `<span class="price-diff diff-down">▼${Math.abs(diff).toFixed(1)}</span>` : `<span class="price-diff diff-equal">±0</span>`);
        }
        rowsHtml += `
            <div class="summary-row">
                <div class="summary-label-group"><div class="summary-label">${size}</div>${latest.vessel ? `<span class="vessel-badge">🚢 ${latest.vessel}</span>` : ''}</div>
                <div class="summary-values">
                    <div class="price-vol-group"><span class="now-price">${latest.price.toFixed(1)}<span class="currency">円</span></span></div>
                    <div class="now-volume">${latest.volume.toFixed(1)}<span class="currency">t</span></div>
                </div>
                <div class="diff-area">${diffHtml}</div>
            </div>`;
    });
    modalBody.innerHTML = `<div class="summary-port">${port} 全サイズ一覧</div><div class="summary-date">取引日: ${latestDateStr}</div><div class="summary-rows-container">${rowsHtml}</div>`;
    modal.classList.add('active');
}

function renderBidSchedule() {
    const latestC = document.getElementById('latest-bid-container'), archiveC = document.getElementById('archive-bid-container');
    if (!latestC || !bidScheduleData) return;
    latestC.innerHTML = ''; archiveC.innerHTML = '';
    const sorted = [...bidScheduleData].sort((a, b) => new Date(b.bid_date) - new Date(a.bid_date));

    sorted.forEach((bid, i) => {
        let itemsH = '';
        (bid.items || []).forEach(item => {
            // PSカツオは除外するが、それ以外はすべて表示（重量0も含む）
            if (item.category === 'PS カツオ') return;
            itemsH += `<tr><td>${item.category}</td><td>${item.size}</td><td>${item.type}</td><td class="volume-val">${(item.volume || 0).toFixed(1)}<span class="volume-unit">t</span></td></tr>`;
        });
        // マップURLの生成
        const parseCoord = (str) => {
            const parts = str.match(/([NSEW])\s*(\d+)[°°]\s*(\d+)/);
            if (!parts) return null;
            const [_, dir, deg, min] = parts;
            let val = parseInt(deg) + (parseInt(min) / 60);
            if (dir === 'S' || dir === 'W') val = -val;
            return val;
        };
        const lat = (bid.sea_area && bid.sea_area.lat) ? parseCoord(bid.sea_area.lat.split('〜')[0]) : null;
        const lon = (bid.sea_area && bid.sea_area.lon) ? parseCoord(bid.sea_area.lon.split('〜')[0]) : null;
        const mapUrl = (lat !== null && lon !== null)
            ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((bid.sea_area?.lat || '') + ' ' + (bid.sea_area?.lon || ''))}`;

        const card = document.createElement('div');
        card.className = `bid-card ${i > 0 ? 'archive' : ''}`;
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
            <a href="${mapUrl}" target="_blank" class="bid-sea-area" title="Google Mapsで表示">
                <span class="sea-area-title">📍 操業海域 (こちらをタップして地図を表示)</span>
                <div class="sea-area-coords"><span>${bid.sea_area.lat}</span> / <span>${bid.sea_area.lon}</span></div>
            </a>
            <div class="bid-table-container">
                <table class="bid-table"><thead><tr><th>カテゴリ</th><th>サイズ</th><th>区分</th><th style="text-align:right;">数量</th></tr></thead>
                <tbody>${itemsH}<tr class="category-row"><td colspan="3">合計重量 (Bカツオ等)</td><td class="volume-val">${bid.total_volume.toFixed(1)}<span class="volume-unit">t</span></td></tr></tbody>
                </table>
            </div>`;
        if (i === 0) latestC.appendChild(card); else archiveC.appendChild(card);
    });
    const arcSec = document.querySelector('.archive-section');
    if (arcSec) arcSec.style.display = sorted.length > 1 ? 'block' : 'none';
}

function filterDataByRange(portData, range) {
    if (!portData || range === 'all') return portData;
    const now = typeof moment !== 'undefined' ? moment() : new Date();
    const res = {};
    Object.keys(portData).forEach(size => {
        if (!Array.isArray(portData[size])) return;
        res[size] = portData[size].filter(d => {
            const date = new Date(d.date);
            const diffDays = (now - date) / (1000 * 60 * 60 * 24);
            return diffDays <= parseInt(range);
        });
    });
    return res;
}

function calculateSimpleMovingAverage(data, win) {
    if (!data || data.length < win) return (data || []).map(d => ({ x: d.date, y: null }));
    return data.map((d, i) => {
        if (i < win - 1) return { x: d.date, y: null };
        let sum = 0; for (let j = 0; j < win; j++) sum += data[i - j].price;
        return { x: d.date, y: sum / win };
    });
}

const mainSizesForCharts = ['1.8kg下', '1.8kg上', '2.5kg上', '4.5kg上'];
const chartColors = { '1.8kg下': '#ff6384', '1.8kg上': '#36a2eb', '2.5kg上': '#ffce56', '4.5kg上': '#4bc0c0' };

function updateOrCreateChart(port, portData) {
    const ctx = document.getElementById(`chart-${port}`);
    if (!ctx || !portData) return;
    const datasets = [];
    mainSizesForCharts.forEach(size => {
        const arr = portData[size]; if (!arr || !arr.length) return;
        const color = chartColors[size] || '#999';
        datasets.push({ type: 'line', label: `${size} 価格`, data: arr.map(d => ({ x: d.date, y: d.price })), borderColor: color, backgroundColor: color, borderWidth: 2, tension: 0.4, yAxisID: 'y', pointRadius: 5, fill: false });
        datasets.push({ type: 'line', label: `${size} 5日平均`, data: calculateSimpleMovingAverage(arr, 5), borderColor: color, borderWidth: 1, borderDash: [5, 5], tension: 0.4, pointRadius: 0, yAxisID: 'y', fill: false });
        datasets.push({ type: 'bar', label: `${size} 水揚量`, data: arr.map(d => ({ x: d.date, y: d.volume })), backgroundColor: color + '80', yAxisID: 'yVolume', barPercentage: 0.5 });
    });

    let minP = 200, maxP = 250, maxV = 100;
    datasets.forEach(ds => {
        ds.data.forEach(p => {
            if (p.y !== null) {
                if (ds.yAxisID === 'y') { if (p.y < minP) minP = p.y; if (p.y > maxP) maxP = p.y; }
                else if (ds.yAxisID === 'yVolume') { if (p.y > maxV) maxV = p.y; }
            }
        });
    });

    const theme = themes[currentTheme] || themes.dark;
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'nearest',
            intersect: false,
        },
        onClick: (e, elements, chart) => {
            const hud = document.getElementById('premium-hud');

            // すでにHUDが表示されている間にタップした場合、HUDを閉じる。
            // 閉じた際、Chart.jsのこのイベントが継続して再オープンするのを防ぐため、一旦終了する。
            if (hud && hud.classList.contains('active')) {
                hud.classList.remove('active');
                // 閉じた直後であることをマーキング
                hud.dataset.justClosed = "true";
                setTimeout(() => delete hud.dataset.justClosed, 300);
                return;
            }

            // 閉じた瞬間の連打やバブリングによる再オープンを防止
            if (hud && hud.dataset.justClosed) return;

            if (elements && elements.length > 0) {
                const firstPoint = elements[0];
                const dateVal = chart.data.datasets[firstPoint.datasetIndex].data[firstPoint.index].x;
                const d = new Date(dateVal);
                const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;

                let hud = document.getElementById('premium-hud');
                if (!hud) {
                    hud = document.createElement('div');
                    hud.id = 'premium-hud';
                    hud.className = 'premium-hud-panel';
                    document.body.appendChild(hud);
                }

                let gridHtml = '';
                chart.data.datasets.forEach(ds => {
                    // 平均線(pointRadius: 0)はHUDに含めない
                    if (ds.pointRadius === 0) return;

                    // 【最重要】インデックスではなく日付(dateVal)で正確なデータを検索
                    const entry = (ds.data || []).find(pt => pt.x === dateVal);
                    const val = entry ? entry.y : null;

                    if (val !== null && val !== undefined) {
                        const unit = ds.yAxisID === 'yVolume' ? 't' : '円';
                        gridHtml += `
                        <div class="hud-item">
                            <span class="hud-label">${ds.label.replace('価格', '').replace('水揚量', '')}</span>
                            <span class="hud-value">${val.toLocaleString()}<span class="hud-unit">${unit}</span></span>
                        </div>`;
                    }
                });

                hud.innerHTML = `
                    <div class="hud-header">
                        <span class="hud-title">📊 ${dateStr} 詳細レポート</span>
                        <button class="hud-close" onclick="document.getElementById('premium-hud').classList.remove('active')">&times;</button>
                    </div>
                    <div class="hud-grid">${gridHtml}</div>
                `;
                hud.classList.add('active');

                const closeHandler = (ev) => {
                    // HUD自身、またはチャート（キャンバス）をクリックした場合は、それぞれのハンドラに任せる
                    if (hud.contains(ev.target) || ev.target.tagName === 'CANVAS') return;

                    // 背景部分などのクリックでHUDを隠す
                    hud.classList.remove('active');

                    // リスナーを自ら削除
                    document.removeEventListener('click', closeHandler);
                    document.removeEventListener('touchstart', closeHandler);
                };

                // 表示から少し（100ms）遅らせてリスナーを追加することで、表示時のクリックでの即閉じを防止
                setTimeout(() => {
                    document.addEventListener('click', closeHandler);
                    document.addEventListener('touchstart', closeHandler, { passive: true });
                }, 100);
            }
        },
        plugins: {
            legend: {
                labels: { color: theme.text, font: { size: 10 } }
            },
            tooltip: { enabled: false }
        },
        scales: {
            x: {
                type: 'time',
                time: { unit: 'day', displayFormats: { day: 'M/d' } },
                grid: { color: theme.grid, borderDash: [2, 2] },
                ticks: { color: theme.text, font: { size: 10 } }
            },
            y: {
                position: 'left',
                grid: { color: theme.grid },
                ticks: { color: theme.text, font: { size: 10 } }
            },
            yVolume: {
                position: 'right',
                grid: { drawOnChartArea: false },
                ticks: { color: theme.text, font: { size: 10 } }
            }
        }
    };

    if (charts[port]) {
        charts[port].data.datasets = datasets;
        charts[port].options = options;
        charts[port].update();
    } else if (typeof Chart !== 'undefined') {
        charts[port] = new Chart(ctx, { type: 'line', data: { datasets }, options: options });
    }
}

function setupFilters() {
    document.querySelectorAll('.btn-filter').forEach(btn => btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); currentRange = btn.dataset.range; renderDashboard();
    }));
    document.querySelectorAll('#btn-refresh, #btn-refresh-floating').forEach(btn => {
        btn.addEventListener('click', () => location.reload());
    });
    document.getElementById('btn-reload-insight')?.addEventListener('click', () => updateInsights());
}

function setupThemeSwitcher() {
    document.querySelectorAll('.btn-theme').forEach(btn => btn.addEventListener('click', () => {
        const t = btn.dataset.theme; document.querySelectorAll('.btn-theme').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); document.body.className = `theme-${t}`;
        currentTheme = t; localStorage.setItem('katsuo_theme', t); renderDashboard(); renderSummary();
    }));
}

function updateInsights() {
    const el = document.getElementById('insight-content'); if (!currentData || !el) return;

    // 熱量のある分析文言の生成
    const insights = [];

    // 1. 全体的なトレンド
    let totalVolume = 0;
    ports.forEach(p => {
        Object.keys(currentData[p] || {}).forEach(s => {
            const arr = currentData[p][s];
            if (arr.length > 0) totalVolume += arr[arr.length - 1].volume;
        });
    });

    if (totalVolume > 500) {
        insights.push({ title: "💎 供給爆発・異常水揚げ", text: "かつてないほどの水揚げが各港で爆発しています！相場は一時的に緩む可能性がありますが、高鮮度な個体を一気に確保する千載一遇の好機です。", memo: "大量確保を推奨" });
    } else if (totalVolume < 100) {
        insights.push({ title: "⚠️ 枯渇警報・争奪戦勃発", text: "水揚げが干上がっています！市場はかつてない争奪戦の様相を呈し、単価は垂直立ち上げ。冷静な資金管理と、何が何でも確保する執念の双方が求められます。", memo: "高値掴み厳重注意" });
    }

    // 2. 港別の特記
    ports.forEach(p => {
        const size = "2.5kg上";
        const arr = (currentData[p] || {})[size];
        if (arr && arr.length >= 2) {
            const last = arr[arr.length - 1], prev = arr[arr.length - 2];
            const diff = last.price - prev.price;
            if (diff >= 15) {
                insights.push({ title: `⚡ ${p}相場爆騰`, text: `${p}の${size}が前日比+${diff.toFixed(1)}円の爆騰！買い向かう熱量に一切の衰えがなく、勢いは加速しています。`, memo: "強気買い推奨" });
            } else if (diff <= -15) {
                insights.push({ title: `🌊 ${p}価格崩落`, text: `${p}の${size}が${diff.toFixed(1)}円の大幅下落！市場心理は一気に弱気に転換！この混乱こそ、底値を見極める「プロの眼」が輝く瞬間！`, memo: "底値見極め、逆張りチャンス！" });
            }
        }
    });

    const sel = insights.length ? insights[Math.floor(Math.random() * insights.length)] : { title: "❄️ 凪の静寂・安定相場", text: "現在は嵐の前の静けさか、極めて安定した推移。こういう時こそ、緻密なデータを精査し、次の暴風雨に備える「守り」から「攻め」への準備期間です。", memo: "次期トレンド注視" };

    el.innerHTML = `
        <div class="insight-heat">
            <p><strong>🔥 AIアナリスト熱血診断 (${sel.title}):</strong></p>
            <p class="insight-text" style="font-size: 1.1rem; font-weight: 700; color: var(--text-color);">${sel.text}</p>
            <div class="insight-footer" style="margin-top: 10px; border-top: 1px dashed var(--grid-color); padding-top: 8px;">
                <span class="insight-memo" style="background: var(--accent-color); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">戦略: ${sel.memo}</span>
            </div>
        </div>
    `;
}
function analyzeVolatility(d) {
    const res = []; ports.forEach(p => Object.keys(d[p] || {}).forEach(s => {
        const arr = d[p][s]; if (arr.length < 2) return;
        const diff = arr[arr.length - 1].price - arr[arr.length - 2].price;
        if (Math.abs(diff) >= 10) res.push({ title: diff > 0 ? "急騰" : "急落", text: `${p} ${s} が ${diff.toFixed(1)}円 変動。`, memo: arr[arr.length - 1].date });
    })); return res;
}
function analyzeSupplyDemand(d) {
    const res = []; ports.forEach(p => Object.keys(d[p] || {}).forEach(s => {
        const arr = d[p][s]; if (arr.length < 2) return;
        const pD = arr[arr.length - 1].price - arr[arr.length - 2].price, vD = arr[arr.length - 1].volume - arr[arr.length - 2].volume;
        if (vD >= 20 && pD >= 2) res.push({ title: "強気", text: `${p} ${s} 水揚げ増でも値上がり。`, memo: "実需強" });
    })); return res;
}
function analyzePortSpread(d) {
    const res = [];['4.5kg上', '2.5kg上'].forEach(s => {
        const p1 = getLatestData(d, '焼津', s), p2 = getLatestData(d, '枕崎', s);
        if (p1 && p2 && p1.date === p2.date && Math.abs(p1.price - p2.price) >= 20)
            res.push({ title: "格差", text: `${s} 焼津・枕崎間で格差あり。`, memo: `${p1.price} vs ${p2.price}` });
    }); return res;
}

function getLatestData(d, p, s) { const a = (d[p] || {})[s]; return a && a.length ? a[a.length - 1] : null; }


function setupModal() {
    const m = document.getElementById('detail-modal'), c = document.getElementById('modal-close');
    if (c && m) { c.onclick = () => m.classList.remove('active'); m.onclick = (e) => { if (e.target === m) m.classList.remove('active'); }; }
}
function setupTabs() {
    document.querySelectorAll('.tab-item').forEach(btn => btn.addEventListener('click', () => {
        const id = btn.dataset.tab; if (activeTab === id) return;
        document.querySelectorAll('.tab-item').forEach(b => b.classList.remove('active')); btn.classList.add('active');
        document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active')); document.getElementById(`view-${id}`).classList.add('active');
        activeTab = id; updateControlVisibility(id); if (id === 'charts') renderDashboard();
    }));
}

function updateControlVisibility(tabId) {
    const actionRow = document.querySelector('.header-action-row');
    const filterGroup = document.querySelector('.filter-group');
    if (!actionRow || !filterGroup) return;

    if (tabId === 'charts') {
        filterGroup.style.display = 'flex';
    } else {
        filterGroup.style.display = 'none';
    }
}
// --- 設定機能 (localStorage連動) ---
const SETTINGS_KEY = 'katsuo_app_settings';
let appSettings = {
    theme: 'dark',
    fontSize: 'medium',
    ports: ['枕崎', '焼津', '山川'],
    compactMode: false,
    animation: true,
    chartFill: true
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
        const t = btn.dataset.theme;
        appSettings.theme = t;
        applyAppSettings();
        saveAppSettings();
    }));

    // 文字サイズ
    document.querySelectorAll('.btn-setting-toggle[data-font]').forEach(btn => btn.addEventListener('click', () => {
        const size = btn.dataset.font;
        appSettings.fontSize = size;
        applyAppSettings();
        saveAppSettings();
    }));

    // チェックボックス (港、オプション)
    const setupCheckbox = (id, key, isArray = false, val = null) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.onchange = () => {
            if (isArray) {
                if (el.checked) { if (!appSettings[key].includes(val)) appSettings[key].push(val); }
                else { appSettings[key] = appSettings[key].filter(v => v !== val); }
            } else {
                appSettings[key] = el.checked;
            }
            applyAppSettings();
            saveAppSettings();
        };
    };

    setupCheckbox('check-port-makurazaki', 'ports', true, '枕崎');
    setupCheckbox('check-port-yaizu', 'ports', true, '焼津');
    setupCheckbox('check-port-yamagawa', 'ports', true, '山川');
    setupCheckbox('check-compact', 'compactMode');
    setupCheckbox('check-animation', 'animation');
    setupCheckbox('check-chart-fill', 'chartFill');
}

function applyAppSettings() {
    // 1. テーマ反映
    document.body.className = `theme-${appSettings.theme}`;
    document.querySelectorAll('.theme-option').forEach(b => b.classList.toggle('active', b.dataset.theme === appSettings.theme));

    // 2. 文字サイズ反映
    document.documentElement.className = `font-${appSettings.fontSize}`;
    document.querySelectorAll('.btn-setting-toggle[data-font]').forEach(b => b.classList.toggle('active', b.dataset.font === appSettings.fontSize));

    // 3. コンパクトモード反映
    document.body.classList.toggle('compact-mode', appSettings.compactMode);
    const cbCompact = document.getElementById('check-compact');
    if (cbCompact) cbCompact.checked = appSettings.compactMode;

    // 4. アニメーション反映 (簡易実装: クラス付与)
    document.body.classList.toggle('no-animation', !appSettings.animation);
    const cbAnim = document.getElementById('check-animation');
    if (cbAnim) cbAnim.checked = appSettings.animation;

    // 5. 港のチェックボックス同期
    const syncPort = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.checked = appSettings.ports.includes(val);
    };
    syncPort('check-port-makurazaki', '枕崎');
    syncPort('check-port-yaizu', '焼津');
    syncPort('check-port-yamagawa', '山川');

    const cbFill = document.getElementById('check-chart-fill');
    if (cbFill) cbFill.checked = appSettings.chartFill;

    // 再レンダリングが必要な要素
    renderDashboard();
    renderSummary();
}

function saveAppSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(appSettings));
}

function loadAllSettings() {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            appSettings = { ...appSettings, ...parsed };
        } catch (e) { console.warn("Failed to parse settings", e); }
    }
    applyAppSettings();
}
const MEMO_KEY = 'katsuo_memos';
function getMemo(d, p) { try { return (JSON.parse(localStorage.getItem(MEMO_KEY) || '{}')[d] || {})[p] || ''; } catch { return ''; } }
function saveMemo(d, p, t) { try { const m = JSON.parse(localStorage.getItem(MEMO_KEY) || '{}'); if (!m[d]) m[d] = {}; if (t.trim()) m[d][p] = t; else delete m[d][p]; localStorage.setItem(MEMO_KEY, JSON.stringify(m)); } catch { } }
function openMemoModal(d, p) { const m = document.getElementById('memo-modal'), t = document.getElementById('memo-textarea'); if (!m || !t) return; document.getElementById('memo-date').textContent = `${p} / ${d}`; const pe = document.getElementById('memo-port'); pe.dataset.date = d; pe.dataset.port = p; t.value = getMemo(d, p); m.classList.add('active'); t.focus(); }
function setupMemoModal() {
    const m = document.getElementById('memo-modal'), s = document.getElementById('memo-save-btn'), c = document.getElementById('memo-cancel-btn'), p = document.getElementById('memo-port');
    if (!m) return; s.onclick = () => { saveMemo(p.dataset.date, p.dataset.port, document.getElementById('memo-textarea').value); m.classList.remove('active'); renderSummary(); };
    c.onclick = () => m.classList.remove('active'); m.onclick = (e) => { if (e.target === m) m.classList.remove('active'); };
}

window.displayedNewsCount = 0;

function renderNews(isLoadMore = false) {
    const container = document.getElementById('news-container');
    const loadMoreBtnContainer = document.getElementById('news-load-more-container');
    const data = window.katsuoNewsData;
    if (!container || !data) return;

    // 初回読み込み時はソートして初期化
    if (!isLoadMore) {
        data.sort((a, b) => new Date(b.date) - new Date(a.date));
        container.innerHTML = '';
        window.displayedNewsCount = 0;
    }

    const nextBatch = data.slice(window.displayedNewsCount, window.displayedNewsCount + 5);

    nextBatch.forEach((news, idx) => {
        const card = document.createElement('a');
        card.className = 'news-card new-item';
        card.style.animationDelay = `${idx * 0.1}s`;
        card.href = news.url;
        card.target = '_blank';

        let icon = '📰';
        if (news.category === '漁況') icon = '🐟';
        if (news.category === '燃費油') icon = '⛽';
        if (news.category === '規制') icon = '⚖️';
        if (news.category === '市場') icon = '📈';

        card.innerHTML = `
            <div class="news-category">${icon} ${news.category}</div>
            <h4>${news.title}</h4>
            <div class="news-summary">${news.summary}</div>
            <div class="news-footer">
                <div class="news-source-group">
                    <span class="news-source">${news.source}</span>
                    <span class="news-date">${news.date}</span>
                </div>
                <span class="read-more">記事詳細 ↗</span>
            </div>
        `;
        container.appendChild(card);
    });

    window.displayedNewsCount += nextBatch.length;

    // もっと見るボタンの表示制御
    if (loadMoreBtnContainer) {
        if (window.displayedNewsCount < data.length) {
            loadMoreBtnContainer.style.display = 'flex';
        } else {
            loadMoreBtnContainer.style.display = 'none';
        }
    }
}

// ページネーション用ボタンのセットアップ
function setupNewsLoadMore() {
    const btn = document.getElementById('btn-load-more-news');
    if (btn) {
        btn.onclick = () => renderNews(true);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    setupNewsLoadMore();
});
