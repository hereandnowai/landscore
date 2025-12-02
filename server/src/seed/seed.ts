/**
 * LANDSCORE Seed Data Generator
 * 
 * Generates 50-100 realistic GeoJSON parcels in the Austin, Texas region
 * with complete valuation and land data.
 * 
 * Austin Coordinates (approximate center): 30.2672° N, 97.7431° W
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Austin, Texas, USA - center point
  centerLat: 30.2672,
  centerLng: -97.7431,
  
  // Spread area (degrees) - roughly 15km x 15km
  spreadLat: 0.12,
  spreadLng: 0.12,
  
  // Number of parcels to generate
  parcelCount: 75,
  
  // Parcel size ranges (in acres)
  minParcelSize: 0.5,
  maxParcelSize: 25,
};

// ============================================
// DATA CONSTANTS
// ============================================

const SOIL_TYPES = ['CLAY', 'LOAM', 'SANDY_LOAM', 'RED_SOIL', 'BLACK_SOIL', 'ALLUVIAL'];
const CROPLAND_CLASSES = ['PRIME', 'UNIQUE', 'STATEWIDE', 'LOCAL', 'NOT_PRIME'];
const ZONING_CODES = ['AGRICULTURAL', 'RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'MIXED_USE'];
const IRRIGATION_TYPES = ['DRIP', 'FLOOD', 'SPRINKLER', 'CANAL', 'WELL', 'NONE'];
const OWNER_TYPES = ['INDIVIDUAL', 'FAMILY', 'CORPORATION', 'GOVERNMENT', 'TRUST', 'COOPERATIVE'];

const FIRST_NAMES = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David',
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara',
  'Carlos', 'Maria', 'Jose', 'Miguel', 'Luis', 'Ana',
  'Sarah', 'Emily', 'Ashley', 'Jessica', 'Amanda', 'Stephanie',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia',
  'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez',
  'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson',
  'Thompson', 'White', 'Harris', 'Martin', 'Robinson', 'Clark',
];

const AUSTIN_AREAS = [
  'Downtown Austin', 'East Austin', 'South Austin', 'North Austin', 'West Austin',
  'Round Rock', 'Cedar Park', 'Pflugerville', 'Georgetown', 'Lakeway',
  'Bee Cave', 'Dripping Springs', 'Manor', 'Leander', 'Kyle',
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(random(min, max + 1));
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomWeighted<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let threshold = Math.random() * total;
  
  for (let i = 0; i < items.length; i++) {
    threshold -= weights[i];
    if (threshold <= 0) return items[i];
  }
  
  return items[items.length - 1];
}

/**
 * Generate a random polygon around a center point
 */
function generateParcelPolygon(
  centerLat: number,
  centerLng: number,
  areaAcres: number
): { coordinates: number[][][]; centroid: { lat: number; lng: number } } {
  // Convert acres to approximate degrees (rough approximation at this latitude)
  // 1 acre ≈ 4047 m², at 10°N, 1 degree ≈ 111km lat, ~109km lng
  const areaSqM = areaAcres * 4047;
  const sideLength = Math.sqrt(areaSqM); // meters
  
  // Convert to degrees (approximate)
  const latDegPerMeter = 1 / 111000;
  const lngDegPerMeter = 1 / (111000 * Math.cos(centerLat * Math.PI / 180));
  
  const halfLatSpan = (sideLength / 2) * latDegPerMeter;
  const halfLngSpan = (sideLength / 2) * lngDegPerMeter;
  
  // Add some randomness to make irregular shapes
  const irregularity = 0.3;
  const numPoints = randomInt(4, 7);
  const angleStep = (2 * Math.PI) / numPoints;
  
  const points: number[][] = [];
  
  for (let i = 0; i < numPoints; i++) {
    const angle = i * angleStep + random(-0.2, 0.2);
    const radiusFactor = 1 + random(-irregularity, irregularity);
    
    const lat = centerLat + Math.sin(angle) * halfLatSpan * radiusFactor;
    const lng = centerLng + Math.cos(angle) * halfLngSpan * radiusFactor;
    
    points.push([lng, lat]); // GeoJSON uses [lng, lat] order
  }
  
  // Close the polygon
  points.push([...points[0]]);
  
  return {
    coordinates: [points],
    centroid: { lat: centerLat, lng: centerLng }
  };
}

/**
 * Generate a unique parcel ID in Texas/Travis County format
 */
