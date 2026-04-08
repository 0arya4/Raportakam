import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

export default function Profile() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({ total: 0, pptx: 0, word: 0 })
  const [loading, setLoading] = useState(true)

  // Password change
  const [pwOpen, setPwOpen] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState(null)

  // Name change
  const [nameEdit, setNameEdit] = useState(false)
  const [newName, setNewName] = useState('')
  const [nameLoading, setNameLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const [{ data: prof }, { data: gens }] = await Promise.all([
        supabase.from('profiles').select('*, plan_expires_at').eq('id', user.id).single(),
        supabase.from('generations').select('output_type').eq('user_id', user.id),
      ])
      setProfile(prof)
      setNewName(prof?.full_name || user.user_metadata?.full_name || '')
      if (gens) {
        setStats({
          total: gens.length,
          pptx: gens.filter(g => g.output_type === 'pptx').length,
          word: gens.filter(g => g.output_type === 'docx' || g.output_type === 'word').length,
        })
      }
      setLoading(false)
    }
    load()
  }, [user])

  const handleNameSave = async () => {
    if (!newName.trim()) return
    setNameLoading(true)
    await supabase.from('profiles').update({ full_name: newName.trim() }).eq('id', user.id)
    await supabase.auth.updateUser({ data: { full_name: newName.trim() } })
    setProfile(p => ({ ...p, full_name: newName.trim() }))
    setNameEdit(false)
    setNameLoading(false)
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPwMsg(null)
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ type: 'error', text: 'وشەی نهێنی نوێ یەکسان نییە' })
      return
    }
    if (pwForm.next.length < 6) {
      setPwMsg({ type: 'error', text: 'وشەی نهێنی دەبێت لانیکەم ٦ پیت بێت' })
      return
    }
    setPwLoading(true)
    const { error } = await supabase.auth.updateUser({ password: pwForm.next })
    if (error) {
      setPwMsg({ type: 'error', text: error.message })
    } else {
      setPwMsg({ type: 'success', text: 'وشەی نهێنی بە سەرکەوتوویی گۆڕدرا' })
      setPwForm({ current: '', next: '', confirm: '' })
    }
    setPwLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (!user) { navigate('/login'); return null }

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0]
  const plan = profile?.plan || 'free'
  const points = profile?.points ?? 0
  const joinDate = new Date(user.created_at).toLocaleDateString('en-GB')

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 pb-20 px-6">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Header card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-slate-950 flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #eab308, #f97316)' }}>
                {displayName?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 text-right">
                {nameEdit ? (
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => setNameEdit(false)} className="text-slate-500 text-sm hover:text-slate-300 transition">پاشگەزبوونەوە</button>
                    <button onClick={handleNameSave} disabled={nameLoading}
                      className="text-xs font-bold px-4 py-1.5 rounded-xl text-slate-950"
                      style={{ background: 'linear-gradient(135deg,#eab308,#f97316)' }}>
                      {nameLoading ? '...' : 'پاشەکەوتکردن'}
                    </button>
                    <input value={newName} onChange={e => setNewName(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-1.5 text-white text-sm text-right focus:outline-none focus:border-yellow-500 w-48" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => setNameEdit(true)} className="text-yellow-400 text-xs hover:text-yellow-300 transition">گۆڕانکاری</button>
                    <h1 className="text-xl font-black">{displayName}</h1>
                  </div>
                )}
                <p className="text-slate-500 text-sm mt-1">{user.email}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border flex-shrink-0 ${plan === 'pro' ? 'bg-yellow-400/10 border-yellow-500/30 text-yellow-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                {plan === 'pro' ? '👑 پڕۆ' : 'خۆڕایی'}
              </span>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'کۆی فایلەکان', val: loading ? '...' : stats.total, icon: '📁' },
              { label: 'PPTX', val: loading ? '...' : stats.pptx, icon: '📊' },
              { label: 'Word', val: loading ? '...' : stats.word, icon: '📝' },
              { label: 'خاڵ', val: loading ? '...' : points, icon: '⚡', isPoints: true },
            ].map((s, i) => (
              <div key={i} className={`bg-slate-900 border rounded-2xl p-5 text-center relative overflow-hidden ${s.isPoints && plan === 'pro' ? 'border-orange-500/30' : 'border-slate-800'}`}>
                {s.isPoints && plan === 'pro' && (
                  <>
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: 'radial-gradient(ellipse at bottom, #f97316 0%, transparent 70%)' }} />
                    <motion.div animate={{ opacity: [0.15, 0.35, 0.15] }} transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at bottom, #f97316 0%, transparent 60%)' }} />
                  </>
                )}
                <div className="text-2xl mb-1 relative z-10">{s.isPoints && plan === 'pro' ? '🔥' : s.icon}</div>
                {s.isPoints && plan === 'pro' ? (
                  <motion.div animate={{ textShadow: ['0 0 8px #f97316', '0 0 20px #f97316', '0 0 8px #f97316'] }} transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-xl font-black relative z-10" style={{ color: '#f97316' }}>
                    بێسنوور
                  </motion.div>
                ) : (
                  <div className="text-2xl font-black text-white relative z-10">{s.val}</div>
                )}
                <div className="text-xs text-slate-500 mt-1 relative z-10">{s.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Account info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-lg font-black mb-5 text-right">زانیاری ئەکاونت</h2>
            <div className="space-y-3">
              {[
                { label: 'ئیمەیل', val: user.email },
                { label: 'بەرواری تۆمارکردن', val: joinDate },
                { label: 'پلان', val: plan === 'pro'
                    ? <span className="flex items-center gap-2 justify-end">
                        <span className="font-black" style={{ color: '#eab308', textShadow: '0 0 12px rgba(234,179,8,0.7)' }}>👑 پڕۆ</span>
                        {profile?.plan_expires_at && <span className="text-slate-400 text-xs">بەسەردەچێت لە {new Date(profile.plan_expires_at).toLocaleDateString('en-GB')}</span>}
                      </span>
                    : 'خۆڕایی' },
                { label: 'خاڵی ماوە', val: (() => {
                    if (plan !== 'free' || points >= 100) return `${points} خاڵ`
                    const now = new Date()
                    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
                    const resetStr = resetDate.toLocaleDateString('en-GB')
                    const toReceive = 100 - points
                    return (
                      <span className="flex items-center gap-3">
                        <span>{points} خاڵ</span>
                        <span className="text-xs text-yellow-400/80">{toReceive} خاڵ وەردەگریت لە {resetStr}</span>
                      </span>
                    )
                  })() },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                  <span className="text-white font-medium text-sm">{row.val}</span>
                  <span className="text-slate-500 text-sm">{row.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Password change */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <button onClick={() => { setPwOpen(o => !o); setPwMsg(null) }}
              className="w-full flex items-center justify-between">
              <span className="text-yellow-400 text-sm">{pwOpen ? '▲' : '▼'}</span>
              <h2 className="text-lg font-black">گۆڕینی وشەی نهێنی</h2>
            </button>
            {!pwOpen ? null : <form onSubmit={handlePasswordChange} className="space-y-4 mt-5">
              {[
                { key: 'next', label: 'وشەی نهێنی نوێ', placeholder: '••••••••' },
                { key: 'confirm', label: 'دووبارەکردنەوەی وشەی نهێنی نوێ', placeholder: '••••••••' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-slate-400 text-xs mb-1.5 text-right">{f.label}</label>
                  <input
                    type="password"
                    placeholder={f.placeholder}
                    value={pwForm[f.key]}
                    onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm text-right focus:outline-none focus:border-yellow-500 transition"
                  />
                </div>
              ))}

              {pwMsg && (
                <p className={`text-sm text-right ${pwMsg.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                  {pwMsg.text}
                </p>
              )}

              <button type="submit" disabled={pwLoading}
                className="w-full py-3 rounded-2xl font-black text-slate-950 transition"
                style={{ background: 'linear-gradient(135deg,#eab308,#f97316)' }}>
                {pwLoading ? 'چاوەڕوانبە...' : 'گۆڕینی وشەی نهێنی'}
              </button>
            </form>}
          </motion.div>

          {/* Actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="grid grid-cols-2 gap-4">
            <button onClick={() => navigate('/history')}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 text-center transition">
              <div className="text-2xl mb-1">📂</div>
              <div className="text-sm font-bold">مێژووی فایلەکان</div>
            </button>
            <button onClick={() => navigate('/pricing')}
              className="bg-slate-900 border border-slate-800 hover:border-yellow-500/30 rounded-2xl p-4 text-center transition">
              <div className="text-2xl mb-1">👑</div>
              <div className="text-sm font-bold text-yellow-400">بوون بە پڕۆ</div>
            </button>
          </motion.div>

          {/* Sign out */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <button onClick={handleSignOut}
              className="w-full py-4 rounded-2xl border border-red-500/20 text-red-400 hover:bg-red-500/5 transition font-semibold text-sm">
              چوونەدەرەوە
            </button>
          </motion.div>

        </div>
      </div>
    </>
  )
}
