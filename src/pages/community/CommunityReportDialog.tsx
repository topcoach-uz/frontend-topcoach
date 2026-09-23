import { useState } from "react";
import { Alert, Input, Modal, Radio } from "antd";
import {
  useReportPostMutation,
  useReportCommentMutation,
  type CommunityReportReason,
} from "src/app/services/communityFeedApi";

export type ReportTarget = { id: string; kind: "post" | "comment" };

export default function CommunityReportDialog({
  target,
  onClose,
  onSuccess,
}: {
  target: ReportTarget;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState<CommunityReportReason>();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [reportPost, postState] = useReportPostMutation();
  const [reportComment, commentState] = useReportCommentMutation();
  const pending = postState.isLoading || commentState.isLoading;
  const submit = async () => {
    if (!reason || pending) return;
    setError("");
    try {
      const body = { reason, note: note.trim() || undefined };
      if (target.kind === "post")
        await reportPost({ postId: target.id, body }).unwrap();
      else await reportComment({ commentId: target.id, body }).unwrap();
      onSuccess();
      onClose();
    } catch {
      setError("Your report could not be submitted. Please try again.");
    }
  };
  return (
    <Modal
      open
      title={`Report ${target.kind}`}
      onCancel={onClose}
      onOk={submit}
      okText="Submit report"
      confirmLoading={pending}
      okButtonProps={{ disabled: !reason }}
      cancelButtonProps={{ disabled: pending }}
      closable={!pending}
      maskClosable={!pending}
      keyboard={!pending}
    >
      <p>Choose a reason. Your report is anonymous to the author.</p>
      <Radio.Group
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        disabled={pending}
        style={{ display: "grid", gap: 12, marginBottom: 20 }}
      >
        {(
          [
            ["SPAM", "Spam or advertising"],
            ["HARASSMENT", "Harassment or bullying"],
            ["OFF_TOPIC", "Off-topic"],
            ["MISINFORMATION", "Misleading information"],
            ["SAFETY", "Safety concern"],
            ["OTHER", "Something else"],
          ] as const
        ).map(([value, label]) => (
          <Radio key={value} value={value}>
            {label}
          </Radio>
        ))}
      </Radio.Group>
      <Input.TextArea
        aria-label="Additional context"
        placeholder="Add context for our moderators (optional)…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        maxLength={2000}
        disabled={pending}
      />
      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          style={{ marginTop: 12 }}
        />
      )}
    </Modal>
  );
}
