#!/usr/bin/env python3
"""
TAF ENERGIES - Station Information & Audit Management System
Unified Static Server & Neon PostgreSQL Serverless API Bridge
"""

import os
import sys
import json
import time
import traceback
import urllib.request
import urllib.error
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, unquote

PORT = 5173
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Neon PostgreSQL Database Configuration
NEON_PROJECT_ID = "lucky-voice-67404432"
NEON_PROJECT_NAME = "taf-station-audit"
NEON_SQL_ENDPOINT = "https://ep-rapid-surf-b5cbhx9h-pooler.c-7.us-east-2.aws.neon.tech/sql"
NEON_CONN_STRING = "postgresql://neondb_owner:npg_HFG6nih7RADr@ep-rapid-surf-b5cbhx9h-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require"

def execute_neon_sql(query_sql):
    """Execute raw SQL statement against Neon Serverless HTTP API"""
    payload = json.dumps({"query": query_sql}).encode('utf-8')
    req = urllib.request.Request(
        NEON_SQL_ENDPOINT,
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Neon-Connection-String': NEON_CONN_STRING
        }
    )
    start_time = time.time()
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            latency_ms = round((time.time() - start_time) * 1000, 1)
            raw = response.read().decode('utf-8')
            data = json.loads(raw)
            return {
                "success": True,
                "data": data,
                "latency_ms": latency_ms
            }
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        try:
            err_json = json.loads(error_body)
            msg = err_json.get("message", error_body)
        except Exception:
            msg = error_body
        return {"success": False, "error": msg, "code": e.code}
    except Exception as e:
        return {"success": False, "error": str(e)}

def escape_sql_str(val):
    if val is None:
        return "NULL"
    return "'" + str(val).replace("'", "''") + "'"

class AuditServerHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        try:
            parsed = urlparse(self.path)
            path = parsed.path

            if path == '/api/neon/status':
                self.handle_neon_status()
                return
            elif path == '/api/audits':
                self.handle_get_audits()
                return
            elif path.startswith('/api/audits/'):
                audit_id = unquote(path.replace('/api/audits/', '').strip())
                self.handle_get_audit_detail(audit_id)
                return

            super().do_GET()
        except Exception as e:
            traceback.print_exc()
            self.send_json_response(500, {"success": False, "error": str(e)})

    def do_POST(self):
        try:
            parsed = urlparse(self.path)
            path = parsed.path

            if path == '/api/audits':
                self.handle_create_audit()
                return

            self.send_json_response(404, {"success": False, "error": "Endpoint not found"})
        except Exception as e:
            traceback.print_exc()
            self.send_json_response(500, {"success": False, "error": str(e)})

    def do_DELETE(self):
        try:
            parsed = urlparse(self.path)
            path = parsed.path

            if path.startswith('/api/audits/'):
                audit_id = unquote(path.replace('/api/audits/', '').strip())
                self.handle_delete_audit(audit_id)
                return

            self.send_json_response(404, {"success": False, "error": "Endpoint not found"})
        except Exception as e:
            traceback.print_exc()
            self.send_json_response(500, {"success": False, "error": str(e)})

    def handle_neon_status(self):
        res = execute_neon_sql("SELECT count(*) as total_count FROM station_audits;")
        if res["success"]:
            total = int(res["data"]["rows"][0]["total_count"])
            resp_data = {
                "connected": True,
                "project_id": NEON_PROJECT_ID,
                "project_name": NEON_PROJECT_NAME,
                "database": "neondb",
                "host": "ep-rapid-surf-b5cbhx9h-pooler.c-7.us-east-2.aws.neon.tech",
                "region": "aws-us-east-2",
                "engine": "PostgreSQL 18 (Serverless)",
                "total_records": total,
                "latency_ms": res.get("latency_ms", 0)
            }
            self.send_json_response(200, resp_data)
        else:
            self.send_json_response(500, {
                "connected": False,
                "error": res.get("error", "Database connection failed")
            })

    def handle_get_audits(self):
        sql = """
        SELECT 
            id, station_name, canopy_id, region, 
            TO_CHAR(audit_date, 'YYYY-MM-DD') as audit_date,
            auditor_name, manager_name, compliance_score, status,
            dispensers_working, dispensers_broken, photo_count,
            created_at
        FROM station_audits 
        ORDER BY audit_date DESC, created_at DESC;
        """
        res = execute_neon_sql(sql)
        if res["success"]:
            rows = res["data"]["rows"]
            self.send_json_response(200, {
                "success": True,
                "total": len(rows),
                "records": rows,
                "latency_ms": res.get("latency_ms")
            })
        else:
            self.send_json_response(500, {"success": False, "error": res.get("error")})

    def handle_get_audit_detail(self, audit_id):
        sql = f"""
        SELECT 
            id, station_name, canopy_id, region, 
            TO_CHAR(audit_date, 'YYYY-MM-DD') as audit_date,
            auditor_name, manager_name, compliance_score, status,
            dispensers_working, dispensers_broken, checklist_data,
            corrective_actions, signatures, photo_count, created_at
        FROM station_audits 
        WHERE id = {escape_sql_str(audit_id)};
        """
        res = execute_neon_sql(sql)
        if not res["success"] or not res["data"]["rows"]:
            self.send_json_response(404, {"success": False, "error": "Audit not found"})
            return

        audit = res["data"]["rows"][0]
        
        photo_sql = f"""
        SELECT id, item_id, item_title, caption, photo_url, captured_at
        FROM audit_photos 
        WHERE audit_id = {escape_sql_str(audit_id)}
        ORDER BY created_at ASC;
        """
        photo_res = execute_neon_sql(photo_sql)
        photos = photo_res["data"]["rows"] if photo_res["success"] else []

        audit["photos"] = photos
        self.send_json_response(200, {"success": True, "record": audit})

    def handle_create_audit(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        data = json.loads(body)

        audit_id = data.get("id") or f"audit_{int(time.time()*1000)}"
        meta = data.get("metadata", {})
        checklist = data.get("checklist", {})
        corrective = data.get("correctiveActions", [])
        signatures = data.get("signatures", {})
        photos = data.get("photos", [])

        station_name = meta.get("stationName", "Untitled Station")
        canopy_id = meta.get("canopyId", "N/A")
        audit_date = meta.get("date") or time.strftime("%Y-%m-%d")
        auditor = meta.get("auditorName", "Auditor")
        manager = meta.get("managerName", "Manager")

        disp_w = int(checklist.get("dispensersWorking", 0))
        disp_b = int(checklist.get("dispensersBroken", 0))
        score = int(data.get("complianceScore", 85))

        if score >= 85:
            status = "PASS"
        elif score >= 70:
            status = "ACTION_REQUIRED"
        else:
            status = "CRITICAL"

        sql_insert = f"""
        INSERT INTO station_audits (
            id, station_name, canopy_id, region, audit_date,
            auditor_name, manager_name, compliance_score, status,
            dispensers_working, dispensers_broken, checklist_data,
            corrective_actions, signatures, photo_count, updated_at
        ) VALUES (
            {escape_sql_str(audit_id)},
            {escape_sql_str(station_name)},
            {escape_sql_str(canopy_id)},
            'Addis Ababa',
            {escape_sql_str(audit_date)},
            {escape_sql_str(auditor)},
            {escape_sql_str(manager)},
            {score},
            {escape_sql_str(status)},
            {disp_w},
            {disp_b},
            {escape_sql_str(json.dumps(checklist))},
            {escape_sql_str(json.dumps(corrective))},
            {escape_sql_str(json.dumps(signatures))},
            {len(photos)},
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
        """
        insert_res = execute_neon_sql(sql_insert)
        if not insert_res["success"]:
            self.send_json_response(500, {"success": False, "error": insert_res.get("error")})
            return

        if photos:
            del_sql = f"DELETE FROM audit_photos WHERE audit_id = {escape_sql_str(audit_id)};"
            execute_neon_sql(del_sql)

            for p in photos:
                p_id = p.get("id") or f"photo_{int(time.time()*1000)}"
                item_id = p.get("itemId", "general")
                item_title = p.get("itemTitle", "Inspection Evidence")
                caption = p.get("caption", "")
                photo_url = p.get("dataUrl", "")
                captured_at = p.get("timestamp", "")

                if photo_url:
                    photo_insert = f"""
                    INSERT INTO audit_photos (
                        id, audit_id, item_id, item_title, caption, photo_url, captured_at
                    ) VALUES (
                        {escape_sql_str(p_id)},
                        {escape_sql_str(audit_id)},
                        {escape_sql_str(item_id)},
                        {escape_sql_str(item_title)},
                        {escape_sql_str(caption)},
                        {escape_sql_str(photo_url)},
                        {escape_sql_str(captured_at)}
                    );
                    """
                    execute_neon_sql(photo_insert)

        self.send_json_response(201, {
            "success": True,
            "message": "Audit successfully registered in Neon PostgreSQL",
            "id": audit_id,
            "station": station_name
        })

    def handle_delete_audit(self, audit_id):
        sql = f"DELETE FROM station_audits WHERE id = {escape_sql_str(audit_id)};"
        res = execute_neon_sql(sql)
        if res["success"]:
            self.send_json_response(200, {"success": True, "message": "Record deleted from Neon"})
        else:
            self.send_json_response(500, {"success": False, "error": res.get("error")})

    def send_json_response(self, code, data):
        body = json.dumps(data).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

def run():
    server_address = ('127.0.0.1', PORT)
    httpd = HTTPServer(server_address, AuditServerHandler)
    print(f"[*] TAF Station Audit System running on http://127.0.0.1:{PORT}")
    print(f"[*] Neon Database: {NEON_PROJECT_NAME} ({NEON_PROJECT_ID})")
    sys.stdout.flush()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()

if __name__ == '__main__':
    run()
