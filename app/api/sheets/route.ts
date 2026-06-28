import { NextRequest, NextResponse } from 'next/server'

const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbw_1qIRvYo83-wnqZrcxE-Uha7uj757MzkqhB3Uou_w4oj48b2HLcxducon_xfuwMjv/exec'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const response = await fetch(SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ record: body }),
    })

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('Sheets proxy error:', error)
    return NextResponse.json({ status: 'error', message: String(error) }, { status: 500 })
  }
}