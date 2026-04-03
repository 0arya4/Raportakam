import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Preloader from '../components/Preloader'
import logo from '../assets/logo.png.png'

const features = [
  { icon: '⚡', title: 'خێرا', desc: 'لە کەمتر لە ٣٠ چرکە فایلەکەت ئامادەدەبێت', gradient: 'from-yellow-500/20 to-orange-500/10', border: 'border-yellow-500/20', accent: 'text-yellow-400' },
  { icon: '🎨', title: 'دیزاینی جوان', desc: 'تێمەی پیشەیی بۆ خوێندکار و بازرگانی', gradient: 'from-purple-500/20 to-pink-500/10', border: 'border-purple-500/20', accent: 'text-purple-400' },
  { icon: '📂', title: 'بارکردنی فایل', desc: 'PDF یان CSV بار بکە بۆ ناوەڕۆکی تایبەت', gradient: 'from-blue-500/20 to-cyan-500/10', border: 'border-blue-500/20', accent: 'text-blue-400' },
  { icon: '🌐', title: 'زمانی کوردی', desc: 'دروستکردن بە زمانی کوردی بە تەواوی', gradient: 'from-green-500/20 to-emerald-500/10', border: 'border-green-500/20', accent: 'text-green-400' },
  { icon: '📊', title: 'PPTX و Word', desc: 'هەر دوو جۆری فایل پشتیوانیکراون', gradient: 'from-red-500/20 to-rose-500/10', border: 'border-red-500/20', accent: 'text-red-400' },
  { icon: '🔒', title: 'پارێزراو', desc: 'داتاکەت تایبەتەو پارێزراوە', gradient: 'from-slate-500/20 to-zinc-500/10', border: 'border-slate-500/20', accent: 'text-slate-400' },
]

const steps = [
  { n: '١', title: 'بیرۆکەکەت بنووسە', desc: 'بابەت و ژمارەی سلاید دیاری بکە', color: 'from-yellow-400 to-orange-400' },
  { n: '٢', title: 'ڕێکخستنەکان دابنێ', desc: 'شیوازەکەی هەڵبژێرە', color: 'from-purple-400 to-pink-400' },
  { n: '٣', title: 'داگرتن', desc: 'فایلەکەت داونلۆد بکە', color: 'from-green-400 to-emerald-400' },
]

const stats = [
  { value: '٣٠', unit: 'چرکە', label: 'کاتی دروستکردن' },
  { value: '٢٠', unit: 'شێواز', label: 'شێوازی جیاواز' },
  { value: '١٠٠٪', unit: '', label: 'زمانی کوردی' },
]

