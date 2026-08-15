import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    // Create admin user
    const existingAdmin = await db.user.findUnique({ where: { email: 'admin@syndic.ma' } })
    if (existingAdmin) {
      return NextResponse.json({ message: 'Les données ont déjà été initialisées' })
    }

    const hashedPassword = await bcrypt.hash('admin123', 10)

    const admin = await db.user.create({
      data: {
        email: 'admin@syndic.ma',
        name: 'Syndic Admin',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        phone: '0600000000',
      },
    })

    // Create building from Excel data
    const building = await db.building.create({
      data: {
        name: 'Résidence Al Amal',
        address: 'Rue Hassan II',
        city: 'Casablanca',
        description: 'Immeuble principal',
        apartments: {
          create: [
            { number: 1, ownerName: 'Othmane', monthlyFee: 100 },
            { number: 2, ownerName: 'Mounir', monthlyFee: 100 },
            { number: 3, ownerName: 'Youssef', monthlyFee: 100 },
            { number: 4, ownerName: 'Fahd', monthlyFee: 100 },
            { number: 5, ownerName: 'Najib', monthlyFee: 100 },
            { number: 6, ownerName: 'Fatima', monthlyFee: 100 },
            { number: 7, ownerName: 'Said', monthlyFee: 100 },
            { number: 8, ownerName: 'Appartement 8', monthlyFee: 100 },
          ],
        },
      },
      include: { apartments: true },
    })

    // Create cotisations for January (all paid)
    for (const apt of building.apartments) {
      await db.cotisation.create({
        data: {
          apartmentId: apt.id,
          month: 1,
          year: 2024,
          amount: apt.monthlyFee,
          isPaid: apt.number <= 7,
          validatedAt: apt.number <= 7 ? new Date() : null,
        },
      })
    }

    // Create cotisations for February (Fahd not paid)
    for (const apt of building.apartments) {
      const isPaid = apt.number !== 4 && apt.number <= 7
      await db.cotisation.create({
        data: {
          apartmentId: apt.id,
          month: 2,
          year: 2024,
          amount: apt.monthlyFee,
          isPaid,
          validatedAt: isPaid ? new Date() : null,
        },
      })
    }

    // Create expenses for January
    await db.expense.create({
      data: {
        buildingId: building.id,
        month: 1,
        year: 2024,
        amount: 50,
        description: 'Produits sanitaire',
        category: 'SANITAIRE',
      },
    })

    // Create expenses for February
    await db.expense.create({
      data: {
        buildingId: building.id,
        month: 2,
        year: 2024,
        amount: 50,
        description: 'Produits sanitaire',
        category: 'SANITAIRE',
      },
    })

    // Create cleaning fees
    await db.cleaningFee.create({
      data: {
        buildingId: building.id,
        month: 1,
        year: 2024,
        amount: 500,
      },
    })

    await db.cleaningFee.create({
      data: {
        buildingId: building.id,
        month: 2,
        year: 2024,
        amount: 500,
      },
    })

    // Create default years
    for (const year of [2024, 2025, 2026]) {
      await db.year.upsert({
        where: { value: year },
        create: { value: year },
        update: {},
      })
    }

    // Create demo owner accounts
    const owners = [
      { name: 'Othmane', email: 'othmane@email.com', aptNumber: 1 },
      { name: 'Mounir', email: 'mounir@email.com', aptNumber: 2 },
      { name: 'Youssef', email: 'youssef@email.com', aptNumber: 3 },
      { name: 'Fahd', email: 'fahd@email.com', aptNumber: 4 },
      { name: 'Najib', email: 'najib@email.com', aptNumber: 5 },
      { name: 'Fatima', email: 'fatima@email.com', aptNumber: 6 },
      { name: 'Said', email: 'said@email.com', aptNumber: 7 },
    ]

    for (const owner of owners) {
      const hashedPwd = await bcrypt.hash('owner123', 10)
      const user = await db.user.create({
        data: {
          email: owner.email,
          name: owner.name,
          password: hashedPwd,
          role: 'OWNER',
          isActive: true,
          phone: '0600000000',
        },
      })

      // Link owner to apartment
      const apt = building.apartments.find(a => a.number === owner.aptNumber)
      if (apt) {
        await db.apartment.update({
          where: { id: apt.id },
          data: { userId: user.id },
        })
      }
    }

    return NextResponse.json({
      message: 'Données initialisées avec succès',
      admin: { email: 'admin@syndic.ma', password: 'admin123' },
      owner: { email: 'othmane@email.com', password: 'owner123' },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'initialisation' }, { status: 500 })
  }
}
