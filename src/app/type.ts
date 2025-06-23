import { UserRole } from './api/Api';

export type IBaseRes<TData> = TData & {
  id: number;
  is_archived?: string;
  created_at?: string;
  updated_at?: string;
  key?: string;
};

export type IBaseNameRes<TData = {}> = TData & {
  id: number;
  name_uz: string;
  name_oz: string;
  name_ru: string;
};

export interface IBaseEdit<TData> {
  id: IBaseRes<TData>['id'];
  body: Partial<TData>;
  method?: 'PUT' | 'PATCH';
}

export interface IBaseDataRes<TData> {
  count: number;
  next: string;
  previous: string;
  results: TData[];
}

export interface IBaseDeleteRes {
  id: number;
  success?: boolean;
}

export interface IBaseOption {
  label: string;
  value: string;
}

export interface IParams {
  limit?: number;
  offset?: number;
}

export type UserType = UserRole.Mentor | UserRole.Student;

export type PositionAttributes = 'ceo' | 'accountant' | 'employee';
export type CurrencyAttributes = 'usd' | 'uzs';

export interface MenteeEvent {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  fullName: string;
  birthDate: string;
  jshshir: string;
  passportNumber: string;
  passportIssuingAuthority: string;
  region: string;
  parentFullName: string;
  parentPhoneNumber: string;
  parentEmail: string | null;
  emergencyContact: string;
  country: string;
  email: string | null;
  status: string;
  eventForm: {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    type: string;
    event: {
      id: string;
      createdAt: string;
      updatedAt: string;
      deletedAt: string | null;
      title: string;
      summary: string;
      startDate: string;
      endDate: string;
      deadline: string;
      price: number;
      applicationStartDate: string;
      content: any;
    };
    additionalForms: any[];
    essays: any[];
  };
}

export interface GetMyEventsResponse {
  data?: MenteeEvent[];
}
