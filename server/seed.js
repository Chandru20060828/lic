// ═══════════════════════════════════════════════
// LIC ADVISOR – DATABASE SEED
// ═══════════════════════════════════════════════
const { Admin, Settings, Plan, Testimonial } = require('./models');

const DEFAULT_HOMEPAGE = {
  headline:       "Secure Your Family's Future with Trusted LIC Financial Protection",
  subtext:        "Plan savings, retirement, and child future with expert LIC guidance tailored for your goals.",
  cta1: "Get Free Consultation", cta2: "Check Financial Coverage",
  stat1: "500+", stat2: "15+", stat3: "₹50Cr+",
  about_title: "Your Trusted LIC Financial Guide",
  about_p1: "With over 15 years of experience as a certified LIC agent, I have helped hundreds of families across the region secure their financial futures. My approach combines deep product knowledge with a genuine understanding of each family's unique goals.",
  about_p2: "I believe insurance is not just a policy — it's a promise. A promise to your family that no matter what happens, their dreams will be protected. I guide you through every LIC plan with complete transparency and personalized advice.",
  brand: "LIC Advisor",
  footer_tagline: "Your trusted partner for securing every milestone of life with the right LIC plan.",
  footer_copy: "© 2025 LIC Advisor. All Rights Reserved. | IRDAI Registered Agent",
};

const DEFAULT_CONTACT = {
  phone: "+91 99999 99999", wa: "919999999999",
  email: "agent@licadvisor.com", location: "Mumbai, Maharashtra",
  title: "Get Personalized LIC Guidance",
  subtitle: "Fill in your details and we will contact you with a FREE personalized plan recommendation.",
};

