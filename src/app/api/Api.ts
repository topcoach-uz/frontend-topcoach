/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export enum LoginMethod {
  Email = "email",
  Google = "google",
}

export enum UserRole {
  Student = "Student",
  Mentor = "Mentor",
}

export interface SocialsSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  instagram?: string | null;
  facebook?: string | null;
  twitter?: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
  linkedin?: string | null;
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
  socials: SocialsSchema;
}

export enum ContinentsEnum {
  Africa = "Africa",
  Antarctica = "Antarctica",
  Asia = "Asia",
  Europe = "Europe",
  NorthAmerica = "North America",
  Oceania = "Oceania",
  SouthAmerica = "South America",
}

export interface LocationsSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  /** Multilingual content (display value) */
  address: string | null | TranslationDto;
  zipcode: string;
  /** Multilingual content (display value) */
  region: string | null | TranslationDto;
  /** Multilingual content (display value) */
  country: string | null | TranslationDto;
  continent: ContinentsEnum;
  coordinates: string[];
  url: string;
}

export enum MediaEnum {
  Image = "image",
  Video = "video",
  Gif = "gif",
  Docx = "docx",
  Pdf = "pdf",
}

export interface MediaSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  url: string;
  type: MediaEnum;
  tags: string[];
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
  /**
   * Overall rating of the user (0-5)
   * @min 0
   * @max 5
   */
  overallRating: number;
  contacts: ContactsSchema;
  location: LocationsSchema;
  /** Mentor Profile Images/Videos */
  media: MediaSchema[];
  profileComplete: boolean;
}

export enum RoleEnum {
  Owner = "Owner",
  Admin = "Admin",
  ContentManager = "Content Manager",
  User = "User",
}

export enum MentorProfileStatusEnum {
  Pending = "pending",
  Accepted = "accepted",
  Rejected = "rejected",
}

export enum MentorExperienceLevel {
  Junior = "junior",
  Senior = "senior",
  Expert = "expert",
  Probono = "probono",
}

export interface MentorProfilesSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  title: string;
  summary: string;
  university: string;
  major: string;
  /** Languages that mentor can speak */
  languages: string[] | null;
  mentorshipValue: string;
  mentoringExperience: string;
  background?: string;
  status: MentorProfileStatusEnum;
  level: MentorExperienceLevel;
  force: boolean;
  initialSessions: number;
  /** University start date in YYYY-MM format */
  universityStartDate: string;
  /** University end date in YYYY-MM format */
  universityEndDate: string;
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
  reviewer: object;
  reviewee: object;
  session: object;
}

export enum SessionTypeEnum {
  Individual30M = "individual30m",
  Group = "Group",
  Individual60M = "individual60m",
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

export interface CalendarsSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  status: string;
  eventLink: string;
  meetingLink: string;
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
  mentor: object;
  participants: string[];
  comments: any[];
  reviews: ReviewsSchema;
  calendarInfo: CalendarsSchema;
  bookings: string[];
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
  reasons: string[];
}

export enum PaymentStatusEnum {
  Pending = "pending",
  Success = "success",
  Rejected = "rejected",
  Refunded = "refunded",
}

export enum PaymentMethodEnum {
  Click = "click",
  Payme = "payme",
  Atmos = "atmos",
}

export interface PaymentsSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  amount: number;
  status: PaymentStatusEnum;
  transactionId: string;
  type: string;
  notes: string;
  method: PaymentMethodEnum;
}

export enum UniversitySectorEnum {
  Public = "public",
  Private = "private",
}

export interface CurrenciesSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  name: string;
  symbol: string;
}

export interface ApplicationFeesSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  fee: number;
  /** Multilingual content (display value) */
  notes: string | null | TranslationDto;
  currency: CurrenciesSchema;
  university: UniversitiesSchema;
}

export interface TuitionFeesSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  fee: number;
  notes: string;
  currency: object;
}

export enum RankEnum {
  QS = "QS",
  THE = "THE",
  ARWU = "ARWU",
  USNWR = "USNWR",
  CWUR = "CWUR",
  NTU = "NTU",
  URAP = "URAP",
  Leiden = "Leiden",
  SCImago = "SCImago",
  RUR = "RUR",
}

export interface RankingsSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  type: RankEnum;
  rank: number;
}

export interface AcceptanceRatesSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  rate: number;
  /** Multilingual content (display value) */
  notes: string | null | TranslationDto;
}

export interface UniversityTypesSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  /** Multilingual content (display value) */
  name: string | null | TranslationDto;
  /** Multilingual content (display value) */
  notes: string | null | TranslationDto;
}

export interface LinksSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  name: string;
  url: string;
}

export interface DegreesSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  /** Multilingual content (display value) */
  name: string | null | TranslationDto;
  /** Multilingual content (display value) */
  description: string | null | TranslationDto;
}

export enum MajorTypeEnum {
  Undergraduate = "undergraduate",
  Graduate = "graduate",
}

export interface MajorsSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  /** Multilingual content (display value) */
  name: string | null | TranslationDto;
  /** Multilingual content (display value) */
  description: string | null | TranslationDto;
  type: MajorTypeEnum;
}

export interface CertificationsSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  name: string;
  max: number;
}

export interface ReqExamsSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  name: string;
  /** Multilingual content (display value) */
  description: string | null | TranslationDto;
  certification: CertificationsSchema;
}

export enum ScholarshipsTypesEnum {
  Full = "full",
  Partial = "partial",
  None = "none",
}

export interface ScholarshipsSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  type: ScholarshipsTypesEnum;
  /** Multilingual content (display value) */
  name: string | null | TranslationDto;
  url: string;
}

export interface DeadlinesSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  /** @format date-time */
  date: string;
  /** Multilingual content (display value) */
  name: string | null | TranslationDto;
}

export interface UniversitiesSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  /** Multilingual content (display value) */
  name: string | null | TranslationDto;
  /** Multilingual content (display value) */
  description: string | null | TranslationDto;
  /** Multilingual content (display value) */
  summary: string | null | TranslationDto;
  /** Multilingual content (display value) */
  notes: string | null | TranslationDto;
  establishedIn: string;
  /** @example {"en":{"blocks":[{"type":"paragraph","data":{"text":"English content"}}]},"uz":{"blocks":[{"type":"paragraph","data":{"text":"Uzbek content"}}]},"ru":{"blocks":[{"type":"paragraph","data":{"text":"Russian content"}}]},"kk":{"blocks":[{"type":"paragraph","data":{"text":"Kazakh content"}}]}} */
  content:
    | {
        time?: string;
        blocks?: {
          id?: string;
          type?: string;
          data?: {
            text?: string;
            level?: number;
            style?: string;
            url?: string;
            caption?: string;
            alignment?: string;
          };
        };
        version?: string;
      }
    | RichTextTranslationDto;
  sector: UniversitySectorEnum;
  applicationFees: ApplicationFeesSchema[];
  tuitionFees: TuitionFeesSchema[];
  rankings: RankingsSchema[];
  acceptanceRates: AcceptanceRatesSchema[];
  universityTypes: UniversityTypesSchema[];
  links: LinksSchema[];
  degrees: DegreesSchema[];
  majors: MajorsSchema[];
  media: MediaSchema[];
  requiredExams: ReqExamsSchema[];
  scholarships: ScholarshipsSchema[];
  deadlines: DeadlinesSchema[];
  location: LocationsSchema;
  contacts: ContactsSchema;
  users: string[];
  selectedBy: string[];
}

export enum BookingStatusEnum {
  Pending = "pending",
  Active = "active",
  Inactive = "inactive",
}

export interface BookingsSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  status: BookingStatusEnum;
  sessions: SessionsSchema;
  mentor: object;
  student: object;
  payments: PaymentsSchema;
  paymentPlan: object;
}

export interface BillingCardsSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  last4Digits: string;
  method: PaymentMethodEnum;
  isDefault: boolean;
  user: object;
}

