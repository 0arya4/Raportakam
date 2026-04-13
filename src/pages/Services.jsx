import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import pptxLogo from '../assets/pptx.png.png'
import wordLogo from '../assets/word.png.png'

const SERVICES = [
  {
    logo: pptxLogo,
    title: 'دروستکردنی سیمینار',
    desc: 'سیمینارێکی پڕۆفیشناڵ بە PowerPoint',
    color: 'from-yellow-500/20 to-orange-500/20',
    border: 'border-yellow-500/40',
    glow: 'rgba(234,179,8,0.3)',
    active: true,
    path: '/create?type=pptx',
  },
  {
    logo: wordLogo,
    title: 'دروستکردنی ڕاپۆرت',
    desc: 'ڕاپۆرتێکی ئەکادیمی و پڕۆفیشناڵ',
    color: 'from-blue-500/20 to-indigo-600/20',
    border: 'border-blue-500/40',
    glow: 'rgba(59,130,246,0.3)',
    active: true,
    path: '/report',
  },
  {
    id: 'ai-detect',
    icon: '🔍',
    title: 'دەستنووس یان AI؟',
    desc: 'بزانە نووسینەکەت دەرەکەوێ کە زیرەکی دەستکردە؟',
    color: 'from-purple-500/20 to-violet-600/20',
    border: 'border-purple-500/40',
    glow: 'rgba(168,85,247,0.3)',
    active: true,
    path: '/detect',
  },
  {
    icon: '🔜',
    title: 'لەماوەیەکی کەم زیاد دەبێ',
    desc: '',
    color: 'from-slate-800/50 to-slate-900/50',
    border: 'border-slate-700/40',
    glow: null,
    active: false,
  },
  {
    icon: '🔜',
    title: 'لەماوەیەکی کەم زیاد دەبێ',
    desc: '',
    color: 'from-slate-800/50 to-slate-900/50',
    border: 'border-slate-700/40',
    glow: null,
    active: false,
  },
  {
    icon: '🔜',
    title: 'لەماوەیەکی کەم زیاد دەبێ',
    desc: '',
    color: 'from-slate-800/50 to-slate-900/50',
    border: 'border-slate-700/40',
    glow: null,
    active: false,
  },
]

const AI_MODELS = [
  {
    id: 'haiku',
    name: 'Haiku',
    tag: 'خۆڕای',
    desc: '3x هێندە خێراترە لە سۆنێت\nبۆ کاری خێرا و کاری ڕۆژانە\nکوالیتی ئاسای\nڕێژەی جوانی دیززاینەکەی ٪80',
    icon: '⚡',
    pro: false,
    border: 'border-slate-600',
    activeBorder: 'border-cyan-400',
    activeGlow: 'rgba(34,211,238,0.5)',
    tagColor: 'text-cyan-400 bg-cyan-400/10',
  },
  {
    id: 'sonnet',
    name: 'Sonnet',
    tag: 'پڕۆ',
    desc: 'خاوترە لەچاو مۆدێلەکانی تر\nبۆ کاری پڕۆفیشناڵ و ئاڵۆز\nکوالیتی زۆر بەرز\nڕێژەی جوانی دیزاینەکەی ٪95',
    icon: '👑',
    pro: true,
    border: 'border-slate-600',
    activeBorder: 'border-yellow-400',
    activeGlow: 'rgba(234,179,8,0.5)',
    tagColor: 'text-yellow-400 bg-yellow-400/10',
  },
]

