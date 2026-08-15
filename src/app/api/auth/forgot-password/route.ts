import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function generateResetCode(): number {
  return Math.floor(100000 + Math.random() * 900000)
}

function generateToken(): string {
  const chars = 'abcdef0123456789'
  let result = ''
  for (let i = 0; i < 64; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }

    // Check if user exists
    const user = await db.user.findUnique({ where: { email } })

    // Always return success to avoid revealing which emails exist
    if (!user) {
      return NextResponse.json({
        message: 'Si un compte existe avec cet email, un code de réinitialisation a été envoyé.',
      })
    }

    // Generate a 6-digit reset code and a token
    const resetCode = generateResetCode().toString()
    const resetToken = generateToken()
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Store the reset token and code in the database
    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken: `${resetToken}:${resetCode}`,
        resetTokenExpiry,
      },
    })

    // In production, send the code via email here
    // For now, we return the code in the response (for development/demo purposes)
    console.log(`[RESET PASSWORD] Code for ${email}: ${resetCode}`)

    return NextResponse.json({
      message: 'Si un compte existe avec cet email, un code de réinitialisation a été envoyé.',
      resetToken,
      code: resetCode,
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
