"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react'

export type SuccessMessageType = 'success' | 'error' | 'warning' | 'info'

interface SuccessMessageProps {
  show: boolean
  message: string
  type?: SuccessMessageType
  autoHideDuration?: number
  onClose?: () => void
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center'
}

const icons = {
  success: CheckCircle,
  error: X,
  warning: AlertCircle,
  info: Info,
}

const colors = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-yellow-500 text-black',
  info: 'bg-blue-500 text-white',
}

const positions = {
  'top-right': 'top-20 right-4',
  'top-center': 'top-20 left-1/2 transform -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
  'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  show,
  message,
  type = 'success',
  autoHideDuration = 3000,
  onClose,
  position = 'top-right'
}) => {
  React.useEffect(() => {
    if (show && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        onClose?.()
      }, autoHideDuration)
      return () => clearTimeout(timer)
    }
  }, [show, autoHideDuration, onClose])

  const Icon = icons[type]

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`fixed ${positions[position]} z-[60] rounded-md px-4 py-2 shadow-lg flex items-center gap-2 ${colors[type]} max-w-sm`}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{message}</span>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook for easy usage
export const useSuccessMessage = () => {
  const [state, setState] = React.useState<{
    show: boolean
    message: string
    type: SuccessMessageType
  }>({
    show: false,
    message: '',
    type: 'success'
  })

  const showMessage = React.useCallback((
    message: string, 
    type: SuccessMessageType = 'success'
  ) => {
    setState({ show: true, message, type })
  }, [])

  const hideMessage = React.useCallback(() => {
    setState(prev => ({ ...prev, show: false }))
  }, [])

  return {
    ...state,
    showMessage,
    hideMessage
  }
}

export default SuccessMessage