import { useEffect, useMemo, useRef, useState } from 'react';
import { AutoComplete, Input, Select } from 'antd';
import CustomButton from 'src/components/common/button';
import Loader from 'src/components/loader';
import { Logo } from 'src/components/logos';
import headerStyles from 'src/components/layouts/components/header/header.module.scss';
import { COUNTRY_NATIONALITY_NAMES } from 'src/pages/events/youth-leaders-application/countryNationalityOptions';
import { COMMON_FIELDS, matchesEducationSearch, mergeEducationOptions, normalizeEducationSearch, type EducationOption } from 'src/pages/onboarding/steps/educationSuggestions';
import { cleanValue, initialValues, nextScreen, readDraft, screenByKey, screens, validateScreen, valueKey, type Degree, type Part, type Values } from './model';
import {
  useCompleteOnboardingMutation, useGetOnboardingQuery, useLazyGetOnboardingQuery,
  useSubmitMentorOnboardingMutation, useUpdateMentorAcademicMutation,
  useUpdateMentorExpertiseMutation, useUpdateMentorOfferMutation,
  useUpdateMentorProfileMutation, useUpdateMentorStoryMutation,
  useUpdateOnboardingPathMutation, useUpdateOnboardingProgressMutation,
  useUpdateReferralMutation, useUpdateStudentBasicsMutation,
  useUpdateStudentDirectionMutation, useUpdateStudentEducationMutation,
  useUpdateStudentSupportMutation,
} from 'src/app/services/onboardingApi';
import { useUnlinkTelegramMutation, useVerifyTelegramCodeMutation } from 'src/app/services/users';
import { ACCESS_TOKEN } from 'src/constants/storage';
import { baseUrl } from 'src/app/services/api/const';
import { buildStepMutation, hydrateProductionState, mutationEnvelope, nextAfterSkip } from 'src/pages/onboarding/productionContract';
import './preview.scss';

const LANGUAGES = ['English', 'O‘zbek', 'Русский', 'Qoraqalpoq'];
const SUBJECTS = [...new Set([...COMMON_FIELDS, 'Data Analytics', 'Data Engineering'])].map(value => ({ value }));
const FALLBACK_UNIVERSITIES: EducationOption[] = [
  { value: 'Inha University in Tashkent', country: 'Uzbekistan' },
  { value: 'National University of Uzbekistan', country: 'Uzbekistan' },
  { value: 'New Uzbekistan University', country: 'Uzbekistan' },
  { value: 'University of Manchester', country: 'United Kingdom' },
];
const currentKey = () => {
  const key = new URLSearchParams(window.location.search).get('screen') || 'goal';
  return screenByKey[key] ? key : 'goal';
};
const asOptions = (values: readonly string[]) => values.map(value => ({ value, label: value }));
const fieldId = (key: string) => 'onboarding-' + key.replace(/[^a-z0-9]/gi, '-');
const initialDegree = (): Degree => currentKey().startsWith('mentor-') ? 'mentor' : currentKey().startsWith('m-') ? 'master' : readDraft()?.degree || 'bachelor';

function PreviewButton({ children, primary = false, selected = false, ...props }: React.ComponentProps<typeof CustomButton> & { primary?: boolean; selected?: boolean }) {
  return <CustomButton {...props} darkMode={false} height={52} className={`preview-button ${primary ? 'primary' : ''} ${selected ? 'selected' : ''} ${props.className || ''}`}>{children}</CustomButton>;
}

export interface OnboardingFlowProps {
  mode?: 'preview' | 'production';
}

