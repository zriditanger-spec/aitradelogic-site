// ==========================================
// 1. CONFIGURATION CMS & GLOBALS
// ==========================================
const CMS_CONFIG = { enabled: false, apiUrl: "", accessToken: "" };
const ANALYZER_URL = "https://ai-trade-analyzer.zridi-tanger.workers.dev/"; 
const CMS_URL = "https://aitradelogic.com/";

let currentMarketType = 'crypto'; 
let isMarketOpen = true;

let currentSymbol = 'BINANCE:BTCUSDT'; 
let currentAssetName = 'BTC-USDT';
let currentTimeframe = "60"; 
let currentLang = localStorage.getItem('app_lang') || 'EN'; 
let uploadedImageBase64 = null;



window.changeLanguage = function(lang) {
    currentLang = lang;
    localStorage.setItem('app_lang', lang);
    
    if(lang === 'AR') {
        document.body.setAttribute('dir', 'rtl');
    } else {
        document.body.removeAttribute('dir');
    }

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            if(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translations[lang][key];
            } else if(el.tagName === 'OPTGROUP') {
                el.label = translations[lang][key];
            } else {
                el.innerHTML = translations[lang][key];
            }
        }
    });

    const strategySelect = document.getElementById('strategy-select');
    if(strategySelect && strategySelect.value) {
        onStrategyChange(strategySelect);
    }

    if(typeof renderDynamicSections === 'function') renderDynamicSections(); 
    if(typeof fetchLiveEvents === 'function') fetchLiveEvents(); 
};

// ==========================================
// 3. BASE DE DONNÉES (MARKETS & BLOG MULTILANGUE)
// ==========================================
const marketAssets = {
    crypto: [
        { name: "BTC-USDT", symbol: "BINANCE:BTCUSDT" }, { name: "ETH-USDT", symbol: "BINANCE:ETHUSDT" },
        { name: "SOL-USDT", symbol: "BINANCE:SOLUSDT" }, { name: "XRP-USDT", symbol: "BINANCE:XRPUSDT" },
        { name: "BNB-USDT", symbol: "BINANCE:BNBUSDT" }, { name: "ADA-USDT", symbol: "BINANCE:ADAUSDT" },
        { name: "DOGE-USDT", symbol: "BINANCE:DOGEUSDT" }, { name: "DOT-USDT", symbol: "BINANCE:DOTUSDT" },
        { name: "LINK-USDT", symbol: "BINANCE:LINKUSDT" }, { name: "AVAX-USDT", symbol: "BINANCE:AVAXUSDT" },
        { name: "LTC-USDT", symbol: "BINANCE:LTCUSDT" }, { name: "SHIB-USDT", symbol: "BINANCE:SHIBUSDT" },
        { name: "MATIC-USDT", symbol: "BINANCE:MATICUSDT" }, { name: "NEAR-USDT", symbol: "BINANCE:NEARUSDT" },
        { name: "PEPE-USDT", symbol: "BINANCE:PEPEUSDT" }, { name: "WIF-USDT", symbol: "BINANCE:WIFUSDT" }
    ],
    forex: [
        { name: "Gold (XAU/USD)", symbol: "OANDA:XAUUSD" }, { name: "Silver (XAG/USD)", symbol: "OANDA:XAGUSD" },
        { name: "EUR/USD", symbol: "FX:EURUSD" }, { name: "GBP/USD", symbol: "FX:GBPUSD" },
        { name: "USD/JPY", symbol: "FX:USDJPY" }, { name: "AUD/USD", symbol: "FX:AUDUSD" },
        { name: "USD/CAD", symbol: "FX:USDCAD" }, { name: "USD/CHF", symbol: "FX:USDCHF" },
        { name: "NZD/USD", symbol: "FX:NZDUSD" }, { name: "EUR/GBP", symbol: "FX:EURGBP" },
        { name: "EUR/JPY", symbol: "FX:EURJPY" }, { name: "GBP/JPY", symbol: "FX:GBPJPY" },
        { name: "US Oil (WTI)", symbol: "TVC:USOIL" }, { name: "UK Oil (Brent)", symbol: "TVC:UKOIL" }
    ],
    stock: [
        { name: "S&P 500", symbol: "AMEX:SPY" }, { name: "Nasdaq 100", symbol: "NASDAQ:QQQ" },
        { name: "Dow Jones", symbol: "AMEX:DIA" }, { name: "Apple", symbol: "NASDAQ:AAPL" },
        { name: "Microsoft", symbol: "NASDAQ:MSFT" }, { name: "Google", symbol: "NASDAQ:GOOGL" },
        { name: "Amazon", symbol: "NASDAQ:AMZN" }, { name: "Tesla", symbol: "NASDAQ:TSLA" },
        { name: "Nvidia", symbol: "NASDAQ:NVDA" }, { name: "Meta", symbol: "NASDAQ:META" },
        { name: "AMD", symbol: "NASDAQ:AMD" }, { name: "Netflix", symbol: "NASDAQ:NFLX" }
    ]
};

const blogPosts = [];
let macroEvents = [{ date: "Syncing...", title: "Connecting AI Engine...", curr: "-", f: "-", p: "-", a: "-", impact: "Low", color: "emerald" }];

async function loadAllCryptoPairs() {
    try {
        const res = await fetch('https://api.binance.com/api/v3/exchangeInfo');
        const data = await res.json();
        const usdtPairs = data.symbols
            .filter(s => s.quoteAsset === 'USDT' && s.status === 'TRADING')
            .map(s => ({
                name: s.baseAsset + '-USDT',
                symbol: 'BINANCE:' + s.symbol
            }));
        
        if (usdtPairs.length > 0) {
            marketAssets.crypto = usdtPairs;
        }
    } catch (e) {
        console.error("Failed to load Binance pairs, using fallback list.");
    }
}

function renderChart() {
    const container = document.getElementById('tv-chart-container');
    if (!container) return;
    
    container.innerHTML = ''; 
    
    setTimeout(() => {
        new TradingView.widget({
            "autosize": true, "symbol": currentSymbol, "interval": currentTimeframe,
            "timezone": "Etc/UTC", "theme": "dark", "style": "1", "locale": currentLang.toLowerCase(),
            "enable_publishing": false, "backgroundColor": "rgba(11, 19, 32, 1)", "gridColor": "rgba(30, 41, 59, 0.5)",
            "hide_top_toolbar": false, "hide_side_toolbar": false, "hide_legend": false, "save_image": false, "container_id": "tv-chart-container",
            "toolbar_bg": "#0A101D", "studies": ["Volume@tv-basicstudies"]
        });
    }, 50);

    const label = document.getElementById('current-market-label');
    if(label) label.innerText = currentSymbol.split(':')[1] || currentSymbol;
    updateMarketStatus();
}

function updateMarketStatus() {
    const statusDot = document.getElementById('market-status-dot');
    const statusText = document.getElementById('market-status-text');
    const closedBanner = document.getElementById('market-closed-banner');
    if(!statusDot || !statusText) return;

    const now = new Date();
    const utcHour = now.getUTCHours();
    const day = now.getUTCDay();

    // Update Sessions (NY, LON, TOK, SYD)
    const sesNY = document.getElementById('ses-ny');
    const sesLon = document.getElementById('ses-lon');
    const sesTok = document.getElementById('ses-tok');
    const sesSyd = document.getElementById('ses-syd');

    if (sesNY && sesLon && sesTok && sesSyd) {
        // Reset all
        [sesNY, sesLon, sesTok, sesSyd].forEach(el => {
            el.className = "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase transition-colors text-slate-600";
        });

        // NY: 13:00 - 22:00 UTC
        if (utcHour >= 13 && utcHour < 22 && day >= 1 && day <= 5) {
            sesNY.className = "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase transition-colors bg-cyan-500/20 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]";
        }
        // LON: 08:00 - 17:00 UTC
        if (utcHour >= 8 && utcHour < 17 && day >= 1 && day <= 5) {
            sesLon.className = "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase transition-colors bg-cyan-500/20 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]";
        }
        // TOK: 00:00 - 09:00 UTC
        if (utcHour >= 0 && utcHour < 9 && day >= 1 && day <= 5) {
            sesTok.className = "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase transition-colors bg-cyan-500/20 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]";
        }
        // SYD: 22:00 - 07:00 UTC
        if ((utcHour >= 22 || utcHour < 7) && (
            (day >= 1 && day <= 4) || 
            (day === 0 && utcHour >= 22) || 
            (day === 5 && utcHour < 7)
        )) {
            sesSyd.className = "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase transition-colors bg-cyan-500/20 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]";
        }
    }

    let isOpen = false;

    if (currentMarketType === 'crypto') {
        isOpen = true;
    } else if (currentMarketType === 'forex') {
        if (day >= 1 && day <= 4) isOpen = true;
        else if (day === 0 && utcHour >= 21) isOpen = true;
        else if (day === 5 && utcHour < 21) isOpen = true;
    } else if (currentMarketType === 'stock') {
        if (day >= 1 && day <= 5) {
            const timeInMinutes = utcHour * 60 + now.getUTCMinutes();
            if (timeInMinutes >= 14 * 60 + 30 && timeInMinutes < 21 * 60) {
                isOpen = true;
            }
        }
    }

    if (isOpen) {
        isMarketOpen = true;
        statusDot.className = "w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]";
        statusText.className = "text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md uppercase tracking-widest ml-2";
        statusText.setAttribute('data-i18n', 'market_open');
        statusText.innerText = translations[currentLang]['market_open'] || "OPEN";
        if (closedBanner) closedBanner.classList.add('hidden');
    } else {
        isMarketOpen = false;
        statusDot.className = "w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]";
        statusText.className = "text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md uppercase tracking-widest ml-2";
        statusText.setAttribute('data-i18n', 'market_closed');
        statusText.innerText = translations[currentLang]['market_closed'] || "CLOSED";
        if (closedBanner) closedBanner.classList.remove('hidden');
    }
}

// Update market status every minute
setInterval(updateMarketStatus, 60000);

async function getArticles() {
    try {
        const response = await fetch(CMS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: "get_static_articles", language: currentLang })
        });
        const data = await response.json();
        if (data && data.length > 0) {
            const isLocal = window.location.protocol === 'file:' || window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
            return data.map(post => ({
                ...post,
                url: isLocal ? `${CMS_URL}blog/${post.id}` : `/blog/${post.id}`
            }));
        }
    } catch (e) {}
    return [];
}

