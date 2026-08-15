import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
    const fromMonth = parseInt(searchParams.get('fromMonth') || '1')
    const toMonth = parseInt(searchParams.get('toMonth') || '12')
    const buildingId = searchParams.get('buildingId') || ''

    const monthNames = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre']
    const monthNamesFull = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

    // Get buildings
    let buildings = await db.building.findMany({ orderBy: { name: 'asc' } })
    if (buildingId) {
      buildings = buildings.filter(b => b.id === buildingId)
    }

    // Collect data
    const rows: (string | number)[][] = []
    let totalCotisations = 0
    let totalPaid = 0
    let totalExpenses = 0
    let totalSolde = 0

    for (let m = fromMonth; m <= toMonth; m++) {
      let monthTotalCot = 0
      let monthPaidCot = 0
      let monthTotalExp = 0

      for (const b of buildings) {
        const cotisations = await db.cotisation.findMany({
          where: { apartment: { buildingId: b.id }, month: m, year },
        })
        const expenses = await db.expense.findMany({
          where: { buildingId: b.id, month: m, year },
        })
        const cleaning = await db.cleaningFee.findMany({
          where: { buildingId: b.id, month: m, year },
        })

        const allCot = cotisations.reduce((s, c) => s + c.amount, 0)
        const paidCot = cotisations.filter(c => c.isPaid).reduce((s, c) => s + c.amount, 0)
        const exp = expenses.reduce((s, e) => s + e.amount, 0) + cleaning.reduce((s, c) => s + c.amount, 0)

        monthTotalCot += allCot
        monthPaidCot += paidCot
        monthTotalExp += exp
      }

      const reste = monthPaidCot - monthTotalExp
      rows.push([monthNames[m - 1], monthTotalCot, monthPaidCot, monthTotalExp, reste])
      totalCotisations += monthTotalCot
      totalPaid += monthPaidCot
      totalExpenses += monthTotalExp
      totalSolde += reste
    }

    // Generate PDF with jsPDF
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()

    // Header bar
    doc.setFillColor(37, 99, 235) // blue-600
    doc.rect(0, 0, pageWidth, 28, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('SyndicPro', 14, 12)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Rapport Historique', 64, 12)

    doc.setFontSize(8)
    doc.setTextColor(219, 234, 254) // blue-100
    const periodText = `Periode : ${monthNamesFull[fromMonth - 1]} - ${monthNamesFull[toMonth - 1]} ${year}`
    const buildingText = buildings.length === 1
      ? `Immeuble : ${buildings[0].name}`
      : `Immeubles : Tous (${buildings.length})`
    const dateText = `Genere le : ${new Date().toLocaleDateString('fr-FR')}`
    doc.text(periodText, 14, 20)
    doc.text(buildingText, 90, 20)
    doc.text(dateText, 160, 20)

    // Summary section
    let y = 36
    const summaryData = [
      { label: 'Cotisations Total', value: `${totalCotisations.toFixed(0)} MAD`, color: [37, 99, 235] },
      { label: 'Cotisations Payees', value: `${totalPaid.toFixed(0)} MAD`, color: [13, 148, 136] },
      { label: 'Depenses Total', value: `${totalExpenses.toFixed(0)} MAD`, color: [234, 88, 12] },
      { label: 'Solde', value: `${totalSolde.toFixed(0)} MAD`, color: totalSolde >= 0 ? [22, 163, 74] : [220, 38, 38] },
    ]

    const cardW = 42
    const cardH = 20
    const cardGap = 4
    const startX = 14

    summaryData.forEach((card, i) => {
      const cx = startX + i * (cardW + cardGap)
      // Card background
      doc.setFillColor(243, 244, 246)
      doc.roundedRect(cx, y, cardW, cardH, 2, 2, 'F')
      // Color accent bar
      doc.setFillColor(card.color[0], card.color[1], card.color[2])
      doc.rect(cx, y, cardW, 1.5, 'F')
      // Label
      doc.setTextColor(107, 114, 128)
      doc.setFontSize(6.5)
      doc.setFont('helvetica', 'normal')
      doc.text(card.label, cx + 3, y + 6)
      // Value
      doc.setTextColor(31, 41, 55)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(card.value, cx + 3, y + 14)
    })

    y += cardH + 10

    // Table
    autoTable(doc, {
      startY: y,
      head: [['Mois', 'Cotisations (MAD)', 'Paye (MAD)', 'Depenses (MAD)', 'Solde (MAD)']],
      body: rows.map(r => [r[0], (r[1] as number).toFixed(0), (r[2] as number).toFixed(0), (r[3] as number).toFixed(0), (r[4] as number).toFixed(0)]),
      foot: [['Total', totalCotisations.toFixed(0), totalPaid.toFixed(0), totalExpenses.toFixed(0), totalSolde.toFixed(0)]],
      theme: 'plain',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'right',
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold' },
        1: { halign: 'right' },
        2: { halign: 'right', textColor: [13, 148, 136] },
        3: { halign: 'right', textColor: [234, 88, 12] },
        4: { halign: 'right', fontStyle: 'bold' },
      },
      footStyles: {
        fillColor: [229, 231, 235],
        textColor: [31, 41, 55],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [55, 65, 81],
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      margin: { left: 14, right: 14 },
      didParseCell: (data: { section?: string; column?: { index?: number }; cell?: { styles?: { textColor?: number[] } }; row?: { raw?: unknown[] } }) => {
        // Color solde column based on value
        if (data.section === 'body' && data.column?.index === 4) {
          const val = data.row?.raw?.[4] as number
          if (val !== undefined) {
            data.cell!.styles!.textColor = val >= 0 ? [22, 163, 74] : [220, 38, 38]
          }
        }
        if (data.section === 'foot' && data.column?.index === 4) {
          data.cell!.styles!.textColor = totalSolde >= 0 ? [22, 163, 74] : [220, 38, 38]
        }
      },
    })

    // Footer
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
    const footerY = finalY > 270 ? 280 : finalY
    if (footerY > 270) {
      doc.setPage(doc.getNumberOfPages())
    }
    doc.setTextColor(156, 163, 175)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `SyndicPro - Rapport genere automatiquement le ${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR')}`,
      pageWidth / 2,
      285,
      { align: 'center' }
    )

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    const periodLabel = fromMonth === toMonth
      ? `${monthNames[fromMonth - 1]}_${year}`
      : `${monthNames[fromMonth - 1]}-${monthNames[toMonth - 1]}_${year}`
    const buildingLabel = buildings.length === 1 ? `_${buildings[0].name.replace(/\s+/g, '_')}` : ''
    const filename = `Historique_SyndicPro${buildingLabel}_${periodLabel}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    })
  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json({ error: 'Erreur lors de la generation du PDF' }, { status: 500 })
  }
}
