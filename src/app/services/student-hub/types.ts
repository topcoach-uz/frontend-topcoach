// 🎓 Student Hub API Types
// TypeScript interfaces for all Student Hub API responses

// ========================================
// 📊 COMMON TYPES
// ========================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// ========================================
// 👤 STUDENT PROFILE TYPES
// ========================================

export interface StudentProfile {
  id: string;
  userId: string;
  profileId: string;
  isActive: boolean;
  completionPercentage: number;
  profileStatus: 'incomplete' | 'in_progress' | 'complete' | 'reviewed';
  lastActiveAt?: string;
  preferences: Record<string, any>;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  profile?: {
    id: string;
    name: string;
    role: string;
    overallRating: number;
    profileComplete: boolean;
    createdAt: string;
    updatedAt: string;
  };
  academicProfile?: AcademicProfile;
  personalProfile?: PersonalProfile;
  activitiesProfile?: ActivitiesProfile;
  studentDocuments?: StudentDocument[];
  collegeApplications?: CollegeApplication[];
  studentEssays?: StudentEssay[];
  progressTracking?: ProgressTracking[];
}

export interface CreateStudentProfileRequest {
  userId: string;
  profileId: string;
  isActive?: boolean;
  completionPercentage?: number;
  profileStatus?: 'incomplete' | 'in_progress' | 'complete' | 'reviewed';
  preferences?: Record<string, any>;
  settings?: Record<string, any>;
  academicProfile?: CreateAcademicProfileRequest;
  personalProfile?: CreatePersonalProfileRequest;
  activitiesProfile?: CreateActivitiesProfileRequest;
}

export interface UpdateStudentProfileRequest {
  isActive?: boolean;
  completionPercentage?: number;
  profileStatus?: 'incomplete' | 'in_progress' | 'complete' | 'reviewed';
  preferences?: Record<string, any>;
  settings?: Record<string, any>;
  academicProfile?: UpdateAcademicProfileRequest;
  personalProfile?: UpdatePersonalProfileRequest;
  activitiesProfile?: UpdateActivitiesProfileRequest;
}

// ========================================
// 🎓 ACADEMIC PROFILE TYPES
// ========================================

