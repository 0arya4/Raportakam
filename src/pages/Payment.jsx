import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import fibLogo from '../assets/fib.png'
import qiLogo from '../assets/qicard.png'
import fastpayLogo from '../assets/fastpay.png'

const POINT_PACKAGES = [
  { points: 500,  price: '6,000' },
  { points: 1100, price: '12,000' },
  { points: 2000, price: '18,000' },
]

const METHODS = [
  { id: 'fib',     label: 'FIB',     border: 'border-teal-500',  glow: 'rgba(20,184,166,0.3)', logo: fibLogo,      logoBg: 'bg-teal-600',  logoRound: 'rounded-full' },
  { id: 'fastpay', label: 'FastPay', border: 'border-pink-500',  glow: 'rgba(236,72,153,0.3)', logo: fastpayLogo,  logoBg: 'bg-pink-600',  logoRound: 'rounded-lg' },
  { id: 'qicard',  label: 'Qi Card', border: 'border-yellow-500',glow: 'rgba(234,179,8,0.3)',  logo: qiLogo,       logoBg: 'bg-transparent',logoRound: 'rounded-full' },
]

const ADMIN_PHONE = '07700361252'
const ADMIN_WHATSAPP = '9647700361252'

export default function Payment() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const type = params.get('type') // 'pro' or 'points'
  const pkgIndex = parseInt(params.get('pkg') ?? '1')

  const pkg = type === 'points' ? POINT_PACKAGES[pkgIndex] : null

  const orderLabel = type === 'pro'
    ? 'پلانی پرۆ — 10,000 د.ع / مانگانە'
    : `${pkg?.points.toLocaleString()} خاڵ — ${pkg?.price} د.ع`

  const orderPrice = type === 'pro' ? '10,000' : pkg?.price

  const [method, setMethod] = useState(null)
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('full_name, plan').eq('id', user.id).single()
      .then(({ data }) => { if (data) setProfile(data) })
  }, [user])

  const alreadyPro = type === 'pro' && profile?.plan === 'pro'
  const proOnPoints = type === 'points' && profile?.plan === 'pro'

  const canSubmit = method && phone.trim().length >= 10

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      await supabase.from('orders').insert({
        user_id: user?.id,
        order_type: type,
        package_index: type === 'points' ? pkgIndex : null,
        payment_method: method,
        sender_phone: phone.trim(),
        status: 'pending',
        amount: orderPrice.replace(',', ''),
      })
    } catch (_) {}

    const msg = encodeURIComponent(
      `سڵاو، پارەم دانا بۆ ${orderLabel}\nڕێگای پارەدان: ${METHODS.find(m => m.id === method)?.label}\nژمارەی تەلەفۆنم: ${phone}\nناو: ${profile?.full_name || '—'}\nئیمەیڵ: ${user?.email || '—'}`
    )
    setDone(true)
    setLoading(false)
    window.location.href = `https://wa.me/${ADMIN_WHATSAPP}?text=${msg}`
  }

  if (done) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-36 flex items-center justify-center px-6 bg-slate-950">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-3xl font-black text-white mb-3">سوپاس!</h2>
            <p className="text-slate-400 mb-2">داواکارییەکەت وەرگیرا</p>
            <p className="text-slate-500 text-sm mb-8">لەماوەی 30 خولەک بۆ 3 سەعات پرۆسەکە تەواو دەبێت</p>
            <button onClick={() => navigate('/')} className="bg-yellow-400 text-slate-950 font-black px-8 py-3 rounded-xl hover:bg-yellow-300 transition">
              گەڕانەوە
            </button>
          </motion.div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-36 pb-20 px-6 bg-slate-950">
        <div className="max-w-lg mx-auto">

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <button onClick={() => navigate('/pricing')} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white transition text-sm mb-6 px-4 py-2 rounded-xl">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              گەڕانەوە
            </button>
            <h1 className="text-4xl font-black text-white mb-2">پارەدان</h1>
            <p className="text-slate-500">پرۆسەی کڕین تەواو بکە</p>
          </motion.div>

          {/* Order summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-5 mb-6">
            <p className="text-slate-500 text-xs mb-1">داواکارییەکەت</p>
            <p className="text-white font-black text-lg">{orderLabel}</p>
          </motion.div>

          {/* Payment method */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
            <p className="text-white font-bold mb-3">شێوازی پارەدان هەڵبژێرە</p>
            <div className="grid grid-cols-3 gap-3">
              {METHODS.map(m => (
                <motion.button key={m.id} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => setMethod(m.id)}
                  className={`relative rounded-2xl border-2 py-4 px-2 font-black text-white text-sm transition flex flex-col items-center gap-2 ${
                    method === m.id ? m.border : 'border-slate-700'
                  }`}
                  style={method === m.id ? { boxShadow: `0 0 20px ${m.glow}` } : {}}
                >
                  <img src={m.logo} alt={m.label} className={`w-10 h-10 object-contain ${m.logoBg} ${m.logoRound} p-1`} />
                  <span className="text-xs">{m.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* After method selected */}
          <AnimatePresence>
            {method && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 mb-6">

                {/* Send to number */}
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
                  <p className="text-slate-400 text-sm mb-1">بڕە پارەکە بنێرە بۆ</p>
                  <p className="text-white font-black text-2xl tracking-widest">{ADMIN_PHONE}</p>
                  <p className="text-yellow-400 text-xs mt-2">تکایە ڕەسمی وەسڵەکە بگرە</p>
                </div>

                {/* Sender phone input */}
                <div className="bg-slate-900 border border-slate-700 focus-within:border-yellow-500/60 rounded-2xl p-5 transition">
                  <p className="text-slate-400 text-sm mb-3">لەلایەن کام ڕەقەمەوە پارەکەمان بۆ دیت؟</p>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="07700361252"
                    dir="ltr"
                    className="w-full bg-transparent outline-none text-white text-lg font-mono placeholder-slate-600"
                  />
                </div>

                {/* Red warning box */}
                <div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-5 space-y-3">
                  <p className="text-red-400 text-sm leading-relaxed">
                    دوای پارەدان لەماوەی 30 خولەک بۆ 3 سەعات{' '}
                    {type === 'pro'
                      ? 'ئەکاونتەکەت پڕۆ دەبێت'
                      : 'خاڵەکانت بۆ دێت'}
                  </p>
                  <div className="border-t border-red-500/20 pt-3">
                    <p className="text-red-400 text-sm mb-2">ڕەسمی وەسلەکە بنێرە بۆ واتسئەپی ئەم ڕەقەمە</p>
                    <a
                      href={`https://wa.me/${ADMIN_WHATSAPP}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/40 text-green-400 font-bold px-4 py-2 rounded-xl text-sm hover:bg-green-500/30 transition"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      {ADMIN_PHONE} واتسئەپ
                    </a>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit button */}
          {alreadyPro ? (
            <div className="w-full py-4 rounded-2xl text-center bg-yellow-400/10 border border-yellow-400/30">
              <p className="text-yellow-400 font-black">تۆ پلانی پڕۆت هەیە</p>
              <p className="text-slate-500 text-xs mt-1">پێویست نییە دووبارە بکڕیت</p>
            </div>
          ) : proOnPoints ? (
            <div className="w-full py-4 rounded-2xl text-center bg-orange-500/10 border border-orange-500/30">
              <p className="text-orange-400 font-black">تۆ پلانی پڕۆت هەیە</p>
              <p className="text-slate-500 text-xs mt-1">خاڵەکانت بێکۆتان — پێویست بە کڕینی خاڵ نییە</p>
            </div>
          ) : (
            <motion.button
              whileHover={canSubmit ? { scale: 1.03, boxShadow: '0 0 40px rgba(234,179,8,0.5)' } : {}}
              whileTap={canSubmit ? { scale: 0.97 } : {}}
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className="w-full py-4 rounded-2xl text-lg font-black text-slate-950 transition disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #eab308, #f97316)' }}
            >
              {loading ? '...' : 'کڕین'}
            </motion.button>
          )}

        </div>
      </div>
    </>
  )
}
