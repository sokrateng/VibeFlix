import { NextRequest } from 'next/server'

export function verifyAdminToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  const envToken = process.env.ADMIN_TOKEN

  if (!envToken) {
    console.error('ADMIN_TOKEN env var is not set')
    return false
  }

  return token === envToken
}
