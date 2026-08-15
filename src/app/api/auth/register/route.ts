import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, password, phone } = body

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, nom et mot de passe sont requis' },
        { status: 400 }
      )
    }

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        phone: phone || null,
        role: 'OWNER',
        isActive: false,
      },
    })

    // Create notification for admin
    const adminUsers = await db.user.findMany({ where: { role: 'ADMIN' } })
    for (const admin of adminUsers) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: 'Nouvelle inscription',
          message: `${name} (${email}) a créé un compte et attend votre activation.`,
          type: 'ACCOUNT',
        },
      })
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'ADMIN' | 'OWNER',
      name: user.name,
      isActive: user.isActive,
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      },
      message: 'Compte créé avec succès. En attente d\'activation par le syndic.',
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    )
  }
}
