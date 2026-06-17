/* ═══════════════════════════════════════════════
   LIC ADVISOR – ADMIN JS (Cloudinary + policyNo + multi-file)
   ═══════════════════════════════════════════════ */

const API = '/api';
let token = null;
let editingPlanId = null;
let editingTestimonialId = null;
let searchDebounce = null;
let planSearchDebounce = null;
let currentEnqPage = 1;

const CAT_LABELS = {
  'endowment':'Endowment','money-back':'Money Back','single-premium':'Single Premium',
  'term':'Term Plan','child':'Child Plan','whole-life':'Whole Life',
  'pension':'Pension','ulip':'ULIP','micro':'Micro Plan',
};
const CAT_CSS = {
  'endowment':'cat-endowment','money-back':'cat-money-back','single-premium':'cat-single-premium',
  'term':'cat-term','child':'cat-child','whole-life':'cat-whole-life',
  'pension':'cat-pension','ulip':'cat-ulip','micro':'cat-micro',
};

// ══ AUTH ══
async function adminLogin() {
  const username = document.getElementById('lg-user').value.trim();
  const password = document.getElementById('lg-pass').value;
  const errEl = document.getElementById('lg-error');
  const btn   = document.getElementById('login-btn');
  if (!username || !password) { errEl.textContent = 'Enter username and password'; return; }
  btn.disabled = true; btn.textContent = '⏳ Logging in...';
  try {
    const res  = await fetch(`${API}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username,password}) });
    const data = await res.json();
    if (data.success) {
      token = data.token;
      sessionStorage.setItem('lic_token', token);
      sessionStorage.setItem('lic_user',  data.username);
      showAdminPanel(data.username);
    } else {
      errEl.textContent = '❌ ' + (data.message || 'Invalid credentials');
      btn.disabled = false; btn.textContent = '🔐 Login to Dashboard';
    }
  } catch {
    errEl.textContent = '❌ Server not reachable. Start the Node.js server first.';
    btn.disabled = false; btn.textContent = '🔐 Login to Dashboard';
  }
}

function showAdminPanel(username) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-panel').style.display  = 'flex';
  document.getElementById('admin-username').textContent = username || 'Admin';
  const su = document.getElementById('settings-user'); if (su) su.textContent = username;
  initAdmin();
}

function adminLogout() {
  sessionStorage.removeItem('lic_token');
  sessionStorage.removeItem('lic_user');
  token = null;
  location.reload();
}

function authH()  { return { 'Authorization': `Bearer ${token}` }; }
function jsonH()  { return { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` }; }

// ══ INIT ══
document.addEventListener('DOMContentLoaded', async () => {
  const saved = sessionStorage.getItem('lic_token');
  const user  = sessionStorage.getItem('lic_user');
  if (saved) {
    token = saved;
    try {
      const r = await fetch(`${API}/auth/verify`, { method:'POST', headers:jsonH() });
      const d = await r.json();
      if (d.success) { showAdminPanel(user); return; }
    } catch {}
    sessionStorage.removeItem('lic_token');
  }
  document.getElementById('login-screen').style.display = 'flex';
  ['lg-user','lg-pass'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => { if (e.key==='Enter') adminLogin(); });
  });
});

async function initAdmin() {
  await Promise.all([
    loadDashboard(), loadHomepageEditor(), loadContactEditor(),
    loadPlansTable(), loadTestimonialsAdmin(), loadEnquiries(), loadAdminAdvisorPhoto(),
  ]);
}

// ══ NAV ══
function showSection(name, btn) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sb-item').forEach(b => b.classList.remove('active'));
  document.getElementById('sec-' + name).classList.add('active');
  if (btn) btn.classList.add('active');
  const titles = { dashboard:'Dashboard', homepage:'Homepage', plans:'LIC Plans', testimonials:'Testimonials', enquiries:'Enquiries', contact:'Contact Info', stats:'Statistics', settings:'Settings' };
  document.getElementById('page-title').textContent = titles[name] || name;
  if (name==='dashboard')   loadDashboard();
  if (name==='enquiries')   loadEnquiries();
  if (name==='stats')       loadStats();
}
function getSbBtn(idx) { return document.querySelectorAll('.sb-item')[idx]; }
function toggleSidebar() {
  const sb = document.getElementById('sidebar'), main = document.querySelector('.admin-main');
  if (window.innerWidth <= 768) sb.classList.toggle('mobile-open');
  else { sb.classList.toggle('collapsed'); main.style.marginLeft = sb.classList.contains('collapsed') ? '0' : '240px'; }
}

