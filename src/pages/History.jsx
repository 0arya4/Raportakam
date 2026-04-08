import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const API_URL = import.meta.env.VITE_API_URL ?? ''

async function blobDownload(url, fileName) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  } catch {
    window.open(url, '_blank')
  }
}

export default function History() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmId, setConfirmId] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const handleDelete = async (id) => {
    setDeleting(id)
    await supabase.from('generations').delete().eq('id', id)
    setFiles(f => f.filter(x => x.id !== id))
    setConfirmId(null)
    setDeleting(null)
  }

  useEffect(() => {
    if (!user) return
    supabase
      .from('generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setFiles(data || [])
        setLoading(false)
      })
  }, [user])

  const formatDate = (d) => new Date(d).toLocaleDateString('en-GB')

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20 pb-16 px-6 bg-slate-950">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-white">فایلەکانم</h1>
              <p className="text-slate-500 text-sm mt-1">{files.length} فایل</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/create')}
              className="flex items-center gap-2 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm"
              style={{ background: 'linear-gradient(135deg, #eab308, #f97316)' }}
            >
              + دروستکردنی نوێ
            </motion.button>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
            </div>
          ) : files.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <div className="text-5xl mb-4">📂</div>
              <p className="text-slate-400 text-base mb-2">هیچ فایلێکت نییە</p>
              <p className="text-slate-600 text-sm">یەکەم فایلەکەت دروست بکە</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {files.map((f, i) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -3 }}
                  className="bg-slate-900 border border-slate-800 hover:border-yellow-500/30 rounded-2xl p-5 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-yellow-400/10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
                        {f.output_type === 'pptx' ? '📊' : '📄'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{f.file_name || 'بێ ناو'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{f.output_type === 'pptx' ? 'PowerPoint' : 'Word'} · {formatDate(f.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Download */}
                      <motion.button
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                        disabled={!f.file_url}
                        onClick={() => {
                          if (!f.file_url) return
                          const fullUrl = f.file_url.startsWith('/')
                            ? `${API_URL}${f.file_url}?name=${encodeURIComponent(f.file_name || 'raportakam')}`
                            : f.file_url
                          blobDownload(fullUrl, `${f.file_name || 'raportakam'}.pptx`)
                        }}
                        className="w-8 h-8 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 rounded-lg flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </motion.button>

                      {/* Delete */}
                      {confirmId === f.id ? (
                        <div className="flex items-center gap-1">
                          <motion.button
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDelete(f.id)}
                            disabled={deleting === f.id}
                            className="text-xs bg-red-500 hover:bg-red-400 text-white px-2 py-1 rounded-lg transition disabled:opacity-50"
                          >
                            {deleting === f.id ? '...' : 'بەڵێ'}
                          </motion.button>
                          <motion.button
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setConfirmId(null)}
                            className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded-lg transition"
                          >
                            نەخێر
                          </motion.button>
                        </div>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setConfirmId(f.id)}
                          className="w-8 h-8 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg flex items-center justify-center transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </motion.button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-3 line-clamp-2 text-right">{f.prompt}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
