-- Aligns the schema with what Better Auth 1.6 generates.
--
-- The verification timestamps become NOT NULL. Better Auth has always written
-- both, but a database that predates that guarantee could hold nulls, and
-- SET NOT NULL would fail on it — so they are backfilled first.
UPDATE "verification" SET "created_at" = now() WHERE "created_at" IS NULL;--> statement-breakpoint
UPDATE "verification" SET "updated_at" = now() WHERE "updated_at" IS NULL;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");
