"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { UserData } from './types'

interface ProfileHeaderProps {
  userData: UserData
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ userData }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
              <AvatarFallback className="text-xl sm:text-2xl font-bold bg-primary text-primary-foreground">
                {userData.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <CardTitle className="text-xl sm:text-2xl">{userData.name}</CardTitle>
              <CardDescription className="text-base sm:text-lg break-all">{userData.email}</CardDescription>
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start mt-2 space-y-2 sm:space-y-0 sm:space-x-4">
                <Badge variant={userData.role === 'admin' ? 'default' : 'secondary'}>
                  {userData.role === 'admin' ? 'Admin' : 'User'}
                </Badge>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Joined </span>
                  {new Date(userData.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}, {new Date(userData.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>
    </motion.div>
  )
}