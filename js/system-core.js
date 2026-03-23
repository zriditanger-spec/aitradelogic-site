// ==========================================
// 🛡️ STEALTH CONTENT DETECTOR (NINJA MODE)
// ==========================================
setTimeout(() => {
    // 1. الفخ (Bait) - كلاسات كيقلب عليهم الآدبلوك باش يحصل
    const bait = document.createElement('div');
    bait.className = 'pub_300x250 adsbox ad-placement doubleclick';
    bait.style.height = '1px';
    bait.style.width = '1px';
    bait.style.position = 'absolute';
    bait.style.left = '-9999px';
    document.body.appendChild(bait);

    // 2. كنتسناو ونشوفو واش الفخ تقتل
    setTimeout(() => {
        if (bait.offsetHeight === 0 || window.getComputedStyle(bait).display === 'none') {
            // 🚨 حصل! نطلعو الميساج بـ سمية مامعيقاش نهائياً
            showSupportModal();
        }
        bait.remove();
    }, 300);
}, 2000);

// 3. الديزاين ديال الميساج (بدون أي كلمة Adblock)
function showSupportModal() {
    // سمينا الآيدي sys-notice-99 باش يبان كود ديال السيستيم
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