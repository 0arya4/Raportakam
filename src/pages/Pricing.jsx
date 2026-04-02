import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const plans = [
  {
    id: 'free',
    name: 'بەخۆڕایی',
    price: '٠',
    currency: '',
    period: 'بۆ هەمیشە',
    color: 'border-slate-700',
    highlight: false,
    features: [
      '٣ دروستکردن لە مانگدا',
      'PPTX و Word',
      'تێمای سادە',
      'داگرتنی فایل',
    ],
    missing: [
      'بارکردنی فایل',
      'تێمای پیشەیی',
      'پشتیوانی',
    ],
    btn: 'دەست پێبکە',
    btnStyle: 'border border-slate-600 text-white hover:bg-slate-800',
  },
  {
    id: 'pro',
    name: 'پرۆ',
    price: '٩٩٩',
    currency: 'د.ع',
    period: 'لە مانگدا',
    color: 'border-yellow-400',
    highlight: true,
    badge: 'باشترین',
    features: [
      'دروستکردنی نامحدود',
      'PPTX و Word',
      'هەموو تێماکان',
      'بارکردنی PDF و CSV',
      'پشتیوانی خێرا',
      'داگرتنی فایل',
    ],
    missing: [],
    btn: 'دەستپێبکە',
    btnStyle: 'bg-yellow-400 text-slate-950 font-bold hover:bg-yellow-300 pulse-glow',
  },
  {
    id: 'team',
    name: 'تیم',
    price: '٢٩٩٩',
    currency: 'د.ع',
    period: 'لە مانگدا',
    color: 'border-slate-700',
    highlight: false,
    features: [
      'هەموو تایبەتمەندییەکانی پرۆ',
      'تا ١٠ بەکارهێنەر',
      'داشبۆردی تیم',
      'پشتیوانی ٢٤/٧',
    ],
    missing: [],
    btn: 'پەیوەندی بکەرەوە',
    btnStyle: 'border border-slate-600 text-white hover:bg-slate-800',
  },
]

export default function Pricing() {
  const navigate = useNavigate()

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl font-bold mb-3">نرخەکان</h1>
            <p className="text-slate-400 text-base">پلانی گونجاو بۆ هەر کەسێک</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -6 }}
                className={`relative bg-slate-900 border-2 ${plan.color} rounded-3xl p-8 transition-all ${plan.highlight ? 'scale-105' : ''}`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-950 text-xs font-bold px-4 py-1.5 rounded-full">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    {plan.currency && <span className="text-yellow-400 font-semibold">{plan.currency}</span>}
                  </div>
                  <p className="text-slate-500 text-sm mt-1">{plan.period}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-slate-300">
                      <svg className="w-4 h-4 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                  {plan.missing.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-slate-600 line-through">
                      <svg className="w-4 h-4 text-slate-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/create')}
                  className={`w-full py-3 rounded-xl text-base transition ${plan.btnStyle}`}
                >
                  {plan.btn}
                </motion.button>
              </motion.div>
            ))}
          </div>

          {/* Payment note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 bg-slate-900 border border-yellow-500/20 rounded-2xl p-6 text-center"
          >
            <p className="text-slate-400 text-sm mb-2">دراوسوپاری ئاسانە</p>
            <p className="text-white font-medium">مامەڵەی دراوسوپاری بە رێگای سیستەمی دراوسوپاریی خۆمان دەکرێت</p>
            <div className="flex justify-center gap-4 mt-4">
              <span className="bg-slate-800 border border-slate-700 text-slate-400 text-xs px-4 py-2 rounded-lg">FIB دراوسوپاری</span>
              <span className="bg-slate-800 border border-slate-700 text-slate-400 text-xs px-4 py-2 rounded-lg">NAS دراوسوپاری</span>
              <span className="bg-slate-800 border border-slate-700 text-slate-400 text-xs px-4 py-2 rounded-lg">زانکۆکارد</span>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  )
}
