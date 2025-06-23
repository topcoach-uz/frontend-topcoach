import { Breadcrumb, Dropdown, Form, MenuProps, Row, TabsProps } from 'antd';
import { Alarm, ArrowRight } from 'iconsax-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CustomCard } from 'src/components/cards';
import {
  CustomBadge,
  CustomButton,
  CustomModal,
  CustomStatus,
  CustomTabs,
  CustomText,
} from 'src/components/common';
import {
  CheckboxFormItem,
  DateFormItem,
  InputFormItem,
  PhoneFormItem,
  SelectFormItem,
  UploadFormItem,
} from 'src/components/form';
import { formGutter } from 'src/constants/form';
import { colors } from 'src/constants/theme';

const tabItems: TabsProps['items'] = [
  {
    key: '1',
    label: 'Tab 1',
  },
  {
    key: '2',
    label: 'Tab 2',
  },
];

const items: MenuProps['items'] = [
  {
    key: '1',
    label: '1st menu item',
  },
  {
    key: '2',
    label: '2nd menu item',
  },
  {
    key: '3',
    label: '3rd menu item',
  },
];

function Help() {
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };
  return (
    <div className="container">
      {/* Buttons */}
      <CustomCard bordered mt={20}>
        <CustomText type="subtitle" mb={16}>
          Buttons
        </CustomText>
        <CustomButton mr={20}>Custom button</CustomButton>
        <CustomButton textColor={colors.textPrimary} mr={20}>
          Custom button
        </CustomButton>
        <CustomButton mb={16} bg="#E4F2FF" borderColor="transparent" mr={20}>
          Custom button
        </CustomButton>
        <CustomButton
          type="primary"
          mb={16}
          bg="red"
          icon={<ArrowRight size="24" color="#FFf" />}
          iconPosition="end"
          className="custom-class"
        >
          Custom button
        </CustomButton>
        <CustomButton type="primary" height={42} width={'100%'}>
          Custom button
        </CustomButton>
      </CustomCard>

      {/* Status */}
      <CustomCard bordered mt={20}>
        <CustomText type="subtitle" mb={16}>
          Status
        </CustomText>
        <CustomStatus mr={10}>Default</CustomStatus>
        <CustomStatus type="primary" mr={10}>
          Primary
        </CustomStatus>
        <CustomStatus type="danger" mr={10}>
          Danger
        </CustomStatus>
        <CustomStatus status="info" mr={10}>
          Тулов килинди!
        </CustomStatus>
        <CustomStatus status="success" mr={10}>
          Тулов кутилмокда
        </CustomStatus>
        <CustomStatus status="warning" mr={10}>
          Текширилмокда
        </CustomStatus>
        <CustomStatus status="danger" mr={10}>
          Rad etildi
        </CustomStatus>
      </CustomCard>

      {/* Texts */}
      <CustomCard bordered mt={20}>
        <CustomText type="subtitle" mb={16}>
          Texts
        </CustomText>
        <div className="scroll" style={{ height: 190, paddingRight: 50 }}>
          <CustomText
            mb={16}
            prefix={<Alarm size="20" color={colors.textPrimary} />}
          >
            Lorem ipsum dolor sit.
          </CustomText>
          <CustomText type="title" mb={16}>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Alias sed
            consectetur aliquam eum atque. Eius consequatur accusantium aperiam
          </CustomText>
          <CustomText type="subtitle" mb={16}>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Alias sed
            consectetur aliquam eum atque. Eius consequatur accusantium aperiam
          </CustomText>
          <CustomText>
            Lorem ipsum dolor sit, amet consectetur adipisicing elit. Assumenda
            adipisci ab ipsa quisquam optio. Maiores veritatis illo quo
            explicabo tenetur repellat natus id quis omnis inventore aspernatur
            itaque cumque rem beatae, blanditiis accusantium, ex, saepe ipsum
            cupiditate labore temporibus. Aspernatur!
          </CustomText>
        </div>
      </CustomCard>

      {/* Badges */}
      <CustomCard
        bordered
        style={{ position: 'relative', width: '50%', height: 240 }}
        mt={20}
      >
        <CustomText type="subtitle" mb={16}>
          Badges
        </CustomText>
        <CustomBadge>Info</CustomBadge>
        <CustomBadge top={70} type="warning">
          Warning
        </CustomBadge>
        <CustomBadge top={120} type="danger">
          Danger
        </CustomBadge>
        <CustomBadge top={170} type="success">
          Success
        </CustomBadge>
      </CustomCard>

      {/* Forms */}
      <CustomCard bordered mt={20}>
        <CustomText type="subtitle" mb={16}>
          Form
        </CustomText>
        <Form layout="vertical">
          <Row gutter={formGutter}>
            <InputFormItem
              type="text"
              inputType="text"
              label="Input"
              placeholder="Input"
            />
            <DateFormItem
              mode="month"
              label="Date"
              placeholder="xx.xx.xxxx"
              message=""
            />

            <InputFormItem inputType="text" label="Otp input" otp />
            <InputFormItem
              label="Textarea"
              placeholder="Textarea"
              textarea
              row={4}
              inputType="textarea"
            />

            <PhoneFormItem
              inputType="number"
              label="Ism"
              placeholder="xx.xx.xxxx"
            />
            <SelectFormItem
              placeholder="70x100"
              options={[
                { lable: 'Option1', value: 'option1' },
                { lable: 'Option2', value: 'option2' },
                { lable: 'Option3', value: 'option3' },
              ]}
              label="Select"
            />
            <CheckboxFormItem label="Checkbox" />
            <UploadFormItem label="Upload" />
          </Row>
        </Form>
      </CustomCard>

      {/* Breadcrumb */}
      <CustomCard bordered mt={20}>
        <CustomText type="subtitle" mb={16}>
          Breadcrumb
        </CustomText>
        <Breadcrumb
          separator=">"
          items={[
            {
              title: <Link to="/">Home</Link>,
            },
            {
              title: <Link to="/">About</Link>,
            },
            {
              title: 'Ихтиёрий адабиётни чоп эттириш',
            },
          ]}
        />
      </CustomCard>

      {/* Tabs */}
      <CustomCard bordered mt={20}>
        <CustomText type="subtitle" mb={16}>
          Tabs
        </CustomText>

        <CustomTabs defaultActiveKey="1" items={tabItems} />

        <CustomTabs
          fontSize={30}
          defaultActiveKey="1"
          items={tabItems}
          centered
          gap={30}
        />
      </CustomCard>

      {/* Dropdown */}
      <CustomCard bordered mt={20}>
        <CustomText type="subtitle" mb={16}>
          Dropdown
        </CustomText>

        <Dropdown menu={{ items }}>
          <CustomButton onClick={(e) => e.preventDefault()} mr={20}>
            Hover me
          </CustomButton>
        </Dropdown>
        <Dropdown menu={{ items }} trigger={['click']}>
          <CustomButton>Click me</CustomButton>
        </Dropdown>
      </CustomCard>

      {/* Modal */}
      <CustomCard bordered mt={20} mb={20}>
        <CustomText type="subtitle" mb={16}>
          Modal
        </CustomText>

        <CustomButton type="primary" onClick={showModal}>
          Open Modal
        </CustomButton>
        <CustomModal
          title="Basic Modal"
          open={isModalOpen}
          onCancel={handleCancel}
          footer={null}
          centered
        >
          <p>Some contents...</p>
          <p>Some contents...</p>
          <p>Some contents...</p>
        </CustomModal>
      </CustomCard>
    </div>
  );
}

export default Help;
