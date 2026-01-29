import Aos from 'aos';
import 'aos/dist/aos.css';
import { PropsWithChildren, useEffect } from 'react';

function AosProvider({ children }: PropsWithChildren) {
  // Initialize AOS
  useEffect(() => {
    Aos.init({
      easing: 'ease-out-cubic',
      once: true,
      offset: 0,
      duration: 800,
    });
  }, []);

  return <>{children}</>;
}

export default AosProvider;
