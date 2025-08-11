import { upsertUserSettings, getUserSettingsByUserId } from "~/db/queries/settings.queries";

// Business logic service layer (validation, orchestration, x-domain rules)
export async function saveGeneralSettings(userId: string, input: {
  orgName?: string;
  contactEmail?: string;
  defaultModel?: string;
  webhookUrl?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
}) {
  if (input.contactEmail && !/^[^@]+@[^@]+\.[^@]+$/.test(input.contactEmail)) {
    throw new Error("Invalid contact email");
  }
  return upsertUserSettings(userId, input);
}

export async function loadGeneralSettings(userId: string) {
  return getUserSettingsByUserId(userId);
}
