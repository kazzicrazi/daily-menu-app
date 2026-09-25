'use client'

import { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MenuQRCodeProps {
  url?: string
}

export function MenuQRCode({ url }: MenuQRCodeProps) {
  const qrRef = useRef<HTMLDivElement>(null)
  
  // Use current website origin or default Vercel domain
  const siteUrl = url || (typeof window !== 'undefined' ? window.location.origin : 'https://daily-menu-app.vercel.app')

  const downloadQRCode = () => {
    const svgElement = qrRef.current?.querySelector('svg')
    if (!svgElement) return

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const SVGURL = window.URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 400
      canvas.height = 400
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // Draw background
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 20, 20, 360, 360)

        const pngUrl = canvas.toDataURL('image/png')
        const downloadLink = document.createElement('a')
        downloadLink.href = pngUrl
        downloadLink.download = 'canteen-menu-qr.png'
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
      }
    }
    img.src = SVGURL
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-center text-lg">Canteen Menu QR Code</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div ref={qrRef} className="p-4 bg-white rounded-lg border shadow-sm">
          <QRCodeSVG value={siteUrl} size={200} level="H" includeMargin />
        </div>
        <p className="text-xs text-muted-foreground text-center break-all">
          {siteUrl}
        </p>
        <Button onClick={downloadQRCode} className="w-full">
          Download QR Code (PNG)
        </Button>
      </CardContent>
    </Card>
  )
}