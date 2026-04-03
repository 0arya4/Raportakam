import { useState, useEffect } from 'react'
import InfoButton from '../components/InfoButton'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import logo from '../assets/logo.png.png'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const THEMES = [
  { id: 'dark',     label: 'تاریکی مۆدێرن',     preview: 'from-slate-900 to-black' },
  { id: 'light',    label: 'سپی پاک',          preview: 'from-slate-50 to-white' },
  { id: 'yellow',   label: 'زێڕینی شاهانە',    preview: 'from-amber-400 to-yellow-600' },
  { id: 'blue',     label: 'شینی پاشایانە',    preview: 'from-blue-700 to-indigo-900' },
  { id: 'green',    label: 'دارستانی سەوز',    preview: 'from-emerald-600 to-teal-900' },
  { id: 'purple',   label: 'مۆری پڕشنگدار',    preview: 'from-violet-600 to-purple-900' },
  { id: 'red',      label: 'سووری تۆخ',        preview: 'from-red-600 to-maroon-900' },
  { id: 'orange',   label: 'زەردەپەڕ',         preview: 'from-orange-500 to-rose-600' },
  { id: 'pink',     label: 'پەمەیی شکۆفە',      preview: 'from-pink-400 to-rose-500' },
  { id: 'teal',     label: 'تیتانیۆم',         preview: 'from-slate-400 to-slate-700' },
  { id: 'indigo',   label: 'نیوەشەو',          preview: 'from-indigo-950 to-slate-950' },
  { id: 'navy',     label: 'قووڵایی دەریا',    preview: 'from-cyan-600 to-blue-800' },
  { id: 'gold',     label: 'کاتی زێڕین',       preview: 'from-yellow-500 to-orange-500' },
  { id: 'forest',   label: 'ئەشکەوت',          preview: 'from-green-900 to-slate-950' },
  { id: 'sunset',   label: 'پرشنگی زەرد',       preview: 'from-yellow-400 to-amber-500' },
  { id: 'ocean',    label: 'ئاسمانی ساماڵ',    preview: 'from-sky-400 to-blue-600' },
  { id: 'midnight', label: 'سایبەرپەنک',       preview: 'from-fuchsia-600 to-purple-900' },
  { id: 'rose',     label: 'گوڵناری',          preview: 'from-rose-500 to-rose-900' },
  { id: 'brown',    label: 'قاوەیی گەرم',      preview: 'from-amber-800 to-stone-950' },
  { id: 'silver',   label: 'زیوین',            preview: 'from-slate-300 to-slate-500' },
]

const AUDIENCES = [
  { id: 'students',  label: 'خوێندکاران',    icon: '🎓' },
  { id: 'business',  label: 'بازرگانی',       icon: '💼' },
  { id: 'academic',  label: 'ئەکادیمی',       icon: '🔬' },
  { id: 'general',   label: 'گشتی',           icon: '👥' },
  { id: 'children',  label: 'منداڵان',        icon: '🧒' },
  { id: 'experts',   label: 'پسپۆڕان',        icon: '🧠' },
]

const PURPOSES = [
  { id: 'education',  label: 'پەروەردەیی',   icon: '📚' },
  { id: 'pitch',      label: 'بازرگانی',      icon: '📈' },
  { id: 'research',   label: 'لێکۆڵینەوە',   icon: '🔍' },
  { id: 'training',   label: 'پەرەپێدان',    icon: '🏋️' },
  { id: 'marketing',  label: 'بازاڕکردن',    icon: '📣' },
  { id: 'report',     label: 'ڕاپۆرت',       icon: '📋' },
]

const LEVELS = [
  { id: 'beginner',      label: 'سەرەتایی',   desc: 'شیکاری سادە، زمانی ئاسان' },
  { id: 'intermediate',  label: 'ناوەندی',     desc: 'ئاستی مامناوەند' },
  { id: 'expert',        label: 'پسپۆڕانە',   desc: 'کەڵکوتراو و وردبوونەوە' },
]

