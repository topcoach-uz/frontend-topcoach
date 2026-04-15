import React from 'react';
import { Badge, Tooltip } from 'antd';
import { WifiOff } from 'lucide-react';
import { useSocket } from 'src/lib/socket';
import styles from './ConnectionStatus.module.scss';

interface ConnectionStatusProps {
  className?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className }) => {
  const { isConnected } = useSocket({ autoConnect: true });

  if (isConnected) {
    return null; // Don't show anything when connected
  }

  return (
    <Tooltip title="Connection lost. Trying to reconnect...">
      <div className={`${styles.connectionStatus} ${className || ''}`}>
        <Badge status="error" />
        <WifiOff size={16} className={styles.icon} />
        <span className={styles.text}>Offline</span>
      </div>
    </Tooltip>
  );
};

export default ConnectionStatus;

