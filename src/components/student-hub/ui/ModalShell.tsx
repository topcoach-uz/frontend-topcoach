import { Drawer, Modal } from 'antd';
import type { DrawerProps, ModalProps } from 'antd';
import { X } from 'lucide-react';

/** antd Modal in the student look: centred, 560px, lucide close icon, kit title styles. */
export function ModalShell({ className, width = 560, centered = true, closeIcon, ...props }: ModalProps) {
  return (
    <Modal
      {...props}
      centered={centered}
      width={width}
      closeIcon={closeIcon ?? <X size={18} aria-hidden />}
      className={['tc-modal', className].filter(Boolean).join(' ')}
    />
  );
}

/** antd Drawer in the student look: 480px, lucide close icon, kit title styles. */
export function DrawerShell({ className, width = 480, closeIcon, ...props }: DrawerProps) {
  return (
    <Drawer
      {...props}
      width={width}
      closeIcon={closeIcon ?? <X size={18} aria-hidden />}
      className={['tc-drawer', className].filter(Boolean).join(' ')}
    />
  );
}