function generateParcelId(index: number): string {
  const countyCode = 'TRAVIS'; // Travis County, Texas
  const precinct = randomInt(1, 4).toString();
  const block = randomInt(1, 999).toString().padStart(3, '0');
  const lot = randomInt(1, 99).toString().padStart(2, '0');
  const suffix = String.fromCharCode(65 + randomInt(0, 5)); // A-F
  
  return `${countyCode}-${precinct}-${block}-${lot}${suffix}`;
}

/**
 * Generate realistic price based on land characteristics
 */
function calculatePrice(
  areaAcres: number,
  zoning: string,
  soilQuality: number,
  hasWaterAccess: boolean,
  hasRoadAccess: boolean,
  croplandClass: string
): { pricePerAcre: number; totalPrice: number } {
  // Base price per acre in USD
  // Austin, TX land prices: $5,000 - $100,000+ per acre depending on factors
  let basePricePerAcre = 25000;
  
  // Zoning multipliers
  const zoningMultipliers: Record<string, number> = {
    'COMMERCIAL': 2.5,
    'INDUSTRIAL': 2.0,
    'RESIDENTIAL': 1.8,
    'MIXED_USE': 1.5,
    'AGRICULTURAL': 1.0,
  };
  
  // Cropland class multipliers
  const croplandMultipliers: Record<string, number> = {
    'PRIME': 1.4,
    'UNIQUE': 1.3,
    'STATEWIDE': 1.1,
    'LOCAL': 1.0,
    'NOT_PRIME': 0.7,
  };
  
  let pricePerAcre = basePricePerAcre;
  
  // Apply multipliers
  pricePerAcre *= zoningMultipliers[zoning] || 1.0;
  pricePerAcre *= croplandMultipliers[croplandClass] || 1.0;
  pricePerAcre *= 0.5 + (soilQuality / 10) * 0.8; // Soil quality factor
  
  if (hasWaterAccess) pricePerAcre *= 1.25;
  if (hasRoadAccess) pricePerAcre *= 1.15;
  
  // Larger parcels get slight discount per acre
  if (areaAcres > 10) pricePerAcre *= 0.9;
  if (areaAcres > 20) pricePerAcre *= 0.85;
  
  // Add some random variation
  pricePerAcre *= random(0.85, 1.15);
  
  const totalPrice = Math.round(pricePerAcre * areaAcres);
  
  return {
    pricePerAcre: Math.round(pricePerAcre),
    totalPrice,
  };
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function seed() {
  console.log('🌱 Starting LANDSCORE seed process...\n');
  
  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.savedShape.deleteMany();
  await prisma.savedParcel.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.valuation.deleteMany();
  await prisma.landData.deleteMany();
  await prisma.parcel.deleteMany();
  await prisma.owner.deleteMany();
  await prisma.user.deleteMany();
  
  console.log('✅ Existing data cleared\n');
  
  // Create demo users
  console.log('👤 Creating demo users...');
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@landscore.com',
        passwordHash: '$2a$10$demohashadmin', // In production, use bcrypt
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      },
    }),
    prisma.user.create({
      data: {
        email: 'analyst@landscore.com',
        passwordHash: '$2a$10$demohashanalyst',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'ANALYST',
      },
    }),
    prisma.user.create({
      data: {
        email: 'viewer@landscore.com',
        passwordHash: '$2a$10$demohashviewer',
        firstName: 'Michael',
        lastName: 'Davis',
        role: 'VIEWER',
      },
    }),
  ]);
  console.log(`✅ Created ${users.length} demo users\n`);
  
  // Create owners
  console.log('🏠 Creating property owners...');
  const ownerCount = 40;
  const owners = [];
  
  for (let i = 0; i < ownerCount; i++) {
    const ownerType = randomWeighted(
      OWNER_TYPES,
      [40, 25, 15, 5, 10, 5] // Weights: Individual most common
    );
    
    let name: string;
    if (ownerType === 'CORPORATION') {
      name = `${randomChoice(LAST_NAMES)} ${randomChoice(['Ranch', 'Estates', 'Land Co', 'Holdings', 'Properties'])} LLC`;
    } else if (ownerType === 'GOVERNMENT') {
      name = `Texas ${randomChoice(['Parks & Wildlife', 'DOT', 'General Land Office', 'State Land Board'])}`;
    } else if (ownerType === 'TRUST') {
      name = `${randomChoice(LAST_NAMES)} Family Trust`;
    } else if (ownerType === 'COOPERATIVE') {
      name = `${randomChoice(AUSTIN_AREAS)} ${randomChoice(['Farmers', 'Agricultural', 'Ranchers'])} Co-op`;
    } else {
      name = `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`;
    }
    
    const owner = await prisma.owner.create({
      data: {
        name,
        ownerType,
        mailingAddress: `${randomInt(100, 9999)} ${randomChoice(['Main St', 'Oak Dr', 'Congress Ave', 'Lamar Blvd', 'Guadalupe St', 'Ranch Rd', 'Hill Country Blvd'])}, ${randomChoice(AUSTIN_AREAS)}, TX ${randomInt(78701, 78799)}`,
        phone: `+1 512-${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
        email: ownerType === 'INDIVIDUAL' 
          ? `${name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`
          : undefined,
      },
    });
    owners.push(owner);
  }
  console.log(`✅ Created ${owners.length} owners\n`);
  
  // Create parcels
  console.log(`🗺️  Generating ${CONFIG.parcelCount} parcels in Austin, Texas region...`);
  
  const parcels = [];
  const landDataRecords = [];
  const valuations = [];
  
  for (let i = 0; i < CONFIG.parcelCount; i++) {
    // Random location within the spread area
    const centerLat = CONFIG.centerLat + random(-CONFIG.spreadLat, CONFIG.spreadLat);
    const centerLng = CONFIG.centerLng + random(-CONFIG.spreadLng, CONFIG.spreadLng);
    
    // Random parcel size (weighted towards smaller parcels)
    const sizeWeight = Math.pow(Math.random(), 1.5); // Skew towards smaller
    const areaAcres = CONFIG.minParcelSize + sizeWeight * (CONFIG.maxParcelSize - CONFIG.minParcelSize);
    const areaSqft = areaAcres * 43560;
    const areaSqm = areaAcres * 4047;
    
    // Generate polygon
    const { coordinates, centroid } = generateParcelPolygon(centerLat, centerLng, areaAcres);
    
    const geometryJson = JSON.stringify({
      type: 'MultiPolygon',
      coordinates: [coordinates],
    });
    
    // Land characteristics
    const soilType = randomChoice(SOIL_TYPES);
    const soilQuality = randomInt(3, 10);
    const croplandClass = randomWeighted(
      CROPLAND_CLASSES,
      [25, 15, 30, 20, 10]
    );
    const zoningCode = randomWeighted(
      ZONING_CODES,
      [20, 35, 20, 10, 15] // Austin mix: more residential/commercial
    );
    const irrigationType = randomChoice(IRRIGATION_TYPES);
    
    const hasWaterAccess = Math.random() < 0.4;
    const hasRoadAccess = Math.random() < 0.85;
    const hasUtilities = Math.random() < 0.3;
    
    // Calculate valuation
    const { pricePerAcre, totalPrice } = calculatePrice(
      areaAcres,
      zoningCode,
      soilQuality,
      hasWaterAccess,
      hasRoadAccess,
      croplandClass
    );
    
    const parcelId = generateParcelId(i);
    const area = randomChoice(AUSTIN_AREAS);
    const id = randomUUID();
    
    parcels.push({
      id,
      parcelId,
      apn: `TX-${randomInt(1000, 9999)}-${randomInt(100, 999)}`,
      address: `${randomInt(100, 9999)} ${randomChoice(['Ranch Rd', 'Hill Country Dr', 'Bluebonnet Ln', 'Live Oak Trail', 'Pecan St', 'Congress Ave', 'Barton Creek Blvd'])}`,
      city: area,
      state: 'Texas',
      zipCode: `787${randomInt(1, 99).toString().padStart(2, '0')}`,
      country: 'USA',
      areaSqft: Math.round(areaSqft * 100) / 100,
      areaAcres: Math.round(areaAcres * 1000) / 1000,
      areaSqm: Math.round(areaSqm * 100) / 100,
      geometryJson,
      centroidLat: centroid.lat,
      centroidLng: centroid.lng,
      ownerId: randomChoice(owners).id,
    });
    
    landDataRecords.push({
      id: randomUUID(),
      parcelId: id,
      soilType,
      soilQuality,
      croplandClass,
      irrigationType,
      zoningCode,
      zoningDescription: `${zoningCode.replace('_', ' ')} Zone - ${area}`,
      landUseCode: zoningCode.substring(0, 3).toUpperCase(),
      elevation: random(120, 300), // Austin is ~150-250m elevation
      slope: random(0, 15),
      floodZone: randomWeighted(['X', 'A', 'AE'], [70, 20, 10]),
      hasWaterAccess,
      hasRoadAccess,
      hasUtilities,
      distanceToWater: hasWaterAccess ? random(10, 500) : random(500, 5000),
      distanceToRoad: hasRoadAccess ? random(5, 200) : random(200, 2000),
    });
    
    // Generate historical sale (60% chance)
    const hadPreviousSale = Math.random() < 0.6;
    const lastSaleDate = hadPreviousSale 
      ? new Date(Date.now() - randomInt(365, 3650) * 24 * 60 * 60 * 1000)
      : null;
    const lastSalePrice = hadPreviousSale
      ? totalPrice * random(0.6, 0.95) // Previous sale was lower
      : null;
    
    valuations.push({
      id: randomUUID(),
      parcelId: id,
      estimatedPrice: totalPrice,
      taxAssessedValue: Math.round(totalPrice * random(0.7, 0.85)),
      marketValue: Math.round(totalPrice * random(0.95, 1.1)),
      pricePerSqft: Math.round((totalPrice / areaSqft) * 100) / 100,
      pricePerAcre,
      lastSaleDate,
      lastSalePrice,
      valuationSource: randomChoice(['ALGORITHM', 'ASSESSMENT', 'COMPARABLE']),
      confidence: random(0.7, 0.95),
    });
    
    if ((i + 1) % 25 === 0) {
      console.log(`   Generated ${i + 1}/${CONFIG.parcelCount} parcels...`);
    }
  }
  
  // Bulk insert parcels
  console.log('\n📝 Inserting parcels into database...');
  await prisma.parcel.createMany({ data: parcels });
  console.log(`✅ Inserted ${parcels.length} parcels`);
  
  // Bulk insert land data
  console.log('📝 Inserting land data...');
  await prisma.landData.createMany({ data: landDataRecords });
  console.log(`✅ Inserted ${landDataRecords.length} land data records`);
  
  // Bulk insert valuations
  console.log('📝 Inserting valuations...');
  await prisma.valuation.createMany({ data: valuations });
  console.log(`✅ Inserted ${valuations.length} valuation records`);
  
  // Update geometry column using raw SQL
  console.log('\n🗺️  Updating PostGIS geometry column...');
  
  for (const parcel of parcels) {
    await prisma.$executeRawUnsafe(`
      UPDATE parcels 
      SET geometry = ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)
      WHERE id = $2
    `, parcel.geometryJson, parcel.id);
  }
  console.log('✅ PostGIS geometry column updated');
  
  // Create some saved items for demo user
  console.log('\n📌 Creating sample saved items...');
  const analyst = users.find(u => u.role === 'ANALYST')!;
  
  await prisma.savedSearch.create({
    data: {
      userId: analyst.id,
      name: 'Large Agricultural Plots',
      description: 'Plots over 10 acres suitable for farming',
      filters: JSON.stringify({
        minAreaAcres: 10,
        zoningCodes: ['AGRICULTURAL'],
        croplandClasses: ['PRIME', 'UNIQUE'],
      }),
    },
  });
  
  await prisma.savedSearch.create({
    data: {
      userId: analyst.id,
      name: 'Waterfront Properties',
      description: 'Properties with water access',
      filters: JSON.stringify({
        hasWaterAccess: true,
        maxDistanceToWater: 100,
      }),
    },
  });
  
  // Save a few random parcels
  const randomParcels = parcels.slice(0, 5);
  for (const parcel of randomParcels) {
    await prisma.savedParcel.create({
      data: {
        userId: analyst.id,
        parcelId: parcel.id,
        notes: 'Flagged for review',
        tags: ['review', 'potential'],
      },
    });
  }
  
  console.log('✅ Sample saved items created');
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('🎉 LANDSCORE SEED COMPLETE!');
  console.log('='.repeat(50));
  console.log(`
📊 Summary:
   • Users: ${users.length}
   • Owners: ${owners.length}
   • Parcels: ${parcels.length}
   • Land Data Records: ${landDataRecords.length}
   • Valuations: ${valuations.length}

🗺️  Location: Austin, Texas, USA
   • Center: ${CONFIG.centerLat}°N, ${Math.abs(CONFIG.centerLng)}°W
   • Spread: ~${Math.round(CONFIG.spreadLat * 111)}km x ${Math.round(CONFIG.spreadLng * 95)}km

🔐 Demo Accounts:
   • admin@landscore.com (Admin)
   • analyst@landscore.com (Analyst)
   • viewer@landscore.com (Viewer)
   • Password: demo123 (update in production!)
  `);
}

// Run seed
seed()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
