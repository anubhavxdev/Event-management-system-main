// import mongoose from 'mongoose';
// import { connectDB } from './config/db.js';
// import User from './models/User.js';
// import Event from './models/Event.js';
// import Registration from './models/Registration.js';
// import Review from './models/Review.js';
// import { generateQRCodeDataUrl } from './utils/qrcode.js';

// async function run() {
//   if (process.env.NODE_ENV === 'production') {
//     console.error('❌  DO NOT run seed.js in production — it will wipe all data!');
//     process.exit(1);
//   }
//   await connectDB();
//   await Promise.all([
//     User.deleteMany({}),
//     Event.deleteMany({}),
//     Registration.deleteMany({}),
//     Review.deleteMany({}),
//   ]);

//   const customer = await User.create({ name: 'Alice Customer', email: 'customer@example.com', password: 'password', role: 'customer' });
//   const organizer = await User.create({ name: 'Oscar Organizer', email: 'organizer@example.com', password: 'password', role: 'organizer' });
//   const admin = await User.create({ name: 'Adam Admin', email: 'admin@example.com', password: 'password', role: 'admin' });
//   const users = [customer, organizer, admin];

//   // Events by organizer (two approved, one pending)
  
//   // TODO : update price,isFree
//   const now = new Date();
//   const events = await Event.insertMany([
//     {
//       title: 'Tech Talk: MERN Essentials',
//       description: 'Intro to MERN stack for campus developers.',
//       category: 'Tech',
//       date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
//       location: 'Auditorium A',
//       capacity: 100,
//       organizer: organizer._id,
//       status: 'approved',
//       posterUrl: '/uploads/poster-1.jpg',
//       tags: ['mern', 'javascript'],
//     },
//     {
//       title: 'Inter-College Football Meet',
//       description: 'Friendly football matches and skills workshop.',
//       category: 'Sports',
//       date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
//       location: 'Sports Ground',
//       capacity: 60,
//       organizer: organizer._id,
//       status: 'approved',
//       posterUrl: '/uploads/poster-2.jpg',
//       tags: ['outdoor'],
//     },
//     {
//       title: 'Photography Basics Workshop',
//       description: 'Hands-on with composition and lighting.',
//       category: 'Workshop',
//       date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
//       location: 'Lab 204',
//       capacity: 30,
//       organizer: organizer._id,
//       status: 'pending',
//       posterUrl: '/uploads/poster-3.jpg',
//       tags: ['creative'],
//     },
//     {
//       title: 'Cultural Night 2025',
//       description: 'Dance, music, and drama from student clubs.',
//       category: 'Cultural',
//       date: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
//       location: 'Open Air Theatre',
//       capacity: 200,
//       organizer: organizer._id,
//       status: 'approved',
//       posterUrl: '/uploads/poster-5.jpg',
//       tags: ['fest'],
//     },
//     {
//       title: 'Hackathon: Build for Campus',
//       description: '24-hour hackathon to build campus utilities.',
//       category: 'Tech',
//       date: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
//       location: 'Innovation Lab',
//       capacity: 80,
//       organizer: organizer._id,
//       status: 'approved',
//       posterUrl: '/uploads/poster-6.jpg',
//       tags: ['hackathon'],
//     },
//     {
//       title: 'Wellness Yoga Morning',
//       description: 'Relaxing yoga session for all students.',
//       category: 'Workshop',
//       date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
//       location: 'Campus Lawn',
//       capacity: 50,
//       organizer: organizer._id,
//       status: 'approved',
//       posterUrl: '/uploads/poster-7.jpg',
//       tags: ['health'],
//     },
//   ]);

//   // Registration for customer for first approved event with QR
//   const payload = JSON.stringify({ userId: customer._id.toString(), eventId: events[0]._id.toString(), at: Date.now() });
//   const qr = await generateQRCodeDataUrl(payload);
//   await Registration.create({ user: customer._id, event: events[0]._id, qrCodeDataUrl: qr, status: 'registered' });

//   // Review by customer
//   const review = await Review.create({ user: customer._id, event: events[0]._id, rating: 5, comment: 'Great session!' });
//   await Event.findByIdAndUpdate(events[0]._id, { averageRating: 5 });

//   // Award some points
//   await User.findByIdAndUpdate(customer._id, { $inc: { points: 25 } });

//   console.log('--- SEEDED CREDENTIALS ---');
//   users.forEach(u => {
//     console.log(`Role: ${u.role.padEnd(10)} | Email: ${u.email.padEnd(25)} | Password: password`);
//   });
//   console.log('--------------------------');
//   console.log('Seeded events:', events.map(e => ({ title: e.title, status: e.status })));
//   console.log('One registration + review created for customer.');
//   await mongoose.disconnect();
// }

// run().catch((e) => {
//   console.error(e);
//   process.exit(1);
// });


import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Event from './models/Event.js';
import Registration from './models/Registration.js';
import Review from './models/Review.js';
import { generateQRCodeDataUrl } from './utils/qrcode.js';

