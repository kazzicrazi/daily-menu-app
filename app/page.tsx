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
  meal_type?: string
  image_urls?: string[]
}

const DISH_CATEGORIES = ['Local Dish', 'Intercontinental Dish']
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

export default function PublicMenuPage() {
  const supabase = createClient()
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)

  const weekDays = useMemo(() => getWeekDates(weekOffset), [weekOffset])

  const [selectedDayObj, setSelectedDayObj] = useState(() => {
    return weekDays.find((d) => d.isToday) || weekDays[0]
  })

  // Keep selected day updated when changing weeks
  useEffect(() => {
    setSelectedDayObj(weekDays.find((d) => d.isToday) || weekDays[0])
  }, [weekDays])

  const fetchMenu = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('menus')
      .select('*')
      .ilike('day_of_week', selectedDayObj.dayName)

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
    <main className="min-h-screen bg-[#F4F8F6] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="text-center space-y-2 bg-gradient-to-r from-[#00A859] via-[#008F4C] to-[#00A859] text-white p-6 rounded-2xl shadow-lg border-b-4 border-[#002B49]">
          <h1 className="text-3xl font-extrabold tracking-tight">Canteen Daily Menu</h1>
          <p className="text-emerald-100 text-sm font-medium">
            Local & Intercontinental Meals for {selectedDayObj.fullLabel}
          </p>
        </header>

        {/* Week Navigator Controls */}
        <div className="flex items-center justify-between bg-white px-4 py-2 rounded-xl shadow-xs border border-slate-200">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="text-[#002B49] font-bold text-xs"
          >
            ← Prev Week
          </Button>
          <span className="text-xs font-bold text-[#002B49]">
            {weekOffset === 0 ? 'Current Week' : weekOffset === 1 ? 'Next Week' : `Week (+${weekOffset})`}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="text-[#002B49] font-bold text-xs"
          >
            Next Week →
          </Button>
        </div>

        {/* Day Selector Pills */}
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none justify-start md:justify-center">
          {weekDays.map((day) => {
            const isSelected = selectedDayObj.dayName === day.dayName
            return (
              <button
                key={day.dayName}
                onClick={() => setSelectedDayObj(day)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0 ${
                  isSelected
                    ? 'bg-[#002B49] text-white ring-2 ring-[#00A859] shadow-md'
                    : 'bg-white text-[#002B49] hover:bg-emerald-50 border border-slate-200'
                }`}
              >
                <span>{day.dayName}</span>
                <span className={`text-xs ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>
                  ({day.formattedDate})
                </span>
              </button>
            )
          })}
        </div>

        {loading ? (
          <p className="text-center py-12 text-slate-500 font-medium">Loading menu items...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-emerald-100 p-8">
            <p className="text-[#002B49] text-lg font-bold">
              No meals scheduled for {selectedDayObj.fullLabel}
            </p>
            <p className="text-slate-500 text-sm mt-1">Select another day pill above to view scheduled dishes.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {DISH_CATEGORIES.map((category) => {
              const categoryItems = items.filter(
                (item) => item.meal_type?.toLowerCase() === category.toLowerCase()
              )

              if (categoryItems.length === 0) return null

              return (
                <section key={category} className="space-y-4">
                  <div className="flex items-center gap-3 border-b-2 border-[#00A859] pb-2">
                    <h2 className="text-xl font-bold text-[#002B49]">{category}</h2>
                    <Badge className="bg-[#002B49] text-white font-bold px-2.5 py-0.5 rounded-full">
                      {categoryItems.length}
                    </Badge>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2">
                    {categoryItems.map((item) => (
                      <Card key={item.id} className="overflow-hidden shadow-sm border-slate-200 bg-white">
                        {item.image_urls && item.image_urls.length > 0 && (
                          <div
                            className={`grid gap-1 bg-slate-100 ${
                              item.image_urls.length === 1
                                ? 'grid-cols-1 h-48'
                                : item.image_urls.length === 2
                                ? 'grid-cols-2 h-48'
                                : 'grid-cols-3 h-48'
                            }`}
                          >
                            {item.image_urls.map((url, idx) => (
                              <img
                                key={idx}
                                src={url}
                                alt={`${item.name} photo ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ))}
                          </div>
                        )}
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-bold text-[#002B49]">{item.name}</CardTitle>
                        </CardHeader>
                        {item.description && (
                          <CardContent>
                            <p className="text-sm text-slate-600">{item.description}</p>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}