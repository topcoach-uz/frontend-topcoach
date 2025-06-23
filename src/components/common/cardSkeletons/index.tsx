import { Flex, Skeleton } from 'antd';
import { createArray } from 'src/utils';

export default function CardSkeletons() {
  return createArray(1, 10).map((el) => (
    <Flex key={el} vertical gap={10}>
      <Skeleton.Image active style={{ width: '100%', height: 305 }} />
      <Skeleton active paragraph={{ rows: 2 }} />
    </Flex>
  ));
}
