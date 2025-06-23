import { api } from 'src/app/api';
import useApi from 'src/hooks/useApi';

export default function useMentee() {
  const { response, isLoading } = useApi(api.camps.getMyEvents);

  const menteeEventData = response?.data;
  return { menteeEventData, isLoading };
}
