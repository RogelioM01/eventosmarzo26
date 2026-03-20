'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, MapPin, Clock, Gift, Users, ChevronRight, Heart, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [mounted, setMounted] = useState(false)

  // Demo event date (30 days from now)
  const eventDate = new Date()
  eventDate.setDate(eventDate.getDate() + 30)

  useEffect(() => {
    setMounted(true)
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
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1627618996178-360a71be868d?w=1920&q=80')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-white" />
        
        <div className="relative container mx-auto px-4 py-20">
          <nav className="flex justify-between items-center mb-16">
            <div className="flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-amber-600" />
              <span className="text-2xl font-light tracking-wider text-stone-800">Celebra</span>
            </div>
            <Link href="/login">
              <Button variant="outline" className="border-stone-300 hover:bg-stone-100">
                Iniciar Sesión
              </Button>
            </Link>
          </nav>

          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-full text-sm mb-8">
              <Heart className="h-4 w-4" />
              <span>La forma más elegante de gestionar tus eventos</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-light text-stone-800 mb-6 tracking-tight">
              Momentos que
              <span className="block font-normal italic text-amber-700">merecen ser celebrados</span>
            </h1>
            
            <p className="text-xl text-stone-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Crea invitaciones digitales elegantes, gestiona confirmaciones y haz que tu evento sea inolvidable.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="bg-stone-800 hover:bg-stone-900 text-white px-8 py-6 text-lg">
                  Comenzar Ahora
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-stone-300 px-8 py-6 text-lg">
                Ver Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Countdown Demo Section */}
      <section className="py-20 bg-stone-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-amber-400 uppercase tracking-widest text-sm mb-4">Cuenta Regresiva</p>
            <h2 className="text-3xl md:text-4xl font-light">Próximo Evento Demo</h2>
          </div>
          
          <div className="flex justify-center gap-4 md:gap-8">
            {mounted && [
              { value: countdown.days, label: 'Días' },
              { value: countdown.hours, label: 'Horas' },
              { value: countdown.minutes, label: 'Minutos' },
              { value: countdown.seconds, label: 'Segundos' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="bg-stone-800 rounded-lg p-4 md:p-6 min-w-[70px] md:min-w-[100px]">
                  <span className="text-3xl md:text-5xl font-light text-amber-400">
                    {String(item.value).padStart(2, '0')}
                  </span>
                </div>
                <p className="text-stone-400 text-sm mt-2 uppercase tracking-wider">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-stone-800 mb-4">Todo lo que necesitas</h2>
            <p className="text-stone-600 max-w-2xl mx-auto">Gestiona cada aspecto de tu evento desde un solo lugar</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-stone-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-amber-700" />
                </div>
                <CardTitle className="text-stone-800">Gestión de Invitados</CardTitle>
                <CardDescription>Organiza tu lista con grupos familiares y pases personalizados</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-stone-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                  <CalendarDays className="h-6 w-6 text-amber-700" />
                </div>
                <CardTitle className="text-stone-800">Confirmaciones en Tiempo Real</CardTitle>
                <CardDescription>Sigue las respuestas y obtén estadísticas al instante</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-stone-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                  <Gift className="h-6 w-6 text-amber-700" />
                </div>
                <CardTitle className="text-stone-800">Mesa de Regalos</CardTitle>
                <CardDescription>Integra enlaces a Amazon, Liverpool o datos bancarios</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-stone-100">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-light text-stone-800 mb-6">Listo para tu próximo evento?</h2>
            <p className="text-stone-600 mb-8">Comienza a gestionar tus invitaciones de manera profesional y elegante</p>
            <Link href="/login">
              <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white px-8">
                Crear Mi Evento
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-stone-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600" />
              <span className="text-stone-600">Celebra RSVP</span>
            </div>
            <p className="text-stone-500 text-sm">© 2025 Todos los derechos reservados</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
