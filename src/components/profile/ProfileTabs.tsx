"use client"

import React from 'react'
import { User, Settings, Activity, Shield } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileTabsProps } from './types'

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      value: "overview",
      icon: User,
      label: "Overview"
    },
    {
      value: "profile", 
      icon: Settings,
      label: "Profile"
    },
    {
      value: "activity",
      icon: Activity, 
      label: "Activity"
    },
    {
      value: "security",
      icon: Shield,
      label: "Security"
    }
  ]

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
      <TabsList className="grid grid-cols-4 w-full">
        {tabs.map((tab) => (
          <TabsTrigger 
            key={tab.value} 
            value={tab.value} 
            className="flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4"
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline text-xs sm:text-sm">{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}