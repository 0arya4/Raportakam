import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const STAGES = [
  { id: 1, label: "شیکردنەوەی بابەت...",    icon: "🔍" },
  { id: 2, label: "دیزاینکردنی سڵایدەکان...", icon: "🎨" },
  { id: 3, label: "دروستکردنی سڵایدەکان...",  icon: "✨" },
  { id: 4, label: "ئەپلۆدکردنی فایلەکە...",   icon: "⚙️" },
  { id: 5, label: "ئامادەیە!",                icon: "⬇️" },
]

// Silent fallback formula — only used if the server /estimate call fails
function fallbackEstimate(formData) {
  const slides = formData?.slide_count || 10
  const isPro = formData?.is_pro || false
  let t = isPro ? 45 : 25
  t += Math.max(0, slides - 5) * (isPro ? 3.5 : 2)
  if (formData?.detail_level === 'Detailed') t += isPro ? 18 : 10
  if (formData?.detail_level === 'Summary')  t -= 5
  const addons = ['addon_chart_extra','addon_table','addon_timeline','addon_quotes','addon_comparison','addon_cover_page','conclusion','addon_references']
  t += addons.filter(k => formData?.[k]).length * (isPro ? 5 : 3)
  return Math.max(Math.round(t), 20)
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
  const [estimate, setEstimate] = useState(null)   // null = waiting for server
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  const hasStartedRef = useRef(false)
  // Always call the latest onComplete, not the stale one from the first render
  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete })

  useEffect(() => {
    fetch(`${API_URL}/estimate?slide_count=${formData?.slide_count || 10}&detail_level=${encodeURIComponent(formData?.detail_level || 'Balanced')}&addon_count=${addonCount(formData)}&is_pro=${formData?.is_pro || false}`)
      .then(r => r.json())
      .then(d => { if (d.seconds) setEstimate(d.seconds) })
      .catch(() => { setEstimate(fallbackEstimate(formData)) })  // silent fallback on failure
    // Guard prevents double-start in React Strict Mode (effect fires twice in dev)
    if (!hasStartedRef.current) {
      hasStartedRef.current = true
      startGeneration()
    }
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

  const isOvertime = estimate !== null && elapsed >= estimate

  const getTimerLabel = () => {
    if (estimate === null) return '---'
    if (elapsed < estimate) return `~${estimate - elapsed} چرکە`
    return '...'
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
      let gotResult = false

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
              gotResult = true
              return
            }
            if (data.url) {
              // Jump straight to stage 6 (all done) when the download URL arrives
              const fullUrl = `${API_URL}${data.url}?name=${encodeURIComponent(formData.file_name || formData.topic)}`
              setCurrentStage(6)
              setDownloadUrl(fullUrl)
              setRunning(false)
              gotResult = true
              // Auto-download immediately so file is saved even if UI resets
              fetch(fullUrl).then(r => r.blob()).then(blob => {
                const blobUrl = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = blobUrl
                a.download = `${formData.file_name || formData.topic || 'raportakam'}.pptx`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(blobUrl)
              }).catch(() => {})
              // Use ref to always call the latest onComplete (avoids stale closure)
              onCompleteRef.current?.(data.tokens_used || 0, data.url)
            } else {
              setCurrentStage(data.stage)
            }
          } catch (_) {}
        }
      }

      // Stream closed without a proper result — stop the spinner and show an error
      if (!gotResult) {
        setError("کۆدەکە بەبێ وەڵام داخرا. دووبارە هەوڵ بدەرەوە.")
        setRunning(false)
      }
    } catch (e) {
      setError(e.message || "کێشەیەک روویدا")
      setRunning(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">

      <AnimatePresence>
        {(running || downloadUrl) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {running && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center justify-between px-4 py-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 text-xs">کاتی خەمڵێندراو</span>
                  <span className="text-orange-400 font-bold text-sm">
                    {getTimerLabel()}
                  </span>
                </motion.div>
                <AnimatePresence>
                  {isOvertime && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-start gap-2 px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-slate-400 text-xs"
                      dir="rtl"
                    >
                      <span className="text-base mt-0.5">☁️</span>
                      <span>
                        <span className="font-semibold" style={{ color: '#f97316', textShadow: '0 0 8px rgba(249,115,22,0.7)' }}>لە کاتی ئاسای زیاتری پێچوو</span><br />
                        <span className="text-slate-500">بەهۆی خاوی ئینتەرنێت یان زۆری وردەکاری لە سڵایدەکان</span>
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
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
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      try {
                        const res = await fetch(downloadUrl)
                        const blob = await res.blob()
                        const blobUrl = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = blobUrl
                        a.download = `${formData?.file_name || formData?.topic || 'raportakam'}.pptx`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(blobUrl)
                      } catch {
                        window.open(downloadUrl, '_blank')
                      }
                    }}
                    className="w-full text-center py-4 font-bold rounded-xl text-lg text-slate-950"
                    style={{ background: 'linear-gradient(135deg,#eab308,#f97316)' }}
                  >
                    ⬇️ داگرتنی پێشکەشکردن
                  </motion.button>
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
          <button onClick={() => { hasStartedRef.current = false; startGeneration() }}
            className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded-lg text-white text-sm transition">
            دووبارە هەوڵ بدەوە
          </button>
        </motion.div>
      )}
    </div>
  )
}