async function getNewsArticles() {
    try {
        const response = await fetch(CMS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: "get_news_articles", language: currentLang })
        });
        const data = await response.json();
        if (data && data.length > 0) {
            const isLocal = window.location.protocol === 'file:' || window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
            return data.map(post => ({
                ...post,
                url: isLocal ? `${CMS_URL}news/${post.id}` : `/news/${post.id}`
            }));
        }
    } catch (e) {}
    return [];
}

async function getGlossaryTerms() {
    try {
        const response = await fetch(CMS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: "get_glossary_terms", language: currentLang })
        });
        const data = await response.json();
        return data || [];
    } catch (e) { 
        return []; 
    }
}

async function renderDynamicSections() {
    const blogContainer = document.getElementById('blog-container');
    const eventsContainer = document.getElementById('custom-events-container');

    if (blogContainer) {
        const articles = await getArticles();
        blogContainer.innerHTML = articles.slice(0, 4).map(post => `
            <a href="${post.url}" target="_blank" class="group bg-[#0A101D] border border-slate-800 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all flex flex-col h-full shadow-lg">
                <div class="h-40 overflow-hidden relative">
                    <img src="${post.image}" loading="lazy" width="400" height="160" onerror="this.src='https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=65&w=400&fm=webp&fit=crop'" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" alt="${post.title}">
                    <div class="absolute top-3 left-3 bg-cyan-600 text-white text-[9px] font-bold px-2 py-1 rounded uppercase">${post.category}</div>
                </div>
                <div class="p-5 flex flex-col flex-1">
                    <h3 class="text-[15px] font-bold text-white mb-2 line-clamp-2">${post.title}</h3>
                    <p class="text-xs text-slate-400 line-clamp-3 mb-4 flex-1">${post.excerpt}</p>
                </div>
            </a>
        `).join('');
    }

    if (eventsContainer) {
        eventsContainer.innerHTML = macroEvents.map(ev => `
            <div class="min-w-[280px] max-w-[280px] bg-[#0A101D] border border-slate-800 rounded-2xl p-5 snap-start hover:border-cyan-500/50 transition-colors flex flex-col shrink-0 cursor-default shadow-lg">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-[11px] text-slate-300 font-medium tracking-wide">${ev.date}</span>
                    <span class="bg-${ev.color}-500/20 text-${ev.color}-400 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">${ev.impact}</span>
                </div>
                <h3 class="text-[15px] font-bold text-white mb-1.5 leading-snug line-clamp-2">${ev.title}</h3>
                <p class="text-[11px] text-slate-500 mb-6 font-bold tracking-widest">${ev.curr}</p>
                <div class="grid grid-cols-3 gap-2 mt-auto border-t border-slate-800/80 pt-4">
                    <div><span class="block text-[10px] text-slate-500 mb-1">Forecast</span><span class="text-[13px] text-white font-bold">${ev.f}</span></div>
                    <div><span class="block text-[10px] text-slate-500 mb-1">Previous</span><span class="text-[13px] text-white font-bold">${ev.p}</span></div>
                    <div><span class="block text-[10px] text-slate-500 mb-1">Actual</span><span class="text-[13px] text-white font-bold">${ev.a}</span></div>
                </div>
            </div>
        `).join('');
    }
}

