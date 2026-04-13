import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Preloader from '../components/Preloader'
import logo from '../assets/logo.png.png'

export default function Landing() {
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      <AnimatePresence>
        {!loaded && <Preloader onDone={() => setLoaded(true)} />}
      </AnimatePresence>

      {/* Fixed logo watermark */}
      <img src={logo} alt="" className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] object-contain pointer-events-none select-none z-0" style={{ opacity: 0.2 }} />

      <Navbar />

      {/* ── HERO ─────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden px-6 pt-20 pb-10 sm:pt-24 sm:pb-20">

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
          <div className="order-1 lg:order-1 text-right">

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={loaded ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }}
              className="text-5xl sm:text-6xl xl:text-7xl font-black leading-[1.1] mb-6 tracking-tight">
              سیمینارەکەت<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #eab308, #f97316)' }}>
                لە چەند چرکەیەکدا
              </span><br />
              ئامادەیە
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={loaded ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 }}
              className="text-slate-400 text-lg leading-relaxed mb-10 max-w-md">
              تەنها <span style={{ color: '#eab308', textShadow: '0 0 12px rgba(234,179,8,0.5)' }}>بیرۆکەکەت بنووسە</span>، ئێمە بۆت دەکەین بە سیمینار یان ڕاپۆرتێکی پڕۆفیشناڵ <span style={{ color: '#eab308', textShadow: '0 0 12px rgba(234,179,8,0.5)' }}>لەگەل جەندەها خزمەتگوزاری تر</span>
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={loaded ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 mb-12">

              {/* Button 1 — دەستپێبکە animated */}
              <div className="relative w-full sm:w-auto">
                <motion.span
                  animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-2xl pointer-events-none border-2 border-yellow-400"
                />
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(234,179,8,0.5)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/services')}
                  className="relative z-10 w-full flex items-center justify-center overflow-hidden text-slate-950 font-black px-10 py-5 rounded-2xl text-lg"
                  style={{ background: 'linear-gradient(135deg, #eab308, #f97316)' }}>
                  <motion.span
                    animate={{ x: ['-200%', '250%'] }}
                    transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
                    className="absolute inset-y-0 w-1/3 skew-x-[-15deg] pointer-events-none"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)' }}
                  />
                  <span className="relative z-10">دەستپێبکە</span>
                </motion.button>
              </div>

              {/* Button 2 — نرخەکان */}
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/pricing')}
                className="w-full sm:w-auto flex items-center justify-center border border-slate-700 hover:border-yellow-500/50 text-slate-300 font-semibold px-8 py-5 rounded-2xl text-lg transition hover:bg-yellow-500/5">
                نرخەکان
              </motion.button>

              {/* Button 3 — Profile */}
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/profile')}
                className="w-full sm:w-auto flex items-center justify-center border border-slate-700 hover:border-slate-600 text-slate-300 font-semibold px-8 py-5 rounded-2xl text-lg transition hover:bg-white/5">
                پرۆفایل
              </motion.button>

              {/* Button 4 — فایلەکانم */}
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/history')}
                className="w-full sm:w-auto flex items-center justify-center border border-slate-700 hover:border-slate-600 text-slate-300 font-semibold px-8 py-5 rounded-2xl text-lg transition hover:bg-white/5">
                فایلەکانم
              </motion.button>

            </motion.div>

          </div>

          {/* Right — Mockup */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={loaded ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.35, duration: 0.7 }}
            className="order-2 lg:order-2 relative">
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
                      ئالان دەنووسێت...
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
                    { label: 'دیزاینکردنی سڵایدەکان', done: true },
                    { label: 'دروستکردنی سلایدەکان', active: true },
                    { label: 'ئەپلۆدکردنی فایلەکە', pending: true },
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
      <section id="how" className="py-12 sm:py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10 sm:mb-20">
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
                { n: '٢', title: 'دیزاینەکان هەڵبژێرە', desc: 'شێواز، ڕەنگ، ژمارەی سلاید و زیادکردنەکانی هەڵبژێرە', icon: '🎨', color: 'from-orange-400 to-red-400' },
                { n: '٣', title: 'داگرتنی فایل', desc: 'لە چرکەیەکدا فایلی PPTX یان Word داگرە', icon: '⬇️', color: 'from-yellow-400 to-orange-400' },
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

      {/* ── WHY US — Comparison ──────────────────── */}
      <section id="features" className="py-12 sm:py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-5xl font-black mb-3">جیاوازی ئێمە چیە؟</h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Old way */}
            <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-7">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xl">😩</div>
                <h3 className="text-slate-400 font-black text-xl">شێوازی کۆن</h3>
              </div>
              <div className="space-y-4">
                {[
                  'کاتێکی زۆرت پێ دەچێت بۆ دیزاینکردن',
                  'پێویستە ئەزمونێکی باشت هەبێت لە Word و Powerpoint',
                  'دیزاینی سادە و ئاسای',
                  'هەموو ئیشەکە خۆت ئەیکەی',
                  'کاتی زۆرت لە نووسینەوەی ناوەڕۆک پێ دەچێت',
                ].map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 + i * 0.07 }}
                    className="flex items-center gap-3 text-right">
                    <span className="text-red-500 text-lg flex-shrink-0">✗</span>
                    <p className="text-slate-500 text-sm flex-1">{item}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Raportakam way */}
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="relative bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/25 rounded-3xl p-8 overflow-hidden">
              <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-yellow-400 rounded-full blur-[100px] opacity-10 pointer-events-none" />
              <div className="flex items-center gap-3 mb-7">
                <img src={logo} alt="ڕاپۆرتەکەم" className="w-10 h-10 object-contain" />
                <h3 className="text-yellow-400 font-black text-xl">ڕاپۆرتەکەم</h3>
              </div>
              <div className="space-y-4">
                {[
                  'لە 30 چرکە بۆ خولەکێک ئامادەدەبێت',
                  'هیچ ئەزموونێکت پێویست نییە',
                  'دیزاینی پڕۆفیشناڵ',

                  'AI هەموو ئیشەکەت بۆ ئەکات',
                  'ناوەڕۆک خۆمان دروستی ئەکەین',
                ].map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.25 + i * 0.07 }}
                    className="flex items-center gap-3 text-right">
                    <span className="text-yellow-400 text-lg flex-shrink-0">✓</span>
                    <p className="text-white text-sm flex-1 font-medium">{item}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────── */}
      <section className="py-12 sm:py-28 px-6">
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
              <h2 className="text-5xl sm:text-6xl font-black mb-10">ئامادەیت؟</h2>

              {/* Unique animated CTA button */}
              <div className="flex justify-center">
                <div className="relative">
                  {/* Floating particles */}
                  {[
                    { x: -60, y: -28, delay: 0, size: 'w-1.5 h-1.5' },
                    { x: 65, y: -18, delay: 0.5, size: 'w-1 h-1' },
                    { x: -35, y: 32, delay: 1, size: 'w-1 h-1' },
                    { x: 60, y: 28, delay: 1.5, size: 'w-1.5 h-1.5' },
                    { x: 5, y: -42, delay: 0.8, size: 'w-1 h-1' },
                  ].map((p, i) => (
                    <motion.span key={i}
                      animate={{ y: [p.y, p.y - 10, p.y], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
                      className={`absolute ${p.size} rounded-full bg-yellow-400 blur-[1px] pointer-events-none`}
                      style={{ left: `calc(50% + ${p.x}px)`, top: `calc(50% + ${p.y}px)` }}
                    />
                  ))}

                  {/* Pulsing outer ring */}
                  <motion.span
                    animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-2xl pointer-events-none border-2 border-yellow-400"
                  />

                  <motion.button
                    onClick={() => navigate('/services')}
                    whileHover={{ scale: 1.04, boxShadow: '0 0 50px rgba(234,179,8,0.5)' }}
                    whileTap={{ scale: 0.96 }}
                    className="relative z-10 px-20 py-6 text-2xl font-black rounded-2xl overflow-hidden border-2 border-yellow-500/60"
                    style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.12), rgba(249,115,22,0.08))' }}>
                    <motion.span
                      animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 opacity-15 pointer-events-none"
                      style={{ background: 'linear-gradient(270deg, #eab308, #f97316, #eab308)', backgroundSize: '200% 200%' }}
                    />
                    <span className="relative z-10 text-transparent bg-clip-text"
                      style={{ backgroundImage: 'linear-gradient(135deg, #eab308, #f97316)' }}>
                      بینینی خزمەتگوزاریەکان
                    </span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </>
  )
}
