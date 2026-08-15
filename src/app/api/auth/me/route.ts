import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        phone: true,
        apartment: {
          include: {
            building: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Me error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
