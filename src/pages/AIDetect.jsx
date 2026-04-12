import { useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL ?? ''

const VERDICT_COLOR = (pct) => {
  if (pct <= 20) return { stroke: '#22c55e', text: 'text-green-400', bg: 'bg-green-400/10 border-green-500/30' }
  if (pct <= 40) return { stroke: '#84cc16', text: 'text-lime-400', bg: 'bg-lime-400/10 border-lime-500/30' }
  if (pct <= 60) return { stroke: '#eab308', text: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-500/30' }
  if (pct <= 80) return { stroke: '#f97316', text: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-500/30' }
  return { stroke: '#ef4444', text: 'text-red-400', bg: 'bg-red-400/10 border-red-500/30' }
}

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function CircleProgress({ percentage, color }) {
  const offset = CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE
  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="#1e293b" strokeWidth="10" />
        <motion.circle
          cx="60" cy="60" r={RADIUS}
          fill="none"
          stroke={color.stroke}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 8px ${color.stroke}88)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={`text-3xl font-black ${color.text}`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        >
          {percentage}%
        </motion.span>
        <span className="text-slate-500 text-xs mt-0.5">AI</span>
      </div>
    </div>
  )
}

const SOURCE_LABELS = { plain_text: 'تێکست', pdf: 'PDF', docx: 'Word', pptx: 'PowerPoint' }
const CONFIDENCE_KU = { High: 'بەرز', Medium: 'ناوەند', Low: 'کەم' }

export default function AIDetect() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const useSonnet = searchParams.get('ai') === 'sonnet'
  const fileRef = useRef(null)
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setText('')
    setResult(null)
    setError('')
  }

  const handleDetect = async () => {
    if (!text.trim() && !file) { setError('تێکستێک بنووسە یان فایلێک بخه'); return }
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const fd = new FormData()
      if (file) fd.append('file', file)
      else fd.append('text', text)
      fd.append('use_sonnet', useSonnet ? '1' : '0')
      if (user?.id) fd.append('user_id', user.id)

      const res = await fetch(`${API_URL}/ai-detect`, { method: 'POST', body: fd })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.detail || 'هەڵەیەک ڕووی دا')
      }
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError(e.message || 'هەڵەیەک ڕووی دا')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => { setResult(null); setText(''); setFile(null); setError('') }

  const color = result ? VERDICT_COLOR(result.ai_percentage) : null

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-950 pt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto">

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Detection · {useSonnet ? 'Sonnet' : 'Haiku'}
            </div>
            <h1 className="text-3xl font-black text-white mb-2">دەستنووس یان AI؟</h1>
            <p className="text-slate-400 text-sm">بزانە نووسینەکەت دەرەکەوێ کە زیرەکی دەستکردە؟ AI Detection</p>
          </motion.div>

          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div key="input" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">

                {/* File upload */}
                <div>
                  <input ref={fileRef} type="file" accept=".pdf,.docx,.pptx" onChange={handleFile} className="hidden" />
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-700 hover:border-purple-500/60 rounded-xl py-5 flex flex-col items-center gap-2 transition group">
                    <svg className="w-8 h-8 text-slate-600 group-hover:text-purple-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {file
                      ? <span className="text-purple-400 text-sm font-bold">{file.name}</span>
                      : <>
                          <span className="text-slate-400 text-sm font-medium">فایل بخه</span>
                          <span className="text-slate-600 text-xs">PDF · Word · PowerPoint</span>
                        </>}
                  </button>
                  {file && (
                    <button onClick={() => setFile(null)} className="text-xs text-slate-500 hover:text-red-400 mt-2 transition">× سڕینەوەی فایل</button>
                  )}
                </div>

                {!file && (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-slate-800" />
                      <span className="text-slate-600 text-xs">یان</span>
                      <div className="flex-1 h-px bg-slate-800" />
                    </div>
                    <textarea
                      value={text}
                      onChange={e => { setText(e.target.value); setError('') }}
                      placeholder="تێکستەکەت ئێرە بنووسە یان لێرە بکەوێنە..."
                      rows={7}
                      className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 text-white text-sm rounded-xl px-4 py-3 outline-none resize-none placeholder-slate-600 transition"
                    />
                    {text && (
                      <p className="text-slate-600 text-xs text-left" dir="ltr">{text.trim().split(/\s+/).length} words</p>
                    )}
                  </>
                )}

                {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                <button
                  onClick={handleDetect}
                  disabled={loading || (!text.trim() && !file)}
                  className="w-full py-3 rounded-xl font-black text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      چاوەڕێ بکە...
                    </span>
                  ) : 'دەستپێکردن'}
                </button>
              </motion.div>
            ) : (
              <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-4">

                {/* Main result card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="flex flex-col items-center gap-4">
                    <CircleProgress percentage={result.ai_percentage} color={color} />

                    <div className="text-center">
                      <p className={`text-xl font-black ${color.text}`}>{result.verdict}</p>
                      <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${color.bg} ${color.text}`}>
                          AI: {result.ai_percentage}%
                        </span>
                        <span className="text-xs font-bold px-3 py-1 rounded-full border border-slate-700 bg-slate-800 text-slate-300">
                          مرۆڤ: {result.human_percentage}%
                        </span>

                        <span className="text-xs font-bold px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400">
                          {SOURCE_LABELS[result.source_type] || result.source_type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Two columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Top reasons */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <p className="text-white font-bold text-sm mb-3">هۆکارەکان</p>
                    <ul className="space-y-2">
                      {result.top_reasons?.map((r, i) => (
                        <motion.li key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                          className="flex items-start gap-2 text-xs text-slate-300">
                          <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${color.text.replace('text-', 'bg-')}`} />
                          {r}
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* Suggestion */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <p className="text-white font-bold text-sm mb-3">پێشنیار</p>
                    <p className="text-slate-400 text-xs leading-relaxed">{result.suggestion}</p>
                  </div>
                </div>

                {/* Risky sentences */}
                {result.risky_sentences?.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <p className="text-white font-bold text-sm mb-3">ڕستە مەترسیدارەکان</p>
                    <ul className="space-y-2">
                      {result.risky_sentences.map((s, i) => (
                        <motion.li key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
                          className={`text-xs px-3 py-2 rounded-lg border-r-2 bg-red-500/5 border-red-500/40 text-slate-300 leading-relaxed`}>
                          {s}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}

                <button onClick={reset}
                  className="w-full py-3 rounded-xl font-bold text-sm border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition hover:bg-white/5">
                  دووبارە هەمەنگین
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6">
            <button onClick={() => navigate(-1)} className="w-full flex items-center justify-center gap-1 border border-slate-800 hover:border-slate-700 text-slate-500 hover:text-slate-300 text-sm px-5 py-3 rounded-xl transition hover:bg-white/5">
              ← گەڕانەوە
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
