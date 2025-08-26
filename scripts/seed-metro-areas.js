const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

const metroAreas = [
  {
    name: "San Francisco Bay Area",
    airport_code: "SFO",
  },
  {
    name: "Phoenix Metro",
    airport_code: "PHX",
  },
  {
    name: "Dallas-Fort Worth",
    airport_code: "DFW",
  },
  {
    name: "Los Angeles",
    airport_code: "LAX",
  },
  {
    name: "New York City",
    airport_code: "JFK",
  },
  {
    name: "Chicago",
    airport_code: "ORD",
  },
  {
    name: "Atlanta",
    airport_code: "ATL",
  },
  {
    name: "Miami",
    airport_code: "MIA",
  },
  {
    name: "Seattle",
    airport_code: "SEA",
  },
  {
    name: "Denver",
    airport_code: "DEN",
  },
]

async function seedMetroAreas() {
  try {
    console.log("🌍 Seeding metro areas...")

    for (const metroArea of metroAreas) {
      const existing = await prisma.metroArea.findUnique({
        where: { airport_code: metroArea.airport_code },
      })

      if (!existing) {
        await prisma.metroArea.create({
          data: metroArea,
        })
        console.log(`✅ Created metro area: ${metroArea.name} (${metroArea.airport_code})`)
      } else {
        console.log(`⏭️  Metro area already exists: ${metroArea.name} (${metroArea.airport_code})`)
      }
    }

    console.log("🎉 Metro areas seeding completed!")
  } catch (error) {
    console.error("❌ Error seeding metro areas:", error)
  } finally {
    await prisma.$disconnect()
  }
}

seedMetroAreas()
