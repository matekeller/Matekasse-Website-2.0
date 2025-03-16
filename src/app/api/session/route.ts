export const runtime = 'edge'
import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/session'

export const GET = async () => {
  const session = await getSession()

  const response = NextResponse.json({ session })

  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

  return response
}

export const OPTIONS = () => {
  const response = new NextResponse(null, { status: 204 })

  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

  return response
}
