import { db } from "../client";
import { userSettings } from "../schema";
import { eq } from "drizzle-orm";

// Query helpers: encapsulate reads & targeted writes (lightweight abstraction over Drizzle).

export async function getUserSettingsByUserId(userId: string) {
  return db.query.userSettings.findFirst({
    where: (s, { eq }) => eq(s.userId, userId),
  });
}

export async function listSettingsIds(limit = 100) {
  return db
    .select({ id: userSettings.id, userId: userSettings.userId })
    .from(userSettings)
    .limit(limit);
}

export async function upsertUserSettings(userId: string, data: Partial<{ orgName: string; contactEmail: string; defaultModel: string; webhookUrl: string; openaiApiKey: string; anthropicApiKey: string; }>) {
  const existing = await getUserSettingsByUserId(userId);
  const now = new Date();
  if (!existing) {
    const id = crypto.randomUUID();
    await db.insert(userSettings).values({
      id,
      userId,
      orgName: data.orgName ?? null,
      contactEmail: data.contactEmail ?? null,
      defaultModel: data.defaultModel ?? null,
      webhookUrl: data.webhookUrl ?? null,
      openaiApiKey: data.openaiApiKey ?? null,
      anthropicApiKey: data.anthropicApiKey ?? null,
      createdAt: now,
      updatedAt: now,
    });
    return getUserSettingsByUserId(userId);
  }
  await db
    .update(userSettings)
    .set({
      ...("orgName" in data ? { orgName: data.orgName ?? null } : {}),
      ...("contactEmail" in data ? { contactEmail: data.contactEmail ?? null } : {}),
      ...("defaultModel" in data ? { defaultModel: data.defaultModel ?? null } : {}),
      ...("webhookUrl" in data ? { webhookUrl: data.webhookUrl ?? null } : {}),
      ...("openaiApiKey" in data ? { openaiApiKey: data.openaiApiKey ?? null } : {}),
      ...("anthropicApiKey" in data ? { anthropicApiKey: data.anthropicApiKey ?? null } : {}),
      updatedAt: now,
    })
    .where(eq(userSettings.userId, userId));
  return getUserSettingsByUserId(userId);
}
