'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import {
  Building2, Users, DollarSign, Receipt, Bell, LogOut, Settings, Eye, EyeOff,
  CheckCircle2, XCircle, Clock, Home, TrendingUp, TrendingDown, AlertCircle,
  Plus, UserPlus, Shield, Calendar, ChevronLeft, ChevronRight, Trash2, Edit,
  LayoutDashboard, Wallet, FileText, RefreshCw, Search, Menu, X, Sparkles, KeyRound, Mail, Download, Loader2
} from 'lucide-react'

// ==================== TYPES ====================
interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'OWNER'
  isActive: boolean
  phone?: string
  apartment?: {
    id: string
    number: number
    building: { id: string; name: string }
  }
}

interface Building {
  id: string
  name: string
  address?: string
  city?: string
  description?: string
  apartments: Apartment[]
  _count?: { apartments: number }
}

interface Apartment {
  id: string
  number: number
  buildingId: string
  ownerName: string
  monthlyFee: number
  userId?: string
  owner?: { id: string; name: string; email: string; isActive: boolean }
  building?: Building
  cotisations?: Cotisation[]
}

interface Cotisation {
  id: string
  apartmentId: string
  month: number
  year: number
  amount: number
  isPaid: boolean
  validatedAt?: string
  apartment?: Apartment & { owner?: { id: string; name: string }; building?: Building }
}

interface Expense {
  id: string
  buildingId: string
  month: number
  year: number
  amount: number
  description: string
  category: string
  building?: Building
}

interface CleaningFee {
  id: string
  buildingId: string
  month: number
  year: number
  amount: number
}

interface Year {
  id: string
  value: number
}

interface Notification {
  id: string
  title: string
  message: string
  isRead: boolean
  type: string
  createdAt: string
}

interface DashboardSummary {
  buildingId: string
  buildingName: string
  month: number
  year: number
  monthName: string
  totalCotisations: number
  paidCotisations: number
  unpaidCotisations: number
  totalExpenses: number
  totalCleaning: number
  totalDepenses: number
  reste: number
  apartmentCount: number
  paidCount: number
  unpaidCount: number
}

interface YearlyData {
  buildingId: string
  buildingName: string
  month: number
  monthName: string
  year: number
  totalCotisations: number
  paidCotisations: number
  totalExpenses: number
  reste: number
}

interface DashboardData {
  summary: DashboardSummary[]
  yearlyData: YearlyData[]
  totalSolde: number
  totalPaidCotisationsYear: number
  totalExpensesYear: number
  unreadCount: number
  pendingUsersCount: number
  ownerCotisations: Cotisation[]
}

// ==================== CONSTANTS ====================
const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const EXPENSE_CATEGORIES = [
  { value: 'MENAGE', label: 'Femme de ménage', color: 'bg-purple-100 text-purple-800' },
  { value: 'SANITAIRE', label: 'Produits sanitaires', color: 'bg-blue-100 text-blue-800' },
  { value: 'MAINTENANCE', label: 'Maintenance', color: 'bg-orange-100 text-orange-800' },
  { value: 'AUTRE', label: 'Autre', color: 'bg-gray-100 text-gray-800' },
]

// ==================== API HELPERS ====================
async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}

