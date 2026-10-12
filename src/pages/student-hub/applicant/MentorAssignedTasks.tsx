import { useEffect, useState } from 'react';
import { Alert, Button, Input, Modal, Upload, message } from 'antd';
import type { UploadFile } from 'antd';
import { Paperclip } from 'lucide-react';
import {
  useGetMenteeTasksQuery,
  useSubmitMenteeTaskMutation,
  useUploadTaskSubmissionFileMutation,
  type TaskDto,
} from 'src/app/services/fullSupportApi';
import { hostName } from 'src/app/services/api/const';

const statusLabels: Record<TaskDto['status'], string> = {
  assigned: 'To do',
  submitted: 'Waiting for review',
  revision_requested: 'Revision requested',
  approved: 'Approved',
};
const EMPTY_TASKS: TaskDto[] = [];

export default function MentorAssignedTasks({ selectedTaskId }: { selectedTaskId?: string | null }) {
  const { data, isLoading, isError, refetch } = useGetMenteeTasksQuery();
  const [submitTask, submitState] = useSubmitMenteeTaskMutation();
  const [uploadFile] = useUploadTaskSubmissionFileMutation();
  const [active, setActive] = useState<TaskDto | null>(null);
  const [response, setResponse] = useState('');
  const [files, setFiles] = useState<UploadFile[]>([]);
  const tasks = data?.data ?? EMPTY_TASKS;

  useEffect(() => {
    if (selectedTaskId && tasks.some((task) => task.id === selectedTaskId)) {
      document.getElementById(`mentor-task-${selectedTaskId}`)?.scrollIntoView({ block: 'center' });
    }
  }, [selectedTaskId, tasks]);

  const close = () => { setActive(null); setResponse(''); setFiles([]); };
  const send = async () => {
    if (!active) return;
    if (!response.trim() && files.length === 0) { message.warning('Add a response or file.'); return; }
    try {
      const uploaded: { fileName: string; url: string }[] = [];
      for (const file of files) {
        if (!file.originFileObj) continue;
        const result = await uploadFile({ taskId: active.id, file: file.originFileObj }).unwrap();
        uploaded.push(result.data);
      }
      await submitTask({ id: active.id, submissionText: response.trim(), submissionFileUrls: uploaded }).unwrap();
      message.success('Sent to your advisor for review.');
      close();
    } catch { message.error('Could not send your work. Please try again.'); }
  };

  return <section className="applicant-panel mentor-assigned-tasks" aria-label="Assigned tasks">
    <div className="mentor-assigned-tasks__head"><div><h2>Assigned tasks</h2><p>Submit your work here and check feedback from your counselor or mentor.</p></div><span>{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</span></div>
    {isLoading ? <p>Loading assigned tasks…</p> : isError ? <Alert type="error" message="Could not load assigned tasks" action={<Button onClick={() => refetch()}>Retry</Button>} /> : tasks.length === 0 ? <p className="mentor-assigned-tasks__empty">No tasks assigned yet. Tasks from your counselor or mentor will appear here.</p> : tasks.map((task) => <article id={`mentor-task-${task.id}`} key={task.id} className="mentor-assigned-tasks__item">
      <div className="mentor-assigned-tasks__top"><div><h3>{task.task}</h3><p>From {task.mentorName || 'your advisor'} · Due {task.deadline}</p></div><strong className={`mentor-assigned-tasks__status mentor-assigned-tasks__status--${task.status}`}>{statusLabels[task.status] || 'To do'}</strong></div>
      {task.description && <p className="mentor-assigned-tasks__description">{task.description}</p>}
      {task.submissionText && <p className="mentor-assigned-tasks__description"><strong>Your submission:</strong> {task.submissionText}</p>}
      {task.feedback && <p className="mentor-assigned-tasks__feedback"><strong>Advisor feedback:</strong> {task.feedback}</p>}
      {(task.status === 'submitted' ? task.reviewHistory?.length > 0 : task.reviewHistory?.length > 1) && <details><summary>Previous submissions and reviews</summary>{(task.status === 'submitted' ? task.reviewHistory : task.reviewHistory.slice(0, -1)).map((entry, index) => <div key={index}><p>{entry.decision === 'approved' ? 'Approved' : 'Revision requested'} · {new Date(entry.at).toLocaleDateString()}: {entry.feedback}</p>{entry.submissionText && <p>Submitted: {entry.submissionText}</p>}{entry.submissionFileUrls?.map((file) => <a key={file.url} href={`${hostName}${file.url}`} target="_blank" rel="noreferrer">Submitted file: {file.fileName}</a>)}{entry.feedbackFileUrls?.map((file) => <a key={file.url} href={`${hostName}${file.url}`} target="_blank" rel="noreferrer">Feedback file: {file.fileName}</a>)}</div>)}</details>}
      {task.feedbackFileUrls?.map((file) => <a key={file.url} href={`${hostName}${file.url}`} target="_blank" rel="noreferrer"><Paperclip size={14} /> {file.fileName}</a>)}
      {(task.status === 'assigned' || task.status === 'revision_requested') && <Button type="primary" onClick={() => setActive(task)}>{task.status === 'revision_requested' ? 'Submit revision' : 'Submit work'}</Button>}
    </article>)}
    <Modal title={active ? `Submit: ${active.task}` : 'Submit work'} open={!!active} onCancel={close} onOk={send} okText="Send for review" confirmLoading={submitState.isLoading} destroyOnClose>
      {active?.description && <p>{active.description}</p>}
      <Input.TextArea rows={5} placeholder="Describe what you completed or ask a question" value={response} onChange={(event) => setResponse(event.target.value)} />
      <Upload beforeUpload={() => false} fileList={files} onChange={({ fileList }) => setFiles(fileList.slice(-3))} multiple><Button style={{ marginTop: 12 }}>Attach files (up to 3)</Button></Upload>
    </Modal>
  </section>;
}
