import { ConfigProvider, Modal, ModalProps } from 'antd';
import React from 'react';
import { useTypedSelector } from 'src/app/store';
import { CloseIcon } from 'src/components/icons';
import useColors from 'src/hooks/useColors';

interface Props extends ModalProps {
  titleColor?: React.CSSProperties['color'];
  titleFontSize?: number;
}

function CustomModal({
  titleColor,
  titleFontSize = 20,
  centered = true,
  footer = null,
  ...rest
}: Props) {
  const colors = useColors();

  titleColor = titleColor ?? colors.colorText;

  return (
    <ConfigProvider
      theme={{
        token: {
          // colorBgMask: 'rgba(28, 43, 82, 0.6)',
        },
        components: {
          Modal: {
            titleColor,
            titleFontSize,
          },
        },
      }}
    >
      <Modal
        centered={centered}
        footer={footer ? undefined : null}
        closeIcon={<CloseIcon color="#7C9FAF" />}
        {...rest}
      />
    </ConfigProvider>
  );
}

export default CustomModal;
