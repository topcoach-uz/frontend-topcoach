import { useEffect, useRef, useState } from "react";
import { Alert, Button, Form, Input, Modal, Popconfirm, Upload, message } from "antd";
import type { UploadFile } from "antd";
import { Download, FileText, UploadCloud } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "src/pages/learning/components/pdfWorker";
import {
  useDownloadDocumentMutation,
  useDownloadDocumentVersionMutation,
  useGetDocumentQuery,
  useGetDocumentReviewQuery,
  useGetDocumentVersionsQuery,
  useUpdateDocumentAccessMutation,
  useUploadDocumentVersionMutation,
} from "src/app/services/student-hub/documentManagementApi";
import { ApplicantPage, Breadcrumb, QueryState, displayDate } from "./ApplicantPage";
import { useGetEligibleEssayMentorsQuery } from "src/app/services/student-hub/essayReviewApi";

const saveBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
};

export default function ApplicantDocumentReviewPage() {
  const { documentId = "" } = useParams();
  const documentQuery = useGetDocumentQuery(documentId, { skip: !documentId });
  const reviewQuery = useGetDocumentReviewQuery(documentId, { skip: !documentId });
  const versionsQuery = useGetDocumentVersionsQuery(documentId, { skip: !documentId });
  const [download] = useDownloadDocumentMutation();
  const [downloadVersion] = useDownloadDocumentVersionMutation();
  const [uploadVersion, uploadState] = useUploadDocumentVersionMutation();
  const [updateAccess, accessState] = useUpdateDocumentAccessMutation();
  const { data: eligibleMentors = [], isError: mentorCheckError, refetch: refetchMentors } = useGetEligibleEssayMentorsQuery(undefined, { refetchOnMountOrArgChange: true });
  const hasAssignedMentor = eligibleMentors.some((mentor) => mentor.source === "full_support");
  const [tab, setTab] = useState<"preview" | "feedback" | "versions">("preview");
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [previewError, setPreviewError] = useState(false);
  const [pdfPages, setPdfPages] = useState(0);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfWidth, setPdfWidth] = useState(720);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [file, setFile] = useState<File>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm<{ changeSummary?: string }>();
  const record = documentQuery.data?.data;
  const review = reviewQuery.data?.data;
  const reviewerAccess = review?.reviewerAccess ?? record?.reviewerAccess ?? false;

  useEffect(() => {
    const container = pdfContainerRef.current;
    if (!container || !previewUrl || record?.mimeType !== "application/pdf") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setPdfWidth(Math.max(1, Math.floor(entry.contentRect.width)));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [previewUrl, record?.mimeType, tab]);

  useEffect(() => {
    if (!record || tab !== "preview" || !/^(application\/pdf|image\/)/.test(record.mimeType ?? "")) return;
    let live = true;
    let url: string | undefined;
    setPreviewError(false);
    setPdfPage(1);
    setPdfPages(0);
    download(record.id).unwrap().then(async (blob) => {
      if (!live) return;
      if (!blob.size || (record.mimeType === "application/pdf" && !(await blob.slice(0, 5).text()).startsWith("%PDF-"))) {
        throw new Error("The stored file is not a valid PDF preview.");
      }
      url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    }).catch(() => { if (live) setPreviewError(true); });
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
      setPreviewUrl(undefined);
    };
  }, [record?.id, record?.updatedAt, record?.mimeType, tab]);

  const getCurrent = async () => {
    if (!record) return;
    try { saveBlob(await download(record.id).unwrap(), record.fileName); }
    catch { message.error("Could not download this document."); }
  };
  const getVersion = async (id: string, fileName: string) => {
    try { saveBlob(await downloadVersion({ id: documentId, versionId: id }).unwrap(), fileName); }
    catch { message.error("Could not download this version."); }
  };
  const submitVersion = async ({ changeSummary }: { changeSummary?: string }) => {
    if (!file) { message.error("Choose a file for the new version."); return; }
    const body = new FormData();
    body.append("file", file);
    if (changeSummary?.trim()) body.append("changeSummary", changeSummary.trim());
    try {
      await uploadVersion({ id: documentId, body }).unwrap();
      setModalOpen(false);
      setFile(undefined);
      setFileList([]);
      form.resetFields();
      setTab("versions");
      message.success("New version uploaded. Previous versions remain available.");
    } catch { message.error("Could not upload the new version. Your file has not been replaced."); }
  };
  const toggleAccess = async () => {
    try {
      await updateAccess({ id: documentId, reviewerAccess: !reviewerAccess }).unwrap();
      message.success(reviewerAccess ? "Reviewer access removed." : "Assigned mentor can now review this document.");
    } catch { message.error("Could not change reviewer access. Check that a mentor is assigned to you."); }
  };

  return <ApplicantPage title={record?.documentType === "essay" ? "Statement review" : "Document review"}
    subtitle={record ? `${record.fileName} · ${reviewerAccess ? "Assigned mentor" : "Private"}` : undefined}
    actions={<Button onClick={() => setModalOpen(true)} icon={<UploadCloud size={16} />}>Upload new version</Button>}>
    <Breadcrumb><Link to="/student-hub/documents">Documents</Link><span>/</span>{record?.fileName || "Review"}</Breadcrumb>
    <QueryState loading={documentQuery.isLoading} error={documentQuery.isError || (!documentQuery.isLoading && !record)} retry={documentQuery.refetch}>
      {record && <>
        {record.legacyPublic && <Alert type="warning" showIcon message="This older upload uses legacy storage" description="Upload a new private version before sharing it with a mentor. Earlier links may still exist until the legacy file is migrated." />}
        <div className="applicant-tabs" role="tablist" aria-label="Document review">
          {(["preview", "feedback", "versions"] as const).map((view) => <button key={view} type="button" role="tab" aria-selected={tab === view} className={tab === view ? "is-active" : ""} onClick={() => setTab(view)}>{view[0].toUpperCase() + view.slice(1)}</button>)}
        </div>
        {tab === "preview" && <div className="applicant-panel applicant-document-review">
          <div className="applicant-section-heading"><h2>{record.fileName}</h2><Button onClick={getCurrent} icon={<Download size={16} />}>Download</Button></div>
          {previewError ? <Alert type="error" message="Preview unavailable" description="Try downloading the file." />
            : previewUrl && record.mimeType?.startsWith("image/") ? <img className="applicant-document-review__image" src={previewUrl} alt={`Preview of ${record.fileName}`} onError={() => setPreviewError(true)} />
            : previewUrl && record.mimeType === "application/pdf" ? <div className="applicant-document-review__pdf" ref={pdfContainerRef}>
                <Document file={previewUrl} loading={<p>Loading PDF preview…</p>} error={<Alert type="error" message="Preview unavailable" description="Try downloading the file." />} onLoadSuccess={({ numPages }) => setPdfPages(numPages)}>
                  <Page pageNumber={pdfPage} width={pdfWidth} renderTextLayer={false} renderAnnotationLayer={false} loading={<p>Loading page…</p>} />
                </Document>
                {pdfPages > 1 && <div className="applicant-document-review__pager">
                  <Button disabled={pdfPage === 1} onClick={() => setPdfPage((page) => page - 1)}>Previous</Button>
                  <span>Page {pdfPage} of {pdfPages}</span>
                  <Button disabled={pdfPage === pdfPages} onClick={() => setPdfPage((page) => page + 1)}>Next</Button>
                </div>}
              </div>
            : <div className="applicant-empty"><FileText size={36} /><p>Preview is available for PDF and image files. Download this file to review it.</p></div>}
        </div>}
        {tab === "feedback" && <div className="applicant-panel applicant-document-review">
          <QueryState loading={reviewQuery.isLoading} error={reviewQuery.isError} retry={reviewQuery.refetch}>
            <h2>Reviewer feedback</h2>
            {review?.feedback.length ? review.feedback.map((item) => <div className="applicant-document-review__feedback" key={item.id}><strong>{item.annotationType || "Comment"}</strong><small>{displayDate(item.createdAt)}{item.isResolved ? " · Resolved" : ""}</small><p>{item.content}</p></div>) : <p>No reviewer feedback has been shared yet.</p>}
          </QueryState>
        </div>}
        {tab === "versions" && <div className="applicant-panel applicant-document-review">
          <QueryState loading={versionsQuery.isLoading} error={versionsQuery.isError} retry={versionsQuery.refetch}>
            <h2>Versions</h2>
            {(versionsQuery.data?.data ?? []).length ? <ol className="applicant-statement-review__versions">{[...(versionsQuery.data?.data ?? [])].sort((a, b) => b.version - a.version).map((version) => <li key={version.id}><FileText size={18} /><div><strong>Version {version.version}{version.isCurrent ? " · Current" : ""}</strong><small>{version.fileName} · {displayDate(version.createdAt)}{version.changeSummary ? ` · ${version.changeSummary}` : ""}</small></div><Button onClick={() => getVersion(version.id, version.fileName)}>Download</Button></li>)}</ol> : <p>No version history is available yet.</p>}
          </QueryState>
        </div>}
        <div className="applicant-panel applicant-document-review__access">
          <div><h2>{record.legacyPublic ? "Legacy file access" : reviewerAccess ? "Shared with assigned mentor" : record.privateStorage ? "Private by default" : "Reviewer access"}</h2><p>{record.legacyPublic ? "Upload a new private version before changing reviewer access." : reviewerAccess ? "Your assigned mentor can review this file. You can revoke access at any time." : "This file is not shared with a university or mentor through this workspace."}</p></div>
          {(reviewerAccess || hasAssignedMentor) ? <Popconfirm title={reviewerAccess ? "Remove reviewer access?" : "Share with your assigned mentor?"} description={reviewerAccess ? "Your mentor will no longer be able to open this file." : "Only your current assigned mentor will gain access to this file."} onConfirm={toggleAccess}>
            <Button disabled={record.legacyPublic && !reviewerAccess} loading={accessState.isLoading}>{reviewerAccess ? "Remove access" : "Share with mentor"}</Button>
          </Popconfirm> : mentorCheckError ? <Alert type="warning" message="Could not check mentor access" action={<Button size="small" onClick={() => void refetchMentors()}>Retry</Button>} /> : <span>Sharing is available when a Full Support mentor is assigned.</span>}
        </div>
      </>}
    </QueryState>
    <Modal rootClassName="applicant-modal" title="Upload new version" open={modalOpen} footer={null} onCancel={() => setModalOpen(false)}>
      <Form form={form} layout="vertical" onFinish={submitVersion}>
        <Form.Item label="File" required><Upload.Dragger fileList={fileList} maxCount={1} beforeUpload={(next) => { setFile(next); setFileList([next]); return false; }} onRemove={() => { setFile(undefined); setFileList([]); }} accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"><UploadCloud size={28} /><p>Choose a new version of this document</p></Upload.Dragger></Form.Item>
        <Form.Item name="changeSummary" label="What changed? (optional)"><Input.TextArea rows={2} /></Form.Item>
        <p>Uploading a version preserves the earlier file.</p>
        <div className="applicant-actions applicant-actions--end"><Button onClick={() => setModalOpen(false)}>Cancel</Button><Button type="primary" htmlType="submit" loading={uploadState.isLoading}>Upload version</Button></div>
      </Form>
    </Modal>
  </ApplicantPage>;
}
