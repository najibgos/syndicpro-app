import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const notifications = await db.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Notifications GET error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { id, markAllRead } = body

    if (markAllRead) {
      await db.notification.updateMany({
        where: { userId: session.userId, isRead: false },
        data: { isRead: true },
      })
      return NextResponse.json({ message: 'Toutes les notifications marquées comme lues' })
    }

    if (id) {
      await db.notification.update({
        where: { id },
        data: { isRead: true },
      })
      return NextResponse.json({ message: 'Notification marquée comme lue' })
    }

    return NextResponse.json({ error: 'ID ou markAllRead requis' }, { status: 400 })
  } catch (error) {
    console.error('Notifications PUT error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