// ══ DASHBOARD ══
async function loadDashboard() {
  try {
    const res  = await fetch(`${API}/admin/dashboard`, { headers: authH() });
    const data = await res.json();
    if (!data.success) return;
    document.getElementById('d-enquiries').textContent    = data.stats.enquiryCount;
    document.getElementById('d-plans').textContent        = data.stats.planCount;
    document.getElementById('d-testimonials').textContent = data.stats.testimonialCount;
    document.getElementById('d-views').textContent        = data.stats.pageViews;
    const list = document.getElementById('recent-enquiries-list');
    const recent = data.recentEnquiries || [];
    list.innerHTML = recent.length === 0
      ? '<p class="no-data-msg">No enquiries yet.</p>'
      : recent.map(e => `<div class="recent-item"><div class="ri-dot"></div><div class="ri-info"><strong>${esc(e.name)}</strong><small>${esc(e.goal||'General')} · ${esc(e.mobile)}</small></div><span class="ri-date">${fmt(e.createdAt)}</span></div>`).join('');
  } catch {}
}

// ══ HOMEPAGE ══
async function loadHomepageEditor() {
  try {
    const res  = await fetch(`${API}/admin/settings/homepage`, { headers: authH() });
    const data = await res.json();
    if (!data.success) return;
    const hp = data.data || {};
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v||''; };
    set('ed-headline',hp.headline); set('ed-subtext',hp.subtext);
    set('ed-cta1',hp.cta1); set('ed-cta2',hp.cta2);
    set('ed-stat1',hp.stat1); set('ed-stat2',hp.stat2); set('ed-stat3',hp.stat3);
    set('ed-about-title',hp.about_title); set('ed-about-p1',hp.about_p1); set('ed-about-p2',hp.about_p2);
    set('ed-brand',hp.brand); set('ed-footer-tagline',hp.footer_tagline); set('ed-footer-copy',hp.footer_copy);
  } catch {}
}

async function saveHomepage() {
  const g = id => document.getElementById(id)?.value.trim()||'';
  const payload = {
    headline:g('ed-headline'), subtext:g('ed-subtext'), cta1:g('ed-cta1'), cta2:g('ed-cta2'),
    stat1:g('ed-stat1'), stat2:g('ed-stat2'), stat3:g('ed-stat3'),
    about_title:g('ed-about-title'), about_p1:g('ed-about-p1'), about_p2:g('ed-about-p2'),
    brand:g('ed-brand'), footer_tagline:g('ed-footer-tagline'), footer_copy:g('ed-footer-copy'),
  };
  try {
    const res  = await fetch(`${API}/admin/settings/homepage`, { method:'PUT', headers:jsonH(), body:JSON.stringify(payload) });
    const data = await res.json();
    if (data.success) { showToast('✅ Homepage saved!'); const s=document.getElementById('hp-save-status'); if(s) s.textContent='Saved at '+new Date().toLocaleTimeString(); }
    else showToast('❌ '+data.message);
  } catch { showToast('❌ Save failed.'); }
}

// ══ ADVISOR PHOTO ══
async function loadAdminAdvisorPhoto() {
  try {
    const res  = await fetch(`${API}/public/advisor-photo`);
    const data = await res.json();
    renderAdminPhotoPreview(data.url || null);
  } catch {}
}

function renderAdminPhotoPreview(url) {
  const img = document.getElementById('advisor-preview-img');
  const icon = document.getElementById('advisor-preview-icon');

  if (!img || !icon) return;

  if (url) {
    img.src = url;
    img.style.display = 'block';
    icon.style.display = 'none';
  } else {
    img.style.display = 'none';
    icon.style.display = 'block';
  }
}

