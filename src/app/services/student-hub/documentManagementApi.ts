import { RtkApi } from '../api';
import {
  StudentDocument,
  CreateStudentDocumentRequest,
  UpdateStudentDocumentRequest,
  PaginatedResponse,
  ApiResponse,
  StudentEssay,
} from './types';

// Document types enum matching backend
export enum DocumentType {
  TRANSCRIPT = 'transcript',
  TEST_SCORE = 'test_score',
  RECOMMENDATION = 'recommendation',
  ESSAY = 'essay',
  RESUME = 'resume',
  PORTFOLIO = 'portfolio',
  CERTIFICATE = 'certificate',
  OTHER = 'other',
}

export interface DocumentVersion {
  id: string;
  version: number;
  fileName: string;
  mimeType?: string;
  fileSize?: number;
  changeSummary?: string | null;
  createdAt: string;
  isCurrent: boolean;
}

export interface DocumentReview {
  status: 'private' | 'pending' | 'in_progress' | 'approved' | 'needs_revision';
  reviewer: { id: string; name?: string } | null;
  reviewerAccess?: boolean;
  feedback: Array<{ id: string; content: string; annotationType?: string; createdAt: string; isResolved?: boolean }>;
}

const asData = <T>(response: T | ApiResponse<T>): ApiResponse<T> =>
  response && typeof response === 'object' && 'data' in response
    ? response as ApiResponse<T>
    : { data: response as T, success: true };

// Document categories for UI organization
export const DOCUMENT_CATEGORIES = {
  [DocumentType.TRANSCRIPT]: {
    label: 'Official Transcripts',
    description: 'Academic transcripts from your school',
    icon: 'graduation-cap',
    color: 'blue',
    required: true,
  },
  [DocumentType.TEST_SCORE]: {
    label: 'Test Scores',
    description: 'SAT, ACT, TOEFL, IELTS score reports',
    icon: 'chart-bar',
    color: 'green',
    required: true,
  },
  [DocumentType.RECOMMENDATION]: {
    label: 'Letters of Recommendation',
    description: 'Recommendation letters from teachers and counselors',
    icon: 'users',
    color: 'purple',
    required: true,
  },
  [DocumentType.CERTIFICATE]: {
    label: 'Awards & Certificates',
    description: 'Academic awards, honors, and certificates',
    icon: 'trophy',
    color: 'gold',
    required: false,
  },
  [DocumentType.RESUME]: {
    label: 'Resume/CV',
    description: 'Your academic and professional resume',
    icon: 'id-card',
    color: 'orange',
    required: false,
  },
  [DocumentType.PORTFOLIO]: {
    label: 'Portfolio',
    description: 'Creative work, projects, and achievements',
    icon: 'briefcase',
    color: 'cyan',
    required: false,
  },
  [DocumentType.OTHER]: {
    label: 'Other Documents',
    description: 'Financial aid, medical records, and other documents',
    icon: 'folder',
    color: 'gray',
    required: false,
  },
};

