"use client"

import React from "react"
import { motion } from "framer-motion"
import { Scale,  FileText, ShieldUser } from "lucide-react"

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
            <ShieldUser className="h-12 w-12 text-muted-foreground" />
            <Scale className="h-16 w-16 text-muted-foreground" />
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-2 text-xl font-semibold"
        >
          Legal Compliance Assistant for Startups
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-4 text-muted-foreground"
        >
          Get expert guidance on legal compliance matters for your startup
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-muted-foreground space-y-2"
        >
          <p className="font-medium">I can help you with:</p>
          <div className="text-left space-y-1">
            <p>• Business formation (LLC, Corporation, Partnership)</p>
            <p>• Intellectual property & trademarks</p>
            <p>• Employment law & HR compliance</p>
            <p>• Contracts & legal agreements</p>
            <p>• Privacy policies & data protection</p>
            <p>• Securities law & fundraising</p>
            <p>• Regulatory compliance & licensing</p>
          </div>
          <p className="text-xs italic mt-3">
            📄 Upload legal documents for analysis and review
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}