function previewAdvisorPhoto(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById('advisor-preview-img');
    const icon = document.getElementById('advisor-preview-icon');

    if (img) {
      img.src = e.target.result;
      img.style.display = 'block';
    }

    if (icon) {
      icon.style.display = 'none';
    }
  };

  reader.readAsDataURL(file);
}

async function uploadAdvisorPhoto() {
  const input  = document.getElementById('advisor-photo-input');
  const btn = document.getElementById('advisor-upload-btn');
  const status = document.getElementById('advisor-save-status');
  if (!input.files || !input.files[0]) { showToast('❌ Select a photo first'); return; }
  btn.disabled = true; btn.textContent = '⏳ Uploading to Cloudinary...';
  const fd = new FormData();
  fd.append('photo', input.files[0]);
  try {
    const res  = await fetch(`${API}/admin/upload/advisor-photo`, { method:'POST', headers:authH(), body:fd });
    const data = await res.json();
    if (data.success) {
      showToast('✅ Photo uploaded to Cloudinary!');
      if (status) status.textContent = 'Updated at ' + new Date().toLocaleTimeString();
      renderAdminPhotoPreview(data.url);
      input.value = '';
    } else showToast('❌ ' + data.message);
  } catch { showToast('❌ Upload failed.'); }
  btn.disabled = false; btn.textContent = '📤 Upload Photo';
}

async function removeAdvisorPhoto() {
  if (!confirm('Remove advisor photo and revert to placeholder?')) return;
  const btn = document.getElementById('remove-photo-btn');
  btn.disabled = true;
  try {
    const res  = await fetch(`${API}/admin/upload/advisor-photo`, { method:'DELETE', headers:authH() });
    const data = await res.json();
    if (data.success) {
      showToast('🗑️ Photo removed');
      renderAdminPhotoPreview(null);
      const input = document.getElementById('advisor-photo-input'); if (input) input.value='';
      const s = document.getElementById('photo-upload-status'); if (s) s.textContent='';
    } else showToast('❌ '+data.message);
  } catch { showToast('❌ Remove failed.'); }
  btn.disabled = false;
}

// ══ CONTACT ══
async function loadContactEditor() {
  try {
    const res  = await fetch(`${API}/admin/settings/contact`, { headers: authH() });
    const data = await res.json();
    if (!data.success) return;
    const ct = data.data || {};
    const set = (id, v) => { const el=document.getElementById(id); if(el) el.value=v||''; };
    set('cd-phone',ct.phone); set('cd-wa',ct.wa); set('cd-email',ct.email);
    set('cd-location',ct.location); set('cd-title',ct.title); set('cd-subtitle',ct.subtitle);
  } catch {}
}

async function saveContact() {
  const g = id => document.getElementById(id)?.value.trim()||'';
  const payload = { phone:g('cd-phone'), wa:g('cd-wa'), email:g('cd-email'), location:g('cd-location'), title:g('cd-title'), subtitle:g('cd-subtitle') };
  try {
    const res  = await fetch(`${API}/admin/settings/contact`, { method:'PUT', headers:jsonH(), body:JSON.stringify(payload) });
    const data = await res.json();
    if (data.success) { showToast('✅ Contact info saved!'); const s=document.getElementById('ct-save-status'); if(s) s.textContent='Saved at '+new Date().toLocaleTimeString(); }
    else showToast('❌ '+data.message);
  } catch { showToast('❌ Save failed.'); }
}

// ══ PLANS ══
function debounceSearchPlans() {
  clearTimeout(planSearchDebounce);
  planSearchDebounce = setTimeout(() => loadPlansTable(), 400);
}