const DEFAULT_PLANS = [
  { policyNo:"915", name:"LIC Jeevan Anand", category:"endowment", badge:"Most Popular", description:"A participating non-linked endowment plan providing financial protection against death throughout the term and survival benefits at maturity.", benefits:["Death + Maturity benefit both","Bonus additions every year","Loan facility available","Tax benefits under 80C & 10(10D)","Whole life cover after maturity"], order:1 },
  { policyNo:"836", name:"LIC Jeevan Labh", category:"endowment", badge:"Best Returns", description:"Limited premium endowment plan offering financial protection with attractive returns. Pay for a shorter term, get covered for the full term.", benefits:["Limited premium payment","High sum assured at low cost","Bonus + Final additional bonus","Tax-free maturity proceeds"], order:2 },
  { policyNo:"815", name:"LIC New Jeevan Anand", category:"endowment", badge:null, description:"Classic endowment plan combining savings and insurance with guaranteed returns and life coverage for the entire policy term.", benefits:["Guaranteed maturity benefit","Annual bonus additions","Surrender value after 3 years","Death benefit to nominee"], order:3 },
  { policyNo:"820", name:"LIC New Money Back Plan – 20 Years", category:"money-back", badge:null, description:"Money-back plan providing periodic survival benefits during the policy term for short to medium financial goals.", benefits:["20% payout at 5, 10, 15 years","40% + bonuses at maturity","Risk cover throughout term","Tax benefits under 80C"], order:4 },
  { policyNo:"821", name:"LIC New Money Back Plan – 25 Years", category:"money-back", badge:"Popular", description:"25-year money-back plan with regular cash payouts at fixed intervals for medium-term financial goals.", benefits:["15% payout at 5,10,15,20 years","40% + bonuses at maturity","Loan facility available","Death benefit to nominee"], order:5 },
  { policyNo:"848", name:"LIC Bima Shree", category:"money-back", badge:"Premium", description:"Non-linked, participating individual savings cum protection plan with guaranteed additions and survival benefits.", benefits:["Guaranteed additions from Year 1","Survival benefits at intervals","High life cover","Suitable for HNI clients"], order:6 },
  { policyNo:"817", name:"LIC Single Premium Endowment", category:"single-premium", badge:null, description:"Pay once, stay covered for the entire policy term. Ideal for those with a lump sum to invest with guaranteed returns.", benefits:["One-time premium payment","Guaranteed maturity benefit","Loan available from Day 1","Tax benefit under Section 80C"], order:7 },
  { policyNo:"854", name:"LIC Tech Term", category:"term", badge:"Best Value", description:"Pure online term plan providing high life cover at the lowest premium. Ideal for comprehensive family income protection.", benefits:["High cover at low premium","Online purchase, easy claim","Return of premium option","Critical illness rider available"], order:8 },
  { policyNo:"855", name:"LIC Jeevan Amar", category:"term", badge:null, description:"Pure risk term assurance plan with flexible premium and sum assured options. Maximum protection at minimum cost.", benefits:["Flexible premium payment term","Increasing/level sum assured","Accidental death rider","Large sum assured discount"], order:9 },
  { policyNo:"834", name:"LIC Jeevan Tarun", category:"child", badge:"Recommended", description:"Children's money-back plan offering survival benefits at key educational milestones to fund your child's dreams.", benefits:["Payouts at ages 20, 22, 24, 26","Life cover throughout term","Customizable survival %","Premium waiver on parent's death"], order:10 },
  { policyNo:"832", name:"LIC New Children's Money Back Plan", category:"child", badge:null, description:"Comprehensive children's savings plan with money-back benefits at critical ages for education and life milestones.", benefits:["20% payout at age 18, 20, 22","40% at maturity (age 25)","Life cover for child","Premium waiver rider included"], order:11 },
  { policyNo:"945", name:"LIC Jeevan Umang", category:"whole-life", badge:null, description:"Whole life plan with guaranteed annual survival benefits from the end of premium-paying term, coverage up to age 100.", benefits:["Guaranteed yearly income","Death cover for whole life","Maturity benefit at age 100","Bonus + accrued additions on death"], order:12 },
  { policyNo:"971", name:"LIC Jeevan Utsav", category:"whole-life", badge:"New", description:"Non-linked, participating individual whole life savings plan offering guaranteed income benefits from a chosen year.", benefits:["Guaranteed income after premium term","Whole life coverage","Flexible income start age","High bonus potential"], order:13 },
  { policyNo:"812", name:"LIC New Jeevan Nidhi", category:"pension", badge:null, description:"Pension plan to build a retirement corpus with annuity payout options after vesting for a secure retirement income.", benefits:["Builds retirement corpus","Regular pension after vesting","Death benefit to nominee","Tax benefits u/s 80CCC"], order:14 },
  { policyNo:"862", name:"LIC Saral Pension", category:"pension", badge:"Recommended", description:"Immediate annuity single-premium pension plan. Pay once and receive guaranteed monthly pension for life.", benefits:["Single premium, lifetime pension","Return of purchase price on death","Joint life option available","Simple and transparent structure"], order:15 },
  { policyNo:"852", name:"LIC SIIP", category:"ulip", badge:"Market Linked", description:"Unit-linked insurance plan combining market-linked investment returns with life cover for long-term wealth creation.", benefits:["Market-linked returns","4 fund options (equity to debt)","Partial withdrawal after 5 years","Tax-free maturity benefits"], order:16 },
  { policyNo:"849", name:"LIC Nivesh Plus", category:"ulip", badge:null, description:"Single premium ULIP offering investment flexibility and life protection with choice of fund allocation.", benefits:["Single premium ULIP","Choice of 4 investment funds","Loyalty additions from year 6","Death / maturity benefit"], order:17 },
  { policyNo:"951", name:"LIC Micro Bachat", category:"micro", badge:null, description:"Affordable micro insurance savings plan for low-income groups providing life cover and savings benefits.", benefits:["Low premium entry","Life cover + savings","Maturity benefit at end of term","Simple claim process"], order:18 },
  { policyNo:"843", name:"LIC New Jeevan Mangal", category:"micro", badge:null, description:"Micro insurance endowment plan designed for rural and low-income populations with accident benefit rider.", benefits:["Affordable micro insurance","Accident death benefit rider","Suitable for low-income families","Easy documentation"], order:19 },
];

