"use client"

import React from 'react'
import { TabsContent } from '@/components/ui/tabs'
import { ProfileHeader } from './ProfileHeader'
import { StatsCards } from './StatsCards'
import { RecentActivity } from './RecentActivity'
import { RecentFiles } from './RecentFiles'
import { UserData, ChatSession, UploadedFile } from './types'
import { calculateStats } from './utils'

interface OverviewTabProps {
  userData: UserData
  chatHistory: ChatSession[]
  uploadedFiles: UploadedFile[]
  onFilesReload?: () => Promise<void>
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ userData, chatHistory, uploadedFiles, onFilesReload }) => {
  const stats = calculateStats(chatHistory, uploadedFiles)

  return (
    <TabsContent value="overview" className="space-y-6">
      {/* Profile Card */}
      <ProfileHeader userData={userData} />

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Recent Activity */}
      <RecentActivity chatHistory={chatHistory} limit={5} />

      {/* Recent Files */}
  <RecentFiles uploadedFiles={uploadedFiles} limit={5} onFilesReload={onFilesReload} />
    </TabsContent>
  )
}