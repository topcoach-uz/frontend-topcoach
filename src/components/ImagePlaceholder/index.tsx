import { Skeleton } from 'antd';
import styles from './ImagePlaceholder.module.scss';
import { SkeletonImageProps } from 'antd/es/skeleton/Image';

interface Props extends SkeletonImageProps {}

export default function ImagePlaceholder({ style, ...rest }: Props) {
  return (
    <Skeleton.Image
      rootClassName={styles.skeleton}
      style={{ width: '100%', height: 180, ...style }}
      {...rest}
    />
  );
}