// ==================== MAIN APP ====================
export default function SyndicApp() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<'login' | 'register' | 'dashboard'>('login')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { toast } = useToast()

  // Check session on mount
  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    try {
      const data = await apiFetch('/api/auth/me')
      setUser(data.user)
      setCurrentPage('dashboard')
    } catch {
      setUser(null)
      setCurrentPage('login')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await apiFetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setCurrentPage('login')
    toast({ title: 'Déconnexion', description: 'Vous avez été déconnecté' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-blue-700 font-medium text-lg">Chargement...</p>
        </div>
      </div>
    )
  }

  if (currentPage === 'login') {
    return <LoginPage onLogin={(u) => { setUser(u); setCurrentPage('dashboard') }} onSwitchToRegister={() => setCurrentPage('register')} />
  }

  if (currentPage === 'register') {
    return <RegisterPage onRegister={(u) => { setUser(u); setCurrentPage('dashboard') }} onSwitchToLogin={() => setCurrentPage('login')} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-blue-100 px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <img src="/syndic-logo.png" alt="SyndicPro" className="h-5 w-5 rounded object-cover" />
          <span className="font-bold text-blue-800">SyndicPro</span>
        </div>
        <NotificationBell user={user} />
      </div>

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          user={user}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />

        {/* Main content */}
        <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            {user?.role === 'ADMIN' ? (
              <AdminDashboard user={user!} />
            ) : (
              <OwnerDashboard user={user!} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

// ==================== SIDEBAR ====================
function Sidebar({ user, isOpen, onClose, onLogout }: { user: User | null; isOpen: boolean; onClose: () => void; onLogout: () => void }) {
  const menuItems = user?.role === 'ADMIN'
    ? [
        { icon: LayoutDashboard, label: 'Tableau de bord', id: 'overview' },
        { icon: Building2, label: 'Immeubles', id: 'buildings' },
        { icon: Home, label: 'Appartements', id: 'apartments' },
        { icon: Users, label: 'Propriétaires', id: 'owners' },
        { icon: Wallet, label: 'Cotisations', id: 'cotisations' },
        { icon: Receipt, label: 'Dépenses', id: 'expenses' },
        { icon: FileText, label: 'Historique', id: 'history' },
      ]
    : [
        { icon: LayoutDashboard, label: 'Tableau de bord', id: 'owner-overview' },
        { icon: Wallet, label: 'Mes cotisations', id: 'owner-cotisations' },
        { icon: Receipt, label: 'Comptabilité', id: 'owner-accounting' },
        { icon: FileText, label: 'Historique', id: 'owner-history' },
      ]

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-blue-800 to-teal-900 text-white z-50 transform transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <img src="/syndic-logo.png" alt="SyndicPro" className="w-10 h-10 rounded-xl object-cover" />
            <div>
              <h2 className="font-bold text-lg">SyndicPro</h2>
              <p className="text-blue-300 text-xs">Gestion de copropriété</p>
            </div>
          </div>

          <div className="mb-6 p-3 bg-white/10 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0) || '?'}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{user?.name}</p>
                <p className="text-blue-300 text-xs truncate">{user?.email}</p>
              </div>
            </div>
            {user?.role === 'ADMIN' && (
              <Badge className="mt-2 bg-amber-400/20 text-amber-300 border-amber-400/30 text-xs">
                <Shield className="h-3 w-3 mr-1" /> Admin
              </Badge>
            )}
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  const el = document.getElementById(item.id)
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  onClose()
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-blue-200 hover:bg-white/10 hover:text-white transition-colors text-sm"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-300 hover:bg-red-500/20 transition-colors text-sm"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  )
}

// ==================== NOTIFICATION BELL ====================
function NotificationBell({ user }: { user: User | null }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch('/api/notifications')
        setNotifications(data.notifications)
        setUnreadCount(data.notifications.filter((n: Notification) => !n.isRead).length)
      } catch {}
    }
    load()
  }, [])

  async function markAllRead() {
    try {
      await apiFetch('/api/notifications', { method: 'PUT', body: JSON.stringify({ markAllRead: true }) })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {}
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-blue-50 transition-colors">
          <Bell className="h-5 w-5 text-blue-700" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" /> Notifications
          </DialogTitle>
          <DialogDescription>
            {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Aucune nouvelle notification'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end mb-2">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Tout marquer comme lu
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Aucune notification</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`p-3 rounded-lg border ${n.isRead ? 'bg-white' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 w-2 h-2 rounded-full ${n.isRead ? 'bg-gray-300' : 'bg-blue-500'}`} />
                    <div>
                      <p className="font-medium text-sm">{n.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// ==================== LOGIN PAGE ====================
function LoginPage({ onLogin, onSwitchToRegister }: { onLogin: (u: User) => void; onSwitchToRegister: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      toast({ title: 'Bienvenue !', description: `Bonjour ${data.user.name}` })
      onLogin(data.user)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/syndic-logo.png" alt="SyndicPro" className="w-20 h-20 rounded-2xl object-cover shadow-lg shadow-blue-200 mb-4" />
          <h1 className="text-3xl font-bold text-blue-900">SyndicPro</h1>
          <p className="text-blue-600 mt-2">Gestion de copropriété simplifiée</p>
        </div>

        <Card className="border-0 shadow-xl shadow-blue-100/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Connexion</CardTitle>
            <CardDescription>Accédez à votre espace propriétaire</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => setForgotOpen(true)} className="text-xs text-blue-600 hover:underline font-medium">
                    Mot de passe oublié ?
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-teal-600 hover:from-blue-600 hover:to-teal-700 text-white shadow-lg shadow-blue-200" disabled={isLoading}>
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                Se connecter
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Pas encore de compte ?{' '}
                <button onClick={onSwitchToRegister} className="text-blue-600 font-medium hover:underline">
                  Créer un compte
                </button>
              </p>
            </div>

          </CardContent>
        </Card>

        <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} />
      </div>
    </div>
  )
}

// ==================== FORGOT PASSWORD DIALOG ====================
function ForgotPasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [step, setStep] = useState<'email' | 'code' | 'success'>('email')
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  function handleClose(val: boolean) {
    if (!val) {
      setStep('email')
      setEmail('')
      setResetToken('')
      setCode('')
      setNewPassword('')
      setConfirmPassword('')
      setError('')
    }
    onOpenChange(val)
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const data = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setResetToken(data.resetToken)
      setStep('code')
      toast({
        title: 'Code envoyé !',
        description: `Un code de vérification a été envoyé à ${email}`,
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    setIsLoading(true)
    try {
      await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ resetToken, code, newPassword }),
      })
      setStep('success')
      toast({
        title: 'Mot de passe modifié !',
        description: 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-blue-600" />
            {step === 'email' && 'Mot de passe oublié'}
            {step === 'code' && 'Vérification'}
            {step === 'success' && 'Mot de passe modifié !'}
          </DialogTitle>
          <DialogDescription>
            {step === 'email' && 'Entrez votre email pour recevoir un code de réinitialisation'}
            {step === 'code' && `Entrez le code envoyé à ${email} et votre nouveau mot de passe`}
            {step === 'success' && 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe'}
          </DialogDescription>
        </DialogHeader>

        {step === 'email' && (
          <form onSubmit={handleSendCode} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email du compte</Label>
              <Input
                id="forgot-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-teal-600 hover:from-blue-600 hover:to-teal-700 text-white" disabled={isLoading}>
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
              Envoyer le code
            </Button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                <KeyRound className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-code">Code de vérification</Label>
              <Input
                id="reset-code"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl tracking-[0.5em] font-bold"
                required
              />
              <p className="text-xs text-gray-500 text-center">Code de 6 chiffres envoyé à votre email</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-teal-600 hover:from-blue-600 hover:to-teal-700 text-white" disabled={isLoading}>
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
              Modifier le mot de passe
            </Button>
            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full text-sm text-gray-500 hover:text-blue-600 text-center"
            >
              Renvoyer un nouveau code
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-center text-gray-600">Votre mot de passe a été modifié avec succès.</p>
            <Button
              onClick={() => handleClose(false)}
              className="bg-gradient-to-r from-blue-500 to-teal-600 hover:from-blue-600 hover:to-teal-700 text-white"
            >
              Se connecter
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ==================== REGISTER PAGE ====================
function RegisterPage({ onRegister, onSwitchToLogin }: { onRegister: (u: User) => void; onSwitchToLogin: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, phone }),
      })
      toast({
        title: 'Compte créé !',
        description: 'En attente d\'activation par le syndic. Vous pouvez consulter votre espace en attendant.',
      })
      onRegister(data.user)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur d\'inscription')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-400 to-teal-500 rounded-2xl shadow-lg shadow-blue-200 mb-4">
            <UserPlus className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-blue-900">Créer un compte</h1>
          <p className="text-blue-600 mt-2">Rejoignez la gestion de votre immeuble</p>
        </div>

        <Card className="border-0 shadow-xl shadow-blue-100/50">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Votre nom" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Mot de passe</Label>
                <Input id="reg-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone (optionnel)</Label>
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0600000000" />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-teal-600 hover:from-blue-600 hover:to-teal-700 text-white shadow-lg shadow-blue-200" disabled={isLoading}>
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                Créer mon compte
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Déjà inscrit ?{' '}
                <button onClick={onSwitchToLogin} className="text-blue-600 font-medium hover:underline">
                  Se connecter
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ==================== ADMIN DASHBOARD ====================
function AdminDashboard({ user }: { user: User }) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [buildings, setBuildings] = useState<Building[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [cotisations, setCotisations] = useState<Cotisation[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [cleaningFees, setCleaningFees] = useState<CleaningFee[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState(1)
  const [selectedYear, setSelectedYear] = useState(2026)
  const [years, setYears] = useState<Year[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [seeded, setSeeded] = useState(false)
  const [pdfFromMonth, setPdfFromMonth] = useState(1)
  const [pdfToMonth, setPdfToMonth] = useState(12)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const { toast } = useToast()

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [bldData, userData, aptData, cotData, expData, cleanData, dashData, yearData] = await Promise.all([
        apiFetch('/api/buildings'),
        apiFetch('/api/users'),
        apiFetch('/api/apartments'),
        apiFetch(`/api/cotisations?month=${selectedMonth}&year=${selectedYear}`),
        apiFetch(`/api/expenses?month=${selectedMonth}&year=${selectedYear}`),
        apiFetch(`/api/cleaning-fees?month=${selectedMonth}&year=${selectedYear}`),
        apiFetch(`/api/dashboard?month=${selectedMonth}&year=${selectedYear}${selectedBuilding !== 'all' ? `&buildingId=${selectedBuilding}` : ''}`),
        apiFetch('/api/years'),
      ])
      setBuildings(bldData.buildings)
      setUsers(userData.users)
      setApartments(aptData.apartments)
      setCotisations(cotData.cotisations)
      setExpenses(expData.expenses)
      setCleaningFees(cleanData.cleaningFees)
      setDashboard(dashData.dashboard)
      setYears(yearData.years)
      // If current selected year is not in the list, pick the latest available
      if (yearData.years.length > 0 && !yearData.years.find((y: Year) => y.value === selectedYear)) {
        setSelectedYear(yearData.years[yearData.years.length - 1].value)
      }
    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedMonth, selectedYear, selectedBuilding])

  useEffect(() => { loadData() }, [loadData])

  async function handleSeed() {
    try {
      const data = await apiFetch('/api/seed', { method: 'POST' })
      setSeeded(true)
      toast({ title: 'Données importées !', description: data.message })
      loadData()
    } catch (err: unknown) {
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' })
    }
  }

  if (isLoading && !dashboard) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  // Show seed button if no data
  if (buildings.length === 0 && !seeded) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center">
          <Sparkles className="h-12 w-12 text-blue-500" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-blue-900">Bienvenue sur SyndicPro</h2>
          <p className="text-gray-600 mt-2">Commencez par importer les données de votre immeuble</p>
        </div>
        <Button onClick={handleSeed} className="bg-gradient-to-r from-blue-500 to-teal-600 hover:from-blue-600 hover:to-teal-700 text-white shadow-lg shadow-blue-200 px-8 py-3 text-lg">
          <Sparkles className="h-5 w-5 mr-2" /> Importer les données de démonstration
        </Button>
        <p className="text-xs text-gray-400">Cela créera un immeuble avec 7 appartements et les données de votre fichier Excel</p>
      </div>
    )
  }

  const summary = dashboard?.summary?.[0]
  const yearlyData = dashboard?.yearlyData || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-blue-900">Tableau de bord</h1>
          <p className="text-blue-600 mt-1">Bienvenue, {user.name} 👋</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
            <SelectTrigger className="w-40 bg-white">
              <SelectValue placeholder="Immeuble" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les immeubles</SelectItem>
              {buildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-32 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-24 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y.id} value={String(y.value)}>{y.value}</SelectItem>)}
            </SelectContent>
          </Select>
          <AddYearDialog years={years} onYearAdded={loadData} />
        </div>
      </div>

      {/* Summary Cards */}
      <div id="overview" className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-0 shadow-lg shadow-blue-100/50 bg-gradient-to-br from-blue-500 to-teal-600 text-white">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <DollarSign className="h-5 w-5" />
              </div>
              <TrendingUp className="h-4 w-4 text-blue-200" />
            </div>
            <p className="text-2xl lg:text-3xl font-bold">{summary?.paidCotisations || 0} MAD</p>
            <p className="text-blue-100 text-xs mt-1">Cotisations payées</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-red-100/50 bg-gradient-to-br from-red-400 to-rose-500 text-white">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <XCircle className="h-5 w-5" />
              </div>
              <TrendingDown className="h-4 w-4 text-red-200" />
            </div>
            <p className="text-2xl lg:text-3xl font-bold">{summary?.unpaidCotisations || 0} MAD</p>
            <p className="text-red-100 text-xs mt-1">Cotisations impayées</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-orange-100/50 bg-gradient-to-br from-orange-400 to-amber-500 text-white">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Receipt className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl font-bold">{summary?.totalDepenses || 0} MAD</p>
            <p className="text-amber-100 text-xs mt-1">Total dépenses</p>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-lg ${(summary?.reste ?? 0) >= 0 ? 'shadow-blue-100/50 bg-gradient-to-br from-blue-400 to-indigo-500' : 'shadow-red-100/50 bg-gradient-to-br from-red-500 to-pink-600'} text-white`}>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl font-bold">{summary?.reste || 0} MAD</p>
            <p className="text-white/70 text-xs mt-1">Solde du mois</p>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-lg ${(dashboard?.totalSolde ?? 0) >= 0 ? 'shadow-cyan-100/50 bg-gradient-to-br from-cyan-500 to-blue-600' : 'shadow-red-100/50 bg-gradient-to-br from-red-600 to-rose-700'} text-white col-span-2 lg:col-span-1`}>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl font-bold">{dashboard?.totalSolde || 0} MAD</p>
            <p className="text-white/70 text-xs mt-1">Total du solde {selectedYear}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{buildings.length}</p>
              <p className="text-xs text-gray-500">Immeuble(s)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Home className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{apartments.length}</p>
              <p className="text-xs text-gray-500">Appartements</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <Users className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary?.paidCount || 0}/{summary?.apartmentCount || 0}</p>
              <p className="text-xs text-gray-500">Payé ce mois</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{dashboard?.pendingUsersCount || 0}</p>
              <p className="text-xs text-gray-500">En attente</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Buildings Section */}
      <div id="buildings">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" /> Immeubles
                </CardTitle>
                <CardDescription>Gérez vos immeubles et appartements</CardDescription>
              </div>
              <AddBuildingDialog onBuildingAdded={loadData} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {buildings.map(b => (
                <Card key={b.id} className="border border-blue-100 bg-gradient-to-br from-white to-blue-50/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge className="bg-blue-100 text-blue-700">{b.apartments?.length || b._count?.apartments || 0} apts</Badge>
                        <EditBuildingDialog building={b} onBuildingUpdated={loadData} />
                        <ConfirmDeleteDialog
                          title="Supprimer l'immeuble"
                          description={`Êtes-vous sûr de vouloir supprimer "${b.name}" ? Tous les appartements, cotisations et dépenses associés seront supprimés.`}
                          onConfirm={async () => {
                            try {
                              await apiFetch(`/api/buildings?id=${b.id}`, { method: 'DELETE' })
                              toast({ title: 'Immeuble supprimé', description: b.name })
                              loadData()
                            } catch (err: unknown) {
                              toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' })
                            }
                          }}
                        />
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900">{b.name}</h3>
                    {b.address && <p className="text-sm text-gray-500 mt-1">{b.address}{b.city ? `, ${b.city}` : ''}</p>}
                    {b.description && <p className="text-xs text-gray-400 mt-1">{b.description}</p>}
                    {/* Apartments list */}
                    <div className="mt-3 space-y-1">
                      {b.apartments?.slice(0, 4).map(apt => (
                        <div key={apt.id} className="flex items-center justify-between text-xs bg-white/50 rounded-lg px-2 py-1">
                          <span className="text-gray-600">Apt {apt.number} - {apt.ownerName}</span>
                          <div className="flex gap-1">
                            <EditApartmentDialog apartment={apt} buildings={buildings} onApartmentUpdated={loadData} />
                            <ConfirmDeleteDialog
                              title="Supprimer l'appartement"
                              description={`Supprimer l'appartement N°${apt.number} (${apt.ownerName}) ? Les cotisations associées seront supprimées.`}
                              onConfirm={async () => {
                                try {
                                  await apiFetch(`/api/apartments?id=${apt.id}`, { method: 'DELETE' })
                                  toast({ title: 'Appartement supprimé' })
                                  loadData()
                                } catch (err: unknown) {
                                  toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' })
                                }
                              }}
                            />
                          </div>
                        </div>
                      ))}
                      {b.apartments && b.apartments.length > 4 && (
                        <p className="text-xs text-gray-400 text-center">+{b.apartments.length - 4} autres</p>
                      )}
                    </div>
                    <div className="mt-3">
                      <AddApartmentDialog buildingId={b.id} buildings={buildings} onApartmentAdded={loadData} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Apartments Section - Full List */}
      <div id="apartments">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-blue-600" /> Appartements
                </CardTitle>
                <CardDescription>Liste complète de tous les appartements</CardDescription>
              </div>
              <AddApartmentDialog buildingId="" buildings={buildings} onApartmentAdded={loadData} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">N°</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Propriétaire</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Immeuble</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Cotisation (MAD)</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Compte lié</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apartments.map(apt => (
                    <tr key={apt.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-blue-700">N° {apt.number}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{apt.ownerName}</p>
                          {apt.owner && (
                            <p className="text-xs text-blue-600">{apt.owner.name} ({apt.owner.email})</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{apt.building?.name || '-'}</td>
                      <td className="py-3 px-4 text-right font-medium">{apt.monthlyFee} MAD</td>
                      <td className="py-3 px-4 text-center">
                        {apt.owner ? (
                          <Badge className={apt.owner.isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}>
                            {apt.owner.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700">Non lié</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <EditApartmentDialog apartment={apt} buildings={buildings} onApartmentUpdated={loadData} />
                          <ConfirmDeleteDialog
                            title="Supprimer l'appartement"
                            description={`Supprimer l'appartement N°${apt.number} (${apt.ownerName}) ? Les cotisations associées seront supprimées.`}
                            onConfirm={async () => {
                              try {
                                await apiFetch(`/api/apartments?id=${apt.id}`, { method: 'DELETE' })
                                toast({ title: 'Appartement supprimé' })
                                loadData()
                              } catch (err: unknown) {
                                toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' })
                              }
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {apartments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">Aucun appartement</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Owners Management */}
      <div id="owners">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" /> Gestion des propriétaires
            </CardTitle>
            <CardDescription>Activez ou désactivez les comptes propriétaires</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex justify-end">
              <CreateOwnerDialog apartments={apartments} onOwnerCreated={loadData} />
            </div>
            <div className="space-y-3">
              {users.filter(u => u.role === 'OWNER').map(u => (
                <div key={u.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${u.isActive ? 'bg-blue-500' : 'bg-gray-400'}`}>
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                      {u.apartment && (
                        <p className="text-xs text-blue-600 mt-0.5">
                          Apt {u.apartment.number} - {u.apartment.building.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={u.isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}>
                      {u.isActive ? 'Actif' : 'En attente'}
                    </Badge>
                    <Button
                      size="sm"
                      variant={u.isActive ? 'outline' : 'default'}
                      className={u.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'bg-blue-500 hover:bg-blue-600 text-white'}
                      onClick={async () => {
                        try {
                          await apiFetch('/api/users', {
                            method: 'PUT',
                            body: JSON.stringify({ id: u.id, isActive: !u.isActive }),
                          })
                          toast({ title: u.isActive ? 'Compte désactivé' : 'Compte activé', description: `${u.name} a été ${u.isActive ? 'désactivé' : 'activé'}` })
                          loadData()
                        } catch (err: unknown) {
                          toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' })
                        }
                      }}
                    >
                      {u.isActive ? <XCircle className="h-4 w-4 mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                      {u.isActive ? 'Désactiver' : 'Activer'}
                    </Button>
                    <EditUserDialog user={u} apartments={apartments} onUserUpdated={loadData} />
                    {!u.apartment && (
                      <AssignApartmentDialog user={u} apartments={apartments} onAssigned={loadData} />
                    )}
                    <ConfirmDeleteDialog
                      title="Supprimer le propriétaire"
                      description={`Êtes-vous sûr de vouloir supprimer le compte de ${u.name} ? Cette action est irréversible.`}
                      onConfirm={async () => {
                        try {
                          await apiFetch(`/api/users?id=${u.id}`, { method: 'DELETE' })
                          toast({ title: 'Propriétaire supprimé', description: u.name })
                          loadData()
                        } catch (err: unknown) {
                          toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' })
                        }
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cotisations Management */}
      <div id="cotisations">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-blue-600" /> Cotisations - {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </CardTitle>
                <CardDescription>Validez les cotisations des propriétaires</CardDescription>
              </div>
              <GenerateCotisationsDialog buildings={buildings} apartments={apartments} month={selectedMonth} year={selectedYear} onGenerated={loadData} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Appartement</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Propriétaire</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Immeuble</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Montant</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Statut</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cotisations.map(c => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-4 font-medium">N° {c.apartment?.number}</td>
                      <td className="py-3 px-4">{c.apartment?.owner?.name || c.apartment?.ownerName || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{c.apartment?.building?.name || '-'}</td>
                      <td className="py-3 px-4 text-right font-medium">{c.amount} MAD</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={c.isPaid ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}>
                          {c.isPaid ? 'Payé' : 'Non payé'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {!c.isPaid ? (
                            <Button
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                              onClick={async () => {
                                try {
                                  await apiFetch('/api/cotisations', {
                                    method: 'PUT',
                                    body: JSON.stringify({ id: c.id, isPaid: true }),
                                  })
                                  toast({ title: 'Cotisation validée !' })
                                  loadData()
                                } catch (err: unknown) {
                                  toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' })
                                }
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Valider
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-orange-200 text-orange-600 hover:bg-orange-50"
                              onClick={async () => {
                                try {
                                  await apiFetch('/api/cotisations', {
                                    method: 'PUT',
                                    body: JSON.stringify({ id: c.id, isPaid: false }),
                                  })
                                  toast({ title: 'Cotisation annulée' })
                                  loadData()
                                } catch (err: unknown) {
                                  toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' })
                                }
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Annuler
                            </Button>
                          )}
                          <EditCotisationDialog cotisation={c} onCotisationUpdated={loadData} />
                          <ConfirmDeleteDialog
                            title="Supprimer la cotisation"
                            description={`Supprimer la cotisation de ${c.apartment?.owner?.name || c.apartment?.ownerName || 'N/A'} pour ${MONTH_NAMES[c.month - 1]} ${c.year} ?`}
                            onConfirm={async () => {
                              try {
                                await apiFetch(`/api/cotisations?id=${c.id}`, { method: 'DELETE' })
                                toast({ title: 'Cotisation supprimée' })
                                loadData()
                              } catch (err: unknown) {
                                toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' })
                              }
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {cotisations.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        Aucune cotisation pour cette période. Cliquez sur &quot;Générer&quot; pour créer les cotisations.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Management */}
      <div id="expenses">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-blue-600" /> Dépenses - {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </CardTitle>
                <CardDescription>Ajoutez et gérez les dépenses de l&apos;immeuble</CardDescription>
              </div>
              <div className="flex gap-2">
                <AddExpenseDialog buildings={buildings} month={selectedMonth} year={selectedYear} onExpenseAdded={loadData} />
                <AddCleaningFeeDialog buildings={buildings} month={selectedMonth} year={selectedYear} onFeeAdded={loadData} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Cleaning fees */}
              {cleaningFees.map(cf => (
                <div key={cf.id} className="flex items-center justify-between p-4 rounded-xl bg-purple-50 border border-purple-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Paiement femme de ménage</p>
                      <p className="text-xs text-gray-500">{MONTH_NAMES[cf.month - 1]} {cf.year}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-purple-100 text-purple-700">Femme de ménage</Badge>
                    <span className="font-bold text-gray-900">{cf.amount} MAD</span>
                    <EditCleaningFeeDialog cleaningFee={cf} onFeeUpdated={loadData} />
                    <ConfirmDeleteDialog
                      title="Supprimer les frais de ménage"
                      description={`Supprimer le paiement femme de ménage de ${MONTH_NAMES[cf.month - 1]} ${cf.year} (${cf.amount} MAD) ?`}
                      onConfirm={async () => {
                        try {
                          await apiFetch(`/api/cleaning-fees?id=${cf.id}`, { method: 'DELETE' })
                          toast({ title: 'Frais de ménage supprimés' })
                          loadData()
                        } catch (err: unknown) {
                          toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' })
                        }
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Other expenses */}
              {expenses.map(exp => (
                <div key={exp.id} className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-100 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{exp.description}</p>
                      <p className="text-xs text-gray-500">{MONTH_NAMES[exp.month - 1]} {exp.year} · {exp.building?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={EXPENSE_CATEGORIES.find(c => c.value === exp.category)?.color || 'bg-gray-100 text-gray-700'}>
                      {EXPENSE_CATEGORIES.find(c => c.value === exp.category)?.label || exp.category}
                    </Badge>
                    <span className="font-bold text-gray-900">{exp.amount} MAD</span>
                    <EditExpenseDialog expense={exp} buildings={buildings} onExpenseUpdated={loadData} />
                    <ConfirmDeleteDialog
                      title="Supprimer la dépense"
                      description={`Supprimer "${exp.description}" (${exp.amount} MAD) ?`}
                      onConfirm={async () => {
                        try {
                          await apiFetch(`/api/expenses?id=${exp.id}`, { method: 'DELETE' })
                          toast({ title: 'Dépense supprimée' })
                          loadData()
                        } catch (err: unknown) {
                          toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' })
                        }
                      }}
                    />
                  </div>
                </div>
              ))}

              {expenses.length === 0 && cleaningFees.length === 0 && (
                <p className="text-center text-gray-400 py-8">Aucune dépense pour cette période</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Yearly History */}
      <div id="history">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" /> Historique annuel {selectedYear}
                </CardTitle>
                <CardDescription>Récapitulatif mensuel de l&apos;année</CardDescription>
              </div>
              {/* PDF Export Section */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide whitespace-nowrap">Exporter PDF</span>
                <Select value={String(pdfFromMonth)} onValueChange={v => { const n = parseInt(v); setPdfFromMonth(n); if (n > pdfToMonth) setPdfToMonth(n); }}>
                  <SelectTrigger className="w-[110px] h-8 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((m, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-blue-400 font-medium">à</span>
                <Select value={String(pdfToMonth)} onValueChange={v => { const n = parseInt(v); setPdfToMonth(n); if (n < pdfFromMonth) setPdfFromMonth(n); }}>
                  <SelectTrigger className="w-[110px] h-8 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((m, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-8 text-xs whitespace-nowrap"
                  disabled={isExportingPdf}
                  onClick={async () => {
                    setIsExportingPdf(true)
                    try {
                      const params = new URLSearchParams({
                        year: String(selectedYear),
                        fromMonth: String(pdfFromMonth),
                        toMonth: String(pdfToMonth),
                      })
                      if (selectedBuilding !== 'all') params.set('buildingId', selectedBuilding)
                      const token = document.cookie.split('; ').find(c => c.startsWith('auth-token='))?.split('=')[1]
                      const res = await fetch(`/api/export/history-pdf?${params}`, {
                        headers: token ? { Cookie: `auth-token=${token}` } : {},
                      })
                      if (!res.ok) throw new Error('Erreur export')
                      const blob = await res.blob()
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = res.headers.get('Content-Disposition')?.match(/filename="?(.+?)"?$/)?.[1] || 'historique.pdf'
                      document.body.appendChild(a)
                      a.click()
                      a.remove()
                      URL.revokeObjectURL(url)
                      toast({ title: 'PDF exporté !', description: 'Le fichier a été téléchargé.' })
                    } catch {
                      toast({ title: 'Erreur', description: 'Impossible de générer le PDF', variant: 'destructive' })
                    } finally {
                      setIsExportingPdf(false)
                    }
                  }}
                >
                  {isExportingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  {isExportingPdf ? 'Export...' : 'Télécharger'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Mois</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Cotisations</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Payé</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Dépenses</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Solde</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyData.filter((_, i) => i % (buildings.length || 1) === 0).map((d, i) => (
                    <tr key={i} className={`border-b border-gray-50 ${d.month === selectedMonth ? 'bg-blue-50/50' : ''}`}>
                      <td className="py-3 px-4 font-medium">{d.monthName}</td>
                      <td className="py-3 px-4 text-right">{d.totalCotisations} MAD</td>
                      <td className="py-3 px-4 text-right text-blue-600 font-medium">{d.paidCotisations} MAD</td>
                      <td className="py-3 px-4 text-right text-orange-600">{d.totalExpenses} MAD</td>
                      <td className={`py-3 px-4 text-right font-bold ${d.reste >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {d.reste} MAD
                      </td>
                    </tr>
                  ))}
                  {/* Total du solde row */}
                  <tr className="border-t-2 border-gray-300 bg-gray-50">
                    <td className="py-3 px-4 font-bold text-gray-900">Total</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">{yearlyData.filter((_, i) => i % (buildings.length || 1) === 0).reduce((s, d) => s + d.totalCotisations, 0)} MAD</td>
                    <td className="py-3 px-4 text-right font-bold text-blue-700">{dashboard?.totalPaidCotisationsYear || 0} MAD</td>
                    <td className="py-3 px-4 text-right font-bold text-orange-700">{dashboard?.totalExpensesYear || 0} MAD</td>
                    <td className={`py-3 px-4 text-right font-bold text-lg ${(dashboard?.totalSolde ?? 0) >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                      {dashboard?.totalSolde || 0} MAD
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ==================== OWNER DASHBOARD ====================
function OwnerDashboard({ user }: { user: User }) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [cleaningFees, setCleaningFees] = useState<CleaningFee[]>([])
  const [selectedYear, setSelectedYear] = useState(2026)
  const [years, setYears] = useState<Year[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [dashData, expData, cleanData, yearData] = await Promise.all([
        apiFetch(`/api/dashboard?year=${selectedYear}`),
        apiFetch(`/api/expenses?year=${selectedYear}`),
        apiFetch(`/api/cleaning-fees?year=${selectedYear}`),
        apiFetch('/api/years'),
      ])
      setDashboard(dashData.dashboard)
      setExpenses(expData.expenses)
      setCleaningFees(cleanData.cleaningFees)
      setYears(yearData.years)
    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedYear])

  useEffect(() => { loadData() }, [loadData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!user.isActive) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="w-24 h-24 bg-amber-100 rounded-3xl flex items-center justify-center">
          <Clock className="h-12 w-12 text-amber-500" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Compte en attente d'activation</h2>
          <p className="text-gray-600 mt-2">Le syndic doit d'abord activer votre compte pour que vous puissiez accéder à l'application.</p>
          <p className="text-gray-400 text-sm mt-1">Vous serez notifié par email une fois votre compte activé.</p>
        </div>
      </div>
    )
  }

  const summary = dashboard?.summary?.[0]
  const ownerCotisations = dashboard?.ownerCotisations || []
  const yearlyData = dashboard?.yearlyData || []
  const paidCount = ownerCotisations.filter(c => c.isPaid).length
  const totalCotisation = ownerCotisations.reduce((s, c) => s + c.amount, 0)
  const paidTotal = ownerCotisations.filter(c => c.isPaid).reduce((s, c) => s + c.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-blue-900">Bonjour, {user.name} 👋</h1>
          <p className="text-blue-600 mt-1">
            {user.apartment ? `Appartement N° ${user.apartment.number} · ${user.apartment.building.name}` : 'Votre espace propriétaire'}
          </p>
        </div>
        <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(parseInt(v))}>
          <SelectTrigger className="w-24 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => <SelectItem key={y.id} value={String(y.value)}>{y.value}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div id="owner-overview" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg shadow-blue-100/50 bg-gradient-to-br from-blue-500 to-teal-600 text-white">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl font-bold">{paidTotal} MAD</p>
            <p className="text-blue-100 text-xs mt-1">Cotisations payées</p>
            <Progress value={totalCotisation > 0 ? (paidTotal / totalCotisation) * 100 : 0} className="mt-3 h-2 bg-white/20" />
            <p className="text-blue-200 text-xs mt-1">{paidCount}/{ownerCotisations.length} mois payés</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-orange-100/50 bg-gradient-to-br from-orange-400 to-amber-500 text-white">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Receipt className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl font-bold">{summary?.totalDepenses || 0} MAD</p>
            <p className="text-amber-100 text-xs mt-1">Dépenses immeuble ce mois</p>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-lg ${(summary?.reste ?? 0) >= 0 ? 'shadow-blue-100/50 bg-gradient-to-br from-blue-400 to-indigo-500' : 'shadow-red-100/50 bg-gradient-to-br from-red-500 to-pink-600'} text-white`}>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl font-bold">{summary?.reste || 0} MAD</p>
            <p className="text-white/70 text-xs mt-1">Solde du mois</p>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-lg ${(dashboard?.totalSolde ?? 0) >= 0 ? 'shadow-cyan-100/50 bg-gradient-to-br from-cyan-500 to-blue-600' : 'shadow-red-100/50 bg-gradient-to-br from-red-600 to-rose-700'} text-white`}>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl lg:text-3xl font-bold">{dashboard?.totalSolde || 0} MAD</p>
            <p className="text-white/70 text-xs mt-1">Total du solde {selectedYear}</p>
          </CardContent>
        </Card>
      </div>

      {/* My Cotisations */}
      <div id="owner-cotisations">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-600" /> Mes cotisations {selectedYear}
            </CardTitle>
            <CardDescription>État de vos cotisations mensuelles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {MONTH_NAMES.map((monthName, i) => {
                const cot = ownerCotisations.find(c => c.month === i + 1)
                return (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      cot?.isPaid
                        ? 'bg-blue-50 border-blue-200'
                        : cot
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <p className="text-xs font-medium text-gray-500 mb-2">{monthName}</p>
                    <div className="w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-2">
                      {cot?.isPaid ? (
                        <CheckCircle2 className="h-6 w-6 text-blue-500" />
                      ) : cot ? (
                        <XCircle className="h-6 w-6 text-red-400" />
                      ) : (
                        <Clock className="h-6 w-6 text-gray-300" />
                      )}
                    </div>
                    <p className="text-sm font-bold">{cot ? `${cot.amount} MAD` : '-'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {cot?.isPaid ? 'Payé' : cot ? 'Non payé' : 'En attente'}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* General Accounting */}
      <div id="owner-accounting">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-600" /> Comptabilité générale
            </CardTitle>
            <CardDescription>Dépenses de l&apos;immeuble</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cleaningFees.map(cf => (
                <div key={cf.id} className="flex items-center justify-between p-4 rounded-xl bg-purple-50 border border-purple-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Paiement femme de ménage</p>
                      <p className="text-xs text-gray-500">{MONTH_NAMES[cf.month - 1]} {cf.year}</p>
                    </div>
                  </div>
                  <span className="font-bold text-gray-900">{cf.amount} MAD</span>
                </div>
              ))}

              {expenses.map(exp => (
                <div key={exp.id} className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{exp.description}</p>
                      <p className="text-xs text-gray-500">{MONTH_NAMES[exp.month - 1]} {exp.year}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={EXPENSE_CATEGORIES.find(c => c.value === exp.category)?.color || 'bg-gray-100 text-gray-700'}>
                      {EXPENSE_CATEGORIES.find(c => c.value === exp.category)?.label || exp.category}
                    </Badge>
                    <span className="font-bold text-gray-900">{exp.amount} MAD</span>
                  </div>
                </div>
              ))}

              {expenses.length === 0 && cleaningFees.length === 0 && (
                <p className="text-center text-gray-400 py-8">Aucune dépense enregistrée</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Yearly History */}
      <div id="owner-history">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" /> Historique annuel {selectedYear}
            </CardTitle>
            <CardDescription>Résumé financier de l&apos;année</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Mois</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Cotisations</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Payé</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Dépenses</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Solde</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyData.filter((_, i) => i % (dashboard?.summary?.length || 1) === 0).map((d, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-3 px-4 font-medium">{d.monthName}</td>
                      <td className="py-3 px-4 text-right">{d.totalCotisations} MAD</td>
                      <td className="py-3 px-4 text-right text-blue-600 font-medium">{d.paidCotisations} MAD</td>
                      <td className="py-3 px-4 text-right text-orange-600">{d.totalExpenses} MAD</td>
                      <td className={`py-3 px-4 text-right font-bold ${d.reste >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {d.reste} MAD
                      </td>
                    </tr>
                  ))}
                  {/* Total du solde row */}
                  <tr className="border-t-2 border-gray-300 bg-gray-50">
                    <td className="py-3 px-4 font-bold text-gray-900">Total</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">{yearlyData.filter((_, i) => i % (dashboard?.summary?.length || 1) === 0).reduce((s, d) => s + d.totalCotisations, 0)} MAD</td>
                    <td className="py-3 px-4 text-right font-bold text-blue-700">{dashboard?.totalPaidCotisationsYear || 0} MAD</td>
                    <td className="py-3 px-4 text-right font-bold text-orange-700">{dashboard?.totalExpensesYear || 0} MAD</td>
                    <td className={`py-3 px-4 text-right font-bold text-lg ${(dashboard?.totalSolde ?? 0) >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                      {dashboard?.totalSolde || 0} MAD
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ==================== DIALOG COMPONENTS ====================

function AddBuildingDialog({ onBuildingAdded }: { onBuildingAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [apartmentCount, setApartmentCount] = useState(7)
  const [monthlyFee, setMonthlyFee] = useState(100)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  async function handleSubmit() {
    if (!name) return
    setIsLoading(true)
    try {
      const apartments = Array.from({ length: apartmentCount }, (_, i) => ({
        number: i + 1,
        ownerName: `Appartement ${i + 1}`,
        monthlyFee,
      }))
      await apiFetch('/api/buildings', {
        method: 'POST',
        body: JSON.stringify({ name, address, city, apartments }),
      })
      toast({ title: 'Immeuble créé !', description: `${name} avec ${apartmentCount} appartements` })
      setOpen(false)
      setName('')
      setAddress('')
      setCity('')
      onBuildingAdded()
    } catch (err: unknown) {
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white">
          <Plus className="h-4 w-4 mr-1" /> Nouvel immeuble
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un immeuble</DialogTitle>
          <DialogDescription>Créez un nouvel immeuble avec ses appartements</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nom de l&apos;immeuble</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Résidence Al Amal" />
          </div>
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Rue Hassan II" />
          </div>
          <div className="space-y-2">
            <Label>Ville</Label>
            <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Casablanca" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre d&apos;appartements</Label>
              <Input type="number" value={apartmentCount} onChange={e => setApartmentCount(parseInt(e.target.value) || 1)} />
            </div>
            <div className="space-y-2">
              <Label>Cotisation mensuelle (MAD)</Label>
              <Input type="number" value={monthlyFee} onChange={e => setMonthlyFee(parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full bg-blue-500 hover:bg-blue-600 text-white" disabled={isLoading}>
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Créer l&apos;immeuble
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AssignApartmentDialog({ user, apartments, onAssigned }: { user: User; apartments: Apartment[]; onAssigned: () => void }) {
  const [open, setOpen] = useState(false)
  const [apartmentId, setApartmentId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const availableApartments = apartments.filter(a => !a.owner || !a.userId)

  async function handleSubmit() {
    if (!apartmentId) return
    setIsLoading(true)
    try {
      await apiFetch('/api/users', {
        method: 'PUT',
        body: JSON.stringify({ id: user.id, isActive: true, apartmentId }),
      })
      toast({ title: 'Appartement assigné !', description: `${user.name} a été lié à l'appartement` })
      setOpen(false)
      onAssigned()
    } catch (err: unknown) {
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
          <Home className="h-4 w-4 mr-1" /> Assigner
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assigner un appartement</DialogTitle>
          <DialogDescription>Choisissez un appartement pour {user.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={apartmentId} onValueChange={setApartmentId}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un appartement" />
            </SelectTrigger>
            <SelectContent>
              {availableApartments.map(a => (
                <SelectItem key={a.id} value={a.id}>
                  Apt N°{a.number} - {a.building?.name} ({a.ownerName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSubmit} className="w-full bg-blue-500 hover:bg-blue-600 text-white" disabled={isLoading || !apartmentId}>
            Assigner et activer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function GenerateCotisationsDialog({ buildings, apartments, month, year, onGenerated }: { buildings: Building[]; apartments: Apartment[]; month: number; year: number; onGenerated: () => void }) {
  const [open, setOpen] = useState(false)
  const [selectedBuildingId, setSelectedBuildingId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  async function handleSubmit() {
    setIsLoading(true)
    try {
      const buildingApts = apartments.filter(a => !selectedBuildingId || a.buildingId === selectedBuildingId)
      const cotisations = buildingApts.map(apt => ({
        apartmentId: apt.id,
        month,
        year,
        amount: apt.monthlyFee,
        isPaid: false,
      }))

      await apiFetch('/api/cotisations', {
        method: 'POST',
        body: JSON.stringify(cotisations),
      })

      toast({ title: 'Cotisations générées !', description: `${cotisations.length} cotisations pour ${MONTH_NAMES[month - 1]} ${year}` })
      setOpen(false)
      onGenerated()
    } catch (err: unknown) {
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white">
          <Plus className="h-4 w-4 mr-1" /> Générer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Générer les cotisations</DialogTitle>
          <DialogDescription>Créer les cotisations pour {MONTH_NAMES[month - 1]} {year}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
            <SelectTrigger>
              <SelectValue placeholder="Tous les immeubles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les immeubles</SelectItem>
              {buildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500">
            Cela créera les cotisations pour tous les appartements {selectedBuildingId && selectedBuildingId !== 'all' ? 'de l\'immeuble sélectionné' : ''}.
          </p>
          <Button onClick={handleSubmit} className="w-full bg-blue-500 hover:bg-blue-600 text-white" disabled={isLoading}>
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Générer les cotisations
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AddExpenseDialog({ buildings, month, year, onExpenseAdded }: { buildings: Building[]; month: number; year: number; onExpenseAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [buildingId, setBuildingId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('AUTRE')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  async function handleSubmit() {
    if (!buildingId || !amount || !description) return
    setIsLoading(true)
    try {
      await apiFetch('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({ buildingId, month, year, amount: parseFloat(amount), description, category }),
      })
      toast({ title: 'Dépense ajoutée !', description: `${description} - ${amount} MAD` })
      setOpen(false)
      setAmount('')
      setDescription('')
      setCategory('AUTRE')
      onExpenseAdded()
    } catch (err: unknown) {
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50">
          <Plus className="h-4 w-4 mr-1" /> Dépense
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une dépense</DialogTitle>
          <DialogDescription>Dépense pour {MONTH_NAMES[month - 1]} {year}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={buildingId} onValueChange={setBuildingId}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner l'immeuble" />
            </SelectTrigger>
            <SelectContent>
              {buildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="space-y-2">
            <Label>Montant (MAD)</Label>
            <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="50" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Produits sanitaires" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPENSE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleSubmit} className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={isLoading || !buildingId || !amount || !description}>
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Ajouter la dépense
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AddCleaningFeeDialog({ buildings, month, year, onFeeAdded }: { buildings: Building[]; month: number; year: number; onFeeAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [buildingId, setBuildingId] = useState('')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  async function handleSubmit() {
    if (!buildingId || !amount) return
    setIsLoading(true)
    try {
      await apiFetch('/api/cleaning-fees', {
        method: 'POST',
        body: JSON.stringify({ buildingId, month, year, amount: parseFloat(amount) }),
      })
      toast({ title: 'Frais de ménage ajoutés !', description: `${amount} MAD pour ${MONTH_NAMES[month - 1]}` })
      setOpen(false)
      setAmount('')
      onFeeAdded()
    } catch (err: unknown) {
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
          <Plus className="h-4 w-4 mr-1" /> Femme de ménage
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Paiement femme de ménage</DialogTitle>
          <DialogDescription>Pour {MONTH_NAMES[month - 1]} {year}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={buildingId} onValueChange={setBuildingId}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner l'immeuble" />
            </SelectTrigger>
            <SelectContent>
              {buildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="space-y-2">
            <Label>Montant (MAD)</Label>
            <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="500" />
          </div>
          <Button onClick={handleSubmit} className="w-full bg-purple-500 hover:bg-purple-600 text-white" disabled={isLoading || !buildingId || !amount}>
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Ajouter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== CONFIRM DELETE DIALOG ====================
function ConfirmDeleteDialog({ title, description, onConfirm }: { title: string; description: string; onConfirm: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" /> {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button
            className="bg-red-500 hover:bg-red-600 text-white"
            onClick={() => { onConfirm(); setOpen(false) }}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Supprimer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== EDIT BUILDING DIALOG ====================
function EditBuildingDialog({ building, onBuildingUpdated }: { building: Building; onBuildingUpdated: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(building.name)
  const [address, setAddress] = useState(building.address || '')
  const [city, setCity] = useState(building.city || '')
  const [description, setDescription] = useState(building.description || '')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setName(building.name)
    setAddress(building.address || '')
    setCity(building.city || '')
    setDescription(building.description || '')
  }, [building])

  async function handleSubmit() {
    setIsLoading(true)
    try {
      await apiFetch('/api/buildings', {
        method: 'PUT',
        body: JSON.stringify({ id: building.id, name, address, city, description }),
      })
      toast({ title: 'Immeuble mis à jour !' })
      setOpen(false)
      onBuildingUpdated()
    } catch (err: unknown) {
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier l&apos;immeuble</DialogTitle>
          <DialogDescription>Modifiez les informations de {building.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nom</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Ville</Label>
            <Input value={city} onChange={e => setCity(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <Button onClick={handleSubmit} className="w-full bg-blue-500 hover:bg-blue-600 text-white" disabled={isLoading}>
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== EDIT APARTMENT DIALOG ====================
function EditApartmentDialog({ apartment, buildings, onApartmentUpdated }: { apartment: Apartment; buildings: Building[]; onApartmentUpdated: () => void }) {
  const [open, setOpen] = useState(false)
  const [number, setNumber] = useState(apartment.number)
  const [ownerName, setOwnerName] = useState(apartment.ownerName)
  const [monthlyFee, setMonthlyFee] = useState(apartment.monthlyFee)
  const [buildingId, setBuildingId] = useState(apartment.buildingId)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setNumber(apartment.number)
    setOwnerName(apartment.ownerName)
    setMonthlyFee(apartment.monthlyFee)
    setBuildingId(apartment.buildingId)
  }, [apartment])

  async function handleSubmit() {
    setIsLoading(true)
    try {
      await apiFetch('/api/apartments', {
        method: 'PUT',
        body: JSON.stringify({ id: apartment.id, number, ownerName, monthlyFee, buildingId }),
      })
      toast({ title: 'Appartement mis à jour !' })
      setOpen(false)
      onApartmentUpdated()
    } catch (err: unknown) {
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-6 w-6 p-0">
          <Edit className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier l&apos;appartement</DialogTitle>
          <DialogDescription>Appartement N°{apartment.number}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Numéro</Label>
              <Input type="number" value={number} onChange={e => setNumber(parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Cotisation (MAD)</Label>
              <Input type="number" value={monthlyFee} onChange={e => setMonthlyFee(parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Nom du propriétaire</Label>
            <Input value={ownerName} onChange={e => setOwnerName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Immeuble</Label>
            <Select value={buildingId} onValueChange={setBuildingId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {buildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSubmit} className="w-full bg-blue-500 hover:bg-blue-600 text-white" disabled={isLoading}>
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== ADD APARTMENT DIALOG ====================
function AddApartmentDialog({ buildingId, buildings, onApartmentAdded }: { buildingId: string; buildings: Building[]; onApartmentAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [number, setNumber] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [monthlyFee, setMonthlyFee] = useState('100')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  async function handleSubmit() {
    if (!number || !ownerName) return
    setIsLoading(true)
    try {
      await apiFetch('/api/apartments', {
        method: 'POST',
        body: JSON.stringify({ number: parseInt(number), buildingId, ownerName, monthlyFee: parseFloat(monthlyFee) || 0 }),
      })
      toast({ title: 'Appartement ajouté !' })
      setOpen(false)
      setNumber('')
      setOwnerName('')
      setMonthlyFee('100')
      onApartmentAdded()
    } catch (err: unknown) {
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs h-7">
          <Plus className="h-3 w-3 mr-1" /> Ajouter apt
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un appartement</DialogTitle>
          <DialogDescription>Ajouter un appartement à cet immeuble</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Numéro</Label>
              <Input type="number" value={number} onChange={e => setNumber(e.target.value)} placeholder="1" />
            </div>
            <div className="space-y-2">
              <Label>Cotisation (MAD)</Label>
              <Input type="number" value={monthlyFee} onChange={e => setMonthlyFee(e.target.value)} placeholder="100" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Nom du propriétaire</Label>
            <Input value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Nom du propriétaire" />
          </div>
          <Button onClick={handleSubmit} className="w-full bg-blue-500 hover:bg-blue-600 text-white" disabled={isLoading}>
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Ajouter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== EDIT USER DIALOG ====================
function EditUserDialog({ user, apartments, onUserUpdated }: { user: User; apartments: Apartment[]; onUserUpdated: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [phone, setPhone] = useState(user.phone || '')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setName(user.name)
    setEmail(user.email)
    setPhone(user.phone || '')
  }, [user])

  async function handleSubmit() {
    setIsLoading(true)
    try {
      await apiFetch('/api/users', {
        method: 'PUT',
        body: JSON.stringify({ id: user.id, name, email, phone }),
      })
      toast({ title: 'Propriétaire mis à jour !' })
      setOpen(false)
      onUserUpdated()
    } catch (err: unknown) {
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le propriétaire</DialogTitle>
          <DialogDescription>Modifier les informations de {user.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nom</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Téléphone</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <Button onClick={handleSubmit} className="w-full bg-blue-500 hover:bg-blue-600 text-white" disabled={isLoading}>
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== EDIT COTISATION DIALOG ====================
function EditCotisationDialog({ cotisation, onCotisationUpdated }: { cotisation: Cotisation; onCotisationUpdated: () => void }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(cotisation.amount)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setAmount(cotisation.amount)
  }, [cotisation])

  async function handleSubmit() {
    setIsLoading(true)
    try {
      await apiFetch('/api/cotisations', {
        method: 'PUT',
        body: JSON.stringify({ id: cotisation.id, amount }),
      })
      toast({ title: 'Cotisation mise à jour !' })
      setOpen(false)
      onCotisationUpdated()
    } catch (err: unknown) {
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier la cotisation</DialogTitle>
          <DialogDescription>
            {cotisation.apartment?.owner?.name || cotisation.apartment?.ownerName} - {MONTH_NAMES[cotisation.month - 1]} {cotisation.year}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Montant (MAD)</Label>
            <Input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} />
          </div>
          <Button onClick={handleSubmit} className="w-full bg-blue-500 hover:bg-blue-600 text-white" disabled={isLoading}>
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== EDIT EXPENSE DIALOG ====================
function EditExpenseDialog({ expense, buildings, onExpenseUpdated }: { expense: Expense; buildings: Building[]; onExpenseUpdated: () => void }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(expense.amount)
  const [description, setDescription] = useState(expense.description)
  const [category, setCategory] = useState(expense.category)
  const [month, setMonth] = useState(expense.month)
  const [year, setYear] = useState(expense.year)
  const [buildingId, setBuildingId] = useState(expense.buildingId)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setAmount(expense.amount)
    setDescription(expense.description)
    setCategory(expense.category)
    setMonth(expense.month)
    setYear(expense.year)
    setBuildingId(expense.buildingId)
  }, [expense])

  async function handleSubmit() {
    setIsLoading(true)
    try {
      await apiFetch('/api/expenses', {
        method: 'PUT',
        body: JSON.stringify({ id: expense.id, amount, description, category, month, year, buildingId }),
      })
      toast({ title: 'Dépense mise à jour !' })
      setOpen(false)
      onExpenseUpdated()
    } catch (err: unknown) {
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier la dépense</DialogTitle>
          <DialogDescription>{expense.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Montant (MAD)</Label>
              <Input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mois</Label>
              <Select value={String(month)} onValueChange={v => setMonth(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Année</Label>
              <Select value={String(year)} onValueChange={v => setYear(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 15 }, (_, i) => 2020 + i).map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Immeuble</Label>
            <Select value={buildingId} onValueChange={setBuildingId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {buildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSubmit} className="w-full bg-blue-500 hover:bg-blue-600 text-white" disabled={isLoading}>
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== EDIT CLEANING FEE DIALOG ====================
function EditCleaningFeeDialog({ cleaningFee, onFeeUpdated }: { cleaningFee: CleaningFee; onFeeUpdated: () => void }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(cleaningFee.amount)
  const [month, setMonth] = useState(cleaningFee.month)
  const [year, setYear] = useState(cleaningFee.year)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setAmount(cleaningFee.amount)
    setMonth(cleaningFee.month)
    setYear(cleaningFee.year)
  }, [cleaningFee])

  async function handleSubmit() {
    setIsLoading(true)
    try {
      await apiFetch('/api/cleaning-fees', {
        method: 'PUT',
        body: JSON.stringify({ id: cleaningFee.id, amount, month, year }),
      })
      toast({ title: 'Frais de ménage mis à jour !' })
      setOpen(false)
      onFeeUpdated()
    } catch (err: unknown) {
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier les frais de ménage</DialogTitle>
          <DialogDescription>{MONTH_NAMES[cleaningFee.month - 1]} {cleaningFee.year}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Montant (MAD)</Label>
            <Input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mois</Label>
              <Select value={String(month)} onValueChange={v => setMonth(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Année</Label>
              <Select value={String(year)} onValueChange={v => setYear(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 15 }, (_, i) => 2020 + i).map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full bg-blue-500 hover:bg-blue-600 text-white" disabled={isLoading}>
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== CREATE OWNER DIALOG (by Syndic) ====================
function CreateOwnerDialog({ apartments, onOwnerCreated }: { apartments: Apartment[]; onOwnerCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [apartmentId, setApartmentId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  async function handleSubmit() {
    if (!email || !name || !password) return
    setIsLoading(true)
    try {
      await apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          email,
          name,
          password,
          phone: phone || undefined,
          apartmentId: apartmentId || undefined,
          isActive: true,
        }),
      })
      toast({ title: 'Compte propriétaire créé !', description: `${name} peut maintenant se connecter` })
      setOpen(false)
      setName('')
      setEmail('')
      setPassword('')
      setPhone('')
      setApartmentId('')
      onOwnerCreated()
    } catch (err: unknown) {
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const availableApartments = apartments.filter(a => !a.owner || !a.userId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white">
          <UserPlus className="h-4 w-4 mr-1" /> Créer un compte propriétaire
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un compte propriétaire</DialogTitle>
          <DialogDescription>Créez un compte pour un propriétaire. Il pourra se connecter avec ces identifiants.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nom complet</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nom du propriétaire" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="proprietaire@email.com" />
          </div>
          <div className="space-y-2">
            <Label>Mot de passe</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" />
          </div>
          <div className="space-y-2">
            <Label>Téléphone (optionnel)</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0600000000" />
          </div>
          <div className="space-y-2">
            <Label>Assigner un appartement (optionnel)</Label>
            <Select value={apartmentId} onValueChange={setApartmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Aucun appartement" />
              </SelectTrigger>
              <SelectContent>
                {availableApartments.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    Apt N°{a.number} - {a.building?.name} ({a.ownerName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSubmit} className="w-full bg-blue-500 hover:bg-blue-600 text-white" disabled={isLoading || !email || !name || !password}>
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
            Créer le compte
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== ADD YEAR DIALOG ====================
function AddYearDialog({ years, onYearAdded }: { years: Year[]; onYearAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [newYear, setNewYear] = useState(new Date().getFullYear())
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const existingYears = years.map(y => y.value)

  async function handleSubmit() {
    if (!newYear) return
    setIsLoading(true)
    try {
      await apiFetch('/api/years', {
        method: 'POST',
        body: JSON.stringify({ value: newYear }),
      })
      toast({ title: 'Année ajoutée !', description: `${newYear} a été ajoutée` })
      setOpen(false)
      onYearAdded()
    } catch (err: unknown) {
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 h-8">
          <Plus className="h-3 w-3 mr-1" /> Année
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une année</DialogTitle>
          <DialogDescription>Ajoutez une nouvelle année pour la gestion des cotisations et dépenses</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Année</Label>
            <Input type="number" value={newYear} onChange={e => setNewYear(parseInt(e.target.value) || 2026)} min={2000} max={2100} />
          </div>
          <div className="space-y-2">
            <Label>Années existantes</Label>
            <div className="flex flex-wrap gap-2">
              {existingYears.sort((a, b) => a - b).map(y => (
                <Badge key={y} className="bg-blue-100 text-blue-700">{y}</Badge>
              ))}
              {existingYears.length === 0 && <p className="text-sm text-gray-400">Aucune année</p>}
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full bg-blue-500 hover:bg-blue-600 text-white" disabled={isLoading || existingYears.includes(newYear)}>
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Ajouter {newYear}
          </Button>
          {existingYears.includes(newYear) && (
            <p className="text-sm text-red-500 text-center">Cette année existe déjà</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
