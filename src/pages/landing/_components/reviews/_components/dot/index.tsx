import styles from './dot.module.scss';

interface Props {
  onClick: () => void;
  active: boolean;
  index: number;
  carouselState: ICarouselState;
}

interface ICarouselState {
  currentSlide: number;
}

const CustomDot = ({ onClick, active, index, carouselState }: Props) => {
  const { currentSlide } = carouselState;
  return (
    <li>
      <button
        className={`${styles.dot} ${active ? styles.active : ''}`}
        onClick={() => onClick()}
      />
    </li>
  );
};

export default CustomDot;
