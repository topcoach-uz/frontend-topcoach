import React from 'react';
import { api } from 'src/app/api';
import useApi from 'src/hooks/useApi';
import { CAMPS_LIST_QUERY } from './campsQuery';

export default function useEventUse() {
  const { response } = useApi(() =>
    api.camps.campsList(CAMPS_LIST_QUERY as Parameters<typeof api.camps.campsList>[0]),
  );

  const previousEventData = response?.data?.data;
  return { previousEventData };
}
