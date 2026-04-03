import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const POINT_PACKAGES = [
  { points: 500 },
  { points: 1100 },
  { points: 2000 },
]

const SEEN_KEY = 'raportakam_seen_orders'

function getSeenIds() {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]') } catch { return [] }
}
function markSeen(id) {
  const seen = getSeenIds()
  if (!seen.includes(id)) localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, id]))
}

export default function OrderNotification() {
  const { user } = useAuth()
  const [popup, setPopup] = useState(null)

  const showOrder = (order) => {
    if (getSeenIds().includes(order.id)) return
    markSeen(order.id)
    setPopup(order)
  }

  // On load: check for any confirmed orders not yet shown
  useEffect(() => {
    if (!user) return
    supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'confirmed')
      .then(({ data }) => {
        if (!data) return
        const unseen = data.filter(o => !getSeenIds().includes(o.id))
        if (unseen.length > 0) showOrder(unseen[0])
      })
  }, [user])

  // Realtime: listen for updates on this user's orders
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`orders-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.new?.status === 'confirmed') showOrder(payload.new)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  if (!popup) return null

  const isPro = popup.order_type === 'pro'
  const points = POINT_PACKAGES[popup.package_index]?.points

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => setPopup(null)}
        />

        {/* Popup */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          className="relative z-10 bg-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl"
        >
          {/* Glow ring */}
          <motion.div
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`absolute inset-0 rounded-3xl pointer-events-none ${
              isPro
                ? 'shadow-[0_0_60px_rgba(234,179,8,0.35)]'
                : 'shadow-[0_0_60px_rgba(59,130,246,0.35)]'
            }`}
          />

          {/* Emoji */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-6xl mb-4"
          >
            {isPro ? '👑' : '⚡'}
          </motion.div>

          {/* Title */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-black text-white mb-3"
          >
            پیرۆزە! 🎉
          </motion.p>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`text-lg font-bold mb-6 leading-relaxed ${isPro ? 'text-yellow-400' : 'text-blue-400'}`}
          >
            {isPro
              ? 'ئێستا خاوەنی پلانی پڕۆیت بۆ ماوەی 30 ڕۆژ'
              : `${points?.toLocaleString()} خاڵەکەت وەرگیرا`}
          </motion.p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPopup(null)}
            className={`w-full py-3 rounded-2xl font-black text-slate-950 transition ${
              isPro ? 'bg-yellow-400 hover:bg-yellow-300' : 'bg-blue-400 hover:bg-blue-300'
            }`}
          >
            باشە، سوپاس! 🙏
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
