import { useRef, useState, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "src/components/student-hub/ui/EmptyState";
import { Button, Form, Input, Modal, Popconfirm, Select, Upload, message } from "antd";
import type { UploadFile } from "antd";
import { Download, FileText, Info, Plus, Trash2, UploadCloud } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  DocumentType,
  useDeleteDocumentMutation,
  useDownloadDocumentMutation,
  useGetDocumentsQuery,
  useUploadDocumentMutation,
} from "src/app/services/student-hub/documentManagementApi";
import type { StudentDocument } from "src/app/services/student-hub/types";
import { useGetCollegeApplicationsQuery } from "src/app/services/student-hub/applicationTrackingApi";
import {
  ApplicantPage,
  Breadcrumb,
  QueryState,
  RelatedApplicationLabel,
  displayDate,
} from "./ApplicantPage";
import { useApplicantOverview } from "./ApplicantOverviewContext";

import SearchButton from 'src/components/common/searchButton';
import { useSegmentThumb, SegmentThumb } from 'src/components/student-hub/ui/SegmentThumb';
const documentLabels: Record<string, string> = {
  transcript: "Transcript",
  test_score: "Test score",
  recommendation: "Recommendation",
  essay: "Essay",
  resume: "Resume / CV",
  portfolio: "Portfolio",
  certificate: "Certificate",
  other: "Other",
};
const masterDocumentLabels: Record<string, string> = {
  ...documentLabels,
  transcript: "University transcript / diploma",
  recommendation: "Academic or professional reference",
  essay: "Statement of purpose / personal statement",
  resume: "CV / résumé",
};
const masterDocumentOrder = [
  DocumentType.RESUME,
  DocumentType.TRANSCRIPT,
  DocumentType.ESSAY,
  DocumentType.RECOMMENDATION,
  DocumentType.TEST_SCORE,
  DocumentType.PORTFOLIO,
  DocumentType.CERTIFICATE,
  DocumentType.OTHER,
];
const formatSize = (size?: number) =>
  !size
    ? "Size unavailable"
    : size < 1024 * 1024
      ? `${Math.ceil(size / 1024)} KB`
      : `${(size / 1024 / 1024).toFixed(1)} MB`;

