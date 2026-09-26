'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MenuQRCode } from '@/components/MenuQRCode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface MenuItem {
  id: string
  name: string
  description: string
  day_of_week: string
  meal_type: string
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
      fullLabel: `${dayName} (${formattedDate})`,
    }
  })
}

export default function AdminDashboard() {
  const supabase = createClient()

  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const weekDays = useMemo(() => getCurrentWeekDates(), [])

  // Form State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('Monday')
  const [mealType, setMealType] = useState('Breakfast')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<FileList | null>(null)

  const fetchMenuItems = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('menus')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching menu items:', error)
    } else if (data) {
      setItems(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMenuItems()
  }, [])

  const handleOpenDialog = (item?: MenuItem) => {
    setImageFiles(null)
    if (item) {
      setEditingId(item.id)
      setName(item.name)
      setDescription(item.description || '')
      setDayOfWeek(item.day_of_week)
      setMealType(item.meal_type)
      setImageUrls(item.image_urls || [])
    } else {
      setEditingId(null)
      setName('')
      setDescription('')
      setDayOfWeek('Monday')
      setMealType('Breakfast')
      setImageUrls([])
    }
    setOpen(true)
  }

  const uploadImages = async (files: FileList): Promise<string[]> => {
    const uploadedUrls: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `meals/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('meal-images')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Error uploading image:', uploadError)
        alert(`Failed to upload image ${file.name}: ${uploadError.message}`)
      } else {
        const { data } = supabase.storage.from('meal-images').getPublicUrl(filePath)
        if (data?.publicUrl) {
          uploadedUrls.push(data.publicUrl)
        }
      }
    }

    return uploadedUrls
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    let finalUrls = [...imageUrls]

    if (imageFiles && imageFiles.length > 0) {
      const newUrls = await uploadImages(imageFiles)
      finalUrls = [...finalUrls, ...newUrls]
    }

    const payload = {
      name,
      description,
      day_of_week: dayOfWeek,
      meal_type: mealType,
      image_urls: finalUrls,
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('menus')
          .update(payload)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('menus')
          .insert([payload])

        if (error) throw error
      }

      setOpen(false)
      fetchMenuItems()
    } catch (err: unknown) {
      const error = err as Error
      console.error('Error saving meal:', error)
      alert(`Failed to save meal: ${error.message || 'Unknown database error'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      const { error } = await supabase.from('menus').delete().eq('id', id)
      if (error) {
        alert(`Failed to delete meal: ${error.message}`)
      } else {
        fetchMenuItems()
      }
    }
  }

  const getDayWithDate = (dayName: string) => {
    const found = weekDays.find((w) => w.dayName.toLowerCase() === dayName.toLowerCase())
    return found ? found.fullLabel : dayName
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Canteen Admin Dashboard</h1>
          <p className="text-sm text-slate-500">Manage daily menu uploads, photos, and edits</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>+ Add New Meal</Button>
      </div>

      <div className="flex justify-center my-4">
        <MenuQRCode />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Images</TableHead>
                <TableHead>Meal Name</TableHead>
                <TableHead>Day & Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-slate-500">
                    Loading menu items...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-slate-500">
                    No menu items found. Click "+ Add New Meal" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.image_urls && item.image_urls.length > 0 ? (
                        <div className="flex gap-1 overflow-x-auto max-w-[150px]">
                          {item.image_urls.map((url, idx) => (
                            <img
                              key={idx}
                              src={url}
                              alt={`${item.name} ${idx + 1}`}
                              className="w-10 h-10 object-cover rounded border flex-shrink-0"
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-slate-100 rounded border flex items-center justify-center text-[10px] text-slate-400">
                          No Pic
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.name}
                      {item.description && (
                        <p className="text-xs text-slate-500 font-normal">{item.description}</p>
                      )}
                    </TableCell>
                    <TableCell>{getDayWithDate(item.day_of_week)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {item.meal_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(item)}>
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Meal' : 'Add New Meal'}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Meal Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rice, Chicken & Ice Cream"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Day & Date</Label>
                  <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {weekDays.map((day) => (
                        <SelectItem key={day.dayName} value={day.dayName}>
                          {day.fullLabel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Meal Category</Label>
                  <Select value={mealType} onValueChange={setMealType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEAL_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="images">Food Photos (Select Multiple)</Label>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setImageFiles(e.target.files)}
                />
                {imageUrls.length > 0 && (
                  <div className="flex gap-1 mt-1 overflow-x-auto">
                    {imageUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded border"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Served with fried rice, baked chicken, and chocolate ice cream"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? 'Uploading...' : editingId ? 'Save Changes' : 'Create Meal'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}