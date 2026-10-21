import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Initial Staff GPS Locations in Karachi ---');
  const users = await prisma.user.findMany({ where: { status: 'ACTIVE' } });

  // Realistic office & field locations across Karachi business hubs
  const locations = [
    { email: 'adnan@apis.com', lat: 24.8615, lng: 67.0736, address: 'APIS Technology & AI Labs, PECHS Block 6, Karachi', device: 'android', battery: 94 },
    { email: 'khurram@apis.com', lat: 24.8152, lng: 67.0312, address: 'APIS Executive Headquarters, Clifton Block 4, Karachi', device: 'ios', battery: 88 },
    { email: 'noel@apis.com', lat: 24.8532, lng: 67.0167, address: 'I.I. Chundrigar Financial District, Karachi', device: 'android', battery: 76 },
    { email: 'naeem@apis.com', lat: 24.8719, lng: 67.0598, address: 'Shahrah-e-Faisal Media Corridor, Karachi', device: 'android', battery: 82 },
    { email: 'kashif@apis.com', lat: 24.8297, lng: 67.0739, address: 'DHA Phase 6 Commercial Hub, Karachi', device: 'android', battery: 69 },
    { email: 'abeel@apis.com', lat: 24.8631, lng: 67.0674, address: 'Digital Design & Studio Space, Tariq Road, Karachi', device: 'ios', battery: 91 },
    { email: 'fahim@apis.com', lat: 24.8698, lng: 67.0822, address: 'Karsaz Digital Growth Hub, Karachi', device: 'android', battery: 78 },
    { email: 'fatima@apis.com', lat: 24.8214, lng: 67.0425, address: 'Clifton Creative Quarter, Karachi', device: 'ios', battery: 85 },
    { email: 'maha@apis.com', lat: 24.8933, lng: 67.0281, address: 'Nazimabad Prime OOH Billboard Site #4, Karachi', device: 'android', battery: 73 },
    { email: 'shoaib@apis.com', lat: 24.8189, lng: 67.0354, address: 'Clifton Corporate Executive Towers, Karachi', device: 'android', battery: 90 },
    { email: 'musfira@apis.com', lat: 24.8601, lng: 67.0652, address: 'Operations & Client Experience Center, Karachi', device: 'ios', battery: 86 },
  ];

  for (const loc of locations) {
    const user = users.find((u) => u.email.toLowerCase() === loc.email);
    if (!user) continue;

    // Delete existing old location to ensure fresh record
    await prisma.userLocation.deleteMany({ where: { userId: user.id } });

    await prisma.userLocation.create({
      data: {
        userId: user.id,
        latitude: loc.lat,
        longitude: loc.lng,
        accuracy: 4.5,
        speed: 0,
        heading: 120,
        device: loc.device,
        battery: loc.battery,
        address: loc.address,
      },
    });
    console.log(`Seeded GPS Location for: ${user.name} (${loc.email}) -> ${loc.address}`);
  }

  console.log('--- GPS Seeding Completed Successfully! ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
