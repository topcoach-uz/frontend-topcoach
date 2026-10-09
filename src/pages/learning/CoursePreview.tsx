import { useState } from 'react';
import { Alert, Button, Spin } from 'antd';
import { Link } from 'react-router-dom';
import { useGetCoursePreviewQuery } from 'src/app/services/courses';
import type { CoursePreviewLesson } from 'src/app/services/courses';
import { ApplicantPage } from 'src/pages/student-hub/applicant/ApplicantPage';
import { useTranslation } from 'react-i18next';
import { ADMISSIONS_YOUTUBE_PREVIEW_SPECS } from 'src/constants/admissionsPreviewVideos';

function youtubeEmbed(url: string) {
  try {
    const parsed = new URL(url);
    const id = parsed.hostname === 'youtu.be' ? parsed.pathname.slice(1) : /(^|\.)youtube\.com$/.test(parsed.hostname) ? parsed.searchParams.get('v') || parsed.pathname.split('/embed/')[1] : null;
    return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch { return null; }
}

export default function CoursePreview({ course = 'admissions' }: { course?: 'admissions' | 'sat' }) {
  const { t } = useTranslation();
  const publicIntroduction = (spec: (typeof ADMISSIONS_YOUTUBE_PREVIEW_SPECS)[number]): CoursePreviewLesson => {
    const [minutes, seconds] = spec.duration.split(':').map(Number);
    return { id: `public-${spec.id}`, title: t(spec.titleKey), duration: minutes + seconds / 60, isLocked: false, contentUrl: `https://youtu.be/${spec.youtubeId}` };
  };
  const query = useGetCoursePreviewQuery(course);
  const [selected, setSelected] = useState<CoursePreviewLesson>();
  const embed = selected?.contentUrl ? youtubeEmbed(selected.contentUrl) : null;
  const lesson = (item: CoursePreviewLesson) => <li key={item.id} style={{ padding: '12px 0' }}><span>{item.title}{item.duration ? ` · ${item.duration} min` : ''}</span>{item.isLocked ? <span style={{ marginLeft: 16 }}>Full access required</span> : <Button style={{ marginLeft: 16 }} onClick={() => setSelected(item)}>Play introduction</Button>}</li>;
  return <ApplicantPage title={course === 'sat' ? 'SAT learning preview' : 'Admissions learning preview'} subtitle="Explore the course and try introductory content. Full lessons and exercises require access.">
    {course === 'admissions' && <section className="applicant-panel"><h2>Free introductory videos</h2><p>These are the public previews from the Admissions program.</p><ul>{ADMISSIONS_YOUTUBE_PREVIEW_SPECS.map(spec => <li key={spec.id} style={{ padding: '12px 0' }}>{t(spec.titleKey)} · {spec.duration}<Button style={{ marginLeft: 16 }} onClick={() => setSelected(publicIntroduction(spec))}>Play introduction</Button></li>)}</ul></section>}
    {course === 'sat' && <section className="applicant-panel"><h2>Free SAT introduction</h2><p>The public course preview from the SAT program page.</p><Button onClick={() => setSelected({ id: 'public-sat', title: 'SAT Prep Course Preview', duration: 4.15, isLocked: false, contentUrl: 'https://youtu.be/svyiTsu2vPQ' })}>Play SAT introduction</Button></section>}
    {query.isLoading && <Spin />}
    {query.isError && <Alert type="warning" message="Could not load the course outline" action={<Button onClick={() => query.refetch()}>Retry</Button>} />}
    {selected?.contentUrl && <div className="applicant-panel"><h2>{selected.title}</h2>{embed ? <iframe title={selected.title} src={embed} allowFullScreen style={{ width: '100%', aspectRatio: '16 / 9', border: 0 }} /> : <video title={selected.title} src={selected.contentUrl} controls style={{ width: '100%' }} />}</div>}
    {query.data?.map(module => <section className="applicant-panel" key={module.id}><h2>{module.title}</h2><p>{module.description}</p><ul>{module.lessons.map(lesson)}</ul>{module.submodules.map(submodule => <div key={submodule.id}><h3>{submodule.title}</h3><ul>{submodule.lessons.map(lesson)}</ul></div>)}</section>)}
    {!query.isLoading && !query.isError && !query.data?.length && <div className="applicant-panel"><p>The course outline is being prepared. No lessons have been published yet.</p></div>}
    <div className="applicant-panel"><h2>Continue with full access</h2><p>Browsing does not enroll you or grant access to paid content.</p><Link to={course === 'sat' ? '/programs/sat' : '/student-hub/programs'}>Explore program access</Link></div>
  </ApplicantPage>;
}
