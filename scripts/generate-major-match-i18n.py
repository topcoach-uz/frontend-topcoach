#!/usr/bin/env python3
"""
Stage 3 (MAJOR_MATCH_V2_PLAN.md) — generates the `majorMatch.*` i18n namespace
into all 4 locale files (public/locales/{en,ru,uz,kk}.json).

Source of truth for STRUCTURE + EN copy: ../../major-match-v2-spec/dinara-questions.json
(read at runtime, not retyped — question ids/sections/option letters/EN text come
straight from there so structural parity with the backend engine catalog
(src/modules/major-match/engine/constants.ts, copied below as MAJOR_CATALOG since
it's backend TS and this is a frontend build-time script) is mechanical, not hand-checked.

ru/uz/kk are machine-drafted translations authored directly in this script,
explicitly flagged for native review (kk especially — matches this repo's existing
convention of flagging kk as non-native-reviewed Karakalpak).

CONCURRENCY: other agents may be editing these same 4 locale files at the same
time (different namespaces). This script therefore does a fresh
read -> merge -> write for EACH locale file, immediately before writing it, and
never holds all four in memory across a time gap. Re-run safely (idempotent —
same keys just get overwritten with the same values).
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPEC_PATH = os.path.join(ROOT, '..', 'major-match-v2-spec', 'dinara-questions.json')
LOCALES_DIR = os.path.join(ROOT, 'public', 'locales')
LANGS = ['en', 'ru', 'uz', 'kk']

with open(SPEC_PATH, 'r', encoding='utf-8') as f:
    SPEC = json.load(f)

OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

# ─────────────────────────────────────────────────────────────────────────
# Backend engine catalog, mirrored from
# backend-topcoach/src/modules/major-match/engine/constants.ts
# (DIMENSION_KEYS + MAJOR_COMBO_CATALOG). Backend owns slugs; this script owns
# the display copy keyed off those exact slugs, per the plan's content
# architecture split.
# ─────────────────────────────────────────────────────────────────────────
DIMENSION_KEYS = ['analytical', 'creative', 'social', 'investigative', 'practical', 'commercial']

# 13 primary majors reachable via the engine post-D1-fix, each with its 3 alt slugs.
PRIMARY_MAJORS = [
    ('computer-science', ['software-engineering', 'data-science', 'information-systems']),
    ('mathematics-statistics', ['actuarial-science', 'physics', 'quantitative-finance']),
    ('engineering', ['mechanical-engineering', 'civil-engineering', 'electrical-engineering']),
    ('architecture-industrial-design', ['urban-planning', 'interior-design', 'product-design']),
    ('film-media-communications', ['journalism', 'creative-writing', 'digital-media']),
    ('psychology', ['counseling', 'education', 'human-development']),
    ('sociology-political-science', ['international-relations', 'anthropology', 'human-rights']),
    ('business-administration', ['management', 'human-resources', 'marketing']),
    ('biology-pre-medicine', ['biochemistry', 'environmental-science', 'pharmacy']),
    ('law-public-policy', ['political-science', 'social-work', 'criminology']),
    ('finance-economics', ['accounting', 'business-analytics', 'supply-chain']),
    ('management-information-systems', ['digital-business', 'operations-management', 'systems-analysis']),
    ('marketing-advertising', ['brand-strategy', 'public-relations', 'digital-marketing']),
]

# ─────────────────────────────────────────────────────────────────────────
# Dimension labels + short descriptions (EN verbatim from dinara-scoring.json
# dimensions.keys[].artifactDescription; ru/uz/kk machine drafts).
# ─────────────────────────────────────────────────────────────────────────
DIMENSIONS = {
    'analytical': {
        'en': {'label': 'Analytical', 'description': 'Logic, math, systems, data, precision'},
        'ru': {'label': 'Аналитический', 'description': 'Логика, математика, системы, данные, точность'},
        'uz': {'label': 'Analitik', 'description': "Mantiq, matematika, tizimlar, ma'lumotlar, aniqlik"},
        'kk': {'label': 'Analitikalıq', 'description': 'Logika, matematika, sistemalar, málimatlar, anıqlıq'},
    },
    'creative': {
        'en': {'label': 'Creative', 'description': 'Art, design, expression, originality'},
        'ru': {'label': 'Творческий', 'description': 'Искусство, дизайн, самовыражение, оригинальность'},
        'uz': {'label': 'Ijodiy', 'description': "San'at, dizayn, ifoda, o'ziga xoslik"},
        'kk': {'label': 'Dóretiwshilik', 'description': 'Óner, dizayn, ózin bildiriw, originallıq'},
    },
    'social': {
        'en': {'label': 'Social', 'description': 'Empathy, communication, helping people'},
        'ru': {'label': 'Социальный', 'description': 'Эмпатия, коммуникация, помощь людям'},
        'uz': {'label': 'Ijtimoiy', 'description': 'Hamdardlik, muloqot, odamlarga yordam'},
        'kk': {'label': 'Ijtimaiy', 'description': 'Empatiya, qatnas, adamlarǵa jardem'},
    },
    'investigative': {
        'en': {'label': 'Investigative', 'description': 'Research, curiosity, discovery, depth'},
        'ru': {'label': 'Исследовательский', 'description': 'Исследование, любопытство, открытия, глубина'},
        'uz': {'label': 'Tadqiqotchi', 'description': 'Tadqiqot, qiziquvchanlik, kashfiyot, chuqurlik'},
        'kk': {'label': 'İzertlewshilik', 'description': 'İzertlew, qızıqshańlıq, ashıwlar, terenlik'},
    },
    'practical': {
        'en': {'label': 'Practical', 'description': 'Hands-on, building, technical execution'},
        'ru': {'label': 'Практический', 'description': 'Практика, создание, техническое исполнение'},
        'uz': {'label': 'Amaliy', 'description': 'Amaliyot, qurish, texnik ijro'},
        'kk': {'label': 'Ámeliy', 'description': 'Ámeliyat, qurıw, texnikalıq orınlaw'},
    },
    'commercial': {
        'en': {'label': 'Commercial', 'description': 'Strategy, leadership, business, ambition'},
        'ru': {'label': 'Коммерческий', 'description': 'Стратегия, лидерство, бизнес, амбиции'},
        'uz': {'label': 'Tijorat', 'description': 'Strategiya, yetakchilik, biznes, shijoat'},
        'kk': {'label': 'Sawda', 'description': 'Strategiya, basshılıq, biznes, ambisiya'},
    },
}

SECTIONS = {
    0: {
        'en': 'Interests & Passions', 'ru': 'Интересы и увлечения',
        'uz': 'Qiziqishlar va ishtiyoq', 'kk': 'Qızıqıwshılıqlar hám ıqılas',
    },
    1: {
        'en': 'Learning Style', 'ru': 'Стиль обучения',
        'uz': "O'rganish uslubi", 'kk': 'Úyreniw stili',
    },
    2: {
        'en': 'Skills & Strengths', 'ru': 'Навыки и сильные стороны',
        'uz': 'Ko\'nikma va kuchli tomonlar', 'kk': 'Kónlikpe hám kúshli tárepler',
    },
    3: {
        'en': 'Values & Goals', 'ru': 'Ценности и цели',
        'uz': 'Qadriyatlar va maqsadlar', 'kk': 'Qádiriyatlar hám maqsetler',
    },
    4: {
        'en': 'Personality', 'ru': 'Личность',
        'uz': 'Shaxsiyat', 'kk': 'Shaxsiyat',
    },
    5: {
        'en': 'Career Vision', 'ru': 'Карьерное видение',
        'uz': 'Kasbiy nuqtai nazar', 'kk': 'Kásiplik kózqaras',
    },
}

# ─────────────────────────────────────────────────────────────────────────
# Major names (primary + alt, all 52 unique slugs across the 13-row catalog)
# and full descriptions for the 13 primaries (dinara-scoring.json comboMap.rows[].desc,
# EN verbatim; the Law/Public Policy description is reused unchanged even though
# its dimension pair was reassigned per plan D1/D3 — only the pair mapping changed,
# not the editorial content).
# ─────────────────────────────────────────────────────────────────────────
MAJOR_NAMES = {
    'computer-science': {'en': 'Computer Science', 'ru': 'Информатика', 'uz': 'Kompyuter fanlari', 'kk': 'Kompyuter ilimleri'},
    'software-engineering': {'en': 'Software Engineering', 'ru': 'Программная инженерия', 'uz': 'Dasturiy injiniring', 'kk': 'Programmalıq injenerlik'},
    'data-science': {'en': 'Data Science', 'ru': 'Наука о данных', 'uz': 'Ma\'lumotlar fani', 'kk': 'Málimatlar ilimi'},
    'information-systems': {'en': 'Information Systems', 'ru': 'Информационные системы', 'uz': 'Axborot tizimlari', 'kk': 'Aqparat sistemaları'},

    'mathematics-statistics': {'en': 'Mathematics / Statistics', 'ru': 'Математика и статистика', 'uz': 'Matematika va statistika', 'kk': 'Matematika hám statistika'},
    'actuarial-science': {'en': 'Actuarial Science', 'ru': 'Актуарная математика', 'uz': 'Aktuar fanlari', 'kk': 'Aktuarlıq ilim'},
    'physics': {'en': 'Physics', 'ru': 'Физика', 'uz': 'Fizika', 'kk': 'Fizika'},
    'quantitative-finance': {'en': 'Quantitative Finance', 'ru': 'Количественные финансы', 'uz': 'Miqdoriy moliya', 'kk': 'Mugdarlıq finans'},

    'engineering': {'en': 'Engineering', 'ru': 'Инженерия', 'uz': 'Muhandislik', 'kk': 'İnjenerlik'},
    'mechanical-engineering': {'en': 'Mechanical Engineering', 'ru': 'Машиностроение', 'uz': 'Mexanika muhandisligi', 'kk': 'Mexanika injenerligi'},
    'civil-engineering': {'en': 'Civil Engineering', 'ru': 'Строительная инженерия', 'uz': 'Qurilish muhandisligi', 'kk': 'Qurılıs injenerligi'},
    'electrical-engineering': {'en': 'Electrical Engineering', 'ru': 'Электротехника', 'uz': 'Elektrotexnika', 'kk': 'Elektrotexnika'},

    'architecture-industrial-design': {'en': 'Architecture / Industrial Design', 'ru': 'Архитектура и промышленный дизайн', 'uz': 'Arxitektura va sanoat dizayni', 'kk': 'Arxitektura hám sanaat dizaynı'},
    'urban-planning': {'en': 'Urban Planning', 'ru': 'Градостроительство', 'uz': 'Shaharsozlik', 'kk': 'Qala qurılısı'},
    'interior-design': {'en': 'Interior Design', 'ru': 'Дизайн интерьера', 'uz': 'Interyer dizayni', 'kk': 'İnter\'er dizaynı'},
    'product-design': {'en': 'Product Design', 'ru': 'Дизайн продукта', 'uz': 'Mahsulot dizayni', 'kk': 'Ónim dizaynı'},

    'film-media-communications': {'en': 'Film, Media & Communications', 'ru': 'Кино, медиа и коммуникации', 'uz': 'Kino, media va kommunikatsiya', 'kk': 'Kino, media hám kommunikatsiya'},
    'journalism': {'en': 'Journalism', 'ru': 'Журналистика', 'uz': 'Jurnalistika', 'kk': 'Jurnalistika'},
    'creative-writing': {'en': 'Creative Writing', 'ru': 'Творческое письмо', 'uz': 'Ijodiy yozuv', 'kk': 'Dóretiwshilik jazıw'},
    'digital-media': {'en': 'Digital Media', 'ru': 'Цифровые медиа', 'uz': 'Raqamli media', 'kk': 'Sanlıq media'},

    'psychology': {'en': 'Psychology', 'ru': 'Психология', 'uz': 'Psixologiya', 'kk': 'Psixologiya'},
    'counseling': {'en': 'Counseling', 'ru': 'Консультирование', 'uz': 'Konsultatsiya (maslahat berish)', 'kk': 'Keńes beriw'},
    'education': {'en': 'Education', 'ru': 'Педагогика', 'uz': 'Pedagogika', 'kk': 'Pedagogika'},
    'human-development': {'en': 'Human Development', 'ru': 'Развитие человека', 'uz': 'Inson rivojlanishi', 'kk': 'Adam rawajlanıwı'},

    'sociology-political-science': {'en': 'Sociology / Political Science', 'ru': 'Социология и политология', 'uz': 'Sotsiologiya va siyosatshunoslik', 'kk': 'Sotsiologiya hám siyasattanıw'},
    'international-relations': {'en': 'International Relations', 'ru': 'Международные отношения', 'uz': 'Xalqaro munosabatlar', 'kk': 'Xalıqaralıq qatnaslar'},
    'anthropology': {'en': 'Anthropology', 'ru': 'Антропология', 'uz': 'Antropologiya', 'kk': 'Antropologiya'},
    'human-rights': {'en': 'Human Rights', 'ru': 'Права человека', 'uz': 'Inson huquqlari', 'kk': 'Adam huqıqları'},

    'business-administration': {'en': 'Business Administration', 'ru': 'Бизнес-администрирование', 'uz': 'Biznes boshqaruvi', 'kk': 'Biznes basqarıwı'},
    'management': {'en': 'Management', 'ru': 'Менеджмент', 'uz': 'Menejment', 'kk': 'Menedjment'},
    'human-resources': {'en': 'Human Resources', 'ru': 'Управление персоналом', 'uz': 'Kadrlar boshqaruvi', 'kk': 'Kadrlar basqarıwı'},
    'marketing': {'en': 'Marketing', 'ru': 'Маркетинг', 'uz': 'Marketing', 'kk': 'Marketing'},

    'biology-pre-medicine': {'en': 'Biology / Pre-Medicine', 'ru': 'Биология и медицина (пре-мед)', 'uz': 'Biologiya va tibbiyotga tayyorgarlik', 'kk': 'Biologiya hám medicinaǵa tayarlıq'},
    'biochemistry': {'en': 'Biochemistry', 'ru': 'Биохимия', 'uz': 'Biokimyo', 'kk': 'Biokimya'},
    'environmental-science': {'en': 'Environmental Science', 'ru': 'Экология (наука об окружающей среде)', 'uz': 'Ekologiya fani', 'kk': 'Qorshaǵan ortalıq ilimi'},
    'pharmacy': {'en': 'Pharmacy', 'ru': 'Фармацевтика', 'uz': 'Farmatsiya', 'kk': 'Farmaciya'},

    'law-public-policy': {'en': 'Law / Public Policy', 'ru': 'Право и государственная политика', 'uz': 'Huquq va davlat siyosati', 'kk': 'Huqıq hám mámleket siyasatı'},
    'political-science': {'en': 'Political Science', 'ru': 'Политология', 'uz': 'Siyosatshunoslik', 'kk': 'Siyasattanıw'},
    'social-work': {'en': 'Social Work', 'ru': 'Социальная работа', 'uz': 'Ijtimoiy ish', 'kk': 'Ijtimaiy jumıs'},
    'criminology': {'en': 'Criminology', 'ru': 'Криминология', 'uz': 'Kriminologiya', 'kk': 'Kriminologiya'},

    'finance-economics': {'en': 'Finance / Economics', 'ru': 'Финансы и экономика', 'uz': 'Moliya va iqtisod', 'kk': 'Finans hám ekonomika'},
    'accounting': {'en': 'Accounting', 'ru': 'Бухгалтерский учёт', 'uz': 'Buxgalteriya hisobi', 'kk': 'Buxgalterlik esap'},
    'business-analytics': {'en': 'Business Analytics', 'ru': 'Бизнес-аналитика', 'uz': 'Biznes-tahlil', 'kk': 'Biznes-analiz'},
    'supply-chain': {'en': 'Supply Chain', 'ru': 'Управление цепочками поставок', 'uz': 'Ta\'minot zanjirini boshqarish', 'kk': 'Támiynlew tizbegin basqarıw'},

    'management-information-systems': {'en': 'Management Information Systems', 'ru': 'Управление информационными системами', 'uz': 'Axborot tizimlarini boshqarish', 'kk': 'Aqparat sistemaların basqarıw'},
    'digital-business': {'en': 'Digital Business', 'ru': 'Цифровой бизнес', 'uz': 'Raqamli biznes', 'kk': 'Sanlıq biznes'},
    'operations-management': {'en': 'Operations Management', 'ru': 'Операционный менеджмент', 'uz': 'Operatsiyalar menejmenti', 'kk': 'Operaciyalar menedjmenti'},
    'systems-analysis': {'en': 'Systems Analysis', 'ru': 'Системный анализ', 'uz': 'Tizim tahlili', 'kk': 'Sistemalıq analiz'},

    'marketing-advertising': {'en': 'Marketing / Advertising', 'ru': 'Маркетинг и реклама', 'uz': 'Marketing va reklama', 'kk': 'Marketing hám jarnama'},
    'brand-strategy': {'en': 'Brand Strategy', 'ru': 'Брендинг и стратегия', 'uz': 'Brend strategiyasi', 'kk': 'Brend strategiyası'},
    'public-relations': {'en': 'Public Relations', 'ru': 'Связи с общественностью', 'uz': 'Jamoatchilik bilan aloqalar', 'kk': 'Jámiyetshilik penen baylanıs'},
    'digital-marketing': {'en': 'Digital Marketing', 'ru': 'Цифровой маркетинг', 'uz': 'Raqamli marketing', 'kk': 'Sanlıq marketing'},
}

MAJOR_DESCRIPTIONS = {
    'computer-science': {
        'en': "You blend strong analytical thinking with a creative, problem-solving edge. You're drawn to building systems, working with logic, and pushing what technology can do. CS gives you the freedom to invent.",
        'ru': "Ты сочетаешь сильное аналитическое мышление с творческим подходом к решению задач. Тебя тянет создавать системы, работать с логикой и раздвигать границы технологий. Информатика даёт тебе свободу изобретать.",
        'uz': "Sen kuchli analitik fikrlashni ijodiy muammo yechish qobiliyati bilan uyg'unlashtirasan. Tizimlar yaratish, mantiq bilan ishlash va texnologiya imkoniyatlarini kengaytirishga qiziqasan. Kompyuter fanlari senga ixtiro qilish erkinligini beradi.",
        'kk': "Sen kúshli analitikalıq oylawdı dóretiwshilik másele sheshiw qábileti menen uyǵınlastırasań. Sistemalar jaratıw, logika menen islew hám texnologiya imkaniyatların keńeytiwge qızıǵasań. Kompyuter ilimleri saǵan oylap tabıw erkinligin beredi.",
    },
    'mathematics-statistics': {
        'en': "Your mind seeks precision and depth. You're most alive when chasing patterns, proving things, or modeling complex systems. A quantitative major lets you go deep into how the world works at its core.",
        'ru': "Твой ум ищет точность и глубину. Ты по-настоящему оживаешь, гоняясь за закономерностями, что-то доказывая или моделируя сложные системы. Количественная специальность даёт тебе возможность глубоко понять, как устроен мир.",
        'uz': "Sening ongning aniqlik va chuqurlikni izlaydi. Qonuniyatlarni izlash, isbotlash yoki murakkab tizimlarni modellashtirishda eng jonlanasan. Miqdoriy yo'nalish senga dunyoning tub mohiyatini chuqur bilishga imkon beradi.",
        'kk': "Seniń aqılıń anıqlıq hám terenlikti izleydi. Nızamlıqlardı izlew, bir nárseni dálellew yamasa quramalı sistemalardı modellestiriwde eń jandanasań. Mugdarlıq baǵdar saǵan dúnyanıń tereninde qanday isleytuǵının teren bilıwge imkan beredi.",
    },
    'engineering': {
        'en': "You want to build things that work — real systems, real structures, real solutions. Engineering pairs your love of analysis with a drive to create tangible, lasting impact in the physical world.",
        'ru': "Ты хочешь создавать то, что реально работает — настоящие системы, конструкции, решения. Инженерия сочетает твою любовь к анализу со стремлением создавать осязаемое и долговечное влияние в физическом мире.",
        'uz': "Sen ishlaydigan narsalarni — haqiqiy tizimlar, tuzilmalar, yechimlarni yaratishni xohlaysan. Muhandislik sening tahlilga bo'lgan sevgingni jismoniy dunyoda uzoq muddatli, aniq ta'sir yaratish istagi bilan birlashtiradi.",
        'kk': "Sen haqıyqatında isleytuǵın nárselerdi — haqıyqıy sistemalar, qurılıslar, sheshimlerdi jaratıwdı qálaysań. İnjenerlik seniń analizge bolǵan súyispenshiligiń menen fizikalıq dúnyada uzaq múddetli, anıq tásir jaratıw ıntalıǵın birlestiredi.",
    },
    'architecture-industrial-design': {
        'en': "You're equally at home sketching and building. You think in forms, spaces, and systems — and want your creative output to live in the real world, not just on a screen.",
        'ru': "Тебе одинаково комфортно и рисовать эскизы, и строить. Ты мыслишь формами, пространствами и системами — и хочешь, чтобы твоё творчество жило в реальном мире, а не только на экране.",
        'uz': "Sen chizish va qurishda bab-baravar erkin his qilasan. Shakl, makon va tizimlarda fikrlaysan — va ijodiy natijalaring nafaqat ekranda, balki real dunyoda yashashini xohlaysan.",
        'kk': "Sen súwret sızıw hám qurıwda birdey erkin sezesen. Forma, keńlik hám sistemalarda oylaysań — hám dóretiwshilik jumısıńnıń tek ekranda emes, real dúnyada jasawın qálaysań.",
    },
    'film-media-communications': {
        'en': "You're a storyteller with an investigative mind. You want to explore ideas, uncover truths, and share them in ways that resonate emotionally and culturally. Media lets you do both.",
        'ru': "Ты — рассказчик с исследовательским складом ума. Ты хочешь исследовать идеи, раскрывать истину и делиться ею так, чтобы это находило эмоциональный и культурный отклик. Медиа позволяет тебе делать и то, и другое.",
        'uz': "Sen tadqiqotchi fikrga ega hikoyachisan. G'oyalarni o'rganish, haqiqatni ochish va ularni hissiy hamda madaniy jihatdan ta'sirli tarzda ulashishni xohlaysan. Media senga ikkalasini ham qilish imkonini beradi.",
        'kk': "Sen izertlewshi oyǵa iye hikayashı. İdeyalardı izertlew, haqıyqattı ashıw hám olardı sezimlik hám mádeniy jaqtan tásirli túrde bólisiwdi qálaysań. Media saǵan ekewin de isleuge imkan beredi.",
    },
    'psychology': {
        'en': "You're deeply curious about people — why they think, feel, and behave the way they do. Psychology lets you combine empathy with scientific inquiry to understand and help the humans around you.",
        'ru': "Тебе по-настоящему интересны люди — почему они думают, чувствуют и ведут себя именно так. Психология позволяет соединить эмпатию с научным подходом, чтобы понимать людей вокруг и помогать им.",
        'uz': "Sen odamlarga chuqur qiziqasan — ular nega shunday o'ylaydi, his qiladi va o'zini tutadi. Psixologiya empatiyani ilmiy tadqiqot bilan birlashtirib, atrofingdagi insonlarni tushunish va ularga yordam berish imkonini beradi.",
        'kk': "Sen adamlarǵa teren qızıǵasań — ne ushın olar solay oylaydı, sezedi hám ózin tutadı. Psixologiya empatianı ilimiy izertlew menen birlestirip, átirapıńdaǵı adamlardı túsiniw hám olarǵa jardem beriw imkanın beredi.",
    },
    'sociology-political-science': {
        'en': "You see the world through the lens of systems, power, and people. You're drawn to understanding society — how it functions, where it fails, and how it can improve. Big ideas and big change drive you.",
        'ru': "Ты видишь мир через призму систем, власти и людей. Тебя тянет понимать общество — как оно устроено, где даёт сбой и как его можно улучшить. Тобой движут большие идеи и большие перемены.",
        'uz': "Sen dunyoni tizimlar, hokimiyat va odamlar nuqtai nazaridan ko'rasan. Jamiyatni tushunishga — u qanday ishlashi, qayerda muvaffaqiyatsizlikka uchrashi va qanday yaxshilanishi mumkinligiga qiziqasan. Katta g'oyalar va katta o'zgarish seni ilgari suradi.",
        'kk': "Sen dúnyanı sistemalar, húkimet hám adamlar tárepinen kóresen. Jamiyatti túsiniwge — ol qalay isleydi, qayerde sátsizlikke ushıraydı hám qalay jaqsılanıwı múmkin ekenligine qızıǵasań. Úlken ideyalar hám úlken ózgeris seni aldıńa alıp baradı.",
    },
    'business-administration': {
        'en': "You're a natural communicator who loves strategy and people in equal measure. Business gives you a platform to lead, build teams, and shape organizations that serve both profit and purpose.",
        'ru': "Ты прирождённый коммуникатор, которому в равной степени интересны стратегия и люди. Бизнес даёт тебе площадку, чтобы вести за собой, строить команды и формировать организации, служащие и прибыли, и смыслу.",
        'uz': "Sen strategiya va odamlarni teng darajada yaxshi ko'radigan tabiiy muloqotchisan. Biznes senga yetakchilik qilish, jamoalar qurish va ham foyda, ham maqsadga xizmat qiladigan tashkilotlarni shakllantirish uchun maydon beradi.",
        'kk': "Sen strategiya hám adamlardı teń dárejede jaqsı kóretuǵın tábiyi qatnaswshı. Biznes saǵan basshılıq etiw, komandalar qurıw hám payda hám maqsetke de xızmet etetuǵın shólkemlerdi qáliplestiriw ushın maydan beredi.",
    },
    'biology-pre-medicine': {
        'en': "You're fascinated by how living systems work and driven to make a difference in people's health. Medicine and biology let you combine deep scientific curiosity with a purpose-driven career.",
        'ru': "Тебя завораживает, как устроены живые системы, и ты стремишься менять к лучшему здоровье людей. Медицина и биология позволяют сочетать глубокую научную любознательность с карьерой, наполненной смыслом.",
        'uz': "Sen tirik tizimlarning qanday ishlashidan hayajonlanasan va odamlar salomatligiga o'zgarish kiritishga intilasan. Tibbiyot va biologiya chuqur ilmiy qiziquvchanlikni maqsadli kasb bilan birlashtirish imkonini beradi.",
        'kk': "Sen tiri sistemalardıń qalay isleytuǵınınan qızıqasań hám adamlar den-sawlıǵına ózgeris kirgiziwge umtılasań. Medicina hám biologiya teren ilimiy qızıqshańlıqtı maqsetli kásip menen birlestiriw imkanın beredi.",
    },
    'law-public-policy': {
        'en': "You're sharp, principled, and drawn to how rules and systems govern human life. Law lets you investigate, argue, and advocate — shaping society at the highest levels.",
        'ru': "Ты остр(а) умом, принципиален(-льна) и тебя тянет к тому, как правила и системы управляют жизнью людей. Право даёт тебе возможность исследовать, аргументировать и отстаивать — формируя общество на самом высоком уровне.",
        'uz': "Sen o'tkir aqlli, prinsipial va qoidalar hamda tizimlar inson hayotini qanday boshqarishiga qiziqasan. Huquq senga tekshirish, bahslashish va himoya qilish — jamiyatni eng yuqori darajada shakllantirish imkonini beradi.",
        'kk': "Sen ótkir aqıllı, prinsipial hám qaǵıydalar hám sistemalar adam ómirin qalay basqaratuǵının qızıǵasań. Huqıq saǵan tekseriw, dálellew hám qorǵaw — jamiyatti eń joqarı dárejede qáliplestiriw imkanın beredi.",
    },
    'finance-economics': {
        'en': "You're practical and strategic — you see the world in terms of systems, incentives, and outcomes. Economics and finance let you apply rigorous thinking to real decisions that move markets and organizations.",
        'ru': "Ты практичен(-на) и стратегичен(-на) — видишь мир через системы, стимулы и результаты. Экономика и финансы позволяют применять строгое мышление к реальным решениям, которые двигают рынки и организации.",
        'uz': "Sen amaliyotchi va strategiksan — dunyoni tizimlar, rag'batlar va natijalar nuqtai nazaridan ko'rasan. Iqtisod va moliya senga bozor va tashkilotlarni harakatga keltiradigan real qarorlarga qat'iy fikrlashni qo'llash imkonini beradi.",
        'kk': "Sen ámeliyatshı hám strategiyalıq — dúnyanı sistemalar, ınталандırıwlar hám nátiyjeler tárepinen kóresen. Ekonomika hám finans saǵan bazar hám shólkemlerdi háreketke keltiretuǵın real sheshimlerge qatań oylawdı qollanıw imkanın beredi.",
    },
    'management-information-systems': {
        'en': "You want to lead and build with technology as your tool. MIS sits at the crossroads of business strategy and tech — perfect for someone who wants to drive commercial value through systems thinking.",
        'ru': "Ты хочешь вести за собой и строить, используя технологии как инструмент. Управление ИС находится на пересечении бизнес-стратегии и технологий — идеально для тех, кто хочет создавать коммерческую ценность через системное мышление.",
        'uz': "Sen texnologiyani qurol sifatida ishlatib, yetakchilik qilish va qurishni xohlaysan. Axborot tizimlarini boshqarish biznes strategiyasi va texnologiya kesishmasida turadi — tizimli fikrlash orqali tijorat qiymati yaratmoqchi bo'lganlar uchun ideal.",
        'kk': "Sen texnologiyanı qural sıpatında paydalanıp, basshılıq etiw hám qurıwdı qálaysań. Aqparat sistemaların basqarıw biznes strategiyası hám texnologiyanıń kesispesinde turadı — sistemalı oylaw arqalı sawda qunlıǵın jaratıwdı qálaytuǵınlar ushın ideal.",
    },
    'marketing-advertising': {
        'en': "You're commercially-minded but creatively driven. You love persuasion, storytelling, and the mechanics of what makes people choose one thing over another. Marketing is your arena.",
        'ru': "Ты мыслишь по-коммерчески, но движим(а) креативностью. Тебе нравится убеждать, рассказывать истории и разбираться в механике того, почему люди выбирают одно вместо другого. Маркетинг — твоя арена.",
        'uz': "Sen tijorat fikrlashga egasan, lekin ijod bilan boshqarilasan. Ishontirish, hikoya qilish va odamlarni bir narsani boshqasidan afzal ko'rishga undaydigan mexanizmlarni yaxshi ko'rasan. Marketing — sening maydoning.",
        'kk': "Sen sawda oylawına iye, biraq dóretiwshilik menen basqarılasań. İsendiriw, hikaya aytıw hám adamlardıń bir nárseni ekinshisinen ustaz kóriwine sebep bolatuǵın mexanizmlerdi jaqsı kóresen. Marketing — seniń maydanıń.",
    },
}

# ─────────────────────────────────────────────────────────────────────────
# Question + option text translations, keyed by question id (1-30).
# EN comes from dinara-questions.json (SPEC) below, NOT retyped here.
# This dict holds only ru/uz/kk.
# ─────────────────────────────────────────────────────────────────────────
TRANSLATIONS = {
    1: {
        'ru': {'text': 'Какое занятие в свободные выходные звучит для тебя интереснее всего?', 'options': {
            'A': 'Решать логические головоломки или заниматься программированием',
            'B': 'Рисовать, писать или сочинять музыку',
            'C': 'Заниматься волонтёрством или помогать друзьям решать проблемы',
            'D': 'Читать об истории, науке или текущих событиях',
            'E': 'Строить или чинить что-то своими руками',
            'F': 'Планировать бизнес-идею или руководить клубом',
        }},
        'uz': {'text': "Bo'sh dam olish kunida qaysi mashg'ulot senga eng qiziqarli tuyuladi?", 'options': {
            'A': "Mantiqiy topishmoqlarni yechish yoki dasturlash loyihalari bilan shug'ullanish",
            'B': "Rasm chizish, yozish yoki musiqa yaratish",
            'C': "Volontyorlik qilish yoki do'stlarga muammolarini hal qilishda yordam berish",
            'D': "Tarix, fan yoki dolzarb voqealar haqida o'qish",
            'E': "Qo'llaring bilan biror narsa qurish yoki ta'mirlash",
            'F': "Biznes g'oyasini rejalashtirish yoki klubga rahbarlik qilish",
        }},
        'kk': {'text': 'Bos demalıs kúninde qaysı is-áreket seni eń qızıqtıradı?', 'options': {
            'A': 'Mantiqıy jumbaqlardı sheshiw yamasa programmalastırıw jobaları menen shuǵıllanıw',
            'B': 'Súwret sızıw, jazıw yamasa muzıka jaratıw',
            'C': 'Iqtıyarlı jardem beriw yamasa dosларıńa máselelerin sheshiwge járdem beriw',
            'D': 'Tariyx, ilim yamasa áktual waqıyalar haqqında oqıw',
            'E': 'Qollarıń menen bir nárseni qurıw yamasa jóndew',
            'F': 'Biznes ideyasın rejelestiriw yamasa klubqa basshılıq etiw',
        }},
    },
    2: {
        'ru': {'text': 'Какой предмет ты больше всего ждёшь в школе?', 'options': {
            'A': 'Математика или физика', 'B': 'Искусство, литература или кино',
            'C': 'Психология, социология или история', 'D': 'Биология, химия или география',
            'E': 'Инженерия, технологии или труд', 'F': 'Основы бизнеса или экономика',
        }},
        'uz': {'text': 'Maktabda qaysi fanni eng ko\'p sabrsizlik bilan kutasan?', 'options': {
            'A': 'Matematika yoki fizika', 'B': "San'at, adabiyot yoki kino",
            'C': 'Psixologiya, sotsiologiya yoki tarix', 'D': 'Biologiya, kimyo yoki geografiya',
            'E': 'Muhandislik, texnologiya yoki mehnat darsi', 'F': "Biznes asoslari yoki iqtisod",
        }},
        'kk': {'text': 'Mektepte qaysı pándi eń kóp sabırsızlıq penen kútesen?', 'options': {
            'A': 'Matematika yamasa fizika', 'B': 'Óner, ádebiyat yamasa kino',
            'C': 'Psixologiya, sotsiologiya yamasa tariyx', 'D': 'Biologiya, ximiya yamasa geografiya',
            'E': 'Injenerlik, texnologiya yamasa miynet sabaǵı', 'F': 'Biznes tiykarları yamasa ekonomika',
        }},
    },
    3: {
        'ru': {'text': 'Когда ты листаешь интернет ради развлечения, какой контент тебя больше всего привлекает?', 'options': {
            'A': 'Технологические новости, научные объяснения или обучающие видео',
            'B': 'Творческие портфолио и дизайн',
            'C': 'Документальные фильмы о людях или социальных проблемах',
            'D': 'Академические исследования или подробные статьи-разборы',
            'E': 'DIY-проекты, инженерия или выживание на природе',
            'F': 'Предпринимательство, финансы или саморазвитие',
        }},
        'uz': {'text': "Ko'ngil ochish uchun internetni ko'zdan kechirganingda, qanday kontent seni o'ziga tortadi?", 'options': {
            'A': "Texnologik yangiliklar, ilmiy tushuntirishlar yoki qo'llanmalar",
            'B': "Ijodiy portfolio va dizaynlar",
            'C': "Odamlar yoki ijtimoiy muammolar haqidagi hujjatli filmlar",
            'D': "Ilmiy tadqiqotlar yoki chuqur tahliliy maqolalar",
            'E': "O'z qo'lingcha loyihalar, muhandislik yoki tabiatda omon qolish",
            'F': "Tadbirkorlik, moliya yoki o'z-o'zini rivojlantirish",
        }},
        'kk': {'text': 'Kóńil ashıw ushın internetti aylanıp júrgeninde, qanday kontent seni ózine tartadı?', 'options': {
            'A': 'Texnologiyalıq jańalıqlar, ilimiy túsindirmeler yamasa oqıw qollanbaları',
            'B': 'Dóretiwshilik portfolyo hám dizaynlar',
            'C': 'Adamlar yamasa ijtimaiy máseleler haqqındaǵı húkkatli filmler',
            'D': 'Ilimiy izertlewler yamasa teren analizlik maqalalar',
            'E': 'Óz qolıń menen jasalatuǵın jobalar, injenerlik yamasa tábiyatta jasaw óneri',
            'F': 'Kásipkerlik, finans yamasa óz-ózin ósiriw',
        }},
    },
    4: {
        'ru': {'text': 'Опиши одну тему, о которой ты мог(ла) бы говорить часами и не заскучать. Что делает её увлекательной для тебя?'},
        'uz': {'text': 'Soatlab gapirsang ham zerikmaydigan bitta mavzuni ta\'riflab ber. Nima uni sen uchun shunchalik qiziqarli qiladi?'},
        'kk': {'text': 'Saatlap sóylesseń de jalıqpaytuǵın bir temanı súwretlep ber. Ne nárse onı seniń ushın sonshelli qızıqlı qıladı?'},
    },
    5: {
        'ru': {'text': 'Если бы ты мог(ла) бесплатно посетить любое мероприятие, что бы ты выбрал(а)?', 'options': {
            'A': 'Научную или технологическую выставку',
            'B': 'Открытие художественной галереи или музыкальный фестиваль',
            'C': 'Общественные дебаты или форум социальной справедливости',
            'D': 'Показ документального фильма о природе или дикой природе',
            'E': 'Соревнование по робототехнике или выставку мейкеров',
            'F': 'Конкурс питчей стартапов или бизнес-саммит',
        }},
        'uz': {'text': "Istalgan tadbirga bepul borish imkoniyating bo'lsa, qaysi birini tanlagan bo'larding?", 'options': {
            'A': 'Fan yoki texnologiya ko\'rgazmasi',
            'B': "San'at galereyasi ochilishi yoki musiqa festivali",
            'C': "Jamoat munozarasi yoki ijtimoiy adolat forumi",
            'D': "Tabiat yoki yovvoyi hayot haqidagi hujjatli film namoyishi",
            'E': "Robototexnika musobaqasi yoki meyker-yarmarka",
            'F': "Startap taqdimoti musobaqasi yoki biznes sammiti",
        }},
        'kk': {'text': 'Erkin tańlaw imkaniyatıń bolsa, qaysı sharadaǵı bekarge qatnasar edıń?', 'options': {
            'A': 'Ilim yamasa texnologiya kórgizbesi',
            'B': 'Óner galereyası ashılıwı yamasa muzıka festivalı',
            'C': 'Jamaatshılıq pikir-talas yamasa ijtimaiy ádalat forumı',
            'D': 'Tábiyat yamasa jabайı hayat haqqındaǵı húkkatli film kórsetiliwi',
            'E': 'Robototexnika sayısı yamasa meyker-jarmanke',
            'F': 'Startap taqdim-etiw sayısı yamasa biznes sammiti',
        }},
    },
    6: {
        'ru': {'text': 'Как тебе легче всего осваивать что-то новое?', 'options': {
            'A': 'Разбирая задачи шаг за шагом', 'B': 'Экспериментируя и наблюдая, что получится',
            'C': 'Обсуждая это с другими', 'D': 'Читая и глубоко изучая тему',
            'E': 'Создавая модель или прототип', 'F': 'Применяя это в реальной ситуации',
        }},
        'uz': {'text': "Yangi narsani eng yaxshi qanday o'zlashtirasan?", 'options': {
            'A': 'Masalalarni bosqichma-bosqich yechib', 'B': 'Tajriba qilib va natijasini kuzatib',
            'C': 'Boshqalar bilan muhokama qilib', 'D': 'Chuqur o\'qib va tadqiq qilib',
            'E': 'Model yoki prototip yasab', 'F': "Uni real vaziyatga qo'llab",
        }},
        'kk': {'text': 'Jańa nárseni eń jaqsı qalay úyrenesen?', 'options': {
            'A': 'Máselelerdi basqıshpa-basqısh sheship', 'B': 'Tájiriybe jasap hám nátiyjesin baqlap',
            'C': 'Basqalar menen talqılap', 'D': 'Teren oqıp hám izertlep',
            'E': 'Model yamasa prototip jasap', 'F': 'Onı real jaǵdayǵa qollanıp',
        }},
    },
    7: {
        'ru': {'text': 'В групповом проекте какую роль ты берёшь на себя естественно?', 'options': {
            'A': 'Того, кто продумывает систему или логику', 'B': 'Творческого генератора идей',
            'C': 'Того, кто улаживает споры и поддерживает общение', 'D': 'Исследователя, который находит все факты',
            'E': 'Того, кто строит и выполняет работу', 'F': 'Того, кто организует и ведёт команду',
        }},
        'uz': {'text': "Guruh loyihasida sen tabiiy ravishda qaysi rolni o'z zimmangga olasan?", 'options': {
            'A': 'Tizim yoki mantiqni ishlab chiquvchi', 'B': "G'oyalar tug'diruvchi ijodkor",
            'C': 'Munozaralarni yumshatuvchi va aloqani saqlovchi', 'D': 'Barcha faktlarni topuvchi tadqiqotchi',
            'E': 'Quruvchi va bajaruvchi', 'F': 'Jamoani tashkil etuvchi va boshqaruvchi',
        }},
        'kk': {'text': 'Top jobasında sen tábiyi túrde qaysı rolьdi ózińe alasań?', 'options': {
            'A': 'Sistema yamasa logikanı oylap tabıwshı', 'B': 'Ideyalar tuwdıratuǵın dóretiwshi',
            'C': 'Talas-tartıslardı jumsartıwshı hám baylanıstı saqlawshı', 'D': 'Barlıq faktlerdi tabatuǵın izertlewshi',
            'E': 'Quratuǵın hám orınlawshı', 'F': 'Komandanı shólkemlestiriwshi hám basqarıwshı',
        }},
    },
    8: {
        'ru': {'text': 'У тебя задание на 10 страниц. Как ты к нему подойдёшь?', 'options': {
            'A': 'Составлю логичный план, а затем заполню каждый раздел',
            'B': 'Дам идеям течь свободно, а структуру наведу потом при редактировании',
            'C': 'Опрошу людей или соберу разные точки зрения',
            'D': 'Проведу глубокое исследование, прежде чем написать хоть слово',
            'E': 'Создам иллюстрации или модели параллельно с текстом',
            'F': 'Сосредоточусь на практических выводах и конкретных шагах',
        }},
        'uz': {'text': 'Senda 10 sahifalik topshiriq bor. Unga qanday yondashasan?', 'options': {
            'A': "Avval mantiqiy reja tuzib, so'ng har bo'limni to'ldiraman",
            'B': "Fikrlarni erkin oqizib, tuzilishini keyin tahrirlab to'g'irlayman",
            'C': "Odamlar bilan suhbatlashib yoki turli qarashlarni to'playman",
            'D': "Bir og'iz yozishdan oldin chuqur tadqiqot o'tkazaman",
            'E': "Yozish bilan bir qatorda vizual yoki modellar yarataman",
            'F': "Amaliy xulosalar va aniq harakat nuqtalariga e'tibor qarataman",
        }},
        'kk': {'text': 'Seniń 10 betlik tapsırmań bar. Oǵan qalay jantasasań?', 'options': {
            'A': 'Aldın logikalıq reje dúzip, soń hár bólimdi tolтıraман',
            'B': 'Pikirlerdi erkin aǵızıp, qurılısın soń redakциялап tuzetemen',
            'C': 'Adamlar menen ángime jasap yamasa túrли kózqaraslardı jıynayман',
            'D': 'Bir sóz jazbastan burın teren izertlew ótkeremen',
            'E': 'Jazıw menen bir qatarda vizual yamasa modeller jasayман',
            'F': 'Ámeliy juwmaqlar hám anıq háreket noqatlarına itibar qaratamán',
        }},
    },
    9: {
        'ru': {'text': 'В какой обстановке тебе лучше всего работается — тихой и в одиночку, в команде, на природе, в лаборатории, в студии? Опиши свою идеальную обстановку.'},
        'uz': {'text': 'Qanday muhitda eng yaxshi ishlaysan — jimjit va yolg\'iz, hamkorlikda, ochiq havoda, laboratoriyada, studiyada? O\'zingning ideal muhitingni ta\'riflab ber.'},
        'kk': {'text': 'Qanday orta-jaǵdayda eń jaqsı isleysen — tınıshlıqta hám jalǵız, birgelikte, ashıq hawada, laboratoriyada, studiyada? Óziniń ideal orta-jaǵdayıńdı súwretlep ber.'},
    },
    10: {
        'ru': {'text': 'Что из перечисленного даётся тебе легче всего от природы?', 'options': {
            'A': 'Замечать закономерности и находить ошибки в данных',
            'B': 'Создавать что-то оригинальное с нуля',
            'C': 'Считывать эмоции и находить контакт с людьми',
            'D': 'Задавать вопрос «почему» и докапываться до ответов',
            'E': 'Использовать инструменты или технологии, чтобы что-то создавать',
            'F': 'Убеждать людей и мыслить стратегически',
        }},
        'uz': {'text': "Quyidagilardan qaysi biri senga tabiiy ravishda eng oson keladi?", 'options': {
            'A': "Ma'lumotlardagi qonuniyatlarni payqash va xatolarni topish",
            'B': "Noldan original narsa yaratish",
            'C': "Hissiyotlarni his qilish va odamlar bilan aloqa o'rnatish",
            'D': '"Nega" deb so\'rab, javob izlash',
            'E': "Narsalarni yasash uchun asbob yoki texnologiyadan foydalanish",
            'F': "Odamlarni ishontirish va strategik fikrlash",
        }},
        'kk': {'text': 'Tómendegilerden qaysı biri seniń ushın tábiyi túrde eń ońay?', 'options': {
            'A': 'Málimatlardaǵı nızamlıqlardı bayqaw hám qátelerdi tabıw',
            'B': 'Nolden originaal nárse jaratıw',
            'C': 'Sezimlerdi túsiniw hám adamlar menen baylanıs ornatıw',
            'D': '"Nege" dep sorap, juwap izlew',
            'E': 'Nárselerdi jasaw ushın quraллар yamasa texnologiyadan paydalanıw',
            'F': 'Adamlardı isendiriw hám strategiyalıq oylaw',
        }},
    },
    11: {
        'ru': {'text': 'Другу нужна помощь. Что ты делаешь в первую очередь?', 'options': {
            'A': 'Помогаю логически разобраться в ситуации',
            'B': 'Придумываю творческое решение, о котором он не подумал',
            'C': 'В основном просто слушаю и поддерживаю эмоционально',
            'D': 'Изучаю варианты и делюсь тем, что нашёл(нашла)',
            'E': 'Помогаю сделать что-то практическое, чтобы решить проблему',
            'F': 'Помогаю составить план и начать действовать',
        }},
        'uz': {'text': 'Do\'stingga yordam kerak. Sen birinchi navbatda nima qilasan?', 'options': {
            'A': 'Vaziyatni mantiqan tushunishga yordam beraman',
            'B': "U o'ylab ko'rmagan ijodiy yechim taklif qilaman",
            'C': "Asosan tinglayman va hissiy jihatdan qo'llab-quvvatlayman",
            'D': 'Variantlarni o\'rganib, topganlarimni ulashaman',
            'E': "Muammoni hal qilish uchun amaliy narsa qilishga yordam beraman",
            'F': "Reja tuzishga va harakatga o'tishga yordam beraman",
        }},
        'kk': {'text': 'Dosıńa jardem kerek. Sen dáslep ne isleysen?', 'options': {
            'A': 'Jaǵdaydı logikalıq túrde túsiniwge jardem beremen',
            'B': 'Ol oylamaǵan dóretiwshilik sheshimin usınaman',
            'C': 'Kóbinese tıńlayман hám sezimlik jaqtan qollap-quwatlayман',
            'D': 'Variantlardı úyrenip, tapqanlarımdı bólisemen',
            'E': 'Máseleni sheshiw ushın ámeliy nárse isleuge jardem beremen',
            'F': 'Reje dúziwge hám háreketke ótiwge jardem beremen',
        }},
    },
    12: {
        'ru': {'text': 'Что из этого — твой самый сильный академический навык?', 'options': {
            'A': 'Математика и количественное мышление', 'B': 'Визуальное мышление и дизайн',
            'C': 'Письмо и устная коммуникация', 'D': 'Научные или исторические исследования',
            'E': 'Практические технические навыки', 'F': 'Организация и лидерство',
        }},
        'uz': {'text': 'Quyidagilardan qaysi biri sening eng kuchli akademik ko\'nikmang?', 'options': {
            'A': 'Matematika va miqdoriy fikrlash', 'B': 'Vizual fikrlash va dizayn',
            'C': "Yozish va og'zaki muloqot", 'D': 'Ilmiy yoki tarixiy tadqiqot',
            'E': 'Amaliy texnik ko\'nikmalar', 'F': 'Tashkilotchilik va yetakchilik',
        }},
        'kk': {'text': 'Tómendegilerden qaysı biri seniń eń kúshli akademиялыq kónlikpeń?', 'options': {
            'A': 'Matematika hám mugdarlıq oylaw', 'B': 'Vizual oylaw hám dizayn',
            'C': 'Jazıw hám aǵзaki qatnas', 'D': 'Ilimiy yamasa tariyxıy izertlew',
            'E': 'Ámeliy texnikalıq kónlikpeler', 'F': 'Shólkemlestiriw hám basshılıq',
        }},
    },
    13: {
        'ru': {'text': 'Что ты сделал(а), построил(а), организовал(а) или создал(а) такого, чем гордишься? Какие навыки для этого понадобились?'},
        'uz': {'text': "Yasagan, qurgan, tashkil etgan yoki yaratgan narsalaringdan qay biri bilan faxrlanasan? Bunda qanday ko'nikmalardan foydalanding?"},
        'kk': {'text': 'Jasaǵan, qurǵan, shólkemlestirgen yamasa jaratqan nárseleriniń qaysısı menen maqtanasań? Bunda qanday kónlikpelerden paydalandıń?'},
    },
    14: {
        'ru': {'text': 'Что для тебя важнее всего в будущей карьере?', 'options': {
            'A': 'Решать сложные задачи, раздвигающие границы возможного',
            'B': 'Выражать свою креативность в значимой работе',
            'C': 'Помогать людям и вносить вклад в общество',
            'D': 'Открывать новые знания или истину',
            'E': 'Создавать вещи, которые реально работают в мире',
            'F': 'Строить что-то значимое или добиваться лидерства',
        }},
        'uz': {'text': 'Kelajakdagi kasbingda sen uchun eng muhimi nima?', 'options': {
            'A': "Chegaralarni kengaytiradigan murakkab muammolarni yechish",
            'B': "Ijodkorligimni mazmunli ishda ifodalash",
            'C': "Odamlarga yordam berish va jamiyatga hissa qo'shish",
            'D': "Yangi bilim yoki haqiqatni kashf etish",
            'E': "Real dunyoda ishlaydigan narsalarni yaratish",
            'F': "Ta'sirchan narsa qurish yoki yetakchilikka erishish",
        }},
        'kk': {'text': 'Kelešekтеgi kásibiniń seniń ushın eń zárúrlisi ne?', 'options': {
            'A': 'Shegaralardı keńeytetugin quramalı máselelerdi sheshiw',
            'B': 'Dóretiwshiligimdi mánili iste bildiriw',
            'C': 'Adamlarǵa jardem beriw hám jamiyatqa úles qosıw',
            'D': 'Jańa bilim yamasa haqıyqattı ashıw',
            'E': 'Real dúnyada isleytuǵın nárselerdi jaratıw',
            'F': 'Tásirli nárse qurıw yamasa basshılıqqa erisiw',
        }},
    },
    15: {
        'ru': {'text': 'Через 15 лет — каким ты представляешь свой рабочий день?', 'options': {
            'A': 'Работа с техническими системами, кодом или исследованиями',
            'B': 'Создание контента, дизайна или выступлений',
            'C': 'Прямая работа с людьми — клиентами, пациентами, студентами',
            'D': 'Проведение исследований или анализ данных',
            'E': 'Эксплуатация, проектирование или контроль физических систем',
            'F': 'Руководство командой, компанией или организацией',
        }},
        'uz': {'text': '15 yildan keyin ish kuningni qanday tasavvur qilasan?', 'options': {
            'A': "Texnik tizimlar, kod yoki tadqiqot bilan ishlash",
            'B': "Kontent, dizayn yoki chiqishlar yaratish",
            'C': "Odamlar bilan bevosita ishlash — mijozlar, bemorlar, talabalar",
            'D': "Tadqiqot olib borish yoki ma'lumotlarni tahlil qilish",
            'E': "Jismoniy tizimlarni boshqarish, loyihalash yoki nazorat qilish",
            'F': "Jamoa, kompaniya yoki tashkilotni boshqarish",
        }},
        'kk': {'text': '15 jıldan soń jumıs kúniniń qanday bolıwın kóz aldına keltiresen?', 'options': {
            'A': 'Texnikalıq sistemalar, kod yamasa izertlew menen isleu',
            'B': 'Kontent, dizayn yamasa shıǵıwlar jaratıw',
            'C': 'Adamlar menen tikkeley isleu — klientler, naukaslar, studentler',
            'D': 'Izertlew alıp barıw yamasa málimatlardı analiz etiw',
            'E': 'Fizikalıq sistemalardı basqarıw, loyihalastırıw yamasa nazarлaw',
            'F': 'Komanda, kompaniya yamasa shólkemди basqarıw',
        }},
    },
    16: {
        'ru': {'text': 'Насколько важен для тебя потенциальный заработок при выборе сферы?', 'options': {
            'A': 'Очень важен — хочу высокий доход', 'B': 'Довольно важен, но не главный приоритет',
            'C': 'Не очень важен — смысл работы важнее', 'D': 'Хочу баланс между смыслом и оплатой',
            'E': 'Рассчитываю хорошо зарабатывать за счёт навыков и экспертизы',
            'F': 'Планирую построить капитал через предпринимательство',
        }},
        'uz': {'text': "Sohani tanlashda moliyaviy daromad imkoniyati sen uchun qanchalik muhim?", 'options': {
            'A': 'Juda muhim — yuqori daromad xohlayman', 'B': 'Ma\'lum darajada muhim, lekin asosiy ustuvorlik emas',
            'C': "Unchalik muhim emas — ishning ma'nosi muhimroq", 'D': "Ma'no va maoshning muvozanatini xohlayman",
            'E': "Ko'nikma va tajribam orqali yaxshi daromad topishni kutaman",
            'F': "Tadbirkorlik orqali boylik yaratishni rejalashtiraman",
        }},
        'kk': {'text': 'Sala tańlawda finanslıq tabıs imkaniyatı seniń ushın qanshelli áhmiyetli?', 'options': {
            'A': 'Júdá áhmiyetli — joqarı tabıs qálaймán', 'B': 'Belgili dárejede áhmiyetli, biraq tiykarǵı basımlıq emes',
            'C': 'Onshelli áhmiyetli emes — jumıstıń mánisi áhmiyetlirek', 'D': 'Máni menen aylıqtıń balансын qálaймán',
            'E': 'Kónlikpe hám tájiriybem arqalı jaqsı tabıs tabıwdı kútemen',
            'F': 'Kásipkerlik arqalı bайлыq jaratıwdı rejelestiremen',
        }},
    },
    17: {
        'ru': {'text': 'Какое влияние ты хочешь оказать на мир? Опиши это настолько конкретно или широко, как хочешь.'},
        'uz': {'text': 'Dunyoga qanday ta\'sir qoldirishni xohlaysan? Xohlagancha aniq yoki keng ta\'riflashing mumkin.'},
        'kk': {'text': 'Dúnyaǵa qanday tásir qaldırıwdı qálaysań? Qálegenińше anıq yamasa keń súwretlewiń múmkin.'},
    },
    18: {
        'ru': {'text': 'Над какой глобальной проблемой ты хотел(а) бы работать больше всего?', 'options': {
            'A': 'Изменение климата и экологическая устойчивость',
            'B': 'Бедность и экономическое неравенство',
            'C': 'Психическое здоровье и благополучие людей',
            'D': 'Достижения в медицине или науке',
            'E': 'Инфраструктура, технологии и инновации',
            'F': 'Политика, госуправление или социальные системы',
        }},
        'uz': {'text': 'Qaysi global muammo ustida ishlashni eng ko\'p xohlaysan?', 'options': {
            'A': 'Iqlim o\'zgarishi va ekologik barqarorlik',
            'B': 'Qashshoqlik va iqtisodiy tengsizlik',
            'C': 'Ruhiy salomatlik va inson farovonligi',
            'D': "Tibbiyot yoki fandagi yutuqlar",
            'E': 'Infratuzilma, texnologiya va innovatsiya',
            'F': 'Siyosat, boshqaruv yoki ijtimoiy tizimlar',
        }},
        'kk': {'text': 'Qaysı global máseleniń ústinde islewdi eń kóp qálaysań?', 'options': {
            'A': 'İklim ózgeriwi hám ekologiyalıq turaqlılıq',
            'B': 'Kámbaǵallıq hám ekonomikalıq teńsizlik',
            'C': 'Ruwxıy den-sawlıq hám adam abadanshılıǵı',
            'D': 'Medicinadaǵı yamasa ilimdegi jetiskenlikler',
            'E': 'Infrastruktura, texnologiya hám innovatsiya',
            'F': 'Siyasat, basqarıw yamasa ijtimaiy sistemalar',
        }},
    },
    19: {
        'ru': {'text': 'Какое слово лучше всего тебя описывает?', 'options': {
            'A': 'Аналитичный(-ая)', 'B': 'С развитым воображением', 'C': 'Эмпатичный(-ая)',
            'D': 'Любопытный(-ая)', 'E': 'Практичный(-ая)', 'F': 'Амбициозный(-ая)',
        }},
        'uz': {'text': 'Qaysi so\'z seni eng yaxshi ta\'riflaydi?', 'options': {
            'A': 'Analitik', 'B': "Tasavvurga boy", 'C': 'Hamdard (empatik)',
            'D': 'Qiziquvchan', 'E': 'Amaliyotchi', 'F': 'Shijoatli',
        }},
        'kk': {'text': 'Qaysı sóz seni eń jaqsı súwretleydi?', 'options': {
            'A': 'Analitik', 'B': 'Qıяllawshı', 'C': 'Empatиялı',
            'D': 'Qızıqшań', 'E': 'Ámeliyatshı', 'F': 'Ambisialı',
        }},
    },
    20: {
        'ru': {'text': 'Когда тебе нужно принять сложное решение, ты обычно:', 'options': {
            'A': 'Составляешь список плюсов/минусов и анализируешь данные',
            'B': 'Идёшь за тем, что кажется вдохновляющим или оригинальным',
            'C': 'Спрашиваешь мнение других и учитываешь чувства каждого',
            'D': 'Изучаешь вопрос, пока не почувствуешь себя полностью информированным(-ой)',
            'E': 'Пробуешь что-то и корректируешь по ходу дела',
            'F': 'Думаешь о стратегии в целом',
        }},
        'uz': {'text': "Qiyin qaror qabul qilishing kerak bo'lganda, odatda:", 'options': {
            'A': "Ijobiy/salbiy tomonlar ro'yxatini tuzib, ma'lumotlarni tahlil qilasan",
            'B': "Ilhomlantiradigan yoki original tuyulgan narsaga ergashasan",
            'C': "Boshqalarning fikrini so'rab, hamma his-tuyg'ularini hisobga olasan",
            'D': "To'liq xabardor bo'lguncha tadqiqot qilasan",
            'E': "Biror narsani sinab ko'rib, natijaga qarab moslashasan",
            'F': "Umumiy strategiya haqida o'ylaysan",
        }},
        'kk': {'text': 'Qıyın sheshim qabıl etiw kerek bolǵanda, ádette:', 'options': {
            'A': 'Oń/teris tárеплердиń dizimin dúzip, málimatlardı analiz etesen',
            'B': 'Ilhamlandıratuǵın yamasa original bolıp kóringen nársege ereesen',
            'C': 'Basqalardıń pikirin sorap, hámmeniń sezimlerin esapqa alasań',
            'D': 'Tolıq xabardar bolǵanша izertlew jasaysań',
            'E': 'Bir nárseni sınap kórip, nátiyjege qaray ıńǵaylasasań',
            'F': 'Ulıwma strategiya haqqında oylaysań',
        }},
    },
    21: {
        'ru': {'text': 'Насколько комфортно ты чувствуешь себя в неопределённости или с открытыми задачами?', 'options': {
            'A': 'Обожаю открытые задачи — расцветаю в неопределённости',
            'B': 'Предпочитаю творческую свободу без фиксированного ответа',
            'C': 'Мне важна хотя бы ясность в человеческой/социальной стороне',
            'D': 'Мне нормально, пока я могу продолжать исследовать',
            'E': 'Предпочитаю практические задачи с реальным результатом',
            'F': 'Предпочитаю чёткие цели и измеримые результаты',
        }},
        'uz': {'text': "Noaniqlik yoki ochiq masalalarda o'zingni qanchalik erkin his qilasan?", 'options': {
            'A': "Ochiq masalalarni yaxshi ko'raman — noaniqlikda gullab-yashnayman",
            'B': "Qat'iy javobsiz ijodiy erkinlikni afzal ko'raman",
            'C': "Hech bo'lmasa inson/ijtimoiy tomonda aniqlik bo'lishini istayman",
            'D': "Tadqiqot qilishda davom eta olsam, menga yetadi",
            'E': "Real natijali amaliy masalalarni afzal ko'raman",
            'F': "Aniq maqsad va o'lchanadigan natijalarni afzal ko'raman",
        }},
        'kk': {'text': 'Anıqsızlıq yamasa ashıq máselelerde ózińdi qanshelli erkin sezesen?', 'options': {
            'A': 'Ashıq máselelerdi jaqsı kóremen — anıqsızlıqta gúlleymen',
            'B': 'Qatań juwapsız dóretiwshilik erkinligin qálaймán',
            'C': 'Hesh bolmaǵanda adam/ijtimaiy tárepte anıqlıq bolıwın qálaймán',
            'D': 'İzertlewdi dawам etе alsam, maǵan jetkilikli',
            'E': 'Real nátiyjeli ámeliy máselelerди qálaймán',
            'F': 'Anıq maqset hám ólшenetuǵın nátiyjelerди qálaймán',
        }},
    },
    22: {
        'ru': {'text': 'Твой идеальный размер команды для работы:', 'options': {
            'A': 'Один(одна) — лучше всего работаю самостоятельно',
            'B': 'Небольшая творческая команда (2–4 человека)',
            'C': 'Разнообразная команда с сотрудничеством',
            'D': 'Партнёрство с исследователем или наставником',
            'E': 'Техническая команда с общей экспертизой',
            'F': 'Полноценная команда, которой я могу руководить',
        }},
        'uz': {'text': 'Ishlash uchun ideal jamoa hajmi:', 'options': {
            'A': "Yolg'iz — eng yaxshi ishimni yakka o'zim qilaman",
            'B': "Kichik ijodiy jamoa (2–4 kishi)",
            'C': "Turli-tuman hamkorlik guruhi",
            'D': "Tadqiqotchi hamkor yoki murabbiy bilan munosabat",
            'E': "Umumiy tajribaga ega texnik jamoa",
            'F': "Men boshqara oladigan to'liq jamoa",
        }},
        'kk': {'text': 'Isleu ushın ideal komanda kólemi:', 'options': {
            'A': 'Jalǵız — eń jaqsı jumıstı ózim ǵана isleymen',
            'B': 'Kishкене dóretiwshilik komanda (2–4 adam)',
            'C': 'Aluан-túrли birgeликтеги tobыр',
            'D': 'İzertlewshi sherik yamasa ustaz bilan qatnas',
            'E': 'Ulıwma tájiriybege ıйе texnikalıq komanda',
            'F': 'Men basqara alatuǵın tolıq komanda',
        }},
    },
    23: {
        'ru': {'text': 'Как тебя описывают друзья или семья? За чем они всегда обращаются к тебе?'},
        'uz': {'text': 'Do\'stlaring yoki oilang seni qanday ta\'riflaydi? Ular doim nima uchun senga murojaat qiladi?'},
        'kk': {'text': 'Dosların yamasa семьяń seni qalay súwretleydi? Olar hámiyshe ne ushın saǵan murájat etedi?'},
    },
    24: {
        'ru': {'text': 'Какое из этих названий профессий привлекает тебя больше всего?', 'options': {
            'A': 'Инженер-программист / специалист по данным',
            'B': 'Архитектор / кинорежиссёр / писатель',
            'C': 'Социальный работник / терапевт / учитель',
            'D': 'Учёный-исследователь / историк / журналист',
            'E': 'Инженер-строитель / хирург / пилот',
            'F': 'Генеральный директор / политик / директор по маркетингу',
        }},
        'uz': {'text': 'Quyidagi kasb nomlaridan qaysi biri senga eng ko\'p yoqadi?', 'options': {
            'A': "Dasturiy ta'minot muhandisi / ma'lumotlar olimi",
            'B': "Arxitektor / kinorejissyor / yozuvchi",
            'C': "Ijtimoiy xodim / terapevt / o'qituvchi",
            'D': "Ilmiy tadqiqotchi / tarixchi / jurnalist",
            'E': "Qurilish muhandisi / jarroh / uchuvchi",
            'F': "Bosh direktor / siyosatchi / marketing direktori",
        }},
        'kk': {'text': 'Tómendegi kásip atlarınıń qaysısı saǵan eń kóp unaydı?', 'options': {
            'A': 'Programmalıq támiynlew injeneri / málimat alımı',
            'B': 'Arxitektor / kinorejissyor / jazıwshı',
            'C': 'Ijtimaiy xızmetker / terapevt / oqıtıwshı',
            'D': 'Ilimiy izertlewshi / tariyxshı / jurnalist',
            'E': 'Qurılıs injeneri / xirurg / ushıwшı',
            'F': 'Bas direktor / siyasatshı / marketing direktorı',
        }},
    },
    25: {
        'ru': {'text': 'Как ты относишься к постоянной работе с числами и данными?', 'options': {
            'A': 'Обожаю — данные это моя зона комфорта',
            'B': 'Могу использовать при необходимости, но предпочитаю творческую работу',
            'C': 'Предпочитаю работу с людьми, а не с цифрами',
            'D': 'Мне нравится использовать данные для поддержки исследований',
            'E': 'Использую данные в техническом или практическом контексте',
            'F': 'Использую данные для бизнес-решений и стратегии',
        }},
        'uz': {'text': 'Doimiy ravishda raqamlar va ma\'lumotlar bilan ishlashga munosabating qanday?', 'options': {
            'A': "Yaxshi ko'raman — ma'lumotlar mening qulay hududim",
            'B': "Kerak bo'lsa foydalanaman, lekin ijodiy ishni afzal ko'raman",
            'C': "Raqamlardan ko'ra odamlarga qaratilgan ishni afzal ko'raman",
            'D': "Tadqiqotni qo'llab-quvvatlash uchun ma'lumotlardan foydalanishni yoqtiraman",
            'E': "Ma'lumotlardan texnik yoki amaliy kontekstda foydalanaman",
            'F': "Ma'lumotlardan biznes qarorlari va strategiya uchun foydalanaman",
        }},
        'kk': {'text': 'Turaqlı túrde sanlar hám málimatlar menen isleuge qatnasıń qanday?', 'options': {
            'A': 'Jaqsı kóремен — málimatlar meniń qolayлı zonam',
            'B': 'Kerek bolsa paydalanaман, biraq dóretiwshilik jumıстı qálaймán',
            'C': 'Sanlардан góre adamlarǵa qaratılǵan jumıstı qálaймán',
            'D': 'İzertlewди qollap-quwatlaw ушın málimatlardan paydalanıwdı jaqsı kóремен',
            'E': 'Málimatlardan texnikалıq yamasa ámeliy kontekste paydalanaман',
            'F': 'Málimatlardan biznes sheshimleri hám strategiya ушın paydalanaман',
        }},
    },
    26: {
        'ru': {'text': 'Что бы ты предпочёл(предпочла) — учёбу за рубежом, стажировку или самостоятельное исследование?', 'options': {
            'A': 'Учиться за рубежом в технологическом центре вроде Кремниевой долины',
            'B': 'Погрузиться в художественный или культурный опыт',
            'C': 'Пройти стажировку в социальной сфере или волонтёрство',
            'D': 'Провести самостоятельное академическое исследование за рубежом',
            'E': 'Пройти техническую или инженерную стажировку',
            'F': 'Стажироваться в стартапе или в органах госполитики',
        }},
        'uz': {'text': 'Chet elda o\'qish, amaliyot o\'tash yoki mustaqil tadqiqot o\'tkazishdan qay birini afzal ko\'rasan?', 'options': {
            'A': "Silikon vodiysi kabi texnologik markazda chet elda o'qish",
            'B': "San'at yoki madaniy sho'ng'ish tajribasini yaratish",
            'C': "Ijtimoiy yoki jamoat xizmati amaliyotini o'tash",
            'D': "Chet elda mustaqil ilmiy tadqiqot o'tkazish",
            'E': "Texnik yoki muhandislik amaliyotini o'tash",
            'F': "Startapda yoki davlat siyosati idorasida amaliyot o'tash",
        }},
        'kk': {'text': 'Shet elde oqıw, ámeliyat ótkeriw yamasa ǵárезсиз izertlew alıp barıwdıń qaysısın qálaysań?', 'options': {
            'A': 'Kremniy alqabı sıyaqlı texnologiyalıq orayda shet elde oqıw',
            'B': 'Óner yamasa mádeniy siniw tájiriybesin jaratıw',
            'C': 'Ijtimaiy yamasa jamaatshılıq xızmet ámeliyatın ótkeriw',
            'D': 'Shet elde ǵárезсиз ilimiy izertlew alıp barıw',
            'E': 'Texnikalıq yamasa injenerlik ámeliyatın ótkeriw',
            'F': 'Startapta yamasa mámleket siyasatı bóliminde ámeliyat ótkeriw',
        }},
    },
    27: {
        'ru': {'text': 'Какой студенческий опыт вдохновляет тебя больше всего?', 'options': {
            'A': 'Хакатоны и соревнования по решению задач',
            'B': 'Показ творческих работ на студенческих выставках',
            'C': 'Руководство клубом общественной службы',
            'D': 'Публикация исследования в студенческом журнале',
            'E': 'Работа над итоговым техническим проектом',
            'F': 'Руководство студенческим бизнесом или дебатным клубом',
        }},
        'uz': {'text': 'Qaysi turdagi talabalik tajribasi seni eng ko\'p ilhomlantiradi?', 'options': {
            'A': "Xakatonlar va masala yechish musobaqalari",
            'B': "Talabalar ko'rgazmalarida ijodiy ishlarni namoyish qilish",
            'C': "Jamoat xizmati klubiga rahbarlik qilish",
            'D': "Talabalar jurnalida tadqiqot chop etish",
            'E': "Yakuniy texnik loyiha ustida ishlash",
            'F': "Talabalar biznesi yoki bahs-munozara jamoasini boshqarish",
        }},
        'kk': {'text': 'Qaysı túрдegi student tájiriybesi seni eń kóp ilhamlandıradı?', 'options': {
            'A': 'Xakatonlar hám másele sheshiw sayısları',
            'B': 'Student kórgizbelerinde dóretiwshilik jumıслардı kórsetiw',
            'C': 'Jamaatшılıq xızmet klubına basshılıq etiw',
            'D': 'Student jurnalında izertlewди jariyalaw',
            'E': 'Aqırǵı texnikalıq joba ústinde islew',
            'F': 'Student biznesi yamasa pikir-talas komandasın basqarıw',
        }},
    },
    28: {
        'ru': {'text': 'В какой из этих отраслей тебе было бы гордостью работать?', 'options': {
            'A': 'Технологии или аэрокосмическая отрасль',
            'B': 'Развлечения, медиа или дизайн',
            'C': 'Здравоохранение, образование или некоммерческие организации',
            'D': 'Наука, право или государственная политика',
            'E': 'Строительство, энергетика или производство',
            'F': 'Финансы, консалтинг или политика',
        }},
        'uz': {'text': 'Quyidagi sohalardan qaysi birida ishlash bilan faxrlangan bo\'larding?', 'options': {
            'A': 'Texnologiya yoki aerokosmik soha',
            'B': "Ko'ngilochar, media yoki dizayn",
            'C': "Sog'liqni saqlash, ta'lim yoki notijorat tashkilotlar",
            'D': "Ilm-fan, huquq yoki davlat siyosati",
            'E': "Qurilish, energetika yoki ishlab chiqarish",
            'F': "Moliya, konsalting yoki siyosat",
        }},
        'kk': {'text': 'Tómendegi salalardıń qaysısında isleu менен maqtanar edıń?', 'options': {
            'A': 'Texnologiya yamasa aerokosmiyalıq sala',
            'B': 'Kóńil ashıw, media yamasa dizayn',
            'C': 'Densawlıqtı saqlaw, bilimlendiriw yamasa payda kózlемеyтуǵın shólkemler',
            'D': 'Ilim, huqıq yamasa mámleket siyasatı',
            'E': 'Qurılıs, energetika yamasa óndiris',
            'F': 'Finans, konsalting yamasa siyasat',
        }},
    },
    29: {
        'ru': {'text': 'Есть ли человек — реальный или вымышленный — чьим карьерным путём ты восхищаешься? Что именно в его работе тебя вдохновляет?'},
        'uz': {'text': 'Kasbiy yo\'lidan hayratlanadigan biror shaxs — real yoki xayoliy — bormi? Uning ishida seni nima ilhomlantiradi?'},
        'kk': {'text': 'Kásiplik jolınан tán qaldıratuǵın adam — real yamasa oylap tabılǵan — barма? Onıń jumısında seni ne ilhamlandıradı?'},
    },
    30: {
        'ru': {'text': 'И последнее: когда ты представляешь себя в лучшей форме, полностью в своей стихии — чем ты занят(а)?', 'options': {
            'A': 'Решаю сложную техническую или научную задачу',
            'B': 'Создаю что-то, что трогает или вдохновляет людей',
            'C': 'Помогаю кому-то справиться со сложной ситуацией',
            'D': 'Открываю или объясняю то, чего раньше никто не знал',
            'E': 'Создаю что-то осязаемое, что работает идеально',
            'F': 'Веду других к цели, которая по-настоящему важна',
        }},
        'uz': {'text': 'Va nihoyat: o\'zingni eng yaxshi holatda, to\'liq o\'z muhitingda tasavvur qilganingda — nima qilyapsan?', 'options': {
            'A': "Qiyin texnik yoki ilmiy masalani yechyapman",
            'B': "Odamlarni to'lqinlantiradigan yoki ilhomlantiradigan narsa yaratyapman",
            'C': "Kimgadir qiyin vaziyatni yengishga yordam beryapman",
            'D': "Hech kim bilmagan narsani kashf etyapman yoki tushuntiryapman",
            'E': "Mukammal ishlaydigan, qo'l bilan ushlanadigan narsa qurayapman",
            'F': "Boshqalarni muhim maqsad sari yetaklayapman",
        }},
        'kk': {'text': 'Hám aqırında: ózińdi eń jaqsı halda, tolıq óz ortańda kóz aldına keltirgeninde — ne isлеп turısан?', 'options': {
            'A': 'Qıyın texnikalıq yamasa ilimiy máseleni sheship turмán',
            'B': 'Adamlardı tolqınlandıратuǵın yamasa ilhamlandıратuǵın nárse jaratıp turмán',
            'C': 'Birewge qıyın jaǵdaydan shıǵıwǵa jardem berip turмán',
            'D': 'Hesh kim bilmegen nárseni ashıp turмán yamasa túsindirip turмán',
            'E': 'Mukammal isleйтуǵın, qol menen usınатuǵın nárse qurıp turмán',
            'F': 'Basqalardı áhmiyetli maqsetke qaray alıp barıp turмán',
        }},
    },
}

# ─────────────────────────────────────────────────────────────────────────
# UI chrome — intro / progress / nav / analyzing / results / errors.
# ─────────────────────────────────────────────────────────────────────────
CHROME = {
    'intro.eyebrow': {'en': 'AI Major Match', 'ru': 'AI-подбор специальности', 'uz': 'AI-mutaxassislik moslashuvi', 'kk': 'AI-kásip sáykestigi'},
    'intro.title': {'en': 'Find the major that actually fits you', 'ru': 'Найди специальность, которая тебе действительно подходит', 'uz': 'Senga haqiqatan mos keladigan mutaxassislikni top', 'kk': 'Saǵan haqıyqatınан sáykes keletuǵın kásipti tap'},
    'intro.subtitle': {'en': 'Answer {{total}} short questions about how you think, learn, and want to work. Takes about 5 minutes.', 'ru': 'Ответь на {{total}} коротких вопросов о том, как ты думаешь, учишься и хочешь работать. Займёт около 5 минут.', 'uz': 'Qanday o\'ylashing, o\'rganishing va ishlashni xohlashing haqida {{total}} ta qisqa savolga javob ber. Taxminan 5 daqiqa vaqt oladi.', 'kk': 'Qalay oylawıń, úyreniwiń hám isleuди qálewiń haqqında {{total}} qısqa soraw ǵа juwap ber. Bola-boliw 5 minut waqıt aladı.'},
    'intro.startCta': {'en': 'Start the assessment', 'ru': 'Начать тест', 'uz': 'Testni boshlash', 'kk': 'Testti baslaw'},
    'intro.resumeCta': {'en': 'Continue where you left off', 'ru': 'Продолжить с того места, где остановился(-ась)', 'uz': 'To\'xtagan joyingdan davom ettirish', 'kk': 'Toqtaǵan orınnan dawam ettiriw'},
    'intro.estimatedTime': {'en': 'About 5 minutes', 'ru': 'Около 5 минут', 'uz': 'Taxminan 5 daqiqa', 'kk': 'Bola-boliw 5 minut'},
    'intro.questionCount': {'en': '{{total}} questions', 'ru': '{{total}} вопросов', 'uz': '{{total}} ta savol', 'kk': '{{total}} soraw'},
    'intro.sectionCount': {'en': '6 sections', 'ru': '6 разделов', 'uz': '6 ta bo\'lim', 'kk': '6 bólim'},
    'intro.viewResultsCta': {'en': 'View your results', 'ru': 'Посмотреть результаты', 'uz': 'Natijalaringni ko\'rish', 'kk': 'Nátiyjelerińdi kóriw'},
    'intro.retakeCta': {'en': 'Retake the assessment', 'ru': 'Пройти тест заново', 'uz': 'Testni qayta topshirish', 'kk': 'Testti qайта tapsırıw'},
    'intro.completedNotice': {'en': "You've already completed this assessment.", 'ru': 'Ты уже прошёл(прошла) этот тест.', 'uz': 'Sen bu testni allaqachon topshirgansan.', 'kk': 'Sen bul testti burın-al tapsırdıń.'},
    'intro.draftRestoredNotice': {'en': 'We restored your in-progress answers from last time.', 'ru': 'Мы восстановили твои ответы с прошлого раза.', 'uz': 'Oldingi javoblaringni tikladik.', 'kk': 'Aldınǵı juwaplarıńdı tikledik.'},
    'intro.discardDraftCta': {'en': 'Start over', 'ru': 'Начать заново', 'uz': 'Qaytadan boshlash', 'kk': 'Qайта baslaw'},
    'progress.sectionLabel': {'en': 'Section {{current}} of {{totalSections}}', 'ru': 'Раздел {{current}} из {{totalSections}}', 'uz': '{{totalSections}} tadan {{current}}-bo\'lim', 'kk': '{{totalSections}} nan {{current}}-bólim'},
    'progress.questionLabel': {'en': 'Question {{current}} of {{total}}', 'ru': 'Вопрос {{current}} из {{total}}', 'uz': '{{total}} tadan {{current}}-savol', 'kk': '{{total}} den {{current}}-soraw'},
    'nav.back': {'en': 'Back', 'ru': 'Назад', 'uz': 'Orqaga', 'kk': 'Artqa'},
    'nav.next': {'en': 'Next', 'ru': 'Далее', 'uz': 'Keyingisi', 'kk': 'Keyingisi'},
    'nav.submit': {'en': 'See my results', 'ru': 'Посмотреть результаты', 'uz': 'Natijalarimni ko\'rish', 'kk': 'Nátiyjelerimdi kóriw'},
    'nav.exit': {'en': 'Save & exit', 'ru': 'Сохранить и выйти', 'uz': 'Saqlab chiqish', 'kk': 'Saqlap shıǵıw'},
    'shortAnswer.optionalHint': {'en': "Optional — this won't affect your results.", 'ru': 'Необязательно — не влияет на результат.', 'uz': 'Ixtiyoriy — natijangga ta\'sir qilmaydi.', 'kk': 'Iqtıyariy — nátiyjeńe tásir etpeydi.'},
    'shortAnswer.placeholder': {'en': 'Type your answer here...', 'ru': 'Введи свой ответ здесь...', 'uz': 'Javobingni shu yerga yoz...', 'kk': 'Juwabıńdı usı jerге jaz...'},
    'validation.selectOption': {'en': 'Please select an option to continue.', 'ru': 'Пожалуйста, выбери вариант, чтобы продолжить.', 'uz': 'Davom etish uchun variantni tanlang.', 'kk': 'Dawam etiw ushın variантты tańlań.'},
    'analyzing.title': {'en': 'Matching your answers...', 'ru': 'Анализируем твои ответы...', 'uz': 'Javoblaring tahlil qilinmoqda...', 'kk': 'Juwaplarıń analiz etilip atır...'},
    'analyzing.subtitle': {'en': "We're comparing your responses against 13 majors to find your best fit.", 'ru': 'Мы сравниваем твои ответы с 13 специальностями, чтобы найти лучшее совпадение.', 'uz': 'Eng mos kelishini topish uchun javoblaringni 13 ta mutaxassislik bilan solishtiryapmiz.', 'kk': 'Eń sáykes keletuǵının tabıw ushın juwaplarıńdı 13 kásip penen salıstırıp atırmız.'},
    'results.eyebrow': {'en': 'Your Major Match', 'ru': 'Твой подбор специальности', 'uz': 'Sening mutaxassislik moslashuving', 'kk': 'Seniń kásip sáykestigiń'},
    'results.primaryLabel': {'en': 'Your top match', 'ru': 'Твоё лучшее совпадение', 'uz': 'Eng yaxshi mos kelgan mutaxassisliging', 'kk': 'Eń jaqsı sáykes kelgen kásibiń'},
    'results.altLabel': {'en': 'Also worth exploring', 'ru': 'Также стоит рассмотреть', 'uz': 'Ko\'rib chiqishga arziydigan boshqalar', 'kk': 'Kóriwge arzıйтuǵın basqalar'},
    'results.dimensionsTitle': {'en': 'Your dimension breakdown', 'ru': 'Разбивка по направлениям', 'uz': 'Yo\'nalishlar bo\'yicha taqsimot', 'kk': 'Baǵdarlar boyынша bólistiriw'},
    'results.dimensionsSubtitle': {'en': 'How your {{total}} points spread across the six dimensions.', 'ru': 'Как твои {{total}} баллов распределились по шести направлениям.', 'uz': '{{total}} ballaring olti yo\'nalish bo\'yicha qanday taqsimlangani.', 'kk': '{{total}} ballıń altı baǵdar boyынша qalay bólistirilgeni.'},
    'results.retakeCta': {'en': 'Retake the assessment', 'ru': 'Пройти тест заново', 'uz': 'Testni qayta topshirish', 'kk': 'Testti qайта tapsırıw'},
    'results.retakeLockedNote': {'en': "You've used your free attempt.", 'ru': 'Ты уже использовал(а) свою бесплатную попытку.', 'uz': 'Bepul urinishingni ishlatib bo\'lgansan.', 'kk': 'Beкар sınap kóriwińdi paydalanıp bolğансаń.'},
    'results.backCta': {'en': 'Back to overview', 'ru': 'Назад к обзору', 'uz': 'Umumiy ko\'rinishga qaytish', 'kk': 'Ulıwma kóriniske qaytıw'},
    'results.viewAllCta': {'en': 'View past results', 'ru': 'Посмотреть прошлые результаты', 'uz': 'Oldingi natijalarni ko\'rish', 'kk': 'Aldınǵı nátиyjelerди kóriw'},
    'results.matchTypeExact': {'en': 'Exact match', 'ru': 'Точное совпадение', 'uz': 'Aniq moslik', 'kk': 'Anıq sáykeslik'},
    'results.matchTypeFallback': {'en': 'Closest match', 'ru': 'Ближайшее совпадение', 'uz': 'Eng yaqin moslik', 'kk': 'Eń jaqın sáykeslik'},
    'error.submitFailed': {'en': "We couldn't submit your answers. Please try again.", 'ru': 'Не удалось отправить твои ответы. Попробуй ещё раз.', 'uz': 'Javoblaringni yuborib bo\'lmadi. Qaytadan urinib ko\'r.', 'kk': 'Juwaplarıńdı jiberip bolmadı. Qайта sınap kór.'},
    'error.loadFailed': {'en': "We couldn't load your Major Match status.", 'ru': 'Не удалось загрузить статус AI-подбора специальности.', 'uz': 'AI-mutaxassislik moslashuvi holatini yuklab bo\'lmadi.', 'kk': 'AI-kásip sáykestigi jaǵdayın júkleп bolmadı.'},
    'error.profileRequired': {'en': 'Please complete your profile before taking the assessment.', 'ru': 'Пожалуйста, заполни профиль перед прохождением теста.', 'uz': 'Testdan oldin profilingni to\'ldiring.', 'kk': 'Testtan aldın profilińdi tolтır.'},
    'error.genericTitle': {'en': 'Something went wrong', 'ru': 'Что-то пошло не так', 'uz': 'Nimadir noto\'g\'ri ketdi', 'kk': 'Bir nárse qáte ketti'},
    'exit.confirmTitle': {'en': 'Leave the assessment?', 'ru': 'Покинуть тест?', 'uz': 'Testdan chiqasanmi?', 'kk': 'Testтан shıǵasаńba?'},
    'exit.confirmBody': {'en': 'Your answers so far are saved on this device. You can continue later.', 'ru': 'Твои ответы на данный момент сохранены на этом устройстве. Ты можешь продолжить позже.', 'uz': 'Hozirgacha bergan javoblaring shu qurilmada saqlangan. Keyinroq davom ettirishing mumkin.', 'kk': 'Házirge deyingi juwapların usı qurılmada saqlanǵan. Keyinirek dawam ete alasań.'},
}


def build_keys():
    """Returns {lang: {flat_key: value}} for all 4 langs."""
    out = {lang: {} for lang in LANGS}

    # Sections
    for idx, names in SECTIONS.items():
        for lang in LANGS:
            out[lang][f'majorMatch.section.{idx}.name'] = names[lang]

    # Dimensions
    for dim_key, byLang in DIMENSIONS.items():
        for lang in LANGS:
            out[lang][f'majorMatch.dimension.{dim_key}.label'] = byLang[lang]['label']
            out[lang][f'majorMatch.dimension.{dim_key}.description'] = byLang[lang]['description']

    # Questions + options
    for q in SPEC['questions']:
        qid = q['id']
        out['en'][f'majorMatch.question.{qid}.text'] = q['text']
        if q['type'] == 'multiple_choice':
            for opt in q['options']:
                out['en'][f'majorMatch.question.{qid}.option.{opt["letter"]}.text'] = opt['text']
        for lang in ('ru', 'uz', 'kk'):
            tr = TRANSLATIONS[qid][lang]
            out[lang][f'majorMatch.question.{qid}.text'] = tr['text']
            if q['type'] == 'multiple_choice':
                for letter in OPTION_LETTERS:
                    out[lang][f'majorMatch.question.{qid}.option.{letter}.text'] = tr['options'][letter]

    # Majors — names (primary + alt, 52 unique slugs) + descriptions (13 primaries)
    for slug, names in MAJOR_NAMES.items():
        for lang in LANGS:
            out[lang][f'majorMatch.major.{slug}.name'] = names[lang]
    for slug, descs in MAJOR_DESCRIPTIONS.items():
        for lang in LANGS:
            out[lang][f'majorMatch.major.{slug}.description'] = descs[lang]

    # Chrome
    for key, byLang in CHROME.items():
        for lang in LANGS:
            out[lang][f'majorMatch.{key}'] = byLang[lang]

    return out


def main():
    generated = build_keys()

    counts = {}
    for lang in LANGS:
        path = os.path.join(LOCALES_DIR, f'{lang}.json')
        # Read-modify-write immediately before writing, so a concurrent
        # agent's edits to OTHER namespaces in the same file survive.
        with open(path, 'r', encoding='utf-8') as f:
            current = json.load(f)
        before = len(current)
        current.update(generated[lang])
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(current, f, ensure_ascii=False, indent=2, sort_keys=True)
            f.write('\n')
        counts[lang] = (before, len(current))
        print(f'{lang}: {before} -> {len(current)} keys ({len(generated[lang])} majorMatch.* keys written)')

    # Verify parity: every majorMatch.* key present in ALL 4 langs with the same key set.
    key_sets = {}
    for lang in LANGS:
        path = os.path.join(LOCALES_DIR, f'{lang}.json')
        with open(path, 'r', encoding='utf-8') as f:
            d = json.load(f)
        key_sets[lang] = set(k for k in d.keys() if k.startswith('majorMatch.'))

    en_keys = key_sets['en']
    ok = True
    for lang in LANGS:
        if key_sets[lang] != en_keys:
            ok = False
            missing = en_keys - key_sets[lang]
            extra = key_sets[lang] - en_keys
            print(f'PARITY MISMATCH in {lang}: missing={len(missing)} extra={len(extra)}')
            if missing:
                print('  missing sample:', list(missing)[:5])
            if extra:
                print('  extra sample:', list(extra)[:5])
    print(f'majorMatch.* key count (en): {len(en_keys)}')
    print('PARITY OK across en/ru/uz/kk' if ok else 'PARITY FAILED')


if __name__ == '__main__':
    main()