async function loadPlansTable() {
  const search   = document.getElementById('plan-search')?.value   || '';
  const category = document.getElementById('plan-cat-filter')?.value || '';
  const params   = new URLSearchParams();
  if (search)   params.set('search',   search);
  if (category) params.set('category', category);
  try {
    const res   = await fetch(`${API}/admin/plans?${params}`, { headers: authH() });
    const data  = await res.json();
    if (!data.success) return;
    const tbody = document.getElementById('plans-tbody');
    const plans = data.plans || [];
    if (plans.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#9ca3af;padding:32px;">No plans found. Add your first plan!</td></tr>';
      return;
    }
    tbody.innerHTML = plans.map((p, i) => {
      const catLabel = CAT_LABELS[p.category] || p.category;
      const catCss   = CAT_CSS[p.category]    || '';
      const files    = p.files || [];
      const fileCell = files.length
        ? `<span class="file-count-badge">📁 ${files.length} file${files.length>1?'s':''}</span>`
        : '<span class="no-brochure">–</span>';
      return `<tr>
        <td>${i+1}</td>
        <td><div class="plan-name-cell"><strong>${esc(p.name)}</strong>${p.policyNo?`<span class="policy-no-badge">No: ${esc(p.policyNo)}</span>`:''}</div>${p.badge?`<span style="background:#fef3c7;color:#92400e;padding:2px 7px;border-radius:50px;font-size:11px;font-weight:700;">${esc(p.badge)}</span>`:''}</td>
        <td><span class="cat-badge ${catCss}">${catLabel}</span></td>
        <td class="td-desc">${esc(p.description)}</td>
        <td>${fileCell}</td>
        <td>${p.order||0}</td>
        <td><span class="status-badge ${p.active?'status-contacted':'status-closed'}">${p.active?'Active':'Hidden'}</span></td>
        <td><div class="td-actions">
          <button class="edit-btn" onclick="editPlan('${p._id}')">✏️ Edit</button>
          <button class="delete-btn" onclick="deletePlan('${p._id}')">🗑️</button>
        </div></td>
      </tr>`;
    }).join('');
  } catch (err) { console.error('Plans load error:', err); }
}

