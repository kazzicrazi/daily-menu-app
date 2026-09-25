'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Menu {
  id: string
  date: string
  breakfast: string
  lunch: string
  dinner: string
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'none'

export default function Home() {
  const [menu, setMenu] = useState<Menu | null>(null)
  const [activeMeal, setActiveMeal] = useState<MealType>('none')
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 11) setActiveMeal('breakfast')
    else if (hour >= 11 && hour < 16) setActiveMeal('lunch')
    else if (hour >= 16 && hour < 22) setActiveMeal('dinner')
    else setActiveMeal('none')

    async function fetchTodayMenu() {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase.from('menus').select('*').eq('date', today).single()
      if (data) setMenu(data)
      setLoading(false)
    }

    fetchTodayMenu()
  }, [])

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading today's menu...</div>
  }

  return (
    <main className="container mx-auto max-w-3xl p-6">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Today's Menu</h1>
      <p className="mb-8 text-muted-foreground">
        {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      {!menu ? (
        <p className="text-muted-foreground">No menu available for today.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className={activeMeal === 'breakfast' ? 'ring-2 ring-primary shadow-lg' : ''}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Breakfast</CardTitle>
              {activeMeal === 'breakfast' && <Badge>Active Now</Badge>}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{menu.breakfast || 'Not specified'}</p>
            </CardContent>
          </Card>

          <Card className={activeMeal === 'lunch' ? 'ring-2 ring-primary shadow-lg' : ''}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Lunch</CardTitle>
              {activeMeal === 'lunch' && <Badge>Active Now</Badge>}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{menu.lunch || 'Not specified'}</p>
            </CardContent>
          </Card>

          <Card className={activeMeal === 'dinner' ? 'ring-2 ring-primary shadow-lg' : ''}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Dinner</CardTitle>
              {activeMeal === 'dinner' && <Badge>Active Now</Badge>}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{menu.dinner || 'Not specified'}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}