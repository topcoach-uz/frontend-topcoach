import { Col } from 'antd';
import useColors from 'src/hooks/useColors';

export default function FormError({ formError }: { formError?: string }) {
  const colors = useColors();

  return (
    <div>
      {formError && (
        <Col span={24} style={{ marginTop: 5 }}>
          <span
            style={{
              color: colors.colorError,
            }}
          >
            {formError}
          </span>
        </Col>
      )}
    </div>
  );
}
