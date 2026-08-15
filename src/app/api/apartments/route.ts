import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const apartments = await db.apartment.findMany({
      include: {
        building: true,
        owner: { select: { id: true, name: true, email: true, isActive: true } },
      },
      orderBy: [{ buildingId: 'asc' }, { number: 'asc' }],
    })

    return NextResponse.json({ apartments })
  } catch (error) {
    console.error('Apartments GET error:', error)
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
    const { number, buildingId, ownerName, monthlyFee, userId } = body

    if (!number || !buildingId || !ownerName) {
      return NextResponse.json({ error: 'Numéro, immeuble et nom du propriétaire sont requis' }, { status: 400 })
    }

    // Check for duplicate apartment number in the same building
    const existing = await db.apartment.findFirst({
      where: { number, buildingId },
    })
    if (existing) {
      return NextResponse.json({ error: `L'appartement N°${number} existe déjà dans cet immeuble` }, { status: 400 })
    }

    const apartment = await db.apartment.create({
      data: {
        number,
        buildingId,
        ownerName,
        monthlyFee: monthlyFee || 0,
        userId: userId || null,
      },
      include: { building: true },
    })

    return NextResponse.json({ apartment })
  } catch (error) {
    console.error('Apartments POST error:', error)
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
    const { id, number, buildingId, ownerName, monthlyFee, userId } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    // If number or buildingId is being changed, check for duplicates
    if (number !== undefined || buildingId !== undefined) {
      const current = await db.apartment.findUnique({ where: { id } })
      if (current) {
        const checkNumber = number !== undefined ? number : current.number
        const checkBuilding = buildingId !== undefined ? buildingId : current.buildingId
        const duplicate = await db.apartment.findFirst({
          where: { number: checkNumber, buildingId: checkBuilding, id: { not: id } },
        })
        if (duplicate) {
          return NextResponse.json({ error: `L'appartement N°${checkNumber} existe déjà dans cet immeuble` }, { status: 400 })
        }
      }
    }

    const data: Record<string, unknown> = {}
    if (number !== undefined) data.number = number
    if (buildingId !== undefined) data.buildingId = buildingId
    if (ownerName !== undefined) data.ownerName = ownerName
    if (monthlyFee !== undefined) data.monthlyFee = monthlyFee
    if (userId !== undefined) {
      data.userId = userId || null
    }

    const apartment = await db.apartment.update({
      where: { id },
      data,
      include: { building: true, owner: { select: { id: true, name: true, email: true, isActive: true } } },
    })

    return NextResponse.json({ apartment })
  } catch (error) {
    console.error('Apartments PUT error:', error)
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

    await db.apartment.delete({ where: { id } })
    return NextResponse.json({ message: 'Appartement supprimé avec succès' })
  } catch (error) {
    console.error('Apartments DELETE error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
