import { useState, useRef, useEffect } from 'react'

export default function InfoButton({ text }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded transition"
      >
        زانین
      </button>
      {open && (
        <div className="absolute z-50 bottom-full mb-2 right-0 w-56 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg p-3 shadow-xl">
          {text}
        </div>
      )}
    </div>
  )
}
