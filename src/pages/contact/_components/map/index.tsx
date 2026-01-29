import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

declare global {
  interface Window {
    ymaps: any;
  }
}

import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';

export default function LocationDetails() {
  const colors = useColors();
  const { t } = useTranslation();

  useEffect(() => {
    // Check if the script is already loaded
    if (!window.ymaps) {
      const script = document.createElement('script');
      script.src = 'https://api-maps.yandex.ru/2.1/?lang=en_RU';
      script.type = 'text/javascript';
      script.async = true;
      script.onload = () => {
        window.ymaps.ready(initMap);
      };
      document.body.appendChild(script);
    } else {
      window.ymaps.ready(initMap);
    }

    function initMap() {
      const map = new window.ymaps.Map('map', {
        center: [41.320109, 69.262549], // Change to your coordinates
        zoom: 12,
      });

      map.geoObjects.add(
        new window.ymaps.Placemark([41.320109, 69.262549], {
          balloonContent: 'Our Office',
        })
      );
    }
  }, []);

  return (
    <div>
      <CustomText
        fontSize={themeFontSize.fontSizeTitle5}
        fontWeight={themeFontWeight.fontWeightSemibold}
        color={colors.colorTextBase}
        mb={4}
      >
        {t('contact.mapTitle')}
      </CustomText>
      <CustomText
        fontSize={themeFontSize.fontSizeTitle8}
        color={colors.colorTextTertiary}
        lineHeight={1.4}
        mb={16}
      >
        {t('contact.location')}
      </CustomText>
      <div id="map" style={{ width: '100%', height: '400px' }}></div>
    </div>
  );
}
