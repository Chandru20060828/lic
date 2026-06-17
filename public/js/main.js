/* ═══════════════════════════════════════════════
   LIC ADVISOR – MAIN WEBSITE JS
   ═══════════════════════════════════════════════ */

const API = '/api';
let allPlans = [];

document.addEventListener('DOMContentLoaded', async () => {
  trackPageView();
  await loadPublicData();
  setupNavScroll();
});

async function trackPageView() {
  try { await fetch(`${API}/public/pageview`, { method: 'POST' }); } catch {}
}

async function loadPublicData() {
  try {
    const [siteRes, plansRes, testimonialsRes] = await Promise.all([
      fetch(`${API}/public/homepage`),
      fetch(`${API}/public/plans`),
      fetch(`${API}/public/testimonials`),
    ]);
    const site   = await siteRes.json();
    const plans  = await plansRes.json();
    const tests  = await testimonialsRes.json();

    if (site.success) { applyHomepageContent(site.homepage); applyContactContent(site.contact); }
    loadAdvisorPhoto();
    if (plans.success) { allPlans = plans.plans; renderPlans(allPlans); }
    if (tests.success) renderTestimonials(tests.testimonials);
  } catch (err) {
    console.error('Data load error:', err);
    const g = document.getElementById('plans-grid');
    if (g) g.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:40px;grid-column:1/-1">⚠️ Could not connect to server.</p>';
  }
}

// ── ADVISOR PHOTO ──
async function loadAdvisorPhoto() {
  try {
    const res = await fetch(`${API}/public/advisor-photo`);
    const data = await res.json();

    console.log("Advisor Photo API:", data);

    if (data.success && data.url) {
      const img = document.getElementById('advisor-real-photo');
      const ph = document.getElementById('advisor-avatar-fallback');

      if (img) {
        img.src = data.url;

        img.onload = () => {
          if (ph) ph.style.display = 'none';
          img.style.display = 'block';
        };

        img.onerror = () => {
          if (ph) ph.style.display = 'flex';
          img.style.display = 'none';
        };
      }
    }
  } catch (err) {
    console.error('Advisor photo load error:', err);
  }
}

// ── HOMEPAGE ──
function applyHomepageContent(hp) {
  if (!hp || !Object.keys(hp).length) return;
  const set = (id, v) => { if (v) { const el = document.getElementById(id); if (el) el.textContent = v; } };
  set('hero-headline', hp.headline); set('hero-subtext', hp.subtext);
  set('hero-cta1', hp.cta1);        set('hero-cta2', hp.cta2);
  set('stat1', hp.stat1);           set('stat2', hp.stat2); set('stat3', hp.stat3);
  set('about-title', hp.about_title);
  set('about-para1', hp.about_p1);  set('about-para2', hp.about_p2);
  set('footer-tagline', hp.footer_tagline); set('footer-copy', hp.footer_copy);
  const brand = hp.brand || 'LIC Advisor';
  document.querySelectorAll('#nav-brand,#footer-brand').forEach(el => { if (el) el.textContent = brand; });
  document.title = brand + ' – Secure Your Family\'s Future';
}

function applyContactContent(ct) {
  if (!ct || !Object.keys(ct).length) return;
  const set  = (id, v) => { if (v) { const el = document.getElementById(id); if (el) el.textContent = v; } };
  const setH = (id, h) => { const el = document.getElementById(id); if (el) el.href = h; };
  set('contact-title', ct.title); set('contact-subtitle', ct.subtitle);
  set('contact-phone', ct.phone); set('contact-email', ct.email);
  set('contact-location', ct.location); set('footer-phone', ct.phone);
  set('footer-email', ct.email);  set('footer-location', ct.location);
  if (ct.phone) { const p = ct.phone.replace(/\s/g,''); setH('contact-phone',`tel:${p}`); setH('footer-phone',`tel:${p}`); setH('call-btn',`tel:${p}`); }
  if (ct.email) { setH('contact-email',`mailto:${ct.email}`); setH('footer-email',`mailto:${ct.email}`); }
  if (ct.wa) { const w = `https://wa.me/${ct.wa}`; setH('whatsapp-link',w); setH('wa-btn',w); setH('float-wa',w); }
}

// ── PLANS ──
const CAT_LABELS = {
  'endowment':'Endowment', 'money-back':'Money Back', 'single-premium':'Single Premium',
  'term':'Term Plan', 'child':'Child Plan', 'whole-life':'Whole Life',
  'pension':'Pension', 'ulip':'ULIP', 'micro':'Micro Plan',
};
const CAT_CSS = {
  'endowment':'cat-endowment', 'money-back':'cat-money-back', 'single-premium':'cat-single-premium',
  'term':'cat-term', 'child':'cat-child', 'whole-life':'cat-whole-life',
  'pension':'cat-pension', 'ulip':'cat-ulip', 'micro':'cat-micro',
};

