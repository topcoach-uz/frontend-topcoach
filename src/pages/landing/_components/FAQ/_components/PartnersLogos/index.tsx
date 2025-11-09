import styles from './partnersLogos.module.scss';

export default function PartnersLogos() {
  return (
    <div className={styles.partnersSection}>
      <div className={styles.title}>Supported by</div>
      <div className={styles.carousel}>
        <ul className={styles.carouselTrack}>
          {partnersLogos.map((partner, index) => (
            <li key={index}>
              <img
                src={partner.image}
                alt={partner.name}
              />
            </li>
          ))}
          {partnersLogos.map((partner, index) => (
            <li key={index}>
              <img
                src={partner.image}
                alt={partner.name}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const partnersLogos = [
  {
    name: 'Ibrat',
    image: '/img/ibrat logo.png',
  },
  {
    name: 'IT Park Uzbekistan',
    image: '/img/IT_PARK_UZBEKISTAN_logo.png',
  },
  {
    name: 'Pizza Pitch',
    image: '/img/pizzapitch.png',
  },
  {
    name: 'Draper University',
    image: '/img/1632171104299.png',
  },
  {
    name: 'Sarmovc Ventures',
    image: '/img/sarmovc-logo.avif',
  },
  {
    name: 'Silk',
    image: '/img/silk.jpg',
  },
  {
    name: 'UNDP',
    image: '/img/undp-logo-png_seeklogo-322648.png',
  },
  {
    name: 'Yoshlar Ishleri Agentligi',
    image: '/img/Yoshlar_ishlari_agentligi_logotipi.svg.png',
  },
];