export const documentManagementApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getSharedDocuments: builder.query<{ data: Array<StudentDocument & { studentName?: string; reviewStatus?: string }> }, void>({
      query: () => '/document-management/shared-with-me',
      providesTags: ['StudentDocuments'],
    }),
    submitMentorDocumentReview: builder.mutation<ApiResponse<DocumentReview>, { id: string; status: 'in_progress' | 'approved' | 'needs_revision'; feedback: string }>({
      query: ({ id, ...body }) => ({ url: `/document-management/${id}/review`, method: 'POST', body }),
      invalidatesTags: ['StudentDocuments'],
    }),
    // ========================================
    // 📄 DOCUMENT MANAGEMENT
    // ========================================

    // Get documents
    getDocuments: builder.query<
      PaginatedResponse<StudentDocument>,
      { page?: number; limit?: number; documentType?: DocumentType; status?: string }
    >({
      query: ({ page = 1, limit = 10, documentType, status }) => ({
        url: '/document-management',
        method: 'GET',
        params: { page, limit, documentType, status },
      }),
      providesTags: ['StudentDocuments'],
      keepUnusedDataFor: 300,
    }),

    // Get document by ID
    getDocument: builder.query<ApiResponse<StudentDocument>, string>({
      query: (id) => ({
        url: `/document-management/${id}`,
        method: 'GET',
      }),
      transformResponse: asData<StudentDocument>,
      providesTags: (result, error, id) => [{ type: 'StudentDocuments', id }],
    }),

    getDocumentVersions: builder.query<ApiResponse<DocumentVersion[]>, string>({
      query: (id) => ({ url: `/document-management/${id}/versions`, method: 'GET' }),
      transformResponse: asData<DocumentVersion[]>,
      providesTags: (result, error, id) => [{ type: 'StudentDocuments', id }],
    }),

    uploadDocumentVersion: builder.mutation<ApiResponse<{ document: StudentDocument; version: DocumentVersion }>, { id: string; body: FormData }>({
      query: ({ id, body }) => ({ url: `/document-management/${id}/versions`, method: 'POST', body }),
      transformResponse: asData<{ document: StudentDocument; version: DocumentVersion }>,
      invalidatesTags: (result, error, { id }) => ['StudentDocuments', { type: 'StudentDocuments', id }],
    }),

    updateDocumentAccess: builder.mutation<ApiResponse<{ reviewerAccess: boolean; reviewer: DocumentReview['reviewer'] }>, { id: string; reviewerAccess: boolean }>({
      query: ({ id, reviewerAccess }) => ({ url: `/document-management/${id}/access`, method: 'PATCH', body: { reviewerAccess } }),
      transformResponse: asData<{ reviewerAccess: boolean; reviewer: DocumentReview['reviewer'] }>,
      invalidatesTags: (result, error, { id }) => ['StudentDocuments', { type: 'StudentDocuments', id }],
    }),

    getDocumentReview: builder.query<ApiResponse<DocumentReview>, string>({
      query: (id) => ({ url: `/document-management/${id}/review`, method: 'GET' }),
      transformResponse: asData<DocumentReview>,
      providesTags: (result, error, id) => [{ type: 'StudentDocuments', id }],
    }),

    // Upload document
    reviewDocumentWithAi: builder.mutation<ApiResponse<StudentEssay['aiFeedback']>, { id: string; text: string }>({
      query: ({ id, text }) => ({ url: `/document-management/${id}/ai-review`, method: 'POST', body: { text } }),
      transformResponse: asData<StudentEssay['aiFeedback']>,
    }),

    uploadDocument: builder.mutation<
      ApiResponse<StudentDocument>,
      FormData
    >({
      query: (formData) => ({
        url: '/document-management/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['StudentDocuments'],
    }),

    // Update document
    updateDocument: builder.mutation<
      ApiResponse<StudentDocument>,
      { id: string; data: UpdateStudentDocumentRequest }
    >({
      query: ({ id, data }) => ({
        url: `/document-management/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'StudentDocuments', id }],
    }),

    // Delete document
    deleteDocument: builder.mutation<void, string>({
      query: (id) => ({
        url: `/document-management/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['StudentDocuments'],
    }),

    // Verify document
    verifyDocument: builder.mutation<
      ApiResponse<StudentDocument>,
      string
    >({
      query: (id) => ({
        url: `/document-management/${id}/verify`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'StudentDocuments', id }],
    }),

    // Get document statistics
    getDocumentStats: builder.query<ApiResponse<{
      total: number;
      byType: Record<DocumentType, number>;
      verified: number;
      unverified: number;
      totalSize: number;
      recentUploads: any[];
    }>, void>({
      query: () => ({
        url: '/document-management/stats',
        method: 'GET',
      }),
      providesTags: ['StudentDocuments'],
    }),

    // Get document analytics
    getDocumentAnalytics: builder.query<ApiResponse<{
      uploadTrends: Array<{ date: string; count: number }>;
      typeDistribution: Array<{ type: DocumentType; count: number; percentage: number }>;
      statusDistribution: Array<{ status: string; count: number; percentage: number }>;
      averageFileSize: number;
      totalStorageUsed: number;
    }>, void>({
      query: () => ({
        url: '/document-management/analytics',
        method: 'GET',
      }),
      providesTags: ['StudentDocuments'],
    }),

    // Download document
    downloadDocument: builder.mutation<Blob, string>({
      query: (id) => ({
        url: `/document-management/${id}/download`,
        method: 'GET',
        responseHandler: (response) => response.blob(),
      }),
      transformResponse: (response: Blob) => response,
    }),

    downloadDocumentVersion: builder.mutation<Blob, { id: string; versionId: string }>({
      query: ({ id, versionId }) => ({
        url: `/document-management/${id}/versions/${versionId}/download`,
        method: 'GET',
        responseHandler: (response) => response.blob(),
      }),
      transformResponse: (response: Blob) => response,
    }),

    // Search documents
    searchDocuments: builder.query<
      PaginatedResponse<StudentDocument>,
      { query: string; page?: number; limit?: number }
    >({
      query: ({ query, page = 1, limit = 10 }) => ({
        url: '/document-management/search',
        method: 'GET',
        params: { query, page, limit },
      }),
      providesTags: ['StudentDocuments'],
    }),
  }),
});

export const {
  useGetSharedDocumentsQuery,
  useSubmitMentorDocumentReviewMutation,
  useReviewDocumentWithAiMutation,
  useGetDocumentsQuery,
  useGetDocumentQuery,
  useGetDocumentVersionsQuery,
  useUploadDocumentVersionMutation,
  useUpdateDocumentAccessMutation,
  useGetDocumentReviewQuery,
  useUploadDocumentMutation,
  useUpdateDocumentMutation,
  useDeleteDocumentMutation,
  useVerifyDocumentMutation,
  useGetDocumentStatsQuery,
  useGetDocumentAnalyticsQuery,
  useDownloadDocumentMutation,
  useDownloadDocumentVersionMutation,
  useSearchDocumentsQuery,
} = documentManagementApi;