export default function Landing() {
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(false)
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef })
  const y = useTransform(scrollYProgress, [0, 1], [0, -60])

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    show: (i) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1 } }),
  }

  return (
    <>
      <AnimatePresence>
        {!loaded && <Preloader onDone={() => setLoaded(true)} />}
      </AnimatePresence>

      <Navbar />

      {/* ── HERO ─────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-start justify-center overflow-hidden pt-32 px-4">

        {/* Animated background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(234,179,8,0.12) 0%, transparent 70%)'
          }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(#eab308 1px, transparent 1px), linear-gradient(90deg, #eab308 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
          <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.05, 0.1, 0.05] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/3 right-1/4 w-96 h-96 bg-yellow-400 rounded-full blur-[120px]" />
          <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.03, 0.07, 0.03] }}
            transition={{ duration: 10, repeat: Infinity, delay: 2 }}
            className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full blur-[100px]" />
        </div>

        {/* Watermark logo */}
        <motion.img
          src={logo}
          alt=""
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.06 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] object-contain pointer-events-none select-none"
        />

        <motion.div style={{ y }} className="relative z-10 w-full max-w-[1400px] mx-auto px-8 text-center">
          <motion.div
            custom={0} variants={fadeUp} initial="hidden" animate={loaded ? "show" : "hidden"}
            className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-500/20 text-yellow-400 text-xs font-medium px-4 py-1.5 rounded-full mb-6 mt-10"
          >
            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
            دروستکردنی ڕاپۆرت سیمینار بە ژیری دەستکرد
          </motion.div>

          <motion.h1
            custom={1} variants={fadeUp} initial="hidden" animate={loaded ? "show" : "hidden"}
            className="text-6xl md:text-8xl lg:text-9xl font-black leading-tight mb-6 tracking-tight"
          >
            بیرۆکەکەت بنووسە،
            <br />
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #eab308, #f97316)' }}>
                ئێمە دروستی دەکەین
              </span>
            </span>
          </motion.h1>


          <motion.div
            custom={3} variants={fadeUp} initial="hidden" animate={loaded ? "show" : "hidden"}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-12 mt-14"
          >
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(234,179,8,0.4)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/create')}
              className="flex items-center justify-center gap-2 text-slate-950 font-bold px-7 py-3 rounded-xl text-base transition"
              style={{ background: 'linear-gradient(135deg, #eab308, #f97316)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              ئێستا دروست بکە
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/pricing')}
              className="flex items-center justify-center gap-2 border border-slate-700 hover:border-yellow-500/40 text-slate-300 font-semibold px-7 py-3 rounded-xl text-base transition hover:bg-white/5"
            >
              نرخەکان ببینە
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            custom={4} variants={fadeUp} initial="hidden" animate={loaded ? "show" : "hidden"}
            className="flex justify-center gap-8 mb-14"
          >
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-black text-white">
                  {s.value}<span className="text-yellow-400 text-lg">{s.unit}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Hero card */}
          <motion.div
            custom={5} variants={fadeUp} initial="hidden" animate={loaded ? "show" : "hidden"}
            className="relative max-w-4xl mx-auto"
          >
            <div className="absolute -inset-0.5 rounded-2xl opacity-40 blur-sm" style={{ background: 'linear-gradient(135deg, #eab308, #f97316, #a855f7)' }} />
            <div className="relative bg-slate-900 rounded-2xl p-5 border border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                <div className="flex-1 bg-slate-800 rounded-md h-5 mx-3" />
              </div>
              <div className="text-right space-y-3">
                <p className="text-slate-400 text-sm">سیمینارێک دروست بکە دەربارەی:</p>
                <p className="text-white font-semibold">گۆڕانکاری ئاووهەوا و کاریگەرییەکانی لە کوردستان</p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="text-slate-950 font-bold text-xs px-4 py-2 rounded-lg"
                    style={{ background: 'linear-gradient(135deg, #eab308, #f97316)' }}
                  >
                    دروستکردن ←
                  </motion.button>
                  <div className="flex gap-2">
                    <span className="bg-yellow-400/15 text-yellow-400 text-xs px-2.5 py-1 rounded-full border border-yellow-500/20">١٠ سلایت</span>
                    <span className="bg-slate-800 text-slate-400 text-xs px-2.5 py-1 rounded-full">PPTX</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────── */}
      <section id="how" className="py-20 px-6 relative">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(234,179,8,0.04) 0%, transparent 70%)'
        }} />
        <div className="max-w-[1400px] mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <p className="text-yellow-400 text-xs font-semibold tracking-widest uppercase mb-2">پڕۆسەکە</p>
            <h2 className="text-3xl font-black mb-2">چۆن کاردەکات؟</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -5 }}
                className="relative bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 text-center transition-all overflow-hidden group"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
                  background: `radial-gradient(ellipse 80% 80% at 50% 50%, rgba(234,179,8,0.05) 0%, transparent 70%)`
                }} />
                <div className="relative">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br ${s.color}`}>
                    <span className="text-xl font-black text-slate-950">{s.n}</span>
                  </div>
                  <h3 className="text-base font-bold mb-1.5">{s.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <p className="text-yellow-400 text-xs font-semibold tracking-widest uppercase mb-2">تایبەتمەندییەکان</p>
            <h2 className="text-3xl font-black mb-2">هەموو چیت پێویستە</h2>
            <p className="text-slate-500 text-sm">لەیەک شوێندا</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`relative bg-gradient-to-br ${f.gradient} border ${f.border} rounded-2xl p-5 transition-all overflow-hidden group cursor-default`}
              >
                <div className="absolute top-0 left-0 right-0 h-px opacity-50" style={{ background: 'linear-gradient(90deg, transparent, currentColor, transparent)' }} />
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className={`font-bold text-sm mb-1 ${f.accent}`}>{f.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(249,115,22,0.1), rgba(168,85,247,0.1))' }} />
            <div className="absolute inset-0 border border-yellow-500/20 rounded-3xl" />
            <div className="relative px-8 py-14 text-center">
              <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }} className="text-5xl mb-5">🚀</motion.div>
              <h2 className="text-3xl font-black mb-3">ئامادەیت؟</h2>
              <p className="text-slate-400 text-sm mb-7">یەکەم ڕاپۆرتەکەت بۆ بەخۆڕایی دروست بکە</p>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(234,179,8,0.4)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/create')}
                className="text-slate-950 font-black px-10 py-3.5 rounded-xl text-base transition"
                style={{ background: 'linear-gradient(135deg, #eab308, #f97316)' }}
              >
                ئێستا دەست پێبکە — بەخۆڕایی
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </>
  )
}
