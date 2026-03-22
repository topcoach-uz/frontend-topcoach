/**
 * BaseCrudService.findAllBasic defaults to take=10 when _start/_end are omitted.
 * Public camps list must request an explicit range or most events/workshops never load.
 */
export const CAMPS_LIST_QUERY = {
  query: {
    _start: '0',
    _end: '2000',
  },
} as const;
