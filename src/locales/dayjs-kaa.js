// Karakalpak (kaa) locale for dayjs
// Based on the structure of other Central Asian locales

import dayjs from 'dayjs';

const locale = {
  name: 'kaa', // Karakalpak (Latin)
  weekdays:
    'Yakshanba_Dushanba_Seshanba_Chorshanba_Payshanba_Juma_Shanba'.split('_'),
  weekdaysShort: 'Yak_Dush_Sesh_Chor_Pay_Jum_Shan'.split('_'),
  weekdaysMin: 'Ya_Du_Se_Ch_Pa_Ju_Sh'.split('_'),
  months:
    'Yanvar_Fevral_mart_Aprel_May_Iyun_Iyul_Avgust_Sentyabr_Oktyabr_Noyabr_Dekabr'.split(
      '_'
    ),
  monthsShort: 'Yan_Fev_Mar_Apr_May_Iyu_Iul_Avg_Sen_Okt_Noy_Dek'.split('_'),
  weekStart: 1, // Monday
  yearStart: 4,
  formats: {
    LT: 'HH:mm',
    LTS: 'HH:mm:ss',
    L: 'DD.MM.YYYY',
    LL: 'D MMMM YYYY',
    LLL: 'D MMMM YYYY HH:mm',
    LLLL: 'dddd, D MMMM YYYY HH:mm',
  },
  relativeTime: {
    future: '%s Ishinde',
    past: '%s Burın',
    s: 'Birneshe sekund',
    m: 'Bir minut',
    mm: '%d Minut',
    h: 'Bir saat',
    hh: '%d Saat',
    d: 'Bir kun',
    dd: '%d Kun',
    M: 'Bir ay',
    MM: '%d Ay',
    y: 'Bir jıl',
    yy: '%d Jıl',
  },
  ordinal: (n) => n,
  meridiem: (hour, minute, isLowercase) => {
    if (hour < 12) {
      return isLowercase ? 'Erten' : 'ERTEN';
    }
    return isLowercase ? 'Keshki' : 'KESHKI';
  },
};

dayjs.locale(locale, null, true);

export default locale;
