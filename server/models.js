// ═══════════════════════════════════════════════
// LIC ADVISOR – MONGOOSE MODELS
// Changes: Plan now has policyNo, files[] (multiple),
//          advisor photo url stored in Settings
// ═══════════════════════════════════════════════

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── ADMIN USER ──
const AdminSchema = new mongoose.Schema({
  username:  { type: String, required: true, unique: true, trim: true },
  password:  { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
AdminSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});
AdminSchema.methods.comparePassword = async function (c) {
  return bcrypt.compare(c, this.password);
};

// ── SITE SETTINGS ──
const SettingsSchema = new mongoose.Schema({
  section:   { type: String, required: true, unique: true },
  data:      { type: mongoose.Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now },
});

// ── PLAN FILE (sub-document) ──
const PlanFileSchema = new mongoose.Schema({
  url:          { type: String, required: true },   // Cloudinary URL
  publicId:     { type: String, default: '' },      // Cloudinary public_id for deletion
  resourceType: { type: String, default: 'raw' },   // 'raw' for PDF, 'image' for images
  originalName: { type: String, default: '' },      // Original filename shown to user
  fileType:     { type: String, default: 'pdf' },   // 'pdf' | 'image'
  uploadedAt:   { type: Date, default: Date.now },
}, { _id: true });

// ── PLAN CATEGORIES ──
const PLAN_CATEGORIES = [
  'endowment', 'money-back', 'single-premium',
  'term', 'child', 'whole-life', 'pension', 'ulip', 'micro',
];

// ── LIC PLAN ──
const PlanSchema = new mongoose.Schema({
  policyNo:    { type: String, trim: true, default: '' },   // e.g. "915", "836"
  name:        { type: String, required: true, trim: true },
  category:    { type: String, enum: PLAN_CATEGORIES, default: 'endowment' },
  description: { type: String, required: true },
  benefits:    [{ type: String }],
  files:       [PlanFileSchema],   // multiple files (PDFs / images) up to 20 MB each
  badge:       { type: String, default: null },
  active:      { type: Boolean, default: true },
  order:       { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now },
});
PlanSchema.pre('save', function () { this.updatedAt = new Date(); });
PlanSchema.pre('findOneAndUpdate', function () { this.set({ updatedAt: new Date() }); });

// ── TESTIMONIAL ──
const TestimonialSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  location:  { type: String, default: '' },
  plan:      { type: String, default: '' },
  rating:    { type: Number, min: 1, max: 5, default: 5 },
  review:    { type: String, required: true },
  avatar:    { type: String, default: '👤' },
  active:    { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

// ── ENQUIRY ──
const EnquirySchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  mobile:    { type: String, required: true, trim: true },
  age:       { type: String, default: '' },
  goal:      { type: String, default: '' },
  message:   { type: String, default: '' },
  status:    { type: String, enum: ['new', 'contacted', 'closed'], default: 'new' },
  createdAt: { type: Date, default: Date.now },
});

// ── ACTIVITY LOG ──
const ActivitySchema = new mongoose.Schema({
  icon:      { type: String, default: '📋' },
  text:      { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = {
  Admin:          mongoose.model('Admin',       AdminSchema),
  Settings:       mongoose.model('Settings',    SettingsSchema),
  Plan:           mongoose.model('Plan',        PlanSchema),
  Testimonial:    mongoose.model('Testimonial', TestimonialSchema),
  Enquiry:        mongoose.model('Enquiry',     EnquirySchema),
  Activity:       mongoose.model('Activity',    ActivitySchema),
  PLAN_CATEGORIES,
};
