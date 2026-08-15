import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { resetToken, code, newPassword } = await request.json()

    if (!resetToken || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Token, code et nouveau mot de passe requis' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    // Find user with this reset token
    const users = await db.user.findMany({
      where: {
        resetToken: { not: null },
        resetTokenExpiry: { gt: new Date() },
      },
    })

    let matchedUser = null
    for (const user of users) {
      if (user.resetToken) {
        const [storedToken, storedCode] = user.resetToken.split(':')
        if (storedToken === resetToken && storedCode === code) {
          matchedUser = user
          break
        }
      }
    }

    if (!matchedUser) {
      return NextResponse.json(
        { error: 'Code invalide ou expiré. Veuillez recommencer.' },
        { status: 400 }
      )
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password and clear reset token
    await db.user.update({
      where: { id: matchedUser.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    return NextResponse.json({
      message: 'Mot de passe modifié avec succès. Vous pouvez maintenant vous connecter.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
