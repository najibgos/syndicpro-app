import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const buildings = await db.building.findMany({
      include: {
        apartments: {
          include: {
            owner: { select: { id: true, name: true, email: true, isActive: true } },
          },
        },
        _count: { select: { apartments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ buildings })
  } catch (error) {
    console.error('Buildings GET error:', error)
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
    const { name, address, city, description, apartments } = body

    if (!name) {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })
    }

    const building = await db.building.create({
      data: {
        name,
        address: address || null,
        city: city || null,
        description: description || null,
        apartments: apartments
          ? {
              create: apartments.map((apt: { number: number; ownerName: string; monthlyFee: number }) => ({
                number: apt.number,
                ownerName: apt.ownerName,
                monthlyFee: apt.monthlyFee || 0,
              })),
            }
          : undefined,
      },
      include: { apartments: true },
    })

    return NextResponse.json({ building })
  } catch (error) {
    console.error('Buildings POST error:', error)
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
    const { id, name, address, city, description } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (address !== undefined) data.address = address || null
    if (city !== undefined) data.city = city || null
    if (description !== undefined) data.description = description || null

    const building = await db.building.update({
      where: { id },
      data,
      include: { apartments: true },
    })

    return NextResponse.json({ building })
  } catch (error) {
    console.error('Buildings PUT error:', error)
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

    await db.building.delete({ where: { id } })
    return NextResponse.json({ message: 'Immeuble supprimé avec succès' })
  } catch (error) {
    console.error('Buildings DELETE error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
