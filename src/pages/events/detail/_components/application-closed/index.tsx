import { Breadcrumb, Flex } from 'antd';
import MainTitleDescription from 'src/components/mainTitleDesc';
import styles from './application-closed.module.scss';
import { BreadcrumbItemType } from 'antd/es/breadcrumb/Breadcrumb';

interface ApplicationClosedProps {
  breadcrumbItems: BreadcrumbItemType[];
}

export default function ApplicationClosed({
  breadcrumbItems,
}: ApplicationClosedProps) {
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
              title="Application Closed"
              description="The application period for this event has ended."
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
                Thank you for your interest in our program. Please check back
                for future opportunities or contact us for more information
                about upcoming events.
              </p>
            </div>
          </Flex>
        </Flex>
      </div>
    </main>
  );
}
