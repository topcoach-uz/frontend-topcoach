import { useEffect, useState } from 'react';
import { Alert, Button, Input, Select, Spin } from 'antd';
import { ArrowRight, Check, Plus } from 'lucide-react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useGetMyStudentProfileQuery, useUpdateMyStudentProfileMutation } from 'src/app/services/student-hub/studentProfileApi';
import { applicantLinks } from 'src/lib/applicantWorkspace';
import { ApplicantPage, Breadcrumb } from './ApplicantPage';
import { useApplicantOverview } from './ApplicantOverviewContext';
import { applicantDegree } from './applicantOverviewModel';
import {
  countryOptions,
  directionIdeas,
  goalOptions,
  hasDirectionChoices,
  interestOptions,
  readStudyDirectionChoices,
  type StudyDirectionChoices,
} from './studyDirectionModel';
import './applicantStudyDirection.scss';

function ChoiceGroup({
  options,
  selected,
  onChange,
  exclusiveOption,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  exclusiveOption?: string;
}) {
  return <div className="study-direction__chips">
    {options.map((option) => <button
      type="button"
      key={option}
      className={`study-direction__chip${selected.includes(option) ? ' is-selected' : ''}`}
      aria-pressed={selected.includes(option)}
      onClick={() => onChange(selected.includes(option)
        ? selected.filter((item) => item !== option)
        : option === exclusiveOption ? [option] : [...selected.filter((item) => item !== exclusiveOption), option])}
    >{selected.includes(option) && <Check size={13} aria-hidden />}{option}</button>)}
  </div>;
}

