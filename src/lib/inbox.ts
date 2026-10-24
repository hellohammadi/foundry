// Per-user history and reminders, delivered with DNotifier real-time messaging (pub/sub).
// Foundry publishes messages from "foundry-server" to the user's channel with saveHistory,
// and reads them back with fetchChatHistory. The browser never sees DNotifier credentials.
import { DNotifier } from "@dnotifier-realtime/dnotifier";
import WebSocket from "ws";
import { aiConfig } from "./llm";
import type { InboxItem, NewInboxItem } from "./types";

const APP_TAG = "foundry";
const CONNECT_TIMEOUT_MS = 10_000;

export function isValidUserId(id: unknown): id is string {
  return typeof id === "string" && /^fd-[a-z0-9]{8,32}$/.test(id);
}

type Socket = { notifier: DNotifier; inbox: unknown[] };

// Opens a WebSocket client and resolves once DNotifier has authenticated it.
async function openSocket(userId: string): Promise<Socket> {
  const inbox: unknown[] = [];
  let ready!: () => void;
  const isReady = new Promise<void>((resolve) => (ready = resolve));
  const notifier = new DNotifier({
    appId: aiConfig.appId,
    secret: aiConfig.secret,
    transport: "ws",
    userId,
    url: undefined,
    WebSocketImpl: WebSocket,
    onConnected: () => ready(),
    onMessage: (msg: { payload?: { toJSON?: () => unknown } }) => inbox.push(msg?.payload?.toJSON?.()),
    onDisconnected: () => {},
  });
  await notifier.connect();
  await Promise.race([
    isReady,
    new Promise((_, reject) => setTimeout(() => reject(new Error("DNotifier connection timed out")), CONNECT_TIMEOUT_MS)),
  ]);
  return { notifier, inbox };
}

function close(socket: Socket) {
  (socket.notifier.transport as { close?: () => void }).close?.();
}

let sender: Promise<Socket> | null = null;

function getSender(): Promise<Socket> {
  sender ??= openSocket(aiConfig.userId).catch((err) => {
    sender = null;
    throw err;
  });
  return sender;
}

export function messagingEnabled(): boolean {
  return Boolean(aiConfig.appId && aiConfig.secret);
}

// Publishes one item to the user's channel; it is stored in DNotifier chat history.
export async function publish(userId: string, item: NewInboxItem): Promise<void> {
  const { notifier } = await getSender();
  await notifier.send({
    senderId: aiConfig.userId,
    receiverId: userId,
    receiverIds: undefined,
    data: { type: "text", text: item.title, app: APP_TAG, item },
    saveHistory: true,
  });
}

type HistoryEntry = { id: string; content?: string; created_at?: string };

// Reads the user's Foundry items back from DNotifier chat history, newest first.
export async function readInbox(userId: string): Promise<InboxItem[]> {
  const socket = await openSocket(userId);
  try {
    await socket.notifier.fetchChatHistory({ senderId: userId, receiverIds: [aiConfig.userId] } as { senderId: string });
    const deadline = Date.now() + 6000;
    let history: HistoryEntry[] | undefined;
    while (!history && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 200));
      const found = socket.inbox.find((m) => (m as { type?: string })?.type === "chat_history") as { history?: HistoryEntry[] } | undefined;
      history = found?.history;
    }
    // Only the parsed message content is returned; raw entries carry auth metadata.
    return (history ?? [])
      .flatMap((entry) => {
        try {
          const data = JSON.parse(entry.content ?? "{}");
          if (data.app !== APP_TAG || !data.item) return [];
          return [{ ...data.item, id: entry.id, at: Date.parse(entry.created_at ?? "") || 0 } as InboxItem];
        } catch {
          return [];
        }
      })
      .sort((a, b) => b.at - a.at);
  } finally {
    close(socket);
  }
}
