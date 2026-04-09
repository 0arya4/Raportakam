import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import GenerateProgress from '../components/GenerateProgress'
import InfoButton from '../components/InfoButton'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import logo from '../assets/logo.png.png'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'


const API_URL = import.meta.env.VITE_API_URL ?? ''


const PRES_STYLES = [
  { id: 'Academic / University', label: 'ئەکادیمی',   desc: 'زانکۆ و لێکۆڵینەوە',   icon: '🎓', color: 'border-blue-500/50 bg-blue-500/5'   },
  { id: 'Business / Corporate',  label: 'بازرگانی',    desc: 'کۆمپانیا و ئەنجومەن',  icon: '💼', color: 'border-emerald-500/50 bg-emerald-500/5' },
  { id: 'Creative / Minimal',    label: 'دیزاینی',     desc: 'دیزاین و کرییەتیڤ',    icon: '🎨', color: 'border-purple-500/50 bg-purple-500/5' },
  { id: 'Scientific / Research', label: 'زانستی',      desc: 'لێکۆڵینەوەی زانستی',   icon: '🔬', color: 'border-cyan-500/50 bg-cyan-500/5'     },
]

const COLOR_THEMES = [
  { id: 'Auto (AI decides)',    label: 'ئۆتۆماتیک',         preview: 'from-violet-600 via-blue-600 to-cyan-500',        icon: '✨' },
  { id: 'Dark & Bold',          label: 'تاریک و جەست',      preview: 'from-neutral-950 to-neutral-800',                 icon: '🌑' },
  { id: 'Light & Clean',        label: 'ڕووناک و پاک',      preview: 'from-slate-100 to-white',                         icon: '☀️' },
  { id: 'Corporate Blue',       label: 'شینی بازرگانی',      preview: 'from-blue-100 to-blue-200',                       icon: '🔵' },
  { id: 'Warm Earth',           label: 'گەرمی خاکی',        preview: 'from-amber-50 to-orange-100',                     icon: '🟤' },
  { id: 'Monochrome',           label: 'یەک ڕەنگ',          preview: 'from-neutral-900 to-neutral-700',                 icon: '⬛' },
  { id: 'Vibrant & Colorful',   label: 'ڕەنگاوڕەنگ',       preview: 'from-fuchsia-500 via-orange-400 to-yellow-400',   icon: '🌈' },
  { id: 'Dark & Moody',         label: 'تاریک و سیرۆمەت',  preview: 'from-purple-950 to-neutral-950',                  icon: '🟣' },
  { id: 'Business Navy & Gold', label: 'نەیڤی و زێڕین',    preview: 'from-blue-950 to-slate-950',                      icon: '🥇' },
  { id: 'Sunset Gradient',      label: 'ئاوابووی خۆر',      preview: 'from-purple-950 via-red-900 to-orange-700',       icon: '🌅' },
  { id: 'Ocean Deep',           label: 'قووڵایی دەریا',     preview: 'from-cyan-950 to-blue-950',                       icon: '🌊' },
  { id: 'Forest & Nature',      label: 'دارستان و سروشت',  preview: 'from-green-50 to-emerald-100',                    icon: '🌿' },
  { id: 'Rose Gold',            label: 'ئەلتوونی گوڵناری',  preview: 'from-rose-50 to-pink-100',                        icon: '🌸' },
  { id: 'Cyberpunk',            label: 'سایبەرپەنک',        preview: 'from-neutral-950 via-indigo-950 to-neutral-950',  icon: '⚡' },
  { id: 'Titanium',             label: 'تایتانیۆم',         preview: 'from-neutral-950 to-zinc-800',                    icon: '🔩' },
  { id: 'Midnight Purple',      label: 'شەوی مۆر',          preview: 'from-purple-950 via-violet-900 to-purple-800',    icon: '🌙' },
  { id: 'Arctic Ice',           label: 'قەڵای باکووری',      preview: 'from-sky-100 via-blue-50 to-white',               icon: '🧊' },
  { id: 'Golden Hour',          label: 'کاتی زێڕین',        preview: 'from-yellow-950 via-amber-800 to-yellow-700',     icon: '🌟' },
  { id: 'Neon Matrix',          label: 'نیۆن ماتریکس',      preview: 'from-black via-green-950 to-black',               icon: '💻' },
  { id: 'Cherry Blossom',       label: 'گوڵی گیلاس',        preview: 'from-pink-100 via-rose-200 to-pink-50',           icon: '🌸' },
  { id: 'Desert Sand',          label: 'خاکی چۆڵ',          preview: 'from-amber-100 via-yellow-200 to-orange-100',     icon: '🏜️' },
  { id: 'Emerald Luxury',       label: 'زمرودی فاخر',       preview: 'from-emerald-950 via-green-900 to-emerald-800',   icon: '💎' },
  { id: 'Retro Vintage',        label: 'کلاسیکی کۆن',       preview: 'from-stone-200 via-amber-100 to-stone-300',       icon: '📜' },
]

