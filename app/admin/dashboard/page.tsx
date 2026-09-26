'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface MenuItem {
  id: string
  name: string
  description?: string
  day_of_week: string
  meal_time?: string
  meal_type?: string
  dish_type?: string
  image_urls?: string[]
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

export default function AdminDashboard() {
  const supabase = createClient()
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)

  // Form State
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('Monday')
  const [mealTime, setMealTime] = useState('Breakfast')
  const [dishType, setDishType] = useState('Local Dish')
  const [files, setFiles] = useState<FileList | null>(null)
  const [uploading, setUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const weekDays = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const [publicUrl, setPublicUrl] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPublicUrl(`${window.location.origin}`)
    }
  }, [])

  const fetchItems = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('menus').select('*')
    if (error) console.error('Error fetching items:', error)
    else if (data) setItems(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const resetForm = () => {
    setName('')
    setDescription('')
    setDayOfWeek('Monday')
    setMealTime('Breakfast')
    setDishType('Local Dish')
    setFiles(null)
    setEditingItem(null)
    setErrorMessage('')
  }

  const handleOpenModal = (item?: MenuItem, defaultDay?: string) => {
    if (item) {
      setEditingItem(item)
      setName(item.name)
      setDescription(item.description || '')
      setDayOfWeek(item.day_of_week)
      setMealTime(item.meal_time || item.meal_type || 'Breakfast')
      setDishType(item.dish_type || 'Local Dish')
    } else {
      resetForm()
      if (defaultDay) setDayOfWeek(defaultDay)
    }
    setOpen(true)
  }

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setUploading(true)
  setErrorMessage('')

  let imageUrls: string[] = editingItem?.image_urls || []

  if (files && files.length > 0) {
    const uploadedUrls: string[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`

      // Upload file to bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        setErrorMessage(`Image upload failed: ${uploadError.message}`)
        setUploading(false)
        return
      }

      // Get direct public URL
      const { data: publicUrlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName)

      if (publicUrlData?.publicUrl) {
        uploadedUrls.push(publicUrlData.publicUrl)
      }
    }

    if (uploadedUrls.length > 0) {
      imageUrls = [...imageUrls, ...uploadedUrls]
    }
  }

  const payload = {
    name,
    description,
    day_of_week: dayOfWeek,
    meal_time: mealTime,
    meal_type: mealTime,
    dish_type: dishType,
    image_urls: imageUrls,
  }

  if (editingItem) {
    const { error } = await supabase.from('menus').update(payload).eq('id', editingItem.id)
    if (error) {
      setErrorMessage(error.message)
      setUploading(false)
      return
    }
  } else {
    const { error } = await supabase.from('menus').insert([payload])
    if (error) {
      setErrorMessage(error.message)
      setUploading(false)
      return
    }
  }

  setUploading(false)
  setOpen(false)
  resetForm()
  fetchItems()
}

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return
    await supabase.from('menus').delete().eq('id', id)
    fetchItems()
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    publicUrl || 'https://canteen.domain.com'
  )}`

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Gradient Header */}
        <header className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 text-white p-6 rounded-2xl shadow-lg gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Admin Canteen Dashboard</h1>
            <p className="text-emerald-100 text-sm mt-1">Manage weekly meal menus, photos, and dish categories</p>
          </div>

          <Button
            onClick={() => handleOpenModal()}
            className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-5 py-2 rounded-xl shadow-md"
          >
            + Add New Meal
          </Button>
        </header>

        {/* QR Code Card */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold mb-1">
                Public Menu Access
              </Badge>
              <h2 className="text-xl font-bold text-slate-800">Canteen QR Code</h2>
              <p className="text-slate-600 text-sm max-w-md">
                Staff can scan this QR code to instantly view today's meal schedule. You can download or print this anytime.
              </p>
              <p className="text-xs text-slate-400 font-mono">{publicUrl || 'Loading URL...'}</p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                <img src={qrCodeUrl} alt="Canteen Menu QR Code" className="w-36 h-36" />
              </div>
              <a
                href={qrCodeUrl}
                download="Canteen_Menu_QR.png"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-teal-700 hover:underline"
              >
                Download QR Code Image
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Week Navigator */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <Button
            variant="outline"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="border-slate-300 text-slate-700 font-bold"
          >
            ← Previous Week
          </Button>
          <div className="text-center">
            <span className="text-sm font-bold text-slate-800">
              {weekOffset === 0
                ? 'Current Week'
                : weekOffset === 1
                ? 'Next Week'
                : weekOffset > 1
                ? `${weekOffset} Weeks Ahead`
                : `${Math.abs(weekOffset)} Weeks Ago`}
            </span>
            <p className="text-xs text-slate-500">
              {weekDays[0].formattedDate} – {weekDays[6].formattedDate}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="border-slate-300 text-slate-700 font-bold"
          >
            Next Week →
          </Button>
        </div>

        {/* Days of Week Overview */}
        {loading ? (
          <p className="text-center py-12 text-slate-500 font-medium">Loading schedule...</p>
        ) : (
          <div className="space-y-8">
            {weekDays.map((day) => {
              const dayItems = items.filter(
                (item) => item.day_of_week?.toLowerCase() === day.dayName.toLowerCase()
              )

              return (
                <Card key={day.dayName} className="border-slate-200 bg-white shadow-sm overflow-hidden">
                  <CardHeader className="bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between py-3">
                    <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <span>{day.fullLabel}</span>
                      {day.isToday && <Badge className="bg-emerald-600 text-white text-xs">Today</Badge>}
                    </CardTitle>
                    <Button
                      size="sm"
                      onClick={() => handleOpenModal(undefined, day.dayName)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                    >
                      + Add to {day.dayName}
                    </Button>
                  </CardHeader>

                 <CardContent className="p-4 space-y-6">
  {dayItems.length === 0 ? (
    <p className="text-slate-400 text-sm italic py-2">No meals assigned for this day.</p>
  ) : (
    MEAL_TIMES.map((mealTime) => {
      const mealTimeItems = dayItems.filter(
        (i) => (i.meal_time || i.meal_type)?.toLowerCase() === mealTime.toLowerCase()
      )

      if (mealTimeItems.length === 0) return null

      return (
        <div key={mealTime} className="space-y-4">
          <h3 className="text-base font-bold text-teal-800 border-b border-teal-100 pb-1">
            {mealTime}
          </h3>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {mealTimeItems.map((item) => (
              <div
                key={item.id}
                className="border border-slate-200 rounded-lg p-3 bg-slate-50 flex flex-col justify-between space-y-2"
              >
                <div>
                  {item.dish_type && (
                    <Badge variant="outline" className="text-[10px] font-semibold text-slate-600 bg-slate-100 mb-2">
                      {item.dish_type}
                    </Badge>
                  )}
                  {item.image_urls && item.image_urls.length > 0 && (
                    <div className="flex gap-1 overflow-x-auto mb-2 h-24 rounded-md overflow-hidden">
                      {item.image_urls.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-sm"
                        />
                      ))}
                    </div>
                  )}
                  <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                  {item.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenModal(item)}
                    className="text-xs h-7 border-slate-300 text-slate-700"
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(item.id)}
                    className="text-xs h-7 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    })
  )}
</CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Wider, Solid Dark Modal */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="bg-slate-900 text-white border border-slate-700 shadow-2xl rounded-2xl w-full max-w-2xl sm:max-w-3xl p-6 sm:p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">
                {editingItem ? 'Edit Meal Entry' : 'Add New Meal Entry'}
              </DialogTitle>
            </DialogHeader>

            {errorMessage && (
              <div className="p-3 bg-red-900/80 border border-red-500 rounded-lg text-red-200 text-sm font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 mt-2">
              <div>
                <label className="text-xs font-bold text-slate-300">Meal Name</label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jollof Rice & Fried Chicken"
                  className="bg-slate-800 border-slate-700 text-white mt-1 h-11 placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details or side dishes..."
                  className="bg-slate-800 border-slate-700 text-white mt-1 min-h-[90px] placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300">Day of Week</label>
                  <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day} value={day} className="focus:bg-slate-800 focus:text-white">
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">Meal Time</label>
                  <Select value={mealTime} onValueChange={setMealTime}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      {MEAL_TIMES.map((time) => (
                        <SelectItem key={time} value={time} className="focus:bg-slate-800 focus:text-white">
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">Dish Type</label>
                  <Select value={dishType} onValueChange={setDishType}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      {DISH_TYPES.map((type) => (
                        <SelectItem key={type} value={type} className="focus:bg-slate-800 focus:text-white">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Meal Photos (Multiple Allowed)</label>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setFiles(e.target.files)}
                  className="bg-slate-800 border-slate-700 text-white mt-1 file:bg-slate-700 file:text-white file:border-0 file:rounded-md file:px-3 file:py-1.5 file:mr-3"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={uploading}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6"
                >
                  {uploading ? 'Saving Meal...' : editingItem ? 'Save Changes' : 'Add Meal'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}