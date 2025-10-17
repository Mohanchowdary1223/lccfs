"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'

type Toast = { id: string; message: string; type?: 'success' | 'error'; icon?: React.ReactNode }

const ToastContext = createContext<{
  push: (m: string, t?: Toast['type'], icon?: React.ReactNode) => void
}>({ push: () => { } })

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((message: string, type: Toast['type'] = 'success', icon?: React.ReactNode) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setToasts((s) => [...s, { id, message, type, icon }])
    setTimeout(() => setToasts((s) => s.filter(t => t.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div aria-live="polite" className="fixed top-6 right-6 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`max-w-sm px-4 py-2 rounded shadow-lg text-sm flex items-center gap-2 ${t.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
            {t.icon && <span className="mr-2">{t.icon}</span>}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

export default ToastProvider
