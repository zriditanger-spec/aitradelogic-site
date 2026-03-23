// ==========================================
// 🎯 SMART AD INJECTOR & ANTI-BLOCKER
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    
    // 🚨 1. الماكينة اللي كتجيب الإعلانات
    const WORKER_URL = "https://ai-trade-cms.zridi-tanger.workers.dev/"; 

    try {
        const res = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: "get_public_ads" })
        });
        
        const data = await res.json();
        if (data.success && data.settings) {
            const settings = data.settings;
            const adUnits = settings.ad_units || [];
            const affiliates = settings.affiliates || [];

            function getAdHtml(selectedId) {
                if (!selectedId || selectedId === 'none') return null;
                
                if (selectedId === 'prod') {
                    return `
                    <div class="w-full bg-[#0F172A] border border-purple-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg mb-4 mt-4">
                        <div class="flex items-center gap-4">
                            <img src="${settings.prod_img}" class="w-16 h-16 rounded-lg object-cover border border-purple-500/50">
                            <div>
                                <h4 class="text-sm font-bold text-white">${settings.prod_title}</h4>
                                <p class="text-[10px] text-slate-400">${settings.prod_desc}</p>
                            </div>
                        </div>
                        <a href="${WORKER_URL}go/prod" target="_blank" class="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap">${settings.prod_btn_text || 'Get Now'}</a>
                    </div>`;
                }
                
                const ad = adUnits.find(a => a.id === selectedId);
                if (ad) return ad.code;

                const aff = affiliates.find(a => a.id === selectedId);
                if (aff) {
                    return `<a href="${WORKER_URL}go/${aff.id}" target="_blank" class="block w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-center py-3 rounded-xl transition-colors mb-4 mt-4"><span class="text-xs font-bold text-cyan-400 uppercase tracking-widest">🔗 ${aff.name}</span></a>`;
                }
                return null;
            }

            const placements = {
                'ad-home-top': settings.place_home_top,
                'ad-blog-top': settings.place_blog_top,
                'ad-blog-bot': settings.place_blog_bot,
                'ad-news-top': settings.place_news_top,
                'ad-news-side': settings.place_news_side,
                'ad-glossary-top': settings.place_glossary_top,
                'ad-predictions-top': settings.place_predictions_top,
                'ad-article-top': window.location.pathname.includes('/blog/') ? settings.place_art_blog_top : settings.place_art_news_top,
                'ad-article-mid': window.location.pathname.includes('/blog/') ? settings.place_art_blog_mid : settings.place_art_news_mid,
                'ad-article-side': window.location.pathname.includes('/blog/') ? settings.place_art_blog_side : settings.place_art_news_side,
            };

            for (const [divId, selectedAdId] of Object.entries(placements)) {
                const container = document.getElementById(divId);
                if (container && selectedAdId && selectedAdId !== 'none') {
                    const htmlToInject = getAdHtml(selectedAdId);
                    if (htmlToInject) {
                        container.innerHTML = htmlToInject;
                        container.classList.remove('hidden');
                    }
                }
            }
        }
    } catch (e) {
        console.error("Ad Injector Error:", e);
    }

    // 🚨 2. فخ النينجا المضاد للـ Adblock
    setTimeout(() => {
        const bait = document.createElement('div');
        bait.className = 'pub_300x250 adsbox ad-placement doubleclick';
        bait.style.height = '1px';
        bait.style.width = '1px';
        bait.style.position = 'absolute';
        bait.style.left = '-9999px';
        document.body.appendChild(bait);

        setTimeout(() => {
            if (bait.offsetHeight === 0 || window.getComputedStyle(bait).display === 'none') {
                showSupportModal();
            }
            bait.remove();
        }, 300);
    }, 2000);

    function showSupportModal() {
        if(document.getElementById('sys-notice-99')) return;

        const modalHtml = `
        <div id="sys-notice-99" class="fixed inset-0 bg-[#060B14]/95 backdrop-blur-md z-[9999] flex items-center justify-center p-4 transition-all">
            <div class="bg-[#0A101D] border border-cyan-500/50 rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(6,182,212,0.2)] text-center relative overflow-hidden">
                <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-yellow-500"></div>
                
                <div class="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-700 shadow-inner">
                    <span class="text-4xl">🛑</span>
                </div>
                
                <h2 class="text-2xl font-black text-white mb-3">Notice!</h2>
                <p class="text-slate-400 text-sm mb-6 leading-relaxed">
                    It looks like you are using a content blocker. Our AI analysis and live market data are 100% free, but we rely on your support to keep the servers running. 
                </p>
                
                <div class="space-y-3">
                    <button onclick="location.reload()" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 rounded-xl transition shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                        🔄 I Have Disabled It (Refresh)
                    </button>
                    <div class="relative flex items-center py-2">
                        <div class="flex-grow border-t border-slate-800"></div>
                        <span class="flex-shrink-0 mx-4 text-slate-500 text-xs font-bold uppercase tracking-widest">OR</span>
                        <div class="flex-grow border-t border-slate-800"></div>
                    </div>
                    <a href="/app.html" class="block w-full bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/50 text-purple-400 font-bold py-3 rounded-xl transition">
                        📘 Support Us: Get The AI E-Book
                    </a>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
});