function renderPlans(plans) {
  const grid = document.getElementById('plans-grid');
  if (!grid) return;
  if (!plans || plans.length === 0) {
    grid.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:40px;grid-column:1/-1">No plans in this category yet.</p>';
    return;
  }
  grid.innerHTML = plans.map(plan => {
    const catLabel = CAT_LABELS[plan.category] || plan.category;
    const catCss   = CAT_CSS[plan.category]   || 'cat-endowment';
    const files    = plan.files || [];
    const pdfs     = files.filter(f => f.fileType === 'pdf');
    const imgs     = files.filter(f => f.fileType === 'image');

    const pdfButtons = pdfs.map(f =>
      `<a href="${escHtml(f.url)}" download="${escHtml(f.originalName || 'brochure.pdf')}" target="_blank" class="plan-brochure-btn">
         <span>📄</span> ${escHtml(f.originalName || 'Download Brochure PDF')}
       </a>`
    ).join('');

    const imgLinks = imgs.map(f =>
      `<a href="${escHtml(f.url)}" target="_blank" class="plan-img-link">🖼️ ${escHtml(f.originalName || 'View Image')}</a>`
    ).join('');

    return `
      <div class="plan-card" data-cat="${escHtml(plan.category)}">
        ${plan.badge ? `<div class="plan-badge">${escHtml(plan.badge)}</div>` : ''}
        <div class="plan-cat-tag ${catCss}">${catLabel}</div>
        ${plan.policyNo ? `<div class="plan-policy-no">Policy No: <strong>${escHtml(plan.policyNo)}</strong></div>` : ''}
        <h3>${escHtml(plan.name)}</h3>
        <p>${escHtml(plan.description)}</p>
        ${plan.benefits && plan.benefits.length ? `
          <ul class="plan-benefits">
            ${plan.benefits.slice(0,4).map(b => `<li>${escHtml(b)}</li>`).join('')}
          </ul>` : ''}
        ${pdfButtons}
        ${imgLinks ? `<div class="plan-img-links">${imgLinks}</div>` : ''}
        <a href="#contact" class="plan-enquire">📞 Enquire Now</a>
      </div>`;
  }).join('');
}

function filterPlans(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderPlans(cat === 'all' ? allPlans : allPlans.filter(p => p.category === cat));
}

// ── TESTIMONIALS ──
function renderTestimonials(testimonials) {
  const grid = document.getElementById('testimonials-grid');
  if (!grid) return;
  if (!testimonials || !testimonials.length) {
    grid.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:40px;">No testimonials yet.</p>';
    return;
  }
  grid.innerHTML = testimonials.map(t => `
    <div class="t-card">
      <div class="t-stars">${'⭐'.repeat(t.rating)}</div>
      <p class="t-review">"${escHtml(t.review)}"</p>
      <div class="t-profile">
        <div class="t-avatar">${t.avatar||'👤'}</div>
        <div><div class="t-name">${escHtml(t.name)}</div>
        <div class="t-plan">${escHtml(t.plan)} · ${escHtml(t.location)}</div></div>
      </div>
    </div>`).join('');
}

// ── ENQUIRY FORM ──
async function submitEnquiry(e) {
  e.preventDefault();
  const btn = document.getElementById('submit-btn');
  btn.disabled = true; btn.textContent = '⏳ Sending...';
  try {
    const res  = await fetch(`${API}/public/enquiry`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:    document.getElementById('f-name').value.trim(),
        mobile:  document.getElementById('f-mobile').value.trim(),
        age:     document.getElementById('f-age').value.trim(),
        goal:    document.getElementById('f-goal').value,
        message: document.getElementById('f-message').value.trim(),
      })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('enquiry-form').style.display = 'none';
      document.getElementById('form-success').style.display = 'block';
    } else {
      alert(data.message || 'Failed to submit. Please try again.');
      btn.disabled = false; btn.textContent = '📩 Send Enquiry';
    }
  } catch {
    alert('Network error. Please try again.');
    btn.disabled = false; btn.textContent = '📩 Send Enquiry';
  }
}

function resetForm() {
  document.getElementById('enquiry-form').reset();
  const btn = document.getElementById('submit-btn');
  btn.disabled = false; btn.textContent = '📩 Send Enquiry';
  document.getElementById('enquiry-form').style.display = 'block';
  document.getElementById('form-success').style.display = 'none';
}

