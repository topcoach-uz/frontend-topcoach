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
    key: '2',
    label: 'How do I choose the right mentor?',
    children: (
      <div>
        <p>
          Mentors are categorized into three levels based on their experience:
        </p>
        <p>
          We offer three levels of mentors on our platform:
          <strong>Junior</strong>, <strong>Senior</strong>, and{' '}
          <strong>Expert</strong> Expert. Below is a general overview of each
          level and how we determine placement:
        </p>
        <ul>
          <li>
            <strong> Junior Mentor</strong>
            <ul>
              <li>Recently admitted to a top university.</li>
              <li>May have limited experience supporting other applicants.</li>
              <li>
                Currently assisting students or beginning their mentorship
                journey.
              </li>
              <li>
                Strong motivation to help others succeed and grow as a mentor.
              </li>
            </ul>
          </li>
          <li>
            <strong>Senior Mentor</strong>
            <ul>
              <li>
                Has a solid understanding of the admissions process and has
                personally gone through it successfully.
              </li>
              <li>
                Experience mentoring students and supporting them in receiving
                university offers.
              </li>
              <li>
                Typically has supported students who received
                <strong>around 10 acceptance letters</strong> (this is a
                guideline, not a fixed requirement).
              </li>
              <li>
                While specific years of experience are not required, mentors at
                this level demonstrate a consistent track record of effective
                support.
              </li>
            </ul>
          </li>
          <li>
            <strong>Expert Mentor</strong>
            <ul>
              <li>
                Recognized for their deep knowledge and high level of expertise
                in university admissions.
              </li>
              <li>
                Demonstrated success in mentoring a large number of students.
              </li>
              <li>
                Often considered for this role if they have helped students
                receive <strong>20–30+ acceptance letters</strong> .
              </li>
              <li>
                Should have
                <strong>
                  at least 3 years of relevant mentorship experience
                </strong>
                in admissions or a related field.
              </li>
              <li>
                Strong reputation or proven results in a specialized area (e.g.
                Ivy League, medical schools, arts programs, etc.).
              </li>
            </ul>
            <strong>Important Note:</strong>
            <p>
              Acceptance letters and experience are considered case by case.
              These are general recommendations to guide level placement. If you
              have fewer acceptance letters or slightly different experience,
              you may still qualify for a Senior or Expert level based on your
              overall profile, mentoring approach, and demonstrated impact.
            </p>
            <p>
              We carefully review each mentor’s background to ensure the best
              fit on the platform.
            </p>
          </li>
        </ul>
        <p>
          You can browse mentor profiles and choose the one that fits your
          needs, or use our AI-powered matching system.
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
            Individual Sessions: One-on-one mentorship (30 or 60 minutes).
          </li>
          <li>
            Full Guidance Package: A 4-hour package providing in-depth
            application support.
          </li>
          <li>
            Intensive Course: An 8-hour program for those who need full
            mentorship through the application process.
          </li>
        </ul>
      </div>
    ),
  },
  {
    key: '1321',
    label: 'Who are Pro Bono Mentors?',
    children: (
      <p>
        Pro bono mentors are people who genuinely care about making a
        difference. They’re experienced students or professionals who choose to
        mentor for free because they believe in equal access to opportunities.
        By volunteering their time and knowledge, they help students,
        especially, those who may not be able to afford paid mentorship,
        navigate their journey toward top universities. It's their way of giving
        back and creating real social impact.
      </p>
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
    key: '5',
    label: "What is the Mentee's Dashboard, and what does it include?",
    children: (
      <div>
        <p>
          The Mentee’s Dashboard is your personal space on TopCoach, where you
          can:
        </p>
        <ul>
          <li>View your upcoming and past mentorship sessions</li>
          <li>View your favourite universities</li>
          <li>Track registered events</li>
          <li>Upload essays and application documents</li>
        </ul>
        <p>
          It helps you stay organized and make the most of your mentorship
          experience.
        </p>
      </div>
    ),
  },
  {
    key: '6',
    label: 'How much does a mentorship session cost?',
    children: (
      <div>
        <p>The pricing depends on the mentor level:</p>
        <ul>
          <li>
            Junior Coach: From $12.50 for 30 minutes to $130 for the intensive
            course.
          </li>
          <li>
            Senior Coach: From $25 for 30 minutes to $260 for the intensive
            course.
          </li>
          <li>
            Expert Coach: From $40 for 30 minutes to $550 for the intensive
            course.
          </li>
        </ul>
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
    key: '8',
    label: 'How do I know if TopCoach is right for me?',
    children:
      'If you are preparing for university applications, need help with essays, or want expert advice from those who have successfully navigated the process, TopCoach is the perfect place for you. You can start with a single session or choose a package for continuous guidance.',
  },
  {
    key: '9',
    label: 'How do coaches progress through different levels at TopCoach?',
    children:
      'Coaches at TopCoach advance based on their experience and success. To move from Junior to Senior, a coach needs to complete 150 hours of mentoring sessions. To progress from Senior to Expert, they must complete an additional 100 hours. Additionally, coaches receive bonuses for each mentee accepted into a top university.',
  },
];

const itemsUz: CollapseProps['items'] = [
  {
    key: '1',
    label: 'TopCoach nima?',
    children:
      'TopCoach — bu talabalarga universitetga ariza topshirish, testga tayyorgarlik ko‘rish, esse yozish va karyera bo‘yicha maslahat berishda tajribali mentorlar bilan bog‘lanish imkonini beruvchi mentorlik platformasidir.',
  },
  {
    key: '2',
    label: 'Qanday qilib to‘g‘ri mentorni tanlashim mumkin?',
    children: (
      <div>
        <p>Mentorlar ularning tajribasiga qarab uch darajaga bo‘linadi:</p>
        <p>
          Platformamizda uch darajadagi mentor mavjud: <strong>Junior</strong>,
          <strong>Senior</strong> va <strong>Expert</strong>. Quyida har bir
          daraja va qanday aniqlanishi haqida umumiy ma’lumot berilgan:
        </p>
        <ul>
          <li>
            <strong>Junior Mentor</strong>
            <ul>
              <li>Yaqinda nufuzli universitetga qabul qilingan.</li>
              <li>
                Boshqa abituriyentlarga yordam berish tajribasi cheklangan
                bo‘lishi mumkin.
              </li>
              <li>
                Hozirda talabalarga yordam berishni boshlagan yoki boshlamoqda.
              </li>
              <li>
                Boshqalarga yordam berishga kuchli motivatsiyaga ega va mentor
                sifatida o‘sishni xohlaydi.
              </li>
            </ul>
          </li>
          <li>
            <strong>Senior Mentor</strong>
            <ul>
              <li>
                Qabul jarayonini yaxshi tushunadi va uni shaxsan o‘zi
                muvaffaqiyatli bosib o‘tgan.
              </li>
              <li>
                Talabalarni universitetga kirishda qo‘llab-quvvatlash
                tajribasiga ega.
              </li>
              <li>
                Odatda 10 ta atrofida qabul xati olgan talabalarni
                qo‘llab-quvvatlagan (bu faqat tavsiya, qat’iy talab emas).
              </li>
              <li>
                Aniq yillik tajriba talabi yo‘q, ammo bu darajadagi mentorlar
                samarali yordam ko‘rsatgan izchil tajribaga ega bo‘lishi kera
              </li>
            </ul>
          </li>
          <li>
            <strong>Expert Mentor</strong>
            <ul>
              <li>
                Universitetga kirish bo‘yicha chuqur bilim va yuqori tajribaga
                ega sifatida tan olingan.
              </li>
              <li>Ko‘plab talabalarni muvaffaqiyatli mentorlik qilgan.</li>
              <li>
                Odatda 20–30 dan ortiq qabul xati olgan talabalar bilan ishlagan
                bo‘lsa, ushbu darajaga mos deb hisoblanadi.
              </li>
              <li>
                Kamida 3 yillik tegishli mentorlik tajribasiga ega bo‘lishi
                kerak.
              </li>
              <li>
                Maxsus yo‘nalishlarda (masalan, Ivy League, tibbiyot maktablari,
                san’at dasturlari) mustahkam obro‘-e’tibor yoki natijalarga ega.
              </li>
            </ul>
            <strong>Muhim eslatma:</strong>
            <p>
              Qabul xatlari va tajriba har bir holatda alohida ko‘rib chiqiladi.
              Bu ko‘rsatmalar umumiy tavsiyalar bo‘lib, sizning mentorlik
              darajangizni aniqlashga yordam beradi. Agar sizda kamroq qabul
              xatlari yoki biroz boshqacha tajriba bo‘lsa ham, sizning umumiy
              profilingiz va natijalaringiz asosida <strong>Senior</strong> yoki
              <strong>Expert</strong> darajasiga mos deb topilishingiz mumkin.
            </p>
          </li>
        </ul>
        <p>
          Siz mentor profillarini ko‘rib chiqishingiz yoki bizning sun’iy
          intellekt asosidagi moslashtirish tizimimizdan foydalanishingiz
          mumkin.
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
          <li>Individual Seanslar: Birga-bir mentorlik (30 yoki 60 daqiqa).</li>
          <li>
            To‘liq Yo‘nalish Paketi: 4 soatlik chuqur ariza qo‘llab-quvvatlash
            paketi.
          </li>
          <li>
            Intensiv Kurs: Ariza topshirish jarayonida to‘liq mentorlik uchun 8
            soatlik dastur.
          </li>
        </ul>
      </div>
    ),
  },
  {
    key: '1321',
    label: 'Pro Bono Mentorlar kimlar?',
    children: (
      <p>
        Pro bono murabbiylari - bu o‘zgarish qilish haqida chin dildan
        qayg‘uradigan odamlardir. Ular tajribali talabalar yoki mutaxassislar
        bo‘lib, bepul murabbiylik qilishni tanlaydilar, chunki ular teng
        imkoniyatlarga ega bo‘lishga ishonadilar. Ular o‘z vaqtlari va
        bilimlarini ko‘ngilli sifatida sarflab, talabalarga, ayniqsa, haq
        to‘lanadigan murabbiylikka qurbi yetmaydiganlarga eng yaxshi
        universitetlarga yo‘l topishda yordam berishadi. Bu ularning qaytarib
        berish va haqiqiy ijtimoiy ta’sir yaratish usulidir.
      </p>
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
    key: '5',
    label: 'Mentee Dashboard nima va unda nimalar bor?',
    children: (
      <div>
        <p>
          Mentee Dashboard — bu TopCoach’dagi shaxsiy maydonchangiz bo‘lib, unda
          siz:
        </p>
        <ul>
          <li>Kelayotgan va o‘tgan mentorlik seanslaringizni ko‘rishingiz</li>
          <li>Sevimli universitetlaringizni kuzatishingiz</li>
          <li>Ro‘yxatdan o‘tkazilgan tadbirlaringizni nazorat qilishingiz</li>
          <li>Esse va ariza hujjatlaringizni yuklashingiz mumkin</li>
        </ul>
        <p>
          Bu maydoncha sizni tartibli bo‘lishingizga va mentorlik tajribasidan
          maksimal foyda olishga yordam beradi.
        </p>
      </div>
    ),
  },
  {
    key: '6',
    label: 'Mentorlik seansi qancha turadi?',
    children: (
      <div>
        <p>Seans narxi mentor darajasiga qarab farq qiladi:</p>
        <ul>
          <li>
            Junior Coach: 30 daqiqa uchun $12.50 dan, intensiv kurs uchun $130
            gacha.
          </li>
          <li>
            Senior Coach: 30 daqiqa uchun $25 dan, intensiv kurs uchun $260
            gacha.
          </li>
          <li>
            Expert Coach: 30 daqiqa uchun $40 dan, intensiv kurs uchun $550
            gacha.
          </li>
        </ul>
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
    key: '8',
    label: 'TopCoach menga mos keladimi?',
    children:
      'Agar siz universitetga ariza topshirishga tayyorgarlik ko‘rayotgan bo‘lsangiz, esse yozishda yordamga muhtoj bo‘lsangiz yoki muvaffaqiyatli ariza topshirish jarayonidan maslahat olmoqchi bo‘lsangiz, TopCoach siz uchun ideal yechimdir. Siz bitta seansdan boshlashingiz yoki doimiy qo‘llab-quvvatlash uchun paket tanlashingiz mumkin.',
  },
  {
    key: '9',
    label: 'TopCoach’da murabbiylar turli darajalardan qanday o‘tadi?',
    children:
      'TopCoach murabbiylari tajribasi va muvaffaqiyatiga qarab ko‘tariladi. Kichikdan kattaga o‘tish uchun murabbiy 150 soatlik murabbiylik mashg‘ulotlarini o‘tkazishi kerak. Senior darajasidan Ekspert darajasiga o‘tish uchun ular qo‘shimcha 100 soat o‘qishlari kerak. Bundan tashqari, murabbiylar eng yaxshi universitetga qabul qilingan har bir shogird uchun mukofot oladilar.',
  },
];

const itemsRu: CollapseProps['items'] = [
  {
    key: '1',
    label: 'Что такое TopCoach?',
    children:
      'TopCoach — это платформа наставничества, которая соединяет студентов с опытными наставниками, помогающими с поступлением в университет, подготовкой к экзаменам, написанием эссе и карьерным консультированием.',
  },
  {
    key: '2',
    label: 'Как выбрать подходящего наставника?',
    children: (
      <div>
        <p>Наставники делятся на три уровня в зависимости от их опыта:</p>
        <p>
          На нашей платформе доступны три уровня менторов:{' '}
          <strong>Junior</strong>, <strong>Senior</strong> и{' '}
          <strong>Expert</strong>. Ниже представлен общий обзор каждого уровня и
          критерии, по которым мы определяем назначение:
        </p>
        <ul>
          <li>
            <strong>Junior Mentor</strong>
            <ul>
              <li>Недавно поступил(а) в ведущий университет.</li>
              <li>Может иметь ограниченный опыт помощи другим абитуриентам.</li>
              <li>
                В настоящее время помогает студентам или только начинает этот
                путь.
              </li>
              <li>
                Сильная мотивация помогать другим и развиваться как ментор.
              </li>
            </ul>
          </li>
          <li>
            <strong> Senior Mentor</strong>
            <ul>
              <li>
                Имеет чёткое понимание процесса поступления и успешно прошёл(а)
                его сам(а).
              </li>
              <li>
                Имеет опыт наставничества и помощи студентам в получении писем о
                зачислении.
              </li>
              <li>
                Обычно помог студентам получить около 10 писем о приёме (это
                ориентир, а не строгое требование).
              </li>
              <li>
                Годы опыта не являются обязательным условием, но на этом уровне
                ожидается устойчивая история эффективной помощи.
              </li>
            </ul>
          </li>
          <li>
            <strong>Expert Mentor</strong>
            <ul>
              <li>
                Признан(а) экспертом с глубокими знаниями в области поступления.
              </li>
              <li>
                Продемонстрировал(а) успех в наставничестве большого количества
                студентов.
              </li>
              <li>
                Обычно рассматривается на эту роль, если помог(ла) студентам
                получить 20–30+ писем о зачислении.
              </li>
              <li>
                Должен(на) иметь не менее 3 лет релевантного опыта
                наставничества.
              </li>
              <li>
                Имеет сильную репутацию или доказанные результаты в конкретных
                областях (например, Ivy League, медицинские школы, программы по
                искусству и т.д.).
              </li>
            </ul>
          </li>
          <strong>Важно:</strong>
          <p>
            {' '}
            Письма о зачислении и опыт рассматриваются индивидуально в каждом
            случае. Это лишь рекомендации, которые помогают нам определить
            уровень. Даже с меньшим количеством писем или отличающимся опытом вы
            можете быть отнесены к уровню <strong>Senior</strong> или{' '}
            <strong>Expert</strong> в зависимости от вашего общего профиля и
            вклада.
          </p>
        </ul>
        <p>
          Вы можете просмотреть профили наставников и выбрать подходящего, либо
          воспользоваться системой подбора с использованием искусственного
          интеллекта.
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
          <li>
            Полный пакет сопровождения: 4-часовой пакет для всесторонней
            поддержки при подаче документов.
          </li>
          <li>
            Интенсивный курс: 8-часовая программа для тех, кому необходимо
            полное сопровождение в процессе поступления.
          </li>
        </ul>
      </div>
    ),
  },
  {
    key: '1321',
    label: 'Кто такие менторы Pro Bono?',
    children: (
      <p>
        Pro bono менторы - это люди, которые искренне заботятся о том, чтобы
        внести свой вклад. Это опытные студенты или профессионалы, которые
        выбирают наставничество бесплатно, потому что верят в равный доступ к
        возможностям. Добровольно жертвуя своим временем и знаниями, они
        помогают студентам, особенно тем, кто не может позволить себе
        оплачиваемое наставничество, ориентироваться в своем пути к лучшим
        университетам. Это их способ отдать и создать реальный социальный
        эффект.
      </p>
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
    key: '5',
    label: 'Что такое панель управления для подопечных и что в ней содержится?',
    children: (
      <div>
        <p>
          Панель управления для подопечных — это ваше личное пространство на
          TopCoach, где вы можете:
        </p>
        <ul>
          <li>Просматривать предстоящие и прошедшие сеансы наставничества</li>
          <li>Просматривать избранные университеты</li>
          <li>Отслеживать зарегистрированные мероприятия</li>
          <li>Загружать эссе и документы для поступления</li>
        </ul>
        <p>
          Это помогает оставаться организованным и максимально использовать
          возможности наставничества.
        </p>
      </div>
    ),
  },
  {
    key: '6',
    label: 'Сколько стоит сеанс наставничества?',
    children: (
      <div>
        <p>Стоимость зависит от уровня наставника:</p>
        <ul>
          <li>
            Младший наставник: от $12.50 за 30 минут до $130 за интенсивный
            курс.
          </li>
          <li>
            Старший наставник: от $25 за 30 минут до $260 за интенсивный курс.
          </li>
          <li>
            Эксперт-наставник: от $40 за 30 минут до $550 за интенсивный курс.
          </li>
        </ul>
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
    key: '8',
    label: 'Как понять, подходит ли мне TopCoach?',
    children:
      'Если вы готовитесь к поступлению в университет, нуждаетесь в помощи с эссе или хотите получить экспертные советы от тех, кто успешно прошёл этот процесс, TopCoach — отличное решение. Вы можете начать с одного сеанса или выбрать пакет для постоянного сопровождения.',
  },
  {
    key: '9',
    label: 'Вопрос: Как тренеры проходят различные уровни в TopCoach?',
    children:
      'Тренеры в TopCoach продвигаются вверх в зависимости от их опыта и успеха. Чтобы перейти от младшего к старшему, тренер должен пройти 150 часов наставничества. Чтобы пройти путь от Старшего к Эксперту, им необходимо выполнить дополнительные 100 часов. Кроме того, тренеры получают бонусы за каждого студента, поступившего в топ-университет.',
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
    key: '2',
    label: 'Qalay durıs mentor saylaw kerek?',
    children: (
      <div>
        <p>Mentorlar óz tájiriybelerine qarap úsh derejede bólinip turadı:</p>
        <p>
          Platformámızda üç dárájedegi mentorlar bar: <strong>Junior</strong>,
          <strong>Senior</strong>, hám <strong>Expert</strong>. Ár bir dáráje
          túralı ámáli túsinikteme tómendegi dey:
        </p>
        <ul>
          <li>
            <strong>Junior Mentor</strong>
            <ul>
              <li>Jańa nufuzlı universitetke qabıl etilgen.</li>
              <li>Basqa úmitkerlerge járm etmekte az tásirı bolıwı múmkin.</li>
              <li>
                Qazir studentlerge járm etip baslap júr nemese jármshılıqtı jańa
                baslap atır.
              </li>
              <li>
                Basqalardıń jetistikke jetkiziwine járm etmekte kúshli
                motivatsiyaga iye.
              </li>
            </ul>
          </li>
          <li>
            <strong>Senior Mentor</strong>
            <ul>
              <li>Qabıl jarayanın jaqsı túsinedi hám ózinan tabıslı ótken.</li>
              <li>Studentlerge universitet qabılına járm etken tásiri bar.</li>
              <li>
                Ádette 10-ga jaqın qabıl hatın alıwğa járm etken studentler
                boladı (bular usınıs, shárt emes).
              </li>
              <li>
                Jıldıq tásiri shárt emes, bıraq bul dárájedegi mentorlar áserli
                jármshılıqtı kórsetken bolıwı kerek.
              </li>
            </ul>
          </li>
          <li>
            <strong>Expert Mentor</strong>
            <ul>
              <li>
                Universitet qabılı boyınsha teren bilim hám joqarı dárájedegi
                tásiri bar dep tanıladı.
              </li>
              <li>Kóp studentlerge tabıslı járm etken.</li>
              <li>
                Ádette 20–30-dan artıq qabıl hatı alıwğa járm etken studentler
                bar bolsa, bul dárájege tiyisli dep esaplanadı.
              </li>
              <li>Keminde 3 jıllıq tiyisli mentorlıq tásiri bolıwı kerek.</li>
              <li>
                Arnalas tarawlarda (mas., Ivy League, meditsina mektepteri, óner
                bağdarlamaları) joqarı abroý nemese dəlilledengen natıjalar
                boladı.
              </li>
            </ul>
            <strong>Mańızlı eskerw:</strong>
            <p>
              Qabıl hatları hám tásiri – ár bir holat boyınsha dárájeli túrde
              qaraladı. Bul usınıstar mentor dárájesin belgilewge járdem beredi.
              Áger qabıl hatları azraq bolsa da, nemese tásiri basqasha bolsa
              da, sizdiń jálpi profilingiz hám natıjalarıńız negizinde{' '}
              <strong>Senior</strong>
              nemese <strong>Expert</strong> bolıp belgilenwińiz múmkin.
            </p>
          </li>
        </ul>
        <p>
          Siz mentor profillerin kórip shıġıwıńız yamasa bizdiń jasalma
          intellekt sistemasındaġı maslastırıw qásiyetinen paydalanıwıńız
          múmkin.
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
          <li>
            Tolıq Jónelis Paketi: 4 saatlıq shuqir arza qollap-quwwatlaw paketi.
          </li>
          <li>
            Intensiv Kurs: Arza beriw járáyanında tolıq mentorlıq ushín 8
            saatlıq dástur.
          </li>
        </ul>
      </div>
    ),
  },
  {
    key: '1321',
    label: 'Pro Bono Mentorlar kimler?',
    children: (
      <p>
        Pro bono tárbiyashıları - bul shın mánisinde ózgeris islewdi qáleytuǵın
        adamlar. Olar tájiriybeli studentler yamasa qánigeler bolıp,
        imkaniyatlardan teń paydalanıwǵa isenetuǵınlıǵı sebepli biypul
        tárbiyalanıwdı tańlaydı. Olar óz waqtı hám bilimlerin ıqtıyarlı túrde
        ajıratıp, studentlerge, ásirese, haqı tólenetuǵın tárbiyalanıwǵa shaması
        kelmeytuǵın studentlerge joqarı oqıw orınlarına barıw jolın ashıwda
        járdem beredi. Bul olardıń qaytıp beriw hám haqıyqıy sociallıq tásir
        jaratıw usılı.
      </p>
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
    key: '5',
    label: 'Mentee Dashboard ne hám onda neler bar?',
    children: (
      <div>
        <p>
          Mentee Dashboard – bu TopCoach-daġı sizdiń jeke ornıńız bolıp, onda
          siz:
        </p>
        <ul>
          <li>Kelesi hám ótken mentorlıq seanslarıńızdı kóriwińiz.</li>
          <li>Súyikli universtitetlerińizdi baqlawıńız.</li>
          <li>Dizimge alınġan ilájlarıńızdı baqlap barıwıńız.</li>
          <li>Esse hám arza hújjetlerińizdi júklep múmkin.</li>
        </ul>
        <p>
          Bul maydansha sizdi tártipli bolıwıńızġa hám mentorlıq tájriybesinen
          maksimal paydalanıwǵa kómeklesedi.
        </p>
      </div>
    ),
  },
  {
    key: '6',
    label: 'Mentorlıq seansı baxası qansha?',
    children: (
      <div>
        <p>Seans baxası mentor dárájesine qarap ózgeredi:</p>
        <ul>
          <li>
            Junior Coach: 30 minut ushın $12.50-dan, intensiv kurs ushın $130-ġa
            deyin.
          </li>
          <li>
            Senior Coach: 30 minut ushın $25-dan, intensiv kurs ushın $260-ġa
            deyin.
          </li>
          <li>
            Expert Coach: 30 minut ushın $40-dan, intensiv kurs ushın $550-ġa
            deyin.
          </li>
        </ul>
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
    key: '8',
    label: 'TopCoach maġan mas kelema?',
    children:
      'Eger siz universtitetke arza beriwge tayarlıq kórip atırġan bolsańız, esse jazıwda kómek kerek bolsa yamasa hújjet tapsırıw járáyanında másláhát almaqshı bolsańız, TopCoach siz ushın ideal sheshim. Siz bir seanstan baslay alasız yamasa dawamıy qollaw ushın paket ala alasız.',
  },
  {
    key: '9',
    label: 'Trenerler TopCoachta hár qıylı dárejelerden qalay ótedi?',
    children:
      'TopCoach trenerleri óz tájiriybesi hám tabısı tiykarında joqarı basqıshqa kóteriledi. "Junior"dan "Senior"ǵa ótiw ushın trener 150 saatlıq tárbiyalanıw sabaqların ótiwi kerek. "Senior"dan "Expert" dárejesine ótiw ushın qosımsha 100 saat ótiwi kerek. Bunnan tısqarı, trenerlerge joqarı oqıw ornına qabıl etilgen hár bir oqıwshı ushın qosımsha pul beriledi.',
  },
];
