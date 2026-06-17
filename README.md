# 🛡️ LIC Advisor – Full-Stack Website (MongoDB + Cloudinary)

## 📁 Project Structure

```
lic-advisor/
├── server.js              ← Express entry point
├── .env                   ← Config (fill in your credentials)
├── package.json
├── server/
│   ├── cloudinary.js      ← Cloudinary SDK config + multer storage
│   ├── models.js          ← Mongoose schemas
│   ├── routes.js          ← All REST API endpoints
│   └── seed.js            ← Auto-seeds default data on first run
└── public/
    ├── index.html         ← User website
    ├── admin.html         ← Admin panel
    ├── css/
    │   ├── styles.css
    │   └── admin.css
    └── js/
        ├── main.js        ← Website JS
        └── admin.js       ← Admin JS
```

---

## 🚀 SETUP IN 5 STEPS

### Step 1 — Install Node.js
https://nodejs.org (v18+)

### Step 2 — Set up MongoDB
**Local:** `mongod --dbpath /data/db`
**Atlas (free):** https://cloud.mongodb.com → Create cluster → Get connection string

### Step 3 — Set up Cloudinary (Free Tier = 25 GB)
1. Sign up at https://cloudinary.com
2. Go to Dashboard → copy **Cloud Name**, **API Key**, **API Secret**

### Step 4 — Fill in .env
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/lic_advisor

JWT_SECRET=replace_with_a_long_random_string

ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourSecurePasswordHere

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_api_secret
```

### Step 5 — Install & Run
```bash
npm install
npm start
```

Open:
- **Website:** http://localhost:3000
- **Admin:**   http://localhost:3000/admin

---

## 🔐 Admin Login
Credentials are set in `.env` → `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
**No default credentials are shown anywhere in the UI for security.**

---

## ☁️ Cloudinary Storage

All files are stored in Cloudinary (not locally), so the website works correctly after deployment to any platform.

| File Type        | Cloudinary Folder              | Max Size |
|------------------|-------------------------------|----------|
| Advisor Photo    | `lic-advisor/advisor-photo`   | 5 MB     |
| Plan PDFs        | `lic-advisor/plan-files`      | 20 MB    |
| Plan Images      | `lic-advisor/plan-files`      | 20 MB    |

---

## 📋 Plan Features

Each LIC Plan has:
- **Policy Number** (e.g. 915, 836, 854)
- **Name, Category, Description, Benefits**
- **Multiple Files** — up to 10 per upload batch, each up to 20 MB
  - PDFs → shown as "📄 Download Brochure" buttons on plan cards
  - Images → shown as "🖼️ View Image" links
- **Badge** (Most Popular, New, Recommended, etc.)
- **Display Order** and **Active/Hidden** status

### Plan Categories
1. Endowment Plans
2. Money Back Plans
3. Single Premium Plans
4. Term Plans
5. Child Plans
6. Whole Life Plans
7. Pension Plans
8. ULIP Plans
9. Micro Plans

---

## 📡 API Endpoints

### Public
| Method | Endpoint                       | Description              |
|--------|-------------------------------|--------------------------|
| GET    | /api/public/homepage           | Homepage & contact data  |
| GET    | /api/public/advisor-photo      | Advisor photo URL        |
| GET    | /api/public/plans              | Active plans             |
| GET    | /api/plans                     | Active plans (alias)     |
| GET    | /api/plans/:id                 | Single plan              |
| GET    | /api/plans/category/:category  | Plans by category        |
| GET    | /api/public/testimonials       | Testimonials             |
| POST   | /api/public/enquiry            | Submit enquiry           |

### Admin (Bearer JWT required)
| Method | Endpoint                            | Description                |
|--------|-------------------------------------|----------------------------|
| POST   | /api/auth/login                     | Login → JWT token          |
| GET    | /api/admin/dashboard                | Stats + recent enquiries   |
| GET/PUT| /api/admin/settings/:section        | Homepage / contact editor  |
| POST   | /api/admin/upload/advisor-photo     | Upload photo → Cloudinary  |
| DELETE | /api/admin/upload/advisor-photo     | Remove advisor photo       |
| GET    | /api/admin/plans                    | All plans (search/filter)  |
| POST   | /api/admin/plans                    | Create plan + files        |
| PUT    | /api/admin/plans/:id                | Update plan + files        |
| DELETE | /api/admin/plans/:id                | Delete plan + Cloudinary   |
| DELETE | /api/admin/plans/:id/files/:fileId  | Delete single file         |
| GET    | /api/admin/enquiries                | Paginated enquiries        |
| GET    | /api/admin/testimonials             | All testimonials           |
| POST   | /api/admin/testimonials             | Add testimonial            |
| PUT    | /api/admin/testimonials/:id         | Update testimonial         |
| DELETE | /api/admin/testimonials/:id         | Delete testimonial         |
| GET    | /api/admin/activity                 | Activity log               |
| PUT    | /api/admin/change-password          | Change password            |

---

## 🌍 Deploying to Production

### Render.com (Free)
1. Push to GitHub
2. New Web Service → connect repo
3. Add all `.env` variables in Environment settings
4. Build: `npm install` | Start: `npm start`

### Railway / Heroku
Same — add environment variables in dashboard, push to deploy.

### VPS (DigitalOcean / AWS)
```bash
npm install
npm install -g pm2
pm2 start server.js --name lic-advisor
pm2 startup && pm2 save
```
Use Nginx reverse proxy on port 80/443.

---

*Node.js · Express · MongoDB Atlas · Mongoose · Cloudinary · JWT*
"# lic" 
