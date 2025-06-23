import { Flex, Form } from 'antd';
import { DefaultOptionType } from 'antd/es/select';
import { Dayjs } from 'dayjs';
import { Dispatch, SetStateAction } from 'react';
import { PaymentPlanTypeEnum } from 'src/app/api/Api';
import { IBaseOption } from 'src/app/type';
import { CustomText } from 'src/components/common';
import { InputFormItem } from 'src/components/form';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import useColors from 'src/hooks/useColors';
import { IHandleBookArgs } from '../../..';
import { FormInstance } from 'antd/lib';

export interface SessionInfoProps {
  bookingInfo: IHandleBookArgs | null;
  timezoneOptions: DefaultOptionType[];
  selectedTimezone: number;
  chosenInterval: IBaseOption;
  date?: Dayjs | null;
  form?: FormInstance;
}

export default function SessionInfo({
  bookingInfo,
  timezoneOptions,
  selectedTimezone,
  chosenInterval,
  date,
  form,
}: SessionInfoProps) {
  const colors = useColors();

  const sessionInfo = [
    {
      title: 'Session day',
      content: `${date?.format('dddd, MMM D')}${chosenInterval.value ? ', ' + chosenInterval.label : ''}`,
    },
    {
      title: 'Duration',
      // @ts-ignore
      content: `${bookingInfo?.planType === PaymentPlanTypeEnum.Individual30M ? 30 : 60} min`,
    },
    {
      title: 'Timezone',
      content: timezoneOptions.find(
        (timezone) => timezone.value === selectedTimezone
      )?.label,
    },
  ];

  return (
    <>
      {sessionInfo.map(({ title, content }) => (
        <Flex gap={2} vertical key={title}>
          <CustomText
            fontWeight={themeFontWeight.fontWeightMedium}
            color={colors.colorTextSecondary}
            fontSize={themeFontSize.fontSizeTitle9}
          >
            {title}
          </CustomText>
          <CustomText
            fontSize={themeFontSize.fontSizeTitle8}
            color={colors.colorTextBase}
            lineHeight={1.4}
            width={240}
          >
            {content}
          </CustomText>
        </Flex>
      ))}

      <Form style={{ width: 300 }} form={form} layout="vertical">
        <InputFormItem
          label="What do you want to focus on during your mentorship session? "
          inputType="textarea"
          name="reason"
          message="Please enter your answer"
          placeholder="(e.g., university selection, essay review, scholarship advice, interview prep)"
          required
          row={4}
        />
      </Form>
    </>
  );
}
