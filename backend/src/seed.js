import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Event from './models/Event.js';
import Registration from './models/Registration.js';
import Review from './models/Review.js';
import { generateQRCodeDataUrl } from './utils/qrcode.js';

async function run() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌  DO NOT run seed.js in production — it will wipe all data!');
    process.exit(1);
  }
  await connectDB();
  await Promise.all([
    User.deleteMany({}),
    Event.deleteMany({}),
    Registration.deleteMany({}),
    Review.deleteMany({}),
  ]);

  // Create 10+ organizers
  const organizers = [];
  for (let i = 1; i <= 12; i++) {
    const org = await User.create({
      name: `Organizer ${i}`,
      email: `organizer${i}@example.com`,
      password: 'password',
      role: 'organizer'
    });
    organizers.push(org);
  }

  // Create 10+ customers
  const customers = [];
  for (let i = 1; i <= 12; i++) {
    const cust = await User.create({
      name: `Customer ${i}`,
      email: `customer${i}@example.com`,
      password: 'password',
      role: 'customer'
    });
    customers.push(cust);
  }

  // Primary customer and organizer
  const customer = await User.create({ name: 'Alice Customer', email: 'customer@example.com', password: 'password', role: 'customer' });
  const organizer = await User.create({ name: 'Oscar Organizer', email: 'organizer@example.com', password: 'password', role: 'organizer' });
  const admin = await User.create({ name: 'Adam Admin', email: 'admin@example.com', password: 'password', role: 'admin' });
  
  const users = [customer, organizer, admin, ...customers, ...organizers];

  // Events by all organizers
  const now = new Date();
  const events = [];
  
  // Create events for each organizer (varying numbers)
  for (let orgIdx = 0; orgIdx < organizers.length; orgIdx++) {
    const org = organizers[orgIdx];
    const eventCount = Math.floor(Math.random() * 4) + 3; // 3-6 events per organizer
    
    for (let e = 0; e < eventCount; e++) {
      const evt = await Event.create({
        title: `Event by ${org.name} - ${e + 1}`,
        description: `A great event organized by ${org.name}.`,
        category: ['Tech', 'Sports', 'Cultural', 'Workshop'][Math.floor(Math.random() * 4)],
        date: new Date(now.getTime() + Math.random() * 60 * 24 * 60 * 60 * 1000),
        location: `Location ${orgIdx + 1}`,
        capacity: Math.floor(Math.random() * 100) + 50,
        organizer: org._id,
        status: Math.random() > 0.3 ? 'approved' : 'pending',
        averageRating: Math.random() > 0.4 ? (Math.random() * 2 + 3).toFixed(1) : 0,
        tags: ['event', org.name.split(' ')[1]?.toLowerCase()]
      });
      events.push(evt);
    }
  }

  // Primary organizer events
  const primaryEvents = await Event.insertMany([
    {
      title: 'Tech Talk: MERN Essentials',
      description: 'Intro to MERN stack for campus developers.',
      category: 'Tech',
      date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      location: 'Auditorium A',
      capacity: 100,
      organizer: organizer._id,
      status: 'approved',
      averageRating: 4.5,
      tags: ['mern', 'javascript'],
    },
    {
      title: 'Inter-College Football Meet',
      description: 'Friendly football matches and skills workshop.',
      category: 'Sports',
      date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      location: 'Sports Ground',
      capacity: 60,
      organizer: organizer._id,
      status: 'approved',
      averageRating: 4.2,
      tags: ['outdoor'],
    },
    {
      title: 'Cultural Night 2025',
      description: 'Dance, music, and drama from student clubs.',
      category: 'Cultural',
      date: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      location: 'Open Air Theatre',
      capacity: 200,
      organizer: organizer._id,
      status: 'approved',
      averageRating: 4.8,
      tags: ['fest'],
    },
    {
      title: 'Hackathon: Build for Campus',
      description: '24-hour hackathon to build campus utilities.',
      category: 'Tech',
      date: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      location: 'Innovation Lab',
      capacity: 80,
      organizer: organizer._id,
      status: 'approved',
      averageRating: 4.7,
      tags: ['hackathon'],
    },
  ]);
  events.push(...primaryEvents);

  // Create registrations for all customers (varying participation)
  let totalPoints = 0;
  for (const cust of customers) {
    const eventsToAttend = Math.floor(Math.random() * 6) + 2; // 2-7 events per customer
    const attendedCount = Math.floor(eventsToAttend * 0.7); // 70% attendance rate
    let custPoints = 0;
    const usedEventIds = new Set();

    for (let i = 0; i < eventsToAttend; i++) {
      let randomEvent;
      let attempts = 0;
      // Ensure unique event per customer
      do {
        randomEvent = events[Math.floor(Math.random() * events.length)];
        attempts++;
      } while (usedEventIds.has(randomEvent._id.toString()) && attempts < 10);

      if (usedEventIds.has(randomEvent._id.toString())) continue; // Skip if we've exhausted attempts

      usedEventIds.add(randomEvent._id.toString());

      const status = i < attendedCount ? 'attended' : 'registered';
      const payload = JSON.stringify({
        userId: cust._id.toString(),
        eventId: randomEvent._id.toString(),
        at: Date.now()
      });
      const qr = await generateQRCodeDataUrl(payload);

      await Registration.create({
        user: cust._id,
        event: randomEvent._id,
        qrCodeDataUrl: qr,
        status: status
      });

      if (status === 'attended') {
        custPoints += 10; // Attendance points
        if (Math.random() > 0.6) {
          // 40% chance of leaving a review
          const rating = Math.floor(Math.random() * 3) + 3; // 3-5 stars
          await Review.create({
            user: cust._id,
            event: randomEvent._id,
            rating: rating,
            comment: `Great event! Rating: ${rating}/5`
          });
          custPoints += 3; // Review points
        }
      }
      custPoints += 5; // Registration points
    }

    await User.findByIdAndUpdate(cust._id, { $inc: { points: custPoints } });
    totalPoints += custPoints;
  }

  // Primary customer registrations
  const payload = JSON.stringify({
    userId: customer._id.toString(),
    eventId: primaryEvents[0]._id.toString(),
    at: Date.now()
  });
  const qr = await generateQRCodeDataUrl(payload);
  await Registration.create({
    user: customer._id,
    event: primaryEvents[0]._id,
    qrCodeDataUrl: qr,
    status: 'attended'
  });

  const payload2 = JSON.stringify({
    userId: customer._id.toString(),
    eventId: primaryEvents[1]._id.toString(),
    at: Date.now()
  });
  const qr2 = await generateQRCodeDataUrl(payload2);
  await Registration.create({
    user: customer._id,
    event: primaryEvents[1]._id,
    qrCodeDataUrl: qr2,
    status: 'attended'
  });

  // Review by customer
  const review = await Review.create({
    user: customer._id,
    event: primaryEvents[0]._id,
    rating: 5,
    comment: 'Outstanding event!'
  });

  // Award points (5 for registration + 10 for attendance on 2 events + 3 for review = 28)
  await User.findByIdAndUpdate(customer._id, { $inc: { points: 28 } });

  console.log('--- SEEDED CREDENTIALS ---');
  console.log(`Role: ${'customer'.padEnd(10)} | Email: ${'customer@example.com'.padEnd(25)} | Password: password`);
  console.log(`Role: ${'organizer'.padEnd(10)} | Email: ${'organizer@example.com'.padEnd(25)} | Password: password`);
  console.log(`Role: ${'admin'.padEnd(10)} | Email: ${'admin@example.com'.padEnd(25)} | Password: password`);
  console.log('----- Additional Customers -----');
  customers.forEach(c => {
    console.log(`Role: ${'customer'.padEnd(10)} | Email: ${c.email.padEnd(25)} | Password: password`);
  });
  console.log('----- Additional Organizers -----');
  organizers.forEach(o => {
    console.log(`Role: ${'organizer'.padEnd(10)} | Email: ${o.email.padEnd(25)} | Password: password`);
  });
  console.log('----- SEEDING COMPLETE -----');
  console.log(`✅ Created ${12 + customers.length} customers, ${12 + organizers.length} organizers, 1 admin`);
  console.log(`✅ Created ${events.length} events`);
  console.log('🏆 Leaderboard is ready to view!')
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
