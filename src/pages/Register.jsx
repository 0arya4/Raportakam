import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.png.png'

const BLOCKED_DOMAINS = new Set([
  'mailinator.com','tempmail.com','guerrillamail.com','10minutemail.com','throwam.com',
  'sharklasers.com','guerrillamailblock.com','grr.la','guerrillamail.info','spam4.me',
  'yopmail.com','yopmail.fr','cool.fr.nf','jetable.fr.nf','nospam.ze.tc','nomail.xl.cx',
  'mega.zik.dj','speed.1s.fr','courriel.fr.nf','moncourrier.fr.nf','monemail.fr.nf',
  'monmail.fr.nf','trashmail.com','trashmail.me','trashmail.net','dispostable.com',
  'mailnull.com','spamgourmet.com','spamgourmet.net','spamgourmet.org','spamgourmet.net',
  'maildrop.cc','spamfree24.org','spamfree.eu','binkmail.com','bob.email','clrmail.com',
  'discard.email','discardmail.com','discardmail.de','fakeinbox.com','filzmail.com',
  'gowikibooks.com','gowikicampus.com','gowikipedia.com','gowikifilms.com','gowikimusic.com',
  'gowikinetwork.com','gowikitravel.com','inboxalias.com','kasmail.com','lol.ovpn.to',
  'mailin8r.com','mailme.lv','mailnew.com','mailscrap.com','mailsiphon.com','mailtemp.info',
  'mailzilla.com','mbx.cc','messagebeamer.de','mobi.web.id','mt2009.com','mx0.wwwnew.eu',
  'mycleaninbox.net','netmails.com','netmails.net','no-spam.ws','nobulk.com',
  'noclickemail.com','nogmailspam.info','nospamfor.us','nospamthanks.info','notmailinator.com',
  'nowmymail.com','oneoffmail.com','onewaymail.com','pjjkp.com','put2.net','reallymymail.com',
  'rtrtr.com','s0ny.net','safe-mail.net','sneakemail.com','sofort-mail.de','spam.la',
  'spamavert.com','spambob.com','spambob.net','spambob.org','spambotshere.com',
  'spamcowboy.com','spamcowboy.net','spamcowboy.org','spamday.com','spamex.com',
  'spamgoes.in','spamhereplease.com','spamhole.com','spamify.com','spaminator.de',
  'spaminmotion.com','spamkill.info','spaml.com','spaml.de','spammotel.com',
  'spamoff.de','spamslicer.com','spamspot.com','spamthis.co.uk','spamthisplease.com',
  'spamtrail.com','supergreatmail.com','suremail.info','tempalias.com','tempe-mail.com',
  'tempemail.biz','tempemail.com','tempemail.net','tempinbox.com','tempinbox.co.uk',
  'tempmail.eu','tempomail.fr','temporaryemail.net','temporaryforwarding.com',
  'temporaryinbox.com','thanksnospam.info','throwam.com','throwaway.email',
  'trbvm.com','uggsrock.com','uroid.com','veryrealemail.com','viditag.com',
  'wegwerfemail.de','wetrainbayarea.com','willhackforfood.biz','willselldrugs.com',
  'wmail.cf','wronghead.com','wuzupmail.net','www.e4ward.com','xagloo.com','xemaps.com',
  'xents.com','xmaily.com','xoxy.net','xyzfree.net','yapped.net','yeah.net',
  'yep.it','youmail.ga','ypmail.webarnak.fr.eu.org','yuoia.com','z1p.biz',
  'zippymail.info','zoemail.org','zomg.info',
  'bpotogo.com','lealking.com','shouxs.com','txcct.com','bheps.com','vomoto.com',
  'voteos.com','byom.de','temp-mail.org','tempmail.org','tmpmail.org',
])

const isDisposable = (email) => {
  const domain = email.split('@')[1]?.toLowerCase()
  return domain ? BLOCKED_DOMAINS.has(domain) : false
}

