import urllib.request
import json
import subprocess

proc = subprocess.Popen(["git", "credential", "fill"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
stdout, _ = proc.communicate("protocol=https\nhost=github.com\n\n")
token = [line.split("=", 1)[1].strip() for line in stdout.splitlines() if line.startswith("password=")][0]

class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def http_error_302(self, req, fp, code, msg, headers):
        return headers.get('Location')

opener = urllib.request.build_opener(NoRedirectHandler)

# Get latest run ID and jobs
req = urllib.request.Request(
    "https://api.github.com/repos/kush1310/ProjectX/actions/runs?per_page=1",
    headers={"Authorization": f"Bearer {token}", "User-Agent": "Python", "Accept": "application/vnd.github+json"}
)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    run = data["workflow_runs"][0]
    run_id = run["id"]
    print(f"Latest Run ID: {run_id}, Head SHA: {run['head_sha']}")

jobs_req = urllib.request.Request(
    f"https://api.github.com/repos/kush1310/ProjectX/actions/runs/{run_id}/jobs",
    headers={"Authorization": f"Bearer {token}", "User-Agent": "Python", "Accept": "application/vnd.github+json"}
)
with urllib.request.urlopen(jobs_req) as jresp:
    jdata = json.loads(jresp.read().decode())
    for j in jdata.get("jobs", []):
        if "Stage A & B" in j["name"]:
            job_id = j["id"]
            print(f"Fetching logs for: {j['name']} (ID: {job_id})")
            log_req = urllib.request.Request(
                f"https://api.github.com/repos/kush1310/ProjectX/actions/jobs/{job_id}/logs",
                headers={"Authorization": f"Bearer {token}", "User-Agent": "Python"}
            )
            resp2 = opener.open(log_req)
            if isinstance(resp2, str):
                with urllib.request.urlopen(resp2) as lresp:
                    log_text = lresp.read().decode("utf-8", errors="ignore")
                    lines = log_text.splitlines()
                    error_lines = [line for line in lines if "error TS" in line]
                    print("\n--- ALL TYPESCRIPT ERRORS ---")
                    for el in error_lines:
                        print(el)
