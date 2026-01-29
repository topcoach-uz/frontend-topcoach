import { useState, useEffect } from 'react';
import { BREAKPOINTS } from 'src/constants/screen';
import { throttle } from 'src/utils';

export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setScreenSize(window.innerWidth);
    const throttledHandleResize = throttle(handleResize, 200);

    window.addEventListener('resize', throttledHandleResize);

    return () => window.removeEventListener('resize', throttledHandleResize);
  }, []);

  return {
    isDesktop: screenSize >= BREAKPOINTS.DESKTOP,
    isTablet:
      screenSize >= BREAKPOINTS.TABLET && screenSize < BREAKPOINTS.DESKTOP,
    isMobile: screenSize < BREAKPOINTS.TABLET,
    isSmallMobile: screenSize < BREAKPOINTS.MOBILE,
    screenSize,
  };
};
