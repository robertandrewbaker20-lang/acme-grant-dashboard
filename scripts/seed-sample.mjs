/**
 * Inserts the fictional sample notices. Safe to run again:
 * each notice is updated in place, and its score row is replaced.
 * Other rows in the database are left alone.
 *
 * With no POSTGRES_URL, this exits 0. The app already serves the same
 * file in sample-data mode.
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const connectionString =
  process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;

if (!connectionString) {
  console.log(
    "No POSTGRES_URL set. Sample notices are served from data/sample-opportunities.json without a database.",
  );
  process.exit(0);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = JSON.parse(
  readFileSync(resolve(__dirname, "../data/sample-opportunities.json"), "utf8"),
);

function shift(days) {
  const next = new Date();
  next.setDate(next.getDate() + days);
  next.setHours(17, 0, 0, 0);
  return next.toISOString();
}

const client = new pg.Client({
  connectionString: connectionString.replace("sslmode=require", "sslmode=no-verify"),
  ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
});

await client.connect();

try {
  await client.query("begin");

  for (const notice of file.notices) {
    const createdAt = shift(notice.createdOffsetDays);
    const raw = {
      pointOfContact: [
        {
          type: "primary",
          fullName: notice.contactName,
          email: notice.contactEmail,
          phone: notice.contactPhone,
        },
      ],
    };

    const saved = await client.query(
      `insert into opportunities (
         id, notice_id, title, description, solicitation_number, agency,
         naics_code, opportunity_type, posted_date, response_deadline,
         set_aside, sam_url, raw_data, source, status, created_at, updated_at
       ) values (
         $1, $2, $3, $4, $2, $5,
         $6, $7, $8, $9,
         $10, $11, $12::jsonb, $13, $14, $15, $15
       )
       on conflict (notice_id) do update set
         title = excluded.title,
         description = excluded.description,
         agency = excluded.agency,
         naics_code = excluded.naics_code,
         opportunity_type = excluded.opportunity_type,
         posted_date = excluded.posted_date,
         response_deadline = excluded.response_deadline,
         set_aside = excluded.set_aside,
         sam_url = excluded.sam_url,
         raw_data = excluded.raw_data,
         source = excluded.source,
         status = excluded.status,
         updated_at = now()
       returning id`,
      [
        notice.id,
        notice.noticeId,
        notice.title,
        notice.description,
        notice.agency,
        notice.naicsCode,
        notice.opportunityType,
        shift(notice.postedOffsetDays),
        shift(notice.deadlineOffsetDays),
        notice.setAside,
        notice.url,
        JSON.stringify(raw),
        notice.source,
        notice.status,
        createdAt,
      ],
    );

    const opportunityId = saved.rows[0].id;
    await client.query("delete from evaluations where opportunity_id = $1", [
      opportunityId,
    ]);
    await client.query(
      `insert into evaluations (
         opportunity_id, fit_score, recommendation, summary, strengths, concerns, stage, created_at
       ) values ($1, $2, $3, $4, $5, $6, 1, $7)`,
      [
        opportunityId,
        notice.fitScore,
        notice.recommendation,
        notice.summary,
        notice.strengths,
        notice.concerns,
        createdAt,
      ],
    );
  }

  await client.query("commit");
  console.log(`Upserted ${file.notices.length} fictional notices.`);
} catch (error) {
  await client.query("rollback");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}