export interface UsersSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  email: string;
  loginMethod: LoginMethod;
  phoneNumber?: string | null;
  aiSearchLimit: number;
  profile: ProfilesSchema;
  managementRole: RoleEnum;
  mentorProfile: MentorProfilesSchema;
  givenReviews: ReviewsSchema[];
  receivedReviews: ReviewsSchema[];
  /** This is the list of sessions mentor has, if user's a mentor */
  sessions: SessionsSchema[];
  /** User's joined sessions as a student */
  joinedSessions: SessionsSchema[];
  reports: ReportsSchema[];
  receivedReports: ReportsSchema[];
  payments: PaymentsSchema[];
  applications: string[];
  likedUniversities: UniversitiesSchema[];
  studentBookings: BookingsSchema[];
  mentorBookings: BookingsSchema[];
  billingCards: BillingCardsSchema[];
  selectedUniversities: UniversitiesSchema[];
}

export interface SessionStatsDto {
  totalSessions: number;
  totalCompletedSessions: number;
  upcomingSessions: SessionsSchema[];
  totalMunites: number;
}

export interface UserDetailsResponseDto {
  email: string;
  phoneNumber?: string | null;
  profile: ProfilesSchema;
  mentorProfile: MentorProfilesSchema;
  sessionStats: SessionStatsDto;
}

export interface UpdateUserDto {
  phoneNumber?: string | null;
  profile?: ProfilesSchema;
  mentorProfile?: MentorProfilesSchema;
  selectedUniversities?: UniversitiesSchema[];
}

export interface UpdateProfileImageDto {
  /** @format binary */
  profileImage: File;
}

export interface UpdateProfileResDto {
  message: string;
  /** Array of uploaded media IDs */
  media: {
    /**
     * @format uuid
     * @example "123e4567-e89b-12d3-a456-426614174000"
     */
    id?: string;
  }[];
}

export enum MEDIA_TAGS {
  IntroVideo = "intro_video",
  ProfilePicture = "profile_picture",
  FreeTrialVideo = "free_trial_video",
  General = "general",
  DemoLession = "demo_lession",
}

export interface UpdateMentorVideosDto {
  /** @format binary */
  video: File;
  tags: MEDIA_TAGS[];
}

export interface GetMeResDto {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  email: string;
  loginMethod: LoginMethod;
  phoneNumber?: string | null;
  aiSearchLimit: number;
  profile: ProfilesSchema;
  managementRole: RoleEnum;
  mentorProfile: MentorProfilesSchema;
  givenReviews: ReviewsSchema[];
  receivedReviews: ReviewsSchema[];
  /** This is the list of sessions mentor has, if user's a mentor */
  sessions: SessionsSchema[];
  /** User's joined sessions as a student */
  joinedSessions: SessionsSchema[];
  reports: ReportsSchema[];
  receivedReports: ReportsSchema[];
  payments: PaymentsSchema[];
  applications: string[];
  likedUniversities: UniversitiesSchema[];
  studentBookings: BookingsSchema[];
  mentorBookings: BookingsSchema[];
  billingCards: BillingCardsSchema[];
  selectedUniversities: UniversitiesSchema[];
  hasGoogleCredentials: boolean;
}

export interface CheckEmailDto {
  email: string;
}

export interface MentorsResponseDto {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  email: string;
  phoneNumber?: string | null;
  profile: ProfilesSchema;
  managementRole: RoleEnum;
  mentorProfile: MentorProfilesSchema;
  numberOfSessions: number;
  totalMinutes: number;
}

export interface ReportUserDto {
  subjectId: string;
  reasons: string[];
  comment?: string;
}

export enum TABLE_NAMES {
  Users = "users",
  Profiles = "profiles",
  BillingCards = "billing_cards",
  UserVerifications = "user_verifications",
  UsersPasswords = "users_passwords",
  SmsVerifications = "sms_verifications",
  ResetPasswords = "reset_passwords",
  UserTokens = "user_tokens",
  Media = "media",
  Locations = "locations",
  Contacts = "contacts",
  Socials = "socials",
  Currencies = "currencies",
  Universities = "universities",
  UserAiQueries = "user_ai_queries",
  ApplicationFees = "application_fees",
  TuitionFees = "tuition_fees",
  Rankings = "rankings",
  UniversityTypes = "university_types",
  Degrees = "degrees",
  Majors = "majors",
  Exams = "exams",
  RequiredExams = "required_exams",
  Scholarships = "scholarships",
  Deadlines = "deadlines",
  AcceptanceRates = "acceptance_rates",
  Links = "links",
  Certifications = "certifications",
  MentorProfiles = "mentor_profiles",
  Reports = "reports",
  Reviews = "reviews",
  SessionCancels = "session_cancels",
  Sessions = "sessions",
  Calendars = "calendars",
  Bookings = "bookings",
  Payments = "payments",
  PaymentPlans = "payment_plans",
  Events = "events",
  Essays = "essays",
  Applications = "applications",
  UserEssays = "user_essays",
  EventForms = "event_forms",
  AdditionalEventForms = "additional_event_forms",
  AdditionalEventFormsResponses = "additional_event_forms_responses",
  Blogs = "blogs",
}

export enum PermissionEnum {
  CreateOwn = "createOwn",
  CreateAny = "createAny",
  ReadOwn = "readOwn",
  ReadAny = "readAny",
  UpdateOwn = "updateOwn",
  UpdateAny = "updateAny",
  DeleteOwn = "deleteOwn",
  DeleteAny = "deleteAny",
}

export interface CanAccessDto {
  canAccess: boolean;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface UserTokens {
  /**
   * JWT access token
   * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   */
  access: string;
  /**
   * JWT refresh token
   * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   */
  refresh: string;
}

export interface LoginResponseDto {
  message: string;
  /** User tokens */
  user: UserTokens;
}

export interface SocialsDto {
  instagram?: string | null;
  facebook?: string | null;
  twitter?: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
}

export interface MentorProfileBaseDto {
  university: string;
  major: string;
  /** Languages that mentor can speak */
  languages: string[] | null;
  mentorshipValue: string;
  mentoringExperience: string;
  background?: string;
  /** University start date in YYYY-MM format */
  universityStartDate: string;
  /** University end date in YYYY-MM format */
  universityEndDate: string;
}

export interface RegisterMentorEmailDto {
  email: string;
  phoneNumber?: string | null;
  name: string;
  password: string;
  socials?: SocialsDto;
  mentorProfile: MentorProfileBaseDto;
  selectedUniversities?: string[];
  /** @format binary */
  image: File;
}

export interface RegisterStudentEmailDto {
  email: string;
  phoneNumber?: string | null;
  name: string;
  password: string;
  socials?: SocialsDto;
  /** @format binary */
  image?: File;
}

export interface ResendCodeDto {
  phoneNumber: string;
}

export interface ResendEmailDto {
  email: string;
}

export interface VerifyPhoneDto {
  phoneNumber: string;
  code: string;
}

export interface CalendarLinkDto {
  /** Google Auth Code access token */
  authCode: string;
}

export interface SMSCallbackDto {
  request_id: string;
  message_id: string;
  user_sms_id: string;
  country: string;
  phone_number: string;
  sms_count: string;
  status: string;
  status_date: string;
}

export interface ExchangeTokenDto {
  code: string;
}

export interface ExchangeTokenResDto {
  access: string;
  refresh: string;
}

export interface ResetPasswordDto {
  email: string;
}

export interface ResetPasswordConfirmDto {
  token: string;
  password: string;
}

export enum EventFormTypeEnum {
  Undergraduate = "undergraduate",
  Postgraduate = "postgraduate",
}

export interface EventsSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  /** Multilingual content (display value) */
  title: string | null | TranslationDto;
  /** Multilingual content (display value) */
  summary: string | null | TranslationDto;
  /** @format date-time */
  startDate: string;
  /** @format date-time */
  endDate: string;
  /** @format date-time */
  deadline: string;
  price: number;
  /** @format date-time */
  applicationStartDate: string;
  /** @example {"en":{"blocks":[{"type":"paragraph","data":{"text":"English content"}}]},"uz":{"blocks":[{"type":"paragraph","data":{"text":"Uzbek content"}}]},"ru":{"blocks":[{"type":"paragraph","data":{"text":"Russian content"}}]},"kk":{"blocks":[{"type":"paragraph","data":{"text":"Kazakh content"}}]}} */
  content:
    | {
        time?: string;
        blocks?: {
          id?: string;
          type?: string;
          data?: {
            text?: string;
            level?: number;
            style?: string;
            url?: string;
            caption?: string;
            alignment?: string;
          };
        };
        version?: string;
      }
    | RichTextTranslationDto;
  /** Locations list */
  locations: any[][];
  forms: EventFormsSchema[];
  media: string[];
}

