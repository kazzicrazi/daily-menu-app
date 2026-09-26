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
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Today's Canteen Menu</h1>
          <p className="text-slate-600">Freshly prepared meals for {selectedDayObj.fullLabel}</p>
        </header>

        {/* Day Selector Pills with Dates */}
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none justify-start md:justify-center">
          {weekDays.map((day) => (
            <Button
              key={day.dayName}
              variant={selectedDayObj.dayName === day.dayName ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDayObj(day)}
              className="rounded-full px-4 flex-shrink-0"
            >
              <span>{day.dayName}</span>
              <span className="text-xs opacity-75 ml-1.5">({day.formattedDate})</span>
            </Button>
          ))}
        </div>

        {loading ? (
          <p className="text-center py-12 text-slate-500">Loading menu items...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border p-8">
            <p className="text-slate-500 text-lg font-medium">No meals listed for {selectedDayObj.fullLabel}</p>
            <p className="text-slate-400 text-sm mt-1">Select another day to view scheduled meals.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {MEAL_TYPES.map((category) => {
              const categoryItems = items.filter(
                (item) => item.meal_type?.toLowerCase() === category.toLowerCase()
              )

              if (categoryItems.length === 0) return null

              return (
                <section key={category} className="space-y-4">
                  <div className="flex items-center gap-3 border-b pb-2">
                    <h2 className="text-xl font-bold text-slate-800">{category}</h2>
                    <Badge variant="secondary">{categoryItems.length}</Badge>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2">
                    {categoryItems.map((item) => (
                      <Card key={item.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
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
                          <CardTitle className="text-lg font-bold">{item.name}</CardTitle>
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