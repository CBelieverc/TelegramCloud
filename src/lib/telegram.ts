const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;
const FILE_BASE = `https://api.telegram.org/file/bot${BOT_TOKEN}`;

export function isBotConfigured(): boolean {
  return BOT_TOKEN.length > 0;
}

async function telegramApi(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description ?? `Telegram API error: ${method}`);
  }
  return data.result;
}

export async function createPrivateGroup(
  userId: number
): Promise<{ chatId: string; inviteLink: string }> {
  const title = `My Cloud Storage`;

  const result = await telegramApi("createNewChannel", {
    title,
    is_channel: false,
  });

  const chatId = String(result.id);

  try {
    await telegramApi("setChatDescription", {
      chat_id: chatId,
      description: `Private cloud storage for user #${userId}`,
    });
  } catch {
    // description may fail, not critical
  }

  let inviteLink = "";
  try {
    const linkResult = await telegramApi("createChatInviteLink", {
      chat_id: chatId,
    });
    inviteLink = linkResult.invite_link ?? "";
  } catch {
    // invite link may fail
  }

  return { chatId, inviteLink };
}

export async function sendFileToGroup(
  chatId: string,
  filePath: string,
  fileName: string,
  mimeType: string
) {
  const FormData = (await import("form-data")).default;
  const fs = await import("fs");

  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("document", fs.createReadStream(filePath), {
    filename: fileName,
    contentType: mimeType,
  });

  const res = await fetch(`${API_BASE}/sendDocument`, {
    method: "POST",
    body: form as unknown as BodyInit,
  });

  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description ?? "Failed to send document");
  }

  const document = data.result.document;
  if (!document) {
    throw new Error("No document in response");
  }

  return {
    fileId: document.file_id,
    messageId: data.result.message_id,
    fileSize: document.file_size ?? 0,
  };
}

export async function getFileUrl(fileId: string): Promise<string> {
  const result = await telegramApi("getFile", { file_id: fileId });
  return `${FILE_BASE}/${result.file_path}`;
}

export async function deleteTelegramMessage(
  chatId: string,
  messageId: number
) {
  await telegramApi("deleteMessage", {
    chat_id: chatId,
    message_id: messageId,
  });
}

export async function sendWelcomeMessage(chatId: string, userId: number) {
  await telegramApi("sendMessage", {
    chat_id: chatId,
    text:
      `Welcome to your private cloud storage!\n\n` +
      `User ID: #${userId}\n` +
      `Files uploaded via the web app will appear here.`,
  });
}

export async function getChatInfo(chatId: string) {
  return telegramApi("getChat", { chat_id: chatId });
}