export enum EventInputTypeEnum {
  Text = "Text",
  LargeText = "LargeText",
  File = "File",
  Image = "Image",
  Date = "Date",
  MultipleChoice = "multipleChoice",
  SingleChoice = "singleChoice",
}

export interface AdditionalEventFormsSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  label: object;
  notes: object;
  inputType: EventInputTypeEnum;
  options: string[];
}

export enum ApplicationStatusEnum {
  Draft = "draft",
  Pending = "pending",
  Rejected = "rejected",
  Successful = "successful",
}

export interface ApplicationsSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  fullName: string;
  /** @format date-time */
  birthDate: string;
  jshshir: string;
  passportNumber: string;
  passportIssuingAuthority: string;
  region: string;
  parentFullName: string;
  parentPhoneNumber: string;
  parentEmail: string;
  emergencyContact: string;
  country: string;
  /** @default "pending" */
  status: ApplicationStatusEnum;
  useressays: string[];
  additionalFormResponses: string[];
}

export interface EssaysSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  title: string;
  maxWordLimit: number;
}

export interface EventFormsSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  type: EventFormTypeEnum;
  event: EventsSchema;
  additionalForms: AdditionalEventFormsSchema[];
  applications: ApplicationsSchema[];
  essays: EssaysSchema[];
}

export interface CreateApplicationDto {
  fullName: string;
  jshshir: string;
  passportNumber: string;
  passportIssuingAuthority: string;
  region: string;
  parentFullName: string;
  parentPhoneNumber: string;
  parentEmail: string;
  emergencyContact: string;
  country: string;
  birthDate: string;
  additionalResponses: string[];
  essays: string[];
  isDraft: boolean;
}

export interface EventsListResponseDto {
  id: string;
  /** Multilingual content (display value) */
  title: string | null | TranslationDto;
  /** @format date-time */
  startDate: string;
  /** @format date-time */
  endDate: string;
}

export interface EventsResponseDto {
  /** List of events */
  data: EventsListResponseDto[];
  count: number;
}

export interface EventSingleParamDto {
  id: string;
}

export enum SortOrderEnum {
  ASC = "ASC",
  DESC = "DESC",
}

export interface PartialTypeClass {
  id?: string;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  updatedAt?: string;
  /** @format date-time */
  deletedAt?: string;
  /** Multilingual content (display value) */
  title?: string | null | TranslationDto;
  /** Multilingual content (display value) */
  subtitle?: string | null | TranslationDto;
  author?: string;
  showOnHomePage?: boolean;
  /** @format date-time */
  publishedDate?: string;
  /** @example {"en":{"blocks":[{"type":"paragraph","data":{"text":"English content"}}]},"uz":{"blocks":[{"type":"paragraph","data":{"text":"Uzbek content"}}]},"ru":{"blocks":[{"type":"paragraph","data":{"text":"Russian content"}}]},"kk":{"blocks":[{"type":"paragraph","data":{"text":"Kazakh content"}}]}} */
  content?:
    | {
        time?: string;
        blocks?: {
          id?: string;
          type?: string;
          data?: {
            text?: string;
            level?: number;
            style?: string;
            url?: string;
            caption?: string;
            alignment?: string;
          };
        };
        version?: string;
      }
    | RichTextTranslationDto;
  media?: any[][];
}

export interface AdditionalEventFormsResponsesSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  value: string;
  multipleValues: string[];
}

export interface SetManualRateDto {
  /**
   * The 3-letter code of the target currency (e.g., UZS, EUR). Cannot be USD.
   * @minLength 3
   * @maxLength 3
   * @example "UZS"
   */
  targetCurrencyCode: string;
  /**
   * The new exchange rate for 1 USD to the target currency.
   * @example 12850.75
   */
  newRate: number;
}

export interface UpdateCurrencyDto {
  id?: string;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  updatedAt?: string;
  /** @format date-time */
  deletedAt?: string;
  name?: string;
  symbol?: string;
}

export interface ResetPasswordsSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  token: string;
}

export interface SMSVerificationsSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
}

export interface UserEssaysSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  content: string;
  aiReviewContent: string;
}

export interface UserTokensSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
}

export interface UsersVerificationSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
}

export interface AddDegreeToUnivDto {
  degreeIds: string[];
}

export interface AddMajorToUnivDto {
  majorIds: string[];
}

export interface AddTypesToUnivDto {
  typeIds: string[];
}

export interface UpdateUnivsDto {
  id?: string;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  updatedAt?: string;
  /** @format date-time */
  deletedAt?: string;
  /** Multilingual content (display value) */
  name?: string | null | TranslationDto;
  /** Multilingual content (display value) */
  description?: string | null | TranslationDto;
  /** Multilingual content (display value) */
  summary?: string | null | TranslationDto;
  /** Multilingual content (display value) */
  notes?: string | null | TranslationDto;
  establishedIn?: string;
  /** @example {"en":{"blocks":[{"type":"paragraph","data":{"text":"English content"}}]},"uz":{"blocks":[{"type":"paragraph","data":{"text":"Uzbek content"}}]},"ru":{"blocks":[{"type":"paragraph","data":{"text":"Russian content"}}]},"kk":{"blocks":[{"type":"paragraph","data":{"text":"Kazakh content"}}]}} */
  content?:
    | {
        time?: string;
        blocks?: {
          id?: string;
          type?: string;
          data?: {
            text?: string;
            level?: number;
            style?: string;
            url?: string;
            caption?: string;
            alignment?: string;
          };
        };
        version?: string;
      }
    | RichTextTranslationDto;
  sector?: UniversitySectorEnum;
  applicationFees?: ApplicationFeesSchema[];
  tuitionFees?: TuitionFeesSchema[];
  rankings?: RankingsSchema[];
  acceptanceRates?: AcceptanceRatesSchema[];
  universityTypes?: UniversityTypesSchema[];
  links?: LinksSchema[];
  degrees?: DegreesSchema[];
  majors?: MajorsSchema[];
  media?: MediaSchema[];
  requiredExams?: ReqExamsSchema[];
  scholarships?: ScholarshipsSchema[];
  deadlines?: DeadlinesSchema[];
  location?: LocationsSchema;
  contacts?: ContactsSchema;
  users?: string[];
  selectedBy?: string[];
}

export interface CreateUserDto {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  email: string;
  loginMethod: LoginMethod;
  phoneNumber?: string | null;
  aiSearchLimit: number;
  profile: ProfilesSchema;
  managementRole: RoleEnum;
  mentorProfile: MentorProfilesSchema;
  givenReviews: ReviewsSchema[];
  receivedReviews: ReviewsSchema[];
  /** This is the list of sessions mentor has, if user's a mentor */
  sessions: SessionsSchema[];
  /** User's joined sessions as a student */
  joinedSessions: SessionsSchema[];
  reports: ReportsSchema[];
  receivedReports: ReportsSchema[];
  payments: PaymentsSchema[];
  applications: string[];
  likedUniversities: UniversitiesSchema[];
  studentBookings: BookingsSchema[];
  mentorBookings: BookingsSchema[];
  billingCards: BillingCardsSchema[];
  selectedUniversities: UniversitiesSchema[];
}