const DEFAULT_TESTIMONIALS = [
  { name:"Ramesh Kumar", location:"Mumbai", plan:"LIC Jeevan Anand (915)", rating:5, review:"Excellent guidance from start to finish. The agent understood my family's needs perfectly and helped me choose the right plan. Highly recommended!", avatar:"👨" },
  { name:"Sunita Sharma", location:"Pune", plan:"LIC Jeevan Tarun (834)", rating:5, review:"I secured my daughter's education with LIC Jeevan Tarun on this advisor's recommendation. The entire process was smooth and transparent.", avatar:"👩" },
  { name:"Mohan Reddy", location:"Hyderabad", plan:"LIC Saral Pension (862)", rating:5, review:"After retirement planning sessions, I feel financially confident for my future. The pension plan is perfect for my needs. Outstanding service!", avatar:"👴" },
  { name:"Priya Mehta", location:"Chennai", plan:"LIC Tech Term (854)", rating:4, review:"Got the highest cover at an affordable premium. The advisor explained every detail of the term plan clearly. My family is now secured.", avatar:"👩‍💼" },
  { name:"Arun Joshi", location:"Delhi", plan:"LIC Jeevan Umang (945)", rating:5, review:"The guaranteed annual income feature of Jeevan Umang is brilliant. I get income every year PLUS the whole life cover. Best of both worlds!", avatar:"👨‍💼" },
  { name:"Kavita Nair", location:"Bangalore", plan:"LIC SIIP (852)", rating:4, review:"I wanted market-linked returns with insurance. The agent guided me to LIC SIIP. My portfolio has grown well. Very professional service.", avatar:"👩‍🦱" },
];

async function seedDatabase() {
  try {
    // Admin — only seed if none exists; credentials come from .env
    const adminExists = await Admin.findOne({});
    if (!adminExists) {
      const username = process.env.ADMIN_USERNAME;
      const password = process.env.ADMIN_PASSWORD;
      if (!username || !password) {
        console.warn('  ⚠️  ADMIN_USERNAME or ADMIN_PASSWORD not set in .env — skipping admin seed');
      } else {
        await Admin.create({ username, password });
        console.log(`  ✅ Admin created: ${username}`);
      }
    } else {
      console.log('  ℹ️  Admin already exists');
    }

    // Settings
    if (!(await Settings.findOne({ section: 'homepage' })))
      { await Settings.create({ section: 'homepage', data: DEFAULT_HOMEPAGE }); console.log('  ✅ Homepage settings seeded'); }
    if (!(await Settings.findOne({ section: 'contact' })))
      { await Settings.create({ section: 'contact', data: DEFAULT_CONTACT }); console.log('  ✅ Contact settings seeded'); }
    if (!(await Settings.findOne({ section: 'advisor_photo' })))
      { await Settings.create({ section: 'advisor_photo', data: { url: null, publicId: null } }); console.log('  ✅ Advisor photo settings seeded'); }

    // Plans
    const planCount = await Plan.countDocuments();
    if (planCount === 0) {
      await Plan.insertMany(DEFAULT_PLANS);
      console.log(`  ✅ ${DEFAULT_PLANS.length} plans seeded`);
    } else {
      // Migrate old-format plans that lack policyNo field
      const oldPlans = await Plan.countDocuments({ policyNo: { $exists: false } });
      if (oldPlans > 0) {
        await Plan.deleteMany({});
        await Plan.insertMany(DEFAULT_PLANS);
        console.log(`  ✅ Migrated ${DEFAULT_PLANS.length} plans with policyNo`);
      } else {
        console.log(`  ℹ️  Plans already seeded (${planCount})`);
      }
    }

    // Testimonials
    const tCount = await Testimonial.countDocuments();
    if (tCount === 0) {
      await Testimonial.insertMany(DEFAULT_TESTIMONIALS);
      console.log(`  ✅ ${DEFAULT_TESTIMONIALS.length} testimonials seeded`);
    }

    console.log('  🌱 Seed complete\n');
  } catch (err) {
    console.error('  ❌ Seed error:', err.message);
  }
}

module.exports = { seedDatabase };
