import { Locale } from 'antd/es/locale';
import { useTranslation } from 'react-i18next';
import uzUz from 'antd/locale/uz_UZ';
import ruRu from 'antd/locale/ru_RU';

export default function useAntdProvider() {
  const { i18n, t } = useTranslation();

  const editedUz: Locale = {
    ...uzUz,
    Modal: {
      ...uzUz.Modal,
      cancelText: t('shared.modalCancel'),
      okText: t('shared.modalOk'),
      justOkText: t('shared.modalOk'),
    },
    DatePicker: {
      lang: {
        ...(uzUz.DatePicker?.lang as any),
        shortWeekDays: ['Ya', 'Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha'],
        shortMonths: [
          'Yan',
          'Fev',
          'Mar',
          'Apr',
          'May',
          'Iyun',
          'Iyul',
          'Avg',
          'Sen',
          'Okt',
          'Noy',
          'Dek',
        ],
      },
      timePickerLocale: uzUz.DatePicker?.timePickerLocale as any,
    },
  };

  const kaaKaa: Locale = {
    locale: 'kk', // Karakalpak locale code (usually 'kaa')
    Pagination: {
      items_per_page: '/ bet',
      jump_to: 'Barıw',
      jump_to_confirm: 'tastıyıqlaw',
      page: 'Bet',
      prev_page: 'Aldınģi bet',
      next_page: 'Keyingi bet',
      prev_5: 'Aldınģi 5 bet',
      next_5: 'Keyingi 5 bet',
      prev_3: 'Aldınģi 3 bet',
      next_3: 'Keyingi 3 bet',
      page_size: 'bet ólshemi',
    },
    DatePicker: {
      // @ts-ignore
      lang: {
        placeholder: 'Sáneni tańlaw',
        yearPlaceholder: 'Jıldı tańlaw',
        quarterPlaceholder: 'Sherekti tańlaw',
        monthPlaceholder: 'Aydı tańlaw',
        weekPlaceholder: 'Hápte tańlaw',
        rangePlaceholder: ['Baslanǵan kúni', 'Tamam bolıw múddeti'],
        rangeYearPlaceholder: ['Baslanıw jılı', 'Juwmaqlaw jılı'],
        rangeQuarterPlaceholder: ['Baslanıw sheregi', 'Juwmaqlaw sheregi'], // Translated
        rangeMonthPlaceholder: ['Baslanıw ayı', 'Juwmaqlaw ayı'], // Translated
        rangeWeekPlaceholder: ['Baslanıw háptesi', 'Juwmaqlaw háptesi'], // Translated
        backToToday: 'Búginge qaytıp',
        now: 'Házir', // Added translation for 'Now' often present in DatePicker
        ok: 'Maqul', // Added translation for 'OK' often present in DatePicker
        locale: 'kaa_Latn', // Specify locale and script if needed
        dateFormat: 'YYYY-MM-DD',
        dayFormat: 'D',
        dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
        monthBeforeYear: true,
        previousMonth: 'Aldınǵı ay (PageUp)',
        nextMonth: 'Keyingi ay (PageDown)',
        previousYear: 'Aldınǵı jıl (Control + left)',
        nextYear: 'Keyingi jıl (Control + right)',
        previousDecade: 'Aldınǵı on jıl',
        nextDecade: 'Keyingi on jıl',
        previousCentury: 'Aldınǵı ásir',
        nextCentury: 'Keyingi ásir',
        // Months
        shortMonths: [
          'Yan',
          'Fev',
          'Mar',
          'Apr',
          'May',
          'Iyn',
          'Iyl',
          'Avg',
          'Sen',
          'Okt',
          'Noy',
          'Dek',
        ],
        // Weekdays
        shortWeekDays: ['Jek', 'Dúy', 'Siy', 'Sár', 'Pay', 'Ju', 'She'],
      },
      timePickerLocale: {
        placeholder: 'Waqıttı tańlaw', // Translated
        rangePlaceholder: ['Baslanıw waqtı', 'Juwmaqlaw waqtı'], // Translated
      },
    },
    TimePicker: {
      placeholder: 'Waqıttı tańlaw', // Translated
      rangePlaceholder: ['Baslanıw waqtı', 'Juwmaqlaw waqtı'], // Translated
      // Added 'now' and 'ok' for TimePicker consistency
      now: 'Házir',
      ok: 'Maqul',
    },
    // Calendar: { // Add specific Calendar translations if needed, often shares DatePicker's lang
    //   lang: { ... }
    // },
    global: {
      placeholder: 'Tańlań', // Translated ("Select" or "Choose")
    },
    Table: {
      filterTitle: 'Filtr menyusı', // Translated
      filterConfirm: 'Maqul', // Translated ("OK")
      filterReset: 'Tazalaw', // Translated ("Reset" or "Clear")
      filterEmptyText: 'Filtrler joq', // Translated
      filterCheckall: 'Hámme elementlerdi tańlaw', // Translated
      filterSearchPlaceholder: 'Filtrlerden izlew', // Translated
      emptyText: 'Maǵlıwmatlar joq', // Translated
      selectAll: 'Usı betti tańlaw', // Translated
      selectInvert: 'Usı betti teskarilew', // Translated
      selectNone: 'Hámme maǵlıwmatlardı tazalaw', // Translated
      selectionAll: 'Hámme maǵlıwmatlardı tańlaw', // Translated
      sortTitle: 'Sortlaw', // Translated
      expand: 'Qatardı keńeytiw', // Translated
      collapse: 'Qatardı jıynaw', // Translated
      triggerDesc: 'Kemeyiw tártibinde sortlaw ushın basıń', // Translated
      triggerAsc: 'Ósiw tártibinde sortlaw ushın basıń', // Translated
      cancelSort: 'Sortlawdı biykar etiw ushın basıń', // Translated
    },
    Tour: {
      Next: 'Keyingi', // Translated
      Previous: 'Aldınǵı', // Translated
      Finish: 'Juwmaqlaw', // Translated
    },
    Modal: {
      okText: 'Maqul', // Translated
      cancelText: 'Biykar etiw', // Translated
      justOkText: 'Maqul', // Translated
    },
    Popconfirm: {
      okText: 'Maqul', // Translated
      cancelText: 'Biykar etiw', // Translated
    },
    Transfer: {
      titles: ['', ''],
      searchPlaceholder: 'Usı jerden izlew', // Translated
      itemUnit: 'element', // Translated
      itemsUnit: 'elementler', // Translated
      remove: 'Óshiriw', // Translated
      selectCurrent: 'Usı betti tańlaw', // Translated
      removeCurrent: 'Usı betti óshiriw', // Translated
      selectAll: 'Hámme maǵlıwmatlardı tańlaw', // Translated
      deselectAll: 'Hámme maǵlıwmatlardı tańlawdı biykar etiw', // Translated
      removeAll: 'Hámme maǵlıwmatlardı óshiriw', // Translated
      selectInvert: 'Usı betti teskarilew', // Translated
    },
    Upload: {
      uploading: 'Júklenbekte...', // Translated
      removeFile: 'Fayldı óshiriw', // Translated
      uploadError: 'Júklew qáteligi', // Translated
      previewFile: 'Fayldı aldınnan kóriw', // Translated
      downloadFile: 'Fayldı júklep alıw', // Translated
    },
    Empty: {
      description: 'Maǵlıwmatlar joq', // Translated
    },
    Icon: {
      icon: 'belgishe', // Translated
    },
    Text: {
      edit: 'Redaktorlaw', // Translated
      copy: 'Kóshirip alıw', // Translated
      copied: 'Kóshirip alındı', // Translated
      expand: 'Keńeytiw', // Translated
      collapse: 'Jıynaw', // Translated
    },
    Form: {
      optional: '(májbúriy emes)', // Translated
      defaultValidateMessages: {
        default: "'${label}' maydanın tekseriw qáteligi", // Translated
        required: "'${label}' maydanın kiritiń", // Translated
        enum: "'${label}' [${enum}] dizimindegilerden biri bolıwı kerek", // Translated
        whitespace: "'${label}' bos orın belgisi bola almaydı", // Translated
        date: {
          format: "'${label}' sáne formatı nadurıs", // Translated
          parse: "'${label}' sánege túrlendirile almaydı", // Translated
          invalid: "'${label}' nadurıs sáne", // Translated
        },
        // types (often kept as 'string', 'number' etc. but can be translated)
        types: {
          string: "'${label}' nátiyjeli qatar emes", // Translated
          method: "'${label}' nátiyjeli funkciya emes", // Translated
          array: "'${label}' nátiyjeli massiv emes", // Translated
          object: "'${label}' nátiyjeli obyekt emes", // Translated
          number: "'${label}' nátiyjeli san emes", // Translated
          date: "'${label}' nátiyjeli sáne emes", // Translated
          boolean: "'${label}' nátiyjeli logikalıq mánis emes", // Translated
          integer: "'${label}' nátiyjeli pútin san emes", // Translated
          float: "'${label}' nátiyjeli bólshek san emes", // Translated
          regexp: "'${label}' nátiyjeli RegEx emes", // Translated
          email: "'${label}' nátiyjeli el. pochta mánzili emes", // Translated
          url: "'${label}' nátiyjeli URL mánzili emes", // Translated
          hex: "'${label}' nátiyjeli on altılıq mánis emes", // Translated
        },
        string: {
          len: "'${label}' ${len} belgiden ibarat bolıwı kerek", // Translated
          min: "'${label}' keminde ${min} belgiden ibarat bolıwı kerek", // Translated
          max: "'${label}' kóbí menen ${max} belgiden ibarat bolıwı kerek", // Translated
          range: "'${label}' ${min} hám ${max} belgiler arasında bolıwı kerek", // Translated
        },
        number: {
          len: "'${label}' ${len} sanına teń bolıwı kerek", // Translated
          min: "'${label}' eń keminde ${min} bolıwı kerek", // Translated
          max: "'${label}' eń kóbí ${max} bolıwı kerek", // Translated
          range: "'${label}' ${min} hám ${max} arasında bolıwı kerek", // Translated
        },
        array: {
          len: "'${len} ${label} bolıwı kerek'", // Translated
          min: "'Keminde ${min} ${label} bolıwı kerek'", // Translated
          max: "'Kóbí menen ${max} ${label} bolıwı kerek'", // Translated
          range: "'${label}' muǵdarı ${min} hám ${max} arasında bolıwı kerek'", // Translated
        },
        pattern: {
          mismatch: "'${label}' ${pattern} úlgisine sáykes kelmeydi", // Translated
        },
      },
    },
    Image: {
      preview: 'Aldınnan kóriw', // Translated
    },
    QRCode: {
      expired: 'QR kod múddeti ótti', // Translated
      refresh: 'Jańalaw', // Translated
      scanned: 'Skanerlendi', // Translated
    },
    ColorPicker: {
      presetEmpty: 'Bos', // Translated
      transparent: 'Móldir', // Translated
      singleColor: 'Jeke reń', // Translated
      gradientColor: 'Gradient reń', // Translated
      // Add more specific ColorPicker terms if needed
    },
  };

  const locale =
    i18n.language === 'uz'
      ? editedUz
      : i18n.language == 'ru'
        ? ruRu
        : i18n.language == 'kk'
          ? kaaKaa
          : undefined;

  return { locale };
}
