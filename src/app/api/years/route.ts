import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const years = await db.year.findMany({
      orderBy: { value: 'asc' },
    })

    return NextResponse.json({ years })
  } catch (error) {
    console.error('Years GET error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { value } = body

    if (!value || typeof value !== 'number') {
      return NextResponse.json({ error: 'Année invalide' }, { status: 400 })
    }

    if (value < 2000 || value > 2100) {
      return NextResponse.json({ error: 'Année hors plage valide (2000-2100)' }, { status: 400 })
    }

    const existing = await db.year.findUnique({ where: { value } })
    if (existing) {
      return NextResponse.json({ error: 'Cette année existe déjà' }, { status: 400 })
    }

    const year = await db.year.create({
      data: { value },
    })

    return NextResponse.json({ year })
  } catch (error) {
    console.error('Years POST error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    await db.year.delete({ where: { id } })
    return NextResponse.json({ message: 'Année supprimée avec succès' })
  } catch (error) {
    console.error('Years DELETE error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
