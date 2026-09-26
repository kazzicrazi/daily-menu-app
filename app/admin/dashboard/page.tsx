'use client'

import { useState, useEffect } from 'react'
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

export const dynamic = 'force-dynamic'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  day_of_week: string
  meal_type: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Snacks']

export default function AdminDashboard() {
  const supabase = createClient()

  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('Monday')
  const [mealType, setMealType] = useState('Breakfast')

  // Fetch all menu items
  const fetchMenuItems = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('menus')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setItems(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMenuItems()
  }, [])

  // Open Dialog for Adding or Editing
  const handleOpenDialog = (item?: MenuItem) => {
    if (item) {
      setEditingId(item.id)
      setName(item.name)
      setDescription(item.description || '')
      setPrice(item.price ? item.price.toString() : '')
      setDayOfWeek(item.day_of_week)
      setMealType(item.meal_type)
    } else {
      setEditingId(null)
      setName('')
      setDescription('')
      setPrice('')
      setDayOfWeek('Monday')
      setMealType('Breakfast')
    }
    setOpen(true)
  }

  // Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      name,
      description,
      price: parseFloat(price) || 0,
      day_of_week: dayOfWeek,
      meal_type: mealType,
    }

    if (editingId) {
      // Edit existing meal
      await supabase.from('menus').update(payload).eq('id', editingId)
    } else {
      // Create new meal
      await supabase.from('menus').insert([payload])
    }

    setOpen(false)
    fetchMenuItems()
  }

  // Delete Meal
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      await supabase.from('menus').delete().eq('id', id)
      fetchMenuItems()
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Canteen Admin Dashboard</h1>
          <p className="text-sm text-slate-500">Manage daily menu uploads and edits</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>+ Add New Meal</Button>
      </div>

      {/* QR Code Section */}
      <div className="flex justify-center my-4">
        <MenuQRCode />
      </div>

      {/* Menu Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Meal Name</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price (₦)</TableHead>
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
                    <TableCell className="font-medium">
                      {item.name}
                      {item.description && (
                        <p className="text-xs text-slate-500 font-normal">{item.description}</p>
                      )}
                    </TableCell>
                    <TableCell>{item.day_of_week}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {item.meal_type}
                      </Badge>
                    </TableCell>
                    <TableCell>₦{item.price ? item.price.toLocaleString() : '0'}</TableCell>
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

      {/* Add / Edit Dialog */}
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
                  placeholder="e.g. Jollof Rice & Fried Chicken"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="price">Price (₦)</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 2500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Day of the Week</Label>
                  <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
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
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Served with plantain and coleslaw"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingId ? 'Save Changes' : 'Create Meal'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}