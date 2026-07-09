import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { isAdminRole, type PortalRole } from "@/lib/portal/constants";

export const ADMIN_MESSAGE_ALIAS = "AMG Operations";

type MessageThread = Tables<"message_threads">;
type Message = Tables<"messages">;

export type MessageSender = {
  full_name: string | null;
  email: string;
  company_name: string | null;
  role: PortalRole | string | null;
};

export type MessageForDisplay = Message & {
  sender: MessageSender | null;
};

export async function getThreadWithMessagesForDisplay(
  threadId: string,
): Promise<{ thread: MessageThread; messages: MessageForDisplay[] } | null> {
  const db = await createServiceClient();
  const { data: thread } = await db
    .from("message_threads")
    .select("*")
    .eq("id", threadId)
    .maybeSingle();

  if (!thread) return null;

  const { data: messages } = await db
    .from("messages")
    .select("*, sender:sender_id(full_name,email,company_name,role)")
    .eq("thread_id", threadId)
    .order("created_at")
    .returns<MessageForDisplay[]>();

  return { thread, messages: messages ?? [] };
}

export function messageSenderName(message: Pick<MessageForDisplay, "sender" | "sender_email" | "sender_id">, currentUserId: string, currentUserRole: PortalRole) {
  if (isAdminRole(message.sender?.role ?? "")) return ADMIN_MESSAGE_ALIAS;
  if (message.sender_id === currentUserId && !isAdminRole(currentUserRole)) return "You";
  return message.sender?.full_name ?? message.sender?.email ?? message.sender_email;
}

export function messageSenderInitialsSource(message: Pick<MessageForDisplay, "sender" | "sender_email">) {
  if (isAdminRole(message.sender?.role ?? "")) return ADMIN_MESSAGE_ALIAS;
  return message.sender?.full_name ?? message.sender?.email ?? message.sender_email;
}

export function outboundMessageSenderLabel(sender: { role: PortalRole; name: string }) {
  return isAdminRole(sender.role) ? ADMIN_MESSAGE_ALIAS : sender.name;
}