const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".webp"];
const isAccepted = (name: string) => ACCEPTED_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext));
const hasFiles = (event: DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes("Files");

export default function ApplicantDocumentsPage() {
  const { t } = useTranslation();
  const isMasters = useApplicantOverview().currentData?.profile?.targetDegree === "master";
  const labels = isMasters ? masterDocumentLabels : documentLabels;
  const query = useGetDocumentsQuery({ page: 1, limit: 100 });
  const [params, setParams] = useSearchParams();
  const [form] = Form.useForm<{ documentType: DocumentType; applicationId?: string; category?: "uploaded" | "draft" }>();
  const applications = useGetCollegeApplicationsQuery({ page: 1, limit: 100 });
  const [file, setFile] = useState<File>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "application" | "drafts">("all");
  const tabsThumb = useSegmentThumb<HTMLDivElement>(tab);
  const [upload, uploadState] = useUploadDocumentMutation();
  const [remove] = useDeleteDocumentMutation();
  const [download] = useDownloadDocumentMutation();
  const objectUrl = useRef<string>();
  const navigate = useNavigate();
  // Drag a file onto the documents area: the Add document dialog opens with it attached.
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const open = () => {
    form.setFieldsValue({ documentType: DocumentType.TRANSCRIPT, category: "uploaded" });
    const next = new URLSearchParams(params);
    next.set("action", "upload");
    setParams(next);
  };
  const attach = (nextFile: File) => {
    setFile(nextFile);
    setFileList([{ uid: `drop-${Date.now()}`, name: nextFile.name, size: nextFile.size, type: nextFile.type, status: "done", originFileObj: nextFile as UploadFile["originFileObj"] }]);
  };
  const onDragEnter = (event: DragEvent) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  };
  const onDragOver = (event: DragEvent) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };
  const onDragLeave = (event: DragEvent) => {
    if (!hasFiles(event)) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };
  const onDrop = (event: DragEvent) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (!dropped) return;
    if (!isAccepted(dropped.name)) {
      message.error(t("studentHub.documents.dropUnsupported", "Use a PDF, Word or image file."));
      return;
    }
    open();
    attach(dropped);
  };
  const close = () => {
    const next = new URLSearchParams(params);
    next.delete("action");
    setParams(next);
    setFile(undefined);
    setFileList([]);
    form.resetFields();
  };
  const submit = async ({ documentType, applicationId, category }: { documentType: DocumentType; applicationId?: string; category?: "uploaded" | "draft" }) => {
    if (!file) {
      message.error("Choose a file to upload.");
      return;
    }
    const body = new FormData();
    body.append("file", file);
    body.append("documentType", documentType);
    body.append("metadata", JSON.stringify({
      ...(applicationId ? { collegeApplicationId: applicationId } : {}),
      status: category === "draft" ? "draft" : "uploaded",
    }));
    try {
      await upload(body).unwrap();
      message.success("Document uploaded.");
      close();
    } catch {
      message.error(
        "Could not upload this document. Choose the file and try again.",
      );
    }
  };
  const getFile = async (document: StudentDocument) => {
    try {
      const blob = await download(document.id).unwrap();
      objectUrl.current = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = objectUrl.current;
      anchor.download = document.fileName;
      anchor.click();
      URL.revokeObjectURL(objectUrl.current);
    } catch {
      message.error("Could not download this document.");
    }
  };
  const documents = (query.data?.data ?? []).filter((document) => {
    const matchesSearch = `${document.fileName} ${labels[document.documentType] ?? document.documentType}`
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase());
    if (!matchesSearch) return false;
    if (tab === "application") return Boolean(document.metadata?.collegeApplicationId || document.metadata?.applicationId);
    if (tab === "drafts") return document.metadata?.status === "draft";
    return true;
  });
  return (
    <ApplicantPage
      title="Your documents"
      subtitle="Keep reusable application files together."
      actions={
        <Button type="primary" icon={<Plus size={16} />} onClick={open}>
          Add document
        </Button>
      }
    >
      <Breadcrumb>Documents</Breadcrumb>
      <form role="search" className="applicant-glass-search applicant-document-search-bar" onSubmit={(event) => event.preventDefault()}>
        <Input
          aria-label="Search documents"
          placeholder="Search file name or document type"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          allowClear
        />
        <SearchButton type="submit" size={48} className="applicant-glass-search__btn" />
      </form>
      <div ref={tabsThumb.ref} data-lens={tabsThumb.lens} className="applicant-tabs" role="tablist" aria-label="Document filters">
        <SegmentThumb style={tabsThumb.style} />
        {([
          ["all", "All files"],
          ["application", "Application files"],
          ["drafts", "Private drafts"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            className={tab === value ? "is-active" : ""}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        className={`applicant-dropzone${dragging ? " is-dragging" : ""}`}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
      {dragging && (
        <div className="applicant-dropzone__overlay" aria-hidden>
          <UploadCloud size={28} />
          <strong>{t("studentHub.documents.dropTitle", "Drop to add this file")}</strong>
          <span>{t("studentHub.documents.dropTypes", "PDF, Word or image files")}</span>
        </div>
      )}
      <QueryState
        loading={query.isLoading}
        error={query.isError}
        retry={query.refetch}
      >
        {!documents.length ? (
          <EmptyState
            panel
            fill
            level={2}
            icon={UploadCloud}
            title={search || tab !== "all" ? "No matching files." : "Your document library is empty."}
            description={search || tab !== "all"
              ? "Try another search or choose All files to see your library."
              : "Add a transcript, test score, CV or other reusable application file."}
            actions={
              <Button type="primary" icon={<Plus size={16} />} onClick={open}>
                {t("studentHub.documents.add", "Add document")}
              </Button>
            }
          >
            <p className="applicant-dropzone__hint">{t("studentHub.documents.dropHint", "or drag a file here")}</p>
          </EmptyState>
        ) : (
          <div className="applicant-panel applicant-document-list">
            {documents.map((document) => (
              <div className="applicant-document" key={document.id}>
                <span className="applicant-document__icon">
                  <FileText size={22} />
                </span>
                <div>
                  <strong>{document.fileName}</strong>
                  <small>
                    {labels[document.documentType] ??
                      document.documentType}{" "}
                    · {formatSize(document.fileSize)} · Added{" "}
                    {displayDate(document.createdAt)}
                  </small>
                </div>
                <span className={`applicant-status${document.isVerified ? " is-verified" : ""}`}>
                  {document.reviewStatus === "approved" || document.reviewStatus === "needs_revision"
                    ? "Feedback ready"
                    : document.reviewStatus === "pending" || document.reviewStatus === "in_progress"
                      ? "In review"
                      : document.isVerified ? "Verified" : document.metadata?.status === "draft" ? "Draft" : "Uploaded"}
                </span>
                <span className="applicant-document__access">{document.legacyPublic ? "Legacy file" : document.reviewerAccess ? "Assigned mentor" : document.privateStorage ? "Only you" : "Access to verify"}</span>
                <Button onClick={() => navigate(`/student-hub/documents/${encodeURIComponent(document.id)}`)}>
                  {document.documentType === DocumentType.ESSAY ? "Review" : "View"}
                </Button>
                <Button
                  icon={<Download size={16} />}
                  onClick={() => getFile(document)}
                >
                  Download
                </Button>
                <Popconfirm
                  title="Delete this document?"
                  description="This removes the file from your library."
                  onConfirm={async () => {
                    try {
                      await remove(document.id).unwrap();
                      message.success("Document deleted.");
                    } catch {
                      message.error("Could not delete this document.");
                    }
                  }}
                >
                  <Button
                    danger
                    aria-label={`Delete ${document.fileName}`}
                    icon={<Trash2 size={16} />}
                  />
                </Popconfirm>
              </div>
            ))}
          </div>
        )}
      </QueryState>
      </div>
      <Modal
        rootClassName="applicant-modal"
        title="Add document"
        open={params.get("action") === "upload"}
        onCancel={close}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item
            name="documentType"
            label="Document type"
            rules={[{ required: true }]}
          >
            <Select
              options={(isMasters ? masterDocumentOrder : Object.values(DocumentType)).map((value) => ({
                value,
                label: labels[value],
              }))}
            />
          </Form.Item>
          <Form.Item label="File" required>
            <Upload.Dragger
              fileList={fileList}
              maxCount={1}
              beforeUpload={(nextFile) => {
                setFile(nextFile);
                setFileList([nextFile]);
                return false;
              }}
              onRemove={() => {
                setFile(undefined);
                setFileList([]);
              }}
              accept={ACCEPTED_EXTENSIONS.join(",")}
            >
              <UploadCloud size={30} />
              <p>Choose a file or drag it here</p>
              <small>PDF, Word or image files</small>
            </Upload.Dragger>
          </Form.Item>
          <Form.Item name="applicationId" label="Related application">
            <Select
              allowClear
              placeholder="Keep in general library"
              loading={applications.isLoading}
              options={(applications.data?.data ?? []).map((app) => ({
                value: app.id,
                label: <RelatedApplicationLabel application={app} />,
              }))}
            />
          </Form.Item>
          <Form.Item name="category" label="File state">
            <Select options={[{ value: "uploaded", label: "Uploaded file" }, { value: "draft", label: "Private draft" }]} />
          </Form.Item>
          <p className="applicant-document-upload-note">
            This library helps you prepare applications. Uploading a document
            does not send it to a university.
          </p>
          <div className="applicant-actions applicant-actions--end">
            <Button onClick={close}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={uploadState.isLoading}
              disabled={!file}
            >
              Upload document
            </Button>
          </div>
        </Form>
      </Modal>
    </ApplicantPage>
  );
}
