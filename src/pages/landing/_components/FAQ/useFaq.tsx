import { CollapseProps, Divider } from 'antd';
import { useTranslation } from 'react-i18next';

export default function useFaq() {
  const { i18n } = useTranslation(); // Access the i18next instance

  // Get the current language
  const currentLanguage = i18n.language;

  // Choose the FAQ list based on the selected language
  const faqItems =
    {
      en: itemsEn,
      ru: itemsRu,
      uz: itemsUz,
      kk: itemsKk,
    }[currentLanguage] || itemsEn; // Default to English if the language is not found
  return { faqItems };
}

const itemsEn: CollapseProps['items'] = [
  {
    key: '1',
    label: 'What is TopCoach?',
    children:
      'TopCoach is a mentorship platform that connects students with experienced mentors who guide them through university applications, test preparation, essay writing, and career advice.',
  },
  {
    key: 'community-1',
    label: 'What is TopCoach Community?',
    children:
      'TopCoach Community is an all-in-one platform for SAT prep, admissions, research, AI tools, and student networking.',
  },
  {
    key: 'community-2',
    label: 'Who is TopCoach Community for?',
    children:
      'TopCoach Community is designed for high school, gap year, and university students planning to study abroad.',
  },
  {
    key: 'community-3',
    label: 'What does TopCoach Community include?',
    children: (
      <div>
        <p>Your membership includes:</p>
        <ul>
          <li>SAT Prep</li>
          <li>Research Program</li>
          <li>Admissions Foundation</li>
          <li>AI Major Tool</li>
          <li>Monthly Workshops</li>
          <li>Study Buddy Matching</li>
          <li>Unlimited Messaging</li>
          <li>Rewards</li>
        </ul>
      </div>
    ),
  },
  {
    key: 'community-4',
    label: 'How much does TopCoach Community cost?',
    children: (
      <div>
        <p>Choose the plan that fits you:</p>
        <ul>
          <li><strong>Monthly:</strong> $12/month</li>
          <li><strong>Yearly:</strong> $99/year (Save 31%)</li>
        </ul>
      </div>
    ),
  },
  {
    key: 'community-5',
    label: 'Does TopCoach Community offer a free trial?',
    children:
      'Yes. Every plan includes a 7-day free trial, so you can explore all features before subscribing.',
  },
  {
    key: 'community-6',
    label: 'Can I cancel or switch my TopCoach Community plan anytime?',
    children:
      'Yes. You can cancel or switch between Monthly and Yearly plans at any time.',
  },
  {
    key: '2',
    label: 'How do I choose the right mentor?',
    children: (
      <div>
        <p>
        We offer four levels of mentors based on experience and track record: <strong>Junior</strong>, <strong>Senior</strong>, <strong>Expert</strong>, and <strong>Pro Bono</strong>. Each level reflects the mentor's background, number of students supported, and overall impact.
        </p>
        <ul>
          <li>
            <strong> Junior Mentor</strong>
            <ul>
              <li>Recently admitted to a top university.</li>
              <li>May have limited experience mentoring others.</li>
              <li>
              Currently supporting students or just starting their mentorship journey.
              </li>
              <li>
              Highly motivated to help others and grow as a mentor.
              </li>
            </ul>
          </li>
          <li>
            <strong>Senior Mentor</strong>
            <ul>
              <li>
              Has successfully gone through the admissions process themselves.
              </li>
              <li>
              Experienced in guiding students through applications.
              </li>
              <li>
                Typically supported students who received
                around 10 acceptance letters (this is a
                guideline, not a fixed requirement).
              </li>
              <li>
              While no minimum years of experience are required, Senior Mentors demonstrate a proven ability to offer effective support.
              </li>
            </ul>
          </li>
          <li>
            <strong>Expert Mentor</strong>
            <ul>
              <li>
              Known for deep expertise in university admissions.
              </li>
              <li>
              Has mentored a large number of students, often helping them secure 20–30+ acceptance letters.
              </li>
              <li>
              Should have at least 3 years of relevant experience in admissions mentoring or a related field.
              </li>
              <li>
              Recognized in specialized areas (e.g. Ivy League, medical schools, arts programs, etc.).
              </li>
              <li>
              Strong reputation and track record of success.
              </li>
            </ul>
          </li>
          <li>
            <strong>Pro Bono Mentor</strong>
            <ul>
              <li>
              The Pro Bono Mentor role is a social-impact position for mentors who volunteer their time.
              </li>
              <li>
              Works voluntarily an by personal choice.
              </li>
              <li>
              Must commit to conducting at least 4 hours per month or 8 sessions.
              </li>
              <li>
              If this monthly target is reached, we offer compensation based on our new contract.
              </li>
              <li>
              Mentors interested in becoming a Junior Mentor are required to first complete a minimum of 4 pro bono hours or 8 sessions as hands-on experience.
              </li>
            </ul>
          </li>
          <strong>Important Note:</strong>
        <p>
        These guidelines serve as general recommendations for mentor placement. Mentors with slightly different backgrounds or fewer acceptance letters may still qualify for a higher level based on their overall profile, impact, and mentoring approach.
        </p>
        </ul>
        <p>
          We carefully review each mentor’s background to ensure the best
          fit on the platform.
        </p>
      </div>
    ),
  },
  {
    key: '3',
    label: 'What types of mentorship sessions does TopCoach offer?',
    children: (
      <div>
        <p>We offer the following session types:</p>
        <ul>
          <li>
            <strong>Individual Sessions:</strong> One-on-one mentorship sessions available in 30-minute or 60-minute formats. Ideal for quick guidance, essay reviews, or mock interviews.
          </li>
          {/* Temporarily hidden - rethinking subscription plans */}
          {/* <li>
          <strong>Full Guidance Package:</strong> A 4-hour package designed to provide in-depth, personalized support on your application, including university selection, personal statements, and application strategy.
          </li>
          <li>
          <strong>Intensive Course:</strong> An 8-hour mentorship program for students who want full guidance throughout the entire university application process, from start to finish.
          </li>
          <li>
          <strong>Subscription Plans (New!):</strong> Looking for ongoing support? You can now choose from our monthly subscription options, which allow you to book regular sessions with your mentor at a discounted rate. Perfect for students who prefer consistent check-ins, structured progress, and long-term accountability.
          </li> */}
        </ul>
      </div>
    ),
  },
  {
    key: '4',
    label: 'What languages do mentors speak?',
    children: (
      <div>
        <p>TopCoach mentors offer sessions in multiple languages, including:</p>
        <ul>
          <li>English</li>
          <li>Uzbek</li>
          <li>Russian</li>
          <li>Other languages depending on the mentor's availability</li>
        </ul>
        <p>
          When selecting a mentor, you can filter by language to find the best
          match.
        </p>
      </div>
    ),
  },
  {
    key: '6',
    label: 'How much does a mentorship session cost?',
    children: (
      <div>
        <p>The Pricing Depends on the Mentor Level:</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Mentor Level</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>30 min Session</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>60 min Session</th>
              {/* Temporarily hidden - rethinking subscription plans */}
              {/* <th style={{ border: '1px solid #ddd', padding: '8px' }}>Full Guidance (4 hrs)</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Intensive Course (8 hrs)</th> */}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>Junior Coach</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$12.50</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$25.00</td>
              {/* <td style={{ border: '1px solid #ddd', padding: '8px' }}>$100.00</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$188.00</td> */}
            </tr>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>Senior Coach</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$25.00</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$50.00</td>
              {/* <td style={{ border: '1px solid #ddd', padding: '8px' }}>$200.00</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$375.00</td> */}
            </tr>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>Expert Coach</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$50.00</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$100.00</td>
              {/* <td style={{ border: '1px solid #ddd', padding: '8px' }}>$375.00</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$625.00</td> */}
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    key: '7',
    label: 'What if I miss a scheduled session?',
    children:
      'If you miss a session without notifying your mentor 24 hours in advance, it will be non-refundable. However, rescheduling is possible if you inform the mentor on time.',
  },
  {
    key: '10',
    label: 'How can one sign up as a Mentor?',
    children: (
      <div>
        <p>
          If you are interested in becoming a mentor on TopCoach, we have a simple step-by-step guide to walk you through the process.
        </p>
        <p>
          Follow this tutorial:&nbsp;
          <a
            href="https://scribehow.com/shared/How_To_Sign_Up_As_A_Mentor_On_TopCoach__iuj_5hetTIy8CR3748A83g"
            target="_blank"
            rel="noopener noreferrer"
          >
            How to Sign Up as a Mentor on TopCoach
          </a>
        </p>
      </div>
    ),
  },
];

const itemsUz: CollapseProps['items'] = [
  {
    key: '1',
    label: 'TopCoach nima?',
    children:
      'TopCoach bu talabalarga universitetga ariza topshirish, testga tayyorgarlik ko‘rish, esse yozish va karyera bo‘yicha maslahat berishda tajribali mentorlar bilan bog‘lanish imkonini beruvchi mentorlik platformasidir.',
  },
  {
    key: 'community-1',
    label: 'TopCoach Community nima?',
    children:
      'TopCoach Community – SAT tayyorgarligi, universitetga qabul, tadqiqot, sun’iy intellekt vositalari va talabalar hamjamiyatini bir joyda jamlagan yagona platforma.',
  },
  {
    key: 'community-2',
    label: 'TopCoach Community kimlar uchun?',
    children:
      'TopCoach Community chet elda o‘qishni rejalashtirayotgan maktab o‘quvchilari, gap year va universitet talabalari uchun mo‘ljallangan.',
  },
  {
    key: 'community-3',
    label: 'TopCoach Community tarkibiga nimalar kiradi?',
    children: (
      <div>
        <p>Obunangizga quyidagilar kiradi:</p>
        <ul>
          <li>SAT tayyorgarligi</li>
          <li>Tadqiqot dasturi</li>
          <li>Admissions Foundation</li>
          <li>AI Major vositasi</li>
          <li>Oylik seminarlar (workshops)</li>
          <li>Study Buddy juftlashtirish</li>
          <li>Cheksiz xabar almashish</li>
          <li>Mukofotlar</li>
        </ul>
      </div>
    ),
  },
  {
    key: 'community-4',
    label: 'TopCoach Community qancha turadi?',
    children: (
      <div>
        <p>O‘zingizga mos tarifni tanlang:</p>
        <ul>
          <li><strong>Oylik:</strong> $12/oy</li>
          <li><strong>Yillik:</strong> $99/yil (31% tejang)</li>
        </ul>
      </div>
    ),
  },
  {
    key: 'community-5',
    label: 'TopCoach Community bepul sinov muddatini taklif qiladimi?',
    children:
      'Ha. Har bir tarif 7 kunlik bepul sinov muddatini o‘z ichiga oladi, shuning uchun obuna bo‘lishdan oldin barcha imkoniyatlarni sinab ko‘rishingiz mumkin.',
  },
  {
    key: 'community-6',
    label: 'TopCoach Community tarifimni istalgan vaqtda bekor qilish yoki almashtirish mumkinmi?',
    children:
      'Ha. Oylik va Yillik tariflar o‘rtasida istalgan vaqtda bekor qilishingiz yoki almashtirishingiz mumkin.',
  },
  {
    key: '2',
    label: 'Qanday qilib to‘g‘ri mentorni tanlashim mumkin?',
    children: (
      <div>
        <p>
        Biz tajriba va tajribaga asoslangan to'rt darajadagi murabbiylarni taklif etamiz: <strong>Junior</strong>, <strong>Senior</strong>, <strong>Expert</strong>, va <strong>Pro Bono</strong>. Har bir daraja murabbiyning kelib chiqishi, qo‘llab-quvvatlangan talabalar soni va umumiy ta’sirini aks ettiradi.
        </p>
        <ul>
          <li>
            <strong>Kichik murabbiy</strong>
            <ul>
              <li>Yaqinda top universitetga o‘qishga kirgan.</li>
              <li>
              Boshqalarga murabbiylik qilish tajribasi cheklangan bo‘lishi mumkin.
              </li>
              <li>
              Hozirda talabalarni qo‘llab-quvvatlamoqda yoki endigina murabbiylik faoliyatini boshlagan.
              </li>
              <li>
              Boshqalarga yordam berish va ustoz sifatida o‘sishga yuqori darajada qiziqish bildiradi.
              </li>
            </ul>
          </li>
          <li>
            <strong>Katta murabbiy</strong>
            <ul>
              <li>
              O‘zi qabul jarayonidan muvaffaqiyatli o‘tgan.
              </li>
              <li>
              Talabalarni ilovalar orqali yo‘naltirish tajribasiga ega.
              </li>
              <li>
              Odatda 10 ga yaqin qabul xati olgan talabalar ko‘maklashilgan (bu qat’iy talab emas, balki ko‘rsatma).
              </li>
              <li>
              Kamida bir necha yillik tajriba talab qilinmasa-da, katta murabbiylar samarali yordam ko‘rsatish qobiliyatini namoyish etadilar.
              </li>
            </ul>
          </li>
          <li>
            <strong>Ekspert murabbiy</strong>
            <ul>
              <li>
              Universitetga qabul qilishda chuqur tajribasi bilan tanilgan.
              </li>
              <li>U ko‘plab talabalarga mentorlik qilgan, ko‘pincha ularga 20-30 dan ortiq qabul xatlarini olishga yordam bergan.</li>
              <li>
              Qabulda murabbiylik yoki tegishli sohada kamida 3 yillik tegishli tajribaga ega bo‘lishi kerak.
              </li>
              <li>
              Ixtisoslashgan sohalarda (masalan Ayvi ligasi, tibbiyot maktablari, san’at dasturlari va boshqalar).
              </li>
            </ul>
            <strong>Muhim eslatma:</strong>
            <p>
            Ushbu ko‘rsatmalar murabbiylarni joylashtirish bo‘yicha umumiy tavsiyalar bo‘lib xizmat qiladi. Biroz boshqacha kelib chiqishga ega yoki qabul qilish xatlari soni kamroq bo‘lgan murabbiylar o‘zlarining umumiy profillari, ta’siri va murabbiylik yondashuvi asosida yuqori darajaga ko‘tarilishlari mumkin.
            </p>
          </li>
        </ul>
        <p>
        Biz platformaga eng mos kelishini ta’minlash uchun har bir murabbiyning tajribasini diqqat bilan o‘rganib chiqamiz.
        </p>
      </div>
    ),
  },
  {
    key: '3',
    label: 'TopCoach qanday mentorlik seanslarini taqdim etadi?',
    children: (
      <div>
        <p>Biz quyidagi seans turlarini taklif qilamiz:</p>
        <ul>
          <li><strong>Individual Seanslar:</strong> Yakkama-yakka mentorlik sessiyalari 30 daqiqa yoki 60 daqiqalik formatlarda mavjud. Tezkor ko‘rsatmalar, insho sharhlari yoki soxta intervyular uchun juda mos keladi.</li>
          {/* Temporarily hidden - rethinking subscription plans */}
          {/* <li>
          <strong>To‘liq Yo‘nalish Paketi:</strong> Arizangiz bo‘yicha chuqur, moslashtirilgan yordam ko‘rsatish uchun mo‘ljallangan 4 soatlik paket - jumladan, universitetni tanlash, shaxsiy bayonotlar va ariza berish strategiyasi.
          </li>
          <li>
          <strong>Intensiv Kurs:</strong> Universitetga hujjat topshirish jarayonining boshidan oxirigacha to‘liq rahbarlik qilishni istagan talabalar uchun 8 soatlik murabbiylik dasturi.
          </li>
          <li>
          <strong>Obuna tariflari (Yangi!):</strong> Davomiy yordam kerakmi? Endi siz bizning oylik obuna variantlarimizdan tanlashingiz mumkin, bu sizga ustozingiz bilan chegirmali narxda muntazam uchrashuvlarni band qilish imkonini beradi. Doimiy ro‘yxatdan o‘tish, tizimli rivojlanish va uzoq muddatli javobgarlikni afzal ko‘radigan talabalar uchun ayni muddao.
          </li> */}
        </ul>
      </div>
    ),
  },
  {
    key: '4',
    label: 'Mentorlar qaysi tillarda gaplashadi?',
    children: (
      <div>
        <p>
          TopCoach mentorlar seanslarini bir necha tillarda o‘tkazadilar,
          jumladan:
        </p>
        <ul>
          <li>Ingliz tili</li>
          <li>O‘zbek tili</li>
          <li>Rus tili</li>
          <li>Mentor mavjudligiga qarab boshqa tillar</li>
        </ul>
        <p>Mentorni tanlashda til bo‘yicha filtrni qo‘llashingiz mumkin.</p>
      </div>
    ),
  },
  {
    key: '6',
    label: 'Mentorlik seansi qancha turadi?',
    children: (
      <div>
        <p> Narx belgilash mentor darajasiga bog‘liq:</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Mentor darajasi</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>30 daqiqa</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>60 daqiqa</th>
              {/* Temporarily hidden - rethinking subscription plans */}
              {/* <th style={{ border: '1px solid #ddd', padding: '8px' }}>To‘liq rahbarlik (4 soat)</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Intensiv kurs (8 soat)</th> */}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>Kichik murabbiy</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$12.50</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$25.00</td>
              {/* <td style={{ border: '1px solid #ddd', padding: '8px' }}>$100.00</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$188.00</td> */}
            </tr>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>Katta murabbiy</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$25.00</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$50.00</td>
              {/* <td style={{ border: '1px solid #ddd', padding: '8px' }}>$200.00</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$375.00</td> */}
            </tr>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>Mutaxassis murabbiy</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$50.00</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$100.00</td>
              {/* <td style={{ border: '1px solid #ddd', padding: '8px' }}>$375.00</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$625.00</td> */}
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },  
  {
    key: '7',
    label: 'Agar rejalashtirilgan seansni oʻtkazib yuborsam nima bo‘ladi?',
    children:
      'Agar siz seansni 24 soat oldin xabardor qilmasdan o‘tkazib yuborsangiz, to‘lov qaytarilmaydi. Ammo, agar mentorni o‘z vaqtida xabardor qilsangiz, seansni qayta belgilash mumkin.',
  },
  {
    key: '10',
    label: 'Qanday qilib murabbiy sifatida ro‘yxatdan o‘tish mumkin?',
    children: (
      <div>
        <p>
          Agar siz TopCoach platformasida murabbiy bo‘lishni istasangiz, bizda sizga bu jarayonda yordam beradigan oddiy qo‘llanma mavjud.
        </p>
        <p>
          Qo‘llanmani bu yerda ko‘ring:&nbsp;
          <a
            href="https://scribehow.com/shared/How_To_Sign_Up_As_A_Mentor_On_TopCoach__iuj_5hetTIy8CR3748A83g"
            target="_blank"
            rel="noopener noreferrer"
          >
            TopCoach’da murabbiy sifatida ro‘yxatdan o‘tish bo‘yicha qo‘llanma
          </a>
        </p>
      </div>
    ),
  },  
];

const itemsRu: CollapseProps['items'] = [
  {
    key: '1',
    label: 'Что такое TopCoach?',
    children:
      'TopCoach: это платформа наставничества, которая соединяет студентов с опытными наставниками, помогающими с поступлением в университет, подготовкой к экзаменам, написанием эссе и карьерным консультированием.',
  },
  {
    key: 'community-1',
    label: 'Что такое TopCoach Community?',
    children:
      'TopCoach Community — это универсальная платформа для подготовки к SAT, поступления, исследований, AI-инструментов и общения между студентами.',
  },
  {
    key: 'community-2',
    label: 'Для кого предназначен TopCoach Community?',
    children:
      'TopCoach Community предназначен для школьников, студентов в gap year и студентов университетов, планирующих учиться за рубежом.',
  },
  {
    key: 'community-3',
    label: 'Что включает TopCoach Community?',
    children: (
      <div>
        <p>В вашу подписку входят:</p>
        <ul>
          <li>Подготовка к SAT</li>
          <li>Исследовательская программа</li>
          <li>Admissions Foundation</li>
          <li>AI Major Tool</li>
          <li>Ежемесячные воркшопы</li>
          <li>Подбор Study Buddy</li>
          <li>Безлимитные сообщения</li>
          <li>Награды</li>
        </ul>
      </div>
    ),
  },
  {
    key: 'community-4',
    label: 'Сколько стоит TopCoach Community?',
    children: (
      <div>
        <p>Выберите подходящий план:</p>
        <ul>
          <li><strong>Ежемесячно:</strong> $12/месяц</li>
          <li><strong>Ежегодно:</strong> $99/год (экономия 31%)</li>
        </ul>
      </div>
    ),
  },
  {
    key: 'community-5',
    label: 'Есть ли у TopCoach Community бесплатный пробный период?',
    children:
      'Да. Каждый план включает 7-дневный бесплатный пробный период, чтобы вы могли изучить все функции перед оформлением подписки.',
  },
  {
    key: 'community-6',
    label: 'Можно ли отменить или сменить план TopCoach Community в любое время?',
    children:
      'Да. Вы можете отменить подписку или переключаться между ежемесячным и ежегодным планами в любое время.',
  },
  {
    key: '2',
    label: 'Как выбрать подходящего наставника?',
    children: (
      <div>
        <p>
        Уровни менторов на нашей платформе Мы предлагаем четыре уровня менторов в 
        зависимости от их опыта и достижений: <strong>Junior</strong>, <strong>Senior</strong>, <strong>Expert</strong>, и <strong>Pro Bono</strong>. Каждый уровень 
        отражает профессиональный путь ментора, количество поддержанных студентов и достигнутый эффект.
        </p>
        <ul>
          <li>
            <strong>Junior Mentor</strong>
            <ul>
              <li>Недавно поступил(а) в ведущий университет.</li>
              <li>Может иметь ограниченный опыт наставничества.</li>
              <li>
              В настоящее время оказывает поддержку студентам или только начинает путь ментора.
              </li>
              <li>
              Обладает сильной мотивацией помогать другим и развиваться как ментор.
              </li>
            </ul>
          </li>
          <li>
            <strong> Senior Mentor</strong>
            <ul>
              <li>
              Самостоятельно прошёл процесс поступления в университет.
              </li>
              <li>
              Имеет опыт сопровождения студентов при подаче заявлений.
              </li>
              <li>
              Обычно поддержал студентов, получивших около 10 писем о приёме (это рекомендация, а не строгий критерий).
              </li>
              <li>
              Несмотря на отсутствие требований к стажу, демонстрирует стабильные и эффективные результаты.
              </li>
            </ul>
          </li>
          <li>
            <strong>Expert Mentor</strong>
            <ul>
              <li>
              Обладает глубокими знаниями в области поступления в вузы.
              </li>
              <li>
              Помог большому количеству студентов, часто с результатом 20–30+ писем о приёме.
              </li>
              <li>
              Должен иметь не менее 3 лет опыта в сфере менторства по поступлению или смежных областях.
              </li>
              <li>
              Признан в специализированных сферах (например, Ivy League, медицинские школы, творческие программы и др.).
              </li>
              <li>
              Имеет отличную репутацию и доказанные успехи.
              </li>
            </ul>
          </li>
          <li>
            <strong>Pro Bono</strong>
            <ul>
              <li>
              Pro Bono Mentor: это социальная роль для менторов, которые работают на добровольной основе:
              </li>
              <li>
              Работают безвозмездно по собственному желанию.
              </li>
              <li>
              Обязуются проводить не менее 4 часов в месяц или 8 сессий.
              </li>
              <li>
              При выполнении ежемесячного плана возможна компенсация в соответствии с новым контрактом.
              </li>
              <li>
              Чтобы стать Junior Mentor, необходимо предварительно пройти не менее 4 часов или 8 сессий в формате pro bono в качестве практики.
              </li>
            </ul>
          </li>
          <strong>Важное замечание:</strong>
          <p>
            {' '}
            Эти критерии являются общими рекомендациями. Менторы с другим опытом или меньшим количеством писем о приёме могут быть квалифицированы на более высокий уровень в зависимости от их общего профиля, подхода и реального вклада.
          </p>
        </ul>
        <p>
        Мы тщательно проверяем опыт каждого ментора, чтобы обеспечить наилучшее соответствие.
        </p>
      </div>
    ),
  },
  {
    key: '3',
    label: 'Какие виды сеансов наставничества предлагает TopCoach?',
    children: (
      <div>
        <p>Мы предлагаем следующие виды сеансов:</p>
        <ul>
          <li>
            Индивидуальные сеансы: Наставничество один на один (30 или 60
            минут).
          </li>
          {/* Temporarily hidden - rethinking subscription plans */}
          {/* <li>
            Полный пакет сопровождения: 4-часовой пакет для всесторонней
            поддержки при подаче документов.
          </li>
          <li>
            Интенсивный курс: 8-часовая программа для тех, кому необходимо
            полное сопровождение в процессе поступления.
          </li> */}
        </ul>
      </div>
    ),
  },
  {
    key: '4',
    label: 'На каких языках говорят наставники?',
    children: (
      <div>
        <p>
          Наставники TopCoach проводят сеансы на нескольких языках, включая:
        </p>
        <ul>
          <li>Английский</li>
          <li>Узбекский</li>
          <li>Русский</li>
          <li>Другие языки, в зависимости от доступности наставника</li>
        </ul>
        <p>
          При выборе наставника вы можете отфильтровать по языку, чтобы найти
          наиболее подходящего.
        </p>
      </div>
    ),
  },
  {
    key: '6',
    label: 'Сколько стоит сеанс наставничества?',
    children: (
      <div>
        <p>Ценообразование зависит от уровня наставника:</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Уровень наставника</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>30 мин</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>60 мин</th>
              {/* Temporarily hidden - rethinking subscription plans */}
              {/* <th style={{ border: '1px solid #ddd', padding: '8px' }}>Полное руководство (4 часа)</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Интенсивный курс (8 часов)</th> */}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>Junior Coach</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$12.50</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$25.00</td>
              {/* <td style={{ border: '1px solid #ddd', padding: '8px' }}>$100.00</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$188.00</td> */}
            </tr>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>Senior Coach</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$25.00</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$50.00</td>
              {/* <td style={{ border: '1px solid #ddd', padding: '8px' }}>$200.00</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$375.00</td> */}
            </tr>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>Expert Coach</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$50.00</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$100.00</td>
              {/* <td style={{ border: '1px solid #ddd', padding: '8px' }}>$375.00</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$625.00</td> */}
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },  
  {
    key: '7',
    label: 'Что делать, если я пропустил запланированный сеанс?',
    children:
      'Если вы пропустите сеанс, не уведомив наставника за 24 часа заранее, оплата не возвращается. Однако при своевременном уведомлении возможно перенести сеанс.',
  },
  {
    key: '10',
    label: 'Как зарегистрироваться в качестве наставника?',
    children: (
      <div>
        <p>
          Если вы хотите стать наставником на платформе TopCoach, мы подготовили для вас простое пошаговое руководство.
        </p>
        <p>
          Ознакомьтесь с инструкцией здесь:&nbsp;
          <a
            href="https://scribehow.com/shared/How_To_Sign_Up_As_A_Mentor_On_TopCoach__iuj_5hetTIy8CR3748A83g"
            target="_blank"
            rel="noopener noreferrer"
          >
            Как зарегистрироваться в качестве наставника на TopCoach
          </a>
        </p>
      </div>
    ),
  },  
];

const itemsKk: CollapseProps['items'] = [
  {
    key: '1',
    label: 'TopCoach ne?',
    children:
      'TopCoach – bu oqıwshı jaslarġa universtitetke arza beriw, testke tayarlanıw, esse jazıw hám karyera boyınsha keńes beriwde tájiriybeli mentorlar menen baylanıstırıwshı mentorlıq platforması.',
  },
  {
    key: 'community-1',
    label: 'TopCoach Community ne?',
    children:
      'TopCoach Community – SAT tayarlıq, universitetke qabıl, izertlew, AI quralları hám studentler networkingin bir jerde birleshtiretuǵın platforma.',
  },
  {
    key: 'community-2',
    label: 'TopCoach Community kimler ushın?',
    children:
      'TopCoach Community shet elde oqıwdı jobalastırıp atırǵan mektep oqıwshıları, gap year hám universitet studentleri ushın arnalǵan.',
  },
  {
    key: 'community-3',
    label: 'TopCoach Community quramına neler kiredi?',
    children: (
      <div>
        <p>Aǵzalıǵıńızǵa tómendegiler kiredi:</p>
        <ul>
          <li>SAT tayarlıq</li>
          <li>Izertlew baǵdarlaması</li>
          <li>Admissions Foundation</li>
          <li>AI Major quralı</li>
          <li>Aylıq seminarlar (workshops)</li>
          <li>Study Buddy sáykeslendiriw</li>
          <li>Sheksiz xabar almasıw</li>
          <li>Sıylıqlar</li>
        </ul>
      </div>
    ),
  },
  {
    key: 'community-4',
    label: 'TopCoach Community qansha turadı?',
    children: (
      <div>
        <p>Ózińizge sáykes tarifti saylań:</p>
        <ul>
          <li><strong>Aylıq:</strong> $12/ay</li>
          <li><strong>Jıllıq:</strong> $99/jıl (31% únemlew)</li>
        </ul>
      </div>
    ),
  },
  {
    key: 'community-5',
    label: 'TopCoach Community biypul sınaq múddetin usına ma?',
    children:
      'Awa. Hár bir tarif 7 kúnlik biypul sınaq múddetin óz ishine aladı, sonlıqtan jazılıwdan aldın barlıq múmkinshiliklerdi sınap kóre alasız.',
  },
  {
    key: 'community-6',
    label: 'TopCoach Community tarifimdi qálegen waqıtta biykar etiw yamasa almastırıw múmkin be?',
    children:
      'Awa. Aylıq hám Jıllıq tarifler arasında qálegen waqıtta biykar ete alasız yamasa almastıra alasız.',
  },
  {
    key: '2',
    label: 'Qalay durıs mentor saylaw kerek?',
    children: (
      <div>
        <p>
        Платформамыздағы Mentor дәрежелери Біз платформамызда тәжирибеси мен нәтижесине қарай тóрт дәрежедеги Mentor ұсынамыз: <strong>Junior</strong>,
          <strong>Senior</strong>, <strong>Expert</strong>, hám <strong>Pro Bono</strong>. Әр дәрежеде mentor-дың тәжірибеси, қолдаған студентлер саны және нәтижелиги есапқа алынады.
        </p>
        <ul>
          <li>
            <strong>Junior Mentor</strong>
            <ul>
              <li>Жақында атақты университетке түскен.</li>
              <li>Басқа студентлерге бағыт беру тәжирибеси аз болуы мүмкин.</li>
              <li>
              Қазір студентлерге көмектесип жатыр немесе жаңа mentorлық жолын бастаған.
              </li>
              <li>
              Басқаларға көмектесип, өзі де өсип-дамуға мотивациясы күшли.
              </li>
            </ul>
          </li>
          <li>
            <strong>Senior Mentor</strong>
            <ul>
              <li>Университетке қабылдану жолын сәтли аяқлаған.</li>
              <li>Студентлерге өтініш беруде бағыт берип келген.</li>
              <li>
              Әдетте шамамен 10 қабыл хат алған студентлерге көмектескен (бұл тек ұсыныс, қатан талап емес).
              </li>
              <li>
              Жыллық тәжирибе міндет емес, бірақ нақты нәтижелер көрсете алған болуы керек.
              </li>
            </ul>
          </li>
          <li>
            <strong>Expert Mentor</strong>
            <ul>
              <li>
              Университетке қабыл саласында терең білімге ие.
              </li>
              <li>Көп студентлерге mentor болган, 20–30+ қабыл хаты бар студентлерге көмектескен.</li>
              <li>
              Кеминде 3 жыл тиісті тәжирибеси болуы керек.
              </li>
              <li>Белгілі бір бағытта (мысалы, Ivy League, медуниверситет, өнер бағдарламалары) танылган.</li>
              <li>
              Жақсы атаққа ие және айқын нәтижелерге қол жеткізген.
              </li>
            </ul>
          </li>
          <li>
            <strong>Pro Bono Mentor</strong>
            <ul>
              <li>
              Pro Bono Mentor: бұл әлеуметтік жобаға үлес қосатын, өз еркімен тегін жұмыс істейтиң mentor.
              </li>
              <li>Өз еркімен тегін жұмыс істейди.</li>
              <li>
              Ай сайын ең азы 4 сағат немесе 8 сессия өткізуге міндетли.
              </li>
              <li>Егер бұл талап орындалса, жаңа келісим шарт негізинде төлем берилиши мүмкин.</li>
              <li>
              Junior Mentor болғысы келген адам алдын ала кеминде 4 сағат немесе 8 сессия pro bono тәжирибе жинауы керек.
              </li>
            </ul>
            <strong>Маңызды ескертпе:</strong>
            <p>
            Әр mentor-дың тәжирибеси жеке талданады; платформамызда ең сәйкесін таңдап беремиз.
            </p>
          </li>
        </ul>
        <p>
        Сіз mentor профиллерин қарап, өзіңізге лайықтысын таңлай аласыз немесе AI таңдау жүйемизді қолдана аласыз.
        </p>
      </div>
    ),
  },
  {
    key: '3',
    label: 'TopCoach qanday mentorlıq seansların usınadı?',
    children: (
      <div>
        <p>Biz tómendegi seans túrlerin usınamız:</p>
        <ul>
          <li>
            Individual Seanslar: Birge-bir mentorlıq (30 yamasa 60 minut).
          </li>
          {/* Temporarily hidden - rethinking subscription plans */}
          {/* <li>
            Tolıq Jónelis Paketi: 4 saatlıq shuqir arza qollap-quwwatlaw paketi.
          </li>
          <li>
            Intensiv Kurs: Arza beriw járáyanında tolıq mentorlıq ushín 8
            saatlıq dástur.
          </li> */}
        </ul>
      </div>
    ),
  },
  {
    key: '4',
    label: 'Mentorlar qaysı tillerde sóylesedi?',
    children: (
      <div>
        <p>
          TopCoach mentorları seansların birneshe tillerde júrgizedi, mısalı:
        </p>
        <ul>
          <li>Ingliz tili</li>
          <li>Ózbek tili</li>
          <li>Rus tili</li>
          <li>Mentor bar ekenligine qarap basqa tiller</li>
        </ul>
        <p>Mentorlardı saylawda til boyınsha filtrdi qollawıńız múmkin.</p>
      </div>
    ),
  },
  {
    key: '6',
    label: 'Mentorlıq sessiya qánsha turadı?',
    children: (
      <div>
        <p> Bahalar ustazdıń dárejesine baylanıslı:</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Mentor dárejesi</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>30 min Sessiya</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>60 min Sessiya</th>
              {/* Temporarily hidden - rethinking subscription plans */}
              {/* <th style={{ border: '1px solid #ddd', padding: '8px' }}>Tolıq basshilıq (4 saat)</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Intensiv kurs (8 saat)</th> */}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>Jas trener</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$12.50</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$25.00</td>
              {/* <td style={{ border: '1px solid #ddd', padding: '8px' }}>$100.00</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$188.00</td> */}
            </tr>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>Starshiy trener</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$25.00</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$50.00</td>
              {/* <td style={{ border: '1px solid #ddd', padding: '8px' }}>$200.00</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$375.00</td> */}
            </tr>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>Qánige trener</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$50.00</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$100.00</td>
              {/* <td style={{ border: '1px solid #ddd', padding: '8px' }}>$375.00</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>$625.00</td> */}
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },  
  {
    key: '7',
    label: 'Eger belgilengen seanstı ótkerip jiberseńiz ne boladı?',
    children:
      'Eger seanstı 24 saat aldınnan xabar bermey ótkizip jiberseńiz, tólew qaytarılmaydı. Eger mentorǵa óz waqtında xabar berseńiz, seanstı qayta belgilew múmkín.',
  },
  {
    key: '10',
    label: 'Qanday qilib mentor bolıp tırkelıwge boladı?',
    children: (
      <div>
        <p>
          Áger siz TopCoach platformasında mentor bolıwǵa qızıǵıpsańız, biz siz ushın basqıshlardı kórsetetin onay qosjalama tayarladıq.
        </p>
        <p>
          Qóllanbani mına jerde kóriń:&nbsp;
          <a
            href="https://scribehow.com/shared/How_To_Sign_Up_As_A_Mentor_On_TopCoach__iuj_5hetTIy8CR3748A83g"
            target="_blank"
            rel="noopener noreferrer"
          >
            TopCoach platformasında mentor bolıp tırkelıw qosjalaması
          </a>
        </p>
      </div>
    ),
  },  
];
