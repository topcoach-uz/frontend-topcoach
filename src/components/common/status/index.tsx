import React from 'react';
import './status.scss';
import { MarginTypes } from 'src/constants/theme';

type CombinedProps = React.HTMLAttributes<HTMLDivElement> & MarginTypes;

interface Props extends CombinedProps {
  status?: 'info' | 'success' | 'warning' | 'danger';
  type?: 'primary' | 'danger';
}

export default function CustomStatus({
  status,
  type,
  m,
  mt,
  mb,
  ml,
  mr,
  style,
  children,
  ...rest
}: Props) {
  return (
    <div
      style={{
        margin: m,
        marginTop: mt,
        marginBottom: mb,
        marginLeft: ml,
        marginRight: mr,
        ...style,
      }}
      className={
        'common_status' +
        (status ? ` common_status-${status}` : '') +
        (type ? ` common_status-type-${type}` : '')
      }
      {...rest}
    >
      {children}
    </div>
  );
}
