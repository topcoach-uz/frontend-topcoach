import React, { useMemo } from 'react';
import { Card, Typography, Row, Col, Tag, Progress, Button, Avatar, Tooltip, List, Empty } from 'antd';
import UnifiedIcon from '../../../../components/common/icons/UnifiedIcon';
import { useNavigate } from 'react-router-dom';
import FontAwesomeIcon from '../../../../components/common/icons/FontAwesomeIcon';
import type {
  PsychometricAssessment,
  RecommendationsResponse,
} from '../../../../app/services/student-hub/psychometricApi';

const { Title, Text, Paragraph } = Typography;

interface UniversityMatch {
  id: string;
  name: string;
  country: string;
  ranking?: string;
  matchScore: number;
  matchReasons: string[];
  programsAvailable: string[];
  campusType: 'large' | 'medium' | 'small';
  environment: 'research-intensive' | 'liberal-arts' | 'technical' | 'comprehensive';
  logo?: string;
  /** Official university website; card click opens this in a new tab */
  website?: string;
}

interface UniversityMatchesProps {
  assessment: PsychometricAssessment;
  recommendations: RecommendationsResponse;
  maxDisplay?: number;
}

// Mock function to generate university matches based on assessment
// In production, this would call a backend API
const generateUniversityMatches = (
  assessment: PsychometricAssessment,
  recommendations: RecommendationsResponse,
): UniversityMatch[] => {
  const recs = Array.isArray(recommendations?.recommendations) ? recommendations.recommendations : [];
  const topMajors = recs.slice(0, 3).map((r) => r?.majorName).filter(Boolean) as string[];
  
  // Determine preferences from Big Five (safe access)
  const bigFive = assessment?.bigFiveScores ?? {};
  const prefersStructured = (bigFive.conscientiousness ?? 0) > 60;
  const prefersCollaborative = (bigFive.extraversion ?? 0) > 60;
  const prefersIntellectual = (bigFive.openness ?? 0) > 70;
  
  // Sample universities that would match based on profile
  const sampleUniversities: UniversityMatch[] = [
    {
      id: '1',
      name: 'Massachusetts Institute of Technology',
      country: 'USA',
      ranking: 'Top 5 Worldwide',
      matchScore: 0,
      matchReasons: [],
      programsAvailable: ['Computer Science', 'Mechanical Engineering', 'Data Science', 'Physics'],
      campusType: 'medium',
      environment: 'research-intensive',
      website: 'https://www.mit.edu',
    },
    {
      id: '2',
      name: 'University of Toronto',
      country: 'Canada',
      ranking: 'Top 20 Worldwide',
      matchScore: 0,
      matchReasons: [],
      programsAvailable: ['Computer Science', 'Business Administration', 'Biology', 'Psychology'],
      campusType: 'large',
      environment: 'research-intensive',
      website: 'https://www.utoronto.ca',
    },
    {
      id: '3',
      name: 'Technical University of Munich',
      country: 'Germany',
      ranking: 'Top 50 Worldwide',
      matchScore: 0,
      matchReasons: [],
      programsAvailable: ['Electrical Engineering', 'Computer Science', 'Mechanical Engineering', 'Architecture'],
      campusType: 'large',
      environment: 'technical',
      website: 'https://www.tum.de',
    },
    {
      id: '4',
      name: 'National University of Singapore',
      country: 'Singapore',
      ranking: 'Top 15 Worldwide',
      matchScore: 0,
      matchReasons: [],
      programsAvailable: ['Business Administration', 'Computer Science', 'Economics', 'Data Science'],
      campusType: 'large',
      environment: 'comprehensive',
      website: 'https://www.nus.edu.sg',
    },
    {
      id: '5',
      name: 'University of British Columbia',
      country: 'Canada',
      ranking: 'Top 40 Worldwide',
      matchScore: 0,
      matchReasons: [],
      programsAvailable: ['Psychology', 'Biology', 'Business Administration', 'International Relations'],
      campusType: 'large',
      environment: 'research-intensive',
      website: 'https://www.ubc.ca',
    },
    {
      id: '6',
      name: 'Seoul National University',
      country: 'South Korea',
      ranking: 'Top 30 Worldwide',
      matchScore: 0,
      matchReasons: [],
      programsAvailable: ['Engineering', 'Business Administration', 'Economics', 'Medicine'],
      campusType: 'large',
      environment: 'research-intensive',
      website: 'https://en.snu.ac.kr',
    },
    {
      id: '7',
      name: 'KAIST',
      country: 'South Korea',
      ranking: 'Top 50 Worldwide',
      matchScore: 0,
      matchReasons: [],
      programsAvailable: ['Computer Science', 'Electrical Engineering', 'Data Science', 'Biotechnology'],
      campusType: 'medium',
      environment: 'technical',
      website: 'https://www.kaist.ac.kr',
    },
    {
      id: '8',
      name: 'Williams College',
      country: 'USA',
      ranking: 'Top Liberal Arts College',
      matchScore: 0,
      matchReasons: [],
      programsAvailable: ['Economics', 'Psychology', 'English Literature', 'Political Science'],
      campusType: 'small',
      environment: 'liberal-arts',
      website: 'https://www.williams.edu',
    },
  ];

  // Calculate match scores
  return sampleUniversities.map((uni) => {
    let score = 50; // Base score
    const reasons: string[] = [];

    // Check program availability
    const matchingPrograms = uni.programsAvailable.filter((p) =>
      topMajors.some((m) => p.toLowerCase().includes(m.toLowerCase().split(' ')[0])),
    );
    
    if (matchingPrograms.length > 0) {
      score += 20;
      reasons.push(`Offers ${matchingPrograms[0]}`);
    }

    // Environment match based on personality
    if (prefersStructured && (uni.environment === 'technical' || uni.environment === 'research-intensive')) {
      score += 10;
      reasons.push('Structured academic environment');
    }

    if (prefersIntellectual && uni.environment === 'research-intensive') {
      score += 10;
      reasons.push('Strong research focus');
    }

    if (!prefersCollaborative && uni.campusType === 'small') {
      score += 5;
      reasons.push('Smaller, focused community');
    }

    if (prefersCollaborative && uni.campusType === 'large') {
      score += 5;
      reasons.push('Diverse, large community');
    }

    // Adjust for academic confidence
    if (assessment.academicConfidenceScore && assessment.academicConfidenceScore > 0.7) {
      if (uni.ranking?.includes('Top 20') || uni.ranking?.includes('Top 5') || uni.ranking?.includes('Top 15')) {
        score += 10;
        reasons.push('Matches your academic strength');
      }
    }

    // Cap score at 95
    score = Math.min(95, score);

    return {
      ...uni,
      matchScore: score,
      matchReasons: reasons.length > 0 ? reasons : ['General fit based on your profile'],
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
};

// Environment icons
const ENVIRONMENT_ICONS: Record<string, { icon: string; label: string }> = {
  'research-intensive': { icon: 'flask', label: 'Research-Intensive' },
  'liberal-arts': { icon: 'book', label: 'Liberal Arts' },
  'technical': { icon: 'cogs', label: 'Technical' },
  'comprehensive': { icon: 'university', label: 'Comprehensive' },
};

// Country flags (emoji)
const COUNTRY_FLAGS: Record<string, string> = {
  USA: '🇺🇸',
  Canada: '🇨🇦',
  Germany: '🇩🇪',
  Singapore: '🇸🇬',
  'South Korea': '🇰🇷',
  UK: '🇬🇧',
  Australia: '🇦🇺',
  Japan: '🇯🇵',
};

export const UniversityMatches: React.FC<UniversityMatchesProps> = ({
  assessment,
  recommendations,
  maxDisplay = 6,
}) => {
  const navigate = useNavigate();

  const universityMatches = useMemo(() => {
    return generateUniversityMatches(assessment, recommendations).slice(0, maxDisplay);
  }, [assessment, recommendations, maxDisplay]);

  if (universityMatches.length === 0) {
    return (
      <Card>
        <Empty description="No university matches found. Complete your profile for better recommendations." />
      </Card>
    );
  }

  return (
    <Card className="university-matches-card">
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <UnifiedIcon name="university" size="md" color="primary" />
          University Matches
        </Title>
        <Text type="secondary">
          Based on your interests, personality, and academic profile
        </Text>
      </div>

      <List
        grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
        dataSource={universityMatches}
        renderItem={(uni) => (
          <List.Item>
            <Tooltip title={uni.website ? 'Click to visit official website' : undefined}>
              <Card
                size="small"
                style={{ height: '100%', cursor: uni.website ? 'pointer' : undefined }}
                hoverable={!!uni.website}
                onClick={() => {
                  if (uni.website) {
                    window.open(uni.website, '_blank', 'noopener,noreferrer');
                  }
                }}
              >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <Avatar
                  size={48}
                  style={{
                    background: 'linear-gradient(135deg, #8b0000 0%, #dc143c 100%)',
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  {uni.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                </Avatar>
                <div style={{ flex: 1 }}>
                  <Text strong style={{ display: 'block', fontSize: 14 }}>
                    {uni.name}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {COUNTRY_FLAGS[uni.country] || '🌍'} {uni.country} • {uni.ranking}
                  </Text>
                </div>
              </div>

              {/* Match Score */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Match Score</Text>
                  <Text strong style={{ color: uni.matchScore >= 75 ? '#10b981' : '#f59e0b' }}>
                    {uni.matchScore}%
                  </Text>
                </div>
                <Progress
                  percent={uni.matchScore}
                  strokeColor={uni.matchScore >= 75 ? '#10b981' : '#f59e0b'}
                  showInfo={false}
                  size="small"
                />
              </div>

              {/* Environment */}
              <div style={{ marginBottom: 12 }}>
                <Tooltip title={ENVIRONMENT_ICONS[uni.environment]?.label}>
                  <Tag color="blue" style={{ fontSize: 11 }}>
                    <FontAwesomeIcon
                      icon={ENVIRONMENT_ICONS[uni.environment]?.icon as any}
                      style={{ marginRight: 4 }}
                    />
                    {ENVIRONMENT_ICONS[uni.environment]?.label}
                  </Tag>
                </Tooltip>
                <Tag style={{ fontSize: 11 }}>
                  {uni.campusType.charAt(0).toUpperCase() + uni.campusType.slice(1)} Campus
                </Tag>
              </div>

              {/* Match Reasons */}
              <div>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                  Why it matches:
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {uni.matchReasons.slice(0, 2).map((reason, i) => (
                    <Tag key={i} color="green" style={{ fontSize: 10, margin: 0 }}>
                      ✓ {reason}
                    </Tag>
                  ))}
                </div>
              </div>

              {/* Programs */}
              <div style={{ marginTop: 12 }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                  Related programs:
                </Text>
                <Text style={{ fontSize: 11 }}>
                  {uni.programsAvailable.slice(0, 3).join(', ')}
                  {uni.programsAvailable.length > 3 && ` +${uni.programsAvailable.length - 3} more`}
                </Text>
              </div>
              </Card>
            </Tooltip>
          </List.Item>
        )}
      />

      {/* Call to Action */}
      <div
        style={{
          marginTop: 24,
          padding: 16,
          background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
          borderRadius: 8,
          textAlign: 'center',
        }}
      >
        <Text>
          Want more detailed university recommendations?
        </Text>
        <br />
        <Button
          type="primary"
          style={{ marginTop: 8 }}
          onClick={() => navigate('/universities')}
        >
          Explore All Top 100 Universities
        </Button>
      </div>
    </Card>
  );
};

export default UniversityMatches;

