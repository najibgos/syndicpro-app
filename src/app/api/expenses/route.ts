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
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const buildingId = searchParams.get('buildingId')

    const where: Record<string, unknown> = {}
    if (month) where.month = parseInt(month)
    if (year) where.year = parseInt(year)
    if (buildingId) where.buildingId = buildingId

    const expenses = await db.expense.findMany({
      where,
      include: { building: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ expenses })
  } catch (error) {
    console.error('Expenses GET error:', error)
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
    const { buildingId, month, year, amount, description, category } = body

    if (!buildingId || !month || !year || !amount || !description) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 })
    }

    const expense = await db.expense.create({
      data: {
        buildingId,
        month,
        year,
        amount,
        description,
        category: category || 'AUTRE',
      },
      include: { building: true },
    })

    // Notify all owners in the building
    const apartments = await db.apartment.findMany({
      where: { buildingId },
      include: { owner: true },
    })

    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

    for (const apt of apartments) {
      if (apt.owner && apt.owner.isActive) {
        await db.notification.create({
          data: {
            userId: apt.owner.id,
            title: 'Nouvelle dépense',
            message: `Une dépense de ${amount} MAD a été ajoutée pour ${monthNames[month - 1]} ${year} : ${description}`,
            type: 'EXPENSE',
          },
        })
      }
    }

    return NextResponse.json({ expense })
  } catch (error) {
    console.error('Expenses POST error:', error)
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
    const { id, buildingId, month, year, amount, description, category } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (buildingId !== undefined) data.buildingId = buildingId
    if (month !== undefined) data.month = month
    if (year !== undefined) data.year = year
    if (amount !== undefined) data.amount = amount
    if (description !== undefined) data.description = description
    if (category !== undefined) data.category = category

    const expense = await db.expense.update({
      where: { id },
      data,
      include: { building: true },
    })

    return NextResponse.json({ expense })
  } catch (error) {
    console.error('Expenses PUT error:', error)
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

    await db.expense.delete({ where: { id } })
    return NextResponse.json({ message: 'Dépense supprimée' })
  } catch (error) {
    console.error('Expenses DELETE error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
