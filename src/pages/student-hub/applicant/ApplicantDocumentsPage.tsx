import { useRef, useState } from "react";
import { Button, Form, Input, Modal, Popconfirm, Select, Upload, message } from "antd";
import type { UploadFile } from "antd";
import { Download, FileText, Info, Plus, Search, Trash2, UploadCloud } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
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

export default function ApplicantDocumentsPage() {
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
  const [upload, uploadState] = useUploadDocumentMutation();
  const [remove] = useDeleteDocumentMutation();
  const [download] = useDownloadDocumentMutation();
  const objectUrl = useRef<string>();
  const open = () => {
    form.setFieldsValue({ documentType: DocumentType.TRANSCRIPT, category: "uploaded" });
    const next = new URLSearchParams(params);
    next.set("action", "upload");
    setParams(next);
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
      subtitle={isMasters
        ? "Keep your graduate application files together. Each program may ask for a different set."
        : "Keep reusable application files together."}
      actions={
        <Button type="primary" icon={<Plus size={16} />} onClick={open}>
          Add document
        </Button>
      }
    >
      <Breadcrumb>Documents</Breadcrumb>
      <div className="applicant-document-toolbar">
        <Input
          className="applicant-document-search"
          aria-label="Search documents"
          placeholder="Search file name or document type"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          prefix={<Search size={18} aria-hidden="true" />}
          allowClear
        />
      </div>
      <div className="applicant-tabs" role="tablist" aria-label="Document filters">
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
      <QueryState
        loading={query.isLoading}
        error={query.isError}
        retry={query.refetch}
      >
        {!documents.length ? (
          <div className="applicant-panel applicant-empty">
            <UploadCloud size={38} />
            <h2>{search || tab !== "all" ? "No matching files." : "Your document library is empty."}</h2>
            <p>
              {search || tab !== "all"
                ? "Try another search or choose All files to see your library."
                : isMasters
                ? "Add your CV, university transcript or diploma, statement, and references as you prepare them."
                : "Add a transcript, test score or other reusable application file."}
            </p>
          </div>
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
                <Link className="ant-btn ant-btn-default" to={`/student-hub/documents/${encodeURIComponent(document.id)}`}>
                  {document.documentType === DocumentType.ESSAY ? "Review" : "View"}
                </Link>
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
      {isMasters && (
        <div className="applicant-document-privacy" role="note">
          <Info size={18} aria-hidden />
          <div><strong>New files are private by default</strong><p>Files in this library are not sent to universities. Reviewer access is controlled on each document. Older uploads marked “Legacy file” may need a new private version.</p></div>
        </div>
      )}
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
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
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
