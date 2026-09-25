'use client'
export const dynamic = 'force-dynamic'

import { MenuQRCode } from '@/components/MenuQRCode'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Menu {
  id: string
  date: string
  breakfast: string
  lunch: string
  dinner: string
}

export default function AdminDashboard() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [open, setOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [formData, setFormData] = useState({ date: '', breakfast: '', lunch: '', dinner: '' })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { fetchMenus() }, [])

  async function fetchMenus() {
    const { data } = await supabase.from('menus').select('*').order('date', { ascending: false })
    if (data) setMenus(data)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  function handleOpenDialog(menu?: Menu) {
    if (menu) {
      setEditingMenu(menu)
      setFormData({ date: menu.date, breakfast: menu.breakfast, lunch: menu.lunch, dinner: menu.dinner })
    } else {
      setEditingMenu(null)
      setFormData({ date: new Date().toISOString().split('T')[0], breakfast: '', lunch: '', dinner: '' })
    }
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingMenu) {
      await supabase.from('menus').update({
        breakfast: formData.breakfast,
        lunch: formData.lunch,
        dinner: formData.dinner,
        updated_at: new Date().toISOString(),
      }).eq('id', editingMenu.id)
    } else {
      await supabase.from('menus').insert([formData])
    }
    setOpen(false)
    fetchMenus()
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this menu?')) return
    await supabase.from('menus').delete().eq('id', id)
    fetchMenus()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Menu Management Dashboard</h1>
        <div className="flex items-center gap-3">
          <Button onClick={() => handleOpenDialog()}>Add New Menu</Button>
          <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMenu ? 'Edit Menu' : 'Add Daily Menu'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={formData.date}
                disabled={!!editingMenu}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Breakfast</label>
              <Textarea value={formData.breakfast} onChange={(e) => setFormData({ ...formData, breakfast: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Lunch</label>
              <Textarea value={formData.lunch} onChange={(e) => setFormData({ ...formData, lunch: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Dinner</label>
              <Textarea value={formData.dinner} onChange={(e) => setFormData({ ...formData, dinner: e.target.value })} />
            </div>
            <Button type="submit" className="w-full">
              {editingMenu ? 'Save Changes' : 'Create Menu'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

return (
  <div className="container mx-auto p-6 space-y-6">
    {/* 1. Dashboard Header */}
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold">Menu Management Dashboard</h1>
      <div className="flex items-center gap-3">
        <Button onClick={() => handleOpenDialog()}>Add New Menu</Button>
        <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
      </div>
    </div>

    {/* 👇 2. ADD THIS QR CODE SNIPPET HERE 👇 */}
    <div className="flex justify-center my-6">
      <MenuQRCode />
    </div>

    {/* 3. Dialog Form for adding/editing */}
    <Dialog open={open} onOpenChange={setOpen}>
      ...
    </Dialog>

    {/* 4. Menu Table */}
    <Table>
      ...
    </Table>
  </div>

)
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Breakfast</TableHead>
            <TableHead>Lunch</TableHead>
            <TableHead>Dinner</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {menus.map((menu) => (
            <TableRow key={menu.id}>
              <TableCell className="font-medium">{menu.date}</TableCell>
              <TableCell className="max-w-xs truncate">{menu.breakfast}</TableCell>
              <TableCell className="max-w-xs truncate">{menu.lunch}</TableCell>
              <TableCell className="max-w-xs truncate">{menu.dinner}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenDialog(menu)}>Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(menu.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}