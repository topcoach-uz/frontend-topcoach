//Product types
export interface IProduct {}

// Order types
export interface IOrder {}

export interface IOrderRes {}
export interface IGetMe {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  email: string;
  phoneNumber: string;
  profile: ProfilesSchema;
  managementRole: string;
  givenReviews: ReviewsSchema[];
  receivedReviews: ReviewsSchema[];
  /** This is the list of sessions mentor has, if user's a mentor */
  sessions: SessionsSchema[];
  /** User's joined sessions as a student */
  joinedSessions: SessionsSchema[];
  reports: ReportsSchema[];
  receivedReports: ReportsSchema[];
  //   payments: PaymentsSchema[];
  applications: string[];
  //   likedUniversities: UniversitiesSchema[];
}

export interface ProfilesSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  name: string;
  role: UserRole;
  contacts: ContactsSchema;
  location: LocationsSchema;
}

export interface LocationsSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  address: string;
  zipcode: string;
  region: string;
  country: string;
  //   continent: ContinentsEnum;
  coordinates: string[];
  url: string;
}

export enum UserRole {
  Student = 'Student',
  Mentor = 'Mentor',
}

export interface ContactsSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  website: string;
  emails: string[];
  phoneNumbers: string[];
  //   socials: SocialsSchema;
}

export interface ReviewsSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  rating: number;
  summary: string;
}

export interface SessionsSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  type: SessionTypeEnum;
  /** @format date-time */
  date: string;
  maxParticipants: number;
  cancelStatus: SessionCancelsSchema;
  media: object;
}

export enum SessionTypeEnum {
  OneOnOne = 'OneOnOne',
  Group = 'Group',
}

export interface SessionCancelsSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  reason: string;
}

export interface ReportsSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  comment: string;
  reason: ReasonsSchema;
}

export interface ReasonsSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  label: string;
}

// export interface PaymentsSchema {
//   id: string;
//   /** @format date-time */
//   createdAt: string;
//   /** @format date-time */
//   updatedAt: string;
//   /** @format date-time */
//   deletedAt: string;
//   totalPaid: number;
//   status: PaymentStatusEnum;
//   notes: string;
//   method: PaymentMethodsSchema;
// }
