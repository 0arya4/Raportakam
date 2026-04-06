import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.png.png'

export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(form.email, form.password)
    setLoading(false)
    if (error) setError('ئیمەیڵ یان وشەی نهێنی هەڵەیە')
    else navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4" dir="rtl">

      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-yellow-400/5 rounded-full blur-3xl" style={{ animation: 'float 6s ease-in-out infinite' }} />
        <div className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-yellow-500/5 rounded-full blur-2xl" style={{ animation: 'float 8s ease-in-out infinite reverse' }} />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(#eab308 1px, transparent 1px), linear-gradient(90deg, #eab308 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-sm"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Link to="/" className="flex items-center justify-center gap-2 mb-6">
            <motion.img whileHover={{ rotate: 10, scale: 1.1 }} src={logo} alt="logo" className="w-8 h-8 object-contain" />
            <span className="text-lg font-bold text-white">ڕاپۆرتەکەم</span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-6"
        >
          <h1 className="text-xl font-bold text-white mb-0.5 text-center">بەخێربێیتەوە</h1>
          <p className="text-slate-500 text-xs text-center mb-5">چوونەژوورەوە بۆ ئەکاونتەکەت</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2.5 rounded-lg mb-4"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <label className="text-xs text-slate-400 block mb-1">ئیمەیڵ</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="name@email.com"
                dir="ltr"
                required
                className="w-full bg-slate-800/60 border border-slate-700 focus:border-yellow-500/50 outline-none text-white placeholder-slate-600 px-3 py-2.5 rounded-lg text-sm transition"
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
              <label className="text-xs text-slate-400 block mb-1">وشەی نهێنی</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                dir="ltr"
                required
                className="w-full bg-slate-800/60 border border-slate-700 focus:border-yellow-500/50 outline-none text-white placeholder-slate-600 px-3 py-2.5 rounded-lg text-sm transition"
              />
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 disabled:opacity-40 text-slate-950 font-bold py-2.5 rounded-lg text-sm hover:bg-yellow-300 transition mt-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full" />
                  چاوەڕێ بکە...
                </>
              ) : 'چوونەژوورەوە'}
            </motion.button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-slate-600 text-xs">یان</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <p className="text-center text-slate-500 text-xs">
            ئەکاونتت نییە؟{' '}
            <Link to="/register" className="text-yellow-400 hover:text-yellow-300 transition font-medium">
              تۆمارکردن
            </Link>
          </p>
        </motion.div>

        {/* Bottom hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-slate-600 text-xs mt-4"
        >
          بەخۆڕایی دەست پێبکە · کارتی کرێدیت پێویست نییە
        </motion.p>
      </motion.div>
    </div>
  )
}
