export const BREAKPOINTS = {
  DESKTOP_LARGE: 1440, // Large desktops
  DESKTOP: 1280, // Standard desktop
  TABLET: 1024, // Tablets & small laptops
  MOBILE_LARGE: 768, // Large mobile devices
  MOBILE: 480, // Regular mobile phones
  MOBILE_SMALL: 360, // Small phones
};

export const isDesktop = () => window.innerWidth >= BREAKPOINTS.DESKTOP;
export const isTablet = () =>
  window.innerWidth >= BREAKPOINTS.TABLET &&
  window.innerWidth < BREAKPOINTS.DESKTOP;
export const isMobile = () => window.innerWidth < BREAKPOINTS.TABLET;
export const isSmallMobile = () => window.innerWidth < BREAKPOINTS.MOBILE;