export interface UpdateUsersDto {
  id?: string;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  updatedAt?: string;
  /** @format date-time */
  deletedAt?: string;
  email?: string;
  loginMethod?: LoginMethod;
  phoneNumber?: string | null;
  aiSearchLimit?: number;
  profile?: ProfilesSchema;
  managementRole?: RoleEnum;
  mentorProfile?: MentorProfilesSchema;
  givenReviews?: ReviewsSchema[];
  receivedReviews?: ReviewsSchema[];
  /** This is the list of sessions mentor has, if user's a mentor */
  sessions?: SessionsSchema[];
  /** User's joined sessions as a student */
  joinedSessions?: SessionsSchema[];
  reports?: ReportsSchema[];
  receivedReports?: ReportsSchema[];
  payments?: PaymentsSchema[];
  applications?: string[];
  likedUniversities?: UniversitiesSchema[];
  studentBookings?: BookingsSchema[];
  mentorBookings?: BookingsSchema[];
  billingCards?: BillingCardsSchema[];
  selectedUniversities?: UniversitiesSchema[];
}

export enum PaymentPlanTypeEnum {
  Individual30M = "individual30m",
  Individual60M = "individual60m",
  FullGuidence = "fullGuidence",
  Intensive = "intensive",
}

export interface PaymentPlansSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  minutes: number;
  type: PaymentPlanTypeEnum;
  prices: {
    junior?: number;
    senior?: number;
    expert?: number;
  };
  aiSearchCount: number;
  currency: object;
  bookings: BookingsSchema[];
}

export interface BlogsSchema {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  /** Multilingual content (display value) */
  title: string | null | TranslationDto;
  /** Multilingual content (display value) */
  subtitle: string | null | TranslationDto;
  author: string;
  showOnHomePage: boolean;
  /** @format date-time */
  publishedDate: string;
  /** @example {"en":{"blocks":[{"type":"paragraph","data":{"text":"English content"}}]},"uz":{"blocks":[{"type":"paragraph","data":{"text":"Uzbek content"}}]},"ru":{"blocks":[{"type":"paragraph","data":{"text":"Russian content"}}]},"kk":{"blocks":[{"type":"paragraph","data":{"text":"Kazakh content"}}]}} */
  content:
    | {
        time?: string;
        blocks?: {
          id?: string;
          type?: string;
          data?: {
            text?: string;
            level?: number;
            style?: string;
            url?: string;
            caption?: string;
            alignment?: string;
          };
        };
        version?: string;
      }
    | RichTextTranslationDto;
  media: any[][];
}

export interface CreateSessionDto {
  type: SessionTypeEnum;
  /** @format date-time */
  date: string;
}

export interface CancelSessionDto {
  id: string;
  reason: string;
}

export interface BookSessionDto {
  id: string;
  comment: string;
}

export interface RateSessionDto {
  id: string;
  rating: number;
  comment: string;
}

export enum CardTypeEnum {
  Uzcard = "uzcard",
  Humo = "humo",
  Currency = "currency",
}

export interface BaseCreatePaymentDto {
  cardNumber: string;
  expireDate: string;
  userId: string;
  save: boolean;
  cardType: CardTypeEnum;
  ipAddress: string;
}

export interface CreatePaymentDtoResponse {
  cardToken: string;
}

export interface InitBookingDto {
  cardToken: string;
  smsCode: string;
  sessionId: string;
  mentorId: string;
  planId: string;
}

export interface DefaultResponseDto {
  message: string;
}

export interface BuySubscriptionDto {
  cardToken: string;
  smsCode: string;
  planId: string;
  mentorId: string;
}

export interface BuySubscriptionPlanDto {
  cardToken: string;
  smsCode: string;
  planId: string;
}

export interface BuySubscriptionResponseDto {
  paymentStatus: PaymentStatusEnum;
  message: string;
  booking: BookingsSchema;
}

export interface GetRedirectUrlDto {
  sessionId: string;
  returnUrl: string;
  planId: string;
  mentorId: string;
}

export interface GetRedirectUrlResponseUrlDto {
  provider: string;
  url: string;
}

export interface GetRedirectUrlResponseDto {
  urls: GetRedirectUrlResponseUrlDto[];
  booking: BookingsSchema;
}

export interface CancelPaymentDto {
  paymentId: string;
}

export interface GetRedirectUrlSingleResponseDto {
  url: string;
  booking: BookingsSchema;
}

export interface GetPaymentStatusDto {
  paymentId: string;
}

export interface GetAllExchangeRatesResponseDto {
  /** @example "USD" */
  base: string;
  /**
   * An object mapping target currency codes to their rate data.
   * @example {"UZS":{"rate":12850.75,"updatedAt":"2025-05-13T00:02:10.000Z"},"EUR":{"rate":0.92,"updatedAt":"2025-05-13T00:02:10.000Z"}}
   */
  rates: Record<string, GetExchangeRateResponseDetailDto>;
}

export interface GetExchangeRateResponseDetailDto {
  rate: number;
  updatedAt: string;
}

export interface GetExchangeRateResponseDto {
  base: string;
  target: string;
  rate: GetExchangeRateResponseDetailDto;
}

export interface UniversitiesItemDto {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  /** Multilingual content (display value) */
  name: string | null | TranslationDto;
  /** Multilingual content (display value) */
  description: string | null | TranslationDto;
  /** Multilingual content (display value) */
  summary: string | null | TranslationDto;
  /** Multilingual content (display value) */
  notes: string | null | TranslationDto;
  establishedIn: string;
  /** @example {"en":{"blocks":[{"type":"paragraph","data":{"text":"English content"}}]},"uz":{"blocks":[{"type":"paragraph","data":{"text":"Uzbek content"}}]},"ru":{"blocks":[{"type":"paragraph","data":{"text":"Russian content"}}]},"kk":{"blocks":[{"type":"paragraph","data":{"text":"Kazakh content"}}]}} */
  content:
    | {
        time?: string;
        blocks?: {
          id?: string;
          type?: string;
          data?: {
            text?: string;
            level?: number;
            style?: string;
            url?: string;
            caption?: string;
            alignment?: string;
          };
        };
        version?: string;
      }
    | RichTextTranslationDto;
  sector: UniversitySectorEnum;
  applicationFees: ApplicationFeesSchema[];
  tuitionFees: TuitionFeesSchema[];
  rankings: RankingsSchema[];
  acceptanceRates: AcceptanceRatesSchema[];
  universityTypes: UniversityTypesSchema[];
  links: LinksSchema[];
  degrees: DegreesSchema[];
  majors: MajorsSchema[];
  media: MediaSchema[];
  requiredExams: ReqExamsSchema[];
  scholarships: ScholarshipsSchema[];
  deadlines: DeadlinesSchema[];
  location: LocationsSchema;
  contacts: ContactsSchema;
  users: string[];
  selectedBy: string[];
  /** Indicates if the user has liked this university */
  isLiked?: boolean;
}

export interface UniversitiesResponseDto {
  /** Universities */
  data: UniversitiesItemDto[];
  /** Total count */
  total: number;
}

export interface BaseMajorsDto {
  /** @format uuid */
  id: string;
  name: string;
  type: MajorTypeEnum;
}

export interface BaseDto {
  /** @format uuid */
  id: string;
  name: string;
}

export interface FiltersDto {
  majors: BaseMajorsDto[];
  degrees: BaseDto[];
  certifications: BaseDto[];
  scholarships: ScholarshipsTypesEnum[];
  continents: ContinentsEnum[];
  sector: UniversitySectorEnum;
}

export interface UnivsListDto {
  id: string;
  /** Multilingual content (display value) */
  name: string | null | TranslationDto;
}

export interface AIAdmissionDTO {
  rate: number;
  sat: string;
  act: string;
}

export interface AIAcademicsDTO {
  gpa: string;
  retention: number;
  graduation: number;
}

export interface AIFinanceDTO {
  cost: string;
  aid: number;
  size: number;
}

export interface AIMajorDTO {
  name: string;
  summary: string;
  match: number;
  rankings: string[];
  keyCourses: string[];
  careerPaths: string[];
  link: string | null;
}

export interface AIUnivDataDTO {
  summary: string;
  location: string;
  admission: AIAdmissionDTO;
  academics: AIAcademicsDTO;
  finance: AIFinanceDTO;
  majors: AIMajorDTO[];
}

