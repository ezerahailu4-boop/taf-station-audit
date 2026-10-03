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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "25mb"
    }
  }
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // GET: List all registered station audits
  if (req.method === "GET") {
    try {
      const sql = `
        SELECT 
          id, station_name, canopy_id, region, 
          TO_CHAR(audit_date, 'YYYY-MM-DD') as audit_date,
          auditor_name, manager_name, compliance_score, status,
          dispensers_working, dispensers_broken, photo_count,
          created_at
        FROM station_audits 
        ORDER BY audit_date DESC, created_at DESC;
      `;
      const result = await executeNeonSql(sql);
      if (result.success) {
        const rows = result.data.rows || [];
        return res.status(200).json({
          success: true,
          total: rows.length,
          records: rows,
          latency_ms: result.latencyMs
        });
      } else {
        return res.status(500).json({ success: false, error: result.error });
      }
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST: Create or Update an audit
  if (req.method === "POST") {
    try {
      const data = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const auditId = data.id || `audit_${Date.now()}`;
      const meta = data.metadata || {};
      const checklist = data.checklist || {};
      const corrective = data.correctiveActions || [];
      const signatures = data.signatures || {};
      const photos = data.photos || [];

      const stationName = meta.stationName || "Untitled Station";
      const canopyId = meta.canopyId || "N/A";
      const auditDate = meta.date || new Date().toISOString().split("T")[0];
      const auditor = meta.auditorName || "Auditor";
      const manager = meta.managerName || "Manager";

      const dispW = parseInt(checklist.dispensersWorking || 0, 10);
      const dispB = parseInt(checklist.dispensersBroken || 0, 10);
      const score = parseInt(data.complianceScore || 85, 10);

      let status = "PASS";
      if (score < 70) {
        status = "CRITICAL";
      } else if (score < 85) {
        status = "ACTION_REQUIRED";
      }

      const sqlInsert = `
        INSERT INTO station_audits (
          id, station_name, canopy_id, region, audit_date,
          auditor_name, manager_name, compliance_score, status,
          dispensers_working, dispensers_broken, checklist_data,
          corrective_actions, signatures, photo_count, updated_at
        ) VALUES (
          ${escapeSqlStr(auditId)},
          ${escapeSqlStr(stationName)},
          ${escapeSqlStr(canopyId)},
          'Addis Ababa',
          ${escapeSqlStr(auditDate)},
          ${escapeSqlStr(auditor)},
          ${escapeSqlStr(manager)},
          ${score},
          ${escapeSqlStr(status)},
          ${dispW},
          ${dispB},
          ${escapeSqlStr(JSON.stringify(checklist))},
          ${escapeSqlStr(JSON.stringify(corrective))},
          ${escapeSqlStr(JSON.stringify(signatures))},
          ${photos.length},
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO UPDATE SET
          station_name = EXCLUDED.station_name,
          canopy_id = EXCLUDED.canopy_id,
          audit_date = EXCLUDED.audit_date,
          auditor_name = EXCLUDED.auditor_name,
          manager_name = EXCLUDED.manager_name,
          compliance_score = EXCLUDED.compliance_score,
          status = EXCLUDED.status,
          dispensers_working = EXCLUDED.dispensers_working,
          dispensers_broken = EXCLUDED.dispensers_broken,
          checklist_data = EXCLUDED.checklist_data,
          corrective_actions = EXCLUDED.corrective_actions,
          signatures = EXCLUDED.signatures,
          photo_count = EXCLUDED.photo_count,
          updated_at = CURRENT_TIMESTAMP;
      `;

      const insertRes = await executeNeonSql(sqlInsert);
      if (!insertRes.success) {
        return res.status(500).json({ success: false, error: insertRes.error });
      }

      // Handle photos
      if (photos && photos.length > 0) {
        await executeNeonSql(`DELETE FROM audit_photos WHERE audit_id = ${escapeSqlStr(auditId)};`);
        for (const p of photos) {
          const pId = p.id || `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const itemId = p.itemId || "general";
          const itemTitle = p.itemTitle || "Inspection Evidence";
          const caption = p.caption || "";
          const photoUrl = p.dataUrl || "";
          const capturedAt = p.timestamp || "";

          if (photoUrl) {
            const photoInsert = `
              INSERT INTO audit_photos (
                id, audit_id, item_id, item_title, caption, photo_url, captured_at
              ) VALUES (
                ${escapeSqlStr(pId)},
                ${escapeSqlStr(auditId)},
                ${escapeSqlStr(itemId)},
                ${escapeSqlStr(itemTitle)},
                ${escapeSqlStr(caption)},
                ${escapeSqlStr(photoUrl)},
                ${escapeSqlStr(capturedAt)}
              );
            `;
            await executeNeonSql(photoInsert);
          }
        }
      }

      return res.status(201).json({
        success: true,
        message: "Audit successfully registered in Neon PostgreSQL",
        id: auditId,
        station: stationName
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
