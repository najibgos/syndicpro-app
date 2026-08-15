import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const currentYear = year ? parseInt(year) : new Date().getFullYear()
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1

    // Get buildings
    let buildings
    if (session.role === 'ADMIN') {
      buildings = await db.building.findMany({
        include: {
          apartments: {
            include: {
              owner: { select: { id: true, name: true, isActive: true } },
              cotisations: {
                where: { month: currentMonth, year: currentYear },
              },
            },
          },
          expenses: {
            where: { month: currentMonth, year: currentYear },
          },
          cleaningFees: {
            where: { month: currentMonth, year: currentYear },
          },
        },
      })
      if (buildingId) {
        buildings = buildings.filter(b => b.id === buildingId)
      }
    } else {
      // Owner - get their building
      const userApt = await db.apartment.findFirst({
        where: { userId: session.userId },
        include: { building: true },
      })
      if (!userApt) {
        return NextResponse.json({ dashboard: null, message: 'Aucun appartement associé' })
      }

      buildings = await db.building.findMany({
        where: { id: userApt.buildingId },
        include: {
          apartments: {
            include: {
              owner: { select: { id: true, name: true, isActive: true } },
              cotisations: {
                where: { month: currentMonth, year: currentYear },
              },
            },
          },
          expenses: {
            where: { month: currentMonth, year: currentYear },
          },
          cleaningFees: {
            where: { month: currentMonth, year: currentYear },
          },
        },
      })
    }

    // Calculate summary for each building
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

    const summary = buildings.map(building => {
      const totalCotisations = building.apartments.reduce((sum, apt) => {
        return sum + apt.cotisations.reduce((s, c) => s + c.amount, 0)
      }, 0)
      const paidCotisations = building.apartments.reduce((sum, apt) => {
        return sum + apt.cotisations.filter(c => c.isPaid).reduce((s, c) => s + c.amount, 0)
      }, 0)
      const totalExpenses = building.expenses.reduce((sum, e) => sum + e.amount, 0)
      const totalCleaning = building.cleaningFees.reduce((sum, c) => sum + c.amount, 0)
      const totalDepenses = totalExpenses + totalCleaning
      const reste = paidCotisations - totalDepenses

      return {
        buildingId: building.id,
        buildingName: building.name,
        month: currentMonth,
        year: currentYear,
        monthName: monthNames[currentMonth - 1],
        totalCotisations,
        paidCotisations,
        unpaidCotisations: totalCotisations - paidCotisations,
        totalExpenses,
        totalCleaning,
        totalDepenses,
        reste,
        apartmentCount: building.apartments.length,
        paidCount: building.apartments.filter(a => a.cotisations.some(c => c.isPaid)).length,
        unpaidCount: building.apartments.filter(a => a.cotisations.length === 0 || a.cotisations.every(c => !c.isPaid)).length,
      }
    })

    // Get yearly history
    const yearInt = currentYear
    const yearlyData = []

    for (let m = 1; m <= 12; m++) {
      for (const b of buildings) {
        const cotisations = await db.cotisation.findMany({
          where: { apartment: { buildingId: b.id }, month: m, year: yearInt },
        })
        const expenses = await db.expense.findMany({
          where: { buildingId: b.id, month: m, year: yearInt },
        })
        const cleaning = await db.cleaningFee.findMany({
          where: { buildingId: b.id, month: m, year: yearInt },
        })

        const totalCot = cotisations.filter(c => c.isPaid).reduce((s, c) => s + c.amount, 0)
        const totalExp = expenses.reduce((s, e) => s + e.amount, 0) + cleaning.reduce((s, c) => s + c.amount, 0)

        yearlyData.push({
          buildingId: b.id,
          buildingName: b.name,
          month: m,
          monthName: monthNames[m - 1],
          year: yearInt,
          totalCotisations: cotisations.reduce((s, c) => s + c.amount, 0),
          paidCotisations: totalCot,
          totalExpenses: totalExp,
          reste: totalCot - totalExp,
        })
      }
    }

    // Unread notifications count
    const unreadCount = await db.notification.count({
      where: { userId: session.userId, isRead: false },
    })

    // Pending users count (admin only)
    let pendingUsersCount = 0
    if (session.role === 'ADMIN') {
      pendingUsersCount = await db.user.count({
        where: { isActive: false, role: 'OWNER' },
      })
    }

    // Owner's cotisation status
    let ownerCotisations = null
    if (session.role === 'OWNER') {
      const userApt = await db.apartment.findFirst({
        where: { userId: session.userId },
      })
      if (userApt) {
        ownerCotisations = await db.cotisation.findMany({
          where: { apartmentId: userApt.id, year: currentYear },
          orderBy: { month: 'asc' },
        })
      }
    }

    // Calculate total solde (cumulative annual balance)
    const totalSolde = yearlyData.reduce((sum, d) => sum + d.reste, 0)
    const totalPaidCotisationsYear = yearlyData.reduce((sum, d) => sum + d.paidCotisations, 0)
    const totalExpensesYear = yearlyData.reduce((sum, d) => sum + d.totalExpenses, 0)

    return NextResponse.json({
      dashboard: {
        summary,
        yearlyData,
        totalSolde,
        totalPaidCotisationsYear,
        totalExpensesYear,
        unreadCount,
        pendingUsersCount,
        ownerCotisations,
      },
    })
  } catch (error) {
    console.error('Dashboard GET error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
