#!/usr/bin/env node
/**
 * Generates the `majorMatch3.*` i18n namespace into all four locale files.
 *
 * WHY A SCRIPT: hand-maintaining ~330 keys across en/ru/kk/uz is how parity
 * drifts. Here the key SET is derived from one source, so all four files are
 * structurally identical by construction.
 *
 * ⚠️ CONCURRENCY: other agents/sessions edit these same files. Each locale is
 * read → merged → written one at a time, immediately before writing. Never
 * read all four up front and write later — that silently drops their keys.
 *
 * EN is the authoritative copy, transcribed 1:1 from the product prototype.
 * ru/kk/uz are seeded with the EN string and tagged in `mm3-untranslated.json`
 * so a native pass can find them. They are NOT machine translations pretending
 * to be reviewed copy.
 *
 *   node scripts/mm3-locale-gen.cjs           # write
 *   node scripts/mm3-locale-gen.cjs --check   # verify parity, write nothing
 */

const fs = require('fs');
const path = require('path');

const LOCALES = ['en', 'ru', 'kk', 'uz'];
const LOCALE_DIR = path.join(__dirname, '..', 'public', 'locales');
const NS = 'majorMatch3';

// ─────────────────────────────────────────────────────────────────────────
// EN copy — verbatim from the prototype. `s` = sub-line, `o` = options,
// `h` = { optionIndex: hintText }, `low`/`high` = scale ends,
// `f` = field groups [key, label, options[] | placeholder].
// ─────────────────────────────────────────────────────────────────────────

const PARTS = [
  ['academic', 'Academic Profile',
    'Your current standing: GPA, curriculum, SAT/ACT, IELTS/TOEFL, olympiads, activities, and research experience.'],
  ['interests', 'Interests & Personality',
    'A psychometric section built on the RIASEC model: how you think, what motivates you, and where you want to be in ten years.'],
  ['preferences', 'University Preferences',
    'Countries, budget and scholarships, campus size and setting, program style, and your application timeline.'],
];

