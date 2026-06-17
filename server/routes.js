// ═══════════════════════════════════════════════
// LIC ADVISOR – API ROUTES
// Changes: Cloudinary for all uploads, policyNo field,
//          multiple files per plan (up to 20 MB each),
//          advisor photo via Cloudinary.
// ═══════════════════════════════════════════════

const express = require('express');
const jwt     = require('jsonwebtoken');
const { uploadAdvisorPhoto, uploadPlanFiles, deleteCloudinaryFile, getResourceType } = require('./cloudinary');
const { Admin, Settings, Plan, Testimonial, Enquiry, Activity, PLAN_CATEGORIES } = require('./models');

const router = express.Router();

// ── AUTH HELPERS ──
const JWT_SECRET = process.env.JWT_SECRET || 'lic_secret_key';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  try {
    req.admin = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
}

async function logActivity(icon, text) {
  try {
    await Activity.create({ icon, text });
    const count = await Activity.countDocuments();
    if (count > 100) {
      const oldest = await Activity.find().sort({ createdAt: 1 }).limit(count - 100);
      await Activity.deleteMany({ _id: { $in: oldest.map(a => a._id) } });
    }
  } catch { /* non-critical */ }
}

// Multer error wrapper
function withUpload(multerMiddleware) {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message });
      next();
    });
  };
}

// ════════════════════════════════════════════════
//   PUBLIC ROUTES
// ════════════════════════════════════════════════

