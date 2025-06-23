import styles from './universityLogos.module.scss';

export default function UniversityLogos() {
  return (
    <div className={styles.carousel}>
      <ul className={styles.carouselTrack}>
        {universitiesLogos.map((university, index) => (
          <li key={index}>
            <img
              src={university.image}
              alt={university.name}
              style={{ width: university?.width || undefined }}
            />
          </li>
        ))}
        {universitiesLogos.map((university, index) => (
          <li key={index}>
            <img
              src={university.image}
              alt={university.name}
              style={{ width: university?.width || undefined }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

const universitiesLogos = [
  {
    name: 'University of Pennsylvania',
    image: '/img/top20_university_images/pennsylvania.png',
  },
  {
    name: 'MIT',
    image: '/img/top20_university_images/mit.png',
  },
  {
    name: 'Stanford',
    image: '/img/top20_university_images/stanford.png',
  },
  {
    name: 'University of Oxford',
    image: '/img/top20_university_images/oxford.jpg',
  },
  {
    name: 'Harvard',
    image: '/img/top20_university_images/harvard.png',
  },
  {
    name: 'Cornell University',
    image: '/img/top20_university_images/cornell.png',
  },
  {
    name: 'University of Cambridge',
    image: '/img/top20_university_images/cambridge.png',
  },
  {
    name: 'Caltech',
    image: '/img/top20_university_images/caltech.png',
  },
  {
    name: 'University of California, Berkeley',
    image: '/img/top20_university_images/berkeley.png',
  },
  {
    name: 'Brown University',
    image: '/img/top20_university_images/brown.png',
  },
  {
    name: 'Columbia University',
    image: '/img/top20_university_images/columbia.png',
    width: 100,
  },
  {
    name: 'Princeton University',
    image: '/img/top20_university_images/princeton.png',
  },
  {
    name: 'Yale University',
    image: '/img/top20_university_images/yale.png',
  },
];
