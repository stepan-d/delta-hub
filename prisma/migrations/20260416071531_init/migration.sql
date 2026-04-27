-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'User',
    "school_year" SMALLINT,
    "favorite_subject" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "schools" (
    "school_id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "location" VARCHAR(150),

    CONSTRAINT "schools_pkey" PRIMARY KEY ("school_id")
);

-- CreateTable
CREATE TABLE "meme_categories" (
    "category_id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,

    CONSTRAINT "meme_categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "memes" (
    "meme_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "category_id" INTEGER,
    "title" VARCHAR(200),
    "image_url" VARCHAR(500) NOT NULL,
    "tags" JSONB NOT NULL DEFAULT '{}',
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memes_pkey" PRIMARY KEY ("meme_id")
);

-- CreateTable
CREATE TABLE "meme_likes" (
    "meme_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meme_likes_pkey" PRIMARY KEY ("meme_id","user_id")
);

-- CreateTable
CREATE TABLE "meme_comments" (
    "comment_id" SERIAL NOT NULL,
    "meme_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meme_comments_pkey" PRIMARY KEY ("comment_id")
);

-- CreateTable
CREATE TABLE "meme_tags" (
    "tag_id" SERIAL NOT NULL,
    "meme_id" INTEGER NOT NULL,
    "tag_name" VARCHAR(50) NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "meme_tags_pkey" PRIMARY KEY ("tag_id")
);

-- CreateTable
CREATE TABLE "user_reports" (
    "report_id" SERIAL NOT NULL,
    "meme_id" INTEGER NOT NULL,
    "reporter_id" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_reports_pkey" PRIMARY KEY ("report_id")
);

-- CreateTable
CREATE TABLE "school_events" (
    "event_id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "date" DATE,
    "details_json" JSONB,

    CONSTRAINT "school_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "log_id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "action" VARCHAR(100) NOT NULL,
    "table_name" VARCHAR(100),
    "record_id" INTEGER,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_school_year_idx" ON "users"("school_year");

-- CreateIndex
CREATE UNIQUE INDEX "meme_categories_name_key" ON "meme_categories"("name");

-- CreateIndex
CREATE INDEX "memes_user_id_idx" ON "memes"("user_id");

-- CreateIndex
CREATE INDEX "memes_category_id_idx" ON "memes"("category_id");

-- CreateIndex
CREATE INDEX "memes_created_at_idx" ON "memes"("created_at");

-- CreateIndex
CREATE INDEX "meme_likes_meme_id_idx" ON "meme_likes"("meme_id");

-- CreateIndex
CREATE INDEX "meme_likes_user_id_idx" ON "meme_likes"("user_id");

-- CreateIndex
CREATE INDEX "meme_comments_meme_id_idx" ON "meme_comments"("meme_id");

-- CreateIndex
CREATE INDEX "meme_comments_user_id_idx" ON "meme_comments"("user_id");

-- CreateIndex
CREATE INDEX "meme_comments_created_at_idx" ON "meme_comments"("created_at");

-- CreateIndex
CREATE INDEX "meme_tags_meme_id_idx" ON "meme_tags"("meme_id");

-- CreateIndex
CREATE INDEX "meme_tags_tag_name_idx" ON "meme_tags"("tag_name");

-- CreateIndex
CREATE INDEX "user_reports_meme_id_idx" ON "user_reports"("meme_id");

-- CreateIndex
CREATE INDEX "user_reports_reporter_id_idx" ON "user_reports"("reporter_id");

-- CreateIndex
CREATE INDEX "user_reports_status_idx" ON "user_reports"("status");

-- CreateIndex
CREATE INDEX "audit_log_user_id_idx" ON "audit_log"("user_id");

-- CreateIndex
CREATE INDEX "audit_log_timestamp_idx" ON "audit_log"("timestamp");

-- AddForeignKey
ALTER TABLE "memes" ADD CONSTRAINT "memes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memes" ADD CONSTRAINT "memes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "meme_categories"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meme_likes" ADD CONSTRAINT "meme_likes_meme_id_fkey" FOREIGN KEY ("meme_id") REFERENCES "memes"("meme_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meme_likes" ADD CONSTRAINT "meme_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meme_comments" ADD CONSTRAINT "meme_comments_meme_id_fkey" FOREIGN KEY ("meme_id") REFERENCES "memes"("meme_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meme_comments" ADD CONSTRAINT "meme_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meme_tags" ADD CONSTRAINT "meme_tags_meme_id_fkey" FOREIGN KEY ("meme_id") REFERENCES "memes"("meme_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_meme_id_fkey" FOREIGN KEY ("meme_id") REFERENCES "memes"("meme_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX memes_tags_gin_idx ON memes USING gin (tags);
