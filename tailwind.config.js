/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",           // index.html, app.html, news.html, blog.html, etc.
    "./js/**/*.js",       // app.js, system-core.js, translations.js
    "./worker.js",        // le worker Cloudflare qui génère du HTML dynamique
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        cairo: ['Cairo', 'sans-serif'],
      },
      colors: {
        dark: '#060B14',
        'dark-card': '#0A101D',
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
  // ✅ Safelist: classes générées dynamiquement dans le worker ou JS
  // (classes que Tailwind ne peut pas détecter car elles sont construites en JS)
  safelist: [
    // Couleurs dynamiques des tendances
    'text-emerald-400', 'text-red-400', 'text-yellow-400', 'text-blue-400',
    'text-cyan-400', 'text-purple-400', 'text-orange-400', 'text-white',
    // Backgrounds dynamiques
    'bg-emerald-500/10', 'bg-red-500/10', 'bg-yellow-500/10', 'bg-blue-500/10',
    'border-emerald-500/30', 'border-red-500/30', 'border-blue-500/20',
    // Gradients dynamiques (sentiment)
    'from-yellow-400', 'to-yellow-500', 'to-emerald-500', 'from-red-500',
    'from-emerald-400',
    // Directions RTL/LTR
    'text-right', 'text-left',
    // Prose (typography plugin)
    { pattern: /prose-.*/ },
    // Animations
    'animate-ping', 'animate-pulse', 'animate-spin',
    // Grid dynamique
    'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4',
    // Font Cairo (RTL arabe)
    'font-cairo',
  ]
}