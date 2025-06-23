import React from 'react';
import { api } from 'src/app/api';
import useApi from 'src/hooks/useApi';

export default function useEventUse() {
  const { response } = useApi(api.camps.campsList);

  const previousEventData = response?.data?.data;
  return { previousEventData };
}
