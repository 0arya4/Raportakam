import { motion } from 'framer-motion'
import logo from '../assets/logo.png.png'

export default function Preloader({ onDone }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      onAnimationComplete={onDone}
      className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center"
    >
      <div className="relative flex items-center justify-center">
        {/* Outer ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: 2, ease: 'linear' }}
          className="absolute w-24 h-24 rounded-full"
          style={{ border: '2px solid transparent', borderTopColor: '#eab308', borderRightColor: '#eab30840' }}
        />
        {/* Middle ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: 2, ease: 'linear' }}
          className="absolute w-16 h-16 rounded-full"
          style={{ border: '2px solid transparent', borderTopColor: '#eab308', borderLeftColor: '#eab30860' }}
        />
        {/* Logo center */}
        <motion.img
          src={logo}
          alt="logo"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="w-10 h-10 object-contain"
        />
      </div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-1/3 text-slate-500 text-sm tracking-widest"
        onAnimationComplete={() => setTimeout(onDone, 1800)}
      >
        ڕاپۆرتەکەم
      </motion.p>
    </motion.div>
  )
}
