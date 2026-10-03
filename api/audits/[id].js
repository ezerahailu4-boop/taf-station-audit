const NEON_SQL_ENDPOINT = process.env.NEON_SQL_ENDPOINT || "https://ep-rapid-surf-b5cbhx9h-pooler.c-7.us-east-2.aws.neon.tech/sql";
const NEON_CONN_STRING = process.env.NEON_CONN_STRING || "postgresql://neondb_owner:npg_HFG6nih7RADr@ep-rapid-surf-b5cbhx9h-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";

function escapeSqlStr(val) {
  if (val === null || val === undefined) return "NULL";
  return "'" + String(val).replace(/'/g, "''") + "'";
}

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
  res.setHeader("Access-Control-Allow-Methods", "GET, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ success: false, error: "Missing audit ID" });
  }

  // GET: Fetch single audit with photos
  if (req.method === "GET") {
    try {
      const sql = `
        SELECT 
          id, station_name, canopy_id, region, 
          TO_CHAR(audit_date, 'YYYY-MM-DD') as audit_date,
          auditor_name, manager_name, compliance_score, status,
          dispensers_working, dispensers_broken, checklist_data,
          corrective_actions, signatures, photo_count, created_at
        FROM station_audits 
        WHERE id = ${escapeSqlStr(id)};
      `;
      const result = await executeNeonSql(sql);
      if (!result.success || !result.data.rows || result.data.rows.length === 0) {
        return res.status(404).json({ success: false, error: "Audit not found" });
      }

      const audit = result.data.rows[0];

      const photoSql = `
        SELECT id, item_id, item_title, caption, photo_url, captured_at
        FROM audit_photos 
        WHERE audit_id = ${escapeSqlStr(id)}
        ORDER BY created_at ASC;
      `;
      const photoRes = await executeNeonSql(photoSql);
      audit.photos = photoRes.success ? (photoRes.data.rows || []) : [];

      return res.status(200).json({ success: true, record: audit });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // DELETE: Delete audit and attached photos
  if (req.method === "DELETE") {
    try {
      const delPhotos = `DELETE FROM audit_photos WHERE audit_id = ${escapeSqlStr(id)};`;
      const delAudit = `DELETE FROM station_audits WHERE id = ${escapeSqlStr(id)};`;

      await executeNeonSql(delPhotos);
      const resAudit = await executeNeonSql(delAudit);

      if (resAudit.success) {
        return res.status(200).json({ success: true, message: `Deleted audit ${id}` });
      } else {
        return res.status(500).json({ success: false, error: resAudit.error });
      }
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
