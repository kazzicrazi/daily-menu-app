'use client'

import { useState, useEffect } from 'react'
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
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']

export default function PublicMenuPage() {
  const supabase = createClient()
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  // Default to Monday
  const [selectedDay, setSelectedDay] = useState('Monday')

  const fetchMenu = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('menus')
      .select('*')
      .eq('day_of_week', selectedDay)

    if (error) {
      console.error('Error loading menu:', error)
    } else if (data) {
      setItems(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMenu()
  }, [selectedDay])

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Today's Canteen Menu</h1>
          <p className="text-slate-600">Freshly prepared daily meals</p>
        </header>

        {/* Day Selector Pills */}
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none justify-start md:justify-center">
          {DAYS.map((day) => (
            <Button
              key={day}
              variant={selectedDay === day ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDay(day)}
              className="rounded-full"
            >
              {day}
            </Button>
          ))}
        </div>

        {loading ? (
          <p className="text-center py-12 text-slate-500">Loading menu items...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border p-8">
            <p className="text-slate-500 text-lg font-medium">No meals listed for {selectedDay}</p>
            <p className="text-slate-400 text-sm mt-1">Select another day to view scheduled meals.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {MEAL_TYPES.map((category) => {
              // Filter items for the specific category (case-insensitive)
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

                  <div className="grid gap-4 md:grid-cols-2">
                    {categoryItems.map((item) => (
                      <Card key={item.id} className="shadow-sm hover:shadow-md transition-shadow">
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