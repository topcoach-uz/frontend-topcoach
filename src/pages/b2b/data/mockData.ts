// Mock data for B2B dashboard
// This will be replaced with real API calls later

export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'completed' | 'pending';
  enrollmentDate: string;
  enrolledCourses: CourseEnrollment[];
  totalProgress: number;
  lastActivity: string;
  organization: string;
}

export interface CourseEnrollment {
  courseId: string;
  courseName: string;
  progress: number;
  status: 'in-progress' | 'completed' | 'not-started';
  enrolledDate: string;
  completedDate?: string;
  lessonsCompleted: number;
  totalLessons: number;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  duration: string;
  totalLessons: number;
  enrolledStudents: number;
  completionRate: number;
  category: string;
}

export interface Activity {
  id: string;
  type: 'enrollment' | 'completion' | 'progress' | 'assignment';
  studentId: string;
  studentName: string;
  courseId?: string;
  courseName?: string;
  message: string;
  timestamp: string;
}

// Mock Students Data
export const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+1 (555) 123-4567',
    status: 'active',
    enrollmentDate: '2025-01-15',
    totalProgress: 78,
    lastActivity: '2025-11-08T10:30:00',
    organization: 'Westminster School',
    enrolledCourses: [
      {
        courseId: 'course-1',
        courseName: 'Foundations of College Admissions',
        progress: 85,
        status: 'in-progress',
        enrolledDate: '2025-01-15',
        lessonsCompleted: 17,
        totalLessons: 20,
      },
      {
        courseId: 'course-2',
        courseName: 'Essay Writing Mastery',
        progress: 65,
        status: 'in-progress',
        enrolledDate: '2025-02-01',
        lessonsCompleted: 13,
        totalLessons: 20,
      },
    ],
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    phone: '+1 (555) 234-5678',
    status: 'active',
    enrollmentDate: '2025-01-20',
    totalProgress: 92,
    lastActivity: '2025-11-08T09:15:00',
    organization: 'Westminster School',
    enrolledCourses: [
      {
        courseId: 'course-1',
        courseName: 'Foundations of College Admissions',
        progress: 100,
        status: 'completed',
        enrolledDate: '2025-01-20',
        completedDate: '2025-10-15',
        lessonsCompleted: 20,
        totalLessons: 20,
      },
    ],
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@example.com',
    status: 'active',
    enrollmentDate: '2025-02-10',
    totalProgress: 45,
    lastActivity: '2025-11-07T14:20:00',
    organization: 'Westminster School',
    enrolledCourses: [
      {
        courseId: 'course-1',
        courseName: 'Foundations of College Admissions',
        progress: 45,
        status: 'in-progress',
        enrolledDate: '2025-02-10',
        lessonsCompleted: 9,
        totalLessons: 20,
      },
    ],
  },
  {
    id: '4',
    name: 'David Kim',
    email: 'david.kim@example.com',
    phone: '+1 (555) 345-6789',
    status: 'completed',
    enrollmentDate: '2023-12-01',
    totalProgress: 100,
    lastActivity: '2025-09-30T16:45:00',
    organization: 'Westminster School',
    enrolledCourses: [
      {
        courseId: 'course-1',
        courseName: 'Foundations of College Admissions',
        progress: 100,
        status: 'completed',
        enrolledDate: '2023-12-01',
        completedDate: '2025-09-30',
        lessonsCompleted: 20,
        totalLessons: 20,
      },
      {
        courseId: 'course-2',
        courseName: 'Essay Writing Mastery',
        progress: 100,
        status: 'completed',
        enrolledDate: '2025-01-10',
        completedDate: '2025-08-15',
        lessonsCompleted: 20,
        totalLessons: 20,
      },
    ],
  },
  {
    id: '5',
    name: 'Jessica Martinez',
    email: 'jessica.martinez@example.com',
    status: 'pending',
    enrollmentDate: '2025-11-01',
    totalProgress: 0,
    lastActivity: '2025-11-01T10:00:00',
    organization: 'Westminster School',
    enrolledCourses: [
      {
        courseId: 'course-1',
        courseName: 'Foundations of College Admissions',
        progress: 0,
        status: 'not-started',
        enrolledDate: '2025-11-01',
        lessonsCompleted: 0,
        totalLessons: 20,
      },
    ],
  },
  {
    id: '6',
    name: 'James Wilson',
    email: 'james.wilson@example.com',
    phone: '+1 (555) 456-7890',
    status: 'active',
    enrollmentDate: '2025-01-25',
    totalProgress: 67,
    lastActivity: '2025-11-08T11:00:00',
    organization: 'Westminster School',
    enrolledCourses: [
      {
        courseId: 'course-2',
        courseName: 'Essay Writing Mastery',
        progress: 67,
        status: 'in-progress',
        enrolledDate: '2025-01-25',
        lessonsCompleted: 13,
        totalLessons: 20,
      },
    ],
  },
];