export interface AcademicProfile {
  id: string;
  studentProfileId: string;
  testScores: {
    sat?: {
      math?: number;
      readingWriting?: number;
      total?: number;
    };
    act?: {
      composite?: number;
      math?: number;
      reading?: number;
      science?: number;
      writing?: number;
    };
    ielts?: {
      overall?: number;
      listening?: number;
      reading?: number;
      writing?: number;
      speaking?: number;
    };
    toefl?: {
      total?: number;
      reading?: number;
      listening?: number;
      speaking?: number;
      writing?: number;
    };
    duolingo?: number;
  };
  gpa: {
    unweighted?: number;
    weighted?: number;
    scale?: number;
    cumulative?: number;
  };
  englishProficiency: {
    ielts?: number;
    toefl?: number;
    duolingo?: number;
  };
  curriculum: 'IB' | 'A-Levels' | 'AP' | 'National' | 'Other';
  graduationYear: number;
  gapYear: boolean;
  firstGeneration: boolean;
  financialAid: boolean;
  academicAchievements?: Record<string, any>;
  transcripts?: Record<string, any>;
  academicStrengthsAndInterests?: {
    strengths?: string[];
    weaknesses?: string[];
    favoriteSubjects?: string[];
    leastFavoriteSubjects?: string[];
  };
  learningPreferences?: {
    style?: ('visual' | 'auditory' | 'reading-writing' | 'kinesthetic' | 'mixed')[];
    preferredClassSize?: 'small' | 'medium' | 'large' | 'no-preference';
    preferredTeachingMethod?: 'lecture' | 'discussion' | 'hands-on' | 'project-based' | 'mixed';
    studyEnvironment?: 'quiet' | 'moderate' | 'noisy' | 'no-preference';
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAcademicProfileRequest {
  testScores?: AcademicProfile['testScores'];
  gpa?: AcademicProfile['gpa'];
  englishProficiency?: AcademicProfile['englishProficiency'];
  curriculum: AcademicProfile['curriculum'];
  graduationYear: number;
  gapYear?: boolean;
  firstGeneration?: boolean;
  financialAid?: boolean;
  academicAchievements?: Record<string, any>;
  transcripts?: Record<string, any>;
  academicStrengthsAndInterests?: {
    strengths?: string[];
    weaknesses?: string[];
    favoriteSubjects?: string[];
    leastFavoriteSubjects?: string[];
  };
  learningPreferences?: {
    style?: ('visual' | 'auditory' | 'reading-writing' | 'kinesthetic' | 'mixed')[];
    preferredClassSize?: 'small' | 'medium' | 'large' | 'no-preference';
    preferredTeachingMethod?: 'lecture' | 'discussion' | 'hands-on' | 'project-based' | 'mixed';
    studyEnvironment?: 'quiet' | 'moderate' | 'noisy' | 'no-preference';
  };
}

export interface UpdateAcademicProfileRequest extends Partial<CreateAcademicProfileRequest> {}

// ========================================
// 👤 PERSONAL PROFILE TYPES
// ========================================

export interface PersonalProfile {
  id: string;
  studentProfileId: string;
  country: string;
  state?: string;
  city?: string;
  timezone?: string;
  demographics: {
    ethnicity?: string[];
    gender?: 'male' | 'female' | 'prefer-not-to-say';
    disability?: boolean;
    militaryService?: boolean;
    citizenship?: string;
    visaStatus?: string;
    languages?: Array<{
      language: string;
      proficiency: 'native' | 'fluent' | 'conversational' | 'basic';
    }>;
  };
  familyBackground?: {
    parentEducation?: {
      mother?: 'high-school' | 'bachelor' | 'master' | 'phd' | 'unknown';
      father?: 'high-school' | 'bachelor' | 'master' | 'phd' | 'unknown';
    };
    familyIncome?: 'low' | 'middle' | 'high' | 'prefer-not-to-say';
    siblings?: number;
    firstGeneration?: boolean;
    singleParent?: boolean;
  };
  personalInterests: string[]; // Required for AI recommendations
  careerGoals: string[]; // Required for AI recommendations
  studyAbroadInterest?: boolean;
  studyAbroadGoals?: {
    interest: boolean;
    targetCountries?: string[];
    targetRegions?: string[];
    durationPreference?: 'semester' | 'year' | 'full-degree' | 'summer' | 'flexible';
    priorityLevel?: 'high' | 'medium' | 'low';
  };
  intendedMajors: Array<{ // Required for AI recommendations
    major: string;
    rank: number;
    confidence: number;
    whyInterested?: string;
    alternativePaths?: string[];
    notes?: string;
  }>;
  backupMajors?: Array<{
    major: string;
    rank: number;
    confidence: number;
    notes?: string;
  }>;
  valuesAndMotivations?: string[];
  universityPreferences?: string[];
  workStylePreferences?: string[];
  problemSolvingApproach?: string[];
  personalStatement?: string;
  additionalInfo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonalProfileRequest {
  country: string;
  state?: string;
  city?: string;
  timezone?: string;
  demographics?: PersonalProfile['demographics'];
  languages: Array<{
    language: string;
    proficiency: 'native' | 'fluent' | 'conversational' | 'basic';
  }>; // Required for AI recommendations
  familyBackground?: PersonalProfile['familyBackground'];
  personalInterests: string[]; // Required for AI recommendations
  careerGoals: string[]; // Required for AI recommendations
  studyAbroadInterest?: boolean;
  studyAbroadGoals?: PersonalProfile['studyAbroadGoals'];
  intendedMajors: PersonalProfile['intendedMajors']; // Required for AI recommendations
  backupMajors?: PersonalProfile['backupMajors'];
  valuesAndMotivations?: string[];
  universityPreferences?: string[];
  workStylePreferences?: string[];
  problemSolvingApproach?: string[];
  personalStatement?: string;
  additionalInfo?: string;
}

export interface UpdatePersonalProfileRequest extends Partial<CreatePersonalProfileRequest> {}

// ========================================
// 🏆 ACTIVITIES PROFILE TYPES
// ========================================

export interface ActivitiesProfile {
  id: string;
  studentProfileId: string;
  extracurricularActivities: Record<string, any>[];
  workExperience: Record<string, any>[];
  volunteerWork: Record<string, any>[];
  leadershipRoles: Record<string, any>[];
  awards: Record<string, any>[];
  competitions: Record<string, any>[];
  researchExperience: Record<string, any>[];
  publications: Record<string, any>[];
  sports: Record<string, any>[];
  arts: Record<string, any>[];
  certifications?: Record<string, any>[];
  hobbies?: Record<string, any>[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivitiesProfileRequest {
  extracurricularActivities?: Record<string, any>[];
  workExperience?: Record<string, any>[];
  volunteerWork?: Record<string, any>[];
  leadershipRoles?: Record<string, any>[];
  awards?: Record<string, any>[];
  competitions?: Record<string, any>[];
  researchExperience?: Record<string, any>[];
  publications?: Record<string, any>[];
  sports?: Record<string, any>[];
  arts?: Record<string, any>[];
  certifications?: Record<string, any>[];
  hobbies?: Record<string, any>[];
}

export interface UpdateActivitiesProfileRequest extends Partial<CreateActivitiesProfileRequest> {}

// ========================================
// 📄 STUDENT DOCUMENTS TYPES
// ========================================

export interface StudentDocument {
  id: string;
  studentProfileId: string;
  documentType: 'transcript' | 'test_score' | 'recommendation' | 'essay' | 'resume' | 'portfolio' | 'certificate' | 'other';
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  isVerified: boolean;
  uploadedBy: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentDocumentRequest {
  documentType: StudentDocument['documentType'];
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  metadata?: Record<string, any>;
}

export interface UpdateStudentDocumentRequest extends Partial<CreateStudentDocumentRequest> {}

// ========================================
// 🎓 COLLEGE APPLICATIONS TYPES
// ========================================

export interface ApplicationActivityEvent {
  type: string;
  at: string;
  payload?: Record<string, unknown>;
}

export interface CollegeApplication {
  id: string;
  studentProfileId: string;
  universityId?: string;
  universityName?: string;
  major?: string;
  applicationType: 'common_app' | 'coalition' | 'direct' | 'ucas' | 'other';
  status: 'researching' | 'applying' | 'submitted' | 'accepted' | 'rejected' | 'waitlisted' | 'deferred';
  category: 'reach' | 'target' | 'safety';
  priority: number;
  deadline?: string;
  financialInfo: Record<string, any>;
  requirements?: Record<string, any>;
  mentorId?: string;
  notes?: string;
  whyThisSchool?: string;
  activity?: ApplicationActivityEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCollegeApplicationRequest {
  universityId?: string;
  universityName?: string;
  major?: string;
  applicationType: CollegeApplication['applicationType'];
  status?: CollegeApplication['status'];
  category: CollegeApplication['category'];
  priority?: CollegeApplication['priority'];
  deadline?: string;
  financialInfo?: Record<string, any>;
  requirements?: Record<string, any>;
  mentorId?: string;
  notes?: string;
  whyThisSchool?: string;
}

export interface UpdateCollegeApplicationRequest extends Partial<CreateCollegeApplicationRequest> {
  activityEvent?: { type: string; payload?: Record<string, unknown> };
}

// ========================================
// ✅ APPLICATION TASKS TYPES
// ========================================

export interface ApplicationTask {
  id: string;
  studentProfileId: string;
  collegeApplicationId?: string;
  title: string;
  description?: string;
  taskType: 'essay' | 'recommendation' | 'transcript' | 'test_score' | 'interview' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  dueDate?: string;
  completedDate?: string;
  isRecurring: boolean;
  recurringPattern?: string;
  isAiGenerated: boolean;
  assignedTo?: 'student' | 'mentor';
  assignedUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationTaskRequest {
  collegeApplicationId?: string;
  title: string;
  description?: string;
  taskType: ApplicationTask['taskType'];
  priority?: ApplicationTask['priority'];
  status?: ApplicationTask['status'];
  dueDate?: string;
  isRecurring?: boolean;
  recurringPattern?: string;
  isAiGenerated?: boolean;
  assignedTo?: 'student' | 'mentor';
  assignedUserId?: string;
}

export interface UpdateApplicationTaskRequest extends Partial<CreateApplicationTaskRequest> {}

// ========================================
// 🏆 SCHOLARSHIP APPLICATIONS TYPES
// ========================================

export interface ScholarshipApplication {
  id: string;
  studentProfileId: string;
  scholarshipId: string;
  status: 'researching' | 'applying' | 'submitted' | 'accepted' | 'rejected' | 'waitlisted';
  externalScholarship: boolean;
  amount?: number;
  eligibilityScore?: number;
  matchReasons: string[];
  essayRequirements?: string[];
  deadlines: {
    application?: string;
    notification?: string;
  };
  decisionTracking: {
    decisionDate?: string;
    decisionLetter?: string;
    amountAwarded?: number;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScholarshipApplicationRequest {
  scholarshipId?: string;
  scholarshipName?: string;
  organization?: string;
  amount?: number;
  currency?: string;
  status?: ScholarshipApplication['status'];
  applicationDeadline?: string;
  essayRequired?: boolean;
  essayPrompt?: string;
  notes?: string;
}

export interface UpdateScholarshipApplicationRequest extends Partial<CreateScholarshipApplicationRequest> {}

// ========================================
// ✍️ STUDENT ESSAYS TYPES
// ========================================

export interface StudentEssay {
  id: string;
  studentProfileId: string;
  collegeApplicationId?: string;
  scholarshipApplicationId?: string;
  essayType: 'personal_statement' | 'supplemental' | 'scholarship' | 'why_school' | 'why_major' | 'activity' | 'diversity' | 'leadership' | 'challenge' | 'other';
  title: string;
  prompt: string;
  content: string;
  wordCount: number;
  characterCount: number;
  status: 'draft' | 'review' | 'revision' | 'final' | 'submitted' | 'archived';
  isTemplate: boolean;
  templateId?: string;
  isShared: boolean;
  sharedWith?: string[];
  // Enhanced AI fields
  aiBrainstorming?: {
    topic?: string;
    ideas?: Array<{
      title: string;
      description: string;
      angle: string;
      keyPoints: string[];
    }>;
    hooks?: string[];
    angles?: string[];
    keywords?: string[];
    generatedAt?: string;
  };
  outline?: {
    introduction?: {
      hook?: string;
      context?: string;
      thesis?: string;
    };
    body?: Array<{
      paragraph: number;
      topic: string;
      mainPoint: string;
      supportingDetails?: string[];
    }>;
    conclusion?: {
      summary?: string;
      callToAction?: string;
      finalThought?: string;
    };
    generatedAt?: string;
    isAIGenerated?: boolean;
  };
  aiFeedback?: {
    overallScore?: number;
    strengths?: string[];
    weaknesses?: string[];
    suggestions?: Array<{
      type: 'grammar' | 'clarity' | 'structure' | 'tone' | 'content' | 'style';
      text: string;
      position?: number;
      severity: 'low' | 'medium' | 'high';
      example?: string;
    }>;
    grammarScore?: number;
    clarityScore?: number;
    creativityScore?: number;
    structureScore?: number;
    coherenceScore?: number;
    argumentStrength?: number;
    lastAnalyzed?: string;
    analysisVersion?: string;
    detailedAnalysis?: {
      introduction?: { score: number; feedback: string };
      body?: Array<{ paragraph: number; score: number; feedback: string }>;
      conclusion?: { score: number; feedback: string };
    };
  };
  mentorFeedback?: string | {
    overallScore?: number;
    strengths?: string[];
    areasForImprovement?: string[];
    suggestions?: string[];
    mentorId?: string;
    mentorName?: string;
    lastReviewed?: string;
    isApproved?: boolean;
    approvalNotes?: string;
  };
  peerFeedback?: string;
  selfFeedback?: string;
  // File upload fields
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt?: string;
  // Auto-save and editing
  lastAutoSavedAt?: string;
  autoSaveEnabled?: boolean;
  readabilityScore?: number;
  lastEditedAt?: string;
  metadata?: {
    purpose?: string;
    uploadSource?: string;
    processingStatus?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentEssayRequest {
  collegeApplicationId?: string;
  scholarshipApplicationId?: string;
  essayType: StudentEssay['essayType'];
  title: string;
  prompt: string;
  content?: string;
  isTemplate?: boolean;
  templateId?: string;
  isShared?: boolean;
  sharedWith?: string[];
}

export interface UpdateStudentEssayRequest extends Partial<CreateStudentEssayRequest> {
  content?: string;
  status?: StudentEssay['status'];
  aiFeedback?: string;
  mentorFeedback?: string;
  peerFeedback?: string;
  selfFeedback?: string;
}

// ========================================
// 🤖 AI CONSULTATION SESSIONS TYPES
// ========================================

export interface AiConsultationSession {
  id: string;
  studentProfileId: string;
  sessionType: 'profile_analysis' | 'college_recommendations' | 'essay_help' | 'general_guidance';
  context: Record<string, any>;
  userQuery: string;
  aiResponse: string;
  actionItems: string[];
  satisfactionRating?: number;
  followUpRequired: boolean;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAiConsultationSessionRequest {
  sessionType: AiConsultationSession['sessionType'];
  context?: Record<string, any>;
  userQuery: string;
  actionItems?: string[];
  followUpRequired?: boolean;
  followUpDate?: string;
}

export interface UpdateAiConsultationSessionRequest extends Partial<CreateAiConsultationSessionRequest> {
  satisfactionRating?: number;
}

// ========================================
// 🔔 NOTIFICATIONS TYPES
// ========================================

export interface Notification {
  id: string;
  userId: string;
  type: 'deadline_reminder' | 'task_overdue' | 'progress_update' | 'achievement' | 'ai_insight' | 'mentor_message' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'clicked' | 'dismissed' | 'archived';
  targetUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationRequest {
  type: Notification['type'];
  title: string;
  message: string;
  priority?: Notification['priority'];
  targetUrl?: string;
  metadata?: Record<string, any>;
}

export interface UpdateNotificationRequest {
  status?: Notification['status'];
}

// ========================================
// 📊 PROGRESS TRACKING TYPES
// ========================================

export interface ProgressTracking {
  id: string;
  studentProfileId: string;
  category: 'profile_completion' | 'applications' | 'essays' | 'tasks' | 'scholarships' | 'documents';
  metric: string;
  value: number;
  targetValue?: number;
  unit?: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProgressTrackingRequest {
  category: ProgressTracking['category'];
  metric: string;
  value: number;
  targetValue?: number;
  unit?: string;
  period?: ProgressTracking['period'];
}

export interface UpdateProgressTrackingRequest extends Partial<CreateProgressTrackingRequest> {}

// ========================================
// 📧 EMAIL TEMPLATES TYPES
// ========================================

export interface EmailTemplate {
  id: string;
  name: string;
  type: 'professor_email' | 'recommender_request' | 'thank_you_note' | 'follow_up' | 'inquiry' | 'other';
  subject: string;
  body: string;
  placeholders: string[];
  isActive: boolean;
  usageCount: number;
  averageRating: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailTemplateRequest {
  name: string;
  type: EmailTemplate['type'];
  subject: string;
  body: string;
  placeholders?: string[];
  isActive?: boolean;
}

export interface UpdateEmailTemplateRequest extends Partial<CreateEmailTemplateRequest> {}

// ========================================
// ⚙️ USER PREFERENCES TYPES
// ========================================

export interface UserPreferences {
  id: string;
  userId: string;
  notificationSettings: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    deadlineReminders?: boolean;
    taskOverdue?: boolean;
    essayFeedback?: boolean;
    mentorMessages?: boolean;
    aiInsights?: boolean;
    progressUpdates?: boolean;
  };
  privacySettings: {
    profileVisibility?: 'public' | 'private' | 'mentors-only';
    dataSharing?: boolean;
    analyticsTracking?: boolean;
    showProgress?: boolean;
  };
  displaySettings: {
    theme?: 'light' | 'dark' | 'auto';
    language?: string;
    timezone?: string;
    dateFormat?: string;
    timeFormat?: '12h' | '24h';
  };
  applicationSettings: {
    defaultApplicationType?: string;
    autoSave?: boolean;
    reminderDays?: number;
    defaultPriority?: string;
    communityExperienceMode?: 'community' | 'standard';
    studyBuddyInterests?: {
      examPrep?: string[];
      applicationGoals?: string[];
      intendedMajors?: string[];
      focusAreas?: string[];
    };
  };
  aiSettings: {
    assistanceLevel?: 'minimal' | 'moderate' | 'aggressive';
    feedbackFrequency?: 'immediate' | 'daily' | 'weekly';
    suggestionTypes?: string[];
    autoAnalysis?: boolean;
  };
  mentorPreferences: {
    communicationStyle?: 'formal' | 'casual' | 'mixed';
    feedbackStyle?: 'direct' | 'constructive' | 'encouraging';
    availability?: string[];
    expertise?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserPreferencesRequest {
  notificationSettings?: Partial<UserPreferences['notificationSettings']>;
  privacySettings?: Partial<UserPreferences['privacySettings']>;
  displaySettings?: Partial<UserPreferences['displaySettings']>;
  applicationSettings?: Partial<UserPreferences['applicationSettings']>;
  aiSettings?: Partial<UserPreferences['aiSettings']>;
  mentorPreferences?: Partial<UserPreferences['mentorPreferences']>;
}

// ========================================
// 📊 DASHBOARD TYPES
// ========================================

export interface DashboardStats {
  user: {
    firstName: string;
    lastName: string;
    fullName: string;
  };
  profile: {
    completionPercentage: number;
    profileStatus: string;
    sectionsCompleted: number;
    totalSections: number;
    lastUpdated: string;
  };
  applications: {
    collegeApplications: {
      total: number;
      byStatus: Record<string, number>;
      byCategory: Record<string, number>;
      upcomingDeadlines: any[];
    };
    tasks: {
      total: number;
      completed: number;
      overdue: number;
      upcoming: any[];
    };
    scholarships: {
      total: number;
      byStatus: Record<string, number>;
      totalAmount: number;
      upcomingDeadlines: any[];
    };
  };
  essays: {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    totalWords: number;
    averageWords: number;
    recentEssays: any[];
  };
  aiSessions: {
    total: number;
    byType: Record<string, number>;
    averageSatisfaction: number;
    helpfulSessions: number;
    recentSessions: any[];
  };
  notifications: {
    total: number;
    unread: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    recentActivity: ActivityItem[];
  };
  insights: {
    nextDeadline?: {
      title: string;
      deadline: string;
      daysUntil: number;
      priority: string;
    };
    recommendedActions: Array<{
      type: string;
      title: string;
      description: string;
      priority: string;
      estimatedTime: number;
    }>;
    achievements: Array<{
      title: string;
      description: string;
      date: string;
      category: string;
    }>;
  };
}

export interface ActivityItem {
  id: string;
  type: 'essay' | 'application' | 'task' | 'achievement';
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'overdue';
}

export interface ProgressItem {
  category: string;
  completed: number;
  total: number;
  percentage: number;
  status: 'complete' | 'in_progress' | 'pending';
}