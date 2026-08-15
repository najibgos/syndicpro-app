import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'syndic-immeuble-secret-key-2024'
)

export interface AuthPayload {
  userId: string
  email: string
  role: 'ADMIN' | 'OWNER'
  name: string
  isActive: boolean
}

export async function createToken(payload: AuthPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(secret)
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as AuthPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<AuthPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  if (!token) return null
  return verifyToken(token)
}
