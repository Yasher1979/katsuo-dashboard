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

        // ニュースデータの処理
        let nRes = newsRes;
        if (!nRes.ok) nRes = await fetch(`/data/katsuo_news.json?v=${Date.now()}`).catch(e => ({ ok: false }));
        if (nRes.ok) {
            window.katsuoNewsData = await nRes.json();
            console.log("News data loaded:", window.katsuoNewsData);
        } else {
            console.warn("News data load failed.");
        }

        if (!currentData) throw new Error("Market data could not be loaded.");

        // デバッグ情報の表示
        const debugInfo = document.createElement('div');
        debugInfo.id = 'debug-version-info';
        debugInfo.style = 'position:fixed; bottom:0; left:0; background:rgba(0,0,0,0.8); color:#0f0; font-size:10px; padding:2px 5px; z-index:9999; pointer-events:none;';

        // 最新日付の特定
        let latestDates = [];
        ports.forEach(p => {
            Object.keys(currentData[p] || {}).forEach(s => {
                const arr = currentData[p][s];
                if (arr && arr.length > 0) latestDates.push(arr[arr.length - 1].date);
            });
        });
        const maxDate = latestDates.sort().reverse()[0] || "No Data";
        debugInfo.textContent = `Build: 20260309-v5 | Data: ${maxDate} | Files: B${bidScheduleData ? '1' : '0'} N${window.katsuoNewsData ? '1' : '0'}`;
        document.body.appendChild(debugInfo);
        console.log("Latest Date in Data:", maxDate);

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
        setupSpeciesModal(); // 種類表モーダルの初期化
        setupMemoModal();
        setupSettings(); // 設定機能の初期化
        loadAllSettings(); // 全設定の読み込み
        setupCalculator(); // 原価計算機の初期化

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
            // 全カテゴリを表示（重量0も含む）
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
        const latCoord = (bid.sea_area && bid.sea_area.lat) ? parseCoord(bid.sea_area.lat.split('〜')[0]) : null;
        const lonCoord = (bid.sea_area && bid.sea_area.lon) ? parseCoord(bid.sea_area.lon.split('〜')[0]) : null;

        // 合計重量の自動計算（データにない場合のバックアップ）
        const calculatedTotal = (bid.items || []).reduce((sum, item) => sum + (parseFloat(item.volume) || 0), 0);
        const displayTotal = (bid.total_volume !== undefined && bid.total_volume !== null) ? bid.total_volume : calculatedTotal;

        const mapUrl = (latCoord !== null && lonCoord !== null)
            ? `https://www.google.com/maps/search/?api=1&query=${latCoord},${lonCoord}`
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
                <div class="sea-area-coords"><span>${bid.sea_area?.lat || '不明'}</span> / <span>${bid.sea_area?.lon || '不明'}</span></div>
            </a>
            <div class="bid-table-container">
                <table class="bid-table"><thead><tr><th>カテゴリ</th><th>サイズ</th><th>区分</th><th style="text-align:right;">数量</th></tr></thead>
                <tbody>${itemsH}<tr class="category-row"><td colspan="3">合計重量 (Bカツオ等)</td><td class="volume-val">${displayTotal.toFixed(1)}<span class="volume-unit">t</span></td></tr></tbody>
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
                time: { unit: 'day', displayFormats: { day: 'M/D' }, tooltipFormat: 'M/D' },
                grid: { color: theme.grid, borderDash: [2, 2] },
                ticks: { color: theme.text, font: { size: 10 }, maxRotation: 0 },
                title: { display: true, text: '日付', color: theme.text, font: { size: 10 } }
            },
            y: {
                position: 'left',
                grid: { color: theme.grid },
                ticks: {
                    color: theme.text,
                    font: { size: 10 },
                    callback: function (value) { return value + '円'; }
                },
                title: { display: true, text: '単価（円/kg）', color: theme.text, font: { size: 10 } }
            },
            yVolume: {
                position: 'right',
                grid: { drawOnChartArea: false },
                ticks: {
                    color: theme.text,
                    font: { size: 10 },
                    callback: function (value) { return value + 't'; }
                },
                title: { display: true, text: '水揚量（t）', color: theme.text, font: { size: 10 } }
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

async function updateInsights() {
    const el = document.getElementById('insight-content');
    const btn = document.getElementById('btn-reload-insight');
    if (!currentData || !el) return;

    // ローディング演出
    if (btn) btn.classList.add('loading');
    el.style.opacity = '0.5';

    // 擬似的な計算待ち（「分析中」という実感を出すため）
    await new Promise(r => setTimeout(r, 600));

    // 1. 全データの中から「真の最新日」を特定
    let latestGlobalDate = "";
    ports.forEach(p => {
        Object.keys(currentData[p] || {}).forEach(s => {
            const arr = currentData[p][s];
            if (arr && arr.length > 0) {
                const d = arr[arr.length - 1].date;
                if (!latestGlobalDate || d > latestGlobalDate) latestGlobalDate = d;
            }
        });
    });

    if (!latestGlobalDate) {
        el.innerHTML = '<p>分析可能なデータが不足しています。</p>';
        if (btn) btn.classList.remove('loading');
        el.style.opacity = '1';
        return;
    }

    const allInsights = [];

    // --- 分析ロジックの統合 ---

    // A. ボラティリティ分析 (急騰・急落)
    const volatilityResults = analyzeVolatility(currentData);
    volatilityResults.forEach(r => {
        if (r.memo === latestGlobalDate) {
            allInsights.push({
                title: `⚡ 相場${r.title}`,
                text: r.text,
                memo: "値動き注視",
                type: r.title === "急騰" ? "danger" : "warning"
            });
        }
    });

    // B. 需給分析
    const supplyResults = analyzeSupplyDemand(currentData);
    supplyResults.forEach(r => {
        allInsights.push({ title: "📊 需給バランス", text: r.text, memo: r.memo, type: "info" });
    });

    // C. 港間格差分析
    const spreadResults = analyzePortSpread(currentData);
    spreadResults.forEach(r => {
        allInsights.push({ title: "⚖️ 拠点間価格差", text: r.text, memo: `差額: ${r.memo}円`, type: "info" });
    });

    // D. 全体ボリューム分析
    let dayVolume = 0;
    ports.forEach(p => {
        Object.keys(currentData[p] || {}).forEach(s => {
            const latest = currentData[p][s].find(v => v.date === latestGlobalDate);
            if (latest) dayVolume += latest.volume;
        });
    });

    if (dayVolume > 300) {
        allInsights.push({ title: "🌊 潤沢な供給量", text: `${latestGlobalDate}の総水揚げ量は${dayVolume.toFixed(1)}tと豊富です。`, memo: "安定調達期", type: "success" });
    } else if (dayVolume > 0 && dayVolume < 50) {
        allInsights.push({ title: "⚠️ 供給不足の兆候", text: `${latestGlobalDate}の総水揚げが${dayVolume.toFixed(1)}tと極少です。`, memo: "争奪戦注意", type: "danger" });
    }

    // 表示用に最大3つ選択（「更新」のたびに入れ替わるようランダムにシャッフル）
    const displayInsights = allInsights
        .sort(() => Math.random() - 0.5) // シャッフル
        .sort((a, b) => (a.type === 'danger' ? -1 : 1)) // 重要度を上に
        .slice(0, 3);

    if (displayInsights.length === 0) {
        displayInsights.push({
            title: "❄️ 凪の相場推移",
            text: "目立った変動はなく、安定した推移を見せています。次なる漁況の変化に向けた準備期間です。",
            memo: "現状維持",
            type: "info"
        });
    }

    el.innerHTML = displayInsights.map(sel => `
        <div class="insight-item ${sel.type}" style="margin-bottom: 12px; padding: 12px; border-left: 5px solid var(--accent-color, #007bff); background: rgba(255,255,255,0.03); border-radius: 8px; animation: slideIn 0.4s easeOut;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
                <span style="font-weight: 800; font-size: 0.95rem; display: flex; align-items: center; gap: 6px;">${sel.title}</span>
                <span style="font-size: 0.75rem; background: rgba(255,255,255,0.15); padding: 2px 8px; border-radius: 12px; font-weight: 600;">${sel.memo}</span>
            </div>
            <p style="font-size: 1rem; margin: 0; line-height: 1.5; color: var(--text-color); font-weight: 500;">${sel.text}</p>
        </div>
    `).join('');

    el.style.opacity = '1';
    if (btn) btn.classList.remove('loading');
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

function setupSpeciesModal() {
    const modal = document.getElementById('species-modal');
    const btnOpen = document.getElementById('btn-species-list');
    const btnClose = document.getElementById('species-close');
    if (!modal || !btnOpen || !btnClose) return;

    btnOpen.onclick = () => modal.classList.add('active');
    btnClose.onclick = () => modal.classList.remove('active');
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };
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
        if (news.category === '燃費油' || news.category === '燃油') icon = '⛽';
        if (news.category === '規制') icon = '⚖️';
        if (news.category === '市場') icon = '📈';
        if (news.category === '食品加工') icon = '🏭';
        if (news.category === '物流') icon = '🚚';
        if (news.category === '新商品') icon = '🆕';

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

// ============================================================
//  🧮 鰹節製造原価計算機 Pro - メインロジック
// ============================================================
function setupCalculator() {
    // --- 状態管理 ---
    const calcState = {
        displayValue: '0',
        currentTarget: 'purchase_price',  // 'purchase_price' | 'sell_price' | 'custom_overhead'
        multiplier: 5,
        overheadItems: [{ cost: 250, label: '基本経費' }],
        purchasePrice: null,
        sellPrice: null,
        pendingOp: null,
        pendingValue: null,
        justCalc: false
    };

    // --- DOM参照 ---
    const dispMain = document.getElementById('calc-display-main');
    const dispLabel = document.getElementById('calc-display-label');
    const dispSub = document.getElementById('calc-display-sub');
    const overheadDisplay = document.getElementById('current-overhead-display');
    const overheadDetail = document.getElementById('current-overhead-detail');

    if (!dispMain) return; // 計算機タブが存在しない場合はスキップ

    // --- ユーティリティ ---
    const fmt = (n) => Math.round(n).toLocaleString('ja-JP');
    const getOverheadTotal = () => calcState.overheadItems.reduce((s, i) => s + i.cost, 0);
    const getManufactureCost = (price, mult, oh) => price * mult + oh;

    function updateDisplay() {
        const num = parseFloat(calcState.displayValue);
        dispMain.textContent = isNaN(num) ? '0' : parseFloat(calcState.displayValue).toLocaleString('ja-JP');

        // ラベルとサブ表示
        const labelMap = { purchase_price: '🐟 仕入単価（円/kg）', sell_price: '💴 販売単価（円/kg）', custom_overhead: '💡 カスタム経費（円）' };
        dispLabel.textContent = labelMap[calcState.currentTarget] || '入力中';

        if (calcState.purchasePrice !== null) {
            const oh = getOverheadTotal();
            const mfg = getManufactureCost(calcState.purchasePrice, calcState.multiplier, oh);
            dispSub.textContent = `仕入${fmt(calcState.purchasePrice)}円 → 製造原価 ${fmt(mfg)}円/kg`;
        } else {
            dispSub.textContent = calcState.pendingOp ? `計算中 (${calcState.pendingOp})` : '入力中';
        }
    }

    function updateOverheadDisplay() {
        const total = getOverheadTotal();
        overheadDisplay.textContent = `${total}円`;
        overheadDetail.textContent = `（${calcState.overheadItems.map(i => i.label).join('＋')}）`;
    }

    // --- テンキー入力処理 ---
    function inputDigit(d) {
        if (calcState.justCalc) { calcState.displayValue = '0'; calcState.justCalc = false; }
        if (calcState.displayValue === '0') {
            calcState.displayValue = d;
        } else if (calcState.displayValue.length < 10) {
            calcState.displayValue += d;
        }
        updateDisplay();
    }

    function inputDot() {
        if (!calcState.displayValue.includes('.')) {
            calcState.displayValue += '.';
            updateDisplay();
        }
    }

    function clearCurrent() {
        calcState.displayValue = '0';
        updateDisplay();
    }

    function clearAll() {
        calcState.displayValue = '0';
        calcState.pendingOp = null;
        calcState.pendingValue = null;
        calcState.justCalc = false;
        updateDisplay();
    }

    function handleOp(op) {
        const val = parseFloat(calcState.displayValue);
        if (calcState.pendingOp && calcState.pendingValue !== null) {
            // 連続演算
            const result = applyOp(calcState.pendingValue, op, val);
            calcState.displayValue = String(result);
        }
        calcState.pendingValue = parseFloat(calcState.displayValue);
        calcState.pendingOp = op;
        calcState.justCalc = true;
        updateDisplay();
    }

    function applyOp(a, op, b) {
        if (op === '+') return a + b;
        if (op === '−') return a - b;
        if (op === '×') return a * b;
        if (op === '÷') return b !== 0 ? a / b : 0;
        return b;
    }

    function handleEquals() {
        const val = parseFloat(calcState.displayValue);
        if (calcState.pendingOp && calcState.pendingValue !== null) {
            const result = applyOp(calcState.pendingValue, calcState.pendingOp, val);
            calcState.displayValue = String(Math.round(result * 100) / 100);
            calcState.pendingOp = null;
            calcState.pendingValue = null;
        }
        calcState.justCalc = true;
        updateDisplay();
    }

    // --- 「今すぐ計算」メイン処理 ---
    function runMainCalc() {
        const val = parseFloat(calcState.displayValue);
        if (isNaN(val) || val <= 0) {
            dispSub.textContent = '⚠ 正しい金額を入力してください';
            return;
        }

        if (calcState.currentTarget === 'purchase_price') {
            calcState.purchasePrice = val;
            dispSub.textContent = `✅ 仕入単価: ${fmt(val)}円/kg を設定しました`;
        } else if (calcState.currentTarget === 'sell_price') {
            calcState.sellPrice = val;
            dispSub.textContent = `✅ 販売単価: ${fmt(val)}円/kg を設定しました`;
        } else if (calcState.currentTarget === 'custom_overhead') {
            calcState.overheadItems = [{ cost: Math.round(val), label: `カスタム経費` }];
            updateOverheadDisplay();
            dispSub.textContent = `✅ カスタム経費: ${fmt(val)}円 を設定しました`;
        }

        // 分析画面を自動更新
        renderAnalysis(calcState);
        updateDisplay();
    }

    // --- テンキーバインド ---
    for (let i = 0; i <= 9; i++) {
        const btn = document.getElementById(`key-${i}`);
        if (btn) btn.onclick = () => inputDigit(String(i));
    }
    const btn00 = document.getElementById('key-00');
    if (btn00) btn00.onclick = () => { inputDigit('0'); inputDigit('0'); };
    const btnDot = document.getElementById('key-dot');
    if (btnDot) btnDot.onclick = inputDot;
    const btnCC = document.getElementById('key-cc');
    if (btnCC) btnCC.onclick = clearCurrent;
    const btnCA = document.getElementById('key-ca');
    if (btnCA) btnCA.onclick = clearAll;
    const btnEq = document.getElementById('key-eq');
    if (btnEq) btnEq.onclick = handleEquals;
    const btnCalcNow = document.getElementById('key-calc-now');
    if (btnCalcNow) btnCalcNow.onclick = runMainCalc;

    // 演算子
    document.querySelectorAll('.key-op[data-op]').forEach(btn => {
        btn.onclick = () => handleOp(btn.dataset.op);
    });

    // --- 入力項目切替 ---
    document.querySelectorAll('.preset-target').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.preset-target').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            calcState.currentTarget = btn.dataset.target;
            calcState.displayValue = '0';
            updateDisplay();
        };
    });

    // --- 掛率プリセット ---
    document.querySelectorAll('.preset-multiplier').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.preset-multiplier').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            calcState.multiplier = parseFloat(btn.dataset.mult);
            updateDisplay();
            if (calcState.purchasePrice !== null) renderAnalysis(calcState);
        };
    });

    // --- 加工コストプリセット（複数選択・積み上げ）---
    document.querySelectorAll('.preset-cost').forEach(btn => {
        btn.onclick = () => {
            const cost = parseInt(btn.dataset.cost);
            const label = btn.dataset.label;

            if (cost === 0) {
                // リセット
                calcState.overheadItems = [];
                document.querySelectorAll('.preset-cost').forEach(b => b.classList.remove('selected'));
                btn.classList.remove('selected');
            } else if (btn.classList.contains('selected')) {
                // 解除
                calcState.overheadItems = calcState.overheadItems.filter(i => i.label !== label);
                btn.classList.remove('selected');
            } else {
                // 追加
                calcState.overheadItems.push({ cost, label });
                btn.classList.add('selected');
            }

            updateOverheadDisplay();
            if (calcState.purchasePrice !== null) renderAnalysis(calcState);
        };
    });

    // --- 画面切替タブ ---
    document.querySelectorAll('.calc-screen-tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.calc-screen-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const screenId = `calc-screen-${tab.dataset.screen}`;
            document.querySelectorAll('.calc-screen').forEach(s => s.classList.remove('active'));
            const screen = document.getElementById(screenId);
            if (screen) screen.classList.add('active');
        };
    });

    // --- 原価分析ボタン ---
    const btnAnalyze = document.getElementById('btn-analyze');
    if (btnAnalyze) btnAnalyze.onclick = () => {
        if (!calcState.purchasePrice) {
            document.getElementById('analysis-result-area').innerHTML =
                '<div class="analysis-empty"><p>⚠️ まず電卓入力タブで仕入単価を入力してください</p></div>';
            return;
        }
        renderAnalysis(calcState);
    };

    // --- 価格比較ボタン ---
    const btnCompare = document.getElementById('btn-compare-calc');
    if (btnCompare) btnCompare.onclick = () => {
        const priceVal = parseFloat(document.getElementById('compare-price-input').value);
        if (isNaN(priceVal) || priceVal <= 0) return;
        renderCompareTable(priceVal, calcState);
    };

    // --- 利益率逆算ボタン ---
    const btnProfit = document.getElementById('btn-profit-calc');
    if (btnProfit) btnProfit.onclick = () => {
        const sellVal = parseFloat(document.getElementById('sell-price-input').value);
        if (isNaN(sellVal) || sellVal <= 0 || !calcState.purchasePrice) return;
        renderProfitCalc(sellVal, calcState);
    };

    // --- 損益シミュレーションボタン ---
    const btnSim = document.getElementById('btn-simulate');
    if (btnSim) btnSim.onclick = () => runSimulation(calcState);

    // 仕入量から出荷量を自動計算
    const simPurchaseKg = document.getElementById('sim-purchase-kg');
    if (simPurchaseKg) simPurchaseKg.oninput = () => {
        const kg = parseFloat(simPurchaseKg.value);
        const outKg = document.getElementById('sim-sell-kg');
        if (!isNaN(kg) && outKg && !outKg.dataset.manual) {
            outKg.value = Math.round(kg / calcState.multiplier);
        }
    };
    const simSellKg = document.getElementById('sim-sell-kg');
    if (simSellKg) {
        simSellKg.oninput = () => { simSellKg.dataset.manual = '1'; };
    }

    updateDisplay();
    updateOverheadDisplay();
}

