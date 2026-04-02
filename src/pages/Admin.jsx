import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const ADMIN_EMAIL = 'aryagg036@gmail.com'
const ADMIN_SECRET = 'raportakam-admin-2026'

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, pro: 0, tokens: 0 })

  useEffect(() => {
    if (!user) return
    if (user.email !== ADMIN_EMAIL) {
      navigate('/')
      return
    }
    fetch(`https://raportakam.onrender.com/admin/users?secret=${ADMIN_SECRET}`)
      .then(r => r.json())
      .then(data => {
        setUsers(data.users || [])
        const pro = (data.users || []).filter(u => u.plan === 'pro').length
        const tokens = (data.users || []).reduce((s, u) => s + u.tokens_used, 0)
        setStats({ total: data.total, pro, tokens })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user])

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—'
  const formatTokens = (t) => t >= 1000 ? `${(t / 1000).toFixed(1)}k` : t
  const calcCost = (tokens) => `$${((tokens / 1_000_000) * 9).toFixed(4)}`

  if (!user || user.email !== ADMIN_EMAIL) return null

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20 pb-16 px-6 bg-slate-950">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-2xl font-black text-white mb-1">پانێلی بەڕێوەبردن</h1>
            <p className="text-slate-500 text-sm">هەموو بەکارهێنەرەکان</p>
          </motion.div>

          {/* Stats cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-4 gap-4 mb-8"
          >
            {[
              { label: 'کۆی بەکارهێنەران', value: stats.total, color: 'text-white', bg: 'bg-slate-800' },
              { label: 'بەکارهێنەری پرۆ', value: stats.pro, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
              { label: 'کۆی تۆکێن', value: formatTokens(stats.tokens), color: 'text-purple-400', bg: 'bg-purple-400/10' },
              { label: 'کۆی تێچوون', value: calcCost(stats.tokens), color: 'text-green-400', bg: 'bg-green-400/10' },
            ].map((s, i) => (
              <div key={i} className={`${s.bg} border border-slate-800 rounded-2xl p-5`}>
                <p className="text-slate-500 text-xs mb-1">{s.label}</p>
                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </motion.div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">#</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">بەکارهێنەر</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">ئیمەیڵ</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">پلان</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">دروستکردن</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">تۆکێن</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">تێچوون</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">بەروار</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16">
                        <div className="w-8 h-8 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-500">هیچ بەکارهێنەرێک نییە</td>
                    </tr>
                  ) : users.map((u, i) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition"
                    >
                      <td className="px-5 py-3.5 text-slate-600 text-xs">{i + 1}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-yellow-400/20 rounded-full flex items-center justify-center text-yellow-400 text-xs font-bold flex-shrink-0">
                            {(u.full_name || u.email)?.[0]?.toUpperCase()}
                          </div>
                          <span className="text-white font-medium truncate max-w-[120px]">{u.full_name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs" dir="ltr">{u.email}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          u.plan === 'pro'
                            ? 'bg-yellow-400/20 text-yellow-400'
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                          {u.plan === 'pro' ? 'پرۆ' : 'بەخۆڕایی'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300 text-center">{u.generations_used}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-800 rounded-full h-1.5 max-w-[60px]">
                            <div
                              className="h-1.5 rounded-full bg-purple-400"
                              style={{ width: `${Math.min((u.tokens_used / (stats.tokens || 1)) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-purple-400 text-xs font-mono">{formatTokens(u.tokens_used)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-green-400 text-xs font-mono">{calcCost(u.tokens_used)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs" dir="ltr">{formatDate(u.created_at)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
