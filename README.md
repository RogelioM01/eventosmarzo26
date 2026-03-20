# Celebra RSVP - Sistema de Gestión de Eventos

Sistema completo de confirmación de asistencia (RSVP) para eventos sociales, desarrollado con Next.js, Prisma, PostgreSQL (Supabase) y NextAuth.js.

## 🌟 Características Principales

### Panel del Anfitrión (Dashboard Autenticado)
- **Estadísticas RSVP**: Tarjetas visuales con "Invitados Totales", "Confirmados", "Cancelados" y "Pendientes"
- **Monitor del Sistema (Sysadmin)**: Dashboard con métricas reales del servidor (CPU, RAM, Uptime, Contenedores)
- **Gestión de Eventos**: CRUD completo incluyendo:
  - Nombre del evento
  - Fecha y hora
  - Lugar con enlace a Google Maps
  - Mesa de Regalos (Amazon, Liverpool, Cuenta Bancaria)
- **Lista de Invitados**:
  - Crear invitados con número de "Pases"
  - Vista de tabla con estado, notas dietéticas y solicitudes de canciones
- **Generador de WhatsApp**: Crea mensajes personalizados con enlace único RSVP
- **Exportar CSV**: Descarga la lista de invitados

### Experiencia del Invitado (Pública y Mobile-First)
- **Landing Page**: Diseño elegante con cuenta regresiva
- **Formulario RSVP**:
  - Confirmar asistencia (Sí/No)
  - Seleccionar número de asistentes (validado contra pases disponibles)
  - Campos para alergias/restricciones y sugerencia de canción
- **Estado de Confirmación**: Botones "Agregar al Calendario" y "Cómo Llegar"

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Base de Datos**: PostgreSQL (Supabase) + Prisma ORM
- **Autenticación**: NextAuth.js v5 (Auth.js)
- **Iconos**: Lucide React

## 📦 Instalación

```bash
# Instalar dependencias
yarn install

# Configurar variables de entorno
cp .env.example .env

# Generar cliente Prisma
npx prisma generate

# Crear tablas en la base de datos
npx prisma db push

# Crear usuario administrador
curl -X POST http://localhost:3000/api/seed

# Iniciar servidor de desarrollo
yarn dev
```

## 🔐 Variables de Entorno

```env
# Base de Datos (Supabase PostgreSQL)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth
AUTH_SECRET="tu-secreto-seguro"
NEXTAUTH_URL="https://tu-dominio.com"

# Credenciales por defecto
DEFAULT_HOST_EMAIL="admin@ejemplo.com"
DEFAULT_HOST_PASSWORD="contraseña-segura"
```

## 🌐 Endpoints API

### Públicos
- `GET /api/health` - Health check
- `GET /api/system/metrics` - Métricas del sistema
- `GET /api/public/rsvp/:token` - Obtener invitación
- `POST /api/public/rsvp/:token` - Confirmar asistencia

### Protegidos (requieren autenticación)
- `GET/POST /api/events` - Listar/Crear eventos
- `GET/PUT/DELETE /api/events/:id` - Gestionar evento
- `GET/POST /api/events/:id/guests` - Listar/Crear invitados
- `PUT/DELETE /api/guests/:id` - Gestionar invitado
- `GET /api/guests/:id/whatsapp` - Generar mensaje WhatsApp
- `GET /api/events/:id/export` - Exportar CSV
- `GET /api/stats` - Estadísticas del dashboard

## 📱 Rutas de la Aplicación

- `/` - Landing page pública
- `/login` - Inicio de sesión
- `/dashboard` - Panel de administración
- `/rsvp/:token` - Página de confirmación para invitados

## 🎨 Diseño

- Tema minimalista y sofisticado
- Interfaz en español (Latinoamérica)
- Código fuente en inglés
- Colores: Stone, Amber, White
- Mobile-first responsive design

## 📄 Licencia

MIT License
