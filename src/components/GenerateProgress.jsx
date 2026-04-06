import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const STAGES = [
  { id: 1, label: "شیکردنەوەی بابەت...",    icon: "🔍" },
  { id: 2, label: "دیزاینکردنی شێوازەکان...", icon: "🎨" },
  { id: 3, label: "دروستکردنی سلایدەکان...",  icon: "✨" },
  { id: 4, label: "بینای فایلەکە...",          icon: "⚙️" },
  { id: 5, label: "ئامادەیە!",                icon: "⬇️" },
]

function localEstimate(formData) {
  let t = 30
  const slides = formData?.slide_count || 10
  t += Math.max(0, slides - 5) * 2
  if (formData?.detail_level === 'Detailed') t += 12
  if (formData?.detail_level === 'Summary')  t -= 5
  const addons = ['addon_chart_extra','addon_table','addon_timeline','addon_quotes','addon_comparison','addon_cover_page','conclusion','addon_references']
  t += addons.filter(k => formData?.[k]).length * 3
  return Math.max(t, 20)
}

function addonCount(formData) {
  return ['addon_chart_extra','addon_table','addon_timeline','addon_quotes','addon_comparison','addon_cover_page','conclusion','addon_references']
    .filter(k => formData?.[k]).length
}

export default function GenerateProgress({ formData, onComplete, onReset }) {
  const [currentStage, setCurrentStage] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [error, setError] = useState(null)
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [estimate, setEstimate] = useState(localEstimate(formData))
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  useEffect(() => {
    fetch(`${API_URL}/estimate?slide_count=${formData?.slide_count || 10}&detail_level=${encodeURIComponent(formData?.detail_level || 'Balanced')}&addon_count=${addonCount(formData)}&is_pro=${formData?.is_pro || false}`)
      .then(r => r.json())
      .then(d => { if (d.seconds) setEstimate(d.seconds) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [running])

  const getTimerLabel = () => {
    if (elapsed < estimate) return `~${estimate - elapsed} چرکە`
    const extra = (elapsed - estimate) % 10
    return `~${10 - extra} چرکە`
  }

  const startGeneration = async () => {
    setRunning(true)
    setCurrentStage(1)
    setDownloadUrl(null)
    setError(null)
    setElapsed(0)

    try {
      const res = await fetch(`${API_URL}/generate/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error("Server error")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop()
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.stage === -1) {
              setError(data.error || "کێشەیەک روویدا. دووبارە هەوڵ بدەوە.")
              setRunning(false)
              return
            }
            setCurrentStage(data.stage)
            if (data.url) {
              setDownloadUrl(`${API_URL}${data.url}?name=${encodeURIComponent(formData.file_name || formData.topic)}`)
              setCurrentStage(6)
              setRunning(false)
              onComplete?.(data.tokens_used || 0)
            }
          } catch (_) {}
        }
      }
    } catch (e) {
      setError(e.message || "کێشەیەک روویدا")
      setRunning(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      {!running && !downloadUrl && !error && (
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={startGeneration}
          className="w-full py-4 font-bold rounded-xl text-lg text-slate-950"
          style={{ background: 'linear-gradient(135deg,#eab308,#f97316)' }}
        >
          دروستکردنی پێشکەشکردن ✨
        </motion.button>
      )}

      <AnimatePresence>
        {(running || downloadUrl) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {running && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center justify-between px-4 py-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-xs">کاتی خایەنراو</span>
                <span className="text-orange-400 font-bold text-sm">
                  {getTimerLabel()}
                </span>
              </motion.div>
            )}
            {STAGES.map((stage) => {
              const isDone = currentStage > stage.id
              const isActive = currentStage === stage.id
              const isPending = currentStage < stage.id
              return (
                <motion.div key={stage.id}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: isPending ? 0.35 : 1, x: 0 }}
                  transition={{ delay: stage.id * 0.08 }}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    isDone   ? "bg-green-950 border-green-700" :
                    isActive ? "bg-slate-800 border-yellow-500 shadow-lg shadow-yellow-500/10" :
                               "bg-slate-900 border-slate-700"
                  }`}
                >
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-700 text-lg flex-shrink-0">
                    {isDone ? (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>✅</motion.span>
                    ) : isActive ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full" />
                    ) : (
                      <span className="text-slate-500">{stage.icon}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${isDone ? "text-green-400" : isActive ? "text-white" : "text-slate-500"}`}>
                      {stage.label}
                    </p>
                    {isActive && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-yellow-400 mt-0.5">
                        چاوەڕێ بکە...
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              )
            })}

            <div className="h-2 bg-slate-800 rounded-full overflow-hidden mt-2">
              <motion.div className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg,#eab308,#f97316)' }}
                animate={{ width: `${(currentStage / 5) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            <AnimatePresence>
              {downloadUrl && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3 pt-2">
                  <a href={downloadUrl} download className="block w-full">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="w-full text-center py-4 font-bold rounded-xl text-lg text-slate-950"
                      style={{ background: 'linear-gradient(135deg,#eab308,#f97316)' }}>
                      ⬇️ داگرتنی پێشکەشکردن
                    </motion.div>
                  </a>
                  <button onClick={onReset} className="w-full text-slate-500 hover:text-white text-sm transition text-center py-2">
                    + دروستکردنی نوێ
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="p-4 bg-red-950 border border-red-700 rounded-xl text-red-400 text-sm text-center space-y-3">
          <p>{error}</p>
          <button onClick={() => { setError(null); setRunning(false); setCurrentStage(0) }}
            className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded-lg text-white text-sm transition">
            دووبارە هەوڵ بدەوە
          </button>
        </motion.div>
      )}
    </div>
  )
}
