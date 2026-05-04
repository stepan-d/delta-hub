-- DropForeignKey
ALTER TABLE "audit_log" DROP CONSTRAINT "audit_log_user_id_fkey";

-- DropForeignKey
ALTER TABLE "meme_comments" DROP CONSTRAINT "meme_comments_meme_id_fkey";

-- DropForeignKey
ALTER TABLE "meme_comments" DROP CONSTRAINT "meme_comments_user_id_fkey";

-- DropForeignKey
ALTER TABLE "meme_likes" DROP CONSTRAINT "meme_likes_meme_id_fkey";

-- DropForeignKey
ALTER TABLE "meme_likes" DROP CONSTRAINT "meme_likes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "meme_tags" DROP CONSTRAINT "meme_tags_meme_id_fkey";

-- DropForeignKey
ALTER TABLE "memes" DROP CONSTRAINT "memes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_reports" DROP CONSTRAINT "user_reports_meme_id_fkey";

-- DropForeignKey
ALTER TABLE "user_reports" DROP CONSTRAINT "user_reports_reporter_id_fkey";

-- DropIndex
DROP INDEX "memes_tags_gin_idx";

-- AddForeignKey
ALTER TABLE "memes" ADD CONSTRAINT "memes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meme_likes" ADD CONSTRAINT "meme_likes_meme_id_fkey" FOREIGN KEY ("meme_id") REFERENCES "memes"("meme_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meme_likes" ADD CONSTRAINT "meme_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meme_comments" ADD CONSTRAINT "meme_comments_meme_id_fkey" FOREIGN KEY ("meme_id") REFERENCES "memes"("meme_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meme_comments" ADD CONSTRAINT "meme_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meme_tags" ADD CONSTRAINT "meme_tags_meme_id_fkey" FOREIGN KEY ("meme_id") REFERENCES "memes"("meme_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_meme_id_fkey" FOREIGN KEY ("meme_id") REFERENCES "memes"("meme_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
