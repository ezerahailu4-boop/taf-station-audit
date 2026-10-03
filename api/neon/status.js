const NEON_SQL_ENDPOINT = process.env.NEON_SQL_ENDPOINT || "https://ep-rapid-surf-b5cbhx9h-pooler.c-7.us-east-2.aws.neon.tech/sql";
const NEON_CONN_STRING = process.env.NEON_CONN_STRING || "postgresql://neondb_owner:npg_HFG6nih7RADr@ep-rapid-surf-b5cbhx9h-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function executeNeonSql(query) {
  const startTime = Date.now();
  const res = await fetch(NEON_SQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Neon-Connection-String": NEON_CONN_STRING
    },
    body: JSON.stringify({ query })
  });

  const latencyMs = Date.now() - startTime;
  if (!res.ok) {
    const errorText = await res.text();
    return { success: false, error: errorText, latencyMs };
  }
  const data = await res.json();
  return { success: true, data, latencyMs };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    const queryRes = await executeNeonSql("SELECT count(*) as total_count FROM station_audits;");
    if (queryRes.success) {
      const total = parseInt(queryRes.data.rows[0]?.total_count || 0, 10);
      return res.status(200).json({
        connected: true,
        project_id: "lucky-voice-67404432",
        project_name: "taf-station-audit",
        database: "neondb",
        host: "ep-rapid-surf-b5cbhx9h-pooler.c-7.us-east-2.aws.neon.tech",
        region: "aws-us-east-2",
        engine: "PostgreSQL 18 (Serverless)",
        total_records: total,
        latency_ms: queryRes.latencyMs
      });
    } else {
      return res.status(500).json({
        connected: false,
        error: queryRes.error || "Failed to query Neon PostgreSQL"
      });
    }
  } catch (err) {
    return res.status(500).json({ connected: false, error: err.message });
  }
}