// ── CALCULATORS ──
function showCalc(t, btn) {
  document.querySelectorAll('.calc-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.calc-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('calc-' + t).classList.add('active');
}
function formatINR(n) {
  if (n >= 10000000) return '₹' + (n/10000000).toFixed(2) + ' Cr';
  if (n >= 100000)   return '₹' + (n/100000).toFixed(2) + ' L';
  return '₹' + Math.round(n).toLocaleString('en-IN');
}
function calcLifeCover() {
  const income=parseFloat(document.getElementById('lc-income').value)||0, expense=parseFloat(document.getElementById('lc-expense').value)||0, loan=parseFloat(document.getElementById('lc-loan').value)||0, years=parseFloat(document.getElementById('lc-years').value)||0;
  const el=document.getElementById('lc-result');
  if(!income||!years){el.innerHTML=`<div class="result-placeholder"><span class="rp-icon">🛡️</span><p>Enter your details to calculate recommended life cover</p></div>`;return;}
  const rec=Math.max(income*years+loan+expense*12*3,income*10);
  el.innerHTML=`<div class="result-data"><div class="result-main"><div class="rl">Recommended Life Cover</div><div class="rv">${formatINR(rec)}</div></div><ul class="result-breakdown"><li><span>Income Replacement</span><span>${formatINR(income*years)}</span></li><li><span>Outstanding Loans</span><span>${formatINR(loan)}</span></li><li><span>Emergency Fund</span><span>${formatINR(expense*12*3)}</span></li><li><span>10x Income Rule</span><span>${formatINR(income*10)}</span></li></ul><a href="#contact" class="btn-primary result-cta">Get Free Consultation</a></div>`;
}
function calcRetirement() {
  const age=parseFloat(document.getElementById('rt-age').value)||0,ret=parseFloat(document.getElementById('rt-retage').value)||0,exp=parseFloat(document.getElementById('rt-expense').value)||0,inf=parseFloat(document.getElementById('rt-inflation').value)/100||0.06;
  const el=document.getElementById('rt-result');
  if(!age||!ret||!exp||ret<=age){el.innerHTML=`<div class="result-placeholder"><span class="rp-icon">🌅</span><p>Enter your details to calculate retirement corpus needed</p></div>`;return;}
  const ytr=ret-age,fe=exp*Math.pow(1+inf,ytr),corpus=fe*12*(80-ret),monthly=corpus/(ytr*12);
  el.innerHTML=`<div class="result-data"><div class="result-main"><div class="rl">Retirement Corpus Needed</div><div class="rv">${formatINR(corpus)}</div></div><ul class="result-breakdown"><li><span>Years to Retirement</span><span>${ytr} years</span></li><li><span>Future Monthly Expense</span><span>${formatINR(fe)}</span></li><li><span>Retirement Duration</span><span>${80-ret} years</span></li><li><span>Monthly Savings Needed</span><span>${formatINR(monthly)}</span></li></ul><a href="#contact" class="btn-primary result-cta">Plan My Retirement</a></div>`;
}
function calcChild() {
  const age=parseFloat(document.getElementById('ch-age').value)||0,eda=parseFloat(document.getElementById('ch-edage').value)||18,cost=parseFloat(document.getElementById('ch-cost').value)||0,inf=parseFloat(document.getElementById('ch-inflation').value)/100||0.08;
  const el=document.getElementById('ch-result');
  if(!cost){el.innerHTML=`<div class="result-placeholder"><span class="rp-icon">🎓</span><p>Enter your details to plan child education savings</p></div>`;return;}
  const yrs=Math.max(eda-age,1),fc=cost*Math.pow(1+inf,yrs),monthly=fc/(yrs*12);
  el.innerHTML=`<div class="result-data"><div class="result-main"><div class="rl">Future Education Cost</div><div class="rv">${formatINR(fc)}</div></div><ul class="result-breakdown"><li><span>Years to Plan</span><span>${yrs} years</span></li><li><span>Current Cost</span><span>${formatINR(cost)}</span></li><li><span>With Inflation</span><span>${formatINR(fc)}</span></li><li><span>Monthly Savings Needed</span><span>${formatINR(monthly)}</span></li><li><span>Recommended Cover (+20%)</span><span>${formatINR(fc*1.2)}</span></li></ul><a href="#contact" class="btn-primary result-cta">Secure Child's Future</a></div>`;
}

// ── NAV ──
function toggleMenu() { document.getElementById('nav-menu').classList.toggle('open'); }
function setupNavScroll() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => { nav.style.boxShadow = window.scrollY > 20 ? '0 2px 20px rgba(0,0,0,0.12)' : ''; });
  document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => document.getElementById('nav-menu').classList.remove('open')));
}

function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
