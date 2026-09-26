'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface MenuItem {
  id: string
  name: string
  description?: string
  day_of_week: string
  meal_type?: string
  image_urls?: string[]
}

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']

function getCurrentWeekDates() {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

  const monday = new Date(now)
  monday.setDate(now.getDate() + distanceToMonday)

  const daysName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return daysName.map((dayName, index) => {
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
      isToday: date.toDateString() === now.toDateString(),
    }
  })
}

export default function PublicMenuPage() {
  const supabase = createClient()
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  const weekDays = useMemo(() => getCurrentWeekDates(), [])

  const [selectedDayObj, setSelectedDayObj] = useState(() => {
    return weekDays.find((d) => d.isToday) || weekDays[0]
  })

  const fetchMenu = async () => {
    setLoading(true)

    // Fetch items matching the selected day (case-insensitive search)
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

  // Get items that don't match standard Breakfast/Lunch/Dinner/Snacks categories
  const uncategorizedItems = items.filter(
    (item) =>
      !item.meal_type ||
      !MEAL_TYPES.some((cat) => cat.toLowerCase() === item.meal_type?.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
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

        {loading ? (
          <p className="text-center py-12 text-slate-500 font-medium">Loading menu items...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <p className="text-slate-600 text-lg font-bold">No meals scheduled for {selectedDayObj.fullLabel}</p>
            <p className="text-slate-400 text-sm mt-1">Select another day pill above to view items for that day.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Standard Categories */}
            {MEAL_TYPES.map((category) => {
              const categoryItems = items.filter(
                (item) => item.meal_type?.toLowerCase() === category.toLowerCase()
              )

              if (categoryItems.length === 0) return null

              return (
                <section key={category} className="space-y-4">
                  <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-2">
                    <h2 className="text-xl font-bold text-blue-900">{category}</h2>
                    <Badge className="bg-blue-800 hover:bg-blue-900">{categoryItems.length}</Badge>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2">
                    {categoryItems.map((item) => (
                      <Card key={item.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow border-slate-200">
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
                          <CardTitle className="text-lg font-bold text-slate-800">{item.name}</CardTitle>
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

            {/* Uncategorized or Legacy Items */}
            {uncategorizedItems.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-2">
                  <h2 className="text-xl font-bold text-blue-900">General Menu</h2>
                  <Badge className="bg-slate-600">{uncategorizedItems.length}</Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2">
                  {uncategorizedItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow border-slate-200">
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
                        <CardTitle className="text-lg font-bold text-slate-800">{item.name}</CardTitle>
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
            )}
          </div>
        )}
      </div>
    </main>
  )
}