// ============================================
//  📊 原価分析レポートのレンダリング
// ============================================
function renderAnalysis(state) {
    const area = document.getElementById('analysis-result-area');
    if (!area || !state.purchasePrice) return;

    const purchasePrice = state.purchasePrice;
    const mult = state.multiplier;
    const oh = state.overheadItems.reduce((s, i) => s + i.cost, 0);
    const fmt = (n) => Math.round(n).toLocaleString('ja-JP');

    // 製造原価（原魚単価×掛率 + 経費）
    const materialCost = purchasePrice * mult;
    const mfgCost = materialCost + oh;

    // 利益計算（販売単価が設定されている場合）
    const sellPrice = state.sellPrice;
    const profit = sellPrice ? sellPrice - mfgCost : null;
    const profitRate = sellPrice ? (profit / sellPrice * 100) : null;

    // 推奨販売価格（製造原価の3段階）
    const recommendLow = Math.ceil(mfgCost * 1.1);   // +10% 最低ライン
    const recommendMid = Math.ceil(mfgCost * 1.2);   // +20% 標準
    const recommendHigh = Math.ceil(mfgCost * 1.35); // +35% 高収益

    // 歩留まり情報
    const yieldRate = (1 / mult * 100).toFixed(1);

    area.innerHTML = `
        <div class="analysis-flow">

            <!-- STEP 1: 仕入れ -->
            <div class="flow-step step-purchase">
                <div class="flow-icon">🐟</div>
                <div class="flow-content">
                    <div class="flow-title">STEP 1 : 原魚仕入れ</div>
                    <div class="flow-main-value">${fmt(purchasePrice)} <span class="flow-unit">円/kg</span></div>
                    <div class="flow-sub">歩留まり ${yieldRate}%（${mult}掛）</div>
                </div>
            </div>
            <div class="flow-arrow">↓</div>

            <!-- STEP 2: 製造 -->
            <div class="flow-step step-manufacture">
                <div class="flow-icon">🏭</div>
                <div class="flow-content">
                    <div class="flow-title">STEP 2 : 製造（歩留まり変換）</div>
                    <div class="flow-main-value">${fmt(materialCost)} <span class="flow-unit">円/kg</span></div>
                    <div class="flow-sub">${fmt(purchasePrice)} × ${mult}掛 = ${fmt(materialCost)}円</div>
                </div>
            </div>
            <div class="flow-arrow">↓</div>

            <!-- STEP 3: 加工・経費 -->
            <div class="flow-step step-overhead">
                <div class="flow-icon">⚙️</div>
                <div class="flow-content">
                    <div class="flow-title">STEP 3 : 加工・経費積み上げ</div>
                    <div class="flow-main-value">+ ${fmt(oh)} <span class="flow-unit">円/kg</span></div>
                    <div class="flow-sub">${state.overheadItems.map(i => `${i.label}: ${i.cost}円`).join('、')}</div>
                </div>
            </div>
            <div class="flow-arrow">↓</div>

            <!-- STEP 4: 製造原価 -->
            <div class="flow-step step-total highlight-step">
                <div class="flow-icon">📦</div>
                <div class="flow-content">
                    <div class="flow-title">STEP 4 : 製造原価（最低ライン）</div>
                    <div class="flow-main-value highlight-value">${fmt(mfgCost)} <span class="flow-unit">円/kg</span></div>
                    <div class="flow-sub">これを下回ると赤字！</div>
                </div>
            </div>
            <div class="flow-arrow">↓</div>

            <!-- STEP 5: 推奨販売価格 -->
            <div class="flow-step step-sell">
                <div class="flow-icon">💴</div>
                <div class="flow-content">
                    <div class="flow-title">STEP 5 : 推奨販売価格</div>
                    <div class="recommend-grid">
                        <div class="recommend-item low">
                            <span class="rec-label">最低ライン (+10%)</span>
                            <span class="rec-value">${fmt(recommendLow)}円</span>
                        </div>
                        <div class="recommend-item mid">
                            <span class="rec-label">標準利益 (+20%)</span>
                            <span class="rec-value">${fmt(recommendMid)}円</span>
                        </div>
                        <div class="recommend-item high">
                            <span class="rec-label">高収益目標 (+35%)</span>
                            <span class="rec-value">${fmt(recommendHigh)}円</span>
                        </div>
                    </div>
                </div>
            </div>

            ${sellPrice ? `
            <div class="flow-arrow">↓</div>
            <!-- 販売価格設定済みの場合：利益分析 -->
            <div class="flow-step ${profit >= 0 ? 'step-profit' : 'step-loss'}">
                <div class="flow-icon">${profit >= 0 ? '✅' : '🚨'}</div>
                <div class="flow-content">
                    <div class="flow-title">利益分析（設定販売価格: ${fmt(sellPrice)}円/kg）</div>
                    <div class="flow-main-value ${profit >= 0 ? '' : 'loss-value'}">
                        ${profit >= 0 ? '+' : ''}${fmt(profit)} <span class="flow-unit">円/kg</span>
                    </div>
                    <div class="flow-sub">
                        利益率: <strong>${profitRate.toFixed(1)}%</strong>
                        ${profit >= 0 ? '（黒字）' : '（赤字・要見直し！）'}
                    </div>
                </div>
            </div>
            ` : `
            <div class="analysis-hint">
                💡 販売単価を入力・設定すると利益分析が表示されます
            </div>`}
        </div>
    `;
}

