import { BreadcrumbItemType } from 'antd/es/breadcrumb/Breadcrumb';
import { useForm } from 'antd/es/form/Form';
import { Link, useLocation } from 'react-router-dom';
import { useScreenSize } from 'src/hooks/useScreenSize';

export default function useApply() {
  const [form] = useForm();
  const { screenSize } = useScreenSize();

  const { pathname } = useLocation();
  const splittedPath = pathname.split('/');
  const eventId = splittedPath[splittedPath.length - 2];

  const breadcrumbItems: BreadcrumbItemType[] = [
    {
      title: <Link to="/">Home</Link>,
    },
    {
      title: <Link to="/events">Events</Link>,
    },
    {
      title: <Link to={`/events`}>Event Information</Link>,
    },
    {
      title: 'Apply to Event',
    },
  ];

  const col = screenSize < 768 ? 24 : 12;

  const undergraduateFormItems = {
    formItems: [
      {
        name: 'fullName',
        type: 'input',
        label: 'Full Name',
        inputType: 'text',
        message: 'Please enter your full name',
        placeholder: 'Your full name', // Changed
        col,
      },
      {
        name: 'dateOfBirth',
        type: 'datePicker',
        htmlType: 'date',
        label: 'Date of Birth',
        message: 'Please select your date of birth',
        placeholder: 'Select your date of birth', // Kept standard placeholder
        col,
      },
      {
        name: 'jshshir',
        type: 'input',
        htmlType: 'number',
        inputType: 'text', // Should likely be 'number' if htmlType is number, but kept as original
        label: 'Passport Number',
        message: 'Please enter your passport number',
        placeholder: 'Your passport Number', // Changed
        col,
      },
      {
        name: 'passportNumber',
        type: 'input',
        htmlType: 'number',
        inputType: 'text', // Should likely be 'number' or just use htmlType if needed
        label: 'Passport ID',
        message: 'Please enter your passport ID',
        placeholder: 'Passport series and number (e.g., 34567)', // Changed
        col,
      },
      {
        name: 'passportIssuingAuthority',
        type: 'input',
        label: 'Passport Issuing Authority', // Cleaned label
        inputType: 'text',
        message: 'Please enter your passport issuing authority',
        placeholder:
          'Name of the issuing body (e.g., Ministry of Internal Affairs)', // Changed
        col,
      },
      {
        name: 'school',
        type: 'input',
        label: 'School', // Cleaned label
        inputType: 'text',
        message: 'Please enter your school',
        placeholder: 'Your current school name', // Changed
        col,
      },
      {
        name: 'region',
        type: 'input',
        inputType: 'text',
        label: 'Region',
        message: 'Please enter your region',
        placeholder: 'Your region (e.g., Tashkent City, Samarkand Region)', // Changed
        col,
      },
      {
        name: 'standardizedTestScores',
        type: 'input',
        htmlType: 'number', // Consider if this should allow text for test names too
        inputType: 'text',
        label: 'Standardized test scores',
        message: 'Please enter your standardized test scores',
        placeholder: 'e.g., IELTS 7.0, SAT 1400, TOEFL 100', // Changed
        col,
      },
      {
        name: 'attendedTopUniCamp',
        type: 'select',
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
        label: 'Previously attended Top Uni camp',
        message: 'Please enter your previously attended Top Uni camp',
        placeholder: 'Select Yes or No', // Changed
        col,
      },
      {
        name: 'parentFullName',
        type: 'input',
        inputType: 'text',
        label: 'Parent/Guardian Full Name',
        message: 'Please enter your parent/guardian full name',
        placeholder: "Your parent's or guardian's full name", // Changed
        col,
      },
      {
        name: 'parentPhone',
        type: 'input',
        inputType: 'text',
        mask: '+998 (00) 000-00-00',
        label: 'Parent/Guardian Phone Number',
        message: 'Please enter your parent/guardian phone number',
        placeholder: '+998 (XX) XXX-XX-XX', // Changed to reflect mask format
        col,
      },
      {
        name: 'parentEmail',
        type: 'input',
        inputType: 'text',
        htmlType: 'email',
        label: 'Parent/Guardian Email (optional)',
        placeholder: 'parent.email@example.com', // Changed
        col,
      },
      {
        name: 'emergencyContact',
        type: 'input',
        inputType: 'text',
        label: 'Emergency Contact Information',
        message: 'Please enter your emergency contact information',
        placeholder:
          'Contact person and phone number (e.g., Uncle John +998 XX XXX XX XX)', // Changed
        col,
      },
      {
        name: 'languageCertificates',
        type: 'upload',
        inputType: 'text',
        label: 'Upload your language certificates (IELTS/CEFR/Duolingo/SAT)',
        message: 'Please enter your academic transcript submission',
        placeholder: 'Upload your academic transcript',
        col,
      },
      {
        name: 'cv',
        type: 'upload',
        label: 'Upload your CV (or Resume) below',
        message: 'Please upload your CV',
        placeholder: 'Upload your CV',
      },
    ],
    formItemEssay: [
      {
        name: 'essay1',
        type: 'input',
        inputType: 'textarea',
        label:
          'Why do you want to participate in the Top100Uni Camp? How will it help you achieve your academic and career goals? (250-300 words)',
        col,
        message: 'Please provide your response for this field',
        placeholder: 'Share your motivation and goals here...', // Changed
      },
      {
        name: 'essay2',
        type: 'input',
        inputType: 'textarea',
        label:
          'List the five universities you hope to get into and tell us the reasons behind this.  (250-300 words)',
        col,
        message: 'Please provide your response for this field',
        placeholder: 'List your dream universities and why...', // Changed
      },
      {
        name: 'essay3',
        type: 'input',
        inputType: 'textarea',
        label:
          'List your top three most significant extracurricular activities and explain roles: projects, volunteering, internships, school clubs, MUNs, start-ups, sports etc.  (250-300 words)',
        col,
        message: 'Please provide your response for this field',
        placeholder: 'Describe your key activities and your role...', // Changed
      },
      {
        name: 'essay4',
        type: 'input',
        inputType: 'textarea',
        label:
          'If you could solve any problem in the world, what would it be and why? (150-200 words)',
        col,
        message: 'Please provide your response for this field',
        placeholder: 'Which global problem would you tackle?', // Changed
      },
      {
        name: 'essay5',
        type: 'input',
        inputType: 'textarea',
        label:
          'If you could live for a day in any era, past or future, which one would it be and why? (150-200 words)',
        col,
        message: 'Please provide your response for this field',
        placeholder: 'Which time period fascinates you and why?', // Changed
      },
    ],
  };

  const graduateFormItems = {
    formItemEssay: [
      // Changed name to formItemEssay for consistency
      {
        name: 'essay1',
        type: 'input',
        label:
          'Why do you want to participate in the Top 100 Uni Camp? How will it help you advance academically and professionally? (250-300 words)',
        inputType: 'textarea',
        message: 'Please enter your essay 1',
        row: 6,
        col,
        placeholder:
          'Explain your reasons for applying and expected benefits...', // Changed
      },
      {
        name: 'essay2',
        type: 'input',
        label:
          'Briefly mention your preferred pursuit of a graduate degree in your future academic career. Why is it significant to you? (250-300 words)',
        inputType: 'textarea',
        message: 'Please enter your essay 2',
        row: 6,
        col,
        placeholder: 'Discuss your graduate degree aspirations...', // Changed
      },
      {
        name: 'essay3',
        type: 'input',
        label:
          'List your top three most impactful extracurricular activities. Explain your roles in projects, volunteering, internships, or leadership initiatives. (250-300 words)',
        inputType: 'textarea',
        message: 'Please enter your essay 3',
        row: 6,
        col,
        placeholder: 'Detail your key activities and contributions...', // Changed
      },
      {
        name: 'essay4',
        type: 'input',
        // The label seems incomplete, assuming it continues about the EduFair task
        label: `As a tradition by the Top Uni initiative, in all cohorts of the Camp, teams are tasked with organizing an event called “EduFair” wherein students conduct workshops and represent their respective university while also gaining insights about other universities and into the application process of represented institutions by other teams. At the event, how would you approach EduFair to effectively represent your university and maximize the learning experience for attendees? (250-400 words)`,
        inputType: 'textarea',
        message: 'Please provide your response for this field', // Changed message
        row: 6,
        col,
        placeholder: 'Share your ideas regarding the EduFair task...', // Changed
      },
    ],
    formItemsGraduate: [
      {
        name: 'fullName',
        type: 'input',
        label: 'Full Name',
        inputType: 'text',
        message: 'Please enter your full name',
        placeholder: 'Enter your full name',
        col,
      },
      {
        name: 'birthDate',
        type: 'datePicker',
        htmlType: 'date',
        label: 'Date of Birth',
        message: 'Please select your date of birth',
        placeholder: 'Select your date of birth',
        col,
      },
      {
        name: 'jshshir',
        type: 'input',
        htmlType: 'number',
        inputType: 'text',
        label: 'Passport Number',
        message: 'Please enter your passport Number',
        placeholder: 'Enter your passport Number',
        col,
      },
      {
        name: 'passportNumber',
        type: 'input',
        htmlType: 'number',
        inputType: 'text',
        label: 'Passport ID',
        message: 'Please enter your passport ID',
        placeholder: 'Enter your passport ID',
        col,
      },
      {
        name: 'passportIssuingAuthority',
        type: 'input',
        label:
          'Passport Issuing Authority                                                                                                                                                                                                                                                                                                                       ',
        inputType: 'text',
        message: 'Please enter your passport issuing authority',
        placeholder: 'Enter your passport issuing authority',
        col,
      },
      {
        name: 'university',
        type: 'input',
        label:
          'University                                                                                                                                                                                                                                                                                                                     ',
        inputType: 'text',
        message: 'Please enter your university',
        placeholder: 'Enter your university',
        col,
      },
      {
        name: 'fieldOfStudy',
        type: 'input',
        label:
          'Field of Study                                                                                                                                                                                                                                                                                                                     ',
        inputType: 'text',
        message: 'Please enter your field of study',
        placeholder: 'Enter your field of study',
        col,
      },
      {
        name: 'currentYearOfStudy',
        type: 'input',
        htmlType: 'number',
        inputType: 'text',
        label: 'Current Year of Study',
        message: 'Please enter your current year of study',
        placeholder: 'Enter your current year of study',
        col,
      },
      {
        name: 'region',
        type: 'input',
        inputType: 'text',
        label: 'Region',
        message: 'Please enter your region',
        placeholder: 'Enter your region',
        col,
      },
      {
        name: 'standardized',
        type: 'input',
        inputType: 'text',
        label: 'Standardized Test Scores ',
        message: 'Please enter your standardized test scores',
        placeholder: 'Enter your standardized test scores',
        col,
      },
      {
        name: 'attendedTop100UniCamp',
        type: 'select',
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
        label: 'Previously Attended Top 100 Uni Camp: (Yes/No)',
        message: 'Please select if you have attended Top 100 Uni Camp',
        placeholder: 'Select if you have attended Top 100 Uni Camp',
        col,
      },
      {
        name: 'parentFullName',
        type: 'input',
        inputType: 'text',
        label: 'Parent/Guardian Full Name ',
        message: 'Please enter your parent/guardian full name',
        placeholder: 'Enter your parent/guardian full name',
        col,
      },
      {
        name: 'parentPhoneNumber',
        type: 'input',
        htmlType: 'number',
        inputType: 'text',
        label: 'Parent/Guardian Phone Number:',
        message: 'Please enter your parent/guardian phone number',
        placeholder: 'Enter your parent/guardian phone number',
        col,
      },
      {
        name: 'parentEmail',
        type: 'input',
        inputType: 'text',
        label: 'Parent/Guardian Email ',
        message: 'Please enter your email',
        placeholder: 'Enter your email',
        col,
      },
      {
        name: 'emergencyContact',
        type: 'input',
        inputType: 'text',
        label: 'Emergency Contact Information',
        message: 'Please enter your emergency contact information',
        placeholder: 'Enter emergency contact information',
        col,
      },
      {
        name: 'academicTranscript',
        type: 'upload',
        inputType: 'text',
        label: 'Upload your language certificates (IELTS/CEFR/Duolingo/SAT)',
        message: 'Please enter your academic transcript submission',
        placeholder: 'Upload your academic transcript',
        col,
      },
      {
        name: 'cv',
        type: 'upload',
        label: 'Upload your CV (or Resume) below',
        message: 'Please upload your CV',
        placeholder: 'Upload your CV',
      },
    ],
  };

  return {
    form,
    graduateFormItems,
    undergraduateFormItems,
    breadcrumbItems,
    eventId,
  };
}
