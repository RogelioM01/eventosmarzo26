'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  CalendarDays, MapPin, Clock, Gift, CheckCircle, XCircle, 
  Sparkles, Loader2, PartyPopper, Heart, ExternalLink, Calendar,
  Music, UtensilsCrossed
} from 'lucide-react'
import Link from 'next/link'

export default function RSVPPage() {
  const params = useParams()
  const token = params.token
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  // Form state
  const [attending, setAttending] = useState(null)
  const [attendees, setAttendees] = useState(1)
  const [dietaryNotes, setDietaryNotes] = useState('')
  const [songRequest, setSongRequest] = useState('')

  useEffect(() => {
    fetchRSVPData()
  }, [token])

  useEffect(() => {
    if (data?.event?.date) {
      const eventDate = new Date(data.event.date)
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
  }, [data])

  const fetchRSVPData = async () => {
    try {
      const res = await fetch(`/api/public/rsvp/${token}`)
      if (!res.ok) {
        throw new Error('Not found')
      }
      const responseData = await res.json()
      setData(responseData)
      
      // Pre-fill form if already responded
      if (responseData.guest.status !== 'pending') {
        setSubmitted(true)
        setAttending(responseData.guest.status === 'confirmed')
        setAttendees(responseData.guest.confirmedPasses)
        setDietaryNotes(responseData.guest.dietaryNotes || '')
        setSongRequest(responseData.guest.songRequest || '')
      }
    } catch (error) {
      console.error('Error fetching RSVP:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (attending === null) {
      toast.error('Por favor indica si asistirás')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/public/rsvp/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmed: attending,
          confirmedPasses: attending ? attendees : 0,
          dietaryNotes: dietaryNotes || null,
          songRequest: songRequest || null
        })
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Error al enviar')
      }

      setSubmitted(true)
      toast.success(attending ? '¡Confirmación enviada!' : 'Respuesta registrada')
    } catch (error) {
      toast.error(error.message || 'Error al enviar la respuesta')
    } finally {
      setSubmitting(false)
    }
  }

  const addToCalendar = () => {
    if (!data?.event) return
    
    const event = data.event
    const startDate = new Date(event.date)
    const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000) // +4 hours

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
          <p className="text-stone-600">Cargando invitación...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-stone-50 to-white p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12">
            <XCircle className="h-16 w-16 text-stone-300 mx-auto mb-4" />
            <h1 className="text-xl font-medium text-stone-800 mb-2">Invitación no encontrada</h1>
            <p className="text-stone-600 mb-6">Este enlace puede haber expirado o no es válido.</p>
            <Link href="/">
              <Button variant="outline">Ir al inicio</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { guest, event } = data
  const eventDate = new Date(event.date)
  const giftRegistry = event.giftRegistry

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1595113316349-9fa4eb24f884?w=1920&q=80')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-white" />
        
        <div className="relative container mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <Sparkles className="h-6 w-6 text-amber-600" />
            <span className="text-lg font-light tracking-wider text-stone-800">Estás Invitado</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-light text-stone-800 mb-4 tracking-tight">
            {event.name}
          </h1>
          
          <p className="text-xl text-amber-700 mb-8">
            {event.hostName && `Organizado por ${event.hostName}`}
          </p>

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
            <p className="text-stone-600 max-w-2xl mx-auto mb-8">{event.description}</p>
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

      {/* RSVP Form or Confirmation */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-xl">
          {submitted ? (
            <Card className="border-stone-200 shadow-lg">
              <CardContent className="py-12 text-center">
                {attending ? (
                  <>
                    <PartyPopper className="h-16 w-16 text-amber-600 mx-auto mb-6" />
                    <h2 className="text-2xl font-medium text-stone-800 mb-2">¡Gracias por confirmar!</h2>
                    <p className="text-stone-600 mb-8">
                      Te esperamos con {attendees} {attendees === 1 ? 'persona' : 'personas'}
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
                  </>
                ) : (
                  <>
                    <Heart className="h-16 w-16 text-stone-400 mx-auto mb-6" />
                    <h2 className="text-2xl font-medium text-stone-800 mb-2">Lamentamos que no puedas asistir</h2>
                    <p className="text-stone-600">
                      Gracias por hacérnoslo saber. ¡Te extrañaremos!
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-stone-200 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Confirma tu Asistencia</CardTitle>
                <CardDescription>
                  Hola <span className="font-medium text-stone-700">{guest.name}</span>, 
                  tienes <span className="font-medium text-amber-600">{guest.passes} {guest.passes === 1 ? 'pase' : 'pases'}</span> disponibles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Attendance */}
                  <div className="space-y-3">
                    <Label className="text-base">¿Asistirás al evento?</Label>
                    <RadioGroup
                      value={attending === null ? undefined : attending ? 'yes' : 'no'}
                      onValueChange={(value) => setAttending(value === 'yes')}
                      className="flex gap-4"
                    >
                      <div className="flex-1">
                        <RadioGroupItem value="yes" id="yes" className="peer sr-only" />
                        <Label
                          htmlFor="yes"
                          className="flex flex-col items-center justify-between rounded-lg border-2 border-stone-200 bg-white p-4 hover:bg-stone-50 peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-50 cursor-pointer transition-colors"
                        >
                          <CheckCircle className="h-8 w-8 mb-2 text-green-600" />
                          <span className="font-medium">Sí, asistiré</span>
                        </Label>
                      </div>
                      <div className="flex-1">
                        <RadioGroupItem value="no" id="no" className="peer sr-only" />
                        <Label
                          htmlFor="no"
                          className="flex flex-col items-center justify-between rounded-lg border-2 border-stone-200 bg-white p-4 hover:bg-stone-50 peer-data-[state=checked]:border-red-500 peer-data-[state=checked]:bg-red-50 cursor-pointer transition-colors"
                        >
                          <XCircle className="h-8 w-8 mb-2 text-red-600" />
                          <span className="font-medium">No podré asistir</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {attending && (
                    <>
                      {/* Number of attendees */}
                      <div className="space-y-3">
                        <Label htmlFor="attendees" className="text-base flex items-center gap-2">
                          <Users className="h-4 w-4 text-amber-600" />
                          ¿Cuántas personas asistirán?
                        </Label>
                        <Select
                          value={String(attendees)}
                          onValueChange={(value) => setAttendees(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: guest.passes }, (_, i) => i + 1).map((num) => (
                              <SelectItem key={num} value={String(num)}>
                                {num} {num === 1 ? 'persona' : 'personas'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Dietary notes */}
                      <div className="space-y-3">
                        <Label htmlFor="dietary" className="text-base flex items-center gap-2">
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
                      <div className="space-y-3">
                        <Label htmlFor="song" className="text-base flex items-center gap-2">
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
                    </>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-stone-800 hover:bg-stone-900 py-6 text-lg"
                    disabled={submitting || attending === null}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Confirmar Respuesta'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Gift Registry */}
      {giftRegistry && (giftRegistry.amazon || giftRegistry.liverpool || giftRegistry.bank) && (
        <section className="py-12 bg-stone-100">
          <div className="container mx-auto px-4 max-w-xl">
            <div className="text-center mb-8">
              <Gift className="h-10 w-10 text-amber-600 mx-auto mb-4" />
              <h2 className="text-2xl font-light text-stone-800">Mesa de Regalos</h2>
              <p className="text-stone-600 mt-2">Tu presencia es el mejor regalo, pero si deseas obsequiarnos algo...</p>
            </div>

            <div className="grid gap-4">
              {giftRegistry.amazon && (
                <a href={giftRegistry.amazon} target="_blank" rel="noopener noreferrer">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                          <span className="text-xl">📦</span>
                        </div>
                        <span className="font-medium text-stone-800">Amazon</span>
                      </div>
                      <ExternalLink className="h-5 w-5 text-stone-400" />
                    </CardContent>
                  </Card>
                </a>
              )}

              {giftRegistry.liverpool && (
                <a href={giftRegistry.liverpool} target="_blank" rel="noopener noreferrer">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                          <span className="text-xl">🎁</span>
                        </div>
                        <span className="font-medium text-stone-800">Liverpool</span>
                      </div>
                      <ExternalLink className="h-5 w-5 text-stone-400" />
                    </CardContent>
                  </Card>
                </a>
              )}

              {giftRegistry.bank && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-xl">🏦</span>
                      </div>
                      <span className="font-medium text-stone-800">Transferencia Bancaria</span>
                    </div>
                    <p className="text-stone-600 text-sm bg-stone-50 p-3 rounded-lg font-mono">
                      {giftRegistry.bank}
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

// Missing Users import
import { Users } from 'lucide-react'
