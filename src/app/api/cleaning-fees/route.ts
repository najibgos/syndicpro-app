import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const where: Record<string, unknown> = {}
    if (buildingId) where.buildingId = buildingId
    if (month) where.month = parseInt(month)
    if (year) where.year = parseInt(year)

    const cleaningFees = await db.cleaningFee.findMany({
      where,
      include: { building: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })

    return NextResponse.json({ cleaningFees })
  } catch (error) {
    console.error('CleaningFees GET error:', error)
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
    const { buildingId, month, year, amount } = body

    if (!buildingId || !month || !year || !amount) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 })
    }

    const cleaningFee = await db.cleaningFee.upsert({
      where: {
        buildingId_month_year: { buildingId, month, year },
      },
      create: { buildingId, month, year, amount },
      update: { amount },
    })

    return NextResponse.json({ cleaningFee })
  } catch (error) {
    console.error('CleaningFees POST error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { id, amount, month, year } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (amount !== undefined) data.amount = amount
    if (month !== undefined) data.month = month
    if (year !== undefined) data.year = year

    const cleaningFee = await db.cleaningFee.update({
      where: { id },
      data,
      include: { building: true },
    })

    return NextResponse.json({ cleaningFee })
  } catch (error) {
    console.error('CleaningFees PUT error:', error)
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

    await db.cleaningFee.delete({ where: { id } })
    return NextResponse.json({ message: 'Frais de ménage supprimé avec succès' })
  } catch (error) {
    console.error('CleaningFees DELETE error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