export interface AIUnivDTO {
  id: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  /** @format date-time */
  deletedAt: string;
  /** Multilingual content (display value) */
  name: string | null | TranslationDto;
  /** Multilingual content (display value) */
  description: string | null | TranslationDto;
  /** Multilingual content (display value) */
  summary: string | null | TranslationDto;
  /** Multilingual content (display value) */
  notes: string | null | TranslationDto;
  establishedIn: string;
  /** @example {"en":{"blocks":[{"type":"paragraph","data":{"text":"English content"}}]},"uz":{"blocks":[{"type":"paragraph","data":{"text":"Uzbek content"}}]},"ru":{"blocks":[{"type":"paragraph","data":{"text":"Russian content"}}]},"kk":{"blocks":[{"type":"paragraph","data":{"text":"Kazakh content"}}]}} */
  content:
    | {
        time?: string;
        blocks?: {
          id?: string;
          type?: string;
          data?: {
            text?: string;
            level?: number;
            style?: string;
            url?: string;
            caption?: string;
            alignment?: string;
          };
        };
        version?: string;
      }
    | RichTextTranslationDto;
  sector: UniversitySectorEnum;
  applicationFees: ApplicationFeesSchema[];
  tuitionFees: TuitionFeesSchema[];
  rankings: RankingsSchema[];
  acceptanceRates: AcceptanceRatesSchema[];
  universityTypes: UniversityTypesSchema[];
  links: LinksSchema[];
  degrees: DegreesSchema[];
  majors: MajorsSchema[];
  media: MediaSchema[];
  requiredExams: ReqExamsSchema[];
  scholarships: ScholarshipsSchema[];
  deadlines: DeadlinesSchema[];
  location: LocationsSchema;
  contacts: ContactsSchema;
  users: string[];
  selectedBy: string[];
  aiData: AIUnivDataDTO | null;
  aiSummary: string | null;
}

export interface AIUnivSearchResponseDTO {
  aiId: string;
  data: AIUnivDTO[];
  summary: string;
  total: number;
}

export interface AddToFavoritesResDto {
  /** University added to favorite */
  message: string;
}

export enum MediaRelationName {
  University = "university",
  UserProfile = "userProfile",
  Session = "session",
  Blog = "blog",
}

export interface CreateMediaRequestDto {
  files: File[];
  relationId: string;
  relationName: MediaRelationName;
}

export interface UploadMediaRequestDto {
  files: File[];
}

export interface UploadMediaResponseDto {
  url: string;
  mimetype: string;
}

export interface AnswerDto {
  questionId: string;
  /** Answer score from -2 to 2 */
  answer: number;
}

export interface SubmitAssessmentDto {
  answers: AnswerDto[];
}

export interface TranslationDto {
  /** @example "Hello world" */
  en: string;
  /** @example "Привет мир" */
  ru: string;
  /** @example "Salom dunyo" */
  uz: string;
  /** @example "Сөздік" */
  kk: string;
}

export interface RichTextTranslationDto {
  en: {
    time?: string;
    blocks?: {
      id?: string;
      type?: string;
      data?: {
        text?: string;
        level?: number;
        style?: string;
        url?: string;
        caption?: string;
        alignment?: string;
      };
    };
    version?: string;
  };
  ru: {
    time?: string;
    blocks?: {
      id?: string;
      type?: string;
      data?: {
        text?: string;
        level?: number;
        style?: string;
        url?: string;
        caption?: string;
        alignment?: string;
      };
    };
    version?: string;
  };
  uz: {
    time?: string;
    blocks?: {
      id?: string;
      type?: string;
      data?: {
        text?: string;
        level?: number;
        style?: string;
        url?: string;
        caption?: string;
        alignment?: string;
      };
    };
    version?: string;
  };
  kk: {
    time?: string;
    blocks?: {
      id?: string;
      type?: string;
      data?: {
        text?: string;
        level?: number;
        style?: string;
        url?: string;
        caption?: string;
        alignment?: string;
      };
    };
    version?: string;
  };
}

