import { Breadcrumb, Flex } from 'antd';
import MainTitleDescription from 'src/components/mainTitleDesc';
import styles from './application-closed.module.scss';
import { BreadcrumbItemType } from 'antd/es/breadcrumb/Breadcrumb';
import { useTranslation } from 'react-i18next';

interface ApplicationClosedProps {
  breadcrumbItems: BreadcrumbItemType[];
}

export default function ApplicationClosed({
  breadcrumbItems,
}: ApplicationClosedProps) {
  const { t } = useTranslation();
  
  return (
    <main>
      <div className={'container ' + styles.container}>
        <Breadcrumb items={breadcrumbItems} />
        <Flex justify="center" align="center" style={{ minHeight: '60vh' }}>
          <Flex
            vertical
            align="center"
            gap={20}
            style={{ textAlign: 'center' }}
          >
            <MainTitleDescription
              title={t("apply.applicationClosed.title")}
              description={t("apply.applicationClosed.description")}
              centered={true}
            />
            <div
              style={{
                padding: '24px 32px',
                background: '#f5f5f5',
                borderRadius: '12px',
                border: '1px solid #d9d9d9',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '16px',
                  color: '#666',
                  lineHeight: '1.5',
                }}
              >
                {t("apply.applicationClosed.message")}
              </p>
            </div>
          </Flex>
        </Flex>
      </div>
    </main>
  );
}
