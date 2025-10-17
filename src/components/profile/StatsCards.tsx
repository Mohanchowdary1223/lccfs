"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, FileText, BarChart3, Upload } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ChatStats } from './types'

interface StatsCardsProps {
  stats: ChatStats
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.2 + (index * 0.1) }
    })
  }

  // Every description here: 3 words for balance
  const statsData = [
    {
      title: "Total Chats",
      value: stats.totalChats,
      description: "Legal compliance conversations",
      icon: MessageCircle
    },
    {
      title: "Total Messages",
      value: stats.totalMessages,
      description: "Total messages exchanged",
      icon: FileText
    },
    {
      title: "Uploaded Files",
      value: stats.totalFiles,
      description: "Total Documents uploaded",
      icon: Upload
    },
    {
      title: "Avg. Messages",
      value: stats.avgMessagesPerChat,
      description: "Average conversation count",
      icon: BarChart3
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {statsData.map((stat, index) => (
        <motion.div
          key={stat.title}
          custom={index}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card className="min-h-[140px] flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
