import { useEffect, useRef, useState } from 'react';
import { api } from 'src/app/api';
import {
  AIUnivDataDTO,
  ContinentsEnum,
  MajorTypeEnum,
  ScholarshipsTypesEnum,
  TranslationDto,
  UniversitiesItemDto,
  UniversitySectorEnum,
} from 'src/app/api/Api';
import { useTypedSelector } from 'src/app/store';
import useParamsHook from 'src/hooks/params';
import useApi from 'src/hooks/useApi';
import { getTranslation } from 'src/lib/i18n/translationUtils';

export interface IUniversity {
  id?: string;
  name: TranslationDto | string;
  location?: TranslationDto | string;
  major?: string[];
  ranking?: string;
  tuition?: string;
  aiSummary?: string;
  image?: string;
  isLiked?: boolean;
}

export default function useUniversity() {
  const colors = useTypedSelector((state) => state.layout.colors);
  const { handleMakeParams, searchParams } = useParamsHook();
  const [universities, setUniversities] = useState<UniversitiesItemDto[]>([]);
  const [aiUni, setAiUni] = useState<UniversitiesItemDto[]>([]);
  const [aiSearchSummary, setAiSearchSummary] = useState<string>('');

  const universityAbortControllerRef = useRef<AbortController | null>(null);

  // Pagination
  const [page, setPage] = useState(1);

  // const [pageSize, setPageSize] = useState(10);
  const pageSize = 12;
  const aiId = searchParams.get('aiId') || '';

  // AI search API call
  const [searchText, setSearchText] = useState('');
  const [aiSearchLoading, setAiSearchLoading] = useState<boolean>(false);

  const handleAiSearch = async () => {
    if (!searchText) return;

    setAiSearchLoading(true);

    try {
      const response: any = await api.university.getUnisByPrompt({
        query: searchText?.trim(),
      });
      setAiUni(response.data.data);
      setAiSearchSummary(response?.data.summary);
      handleMakeParams('aiId', response?.data.aiId);

      console.log('ai uni', response.data);
    } catch (error) {
      console.error('Error fetching AI search data:', error);
    } finally {
      setAiSearchLoading(false);
    }
  };

  const handleAiSeachClear = () => {
    setAiUni([]);
    setAiSearchSummary('');
    handleMakeParams('aiId', '');
  };

  const handleUniResultById = async () => {
    try {
      const response: any = await api.users.getAiQuery(aiId);
      setAiUni(response?.data.data);
      setAiSearchSummary(response?.data.summary);
    } catch (error) {
      console.error('Error fetching AI search data:', error);
    }
  };

  useEffect(() => {
    if (!aiUni.length && aiId) {
      handleUniResultById();
    }
  }, [searchParams]);

  // Getting universities list
  const { response, isLoading } = useApi(() => {
    if (!aiUni.length && !aiId) {
      if (universityAbortControllerRef.current) {
        universityAbortControllerRef.current.abort();
      }
      universityAbortControllerRef.current = new AbortController();
      const signal = universityAbortControllerRef.current.signal;
      // Fetching universities with pagination and filters
      return api.university.findAll(
        {
          _start: (page - 1) * pageSize,
          _end: page * pageSize,
          continents: searchParams.getAll('continents') as ContinentsEnum[],
          scholarships: searchParams.getAll('scholarships')
            ? [searchParams.get('scholarships') as ScholarshipsTypesEnum]
            : undefined,
          requiredCertificates: searchParams.getAll('requiredCertificates'),
          degrees: searchParams.get('degree')
            ? [String(searchParams.get('degree'))]
            : null,
          majors: searchParams.get('major')
            ? String(searchParams.get('major')).split(',')
            : null,
          name: searchParams.get('name')?.trim() || undefined,
          majorType: searchParams.get('majorType') as MajorTypeEnum,
          sector: searchParams.get('sector')
            ? (searchParams.get('sector')?.toString() as UniversitySectorEnum)
            : undefined,
        },
        { signal }
      );
    }
    return Promise.resolve(null);
  }, [searchParams, page, aiUni.length]);
  // Total count of universities
  const totalCount = response?.data?.total || 0;

  useEffect(() => {
    if (response?.data) {
      setUniversities(response.data.data);
    }
  }, [response]);

  const aiUniCheck = aiUni.length === 0 ? universities : aiUni;
  const formattedLocationData = aiUniCheck.map((university) => ({
    ...university,
    aiSummary: (university as any)['ai-summary'] as string,
    aiData: (university as any)['aiData'] as AIUnivDataDTO,
    name: getTranslation(university.name),
    location: getTranslation(university.location?.address),
    image: '/img/some-university.png',
    // image: university?.media[0]?.url,
    major: university.majors.map((major) => getTranslation(major.name)),
    ranking: university?.rankings[0]?.rank.toString(),
    tuition:
      // @ts-expect-error - Currency symbol type issue
      university.tuitionFees[0]?.currency?.symbol +
      university.tuitionFees[0]?.fee.toString(),
  }));

  return {
    colors,
    universities,
    formattedLocationData,
    isLoading,
    searchText,
    aiSearchSummary,
    aiUni,
    aiSearchLoading,
    page,
    totalCount,
    pageSize,
    handleAiSeachClear,
    setSearchText,
    handleAiSearch,
    setPage,
  };
}