export default function Services() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isPro, setIsPro] = useState(false)
  const [selectedAI, setSelectedAI] = useState('haiku')
  const [infoOpen, setInfoOpen] = useState(false)
  const infoRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (infoRef.current && !infoRef.current.contains(e.target)) setInfoOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('plan').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.plan === 'pro') {
          setIsPro(true)
        }
      })
  }, [user])

  const handleServiceClick = (s) => {
    if (!s.active) return
    if (s.path.includes('?')) navigate(`${s.path}&ai=${selectedAI}`)
    else navigate(`${s.path}?ai=${selectedAI}`)
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-950 pt-28 pb-16 px-6">
        <div className="max-w-4xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-3">خزمەتگوزاریەکان</h1>
          </motion.div>

          {/* AI Model Selector */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
            <p className="text-slate-400 text-sm font-medium mb-3 text-center">مۆدێلی AI هەڵبژێرە</p>
            <div className="grid grid-cols-2 gap-3">
              {AI_MODELS.map(m => {
                const locked = m.pro && !isPro
                const active = selectedAI === m.id
                return (
                  <motion.button
                    key={m.id}
                    whileHover={!locked ? { scale: 1.02 } : {}}
                    whileTap={!locked ? { scale: 0.98 } : {}}
                    onClick={() => !locked && setSelectedAI(m.id)}
                    className={`relative flex flex-col items-center text-center gap-2 p-6 rounded-2xl border-2 transition ${
                      active ? `${m.activeBorder} bg-white/5` : `${m.border} bg-slate-900/60`
                    } ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    style={active ? { boxShadow: `0 0 24px ${m.activeGlow}, 0 0 48px ${m.activeGlow}` } : {}}
                  >
                    {/* Illustration icon */}
                    {m.id === 'haiku' ? (
                      <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                        <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
                          <path d="M16 4L10 16h4l-2 12 12-14h-5l3-10H16z" fill="#22d3ee" stroke="#06b6d4" strokeWidth="1" strokeLinejoin="round"/>
                          <circle cx="16" cy="16" r="14" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="2 3" opacity="0.4"/>
                        </svg>
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                        <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
                          <path d="M16 3l2.5 7.5H27l-6.5 4.7 2.5 7.5L16 18l-7 4.7 2.5-7.5L5 10.5h8.5z" fill="#eab308" stroke="#ca8a04" strokeWidth="0.8" strokeLinejoin="round"/>
                          <circle cx="16" cy="26" r="2" fill="#eab308" opacity="0.6"/>
                          <path d="M10 28h12" stroke="#eab308" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
                        </svg>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center justify-center gap-2">
                        <span className={`font-black text-sm ${active ? 'text-white' : 'text-slate-300'}`}>{m.name}</span>
                      </div>
                      <p className="text-slate-400 text-xs mt-1 font-semibold whitespace-pre-line">{m.desc}</p>
                    </div>
                    <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full ${m.tagColor}`}>{m.tag}</span>
                    {locked && (
                      <span className="absolute bottom-2 left-2 text-xs text-yellow-400/80">🔒 پڕۆ پێویستە</span>
                    )}
                    {active && (
                      <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-yellow-400" />
                    )}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {SERVICES.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={s.active ? { scale: 1.03, boxShadow: s.glow ? `0 0 30px ${s.glow}` : undefined } : {}}
                whileTap={s.active ? { scale: 0.97 } : {}}
                onClick={() => handleServiceClick(s)}
                className={`relative bg-gradient-to-br ${s.color} border ${s.border} rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center gap-3 transition ${
                  s.active ? 'cursor-pointer' : 'cursor-default opacity-50'
                }`}
              >
                {/* Info bubble for AI Detect card */}
                {s.id === 'ai-detect' && (
                  <div ref={infoRef} className="absolute top-3 left-3" onClick={e => e.stopPropagation()}>
                    {/* Pulsing bubble */}
                    <motion.button
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      onClick={() => setInfoOpen(v => !v)}
                      className="h-9 px-4 rounded-full bg-purple-500/40 border border-purple-400/60 flex items-center justify-center text-purple-300 text-base font-black hover:bg-purple-500/60 transition whitespace-nowrap"
                    >
                      زانیاری
                    </motion.button>
                    {/* Popup */}
                    <AnimatePresence>
                      {infoOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-8 left-0 w-56 bg-slate-900 border border-purple-500/40 rounded-xl p-3 shadow-xl z-50 text-right"
                        >
                          <p className="text-purple-400 font-black text-xs mb-1">AI Detection - ئەی ئای چێک</p>
                          <p className="text-slate-300 text-xs leading-relaxed">تێکست ، فایل یان نووسینێک بنێرە پێت ئەڵێین بە ڕێژەی چەند دەرەکەوێ کە زیرەکی دەستکردە</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {s.logo
                  ? <img src={s.logo} alt={s.title} className="w-20 h-20 sm:w-24 sm:h-24 object-contain" />
                  : <span className="text-4xl sm:text-5xl">{s.icon}</span>
                }
                <div>
                  <p className={`font-black text-base sm:text-lg ${s.active ? 'text-white' : 'text-slate-500'}`}>
                    {s.title}
                  </p>
                  {s.desc && <p className="text-slate-400 text-sm mt-1">{s.desc}</p>}
                </div>
                {s.active && (
                  <div className={`mt-2 text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r ${s.color} border ${s.border}`}>
                    بەکارهێنان ←
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <button onClick={() => navigate(-1)} className="flex items-center justify-center gap-1 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200 text-sm font-medium px-5 py-4 rounded-xl transition w-full hover:bg-white/5">← گەڕانەوە</button>
          </div>

        </div>
      </div>
    </>
  )
}
