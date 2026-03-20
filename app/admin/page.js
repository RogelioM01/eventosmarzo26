'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  Sparkles, Users, CalendarDays, Plus, Trash2, Edit2, LogOut,
  Activity, Cpu, HardDrive, Server, RefreshCw, Shield, UserPlus
} from 'lucide-react'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [systemMetrics, setSystemMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('users')
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'host' })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        router.push('/dashboard')
        return
      }
      fetchData()
    }
  }, [status, session])

  useEffect(() => {
    if (activeTab === 'system') {
      fetchSystemMetrics()
      const interval = setInterval(fetchSystemMetrics, 5000)
      return () => clearInterval(interval)
    }
  }, [activeTab])

  const fetchData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/stats')
      ])
      
      if (usersRes.ok) setUsers(await usersRes.json())
      if (statsRes.ok) setStats(await statsRes.json())
    } catch (error) {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const fetchSystemMetrics = async () => {
    try {
      const res = await fetch('/api/system/metrics')
      if (res.ok) setSystemMetrics(await res.json())
    } catch (error) {
      console.error('Error fetching metrics:', error)
    }
  }

  const handleSaveUser = async () => {
    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users'
      const method = editingUser ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      toast.success(editingUser ? 'Usuario actualizado' : 'Usuario creado')
      setShowUserDialog(false)
      setEditingUser(null)
      setUserForm({ name: '', email: '', password: '', role: 'host' })
      fetchData()
    } catch (error) {
      toast.error(error.message || 'Error al guardar usuario')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('¿Eliminar este usuario y todos sus eventos?')) return
    try {
      await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      toast.success('Usuario eliminado')
      fetchData()
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const openEditUser = (user) => {
    setEditingUser(user)
    setUserForm({ name: user.name, email: user.email, password: '', role: user.role })
    setShowUserDialog(true)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-amber-600 animate-pulse mx-auto mb-4" />
          <p className="text-stone-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-amber-600" />
            <span className="text-xl font-light tracking-wider text-stone-800">Celebra</span>
            <Badge className="bg-red-100 text-red-700">Admin</Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-stone-600">{session?.user?.email}</span>
            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/login' })}>
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-stone-200">
        <div className="container mx-auto px-4">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-2 border-b-2 transition-colors ${activeTab === 'users' ? 'border-amber-600 text-amber-600' : 'border-transparent text-stone-600 hover:text-stone-800'}`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Usuarios
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`py-4 px-2 border-b-2 transition-colors ${activeTab === 'system' ? 'border-amber-600 text-amber-600' : 'border-transparent text-stone-600 hover:text-stone-800'}`}
            >
              <Server className="h-4 w-4 inline mr-2" />
              Sistema
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{stats.totalUsers}</p>
                    <p className="text-xs text-stone-600">Usuarios</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <CalendarDays className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{stats.totalEvents}</p>
                    <p className="text-xs text-stone-600">Eventos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Activity className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{stats.totalGuests}</p>
                    <p className="text-xs text-stone-600">Invitados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{stats.confirmedGuests}</p>
                    <p className="text-xs text-stone-600">Confirmados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestión de Usuarios</CardTitle>
                  <CardDescription>Administra los hosts de la plataforma</CardDescription>
                </div>
                <Button onClick={() => { setEditingUser(null); setUserForm({ name: '', email: '', password: '', role: 'host' }); setShowUserDialog(true) }}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Nuevo Usuario
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Eventos</TableHead>
                    <TableHead>Invitados</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-stone-500">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? 'Admin' : 'Host'}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.eventsCount}</TableCell>
                      <TableCell>{user.totalGuests}</TableCell>
                      <TableCell className="text-sm text-stone-600">
                        {new Date(user.createdAt).toLocaleDateString('es-MX')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditUser(user)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {user.id !== session?.user?.id && (
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* System Tab */}
        {activeTab === 'system' && systemMetrics && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-light">Monitor del Sistema</h2>
              <Button variant="outline" onClick={fetchSystemMetrics}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-blue-600" />
                    CPU
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-2xl font-semibold">{systemMetrics.cpu.usage}%</span>
                      <span className="text-xs text-stone-500">{systemMetrics.cpu.cores} cores</span>
                    </div>
                    <Progress value={systemMetrics.cpu.usage} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-green-600" />
                    Memoria RAM
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-2xl font-semibold">{systemMetrics.memory.usagePercent}%</span>
                      <span className="text-xs text-stone-500">{systemMetrics.memory.used}MB / {systemMetrics.memory.total}MB</span>
                    </div>
                    <Progress value={systemMetrics.memory.usagePercent} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Server className="h-4 w-4 text-amber-600" />
                    Uptime
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{systemMetrics.system.uptimeFormatted}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{systemMetrics.system.platform}</Badge>
                    <Badge variant="outline">{systemMetrics.system.arch}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contenedores</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>CPU</TableHead>
                      <TableHead>Memoria</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {systemMetrics.containers.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>
                          <Badge variant={c.status === 'running' ? 'default' : 'destructive'}>{c.status}</Badge>
                        </TableCell>
                        <TableCell>{c.cpu}</TableCell>
                        <TableCell>{c.memory}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* User Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Modifica los datos del usuario' : 'Crea un nuevo usuario para la plataforma'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nombre</Label>
              <Input
                value={userForm.name}
                onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                placeholder="Nombre completo"
              />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div className="grid gap-2">
              <Label>{editingUser ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña'}</Label>
              <Input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                placeholder="••••••••"
              />
            </div>
            <div className="grid gap-2">
              <Label>Rol</Label>
              <Select value={userForm.role} onValueChange={(value) => setUserForm({...userForm, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="host">Host (Usuario normal)</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveUser}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
