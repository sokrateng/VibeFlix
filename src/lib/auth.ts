import { NextRequest } from 'next/server'

export function verifyAdminToken(request: NextRequest): boolean {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  return token === process.env.ADMIN_TOKEN
}
