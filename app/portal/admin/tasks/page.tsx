import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import {
  EmptyState,
  FilterTabs,
  Notice,
  PageHeader,
  RecordRow,
  SectionCard,
} from "@/components/portal/ui/primitives";
import { SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { createTask, setTaskStatus } from "@/app/portal/actions/tasks";
import { TASK_PRIORITIES, listTasks, type OpsTask } from "@/lib/portal/tasks";
import { listAllUsers } from "@/lib/portal/queries";
import { formatDateTime, titleCase } from "@/lib/portal/format";

export const metadata = { title: "Tasks - AMG Operations" };
export const dynamic = "force-dynamic";

function priorityTone(priority: string) {
  if (priority === "urgent") return "danger" as const;
  if (priority === "high") return "warn" as const;
  if (priority === "low") return "neutral" as const;
  return "info" as const;
}

function taskMeta(task: OpsTask) {
  const overdue = task.due_at && task.status !== "done" && new Date(task.due_at) < new Date();
  return (
    <>
      {task.assignee ? <>Assigned to {task.assignee.full_name ?? task.assignee.email} · </> : null}
      {task.due_at ? (
        <span className={overdue ? "font-semibold text-[var(--deck-danger)]" : undefined}>
          Due {formatDateTime(task.due_at)}
        </span>
      ) : (
        "No due date"
      )}
      {task.related_label ? <> · {task.related_label}</> : null}
      {task.detail ? <span className="mt-1 block">{task.detail}</span> : null}
    </>
  );
}

export default async function OpsTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; success?: string; error?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const view = (params.view ?? "active") as "active" | "mine" | "done";
  const [tasks, admins] = await Promise.all([
    listTasks({ view, userId: user.id }),
    listAllUsers({ status: "approved" }),
  ]);
  const adminOptions = admins
    .filter((row) => row.role === "admin" || row.role === "super_admin")
    .map((row) => ({ value: row.id, label: row.full_name ?? row.email }));

  return (
    <>
      {params.success === "created" ? <Notice tone="success">Task created.</Notice> : null}
      {params.success === "updated" ? <Notice tone="success">Task updated.</Notice> : null}
      {params.error === "missing" ? <Notice tone="danger">Task title is required.</Notice> : null}
      {params.error === "save" ? <Notice tone="danger">Task could not be saved.</Notice> : null}

      <PageHeader
        eyebrow="AMG Operations"
        title="Tasks"
        description="Internal team to-dos with owners, due dates, and links back to the records they concern."
      />

      <SectionCard title="New Task" icon="plus">
        <form action={createTask} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="sm:col-span-2">
            <TextField label="Title" name="title" required placeholder="Confirm hangar space for N721AG reposition" />
          </div>
          <SelectField label="Priority" name="priority" defaultValue="normal" options={TASK_PRIORITIES} />
          <TextField label="Due" name="due_at" type="datetime-local" />
          <SelectField
            label="Assign To"
            name="assigned_to"
            defaultValue={user.id}
            options={adminOptions.length ? adminOptions : [{ value: user.id, label: user.name }]}
          />
          <div className="sm:col-span-2">
            <TextAreaField label="Detail" name="detail" placeholder="Anything the assignee needs to know…" />
          </div>
          <div className="flex items-end justify-end">
            <SubmitButton pendingText="Creating…">Create Task</SubmitButton>
          </div>
        </form>
      </SectionCard>

      <FilterTabs
        basePath="/portal/admin/tasks"
        param="view"
        current={view === "active" ? "" : view}
        options={[
          { label: "All Active", value: "" },
          { label: "Mine", value: "mine" },
          { label: "Completed", value: "done" },
        ]}
      />

      <SectionCard title={view === "done" ? "Completed Tasks" : "Open Tasks"} icon="check">
        {tasks.length === 0 ? (
          <EmptyState
            icon="check"
            title={view === "done" ? "Nothing completed yet" : "All clear"}
            description={
              view === "done"
                ? "Completed tasks will appear here."
                : "No open tasks in this view. Create one above."
            }
          />
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <RecordRow
                key={task.id}
                title={task.title}
                meta={taskMeta(task)}
                tone={
                  task.due_at && task.status !== "done" && new Date(task.due_at) < new Date()
                    ? "danger"
                    : "default"
                }
                trailing={
                  <>
                    <div className="flex gap-1.5">
                      <StatusBadge label={titleCase(task.priority)} tone={priorityTone(task.priority)} />
                      <StatusBadge
                        label={titleCase(task.status)}
                        tone={task.status === "done" ? "success" : task.status === "in_progress" ? "accent" : "neutral"}
                      />
                    </div>
                    <div data-portal-action-bar className="flex flex-wrap justify-end gap-1.5">
                      {task.status !== "done" ? (
                        <>
                          {task.status === "open" ? (
                            <form action={setTaskStatus}>
                              <input type="hidden" name="task_id" value={task.id} />
                              <input type="hidden" name="status" value="in_progress" />
                              <input type="hidden" name="back_to" value={`/portal/admin/tasks?view=${view}`} />
                              <SubmitButton size="sm" variant="ghost" pendingText="…">Start</SubmitButton>
                            </form>
                          ) : null}
                          <form action={setTaskStatus}>
                            <input type="hidden" name="task_id" value={task.id} />
                            <input type="hidden" name="status" value="done" />
                            <input type="hidden" name="back_to" value={`/portal/admin/tasks?view=${view}`} />
                            <SubmitButton size="sm" variant="outline" pendingText="…">Complete</SubmitButton>
                          </form>
                        </>
                      ) : (
                        <form action={setTaskStatus}>
                          <input type="hidden" name="task_id" value={task.id} />
                          <input type="hidden" name="status" value="open" />
                          <input type="hidden" name="back_to" value="/portal/admin/tasks?view=done" />
                          <SubmitButton size="sm" variant="ghost" pendingText="…">Reopen</SubmitButton>
                        </form>
                      )}
                    </div>
                  </>
                }
              />
            ))}
          </div>
        )}
      </SectionCard>

      <p className="text-xs text-[var(--deck-text-3)]">
        Tip: tasks assigned to another admin notify them in-portal and by their configured delivery
        channel. Link tasks to records from{" "}
        <Link href="/portal/admin/crm" className="font-semibold text-[var(--deck-gold-deep)] hover:underline">
          the pipeline
        </Link>{" "}
        or mission pages as workflows grow.
      </p>
    </>
  );
}