// GET /api/public/homepage
router.get('/public/homepage', async (req, res) => {
  try {
    const hp = await Settings.findOne({ section: 'homepage' });
    const ct = await Settings.findOne({ section: 'contact' });
    res.json({ success: true, homepage: hp?.data || {}, contact: ct?.data || {} });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/public/advisor-photo
router.get('/public/advisor-photo', async (req, res) => {
  try {
    const doc = await Settings.findOne({ section: 'advisor_photo' });
    res.json({ success: true, url: doc?.data?.url || null });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/public/plans
router.get('/public/plans', async (req, res) => {
  try {
    const query = { active: true };
    if (req.query.category && req.query.category !== 'all')
      query.category = req.query.category;
    const plans = await Plan.find(query).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, plans });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/plans  (spec alias)
router.get('/plans', async (req, res) => {
  try {
    const plans = await Plan.find({ active: true }).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, plans });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/plans/:id  (spec alias)
router.get('/plans/:id', async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true, plan });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/plans/category/:category  (spec alias)
router.get('/plans/category/:category', async (req, res) => {
  try {
    const query = { active: true };
    if (req.params.category !== 'all') query.category = req.params.category;
    const plans = await Plan.find(query).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, plans });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/public/testimonials
router.get('/public/testimonials', async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ active: true }).sort({ createdAt: -1 });
    res.json({ success: true, testimonials });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/public/enquiry
router.post('/public/enquiry', async (req, res) => {
  try {
    const { name, mobile, age, goal, message } = req.body;
    if (!name || !mobile)
      return res.status(400).json({ success: false, message: 'Name and mobile are required' });
    const enq = await Enquiry.create({ name, mobile, age, goal, message });
    await logActivity('📩', `New enquiry from ${name} (${goal || 'General'})`);
    res.json({ success: true, message: 'Enquiry submitted successfully', id: enq._id });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/public/pageview
router.post('/public/pageview', async (req, res) => {
  try {
    const doc = await Settings.findOne({ section: 'page_views' });
    if (doc) { doc.data = { count: (doc.data?.count || 0) + 1 }; await doc.save(); }
    else      { await Settings.create({ section: 'page_views', data: { count: 1 } }); }
    res.json({ success: true });
  } catch { res.json({ success: true }); }
});

// ════════════════════════════════════════════════
//   AUTH
// ════════════════════════════════════════════════

router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: 'Username and password required' });
    const admin = await Admin.findOne({ username });
    if (!admin || !(await admin.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = signToken({ id: admin._id, username: admin.username });
    await logActivity('🔐', `Admin login: ${username}`);
    res.json({ success: true, token, username: admin.username });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/auth/verify', authMiddleware, (req, res) => {
  res.json({ success: true, admin: req.admin });
});

// ════════════════════════════════════════════════
//   ADMIN ROUTES
// ════════════════════════════════════════════════

// Dashboard
router.get('/admin/dashboard', authMiddleware, async (req, res) => {
  try {
    const [enquiryCount, planCount, testimonialCount, pageViewsDoc, recentEnquiries] = await Promise.all([
      Enquiry.countDocuments(),
      Plan.countDocuments({ active: true }),
      Testimonial.countDocuments({ active: true }),
      Settings.findOne({ section: 'page_views' }),
      Enquiry.find().sort({ createdAt: -1 }).limit(5),
    ]);
    res.json({
      success: true,
      stats: { enquiryCount, planCount, testimonialCount, pageViews: pageViewsDoc?.data?.count || 0 },
      recentEnquiries,
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Settings GET/PUT
router.get('/admin/settings/:section', authMiddleware, async (req, res) => {
  try {
    const doc = await Settings.findOne({ section: req.params.section });
    res.json({ success: true, data: doc?.data || {} });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/admin/settings/:section', authMiddleware, async (req, res) => {
  try {
    await Settings.findOneAndUpdate(
      { section: req.params.section },
      { data: req.body, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    await logActivity('✏️', `Settings updated: ${req.params.section}`);
    res.json({ success: true, message: 'Settings saved' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── ADVISOR PHOTO ──
router.post(
  '/admin/upload/advisor-photo',
  authMiddleware,
  withUpload(uploadAdvisorPhoto.single('photo')),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ success: false, message: 'No image file provided' });

      // Delete old Cloudinary photo
      const existing = await Settings.findOne({ section: 'advisor_photo' });
      if (existing?.data?.publicId)
        await deleteCloudinaryFile(existing.data.publicId, 'image');

      const newData = {
        url:      req.file.path,        // Cloudinary secure URL
        publicId: req.file.filename,    // Cloudinary public_id
      };
      await Settings.findOneAndUpdate(
        { section: 'advisor_photo' },
        { data: newData, updatedAt: new Date() },
        { upsert: true, new: true }
      );
      await logActivity('📸', 'Advisor profile photo updated via Cloudinary');
      res.json({ success: true, url: newData.url });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  }
);

router.delete('/admin/upload/advisor-photo', authMiddleware, async (req, res) => {
  try {
    const existing = await Settings.findOne({ section: 'advisor_photo' });
    if (existing?.data?.publicId)
      await deleteCloudinaryFile(existing.data.publicId, 'image');
    await Settings.findOneAndUpdate(
      { section: 'advisor_photo' },
      { data: { url: null, publicId: null }, updatedAt: new Date() },
      { upsert: true }
    );
    await logActivity('🗑️', 'Advisor photo removed');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── PLANS CRUD ──

// GET /api/admin/plans
router.get('/admin/plans', authMiddleware, async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = {};
    if (category && category !== 'all') query.category = category;
    if (search) query.$or = [
      { name:        { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { policyNo:    { $regex: search, $options: 'i' } },
    ];
    const plans = await Plan.find(query).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, plans });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/admin/plans  (create with up to 10 files)
router.post(
  '/admin/plans',
  authMiddleware,
  withUpload(uploadPlanFiles.array('planFiles', 10)),
  async (req, res) => {
    try {
      const { name, policyNo, category, description, benefits, badge, active, order } = req.body;
      if (!name || !description)
        return res.status(400).json({ success: false, message: 'Name and description are required' });

      const benefitsArr = parseBenefits(benefits);

      // Build files array from Cloudinary uploads
      const files = (req.files || []).map(f => buildFileDoc(f));

      const plan = await Plan.create({
        policyNo: policyNo || '',
        name, category, description,
        benefits: benefitsArr,
        files,
        badge:  badge || null,
        active: active !== 'false' && active !== false,
        order:  parseInt(order) || 0,
      });
      await logActivity('📋', `Plan added: ${plan.name}`);
      res.json({ success: true, plan });
    } catch (e) { res.status(400).json({ success: false, message: e.message }); }
  }
);

// PUT /api/admin/plans/:id  (update + optionally add more files)
router.put(
  '/admin/plans/:id',
  authMiddleware,
  withUpload(uploadPlanFiles.array('planFiles', 10)),
  async (req, res) => {
    try {
      const existing = await Plan.findById(req.params.id);
      if (!existing) return res.status(404).json({ success: false, message: 'Plan not found' });

      const { name, policyNo, category, description, benefits, badge, active, order, removeFileIds } = req.body;

      const updates = {};
      if (name        !== undefined) updates.name        = name;
      if (policyNo    !== undefined) updates.policyNo    = policyNo;
      if (category    !== undefined) updates.category    = category;
      if (description !== undefined) updates.description = description;
      if (badge       !== undefined) updates.badge       = badge || null;
      if (active      !== undefined) updates.active      = active !== 'false' && active !== false;
      if (order       !== undefined) updates.order       = parseInt(order) || 0;
      if (benefits    !== undefined) updates.benefits    = parseBenefits(benefits);

      // Handle file removals
      let currentFiles = [...(existing.files || [])];
      if (removeFileIds) {
        const idsToRemove = Array.isArray(removeFileIds) ? removeFileIds : [removeFileIds];
        for (const fid of idsToRemove) {
          const fileDoc = currentFiles.find(f => f._id.toString() === fid);
          if (fileDoc) {
            await deleteCloudinaryFile(fileDoc.publicId || fileDoc.url, fileDoc.resourceType || 'raw');
            currentFiles = currentFiles.filter(f => f._id.toString() !== fid);
          }
        }
      }

      // Add new uploaded files
      const newFiles = (req.files || []).map(f => buildFileDoc(f));
      updates.files = [...currentFiles, ...newFiles];

      const plan = await Plan.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
      await logActivity('📋', `Plan updated: ${plan.name}`);
      res.json({ success: true, plan });
    } catch (e) { res.status(400).json({ success: false, message: e.message }); }
  }
);

// DELETE /api/admin/plans/:id  (also deletes all Cloudinary files)
router.delete('/admin/plans/:id', authMiddleware, async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    // Delete all associated Cloudinary files
    for (const f of plan.files || []) {
      await deleteCloudinaryFile(f.publicId || f.url, f.resourceType || 'raw');
    }
    await logActivity('🗑️', `Plan deleted: ${plan.name}`);
    res.json({ success: true, message: 'Plan deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE /api/admin/plans/:planId/files/:fileId  (remove single file from plan)
router.delete('/admin/plans/:planId/files/:fileId', authMiddleware, async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    const fileDoc = plan.files.find(f => f._id.toString() === req.params.fileId);
    if (!fileDoc) return res.status(404).json({ success: false, message: 'File not found' });
    await deleteCloudinaryFile(fileDoc.publicId || fileDoc.url, fileDoc.resourceType || 'raw');
    plan.files = plan.files.filter(f => f._id.toString() !== req.params.fileId);
    await plan.save();
    await logActivity('🗑️', `File removed from plan: ${plan.name}`);
    res.json({ success: true, message: 'File deleted', plan });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── TESTIMONIALS (unchanged) ──
router.get('/admin/testimonials', authMiddleware, async (req, res) => {
  try { res.json({ success: true, testimonials: await Testimonial.find().sort({ createdAt: -1 }) }); }
  catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
router.post('/admin/testimonials', authMiddleware, async (req, res) => {
  try {
    const t = await Testimonial.create(req.body);
    await logActivity('⭐', `Testimonial added: ${t.name}`);
    res.json({ success: true, testimonial: t });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});
router.put('/admin/testimonials/:id', authMiddleware, async (req, res) => {
  try {
    const t = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!t) return res.status(404).json({ success: false, message: 'Not found' });
    await logActivity('⭐', `Testimonial updated: ${t.name}`);
    res.json({ success: true, testimonial: t });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});
router.delete('/admin/testimonials/:id', authMiddleware, async (req, res) => {
  try {
    const t = await Testimonial.findByIdAndDelete(req.params.id);
    if (!t) return res.status(404).json({ success: false, message: 'Not found' });
    await logActivity('🗑️', `Testimonial deleted: ${t.name}`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── ENQUIRIES (unchanged) ──
router.get('/admin/enquiries', authMiddleware, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { mobile: { $regex: search, $options: 'i' } },
      { goal: { $regex: search, $options: 'i' } },
    ];
    const [enquiries, total] = await Promise.all([
      Enquiry.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      Enquiry.countDocuments(query),
    ]);
    res.json({ success: true, enquiries, total, page: Number(page) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
router.put('/admin/enquiries/:id/status', authMiddleware, async (req, res) => {
  try {
    const enq = await Enquiry.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json({ success: true, enquiry: enq });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
router.delete('/admin/enquiries/:id', authMiddleware, async (req, res) => {
  try { await Enquiry.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
router.delete('/admin/enquiries', authMiddleware, async (req, res) => {
  try {
    await Enquiry.deleteMany({});
    await logActivity('🗑️', 'All enquiries cleared');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── ACTIVITY ──
router.get('/admin/activity', authMiddleware, async (req, res) => {
  try { res.json({ success: true, logs: await Activity.find().sort({ createdAt: -1 }).limit(50) }); }
  catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── CHANGE PASSWORD ──
router.put('/admin/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.admin.id);
    if (!(await admin.comparePassword(currentPassword)))
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    admin.password = newPassword;
    await admin.save();
    await logActivity('🔑', 'Admin password changed');
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── CHANGE USERNAME ──
router.put('/admin/change-username', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newUsername } = req.body;
    if (!newUsername || newUsername.trim().length < 3)
      return res.status(400).json({ success: false, message: 'Username must be at least 3 characters' });
    const admin = await Admin.findById(req.admin.id);
    if (!(await admin.comparePassword(currentPassword)))
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    const existing = await Admin.findOne({ username: newUsername.trim() });
    if (existing && existing._id.toString() !== admin._id.toString())
      return res.status(400).json({ success: false, message: 'Username already taken' });
    admin.username = newUsername.trim();
    await admin.save();
    await logActivity('👤', `Admin username changed to: ${admin.username}`);
    res.json({ success: true, message: 'Username changed successfully. Please log in again.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── HELPERS ──
function parseBenefits(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(b => b.trim()).filter(Boolean);
  return raw.split('\n').map(b => b.trim()).filter(Boolean);
}

function buildFileDoc(multerFile) {
  const isPdf = multerFile.mimetype === 'application/pdf';
  return {
    url:          multerFile.path,       // Cloudinary secure URL
    publicId:     multerFile.filename,   // Cloudinary public_id
    resourceType: isPdf ? 'raw' : 'image',
    originalName: multerFile.originalname,
    fileType:     isPdf ? 'pdf' : 'image',
  };
}

module.exports = router;