// ============================================
//  ⚖️ 掛率比較表のレンダリング
// ============================================
function renderCompareTable(price, state) {
    const area = document.getElementById('compare-result-area');
    if (!area) return;
    const fmt = (n) => Math.round(n).toLocaleString('ja-JP');
    const oh = state.overheadItems.reduce((s, i) => s + i.cost, 0);

    const multList = [4.0, 4.5, 5.0, 5.5, 6.0, 6.5];

    const rows = multList.map(m => {
        const material = price * m;
        const total = material + oh;
        const isActive = m === state.multiplier;
        const yp = (1 / m * 100).toFixed(1);
        return `
            <tr class="${isActive ? 'active-row' : ''}">
                <td class="ct-mult">${m}掛 <small>${yp}%</small></td>
                <td class="ct-material">${fmt(material)}円</td>
                <td class="ct-oh">+${fmt(oh)}円</td>
                <td class="ct-total ${isActive ? 'active-total' : ''}">${fmt(total)}円</td>
                <td class="ct-rec">${fmt(Math.ceil(total * 1.2))}円 <small>(+20%)</small></td>
            </tr>`;
    }).join('');

    area.innerHTML = `
        <div class="compare-header-row">
            <span>仕入単価: <strong>${fmt(price)}円/kg</strong></span>
            <span>経費: <strong>${fmt(oh)}円</strong></span>
        </div>
        <div class="table-responsive">
            <table class="compare-table">
                <thead>
                    <tr>
                        <th>掛率</th>
                        <th>原料費</th>
                        <th>経費</th>
                        <th>製造原価</th>
                        <th>推奨販売 (+20%)</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

// ============================================
//  💴 利益率逆算のレンダリング
// ============================================
function renderProfitCalc(sellPrice, state) {
    const area = document.getElementById('profit-result-area');
    if (!area || !state.purchasePrice) return;
    const fmt = (n) => Math.round(n).toLocaleString('ja-JP');
    const oh = state.overheadItems.reduce((s, i) => s + i.cost, 0);
    const mfg = state.purchasePrice * state.multiplier + oh;
    const profit = sellPrice - mfg;
    const profitRate = (profit / sellPrice * 100);
    const isBlack = profit >= 0;

    area.innerHTML = `
        <div class="profit-result ${isBlack ? 'profit-black' : 'profit-red'}">
            <div class="profit-row">
                <span>製造原価</span><span>${fmt(mfg)}円/kg</span>
            </div>
            <div class="profit-row">
                <span>販売単価</span><span>${fmt(sellPrice)}円/kg</span>
            </div>
            <div class="profit-row total-row">
                <span>${isBlack ? '💰 利益' : '🚨 損失'}</span>
                <span class="${isBlack ? 'profit-pos' : 'profit-neg'}">
                    ${isBlack ? '+' : ''}${fmt(profit)}円/kg（${profitRate.toFixed(1)}%）
                </span>
            </div>
        </div>
    `;
}

// ============================================
//  📈 損益シミュレーション
// ============================================
function runSimulation(state) {
    const area = document.getElementById('sim-result-area');
    const purchaseKg = parseFloat(document.getElementById('sim-purchase-kg').value);
    const purchasePrice = parseFloat(document.getElementById('sim-purchase-price').value);
    const sellKgInput = document.getElementById('sim-sell-kg').value;
    const sellPrice = parseFloat(document.getElementById('sim-sell-price').value);

    if (isNaN(purchaseKg) || isNaN(purchasePrice) || isNaN(sellPrice)) {
        area.innerHTML = '<div class="analysis-empty"><p>⚠️ すべての項目を入力してください</p></div>';
        return;
    }

    const fmt = (n) => Math.round(n).toLocaleString('ja-JP');
    const oh = state.overheadItems.reduce((s, i) => s + i.cost, 0);

    // 出荷kg（歩留まり適用 or 手動入力）
    const sellKg = (!isNaN(parseFloat(sellKgInput)) && parseFloat(sellKgInput) > 0)
        ? parseFloat(sellKgInput)
        : Math.round(purchaseKg / state.multiplier);

    // 計算
    const totalPurchaseCost = purchaseKg * purchasePrice;        // 原魚仕入れ総額
    const totalOverhead = sellKg * oh;                           // 経費総額（製品kg換算）
    const totalMfgCost = totalPurchaseCost + totalOverhead;      // 製造総原価
    const totalRevenue = sellKg * sellPrice;                     // 売上総額
    const totalProfit = totalRevenue - totalMfgCost;             // 損益
    const profitRate = (totalProfit / totalRevenue * 100);       // 利益率
    const costPerKg = totalMfgCost / sellKg;                     // 製品1kgあたり原価
    const yieldRate = (sellKg / purchaseKg * 100).toFixed(1);   // 実際の歩留まり率

    const isBlack = totalProfit >= 0;

    area.innerHTML = `
        <div class="sim-result-card">
            <div class="sim-result-header ${isBlack ? 'sim-black' : 'sim-red'}">
                ${isBlack ? '✅ 黒字予測' : '🚨 赤字予測'} &nbsp;
                <strong>${isBlack ? '+' : ''}${fmt(totalProfit)}円</strong>
            </div>

            <div class="sim-grid">
                <div class="sim-block">
                    <div class="sim-block-label">📋 仕入れ概要</div>
                    <div class="sim-row"><span>仕入量</span><span>${fmt(purchaseKg)} kg</span></div>
                    <div class="sim-row"><span>仕入単価</span><span>${fmt(purchasePrice)} 円/kg</span></div>
                    <div class="sim-row total"><span>仕入総額</span><span>${fmt(totalPurchaseCost)} 円</span></div>
                </div>
                <div class="sim-block">
                    <div class="sim-block-label">🏭 製造・出荷</div>
                    <div class="sim-row"><span>製品出荷量</span><span>${fmt(sellKg)} kg</span></div>
                    <div class="sim-row"><span>歩留まり率</span><span>${yieldRate}%（${state.multiplier}掛相当）</span></div>
                    <div class="sim-row"><span>経費合計</span><span>${fmt(totalOverhead)} 円</span></div>
                    <div class="sim-row total"><span>製造総原価</span><span>${fmt(totalMfgCost)} 円</span></div>
                </div>
                <div class="sim-block">
                    <div class="sim-block-label">💴 売上・損益</div>
                    <div class="sim-row"><span>販売単価</span><span>${fmt(sellPrice)} 円/kg</span></div>
                    <div class="sim-row"><span>製品1kg原価</span><span>${fmt(costPerKg)} 円/kg</span></div>
                    <div class="sim-row"><span>売上総額</span><span>${fmt(totalRevenue)} 円</span></div>
                    <div class="sim-row total ${isBlack ? 'profit-pos-row' : 'profit-neg-row'}">
                        <span>${isBlack ? '💰 利益' : '🚨 損失'}</span>
                        <span>${isBlack ? '+' : ''}${fmt(totalProfit)} 円（${profitRate.toFixed(1)}%）</span>
                    </div>
                </div>
            </div>

            <div class="sim-breakeven">
                <div class="sim-be-label">⚖️ 損益分岐点（BEP）分析</div>
                <div class="sim-row"><span>BEP 販売単価</span><span>${fmt(costPerKg)} 円/kg（これ以上で黒字）</span></div>
                <div class="sim-row"><span>現在の価格優位性</span><span>${isBlack ? fmt(sellPrice - costPerKg) + ' 円/kg の余裕' : '⚠️ ' + fmt(costPerKg - sellPrice) + ' 円/kg 不足'}</span></div>
            </div>
        </div>
    `;
}


document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    setupNewsLoadMore();
});
