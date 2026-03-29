import TelegramBot from "node-telegram-bot-api";

let botInstance: TelegramBot | null = null;

export function getBot(token: string): TelegramBot {
  if (!botInstance) {
    botInstance = new TelegramBot(token, { polling: false });
  }
  return botInstance;
}

export function resetBotInstance() {
  botInstance = null;
}

export async function sendFileToTelegram(
  token: string,
  chatId: string,
  filePath: string,
  fileName: string,
  mimeType: string
) {
  const bot = getBot(token);

  const message = await bot.sendDocument(chatId, filePath, {}, {
    filename: fileName,
    contentType: mimeType,
  });

  const document = message.document;
  if (!document) {
    throw new Error("Failed to send file to Telegram");
  }

  return {
    fileId: document.file_id,
    messageId: message.message_id,
    fileSize: document.file_size ?? 0,
  };
}

export async function getFileUrl(
  token: string,
  fileId: string
): Promise<string> {
  const bot = getBot(token);
  const file = await bot.getFile(fileId);
  return `https://api.telegram.org/file/bot${token}/${file.file_path}`;
}

export async function deleteTelegramMessage(
  token: string,
  chatId: string,
  messageId: number
) {
  const bot = getBot(token);
  await bot.deleteMessage(chatId, messageId);
}
