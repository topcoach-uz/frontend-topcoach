import { useTypedSelector } from 'src/app/store';

export default function useColors() {
  return useTypedSelector((state) => state.layout.colors);
}