import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, HeadersDefaults, ResponseType } from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown> extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({ securityWorker, secure, format, ...axiosConfig }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({ ...axiosConfig, baseURL: axiosConfig.baseURL || "https://topcoach.uz/api" });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(params1: AxiosRequestConfig, params2?: AxiosRequestConfig): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method && this.instance.defaults.headers[method.toLowerCase() as keyof HeadersDefaults]) || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] = property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(key, isFileType ? formItem : this.stringifyFormItem(formItem));
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (type === ContentType.FormData && body && body !== null && typeof body === "object") {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (type === ContentType.Text && body && body !== null && typeof body !== "string") {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title topcoach
 * @version 0.0.1
 * @baseUrl https://topcoach.uz/api
 * @contact
 *
 * TopCoach backend API
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  health = {
    /**
 * No description
 *
 * @tags Health
 * @name GetHealth
 * @request GET:/health
 * @secure
 * @response `200` `{
  \** @example "ok" *\
    status?: string,
  \** @example {"database":{"status":"up"}} *\
    info?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {} *\
    error?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"database":{"status":"up"}} *\
    details?: Record<string,{
    status: string,
    [key: string]: any,

}>,

}` The Health Check is successful
 * @response `503` `{
  \** @example "error" *\
    status?: string,
  \** @example {"database":{"status":"up"}} *\
    info?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"redis":{"status":"down","message":"Could not connect"}} *\
    error?: Record<string,{
    status: string,
    [key: string]: any,

}>,
  \** @example {"database":{"status":"up"},"redis":{"status":"down","message":"Could not connect"}} *\
    details?: Record<string,{
    status: string,
    [key: string]: any,

}>,

}` The Health Check is not successful
 */
    getHealth: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example "ok" */
          status?: string;
          /** @example {"database":{"status":"up"}} */
          info?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {} */
          error?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {"database":{"status":"up"}} */
          details?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
        },
        {
          /** @example "error" */
          status?: string;
          /** @example {"database":{"status":"up"}} */
          info?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {"redis":{"status":"down","message":"Could not connect"}} */
          error?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {"database":{"status":"up"},"redis":{"status":"down","message":"Could not connect"}} */
          details?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
        }
      >({
        path: `/health`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Health
     * @name SimpleHealth
     * @request GET:/health/simple
     * @secure
     * @response `200` `void`
     */
    simpleHealth: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/health/simple`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
  users = {
    /**
     * No description
     *
     * @tags Users
     * @name GetUsers
     * @summary Get All Users
     * @request GET:/users
     * @secure
     * @response `200` `(UsersSchema)[]` Users fetched successfully
     */
    getUsers: (params: RequestParams = {}) =>
      this.request<UsersSchema[], any>({
        path: `/users`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UpdateProfile
     * @summary Update Own Profile
     * @request PUT:/users
     * @secure
     * @response `200` `UsersSchema` User profile updated successfully
     */
    updateProfile: (data: UpdateUserDto, params: RequestParams = {}) =>
      this.request<UsersSchema, any>({
        path: `/users`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name GetUserById
     * @summary Get User By Id
     * @request GET:/users/user/{id}
     * @secure
     * @response `200` `UserDetailsResponseDto` User Details Fetched
     */
    getUserById: (id: string, params: RequestParams = {}) =>
      this.request<UserDetailsResponseDto, any>({
        path: `/users/user/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UpdateProfileImage
     * @summary Update Profile Image
     * @request POST:/users/update-profile-image
     * @secure
     * @response `200` `UpdateProfileResDto` Profile image updated successfully
     */
    updateProfileImage: (data: UpdateProfileImageDto, params: RequestParams = {}) =>
      this.request<UpdateProfileResDto, any>({
        path: `/users/update-profile-image`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UploadMentorVideos
     * @request POST:/users/mentor/videos
     * @secure
     * @response `200` `void` Video uploaded successfully
     */
    uploadMentorVideos: (data: UpdateMentorVideosDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/users/mentor/videos`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name GetMe
     * @summary Get Own Profile
     * @request GET:/users/me
     * @secure
     * @response `200` `GetMeResDto`
     */
    getMe: (params: RequestParams = {}) =>
      this.request<GetMeResDto, any>({
        path: `/users/me`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name CheckEmail
     * @summary Check Email
     * @request POST:/users/check-email
     * @secure
     * @response `201` `void`
     */
    checkEmail: (data: CheckEmailDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/users/check-email`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name GetMentors
     * @summary Get All Mentors
     * @request GET:/users/mentors
     * @secure
     * @response `200` `(MentorsResponseDto)[]` Mentors Fetched
     */
    getMentors: (params: RequestParams = {}) =>
      this.request<MentorsResponseDto[], any>({
        path: `/users/mentors`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name ReportUser
     * @summary Report User
     * @request POST:/users/report
     * @secure
     * @response `201` `ReportsSchema` User Reported
     */
    reportUser: (data: ReportUserDto, params: RequestParams = {}) =>
      this.request<ReportsSchema, any>({
        path: `/users/report`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name GetBalance
     * @summary Get Mentor Balance
     * @request GET:/users/balance/{mentorId}
     * @secure
     * @response `200` `BookingsSchema` Student Balance Fetched
     */
    getBalance: (mentorId: string, params: RequestParams = {}) =>
      this.request<BookingsSchema, any>({
        path: `/users/balance/${mentorId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name CanAccess
     * @request GET:/users/canAccess
     * @secure
     * @response `200` `CanAccessDto` Can User access the provided resource
     */
    canAccess: (
      query: {
        resource: TABLE_NAMES;
        action: PermissionEnum;
      },
      params: RequestParams = {},
    ) =>
      this.request<CanAccessDto, any>({
        path: `/users/canAccess`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name GetAiQuery
     * @request GET:/users/ai-query/{id}
     * @secure
     * @response `200` `void`
     */
    getAiQuery: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/users/ai-query/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name SendTestEmail
     * @request POST:/users/send-test-email
     * @secure
     * @response `201` `void`
     */
    sendTestEmail: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/users/send-test-email`,
        method: "POST",
        secure: true,
        ...params,
      }),
  };
  auth = {
    /**
     * @description Authenticates a user and returns tokens
     *
     * @tags Auth
     * @name Login
     * @summary Login with email and password
     * @request POST:/auth/login
     * @secure
     * @response `200` `LoginResponseDto` User logged in successfully
     * @response `201` `void` Authenticated
     * @response `401` `void` Unauthenticated
     * @response `500` `void` Internal server error
     */
    login: (data: LoginDto, params: RequestParams = {}) =>
      this.request<LoginResponseDto, void>({
        path: `/auth/login`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name RefreshToken
     * @request POST:/auth/refresh
     * @secure
     * @response `201` `void` New Access & Refresh token created
     * @response `401` `void` Unauthenticated
     * @response `500` `void` Internal server error
     */
    refreshToken: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/auth/refresh`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name Logout
     * @request POST:/auth/logout
     * @secure
     * @response `201` `void` User logged out
     * @response `401` `void` Unauthenticated
     * @response `500` `void` Internal server error
     */
    logout: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/auth/logout`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name RegisterMentorByEmail
     * @request POST:/auth/mentor/register/email
     * @secure
     * @response `201` `void` User registered. Confirmation email sent.
     * @response `500` `void` Internal server error
     */
    registerMentorByEmail: (data: RegisterMentorEmailDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/auth/mentor/register/email`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name RegisterStudentByEmail
     * @request POST:/auth/student/register/email
     * @secure
     * @response `201` `void` User registered. Confirmation email sent.
     * @response `500` `void` Internal server error
     */
    registerStudentByEmail: (data: RegisterStudentEmailDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/auth/student/register/email`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name ResendCode
     * @request POST:/auth/register/resend
     * @secure
     * @response `201` `void` Code sent
     * @response `400` `void` User or user verification not found.
     * @response `500` `void` Internal server error
     */
    resendCode: (data: ResendCodeDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/auth/register/resend`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name ResendEmail
     * @request POST:/auth/resend/email
     * @secure
     * @response `201` `void` Email sent
     * @response `400` `void` User or user verification not found.
     * @response `500` `void` Internal server error
     */
    resendEmail: (data: ResendEmailDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/auth/resend/email`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name VerifyEmail
     * @request GET:/auth/verify/email
     * @secure
     * @response `200` `LoginResponseDto` Email confirmed.
     * @response `403` `void` Email link is expired or invalid
     * @response `404` `void` User email not found
     * @response `500` `void` Internal server error
     */
    verifyEmail: (
      query: {
        token: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<LoginResponseDto, void>({
        path: `/auth/verify/email`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name VerifyPhone
     * @request POST:/auth/verify/phone
     * @secure
     * @response `201` `void` Phone number confirmed
     * @response `400` `void` Code Already Expired or Code Incorrect
     * @response `401` `void` User not found
     * @response `500` `void` Internal server error
     */
    verifyPhone: (data: VerifyPhoneDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/auth/verify/phone`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name GoogleLogin
     * @request GET:/auth/google
     * @secure
     * @response `200` `void`
     */
    googleLogin: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/auth/google`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name GoogleRedirect
     * @request GET:/auth/google/callback
     * @secure
     * @response `200` `void`
     */
    googleRedirect: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/auth/google/callback`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name LinkCalendar
     * @request POST:/auth/google/calendar/link
     * @secure
     * @response `200` `void` Calendar linked
     */
    linkCalendar: (data: CalendarLinkDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/auth/google/calendar/link`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name SmsWebhook
     * @request POST:/auth/sms/callback
     * @secure
     * @response `201` `void` Successfully updated
     * @response `404` `void` Request id not found
     * @response `422` `void` Request Id not provided
     * @response `500` `void` Internal server error
     */
    smsWebhook: (data: SMSCallbackDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/auth/sms/callback`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name ExchangeTokens
     * @request POST:/auth/exchange
     * @secure
     * @response `200` `ExchangeTokenResDto` Tokens exchanged
     * @response `400` `void` Code incorrect or expired
     * @response `500` `void` Internal server error
     */
    exchangeTokens: (data: ExchangeTokenDto, params: RequestParams = {}) =>
      this.request<ExchangeTokenResDto, void>({
        path: `/auth/exchange`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name ResetPassword
     * @request POST:/auth/reset/password
     * @secure
     * @response `201` `void` Password reset link sent
     * @response `404` `void` User not found
     * @response `500` `void` Internal server error
     */
    resetPassword: (data: ResetPasswordDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/auth/reset/password`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name ResetPasswordConfirm
     * @request POST:/auth/reset/password/confirm
     * @secure
     * @response `201` `void` Password reset!
     * @response `400` `void` Token expired or invalid
     * @response `404` `void` User not found
     * @response `500` `void` Internal server error
     */
    resetPasswordConfirm: (data: ResetPasswordConfirmDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/auth/reset/password/confirm`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name CheckFileAccess
     * @request GET:/auth/file-access
     * @secure
     * @response `200` `void`
     */
    checkFileAccess: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/auth/file-access`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
  camps = {
    /**
     * No description
     *
     * @tags Events
     * @name CampsList
     * @request GET:/camps
     * @secure
     * @response `default` `(EventsResponseDto)[]` List of events
     */
    campsList: (params: RequestParams = {}) =>
      this.request<any, EventsResponseDto[]>({
        path: `/camps`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Events
     * @name RemoveBatch
     * @request DELETE:/camps
     * @secure
     * @response `200` `void`
     */
    removeBatch: (
      query: {
        ids: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/camps`,
        method: "DELETE",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Events
     * @name GetCurrentActiveEvent
     * @request GET:/camps/latest
     * @secure
     * @response `default` `EventsSchema`
     */
    getCurrentActiveEvent: (params: RequestParams = {}) =>
      this.request<any, EventsSchema>({
        path: `/camps/latest`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Events
     * @name Apply
     * @request POST:/camps/{id}/apply
     * @secure
     * @response `201` `void`
     */
    apply: (id: string, data: CreateApplicationDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/camps/${id}/apply`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Events
     * @name GetMyEvents
     * @request GET:/camps/me
     * @secure
     * @response `default` `(ApplicationsSchema)[]` List of events
     */
    getMyEvents: (params: RequestParams = {}) =>
      this.request<any, ApplicationsSchema[]>({
        path: `/camps/me`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Events
     * @name CampsDetail
     * @request GET:/camps/{id}
     * @secure
     * @response `default` `EventsResponseDto` Event
     */
    campsDetail: (id: EventSingleParamDto, params: RequestParams = {}) =>
      this.request<any, EventsResponseDto>({
        path: `/camps/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
  sessions = {
    /**
     * No description
     *
     * @tags Sessions
     * @name GetMySessions
     * @request GET:/sessions/me
     * @secure
     * @response `200` `(SessionsSchema)[]` Success
     * @response `500` `void` Internal server error
     */
    getMySessions: (
      query?: {
        /** Sort field */
        _sort?: string;
        /** Sort order */
        _order?: SortOrderEnum;
        /** Pagination start index */
        _start?: number;
        /** Pagination end index */
        _end?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<SessionsSchema[], void>({
        path: `/sessions/me`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sessions
     * @name CreateSession
     * @request POST:/sessions
     * @secure
     * @response `201` `void` New Session created
     * @response `500` `void` Internal server error
     */
    createSession: (data: CreateSessionDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/sessions`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sessions
     * @name SessionsList
     * @request GET:/sessions
     * @secure
     * @response `200` `(SessionsSchema)[]` Success
     * @response `500` `void` Internal server error
     */
    sessionsList: (params: RequestParams = {}) =>
      this.request<SessionsSchema[], void>({
        path: `/sessions`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sessions
     * @name BulkUpdate
     * @request PUT:/sessions
     * @secure
     * @response `200` `void`
     * @response `500` `void` Internal server error
     */
    bulkUpdate: (
      query: {
        ids: string;
      },
      data: string[],
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/sessions`,
        method: "PUT",
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sessions
     * @name RemoveBatch
     * @request DELETE:/sessions
     * @secure
     * @response `200` `void`
     * @response `500` `void` Internal server error
     */
    removeBatch: (
      query: {
        ids: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/sessions`,
        method: "DELETE",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sessions
     * @name CancelSession
     * @request POST:/sessions/cancel
     * @secure
     * @response `200` `void` Session cancelled
     * @response `500` `void` Internal server error
     */
    cancelSession: (data: CancelSessionDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/sessions/cancel`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sessions
     * @name BookSession
     * @request POST:/sessions/book
     * @secure
     * @response `200` `void` Session booked
     * @response `500` `void` Internal server error
     */
    bookSession: (data: BookSessionDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/sessions/book`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sessions
     * @name WithdrawFromSession
     * @request POST:/sessions/withdraw
     * @secure
     * @response `200` `void` Session withdrawn
     * @response `500` `void` Internal server error
     */
    withdrawFromSession: (data: BookSessionDto, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/sessions/withdraw`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sessions
     * @name RateSession
     * @request POST:/sessions/rate
     * @secure
     * @response `200` `(SessionsSchema)[]` Success
     * @response `500` `void` Internal server error
     */
    rateSession: (data: RateSessionDto, params: RequestParams = {}) =>
      this.request<SessionsSchema[], void>({
        path: `/sessions/rate`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sessions
     * @name FindOne
     * @request GET:/sessions/{id}
     * @secure
     * @response `200` `void`
     * @response `500` `void` Internal server error
     */
    findOne: (id: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/sessions/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sessions
     * @name Update
     * @request PUT:/sessions/{id}
     * @secure
     * @response `200` `void`
     * @response `500` `void` Internal server error
     */
    update: (id: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/sessions/${id}`,
        method: "PUT",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sessions
     * @name Remove
     * @request DELETE:/sessions/{id}
     * @secure
     * @response `200` `void`
     * @response `500` `void` Internal server error
     */
    remove: (id: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/sessions/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  payments = {
    /**
     * No description
     *
     * @tags payments
     * @name InitPayment
     * @request POST:/payments/init/{method}
     * @secure
     * @response `default` `CreatePaymentDtoResponse`
     */
    initPayment: (method: string, data: BaseCreatePaymentDto, params: RequestParams = {}) =>
      this.request<any, CreatePaymentDtoResponse>({
        path: `/payments/init/${method}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags payments
     * @name ValidateAndPay
     * @request POST:/payments/validate/{method}
     * @secure
     * @response `default` `DefaultResponseDto`
     */
    validateAndPay: (method: string, data: InitBookingDto, params: RequestParams = {}) =>
      this.request<any, DefaultResponseDto>({
        path: `/payments/validate/${method}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags payments
     * @name BuySubscription
     * @request POST:/payments/subscription/{method}
     * @secure
     * @response `default` `BuySubscriptionResponseDto`
     */
    buySubscription: (method: string, data: BuySubscriptionDto, params: RequestParams = {}) =>
      this.request<any, BuySubscriptionResponseDto>({
        path: `/payments/subscription/${method}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags payments
     * @name GetRedirectUrlForAll
     * @request POST:/payments/redirect/all
     * @secure
     * @response `default` `GetRedirectUrlResponseDto`
     */
    getRedirectUrlForAll: (data: GetRedirectUrlDto, params: RequestParams = {}) =>
      this.request<any, GetRedirectUrlResponseDto>({
        path: `/payments/redirect/all`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags payments
     * @name CancelPayment
     * @request POST:/payments/cancel-test/{method}
     * @secure
     * @response `201` `void`
     */
    cancelPayment: (method: string, data: CancelPaymentDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/payments/cancel-test/${method}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags payments
     * @name GetRedirectUrl
     * @request POST:/payments/redirect/{method}
     * @secure
     * @response `default` `GetRedirectUrlSingleResponseDto`
     */
    getRedirectUrl: (method: string, data: GetRedirectUrlDto, params: RequestParams = {}) =>
      this.request<any, GetRedirectUrlSingleResponseDto>({
        path: `/payments/redirect/${method}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags payments
     * @name ClickCallback
     * @request POST:/payments/callback/click
     * @secure
     * @response `201` `void`
     */
    clickCallback: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/payments/callback/click`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags payments
     * @name PaymeCallback
     * @request POST:/payments/callback/payme
     * @secure
     * @response `200` `void`
     */
    paymeCallback: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/payments/callback/payme`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags payments
     * @name AtmosCallback
     * @request POST:/payments/callback/atmos
     * @secure
     * @response `200` `void`
     */
    atmosCallback: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/payments/callback/atmos`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags payments
     * @name GetPaymentPlans
     * @request GET:/payments/plans
     * @secure
     * @response `default` `(PaymentPlansSchema)[]`
     */
    getPaymentPlans: (
      query: {
        currency: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<any, PaymentPlansSchema[]>({
        path: `/payments/plans`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags payments
     * @name CheckPaymentStatus
     * @request POST:/payments/status/check
     * @secure
     * @response `201` `void`
     */
    checkPaymentStatus: (data: GetPaymentStatusDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/payments/status/check`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags payments
     * @name GetAllUsdRates
     * @summary Get all available USD-based exchange rates
     * @request GET:/payments/rates/usd/all
     * @secure
     * @response `200` `GetAllExchangeRatesResponseDto` Map of target currencies to their rate data.
     */
    getAllUsdRates: (params: RequestParams = {}) =>
      this.request<GetAllExchangeRatesResponseDto, any>({
        path: `/payments/rates/usd/all`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags payments
     * @name GetExchangeRate
     * @summary Get an exchange rate based on base & target
     * @request GET:/payments/rates/{base}/{target}
     * @secure
     * @response `default` `GetExchangeRateResponseDto`
     */
    getExchangeRate: (base: string, target: string, params: RequestParams = {}) =>
      this.request<any, GetExchangeRateResponseDto>({
        path: `/payments/rates/${base}/${target}`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
  university = {
    /**
     * No description
     *
     * @tags University
     * @name FindAll
     * @request GET:/university
     * @secure
     * @response `200` `UniversitiesResponseDto` Success
     * @response `500` `void` Internal server error
     */
    findAll: (
      query: {
        /** Sort field */
        _sort?: string;
        /** Sort order */
        _order?: SortOrderEnum;
        /** Pagination start index */
        _start?: number;
        /** Pagination end index */
        _end?: number;
        id?: string;
        /** @format date-time */
        createdAt?: string;
        /** @format date-time */
        updatedAt?: string;
        /** @format date-time */
        deletedAt?: string;
        /** Multilingual content (display value) */
        name?: string | null | TranslationDto;
        /** Multilingual content (display value) */
        description?: string | null | TranslationDto;
        /** Multilingual content (display value) */
        summary?: string | null | TranslationDto;
        /** Multilingual content (display value) */
        notes?: string | null | TranslationDto;
        establishedIn?: string;
        sector?: UniversitySectorEnum;
        /** Ids */
        degrees?: string[] | null;
        majors?: string[] | null;
        /** continent names */
        continents?: ContinentsEnum[];
        scholarships?: ScholarshipsTypesEnum[];
        requiredCertificates?: string[] | null;
        majorType: MajorTypeEnum;
      },
      params: RequestParams = {},
    ) =>
      this.request<UniversitiesResponseDto, void>({
        path: `/university`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags University
     * @name RemoveBatch
     * @request DELETE:/university
     * @secure
     * @response `200` `void`
     * @response `500` `void` Internal server error
     */
    removeBatch: (
      query: {
        ids: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/university`,
        method: "DELETE",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags University
     * @name GetFilters
     * @request GET:/university/filters
     * @secure
     * @response `200` `FiltersDto` Success
     * @response `500` `void` Internal server error
     */
    getFilters: (params: RequestParams = {}) =>
      this.request<FiltersDto, void>({
        path: `/university/filters`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags University
     * @name GetUnivsList
     * @request GET:/university/list
     * @secure
     * @response `200` `(UnivsListDto)[]` Success
     * @response `500` `void` Internal server error
     */
    getUnivsList: (params: RequestParams = {}) =>
      this.request<UnivsListDto[], void>({
        path: `/university/list`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags University
     * @name GetUnisByPrompt
     * @request GET:/university/query/ai
     * @secure
     * @response `500` `void` Internal server error
     * @response `default` `AIUnivSearchResponseDTO`
     */
    getUnisByPrompt: (
      query: {
        /** User ai query */
        query: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<any, void | AIUnivSearchResponseDTO>({
        path: `/university/query/ai`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags University
     * @name AddToFavorite
     * @request GET:/university/add-to-favorite
     * @secure
     * @response `200` `AddToFavoritesResDto` Success
     * @response `500` `void` Internal server error
     */
    addToFavorite: (
      query: {
        id: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<AddToFavoritesResDto, void>({
        path: `/university/add-to-favorite`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags University
     * @name RemoveFromFavorite
     * @request GET:/university/remove-from-favorite
     * @secure
     * @response `200` `AddToFavoritesResDto` Success
     * @response `500` `void` Internal server error
     */
    removeFromFavorite: (
      query: {
        id: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<AddToFavoritesResDto, void>({
        path: `/university/remove-from-favorite`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags University
     * @name UniversityDetail
     * @request GET:/university/{id}
     * @secure
     * @response `200` `UniversitiesSchema` University
     * @response `404` `void` Not Found
     * @response `500` `void` Internal server error
     */
    universityDetail: (id: any, params: RequestParams = {}) =>
      this.request<UniversitiesSchema, void>({
        path: `/university/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  reviews = {
    /**
     * No description
     *
     * @tags Reviews
     * @name FindAll
     * @request GET:/reviews
     * @secure
     * @response `200` `void`
     */
    findAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/reviews`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Reviews
     * @name Create
     * @request POST:/reviews
     * @secure
     * @response `201` `void`
     */
    create: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/reviews`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Reviews
     * @name BulkUpdate
     * @request PUT:/reviews
     * @secure
     * @response `200` `void`
     */
    bulkUpdate: (
      query: {
        ids: string;
      },
      data: string[],
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/reviews`,
        method: "PUT",
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Reviews
     * @name RemoveBatch
     * @request DELETE:/reviews
     * @secure
     * @response `200` `void`
     */
    removeBatch: (
      query: {
        ids: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/reviews`,
        method: "DELETE",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Reviews
     * @name FindOne
     * @request GET:/reviews/{id}
     * @secure
     * @response `200` `void`
     */
    findOne: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/reviews/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Reviews
     * @name Update
     * @request PUT:/reviews/{id}
     * @secure
     * @response `200` `void`
     */
    update: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/reviews/${id}`,
        method: "PUT",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Reviews
     * @name Remove
     * @request DELETE:/reviews/{id}
     * @secure
     * @response `200` `void`
     */
    remove: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/reviews/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  blogs = {
    /**
     * No description
     *
     * @name FindAll
     * @request GET:/blogs
     * @secure
     * @response `200` `void`
     */
    findAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/blogs`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @name Create
     * @request POST:/blogs
     * @secure
     * @response `201` `void`
     */
    create: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/blogs`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @name BulkUpdate
     * @request PUT:/blogs
     * @secure
     * @response `200` `void`
     */
    bulkUpdate: (
      query: {
        ids: string;
      },
      data: string[],
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/blogs`,
        method: "PUT",
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @name RemoveBatch
     * @request DELETE:/blogs
     * @secure
     * @response `200` `void`
     */
    removeBatch: (
      query: {
        ids: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/blogs`,
        method: "DELETE",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @name GetBlogsForHomePage
     * @request GET:/blogs/home
     * @secure
     * @response `200` `void`
     */
    getBlogsForHomePage: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/blogs/home`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @name FindOne
     * @request GET:/blogs/{id}
     * @secure
     * @response `200` `void`
     */
    findOne: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/blogs/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @name Update
     * @request PUT:/blogs/{id}
     * @secure
     * @response `200` `void`
     */
    update: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/blogs/${id}`,
        method: "PUT",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @name Remove
     * @request DELETE:/blogs/{id}
     * @secure
     * @response `200` `void`
     */
    remove: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/blogs/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  media = {
    /**
     * No description
     *
     * @name CreateMedia
     * @request POST:/media/create
     * @secure
     * @response `500` `void` Internal server error
     */
    createMedia: (data: CreateMediaRequestDto, params: RequestParams = {}) =>
      this.request<any, void>({
        path: `/media/create`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        ...params,
      }),

    /**
     * No description
     *
     * @name Upload
     * @request POST:/media/upload
     * @secure
     * @response `500` `void` Internal server error
     * @response `default` `(UploadMediaResponseDto)[]`
     */
    upload: (data: UploadMediaRequestDto, params: RequestParams = {}) =>
      this.request<any, void | UploadMediaResponseDto[]>({
        path: `/media/upload`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        ...params,
      }),
  };
  aiAssessment = {
    /**
     * No description
     *
     * @tags AI Assessment
     * @name GetQuestions
     * @request GET:/ai-assessment/questions
     * @secure
     * @response `200` `void`
     */
    getQuestions: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/ai-assessment/questions`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags AI Assessment
     * @name StartAssessment
     * @request POST:/ai-assessment/start
     * @secure
     * @response `201` `void`
     */
    startAssessment: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/ai-assessment/start`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags AI Assessment
     * @name SubmitAssessment
     * @request POST:/ai-assessment/submit
     * @secure
     * @response `201` `void`
     */
    submitAssessment: (data: SubmitAssessmentDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/ai-assessment/submit`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags AI Assessment
     * @name GetAssessmentResult
     * @request GET:/ai-assessment/result/{sessionId}
     * @secure
     * @response `200` `void`
     */
    getAssessmentResult: (sessionId: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/ai-assessment/result/${sessionId}`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
}