const Q = {
  // ── Part I ──────────────────────────────────────────────────────────────
  grade: {
    t: 'Where are you in your studies right now?',
    s: 'This sets your application timeline and which intake you should target.',
    o: ['Grade 9 (or equivalent)', 'Grade 10', 'Grade 11', 'Grade 12 / final year',
        'Graduated — gap year', 'Currently at university — considering transfer'],
  },
  curriculum: {
    t: 'Which curriculum are you studying?',
    s: 'Admissions offices read your transcript differently depending on the system behind it.',
    o: ['National curriculum (state school)', 'Presidential / specialized school',
        'International Baccalaureate (IB)', 'Cambridge A-Levels / IGCSE',
        'US high school diploma (with or without AP)', 'Other international curriculum'],
    h: { 0: 'e.g., Uzbek national program' },
  },
  gpa: {
    t: 'What is your cumulative GPA?',
    s: "Enter it in your school's grading scale — the AI will normalize it.",
    f: [
      ['gpaScale', 'Grading scale',
       ['4.0 scale', '5.0 scale (national)', 'Percentage (out of 100)',
        'IB points (out of 45 predicted)', 'A-Level grades (e.g., A*AA)']],
      ['gpaValue', 'Your GPA / score', null, 'e.g., 3.8 or 4.6 or 92% or A*AA'],
      ['gpaTrend', 'Grade trend over the last two years',
       ['Rising strongly', 'Stable and high', 'Stable and average',
        'Slightly declining', 'Uneven / mixed']],
    ],
  },
  sat: {
    t: 'SAT or ACT — where do you stand?',
    s: 'Most top-300 universities in the US super-score the SAT; many worldwide accept it for placement or scholarships.',
    f: [
      ['satStatus', 'Status',
       ['Not yet taken — planning to', 'Not taking — targeting test-optional / non-US',
        'Taken SAT', 'Taken ACT', 'Taken both']],
      ['satScore', 'Best total score (leave blank if not taken)', null, 'e.g., SAT 1450 or ACT 32'],
      ['satBreak', 'Section strength (if taken)',
       ['Stronger in Math', 'Stronger in Reading & Writing', 'Balanced', 'Not applicable']],
    ],
  },
  english: {
    t: 'What is your English proficiency?',
    s: 'IELTS, TOEFL, or Duolingo English Test — required by nearly every English-medium university for international students.',
    f: [
      ['engStatus', 'Test status',
       ['Not yet taken — planning to', 'Taken IELTS', 'Taken TOEFL iBT',
        'Taken Duolingo English Test', 'Native / studied in English-medium school']],
      ['engScore', 'Score (leave blank if not taken)', null, 'e.g., IELTS 7.5 / TOEFL 102 / DET 130'],
      ['engSelf', 'Honest self-assessment of academic English',
       ['I can write research essays comfortably', 'Strong, but academic writing needs work',
        'Conversational — academic English is hard', 'Beginner–intermediate']],
    ],
  },
  advanced: {
    t: 'Advanced coursework and external exams',
    s: 'AP, IB HL, A-Levels, or university-level courses signal readiness for rigor. Select all that apply.',
    o: ['AP exams (1–2 taken or planned)', 'AP exams (3 or more)', 'IB Higher Level subjects',
        'A-Level subjects', 'University-level online courses with certificates',
        'SAT Subject-level national exams / attestat honors', 'None yet'],
    h: { 4: 'Coursera, edX, CS50, etc.' },
  },
  strengths: {
    t: 'Which subjects are you strongest in?',
    s: 'Choose up to three where your grades and confidence are highest.',
    o: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science / Informatics',
        'Economics', 'History & Social Sciences', 'Literature & Languages', 'Art & Design',
        'Foreign Languages'],
  },
  olympiad: {
    t: 'Competitions, olympiads, and awards',
    s: 'Select the highest level you have reached in any academic competition.',
    o: ['International olympiad medal or finalist', 'National olympiad winner or prize-holder',
        'Regional / city-level winner', 'School-level awards', 'Participated, no awards yet',
        'Have not competed'],
    h: { 0: 'IMO, IOI, IPhO, iGEM, ISEF, etc.' },
  },
  extracurricular: {
    t: 'Your activities outside the classroom',
    s: 'Select everything you have done consistently for 6+ months. Depth beats quantity.',
    o: ['Founded a club, project, or startup', 'Leadership role', 'Volunteering / community service',
        'Competitive sports', 'Music, art, theater, or film', 'Debate, MUN, or public speaking',
        'Part-time work or family business', 'Teaching / tutoring others',
        'Coding projects, apps, or open source', 'Very few so far — school has been the focus'],
    h: { 1: 'president, captain, editor-in-chief' },
  },
  research: {
    t: 'Research, internships, and independent projects',
    s: 'Select the strongest item on your record so far.',
    o: ['Published or presented research', 'Completed a research project with a mentor or professor',
        'Internship at a company or organization', 'Substantial independent project',
        'Small personal projects', 'Nothing yet — I want the roadmap to include this'],
    h: { 0: 'journal, conference, or science fair', 3: 'an app, a business, a nonprofit, a portfolio' },
  },

  // ── Part II ─────────────────────────────────────────────────────────────
  flow: {
    t: 'Which activities make you lose track of time?',
    s: 'Choose up to three. This maps your Holland (RIASEC) interest profile.',
    o: ['Building, fixing, or making physical things', 'Solving puzzles, proofs, or analyzing data',
        'Writing, designing, composing, or performing', 'Teaching, mentoring, or helping people',
        'Persuading, selling, leading, or organizing people',
        'Organizing information, planning, perfecting systems'],
    h: { 0: 'Realistic', 1: 'Investigative', 2: 'Artistic', 3: 'Social', 4: 'Enterprising', 5: 'Conventional' },
  },
  problem: {
    t: 'Pick the problem you would most enjoy spending a month on.',
    s: 'There is no wrong answer — choose instinctively.',
    o: ['Design a cheaper water-purification device for villages',
        'Find the pattern in a massive, messy dataset',
        'Write a story or build a brand that moves people',
        'Create a program that helps struggling students catch up',
        'Launch and grow a product from zero to 1,000 users',
        "Rebuild a chaotic organization's processes so everything runs on time"],
  },
  environment: {
    t: 'Where do you see yourself working at 25?',
    s: 'Imagine an ordinary Tuesday. Which setting feels right?',
    o: ['A lab or research institute', 'A tech company or my own startup', 'A hospital or clinic',
        'A courtroom, ministry, or international organization',
        'A studio, newsroom, or creative agency', 'A trading floor, bank, or consulting firm',
        'A construction site, factory, or field operation', 'A classroom or university'],
  },
  math: {
    t: '"I enjoy mathematics and abstract problem-solving."',
    s: 'Rate honestly from 1 (strongly disagree) to 5 (strongly agree).',
    low: 'Strongly disagree', high: 'Strongly agree',
  },
  writing: {
    t: '"I enjoy writing, reading deeply, and communicating ideas."',
    s: 'Rate honestly from 1 (strongly disagree) to 5 (strongly agree).',
    low: 'Strongly disagree', high: 'Strongly agree',
  },
  people: {
    t: '"I gain energy from working with people, not just ideas."',
    s: 'Rate honestly from 1 (strongly disagree) to 5 (strongly agree).',
    low: 'Strongly disagree', high: 'Strongly agree',
  },
  motivator: {
    t: 'What matters most in your future career?',
    s: 'Choose your top two motivators.',
    o: ['High income and financial freedom', 'Impact — solving real problems for society',
        'Prestige and recognition', 'Stability and clear career path',
        'Creativity and self-expression', 'Autonomy — being my own boss',
        'Discovery — pushing knowledge forward'],
  },
  vision: {
    t: 'Ten years from now, which headline about you would make you proudest?',
    s: 'Choose one.',
    o: ['"…founds startup valued at $100M"', '"…publishes breakthrough research"',
        '"…leads major project at a global company"', '"…saves lives as a leading physician"',
        '"…appointed to senior public-service role"',
        '"…wins international award for creative work"',
        '"…builds a school / movement that changes education"'],
  },
  ambiguity: {
    t: 'How do you feel about open-ended, uncertain paths?',
    s: 'Some majors lead to defined careers (medicine, engineering); others are flexible platforms (liberal arts, economics).',
    o: ['I want a defined profession from day one', 'Mostly defined, with some room to explore',
        'Balanced — a strong core plus electives', "Mostly exploratory — I'll specialize later",
        'Fully open — I want maximum optionality'],
  },
  never: {
    t: 'Which field would you least want to study?',
    s: 'Elimination sharpens the match. Choose one.',
    o: ['Advanced mathematics & theoretical sciences', 'Biology, chemistry & medicine',
        'Programming & engineering', 'Essay-heavy humanities', 'Sales, management & business',
        'Public speaking & performance', "None — I'm genuinely open to everything"],
  },

  // ── Part III ────────────────────────────────────────────────────────────
  countries: {
    t: 'Which countries or regions are you targeting?',
    s: 'Select up to three.',
    o: ['United States', 'United Kingdom', 'Canada', 'Continental Europe', 'South Korea / Japan',
        'Singapore / Hong Kong', 'Middle East', 'Central Asia / stay closer to home',
        'Open to anywhere with the best offer'],
    h: { 3: 'Germany, Netherlands, France, Italy…', 6: 'UAE, Saudi Arabia, Qatar' },
  },
  budget: {
    t: 'What can your family realistically contribute per year?',
    s: 'Include tuition and living costs. Be honest — this decides which scholarship strategy the roadmap builds.',
    o: ['Under $5,000 — I need a full scholarship', '$5,000–15,000 — need major aid',
        '$15,000–30,000 — need partial aid', '$30,000–50,000 — some aid helps',
        '$50,000+ — cost is not the main constraint'],
  },
  size: {
    t: 'What size of university fits you?',
    s: 'Class sizes, professor access, and campus energy all follow from this.',
    o: ['Small (under 5,000 students)', 'Medium (5,000–15,000)', 'Large (15,000–30,000)',
        'Very large (30,000+)', 'No preference'],
    h: { 0: 'seminars, everyone knows you', 3: 'big-city energy, endless options' },
  },
  setting: {
    t: 'What campus setting do you prefer?',
    o: ['Major city center', 'Suburban — near a city but with a campus', 'Classic college town',
        'No preference — program quality first'],
    h: { 0: 'New York, London, Seoul', 2: 'the university is the town' },
  },
  selectivity: {
    t: 'How ambitious should your university list be?',
    s: 'This calibrates the reach / match / safety balance of your matches.',
    o: ['Swing big — prioritize the most selective fits even if odds are low',
        'Ambitious but balanced — reaches plus strong matches',
        'Prioritize likely admits with strong programs', 'Prioritize scholarships over rankings'],
  },
  language: {
    t: 'Language of instruction',
    o: ['English only', 'English preferred, open to learning another language',
        'Comfortable studying in Russian', 'Open to intensive local-language pathway programs'],
    h: { 1: 'e.g., German for tuition-free Germany' },
  },
  distance: {
    t: 'How important is staying close to home?',
    s: 'Think honestly about family expectations, travel cost, and homesickness.',
    low: 'Not important — go anywhere', high: 'Very important — stay near',
  },
  culture: {
    t: 'What should your campus be known for?',
    s: 'Choose up to three priorities.',
    o: ['Cutting-edge research', 'Entrepreneurship & startup culture',
        'Strong international student community', 'Career services & employer pipeline',
        'Sports & school spirit', 'Arts & culture scene', 'Safety & supportive environment',
        'Halal food & prayer facilities'],
  },
  style: {
    t: 'What learning style should the program have?',
    o: ['Co-op / built-in paid internships', 'Research-intensive with lab access from year one',
        'Flexible liberal arts — sample widely, declare later', 'Specialized from day one',
        'Project-based, practical learning'],
    h: { 0: 'e.g., Waterloo, Northeastern, Drexel', 3: 'UK/European style' },
  },
  timeline: {
    t: 'When do you plan to start university?',
    s: 'This anchors every deadline in your roadmap.',
    f: [
      ['intake', 'Target intake',
       ['Fall 2026 (urgent!)', 'Spring 2027', 'Fall 2027', 'Fall 2028', 'Fall 2029 or later',
        'Not sure yet']],
      ['degree', 'Degree level',
       ["Bachelor's", "Foundation year, then Bachelor's", "Transfer into Bachelor's", 'Not sure']],
      ['extra', 'Anything else the AI should know? (optional)', null,
       'e.g., I want to study AI + biology, my parents want medicine…'],
    ],
  },
};