// Mock Courses Data
export const mockCourses: Course[] = [
  {
    id: 'course-1',
    name: 'Foundations of College Admissions',
    description: 'Comprehensive guide to college admissions process',
    duration: '5 weeks',
    totalLessons: 20,
    enrolledStudents: 45,
    completionRate: 68,
    category: 'Admissions',
  },
  {
    id: 'course-2',
    name: 'Essay Writing Mastery',
    description: 'Master the art of writing compelling college essays',
    duration: '4 weeks',
    totalLessons: 20,
    enrolledStudents: 38,
    completionRate: 72,
    category: 'Writing',
  },
  {
    id: 'course-3',
    name: 'SAT/ACT Preparation',
    description: 'Complete test preparation strategies and practice',
    duration: '8 weeks',
    totalLessons: 30,
    enrolledStudents: 52,
    completionRate: 58,
    category: 'Test Prep',
  },
  {
    id: 'course-4',
    name: 'Financial Aid & Scholarships',
    description: 'Navigate financial aid and scholarship opportunities',
    duration: '3 weeks',
    totalLessons: 15,
    enrolledStudents: 28,
    completionRate: 75,
    category: 'Financial',
  },
];

// Mock Activities Data
export const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'completion',
    studentId: '2',
    studentName: 'Michael Chen',
    courseId: 'course-1',
    courseName: 'Foundations of College Admissions',
    message: 'completed the course',
    timestamp: '2025-11-08T09:15:00',
  },
  {
    id: '2',
    type: 'progress',
    studentId: '1',
    studentName: 'Sarah Johnson',
    courseId: 'course-1',
    courseName: 'Foundations of College Admissions',
    message: 'reached 85% progress',
    timestamp: '2025-11-08T10:30:00',
  },
  {
    id: '3',
    type: 'enrollment',
    studentId: '5',
    studentName: 'Jessica Martinez',
    courseId: 'course-1',
    courseName: 'Foundations of College Admissions',
    message: 'enrolled in the course',
    timestamp: '2025-11-01T10:00:00',
  },
  {
    id: '4',
    type: 'progress',
    studentId: '6',
    studentName: 'James Wilson',
    courseId: 'course-2',
    courseName: 'Essay Writing Mastery',
    message: 'reached 67% progress',
    timestamp: '2025-11-08T11:00:00',
  },
  {
    id: '5',
    type: 'completion',
    studentId: '4',
    studentName: 'David Kim',
    courseId: 'course-2',
    courseName: 'Essay Writing Mastery',
    message: 'completed the course',
    timestamp: '2025-09-30T16:45:00',
  },
];

// Mock Organization Data
export const mockOrganization = {
  id: 'org-1',
  name: 'Westminster School',
  email: 'contact@eliteeducation.com',
  phone: '+1 (555) 000-0000',
  address: '123 Education Street, New York, NY 10001',
  logo: null,
  subscriptionPlan: 'Professional',
  totalStudents: mockStudents.length,
  activeStudents: mockStudents.filter(s => s.status === 'active').length,
  completedStudents: mockStudents.filter(s => s.status === 'completed').length,
};

// Helper functions
export const getStudentById = (id: string): Student | undefined => {
  return mockStudents.find(student => student.id === id);
};

export const getCourseById = (id: string): Course | undefined => {
  return mockCourses.find(course => course.id === id);
};

export const getStudentsByStatus = (status: Student['status']): Student[] => {
  return mockStudents.filter(student => student.status === status);
};

export const getRecentActivities = (limit: number = 10): Activity[] => {
  return mockActivities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
};

