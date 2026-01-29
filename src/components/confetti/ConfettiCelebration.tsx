import React, { useEffect, useState } from 'react';
import { useTypedSelector } from 'src/app/store';
import { CustomText } from '../common';
import ConfettiExplosion from 'react-confetti-explosion';
import styles from './confetti.module.scss';

interface ConfettiProps {
  show: boolean;
  onComplete: () => void;
}

export default function ConfettiCelebration({
  show,
  onComplete,
}: ConfettiProps) {
  const { colors: themeColors } = useTypedSelector((state) => state.layout);
  const [showMessage, setShowMessage] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Responsive particle counts based on screen size
  const isMobile = window.innerWidth <= 768;
  const mainParticleCount = isMobile ? 150 : 400;
  const sideParticleCount = isMobile ? 75 : 200;
  useEffect(() => {
    if (show) {
      setShowConfetti(true);
      setShowMessage(true);

      // Hide message after 5 seconds
      const messageTimeout = setTimeout(() => {
        setShowMessage(false);
      }, 5000);

      // Complete animation after 7 seconds
      const completeTimeout = setTimeout(() => {
        setShowConfetti(false);
        onComplete();
      }, 7000);

      return () => {
        clearTimeout(messageTimeout);
        clearTimeout(completeTimeout);
      };
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className={styles.confettiContainer}>
      {/* Professional Confetti Library */}
      {showConfetti && (
        <div className={styles.confettiWrapper}>
          {' '}
          {/* Main central explosion */}
          <ConfettiExplosion
            force={0.9}
            duration={6000}
            particleCount={mainParticleCount}
            width={window.innerWidth}
            colors={[
              '#FFD700',
              '#FFA500',
              '#FF69B4',
              '#00CED1',
              '#32CD32',
              '#FF6347',
              '#9370DB',
              '#20B2AA',
              '#FF1493',
              '#00FA9A',
              '#1E90FF',
              '#FFB6C1',
            ]}
          />
          {/* Secondary left explosion */}
          <div style={{ position: 'absolute', left: '25%', top: '0' }}>
            <ConfettiExplosion
              force={0.7}
              duration={5500}
              particleCount={sideParticleCount}
              width={window.innerWidth * 0.5}
              colors={[
                '#FFD700',
                '#FF69B4',
                '#32CD32',
                '#9370DB',
                '#1E90FF',
                '#FFB6C1',
              ]}
            />
          </div>
          {/* Secondary right explosion */}
          <div style={{ position: 'absolute', right: '25%', top: '0' }}>
            <ConfettiExplosion
              force={0.7}
              duration={5500}
              particleCount={sideParticleCount}
              width={window.innerWidth * 0.5}
              colors={[
                '#FFA500',
                '#00CED1',
                '#FF6347',
                '#20B2AA',
                '#FF1493',
                '#00FA9A',
              ]}
            />
          </div>
        </div>
      )}

      {/* Congratulations Message */}
      {showMessage && (
        <div className={styles.congratsMessage}>
          <div className={styles.messageContent}>
            {' '}
            <CustomText
              fontSize={36}
              fontWeight={700}
              color={themeColors.colorPrimary}
              className={styles.congratsText}
            >
              🎉 Congrats! 🎉
            </CustomText>
            <CustomText
              fontSize={18}
              color={themeColors.colorTextBase}
              className={styles.acceptedText}
            >
              You are in! Your application has been accepted!
            </CustomText>
          </div>
        </div>
      )}
    </div>
  );
}