export default function OnboardingPreview({ mode = 'preview' }: OnboardingFlowProps) {
  const production = mode === 'production';
  const { data: serverState, isLoading: stateLoading, isError: stateError, refetch } = useGetOnboardingQuery(undefined, { skip: !production });
  const [reloadState] = useLazyGetOnboardingQuery();
  const [updatePath] = useUpdateOnboardingPathMutation();
  const [updateBasics] = useUpdateStudentBasicsMutation();
  const [updateEducation] = useUpdateStudentEducationMutation();
  const [updateDirection] = useUpdateStudentDirectionMutation();
  const [updateSupport] = useUpdateStudentSupportMutation();
  const [updateReferral] = useUpdateReferralMutation();
  const [updateMentorProfile] = useUpdateMentorProfileMutation();
  const [updateMentorAcademic] = useUpdateMentorAcademicMutation();
  const [updateMentorStory] = useUpdateMentorStoryMutation();
  const [updateMentorOffer] = useUpdateMentorOfferMutation();
  const [updateMentorExpertise] = useUpdateMentorExpertiseMutation();
  const [updateProgress] = useUpdateOnboardingProgressMutation();
  const [completeOnboarding] = useCompleteOnboardingMutation();
  const [submitMentor] = useSubmitMentorOnboardingMutation();
  const [verifyTelegramCode] = useVerifyTelegramCodeMutation();
  const [unlinkTelegram] = useUnlinkTelegramMutation();
  const [key, setKey] = useState(currentKey);
  const [degree, setDegree] = useState<Degree>(initialDegree);
  const [values, setValues] = useState<Values>(() => ({ ...initialValues(), ...readDraft()?.values }));
  const [errors, setErrors] = useState<Values>({});
  const [touched, setTouched] = useState<Values>({});
  const [choices, setChoices] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [telegram, setTelegram] = useState(false);
  const [photo, setPhoto] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [universityList, setUniversityList] = useState(FALLBACK_UNIVERSITIES);
  const [directoryStatus, setDirectoryStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchReturn, setSearchReturn] = useState('m-education');
  const [searchTarget, setSearchTarget] = useState(() => currentKey() === 'state-field' ? 'Field of study' : 'University');
  const [editReturn, setEditReturn] = useState('');
  const [modal, setModal] = useState<{ title: string; text: string; disconnect?: boolean } | null>(null);
  const [revision, setRevision] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [conflict, setConflict] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const screen = screenByKey[key];
  const isMentor = key.startsWith('mentor-');
  const prefix = degree === 'bachelor' ? 'b' : 'm';
  const heading = useRef<HTMLHeadingElement>(null);
  const browserDialog = useRef<HTMLDialogElement>(null);
  const infoDialog = useRef<HTMLDialogElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const pendingMutation = useRef<{ signature: string; envelope: ReturnType<typeof mutationEnvelope> } | null>(null);
  const sourceKey = isMentor ? 'mentor-background' : key.endsWith('referral') ? 'referral' : key;
  const groups = [...new Set(screens.map(item => item.group))];

  useEffect(() => {
    if (!production || !serverState || hydrated) return;
    const restored = hydrateProductionState(serverState);
    setDegree(restored.degree); setValues(previous => ({ ...previous, ...restored.values }));
    setChoices(restored.choices); setPhoto(restored.photo); setTelegram(restored.telegram);
    setRevision(serverState.revision || 0);
    const target = screenByKey[restored.screen] ? restored.screen : 'goal';
    setKey(target); setHydrated(true);
    const url = new URL(window.location.href); url.searchParams.set('screen', target); window.history.replaceState({}, '', url);
  }, [production, serverState, hydrated]);

  useEffect(() => {
    const onPop = () => {
      const target = currentKey();
      clearTimeout(timer.current); setBusy(false); setKey(target); setErrors({}); setTouched({});
      if (target.startsWith('mentor-')) setDegree('mentor');
      else if (target.startsWith('m-')) setDegree('master');
      else if (target.startsWith('b-')) setDegree('bachelor');
    };
    window.addEventListener('popstate', onPop);
    return () => { window.removeEventListener('popstate', onPop); clearTimeout(timer.current); };
  }, []);
  useEffect(() => {
    document.title = `TopCoach · ${screen.title}${production ? '' : ' · Design preview'}`;
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [screen, production]);
  useEffect(() => {
    if (modal && !infoDialog.current?.open) infoDialog.current?.showModal();
  }, [modal]);
  useEffect(() => {
    if (!cooldown) return;
    const id = setInterval(() => setCooldown(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/world-universities.json', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Directory unavailable');
      const data: { name: string; country: string }[] = await response.json();
      setUniversityList(mergeEducationOptions([...FALLBACK_UNIVERSITIES, ...data.map(item => ({ value: item.name, country: item.country }))]));
    }).catch(error => {
      if (error.name !== 'AbortError') setDirectoryStatus('Showing a short list while the directory is unavailable. You can always enter your own university.');
    });
    return () => controller.abort();
  }, []);

  const residence = values['Country of residence'];
  const universities = useMemo(() => [...universityList].sort((a, b) =>
    Number(b.country === residence) - Number(a.country === residence) || a.value.localeCompare(b.value)), [universityList, residence]);

  function go(target: string) {
    if (!screenByKey[target]) return;
    clearTimeout(timer.current); setBusy(false); setErrors({}); setTouched({}); setNotice('');
    if (target.startsWith('mentor-')) setDegree('mentor');
    else if (target.startsWith('m-')) setDegree('master');
    else if (target.startsWith('b-')) setDegree('bachelor');
    else if (target === 'goal' && degree === 'mentor') setDegree('bachelor');
    const url = new URL(window.location.href); url.searchParams.set('screen', target);
    window.history.pushState({}, '', url); setKey(target);
    browserDialog.current?.close();
  }
  function update(label: string, value: string) {
    const name = valueKey(label, key);
    setValues(previous => ({ ...previous, [name]: value }));
    setTouched(previous => ({ ...previous, [name]: 'true' }));
    setErrors(previous => { const next = { ...previous }; delete next[name]; return next; });
  }
  function retryableEnvelope(signature: string, action: 'save' | 'continue' | 'skip') {
    if (pendingMutation.current?.signature === signature) return pendingMutation.current.envelope;
    const envelope = mutationEnvelope(revision, action);
    pendingMutation.current = { signature, envelope };
    return envelope;
  }
  function finishMutation(requestId: string) {
    if (pendingMutation.current?.envelope.requestId === requestId) pendingMutation.current = null;
  }
  async function persistCurrent(action: 'save' | 'continue' | 'skip') {
    const manual = key === 'state-manual';
    const target = manual || key === 'state-university' || key === 'state-field' ? searchReturn : key;
    const savedValues = manual ? manualEducationValues() : values;
    const mutation = buildStepMutation(target, degree, savedValues, choices, action);
    if (!mutation) return null;
    const signature = JSON.stringify({ revision, key, action, mutation });
    const envelope = retryableEnvelope(signature, action);
    let result;
    switch (mutation.endpoint) {
      case 'path': result = await updatePath({ ...envelope, ...mutation.payload }).unwrap(); break;
      case 'student-basics': result = await updateBasics({ ...envelope, ...mutation.payload }).unwrap(); break;
      case 'student-education': result = await updateEducation({ ...envelope, ...mutation.payload }).unwrap(); break;
      case 'student-direction': result = await updateDirection({ ...envelope, ...mutation.payload }).unwrap(); break;
      case 'student-support': result = await updateSupport({ ...envelope, ...mutation.payload }).unwrap(); break;
      case 'referral': result = await updateReferral({ ...envelope, ...mutation.payload }).unwrap(); break;
      case 'mentor-profile': result = await updateMentorProfile({ ...envelope, ...mutation.payload }).unwrap(); break;
      case 'mentor-academic': result = await updateMentorAcademic({ ...envelope, ...mutation.payload }).unwrap(); break;
      case 'mentor-story': result = await updateMentorStory({ ...envelope, ...mutation.payload }).unwrap(); break;
      case 'mentor-offer': result = await updateMentorOffer({ ...envelope, ...mutation.payload }).unwrap(); break;
      case 'mentor-expertise': result = await updateMentorExpertise({ ...envelope, ...mutation.payload }).unwrap(); break;
      case 'progress': result = await updateProgress({ ...envelope, ...mutation.payload, step: key === 'state-telegram-error' ? `${prefix}-telegram-code` : key }).unwrap(); break;
    }
    finishMutation(envelope.requestId);
    if (manual) setValues(savedValues);
    setRevision(result.revision);
    return result;
  }
  function manualEducationValues() {
    const mentor = searchReturn.startsWith('mentor-') ? 'mentor:' : '';
    return { ...values,
      [`${mentor}University`]: values['manual:University name'] || '',
      [`${mentor}Country of university`]: values['manual:Country of university'] || '',
      [searchTarget.includes('targetField') ? searchTarget : `${mentor}Field of study`]: values['manual:Field of study'] || '',
    };
  }
  function requestError(error: unknown) {
    const problem = error as { status?: number | string; data?: { message?: string | string[] } };
    if (problem.status === 409) {
      setConflict(true);
      setNotice('This onboarding was updated in another tab. Reload the saved version before continuing.');
      return;
    }
    const message = Array.isArray(problem.data?.message) ? problem.data?.message[0] : problem.data?.message;
    setNotice(problem.status === 'FETCH_ERROR' ? 'You appear to be offline. Your answers are still here—retry when you are connected.' : message || 'We could not save this step. Your answers are still here; please retry.');
  }
  async function reloadConflict() {
    setBusy(true);
    try {
      const latest = await reloadState().unwrap();
      const restored = hydrateProductionState(latest);
      setDegree(restored.degree); setValues(previous => ({ ...previous, ...restored.values })); setChoices(restored.choices);
      setPhoto(restored.photo); setTelegram(restored.telegram); setRevision(latest.revision); setConflict(false);
      pendingMutation.current = null;
      go(screenByKey[restored.screen] ? restored.screen : 'goal');
      setNotice('Latest saved answers loaded.');
    } catch (error) { requestError(error); }
    finally { setBusy(false); }
  }
  function explain(title: string, text: string) { setModal({ title, text }); }
  function openSearch(kind: 'university' | 'field', target?: string) {
    setSearchReturn(key); setSearchTarget(target || valueKey(kind === 'university' ? 'University' : 'Field of study', key));
    setSearchQuery(kind === 'field' ? 'Data' : ''); go(`state-${kind}`);
  }
  function selectedChoices(part: Part) { return choices[sourceKey] ?? (part.items || []).filter(item => item.selected).map(item => item.label || ''); }
  function toggleChoice(part: Part, label: string) {
    const selected = selectedChoices(part);
    setChoices(previous => ({ ...previous, [sourceKey]: key.endsWith('referral') ? [label] : selected.includes(label) ? selected.filter(item => item !== label) : [...selected, label] }));
    setErrors(previous => { const next = { ...previous }; delete next.choice; return next; });
  }
  async function uploadPhoto(file: File) {
    setBusy(true); setNotice('Uploading your photo…');
    try {
      const form = new FormData(); form.append('profileImage', file);
      const token = localStorage.getItem(ACCESS_TOKEN);
      const response = await fetch(`${baseUrl}/users/update-profile-image`, { method: 'POST', headers: token ? { authorization: `Bearer ${token}` } : undefined, body: form });
      if (!response.ok) throw new Error('Photo upload failed');
      const uploaded = await response.json() as { media?: { id?: string }; data?: { media?: { id?: string } } };
      const mediaId = (uploaded.media || uploaded.data?.media)?.id;
      if (mediaId) setValues(previous => ({ ...previous, 'mentor:Photo media ID': mediaId }));
      setPhoto(true); setErrors(previous => { const next = { ...previous }; delete next.photo; return next; }); setNotice('Profile photo uploaded.');
    } catch { setNotice('We could not upload that photo. Please choose a JPG or PNG and retry.'); }
    finally { setBusy(false); if (photoInput.current) photoInput.current.value = ''; }
  }
  async function disconnectTelegram() {
    if (!production) { setTelegram(false); infoDialog.current?.close(); go(`${prefix}-telegram`); return; }
    setBusy(true);
    try { await unlinkTelegram().unwrap(); setTelegram(false); infoDialog.current?.close(); go(`${prefix}-telegram`); setNotice('Telegram disconnected.'); }
    catch (error) { requestError(error); }
    finally { setBusy(false); }
  }
  async function integration(label: string) {
    if (label === 'I want to become a mentor') {
      if (!production) return go('mentor-profile');
      setBusy(true); setNotice('Saving…');
      try {
        const signature = JSON.stringify({ revision, key, action: 'continue', endpoint: 'path', path: 'mentor' });
        const envelope = retryableEnvelope(signature, 'continue');
        const result = await updatePath({ ...envelope, path: 'mentor' }).unwrap();
        finishMutation(envelope.requestId);
        setRevision(result.revision); setDegree('mentor'); go('mentor-profile');
      } catch (error) { requestError(error); }
      finally { setBusy(false); }
      return;
    }
    if (label === 'Continue with Google') { go('goal'); setNotice('Google sign-in simulated. No account was created or connected.'); return; }
    if (label.includes('Resend')) { setCooldown(30); setNotice('Preview: a new email would be sent. No email was actually sent.'); return; }
    if (label === 'Use a different email') return go('signup');
    if (label === 'Upload profile photo') {
      if (production) { photoInput.current?.click(); return; }
      setPhoto(true); setErrors(previous => { const next = { ...previous }; delete next.photo; return next; });
      setNotice('Profile-photo upload simulated. No file was uploaded.'); return;
    }
    if (label === 'Review my application') return go('mentor-review');
    if (label === 'Review my saved answers') return go(`${prefix}-review`);
    if (label === 'I’m not sure yet') { update(degree === 'bachelor' ? 'Field for your bachelor’s' : 'Field for your master’s', 'Not sure yet'); setNotice('That’s fine. You can choose a subject later.'); return; }
    if (label === 'Disconnect Telegram') { setModal({ title: 'Disconnect Telegram?', text: `Session reminders would stop. You can connect again later.${production ? '' : ' This is a simulated connection.'}`, disconnect: true }); return; }
    if (/Telegram|@topcoach|new code/.test(label)) {
      if (production) { window.open('https://t.me/topcoach_official_bot', '_blank', 'noopener,noreferrer'); setNotice('After the bot gives you a code, enter it here.'); return; }
      setValues(previous => ({ ...previous, 'Connection code': 'A7K9P2' }));
      explain('Try the Telegram connection', 'This is a design preview—no Telegram account is connected.\n\nUse the example code A7K9P2 to see the connected state. Any other code shows the error flow.'); return;
    }
    if (label.includes('introduction')) { window.open('https://www.youtube.com/watch?v=wtIMtMxMGXA', '_blank', 'noopener,noreferrer'); return; }
    if (production && label === 'Find a mentor') { window.location.assign('/mentors'); return; }
    if (production && label === 'Explore programs') { window.location.assign('/programs'); return; }
    if (production && (label === 'Explore my interests' || label === 'Plan my applications')) { window.location.assign('/student-hub'); return; }
    if (production && label === 'Contact support') { window.location.assign('/contact'); return; }
    explain(label, 'This action belongs to the live platform. This preview stays inside onboarding and does not submit or change any account information.');
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (key === 'goal') {
      const target = editReturn?.startsWith(`${prefix}-`) ? editReturn : nextScreen(screen, degree)!;
      setEditReturn('');
      if (!production) return go(target);
      setBusy(true); setNotice('Saving…');
      try { await persistCurrent('continue'); go(target); }
      catch (error) { requestError(error); }
      finally { setBusy(false); }
      return;
    }
    if (key === 'resume') {
      if (!production) return go(readDraft()?.screen || `${prefix}-education`);
      try { const latest = await reloadState().unwrap(); const restored = hydrateProductionState(latest); setRevision(latest.revision); setValues(previous => ({ ...previous, ...restored.values })); setChoices(restored.choices); return go(restored.screen); }
      catch (error) { requestError(error); return; }
    }
    if (key === 'state-university' || key === 'state-field') {
      if (!values[searchTarget]) { setNotice('Choose an option or add your details manually.'); return; }
      return go(searchReturn);
    }
    const found = validateScreen(screen, values);
    if ((key.endsWith('-referral') || key === 'mentor-background') && !selectedChoices(screen.parts.find(part => part.kind === 'choices') || { kind: 'choices' }).length) {
      found.choice = key === 'mentor-background' ? 'Choose at least one area you can support.' : 'Choose how you heard about TopCoach, or skip this step.';
    }
    if (key === 'mentor-profile' && !photo) found.photo = `Add a profile photo.${production ? '' : ' Use the upload button to simulate it.'}`;
    if (Object.keys(found).length) {
      setErrors(found); setNotice('Check the highlighted details before continuing.');
      requestAnimationFrame(() => document.getElementById(fieldId(Object.keys(found)[0]))?.focus()); return;
    }
    if (key === 'state-manual') {
      if (production) {
        setBusy(true);
        try { await persistCurrent('save'); go(searchReturn); }
        catch (error) { requestError(error); }
        finally { setBusy(false); }
        return;
      }
      setValues(manualEducationValues());
      return go(searchReturn);
    }
    if (key.includes('telegram-code') || key === 'state-telegram-error') {
      if (!production) {
        if (values['Connection code'] !== 'A7K9P2') { go('state-telegram-error'); return; }
        setTelegram(true);
      } else {
        setBusy(true); setNotice('Verifying…');
        try { await verifyTelegramCode({ code: values['Connection code'] }).unwrap(); setTelegram(true); await persistCurrent('continue'); go(`${prefix}-telegram-connected`); }
        catch (error) { requestError(error); go('state-telegram-error'); }
        finally { setBusy(false); }
        return;
      }
    }
    if (!screen.next) {
      if (!production) return explain('You’ve reached the end of this preview.', 'Your onboarding design is complete. In the live platform, this action would take you to your account. No profile was submitted.');
      if (key === 'b-done' || key === 'm-done') window.location.assign('/student-hub');
      else if (key === 'mentor-done') window.location.assign('/mentor');
      return;
    }
    if (production) {
      setBusy(true); setNotice(key.endsWith('-review') ? 'Completing your onboarding…' : 'Saving…');
      const target = editReturn || screen.next;
      try {
        if (key === 'b-review' || key === 'm-review') {
          const signature = JSON.stringify({ revision, key, action: 'continue', endpoint: 'complete' });
          const envelope = retryableEnvelope(signature, 'continue');
          const result = await completeOnboarding({ expectedRevision: revision, requestId: envelope.requestId }).unwrap(); finishMutation(envelope.requestId); setRevision(result.revision);
        } else if (key === 'mentor-review') {
          const signature = JSON.stringify({ revision, key, action: 'continue', endpoint: 'mentor-submit' });
          const envelope = retryableEnvelope(signature, 'continue');
          const result = await submitMentor({ expectedRevision: revision, requestId: envelope.requestId }).unwrap(); finishMutation(envelope.requestId); setRevision(result.revision);
        } else await persistCurrent('continue');
        setEditReturn(''); go(target);
      } catch (error) { requestError(error); }
      finally { setBusy(false); }
      return;
    }
    setBusy(true);
    timer.current = setTimeout(() => {
      const target = editReturn || (key === 'state-telegram-error' ? `${prefix}-telegram-connected` : screen.next!);
      setEditReturn(''); go(target);
    }, 350);
  }

  function field(part: Part, index: string) {
    const label = part.label || '';
    const name = valueKey(label, key);
    const value = values[name] ?? '';
    const error = errors[name] || (!touched[name] && typeof part.error === 'string' ? part.error : '');
    const id = fieldId(name);
    if (label.includes('EDIT')) {
      let answer = part.value || '';
      const fullName = isMentor ? values['mentor:Full name'] : `${values['First name']} ${values['Last name']}`;
      if (label.startsWith('YOUR GOAL')) answer = degree === 'master' ? 'Master’s degree' : 'Bachelor’s degree';
      if (label.startsWith('ABOUT YOU')) answer = `${fullName} · ${values['Country of residence']}`;
      if (label.startsWith('YOUR EDUCATION')) answer = degree === 'master' ? `${values['Bachelor’s qualification']} · ${values['Graduation year']}` : `${values['Current education stage']} · ${values['School · optional'] || 'School not added'}`;
      if (label.startsWith('YOUR DIRECTION')) answer = `${values[`${prefix}:targetField`]} · ${values['Preferred destinations · optional'] || 'Destination undecided'}`;
      if (label.startsWith('PROFILE')) answer = `${fullName} · ${photo ? `Photo added${production ? '' : ' (simulated)'}` : 'Photo not added'}`;
      if (label.startsWith('EDUCATION')) answer = `${values['mentor:Field of study']} · ${values['mentor:University']}`;
      if (label.startsWith('MENTORING')) answer = values['mentor:Specializations'];
      return <div className="review-field" key={index}><span className="field-label">{label}</span><button type="button" onClick={() => { setEditReturn(key); go(screen.optionLinks?.[label] || 'goal'); }}>{answer}</button></div>;
    }
    let control;
    const common = { id, value, 'aria-describedby': error ? `${id}-error` : undefined, 'aria-invalid': !!error, status: error ? 'error' as const : undefined };
    const country = label.startsWith('Country');
    const options = country ? COUNTRY_NATIONALITY_NAMES : label === 'Preferred language' || label.includes('Languages') ? LANGUAGES : label === 'Current education stage' ? ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Gap year', 'Already graduated'] : label === 'Bachelor’s status' ? ['Currently studying', 'Graduated'] : label.includes('Intended start') ? ['Autumn 2026', 'Spring 2027', 'Autumn 2027', '2028 or later', 'Not sure yet'] : label.includes('Preferred destinations') ? ['United States', 'United Kingdom', 'Canada', 'Germany', 'Europe', 'Asia', 'Australia', 'Not sure yet'] : null;
    const multi = label.includes('Languages') || label.includes('Preferred destinations');
    if (options) control = <Select {...common} value={multi ? value.split(', ').filter(Boolean) : value || undefined} mode={multi ? 'multiple' : undefined} options={asOptions(options)} showSearch optionFilterProp="label" placeholder="Choose an option" popupClassName="onboarding-preview-popup" onChange={(next: string | string[]) => {
      if (Array.isArray(next) && next.includes('Not sure yet')) next = next[next.length - 1] === 'Not sure yet' ? ['Not sure yet'] : next.filter(item => item !== 'Not sure yet');
      update(label, Array.isArray(next) ? next.join(', ') : next);
    }} />;
    else if (label === 'University' || label.includes('Field') || label.includes('field of study')) {
      const list = label === 'University' ? universities : SUBJECTS;
      const matches = list.filter(item => matchesEducationSearch(value, item)).slice(0, 60);
      control = <AutoComplete {...common} popupClassName="onboarding-preview-popup" options={matches.map(item => ({ value: item.value, label: 'country' in item && item.country ? `${item.value} — ${item.country}` : item.value }))} onChange={next => update(label, next)} placeholder="Search or enter your own" allowClear notFoundContent="No match. Your typed answer can still be used." />;
    } else if (label.toLowerCase().includes('password')) control = <Input.Password {...common} autoComplete="off" onChange={event => update(label, event.target.value)} placeholder="Use an example password" />;
    else if (/About you|Why do you|Value you|experience|Professional background/.test(label)) control = <Input.TextArea {...common} rows={3} maxLength={2000} onChange={event => update(label, event.target.value)} />;
    else control = <Input {...common} type={label === 'Email' ? 'email' : label.startsWith('Phone') ? 'tel' : 'text'} inputMode={label === 'Graduation year' ? 'numeric' : undefined} maxLength={label === 'Connection code' ? 6 : label === 'Graduation year' ? 4 : label.startsWith('If other') ? 64 : 160} placeholder={cleanValue(part.value)} onChange={event => update(label, label === 'Connection code' ? event.target.value.toUpperCase() : event.target.value)} />;
    return <div className="field" key={index}><label htmlFor={id}>{label}</label>{control}{error && <p className="field-error" id={`${id}-error`}>{error}</p>}</div>;
  }

  function renderPart(part: Part, index: number) {
    if (part.kind === 'card') return null;
    if (part.kind === 'field') {
      if (part.label?.startsWith('If other') && !(choices.referral || ['Other']).includes('Other')) return null;
      return field(part, String(index));
    }
    if (part.kind === 'row') return <div className="field-row" key={index}>{part.items?.map((item, i) => field(item, `${index}-${i}`))}</div>;
    if (part.kind === 'choices') return <div className="choices" role={key.endsWith('referral') ? 'radiogroup' : 'group'} aria-label={key.endsWith('referral') ? 'How you found TopCoach' : 'Choose your preferences'} key={index}>{part.items?.map(item => <PreviewButton key={item.label} role={key.endsWith('referral') ? 'radio' : undefined} aria-checked={key.endsWith('referral') ? selectedChoices(part).includes(item.label!) : undefined} aria-pressed={!key.endsWith('referral') ? selectedChoices(part).includes(item.label!) : undefined} selected={selectedChoices(part).includes(item.label!)} onClick={() => toggleChoice(part, item.label!)}>{item.label}</PreviewButton>)}</div>;
    if (part.kind === 'notice') {
      let title = part.title; let text = part.text;
      if (key === 'resume') {
        const saved = production ? serverState?.currentStep : readDraft()?.screen;
        title = saved && screenByKey[saved] ? `Last saved · ${screenByKey[saved].title}` : production ? 'Your draft is saved' : 'Explore a saved-progress example';
        text = production ? 'Your answers are safely stored in your TopCoach account.' : 'Your preview answers stay in this browser. Nothing has been submitted to TopCoach.';
      }
      return <div className={`notice ${part.error ? 'error' : ''}`} key={index}><strong>{title}</strong><p>{text}</p></div>;
    }
    if (part.kind === 'button') return <div key={index}><PreviewButton id={part.label === 'Upload profile photo' ? fieldId('photo') : undefined} disabled={busy || (!!cooldown && part.label?.includes('Resend'))} onClick={() => integration(part.label!)}>{part.label === 'Upload profile photo' && photo ? `✓ Photo added · Change` : part.label?.includes('Resend') && cooldown ? `Resend in ${cooldown}s` : part.label}</PreviewButton>{part.label === 'Upload profile photo' && <input ref={photoInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { const file = event.target.files?.[0]; if (file && production) void uploadPhoto(file); }} />}{part.label === 'Upload profile photo' && errors.photo && <p className="field-error">{errors.photo}</p>}</div>;
    if (part.kind === 'text') {
      if (part.tone === 'brand') return <button className="text-link" type="button" key={index} onClick={() => {
        if (part.text?.startsWith('Browse')) return openSearch('field', `${prefix}:targetField`);
        if (/university|field.*Add|isn’t listed/.test(part.text || '')) {
          const mentor = key.startsWith('mentor-') ? 'mentor:' : '';
          setSearchReturn(key); setSearchTarget(`${mentor}Field of study`);
          setValues(previous => ({ ...previous, 'manual:University name': previous[`${mentor}University`] || '', 'manual:Country of university': previous[`${mentor}Country of university`] || '', 'manual:Field of study': previous[`${mentor}Field of study`] || '' }));
          go('state-manual'); return;
        }
        if (part.text?.includes('sign in')) return go('signin');
        explain(part.text?.includes('Forgot') ? 'Password recovery' : 'Contact support', 'This is a design preview. No password-reset or support request will be sent. You can use the screen browser to explore account and recovery states.');
      }}>{part.text}</button>;
      const text = part.text?.startsWith('Telegram connected') ? `Telegram ${telegram ? `connected${production ? '' : ' (simulated)'}` : 'not connected'} · Language: ${values['Preferred language']}` : part.text;
      return <p className={`supporting-note ${part.tone === 'error' ? 'note-error' : ''}`} key={index}>{text}</p>;
    }
    return null;
  }

  function renderSearch() {
    const university = key === 'state-university';
    const target = searchTarget || (university ? 'University' : 'Field of study');
    const matches = (university ? universities : SUBJECTS).filter(item => matchesEducationSearch(searchQuery, item));
    const query = normalizeEducationSearch(searchQuery);
    const rank = (item: EducationOption) => {
      const name = normalizeEducationSearch(item.value);
      return name === query ? 0 : name.startsWith(query) ? 1 : name.includes(query) ? 2 : 3;
    };
    const results = matches.sort((a, b) => rank(a) - rank(b)).slice(0, 50);
    return <>
      <div className="field directory-field"><label htmlFor="directory-query">{university ? 'University' : 'Field of study'}</label>
        <Select key={key} id="directory-query" showSearch allowClear value={values[target] || undefined}
          searchValue={searchQuery} onSearch={setSearchQuery} filterOption={false} virtual={false} listHeight={264}
          placeholder={university ? 'Search by university name' : 'Search a field of study'}
          popupClassName="onboarding-preview-popup directory-dropdown" optionLabelProp="label"
          options={results.map(item => ({ value: item.value, label: item.value, country: 'country' in item && typeof item.country === 'string' ? item.country : undefined }))}
          optionRender={option => <div className="directory-suggestion"><span>{option.data.label}</span>{option.data.country ? <small>{option.data.country}</small> : null}</div>}
          notFoundContent={<div className="directory-empty">No matches. Try another name or add your details manually below.</div>}
          onChange={(value: string | undefined) => { setValues(previous => ({ ...previous, [target]: value || '' })); setSearchQuery(''); setNotice(''); }}
        />
        <p className="directory-hint">{university ? 'Type a university name or country to search.' : 'Type a subject, such as Computer Science or Business.'}</p>
      </div>
      {directoryStatus && <p className="supporting-note">{directoryStatus}</p>}
      <button className="text-link" type="button" onClick={() => go('state-manual')}>Can’t find yours? Add it manually →</button>
    </>;
  }
  const stages = isMentor ? ['Profile & education', 'Your story', 'Your mentorship', 'Review & submit'] : ['Your goal', 'Your background', 'Your direction', 'Get started'];
  const stage = isMentor
    ? /profile|academic/.test(key) ? 0 : key === 'mentor-story' ? 1 : /offer|background/.test(key) ? 2 : 3
    : key === 'goal' ? 0 : /basics|education/.test(key) ? 1 : /direction|support|referral/.test(key) ? 2 : 3;
  if (production && stateLoading && !hydrated) return <Loader height="100vh" />;
  if (production && stateError && !hydrated) return <div className="onboarding-preview"><main className="preview-layout"><form className="screen-form" onSubmit={event => { event.preventDefault(); void refetch(); }}><div className="screen-content"><p className="eyebrow">ONBOARDING</p><h1 className="screen-heading">We couldn’t load your saved setup.</h1><p className="screen-intro">Check your connection and try again. Your account data has not been changed.</p></div><div className="form-actions"><PreviewButton primary htmlType="submit">Try again</PreviewButton></div></form></main></div>;
  return <div className={`onboarding-preview ${production ? 'onboarding-production' : ''}`}>
    {!production && <div className="preview-bar"><span>DESIGN PREVIEW · No account changes</span><button type="button" onClick={() => browserDialog.current?.showModal()}>Explore all 41 screens</button></div>}
    <header className={`${headerStyles.header} preview-header`}><div className="preview-header-inner"><button type="button" className="wordmark" onClick={() => go('goal')} aria-label="TopCoach — choose your path"><Logo color="white" width={120} height={40} aria-hidden="true" /></button><div className="header-actions"><span className="header-language">English</span></div></div></header>
    <main className="preview-layout">
      <aside className="journey"><p className="eyebrow">{isMentor ? 'FOR FUTURE MENTORS' : 'YOUR NEXT CHAPTER'}</p><h2 className="hero">{screen.hero}</h2><p className="journey-description">{isMentor ? 'Your experience can help someone make their next move.' : 'A few details today. A clearer direction for tomorrow.'}</p><ol className="journey-steps" aria-label="Onboarding progress">{stages.map((label, i) => <li key={label} aria-current={i === stage ? 'step' : undefined}><span>0{i + 1}</span>{label}</li>)}</ol></aside>
      <form className="screen-form" onSubmit={submit} noValidate>
        <div className="screen-content"><p className="eyebrow">{screen.step}</p><h1 className="screen-heading" ref={heading} tabIndex={-1}>{key === 'resume' ? `Welcome back, ${values['First name'] || 'there'}.` : screen.title}</h1><p className="screen-intro">{screen.intro}</p>
          {key === 'goal' && <fieldset className="radio-group"><legend className="sr-only">Which degree are you applying for?</legend>{(['bachelor', 'master'] as const).map((option, i) => <label className={`degree-card ${degree === option ? 'selected' : ''}`} key={option}><input type="radio" name="degree" value={option} checked={degree === option} onChange={() => setDegree(option)} /><span><strong>{screen.parts[i].title}</strong><small>{screen.parts[i].desc}</small></span></label>)}</fieldset>}
          {key === 'state-university' || key === 'state-field' ? renderSearch() : screen.parts.map(renderPart)}
          {errors.choice && <p className="field-error" role="alert">{errors.choice}</p>}
          {screen.secondary && <button type="button" className="text-link" disabled={busy || conflict} onClick={async () => {
            const target = key === 'state-telegram-error' ? `${prefix}-review` : nextAfterSkip(key) || screen.secondaryTo!;
            if (key.includes('telegram')) setTelegram(false);
            if (/support|referral/.test(key)) setChoices(previous => ({ ...previous, [sourceKey]: [] }));
            if (!production) { go(target); return; }
            setBusy(true); setNotice('Saving…');
            try { await persistCurrent('skip'); go(target); }
            catch (error) { requestError(error); }
            finally { setBusy(false); }
          }}>{screen.secondary}</button>}
          {conflict && <div className="notice error"><strong>Newer answers found</strong><p>Another tab saved changes after this page loaded.</p><PreviewButton onClick={() => void reloadConflict()} disabled={busy}>Reload saved answers</PreviewButton></div>}
          <div className="live-message" role="status" aria-live="polite">{notice}</div>
        </div>
        <div className="form-actions">{screen.back && <PreviewButton className="back" disabled={busy} onClick={() => go(key === 'state-university' || key === 'state-field' ? searchReturn : key === 'state-telegram-error' ? `${prefix}-telegram-code` : key.endsWith('-review') && !isMentor && !telegram ? `${prefix}-telegram` : screen.back!)}>Back</PreviewButton>}<PreviewButton primary htmlType="submit" disabled={busy || conflict}>{busy ? (key.includes('telegram') ? 'Verifying…' : 'Saving…') : screen.cta}</PreviewButton></div>
      </form>
    </main>
    <footer className="preview-footer">YOUR NEXT CHAPTER, ON YOUR TERMS.</footer>
    {!production && <dialog className="screen-dialog" ref={browserDialog} aria-labelledby="screen-browser-title"><div className="dialog-top"><h2 id="screen-browser-title">Every way in.</h2><button type="button" onClick={() => browserDialog.current?.close()}>Close</button></div><p className="dialog-copy">41 screens, responsive on desktop and mobile. Start a journey or jump directly to a recovery state. All integrations are simulated.</p>{groups.map(group => <section key={group}><h3>{group}</h3><div className="screen-links">{screens.filter(item => item.group === group).map(item => <button type="button" key={item.key} aria-current={item.key === key ? 'page' : undefined} onClick={() => { setEditReturn(''); if (item.key === 'state-field') { setSearchTarget('Field of study'); setSearchQuery('Data'); } if (item.key === 'state-university') { setSearchTarget('University'); setSearchQuery(''); } go(item.key); }}>{item.title}</button>)}</div></section>)}</dialog>}
    <dialog className="screen-dialog" ref={infoDialog} aria-labelledby="preview-info-title" onClose={() => setModal(null)}><div className="dialog-top"><h2 id="preview-info-title">{modal?.title}</h2><button type="button" onClick={() => infoDialog.current?.close()}>Close</button></div><p className="dialog-copy">{modal?.text}</p>{modal?.disconnect ? <div className="form-actions"><PreviewButton onClick={() => infoDialog.current?.close()}>Keep connected</PreviewButton><PreviewButton primary disabled={busy} onClick={() => void disconnectTelegram()}>Disconnect</PreviewButton></div> : <PreviewButton primary onClick={() => infoDialog.current?.close()}>Got it</PreviewButton>}</dialog>
  </div>;
}