const STYLES = [
  { id: 'classic',   label: 'کلاسیک',    desc: 'ناوەندی، بار لە سەرەوە',      preview: 'from-slate-800 to-slate-900',   accent: 'bg-yellow-400' },
  { id: 'corporate', label: 'کۆرپۆرەیت', desc: 'بار لە چەپ، چەپ ئاراستە',     preview: 'from-blue-900 to-slate-900',    accent: 'bg-blue-400' },
  { id: 'bold',      label: 'جەست',      desc: 'سەرپۆشی گەورە، ناوەندی',      preview: 'from-orange-600 to-red-800',    accent: 'bg-orange-400' },
  { id: 'minimal',   label: 'مینیمال',   desc: 'سادە، هێڵی باریک لە لای',     preview: 'from-slate-100 to-white',       accent: 'bg-slate-400' },
  { id: 'tech',      label: 'تێک',       desc: 'بار لە سەر و خوار، گۆشەکان',  preview: 'from-cyan-900 to-slate-950',    accent: 'bg-cyan-400' },
  { id: 'elegant',   label: 'ئێلیگەنت', desc: 'بار لە ڕاست، ڕاست ئاراستە',   preview: 'from-purple-900 to-slate-900',  accent: 'bg-purple-400' },
]

const TONES = [
  { id: 'formal',      label: 'فەرمی',       icon: '🎩' },
  { id: 'scientific',  label: 'زانستی',       icon: '🔬' },
]

const DETAIL_LEVELS = [
  { id: 'brief',    label: 'کورت',     desc: '3 خاڵ بۆ هەر سلاید' },
  { id: 'normal',   label: 'مامناوەند', desc: '5 خاڵ بۆ هەر سلاید' },
  { id: 'detailed', label: 'وردبوونەوە', desc: '7+ خاڵ + ڕوونکردنەوە' },
]

// SLIDE_COUNTS is no longer needed since we are using a numeric input

async function generateFile(form, onStatus) {
  const data = new FormData()
  data.append('prompt', form.prompt)
  data.append('output_type', form.type)
  data.append('slides', form.slides || 10)
  data.append('theme', form.theme)
  data.append('tone', form.tone)
  data.append('audience', form.audience)
  data.append('purpose', form.purpose)
  data.append('level', form.level)
  data.append('detail', form.detail)
  data.append('include_stats', form.includeStats)
  data.append('include_examples', form.includeExamples)
  data.append('include_conclusion', form.includeConclusion)
  data.append('include_images', form.includeImages)
  data.append('include_ai_images', form.includeAIImages)
  data.append('style', form.style)
  data.append('file_name', form.fileName)
  if (form.uploadedFile) data.append('file', form.uploadedFile)

  let res
  try {
    res = await fetch('https://raportakam.onrender.com/generate', { method: 'POST', body: data })
  } catch {
    throw new Error('ناتوانرێت پەیوەندی بە server بکرێت — دڵنیابە کە backend کاردەکات')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Server error ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const event = JSON.parse(line.slice(6))
      if (event.status === 'error') throw new Error(event.detail)
      if (event.status === 'done') return event.result
      if (onStatus) onStatus(event)
    }
  }
  throw new Error('Stream ended unexpectedly')
}

const pageVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
}

const STEPS = ['بابەت', 'ئامانج', 'شێواز', 'وردەکاری', 'دروستکردن']

