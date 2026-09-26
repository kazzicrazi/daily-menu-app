'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
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

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Snacks']

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
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const supabase = createClient()

  // Auto-detect current day of week
  useEffect(() => {
    const todayIndex = new Date().getDay()
    const dayName = DAYS_OF_WEEK[todayIndex === 0 ? 6 : todayIndex - 1]
    setSelectedDay(dayName)
  }, [])

  // Fetch menu for the selected day
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

  // Filter items dynamically based on selected category
  const filteredMenuItems = useMemo(() => {
    if (selectedCategory === 'All') return menuItems
    return menuItems.filter(
      (item) => item.meal_type?.toLowerCase() === selectedCategory.toLowerCase()
    )
  }, [menuItems, selectedCategory])

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <header className="text-center space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Daily Canteen Menu</h1>
          <p className="text-sm text-slate-500">Select a day and meal category to preview items</p>
        </header>

        {/* Day Selector */}
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

        {/* Category Filter Pills */}
        <div className="flex items-center justify-center gap-2">
          {CATEGORIES.map((category) => {
            const isActive = selectedCategory === category
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {category}
              </button>
            )
          })}
        </div>

        {/* Menu Items List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-lg font-semibold text-slate-800">
              {selectedDay}&apos;s {selectedCategory !== 'All' ? selectedCategory : 'Menu'}
            </h2>
            <Badge variant="outline">{filteredMenuItems.length} Items</Badge>
          </div>

          {loading ? (
            <p className="text-center py-8 text-sm text-slate-500">Loading menu...</p>
          ) : filteredMenuItems.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                No {selectedCategory !== 'All' ? selectedCategory.toLowerCase() : ''} items available for {selectedDay}.
              </CardContent>
            </Card>
          ) : (
            filteredMenuItems.map((item) => (
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