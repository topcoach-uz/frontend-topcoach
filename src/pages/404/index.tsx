import { Error404Svg } from 'src/assets/svg';
import styles from './custom404.module.scss';
import { CustomButton, CustomModal, CustomText } from 'src/components/common';
import { useAppDispatch, useTypedSelector } from 'src/app/store';
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { logout } from 'src/app/slices/authSlice';

export default function Custom404() {
  const { colors } = useTypedSelector((state) => state.layout);
  const { pathname } = useLocation();
  const [open, setOpen] = useState(pathname.startsWith('/auth'));
  const dispatch = useAppDispatch();

  const handleClose = () => {
    setOpen(false);
  };

  const handleOk = () => {
    setOpen(false);
    dispatch(logout());
  };

  return (
    <div className={styles.custom404}>
      <Error404Svg style={{ minWidth: 318 }} />
      <CustomText
        fontSize={24}
        fontWeight={600}
        color={colors.colorText}
        mt={32}
        mb={4}
      >
        OOPS!
      </CustomText>
      <CustomText fontSize={16} color={colors.colorTextTertiary} mb={32}>
        The page you requested could not be found
      </CustomText>
      <Link to="/">
        <CustomButton type="primary" height={40}>
          Back to home
        </CustomButton>
      </Link>
      <CustomModal
        onOk={handleOk}
        okText="Log out"
        open={open}
        onCancel={handleClose}
        footer={true}
      >
        If you want to sign in or sign up from another account, you must first
        log out
      </CustomModal>
    </div>
  );
}
