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
  DialogTrigger,
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
  const [mealType, setMealType] = useState('Local Dish')
  const [files, setFiles] = useState<FileList | null>(null)
  const [uploading, setUploading] = useState(false)

  const weekDays = useMemo(() => getWeekDates(weekOffset), [weekOffset])

  const fetchItems = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('menus').select('*')
    if (error) {
      console.error('Error fetching items:', error)
    } else if (data) {
      setItems(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const resetForm = () => {
    setName('')
    setDescription('')
    setDayOfWeek('Monday')
    setMealType('Local Dish')
    setFiles(null)
    setEditingItem(null)
  }

  const handleOpenModal = (item?: MenuItem, defaultDay?: string) => {
    if (item) {
      setEditingItem(item)
      setName(item.name)
      setDescription(item.description || '')
      setDayOfWeek(item.day_of_week)
      setMealType(item.meal_type || 'Local Dish')
    } else {
      resetForm()
      if (defaultDay) setDayOfWeek(defaultDay)
    }
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    let imageUrls: string[] = editingItem?.image_urls || []

    // Upload new files if selected
    if (files && files.length > 0) {
      const uploadedUrls: string[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Image upload failed:', uploadError)
        } else {
          const { data } = supabase.storage.from('menu-images').getPublicUrl(filePath)
          if (data?.publicUrl) uploadedUrls.push(data.publicUrl)
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
      meal_type: mealType,
      image_urls: imageUrls,
    }

    if (editingItem) {
      const { error } = await supabase.from('menus').update(payload).eq('id', editingItem.id)
      if (error) console.error('Error updating meal:', error)
    } else {
      const { error } = await supabase.from('menus').insert([payload])
      if (error) console.error('Error adding meal:', error)
    }

    setUploading(false)
    setOpen(false)
    resetForm()
    fetchItems()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return
    const { error } = await supabase.from('menus').delete().eq('id', id)
    if (error) console.error('Error deleting item:', error)
    else fetchItems()
  }

  return (
    <main className="min-h-screen bg-[#F4F8F6] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-[#00A859] to-[#008F4C] text-white p-6 rounded-2xl shadow-md border-b-4 border-[#002B49] gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">Admin Canteen Dashboard</h1>
            <p className="text-emerald-100 text-sm mt-1">Manage daily Local and Intercontinental menus</p>
          </div>

          <Button
            onClick={() => handleOpenModal()}
            className="bg-[#002B49] hover:bg-[#001D33] text-white font-bold px-5 py-2 rounded-xl shadow-md"
          >
            + Add New Meal
          </Button>
        </header>

        {/* Week Navigator */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <Button
            variant="outline"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="border-slate-300 text-[#002B49] font-bold"
          >
            ← Previous Week
          </Button>
          <div className="text-center">
            <span className="text-sm font-bold text-[#002B49]">
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
            className="border-slate-300 text-[#002B49] font-bold"
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
                    <CardTitle className="text-lg font-bold text-[#002B49] flex items-center gap-2">
                      <span>{day.fullLabel}</span>
                      {day.isToday && <Badge className="bg-[#00A859] text-white text-xs">Today</Badge>}
                    </CardTitle>
                    <Button
                      size="sm"
                      onClick={() => handleOpenModal(undefined, day.dayName)}
                      className="bg-[#00A859] hover:bg-[#008F4C] text-white text-xs font-bold"
                    >
                      + Add to {day.dayName}
                    </Button>
                  </CardHeader>

                  <CardContent className="p-4 space-y-6">
                    {dayItems.length === 0 ? (
                      <p className="text-slate-400 text-sm italic py-2">No meals assigned for this day.</p>
                    ) : (
                      DISH_CATEGORIES.map((category) => {
                        const categoryItems = dayItems.filter(
                          (i) => i.meal_type?.toLowerCase() === category.toLowerCase()
                        )

                        if (categoryItems.length === 0) return null

                        return (
                          <div key={category} className="space-y-3">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-1">
                              <h3 className="text-sm font-bold text-[#002B49]">{category}</h3>
                              <Badge className="bg-[#002B49] text-white text-xs">
                                {categoryItems.length}
                              </Badge>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                              {categoryItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="border border-slate-200 rounded-lg p-3 bg-slate-50 flex flex-col justify-between space-y-2 shadow-xs"
                                >
                                  <div>
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
                                    <h4 className="font-bold text-[#002B49] text-base">{item.name}</h4>
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

        {/* Solid Dark Pop-Up Modal */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="bg-slate-900 text-white border border-slate-700 shadow-2xl rounded-2xl max-w-lg p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">
                {editingItem ? 'Edit Meal Entry' : 'Add New Meal Entry'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div>
                <label className="text-xs font-bold text-slate-300">Meal Name</label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jollof Rice & Fried Chicken"
                  className="bg-slate-800 border-slate-700 text-white mt-1 placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details or side dishes..."
                  className="bg-slate-800 border-slate-700 text-white mt-1 placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300">Day of Week</label>
                  <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                      <SelectValue placeholder="Select Day" />
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
                  <label className="text-xs font-bold text-slate-300">Dish Category</label>
                  <Select value={mealType} onValueChange={setMealType}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      {DISH_CATEGORIES.map((category) => (
                        <SelectItem
                          key={category}
                          value={category}
                          className="focus:bg-slate-800 focus:text-white"
                        >
                          {category}
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
                  className="bg-slate-800 border-slate-700 text-white mt-1 file:bg-slate-700 file:text-white file:border-0 file:rounded-md file:px-2 file:py-1 file:mr-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
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
                  className="bg-[#00A859] hover:bg-[#008F4C] text-white font-bold"
                >
                  {uploading ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Meal'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}