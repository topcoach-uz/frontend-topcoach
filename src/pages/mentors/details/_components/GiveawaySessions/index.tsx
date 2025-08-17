import { Flex } from 'antd';
import { CustomCard } from 'src/components/cards';
import { CustomButton, CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import styles from './giveaway_sessions.module.scss';
import { useTranslation } from 'react-i18next';
import { useScreenSize } from 'src/hooks/useScreenSize';

interface Props {
  giveawaySessions: any[];
  onBookGiveawaySession?: (sessionId: string) => void;
  hasBookedGiveaway?: boolean;
}

export default function GiveawaySessions({
  giveawaySessions,
  onBookGiveawaySession,
  hasBookedGiveaway = false,
}: Props) {
  const colors = useColors();
  const { t } = useTranslation();
  const { screenSize } = useScreenSize();

  if (giveawaySessions.length === 0) {
    return null;
  }

  return (
    <CustomCard 
      shadowed={false} 
      bordered 
      borderRadius={16}
      style={{ 
        borderColor: '#FF6B35', 
        borderWidth: '2px',
        background: 'linear-gradient(135deg, #fff5f2 0%, #ffe8e0 100%)'
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <CustomText
          fontSize={themeFontSize.fontSizeTitle4}
          fontWeight={themeFontWeight.fontWeightBold}
          color="#FF6B35"
          mb={8}
        >
          🎁 FREE GIVEAWAY SESSIONS
        </CustomText>
        <CustomText
          fontSize={themeFontSize.fontSizeTitle8}
          lineHeight={1.4}
          color={colors.colorTextSecondary}
        >
          Limited time offer! Book a free 30-minute session with this mentor.
        </CustomText>
      </div>

      <Flex vertical gap={12}>
        {giveawaySessions.map((session) => (
          <CustomCard 
            shadowed={false} 
            bordered 
            key={session.id} 
            borderRadius={12}
            style={{ 
              borderColor: '#FF6B35', 
              borderWidth: '1px',
              backgroundColor: '#fff'
            }}
          >
            <Flex
              align={screenSize < 560 ? 'center' : 'center'}
              justify={screenSize < 560 ? 'center' : 'space-between'}
              vertical={screenSize < 560}
              gap={screenSize < 560 ? 16 : 0}
            >
              <div>
                <CustomText
                  color="#FF6B35"
                  fontWeight={themeFontWeight.fontWeightSemibold}
                  fontSize={16}
                  mb={4}
                >
                  Free 30-Minute Session
                </CustomText>
                <CustomText
                  color={colors.colorTextSecondary}
                  fontSize={14}
                >
                  {new Date(session.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CustomText>
                <CustomText
                  color={colors.colorTextSecondary}
                  fontSize={14}
                >
                  {new Date(session.date).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </CustomText>
              </div>

              {!hasBookedGiveaway && onBookGiveawaySession && (
                <CustomButton
                  type="primary"
                  height={40}
                  width="max-content"
                  style={{ 
                    borderRadius: 8, 
                    padding: '0 20px',
                    backgroundColor: '#FF6B35',
                    borderColor: '#FF6B35',
                    fontWeight: 600,
                    fontSize: 14
                  }}
                  onClick={() => onBookGiveawaySession(session.id)}
                >
                  Book Free Session
                </CustomButton>
              )}

              {hasBookedGiveaway && (
                <CustomText
                  color="#FF6B35"
                  fontSize={14}
                  fontWeight={600}
                  style={{ 
                    padding: '8px 16px',
                    backgroundColor: '#fff5f2',
                    borderRadius: 6,
                    border: '1px solid #FF6B35'
                  }}
                >
                  ✓ Already Booked
                </CustomText>
              )}
            </Flex>
          </CustomCard>
        ))}
      </Flex>

      {!hasBookedGiveaway && (
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          backgroundColor: '#fff5f2', 
          borderRadius: 8,
          border: '1px dashed #FF6B35'
        }}>
          <CustomText
            color="#FF6B35"
            fontSize={13}
            style={{ textAlign: 'center' }}
          >
            ⚠️ Only one giveaway session per user. First come, first served!
          </CustomText>
        </div>
      )}
    </CustomCard>
  );
} 