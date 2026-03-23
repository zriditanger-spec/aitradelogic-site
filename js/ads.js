// ==========================================
// 🎯 SMART AD INJECTOR (FRONTEND)
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    // الرابط ديال الـ Worker ديالك
    const WORKER_URL = "https://ai-trade-cms.zridi-tanger.workers.dev/"; 

    try {
        // 1. كنسولو السيرفر على الإعلانات (get_public_ads)
        const res = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: "get_public_ads" })
        });
        
        const data = await res.json();
        if (!data.success || !data.settings) return;

        const settings = data.settings;
        const adUnits = settings.ad_units || [];
        const affiliates = settings.affiliates || [];

        // دالة كتقلب على كود الإعلان أو الأفلييت
        function getAdHtml(selectedId) {
            if (!selectedId || selectedId === 'none') return null;
            
            // إيلا كان المنتج ديالك (الكتاب)
            if (selectedId === 'prod') {
                return `
                <div class="w-full bg-[#0F172A] border border-purple-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg mb-4 mt-4">
                    <div class="flex items-center gap-4">
                        <img src="${settings.prod_img}" class="w-16 h-16 rounded-lg object-cover border border-purple-500/50" alt="${settings.prod_title}">
                        <div>
                            <h4 class="text-sm font-bold text-white">${settings.prod_title}</h4>
                            <p class="text-[10px] text-slate-400">${settings.prod_desc}</p>
                        </div>
                    </div>
                    <a href="${WORKER_URL}go/prod" target="_blank" class="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap">${settings.prod_btn_text || 'Get Now'}</a>
                </div>`;
            }
            
            // إيلا كان إعلان ديال شركة (Ad Network)
            const ad = adUnits.find(a => a.id === selectedId);
            if (ad) return ad.code;

            // إيلا كان رابط أفلييت
            const aff = affiliates.find(a => a.id === selectedId);
            if (aff) {
                return `<a href="${WORKER_URL}go/${aff.id}" target="_blank" class="block w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-center py-3 rounded-xl transition-colors mb-4 mt-4"><span class="text-xs font-bold text-cyan-400 uppercase tracking-widest">🔗 ${aff.name}</span></a>`;
            }
            return null;
        }

        // 2. خريطة البلايص اللي كاينين فـ HTML
        const placements = {
            'ad-home-top': settings.place_home_top,
            'ad-blog-top': settings.place_blog_top,
            'ad-blog-bot': settings.place_blog_bot,
            'ad-news-top': settings.place_news_top,
            'ad-news-side': settings.place_news_side,
            'ad-glossary-top': settings.place_glossary_top,
            'ad-predictions-top': settings.place_predictions_top,
            
            // بالنسبة للمقالات اللي كيولدهم الذكاء الاصطناعي
            'ad-article-top': window.location.pathname.includes('/blog/') ? settings.place_art_blog_top : settings.place_art_news_top,
            'ad-article-mid': window.location.pathname.includes('/blog/') ? settings.place_art_blog_mid : settings.place_art_news_mid,
            'ad-article-side': window.location.pathname.includes('/blog/') ? settings.place_art_blog_side : settings.place_art_news_side,
        };

        // 3. كنزولو كلاس 'hidden' وكنحطو الكود فالمربعات
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

    } catch (e) {
        console.error("Ad Injector Error:", e);
    }
});