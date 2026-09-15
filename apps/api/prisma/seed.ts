import { PrismaClient, Category, ViewingStatus, type Agent } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

// Use deterministic seed for reproducible and idempotent seeding
faker.seed(42);

const CITIES = [
  "New York",
  "Los Angeles",
  "Chicago",
  "Houston",
  "Phoenix",
  "Philadelphia",
  "San Antonio",
  "San Diego",
  "Dallas",
  "Austin",
  "San Jose",
  "San Francisco",
  "Seattle",
  "Denver",
  "Boston",
  "Miami",
  "Atlanta",
];

const PROPERTY_STYLES = [
  "Modern Loft",
  "Spacious Victorian",
  "Contemporary Townhouse",
  "Luxury Waterfront Villa",
  "Charming Colonial",
  "Sunlit Studio",
  "Minimalist Penthouse",
  "Cozy Craftsman",
  "Executive Suite",
  "Mid-Century Ranch",
  "Skyline View Apartment",
  "Urban Condo",
];

async function main() {
  console.log("Checking existing database records for idempotency...");

  const existingAgents = await prisma.agent.count();
  const existingListings = await prisma.listing.count();
  const existingViewings = await prisma.propertyViewing.count();

  if (existingAgents >= 30 && existingListings >= 300 && existingViewings >= 500) {
    console.log(
      `Database already populated with ${existingAgents} agents, ${existingListings} listings, and ${existingViewings} viewings. Skipping seed to ensure idempotency.`
    );
    return;
  }

  console.log("Seeding agents...");
  const agentData: {
    name: string;
    email: string;
    phone: string;
    city: string;
  }[] = [];

  for (let i = 0; i < 35; i++) {
    agentData.push({
      name: faker.person.fullName(),
      email: `agent.${i + 1}@propertymarket.demo`,
      phone: faker.phone.number({ style: "national" }),
      city: faker.helpers.arrayElement(CITIES),
    });
  }

  const createdAgents: Agent[] = [];
  for (const agent of agentData) {
    const record = await prisma.agent.upsert({
      where: { email: agent.email },
      update: {
        name: agent.name,
        phone: agent.phone,
        city: agent.city,
      },
      create: agent,
    });
    createdAgents.push(record);
  }

  console.log(`Created/Verified ${createdAgents.length} agents.`);

  // 2. Seed Listings (350 listings) — built in memory, inserted in one batch
  console.log("Seeding listings...");
  const categories: Category[] = ["sale", "rent"];

  const listingData = Array.from({ length: 350 }, () => {
    const agent = faker.helpers.arrayElement(createdAgents);
    const category = faker.helpers.arrayElement(categories);
    const bedrooms = faker.number.int({ min: 1, max: 5 });
    const bathrooms = faker.number.int({ min: 1, max: Math.min(bedrooms + 1, 4) });
    const style = faker.helpers.arrayElement(PROPERTY_STYLES);

    // Price in USD cents (whole-number integer — never a float)
    // Rent: $1,200–$8,500/month  → 120,000–850,000 cents
    // Sale: $175,000–$3,500,000  → 17,500,000–350,000,000 cents
    const price =
      category === "rent"
        ? faker.number.int({ min: 1200, max: 8500 }) * 100
        : faker.number.int({ min: 175000, max: 3500000 }) * 100;

    return {
      title: `${style} with ${bedrooms} Bed in ${agent.city}`,
      description: `${faker.lorem.paragraph(3)} Features include updated finishes, spacious layout, and convenient access to local transit and dining in ${agent.city}.`,
      price,
      category,
      bedrooms,
      bathrooms,
      city: agent.city,
      address: faker.location.streetAddress(),
      agentId: agent.id,
    };
  });

  // Single round-trip instead of 350 individual inserts
  await prisma.listing.createMany({ data: listingData });

  // Fetch back the created listings so we have their IDs for viewings
  const createdListings = await prisma.listing.findMany({ select: { id: true } });
  console.log(`Created ${createdListings.length} listings.`);

  // 3. Seed Viewings (600 viewings) — built in memory, inserted in one batch
  console.log("Seeding viewings...");
  const now = new Date();

  const viewingData = Array.from({ length: 600 }, () => {
    const listing = faker.helpers.arrayElement(createdListings);
    const isPast = faker.datatype.boolean();

    const scheduledAt = isPast
      ? faker.date.recent({ days: 45 })
      : faker.date.soon({ days: 45 });

    // Derive status logically from the scheduled date per PRD
    let status: ViewingStatus;
    if (scheduledAt < now) {
      status = faker.helpers.arrayElement(["completed", "cancelled"] as ViewingStatus[]);
    } else {
      status = "scheduled";
    }

    return {
      listingId: listing.id,
      visitorName: faker.person.fullName(),
      visitorEmail: faker.internet.email().toLowerCase(),
      scheduledAt,
      status,
    };
  });

  // Single round-trip instead of 600 individual inserts
  await prisma.propertyViewing.createMany({ data: viewingData });

  console.log("Seeded 600 property viewings.");
  console.log("Database seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
