CREATE OR REPLACE VIEW "top_memes_by_likes" AS
SELECT
    m."meme_id",
    m."title",
    m."image_url",
    m."like_count",
    m."created_at",
    m."category_id",
    c."name" AS "category_name",
    RANK() OVER (ORDER BY m."like_count" DESC, m."created_at" DESC) AS "rank_position"
FROM "memes" m
LEFT JOIN "meme_categories" c
    ON c."category_id" = m."category_id";

CREATE OR REPLACE FUNCTION "category_stats"()
RETURNS TABLE (
    "category_id" INTEGER,
    "category_name" VARCHAR(50),
    "meme_count" BIGINT,
    "total_likes" BIGINT,
    "report_count" BIGINT
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        c."category_id",
        c."name" AS "category_name",
        COUNT(DISTINCT m."meme_id") AS "meme_count",
        COALESCE(SUM(m."like_count"), 0)::BIGINT AS "total_likes",
        COUNT(r."report_id") AS "report_count"
    FROM "meme_categories" c
    LEFT JOIN "memes" m
        ON m."category_id" = c."category_id"
    LEFT JOIN "user_reports" r
        ON r."meme_id" = m."meme_id"
    GROUP BY c."category_id", c."name"
    ORDER BY c."name";
$$;

CREATE OR REPLACE PROCEDURE "resolve_report"(
    IN "p_report_id" INTEGER,
    IN "p_status" VARCHAR(30) DEFAULT 'resolved'
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE "user_reports"
    SET "status" = p_status
    WHERE "report_id" = p_report_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Report with id % does not exist.', p_report_id;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION "sync_meme_like_count"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    target_meme_id INTEGER;
BEGIN
    target_meme_id := COALESCE(NEW."meme_id", OLD."meme_id");

    UPDATE "memes"
    SET "like_count" = (
        SELECT COUNT(*)
        FROM "meme_likes"
        WHERE "meme_id" = target_meme_id
    )
    WHERE "meme_id" = target_meme_id;

    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION "audit_user_report_changes"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    resolved_record_id INTEGER;
    resolved_action VARCHAR(100);
BEGIN
    resolved_record_id := COALESCE(NEW."report_id", OLD."report_id");
    resolved_action := CASE
        WHEN TG_OP = 'INSERT' THEN 'db_insert_report'
        WHEN TG_OP = 'UPDATE' THEN 'db_update_report'
        ELSE 'db_delete_report'
    END;

    INSERT INTO "audit_log" ("user_id", "action", "table_name", "record_id")
    VALUES (NULL, resolved_action, TG_TABLE_NAME, resolved_record_id);

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS "trg_sync_meme_like_count" ON "meme_likes";
CREATE TRIGGER "trg_sync_meme_like_count"
AFTER INSERT OR DELETE ON "meme_likes"
FOR EACH ROW
EXECUTE FUNCTION "sync_meme_like_count"();

DROP TRIGGER IF EXISTS "trg_audit_user_reports" ON "user_reports";
CREATE TRIGGER "trg_audit_user_reports"
AFTER INSERT OR UPDATE OR DELETE ON "user_reports"
FOR EACH ROW
EXECUTE FUNCTION "audit_user_report_changes"();
