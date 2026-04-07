import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Preloader from '../components/Preloader'

export default function Landing() {
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      <AnimatePresence>
        {!loaded && <Preloader onDone={() => setLoaded(true)} />}
      </AnimatePresence>

      <Navbar />

      {/* ── HERO ─────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden px-6 pt-24 pb-20">

        {/* BG */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(234,179,8,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(234,179,8,0.8) 1px, transparent 1px)',
            backgroundSize: '80px 80px'
          }} />
          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 9, repeat: Infinity }}
            className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-yellow-400 rounded-full blur-[160px]" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div className="order-2 lg:order-1 text-right">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={loaded ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold px-4 py-2 rounded-full mb-8">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              AI-Powered · کوردی · پیشەیی
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={loaded ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }}
              className="text-5xl sm:text-6xl xl:text-7xl font-black leading-[1.1] mb-6 tracking-tight">
              سیمینارەکەت<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #eab308, #f97316)' }}>
                لە چرکەیەکدا
              </span><br />
              ئامادەیە
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={loaded ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 }}
              className="text-slate-400 text-lg leading-relaxed mb-10 max-w-md">
              بیرۆکەکەت بنووسە، ئێمە سیمینار یان ڕاپۆرتی پیشەیی بۆ دروست دەکەین — بەخۆڕایی.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={loaded ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 mb-12">
              <motion.button whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(234,179,8,0.5)' }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/services')}
                className="flex items-center justify-center gap-2 text-slate-950 font-black px-8 py-4 rounded-2xl text-base"
                style={{ background: 'linear-gradient(135deg, #eab308, #f97316)' }}>
                ⚡ دەست پێبکە — بەخۆڕایی
              </motion.button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/pricing')}
                className="flex items-center justify-center gap-2 border border-slate-700 hover:border-yellow-500/50 text-slate-300 font-semibold px-8 py-4 rounded-2xl text-base transition hover:bg-yellow-500/5">
                نرخەکان ببینە
              </motion.button>
            </motion.div>

            {/* Stats row */}
            <motion.div initial={{ opacity: 0 }} animate={loaded ? { opacity: 1 } : {}} transition={{ delay: 0.5 }}
              className="grid grid-cols-3 gap-4">
              {[
                { val: '٣٠', unit: 'چرکە', label: 'کاتی دروستکردن' },
                { val: '٢٠+', unit: '', label: 'شێوازی دیزاین' },
                { val: '١٠٠٪', unit: '', label: 'بە کوردی' },
              ].map((s, i) => (
                <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-black text-white">{s.val}<span className="text-yellow-400 text-lg">{s.unit}</span></div>
                  <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Mockup */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={loaded ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.35, duration: 0.7 }}
            className="order-1 lg:order-2 relative">
            <div className="absolute -inset-6 rounded-3xl opacity-20 blur-3xl" style={{ background: 'linear-gradient(135deg, #eab308, #f97316)' }} />

            <div className="relative bg-slate-900 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-5 py-3.5 bg-slate-800 border-b border-slate-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 mx-3 bg-slate-700 rounded-lg h-6 flex items-center px-3">
                  <span className="text-slate-500 text-xs">raportakam.com/create</span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 text-right">
                  <p className="text-slate-400 text-xs mb-2">بابەتەکەت بنووسە</p>
                  <p className="text-white text-sm font-medium">گۆڕانکاری ئاووهەوا و کاریگەرییەکانی لە کوردستان</p>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-700">
                    <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
                      className="flex items-center gap-1.5 text-yellow-400 text-xs">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                      هوشیار دەنووسێت...
                    </motion.div>
                    <div className="flex gap-2">
                      <span className="bg-yellow-400/15 text-yellow-400 text-xs px-2 py-0.5 rounded-full border border-yellow-500/20">١٠ سلاید</span>
                      <span className="bg-slate-700 text-slate-400 text-xs px-2 py-0.5 rounded-full">PPTX</span>
                    </div>
                  </div>
                </div>

                {/* Stages */}
                <div className="space-y-2">
                  {[
                    { label: 'شیکردنەوەی بابەت', done: true },
                    { label: 'دیزاینکردنی شێوازەکان', done: true },
                    { label: 'دروستکردنی سلایدەکان', active: true },
                    { label: 'بینای فایلەکە', pending: true },
                  ].map((s, i) => (
                    <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs border transition-all ${s.done ? 'bg-green-950/40 border-green-800/40' : s.active ? 'bg-slate-800 border-yellow-500/50' : 'bg-slate-800/30 border-slate-700/30 opacity-40'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${s.done ? 'bg-green-500' : s.active ? '' : 'bg-slate-700'}`}>
                        {s.done && <span className="text-white text-xs">✓</span>}
                        {s.active && <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full" />}
                      </div>
                      <span className={s.done ? 'text-green-400' : s.active ? 'text-white font-medium' : 'text-slate-500'}>{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Bar */}
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div animate={{ width: ['55%', '75%', '55%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#eab308,#f97316)' }} />
                </div>
              </div>
            </div>

            {/* Floating chips */}
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-5 -right-5 bg-slate-800 border border-yellow-500/30 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-2">
              <span className="text-xl">📊</span>
              <div className="text-right">
                <div className="text-white text-xs font-bold">PPTX ئامادەیە</div>
                <div className="text-slate-400 text-xs">٢٨ چرکە</div>
              </div>
            </motion.div>

            <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }}
              className="absolute -bottom-5 -left-5 bg-slate-800 border border-green-500/30 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-2">
              <span className="text-xl">✅</span>
              <div className="text-right">
                <div className="text-white text-xs font-bold">تەواوبوو</div>
                <div className="text-green-400 text-xs">١٠ سلاید</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS — Vertical Timeline ─────── */}
      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
            <p className="text-yellow-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">پڕۆسەکە</p>
            <h2 className="text-5xl font-black">چۆن کاردەکات؟</h2>
          </motion.div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute right-[28px] sm:right-1/2 top-0 bottom-0 w-px"
              style={{ background: 'linear-gradient(to bottom, transparent, #eab308, #f97316, transparent)' }} />

            <div className="space-y-14">
              {[
                { n: '١', title: 'بیرۆکەکەت بنووسە', desc: 'بابەتەکەت و وردەکاریەکان بنووسە — زمانی کوردی بەتەواوی پشتیوانیکراوە', icon: '✍️', color: 'from-yellow-400 to-orange-400' },
                { n: '٢', title: 'ڕێکخستنەکان هەڵبژێرە', desc: 'شێواز، ڕەنگ، ژمارەی سلاید و زیادکردنەکانی هەڵبژێرە', icon: '🎨', color: 'from-orange-400 to-red-400' },
                { n: '٣', title: 'داگرتنی فایل', desc: 'لە چرکەیەکدا فایلی PPTX یان Word داگریت', icon: '⬇️', color: 'from-yellow-400 to-orange-400' },
              ].map((s, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? 40 : -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className={`relative flex items-start gap-6 ${i % 2 === 0 ? 'sm:flex-row-reverse sm:text-left' : 'sm:flex-row sm:text-right'} flex-row-reverse text-right`}>

                  {/* Number bubble */}
                  <div className={`relative z-10 flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${s.color} shadow-xl`}>
                    <span className="text-2xl font-black text-slate-950">{s.n}</span>
                  </div>

                  {/* Card */}
                  <div className={`flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all group`}>
                    <div className="text-3xl mb-3">{s.icon}</div>
                    <h3 className="text-xl font-black mb-2">{s.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES — Bento Grid ────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-yellow-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">تایبەتمەندییەکان</p>
            <h2 className="text-5xl font-black mb-3">هەموو چیت پێویستە</h2>
            <p className="text-slate-500">لەیەک شوێندا</p>
          </motion.div>

          {/* Bento grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[160px]">

            {/* Big card — speed */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}
              className="col-span-2 row-span-2 relative bg-gradient-to-br from-yellow-500/15 to-orange-500/5 border border-yellow-500/20 rounded-3xl p-7 overflow-hidden group">
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-yellow-400 rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-all duration-700" />
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-yellow-400 text-2xl font-black mb-2">خێرا</h3>
              <p className="text-slate-400 text-sm leading-relaxed">لە کەمتر لە ٣٠ چرکە فایلەکەت ئامادەدەبێت — بە کوالیتی پیشەیی</p>
              <div className="absolute bottom-5 left-5 flex gap-2">
                <span className="bg-yellow-400/20 border border-yellow-500/30 text-yellow-400 text-xs px-3 py-1 rounded-full">٣٠ چرکە</span>
                <span className="bg-slate-800 text-slate-400 text-xs px-3 py-1 rounded-full border border-slate-700">AI</span>
              </div>
            </motion.div>

            {/* Design */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="col-span-1 bg-gradient-to-br from-purple-500/15 to-pink-500/5 border border-purple-500/20 rounded-3xl p-5 overflow-hidden group">
              <div className="text-3xl mb-3">🎨</div>
              <h3 className="text-purple-400 font-bold text-sm mb-1">دیزاینی جوان</h3>
              <p className="text-slate-500 text-xs">تێمەی پیشەیی</p>
            </motion.div>

            {/* Kurdish */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
              className="col-span-1 bg-gradient-to-br from-green-500/15 to-emerald-500/5 border border-green-500/20 rounded-3xl p-5 overflow-hidden">
              <div className="text-3xl mb-3">🌐</div>
              <h3 className="text-green-400 font-bold text-sm mb-1">زمانی کوردی</h3>
              <p className="text-slate-500 text-xs">١٠٠٪ کوردی</p>
            </motion.div>

            {/* File upload */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="col-span-1 bg-gradient-to-br from-blue-500/15 to-cyan-500/5 border border-blue-500/20 rounded-3xl p-5">
              <div className="text-3xl mb-3">📂</div>
              <h3 className="text-blue-400 font-bold text-sm mb-1">بارکردنی فایل</h3>
              <p className="text-slate-500 text-xs">PDF, CSV, Word</p>
            </motion.div>

            {/* PPTX + Word — wide */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.25 }}
              className="col-span-2 lg:col-span-1 bg-gradient-to-br from-red-500/15 to-rose-500/5 border border-red-500/20 rounded-3xl p-5">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-red-400 font-bold text-sm mb-1">PPTX و Word</h3>
              <p className="text-slate-500 text-xs">هەر دوو جۆر</p>
            </motion.div>

            {/* Secure — wide */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
              className="col-span-2 bg-gradient-to-br from-slate-500/10 to-zinc-500/5 border border-slate-700 rounded-3xl p-5 flex items-center gap-5">
              <div className="text-4xl">🔒</div>
              <div>
                <h3 className="text-slate-300 font-bold mb-1">پارێزراو</h3>
                <p className="text-slate-500 text-sm">داتاکەت تایبەتەو پارێزراوە — هیچ کەسی تر دەستییەتی نییە</p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.15) 0%, rgba(249,115,22,0.1) 50%, rgba(168,85,247,0.08) 100%)' }} />
            <div className="absolute inset-0 border border-yellow-500/20 rounded-3xl pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.04]" style={{
              backgroundImage: 'linear-gradient(#eab308 1px, transparent 1px), linear-gradient(90deg, #eab308 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }} />
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }} transition={{ duration: 6, repeat: Infinity }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-400 rounded-full blur-[100px]" />

            <div className="relative text-center px-8 py-20">
              <motion.p animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}
                className="text-6xl mb-6">🚀</motion.p>
              <h2 className="text-5xl sm:text-6xl font-black mb-4">ئامادەیت؟</h2>
              <p className="text-slate-400 text-lg mb-10 max-w-md mx-auto">
                یەکەم سیمینارەکەت بۆ بەخۆڕایی دروست بکە — تۆمارکردن پێویست نییە
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button whileHover={{ scale: 1.06, boxShadow: '0 0 50px rgba(234,179,8,0.5)' }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/services')}
                  className="text-slate-950 font-black px-12 py-4 rounded-2xl text-lg"
                  style={{ background: 'linear-gradient(135deg, #eab308, #f97316)' }}>
                  ⚡ ئێستا دەست پێبکە
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/pricing')}
                  className="border border-slate-600 hover:border-yellow-500/50 text-slate-300 font-semibold px-10 py-4 rounded-2xl text-lg transition hover:bg-white/5">
                  نرخەکان ببینە
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </>
  )
}
