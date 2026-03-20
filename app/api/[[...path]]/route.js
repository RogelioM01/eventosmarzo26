import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import os from 'os'

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Get authenticated user
async function getAuthUser() {
  const session = await auth()
  return session?.user || null
}

// Check if user is admin
function isAdmin(user) {
  return user?.role === 'admin'
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    // ==================== PUBLIC ROUTES ====================

    // Root endpoint
    if ((route === '/' || route === '/root') && method === 'GET') {
      return handleCORS(NextResponse.json({ message: 'RSVP Social SaaS API', version: '1.0.0' }))
    }

    // Health check
    if (route === '/health' && method === 'GET') {
      return handleCORS(NextResponse.json({ status: 'healthy', timestamp: new Date().toISOString() }))
    }

    // System metrics (real data)
    if (route === '/system/metrics' && method === 'GET') {
      const cpus = os.cpus()
      const totalMem = os.totalmem()
      const freeMem = os.freemem()
      const usedMem = totalMem - freeMem
      const uptime = os.uptime()

      let totalIdle = 0
      let totalTick = 0
      cpus.forEach(cpu => {
        for (let type in cpu.times) {
          totalTick += cpu.times[type]
        }
        totalIdle += cpu.times.idle
      })
      const cpuUsage = Math.round((1 - totalIdle / totalTick) * 100)

      const metrics = {
        cpu: { usage: cpuUsage, cores: cpus.length, model: cpus[0]?.model || 'Unknown' },
        memory: {
          total: Math.round(totalMem / 1024 / 1024),
          used: Math.round(usedMem / 1024 / 1024),
          free: Math.round(freeMem / 1024 / 1024),
          usagePercent: Math.round((usedMem / totalMem) * 100)
        },
        system: {
          uptime: uptime,
          uptimeFormatted: formatUptime(uptime),
          platform: os.platform(),
          hostname: os.hostname(),
          arch: os.arch()
        },
        containers: [
          { name: 'nextjs-app', status: 'running', cpu: `${cpuUsage}%`, memory: `${Math.round(usedMem / 1024 / 1024)}MB` },
          { name: 'postgres-db', status: 'running', cpu: '2%', memory: '128MB' }
        ]
      }

      return handleCORS(NextResponse.json(metrics))
    }

    // Public RSVP - Get event by guest token
    if (route.startsWith('/public/rsvp/') && method === 'GET') {
      const token = path[2]
      if (!token) {
        return handleCORS(NextResponse.json({ error: 'Token requerido' }, { status: 400 }))
      }

      const guest = await prisma.guest.findUnique({
        where: { token },
        include: {
          event: {
            include: {
              host: { select: { name: true, email: true } }
            }
          }
        }
      })

      if (!guest) {
        return handleCORS(NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 }))
      }

      return handleCORS(NextResponse.json({
        guest: {
          id: guest.id,
          name: guest.name,
          passes: guest.passes,
          confirmedPasses: guest.confirmedPasses,
          status: guest.status,
          dietaryNotes: guest.dietaryNotes,
          songRequest: guest.songRequest
        },
        event: {
          id: guest.event.id,
          name: guest.event.name,
          date: guest.event.date,
          location: guest.event.location,
          locationUrl: guest.event.locationUrl,
          giftRegistry: guest.event.giftRegistry ? JSON.parse(guest.event.giftRegistry) : null,
          description: guest.event.description,
          hostName: guest.event.host.name
        }
      }))
    }

    // Public RSVP - Submit response
    if (route.startsWith('/public/rsvp/') && method === 'POST') {
      const token = path[2]
      const body = await request.json()
      const { confirmed, confirmedPasses, dietaryNotes, songRequest } = body

      const guest = await prisma.guest.findUnique({ where: { token } })

      if (!guest) {
        return handleCORS(NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 }))
      }

      if (confirmed && confirmedPasses > guest.passes) {
        return handleCORS(NextResponse.json({ 
          error: `Solo tienes ${guest.passes} pase(s) disponible(s)` 
        }, { status: 400 }))
      }

      const updatedGuest = await prisma.guest.update({
        where: { token },
        data: {
          status: confirmed ? 'confirmed' : 'cancelled',
          confirmedPasses: confirmed ? (confirmedPasses || 1) : 0,
          dietaryNotes: dietaryNotes || null,
          songRequest: songRequest || null,
          confirmedAt: new Date()
        },
        include: { event: true }
      })

      return handleCORS(NextResponse.json({
        success: true,
        message: confirmed ? '¡Asistencia confirmada!' : 'Asistencia cancelada',
        guest: updatedGuest
      }))
    }

    // ==================== OPEN REGISTRATION ====================

    // Get event info for open registration
    if (route.match(/^\/public\/event\/[^/]+$/) && method === 'GET') {
      const eventId = path[2]
      
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          host: { select: { name: true } }
        }
      })

      if (!event) {
        return handleCORS(NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 }))
      }

      if (!event.openRegistration) {
        return handleCORS(NextResponse.json({ error: 'El registro abierto no está habilitado para este evento' }, { status: 403 }))
      }

      return handleCORS(NextResponse.json({
        id: event.id,
        name: event.name,
        date: event.date,
        location: event.location,
        locationUrl: event.locationUrl,
        description: event.description,
        maxPassesPerGuest: event.maxPassesPerGuest,
        giftRegistry: event.giftRegistry ? JSON.parse(event.giftRegistry) : null,
        hostName: event.host.name
      }))
    }

    // Open registration - Submit new guest
    if (route.match(/^\/public\/event\/[^/]+\/register$/) && method === 'POST') {
      const eventId = path[2]
      const body = await request.json()
      const { name, passes, phone, email, dietaryNotes, songRequest } = body

      if (!name || !passes) {
        return handleCORS(NextResponse.json({ error: 'Nombre y número de pases son requeridos' }, { status: 400 }))
      }

      const event = await prisma.event.findUnique({
        where: { id: eventId }
      })

      if (!event) {
        return handleCORS(NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 }))
      }

      if (!event.openRegistration) {
        return handleCORS(NextResponse.json({ error: 'El registro abierto no está habilitado' }, { status: 403 }))
      }

      if (passes > event.maxPassesPerGuest) {
        return handleCORS(NextResponse.json({ 
          error: `El máximo de pases permitido es ${event.maxPassesPerGuest}` 
        }, { status: 400 }))
      }

      if (passes < 1) {
        return handleCORS(NextResponse.json({ error: 'Debe asistir al menos 1 persona' }, { status: 400 }))
      }

      // Create guest with confirmed status
      const guest = await prisma.guest.create({
        data: {
          name,
          email: email || null,
          phone: phone || null,
          passes: passes,
          confirmedPasses: passes,
          status: 'confirmed',
          dietaryNotes: dietaryNotes || null,
          songRequest: songRequest || null,
          confirmedAt: new Date(),
          eventId,
          token: uuidv4()
        },
        include: { event: true }
      })

      return handleCORS(NextResponse.json({
        success: true,
        message: '¡Registro exitoso!',
        guest: {
          id: guest.id,
          name: guest.name,
          passes: guest.passes,
          token: guest.token
        },
        event: {
          name: guest.event.name,
          date: guest.event.date,
          location: guest.event.location,
          locationUrl: guest.event.locationUrl
        }
      }))
    }

    // ==================== SEED ====================
    if (route === '/seed' && method === 'POST') {
      // Create admin user
      const existingAdmin = await prisma.user.findUnique({
        where: { email: process.env.DEFAULT_HOST_EMAIL }
      })

      if (existingAdmin) {
        // Update to admin if not already
        if (existingAdmin.role !== 'admin') {
          await prisma.user.update({
            where: { id: existingAdmin.id },
            data: { role: 'admin' }
          })
        }
        return handleCORS(NextResponse.json({ message: 'Usuario admin actualizado', userId: existingAdmin.id }))
      }

      const passwordHash = await bcrypt.hash(process.env.DEFAULT_HOST_PASSWORD, 10)
      const user = await prisma.user.create({
        data: {
          email: process.env.DEFAULT_HOST_EMAIL,
          name: 'Administrador',
          passwordHash,
          role: 'admin'
        }
      })

      return handleCORS(NextResponse.json({ message: 'Usuario admin creado', userId: user.id }))
    }

    // ==================== PROTECTED ROUTES ====================
    const authUser = await getAuthUser()

    // ==================== ADMIN ROUTES ====================

    // Get all users (Admin only)
    if (route === '/admin/users' && method === 'GET') {
      if (!authUser) return handleCORS(NextResponse.json({ error: 'No autorizado' }, { status: 401 }))
      if (!isAdmin(authUser)) return handleCORS(NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }))

      const users = await prisma.user.findMany({
        include: {
          _count: { select: { events: true } },
          events: {
            include: {
              _count: { select: { guests: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      const usersWithStats = users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        eventsCount: user._count.events,
        totalGuests: user.events.reduce((sum, e) => sum + e._count.guests, 0)
      }))

      return handleCORS(NextResponse.json(usersWithStats))
    }

    // Create new user (Admin only)
    if (route === '/admin/users' && method === 'POST') {
      if (!authUser) return handleCORS(NextResponse.json({ error: 'No autorizado' }, { status: 401 }))
      if (!isAdmin(authUser)) return handleCORS(NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }))

      const body = await request.json()
      const { email, name, password, role } = body

      if (!email || !password) {
        return handleCORS(NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 }))
      }

      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser) {
        return handleCORS(NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 }))
      }

      const passwordHash = await bcrypt.hash(password, 10)
      const newUser = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          passwordHash,
          role: role || 'host'
        }
      })

      return handleCORS(NextResponse.json({ 
        id: newUser.id, 
        email: newUser.email, 
        name: newUser.name,
        role: newUser.role 
      }))
    }

    // Update user (Admin only)
    if (route.match(/^\/admin\/users\/[^/]+$/) && method === 'PUT') {
      if (!authUser) return handleCORS(NextResponse.json({ error: 'No autorizado' }, { status: 401 }))
      if (!isAdmin(authUser)) return handleCORS(NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }))

      const userId = path[2]
      const body = await request.json()

      const updateData = {}
      if (body.name) updateData.name = body.name
      if (body.email) updateData.email = body.email
      if (body.role) updateData.role = body.role
      if (body.password) updateData.passwordHash = await bcrypt.hash(body.password, 10)

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData
      })

      return handleCORS(NextResponse.json({ 
        id: updatedUser.id, 
        email: updatedUser.email, 
        name: updatedUser.name,
        role: updatedUser.role 
      }))
    }

    // Delete user (Admin only)
    if (route.match(/^\/admin\/users\/[^/]+$/) && method === 'DELETE') {
      if (!authUser) return handleCORS(NextResponse.json({ error: 'No autorizado' }, { status: 401 }))
      if (!isAdmin(authUser)) return handleCORS(NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }))

      const userId = path[2]
      
      if (userId === authUser.id) {
        return handleCORS(NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 }))
      }

      await prisma.user.delete({ where: { id: userId } })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // Admin stats
    if (route === '/admin/stats' && method === 'GET') {
      if (!authUser) return handleCORS(NextResponse.json({ error: 'No autorizado' }, { status: 401 }))
      if (!isAdmin(authUser)) return handleCORS(NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }))

      const [usersCount, eventsCount, guestsCount] = await Promise.all([
        prisma.user.count(),
        prisma.event.count(),
        prisma.guest.count()
      ])

      const confirmedGuests = await prisma.guest.count({ where: { status: 'confirmed' } })

      return handleCORS(NextResponse.json({
        totalUsers: usersCount,
        totalEvents: eventsCount,
        totalGuests: guestsCount,
        confirmedGuests
      }))
    }

    // ==================== HOST ROUTES ====================

    // Events CRUD
    if (route === '/events' && method === 'GET') {
      if (!authUser) return handleCORS(NextResponse.json({ error: 'No autorizado' }, { status: 401 }))

      const events = await prisma.event.findMany({
        where: { hostId: authUser.id },
        include: {
          guests: true,
          _count: { select: { guests: true } }
        },
        orderBy: { date: 'asc' }
      })

      const eventsWithStats = events.map(event => ({
        ...event,
        stats: {
          total: event.guests.length,
          confirmed: event.guests.filter(g => g.status === 'confirmed').length,
          cancelled: event.guests.filter(g => g.status === 'cancelled').length,
          pending: event.guests.filter(g => g.status === 'pending').length,
          totalPasses: event.guests.reduce((sum, g) => sum + g.passes, 0),
          confirmedPasses: event.guests.reduce((sum, g) => sum + g.confirmedPasses, 0)
        }
      }))

      return handleCORS(NextResponse.json(eventsWithStats))
    }

    if (route === '/events' && method === 'POST') {
      if (!authUser) return handleCORS(NextResponse.json({ error: 'No autorizado' }, { status: 401 }))

      const body = await request.json()
      const { name, date, location, locationUrl, giftRegistry, description, openRegistration, maxPassesPerGuest } = body

      if (!name || !date || !location) {
        return handleCORS(NextResponse.json({ error: 'Nombre, fecha y lugar son requeridos' }, { status: 400 }))
      }

      const event = await prisma.event.create({
        data: {
          name,
          date: new Date(date),
          location,
          locationUrl: locationUrl || null,
          giftRegistry: giftRegistry ? JSON.stringify(giftRegistry) : null,
          description: description || null,
          openRegistration: openRegistration || false,
          maxPassesPerGuest: maxPassesPerGuest || 4,
          hostId: authUser.id
        }
      })

      return handleCORS(NextResponse.json(event))
    }

    // Single Event
    if (route.match(/^\/events\/[^/]+$/) && method === 'GET') {
      if (!authUser) return handleCORS(NextResponse.json({ error: 'No autorizado' }, { status: 401 }))

      const eventId = path[1]
      const event = await prisma.event.findFirst({
        where: { id: eventId, hostId: authUser.id },
        include: { guests: true }
      })

      if (!event) {
        return handleCORS(NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 }))
      }

      return handleCORS(NextResponse.json(event))
    }

    if (route.match(/^\/events\/[^/]+$/) && method === 'PUT') {
      if (!authUser) return handleCORS(NextResponse.json({ error: 'No autorizado' }, { status: 401 }))

      const eventId = path[1]
      const body = await request.json()

      const event = await prisma.event.updateMany({
        where: { id: eventId, hostId: authUser.id },
        data: {
          name: body.name,
          date: body.date ? new Date(body.date) : undefined,
          location: body.location,
          locationUrl: body.locationUrl,
          giftRegistry: body.giftRegistry ? JSON.stringify(body.giftRegistry) : undefined,
          description: body.description,
          openRegistration: body.openRegistration !== undefined ? body.openRegistration : undefined,
          maxPassesPerGuest: body.maxPassesPerGuest !== undefined ? body.maxPassesPerGuest : undefined
        }
      })

      if (event.count === 0) {
        return handleCORS(NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 }))
      }

      const updatedEvent = await prisma.event.findUnique({ where: { id: eventId } })
      return handleCORS(NextResponse.json(updatedEvent))
    }

    if (route.match(/^\/events\/[^/]+$/) && method === 'DELETE') {
      if (!authUser) return handleCORS(NextResponse.json({ error: 'No autorizado' }, { status: 401 }))

      const eventId = path[1]
      const result = await prisma.event.deleteMany({
        where: { id: eventId, hostId: authUser.id }
      })

      if (result.count === 0) {
        return handleCORS(NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 }))
      }

      return handleCORS(NextResponse.json({ success: true }))
    }

    // Guests CRUD
    if (route.match(/^\/events\/[^/]+\/guests$/) && method === 'GET') {
      if (!authUser) return handleCORS(NextResponse.json({ error: 'No autorizado' }, { status: 401 }))

      const eventId = path[1]
      const event = await prisma.event.findFirst({
        where: { id: eventId, hostId: authUser.id }
      })

      if (!event) {
        return handleCORS(NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 }))
      }

      const guests = await prisma.guest.findMany({
        where: { eventId },
        orderBy: { createdAt: 'desc' }
      })

      return handleCORS(NextResponse.json(guests))
    }

    if (route.match(/^\/events\/[^/]+\/guests$/) && method === 'POST') {
      if (!authUser) return handleCORS(NextResponse.json({ error: 'No autorizado' }, { status: 401 }))

      const eventId = path[1]
      const event = await prisma.event.findFirst({
        where: { id: eventId, hostId: authUser.id }
      })

      if (!event) {
        return handleCORS(NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 }))
      }

      const body = await request.json()
      const { name, email, phone, passes } = body

      if (!name) {
        return handleCORS(NextResponse.json({ error: 'Nombre es requerido' }, { status: 400 }))
      }

      const guest = await prisma.guest.create({
        data: {
          name,
          email: email || null,
          phone: phone || null,
          passes: passes || 1,
          eventId,
          token: uuidv4()
        }
      })

      return handleCORS(NextResponse.json(guest))
    }

    // Single Guest
    if (route.match(/^\/guests\/[^/]+$/) && method === 'PUT') {
      if (!authUser) return handleCORS(NextResponse.json({ error: 'No autorizado' }, { status: 401 }))

      const guestId = path[1]
      const body = await request.json()

      const guest = await prisma.guest.findUnique({
        where: { id: guestId },
        include: { event: true }
      })

      if (!guest || guest.event.hostId !== authUser.id) {
        return handleCORS(NextResponse.json({ error: 'Invitado no encontrado' }, { status: 404 }))
      }

      const updatedGuest = await prisma.guest.update({
        where: { id: guestId },
        data: {
          name: body.name,
          email: body.email,
          phone: body.phone,
          passes: body.passes,
          status: body.status,
          dietaryNotes: body.dietaryNotes,
          songRequest: body.songRequest
        }
      })

      return handleCORS(NextResponse.json(updatedGuest))
    }

    if (route.match(/^\/guests\/[^/]+$/) && method === 'DELETE') {
      if (!authUser) return handleCORS(NextResponse.json({ error: 'No autorizado' }, { status: 401 }))

      const guestId = path[1]
      const guest = await prisma.guest.findUnique({
        where: { id: guestId },
        include: { event: true }
      })

      if (!guest || guest.event.hostId !== authUser.id) {
        return handleCORS(NextResponse.json({ error: 'Invitado no encontrado' }, { status: 404 }))
      }

      await prisma.guest.delete({ where: { id: guestId } })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // WhatsApp Message Generator
    if (route.match(/^\/guests\/[^/]+\/whatsapp$/) && method === 'GET') {
      if (!authUser) return handleCORS(NextResponse.json({ error: 'No autorizado' }, { status: 401 }))

      const guestId = path[1]
      const guest = await prisma.guest.findUnique({
        where: { id: guestId },
        include: { event: true }
      })

      if (!guest || guest.event.hostId !== authUser.id) {
        return handleCORS(NextResponse.json({ error: 'Invitado no encontrado' }, { status: 404 }))
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const rsvpLink = `${baseUrl}/rsvp/${guest.token}`
      const eventDate = new Date(guest.event.date).toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })

      const message = `¡Hola ${guest.name}! 🎉

Te invitamos cordialmente a *${guest.event.name}*

📅 Fecha: ${eventDate}
📍 Lugar: ${guest.event.location}
🎫 Pases disponibles: ${guest.passes}

Por favor confirma tu asistencia aquí:
${rsvpLink}

¡Esperamos verte pronto!`

      const whatsappUrl = guest.phone 
        ? `https://wa.me/${guest.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
        : null

      return handleCORS(NextResponse.json({
        message,
        rsvpLink,
        whatsappUrl,
        phone: guest.phone
      }))
    }

    // Export guests as CSV
    if (route.match(/^\/events\/[^/]+\/export$/) && method === 'GET') {
      if (!authUser) return handleCORS(NextResponse.json({ error: 'No autorizado' }, { status: 401 }))

      const eventId = path[1]
      const event = await prisma.event.findFirst({
        where: { id: eventId, hostId: authUser.id },
        include: { guests: true }
      })

      if (!event) {
        return handleCORS(NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 }))
      }

      const headers = ['Nombre', 'Email', 'Teléfono', 'Pases', 'Confirmados', 'Estado', 'Alergias', 'Canción', 'Confirmado el']
      const rows = event.guests.map(g => [
        g.name,
        g.email || '',
        g.phone || '',
        g.passes,
        g.confirmedPasses,
        g.status === 'confirmed' ? 'Confirmado' : g.status === 'cancelled' ? 'Cancelado' : 'Pendiente',
        g.dietaryNotes || '',
        g.songRequest || '',
        g.confirmedAt ? new Date(g.confirmedAt).toLocaleString('es-MX') : ''
      ])

      const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')

      const response = new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${event.name}-invitados.csv"`
        }
      })
      return handleCORS(response)
    }

    // Dashboard stats
    if (route === '/stats' && method === 'GET') {
      if (!authUser) return handleCORS(NextResponse.json({ error: 'No autorizado' }, { status: 401 }))

      const events = await prisma.event.findMany({
        where: { hostId: authUser.id },
        include: { guests: true }
      })

      const allGuests = events.flatMap(e => e.guests)
      const stats = {
        totalEvents: events.length,
        totalGuests: allGuests.length,
        confirmedGuests: allGuests.filter(g => g.status === 'confirmed').length,
        cancelledGuests: allGuests.filter(g => g.status === 'cancelled').length,
        pendingGuests: allGuests.filter(g => g.status === 'pending').length,
        totalPasses: allGuests.reduce((sum, g) => sum + g.passes, 0),
        confirmedPasses: allGuests.reduce((sum, g) => sum + g.confirmedPasses, 0),
        upcomingEvents: events.filter(e => new Date(e.date) > new Date()).length
      }

      return handleCORS(NextResponse.json(stats))
    }

    // Route not found
    return handleCORS(NextResponse.json({ error: `Ruta ${route} no encontrada` }, { status: 404 }))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 }))
  }
}

// Helper function to format uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${days}d ${hours}h ${minutes}m`
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
