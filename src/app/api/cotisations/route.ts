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
    const apartmentId = searchParams.get('apartmentId')

    const where: Record<string, unknown> = {}
    if (month) where.month = parseInt(month)
    if (year) where.year = parseInt(year)
    if (apartmentId) where.apartmentId = apartmentId
    if (buildingId) {
      where.apartment = { buildingId }
    }

    // If owner, only show their cotisations
    if (session.role === 'OWNER') {
      const userApt = await db.apartment.findFirst({ where: { userId: session.userId } })
      if (userApt) {
        where.apartmentId = userApt.id
      }
    }

    const cotisations = await db.cotisation.findMany({
      where,
      include: {
        apartment: {
          include: { building: true, owner: { select: { id: true, name: true } } },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })

    return NextResponse.json({ cotisations })
  } catch (error) {
    console.error('Cotisations GET error:', error)
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

    // Support bulk creation
    if (Array.isArray(body)) {
      const results = []
      for (const item of body) {
        const { apartmentId, month, year, amount, isPaid } = item
        if (!apartmentId || !month || !year || amount === undefined) continue

        const cotisation = await db.cotisation.upsert({
          where: {
            apartmentId_month_year: { apartmentId, month, year },
          },
          create: {
            apartmentId,
            month,
            year,
            amount,
            isPaid: isPaid || false,
          },
          update: {
            amount,
            isPaid: isPaid || false,
          },
        })
        results.push(cotisation)
      }
      return NextResponse.json({ cotisations: results })
    }

    const { apartmentId, month, year, amount, isPaid } = body
    if (!apartmentId || !month || !year || amount === undefined) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 })
    }

    const cotisation = await db.cotisation.upsert({
      where: {
        apartmentId_month_year: { apartmentId, month, year },
      },
      create: { apartmentId, month, year, amount, isPaid: isPaid || false },
      update: { amount, isPaid: isPaid || false },
    })

    return NextResponse.json({ cotisation })
  } catch (error) {
    console.error('Cotisations POST error:', error)
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
    const { id, isPaid, amount } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    const cotisation = await db.cotisation.update({
      where: { id },
      data: {
        ...(isPaid !== undefined && { isPaid, validatedAt: isPaid ? new Date() : null }),
        ...(amount !== undefined && { amount }),
      },
      include: {
        apartment: {
          include: { owner: true, building: true },
        },
      },
    })

    // Notify owner if cotisation validated
    if (isPaid && cotisation.apartment.owner) {
      const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
      await db.notification.create({
        data: {
          userId: cotisation.apartment.owner.id,
          title: 'Cotisation validée',
          message: `Votre cotisation de ${monthNames[cotisation.month - 1]} ${cotisation.year} (${cotisation.amount} MAD) a été validée.`,
          type: 'COTISATION',
        },
      })
    }

    return NextResponse.json({ cotisation })
  } catch (error) {
    console.error('Cotisations PUT error:', error)
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

    await db.cotisation.delete({ where: { id } })
    return NextResponse.json({ message: 'Cotisation supprimée avec succès' })
  } catch (error) {
    console.error('Cotisations DELETE error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