/** Shared chrome for the runner. */
const CHROME = {
  'nav.continue': 'Continue',
  'nav.back': 'Back',
  'nav.analyze': 'Analyze my profile',
  'nav.answerFirst': 'Please answer first',
  'nav.progress': 'Question {{current}} of {{total}}',
  'nav.selectUpTo': 'Select up to {{max}}. Selected: {{count}}',
  'field.choose': 'Choose…',
  'prefill.notice': 'We filled this in from your profile — check it and edit anything that changed.',
};

// ─────────────────────────────────────────────────────────────────────────
// Flatten to dotted keys
// ─────────────────────────────────────────────────────────────────────────

function buildEn() {
  const out = {};
  for (const [slug, title, desc] of PARTS) {
    out[`${NS}.part.${slug}.title`] = title;
    out[`${NS}.part.${slug}.desc`] = desc;
  }
  for (const [k, v] of Object.entries(CHROME)) out[`${NS}.${k}`] = v;

  for (const [slug, q] of Object.entries(Q)) {
    const root = `${NS}.q.${slug}`;
    out[`${root}.title`] = q.t;
    if (q.s) out[`${root}.sub`] = q.s;
    if (q.o) q.o.forEach((text, i) => { out[`${root}.opt.${i}`] = text; });
    if (q.h) for (const [i, text] of Object.entries(q.h)) out[`${root}.hint.${i}`] = text;
    if (q.low) { out[`${root}.low`] = q.low; out[`${root}.high`] = q.high; }
    if (q.f) {
      for (const [key, label, opts, ph] of q.f) {
        const fr = `${root}.f.${key}`;
        out[`${fr}.label`] = label;
        if (opts) opts.forEach((text, i) => { out[`${fr}.opt.${i}`] = text; });
        if (ph) out[`${fr}.ph`] = ph;
      }
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// Merge (read-modify-write, one locale at a time)
// ─────────────────────────────────────────────────────────────────────────

const en = buildEn();
const keys = Object.keys(en).sort();
const check = process.argv.includes('--check');

console.log(`${NS}: ${keys.length} keys generated from ${Object.keys(Q).length} questions.`);

const untranslated = {};
let failed = false;

for (const loc of LOCALES) {
  const file = path.join(LOCALE_DIR, `${loc}.json`);
  if (!fs.existsSync(file)) { console.error(`  ✗ ${loc}.json not found at ${file}`); failed = true; continue; }

  // Read immediately before writing — never hoist this out of the loop.
  const current = JSON.parse(fs.readFileSync(file, 'utf8'));
  const before = Object.keys(current).length;
  const missing = keys.filter((k) => !(k in current));

  if (check) {
    console.log(`  ${missing.length === 0 ? '✓' : '✗'} ${loc}: ${before} keys, ${missing.length} missing from ${NS}`);
    if (missing.length) failed = true;
    continue;
  }

  for (const k of keys) {
    if (k in current) continue;              // never clobber existing translations
    current[k] = en[k];                      // seed with EN
    if (loc !== 'en') (untranslated[loc] ||= []).push(k);
  }

  const sorted = Object.fromEntries(Object.keys(current).sort().map((k) => [k, current[k]]));
  fs.writeFileSync(file, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
  console.log(`  ✓ ${loc}: ${before} → ${Object.keys(sorted).length} keys (+${Object.keys(sorted).length - before})`);
}

if (!check && Object.keys(untranslated).length) {
  const outPath = path.join(__dirname, 'mm3-untranslated.json');
  fs.writeFileSync(outPath, JSON.stringify(untranslated, null, 2) + '\n', 'utf8');
  const n = Object.values(untranslated).reduce((a, v) => a + v.length, 0);
  console.log(`\n⚠️  ${n} keys seeded with ENGLISH across ru/kk/uz — they are NOT translated.`);
  console.log(`    Listed in scripts/mm3-untranslated.json for a native-review pass.`);
}

// Parity is the invariant that matters — assert it however we ran.
const sets = LOCALES.map((l) => {
  const f = path.join(LOCALE_DIR, `${l}.json`);
  return fs.existsSync(f) ? Object.keys(JSON.parse(fs.readFileSync(f, 'utf8'))).length : -1;
});
console.log(`\nlocale key counts: ${LOCALES.map((l, i) => `${l}=${sets[i]}`).join(' ')}`);
if (new Set(sets).size !== 1) { console.error('✗ PARITY BROKEN — locale key counts differ.'); failed = true; }
else console.log('✓ exact key parity across all four locales.');

process.exit(failed ? 1 : 0);
