import { Modal } from 'antd';
import { Dispatch, SetStateAction, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';

interface Props {
  setChecked: Dispatch<SetStateAction<boolean>>;
  setOpen: Dispatch<SetStateAction<boolean>>;
  open: boolean;
}

export default function MustForUseModal({ setChecked, open, setOpen }: Props) {
  const navigate = useNavigate();
  const isAuthenticated = useTypedSelector(
    (state) => state.auth.isAuthenticated
  );

  const handleClose = () => {
    if (!isAuthenticated) {
      setChecked(false);
      setOpen(false);
    }
  };

  const handleOk = () => {
    navigate('/auth/signin');
  };
  return (
    <Modal
      open={open}
      onClose={handleClose}
      onCancel={handleClose}
      onOk={handleOk}
      okText="Sign in"
      centered
    >
      To be able to use the AI search feature, you need to sign in.
    </Modal>
  );
}
