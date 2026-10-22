import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  message,
} from "antd";
import dayjs from "dayjs";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  useCompleteTaskMutation,
  useCreateApplicationTaskMutation,
  useDeleteApplicationTaskMutation,
  useGetApplicationTaskQuery,
  useGetApplicationTasksQuery,
  useGetCollegeApplicationsQuery,
  useUpdateApplicationTaskMutation,
} from "src/app/services/student-hub/applicationTrackingApi";
import type {
  ApplicationTask,
  CreateApplicationTaskRequest,
} from "src/app/services/student-hub/types";
import {
  ApplicantPage,
  Breadcrumb,
  QueryState,
  RelatedApplicationLabel,
  displayDate,
} from "./ApplicantPage";
import MentorAssignedTasks from "./MentorAssignedTasks";

type TaskForm = Omit<CreateApplicationTaskRequest, "dueDate"> & {
  dueDate?: dayjs.Dayjs;
};

export default function ApplicantTasksPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const tasksQuery = useGetApplicationTasksQuery({ page, limit: 100 });
  const applicationsQuery = useGetCollegeApplicationsQuery({
    page: 1,
    limit: 100,
  });
  const [createTask, createState] = useCreateApplicationTaskMutation();
  const [updateTask, updateState] = useUpdateApplicationTaskMutation();
  const [completeTask] = useCompleteTaskMutation();
  const [deleteTask] = useDeleteApplicationTaskMutation();
  const [editing, setEditing] = useState<ApplicationTask | null>(null);
  const [changingIds, setChangingIds] = useState<Set<string>>(new Set());
  const [form] = Form.useForm<TaskForm>();
  const status = params.get("status") ?? "open";
  const application = params.get("application") ?? "all";
  const sort = params.get("sort") ?? "due";
  const tasks = tasksQuery.data?.data ?? [];
  const applications = applicationsQuery.data?.data ?? [];
  const applicationLookup = new Map(applications.map((item) => [item.id, item]));
  const visible = useMemo(
    () =>
      tasks
        .filter(
          (item) =>
            status === "all" ||
            (status === "open"
              ? !["completed", "cancelled"].includes(item.status)
              : item.status === status),
        )
        .filter(
          (item) =>
            application === "all" || item.collegeApplicationId === application,
        )
        .sort((a, b) => {
          if (sort === "recent") return b.createdAt.localeCompare(a.createdAt);
          if (sort === "priority") {
            const rank = { urgent: 0, high: 1, medium: 2, low: 3 };
            return rank[a.priority] - rank[b.priority] || (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
          }
          return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
        }),
    [tasks, status, application, sort],
  );
  const action = params.get("action");
  const taskId = params.get("task");
  const editingQuery = useGetApplicationTaskQuery(taskId ?? "", {
    skip: action !== "edit" || !taskId,
    refetchOnMountOrArgChange: true,
  });
  useEffect(() => {
    if (action === "new") {
      setEditing(null);
      form.setFieldsValue({
        taskType: "other",
        priority: "medium",
        status: "pending",
        collegeApplicationId: application === "all" ? undefined : application,
      });
    } else if (action === "edit" && taskId && !editingQuery.isFetching && editingQuery.currentData?.data.id === taskId) {
      const task = editingQuery.currentData!.data;
      setEditing(task);
      form.setFieldsValue({
        ...task,
        dueDate: task.dueDate ? dayjs(task.dueDate) : undefined,
      });
    }
  }, [action, taskId, editingQuery.currentData?.data, editingQuery.isFetching]);
  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if ((value === "all" && key !== "status") || (key === "status" && value === "open") || (key === "sort" && value === "due")) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setParams(next);
  };
  const open = (task?: ApplicationTask) => {
    setEditing(task ?? null);
    form.resetFields();
    form.setFieldsValue(
      task
        ? { ...task, dueDate: task.dueDate ? dayjs(task.dueDate) : undefined }
        : {
            taskType: "other",
            priority: "medium",
            status: "pending",
            collegeApplicationId:
              application === "all" ? undefined : application,
          },
    );
    const next = new URLSearchParams(params);
    next.set("action", task ? "edit" : "new");
    if (task) next.set("task", task.id);
    else next.delete("task");
    setParams(next);
  };
  const close = () => {
    const next = new URLSearchParams(params);
    next.delete("action");
    next.delete("task");
    setParams(next);
    setEditing(null);
    form.resetFields();
  };
  const save = async (values: TaskForm) => {
    const payload: CreateApplicationTaskRequest = {
      ...values,
      dueDate: values.dueDate?.format("YYYY-MM-DD") ?? null,
      collegeApplicationId: values.collegeApplicationId ?? null,
    };
    try {
      if (action === "edit") {
        if (!editing) {
          message.error("Wait for the task to finish loading.");
          return;
        }
        await updateTask({ id: editing.id, data: payload }).unwrap();
      } else await createTask(payload).unwrap();
      message.success(action === "edit" ? "Task updated." : "Task added.");
      close();
    } catch {
      message.error("Could not save this task. Your entries are still here.");
    }
  };
  const toggle = async (task: ApplicationTask, checked: boolean) => {
    if (changingIds.has(task.id)) return;
    setChangingIds((current) => new Set(current).add(task.id));
    try {
      if (checked)
        await completeTask({
          id: task.id,
          completedDate: new Date().toISOString(),
        }).unwrap();
      else
        await updateTask({
          id: task.id,
          data: { status: "pending", completedAt: null },
        }).unwrap();
    } catch {
      message.error("Could not update this task.");
    } finally {
      setChangingIds((current) => {
        const next = new Set(current);
        next.delete(task.id);
        return next;
      });
    }
  };
  return (
    <ApplicantPage
      title="Your tasks"
      subtitle="Plan the work behind every application."
      actions={
        <Button type="primary" icon={<Plus size={16} />} onClick={() => open()}>
          Add task
        </Button>
      }
    >
      <Breadcrumb>Tasks</Breadcrumb>
      <MentorAssignedTasks selectedTaskId={params.get("mentorTask")} />
      <h2>My tasks</h2>
      <div className="applicant-filters applicant-panel">
        <label>
          Status
          <Select
            value={status}
            onChange={(value) => setFilter("status", value)}
            options={[
              { value: "open", label: "Open tasks" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
              { value: "all", label: "All tasks" },
            ]}
          />
        </label>
        <label>
          Application
          <Select
            value={application}
            loading={applicationsQuery.isLoading}
            status={applicationsQuery.isError ? "error" : undefined}
            disabled={applicationsQuery.isError}
            onChange={(value) => setFilter("application", value)}
            options={[
              {
                value: "all",
                label: applicationsQuery.isError
                  ? "Applications unavailable"
                  : "All applications",
              },
              ...applications.map((item) => ({
                value: item.id,
                label: <RelatedApplicationLabel application={item} />,
              })),
            ]}
          />
        </label>
        <label>
          Sort
          <Select
            value={sort}
            onChange={(value) => setFilter("sort", value)}
            options={[
              { value: "due", label: "Due date" },
              { value: "priority", label: "Priority" },
              { value: "recent", label: "Recently added" },
            ]}
          />
        </label>
      </div>
      <QueryState
        loading={tasksQuery.isLoading}
        error={tasksQuery.isError}
        retry={tasksQuery.refetch}
      >
        <div className="applicant-panel">
          {!visible.length ? (
            <div className="applicant-empty">
              <h2>{tasks.length ? "No tasks match these filters." : "No tasks here yet."}</h2>
              <p>
                {tasks.length
                  ? "Try another status or application to find your tasks."
                  : "Add a task when you want a reminder tied to your preparation."}
              </p>
              {tasks.length > 0 && <Button onClick={() => {
                const next = new URLSearchParams(params);
                next.set("status", "all");
                next.delete("application");
                next.delete("page");
                setParams(next);
              }}>Show all tasks</Button>}
            </div>
          ) : (
            visible.map((task) => (
              <div
                className={`applicant-task${task.status === "completed" ? " applicant-task--complete" : ""}`}
                key={task.id}
              >
                <Checkbox
                  disabled={changingIds.has(task.id)}
                  checked={task.status === "completed"}
                  onChange={(event) => toggle(task, event.target.checked)}
                  aria-label={`Mark ${task.title} complete`}
                />
                <div>
                  <strong>{task.title}</strong>
                  <small>
                    {task.description ||
                      (task.collegeApplicationId
                        ? applicationLookup.get(task.collegeApplicationId)
                          ? <RelatedApplicationLabel application={applicationLookup.get(task.collegeApplicationId)!} />
                          : applicationsQuery.isError
                            ? "Related application unavailable"
                            : "Related application"
                        : "Personal task")}
                  </small>
                </div>
                <span>
                  {task.dueDate ? displayDate(task.dueDate) : "No due date"}
                </span>
                <span className="applicant-status">{task.priority}</span>
                <Button
                  aria-label={`Edit ${task.title}`}
                  icon={<MoreHorizontal size={18} />}
                  onClick={() => open(task)}
                />
              </div>
            ))
          )}
        </div>
        {(tasksQuery.data?.totalPages ?? 1) > 1 && (
          <div className="applicant-actions applicant-actions--end">
            <Button
              disabled={page <= 1}
              onClick={() => setFilter("page", String(page - 1))}
            >
              Previous
            </Button>
            <span>
              Page {page} of {tasksQuery.data?.totalPages}
            </span>
            <Button
              disabled={page >= (tasksQuery.data?.totalPages ?? 1)}
              onClick={() => setFilter("page", String(page + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </QueryState>
      <Modal
        rootClassName="applicant-modal"
        title={action === "edit" ? "Edit task" : "Add task"}
        open={action === "new" || action === "edit"}
        onCancel={close}
        footer={null}
        destroyOnClose
      >
        {action === "edit" && editingQuery.isLoading ? (
          <div className="applicant-panel">
            <p>Loading task…</p>
          </div>
        ) : action === "edit" && (editingQuery.isError || !editing) ? (
          <div className="applicant-empty">
            <h3>We couldn’t load this task.</h3>
            <Button onClick={close}>Close</Button>
          </div>
        ) : (
          <Form form={form} layout="vertical" onFinish={save} preserve>
            <Form.Item
              name="title"
              label="Task title"
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: "Add a task title.",
                },
              ]}
            >
              <Input placeholder="Request recommendation letter" />
            </Form.Item>
            <div className="applicant-form-grid">
              <Form.Item name="dueDate" label="Due date">
                <DatePicker />
              </Form.Item>
              <Form.Item name="priority" label="Priority">
                <Select
                  options={["low", "medium", "high", "urgent"].map((value) => ({
                    value,
                    label: value[0].toUpperCase() + value.slice(1),
                  }))}
                />
              </Form.Item>
            </div>
            <div className="applicant-form-grid">
              <Form.Item
                name="taskType"
                label="Task type"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    "essay",
                    "recommendation",
                    "transcript",
                    "test_score",
                    "interview",
                    "financial_aid",
                    "supplement",
                    "other",
                  ].map((value) => ({
                    value,
                    label: value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase()),
                  }))}
                />
              </Form.Item>
              <Form.Item
                name="collegeApplicationId"
                label="Related application"
              >
                <Select
                  allowClear
                  placeholder="Keep as a personal task"
                  options={applications.map((item) => ({
                    value: item.id,
                    label: <RelatedApplicationLabel application={item} />,
                  }))}
                />
              </Form.Item>
            </div>
            <Form.Item name="description" label="Notes">
              <Input.TextArea rows={3} />
            </Form.Item>
            <div className="applicant-actions applicant-actions--end">
              {editing && (
                <Popconfirm
                  title="Delete this task?"
                  onConfirm={async () => {
                    try {
                      await deleteTask(editing.id).unwrap();
                      message.success("Task deleted.");
                      close();
                    } catch {
                      message.error("Could not delete this task.");
                    }
                  }}
                >
                  <Button danger icon={<Trash2 size={15} />}>
                    Delete
                  </Button>
                </Popconfirm>
              )}
              <Button onClick={close}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createState.isLoading || updateState.isLoading}
              >
                Save task
              </Button>
            </div>
          </Form>
        )}
      </Modal>
    </ApplicantPage>
  );
}
