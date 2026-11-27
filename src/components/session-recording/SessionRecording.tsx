import { useEffect, useState } from 'react';
import { Button, Modal, Alert } from 'antd';
import { baseUrl } from 'src/app/services/api/const';
import { useGetSessionRecordingsQuery, type RecordingSource } from 'src/app/services/sessionRecordings';

export function SessionRecording({ source, sessionId }: { source: RecordingSource; sessionId: string }) {
  const [open, setOpen] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(30000);
  const [videoError, setVideoError] = useState(false);
  const query = useGetSessionRecordingsQuery({ source, sessionId }, { refetchOnMountOrArgChange: true, refetchOnFocus: true, pollingInterval });
  useEffect(() => {
    if (!query.data) return;
    setPollingInterval(query.data.some(row => !['ready', 'failed', 'cancelled'].includes(row.status)) ? 30000 : 0);
  }, [query.data]);
  const rows = query.data ?? [];
  const ready = rows.filter(row => row.status === 'ready' && row.playbackPath);
  const current = rows[0];
  if (!rows.length || query.isError) return null;
  const labels = { pending: 'Recording scheduled', scheduled: 'Recording scheduled', joining: 'Recorder joining', recording: 'Recording in progress', processing: 'Recording processing', saving: 'Saving recording', ready: '', failed: 'Recording unavailable', cancelled: '' };
  return <>
    {ready.length > 0 ? <Button size="small" onClick={async () => { setVideoError(false); await query.refetch(); setOpen(true); }}>Watch recording</Button> : current && labels[current.status] ? <small role="status">{labels[current.status]}</small> : null}
    <Modal title="Session recording" open={open} footer={null} onCancel={() => setOpen(false)} destroyOnClose width={900}>
      {videoError && <Alert type="error" message="Couldn't play the recording. Close and reopen it to refresh the link." showIcon />}
      {open && ready.map((row, index) => <div key={row.id}>
        {ready.length > 1 && <p>Recording {index + 1}</p>}
        <video controls playsInline preload="metadata" style={{ width: '100%', maxHeight: '65vh', background: '#000' }} src={`${baseUrl}${row.playbackPath}`} onError={() => setVideoError(true)} aria-label="Session recording" />
      </div>)}
    </Modal>
  </>;
}
