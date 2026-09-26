'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface MenuItem {
  id: string
  name: string
  description?: string
  day_of_week: string
  meal_time?: string
  meal_type?: string
  dish_type?: string
  image_urls?: any
}

const MEAL_TIMES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']
const DISH_TYPES = ['Local Dish', 'Intercontinental Dish']
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function getWeekDates(weekOffset = 0) {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

  const monday = new Date(now)
  monday.setDate(now.getDate() + distanceToMonday + weekOffset * 7)

  return DAYS_OF_WEEK.map((dayName, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })

    return {
      dayName,
      formattedDate,
      fullLabel: `${dayName}, ${formattedDate}`,
      isToday: date.toDateString() === new Date().toDateString(),
    }
  })
}

// Robust image URL extractor
function extractImageUrls(item: MenuItem): string[] {
  const raw = item.image_urls
  if (!raw) return []

  if (Array.isArray(raw)) {
    return raw.map((u) => String(u).trim()).filter(Boolean)
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return parsed.map((u) => String(u).trim()).filter(Boolean)
        }
      } catch (e) {
        // Fallback if parsing fails
      }
    }
    // Handle comma-separated strings or single URLs
    if (trimmed.includes(',')) {
      return trimmed.split(',').map((u) => u.trim()).filter(Boolean)
    }
    return [trimmed]
  }

  return []
}

export default function PublicMenuPage() {
  const supabase = createClient()
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)

  const weekDays = useMemo(() => getWeekDates(weekOffset), [weekOffset])

  const [selectedDayObj, setSelectedDayObj] = useState(() => {
    return weekDays.find((d) => d.isToday) || weekDays[0]
  })

  useEffect(() => {
    setSelectedDayObj(weekDays.find((d) => d.isToday) || weekDays[0])
  }, [weekDays])

  const fetchMenu = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('menus').select('*')

    if (error) {
      console.error('Error loading menu:', error)
    } else if (data) {
      // Filter by current day in JS to prevent casing mismatch issues
      const filtered = data.filter(
        (item) => item.day_of_week?.toLowerCase() === selectedDayObj.dayName.toLowerCase()
      )
      setItems(filtered)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMenu()
  }, [selectedDayObj])

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="text-center space-y-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 text-white p-6 rounded-2xl shadow-lg">
          <h1 className="text-3xl font-extrabold tracking-tight">Canteen Daily Menu</h1>
          <p className="text-emerald-100 text-sm font-medium">
            Daily Menu for {selectedDayObj.fullLabel}
          </p>
        </header>

        {/* Week Navigator */}
        <div className="flex items-center justify-between bg-white px-4 py-2 rounded-xl shadow-xs border border-slate-200">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="text-teal-800 font-bold text-xs"
          >
            ← Prev Week
          </Button>
          <span className="text-xs font-bold text-slate-800">
            {weekOffset === 0 ? 'Current Week' : weekOffset === 1 ? 'Next Week' : `Week (+${weekOffset})`}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="text-teal-800 font-bold text-xs"
          >
            Next Week →
          </Button>
        </div>

        {/* 7-Day Responsive Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
          {weekDays.map((day) => {
            const isSelected = selectedDayObj.dayName === day.dayName
            return (
              <button
                key={day.dayName}
                onClick={() => setSelectedDayObj(day)}
                className={`rounded-xl py-2 px-1 text-center transition-all shadow-xs flex flex-col items-center justify-center ${
                  isSelected
                    ? 'bg-teal-700 text-white ring-2 ring-emerald-500 shadow-md'
                    : 'bg-white text-slate-700 hover:bg-emerald-50 border border-slate-200'
                }`}
              >
                <span className="text-xs font-bold leading-tight">{day.dayName.slice(0, 3)}</span>
                <span className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {day.formattedDate}
                </span>
              </button>
            )
          })}
        </div>

        {loading ? (
          <p className="text-center py-12 text-slate-500 font-medium">Loading menu items...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <p className="text-slate-800 text-lg font-bold">
              No meals scheduled for {selectedDayObj.fullLabel}
            </p>
            <p className="text-slate-500 text-sm mt-1">Select another day above to view dishes.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {MEAL_TIMES.map((mealTime) => {
              const mealTimeItems = items.filter(
                (item) =>
                  (item.meal_time || item.meal_type)?.toLowerCase() === mealTime.toLowerCase()
              )

              if (mealTimeItems.length === 0) return null

              return (
                <section key={mealTime} className="space-y-4">
                  <div className="flex items-center gap-3 border-b-2 border-teal-600 pb-2">
                    <h2 className="text-2xl font-extrabold text-teal-900">{mealTime}</h2>
                    <Badge className="bg-teal-700 text-white font-bold px-2.5 py-0.5 rounded-full">
                      {mealTimeItems.length}
                    </Badge>
                  </div>

                  {DISH_TYPES.map((dishType) => {
                    const dishItems = mealTimeItems.filter(
                      (item) => item.dish_type?.toLowerCase() === dishType.toLowerCase()
                    )

                    if (dishItems.length === 0) return null

                    return (
                      <div key={dishType} className="space-y-3 pl-2">
                        <h3 className="text-base font-bold text-slate-700 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          {dishType}
                        </h3>

                        <div className="grid gap-4 sm:grid-cols-2">
                          {dishItems.map((item) => {
                            const images = extractImageUrls(item)

                            return (
                              <Card key={item.id} className="overflow-hidden shadow-sm border-slate-200 bg-white">
                                {images.length > 0 && (
                                  <div
                                    className={`grid gap-1 bg-slate-100 ${
                                      images.length === 1
                                        ? 'grid-cols-1 h-52'
                                        : images.length === 2
                                        ? 'grid-cols-2 h-52'
                                        : 'grid-cols-3 h-52'
                                    }`}
                                  >
                                    {images.map((url, idx) => (
                                      <img
                                        key={idx}
                                        src={url}
                                        alt={`${item.name} image ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    ))}
                                  </div>
                                )}
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg font-bold text-slate-800">{item.name}</CardTitle>
                                </CardHeader>
                                {item.description && (
                                  <CardContent>
                                    <p className="text-sm text-slate-600">{item.description}</p>
                                  </CardContent>
                                )}
                              </Card>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </section>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}