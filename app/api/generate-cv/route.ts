import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { getCvData } from '@/lib/actions/cv'
import { CvTemplate } from '@/components/cv/cv-template'
import type { CvLang } from '@/components/cv/cv-template'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rawLang = searchParams.get('lang') ?? 'id'
  const lang: CvLang = rawLang === 'en' ? 'en' : 'id'

  const data = await getCvData()
  if (!data) {
    return NextResponse.json(
      { error: 'Unauthorized atau profil tidak ditemukan' },
      { status: 401 }
    )
  }

  try {
    // renderToBuffer requires a Document element — CvTemplate returns <Document>
    const element = React.createElement(CvTemplate, { data, lang }) as React.ReactElement<
      React.ComponentProps<typeof CvTemplate>
    >

    // @ts-expect-error — renderToBuffer accepts ReactElement<DocumentProps> but our element is typed differently
    const pdfBuffer: Buffer = await renderToBuffer(element)

    const filename = `CV_${(data.profile.full_name ?? 'Alumni').replace(/\s+/g, '_')}_${lang.toUpperCase()}.pdf`

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('generate-cv: error rendering PDF:', err)
    return NextResponse.json(
      { error: 'Gagal membuat PDF. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}