async function run() {
  if (process.env.NODE_ENV === 'production') {
    console.error(
      '❌ DO NOT run seed.js in production — it will wipe all data!'
    );
    process.exit(1);
  }

  await connectDB();

  // Clear database
  await Promise.all([
    User.deleteMany({}),
    Event.deleteMany({}),
    Registration.deleteMany({}),
    Review.deleteMany({}),
  ]);

  // Users
  const customer = await User.create({
    name: 'Alice Customer',
    email: 'customer@example.com',
    password: 'password',
    role: 'customer',
  });

  const organizer = await User.create({
    name: 'Oscar Organizer',
    email: 'organizer@example.com',
    password: 'password',
    role: 'organizer',
  });

  const admin = await User.create({
    name: 'Adam Admin',
    email: 'admin@example.com',
    password: 'password',
    role: 'admin',
  });

  const users = [customer, organizer, admin];

  const now = new Date();

  // Events for refund testing
  const events = await Event.insertMany([
    {
      title: 'Tech Talk: MERN Essentials',
      description:
        'Intro to MERN stack for campus developers.',
      category: 'Tech',
      date: new Date(
        now.getTime() +
          3 * 24 * 60 * 60 * 1000
      ), // 3 days → 50%
      location: 'Auditorium A',
      capacity: 100,
      organizer: organizer._id,
      status: 'approved',
      posterUrl:
        '/uploads/poster-1.jpg',
      tags: ['mern', 'javascript'],
      isFree: false,
      price: 1000,
    },

    {
      title:
        'Inter-College Football Meet',
      description:
        'Friendly football matches and skills workshop.',
      category: 'Sports',
      date: new Date(
        now.getTime() +
          10 * 24 * 60 * 60 * 1000
      ), // >7 days → full refund
      location: 'Sports Ground',
      capacity: 60,
      organizer: organizer._id,
      status: 'approved',
      posterUrl:
        '/uploads/poster-2.jpg',
      tags: ['outdoor'],
      isFree: false,
      price: 1500,
    },

    {
      title:
        'Photography Basics Workshop',
      description:
        'Hands-on with composition and lighting.',
      category: 'Workshop',
      date: new Date(
        now.getTime() +
          12 * 60 * 60 * 1000
      ), // <24 hours → no refund
      location: 'Lab 204',
      capacity: 30,
      organizer: organizer._id,
      status: 'approved',
      posterUrl:
        '/uploads/poster-3.jpg',
      tags: ['creative'],
      isFree: false,
      price: 500,
    },

    {
      title:
        'Cultural Night 2025',
      description:
        'Dance, music, and drama from student clubs.',
      category: 'Cultural',
      date: new Date(
        now.getTime() +
          15 * 24 * 60 * 60 * 1000
      ),
      location:
        'Open Air Theatre',
      capacity: 200,
      organizer: organizer._id,
      status: 'approved',
      posterUrl:
        '/uploads/poster-5.jpg',
      tags: ['fest'],
      isFree: true,
      price: 0,
    },

    {
      title:
        'Hackathon: Build for Campus',
      description:
        '24-hour hackathon to build campus utilities.',
      category: 'Tech',
      date: new Date(
        now.getTime() +
          20 * 24 * 60 * 60 * 1000
      ),
      location:
        'Innovation Lab',
      capacity: 80,
      organizer: organizer._id,
      status: 'approved',
      posterUrl:
        '/uploads/poster-6.jpg',
      tags: ['hackathon'],
      isFree: false,
      price: 2000,
    },
  ]);

  // Create registrations
  const registrations = [];

  for (let i = 0; i < events.length; i++) {
    const payload = JSON.stringify({
      userId:
        customer._id.toString(),
      eventId:
        events[
          i
        ]._id.toString(),
      at: Date.now(),
    });

    const qr =
      await generateQRCodeDataUrl(
        payload
      );

    registrations.push({
      user: customer._id,
      event: events[i]._id,
      qrCodeDataUrl: qr,
      status: 'registered',

      // Mock payment data
      paymentId:
        !events[i].isFree
          ? `pay_mock_${Date.now()}_${i}`
          : null,

      paymentStatus:
        !events[i].isFree
          ? 'paid'
          : 'not_applicable',

      // Refund fields
      refundId: null,

      refundStatus:
        'not_applicable',

      refundAmount: 0,

      refundedAt: null,
    });
  }

  const createdRegistrations =
    await Registration.insertMany(
      registrations
    );

  // Review for first event
  await Review.create({
    user: customer._id,
    event: events[0]._id,
    rating: 5,
    comment:
      'Great session!',
  });

  await Event.findByIdAndUpdate(
    events[0]._id,
    {
      averageRating: 5,
    }
  );

  // Reward points
  await User.findByIdAndUpdate(
    customer._id,
    {
      $inc: { points: 25 },
    }
  );

  // Credentials
  console.log(
    '\n--- SEEDED CREDENTIALS ---'
  );

  users.forEach((u) => {
    console.log(
      `Role: ${u.role.padEnd(
        10
      )} | Email: ${u.email.padEnd(
        25
      )} | Password: password`
    );
  });

  console.log(
    '--------------------------'
  );

  // Testing guide
  console.log(
    '\n--- REFUND TEST EVENTS ---'
  );

  events.forEach((e, index) => {
    console.log(
      `${index + 1}. ${
        e.title
      } | ₹${e.price || 0}`
    );
  });

  console.log(
    '\n--- REGISTRATION IDS FOR TESTING ---'
  );

  createdRegistrations.forEach(
    (r, i) => {
      console.log(
        `Event ${
          i + 1
        }: ${r._id}`
      );
    }
  );

  console.log(
    '\nRefund Test Cases:'
  );

  console.log(
    '1 → 3 days away → 50% refund'
  );

  console.log(
    '2 → 10 days away → full refund'
  );

  console.log(
    '3 → <24 hours → no refund'
  );

  console.log(
    '4 → free event → no payment logic'
  );

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
