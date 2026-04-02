import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import logo from '../assets/logo.png.png'

export default function Footer() {
  return (
    <footer className="py-10 px-6 border-t border-slate-800/60 bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 80% at 50% 100%, rgba(234,179,8,0.04) 0%, transparent 70%)'
      }} />
      <div className="max-w-5xl mx-auto relative flex flex-col md:flex-row items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <motion.img whileHover={{ rotate: 10, scale: 1.1 }} src={logo} alt="logo" className="w-7 h-7 object-contain" />
          <span className="font-black text-white">ڕاپۆرتەکەم</span>
        </Link>
        <div className="flex gap-5 text-xs text-slate-500">
          <Link to="/pricing" className="hover:text-yellow-400 transition">نرخەکان</Link>
          <a href="#features" className="hover:text-yellow-400 transition">تایبەتمەندییەکان</a>
          <a href="#how" className="hover:text-yellow-400 transition">چۆن کاردەکات</a>
        </div>
        <p className="text-xs text-slate-700">© ٢٠٢٦ ڕاپۆرتەکەم</p>
      </div>
    </footer>
  )
}
