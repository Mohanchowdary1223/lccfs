"use client"

import React from "react"
import { motion } from "framer-motion"
import { Scale, Gavel, FileText } from "lucide-react"

export const EmptyState: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
      className="flex h-full items-center justify-center"
    >
      <div className="max-w-md text-center">
        <motion.div
          animate={{ 
            rotate: [0, -10, 10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            repeat: Infinity,
            duration: 4,
            ease: "easeInOut"
          }}
        >
          <div className="flex items-center justify-center mb-4">
            <Scale className="h-12 w-12 text-muted-foreground mr-2" />
            <Gavel className="h-10 w-10 text-muted-foreground" />
            <FileText className="h-8 w-8 text-muted-foreground ml-2" />
          </div>
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-2 text-xl font-semibold"
        >
          Legal Compliance Assistant
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-4 text-muted-foreground"
        >
          Get expert guidance on startup legal compliance matters
        </motion.p>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-muted-foreground"
        >
          Ask about incorporation, contracts, IP, employment law, and more
        </motion.p>
      </div>
    </motion.div>
  )
}
