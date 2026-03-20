'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        setError('Credenciales inválidas')
        toast.error('Error al iniciar sesión')
      } else {
        toast.success('¡Bienvenido!')
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('Error al conectar con el servidor')
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-amber-600" />
            <span className="text-2xl font-light tracking-wider text-stone-800">Celebra</span>
          </Link>
          <p className="text-stone-600">Ingresa a tu panel de administración</p>
        </div>

        <Card className="border-stone-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-stone-800">Iniciar Sesión</CardTitle>
            <CardDescription className="text-center">
              Accede para gestionar tus eventos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-stone-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-stone-300"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-stone-800 hover:bg-stone-900"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  'Ingresar'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-stone-200">
              <p className="text-center text-sm text-stone-500">
                Credenciales de prueba:
              </p>
              <p className="text-center text-xs text-stone-400 mt-1">
                2dcommx01@gmail.com / Roge98023992
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}