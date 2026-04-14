import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const ADMIN_EMAIL = 'aryagg036@gmail.com'
const ADMIN_SECRET = 'raportakam-admin-2026'
const API_URL = import.meta.env.VITE_API_URL ?? ''

const POINT_PACKAGES = [
  { points: 500 },
  { points: 1100 },
  { points: 2000 },
]

export default function Admin() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, pro: 0, tokens: 0 })
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [updating, setUpdating] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [pointsModal, setPointsModal] = useState(null)
  const [pointsMode, setPointsMode] = useState('add')
  const [pointsInput, setPointsInput] = useState('')
  const [addingPoints, setAddingPoints] = useState(false)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [confirmingOrder, setConfirmingOrder] = useState(null)
  const [removingOrder, setRemovingOrder] = useState(null)
  const [orderStatus, setOrderStatus] = useState('all')
  const [orderType, setOrderType] = useState('all')
  const [orderMethod, setOrderMethod] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [userSortBy, setUserSortBy] = useState('tokens')
  const [userJoinFrom, setUserJoinFrom] = useState('')
  const [userJoinTo, setUserJoinTo] = useState('')
  const [minGenerations, setMinGenerations] = useState('')
  const [idFilter, setIdFilter] = useState('')
  const [profileModal, setProfileModal] = useState(null)
  const [profileOrders, setProfileOrders] = useState([])
  const [profileOrdersLoading, setProfileOrdersLoading] = useState(false)

  const openProfile = async (u) => {
    setProfileModal(u)
    setProfileOrders([])
    setProfileOrdersLoading(true)
    const { data } = await supabase.from('orders').select('*').eq('user_id', u.id).order('created_at', { ascending: false })
    setProfileOrders(data || [])
    setProfileOrdersLoading(false)
  }

  const handleAddPoints = async () => {
    const amount = parseInt(pointsInput)
    if (!amount || amount <= 0) return
    setAddingPoints(true)
    const delta = pointsMode === 'subtract' ? -amount : amount
    const res = await fetch(`${API_URL}/admin/add-points?secret=${ADMIN_SECRET}&user_id=${pointsModal.id}&points=${delta}`, { method: 'POST' })
    const data = await res.json()
    setUsers(prev => prev.map(x => x.id === pointsModal.id ? { ...x, points: data.points } : x))
    setPointsModal(null)
    setPointsInput('')
    setAddingPoints(false)
  }

  const fetchOrders = async () => {
    setOrdersLoading(true)
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    setOrders(data || [])
    setOrdersLoading(false)
  }

  const confirmOrder = async (order) => {
    setConfirmingOrder(order.id)
    try {
      if (order.order_type === 'pro') {
        await fetch(`${API_URL}/admin/set-plan?secret=${ADMIN_SECRET}&user_id=${order.user_id}&plan=pro`, { method: 'POST' })
      } else {
        const pts = POINT_PACKAGES[order.package_index]?.points || 0
        await fetch(`${API_URL}/admin/add-points?secret=${ADMIN_SECRET}&user_id=${order.user_id}&points=${pts}`, { method: 'POST' })
      }
      await supabase.from('orders').update({ status: 'confirmed' }).eq('id', order.id)
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'confirmed' } : o))
    } catch (_) {}
    setConfirmingOrder(null)
  }

  const removeOrder = async (id) => {
    if (!window.confirm('دڵنیای کە ئەم داواکارییە سڕینەوە؟')) return
    setRemovingOrder(id)
    await supabase.from('orders').delete().eq('id', id)
    setOrders(prev => prev.filter(o => o.id !== id))
    setRemovingOrder(null)
  }

  const filteredOrders = useMemo(() => orders.filter(o => {
    if (orderStatus !== 'all' && o.status !== orderStatus) return false
    if (orderType !== 'all' && o.order_type !== orderType) return false
    if (orderMethod !== 'all' && o.payment_method !== orderMethod) return false
    if (dateFrom && new Date(o.created_at) < new Date(dateFrom)) return false
    if (dateTo && new Date(o.created_at) > new Date(dateTo + 'T23:59:59')) return false
    return true
  }), [orders, orderStatus, orderType, orderMethod, dateFrom, dateTo])

  const totalAmount = useMemo(() =>
    filteredOrders.reduce((sum, o) => sum + (parseInt(o.amount) || 0), 0)
  , [filteredOrders])

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text('Raportakam - Orders', 14, 16)
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22)
    doc.text(`Total Amount: ${totalAmount.toLocaleString()} IQD`, 14, 28)
    autoTable(doc, {
      startY: 34,
      head: [['#', 'Type', 'Method', 'Phone', 'Amount', 'Status', 'Date']],
      body: [
        ...filteredOrders.map((o, i) => [
          i + 1,
          o.order_type === 'pro' ? 'Pro Plan' : `${POINT_PACKAGES[o.package_index]?.points} Points`,
          o.payment_method?.toUpperCase(),
          o.sender_phone,
          `${o.amount} IQD`,
          o.status,
          new Date(o.created_at).toLocaleDateString(),
        ]),
        ['', '', '', 'Total', `${totalAmount.toLocaleString()} IQD`, '', ''],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [234, 179, 8], textColor: 0 },
      bodyStyles: {},
      didParseCell: (data) => {
        if (data.row.index === filteredOrders.length) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [234, 179, 8]
          data.cell.styles.textColor = 0
        }
      },
    })
    doc.save(`orders-${new Date().toISOString().slice(0,10)}.pdf`)
  }

  const togglePlan = (u) => {
    setConfirm(u)
  }

  const confirmToggle = async () => {
    const u = confirm
    setConfirm(null)
    const newPlan = u.plan === 'pro' ? 'free' : 'pro'
    setUpdating(u.id)
    const res = await fetch(`${API_URL}/admin/set-plan?secret=${ADMIN_SECRET}&user_id=${u.id}&plan=${newPlan}`, { method: 'POST' })
    const data = await res.json()
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, plan: newPlan, plan_expires_at: data.plan_expires_at } : x))
    setUpdating(null)
  }

  const formatExpiry = (d) => {
    if (!d) return '—'
    const date = new Date(d)
    const diff = Math.ceil((date - Date.now()) / (1000 * 60 * 60 * 24))
    return `${date.toLocaleDateString('en-GB')} (${diff}ڕۆژ)`
  }

  useEffect(() => {
    if (tab === 'orders') fetchOrders()
  }, [tab])

  const fetchUsers = (retries = 2) => {
    setLoading(true)
    fetch(`${API_URL}/admin/users?secret=${ADMIN_SECRET}`)
      .then(r => r.json())
      .then(data => {
        setUsers(data.users || [])
        const pro = (data.users || []).filter(u => u.plan === 'pro').length
        const tokens = (data.users || []).reduce((s, u) => s + u.tokens_used, 0)
        const cost = (data.users || []).reduce((s, u) => s + (u.cost_usd || 0), 0)
        setStats({ total: data.total, pro, tokens, cost })
        setLoading(false)
      })
      .catch(() => {
        if (retries > 0) {
          setTimeout(() => fetchUsers(retries - 1), 3000)
        } else {
          setLoading(false)
        }
      })
  }

  useEffect(() => {
    if (!user) return
    if (user.email !== ADMIN_EMAIL) { navigate('/'); return }
    fetchUsers()
  }, [user])

  const filteredUsers = useMemo(() => {
    let result = users.filter(u => {
      const q = search.toLowerCase()
      const matchSearch = !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      const matchPlan = planFilter === 'all' || u.plan === planFilter
      const matchJoinFrom = !userJoinFrom || new Date(u.created_at) >= new Date(userJoinFrom)
      const matchJoinTo = !userJoinTo || new Date(u.created_at) <= new Date(userJoinTo + 'T23:59:59')
      const matchMinGen = !minGenerations || (u.generations_used || 0) >= parseInt(minGenerations)
      const matchId = !idFilter || String(u.user_number) === idFilter.trim()
      return matchSearch && matchPlan && matchJoinFrom && matchJoinTo && matchMinGen && matchId
    })
    result = [...result].sort((a, b) => {
      if (userSortBy === 'tokens') return (b.tokens_used || 0) - (a.tokens_used || 0)
      if (userSortBy === 'generations') return (b.generations_used || 0) - (a.generations_used || 0)
      if (userSortBy === 'points') return (b.points ?? 100) - (a.points ?? 100)
      if (userSortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at)
      if (userSortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at)
      return 0
    })
    return result
  }, [users, search, planFilter, userSortBy, userJoinFrom, userJoinTo, minGenerations, idFilter])

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—'
  const formatTokens = (t) => t >= 1000 ? `${(t / 1000).toFixed(1)}k` : t
  const calcCost = (tokens, costUsd) => costUsd != null ? `$${Number(costUsd).toFixed(4)}` : `$${((tokens / 1_000_000) * 9).toFixed(4)}`

  if (authLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
    </div>
  )
  if (!user || user.email !== ADMIN_EMAIL) return null

  return (
    <>
      <Navbar />
      {pointsModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-80 text-center">
            <p className="text-white font-bold mb-1">{pointsMode === 'add' ? 'زیادکردنی خاڵ' : 'کەمکردنەوەی خاڵ'}</p>
            <p className="text-slate-400 text-sm mb-4">{pointsModal.full_name || pointsModal.email}</p>
            <p className="text-yellow-400 text-sm mb-3">خاڵی ئێستا: {pointsModal.points ?? 100}</p>
            <input
              type="number" min={1}
              value={pointsInput}
              onChange={e => setPointsInput(e.target.value)}
              placeholder={pointsMode === 'add' ? 'چەند خاڵ زیاد بکەیت؟' : 'چەند خاڵ کەم بکەیت؟'}
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 outline-none mb-4 text-center"
            />
            <div className="flex gap-3">
              <button onClick={() => { setPointsModal(null); setPointsInput('') }} className="flex-1 bg-slate-800 text-white rounded-xl py-2 text-sm hover:bg-slate-700 transition">داخستن</button>
              <button onClick={handleAddPoints} disabled={addingPoints}
                className={`flex-1 rounded-xl py-2 text-sm font-bold transition ${pointsMode === 'add' ? 'bg-yellow-400 hover:bg-yellow-300 text-black' : 'bg-red-500 hover:bg-red-400 text-white'}`}>
                {addingPoints ? '...' : pointsMode === 'add' ? 'زیادکردن' : 'کەمکردنەوە'}
              </button>
            </div>
          </div>
        </div>
      )}
      {profileModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setProfileModal(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-yellow-400/20 rounded-full flex items-center justify-center text-yellow-400 text-2xl font-black">
                  {(profileModal.full_name || profileModal.email)?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-lg font-bold">{profileModal.full_name || '—'}</p>
                  <p className="text-slate-400 text-sm" dir="ltr">{profileModal.email}</p>
                  <p className="text-slate-600 text-xs font-mono" dir="ltr">#{profileModal.user_number} · {profileModal.id}</p>
                </div>
              </div>
              <button onClick={() => setProfileModal(null)} className="text-slate-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 transition text-lg">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Plan + dates */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-slate-500 text-xs mb-1">پلان</p>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${profileModal.plan === 'pro' ? 'bg-yellow-400/20 text-yellow-400' : 'bg-slate-700 text-slate-300'}`}>
                    {profileModal.plan === 'pro' ? 'پرۆ' : 'بەخۆڕایی'}
                  </span>
                </div>
                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-slate-500 text-xs mb-1">بەرواری خۆتۆمارکردن</p>
                  <p className="text-white text-sm font-mono" dir="ltr">{formatDate(profileModal.created_at)}</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-slate-500 text-xs mb-1">کاتی پرۆ</p>
                  <p className="text-sm" dir="ltr">
                    {profileModal.plan === 'pro' && profileModal.plan_expires_at
                      ? <span className="text-yellow-400 font-mono">{formatExpiry(profileModal.plan_expires_at)}</span>
                      : <span className="text-slate-600">—</span>}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-5 gap-3">
                {[
                  { label: 'دروستکردن', value: profileModal.generations_used || 0, color: 'text-blue-400' },
                  { label: 'Ai detect', value: profileModal.ai_detect_used || 0, color: 'text-red-400' },
                  { label: 'تۆکێن', value: formatTokens(profileModal.tokens_used || 0), color: 'text-purple-400' },
                  { label: 'تێچوون', value: calcCost(profileModal.tokens_used || 0, profileModal.cost_usd), color: 'text-green-400' },
                  { label: 'خاڵ', value: profileModal.points ?? 100, color: 'text-yellow-400' },
                ].map((s, i) => (
                  <div key={i} className="bg-slate-800 rounded-xl p-4 text-center">
                    <p className="text-slate-500 text-xs mb-1">{s.label}</p>
                    <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Token usage bar */}
              {stats.tokens > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>بەکارهێنانی تۆکێن لە کۆی گشتی</span>
                    <span dir="ltr">{((profileModal.tokens_used / stats.tokens) * 100).toFixed(2)}%</span>
                  </div>
                  <div className="bg-slate-800 rounded-full h-2">
                    <div className="h-2 rounded-full bg-purple-400 transition-all"
                      style={{ width: `${Math.min((profileModal.tokens_used / stats.tokens) * 100, 100)}%` }} />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => { togglePlan(profileModal); setProfileModal(null) }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
                    profileModal.plan === 'pro'
                      ? 'bg-slate-700 hover:bg-slate-600 text-white'
                      : 'bg-yellow-400 hover:bg-yellow-300 text-black'
                  }`}
                >
                  {profileModal.plan === 'pro' ? 'گەڕاندنەوەی بەخۆڕایی' : 'کردنی پرۆ'}
                </button>
                <button
                  onClick={() => { setPointsModal(profileModal); setPointsMode('add'); setPointsInput(''); setProfileModal(null) }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 transition"
                >
                  + خاڵ زیادکردن
                </button>
                <button
                  onClick={() => { setPointsModal(profileModal); setPointsMode('subtract'); setPointsInput(''); setProfileModal(null) }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition"
                >
                  − خاڵ کەمکردن
                </button>
              </div>

              {/* Order history */}
              <div>
                <p className="text-white font-bold text-sm mb-3">مێژووی داواکارییەکان</p>
                {profileOrdersLoading ? (
                  <div className="text-center py-6">
                    <div className="w-6 h-6 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin mx-auto" />
                  </div>
                ) : profileOrders.length === 0 ? (
                  <p className="text-slate-600 text-sm text-center py-6">هیچ داواکارییەک نییە</p>
                ) : (
                  <div className="bg-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-right text-slate-500 font-medium px-4 py-2.5">داواکاری</th>
                          <th className="text-right text-slate-500 font-medium px-4 py-2.5">ڕێگا</th>
                          <th className="text-right text-slate-500 font-medium px-4 py-2.5">بڕ</th>
                          <th className="text-right text-slate-500 font-medium px-4 py-2.5">بارودۆخ</th>
                          <th className="text-right text-slate-500 font-medium px-4 py-2.5">بەروار</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profileOrders.map(o => (
                          <tr key={o.id} className="border-b border-slate-700/50">
                            <td className="px-4 py-2.5">
                              {o.order_type === 'pro'
                                ? <span className="text-yellow-400 font-bold">پلانی پرۆ</span>
                                : <span className="text-blue-400 font-bold">{POINT_PACKAGES[o.package_index]?.points} خاڵ</span>}
                            </td>
                            <td className="px-4 py-2.5 text-slate-300">{o.payment_method?.toUpperCase()}</td>
                            <td className="px-4 py-2.5 text-green-400 font-mono">{o.amount} د.ع</td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-0.5 rounded-full font-bold ${o.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-400/20 text-yellow-400'}`}>
                                {o.status === 'confirmed' ? 'دڵنیاکراوە' : 'چاوەڕێ'}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-500 font-mono" dir="ltr">{new Date(o.created_at).toLocaleDateString('en-GB')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {confirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-80 text-center">
            <p className="text-white font-bold mb-1">دڵنیای؟</p>
            <p className="text-slate-400 text-sm mb-4">
              {confirm.plan === 'pro'
                ? `${confirm.full_name || confirm.email} دەگەڕێتەوە بۆ بەخۆڕایی`
                : `${confirm.full_name || confirm.email} دەبێتە پرۆ بۆ ماوەی ١ مانگ`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 bg-slate-800 text-white rounded-xl py-2 text-sm hover:bg-slate-700 transition">نەخێر</button>
              <button onClick={confirmToggle} className="flex-1 bg-yellow-400 text-black rounded-xl py-2 text-sm font-bold hover:bg-yellow-300 transition">بەڵێ</button>
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen pt-20 pb-16 px-6 bg-slate-950">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-white mb-1">پانێلی بەڕێوەبردن</h1>
              <p className="text-slate-500 text-sm">هەموو بەکارهێنەرەکان</p>
            </div>
            <button onClick={fetchUsers} disabled={loading}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-bold px-4 py-2 rounded-xl transition disabled:opacity-40">
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              نوێکردنەوە
            </button>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            {[
              { id: 'users', label: 'بەکارهێنەران' },
              { id: 'orders', label: 'داواکارییەکان', badge: orders.filter(o => o.status === 'pending').length },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition ${
                  tab === t.id ? 'bg-yellow-400 text-slate-950' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}>
                {t.label}
                {t.badge > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${tab === t.id ? 'bg-slate-950 text-yellow-400' : 'bg-red-500 text-white'}`}>
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {tab === 'users' && <>
          {/* Stats cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-4 gap-4 mb-8"
          >
            {[
              { label: 'کۆی بەکارهێنەران', value: stats.total, color: 'text-white', bg: 'bg-slate-800' },
              { label: 'بەکارهێنەری پرۆ', value: stats.pro, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
              { label: 'کۆی تۆکێن', value: formatTokens(stats.tokens), color: 'text-purple-400', bg: 'bg-purple-400/10' },
              { label: 'کۆی تێچوون', value: calcCost(stats.tokens, stats.cost), color: 'text-green-400', bg: 'bg-green-400/10' },
            ].map((s, i) => (
              <div key={i} className={`${s.bg} border border-slate-800 rounded-2xl p-5`}>
                <p className="text-slate-500 text-xs mb-1">{s.label}</p>
                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </motion.div>

          {/* Search & Filter */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-col gap-3 mb-4">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="گەڕان بە ناو یان ئیمەیڵ..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 placeholder-slate-600"
              />
              <select
                value={planFilter}
                onChange={e => setPlanFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-500"
              >
                <option value="all">هەموو پلانەکان</option>
                <option value="free">بەخۆڕایی</option>
                <option value="pro">پرۆ</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-3">
              <input
                type="number"
                placeholder="گەڕان بە ID..."
                value={idFilter}
                onChange={e => setIdFilter(e.target.value)}
                min={1}
                className="w-36 bg-slate-900 border border-slate-800 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-yellow-500 placeholder-slate-600"
              />
              <select
                value={userSortBy}
                onChange={e => setUserSortBy(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-yellow-500"
              >
                <option value="tokens">ریزکردن: تۆکێن</option>
                <option value="generations">ریزکردن: دروستکردن</option>
                <option value="points">ریزکردن: خاڵ</option>
                <option value="newest">ریزکردن: نوێترین</option>
                <option value="oldest">ریزکردن: کۆنترین</option>
              </select>
              <input
                type="number"
                placeholder="کەمترین دروستکردن..."
                value={minGenerations}
                onChange={e => setMinGenerations(e.target.value)}
                min={0}
                className="w-44 bg-slate-900 border border-slate-800 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-yellow-500 placeholder-slate-600"
              />
              <input type="date" value={userJoinFrom} onChange={e => setUserJoinFrom(e.target.value)}
                title="بەرواری پەیوەندیکردن لە"
                className="bg-slate-900 border border-slate-800 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-yellow-500" />
              <input type="date" value={userJoinTo} onChange={e => setUserJoinTo(e.target.value)}
                title="بەرواری پەیوەندیکردن بۆ"
                className="bg-slate-900 border border-slate-800 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-yellow-500" />
              {(userSortBy !== 'tokens' || userJoinFrom || userJoinTo || minGenerations || idFilter) && (
                <button
                  onClick={() => { setUserSortBy('tokens'); setUserJoinFrom(''); setUserJoinTo(''); setMinGenerations(''); setIdFilter('') }}
                  className="text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2.5 rounded-xl transition"
                >
                  ڕیست
                </button>
              )}
              <span className="text-slate-500 text-xs self-center mr-auto">{filteredUsers.length} بەکارهێنەر</span>
            </div>
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
                    <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">ID</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">بەکارهێنەر</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">ئیمەیڵ</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">پلان</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">دروستکردن</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">Ai detect</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">تۆکێن</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">تێچوون</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">خاڵ</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">کاتی پرۆ</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">بەروار</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="text-center py-16">
                        <div className="w-8 h-8 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-16 text-slate-500">هیچ بەکارهێنەرێک نییە</td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-16 text-slate-500">هیچ ئەنجامێک نەدۆزرایەوە</td>
                    </tr>
                  ) : filteredUsers.map((u, i) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => openProfile(u)}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition cursor-pointer"
                    >
                      <td className="px-5 py-3.5 text-slate-600 text-xs">{u.user_number}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-yellow-400/20 rounded-full flex items-center justify-center text-yellow-400 text-xs font-bold flex-shrink-0">
                            {(u.full_name || u.email)?.[0]?.toUpperCase()}
                          </div>
                          <span className="text-white font-medium truncate max-w-[120px]">{u.full_name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs" dir="ltr">{u.email}</td>
                      <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => togglePlan(u)}
                          disabled={updating === u.id}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium transition hover:opacity-80 ${
                            u.plan === 'pro'
                              ? 'bg-yellow-400/20 text-yellow-400'
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {updating === u.id ? '...' : u.plan === 'pro' ? 'پرۆ' : 'بەخۆڕایی'}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300 text-center">{u.generations_used}</td>
                      <td className="px-5 py-3.5 text-red-400 text-center font-medium">{u.ai_detect_used}</td>
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
                        <span className="text-green-400 text-xs font-mono">{calcCost(u.tokens_used, u.cost_usd)}</span>
                      </td>
                      <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-yellow-400 text-xs font-bold">{u.points ?? 100}</span>
                          <button onClick={() => { setPointsModal(u); setPointsMode('add'); setPointsInput('') }} className="w-5 h-5 bg-yellow-400/20 hover:bg-yellow-400/40 text-yellow-400 rounded-full text-xs font-bold transition flex items-center justify-center">+</button>
                          <button onClick={() => { setPointsModal(u); setPointsMode('subtract'); setPointsInput('') }} className="w-5 h-5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-full text-xs font-bold transition flex items-center justify-center">−</button>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs" dir="ltr">
                        {u.plan === 'pro' && u.plan_expires_at
                          ? <span className="text-yellow-400">{formatExpiry(u.plan_expires_at)}</span>
                          : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs" dir="ltr">{formatDate(u.created_at)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
          </>}

          {tab === 'orders' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-4">
                <select value={orderStatus} onChange={e => setOrderStatus(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-yellow-500">
                  <option value="all">هەموو بارودۆخەکان</option>
                  <option value="pending">چاوەڕێ</option>
                  <option value="confirmed">دڵنیاکراوە</option>
                </select>
                <select value={orderType} onChange={e => setOrderType(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-yellow-500">
                  <option value="all">هەموو جۆرەکان</option>
                  <option value="pro">پلانی پرۆ</option>
                  <option value="points">خاڵ</option>
                </select>
                <select value={orderMethod} onChange={e => setOrderMethod(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-yellow-500">
                  <option value="all">هەموو ڕێگاکان</option>
                  <option value="fib">FIB</option>
                  <option value="fastpay">FastPay</option>
                  <option value="qicard">Qi Card</option>
                </select>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-yellow-500" />
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-yellow-500" />
                <button onClick={exportPDF}
                  className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 text-sm font-bold px-4 py-2.5 rounded-xl transition mr-auto">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  PDF دابەزاندن
                </button>
              </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">#</th>
                      <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">بەکارهێنەر</th>
                      <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">داواکاری</th>
                      <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">ڕێگای پارەدان</th>
                      <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">ژمارە</th>
                      <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">بڕی پارە</th>
                      <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">بارودۆخ</th>
                      <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">بەروار</th>
                      <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">کردار</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersLoading ? (
                      <tr><td colSpan={7} className="text-center py-16">
                        <div className="w-8 h-8 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin mx-auto" />
                      </td></tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-16 text-slate-500">هیچ داواکارییەک نییە</td></tr>
                    ) : filteredOrders.map((o, i) => (
                      <tr key={o.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                        <td className="px-5 py-3.5 text-slate-600 text-xs">{i + 1}</td>
                        <td className="px-5 py-3.5">
                          {(() => { const u = users.find(u => u.id === o.user_id); return u ? (
                            <div>
                              <p className="text-white text-xs font-medium">{u.full_name || '—'}</p>
                              <p className="text-slate-500 text-xs" dir="ltr">{u.email}</p>
                            </div>
                          ) : <span className="text-slate-600 text-xs">—</span> })()}
                        </td>
                        <td className="px-5 py-3.5">
                          {o.order_type === 'pro'
                            ? <span className="text-yellow-400 font-bold text-xs">پلانی پرۆ</span>
                            : <span className="text-blue-400 font-bold text-xs">{POINT_PACKAGES[o.package_index]?.points} خاڵ</span>}
                        </td>
                        <td className="px-5 py-3.5 text-slate-300 text-xs">{o.payment_method?.toUpperCase()}</td>
                        <td className="px-5 py-3.5 text-slate-300 text-xs" dir="ltr">{o.sender_phone}</td>
                        <td className="px-5 py-3.5 text-green-400 text-xs font-mono">{o.amount} د.ع</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                            o.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-400/20 text-yellow-400'
                          }`}>
                            {o.status === 'confirmed' ? 'دڵنیاکراوە' : 'چاوەڕێ'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 text-xs" dir="ltr">{new Date(o.created_at).toLocaleDateString('en-GB')}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            {o.status === 'pending' && (
                              <button onClick={() => confirmOrder(o)} disabled={confirmingOrder === o.id}
                                className="text-xs px-3 py-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg font-bold transition">
                                {confirmingOrder === o.id ? '...' : 'دڵنیاکردن'}
                              </button>
                            )}
                            <button onClick={() => removeOrder(o.id)} disabled={removingOrder === o.id}
                              className="text-xs px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg font-bold transition">
                              {removingOrder === o.id ? '...' : 'سڕینەوە'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredOrders.length > 0 && (
                      <tr className="border-t-2 border-yellow-400/30 bg-yellow-400/5">
                        <td colSpan={4} className="px-5 py-3 text-right text-yellow-400 font-black text-sm">کۆی گشتی</td>
                        <td className="px-5 py-3 text-yellow-400 font-black text-sm font-mono">{totalAmount.toLocaleString()} د.ع</td>
                        <td colSpan={3} />
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            </motion.div>
          )}

        </div>
      </div>
    </>
  )
}
