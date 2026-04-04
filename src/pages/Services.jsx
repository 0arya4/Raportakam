import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
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
    desc: 'ڕاپۆرتی تەواو بە Word',
    color: 'from-blue-500/20 to-indigo-500/20',
    border: 'border-blue-500/40',
    glow: 'rgba(59,130,246,0.3)',
    active: true,
    path: '/create?type=word',
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

export default function Services() {
  const navigate = useNavigate()

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-950 pt-28 pb-16 px-6">
        <div className="max-w-4xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-3">خزمەتگوزاریەکان</h1>
            <p className="text-slate-500 text-lg">خزمەتگوزاریەکەت هەڵبژێرە</p>
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
                onClick={() => s.active && navigate(s.path)}
                className={`relative bg-gradient-to-br ${s.color} border ${s.border} rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center gap-3 transition ${
                  s.active ? 'cursor-pointer' : 'cursor-default opacity-50'
                }`}
              >
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

        </div>
      </div>
    </>
  )
}
