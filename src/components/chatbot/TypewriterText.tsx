"use client"

import React, { useState, useEffect } from "react"
import ReactMarkdown from 'react-markdown'
import { motion } from "framer-motion"

interface TypewriterTextProps {
  text: string
  onComplete?: () => void
  isActive?: boolean
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({ 
  text, 
  onComplete, 
  isActive = true 
}) => {
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!isActive) {
      setDisplayedText(text)
      return
    }

    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, 1)

      return () => clearTimeout(timer)
    } else if (onComplete) {
      onComplete()
    }
  }, [currentIndex, text, onComplete, isActive])

  useEffect(() => {
    if (isActive) {
      setDisplayedText("")
      setCurrentIndex(0)
    }
  }, [text, isActive])

  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed break-words hyphens-auto">
      <ReactMarkdown 
        components={{
          strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic text-amber-600 dark:text-amber-400">{children}</em>,
          p: ({ children }) => <p className="mb-2">{children}</p>,
          ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
        }}
      >
        {displayedText}
      </ReactMarkdown>
      {isActive && currentIndex < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="inline-block w-2 h-4 bg-current ml-1"
        />
      )}
    </div>
  )
}
