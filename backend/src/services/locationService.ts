import prisma from '../config/prisma';

export interface UpdateLocationInput {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  device?: string;
  battery?: number;
  address?: string;
}

export async function recordUserLocation(data: UpdateLocationInput) {
  return await prisma.userLocation.create({
    data: {
      userId: data.userId,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy || null,
      speed: data.speed || null,
      heading: data.heading || null,
      device: data.device || 'android',
      battery: data.battery || null,
      address: data.address || null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          designation: true,
          avatarUrl: true,
          employeeId: true,
          department: { select: { name: true } },
        },
      },
    },
  });
}

export async function getLatestStaffLocations() {
  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      email: true,
      employeeId: true,
      designation: true,
      avatarUrl: true,
      department: { select: { name: true } },
      locationTracks: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  return users.map((u) => {
    const latest = u.locationTracks[0] || null;
    return {
      userId: u.id,
      name: u.name,
      email: u.email,
      employeeId: u.employeeId,
      designation: u.designation,
      avatarUrl: u.avatarUrl,
      department: u.department?.name,
      location: latest
        ? {
            id: latest.id,
            latitude: latest.latitude,
            longitude: latest.longitude,
            accuracy: latest.accuracy,
            speed: latest.speed,
            heading: latest.heading,
            device: latest.device,
            battery: latest.battery,
            address: latest.address,
            updatedAt: latest.updatedAt,
          }
        : null,
    };
  });
}

export async function getUserLocationHistory(userId: string, limit = 50) {
  return await prisma.userLocation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
