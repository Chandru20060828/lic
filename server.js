// ═══════════════════════════════════════════════
// LIC ADVISOR – EXPRESS SERVER
// ═══════════════════════════════════════════════
require('dotenv').config();

const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const path      = require('path');
const routes    = require('./server/routes');
const { seedDatabase } = require('./server/seed');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
const enquiryLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { success: false, message: 'Too many enquiries. Try again later.' } });
app.use('/api/', limiter);
app.use('/api/public/enquiry', enquiryLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static frontend
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api', routes);

// SPA fallback
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

async function start() {
  try {
    const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lic_advisor';
    console.log('\n🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('✅ MongoDB connected:', mongoose.connection.host);

    console.log('\n🌱 Seeding database...');
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`\n🚀 LIC Advisor running at http://localhost:${PORT}`);
      console.log(`🌐 Website:  http://localhost:${PORT}/`);
      console.log(`🔐 Admin:    http://localhost:${PORT}/admin`);
      console.log(`📡 API:      http://localhost:${PORT}/api/`);
      console.log(`☁️  Storage:  Cloudinary\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start:', err.message);
    process.exit(1);
  }
}

start();