export default function Register() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('وشەی نهێنییەکان یەک نین')
    if (form.password.length < 6) return setError('کەمەخەم ٦ پیت')
    if (isDisposable(form.email)) return setError('ئیمەیڵی وەرگرتنەوەی کاتی قبووڵ نाکرێت، تکایە ئیمەیڵی ڕەسەن بەکاربهێنە')
    setLoading(true)
    const { error } = await signUp(form.email, form.password, form.fullName)
    setLoading(false)
    if (error) setError(error.message)
    else setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4" dir="rtl">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xs">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-4xl mb-4">📧</motion.div>
          <h2 className="text-xl font-bold text-white mb-2">ئیمەیڵەکەت پشتڕاست بکەوە</h2>
          <p className="text-slate-400 text-xs mb-5 leading-relaxed">
            ئیمەیڵێکمان ناردووە بۆ{' '}
            <span className="text-yellow-400">{form.email}</span>
          </p>
          <Link to="/login">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="bg-yellow-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-yellow-300 transition">
              چوونەژوورەوە ←
            </motion.button>
          </Link>
        </motion.div>
      </div>
    )
  }

  const fields = [
    { key: 'fullName', label: 'ناوی تەواو', type: 'text', placeholder: 'ناوەکەت بنووسە', dir: 'rtl' },
    { key: 'email', label: 'ئیمەیڵ', type: 'email', placeholder: 'name@email.com', dir: 'ltr' },
    { key: 'password', label: 'وشەی نهێنی', type: 'password', placeholder: '••••••••', dir: 'ltr' },
    { key: 'confirm', label: 'دووبارە وشەی نهێنی', type: 'password', placeholder: '••••••••', dir: 'ltr' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4" dir="rtl">

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-400/5 rounded-full blur-3xl" style={{ animation: 'float 7s ease-in-out infinite' }} />
        <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-yellow-500/5 rounded-full blur-2xl" style={{ animation: 'float 5s ease-in-out infinite reverse' }} />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(#eab308 1px, transparent 1px), linear-gradient(90deg, #eab308 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-sm"
      >
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Link to="/" className="flex items-center justify-center gap-2 mb-6">
            <motion.img whileHover={{ rotate: 10, scale: 1.1 }} src={logo} alt="logo" className="w-8 h-8 object-contain" />
            <span className="text-lg font-bold text-white">ڕاپۆرتەکەم</span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-6"
        >
          <h1 className="text-xl font-bold text-white mb-0.5 text-center">ئەکاونت دروست بکە</h1>
          <p className="text-slate-500 text-xs text-center mb-5">بەخۆڕایی دەست پێبکە</p>

          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2.5 rounded-lg mb-3">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {fields.map((f, i) => (
              <motion.div key={f.key}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
              >
                <label className="text-xs text-slate-400 block mb-1">{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  dir={f.dir}
                  required
                  className="w-full bg-slate-800/60 border border-slate-700 focus:border-yellow-500/50 outline-none text-white placeholder-slate-600 px-3 py-2.5 rounded-lg text-sm transition"
                />
              </motion.div>
            ))}

            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              type="submit" disabled={loading}
              className="w-full bg-yellow-400 disabled:opacity-40 text-slate-950 font-bold py-2.5 rounded-lg text-sm hover:bg-yellow-300 transition mt-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full" />
                  چاوەڕێ بکە...
                </>
              ) : 'تۆمارکردن'}
            </motion.button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-slate-600 text-xs">یان</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <p className="text-center text-slate-500 text-xs">
            ئەکاونتت هەیە؟{' '}
            <Link to="/login" className="text-yellow-400 hover:text-yellow-300 transition font-medium">
              چوونەژوورەوە
            </Link>
          </p>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-center text-slate-600 text-xs mt-4">
          بەخۆڕایی دەست پێبکە · کارتی کرێدیت پێویست نییە
        </motion.p>
      </motion.div>
    </div>
  )
}