function renderMarketPills(searchQuery = '') {
    const list = document.getElementById('coin-list');
    if (!list) return;

    let assets = marketAssets[currentMarketType] || [];
    
    if (searchQuery.trim() !== '') {
        assets = assets.filter(asset => asset.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    const slicedAssets = assets.slice(0, 30);

    list.innerHTML = slicedAssets.map((asset, index) => {
        const isActive = currentSymbol === asset.symbol;
        const btnClass = isActive 
            ? 'coin-btn px-5 py-2.5 rounded-[20px] text-[11px] font-bold tracking-wider uppercase bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all flex-shrink-0 animate-fade-in-up' 
            : 'coin-btn px-5 py-2.5 rounded-[20px] text-[11px] font-bold tracking-wider uppercase bg-[#0F172A]/80 border border-slate-700 text-slate-400 hover:text-white hover:border-cyan-500/50 transition-all flex-shrink-0 animate-fade-in-up';
        
        return `<button type="button" style="animation-delay: ${index * 30}ms" onclick="changeCoin('${asset.symbol}', '${asset.name}')" class="${btnClass}">${asset.name}</button>`;
    }).join('');
}

function renderTopNavigation() {
    let currentCategory = 'crypto';
    for (const [category, assets] of Object.entries(marketAssets)) {
        if (assets.some(a => a.symbol === currentSymbol)) {
            currentCategory = category; break;
        }
    }
    const topAssets = marketAssets[currentCategory].slice(0, 4);
    const topNavContainer = document.querySelector('.hidden.md\\:flex.gap-4');
    
    if (topNavContainer) {
        topNavContainer.innerHTML = topAssets.map(asset => {
            const isActive = asset.symbol === currentSymbol;
            const btnClass = isActive 
                ? 'coin-btn btn-active px-4 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase' 
                : 'coin-btn btn-outline px-4 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase';
            
            return `<button type="button" onclick="changeCoin('${asset.symbol}', '${asset.name}')" class="${btnClass}">${asset.name}</button>`;
        }).join('');
    }
}

function updateTerminalLinks() {
    const terminalButtons = document.querySelectorAll('a[href^="app.html"]');
    terminalButtons.forEach(btn => {
        btn.href = `app.html?symbol=${currentSymbol}&name=${encodeURIComponent(currentAssetName)}`;
    });
}

window.switchMarket = function(market, btnElement) {
    currentMarketType = market;
    currentSymbol = marketAssets[market][0].symbol;
    currentAssetName = marketAssets[market][0].name;
    
    document.querySelectorAll('.market-tab').forEach(btn => {
        btn.classList.remove('bg-cyan-500/10', 'text-cyan-400');
        btn.classList.add('text-slate-500');
    });
    btnElement.classList.add('bg-cyan-500/10', 'text-cyan-400');
    btnElement.classList.remove('text-slate-500');

    const searchInput = document.getElementById('chart-search');
    if(searchInput) searchInput.value = '';

    const newUrl = new URL(window.location);
    newUrl.searchParams.set('symbol', currentSymbol);
    newUrl.searchParams.set('name', currentAssetName);
    window.history.pushState({}, '', newUrl);

    renderMarketPills(); 
    renderChart();
    if(typeof fetchLiveEvents === 'function') fetchLiveEvents();
    renderTopNavigation(); 
    updateTerminalLinks();
};

window.changeCoin = function(symbol, name) {
    currentSymbol = symbol;
    currentAssetName = name; 
    
    renderMarketPills(document.getElementById('chart-search')?.value || '');
    renderChart();
    if(typeof fetchLiveEvents === 'function') fetchLiveEvents();
    renderTopNavigation(); 

    const newUrl = new URL(window.location);
    newUrl.searchParams.set('symbol', symbol);
    newUrl.searchParams.set('name', name);
    window.history.pushState({}, '', newUrl);

    updateTerminalLinks();
};

window.changeTimeframe = function(tf, btnElement) {
    currentTimeframe = tf;
    document.querySelectorAll('.tf-btn').forEach(btn => {
        btn.classList.remove('btn-active'); btn.classList.add('btn-outline');
    });
    btnElement.classList.remove('btn-outline'); btnElement.classList.add('btn-active');
    renderChart();
};

window.toggleCustomButton = function(btn) {
    document.getElementById('strategy-select').value = "";
    if (btn.classList.contains('btn-outline')) {
        btn.classList.remove('btn-outline'); btn.classList.add('btn-active');
    } else {
        btn.classList.remove('btn-active'); btn.classList.add('btn-outline');
    }
};

const strategyData = {
    "smc": { 
        timeframes: ["15m", "1H", "4H"], indicators: ["EMA"], 
        prompt: { 
            EN: "Elite SMC Protocol: Identify Market Structure (BOS/CHoCH). Locate high-probability Order Blocks and FVG (Imbalance). Analyze institutional liquidity sweeps. Priority: Trade from Discount (Long) or Premium (Short) zones only.", 
            AR: "بروتوكول SMC المتقدم: حدد هيكل السوق (BOS/CHoCH). حدد مناطق العرض والطلب (Order Blocks) القوية وفجوات السيولة (FVG). حلل عمليات مسح السيولة المؤسساتية. الأولوية: التداول من مناطق الخصم (شراء) أو مناطق الغلاء (بيع).",
            FR: "Protocole SMC Élite : Identifiez la structure du marché (BOS/CHoCH). Localisez les Order Blocks à haute probabilité et les FVG (Imbalance). Analysez les balayages de liquidité institutionnels. Priorité : Tradez uniquement depuis les zones de Discount (Achat) ou Premium (Vente).",
            ES: "Protocolo SMC de Élite: Identifique la estructura del mercado (BOS/CHoCH). Localice Order Blocks de alta probabilidad y FVG (Imbalance). Analice los barridos de liquidez institucional. Prioridad: Opere solo desde zonas de Descuento (Compra) o Premium (Venta)."
        },
        desc: {
            EN: "Smart Money Concepts: Focuses on institutional order flow, liquidity sweeps, and order blocks.",
            AR: "مفاهيم الأموال الذكية (SMC): تركز على تتبع سيولة المؤسسات الكبرى، مناطق العرض والطلب، واختلال التوازن السعري.",
            FR: "Concepts Smart Money : Se concentre sur les flux d'ordres institutionnels, la liquidité et les order blocks.",
            ES: "Conceptos de Dinero Inteligente: Se centra en el flujo de órdenes institucionales, liquidez y order blocks."
        }
    },
    "liq_sweep": { 
        timeframes: ["15m", "1H"], indicators: ["ATR"], 
        prompt: { 
            EN: "Liquidity Hunting Protocol: Identify Equal Highs/Lows. Scan for 'Stop Hunts' or 'Fake-outs' above/below key psychological levels. Confirm if the current move is a trap to lure retail traders before a sharp reversal.", 
            AR: "بروتوكول صيد السيولة: حدد القمم والقيعان المتساوية. ابحث عن عمليات اصطياد الستوبات (Stop Hunts) والاختراقات الكاذبة. أكد ما إذا كانت الحركة الحالية فخاً لاستدراج المتداولين قبل الانعكاس الحاد.",
            FR: "Protocole de Chasse à la Liquidité : Identifiez les hauts/bas égaux. Recherchez les 'Stop Hunts' ou faux signaux au-dessus/en-dessous des niveaux psychologiques. Confirmez si le mouvement actuel est un piège avant un retournement brutal.",
            ES: "Protocolo de Caza de Liquidez: Identifique máximos/mínimos iguales. Busque 'Stop Hunts' o rupturas falsas por encima/debajo de niveles psicológicos clave. Confirme si el movimiento actual es una trampa antes de una reversión brusca."
        },
        desc: {
            EN: "Liquidity Sweep: Looks for fake breakouts (Stop Hunts) where retail traders are trapped before a reversal.",
            AR: "صيد السيولة: تبحث عن الاختراقات الكاذبة (ضرب الستوبات) حيث يتم الإيقاع بالمتداولين الصغار قبل انعكاس السعر.",
            FR: "Chasse à la liquidité : Cherche les fausses cassures où les traders particuliers sont piégés avant un retournement.",
            ES: "Barrido de Liquidez: Busca falsas rupturas donde los traders minoristas quedan atrapados antes de una reversión."
        }
    },
    "pullback": { 
        timeframes: ["1H", "4H"], indicators: ["EMA", "RSI"], 
        prompt: { 
            EN: "Strategic Pullback Analysis: In a trending market, identify the Fibonacci retracement levels (0.5, 0.618). Check for rejection candles at EMA 20/50 confluence. Ensure momentum is cooling down before entry.", 
            AR: "تحليل التراجع الاستراتيجي: في السوق الاتجاهي، حدد مستويات التصحيح. ابحث عن شموع الرفض عند تلاقي EMA 20/50. تأكد من تهدئة الزخم قبل الدخول مع الاتجاه الأصلي.",
            FR: "Analyse Stratégique de Pullback : Dans un marché en tendance, identifiez les niveaux de retracement Fibonacci (0.5, 0.618). Cherchez des bougies de rejet au confluent des EMA 20/50. Assurez-vous que le momentum ralentit avant l'entrée.",
            ES: "Análisis Estratégico de Retroceso: En un mercado tendencial, identifique los niveles de retroceso de Fibonacci (0.5, 0.618). Busque velas de rechazo en la confluencia de EMA 20/50. Asegúrese de que el momentum se esté enfriando antes de entrar."
        },
        desc: {
            EN: "Pullback Retracement: Enters trades in the direction of the main trend after a temporary price correction.",
            AR: "التصحيح (Pullback): الدخول في صفقات مع الاتجاه العام للسوق بعد حدوث تراجع أو تصحيح مؤقت للسعر.",
            FR: "Retracement Pullback : Entre dans la direction de la tendance principale après une correction temporaire.",
            ES: "Retroceso Pullback: Entra en la dirección de la tendencia principal después de una corrección temporal."
        }
    },
    "scalp_ema": { 
        timeframes: ["5m", "15m"], indicators: ["EMA", "RSI"], 
        prompt: { 
            EN: "High-Frequency EMA Cross: Analyze the angle of EMA 20/50. Look for price hugging the EMA line. Entry on the first retest after a clear cross. Monitor RSI for momentum divergence to avoid over-extended moves.", 
            AR: "تقاطع EMA السريع: حلل زاوية انحناء EMA 20/50. ابحث عن التصاق السعر بخط الـ EMA. الدخول عند أول إعادة اختبار بعد التقاطع. راقب RSI لتجنب الدخول في حركات مجهدة.",
            FR: "Croisement EMA Haute Fréquence : Analysez l'angle des EMA 20/50. Cherchez un prix collé à la ligne EMA. Entrée au premier retest après un croisement net. Surveillez le RSI pour détecter les divergences afin d'éviter les mouvements excessifs.",
            ES: "Cruce de EMA de Alta Frecuencia: Analice el ángulo de EMA 20/50. Busque que el precio se mantenga cerca de la línea EMA. Entrada en el primer retest después de un cruce claro. Monitoree el RSI para detectar divergencias y evitar movimientos extendidos."
        },
        desc: {
            EN: "Scalping EMA Cross: Fast-paced strategy using short-term Moving Average crossovers to catch quick moves.",
            AR: "سكالبينج تقاطع EMA: استراتيجية سريعة تعتمد على تقاطع المتوسطات المتحركة لاقتناص حركات سريعة وقصيرة.",
            FR: "Scalping Croisement EMA : Stratégie rapide utilisant les croisements de moyennes mobiles à court terme.",
            ES: "Scalping Cruce EMA: Estrategia rápida que usa cruces de medias móviles a corto plazo."
        }
    },
    "vol_breakout": { 
        timeframes: ["5m", "15m"], indicators: ["BBANDS", "ATR"], 
        prompt: { 
            EN: "Volatility Breakout Protocol: Identify 'The Squeeze' on Bollinger Bands. Confirm breakout with a significant Volume Spike. Use ATR to set a dynamic Stop Loss that allows for initial volatility noise.", 
            AR: "بروتوكول اختراق السيولة: حدد 'الانضغاط' في بولينجر باند. أكد الاختراق بزيادة ملحوظة في حجم التداول (Volume Spike). استخدم ATR لتعيين وقف خسارة ديناميكي يحميك من ضجيج السوق.",
            FR: "Protocole de Cassure de Volatilité : Identifiez le 'Squeeze' sur les bandes de Bollinger. Confirmez la cassure avec un pic de volume significatif. Utilisez l'ATR pour définir un Stop Loss dynamique.",
            ES: "Protocolo de Ruptura de Volatilidad: Identifique el 'Squeeze' en las Bandas de Bollinger. Confirme la ruptura con un pico de volumen significativo. Use el ATR para establecer un Stop Loss dinámico."
        },
        desc: {
            EN: "Volatility Breakout: Looks for explosive price movements after periods of low volatility (consolidation).",
            AR: "اختراق التقلبات: تبحث عن الحركات السعرية الانفجارية التي تحدث بعد فترات من الهدوء والضغط السعري.",
            FR: "Cassure de Volatilité : Cherche des mouvements explosifs après des périodes de faible volatilité.",
            ES: "Ruptura de Volatilidad: Busca movimientos explosivos después de períodos de baja volatilidad."
        }
    },
    "breakout_retest": { 
        timeframes: ["15m", "30m"], indicators: ["SMA"], 
        prompt: { 
            EN: "Classic Breakout/Retest Logic: Identify major Support/Resistance flips. Wait for a candle close outside the zone. Analyze the 'Retest' volume; it must be lower than the breakout volume to confirm valid structure.", 
            AR: "منطق الاختراق وإعادة الاختبار: حدد مناطق تبادل الأدوار (دعم/مقاومة). انتظر إغلاق الشمعة خارج المنطقة. حلل حجم التداول عند إعادة الاختبار؛ يجب أن يكون أقل من حجم الاختراق لتأكيد قوة المنطقة.",
            FR: "Logique Classique Cassure/Retest : Identifiez les inversions de Support/Résistance majeures. Attendez une clôture de bougie hors de la zone. Analysez le volume du retest ; il doit être inférieur au volume de cassure.",
            ES: "Lógica Clásica de Ruptura/Retest: Identifique cambios mayores en Soporte/Resistencia. Espere a que una vela cierre fuera de la zona. Analice el volumen del retest; debe ser menor que el volumen de ruptura."
        },
        desc: {
            EN: "Breakout Retest: Waits for a level to break, then enters when the price returns to test that broken level.",
            AR: "الاختراق وإعادة الاختبار: تنتظر كسر مستوى مهم، ثم تدخل الصفقة عندما يعود السعر لاختبار ذلك المستوى المكسور.",
            FR: "Cassure et Retest : Attend qu'un niveau casse, puis entre quand le prix revient tester ce niveau.",
            ES: "Ruptura y Retest: Espera a que un nivel se rompa, luego entra cuando el precio vuelve a probar ese nivel."
        }
    },
    "squeeze": { 
        timeframes: ["15m", "1H"], indicators: ["BBANDS", "EMA"], 
        prompt: { 
            EN: "Momentum Squeeze Protocol: Scan for price compression. Analyze the TTM Squeeze logic (Bollinger Bands inside Keltner Channels). Predict the direction based on EMA 50 trend slope.", 
            AR: "بروتوكول زخم الانضغاط: ابحث عن ضغط السعر. حلل منطق TTM Squeeze (البولينجر داخل قنوات كيلتنر). توقع اتجاه الانفجار بناءً على ميل ترند EMA 50.",
            FR: "Protocole Momentum Squeeze : Scannez la compression des prix. Analysez la logique TTM Squeeze (Bollinger à l'intérieur de Keltner). Prédisez la direction basée sur la pente de l'EMA 50.",
            ES: "Protocolo de Momentum Squeeze: Busque compresión de precios. Analice la lógica del TTM Squeeze (Bandas de Bollinger dentro de Canales de Keltner). Prediga la dirección basada en la pendiente de la EMA 50."
        },
        desc: {
            EN: "Squeeze Momentum: Identifies tight price consolidations preparing for a strong directional breakout.",
            AR: "زخم الانضغاط (Squeeze): تحدد مناطق انضغاط السعر الشديدة التي تسبق الانفجارات السعرية القوية.",
            FR: "Momentum Squeeze : Identifie les consolidations serrées préparant une forte cassure directionnelle.",
            ES: "Momentum Squeeze: Identifica consolidaciones estrechas preparándose para una fuerte ruptura."
        }
    },
    "mean_rev": { 
        timeframes: ["5m", "15m"], indicators: ["BBANDS", "RSI", "STOCH"], 
        prompt: { 
            EN: "Mean Reversion Strategy: Identify extreme price extension from the EMA 20. Confirm with RSI overbought/oversold (>70/<30) and Stochastics crossover. Target the 'Mean' (EMA 20) for TP.", 
            AR: "استراتيجية العودة للمتوسط: حدد التمدد السعري المفرط بعيداً عن EMA 20. أكد الحالة بـ RSI (فوق 70 أو تحت 30) مع تقاطع الاستوكاستك. الهدف هو العودة للمتوسط (EMA 20).",
            FR: "Stratégie de Retour à la Moyenne : Identifiez une extension de prix extrême par rapport à l'EMA 20. Confirmez avec le RSI suracheté/survendu et le croisement Stochastique. Ciblez l'EMA 20.",
            ES: "Estrategia de Reversión a la Media: Identifique una extensión extrema del precio respecto a la EMA 20. Confirme con RSI sobrecomprado/sobrevendido y cruce de Estocásticos. Apunte a la EMA 20."
        },
        desc: {
            EN: "Mean Reversion: Trades on the assumption that extreme price moves will eventually revert back to their average.",
            AR: "العودة للمتوسط: تعتمد على فكرة أن الأسعار التي تبتعد كثيراً عن متوسطها ستعود إليه في النهاية (تداول الانعكاسات).",
            FR: "Retour à la Moyenne : Parie que les mouvements extrêmes reviendront à leur moyenne historique.",
            ES: "Reversión a la Media: Asume que los movimientos extremos eventualmente volverán a su promedio."
        }
    },
    "mom_swing": { 
        timeframes: ["1H", "4H", "1D"], indicators: ["ICHIMOKU", "RSI"], 
        prompt: { 
            EN: "Institutional Momentum Swing: Use Ichimoku Kumo Cloud for trend filter. Analyze the 'Kijun-sen' bounce. Ensure the RSI is trending in the same direction. Hold for major swing liquidity pools.", 
            AR: "سوينج الزخم المؤسساتي: استخدم سحابة إيشيموكو كفلتر للترند. حلل الارتداد من خط 'الكيجن'. تأكد أن RSI يتحرك في نفس الاتجاه. استهدف مناطق السيولة الكبرى.",
            FR: "Swing Momentum Institutionnel : Utilisez le nuage Ichimoku comme filtre de tendance. Analysez le rebond sur la ligne 'Kijun-sen'. Assurez-vous que le RSI suit la même direction.",
            ES: "Swing de Momentum Institucional: Use la nube de Ichimoku como filtro de tendencia. Analice el rebote en la línea 'Kijun-sen'. Asegúrese de que el RSI siga la misma dirección."
        },
        desc: {
            EN: "Momentum Swing: Captures larger, multi-day market moves by riding strong institutional momentum.",
            AR: "سوينج الزخم: تهدف لاصطياد حركات السوق الكبيرة التي تستمر لعدة أيام بالاعتماد على الزخم القوي.",
            FR: "Swing Momentum : Capture de grands mouvements sur plusieurs jours en suivant le momentum fort.",
            ES: "Swing Momentum: Captura movimientos grandes de varios días siguiendo un fuerte momentum."
        }
    },
    "trend_follow": { 
        timeframes: ["4H", "1D"], indicators: ["SMA", "EMA", "ATR"], 
        prompt: { 
            EN: "Pure Trend Following: Identify 'Golden Cross' or 'Death Cross' (SMA 50/200). Use ATR trailing stop to maximize profit ride. Avoid counter-trend setups regardless of RSI signals.", 
            AR: "تتبع الاتجاه الصافي: حدد 'التقاطع الذهبي' أو 'تقاطع الموت'. استخدم وقف خسارة متلاحق بناءً على ATR لركوب الموجة لأقصى حد. تجنب أي صفقة عكس الاتجاه مهما كانت إشارات RSI.",
            FR: "Suivi de Tendance Pur : Identifiez le 'Golden Cross' ou 'Death Cross' (SMA 50/200). Utilisez un stop suiveur ATR pour maximiser les profits. Évitez les positions contre-tendance.",
            ES: "Seguimiento de Tendencia Puro: Identifique el 'Golden Cross' o 'Death Cross' (SMA 50/200). Use un stop dinámico basado en ATR. Evite configuraciones contra-tendencia."
        },
        desc: {
            EN: "Trend Following: A classic strategy that identifies the long-term direction and stays in the trade until the trend bends.",
            AR: "تتبع الاتجاه: استراتيجية كلاسيكية تحدد الاتجاه العام وتبقى في الصفقة حتى يظهر دليل واضح على تغير الاتجاه.",
            FR: "Suivi de Tendance : Stratégie classique qui identifie la direction à long terme et y reste.",
            ES: "Seguimiento de Tendencia: Estrategia clásica que identifica la dirección a largo plazo y se mantiene en ella."
        }
    },
    "trend_reversal": { 
        timeframes: ["1H", "4H"], indicators: ["RSI", "STOCH", "SMA"], 
        prompt: { 
            EN: "Macro Reversal Logic: Scan for 'Double Top/Bottom' or 'Head and Shoulders' patterns. Confirm with a clear divergence on RSI. Wait for a trendline break and retest before calling the reversal.", 
            AR: "منطق الانعكاس الكلي: ابحث عن نماذج القمة/القاع المزدوج أو الرأس والكتفين. أكد الحالة بوجود دايفرجنس واضح على RSI. انتظر كسر خط الاتجاه وإعادة اختباره قبل تأكيد الانعكاس.",
            FR: "Logique de Renversement Macro : Recherchez des motifs Double Top/Bottom ou Tête et Épaules. Confirmez avec une divergence nette sur le RSI. Attendez la cassure de la trendline.",
            ES: "Lógica de Reversión Macro: Busque patrones de Doble Techo/Suelo o Hombro-Cabeza-Hombro. Confirme con una divergencia clara en el RSI. Espere la ruptura de la línea de tendencia."
        },
        desc: {
            EN: "Trend Reversal: Looks for exhaustion in the current trend and aims to catch the very beginning of a new opposite trend.",
            AR: "انعكاس الاتجاه: تبحث عن علامات الإرهاق في الاتجاه الحالي لمحاولة الدخول في بداية الاتجاه المعاكس الجديد.",
            FR: "Renversement de Tendance : Cherche l'épuisement de la tendance actuelle pour attraper le début de la nouvelle.",
            ES: "Reversión de Tendencia: Busca agotamiento en la tendencia actual para atrapar el inicio de una nueva."
        }
    },
    "divergence": { 
        timeframes: ["1H", "4H"], indicators: ["RSI", "STOCH"], 
        prompt: { 
            EN: "Divergence Trading Protocol: Identify 'Regular Divergence' for reversals and 'Hidden Divergence' for trend continuation. Confirm with price action candle patterns (Pinbar/Engulfing) at the divergence peak.", 
            AR: "بروتوكول تداول الانحراف: حدد الدايفرجنس العادي للانعكاس والمخفي لاستمرار الاتجاه. أكد الإشارة بنماذج الشموع (Pinbar/Engulfing) عند ذروة الانحراف.",
            FR: "Protocole de Trading par Divergence : Identifiez la divergence régulière pour les retournements et la divergence cachée pour la continuation. Confirmez avec le price action.",
            ES: "Protocolo de Trading por Divergencia: Identifique la divergencia regular para reversiones y la divergencia oculta para continuación. Confirme con price action."
        },
        desc: {
            EN: "Divergence Play: Spots disagreements between price action and momentum oscillators (like RSI) to predict turns.",
            AR: "تداول الدايفرجنس: يعتمد على التناقض بين حركة السعر والمؤشرات (مثل RSI) لتوقع انعكاسات قوية.",
            FR: "Jeu de Divergence : Repère les désaccords entre le prix et les oscillateurs pour prédire les retournements.",
            ES: "Juego de Divergencia: Detecta desacuerdos entre el precio y los osciladores para predecir giros."
        }
    },
    "continuation": { 
        timeframes: ["1H", "4H"], indicators: ["EMA", "SMA"], 
        prompt: { 
            EN: "Continuation Pattern Protocol: Identify Bull/Bear Flags, Pennants, or Rectangles. Measure the 'Pole' distance for TP target. Ensure the breakout is supported by an increase in volume.", 
            AR: "بروتوكول النماذج الاستمرارية: حدد الأعلام (Flags) أو المثلثات أو المستطيلات. احسب طول 'السارية' لتحديد هدف الربح. تأكد أن الاختراق مدعوم بزيادة في حجم التداول.",
            FR: "Protocole de Motif de Continuation : Identifiez les drapeaux, fanions ou rectangles. Mesurez la distance du mât pour la cible TP. Assurez-vous que la cassure est soutenue par le volume.",
            ES: "Protocolo de Patrones de Continuación: Identifique banderas, banderines o rectángulos. Mida la distancia del mástil para el objetivo de TP. Asegúrese de que la ruptura tenga volumen."
        },
        desc: {
            EN: "Continuation Pattern: Trades chart patterns like flags and pennants that signal a pause before the trend resumes.",
            AR: "النماذج الاستمرارية: تداول النماذج الفنية (كالأعلام والمثلثات) التي تعتبر استراحة قصيرة قبل استكمال الاتجاه.",
            FR: "Motif de Continuation : Trade les figures chartistes qui signalent une pause avant la reprise de la tendance.",
            ES: "Patrón de Continuación: Opera figuras chartistas que señalan una pausa antes de que se reanude la tendencia."
        }
    },
    "range_bound": { 
        timeframes: ["30m", "1H"], indicators: ["BBANDS", "STOCH"], 
        prompt: { 
            EN: "Range Trading Logic: Identify clear horizontal support and resistance boundaries. Use Bollinger Bands as dynamic outer limits. Trade only 'Rejection' from boundaries with Stochastics confirmation.", 
            AR: "منطق تداول النطاق: حدد حدود الدعم والمقاومة الأفقية الواضحة. استخدم بولينجر باند كحدود خارجية ديناميكية. تداول فقط 'الرفض' من الحدود مع تأكيد الاستوكاستك.",
            FR: "Logique de Trading en Range : Identifiez les limites de support et résistance horizontales. Utilisez Bollinger comme limites dynamiques. Ne tradez que le rejet des bornes.",
            ES: "Lógica de Trading en Rango: Identifique límites de soporte y resistencia horizontales. Use Bollinger como límites dinámicos. Opere solo el rechazo de los límites."
        },
        desc: {
            EN: "Range Bound: Ideal for sideways markets. Buys at support and sells at resistance within a defined channel.",
            AR: "تداول النطاق العرضي: مثالية للأسواق الجانبية، الشراء من الدعم والبيع من المقاومة داخل قناة سعرية واضحة.",
            FR: "Trading en Range : Idéal pour les marchés latéraux. Achète au support et vend à la résistance.",
            ES: "Trading en Rango: Ideal para mercados laterales. Compra en soporte y vende en resistencia."
        }
    }
};

window.onStrategyChange = function(selectElement) {
    const data = strategyData[selectElement.value];
    if (!data) return;
    
    document.getElementById('ai-prompt-box').value = data.prompt[currentLang] || data.prompt["EN"];
    
    const tooltip = document.getElementById('strategy-tooltip');
    if (tooltip) {
        // Use the shorter description for the tooltip instead of the full prompt
        tooltip.innerText = data.desc ? (data.desc[currentLang] || data.desc["EN"]) : (data.prompt[currentLang] || data.prompt["EN"]);
    }
    
    document.querySelectorAll('.multi-tf-btn, .ind-btn').forEach(btn => {
        btn.classList.remove('btn-active'); btn.classList.add('btn-outline');
    });
    
    data.timeframes.forEach(tf => {
        const b = document.querySelector(`.multi-tf-btn[data-val="${tf}"]`);
        if(b) { b.classList.remove('btn-outline'); b.classList.add('btn-active'); }
    });
    
    data.indicators.forEach(ind => {
        const b = document.querySelector(`.ind-btn[data-val="${ind}"]`);
        if(b) { b.classList.remove('btn-outline'); b.classList.add('btn-active'); }
    });
};

async function fetchLiveEvents() {
    const eventsContainer = document.getElementById('custom-events-container');
    if (!eventsContainer) return;
    
    const cacheKey = `ai_events_v2_${currentSymbol}_${currentLang}`;
    const cachedEvents = sessionStorage.getItem(cacheKey);

    if (cachedEvents) {
        macroEvents = JSON.parse(cachedEvents);
        renderDynamicSections();
    } else {
        eventsContainer.innerHTML = `<p class="text-slate-400 text-xs p-4 animate-pulse">AI is scanning global economic markets in ${currentLang}...</p>`;
    }

    try {
        const response = await fetch(CMS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: "get_events", symbol: currentSymbol, language: currentLang })
        });
        
        const rawText = await response.text(); 
        try {
            const cleanText = rawText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
            const liveData = JSON.parse(cleanText);
            
            if (liveData && liveData.length > 0) {
                macroEvents = liveData;
                sessionStorage.setItem(cacheKey, JSON.stringify(macroEvents));
                renderDynamicSections(); 
            }
        } catch (parseError) {}
    } catch (e) {}
}

