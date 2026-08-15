import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        phone: true,
        createdAt: true,
        apartment: {
          include: { building: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Users GET error:', error)
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
    const { email, name, password, phone, apartmentId, isActive } = body

    if (!email || !name || !password) {
      return NextResponse.json({ error: 'Email, nom et mot de passe sont requis' }, { status: 400 })
    }

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        phone: phone || null,
        role: 'OWNER',
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    // If apartmentId is provided, link the apartment to the user
    if (apartmentId) {
      await db.apartment.update({
        where: { id: apartmentId },
        data: { userId: user.id },
      })
    }

    // Notify user about account creation
    await db.notification.create({
      data: {
        userId: user.id,
        title: 'Compte créé par le syndic',
        message: `Le syndic a créé votre compte. Vous pouvez maintenant vous connecter avec votre email et mot de passe.`,
        type: 'ACCOUNT',
      },
    })

    const result = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        phone: true,
        createdAt: true,
        apartment: { include: { building: true } },
      },
    })

    return NextResponse.json({ user: result })
  } catch (error) {
    console.error('Users POST error:', error)
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
    const { id, isActive, apartmentId, name, email, phone } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (isActive !== undefined) updateData.isActive = isActive
    if (apartmentId !== undefined) updateData.apartment = { connect: { id: apartmentId } }
    if (apartmentId === null) updateData.apartment = { disconnect: true }
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone

    const user = await db.user.update({
      where: { id },
      data: updateData,
      include: { apartment: { include: { building: true } } },
    })

    // Notify user about account activation/deactivation
    if (isActive !== undefined) {
      await db.notification.create({
        data: {
          userId: id,
          title: isActive ? 'Compte activé' : 'Compte désactivé',
          message: isActive
            ? 'Votre compte a été activé par le syndic. Vous pouvez maintenant accéder à l\'application.'
            : 'Votre compte a été désactivé par le syndic. Contactez l\'administration pour plus d\'informations.',
          type: 'ACCOUNT',
        },
      })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Users PUT error:', error)
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

    // Prevent deleting own account
    if (id === session.userId) {
      return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 })
    }

    // Disconnect apartment first if linked
    const user = await db.user.findUnique({ where: { id }, include: { apartment: true } })
    if (user?.apartment) {
      await db.apartment.update({
        where: { id: user.apartment.id },
        data: { userId: null },
      })
    }

    await db.user.delete({ where: { id } })
    return NextResponse.json({ message: 'Utilisateur supprimé avec succès' })
  } catch (error) {
    console.error('Users DELETE error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
