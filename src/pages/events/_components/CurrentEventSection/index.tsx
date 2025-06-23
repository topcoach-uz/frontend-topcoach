import { Flex, Form, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomModal, CustomText } from 'src/components/common';
import FormMaker from 'src/components/form/FormMaker';
import { IFormItemType } from 'src/components/form/type';
import MainTitleDescription from 'src/components/mainTitleDesc';
import {
  themeColors,
  themeFontSize,
  themeFontWeight,
} from 'src/constants/theme';
import COUNTRY_LIST from 'src/data/countries.json';
import useColors from 'src/hooks/useColors';
import { useScreenSize } from 'src/hooks/useScreenSize';
import styles from './CurrentEvent.module.scss';
import useApi from 'src/hooks/useApi';
import { api } from 'src/app/api';
import { EventsSchema } from 'src/app/api/Api';
import { AxiosResponse } from 'axios';
import RichTextRenderer from 'src/pages/universities/_components/detail/richText';
import useCurrentEvent from './useCurrentEvent';

export default function CurrentEvent() {
  const navigate = useNavigate();
  const colors = useColors();
  const { screenSize } = useScreenSize();
  // const { t } = useTranslation();
  const [form] = Form.useForm();
  const { response: upcomingEventData } = useApi<AxiosResponse<EventsSchema>>(
    () => api.camps.getCurrentActiveEvent()
  );

  // const { handleMakeParams } = useParamsHook();
  const {
    handleCancel,
    handleOk,
    isModalOpen,
    // upcomingEventData,
    // onApplyClick,
    // showModal,
  } = useCurrentEvent();

  const [selectedCountry, setSelectedCountry] = useState<string>(''); // Default to 'Uzbekistan'

  const handleCountryClick = (country: string) => {
    setSelectedCountry(country);
  };

  const handleApply = (type: string) => {
    const specifiedCountry = form.getFieldValue('country');
    if (
      !selectedCountry ||
      (selectedCountry === 'others' && !specifiedCountry)
    ) {
      message.warning('Please select a country before proceeding.');
      return;
    }

    const specifiedCountryName = COUNTRY_LIST.find(
      (item) => item.value === specifiedCountry
    )?.label;

    navigate(
      `/events/${type}?country=${selectedCountry == 'others' ? specifiedCountryName : selectedCountry}`
    );
  };

  const formItems: IFormItemType[] = [
    {
      name: 'country',
      label: 'Country',
      type: 'select',
      placeholder: 'Select your country',
      message: 'Please select your country',
      options: COUNTRY_LIST,
    },
  ];

  return (
    <section>
      <div className={'container ' + styles.container}>
        <div className={styles.eventImage}>
          {/* @ts-expect-error url hasn't been typed yet */}
          <img src={upcomingEventData?.data?.media?.[0]?.url} alt="" />
          <Flex
            className={styles.eventContent}
            vertical={screenSize < 768}
            justify="space-between"
            align="center"
            gap={20}
          >
            <MainTitleDescription
              title={upcomingEventData?.data?.title as string}
              description=""
              titleColor={themeColors.dark.colorTextBase}
              descriptionColor={themeColors.dark.colorTextDescription}
            />
            {/* <Flex
              style={{ marginTop: 12, marginRight: 12 }}
              vertical
              align="center"
              gap={10}
            >
              <CustomButton
                iconPosition="start"
                icon={
                  <LikeIcon stroke="red" fill="red" className={styles.heart} />
                }
                onClick={showModal}
                darkMode={false}
                textColor={themeColors.light.colorTextBase}
              >
                Apply now
              </CustomButton>
              <CountDown targetDate={EVENT_DEADLINE} />
            </Flex> */}
          </Flex>
        </div>
        <CustomText
          color={colors.colorPrimary}
          fontWeight={themeFontWeight.fontWeightBold}
          fontSize={
            screenSize > 768
              ? themeFontSize.fontSizeTitle3
              : themeFontSize.fontSizeTitle4
          }
          mb={28}
          style={{
            display: 'inline-block',
            textAlign: 'center',
            width: '100%',
            // Use whiteSpace to preserve single newlines within the title if any
            whiteSpace: 'pre-line',
          }}
        >
          {upcomingEventData?.data?.summary as string}
        </CustomText>

        <RichTextRenderer
          // @ts-expect-error it is not typed yet
          blocks={upcomingEventData?.data.content?.blocks ?? []}
        />

        <CustomModal open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
          <CustomText color={colors.colorText} fontSize={22} fontWeight={600}>
            Select Your Application Type
          </CustomText>
          <CustomText fontSize={20}>Are you a citizen of:</CustomText>
          <div className={styles.countries}>
            <div
              onClick={() => handleCountryClick('Uzbekistan')}
              className={`${styles.country} ${selectedCountry === 'Uzbekistan' ? styles.countryActive : ''}`}
            >
              Uzbekistan
            </div>
            <div
              onClick={() => handleCountryClick('others')}
              className={`${styles.country} ${selectedCountry === 'others' ? styles.countryActive : ''}`}
            >
              Others
            </div>
          </div>
          {selectedCountry === 'others' && (
            <div className={styles.inputCountry}>
              <Form form={form} layout="vertical">
                <FormMaker formItems={formItems} />
              </Form>
            </div>
          )}
          <CustomText mt={16}>Which program are you applying for?</CustomText>
          <div className={styles.choice}>
            <div
              className={styles.under}
              onClick={() => handleApply('undergraduate')}
            >
              Undergraduate
            </div>
            <div
              className={styles.under}
              onClick={() => handleApply('graduate')}
            >
              Graduate
            </div>
          </div>
        </CustomModal>
      </div>
    </section>
  );
}
