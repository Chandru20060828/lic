// ═══════════════════════════════════════════════
// LIC ADVISOR – CLOUDINARY CONFIGURATION
// ═══════════════════════════════════════════════

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary with env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── ADVISOR PHOTO STORAGE ──
const advisorPhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'lic-advisor/advisor-photo',
    // NOTE: allowed_formats removed — it conflicts with transformation on some SDK versions.
    // The multer fileFilter below already validates image types before upload.
    resource_type:  'image',
    transformation: [{ width: 600, height: 600, crop: 'fill', gravity: 'face' }],
  },
});

const uploadAdvisorPhoto = multer({
  storage: advisorPhotoStorage,
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter(req, file, cb) {
    if (/^image\/(jpeg|jpg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files (JPG, PNG, WEBP, GIF) are allowed'));
  },
});

// ── PLAN FILES STORAGE (PDFs + images, up to 20 MB each) ──
const planFilesStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const isPdf = file.mimetype === 'application/pdf';
    return {
      folder:        'lic-advisor/plan-files',
      resource_type: isPdf ? 'raw' : 'image',
      // IMPORTANT: Do NOT set allowed_formats for resource_type:'raw' — Cloudinary
      // returns 403 when it is present on raw uploads. The multer fileFilter below
      // already validates file types before they reach Cloudinary.
      public_id: `plan-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`,
    };
  },
});

const uploadPlanFiles = multer({
  storage: planFilesStorage,
  limits:  { fileSize: 20 * 1024 * 1024 }, // 20 MB per file
  fileFilter(req, file, cb) {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`File type not allowed: ${file.mimetype}. Allowed: PDF, JPG, PNG, WEBP`));
  },
});

// ── HELPER: delete a file from Cloudinary by URL or public_id ──
async function deleteCloudinaryFile(urlOrId, resourceType = 'raw') {
  if (!urlOrId) return;
  try {
    // Extract public_id from Cloudinary URL
    let publicId = urlOrId;
    if (urlOrId.startsWith('http')) {
      // e.g. https://res.cloudinary.com/cloud/raw/upload/v123/lic-advisor/plan-files/plan-123.pdf
      const match = urlOrId.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
      if (match) publicId = match[1];
    }
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
  } catch (e) {
    console.warn('Cloudinary delete warning:', e.message);
  }
}

// Detect resource type from URL
function getResourceType(url) {
  if (!url) return 'raw';
  if (/\.(jpg|jpeg|png|webp|gif)$/i.test(url)) return 'image';
  return 'raw'; // PDF and other files
}

module.exports = {
  cloudinary,
  uploadAdvisorPhoto,
  uploadPlanFiles,
  deleteCloudinaryFile,
  getResourceType,
};
