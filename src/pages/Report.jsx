import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL ?? ''

const LENGTHS = [
  { id: 'Short',  label: 'کورت',       desc: '٥٠٠–٨٠٠ وشە' },
  { id: 'Medium', label: 'مامناوەند',  desc: '١٠٠٠–١٥٠٠ وشە' },
  { id: 'Long',   label: 'درێژ',       desc: '٢٠٠٠+ وشە' },
]
const STYLES = [
  { id: 'Simple',            label: 'سادە' },
  { id: 'Formal Academic',   label: 'ئەکادیمی' },
  { id: 'Advanced Academic', label: 'ئەکادیمی پیشکەوتوو' },
]
const RESEARCH = [
  { id: 'Basic',    label: 'بنچینەیی' },
  { id: 'Medium',   label: 'مامناوەند' },
  { id: 'Advanced', label: 'پیشکەوتوو' },
]
const LANGUAGES = [
  { id: 'Kurdish (Sorani)', label: 'کوردی' },
  { id: 'English',          label: 'English' },
  { id: 'Arabic',           label: 'عربی' },
]
const CITATIONS = ['APA', 'Harvard', 'MLA', 'IEEE', 'Chicago', 'Google Scholar']
const BASE_COST = 30

export default function Report() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const useSonnet = searchParams.get('ai') === 'sonnet'

  const [profile, setProfile] = useState(null)
  const [state, setState] = useState('form') // 'form' | 'generating' | 'done'
  const [streamedText, setStreamedText] = useState('')
  const [error, setError] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [estimate, setEstimate] = useState(null)
  const [downloading, setDownloading] = useState(false)

  const [form, setForm] = useState({
    topic: '',
    title: '',
    student_name: '',
    course: '',
    instructor: '',
    date: '',
    purpose: '',
    points: '',
    length: 'Medium',
    style: 'Formal Academic',
    research_level: 'Medium',
    citation_styles: ['APA'],
    include_abstract: false,
    include_references: true,
    language: 'English',
  })

  const textRef = useRef('')
  const timerRef = useRef(null)
  const updateTimerRef = useRef(null)
  const resultRef = useRef(null)
  const startRef = useRef(0)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('plan,points').eq('id', user.id).single()
      .then(({ data }) => setProfile(data))
  }, [user])

  // Fetch estimate when length or plan changes
  useEffect(() => {
    fetch(`${API_URL}/report/estimate?length=${form.length}&is_pro=${useSonnet}`)
      .then(r => r.json()).then(d => setEstimate(d.seconds)).catch(() => {})
  }, [form.length, useSonnet])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const formatTime = (s) => {
    if (s < 60) return `${s}چ`
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  const handleGenerate = async () => {
    if (!form.topic.trim()) { setError('بابەتەکە بنووسە'); return }
    if ((profile?.points ?? 100) < totalCost && profile?.plan !== 'pro') {
      setError('خاڵی تە پێویست نییە'); return
    }
    setError('')
    setState('generating')
    setStreamedText('')
    textRef.current = ''
    setElapsed(0)
    startRef.current = Date.now()

    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)

    try {
      const res = await fetch(`${API_URL}/report/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          user_id: user?.id || '',
          plan: profile?.plan || 'free',
        }),
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      let gotDone = false
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          if (!gotDone && textRef.current) {
            clearInterval(timerRef.current)
            clearTimeout(updateTimerRef.current)
            setStreamedText(textRef.current)
            setState('done')
          }
          break
        }
        const raw = decoder.decode(value)
        for (const line of raw.split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.error) {
              clearInterval(timerRef.current)
              setError(data.error)
              setState('form')
              return
            }
            if (data.chunk) {
              textRef.current += data.chunk
              // Throttle re-renders to every 80ms
              if (!updateTimerRef.current) {
                updateTimerRef.current = setTimeout(() => {
                  setStreamedText(textRef.current)
                  updateTimerRef.current = null
                }, 80)
              }
            }
            if (data.done) {
              gotDone = true
              clearInterval(timerRef.current)
              clearTimeout(updateTimerRef.current)
              setStreamedText(textRef.current)
              setState('done')
              if (user) {
                const { data: p } = await supabase.from('profiles').select('points').eq('id', user.id).single()
                if (p) setProfile(prev => ({ ...prev, points: p.points }))
              }
              setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
            }
          } catch {}
        }
      }
    } catch (e) {
      clearInterval(timerRef.current)
      setError(e.message || 'هەڵەیەک ڕووی دا')
      setState('form')
    }
  }

  const handleDownloadWord = async () => {
    setDownloading(true)
    try {
      const fd = new FormData()
      fd.append('text', streamedText)
      fd.append('filename', form.title || form.topic || 'report')
      fd.append('language', form.language)
      const res = await fetch(`${API_URL}/report/download/word`, { method: 'POST', body: fd })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${form.title || form.topic || 'report'}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  const handleDownloadPDF = () => {
    window.print()
  }

  const isPro = profile?.plan === 'pro'
  const points = profile?.points ?? 100
  const totalCost = BASE_COST
    + (form.length === 'Long' ? 2 : 0)
    + (form.style === 'Advanced Academic' ? 2 : 0)
    + (form.research_level === 'Advanced' ? 2 : 0)
    + (form.include_abstract ? 2 : 0)
    + (form.include_references ? 2 : 0)
  const canGenerate = isPro || points >= totalCost

  return (
    <>
      <Navbar />
      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #report-print-area { display: block !important; }
          #report-print-area { position: fixed; top: 0; left: 0; width: 100%; background: white; color: black; padding: 40px; font-family: serif; font-size: 12pt; line-height: 1.8; direction: ltr; }
        }
        #report-print-area { display: none; }
      `}</style>

      {/* Hidden print area */}
      <div id="report-print-area">
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'serif' }}>{streamedText}</pre>
      </div>

      <div className="min-h-screen bg-slate-950 pt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border mb-4 ${
              useSonnet
                ? 'bg-yellow-400/10 border-yellow-500/30 text-yellow-400'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
            }`}>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 2L4.09 12.26c-.34.43-.5.86-.5 1.26 0 .97.75 1.48 1.41 1.48H11v7l8.91-10.26c.34-.43.5-.86.5-1.26 0-.97-.75-1.48-1.41-1.48H13V2z"/>
              </svg>
              {useSonnet ? 'Sonnet' : 'Haiku'}
            </div>
            <h1 className="text-3xl font-black text-white mb-2">دروستکردنی ڕاپۆرت</h1>
            <p className="text-slate-400 text-sm">ڕاپۆرتێکی ئەکادیمی و پڕۆفیشناڵ بنووسە</p>

            {/* Points + cost */}
            {profile && !isPro && (
              <div className="inline-flex items-center gap-3 mt-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
                <span className="text-slate-400 text-xs">خاڵەکانت:</span>
                <span className={`text-sm font-black ${points < totalCost ? 'text-red-400' : 'text-white'}`}>{points}</span>
                <div className="w-px h-4 bg-slate-700" />
                <span className="text-slate-400 text-xs">تێچوو:</span>
                <span className="text-yellow-400 text-sm font-black">{totalCost} خاڵ</span>
              </div>
            )}
          </motion.div>

          <AnimatePresence mode="wait">

            {/* ── FORM STATE ── */}
            {state === 'form' && (
              <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                className="space-y-4">

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>
                )}

                {/* Topic — required */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <label className="block text-white font-bold text-sm mb-2">
                    بابەت <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={form.topic}
                    onChange={e => set('topic', e.target.value)}
                    placeholder="بابەتی ڕاپۆرتەکەت بنووسە..."
                    rows={3}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-yellow-500/60 text-white text-sm rounded-xl px-4 py-3 outline-none resize-none placeholder-slate-600 transition"
                  />
                </div>

                {/* Academic info */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <p className="text-white font-bold text-sm">زانیاری ئەکادیمی <span className="text-slate-500 font-normal text-xs">(دیاری نییە)</span></p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { k: 'title',        label: 'ناونیشانی ڕاپۆرت',  ph: 'وەک نمونە: کاریگەری AI' },
                      { k: 'student_name', label: 'ناوی خوێندکار',     ph: 'ناوی تەواو' },
                      { k: 'course',       label: 'زانکۆ / کۆرس',      ph: 'وەک نمونە: زانکۆی سلێمانی' },
                      { k: 'instructor',   label: 'مامۆستا',            ph: 'ناوی مامۆستا' },
                    ].map(f => (
                      <div key={f.k}>
                        <label className="text-xs text-slate-400 block mb-1">{f.label}</label>
                        <input value={form[f.k]} onChange={e => set(f.k, e.target.value)}
                          placeholder={f.ph}
                          className="w-full bg-slate-800 border border-slate-700 focus:border-yellow-500/50 text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-slate-600 transition" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">بەروار</label>
                    <input value={form.date} onChange={e => set('date', e.target.value)}
                      placeholder="وەک نمونە: ٢٠٢٦"
                      className="w-full bg-slate-800 border border-slate-700 focus:border-yellow-500/50 text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-slate-600 transition" />
                  </div>
                </div>

                {/* Content */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <p className="text-white font-bold text-sm">ناوەڕۆکی تر <span className="text-slate-500 font-normal text-xs">(دیاری نییە)</span></p>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">مەبەستی ڕاپۆرت</label>
                    <input value={form.purpose} onChange={e => set('purpose', e.target.value)}
                      placeholder="مەبەستی سەرەکی ڕاپۆرتەکە..."
                      className="w-full bg-slate-800 border border-slate-700 focus:border-yellow-500/50 text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-slate-600 transition" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">خاڵە سەرەکییەکان / بەشەکان</label>
                    <textarea value={form.points} onChange={e => set('points', e.target.value)}
                      placeholder="هەر خاڵێک لە ێکی جیاوازدا بنووسە..."
                      rows={3}
                      className="w-full bg-slate-800 border border-slate-700 focus:border-yellow-500/50 text-white text-sm rounded-xl px-4 py-3 outline-none resize-none placeholder-slate-600 transition" />
                  </div>
                </div>

                {/* Settings */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <p className="text-white font-bold text-sm">ڕێکخستنەکان</p>

                  {/* Length */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-2">درێژی ڕاپۆرت</label>
                    <div className="grid grid-cols-3 gap-2">
                      {LENGTHS.map(l => (
                        <button key={l.id} onClick={() => set('length', l.id)}
                          className={`relative py-2.5 px-3 rounded-xl border text-xs font-bold transition text-center ${
                            form.length === l.id
                              ? 'border-yellow-500/60 bg-yellow-500/10 text-yellow-400'
                              : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600'
                          }`}>
                          {l.id === 'Long' && <span className="absolute -top-1.5 -left-1.5 text-xs font-black text-orange-400 bg-orange-400/10 border border-orange-400/30 px-1 rounded-full">+٢</span>}
                          <div>{l.label}</div>
                          <div className="text-slate-500 font-normal mt-0.5 text-xs">{l.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Writing Style */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-2">شێوازی نووسین</label>
                    <div className="grid grid-cols-3 gap-2">
                      {STYLES.map(s => (
                        <button key={s.id} onClick={() => set('style', s.id)}
                          className={`relative py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                            form.style === s.id
                              ? 'border-yellow-500/60 bg-yellow-500/10 text-yellow-400'
                              : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600'
                          }`}>
                          {s.id === 'Advanced Academic' && <span className="absolute -top-1.5 -left-1.5 text-xs font-black text-orange-400 bg-orange-400/10 border border-orange-400/30 px-1 rounded-full">+٢</span>}
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Research Level */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-2">ئاستی توێژینەوە</label>
                    <div className="grid grid-cols-3 gap-2">
                      {RESEARCH.map(r => (
                        <button key={r.id} onClick={() => set('research_level', r.id)}
                          className={`relative py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                            form.research_level === r.id
                              ? 'border-yellow-500/60 bg-yellow-500/10 text-yellow-400'
                              : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600'
                          }`}>
                          {r.id === 'Advanced' && <span className="absolute -top-1.5 -left-1.5 text-xs font-black text-orange-400 bg-orange-400/10 border border-orange-400/30 px-1 rounded-full">+٢</span>}
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-2">زمان</label>
                    <div className="grid grid-cols-3 gap-2">
                      {LANGUAGES.map(l => (
                        <button key={l.id} onClick={() => set('language', l.id)}
                          className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition ${
                            form.language === l.id
                              ? 'border-yellow-500/60 bg-yellow-500/10 text-yellow-400'
                              : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600'
                          }`}>
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Options */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <p className="text-white font-bold text-sm">بژاردەکان</p>

                  {/* Citation style — only if research != Basic */}
                  {form.research_level !== 'Basic' && (
                    <div>
                      <label className="text-xs text-slate-400 block mb-2">شێوازی سەرچاوە</label>
                      <div className="flex flex-wrap gap-2">
                        {CITATIONS.map(c => {
                          const active = form.citation_styles.includes(c)
                          const toggle = () => set('citation_styles', active
                            ? form.citation_styles.filter(x => x !== c)
                            : [...form.citation_styles, c])
                          return (
                            <button key={c} onClick={toggle}
                              className={`py-2 px-4 rounded-xl border text-xs font-bold transition ${
                                active
                                  ? 'border-yellow-500/60 bg-yellow-500/10 text-yellow-400'
                                  : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600'
                              }`}>
                              {c}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {[
                    { k: 'include_abstract',   label: 'خولاصە زیاد بکە' },
                    { k: 'include_references', label: 'سەرچاوەکان زیاد بکە' },
                  ].map(o => (
                    <div key={o.k} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 text-sm">{o.label}</span>
                        {form[o.k] && (
                          <span className="text-xs font-bold text-orange-400 bg-orange-400/10 border border-orange-400/30 px-1.5 py-0.5 rounded-full">+٢ خاڵ</span>
                        )}
                      </div>
                      <button onClick={() => set(o.k, !form[o.k])}
                        className={`relative w-11 h-6 rounded-full transition-colors ${form[o.k] ? 'bg-yellow-400' : 'bg-slate-700'}`}>
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form[o.k] ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Estimate + Generate */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs text-slate-500">
                      {estimate && (
                        <span>کاتی خەمڵاندراو: <span className="text-slate-300 font-bold">{formatTime(estimate)}</span></span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      تێچووی خاڵ: <span className="text-yellow-400 font-black">{totalCost}</span>
                    </div>
                  </div>
                  <button onClick={handleGenerate}
                    disabled={!form.topic.trim() || !canGenerate}
                    className="w-full py-4 rounded-xl font-black text-sm transition disabled:opacity-40 disabled:cursor-not-allowed text-slate-950"
                    style={{ background: canGenerate ? 'linear-gradient(135deg, #eab308, #f97316)' : undefined, backgroundColor: canGenerate ? undefined : '#374151' }}>
                    {!canGenerate ? `خاڵی تە پێویست نییە (${totalCost} خاڵ پێویستە)` : 'دروستکردنی ڕاپۆرت ←'}
                  </button>
                </div>

                <button onClick={() => navigate(-1)}
                  className="w-full flex items-center justify-center gap-1 border border-slate-800 hover:border-slate-700 text-slate-500 hover:text-slate-300 text-sm px-5 py-3 rounded-xl transition hover:bg-white/5">
                  ← گەڕانەوە
                </button>
              </motion.div>
            )}

            {/* ── GENERATING STATE ── */}
            {state === 'generating' && (
              <motion.div key="gen" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-4">

                {/* Progress card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
                      <span className="text-white font-bold text-sm">دروستکردنی ڕاپۆرت...</span>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-400 font-black text-lg font-mono" dir="ltr">
                        {estimate ? (elapsed < estimate ? `~${estimate - elapsed} چرکە` : '...') : '---'}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {estimate && (
                    <div className="bg-slate-800 rounded-full h-1.5 mb-4">
                      <motion.div
                        className="h-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400"
                        style={{ width: `${Math.min((elapsed / estimate) * 100, 95)}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  )}

                  <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${
                    useSonnet
                      ? 'bg-yellow-400/10 border-yellow-500/30 text-yellow-400'
                      : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                  }`}>
                    {useSonnet ? 'Sonnet' : 'Haiku'}
                  </div>
                </div>

                {/* Streaming text preview */}
                {streamedText && (
                  <div className="bg-white rounded-2xl p-6 shadow-xl max-h-[500px] overflow-y-auto" dir="ltr">
                    <div className="text-slate-800 text-sm leading-relaxed font-serif space-y-2">
                      {streamedText.split('\n').map((line, i) => {
                        if (line.startsWith('# '))  return <h1 key={i} className="text-xl font-black text-slate-900 border-b border-slate-200 pb-1 mt-4 mb-2">{line.slice(2)}</h1>
                        if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold text-slate-800 mt-3 mb-1">{line.slice(3)}</h2>
                        if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-semibold text-slate-700 mt-2">{line.slice(4)}</h3>
                        if (line.trim() === '' || line.trim() === '---') return <div key={i} className="h-1" />
                        return <p key={i} className="text-slate-700 leading-6">{line}</p>
                      })}
                      <span className="inline-block w-1.5 h-4 bg-yellow-400 animate-pulse align-middle" />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── DONE STATE ── */}
            {state === 'done' && (
              <motion.div key="done" ref={resultRef} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-4">

                {/* Action bar */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
                  <span className="text-green-400 font-bold text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    ڕاپۆرتەکە ئامادەیە
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={handleDownloadPDF}
                      className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold px-3 py-2 rounded-xl transition">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      PDF
                    </button>
                    <button onClick={handleDownloadWord} disabled={downloading}
                      className="flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold px-3 py-2 rounded-xl transition disabled:opacity-40">
                      {downloading
                        ? <span className="flex items-center gap-1"><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>چاوەڕێ...</span>
                        : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Word</>
                      }
                    </button>
                    <button onClick={() => { setState('form'); setStreamedText('') }}
                      className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl transition">
                      نوێ
                    </button>
                  </div>
                </div>

                {/* Report content */}
                <div className="bg-white rounded-2xl p-8 shadow-2xl" dir="ltr">
                  <div className="text-slate-800 text-sm leading-relaxed font-serif space-y-3">
                    {streamedText.split('\n').map((line, i) => {
                      if (line.startsWith('# '))  return <h1 key={i} className="text-2xl font-black text-slate-900 border-b border-slate-200 pb-2 mt-6 mb-3">{line.slice(2)}</h1>
                      if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-slate-800 mt-5 mb-2">{line.slice(3)}</h2>
                      if (line.startsWith('### ')) return <h3 key={i} className="text-base font-semibold text-slate-700 mt-4 mb-1">{line.slice(4)}</h3>
                      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold text-slate-800">{line.slice(2,-2)}</p>
                      if (line.trim() === '' || line.trim() === '---') return <div key={i} className="h-2" />
                      return <p key={i} className="text-slate-700 leading-7">{line}</p>
                    })}
                  </div>
                </div>

                <button onClick={() => navigate(-1)}
                  className="w-full flex items-center justify-center gap-1 border border-slate-800 hover:border-slate-700 text-slate-500 hover:text-slate-300 text-sm px-5 py-3 rounded-xl transition hover:bg-white/5">
                  ← گەڕانەوە
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </>
  )
}
