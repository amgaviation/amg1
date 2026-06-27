import assert from "node:assert/strict";
import { isMissingCommunicationSchemaError, persistCrewEmailDraft } from "../lib/portal/crew-email-storage";

type Call = {
  table: string;
  operation: string;
  payload?: unknown;
};

const missingCommunicationThread = {
  code: "PGRST205",
  details: null,
  hint: "Perhaps you meant the table 'public.message_threads'",
  message: "Could not find the table 'public.communication_threads' in the schema cache",
};

class FakeQuery {
  private operation = "select";
  private payload: unknown;

  constructor(
    private readonly table: string,
    private readonly calls: Call[]
  ) {}

  insert(payload: unknown) {
    this.operation = "insert";
    this.payload = payload;
    this.calls.push({ table: this.table, operation: "insert", payload });
    return this;
  }

  select() {
    return this;
  }

  eq() {
    return this;
  }

  single() {
    if (this.table === "communication_threads") {
      return Promise.resolve({ data: null, error: missingCommunicationThread });
    }
    if (this.table === "message_threads") {
      return Promise.resolve({ data: { id: "legacy-thread-id" }, error: null });
    }
    if (this.table === "messages") {
      return Promise.resolve({ data: { id: "legacy-message-id" }, error: null });
    }
    return Promise.resolve({ data: null, error: null });
  }

  then<TResult1 = { data: unknown; error: unknown }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    let result: { data: unknown; error: unknown };
    if (this.table === "profiles") {
      result = { data: [{ id: "admin-id" }], error: null };
    } else {
      result = { data: null, error: null };
    }
    return Promise.resolve(result).then(onfulfilled, onrejected);
  }
}

async function main() {
  const calls: Call[] = [];
  const client = {
    from(table: string) {
      return new FakeQuery(table, calls);
    },
  };

  assert.equal(isMissingCommunicationSchemaError(missingCommunicationThread), true);

  const draft = await persistCrewEmailDraft(client, {
    user: { id: "admin-id", email: "ops@example.com" },
    crewId: "crew-id",
    recipientEmail: "crew@example.com",
    recipientName: "Crew Member",
    missionId: null,
    subject: "AMG Crew Network update",
    bodyText: "Hello crew member.",
    bodyHtml: "<p>Hello crew member.</p>",
    providerName: "resend",
    providerConfigured: true,
    templateKey: "general_crew_communication",
    variables: { crew_full_name: "Crew Member" },
    threadPublicId: "THR-TEST",
    messagePublicId: "MSG-TEST",
    timestamp: "2026-06-27T05:44:49.495Z",
  });

  assert.deepEqual(draft, {
    mode: "legacy",
    threadId: "legacy-thread-id",
    messageId: "legacy-message-id",
    threadToken: "legacy-thread-id",
  });

  assert.equal(calls.some((call) => call.table === "communication_threads" && call.operation === "insert"), true);
  assert.equal(calls.some((call) => call.table === "message_threads" && call.operation === "insert"), true);
  assert.equal(calls.some((call) => call.table === "thread_members" && call.operation === "insert"), true);
  assert.equal(calls.some((call) => call.table === "messages" && call.operation === "insert"), true);
  assert.equal(calls.some((call) => call.table === "communication_messages" && call.operation === "insert"), false);

  console.log("crew email schema fallback verified");
}

void main();
