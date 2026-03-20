'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  Sparkles, Users, CalendarDays, CheckCircle, XCircle, Clock, Plus, 
  Trash2, Edit2, MessageSquare, Download, Copy, ExternalLink, LogOut,
  QrCode, Link2, Share2, Settings, UserPlus
} from 'lucide-react'

export default function HostDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [showGuestDialog, setShowGuestDialog] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [selectedGuestForQR, setSelectedGuestForQR] = useState(null)
  const [editingEvent, setEditingEvent] = useState(null)
  const [editingGuest, setEditingGuest] = useState(null)
  const qrRef = useRef(null)

  const [eventForm, setEventForm] = useState({
    name: '', date: '', location: '', locationUrl: '', description: '',
    giftRegistry: { amazon: '', liverpool: '', bank: '' }
  })
  const [guestForm, setGuestForm] = useState({
    name: '', email: '', phone: '', passes: 1
  })

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      if (session?.user?.role === 'admin') {
        router.push('/admin')
        return
      }
      fetchEvents()
    }
  }, [status, session])

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events')
      const data = await res.json()
      setEvents(data)
      if (data.length > 0) {
        selectEvent(data[0])
      }
    } catch (error) {
      toast.error('Error al cargar eventos')
    } finally {
      setLoading(false)
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
      resetEventForm()
      fetchEvents()
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
      fetchEvents()
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
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const handleCopyLink = async (guest) => {
    const link = `${baseUrl}/rsvp/${guest.token}`
    await navigator.clipboard.writeText(link)
    toast.success('Enlace copiado al portapapeles')
  }

  const handleWhatsApp = async (guestId) => {
    try {
      const res = await fetch(`/api/guests/${guestId}/whatsapp`)
      const data = await res.json()
      
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank')
      } else {
        await navigator.clipboard.writeText(data.message)
        toast.success('Mensaje copiado (sin número de WhatsApp)')
      }
    } catch (error) {
      toast.error('Error al generar mensaje')
    }
  }

  const handleShowQR = (guest) => {
    setSelectedGuestForQR(guest)
    setShowQRDialog(true)
  }

  const handleDownloadQR = () => {
    if (!qrRef.current || !selectedGuestForQR) return
    
    const svg = qrRef.current.querySelector('svg')
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      
      const a = document.createElement('a')
      a.download = `qr-${selectedGuestForQR.name.replace(/\s+/g, '-')}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  const handleExportCSV = async () => {
    if (!selectedEvent) return
    window.open(`/api/events/${selectedEvent.id}/export`, '_blank')
  }

  const resetEventForm = () => {
    setEventForm({ name: '', date: '', location: '', locationUrl: '', description: '', giftRegistry: { amazon: '', liverpool: '', bank: '' } })
  }

  const openEditEvent = () => {
    if (!selectedEvent) return
    const registry = selectedEvent.giftRegistry ? JSON.parse(selectedEvent.giftRegistry) : { amazon: '', liverpool: '', bank: '' }
    setEditingEvent(selectedEvent)
    setEventForm({
      name: selectedEvent.name,
      date: new Date(selectedEvent.date).toISOString().slice(0, 16),
      location: selectedEvent.location,
      locationUrl: selectedEvent.locationUrl || '',
      description: selectedEvent.description || '',
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

  const confirmedCount = guests.filter(g => g.status === 'confirmed').length
  const cancelledCount = guests.filter(g => g.status === 'cancelled').length
  const pendingCount = guests.filter(g => g.status === 'pending').length
  const totalPasses = guests.reduce((sum, g) => sum + g.passes, 0)
  const confirmedPasses = guests.reduce((sum, g) => sum + g.confirmedPasses, 0)

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-amber-600" />
            <span className="text-xl font-light tracking-wider text-stone-800">Celebra</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-stone-600 hidden sm:block">{session?.user?.name || session?.user?.email}</span>
            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/login' })}>
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* No Events State */}
        {events.length === 0 ? (
          <Card className="max-w-md mx-auto mt-20">
            <CardContent className="py-12 text-center">
              <CalendarDays className="h-16 w-16 text-stone-300 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-stone-800 mb-2">Crea tu primer evento</h2>
              <p className="text-stone-600 mb-6">Comienza a gestionar las invitaciones de tu celebración</p>
              <Button onClick={() => { setEditingEvent(null); resetEventForm(); setShowEventDialog(true) }}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Evento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Event Info */}
            <div className="lg:col-span-1 space-y-4">
              {/* Event Selector */}
              {events.length > 1 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Mis Eventos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {events.map(event => (
                      <button
                        key={event.id}
                        onClick={() => selectEvent(event)}
                        className={`w-full text-left p-2 rounded-lg transition-colors ${selectedEvent?.id === event.id ? 'bg-amber-100 text-amber-800' : 'hover:bg-stone-100'}`}
                      >
                        <p className="font-medium text-sm truncate">{event.name}</p>
                        <p className="text-xs text-stone-500">{new Date(event.date).toLocaleDateString('es-MX')}</p>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Current Event Card */}
              {selectedEvent && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{selectedEvent.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {new Date(selectedEvent.date).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="icon" onClick={openEditEvent}>
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <p className="text-stone-600">📍 {selectedEvent.location}</p>
                      {selectedEvent.locationUrl && (
                        <a href={selectedEvent.locationUrl} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline text-xs flex items-center gap-1 mt-1">
                          <ExternalLink className="h-3 w-3" />
                          Ver en Google Maps
                        </a>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                      <div className="text-center">
                        <p className="text-xl font-semibold text-green-600">{confirmedCount}</p>
                        <p className="text-xs text-stone-500">Confirmados</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-semibold text-red-600">{cancelledCount}</p>
                        <p className="text-xs text-stone-500">Cancelados</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-semibold text-amber-600">{pendingCount}</p>
                        <p className="text-xs text-stone-500">Pendientes</p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Progress value={totalPasses > 0 ? (confirmedPasses / totalPasses) * 100 : 0} className="h-2" />
                      <p className="text-xs text-stone-500 mt-1 text-center">{confirmedPasses} de {totalPasses} pases confirmados</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" onClick={() => { setEditingEvent(null); resetEventForm(); setShowEventDialog(true) }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Evento
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => { setEditingGuest(null); setGuestForm({ name: '', email: '', phone: '', passes: 1 }); setShowGuestDialog(true) }} disabled={!selectedEvent}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Agregar Invitado
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={handleExportCSV} disabled={!selectedEvent}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Main Content - Guest List */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <CardTitle>Lista de Invitados</CardTitle>
                      <CardDescription>{guests.length} invitado(s) registrado(s)</CardDescription>
                    </div>
                    <Button onClick={() => { setEditingGuest(null); setGuestForm({ name: '', email: '', phone: '', passes: 1 }); setShowGuestDialog(true) }} disabled={!selectedEvent}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {guests.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-stone-300 mx-auto mb-4" />
                      <p className="text-stone-600 mb-4">No hay invitados todavía</p>
                      <Button onClick={() => setShowGuestDialog(true)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Agregar primer invitado
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invitado</TableHead>
                            <TableHead>Pases</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Notas</TableHead>
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
                                <span className="font-medium text-green-600">{guest.confirmedPasses}</span>
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
                                <div className="max-w-[150px]">
                                  {guest.dietaryNotes && <p className="text-xs text-stone-600 truncate">🍽️ {guest.dietaryNotes}</p>}
                                  {guest.songRequest && <p className="text-xs text-stone-600 truncate">🎵 {guest.songRequest}</p>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => handleShowQR(guest)} title="Ver QR">
                                    <QrCode className="h-4 w-4 text-purple-600" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleCopyLink(guest)} title="Copiar enlace">
                                    <Link2 className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleWhatsApp(guest.id)} title="WhatsApp">
                                    <MessageSquare className="h-4 w-4 text-green-600" />
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
            </div>
          </div>
        )}
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
              <Label>Nombre del Evento *</Label>
              <Input
                value={eventForm.name}
                onChange={(e) => setEventForm({...eventForm, name: e.target.value})}
                placeholder="Ej: Boda de María y Juan"
              />
            </div>
            <div className="grid gap-2">
              <Label>Fecha y Hora *</Label>
              <Input
                type="datetime-local"
                value={eventForm.date}
                onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label>Lugar *</Label>
              <Input
                value={eventForm.location}
                onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                placeholder="Ej: Jardín Los Arcos, CDMX"
              />
            </div>
            <div className="grid gap-2">
              <Label>Enlace Google Maps</Label>
              <Input
                value={eventForm.locationUrl}
                onChange={(e) => setEventForm({...eventForm, locationUrl: e.target.value})}
                placeholder="https://maps.google.com/..."
              />
            </div>
            <div className="grid gap-2">
              <Label>Descripción</Label>
              <Textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                placeholder="Detalles adicionales..."
              />
            </div>
            <div className="border-t pt-4">
              <Label className="text-base font-medium">Mesa de Regalos</Label>
              <div className="grid gap-3 mt-3">
                <Input
                  value={eventForm.giftRegistry.amazon}
                  onChange={(e) => setEventForm({...eventForm, giftRegistry: {...eventForm.giftRegistry, amazon: e.target.value}})}
                  placeholder="Enlace Amazon"
                />
                <Input
                  value={eventForm.giftRegistry.liverpool}
                  onChange={(e) => setEventForm({...eventForm, giftRegistry: {...eventForm.giftRegistry, liverpool: e.target.value}})}
                  placeholder="Enlace Liverpool"
                />
                <Input
                  value={eventForm.giftRegistry.bank}
                  onChange={(e) => setEventForm({...eventForm, giftRegistry: {...eventForm.giftRegistry, bank: e.target.value}})}
                  placeholder="CLABE Bancaria"
                />
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
              <Label>Nombre *</Label>
              <Input
                value={guestForm.name}
                onChange={(e) => setGuestForm({...guestForm, name: e.target.value})}
                placeholder="Ej: Familia García"
              />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={guestForm.email}
                onChange={(e) => setGuestForm({...guestForm, email: e.target.value})}
                placeholder="email@ejemplo.com"
              />
            </div>
            <div className="grid gap-2">
              <Label>Teléfono (WhatsApp)</Label>
              <Input
                value={guestForm.phone}
                onChange={(e) => setGuestForm({...guestForm, phone: e.target.value})}
                placeholder="+52 55 1234 5678"
              />
            </div>
            <div className="grid gap-2">
              <Label>Número de Pases</Label>
              <Input
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

      {/* QR Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Código QR</DialogTitle>
            <DialogDescription className="text-center">
              {selectedGuestForQR?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6" ref={qrRef}>
            {selectedGuestForQR && (
              <QRCodeSVG 
                value={`${baseUrl}/rsvp/${selectedGuestForQR.token}`}
                size={200}
                level="H"
                includeMargin={true}
              />
            )}
            <p className="text-xs text-stone-500 mt-4 text-center break-all px-4">
              {selectedGuestForQR && `${baseUrl}/rsvp/${selectedGuestForQR.token}`}
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full" onClick={() => selectedGuestForQR && handleCopyLink(selectedGuestForQR)}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar Enlace
            </Button>
            <Button className="w-full" onClick={handleDownloadQR}>
              <Download className="h-4 w-4 mr-2" />
              Descargar QR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
