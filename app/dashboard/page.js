'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { 
  Sparkles, Users, CalendarDays, CheckCircle, XCircle, Clock, Plus, 
  Trash2, Edit2, MessageSquare, Download, Copy, ExternalLink, LogOut,
  Activity, Cpu, HardDrive, Server, RefreshCw, Menu, X, Eye
} from 'lucide-react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState([])
  const [stats, setStats] = useState(null)
  const [systemMetrics, setSystemMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [guests, setGuests] = useState([])
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [showGuestDialog, setShowGuestDialog] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [editingGuest, setEditingGuest] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Form states
  const [eventForm, setEventForm] = useState({
    name: '', date: '', location: '', locationUrl: '', description: '',
    giftRegistry: { amazon: '', liverpool: '', bank: '' }
  })
  const [guestForm, setGuestForm] = useState({
    name: '', email: '', phone: '', passes: 1
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchData()
    }
  }, [status])

  useEffect(() => {
    if (activeTab === 'system') {
      fetchSystemMetrics()
      const interval = setInterval(fetchSystemMetrics, 5000)
      return () => clearInterval(interval)
    }
  }, [activeTab])

  const fetchData = async () => {
    try {
      const [eventsRes, statsRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/stats')
      ])
      const eventsData = await eventsRes.json()
      const statsData = await statsRes.json()
      setEvents(eventsData)
      setStats(statsData)
      if (eventsData.length > 0 && !selectedEvent) {
        selectEvent(eventsData[0])
      }
    } catch (error) {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const fetchSystemMetrics = async () => {
    try {
      const res = await fetch('/api/system/metrics')
      const data = await res.json()
      setSystemMetrics(data)
    } catch (error) {
      console.error('Error fetching metrics:', error)
    }
  }

  const selectEvent = async (event) => {
    setSelectedEvent(event)
    try {
      const res = await fetch(`/api/events/${event.id}/guests`)
      const data = await res.json()
      setGuests(data)
    } catch (error) {
      toast.error('Error al cargar invitados')
    }
  }

  const handleSaveEvent = async () => {
    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : '/api/events'
      const method = editingEvent ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventForm)
      })

      if (!res.ok) throw new Error()

      toast.success(editingEvent ? 'Evento actualizado' : 'Evento creado')
      setShowEventDialog(false)
      setEditingEvent(null)
      setEventForm({ name: '', date: '', location: '', locationUrl: '', description: '', giftRegistry: { amazon: '', liverpool: '', bank: '' } })
      fetchData()
    } catch (error) {
      toast.error('Error al guardar evento')
    }
  }

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('¿Eliminar este evento y todos sus invitados?')) return
    try {
      await fetch(`/api/events/${eventId}`, { method: 'DELETE' })
      toast.success('Evento eliminado')
      setSelectedEvent(null)
      fetchData()
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const handleSaveGuest = async () => {
    try {
      const url = editingGuest 
        ? `/api/guests/${editingGuest.id}` 
        : `/api/events/${selectedEvent.id}/guests`
      const method = editingGuest ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guestForm)
      })

      if (!res.ok) throw new Error()

      toast.success(editingGuest ? 'Invitado actualizado' : 'Invitado agregado')
      setShowGuestDialog(false)
      setEditingGuest(null)
      setGuestForm({ name: '', email: '', phone: '', passes: 1 })
      selectEvent(selectedEvent)
      fetchData()
    } catch (error) {
      toast.error('Error al guardar invitado')
    }
  }

  const handleDeleteGuest = async (guestId) => {
    if (!confirm('¿Eliminar este invitado?')) return
    try {
      await fetch(`/api/guests/${guestId}`, { method: 'DELETE' })
      toast.success('Invitado eliminado')
      selectEvent(selectedEvent)
      fetchData()
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const handleWhatsApp = async (guestId) => {
    try {
      const res = await fetch(`/api/guests/${guestId}/whatsapp`)
      const data = await res.json()
      
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank')
      } else {
        await navigator.clipboard.writeText(data.message)
        toast.success('Mensaje copiado al portapapeles')
      }
    } catch (error) {
      toast.error('Error al generar mensaje')
    }
  }

  const handleCopyLink = async (guest) => {
    const link = `${window.location.origin}/rsvp/${guest.token}`
    await navigator.clipboard.writeText(link)
    toast.success('Enlace copiado')
  }

  const handleExportCSV = async () => {
    if (!selectedEvent) return
    window.open(`/api/events/${selectedEvent.id}/export`, '_blank')
  }

  const openEditEvent = (event) => {
    setEditingEvent(event)
    const registry = event.giftRegistry ? JSON.parse(event.giftRegistry) : { amazon: '', liverpool: '', bank: '' }
    setEventForm({
      name: event.name,
      date: new Date(event.date).toISOString().slice(0, 16),
      location: event.location,
      locationUrl: event.locationUrl || '',
      description: event.description || '',
      giftRegistry: registry
    })
    setShowEventDialog(true)
  }

  const openEditGuest = (guest) => {
    setEditingGuest(guest)
    setGuestForm({
      name: guest.name,
      email: guest.email || '',
      phone: guest.phone || '',
      passes: guest.passes
    })
    setShowGuestDialog(true)
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
    <div className="min-h-screen bg-stone-50 flex">
      {/* Mobile Menu Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-stone-200 transform transition-transform lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Sparkles className="h-6 w-6 text-amber-600" />
            <span className="text-xl font-light tracking-wider text-stone-800">Celebra</span>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => { setActiveTab('overview'); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-amber-50 text-amber-700' : 'text-stone-600 hover:bg-stone-100'}`}
            >
              <Activity className="h-5 w-5" />
              Resumen
            </button>
            <button
              onClick={() => { setActiveTab('events'); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'events' ? 'bg-amber-50 text-amber-700' : 'text-stone-600 hover:bg-stone-100'}`}
            >
              <CalendarDays className="h-5 w-5" />
              Eventos
            </button>
            <button
              onClick={() => { setActiveTab('guests'); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'guests' ? 'bg-amber-50 text-amber-700' : 'text-stone-600 hover:bg-stone-100'}`}
            >
              <Users className="h-5 w-5" />
              Invitados
            </button>
            <button
              onClick={() => { setActiveTab('system'); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'system' ? 'bg-amber-50 text-amber-700' : 'text-stone-600 hover:bg-stone-100'}`}
            >
              <Server className="h-5 w-5" />
              Sistema
            </button>
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-stone-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <span className="text-amber-700 font-medium">
                {session?.user?.name?.[0] || session?.user?.email?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-800 truncate">{session?.user?.name || 'Admin'}</p>
              <p className="text-xs text-stone-500 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => signOut({ callbackUrl: '/login' })}>
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-light text-stone-800 mb-2">Panel de Control</h1>
                <p className="text-stone-600">Bienvenido de vuelta, {session?.user?.name || 'Admin'}</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-stone-800">{stats?.totalGuests || 0}</p>
                        <p className="text-sm text-stone-600">Invitados Totales</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-stone-800">{stats?.confirmedGuests || 0}</p>
                        <p className="text-sm text-stone-600">Confirmados</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-red-100 rounded-lg">
                        <XCircle className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-stone-800">{stats?.cancelledGuests || 0}</p>
                        <p className="text-sm text-stone-600">Cancelados</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-100 rounded-lg">
                        <Clock className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-stone-800">{stats?.pendingGuests || 0}</p>
                        <p className="text-sm text-stone-600">Pendientes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Events List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Mis Eventos</CardTitle>
                      <CardDescription>{events.length} evento(s) creado(s)</CardDescription>
                    </div>
                    <Button onClick={() => { setEditingEvent(null); setEventForm({ name: '', date: '', location: '', locationUrl: '', description: '', giftRegistry: { amazon: '', liverpool: '', bank: '' } }); setShowEventDialog(true) }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Evento
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <div className="text-center py-12">
                      <CalendarDays className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                      <p className="text-stone-600">No tienes eventos aún</p>
                      <Button className="mt-4" onClick={() => setShowEventDialog(true)}>
                        Crear mi primer evento
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {events.map(event => (
                        <div key={event.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors">
                          <div className="flex-1">
                            <h3 className="font-medium text-stone-800">{event.name}</h3>
                            <p className="text-sm text-stone-600">
                              {new Date(event.date).toLocaleDateString('es-MX', { dateStyle: 'long' })}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-medium text-green-600">{event.stats?.confirmed || 0} confirmados</p>
                              <p className="text-xs text-stone-500">{event.stats?.total || 0} invitados</p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openEditEvent(event)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteEvent(event.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-light text-stone-800">Gestionar Eventos</h1>
                <Button onClick={() => { setEditingEvent(null); setEventForm({ name: '', date: '', location: '', locationUrl: '', description: '', giftRegistry: { amazon: '', liverpool: '', bank: '' } }); setShowEventDialog(true) }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Evento
                </Button>
              </div>

              <div className="grid gap-6">
                {events.map(event => (
                  <Card key={event.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{event.name}</CardTitle>
                          <CardDescription className="mt-2">
                            <span className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4" />
                              {new Date(event.date).toLocaleDateString('es-MX', { dateStyle: 'full', timeStyle: 'short' })}
                            </span>
                            <span className="flex items-center gap-2 mt-1">
                              <span>📍</span>
                              {event.location}
                              {event.locationUrl && (
                                <a href={event.locationUrl} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditEvent(event)}>
                            <Edit2 className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteEvent(event.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-4 bg-stone-50 rounded-lg">
                          <p className="text-2xl font-semibold text-stone-800">{event.stats?.total || 0}</p>
                          <p className="text-xs text-stone-600">Total</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <p className="text-2xl font-semibold text-green-700">{event.stats?.confirmed || 0}</p>
                          <p className="text-xs text-green-600">Confirmados</p>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <p className="text-2xl font-semibold text-red-700">{event.stats?.cancelled || 0}</p>
                          <p className="text-xs text-red-600">Cancelados</p>
                        </div>
                        <div className="text-center p-4 bg-amber-50 rounded-lg">
                          <p className="text-2xl font-semibold text-amber-700">{event.stats?.pending || 0}</p>
                          <p className="text-xs text-amber-600">Pendientes</p>
                        </div>
                      </div>
                      <Progress value={event.stats?.total ? (event.stats.confirmed / event.stats.total) * 100 : 0} className="h-2" />
                      <p className="text-xs text-stone-500 mt-2 text-center">
                        {event.stats?.confirmedPasses || 0} de {event.stats?.totalPasses || 0} pases confirmados
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Guests Tab */}
          {activeTab === 'guests' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h1 className="text-2xl font-light text-stone-800">Lista de Invitados</h1>
                <div className="flex gap-2">
                  {selectedEvent && (
                    <>
                      <Button variant="outline" onClick={handleExportCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar CSV
                      </Button>
                      <Button onClick={() => { setEditingGuest(null); setGuestForm({ name: '', email: '', phone: '', passes: 1 }); setShowGuestDialog(true) }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Invitado
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Event Selector */}
              {events.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {events.map(event => (
                    <Button
                      key={event.id}
                      variant={selectedEvent?.id === event.id ? 'default' : 'outline'}
                      onClick={() => selectEvent(event)}
                      className="whitespace-nowrap"
                    >
                      {event.name}
                    </Button>
                  ))}
                </div>
              )}

              {/* Guests Table */}
              {selectedEvent ? (
                <Card>
                  <CardContent className="p-0">
                    {guests.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                        <p className="text-stone-600">No hay invitados aún</p>
                        <Button className="mt-4" onClick={() => setShowGuestDialog(true)}>
                          Agregar primer invitado
                        </Button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nombre</TableHead>
                              <TableHead>Pases</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead>Notas</TableHead>
                              <TableHead>Canción</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {guests.map(guest => (
                              <TableRow key={guest.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{guest.name}</p>
                                    <p className="text-xs text-stone-500">{guest.email || guest.phone || 'Sin contacto'}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="font-medium">{guest.confirmedPasses}</span>
                                  <span className="text-stone-400"> / {guest.passes}</span>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={
                                    guest.status === 'confirmed' ? 'default' :
                                    guest.status === 'cancelled' ? 'destructive' : 'secondary'
                                  }>
                                    {guest.status === 'confirmed' ? 'Confirmado' :
                                     guest.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-stone-600 truncate max-w-[150px] block">
                                    {guest.dietaryNotes || '-'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-stone-600 truncate max-w-[150px] block">
                                    {guest.songRequest || '-'}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => handleCopyLink(guest)} title="Copiar enlace RSVP">
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleWhatsApp(guest.id)} title="Enviar WhatsApp">
                                      <MessageSquare className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => openEditGuest(guest)} title="Editar">
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteGuest(guest.id)} title="Eliminar">
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-stone-600">Selecciona un evento para ver sus invitados</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-light text-stone-800">Monitor del Sistema</h1>
                  <p className="text-stone-600">Métricas en tiempo real del servidor</p>
                </div>
                <Button variant="outline" onClick={fetchSystemMetrics}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
              </div>

              {systemMetrics ? (
                <>
                  {/* System Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-blue-600" />
                          CPU
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-2xl font-semibold">{systemMetrics.cpu.usage}%</span>
                            <span className="text-xs text-stone-500">{systemMetrics.cpu.cores} cores</span>
                          </div>
                          <Progress value={systemMetrics.cpu.usage} className="h-2" />
                          <p className="text-xs text-stone-500 truncate">{systemMetrics.cpu.model}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <HardDrive className="h-4 w-4 text-green-600" />
                          Memoria RAM
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-2xl font-semibold">{systemMetrics.memory.usagePercent}%</span>
                            <span className="text-xs text-stone-500">
                              {systemMetrics.memory.used}MB / {systemMetrics.memory.total}MB
                            </span>
                          </div>
                          <Progress value={systemMetrics.memory.usagePercent} className="h-2" />
                          <p className="text-xs text-stone-500">{systemMetrics.memory.free}MB disponibles</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Server className="h-4 w-4 text-amber-600" />
                          Sistema
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-2xl font-semibold">{systemMetrics.system.uptimeFormatted}</p>
                          <p className="text-xs text-stone-500">Uptime</p>
                          <div className="flex gap-2">
                            <Badge variant="outline">{systemMetrics.system.platform}</Badge>
                            <Badge variant="outline">{systemMetrics.system.arch}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Containers */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Contenedores</CardTitle>
                      <CardDescription>Estado de los servicios</CardDescription>
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
                          {systemMetrics.containers.map((container, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{container.name}</TableCell>
                              <TableCell>
                                <Badge variant={container.status === 'running' ? 'default' : 'destructive'}>
                                  {container.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{container.cpu}</TableCell>
                              <TableCell>{container.memory}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <RefreshCw className="h-8 w-8 text-stone-300 mx-auto mb-4 animate-spin" />
                    <p className="text-stone-600">Cargando métricas...</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Editar Evento' : 'Nuevo Evento'}</DialogTitle>
            <DialogDescription>Completa los detalles de tu evento</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre del Evento *</Label>
              <Input
                id="name"
                value={eventForm.name}
                onChange={(e) => setEventForm({...eventForm, name: e.target.value})}
                placeholder="Ej: Boda de María y Juan"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Fecha y Hora *</Label>
              <Input
                id="date"
                type="datetime-local"
                value={eventForm.date}
                onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Lugar *</Label>
              <Input
                id="location"
                value={eventForm.location}
                onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                placeholder="Ej: Jardín Los Arcos, CDMX"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="locationUrl">Enlace Google Maps</Label>
              <Input
                id="locationUrl"
                value={eventForm.locationUrl}
                onChange={(e) => setEventForm({...eventForm, locationUrl: e.target.value})}
                placeholder="https://maps.google.com/..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={eventForm.description}
                onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                placeholder="Detalles adicionales del evento..."
              />
            </div>
            <div className="border-t pt-4">
              <Label className="text-base font-medium">Mesa de Regalos</Label>
              <div className="grid gap-3 mt-3">
                <div className="grid gap-2">
                  <Label htmlFor="amazon" className="text-sm">Amazon</Label>
                  <Input
                    id="amazon"
                    value={eventForm.giftRegistry.amazon}
                    onChange={(e) => setEventForm({...eventForm, giftRegistry: {...eventForm.giftRegistry, amazon: e.target.value}})}
                    placeholder="Enlace a lista de Amazon"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="liverpool" className="text-sm">Liverpool</Label>
                  <Input
                    id="liverpool"
                    value={eventForm.giftRegistry.liverpool}
                    onChange={(e) => setEventForm({...eventForm, giftRegistry: {...eventForm.giftRegistry, liverpool: e.target.value}})}
                    placeholder="Enlace a lista de Liverpool"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bank" className="text-sm">Cuenta Bancaria</Label>
                  <Input
                    id="bank"
                    value={eventForm.giftRegistry.bank}
                    onChange={(e) => setEventForm({...eventForm, giftRegistry: {...eventForm.giftRegistry, bank: e.target.value}})}
                    placeholder="Ej: CLABE 1234..."
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveEvent}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Guest Dialog */}
      <Dialog open={showGuestDialog} onOpenChange={setShowGuestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGuest ? 'Editar Invitado' : 'Nuevo Invitado'}</DialogTitle>
            <DialogDescription>Agrega los datos del invitado</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="guestName">Nombre *</Label>
              <Input
                id="guestName"
                value={guestForm.name}
                onChange={(e) => setGuestForm({...guestForm, name: e.target.value})}
                placeholder="Ej: Familia García"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="guestEmail">Email</Label>
              <Input
                id="guestEmail"
                type="email"
                value={guestForm.email}
                onChange={(e) => setGuestForm({...guestForm, email: e.target.value})}
                placeholder="email@ejemplo.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="guestPhone">Teléfono (WhatsApp)</Label>
              <Input
                id="guestPhone"
                value={guestForm.phone}
                onChange={(e) => setGuestForm({...guestForm, phone: e.target.value})}
                placeholder="+52 55 1234 5678"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="passes">Número de Pases</Label>
              <Input
                id="passes"
                type="number"
                min="1"
                value={guestForm.passes}
                onChange={(e) => setGuestForm({...guestForm, passes: parseInt(e.target.value) || 1})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGuestDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveGuest}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}