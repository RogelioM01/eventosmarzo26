'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  CalendarDays, MapPin, Clock, Sparkles, Loader2, PartyPopper, 
  Heart, ExternalLink, Calendar, Music, UtensilsCrossed, Users, UserPlus
} from 'lucide-react'
import Link from 'next/link'

export default function OpenRegistrationPage() {
  const params = useParams()
  const eventId = params.eventId
  
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [error, setError] = useState(null)

  // Form state
  const [name, setName] = useState('')
  const [passes, setPasses] = useState(1)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [dietaryNotes, setDietaryNotes] = useState('')
  const [songRequest, setSongRequest] = useState('')

  useEffect(() => {
    fetchEventData()
  }, [eventId])

  useEffect(() => {
    if (event?.date) {
      const eventDate = new Date(event.date)
      const timer = setInterval(() => {
        const now = new Date().getTime()
        const distance = eventDate.getTime() - now

        if (distance > 0) {
          setCountdown({
            days: Math.floor(distance / (1000 * 60 * 60 * 24)),
            hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((distance % (1000 * 60)) / 1000)
          })
        }
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [event])

  const fetchEventData = async () => {
    try {
      const res = await fetch(`/api/public/event/${eventId}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Evento no encontrado')
      }
      const data = await res.json()
      setEvent(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Por favor ingresa tu nombre')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/public/event/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          passes,
          phone: phone || null,
          email: email || null,
          dietaryNotes: dietaryNotes || null,
          songRequest: songRequest || null
        })
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Error al registrar')
      }

      setSubmitted(true)
      toast.success('¡Registro exitoso!')
    } catch (err) {
      toast.error(err.message || 'Error al enviar el registro')
    } finally {
      setSubmitting(false)
    }
  }

  const addToCalendar = () => {
    if (!event) return
    
    const startDate = new Date(event.date)
    const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000)

    const formatDate = (date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z'
    }

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&location=${encodeURIComponent(event.location)}&details=${encodeURIComponent(event.description || '')}`
    
    window.open(googleUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-stone-50 to-white">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-amber-600 animate-pulse mx-auto mb-4" />
          <p className="text-stone-600">Cargando evento...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-stone-50 to-white p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12">
            <Heart className="h-16 w-16 text-stone-300 mx-auto mb-4" />
            <h1 className="text-xl font-medium text-stone-800 mb-2">Registro no disponible</h1>
            <p className="text-stone-600 mb-6">{error}</p>
            <Link href="/">
              <Button variant="outline">Ir al inicio</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const eventDate = new Date(event.date)

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1595113316349-9fa4eb24f884?w=1920&q=80')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-white" />
        
        <div className="relative container mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <Sparkles className="h-6 w-6 text-amber-600" />
            <span className="text-lg font-light tracking-wider text-stone-800">Te Invitamos</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-light text-stone-800 mb-4 tracking-tight">
            {event.name}
          </h1>
          
          {event.hostName && (
            <p className="text-xl text-amber-700 mb-8">
              Organizado por {event.hostName}
            </p>
          )}

          {/* Event Details */}
          <div className="flex flex-col md:flex-row justify-center gap-6 text-stone-600 mb-8">
            <div className="flex items-center justify-center gap-2">
              <CalendarDays className="h-5 w-5 text-amber-600" />
              <span>{eventDate.toLocaleDateString('es-MX', { dateStyle: 'full' })}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <span>{eventDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <MapPin className="h-5 w-5 text-amber-600" />
              <span>{event.location}</span>
              {event.locationUrl && (
                <a href={event.locationUrl} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {event.description && (
            <p className="text-stone-600 max-w-2xl mx-auto">{event.description}</p>
          )}
        </div>
      </section>

      {/* Countdown */}
      <section className="py-12 bg-stone-900 text-white">
        <div className="container mx-auto px-4">
          <p className="text-amber-400 uppercase tracking-widest text-sm mb-6 text-center">Cuenta Regresiva</p>
          
          <div className="flex justify-center gap-4 md:gap-8">
            {[
              { value: countdown.days, label: 'Días' },
              { value: countdown.hours, label: 'Horas' },
              { value: countdown.minutes, label: 'Minutos' },
              { value: countdown.seconds, label: 'Segundos' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="bg-stone-800 rounded-lg p-4 md:p-6 min-w-[60px] md:min-w-[90px]">
                  <span className="text-2xl md:text-4xl font-light text-amber-400">
                    {String(item.value).padStart(2, '0')}
                  </span>
                </div>
                <p className="text-stone-400 text-xs mt-2 uppercase tracking-wider">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Form or Success */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-xl">
          {submitted ? (
            <Card className="border-stone-200 shadow-lg">
              <CardContent className="py-12 text-center">
                <PartyPopper className="h-16 w-16 text-amber-600 mx-auto mb-6" />
                <h2 className="text-2xl font-medium text-stone-800 mb-2">¡Registro Exitoso!</h2>
                <p className="text-stone-600 mb-2">
                  Gracias <span className="font-medium">{name}</span> por confirmar tu asistencia.
                </p>
                <p className="text-stone-600 mb-8">
                  Te esperamos con {passes} {passes === 1 ? 'persona' : 'personas'}.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={addToCalendar} className="bg-amber-600 hover:bg-amber-700">
                    <Calendar className="h-4 w-4 mr-2" />
                    Agregar al Calendario
                  </Button>
                  {event.locationUrl && (
                    <Button variant="outline" asChild>
                      <a href={event.locationUrl} target="_blank" rel="noopener noreferrer">
                        <MapPin className="h-4 w-4 mr-2" />
                        Cómo Llegar
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-stone-200 shadow-lg">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="h-8 w-8 text-amber-600" />
                </div>
                <CardTitle className="text-2xl">Regístrate para Asistir</CardTitle>
                <CardDescription>
                  Completa tus datos para confirmar tu asistencia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name - Required */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-amber-600" />
                      Nombre Completo *
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Juan García / Familia Pérez"
                      required
                      className="text-lg py-6"
                    />
                  </div>

                  {/* Number of passes */}
                  <div className="space-y-2">
                    <Label htmlFor="passes" className="text-base flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-amber-600" />
                      ¿Cuántas personas asistirán? *
                    </Label>
                    <Select
                      value={String(passes)}
                      onValueChange={(value) => setPasses(parseInt(value))}
                    >
                      <SelectTrigger className="text-lg py-6">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: event.maxPassesPerGuest }, (_, i) => i + 1).map((num) => (
                          <SelectItem key={num} value={String(num)}>
                            {num} {num === 1 ? 'persona' : 'personas'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-stone-500">Máximo {event.maxPassesPerGuest} personas permitidas</p>
                  </div>

                  {/* Contact Info - Optional */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono (opcional)</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+52 55 1234 5678"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email (opcional)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>

                  {/* Dietary notes */}
                  <div className="space-y-2">
                    <Label htmlFor="dietary" className="flex items-center gap-2">
                      <UtensilsCrossed className="h-4 w-4 text-amber-600" />
                      Alergias o Restricciones Alimentarias
                    </Label>
                    <Textarea
                      id="dietary"
                      value={dietaryNotes}
                      onChange={(e) => setDietaryNotes(e.target.value)}
                      placeholder="Ej: Vegetariano, alergia a mariscos, etc."
                      className="resize-none"
                    />
                  </div>

                  {/* Song request */}
                  <div className="space-y-2">
                    <Label htmlFor="song" className="flex items-center gap-2">
                      <Music className="h-4 w-4 text-amber-600" />
                      Sugerencia de Canción
                    </Label>
                    <Input
                      id="song"
                      value={songRequest}
                      onChange={(e) => setSongRequest(e.target.value)}
                      placeholder="¿Qué canción te gustaría escuchar?"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-stone-800 hover:bg-stone-900 py-6 text-lg"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <PartyPopper className="mr-2 h-5 w-5" />
                        Confirmar Asistencia
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Gift Registry */}
      {event.giftRegistry && (event.giftRegistry.amazon || event.giftRegistry.liverpool || event.giftRegistry.bank) && (
        <section className="py-12 bg-stone-100">
          <div className="container mx-auto px-4 max-w-xl">
            <div className="text-center mb-8">
              <span className="text-4xl mb-4 block">🎁</span>
              <h2 className="text-2xl font-light text-stone-800">Mesa de Regalos</h2>
              <p className="text-stone-600 mt-2">Tu presencia es el mejor regalo</p>
            </div>

            <div className="grid gap-4">
              {event.giftRegistry.amazon && (
                <a href={event.giftRegistry.amazon} target="_blank" rel="noopener noreferrer">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📦</span>
                        <span className="font-medium">Amazon</span>
                      </div>
                      <ExternalLink className="h-5 w-5 text-stone-400" />
                    </CardContent>
                  </Card>
                </a>
              )}

              {event.giftRegistry.liverpool && (
                <a href={event.giftRegistry.liverpool} target="_blank" rel="noopener noreferrer">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🎁</span>
                        <span className="font-medium">Liverpool</span>
                      </div>
                      <ExternalLink className="h-5 w-5 text-stone-400" />
                    </CardContent>
                  </Card>
                </a>
              )}

              {event.giftRegistry.bank && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">🏦</span>
                      <span className="font-medium">Transferencia Bancaria</span>
                    </div>
                    <p className="text-stone-600 text-sm bg-stone-50 p-3 rounded-lg font-mono">
                      {event.giftRegistry.bank}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 text-center text-stone-500 text-sm">
        <p>Hecho con <Heart className="h-4 w-4 inline text-red-500" /> usando Celebra RSVP</p>
      </footer>
    </div>
  )
}
