'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client' // Adjust import path to your Supabase client helper
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
]

interface MenuItem {
  id: string
  day_of_week: string
  meal_type: string
  name: string
  description?: string
  price?: number
}

export default function HomePage() {
  const [selectedDay, setSelectedDay] = useState<string>('Monday')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const supabase = createClient()

  // Automatically select current day of the week on initial mount
  useEffect(() => {
    const todayIndex = new Date().getDay()
    // Map JS Sunday (0) -> index 6, Monday (1) -> index 0
    const dayName = DAYS_OF_WEEK[todayIndex === 0 ? 6 : todayIndex - 1]
    setSelectedDay(dayName)
  }, [])

  // Fetch menu whenever selectedDay changes
  useEffect(() => {
    async function fetchMenu() {
      setLoading(true)
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .eq('day_of_week', selectedDay)

      if (!error && data) {
        setMenuItems(data)
      } else {
        setMenuItems([])
      }
      setLoading(false)
    }

    fetchMenu()
  }, [selectedDay, supabase])

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <header className="text-center space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Daily Canteen Menu</h1>
          <p className="text-sm text-slate-500">Select a day to view scheduled meals</p>
        </header>

        {/* Horizontal Day Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {DAYS_OF_WEEK.map((day) => {
            const isActive = selectedDay === day
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border'
                }`}
              >
                {day}
              </button>
            )
          })}
        </div>

        {/* Menu Items List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-lg font-semibold text-slate-800">{selectedDay}&apos;s Special</h2>
            <Badge variant="outline">{menuItems.length} Items</Badge>
          </div>

          {loading ? (
            <p className="text-center py-8 text-sm text-slate-500">Loading menu...</p>
          ) : menuItems.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                No menu items uploaded for {selectedDay} yet.
              </CardContent>
            </Card>
          ) : (
            menuItems.map((item) => (
              <Card key={item.id} className="shadow-sm">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-medium">{item.name}</CardTitle>
                    {item.price && (
                      <span className="font-semibold text-slate-900">
                        ₦{item.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {item.meal_type && (
                    <CardDescription className="text-xs capitalize">{item.meal_type}</CardDescription>
                  )}
                </CardHeader>
                {item.description && (
                  <CardContent className="p-4 pt-0 text-sm text-slate-600">
                    {item.description}
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </main>
  )
}