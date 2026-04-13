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


const REPORT_STAGES = [
  { id: 1, label: 'شیکردنەوەی بابەت...',   icon: '○' },
  { id: 2, label: 'نووسینی ناوەڕۆک...',    icon: '○' },
  { id: 3, label: 'ئامادەکردنی ڕاپۆرت...', icon: '○' },
  { id: 4, label: 'ئامادەیە!',              icon: '○' },
]

// Random color themes — same as generateWord.js
const THEMES = [
  { name: 'Navy', h2: '#1F3A74', h1: '#0D2657', h3: '#404040' },           // Professional Navy
  { name: 'Blue', h2: '#1D4ED8', h1: '#1E3A8A', h3: '#475569' },          // Corporate Blue
  { name: 'Green', h2: '#15803D', h1: '#166534', h3: '#475569' },         // Dark Green
  { name: 'Red', h2: '#991B1B', h1: '#7F1D1D', h3: '#4F46E5' },          // Deep Red
  { name: 'Purple', h2: '#6D28D9', h1: '#581C87', h3: '#475569' },        // Purple Premium
  { name: 'Teal', h2: '#0D9488', h1: '#047857', h3: '#475569' },          // Teal Modern
  { name: 'Amber', h2: '#B45309', h1: '#92400E', h3: '#475569' },         // Amber Classic
  { name: 'Indigo', h2: '#4F46E5', h1: '#4338CA', h3: '#475569' },        // Indigo Tech
]
const COVER_STYLES = ['centered', 'left', 'right', 'minimal', 'elegant']
const ACCENT_POSITIONS = ['top', 'bottom', 'none']

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
  const [downloadingWord, setDownloadingWord] = useState(false)
  const [currentStage, setCurrentStage] = useState(0)
  const [selectedTheme, setSelectedTheme] = useState(() => THEMES[Math.floor(Math.random() * THEMES.length)])
  const [selectedCoverStyle, setSelectedCoverStyle] = useState(() => COVER_STYLES[Math.floor(Math.random() * COVER_STYLES.length)])
  const [selectedAccentPos, setSelectedAccentPos] = useState(() => ACCENT_POSITIONS[Math.floor(Math.random() * ACCENT_POSITIONS.length)])

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
    include_conclusion: false,
    include_references: false,
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
    setSelectedTheme(THEMES[Math.floor(Math.random() * THEMES.length)])
    setSelectedCoverStyle(COVER_STYLES[Math.floor(Math.random() * COVER_STYLES.length)])
    setSelectedAccentPos(ACCENT_POSITIONS[Math.floor(Math.random() * ACCENT_POSITIONS.length)])
    setState('generating')
    setStreamedText('')
    setCurrentStage(0)
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

      if (!res.ok) throw new Error(`Server error ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let gotDone = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          if (!gotDone && textRef.current) {
            clearInterval(timerRef.current)
            clearTimeout(updateTimerRef.current)
            setStreamedText(textRef.current)
            setCurrentStage(4)
            setState('done')
          }
          break
        }
        // Properly buffer across chunk boundaries
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete last line
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.error) {
              clearInterval(timerRef.current)
              setError(data.error)
              setState('form')
              return
            }
            if (data.stage) {
              setCurrentStage(data.stage)
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
            // Use final_json if provided (cleaned JSON without markdown blocks)
            if (data.final_json) {
              textRef.current = data.final_json
              setStreamedText(data.final_json)
            }
            // Handle download URL (report Word file)
            if (data.url) {
              const fullUrl = `${data.url}?name=${encodeURIComponent(form.title || form.topic || 'report')}`
              setCurrentStage(4)
              setState('done')
              // Auto-download immediately
              try {
                const a = document.createElement('a')
                a.href = fullUrl
                a.download = `${(form.title || form.topic || 'report').replace(/\s+/g, '_')}.docx`
                a.style.display = 'none'
                document.body.appendChild(a)
                a.click()
                setTimeout(() => document.body.removeChild(a), 200)
              } catch (_) {}
              if (user) {
                const { data: p } = await supabase.from('profiles').select('points').eq('id', user.id).single()
                if (p) setProfile(prev => ({ ...prev, points: p.points }))
              }
              setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
              gotDone = true
            }
            if (data.done) {
              if (!gotDone) {
                gotDone = true
                clearInterval(timerRef.current)
                clearTimeout(updateTimerRef.current)
                setStreamedText(textRef.current)
                setCurrentStage(4)
                setState('done')
                if (user) {
                  const { data: p } = await supabase.from('profiles').select('points').eq('id', user.id).single()
                  if (p) setProfile(prev => ({ ...prev, points: p.points }))
                }
                setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
              }
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

  const triggerDownload = (url, filename) => {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadWord = async () => {
    setDownloadingWord(true)
    setError('')
    try {
      // streamedText contains JSON from Claude, send it to backend for conversion
      console.log('Download: streamedText length =', streamedText.length)
      console.log('Download: streamedText first 200 chars =', streamedText.substring(0, 200))
      console.log('Download: streamedText last 100 chars =', streamedText.substring(streamedText.length - 100))

      const formData = new FormData()
      formData.append('json_data', streamedText)
      formData.append('filename', form.title || form.topic || 'report')

      const response = await fetch(`${API_URL}/report/download/word/json`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Word download failed')
      }

      const blob = await response.blob()
      const filename = `${(form.title || form.topic || 'report').replace(/\s+/g, '_')}.docx`
      triggerDownload(URL.createObjectURL(blob), filename)
    } catch (e) {
      setError('داگرتنی Word سەرکەوتوو نەبوو: ' + e.message)
      console.error('Word download error:', e)
    } finally {
      setDownloadingWord(false)
    }
  }


  const isRTL = form.language === 'Kurdish (Sorani)' || form.language === 'Arabic'
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
      <style>{`
        @media print {
          body > *:not(#print-root) { display: none !important; }
          #print-root { display: block !important; position: fixed; inset: 0; background: white; z-index: 9999; padding: 0; }
          #report-print-content {
            font-family: 'Times New Roman', Georgia, serif;
            font-size: 12pt;
            line-height: 1.8;
            color: black;
            background: white;
            padding: 2cm 2.5cm;
            direction: ${isRTL ? 'rtl' : 'ltr'};
          }
          #report-print-content h1 { font-size: 22pt; font-weight: 900; text-align: center; border-bottom: 2px solid black; padding-bottom: 8pt; margin: 0 0 16pt; }
          #report-print-content h2 { font-size: 16pt; font-weight: 700; margin: 24pt 0 8pt; page-break-after: avoid; }
          #report-print-content h3 { font-size: 13pt; font-weight: 600; margin: 16pt 0 6pt; }
          #report-print-content p  { margin: 0 0 8pt; text-align: justify; }
          #report-print-content .cover-meta { text-align: center; margin: 6pt 0; font-size: 11pt; }
          @page { margin: 0; }
        }
        #print-root { display: none; }
      `}</style>
      <div id="print-root">
        <div id="report-print-content">
          {(() => {
            let onCover = true
            return streamedText.split('\n').map((line, i) => {
              if (line.startsWith('# '))  return <h1 key={i}>{line.slice(2)}</h1>
              if (line.startsWith('## ')) { onCover = false; return <h2 key={i}>{line.slice(3)}</h2> }
              if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>
              if (line.trim() === '' || line.trim() === '---') return <br key={i} />
              if (onCover) return <p key={i} className="cover-meta">{line}</p>
              return <p key={i}>{line}</p>
            })
          })()}
        </div>
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
                    placeholder=""
                    rows={3}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-yellow-500/60 text-white text-sm rounded-xl px-4 py-3 outline-none resize-none placeholder-slate-600 transition"
                  />
                </div>

                {/* Academic info */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <p className="text-white font-bold text-sm">زانیاری ئەکادیمی <span className="text-slate-500 font-normal text-xs">(دەتوانی بە بەتاڵی جێیبهێڵیت)</span></p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { k: 'title',        label: 'ناونیشانی ڕاپۆرت' },
                      { k: 'student_name', label: 'ناوی خوێندکار' },
                      { k: 'course',       label: 'زانکۆ / کۆرس' },
                      { k: 'instructor',   label: 'مامۆستا' },
                    ].map(f => (
                      <div key={f.k}>
                        <label className="text-xs text-slate-400 block mb-1">{f.label}</label>
                        <input value={form[f.k]} onChange={e => set(f.k, e.target.value)}
                          placeholder=""
                          className="w-full bg-slate-800 border border-slate-700 focus:border-yellow-500/50 text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-slate-600 transition" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">بەروار</label>
                    <input value={form.date} onChange={e => set('date', e.target.value)}
                      placeholder=""
                      className="w-full bg-slate-800 border border-slate-700 focus:border-yellow-500/50 text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-slate-600 transition" />
                  </div>
                </div>

                {/* Content */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <p className="text-white font-bold text-sm">ناوەڕۆکی تر <span className="text-slate-500 font-normal text-xs">(دەتوانی بە بەتاڵی جێیبهێڵیت)</span></p>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">مەبەستی ڕاپۆرت</label>
                    <input value={form.purpose} onChange={e => set('purpose', e.target.value)}
                      placeholder=""
                      className="w-full bg-slate-800 border border-slate-700 focus:border-yellow-500/50 text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-slate-600 transition" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">خاڵە سەرەکییەکان / بەشەکان</label>
                    <textarea value={form.points} onChange={e => set('points', e.target.value)}
                      placeholder=""
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
                      {LANGUAGES.map(l => {
                        const needsPro = l.id === 'Kurdish (Sorani)' || l.id === 'Arabic'
                        const locked = needsPro && !isPro
                        return (
                          <button key={l.id}
                            onClick={() => { if (!locked) set('language', l.id) }}
                            className={`relative py-2.5 px-2 rounded-xl border text-xs font-bold transition ${
                              locked
                                ? 'border-slate-700 bg-slate-800/30 text-slate-600 cursor-not-allowed'
                                : form.language === l.id
                                  ? 'border-yellow-500/60 bg-yellow-500/10 text-yellow-400'
                                  : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600'
                            }`}>
                            {locked && (
                              <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-slate-900 text-xs font-black px-1 rounded-full leading-4">👑</span>
                            )}
                            {l.label}
                          </button>
                        )
                      })}
                    </div>
                    {!isPro && (
                      <p className="text-xs text-slate-600 mt-2">👑 کوردی و عەرەبی تەنها بۆ بەکارهێنەری پڕۆ</p>
                    )}
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
                    { k: 'include_abstract',   label: 'خولاصە زیاد بکە',   sub: 'Abstract' },
                    { k: 'include_conclusion', label: 'دەرئەنجام زیاد بکە', sub: 'Conclusion', free: true },
                    { k: 'include_references', label: 'سەرچاوەکان زیاد بکە', sub: 'References' },
                  ].map(o => (
                    <div key={o.k} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 text-sm">{o.label}</span>
                        {o.sub && <span className="text-slate-500 text-xs">({o.sub})</span>}
                        {form[o.k] && !o.free && (
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
                className="space-y-3">

                {/* Timer bar */}
                <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 text-xs">کاتی خەمڵێندراو</span>
                  <span className="text-orange-400 font-bold text-sm" dir="ltr">
                    {estimate
                      ? (elapsed < estimate ? `~${estimate - elapsed} چرکە` : '...')
                      : '---'}
                  </span>
                </div>

                {/* Overtime warning */}
                <AnimatePresence>
                  {estimate && elapsed >= estimate && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-start gap-2 px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-slate-400 text-xs" dir="rtl"
                    >
                      <span className="text-base mt-0.5 text-slate-400">!</span>
                      <span>
                        <span className="font-semibold" style={{ color: '#f97316', textShadow: '0 0 8px rgba(249,115,22,0.7)' }}>لە کاتی ئاسای زیاتری پێچوو</span><br />
                        <span className="text-slate-500">بەهۆی خاوی ئینتەرنێت یان زۆری وردەکاری لە ڕاپۆرتەکە</span>
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Stages */}
                {REPORT_STAGES.map(stage => {
                  const isDone = currentStage > stage.id
                  const isActive = currentStage === stage.id
                  const isPending = currentStage < stage.id
                  return (
                    <motion.div key={stage.id}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: isPending ? 0.35 : 1, x: 0 }}
                      transition={{ delay: stage.id * 0.07 }}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        isDone   ? 'bg-green-950 border-green-700' :
                        isActive ? 'bg-slate-800 border-yellow-500 shadow-lg shadow-yellow-500/10' :
                                   'bg-slate-900 border-slate-700'
                      }`}
                    >
                      <div className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-700 text-lg flex-shrink-0">
                        {isDone ? (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-400 font-black text-base">✓</motion.span>
                        ) : isActive ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full" />
                        ) : (
                          <span className="text-slate-500">{stage.icon}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold text-sm ${isDone ? 'text-green-400' : isActive ? 'text-white' : 'text-slate-500'}`}>
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

                {/* Progress bar */}
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg,#eab308,#f97316)' }}
                    animate={{ width: `${Math.min((currentStage / 4) * 100, 95)}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>

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
                    ڕاپۆرتەکە ئامادەیە و داگری کرایەوە
                  </span>
                  <button onClick={() => { setState('form'); setStreamedText(''); setCurrentStage(0) }}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl transition">
                    نوێ
                  </button>
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
