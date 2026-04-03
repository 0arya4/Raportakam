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

const POINT_PACKAGES = [
  { points: 500 },
  { points: 1100 },
  { points: 2000 },
]

export default function Admin() {
  const { user } = useAuth()
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

  const handleAddPoints = async () => {
    const amount = parseInt(pointsInput)
    if (!amount || amount <= 0) return
    setAddingPoints(true)
    const delta = pointsMode === 'subtract' ? -amount : amount
    const res = await fetch(`https://raportakam.onrender.com/admin/add-points?secret=${ADMIN_SECRET}&user_id=${pointsModal.id}&points=${delta}`, { method: 'POST' })
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
        await fetch(`https://raportakam.onrender.com/admin/set-plan?secret=${ADMIN_SECRET}&user_id=${order.user_id}&plan=pro`, { method: 'POST' })
      } else {
        const pts = POINT_PACKAGES[order.package_index]?.points || 0
        await fetch(`https://raportakam.onrender.com/admin/add-points?secret=${ADMIN_SECRET}&user_id=${order.user_id}&points=${pts}`, { method: 'POST' })
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
    const res = await fetch(`https://raportakam.onrender.com/admin/set-plan?secret=${ADMIN_SECRET}&user_id=${u.id}&plan=${newPlan}`, { method: 'POST' })
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

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    const matchPlan = planFilter === 'all' || u.plan === planFilter
    return matchSearch && matchPlan
  })

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—'
  const formatTokens = (t) => t >= 1000 ? `${(t / 1000).toFixed(1)}k` : t
  const calcCost = (tokens) => `$${((tokens / 1_000_000) * 9).toFixed(4)}`

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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-2xl font-black text-white mb-1">پانێلی بەڕێوەبردن</h1>
            <p className="text-slate-500 text-sm">هەموو بەکارهێنەرەکان</p>
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
              { label: 'کۆی تێچوون', value: calcCost(stats.tokens), color: 'text-green-400', bg: 'bg-green-400/10' },
            ].map((s, i) => (
              <div key={i} className={`${s.bg} border border-slate-800 rounded-2xl p-5`}>
                <p className="text-slate-500 text-xs mb-1">{s.label}</p>
                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </motion.div>

          {/* Search & Filter */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex gap-3 mb-4">
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
                    <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">خاڵ</th>
                    <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">کاتی پرۆ</th>
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
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-500">هیچ ئەنجامێک نەدۆزرایەوە</td>
                    </tr>
                  ) : filteredUsers.map((u, i) => (
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
                      <td className="px-5 py-3.5">
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
