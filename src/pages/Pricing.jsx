import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import fibLogo from '../assets/fib.png'
import qiLogo from '../assets/qicard.png'
import fastpayLogo from '../assets/fastpay.png'

const FREE_INCLUDED = [
  'فایلی Word و PPTX',
  'هەموو دیزاینەکان بەردەستن',
  'ئەپلۆدکردنی فایل',
  'تەنها 100 خاڵ مانگانە',
]

const PRO_FEATURES = [
  'کردنەوەی 15 بۆ 30 سڵاید بۆ یەک پرێسێنتەیشن',
  'خاڵی بێسنوور (Unlimited)',
  'دروستکردنی بێکۆتا',
  'بەکارهێنانی بەهێزترین زیرەکی دەستکرد',
]

const POINT_PACKAGES = [
  { points: 500,  price: '6,000' },
  { points: 1100, price: '12,000' },
  { points: 2000, price: '18,000' },
]

export default function Pricing() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [plan, setPlan] = useState(null)
  const [expiresAt, setExpiresAt] = useState(null)
  const [selectedPkg, setSelectedPkg] = useState(1)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('plan, plan_expires_at').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setPlan(data.plan)
          setExpiresAt(data.plan_expires_at)
        }
      })
  }, [user])

  const isPro = plan === 'pro'
  const formatExpiry = (d) => d ? new Date(d).toLocaleDateString('en-GB') : ''

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-36 pb-20 px-6 bg-slate-950">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl font-black mb-3">نرخەکان</h1>
            <p className="text-slate-400 text-lg">پلانی گونجاو هەڵبژێرە</p>
          </motion.div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">

            {/* FREE */}
            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className={`relative rounded-3xl p-8 flex flex-col border-2 transition-all ${isPro ? 'bg-slate-900/40 border-slate-800 pointer-events-none' : 'bg-slate-900 border-slate-600'}`}
              style={{ boxShadow: isPro ? 'none' : '0 0 40px rgba(148,163,184,0.08)', opacity: isPro ? 0.5 : 1 }}
            >
              {isPro && (
                <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                  <svg className="w-full h-full" preserveAspectRatio="none">
                    <line x1="0" y1="0" x2="100%" y2="100%" stroke="rgba(148,163,184,0.4)" strokeWidth="2"/>
                  </svg>
                </div>
              )}
              {plan === 'free' && (
                <div className="absolute -top-4 right-6 bg-slate-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                  پلانی تۆ
                </div>
              )}

              <div className={isPro ? 'opacity-50' : ''}>
              <div className="mb-8">
                <h3 className="text-2xl font-black text-white mb-4">خۆڕای</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white">0</span>
                </div>
                <p className="text-slate-500 text-sm mt-1">بۆ هەمیشە</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {FREE_INCLUDED.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                    <svg className="w-4 h-4 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/create')}
                className="mt-auto w-full py-3.5 rounded-xl text-base border border-slate-600 text-white hover:bg-slate-800 transition font-semibold"
              >
                دەست پێبکە
              </motion.button>
              </div>
            </motion.div>

            {/* POINTS */}
            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className={`relative rounded-3xl p-8 flex flex-col border-2 transition-all ${isPro ? 'bg-slate-900/40 border-slate-800 pointer-events-none' : 'bg-slate-900 border-blue-500'}`}
              style={{ boxShadow: isPro ? 'none' : '0 0 60px rgba(59,130,246,0.2), 0 0 120px rgba(59,130,246,0.08)', opacity: isPro ? 0.5 : 1 }}
            >
              {isPro && (
                <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                  <svg className="w-full h-full" preserveAspectRatio="none">
                    <line x1="0" y1="0" x2="100%" y2="100%" stroke="rgba(148,163,184,0.4)" strokeWidth="2"/>
                  </svg>
                </div>
              )}
              <div className={isPro ? 'opacity-50' : ''}>
              <div className="mb-6">
                <h3 className="text-2xl font-black text-white mb-1">کڕینی خاڵ</h3>
                <p className="text-slate-500 text-sm">خاڵی زیاتر بکڕە</p>
              </div>

              <div className="space-y-3 flex-1 mb-8">
                {POINT_PACKAGES.map((pkg, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPkg(i)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 transition ${
                      selectedPkg === i
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⭐</span>
                      <span className={`font-black text-lg ${selectedPkg === i ? 'text-blue-400' : 'text-white'}`}>
                        {pkg.points.toLocaleString()} خاڵ
                      </span>
                    </div>
                    <span className={`font-bold text-sm ${selectedPkg === i ? 'text-blue-400' : 'text-slate-400'}`}>
                      {pkg.price} د.ع
                    </span>
                  </motion.button>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(59,130,246,0.4)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/payment?type=points&pkg=${selectedPkg}`)}
                className="mt-auto w-full py-3.5 rounded-xl text-base font-black text-white transition"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
              >
                کڕین
              </motion.button>
              </div>
            </motion.div>

            {/* PRO */}
            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="relative bg-slate-900 border-2 border-yellow-400 rounded-3xl p-8 flex flex-col"
              style={{ boxShadow: '0 0 60px rgba(234,179,8,0.3), 0 0 120px rgba(234,179,8,0.1)' }}
            >
              {plan === 'pro' && (
                <div className="absolute -top-4 right-6 bg-yellow-400 text-slate-950 text-xs font-bold px-4 py-1.5 rounded-full">
                  پلانی تۆ
                </div>
              )}
              <div className="absolute -top-4 left-6 bg-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                باشترین
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-black text-white mb-4">پرۆ</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">10,000</span>
                  <span className="text-yellow-400 font-bold text-lg">د.ع</span>
                </div>
                <p className="text-slate-500 text-sm mt-1">مانگانە</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {PRO_FEATURES.map((f, i) => (
                  <motion.li
                    key={i}
                    className="flex items-center gap-3 text-sm font-medium"
                    style={{ color: '#f97316' }}
                    animate={{ textShadow: ['0 0 6px #f9731660', '0 0 14px #f9731699', '0 0 6px #f9731660'] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 0 4px #f97316)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </motion.li>
                ))}
              </ul>

              {isPro ? (
                <div className="mt-auto w-full py-3.5 rounded-xl text-center bg-yellow-400/10 border border-yellow-400/30">
                  <p className="text-yellow-400 font-black text-sm">تۆ پلانی پڕۆت هەیە</p>
                  {expiresAt && <p className="text-slate-400 text-xs mt-1">بەسەردەچێت لە {formatExpiry(expiresAt)}</p>}
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(234,179,8,0.4)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/payment?type=pro')}
                  className="mt-auto w-full py-3.5 rounded-xl text-base font-black text-slate-950 transition"
                  style={{ background: 'linear-gradient(135deg, #eab308, #f97316)' }}
                >
                  بەژداربوون
                </motion.button>
              )}
            </motion.div>

          </div>

          {/* Back button + Payment methods */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-12 flex flex-col items-center gap-6">

            <button onClick={() => navigate('/')}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              گەڕانەوە
            </button>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl px-8 py-5 flex items-center gap-6">
              <p className="text-slate-500 text-xs">شێوازەکانی پارەدان</p>
              <div className="w-px h-8 bg-slate-800" />

              {/* FIB */}
              <div className="flex items-center gap-2">
                <img src={fibLogo} alt="FIB" className="w-10 h-10 rounded-full object-cover" />
                <span className="text-slate-400 text-xs font-medium">FIB</span>
              </div>

              {/* FastPay */}
              <div className="flex items-center gap-2">
                <img src={fastpayLogo} alt="FastPay" className="h-8 w-20 rounded-lg object-contain bg-pink-600 p-1" />
                <span className="text-slate-400 text-xs font-medium">FastPay</span>
              </div>

              {/* Qi Card */}
              <div className="flex items-center gap-2">
                <img src={qiLogo} alt="Qi Card" className="w-10 h-10 object-contain" />
                <span className="text-slate-400 text-xs font-medium">Qi Card</span>
              </div>
            </div>

          </motion.div>

        </div>
      </div>
    </>
  )
}
