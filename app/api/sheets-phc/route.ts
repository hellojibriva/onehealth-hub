import { NextRequest, NextResponse } from 'next/server'

const PHC_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbyeE0Aw1pBZqb0yuPNJIx7fJ4Y27u-tg6z1XHdoFfoVkkzdQR31XeWZpO1xcOAEP7OF4Q/exec'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    await fetch(PHC_SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ record: body }),
    })
    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('PHC Sheets proxy error:', error)
    return NextResponse.json({ status: 'error', message: String(error) }, { status: 500 })
  }
}