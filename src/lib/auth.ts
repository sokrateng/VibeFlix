import { NextRequest } from 'next/server'
import crypto from 'crypto'

export function verifyAdminToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  const envToken = process.env.ADMIN_TOKEN

  if (!envToken) {
    console.error('ADMIN_TOKEN env var is not set')
    return false
  }

  if (!token || token.length !== envToken.length) {
    return false
  }

  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(envToken))
}