function openPlanModal() {
  editingPlanId = null;
  document.getElementById('plan-modal-title').textContent = 'Add LIC Plan';
  ['pm-name','pm-policyno','pm-desc','pm-benefits','pm-badge','pm-order'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('pm-cat').value    = 'endowment';
  document.getElementById('pm-active').value = 'true';
  const fi = document.getElementById('pm-files'); if (fi) fi.value = '';
  document.getElementById('pm-existing-files').innerHTML = '';
  document.getElementById('plan-modal').classList.add('open');
}

async function editPlan(id) {
  try {
    // Fetch individual plan by ID to avoid stale-data / all-plans-update bug
    const res  = await fetch(`${API}/plans/${id}`, { headers: authH() });
    const data = await res.json();
    const plan = data.plan;
    if (!plan) return;
    editingPlanId = id;
    document.getElementById('plan-modal-title').textContent = 'Edit LIC Plan';
    document.getElementById('pm-name').value     = plan.name        || '';
    document.getElementById('pm-policyno').value = plan.policyNo    || '';
    document.getElementById('pm-cat').value      = plan.category    || 'endowment';
    document.getElementById('pm-desc').value     = plan.description || '';
    document.getElementById('pm-benefits').value = (plan.benefits||[]).join('\n');
    document.getElementById('pm-badge').value    = plan.badge       || '';
    document.getElementById('pm-order').value    = plan.order       || 0;
    document.getElementById('pm-active').value   = String(plan.active !== false);
    const fi = document.getElementById('pm-files'); if (fi) fi.value = '';

    // Show existing files list
    renderExistingFiles(plan.files || [], id);
    document.getElementById('plan-modal').classList.add('open');
  } catch (err) { console.error('Edit plan error:', err); }
}

function renderExistingFiles(files, planId) {
  const container = document.getElementById('pm-existing-files');
  if (!files.length) { container.innerHTML = ''; return; }
  container.innerHTML = `
    <div class="existing-files-label">📁 Current files (${files.length}) — check to remove:</div>
    <div class="existing-files-list">
      ${files.map(f => `
        <div class="existing-file-item">
          <label class="ef-label">
            <input type="checkbox" class="ef-remove-cb" value="${esc(f._id)}" data-plan="${planId}"/>
            <span class="ef-icon">${f.fileType==='pdf'?'📄':'🖼️'}</span>
            <a href="${esc(f.url)}" target="_blank" class="ef-name">${esc(f.originalName||'file')}</a>
          </label>
        </div>`).join('')}
    </div>
    <small class="field-hint">Checked files will be permanently deleted from Cloudinary when you save.</small>`;
}

function closePlanModal() { document.getElementById('plan-modal').classList.remove('open'); editingPlanId = null; }

async function savePlan() {
  const name = document.getElementById('pm-name').value.trim();
  const desc = document.getElementById('pm-desc').value.trim();
  if (!name || !desc) { showToast('❌ Plan name and description are required'); return; }

  const raw      = document.getElementById('pm-benefits').value.trim();
  const benefits = raw ? raw.split('\n').map(b=>b.trim()).filter(Boolean) : [];

  const fd = new FormData();
  fd.append('name',        name);
  fd.append('policyNo',    document.getElementById('pm-policyno').value.trim());
  fd.append('category',    document.getElementById('pm-cat').value);
  fd.append('description', desc);
  fd.append('badge',       document.getElementById('pm-badge').value.trim());
  fd.append('order',       document.getElementById('pm-order').value || 0);
  fd.append('active',      document.getElementById('pm-active').value);
  benefits.forEach(b => fd.append('benefits', b));

  // New files
  const filesInput = document.getElementById('pm-files');
  if (filesInput && filesInput.files.length > 0) {
    if (filesInput.files.length > 10) { showToast('❌ Maximum 10 files per upload batch'); return; }
    Array.from(filesInput.files).forEach(f => {
      if (f.size > 20 * 1024 * 1024) { showToast(`❌ File "${f.name}" exceeds 20 MB limit`); return; }
      fd.append('planFiles', f);
    });
  }

  // Files to remove (checked checkboxes)
  document.querySelectorAll('.ef-remove-cb:checked').forEach(cb => {
    fd.append('removeFileIds', cb.value);
  });

  const btn = document.getElementById('save-plan-btn');
  btn.disabled = true; btn.textContent = '⏳ Saving to Cloudinary...';

  try {
    const url    = editingPlanId ? `${API}/admin/plans/${editingPlanId}` : `${API}/admin/plans`;
    const method = editingPlanId ? 'PUT' : 'POST';
    const res    = await fetch(url, { method, headers: authH(), body: fd });
    const data   = await res.json();
    if (data.success) {
      await loadPlansTable();
      closePlanModal();
      showToast(editingPlanId ? '✅ Plan updated in MongoDB + Cloudinary!' : '✅ Plan added to MongoDB + Cloudinary!');
    } else showToast('❌ ' + data.message);
  } catch (e) { showToast('❌ Save failed: ' + e.message); }
  btn.disabled = false; btn.textContent = '💾 Save Plan';
}

async function deletePlan(id) {
  if (!confirm('Delete this plan? All associated files will be permanently removed from Cloudinary.')) return;
  try {
    const res  = await fetch(`${API}/admin/plans/${id}`, { method:'DELETE', headers:authH() });
    const data = await res.json();
    if (data.success) { await loadPlansTable(); showToast('🗑️ Plan and all files deleted from Cloudinary'); }
    else showToast('❌ '+data.message);
  } catch { showToast('❌ Delete failed.'); }
}

// ══ TESTIMONIALS ══
async function loadTestimonialsAdmin() {
  try {
    const res  = await fetch(`${API}/admin/testimonials`, { headers: authH() });
    const data = await res.json();
    const grid = document.getElementById('testimonials-admin-grid');
    const list = data.testimonials || [];
    if (!list.length) { grid.innerHTML = '<p style="color:#9ca3af;padding:20px;">No testimonials yet.</p>'; return; }
    grid.innerHTML = list.map(t => `
      <div class="ta-card">
        <div class="ta-header">
          <div class="ta-avatar">${t.avatar||'👤'}</div>
          <div><div class="ta-name">${esc(t.name)}</div><div class="ta-plan">${esc(t.plan)} · ${esc(t.location)}</div></div>
        </div>
        <div style="margin-bottom:8px">${'⭐'.repeat(t.rating)}</div>
        <p class="ta-review">"${esc(t.review)}"</p>
        <div class="ta-footer"><div class="ta-actions">
          <button class="edit-btn" onclick="editTestimonial('${t._id}')">✏️ Edit</button>
          <button class="delete-btn" onclick="deleteTestimonial('${t._id}')">🗑️</button>
        </div></div>
      </div>`).join('');
  } catch {}
}

function openTestimonialModal() {
  editingTestimonialId = null;
  document.getElementById('tm-modal-title').textContent = 'Add Testimonial';
  ['tm-name','tm-location','tm-plan','tm-review'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('tm-rating').value = '5';
  document.getElementById('tm-avatar').value = '👤';
  document.getElementById('testimonial-modal').classList.add('open');
}

async function editTestimonial(id) {
  try {
    const res  = await fetch(`${API}/admin/testimonials`, { headers: authH() });
    const data = await res.json();
    const t    = (data.testimonials||[]).find(x => x._id===id);
    if (!t) return;
    editingTestimonialId = id;
    document.getElementById('tm-modal-title').textContent = 'Edit Testimonial';
    document.getElementById('tm-name').value     = t.name||'';
    document.getElementById('tm-location').value = t.location||'';
    document.getElementById('tm-plan').value     = t.plan||'';
    document.getElementById('tm-rating').value   = String(t.rating||5);
    document.getElementById('tm-review').value   = t.review||'';
    document.getElementById('tm-avatar').value   = t.avatar||'👤';
    document.getElementById('testimonial-modal').classList.add('open');
  } catch {}
}

function closeTestimonialModal() { document.getElementById('testimonial-modal').classList.remove('open'); editingTestimonialId=null; }

async function saveTestimonial() {
  const name=document.getElementById('tm-name').value.trim(), review=document.getElementById('tm-review').value.trim();
  if (!name||!review) { showToast('❌ Name and review required'); return; }
  const payload = { name, review, location:document.getElementById('tm-location').value.trim(), plan:document.getElementById('tm-plan').value.trim(), rating:parseInt(document.getElementById('tm-rating').value), avatar:document.getElementById('tm-avatar').value.trim()||'👤' };
  const btn = document.getElementById('save-tm-btn');
  btn.disabled=true; btn.textContent='⏳ Saving...';
  try {
    const url  = editingTestimonialId ? `${API}/admin/testimonials/${editingTestimonialId}` : `${API}/admin/testimonials`;
    const res  = await fetch(url, { method:editingTestimonialId?'PUT':'POST', headers:jsonH(), body:JSON.stringify(payload) });
    const data = await res.json();
    if (data.success) { await loadTestimonialsAdmin(); closeTestimonialModal(); showToast(editingTestimonialId?'✅ Updated!':'✅ Added!'); }
    else showToast('❌ '+data.message);
  } catch { showToast('❌ Save failed.'); }
  btn.disabled=false; btn.textContent='💾 Save';
}

async function deleteTestimonial(id) {
  if (!confirm('Delete this testimonial?')) return;
  try {
    await fetch(`${API}/admin/testimonials/${id}`, { method:'DELETE', headers:authH() });
    await loadTestimonialsAdmin(); showToast('🗑️ Deleted');
  } catch {}
}

// ══ ENQUIRIES ══
function debounceSearch() { clearTimeout(searchDebounce); searchDebounce=setTimeout(()=>{currentEnqPage=1;loadEnquiries();},400); }

async function loadEnquiries() {
  const search = document.getElementById('enq-search')?.value||'';
  const status = document.getElementById('enq-status')?.value||'';
  const params = new URLSearchParams({ page:currentEnqPage, limit:20 });
  if (search) params.set('search',search);
  if (status) params.set('status',status);
  try {
    const res  = await fetch(`${API}/admin/enquiries?${params}`, { headers:authH() });
    const data = await res.json();
    if (!data.success) return;
    const tbody = document.getElementById('enquiries-tbody');
    const list  = data.enquiries||[];
    tbody.innerHTML = !list.length
      ? '<tr><td colspan="9" style="text-align:center;color:#9ca3af;padding:32px;">No enquiries found.</td></tr>'
      : list.map((e,i)=>`<tr>
          <td>${(currentEnqPage-1)*20+i+1}</td>
          <td><strong>${esc(e.name)}</strong></td>
          <td><a href="tel:${esc(e.mobile)}" style="color:#1a56db">${esc(e.mobile)}</a></td>
          <td>${e.age||'–'}</td>
          <td>${esc(e.goal||'–')}</td>
          <td class="td-desc">${esc(e.message||'–')}</td>
          <td><select class="status-select" onchange="updateEnqStatus('${e._id}',this.value)">
            <option value="new" ${e.status==='new'?'selected':''}>🔵 New</option>
            <option value="contacted" ${e.status==='contacted'?'selected':''}>🟢 Contacted</option>
            <option value="closed" ${e.status==='closed'?'selected':''}>⚫ Closed</option>
          </select></td>
          <td><small>${fmt(e.createdAt)}</small></td>
          <td><div class="td-actions">
            <a href="https://wa.me/${e.mobile.replace(/\D/g,'')}?text=Hi ${encodeURIComponent(e.name)}, I received your enquiry. Let me assist you!" target="_blank" class="edit-btn">💬 WA</a>
            <button class="delete-btn" onclick="deleteEnquiry('${e._id}')">🗑️</button>
          </div></td>
        </tr>`).join('');
    const total = Math.ceil(data.total/20);
    const pg = document.getElementById('enq-pagination');
    if (pg) pg.innerHTML = total>1 ? Array.from({length:total},(_,i)=>`<button class="page-btn ${i+1===currentEnqPage?'active':''}" onclick="goPage(${i+1})">${i+1}</button>`).join('') : '';
  } catch {}
}

function goPage(n) { currentEnqPage=n; loadEnquiries(); }

async function updateEnqStatus(id,status) {
  try { await fetch(`${API}/admin/enquiries/${id}/status`,{method:'PUT',headers:jsonH(),body:JSON.stringify({status})}); showToast(`✅ Status → "${status}"`); }
  catch {}
}

async function deleteEnquiry(id) {
  if (!confirm('Delete this enquiry?')) return;
  try { await fetch(`${API}/admin/enquiries/${id}`,{method:'DELETE',headers:authH()}); loadEnquiries(); loadDashboard(); showToast('🗑️ Deleted'); }
  catch {}
}

async function clearEnquiries() {
  if (!confirm('Delete ALL enquiries? Cannot be undone!')) return;
  try { await fetch(`${API}/admin/enquiries`,{method:'DELETE',headers:authH()}); loadEnquiries(); loadDashboard(); showToast('🗑️ All cleared'); }
  catch {}
}

async function exportEnquiries() {
  try {
    const res  = await fetch(`${API}/admin/enquiries?limit=10000`,{headers:authH()});
    const data = await res.json();
    const list = data.enquiries||[];
    if (!list.length) { showToast('No enquiries to export'); return; }
    const hdrs = ['Name','Mobile','Age','Goal','Message','Status','Date'];
    const rows = list.map(e=>[e.name,e.mobile,e.age||'',e.goal||'',(e.message||'').replace(/,/g,' '),e.status||'',fmt(e.createdAt)]);
    const csv  = [hdrs,...rows].map(r=>r.join(',')).join('\n');
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    a.download = 'enquiries.csv'; a.click();
    showToast('📥 Exported enquiries.csv');
  } catch {}
}

// ══ STATISTICS ══
async function loadStats() {
  try {
    const [er, ar] = await Promise.all([
      fetch(`${API}/admin/enquiries?limit=10000`,{headers:authH()}),
      fetch(`${API}/admin/activity`,{headers:authH()}),
    ]);
    const ed=await er.json(), ad=await ar.json();
    const goals={};
    (ed.enquiries||[]).forEach(e=>{const g=e.goal||'General';goals[g]=(goals[g]||0)+1;});
    const max=Math.max(...Object.values(goals),1);
    const chart=document.getElementById('goal-chart');
    if (chart) chart.innerHTML=Object.keys(goals).length===0?'<p style="color:#9ca3af;font-size:14px">No data yet</p>':Object.entries(goals).sort((a,b)=>b[1]-a[1]).map(([g,c])=>`<div class="bar-item"><label>${esc(g)} <strong>(${c})</strong></label><div class="bar-track"><div class="bar-fill" style="width:${(c/max)*100}%"></div></div></div>`).join('');
    const log=document.getElementById('activity-log');
    const acts=ad.logs||[];
    if (log) log.innerHTML=acts.length===0?'<p style="color:#9ca3af;font-size:14px">No activity yet</p>':acts.map(a=>`<div class="al-item"><span class="al-icon">${a.icon}</span><span class="al-text">${esc(a.text)}</span><span class="al-time">${fmt(a.createdAt)}</span></div>`).join('');
  } catch {}
}

// ══ CHANGE PASSWORD ══
async function changeUsername() {
  const newUsername = document.getElementById('cu-username').value.trim();
  const currentPassword = document.getElementById('cu-password').value;
  const msg = document.getElementById('cu-msg');
  if (!newUsername || !currentPassword) { msg.innerHTML='<span style="color:red">All fields required</span>'; return; }
  if (newUsername.length < 3) { msg.innerHTML='<span style="color:red">Username must be at least 3 characters</span>'; return; }
  try {
    const res = await fetch(`${API}/admin/change-username`, { method:'PUT', headers:jsonH(), body:JSON.stringify({ currentPassword, newUsername }) });
    const data = await res.json();
    if (data.success) {
      msg.innerHTML='<span style="color:green">✅ Username updated! Logging out...</span>';
      setTimeout(() => adminLogout(), 1500);
    } else {
      msg.innerHTML=`<span style="color:red">❌ ${data.message}</span>`;
    }
  } catch { msg.innerHTML='<span style="color:red">❌ Request failed</span>'; }
}

async function changePassword() {
  const cur=document.getElementById('cp-current').value,nw=document.getElementById('cp-new').value,con=document.getElementById('cp-confirm').value;
  const msg=document.getElementById('cp-msg');
  if (!cur||!nw||!con){msg.innerHTML='<span style="color:red">All fields required</span>';return;}
  if (nw!==con){msg.innerHTML='<span style="color:red">Passwords do not match</span>';return;}
  if (nw.length<6){msg.innerHTML='<span style="color:red">Min 6 characters</span>';return;}
  try {
    const res=await fetch(`${API}/admin/change-password`,{method:'PUT',headers:jsonH(),body:JSON.stringify({currentPassword:cur,newPassword:nw})});
    const d=await res.json();
    if (d.success){msg.innerHTML='<span style="color:green">✅ Password changed!</span>';['cp-current','cp-new','cp-confirm'].forEach(id=>{document.getElementById(id).value='';})}
    else msg.innerHTML=`<span style="color:red">❌ ${d.message}</span>`;
  } catch{msg.innerHTML='<span style="color:red">❌ Error</span>';}
}

// ══ UTILS ══
function showToast(msg) {
  const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3500);
}
function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function fmt(iso) {
  if (!iso) return '–';
  try { return new Date(iso).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}); }
  catch { return iso; }
}

// ── Show selected files preview in modal ──
function showSelectedFiles(input) {
  const preview = document.getElementById('pm-selected-files-preview');
  if (!preview) return;
  const files = Array.from(input.files);
  if (!files.length) { preview.innerHTML = ''; return; }

  let html = '';
  let hasError = false;
  files.forEach(f => {
    const isOk = f.size <= 20 * 1024 * 1024;
    if (!isOk) hasError = true;
    const size  = (f.size / (1024 * 1024)).toFixed(1);
    const icon  = f.type === 'application/pdf' ? '📄' : '🖼️';
    const color = isOk ? '' : 'background:#fee2e2;color:#991b1b;';
    html += `<div class="sf-chip" style="${color}" title="${esc(f.name)}">
      <span>${icon}</span><span>${esc(f.name.length > 28 ? f.name.slice(0,28)+'…' : f.name)}</span>
      <span style="opacity:.6;flex-shrink:0">(${size}MB)</span>
    </div>`;
  });

  if (hasError) html += '<p style="color:#991b1b;font-size:12px;margin-top:6px;">⚠️ Some files exceed 20 MB limit and will be rejected.</p>';
  preview.innerHTML = html;
}