export default function ApplicantStudyDirectionPage() {
  const overview = useApplicantOverview();
  const profileQuery = useGetMyStudentProfileQuery();
  const [saveProfile, saveState] = useUpdateMyStudentProfileMutation();
  const [params, setParams] = useSearchParams();
  const [choices, setChoices] = useState<StudyDirectionChoices>(() => readStudyDirectionChoices(null));
  const [customInterest, setCustomInterest] = useState('');
  const [customCountry, setCustomCountry] = useState('');
  const [saveError, setSaveError] = useState(false);
  const editing = params.get('edit') === '1';
  const profile = profileQuery.data;
  const academic = profile?.academicProfile;
  const degree = applicantDegree(academic?.targetDegree ?? overview.currentData?.profile?.targetDegree);
  const saved = readStudyDirectionChoices(profile?.preferences, profile?.personalProfile);
  const hasChoices = hasDirectionChoices(saved);
  const ideas = directionIdeas(saved);

  useEffect(() => {
    if (profile) setChoices(readStudyDirectionChoices(profile.preferences, profile.personalProfile));
  }, [profile]);

  const setEditing = (value: boolean) => {
    const next = new URLSearchParams(params);
    value ? next.set('edit', '1') : next.delete('edit');
    setParams(next);
    setSaveError(false);
  };
  const update = <K extends keyof StudyDirectionChoices>(key: K, value: StudyDirectionChoices[K]) =>
    setChoices((current) => ({ ...current, [key]: value }));
  const save = async () => {
    if (!profile) return;
    setSaveError(false);
    try {
      await saveProfile({ preferences: { ...profile.preferences, studyDirection: choices } }).unwrap();
      setEditing(false);
    } catch {
      setSaveError(true);
    }
  };
  const addInterest = () => {
    const value = customInterest.trim().slice(0, 80);
    if (value && !choices.interests.some((item) => item.toLowerCase() === value.toLowerCase())) {
      update('interests', [...choices.interests, value]);
    }
    setCustomInterest('');
  };
  const addCountry = () => {
    const value = customCountry.trim().slice(0, 80);
    if (value && !choices.countries.some((item) => item.toLowerCase() === value.toLowerCase())) {
      update('countries', [...choices.countries, value]);
    }
    setCustomCountry('');
  };
  if (profileQuery.isError || (!profileQuery.isLoading && !profile)) return <ApplicantPage title="Explore your study direction"><Alert type="error" showIcon message="Your saved choices could not be loaded." action={<Button onClick={() => profileQuery.refetch()}>Try again</Button>} /></ApplicantPage>;
  if (profileQuery.isLoading || overview.isLoading) return <ApplicantPage><div className="applicant-panel"><Spin aria-label="Loading study direction" /></div></ApplicantPage>;
  if (degree === 'bachelor') return <Navigate to={applicantLinks.majorMatch} replace />;

  const profileSummary = [academic?.previousDegree, academic?.previousField, academic?.previousInstitution].filter(Boolean).join(' · ');
  const intakeOptions = ['Not sure yet', ...[0, 1, 2, 3].flatMap((offset) => {
    const year = new Date().getFullYear() + offset;
    return [`Spring ${year}`, `Autumn ${year}`];
  })].filter((value, index, array) => array.indexOf(value) === index).map((value) => ({ value, label: value }));

  return <ApplicantPage title={editing ? 'Edit your study choices' : 'Explore your study direction'} subtitle={editing
    ? 'Update what matters to you. You can change these answers any time.'
    : hasChoices ? 'See what informs your next step, then explore verified programs.' : 'Start with a few choices to see study directions worth exploring.'}>
    <Breadcrumb><span>Explore your direction</span>{editing && <><span> / </span>Edit choices</>}</Breadcrumb>
    {editing ? <>
      <div className="study-direction__intro"><strong>These choices shape suggestions, not eligibility</strong><p>We use your answers to surface directions worth exploring. Check each program’s requirements before applying.</p></div>
      <section className="study-direction__card" aria-labelledby="study-profile-title">
        <span className="study-direction__eyebrow">From your saved profile</span>
        <h2 id="study-profile-title">Your starting point</h2>
        <p>{profileSummary || 'Add your previous degree and field to your academic profile.'}</p>
        <Link to={applicantLinks.profile}>Edit academic profile <ArrowRight size={15} aria-hidden /></Link>
      </section>
      <section className="study-direction__card" aria-labelledby="study-interests-title">
        <h2 id="study-interests-title">Interests and goals</h2>
        <p>Which subjects would you like to explore? Select any that fit.</p>
        <ChoiceGroup options={[...new Set([...interestOptions, ...choices.interests])]} selected={choices.interests} onChange={(next) => update('interests', next)} />
        <div className="study-direction__add"><Input value={customInterest} maxLength={80} placeholder="Another subject" aria-label="Another subject" onChange={(event) => setCustomInterest(event.target.value)} onPressEnter={addInterest} /><Button icon={<Plus size={15} />} onClick={addInterest} disabled={!customInterest.trim()}>Add</Button></div>
        <p>What do you want from a master’s degree?</p>
        <ChoiceGroup options={[...new Set([...goalOptions, ...choices.goals])]} selected={choices.goals} exclusiveOption="Not sure yet" onChange={(next) => update('goals', next)} />
        <small>Optional. Choose “Not sure yet” if you are still exploring.</small>
      </section>
      <section className="study-direction__card" aria-labelledby="study-preferences-title">
        <h2 id="study-preferences-title">Practical choices</h2>
        <p>Preferred destinations</p>
        <ChoiceGroup options={[...new Set([...countryOptions, ...choices.countries])]} selected={choices.countries} onChange={(next) => update('countries', next)} />
        <div className="study-direction__add"><Input value={customCountry} maxLength={80} placeholder="Another country" aria-label="Another country" onChange={(event) => setCustomCountry(event.target.value)} onPressEnter={addCountry} /><Button icon={<Plus size={15} />} onClick={addCountry} disabled={!customCountry.trim()}>Add</Button></div>
        <div className="study-direction__fields"><label>When would you like to start?<Select value={choices.intake || undefined} placeholder="Not sure yet" allowClear options={intakeOptions} onChange={(value) => update('intake', value ?? '')} /></label><label>Funding preference<Select value={choices.funding || undefined} placeholder="Not sure yet" allowClear options={['Scholarship or financial support needed', 'Self-funded', 'Not sure yet'].map((value) => ({ value, label: value }))} onChange={(value) => update('funding', value ?? '')} /></label></div>
      </section>
      {saveError && <Alert type="error" showIcon message="Your choices could not be saved. Please try again." />}
      <div className="study-direction__actions"><Button type="primary" loading={saveState.isLoading} onClick={save}>Save and see directions <ArrowRight size={16} /></Button><Button onClick={() => { setChoices(saved); setEditing(false); }}>Skip for now</Button></div>
      <p className="study-direction__footnote">Browsing the full program catalogue is always available. These choices only help tailor exploration.</p>
    </> : !hasChoices ? <>
      <div className="study-direction__intro study-direction__intro--empty"><span className="study-direction__eyebrow">Your study direction</span><h2>You have not made any choices yet</h2><p>Tell us what interests you and what you hope to gain. We will use those answers to suggest directions to investigate.</p><small>You can edit or skip your answers at any time.</small></div>
      <h2 className="study-direction__section-title">Choose where to begin</h2>
      <div className="study-direction__steps">
        <section className="study-direction__card"><span className="study-direction__eyebrow">01 · Your background</span><h3>Review your starting point</h3><p>Confirm your current degree, subjects and relevant experience.</p><Link to={applicantLinks.profile}>Review profile <ArrowRight size={15} aria-hidden /></Link></section>
        <section className="study-direction__card"><span className="study-direction__eyebrow">02 · Your interests</span><h3>Choose subjects and goals</h3><p>Pick fields you are curious about and what you want from a master’s.</p><button type="button" className="study-direction__text-button" onClick={() => setEditing(true)}>Choose interests <ArrowRight size={15} aria-hidden /></button></section>
        <section className="study-direction__card"><span className="study-direction__eyebrow">03 · Practical choices</span><h3>Set your preferences</h3><p>Add destinations, timing and funding needs when you know them.</p><button type="button" className="study-direction__text-button" onClick={() => setEditing(true)}>Add preferences <ArrowRight size={15} aria-hidden /></button></section>
      </div>
      <div className="study-direction__readiness"><h3>No suggested directions yet</h3><p>Once you add an interest or goal, this space will explain why each direction appears. No admission result is implied.</p></div>
      <div className="study-direction__actions"><Button type="primary" onClick={() => setEditing(true)}>Choose interests <ArrowRight size={16} /></Button><Link className="ant-btn ant-btn-default" to={applicantLinks.universities}>Browse all programs <ArrowRight size={16} /></Link></div>
      <p className="study-direction__footnote">You do not need to finish this step to search the verified program catalogue.</p>
    </> : <>
      <div className="study-direction__intro"><span className="study-direction__eyebrow">Your study direction</span><h2>Build on your experience. Explore a new possibility.</h2><p>These are paths to investigate, not admission decisions or ranked matches.</p></div>
      <h2 className="study-direction__section-title">What informs this direction</h2>
      <div className="study-direction__summary">
        <section className="study-direction__card"><span className="study-direction__eyebrow">01 · Academic profile</span><h3>Your starting point</h3><p>{profileSummary || 'Academic background not added yet'}</p><small>From your saved profile</small></section>
        <section className="study-direction__card"><span className="study-direction__eyebrow">02 · Your answers</span><h3>Interests and goals</h3><p>{[...saved.interests, ...saved.goals].join(' · ') || 'Not chosen yet'}</p><small>From your choices</small></section>
        <section className="study-direction__card"><span className="study-direction__eyebrow">03 · Your preferences</span><h3>Practical choices</h3><p>{[...saved.countries, saved.intake, saved.funding].filter(Boolean).join(' · ') || 'Not chosen yet'}</p><small>You can edit these before program search</small></section>
      </div>
      <h2 className="study-direction__section-title">Possible directions to explore</h2>
      {ideas.length ? <div className="study-direction__ideas">{ideas.map((idea) => <section className="study-direction__card" key={idea.title}><h3>{idea.title}</h3><span className="study-direction__eyebrow">Why this appears</span><p>{idea.because}</p><span className="study-direction__eyebrow">Check before shortlisting</span><p>{idea.check}</p></section>)}</div> : <div className="study-direction__readiness"><h3>Still exploring?</h3><p>Add a subject or a goal when you are ready. You can browse programs now.</p></div>}
      <div className="study-direction__readiness"><h3>Before you shortlist a program</h3><p>Check each program’s verified entry requirements. Your scores and experience are context, not proof of eligibility.</p></div>
      <div className="study-direction__actions"><Link className="ant-btn ant-btn-primary" to={applicantLinks.universities}>Explore verified programs <ArrowRight size={16} /></Link><Button onClick={() => setEditing(true)}>Edit your choices</Button></div>
      <p className="study-direction__footnote">Directions reflect your saved choices. Program facts come from the verified catalogue.</p>
    </>}
  </ApplicantPage>;
}