const loadingPhrases = {
    EN: ["⏳ Initializing Neural Network...", "🔍 Scanning live market data...", "🧠 Applying institutional strategy...", "🧮 Calculating Risk/Reward..."],
    FR: ["⏳ Initialisation du réseau neuronal...", "🔍 Analyse des données en direct...", "🧠 Application de la stratégie...", "🧮 Calcul Risque/Gain..."],
    ES: ["⏳ Inicializando red neuronal...", "🔍 Escaneando datos del mercado...", "🧠 Aplicando estrategia...", "🧮 Calculando Riesgo/Beneficio..."],
    AR: ["⏳ جاري تهيئة الشبكة العصبية...", "🔍 فحص بيانات السوق المباشرة...", "🧠 تطبيق استراتيجية التداول...", "🧮 حساب المخاطرة للعائد..."]
};

window.handleImageUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        uploadedImageBase64 = e.target.result;
        
        const uploadLabel = document.getElementById('upload-label-text');
        if(uploadLabel) {
            uploadLabel.innerText = translations[currentLang]["image_loaded"] || "✅ Image Loaded";
            uploadLabel.classList.add('text-emerald-400');
        }
    };
    reader.readAsDataURL(file);
};

window.copySignal = function() {
    const bias = document.getElementById('res-bias').innerText;
    const entry = document.getElementById('res-entry').innerText;
    const sl = document.getElementById('res-sl').innerText;
    const tp = document.getElementById('res-tp').innerText;
    
    const analysisEl = document.getElementById('res-analysis');
    const fullAnalysis = analysisEl.getAttribute('data-full-text') || analysisEl.innerText;

    let shortAnalysis = fullAnalysis.split('\n')[0];
    if (shortAnalysis.length > 80) shortAnalysis = shortAnalysis.substring(0, 80) + '...';

    const ctaMessage = currentLang === 'FR' ? "👉 Pour lire l'analyse complète, visitez :" :
                       currentLang === 'AR' ? "👉 لقراءة التحليل بالكامل، قم بزيارة :" :
                       currentLang === 'ES' ? "👉 Para leer el análisis completo, visite :" :
                       "👉 For the full analysis, visit :";

    const textToCopy = `🤖 aitradelogic.com Signal: ${currentSymbol}\n\n📈 Bias: ${bias}\n🎯 Entry: ${entry}\n🛑 Stop Loss: ${sl}\n✅ Take Profit: ${tp}\n\n🧠 Analysis:\n${shortAnalysis} 🔒\n\n${ctaMessage}\n🌐 https://aitradelogic.com`;

    navigator.clipboard.writeText(textToCopy).then(() => {
        const btnText = document.getElementById('copy-btn-text');
        const originalText = btnText.innerText;
        btnText.innerText = translations[currentLang]["copied"] || "Copied!";
        setTimeout(() => {
            btnText.innerText = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
};

window.shareOnX = function() {
    const bias = document.getElementById('res-bias').innerText;
    const entry = document.getElementById('res-entry').innerText;
    const sl = document.getElementById('res-sl').innerText;
    const tp = document.getElementById('res-tp').innerText;

    const ctaMessage = currentLang === 'FR' ? "👉 Analyse complète sur :" :
                       currentLang === 'AR' ? "👉 التحليل الكامل على :" :
                       currentLang === 'ES' ? "👉 Análisis completo en :" :
                       "👉 Full analysis at :";

    const textToShare = `🤖 aitradelogic.com Signal: ${currentSymbol}\n\n📈 Bias: ${bias}\n🎯 Entry: ${entry}\n🛑 SL: ${sl}\n✅ TP: ${tp}\n\n${ctaMessage}\n🌐 https://aitradelogic.com 🚀 #Crypto #Trading #AI`;
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(textToShare)}`;
    window.open(twitterUrl, '_blank');
};

let typingTimeout;
window.typeText = function(elementId, text, speed = 10) {
    const element = document.getElementById(elementId);
    if (!element) return Promise.resolve();
    
    element.setAttribute('data-full-text', text);
    element.textContent = '';
    let i = 0;
    if(typingTimeout) clearTimeout(typingTimeout);
    
    return new Promise(resolve => {
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                typingTimeout = setTimeout(type, speed);
            } else {
                resolve();
            }
        }
        type();
    });
};

// Firebase variables
let auth, db, googleProvider;
let currentUser = null;
let isAuthReady = false;

// Firebase functions (we will assign them after dynamic import)
let signInWithPopupFn, signOutFn, onAuthStateChangedFn, docFn, getDocFn, setDocFn, updateDocFn, incrementFn;

async function initFirebase() {
    try {
        // Dynamically import Firebase so this file doesn't need type="module"
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js");
        const { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js");
        const { getFirestore, doc, getDoc, setDoc, updateDoc, increment } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
        
        // Assign to variables for later use
        signInWithPopupFn = signInWithPopup;
        signOutFn = signOut;
        onAuthStateChangedFn = onAuthStateChanged;
        docFn = doc;
        getDocFn = getDoc;
        setDocFn = setDoc;
        updateDocFn = updateDoc;
        incrementFn = increment;

        const response = await fetch('/firebase-applet-config.json');
        const config = await response.json();
        console.log("Firebase Config Loaded:", {
            projectId: config.projectId,
            authDomain: config.authDomain,
            apiKey: config.apiKey ? "PRESENT (Starts with " + config.apiKey.substring(0, 5) + ")" : "MISSING"
        });
        const app = initializeApp(config);
        auth = getAuth(app);
        db = getFirestore(app, config.firestoreDatabaseId);
        googleProvider = new GoogleAuthProvider();

        // --- Connection Test (Critical Constraint) ---
        async function testConnection() {
            try {
                const { getDocFromServer } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
                await getDocFromServer(docFn(db, 'test', 'connection'));
                console.log("Firebase Connection Test: Success");
            } catch (error) {
                if (error instanceof Error && error.message.includes('the client is offline')) {
                    console.error("Please check your Firebase configuration. The client is offline.");
                }
            }
        }
        testConnection();

        // --- Error Handling Helper ---
        const OperationType = {
            CREATE: 'create',
            UPDATE: 'update',
            DELETE: 'delete',
            LIST: 'list',
            GET: 'get',
            WRITE: 'write',
        };

        function handleFirebaseError(error, operationType, path) {
            const errInfo = {
                error: error instanceof Error ? error.message : String(error),
                code: error.code || 'unknown',
                authInfo: {
                    userId: auth.currentUser?.uid,
                    email: auth.currentUser?.email,
                    emailVerified: auth.currentUser?.emailVerified,
                    isAnonymous: auth.currentUser?.isAnonymous,
                    tenantId: auth.currentUser?.tenantId,
                    providerInfo: auth.currentUser?.providerData.map(provider => ({
                        providerId: provider.providerId,
                        displayName: provider.displayName,
                        email: provider.email,
                        photoUrl: provider.photoURL
                    })) || []
                },
                operationType,
                path
            };
            console.error('Firebase Error: ', JSON.stringify(errInfo));
            return errInfo;
        }

        onAuthStateChangedFn(auth, async (user) => {
            currentUser = user;
            isAuthReady = true;

            const loginBtn = document.getElementById('login-btn');
            const userProfile = document.getElementById('user-profile');
            const userAvatar = document.getElementById('user-avatar');

            if (user) {
                // User is signed in
                if (loginBtn) loginBtn.classList.add('hidden');
                if (userProfile) {
                    userProfile.classList.remove('hidden');
                    userProfile.classList.add('flex');
                }
                if (userAvatar) {
                    userAvatar.src = user.photoURL || 'https://ui-avatars.com/api/?name=' + user.email;
                }
                const refBtn = document.getElementById('referral-nav-btn');
                if (refBtn) refBtn.classList.remove('hidden');
                
                await checkAndCreateUserProfile(user);
            } else {
                // User is signed out
                if (loginBtn) loginBtn.classList.remove('hidden');
                if (userProfile) {
                    userProfile.classList.add('hidden');
                    userProfile.classList.remove('flex');
                }
                const refBtn = document.getElementById('referral-nav-btn');
                if (refBtn) refBtn.classList.add('hidden');
                
                updateCreditsUI("0");
            }
        });
    } catch (e) {
        console.error("Firebase init failed:", e);
    }
}

async function checkAndCreateUserProfile(user) {
    const userRef = docFn(db, 'users', user.uid);
    const userSnap = await getDocFn(userRef);
    
    const today = new Date().toISOString().split('T')[0];

    if (!userSnap.exists()) {
        // Create new user with 3 credits
        await setDocFn(userRef, {
            uid: user.uid,
            email: user.email,
            credits: 3,
            lastRefillDate: today,
            xShared: false,
            telegramJoined: false
        });
        updateCreditsUI(3);

        // Check for referral
        const urlParams = new URLSearchParams(window.location.search);
        const refId = urlParams.get('ref');
        if (refId && refId !== user.uid) {
            try {
                const referrerRef = docFn(db, 'users', refId);
                await updateDocFn(referrerRef, {
                    credits: incrementFn(10)
                });
            } catch(e) { console.error("Referral failed", e); }
        }
    } else {
        const data = userSnap.data();
        // Check for daily refill
        if (data.lastRefillDate !== today) {
            await updateDocFn(userRef, {
                credits: 3,
                lastRefillDate: today
            });
            updateCreditsUI(3);
        } else {
            updateCreditsUI(data.credits);
        }
    }
}

window.signInWithGoogle = async function() {
    if (!auth) {
        alert("Firebase is still initializing or failed to load. Please refresh the page.");
        return;
    }
    try {
        await signInWithPopupFn(auth, googleProvider);
        closeLoginModal();
    } catch (error) {
        const errInfo = handleFirebaseError(error, 'auth', 'login');
        if (error.code === 'auth/unauthorized-domain') {
            alert("This domain is not authorized in Firebase. Please add it to the 'Authorized Domains' list in Firebase Console.");
        } else if (error.code === 'auth/api-key-not-valid') {
            alert("Firebase Error: API Key is not valid. Please ensure the 'Identity Toolkit API' is enabled in Google Cloud Console for this project.");
        } else {
            alert("Sign-in failed: " + error.message);
        }
    }
};

window.signOutUser = async function() {
    if (!auth) return;
    try {
        await signOutFn(auth);
        window.location.reload();
    } catch (error) {
        console.error("Error signing out", error);
    }
};

window.closeLoginModal = function() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.classList.add('hidden');
};

window.updateCreditsUI = function(credits) {
    const counter = document.getElementById('credit-count');
    if (counter) counter.innerText = credits;
};

// Replace old fetchCredits
window.fetchCredits = async function() {
    if (currentUser && db) {
        const userRef = docFn(db, 'users', currentUser.uid);
        const userSnap = await getDocFn(userRef);
        if (userSnap.exists()) {
            updateCreditsUI(userSnap.data().credits);
        }
    }
};

// Call initFirebase on load
document.addEventListener('DOMContentLoaded', () => {
    initFirebase();
});

window.closeTelegramModal = function() {
    document.getElementById('telegram-modal').classList.add('hidden');
};

window.closeXModal = function() {
    document.getElementById('x-modal').classList.add('hidden');
};

window.showVIPModal = function(uid) {
    const modal = document.getElementById('vip-modal');
    const input = document.getElementById('referral-link-input');
    if(modal && input) {
        input.value = `https://aitradelogic.com/?ref=${uid}`;
        modal.classList.remove('hidden');
    }
};

window.closeVIPModal = function() {
    document.getElementById('vip-modal').classList.add('hidden');
};

window.copyReferralLink = function() {
    const input = document.getElementById('referral-link-input');
    if(input) {
        input.select();
        document.execCommand('copy');
        alert("Referral link copied to clipboard!");
    }
};

window.joinTelegram = async function() {
    if (!currentUser) {
        alert(translations[currentLang]["login_required"] || "Please login first to claim rewards.");
        return;
    }
    
    const btn = document.getElementById('join-telegram-btn');
    const text = document.getElementById('join-telegram-text');
    
    // Open Telegram link
    const telegramUrl = `https://t.me/ai_trade_io`; // Replace with your actual channel
    window.open(telegramUrl, '_blank');
    
    btn.disabled = true;
    const originalText = text.innerText;
    text.innerText = translations[currentLang]["verifying"] || "Verifying...";
    
    // Trick: Wait for the user to return to the tab before giving the reward
    const handleFocus = async () => {
        window.removeEventListener('focus', handleFocus);
        try {
            const userRef = docFn(db, 'users', currentUser.uid);
            await updateDocFn(userRef, {
                credits: incrementFn(5),
                telegramJoined: true
            });
            fetchCredits();
            closeTelegramModal();
            btn.disabled = false;
            text.innerText = originalText;
            const successMsg = (translations[currentLang]["success_credits"] || "Success! You've earned {n} credits.").replace('{n}', '5');
            alert(successMsg);
        } catch (e) {
            console.error("Failed to process reward", e);
            btn.disabled = false;
            text.innerText = originalText;
        }
    };

    // Add a small delay before listening to focus
    setTimeout(() => {
        window.addEventListener('focus', handleFocus);
    }, 1000);
};

window.verifyXShare = async function() {
    if (!currentUser) {
        alert(translations[currentLang]["login_required"] || "Please login first to claim rewards.");
        return;
    }

    const btn = document.getElementById('share-x-btn');
    const text = document.getElementById('share-x-text');
    
    // Open Twitter share link
    const textToShare = `🤖 I'm using aitradelogic.com to get live AI trading signals and market analysis! Check it out 🚀 #Crypto #Trading #AI \n\n🌐 https://aitradelogic.com`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(textToShare)}`;
    window.open(twitterUrl, '_blank');
    
    btn.disabled = true;
    const originalText = text.innerText;
    text.innerText = translations[currentLang]["verifying"] || "Verifying...";
    
    // Trick: Wait for the user to return to the tab before giving the reward
    const handleFocus = async () => {
        window.removeEventListener('focus', handleFocus);
        try {
            const userRef = docFn(db, 'users', currentUser.uid);
            await updateDocFn(userRef, {
                credits: incrementFn(3),
                xShared: true
            });
            fetchCredits();
            closeXModal();
            btn.disabled = false;
            text.innerText = originalText;
            const successMsg = (translations[currentLang]["success_credits"] || "Success! You've earned {n} credits.").replace('{n}', '3');
            alert(successMsg);
        } catch (e) {
            console.error("Failed to verify share", e);
            btn.disabled = false;
            text.innerText = originalText;
        }
    };

    // Add a small delay before listening to focus
    setTimeout(() => {
        window.addEventListener('focus', handleFocus);
    }, 1000);
};

const ADMIN_EMAIL = "zridi.tanger@gmail.com";

window.runAIAnalysis = async function() {
    const btn = document.getElementById('run-ai-btn');
    const strategyName = document.getElementById('strategy-select').options[document.getElementById('strategy-select').selectedIndex]?.text || "Custom Strategy";
    const customPrompt = document.getElementById('ai-prompt-box').value.trim();

    // 🚨 1. تخبية شريط البحث باش نربحو البلاصة (العملات غايبقاو باينين)
    const searchContainer = document.getElementById('search-input-container');
    if (searchContainer) searchContainer.classList.add('hidden');

    // 🚨 تصغير الشارت باش يمشي لليمين
    const chartPanel = document.getElementById('chart-panel');
    if(chartPanel) {
        chartPanel.classList.remove('flex-1');
        chartPanel.classList.add('xl:w-[420px]', 'shrink-0');
    }

    // 🚨 2. إظهار النتيجة فـ اليسار بحجم كبير (flex-1)
    document.getElementById('ai-output-panel').classList.remove('hidden');
    document.getElementById('ai-output-panel').classList.add('flex');

    btn.disabled = true;
    
    const loadingTerminal = document.getElementById('ai-loading-terminal');
    loadingTerminal.classList.remove('hidden');
    document.getElementById('ai-final-result').classList.add('hidden');

    let step = 0;
    const phrases = loadingPhrases[currentLang] || loadingPhrases["EN"];
    
    let loadingTextEl = document.getElementById('dynamic-loading-text');
    if (!loadingTextEl) {
        loadingTextEl = document.createElement('p');
        loadingTextEl.id = 'dynamic-loading-text';
        loadingTextEl.className = "text-cyan-400 font-mono text-[11px] mt-4 animate-pulse font-bold tracking-widest text-center";
        loadingTerminal.appendChild(loadingTextEl);
    }
    
    if (uploadedImageBase64) {
        loadingTextEl.innerText = translations[currentLang]["ai_vision"] || "👁️ AI Vision: Analyzing Chart Image...";
    } else {
        loadingTextEl.innerText = phrases[0];
    }

    const loadingInterval = setInterval(() => {
        step = (step + 1) % phrases.length;
        if(!uploadedImageBase64) loadingTextEl.innerText = phrases[step];
    }, 1500);

    try {
        const isAdmin = currentUser && currentUser.email === ADMIN_EMAIL;
        let idToken = null;
        
        if (!currentUser) {
            clearInterval(loadingInterval);
            loadingTerminal.classList.add('hidden');
            btn.disabled = false;
            closeAIAnalysis(); 
            
            const loginModal = document.getElementById('login-modal');
            if (loginModal) loginModal.classList.remove('hidden');
            return;
        } else {
            idToken = await currentUser.getIdToken(true);
            
            if (!isAdmin) {
                const userRef = docFn(db, 'users', currentUser.uid);
                const userSnap = await getDocFn(userRef);
                
                if (userSnap.exists()) {
                    const credits = userSnap.data().credits;
                    if (credits <= 0) {
                        clearInterval(loadingInterval);
                        loadingTerminal.classList.add('hidden');
                        btn.disabled = false;
                        closeAIAnalysis(); 

                        const data = userSnap.data();
                        if (!data.xShared) document.getElementById('x-modal').classList.remove('hidden');
                        else if (!data.telegramJoined) document.getElementById('telegram-modal').classList.remove('hidden');
                        else showVIPModal(currentUser.uid);
                        return; 
                    }
                }
            }
        }

        const payload = { 
            action: "analyze_chart", 
            symbol: currentSymbol, 
            timeframe: currentTimeframe, 
            strategy: strategyName, 
            customPrompt: customPrompt, 
            language: currentLang
        };

        if (idToken) {
            payload.token = idToken;
        }

        if (uploadedImageBase64) {
            payload.image_base64 = uploadedImageBase64;
        }

        const response = await fetch(ANALYZER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // We no longer rely on 403 from the worker for credits, but keep it just in case
        if (response.status === 403) {
            const errorData = await response.json();
            clearInterval(loadingInterval);
            loadingTerminal.classList.add('hidden');
            btn.disabled = false;
            
            // Revert UI changes
            document.getElementById('ai-output-panel').classList.add('hidden');
            document.getElementById('ai-output-panel').classList.remove('flex');
            const searchContainer = document.getElementById('search-input-container');
            if (searchContainer) searchContainer.classList.remove('hidden');
            const chartPanel = document.getElementById('chart-panel');
            if(chartPanel) {
                chartPanel.classList.add('flex-1');
                chartPanel.classList.remove('xl:w-[420px]', 'shrink-0');
            }

            if (!currentUser) {
                document.getElementById('login-modal').classList.remove('hidden');
            } else {
                alert(errorData.error || "You have run out of credits on the server.");
            }
            return;
        }

        const aiResult = await response.json();
        
        if (!isAdmin) {
            fetchCredits(); 
        }
        
        clearInterval(loadingInterval);
        
        loadingTerminal.classList.add('hidden');
        document.getElementById('ai-final-result').classList.remove('hidden');
        document.getElementById('ai-final-result').classList.add('flex');
        
        let rawBias = (aiResult.bias || "NEUTRAL").toUpperCase();
        let biasText = rawBias;
        let biasColor = "text-slate-400";
        let analysisText = aiResult.analysis || "Analysis complete.";

        if (!isMarketOpen && (analysisText.includes("Market data error") || analysisText.includes("error") || rawBias === "NEUTRAL")) {
            analysisText = translations[currentLang]['market_closed_msg'] || "Market Closed - Showing Last Available Data";
            rawBias = "NEUTRAL";
        }
        
        if (rawBias.includes("BULL") || rawBias.includes("صعود") || rawBias.includes("HAUSSIER") || rawBias.includes("ALCISTA")) {
            biasText = translations[currentLang]["bullish"] || "BULLISH";
            biasColor = "text-emerald-400";
        } else if (rawBias.includes("BEAR") || rawBias.includes("هبوط") || rawBias.includes("BAISSIER") || rawBias.includes("BAJISTA")) {
            biasText = translations[currentLang]["bearish"] || "BEARISH";
            biasColor = "text-red-400";
        } else {
            biasText = translations[currentLang]["neutral"] || "NEUTRAL";
        }

        const biasEl = document.getElementById('res-bias');
        biasEl.innerText = biasText;
        biasEl.className = biasColor + " font-bold";
        
        window.typeText('res-analysis', analysisText, 10);
        
        document.getElementById('res-entry').innerText = aiResult.entry || "0.00";
        document.getElementById('res-sl').innerText = aiResult.sl || "0.00";
        document.getElementById('res-tp').innerText = aiResult.tp || "0.00";

        calculateRisk();
        
        uploadedImageBase64 = null;
        const uploadLabel = document.getElementById('upload-label-text');
        if(uploadLabel) {
            uploadLabel.innerText = translations[currentLang]["upload_chart"] || "Upload Chart Screenshot (Optional)";
            uploadLabel.classList.remove('text-emerald-400');
        }
        const fileInput = document.getElementById('image-upload-input');
        if(fileInput) fileInput.value = "";

    } catch (e) {
        clearInterval(loadingInterval);
        
        if (!isMarketOpen) {
            loadingTerminal.classList.add('hidden');
            document.getElementById('ai-final-result').classList.remove('hidden');
            document.getElementById('ai-final-result').classList.add('flex');
            
            const biasEl = document.getElementById('res-bias');
            biasEl.innerText = translations[currentLang]["neutral"] || "NEUTRAL";
            biasEl.className = "text-slate-400 font-bold";
            
            window.typeText('res-analysis', translations[currentLang]["market_closed_msg"] || "Market Closed - Showing Last Available Data", 10);
            
            document.getElementById('res-entry').innerText = "0.00";
            document.getElementById('res-sl').innerText = "0.00";
            document.getElementById('res-tp').innerText = "0.00";
        } else {
            if(loadingTextEl) {
                loadingTextEl.innerText = translations[currentLang]["system_error"] || "❌ System Error: Please try again.";
            }
        }
    } finally {
        btn.disabled = false;
    }
};

// 🚨 3. الدالة ديال الرجوع (كترجع كلشي كيف كان)
window.closeAIAnalysis = function() {
    if(typingTimeout) clearTimeout(typingTimeout);
    
    // تخبية النتيجة فاليسار
    document.getElementById('ai-output-panel').classList.add('hidden');
    document.getElementById('ai-output-panel').classList.remove('flex');
    
    // إرجاع مربع البحث لي خبينا
    const searchContainer = document.getElementById('search-input-container');
    if (searchContainer) searchContainer.classList.remove('hidden');
    
    // إرجاع الشارت لحجمه الكبير
    const chartPanel = document.getElementById('chart-panel');
    if(chartPanel) {
        chartPanel.classList.add('flex-1');
        chartPanel.classList.remove('xl:w-[420px]', 'shrink-0');
    }

    const btn = document.getElementById('run-ai-btn');
    if(btn) btn.disabled = false;
};

window.calculateRisk = function() {
    const balance = parseFloat(document.getElementById('calc-balance').value) || 0;
    const riskPercent = parseFloat(document.getElementById('calc-risk').value) || 0;
    const entry = parseFloat(document.getElementById('res-entry').innerText) || 0;
    const sl = parseFloat(document.getElementById('res-sl').innerText) || 0;
    const tp = parseFloat(document.getElementById('res-tp').innerText) || 0;

    // 🚨 قراءة واش المتداول مكوشي على "حساب سنت"
    const isCentAccount = document.getElementById('calc-cent-account') && document.getElementById('calc-cent-account').checked;

    // 1. حساب مبلغ المخاطرة اللي باغي المتداول (بـ الدولار)
    const intendedRiskAmount = (balance * riskPercent) / 100;
    let riskAmount = intendedRiskAmount;
    
    // 2. حساب المسافة بين الدخول ووقف الخسارة
    let riskPerUnit = Math.abs(entry - sl) || 1;
    
    // 3. حساب عدد الوحدات المطلوبة نظرياً
    let units = riskAmount / riskPerUnit;
    let finalDisplaySize = units;
    let actualUnits = units; 

    // 🚨 4. تطبيق معايير المنصات والحد الأدنى (0.01)
    if (currentMarketType === 'forex') {
        if (entry < 200) { 
            // أزواج العملات (EURUSD...)
            finalDisplaySize = units / 100000;
        } else {
            // الذهب (XAUUSD) والمؤشرات
            finalDisplaySize = units / 100;
        }

        // 🔥 تحويل اللوت إيلا كان حساب سنت (اللوت فـ السنت كيعطيك 100 ضعف المساحة)
        if (isCentAccount) {
            finalDisplaySize = finalDisplaySize * 100;
        }

        // 🔥 الحماية: الحد الأدنى ديما هو 0.01 (سواء سنت أو عادي)
        if (finalDisplaySize > 0 && finalDisplaySize < 0.01) {
            finalDisplaySize = 0.01;
            // نرجعو نحسبو الخسارة الحقيقية بالدولار
            let standardLotEquivalent = isCentAccount ? (0.01 / 100) : 0.01;
            actualUnits = entry < 200 ? (standardLotEquivalent * 100000) : (standardLotEquivalent * 100);
            riskAmount = actualUnits * riskPerUnit; 
        } else {
            // إيلا كان اللوت فايت 0.01، كنحسبو الربح والخسارة بدقة
            let standardLotEquivalent = isCentAccount ? (finalDisplaySize / 100) : finalDisplaySize;
            actualUnits = entry < 200 ? (standardLotEquivalent * 100000) : (standardLotEquivalent * 100);
        }
    } else if (currentMarketType === 'crypto' || currentMarketType === 'stock') {
        finalDisplaySize = units;
        actualUnits = units;
    }

    // 5. حساب الربح الإجمالي بالدولار
    const rewardPerUnit = Math.abs(tp - entry);
    const totalProfit = actualUnits * rewardPerUnit;

    // 6. 🎨 عرض النتائج فـ الشاشة مع "نظام التحذير للمبتدئين"
    const riskAmountEl = document.getElementById('calc-risk-amount');
    
    // إيلا كانت الخسارة المفروضة كبر من داكشي اللي بغا المتداول (بسبب اللوت 0.01)
    if (riskAmount > intendedRiskAmount && intendedRiskAmount > 0) {
        let warningMsg = currentLang === "AR" ? "⚠️ مخاطرة إجبارية أعلى من رأس مالك!" : 
                         currentLang === "FR" ? "⚠️ Risque forcé par le lot minimum!" : 
                         currentLang === "ES" ? "⚠️ ¡Riesgo forzado por lote mínimo!" : 
                         "⚠️ Forced risk due to min lot!";
                         
        riskAmountEl.innerHTML = `$${riskAmount.toFixed(2)}- <span class="block text-[10px] text-red-500 mt-2 font-bold bg-red-500/10 p-1 rounded uppercase tracking-widest leading-tight">${warningMsg}</span>`;
        riskAmountEl.style.color = "#ef4444"; // لون أحمر
    } else {
        // إيلا كان رأس المال كافي والأمور هانية
        riskAmountEl.innerHTML = `$${riskAmount.toFixed(2)}-`;
        riskAmountEl.style.color = ""; // رجع اللون الأصلي
    }
    
    if (currentMarketType === 'crypto' && finalDisplaySize > 0 && finalDisplaySize < 0.01) {
        document.getElementById('calc-lot-size').innerText = finalDisplaySize.toFixed(4);
    } else {
        document.getElementById('calc-lot-size').innerText = finalDisplaySize.toFixed(2);
    }
    
    document.getElementById('calc-profit-amount').innerText = `$${totalProfit.toFixed(2)}+`;
    document.getElementById('res-rr').innerText = (rewardPerUnit / riskPerUnit).toFixed(2);
};

// ==========================================
// 9. ONBOARDING TOUR
// ==========================================
let currentOnboardingStep = 0;

const onboardingData = {
    EN: [
        { title: "Welcome to AI Terminal", desc: "Let's take a quick tour to show you how to generate your first AI-powered trading setup.", target: null },
        { title: "1. Select Asset", desc: "Search and select the coin, stock, or forex pair you want to analyze.", target: "search-input-container" },
        { title: "2. Choose Strategy", desc: "Pick a trading strategy (like SMC or Scalping) to guide the AI's analysis.", target: "strategy-container" },
        { title: "3. Upload Chart (Optional)", desc: "Upload a screenshot of your chart for a more professional and accurate visual analysis by the AI.", target: "upload-box-container" },
        { title: "4. Run Analysis", desc: "Click here to let the Neural Network scan the chart and generate your trade setup.", target: "run-ai-btn" }
    ],
    FR: [
        { title: "Bienvenue sur le Terminal IA", desc: "Faisons un tour rapide pour vous montrer comment générer votre première configuration de trading.", target: null },
        { title: "1. Sélectionner l'Actif", desc: "Recherchez et sélectionnez la crypto, l'action ou la paire forex à analyser.", target: "search-input-container" },
        { title: "2. Choisir la Stratégie", desc: "Choisissez une stratégie (comme SMC ou Scalping) pour guider l'analyse de l'IA.", target: "strategy-container" },
        { title: "3. Uploader le Graphique (Optionnel)", desc: "Uploadez une capture d'écran de votre graphique pour une analyse visuelle plus professionnelle et précise par l'IA.", target: "upload-box-container" },
        { title: "4. Lancer l'Analyse", desc: "Cliquez ici pour laisser le réseau neuronal scanner le graphique et générer votre configuration.", target: "run-ai-btn" }
    ],
    ES: [
        { title: "Bienvenido al Terminal IA", desc: "Hagamos un recorrido rápido para mostrarle cómo generar su primera configuración de trading.", target: null },
        { title: "1. Seleccionar Activo", desc: "Busque y seleccione la criptomoneda, acción o par de divisas que desea analizar.", target: "search-input-container" },
        { title: "2. Elegir Estrategia", desc: "Elija una estrategia (como SMC o Scalping) para guiar el análisis de la IA.", target: "strategy-container" },
        { title: "3. Subir Gráfico (Opcional)", desc: "Suba una captura de pantalla de su gráfico para un análisis visual más profesional y preciso por parte de la IA.", target: "upload-box-container" },
        { title: "4. Ejecutar Análisis", desc: "Haga clic aquí para que la red neuronal escanee el gráfico y genere su configuración.", target: "run-ai-btn" }
    ],
    AR: [
        { title: "مرحباً بك في منصة الذكاء الاصطناعي", desc: "دعنا نأخذ جولة سريعة لنوضح لك كيف تبدأ أول تحليل لصفقاتك.", target: null },
        { title: "1. اختر الأصل المالي", desc: "ابحث واختر العملة، السهم، أو زوج الفوركس الذي تريد تحليله.", target: "search-input-container" },
        { title: "2. اختر الاستراتيجية", desc: "حدد استراتيجية التداول (مثل SMC أو السكالبينج) لتوجيه تحليل الذكاء الاصطناعي.", target: "strategy-container" },
        { title: "3. رفع صورة الشارت (اختياري)", desc: "قم برفع صورة (سكرين شوت) للشارت الخاص بك لتحليل بصري أكثر احترافية ودقة من قبل الذكاء الاصطناعي.", target: "upload-box-container" },
        { title: "4. ابدأ التحليل", desc: "انقر هنا لتبدأ الشبكة العصبية في فحص الشارت وإعطائك نقاط الدخول والخروج.", target: "run-ai-btn" }
    ]
};

function startOnboarding() {
    if (localStorage.getItem('onboarding_completed') === 'true') return;
    
    const overlay = document.getElementById('onboarding-overlay');
    if (!overlay) return;
    
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    updateOnboardingUI();
}

function updateHighlight(targetId, doScroll = true) {
    let highlighter = document.getElementById('onboarding-highlighter');
    if (!highlighter) {
        highlighter = document.createElement('div');
        highlighter.id = 'onboarding-highlighter';
        highlighter.className = 'absolute z-[99] pointer-events-none transition-all duration-500 rounded-xl ring-4 ring-cyan-500 ring-offset-4 ring-offset-[#0B1320]';
        document.body.appendChild(highlighter);
        
        window.addEventListener('resize', () => {
            const steps = onboardingData[currentLang] || onboardingData['EN'];
            if (currentOnboardingStep < steps.length) {
                updateHighlight(steps[currentOnboardingStep].target, false);
            }
        });
    }

    const overlay = document.getElementById('onboarding-overlay');

    if (targetId) {
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
            if (doScroll) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            const updatePos = () => {
                const rect = targetEl.getBoundingClientRect();
                highlighter.style.top = (rect.top + window.scrollY - 4) + 'px';
                highlighter.style.left = (rect.left + window.scrollX - 4) + 'px';
                highlighter.style.width = (rect.width + 8) + 'px';
                highlighter.style.height = (rect.height + 8) + 'px';
                highlighter.style.opacity = '1';

                // Adjust modal position to not cover the target on mobile
                if (overlay) {
                    const spaceAbove = rect.top;
                    const spaceBelow = window.innerHeight - rect.bottom;
                    
                    if (spaceBelow < spaceAbove) {
                        // More space above, move modal to top
                        overlay.classList.remove('justify-end', 'pb-12');
                        overlay.classList.add('justify-start', 'pt-28');
                    } else {
                        // More space below, move modal to bottom
                        overlay.classList.remove('justify-start', 'pt-28');
                        overlay.classList.add('justify-end', 'pb-12');
                    }
                }
            };
            
            updatePos();
            if (doScroll) {
                setTimeout(updatePos, 300); // Update again after scroll
            }
        }
    } else {
        highlighter.style.top = (window.scrollY + window.innerHeight / 2) + 'px';
        highlighter.style.left = (window.scrollX + window.innerWidth / 2) + 'px';
        highlighter.style.width = '0px';
        highlighter.style.height = '0px';
        highlighter.style.opacity = '1';
        
        if (overlay) {
            overlay.classList.remove('justify-start', 'pt-28');
            overlay.classList.add('justify-end', 'pb-12');
        }
    }
}

window.nextOnboardingStep = function() {
    const steps = onboardingData[currentLang] || onboardingData['EN'];
    
    currentOnboardingStep++;

    if (currentOnboardingStep >= steps.length) {
        skipOnboarding();
        return;
    }

    updateOnboardingUI();
};

window.skipOnboarding = function() {
    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
        // Reset position classes for next time
        overlay.classList.remove('justify-start', 'pt-28');
        overlay.classList.add('justify-end', 'pb-12');
    }
    
    const highlighter = document.getElementById('onboarding-highlighter');
    if (highlighter) {
        highlighter.style.opacity = '0';
        setTimeout(() => highlighter.remove(), 500);
    }

    localStorage.setItem('onboarding_completed', 'true');
};

function updateOnboardingUI() {
    const steps = onboardingData[currentLang] || onboardingData['EN'];
    const step = steps[currentOnboardingStep];
    
    document.getElementById('onboarding-title').innerText = step.title;
    document.getElementById('onboarding-desc').innerText = step.desc;
    
    const nextBtn = document.getElementById('onboarding-next-btn');
    if (currentOnboardingStep === steps.length - 1) {
        nextBtn.innerText = currentLang === 'AR' ? "إنهاء الجولة" : 
                            currentLang === 'FR' ? "Terminer" : 
                            currentLang === 'ES' ? "Finalizar" : "Finish Tour";
    } else {
        nextBtn.innerText = currentLang === 'AR' ? "التالي" : 
                            currentLang === 'FR' ? "Suivant" : 
                            currentLang === 'ES' ? "Siguiente" : "Next";
    }

    // Update dots
    const dots = document.getElementById('onboarding-dots').children;
    for (let i = 0; i < dots.length; i++) {
        if (i === currentOnboardingStep) {
            dots[i].className = "w-2 h-2 rounded-full bg-cyan-500 transition-all duration-300 scale-125";
        } else {
            dots[i].className = "w-2 h-2 rounded-full bg-slate-700 transition-all duration-300";
        }
    }

    // Highlight target
    updateHighlight(step.target);
}

// ==========================================
// 8. INITIALISATION AU DÉMARRAGE
// ==========================================
window.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlSymbol = urlParams.get('symbol');
    const urlName = urlParams.get('name');

    if (urlSymbol && urlName) {
        currentSymbol = urlSymbol;
        currentAssetName = decodeURIComponent(urlName);
    }

    const promptContainer = document.getElementById('ai-prompt-box')?.parentElement;
    if (promptContainer) {
        const uploadHtml = `
            <div class="mt-4 w-full" id="upload-box-container">
                <label for="image-upload-input" class="cursor-pointer flex items-center justify-center w-full p-3 border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl bg-[#0F172A] transition-all">
                    <svg class="w-5 h-5 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <span id="upload-label-text" class="text-xs font-bold text-slate-400 tracking-wider" data-i18n="upload_chart">Upload Chart Screenshot (Optional)</span>
                </label>
                <input type="file" id="image-upload-input" accept="image/*" class="hidden" onchange="handleImageUpload(event)">
            </div>
        `;
        promptContainer.insertAdjacentHTML('afterend', uploadHtml);
    }

    await loadAllCryptoPairs();

    const searchInput = document.getElementById('chart-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderMarketPills(e.target.value); 
        });
    }

    changeLanguage(currentLang); 
    renderChart();
    renderMarketPills(); 
    renderTopNavigation();
    
    updateTerminalLinks();
    
    // Start onboarding after a short delay to ensure UI is rendered
    setTimeout(startOnboarding, 500);
});