const DETAIL_LEVELS = [
  { id: 'Summary',  label: 'کورت',       desc: 'کەمترین نووسین، وێنەی زیاتر' },
  { id: 'Balanced', label: 'مامناوەند',  desc: 'ئاستی مامناوەند' },
  { id: 'Detailed', label: 'وردبوونەوە', desc: 'نووسینی زیاتر، وردبوونەوە' },
]

// SLIDE_COUNTS is no longer needed since we are using a numeric input


const pageVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
}

const STEPS = ['بابەت', 'شێواز', 'دیزاین', 'وردەکاری', 'دروستکردن']


export default function Create() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('full_name, plan, points').eq('id', user.id).single()
      .then(({ data }) => { if (data) setProfile(data) })
  }, [user])
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    prompt: '', fileName: '', type: searchParams.get('type') === 'word' ? 'word' : 'pptx',
    presStyle: 'Academic / University',
    colorTheme: 'Auto (AI decides)', slides: 10,
    detail: 'Balanced', studentNames: [''], instructorName: '', universityName: '',
    date: new Date().toLocaleDateString('en-GB'),
    addonTable: false, addonTimeline: false, addonChartExtra: false,
    addonQuotes: false, addonComparison: false, addonCoverPage: false,
    conclusion: false, addonReferences: false,
    uploadedFile: null,
  })
  const [result, setResult] = useState(null)
  const slideRefs = useRef([])

  const isPro = profile?.plan === 'pro'
  const aiParam = searchParams.get('ai')
  // If no AI param (direct navigation), pro defaults to Sonnet. Otherwise respect the selection.
  const useSonnet = aiParam === null ? isPro : (aiParam === 'sonnet' && isPro)
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
    if (form.detail === 'Detailed') cost += 3
    const addonKeys = ['addonTable', 'addonTimeline', 'addonChartExtra', 'addonQuotes', 'addonComparison', 'addonCoverPage', 'addonReferences', 'conclusion']
    cost += addonKeys.filter(k => form[k]).length * 0.5
    return cost
  }

  const xalNeeded = calcXal()
  const hasEnoughXal = isPro || userPoints >= xalNeeded

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const canNext = () => {
    if (step === 1) return form.prompt.trim() && form.fileName.trim()
    return true
  }

  const buildRequest = () => ({
    topic: form.prompt,
    slide_count: form.slides || 10,
    color_theme: form.colorTheme,
    language: 'English',
    style: form.presStyle,
    detail_level: form.detail,
    student_name: form.studentNames.filter(n => n.trim()).join(', '),
    instructor_name: form.instructorName || '',
    university_name: form.universityName || '',
    date: form.date || new Date().toLocaleDateString('en-GB'),
    addon_table: form.addonTable,
    addon_timeline: form.addonTimeline,
    addon_chart_extra: form.addonChartExtra,
    addon_quotes: form.addonQuotes,
    addon_comparison: form.addonComparison,
    addon_cover_page: form.addonCoverPage,
    addon_custom_text: '',
    conclusion: form.conclusion,
    addon_references: form.addonReferences,
    file_name: form.fileName,
    is_pro: useSonnet,
  })

  const handleNext = () => {
    if (step < 4) { setStep(s => s + 1); return }
    if (!hasEnoughXal) return
    setStep(5)
  }

  const handleGenerationComplete = async (tokensUsed = 0, fileUrl = '') => {
    if (!user) return
    try {
      await supabase.from('generations').insert({
        user_id: user.id,
        prompt: form.prompt,
        output_type: form.type,
        status: 'done',
        file_name: form.fileName,
        tokens_used: tokensUsed,
        file_url: fileUrl,
      })
    } catch (e) {
      console.error('[handleGenerationComplete] insert error:', e)
    }
    if (!isPro) {
      try {
        const newPoints = userPoints - xalNeeded
        await supabase.from('profiles').update({ points: newPoints }).eq('id', user.id)
        setProfile(p => ({ ...p, points: newPoints }))
      } catch (e) {
        console.error('[handleGenerationComplete] points update error:', e)
      }
    }
  }

  const resetForm = () => {
    setStep(1)
    setResult(null)
    setForm({
      prompt: '', fileName: '', type: 'pptx',
      presStyle: 'Academic / University',
      colorTheme: 'Auto (AI decides)', slides: 10,
      detail: 'Balanced', studentNames: [''], instructorName: '', universityName: '',
      date: new Date().toLocaleDateString('en-GB'),
      addonTable: false, addonTimeline: false, addonChartExtra: false,
      addonQuotes: false, addonComparison: false, addonCoverPage: false,
      conclusion: false, addonReferences: false,
      uploadedFile: null,
    })
  }

  const addStudent = () => setForm(f => ({ ...f, studentNames: [...f.studentNames, ''] }))
  const removeStudent = (i) => setForm(f => ({ ...f, studentNames: f.studentNames.filter((_, idx) => idx !== i) }))
  const setStudent = (i, val) => setForm(f => ({ ...f, studentNames: f.studentNames.map((n, idx) => idx === i ? val : n) }))

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
          <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${useSonnet ? 'bg-yellow-400/10 border-yellow-500/30 text-yellow-400' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'}`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            {useSonnet ? 'Sonnet' : 'Haiku'}
          </span>
          {profile && (
            profile.plan === 'pro' ? (
              <motion.span animate={{ textShadow: ['0 0 8px #f97316', '0 0 16px #f97316', '0 0 8px #f97316'] }} transition={{ duration: 2, repeat: Infinity }} className="text-xs sm:text-base font-bold text-orange-400">👑 پڕۆ</motion.span>
            ) : (
              <span className="text-xs sm:text-lg text-slate-400"><span className="text-orange-400 font-bold">{profile.points ?? 100}</span> خاڵ</span>
            )
          )}
          <button onClick={() => navigate('/')} className="flex items-center gap-1 sm:gap-2">
            <span className="font-bold text-white text-base sm:text-3xl">ڕاپۆرتەکەم</span>
            <img src={logo} alt="logo" className="w-10 h-10 sm:w-24 sm:h-24 object-contain" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
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
                    placeholder="بابەتەکەت بە وردی ڕوون بکەرەوە ، تا زیاتر بنووسیت باشتر دەبێت" dir="rtl"
                    className="flex-1 w-full bg-transparent resize-none outline-none text-white placeholder-slate-500 text-base leading-relaxed min-h-[120px] sm:min-h-[200px]" />
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                    <span className="text-sm text-slate-600">{form.prompt.length} پیت</span>
                  </div>
                </div>
              </div>

              {/* Type indicator */}
              <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border w-fit ${form.type === 'pptx' ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400' : 'border-blue-500/40 bg-blue-500/10 text-blue-400'}`}>
                <span className="text-2xl">{form.type === 'pptx' ? '📊' : '📄'}</span>
                <div className="text-right">
                  <div className="font-bold text-sm">{form.type === 'pptx' ? 'سیمینار' : 'ڕاپۆرت'}</div>
                  <div className="text-xs opacity-60">{form.type === 'pptx' ? 'PowerPoint' : 'Word'}</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Presentation Style ── */}
          {step === 2 && (
            <motion.div key="s2" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="w-full max-w-5xl mx-auto px-4 sm:px-8 lg:px-16 py-5 sm:py-10">
              <h1 className="text-3xl sm:text-6xl font-black mb-2 mt-4">شێوازی پێشکەشکردن</h1>
              <p className="text-slate-500 text-lg mb-8">جۆری پێشکەشکردن هەڵبژێرە</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRES_STYLES.map(s => (
                  <motion.button key={s.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => set('presStyle', s.id)}
                    className={`flex items-center gap-4 px-5 py-5 rounded-2xl border-2 text-sm transition ${
                      form.presStyle === s.id
                        ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                        : `border-slate-700 text-slate-400 hover:border-slate-500 ${s.color}`
                    }`}>
                    <span className="text-3xl flex-shrink-0">{s.icon}</span>
                    <div className="text-right">
                      <div className="font-bold text-base">{s.label}</div>
                      <div className="text-xs opacity-60 mt-1">{s.desc}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Color Theme & Slides ── */}
          {step === 3 && (
            <motion.div key="s3" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="w-full max-w-5xl mx-auto px-4 sm:px-8 lg:px-16 py-5 sm:py-10">
              <h1 className="text-3xl sm:text-6xl font-black mb-2">ڕەنگ و دیزاین</h1>
              <p className="text-slate-500 text-lg mb-8">تێمای ڕەنگ و ژمارەی سلاید دیاری بکە</p>

              <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800 p-4 rounded-2xl mb-6">
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

              <div className="mb-8">
                <p className="text-sm font-semibold text-white mb-3">تێمای ڕەنگ</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COLOR_THEMES.map(t => (
                    <motion.button key={t.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => set('colorTheme', t.id)}
                      className={`relative rounded-xl overflow-hidden border-2 transition ${form.colorTheme === t.id ? 'border-yellow-400' : 'border-slate-700'}`}>
                      <div className={`h-16 bg-gradient-to-br ${t.preview} relative flex items-end`}>
                        {t.id === 'Auto (AI decides)' && (
                          <span className="absolute bottom-1.5 right-2 text-xs font-bold text-white/90 bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">✨ ئۆتۆماتیک</span>
                        )}
                      </div>
                      {form.colorTheme === t.id && (
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

              <div className="flex items-center gap-2 mt-4 px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-500 text-xs">
                <span className="text-base">⏱️</span>
                <span>دیزاینی زیاتر زیاد دەکرێت بەپێی کات</span>
              </div>
            </motion.div>
          )}

          {/* ── STEP 4: Details ── */}
          {step === 4 && (
            <motion.div key="s4" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="w-full max-w-5xl mx-auto px-4 sm:px-8 lg:px-16 py-5 sm:py-10">
              <h1 className="text-3xl sm:text-6xl font-black mb-2">وردەکاری</h1>
              <p className="text-slate-500 text-lg mb-6">زانیاری زیاتر و ئەکسترا دیاری بکە</p>

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
                      {d.id === 'Detailed' && <div className="text-xs text-orange-400 mt-1">+3 خاڵ</div>}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-semibold text-slate-400">ناوی خوێندکار (ئەگەر هەبوو)</p>
                    <button onClick={addStudent} className="text-xs text-yellow-400 hover:text-yellow-300 transition">+ زیادکردن</button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {form.studentNames.map((name, i) => (
                      <div key={i} className="flex gap-2">
                        <input value={name} onChange={e => setStudent(i, e.target.value)}
                          placeholder={`خوێندکار ${i + 1}...`} dir="rtl"
                          className="flex-1 bg-slate-900 border border-slate-700 focus:border-yellow-500/60 outline-none text-white placeholder-slate-600 px-4 py-2.5 rounded-xl text-sm transition" />
                        {form.studentNames.length > 1 && (
                          <button onClick={() => removeStudent(i)} className="text-slate-500 hover:text-red-400 transition px-2">✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-1.5">ناوی مامۆستا (ئەگەر هەبوو)</p>
                  <input value={form.instructorName} onChange={e => set('instructorName', e.target.value)}
                    placeholder="ناوی مامۆستا..." dir="rtl"
                    className="w-full bg-slate-900 border border-slate-700 focus:border-yellow-500/60 outline-none text-white placeholder-slate-600 px-4 py-2.5 rounded-xl text-sm transition" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-1.5">ناوی زانکۆ (ئەگەر هەبوو)</p>
                  <input value={form.universityName} onChange={e => set('universityName', e.target.value)}
                    placeholder="ناوی زانکۆ..." dir="rtl"
                    className="w-full bg-slate-900 border border-slate-700 focus:border-yellow-500/60 outline-none text-white placeholder-slate-600 px-4 py-2.5 rounded-xl text-sm transition" />
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold text-slate-400 mb-1.5">بەروار</p>
                  <input value={form.date} onChange={e => set('date', e.target.value)}
                    placeholder="ببنونیسە... (نمونە: 2025)"
                    className="w-full bg-slate-900 border border-slate-700 focus:border-yellow-500/60 outline-none text-white placeholder-slate-600 px-4 py-2.5 rounded-xl text-sm transition" />
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-semibold text-white mb-3">ئەکسترا زیاد بکە</p>
                <div className="space-y-2">
                  {[
                    { key: 'addonTable',      label: 'خشتە',          icon: '📋', desc: 'زیادکردنی خشتە بە سلایدەکان', cost: 0.5 },
                    { key: 'addonTimeline',   label: 'تایم لاین',     icon: '📅', desc: 'سلایدی تایم لاینی ئەفقی',       cost: 0.5 },
                    { key: 'addonChartExtra', label: 'چارت',           icon: '📈', desc: 'زیادکردنی چارت بە سلایدەکان',  cost: 0.5 },
                    { key: 'addonQuotes',     label: 'وتەی گەورە',    icon: '💬', desc: 'سلایدی وتەی کشیراو',            cost: 0.5 },
                    { key: 'addonComparison', label: 'بەراوردکردن',   icon: '⚖️', desc: 'سلایدی بەراورد',               cost: 0.5 },
                    { key: 'addonCoverPage',  label: 'دیڤایدەر',      icon: '🎯', desc: 'سلایدی جیاکارەوەی بەش',        cost: 0.5 },
                    { key: 'conclusion',      label: 'دەرئەنجام',     icon: '✅', desc: 'سلایدی کۆتایی و پوختە',        cost: 0.5 },
                    { key: 'addonReferences', label: 'سەرچاوەکان',    icon: '📚', desc: 'سلایدی سەرچاوە بە شێوازی APA', cost: 0.5 },
                  ].map(opt => (
                    <motion.button key={opt.key} whileTap={{ scale: 0.98 }}
                      onClick={() => set(opt.key, !form[opt.key])}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition ${
                        form[opt.key] ? 'border-yellow-400 bg-yellow-400/10' : 'border-slate-700 bg-slate-900'
                      }`}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{opt.icon}</span>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${form[opt.key] ? 'text-yellow-400' : 'text-slate-300'}`}>{opt.label}</span>
                            {opt.cost > 0 && <span className="text-xs text-orange-400/80 font-medium">+{opt.cost} خاڵ</span>}
                          </div>
                          <div className="text-xs text-slate-500">{opt.desc}</div>
                        </div>
                      </div>
                      <div className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${form[opt.key] ? 'bg-yellow-400' : 'bg-slate-700'}`}>
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
                    `${form.slides} سلاید`,
                    'English',
                    PRES_STYLES.find(s => s.id === form.presStyle)?.label,
                    COLOR_THEMES.find(t => t.id === form.colorTheme)?.label,
                    DETAIL_LEVELS.find(d => d.id === form.detail)?.label,
                  form.conclusion ? 'دەرئەنجام' : null,
                  form.addonReferences ? 'سەرچاوەکان' : null,
                  ].filter(Boolean).map((tag, i) => (
                    <span key={i} className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 5: Generating / Done ── */}
          {step === 5 && (
            <motion.div key="s5" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="w-full max-w-xl mx-auto px-6 py-10 flex flex-col items-center justify-center min-h-full">
              <GenerateProgress
                formData={buildRequest()}
                onComplete={handleGenerationComplete}
                onReset={resetForm}
              />


            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      {step < 5 && (
        <div className="h-16 border-t border-slate-800 flex items-center justify-between px-6 flex-shrink-0">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/services')}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition px-4 py-2 rounded-lg border border-slate-800 hover:border-slate-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            گەڕانەوە
          </motion.button>

          <div className="flex items-center gap-2">
            {step === 4 && !hasEnoughXal && (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/pricing')}
                className="flex items-center gap-1.5 text-yellow-400 font-bold px-4 py-2.5 rounded-xl text-sm border border-yellow-500/40 bg-yellow-500/10 hover:bg-yellow-500/20 transition">
                خاڵ بکڕە
              </motion.button>
            )}
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
        </div>
      )}
    </div>
  )
}
