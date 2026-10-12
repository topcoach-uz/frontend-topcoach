import { Link } from 'react-router-dom';
import { ApplicantPage } from '../applicant/ApplicantPage';
const weeks = ['Introduction to Research', 'Formulating a Research Question', 'Methodology & Literature', 'Citations & Proposal', 'Advisors & Outreach', 'Data Visualization', 'Deep Analysis & Results', 'Finalizing & Publishing'];
export default function ResearchIntroPreview() {
  return <ApplicantPage title="Research Prep" subtitle="Explore the eight-week path and start with the introduction.">
    <section className="applicant-panel"><h2>Introduction to research</h2><p>Research starts with a focused question, not a predetermined answer. Choose a topic you care about, read reliable work already published on it, and identify a small question you could investigate with the time and resources available.</p><h3>Try this first</h3><ol><li>Write one question about your topic.</li><li>Find two credible sources and note what they agree or disagree on.</li><li>Explain what evidence you would need to answer your question.</li></ol><p>This introductory activity is available to everyone. It does not submit a quiz or record course progress.</p></section>
    <section className="applicant-panel"><h2>Course outline</h2><ol>{weeks.map((title, index) => <li key={title} style={{ padding: '12px 0' }}>{title} · {index === 0 ? 'Introduction available above' : 'Full access required'}</li>)}</ol></section>
    <section className="applicant-panel"><h2>Continue with guided research</h2><p>Full lessons, quizzes, mentor support and progress tracking require program access.</p><Link to="/student-hub/programs">Explore program access</Link></section>
  </ApplicantPage>;
}
