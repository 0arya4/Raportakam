import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.png.png'

function ContactMenu() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(o => !o)}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-500/20 border border-green-500/30 hover:bg-green-500/30 transition text-green-400"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 18v-6a9 9 0 0118 0v6M3 18a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5zm16 0a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5z" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="absolute top-10 left-1/2 -translate-x-1/2 z-50 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/40 overflow-hidden"
            >
              <div className="px-3 py-2.5 border-b border-slate-800">
                <p className="text-xs text-red-400 text-center leading-relaxed font-medium">
                  لەکاتی بوونی هەر کێشەیەکدا ڕاستەوخۆ پەیوەندیمان پێوە بکەن
                </p>
              </div>
              <div className="p-2">
                <motion.a
                  whileHover={{ x: -3 }}
                  href="https://wa.me/964700361252"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-green-500/10 transition group"
                >
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/30 transition">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">WhatsApp</p>
                    <p className="text-xs text-slate-500" dir="ltr">+964 700 361 252</p>
                  </div>
                </motion.a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profile, setProfile] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('full_name, plan, points').eq('id', user.id).single()
      .then(({ data }) => { if (data) setProfile(data) })
    supabase.from('generations').select('id, file_name, output_type, created_at, file_url')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => { if (data) setHistory(data) })
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-yellow-500/10"
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Right side: auth + contact */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg transition"
                >
                  <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-slate-950 text-xs font-bold">
                    {(profile?.full_name || user.email)?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-300 max-w-[120px] truncate">
                    {profile?.full_name || user.email}
                  </span>
                  <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute left-0 mt-2 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden"
                    >
                      {user?.email === 'aryagg036@gmail.com' && (
                      <Link to="/admin" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-purple-400 hover:bg-slate-800 transition border-b border-slate-800">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        بەکارهێنەران
                      </Link>
                    )}
                    <Link to="/create" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-yellow-400 hover:bg-slate-800 transition border-b border-slate-800">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        دروستکردنی نوێ
                      </Link>

                      {/* History */}
                      {history.length > 0 && (
                        <div className="border-b border-slate-800">
                          <p className="text-xs text-slate-600 px-4 py-1.5">فایلە کونەکان</p>
                          {history.slice(0, 3).map(h => (
                            <a
                              key={h.id}
                              href={h.file_url?.startsWith('/') ? `https://raportakam.onrender.com${h.file_url}` : h.file_url}
                              download
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800 transition"
                            >
                              <span className="text-xs">{h.output_type === 'pptx' ? '📊' : '📄'}</span>
                              <span className="text-xs text-slate-300 truncate max-w-[140px]">{h.file_name || 'بێ ناو'}</span>
                            </a>
                          ))}
                          <Link
                            to="/history"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center justify-center gap-1 px-4 py-2 text-xs text-yellow-400 hover:bg-slate-800 transition w-full"
                          >
                            پشاندانی هەموو ←
                          </Link>
                        </div>
                      )}

                      <button onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-slate-800 transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        چوونەدەرەوە
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <ContactMenu />
            </>
          ) : (
            <>
              <ContactMenu />
              <Link to="/login">
                <button className="text-sm px-4 py-1.5 rounded-lg border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 transition">
                  چوونەژوورەوە
                </button>
              </Link>
              <Link to="/pricing">
                <button className="text-sm px-4 py-1.5 rounded-lg bg-yellow-400 text-slate-950 font-semibold hover:bg-yellow-300 transition">
                  نرخەکان
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3">
          {user && profile && (
            profile.plan === 'pro' ? (
              <motion.span
                animate={{ textShadow: ['0 0 8px #f97316', '0 0 16px #f97316', '0 0 8px #f97316'] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-xs font-bold text-orange-400"
              >
                پلانی پڕۆ
              </motion.span>
            ) : (
              <span className="text-xs font-medium text-slate-400">
                پلانی خۆڕایی <span className="text-yellow-400 font-bold">{profile.points ?? 100}</span> خاڵ
              </span>
            )
          )}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">ڕاپۆرتەکەم</span>
            <motion.img whileHover={{ scale: 1.1, rotate: 5 }} src={logo} alt="ڕاپۆرتەکەم" className="w-16 h-16 object-contain" />
          </Link>
        </div>
      </div>
    </motion.nav>
  )
}
