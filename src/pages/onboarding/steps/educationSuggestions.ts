export interface EducationOption {
  value: string;
  label?: string;
  country?: string;
}

// Broad subject names complement the catalog's more specialized program titles.
export const COMMON_FIELDS = [
  'Accounting', 'Agriculture', 'Anthropology', 'Architecture', 'Art and Design',
  'Artificial Intelligence', 'Biochemistry', 'Biology', 'Biomedical Engineering',
  'Biotechnology', 'Business Administration', 'Chemical Engineering', 'Chemistry',
  'Civil Engineering', 'Communication', 'Computer Engineering', 'Computer Science',
  'Cybersecurity', 'Data Science', 'Dentistry', 'Economics', 'Education',
  'Electrical Engineering', 'Energy Engineering', 'English Language and Literature',
  'Environmental Science', 'Finance', 'Food Science', 'Geography', 'Geology',
  'Graphic Design', 'History', 'Hospitality and Tourism', 'Human Resources',
  'Industrial Engineering', 'Information Systems', 'Information Technology',
  'International Business', 'International Relations', 'Journalism', 'Law',
  'Linguistics', 'Logistics and Supply Chain Management', 'Management', 'Marketing',
  'Mathematics', 'Mechanical Engineering', 'Medicine', 'Music', 'Nursing',
  'Pharmacy', 'Philosophy', 'Physics', 'Political Science', 'Psychology',
  'Public Administration', 'Public Health', 'Robotics', 'Social Work', 'Sociology',
  'Software Engineering', 'Sports Science', 'Statistics', 'Telecommunications',
  'Translation and Interpretation', 'Urban Planning', 'Veterinary Medicine',
];

export const normalizeEducationSearch = (value: string) => value.normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

export function mergeEducationOptions(options: EducationOption[]): EducationOption[] {
  const unique = new Map<string, EducationOption>();
  for (const option of options) {
    const key = normalizeEducationSearch(option.value);
    if (key && !unique.has(key)) unique.set(key, option);
  }
  return [...unique.values()];
}

export function matchesEducationSearch(input: string, option?: EducationOption): boolean {
  if (!option) return false;
  const query = normalizeEducationSearch(input);
  const text = normalizeEducationSearch(`${option.value} ${option.country || ''}`);
  const acronym = normalizeEducationSearch(option.value).split(' ')
    .filter(word => !['of', 'the', 'and', 'for', 'in'].includes(word))
    .map(word => word[0]).join('');
  return query.split(' ').every(word => text.includes(word)) || (query.length > 1 && acronym === query);
}
