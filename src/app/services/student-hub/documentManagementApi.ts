import { RtkApi } from '../api';
import {
  StudentDocument,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  PaginatedResponse,
  ApiResponse,
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
        params: { page, limit, documentType, status, _t: Date.now() }, // Cache busting
      }),
      providesTags: ['StudentDocuments'],
    }),

    // Get document by ID
    getDocument: builder.query<ApiResponse<StudentDocument>, string>({
      query: (id) => ({
        url: `/document-management/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'StudentDocuments', id }],
    }),

    // Upload document
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
      { id: string; data: UpdateDocumentRequest }
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
        params: { _t: Date.now() }, // Cache busting
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
        responseType: 'blob',
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
  useGetDocumentsQuery,
  useGetDocumentQuery,
  useUploadDocumentMutation,
  useUpdateDocumentMutation,
  useDeleteDocumentMutation,
  useVerifyDocumentMutation,
  useGetDocumentStatsQuery,
  useGetDocumentAnalyticsQuery,
  useDownloadDocumentMutation,
  useSearchDocumentsQuery,
} = documentManagementApi;