/** Subject-specific decoration, not additional assessment evidence.
 * Specific disciplines precede broad families so Bioengineering isn't a
 * software card and Medical Laboratory Science isn't a general care card.
 */
export function majorMotif(name: string) {
  const subject = name.normalize('NFKC').toLowerCase();
  const families = [
    ['neuroscience', /neuro|нейро/],
    ['laboratory', /laboratory|clinical lab|medical lab|лаборатор/],
    ['biomedical', /biomed|bioengineer|biotechn|genetic|molecular|биомед|биотех|генет/],
    ['health', /medicin|medical|health|nurs|dent|pharmac|physiotherap|public health|медицин|здравоохран|фармац/],
    ['law', /\blaw\b|legal|juris|crimin|право|юрис|huquq/],
    ['psychology', /psych|counsel|психолог/],
    ['architecture', /architect|urban design|built environment|архитект/],
    ['environment', /environment|ecolog|sustainab|conservation|эколог/],
    ['agriculture', /agricultur|agronom|horticultur|veterinar|агроном|ветеринар/],
    ['biology', /biolog|life science|zoolog|botan|биолог/],
    ['chemistry', /chem|хим/],
    ['physics', /physic|astronom|astrophys|физик|астроном/],
    ['math', /mathemat|statistic|actuar|математ|статист/],
    ['computing', /computer|software|data science|data analy|information (?:system|science|security)|artificial intelligence|cyber|informatics|компьют|информат/],
    ['engineering', /engineer|robot|mechanic|technolog|инженер|механик/],
    ['economics', /econom|financ|account|эконом|финанс/],
    ['business', /business|management|market|entrepreneur|commerce|бизнес|менедж/],
    ['education', /educat|teach|pedagog|образован|педагог/],
    ['languages', /language|linguist|literat|translation|язык|лингв|литератур/],
    ['music', /music|performing|dance|theatr|музык|театр/],
    ['arts', /\bart\b|\barts\b|design|fine art|худож|дизайн/],
    ['media', /journal|communicat|media|film|cinema|журнал|коммуникац/],
    ['geography', /geograph|geolog|earth|geophys|географ|геолог/],
    ['society', /policy|politic|social|sociolog|history|international relations|philosoph|theolog|истор|социолог|полит/],
    ['sport', /sport|exercise|kinesiolog|спортив/],
  ] as const;
  return families.find(([, pattern]) => pattern.test(subject))?.[0] ?? 'explore';
}
