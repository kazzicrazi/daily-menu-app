'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface MenuItem {
  id: string
  name: string
  description: string
  day_of_week: string
  meal_type: string
  image_urls?: string[]
}

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']

// Helper function to calculate Monday - Sunday dates for the current week
function getCurrentWeekDates() {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, ...
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

  const monday = new Date(now)
  monday.setDate(now.getDate() + distanceToMonday)

  const daysName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return daysName.map((dayName, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    
    // Format date like "Sep 28"
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })

    return {
      dayName,
      formattedDate,
      fullLabel: `${dayName}, ${formattedDate}`,
      isToday: date.toDateString() === now.toDateString(),
    }
  })
}

export default function PublicMenuPage() {
  const supabase = createClient()
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  const weekDays = useMemo(() => getCurrentWeekDates(), [])

  // Default to today's day item
  const [selectedDayObj, setSelectedDayObj] = useState(() => {
    return weekDays.find((d) => d.isToday) || weekDays[0]
  })

  const fetchMenu = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('menus')
      .select('*')
      .eq('day_of_week', selectedDayObj.dayName)

    if (error) {
      console.error('Error loading menu:', error)
    } else if (data) {
      setItems(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMenu()
  }, [selectedDayObj])

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
  <div className="max-w-4xl mx-auto space-y-8">
    {/* C++ Branded Blue Header */}
    <header className="text-center space-y-2 bg-gradient-to-r from-blue-950 via-blue-800 to-blue-950 text-white p-6 rounded-2xl shadow-md border-b-4 border-blue-400">
      <h1 className="text-3xl font-extrabold tracking-tight">Today's Canteen Menu</h1>
      <p className="text-blue-100 text-sm">Freshly prepared daily meals for {selectedDayObj.fullLabel}</p>
    </header>
    
    {/* Day Selector Pills */}
    <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none justify-start md:justify-center">
      {weekDays.map((day) => {
        const isSelected = selectedDayObj.dayName === day.dayName
        return (
          <button
            key={day.dayName}
            onClick={() => setSelectedDayObj(day)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0 ${
              isSelected
                ? 'bg-blue-800 text-white ring-2 ring-blue-400 shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <span>{day.dayName}</span>
            <span className={`text-xs ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
              ({day.formattedDate})
            </span>
          </button>
        )
      })}
    </div>
  </div>
</main>
  )
}