export default function Create() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('full_name, plan, points').eq('id', user.id).single()
      .then(({ data }) => { if (data) setProfile(data) })
  }, [user])
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    prompt: '', fileName: '', type: 'pptx',
    audience: 'students', purpose: 'education', level: 'intermediate',
    slides: 10, theme: 'dark', tone: 'formal', detail: 'normal', style: 'classic',
    includeStats: false, includeExamples: false, includeConclusion: false, includeImages: false, includeAIImages: false,
    uploadedFile: null,
  })
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [statusMsg, setStatusMsg] = useState('')

  const isPro = profile?.plan === 'pro'
  const userPoints = profile?.points ?? 100

  const SLIDE_OPTIONS = [1,2,3,4,5,6,7,8,9,10,15,20,25,30]

  const calcXal = () => {
    let cost = 25
    const s = form.slides
    if (s >= 6 && s <= 10) cost += 5
    else if (s === 15) cost += 8
    else if (s === 20) cost += 10
    else if (s === 25) cost += 12
    else if (s === 30) cost += 15
    if (form.detail === 'detailed') cost += 3
    if (form.includeAIImages) cost += 3
    if (form.includeStats) cost += 1
    if (form.includeExamples) cost += 1
    return cost
  }

  const xalNeeded = calcXal()
  const hasEnoughXal = isPro || userPoints >= xalNeeded

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const canNext = () => {
    if (step === 1) return form.prompt.trim() && form.fileName.trim()
    return true
  }

  const handleNext = async () => {
    if (step < 4) { setStep(s => s + 1); return }
    if (!hasEnoughXal) return
    setStep(5)
    setError('')
    setStatusMsg('')
    try {
      const statusLabels = {
        generating:    'دروستکردنی ناوەڕۆک...',
        photo:         'داگرتنی وێنە...',
        ai_photo:      'چاوەڕێی وێنەی AI...',
        creating_file: 'دیزاینکردنی فایل...',
        uploading:     'بارکردن بۆ کلاود...',
      }
      const res = await generateFile(form, (e) => {
        const base = statusLabels[e.status] || ''
        setStatusMsg(e.slide ? `${base} ${e.slide}` : base)
      })
      setResult(res)
      if (user) {
        await supabase.from('generations').insert({
          user_id: user.id,
          prompt: form.prompt,
          output_type: form.type,
          theme: form.theme,
          tone: form.tone,
          file_url: res.r2_download || res.download_path,
          status: 'done',
          file_name: form.fileName,
          tokens_used: res.tokens_used || 0,
        })
        if (!isPro) {
          const newPoints = userPoints - xalNeeded
          await supabase.from('profiles').update({ points: newPoints }).eq('id', user.id)
          setProfile(p => ({ ...p, points: newPoints }))
        }
      }
    } catch (e) {
      setError(e.message || 'کێشەیەک روویدا')
    }
  }

  const resetForm = () => {
    setStep(1)
    setResult(null)
    setError('')
    setForm({ prompt: '', fileName: '', type: 'pptx', audience: 'students', purpose: 'education', level: 'intermediate', slides: 10, theme: 'dark', tone: 'formal', detail: 'normal', style: 'classic', includeStats: false, includeExamples: false, includeConclusion: false, includeImages: false, includeAIImages: false, uploadedFile: null })
  }

  return (
    <div className="bg-slate-950 flex flex-col overflow-hidden" style={{ height: '100dvh' }}>
      {/* Top bar */}
      <div className="h-16 sm:h-28 border-b border-slate-800 flex items-center justify-between px-4 sm:px-10 flex-shrink-0">
        {/* Steps */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {STEPS.map((label, i) => {
            const n = i + 1
            const done = step > n
            const active = step === n
            return (
              <div key={n} className="flex items-center gap-1 sm:gap-1.5">
                <div className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-sm font-medium transition-all ${
                  active ? 'bg-yellow-400/20 text-yellow-400' :
                  done ? 'text-green-400' : 'text-slate-600'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0 ${
                    active ? 'bg-yellow-400 text-slate-950' :
                    done ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-600'
                  }`}>
                    {done ? '✓' : n}
                  </div>
                  <span className="hidden sm:block">{label}</span>
                </div>
                {i < 4 && <div className={`w-2 sm:w-4 h-px transition-all ${done ? 'bg-green-500' : 'bg-slate-800'}`} />}
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {profile && (
            profile.plan === 'pro' ? (
              <motion.span animate={{ textShadow: ['0 0 8px #f97316', '0 0 16px #f97316', '0 0 8px #f97316'] }} transition={{ duration: 2, repeat: Infinity }} className="text-xs sm:text-base font-bold text-orange-400">👑 پڕۆ</motion.span>
            ) : (
              <span className="text-xs sm:text-lg text-slate-400"><span className="text-yellow-400 font-bold">{profile.points ?? 100}</span> خاڵ</span>
            )
          )}
          <button onClick={() => navigate('/')} className="flex items-center gap-1 sm:gap-2">
            <span className="font-bold text-white text-base sm:text-3xl">ڕاپۆرتەکەم</span>
            <img src={logo} alt="logo" className="w-10 h-10 sm:w-24 sm:h-24 object-contain" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* ── STEP 1: Topic ── */}
          {step === 1 && (
            <motion.div key="s1" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="flex flex-col min-h-full px-4 sm:px-8 lg:px-16 py-5 sm:py-10 w-full max-w-5xl mx-auto">
              <div className="mb-5 sm:mb-8">
                <h1 className="text-3xl sm:text-6xl font-black mb-2">بابەتەکەت چییە؟</h1>
                <p className="text-slate-500 text-sm sm:text-lg">ناوی فایل و بابەتەکەت بنووسە</p>
              </div>

              <div className="flex-1 flex flex-col gap-5 mb-8">
                <input value={form.fileName} onChange={e => set('fileName', e.target.value)}
                  placeholder="ناوی فایلەکە... (نمونە: ڕاپۆرتی ئاووهەوا)" dir="rtl"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-yellow-500/60 outline-none text-white placeholder-slate-500 px-6 py-5 rounded-2xl text-lg transition" />

                <div className="flex-1 bg-slate-900 border border-slate-700 focus-within:border-yellow-500/60 rounded-2xl p-6 transition-all flex flex-col">
                  <textarea value={form.prompt} onChange={e => set('prompt', e.target.value)}
                    placeholder="بابەتەکەت بە وردی ڕووندەکەیتەوە... زیاتر بنووسی، باشتر دەبێت" dir="rtl"
                    className="flex-1 w-full bg-transparent resize-none outline-none text-white placeholder-slate-500 text-base leading-relaxed min-h-[120px] sm:min-h-[200px]" />
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-slate-400 hover:text-yellow-400 cursor-pointer transition text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        {form.uploadedFile ? form.uploadedFile.name : 'نمونەت لایە؟ داینێ!'}
                        <input type="file" className="hidden" accept=".pdf,.csv,.txt,.docx" onChange={e => set('uploadedFile', e.target.files[0])} />
                      </label>
                      <InfoButton text="فایلێک هاوپێچ بکە (PDF, Word, CSV, TXT) تا زیرەکی دەستکردی ناوەڕۆکەکەی بخوێنێتەوە و بەکاری بهێنێت لە دروستکردنی فایلەکەدا." />
                    </div>
                    <span className="text-sm text-slate-600">{form.prompt.length} پیت</span>
                  </div>
                </div>
              </div>

              {/* Type */}
              <div className="flex gap-4">
                {[
                  { id: 'pptx', label: 'سیمینار', icon: '📊', sub: 'PowerPoint' },
                  { id: 'word', label: 'ڕاپۆرت',  icon: '📄', sub: 'Word' },
                ].map(t => (
                  <motion.button key={t.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => set('type', t.id)}
                    className={`flex items-center gap-4 px-7 py-5 rounded-2xl border flex-1 transition ${
                      form.type === t.id ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}>
                    <span className="text-3xl">{t.icon}</span>
                    <div className="text-right">
                      <div className="font-bold text-base">{t.label}</div>
                      <div className="text-sm opacity-60">{t.sub}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Audience & Purpose ── */}
          {step === 2 && (
            <motion.div key="s2" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="w-full max-w-5xl mx-auto px-4 sm:px-8 lg:px-16 py-5 sm:py-10">
              <h1 className="text-3xl sm:text-6xl font-black mb-2">بۆ کێ و بۆ چی؟</h1>
              <p className="text-slate-500 text-sm sm:text-lg mb-5 sm:mb-8">ئامانج و ئامانجدار دیاری بکە</p>

              <div className="mb-6">
                <p className="text-sm font-semibold text-white mb-3">ئامانجدار کێیە؟</p>
                <div className="grid grid-cols-3 gap-2">
                  {AUDIENCES.map(a => (
                    <motion.button key={a.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => set('audience', a.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition ${
                        form.audience === a.id ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}>
                      <span>{a.icon}</span><span>{a.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-semibold text-white mb-3">ئامانج چییە؟</p>
                <div className="grid grid-cols-3 gap-2">
                  {PURPOSES.map(p => (
                    <motion.button key={p.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => set('purpose', p.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition ${
                        form.purpose === p.id ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}>
                      <span>{p.icon}</span><span>{p.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-white mb-3">ئاستی زانیاری?</p>
                <div className="flex gap-2">
                  {LEVELS.map(l => (
                    <motion.button key={l.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => set('level', l.id)}
                      className={`flex-1 px-3 py-3 rounded-xl border text-sm transition ${
                        form.level === l.id ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}>
                      <div className="font-semibold">{l.label}</div>
                      <div className="text-xs opacity-60 mt-0.5">{l.desc}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Style ── */}
          {step === 3 && (
            <motion.div key="s3" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="w-full max-w-5xl mx-auto px-4 sm:px-8 lg:px-16 py-5 sm:py-10">
              <h1 className="text-3xl sm:text-6xl font-black mb-2">شێوازەکە</h1>
              <p className="text-slate-500 text-lg mb-8">دیزاین و ئاھەنگی نووسین هەڵبژێرە</p>

              {form.type === 'pptx' && (
                <div className="mb-6">
                  <p className="text-sm font-semibold text-white mb-3">شێوازی پێشکەشکردن</p>
                  <div className="grid grid-cols-3 gap-2">
                    {STYLES.map(s => (
                      <motion.button key={s.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => set('style', s.id)}
                        className={`relative rounded-xl overflow-hidden border-2 transition ${form.style === s.id ? 'border-yellow-400' : 'border-slate-700'}`}>
                        <div className={`h-10 bg-gradient-to-br ${s.preview} flex items-end p-1 gap-1`}>
                          <div className={`${s.accent} rounded-sm`} style={{ width: s.id === 'corporate' ? '6px' : s.id === 'elegant' ? '6px' : '100%', height: s.id === 'corporate' || s.id === 'elegant' ? '100%' : '5px' }} />
                        </div>
                        <div className="bg-slate-900 py-1.5 px-1 text-center">
                          <div className="text-xs font-semibold text-white">{s.label}</div>
                          <div className="text-[9px] text-slate-500 leading-tight mt-0.5">{s.desc}</div>
                        </div>
                        {form.style === s.id && (
                          <div className="absolute top-1.5 left-1.5 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {form.type === 'pptx' && (
                <div className="mb-6">
                  <p className="text-sm font-semibold text-white mb-3">تێما</p>
                  <div className="grid grid-cols-3 gap-2">
                    {THEMES.map(t => (
                      <motion.button key={t.id} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={() => set('theme', t.id)}
                        className={`relative rounded-xl overflow-hidden border-2 transition ${form.theme === t.id ? 'border-yellow-400' : 'border-slate-700'}`}>
                        <div className={`h-12 bg-gradient-to-br ${t.preview}`} />
                        <div className="bg-slate-900 py-1.5 text-xs text-center font-medium">{t.label}</div>
                        {form.theme === t.id && (
                          <div className="absolute top-1.5 left-1.5 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {form.type === 'pptx' && (
                <div className="mb-6 flex items-center justify-between bg-slate-900/40 border border-slate-800 p-4 rounded-2xl">
                  <p className="text-sm font-semibold text-white">ژمارەی سلاید</p>
                  <select
                    value={form.slides}
                    onChange={e => {
                      const val = parseInt(e.target.value)
                      if (val >= 15 && !isPro) return
                      set('slides', val)
                    }}
                    className="bg-slate-900 border-2 border-slate-700 focus:border-yellow-400 text-white rounded-xl px-4 py-2 outline-none text-sm transition"
                  >
                    {SLIDE_OPTIONS.map(n => (
                      <option key={n} value={n} disabled={n >= 15 && !isPro}
                        style={{ color: n >= 15 ? '#f97316' : 'white' }}>
                        {n} سلاید{n >= 15 ? ' 👑' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-white mb-3">شێوازەکەی</p>
                <div className="grid grid-cols-2 gap-2">
                  {TONES.map(t => (
                    <motion.button key={t.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => set('tone', t.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition ${
                        form.tone === t.id ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400' : 'border-slate-700 text-slate-400'
                      }`}>
                      <span className="text-xl">{t.icon}</span><span className="font-medium text-sm">{t.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 4: Details ── */}
          {step === 4 && (
            <motion.div key="s4" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="w-full max-w-5xl mx-auto px-4 sm:px-8 lg:px-16 py-5 sm:py-10">
              <h1 className="text-3xl sm:text-6xl font-black mb-2">وردەکاری</h1>
              <p className="text-slate-500 text-lg mb-6">ئاستی وردبوونەوە و ناوەڕۆک دیاری بکە</p>

              {/* XAL counter */}
              <div className={`flex items-center justify-between px-4 py-3 rounded-xl border mb-5 transition ${hasEnoughXal ? 'border-slate-700 bg-slate-900/40' : 'border-red-500/60 bg-red-500/10'}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${hasEnoughXal ? 'text-white' : 'text-red-400'}`}>{xalNeeded} خاڵ پێویستە</span>
                  {!hasEnoughXal && <span className="text-red-400 text-xs">— خاڵی پێویستت نییە</span>}
                </div>
                {!isPro && <span className="text-slate-500 text-xs">{userPoints} خاڵت هەیە</span>}
                {isPro && <span className="text-orange-400 text-xs">پڕۆ — نامەحدود</span>}
              </div>

              <div className="mb-6">
                <p className="text-sm font-semibold text-white mb-3">ئاستی وردبوونەوە</p>
                <div className="flex gap-2">
                  {DETAIL_LEVELS.map(d => (
                    <motion.button key={d.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => set('detail', d.id)}
                      className={`flex-1 px-3 py-3 rounded-xl border text-sm transition ${
                        form.detail === d.id ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400' : 'border-slate-700 text-slate-400'
                      }`}>
                      <div className="font-semibold">{d.label}</div>
                      <div className="text-xs opacity-60 mt-0.5">{d.desc}</div>
                      {d.id === 'detailed' && <div className="text-xs text-orange-400 mt-1">+3 خاڵ</div>}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-semibold text-white mb-3">چی تێبگات؟</p>
                <div className="space-y-2">
                  {[
                    { key: 'includeStats',      label: 'ئامار و ژمارە',       icon: '📊', desc: 'زیادکردنی داتا و ئامار',                   xal: '+1 خاڵ' },
                    { key: 'includeExamples',   label: 'نموونەکان',            icon: '💡', desc: 'نموونەی ڕاستەقینە',                           xal: '+1 خاڵ' },
                    { key: 'includeImages',     label: 'وێنە',                icon: '🖼️', desc: 'دانانی وێنە لە سڵایدەکان',                    xal: '' },
                    { key: 'includeAIImages',   label: 'ڕەسمی Ai',            icon: '🤖', desc: 'دروستکردنی وێنە بە زیرەکی دەستکرد',           xal: '+3 خاڵ' },
                    { key: 'includeConclusion', label: 'دەرئەنجام',            icon: '✅', desc: 'Conclusion',                                  xal: '' },
                  ].map(opt => (
                    <motion.button key={opt.key} whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const newVal = !form[opt.key]
                        const update = { [opt.key]: newVal }
                        // Mutual exclusivity for images
                        if (newVal) {
                          if (opt.key === 'includeImages') update.includeAIImages = false
                          if (opt.key === 'includeAIImages') update.includeImages = false
                        }
                        setForm(prev => ({ ...prev, ...update }))
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition ${
                        form[opt.key] ? 'border-yellow-400 bg-yellow-400/10' : 'border-slate-700 bg-slate-900'
                      }`}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{opt.icon}</span>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${form[opt.key] ? 'text-yellow-400' : 'text-slate-300'}`}>{opt.label}</span>
                            {opt.xal && <span className="text-orange-400 text-xs">{opt.xal}</span>}
                          </div>
                          <div className="text-xs text-slate-500">{opt.desc}</div>
                        </div>
                      </div>
                      <div className={`w-10 h-5 rounded-full transition-all relative ${form[opt.key] ? 'bg-yellow-400' : 'bg-slate-700'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form[opt.key] ? 'left-5' : 'left-0.5'}`} />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm">
                <p className="text-slate-500 text-xs mb-2">پوختەی داواکارییەکەت:</p>
                <p className="text-white text-sm mb-2 font-medium">{form.fileName}</p>
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{form.prompt}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {[
                    form.type === 'pptx' ? 'سیمینار' : 'ڕاپۆرت',
                    form.type === 'pptx' ? `${form.slides} سلاید` : '',
                    AUDIENCES.find(a => a.id === form.audience)?.label,
                    PURPOSES.find(p => p.id === form.purpose)?.label,
                    LEVELS.find(l => l.id === form.level)?.label,
                    TONES.find(t => t.id === form.tone)?.label,
                  ].filter(Boolean).map((tag, i) => (
                    <span key={i} className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 5: Generating / Done ── */}
          {step === 5 && (
            <motion.div key="s5" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="w-full max-w-xl text-center">
              {!result && !error && (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full mx-auto mb-6" />
                  <h2 className="text-2xl font-bold mb-2">دروستکردنی فایل...</h2>
                  <p className="text-slate-400 text-sm mb-6">تکایە چاوەڕێ بکە</p>
                  {statusMsg && (
                    <motion.div key={statusMsg} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3 text-right text-slate-300 text-sm">
                      {statusMsg}
                    </motion.div>
                  )}
                </>
              )}

              {result && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-5xl mb-5">✅</motion.div>
                  <h2 className="text-2xl font-bold mb-1">ئامادەیە!</h2>
                  <p className="text-slate-400 text-sm mb-1">{result.title}</p>
                  <p className="text-slate-600 text-xs mb-6">{xalNeeded} خاڵ بەکارهێنرا</p>
                  <a href={result.r2_download ? `https://raportakam.onrender.com${result.r2_download}` : `https://raportakam.onrender.com${result.download_path}`} download>
                    <motion.button whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(234,179,8,0.4)' }} whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 text-slate-950 font-bold px-8 py-3.5 rounded-xl text-base mx-auto mb-4"
                      style={{ background: 'linear-gradient(135deg, #eab308, #f97316)' }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      داونلۆد بکە
                    </motion.button>
                  </a>
                  <button onClick={resetForm} className="text-slate-500 hover:text-white text-sm transition">+ دروستکردنی نوێ</button>
                </motion.div>
              )}

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="text-4xl mb-4">❌</div>
                  <h2 className="text-xl font-bold mb-2">کێشەیەک روویدا</h2>
                  <p className="text-slate-400 text-sm mb-6">{error}</p>
                  <button onClick={() => { setStep(4); setError('') }}
                    className="text-slate-950 font-bold px-6 py-3 rounded-xl transition"
                    style={{ background: 'linear-gradient(135deg, #eab308, #f97316)' }}>
                    دووبارە هەوڵ بدەوە
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      {step < 5 && (
        <div className="h-16 border-t border-slate-800 flex items-center justify-between px-6 flex-shrink-0">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition px-4 py-2 rounded-lg border border-slate-800 hover:border-slate-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {step > 1 ? 'گەڕانەوە' : 'هەڵوەشاندن'}
          </motion.button>

          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            disabled={!canNext() || (step === 4 && !hasEnoughXal)}
            onClick={handleNext}
            className="flex items-center gap-2 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm disabled:opacity-30 disabled:cursor-not-allowed transition"
            style={{ background: 'linear-gradient(135deg, #eab308, #f97316)' }}>
            {step === 4 ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                دروستکردن
              </>
            ) : (
              <>
                دواتر
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </>
            )}
          </motion.button>
        </div>
      )}
    </div>
  )
}
