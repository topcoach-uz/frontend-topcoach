import { useForm } from 'antd/es/form/Form';
import { IFormItemType } from 'src/components/form/type';

export default function useAcademicInfo() {
  const [form] = useForm();
  return { form, formItems };
}

const formItems: IFormItemType[] = [
  {
    name: 'langugae',
    label: 'Language',
    type: 'select',
    // rules: [{ required: true, message: 'Please select your language' }],
    options: [
      { label: 'Uzbek', value: 'uz' },
      { label: 'English', value: 'en' },
      { label: 'Russian', value: 'ru' },
      { label: 'French', value: 'fr' },
      { label: 'Spanish', value: 'sp' },
    ],
    mode: 'multiple',
  },
  {
    name: 'Major',
    label: 'Major',
    type: 'input',
    htmlType: 'text',
    inputType: 'text',
    message: 'You must enter your major',
    col: 24,
  },
  {
    name: 'University',
    label: 'University',
    type: 'input',
    htmlType: 'text',
    inputType: 'text',
    message: 'You must enter your University',
    col: 24,
  },
  {
    name: 'university_end_date',
    label: 'University End Date',
    type: 'datePicker',
    picker: 'month',
    htmlType: 'date',
    message: 'Please select your university end date',
    col: 11,
  },
  {
    name: 'university_start_date',
    label: 'University Start Date',
    type: 'datePicker',
    picker: 'month',
    htmlType: 'date',
    message: 'Please select your university start date',
    col: 11,
  },
];
