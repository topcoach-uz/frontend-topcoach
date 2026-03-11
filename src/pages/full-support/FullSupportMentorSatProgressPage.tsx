import React, { useState } from 'react';
import { Card, Button, Select, Spin, Empty } from 'antd';
import { ArrowLeftOutlined, RocketOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useColors from 'src/hooks/useColors';
import { useGetMentorRosterQuery, useGetScholarhubLessonProgressQuery } from 'src/app/services/fullSupportApi';
import type { MentorRosterStudent } from 'src/app/services/fullSupportApi';
import { SatProgressTable } from 'src/utils/scholarhubProgressTable';

const DEFAULT_COURSE_ID = '25';

export default function FullSupportMentorSatProgressPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const colors = useColors();
  const primary = colors?.colorPrimary ?? '#8b0000';
  const { data: rosterData } = useGetMentorRosterQuery();
  const roster: MentorRosterStudent[] = rosterData?.data ?? [];
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(roster[0]?.id ?? null);
  const { data: lessonData, isLoading: lessonLoading } = useGetScholarhubLessonProgressQuery(
    { studentUserId: selectedStudentId ?? '', courseId: DEFAULT_COURSE_ID },
    { skip: !selectedStudentId },
  );
  const lessonPayload = lessonData?.data;

  return (
    <div className="full-support-page full-support-mentor" style={{ padding: 24 }}>
      <Card className="full-support-card" style={{ marginBottom: 24 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/full-support/mentor')} style={{ marginBottom: 16 }}>
          {t('fullSupport.backToMentorDashboard', 'Back to Mentor Dashboard')}
        </Button>
        <h1 style={{ color: primary, marginBottom: 8 }}>
          <RocketOutlined style={{ marginRight: 8 }} />
          {t('fullSupport.satProgressTitle', 'SAT Progress')}
        </h1>
        <p style={{ color: '#666', marginBottom: 0 }}>
          {t('fullSupport.satProgressSubtitle', "View your mentees' ScholarHub SAT prep progress. Select a student to see their lesson progress.")}
        </p>
      </Card>

      <Card title={t('fullSupport.selectMentee', 'Select mentee')} className="full-support-card" style={{ marginBottom: 24 }}>
        <Select
          placeholder={t('fullSupport.chooseStudent', 'Choose a student')}
          value={selectedStudentId}
          onChange={(v) => setSelectedStudentId(v)}
          style={{ minWidth: 260 }}
          options={roster.map((s) => ({ label: s.name, value: s.id }))}
        />
      </Card>

      {selectedStudentId && (
        <Card title={t('fullSupport.satLessonProgress', 'SAT lesson progress')} className="full-support-card">
          {lessonLoading ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <Spin size="large" />
            </div>
          ) : lessonPayload && typeof lessonPayload === 'object' && Object.keys(lessonPayload as object).length > 0 ? (
            <SatProgressTable payload={lessonPayload} emptyText={t('fullSupport.satNoLessonData', 'No SAT progress data for this student yet.')} />
          ) : (
            <Empty description={t('fullSupport.satNoLessonData', 'No SAT progress data for this student yet, or they have not started the course.')} />
          )}
        </Card>
      )}

      {roster.length === 0 && (
        <Card className="full-support-card">
          <Empty description={t('fullSupport.satNoMentees', "You have no assigned students. SAT progress will appear here once you have mentees.")} />
        </Card>
      )}
    </div>
  );
}
