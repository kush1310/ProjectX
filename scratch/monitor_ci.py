import urllib.request
import json
import subprocess
import time

proc = subprocess.Popen(["git", "credential", "fill"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
stdout, _ = proc.communicate("protocol=https\nhost=github.com\n\n")
token = None
for line in stdout.splitlines():
    if line.startswith("password="):
        token = line.split("=", 1)[1].strip()
        break

if not token:
    print("Could not retrieve token")
    exit(1)

req = urllib.request.Request(
    "https://api.github.com/repos/kush1310/ProjectX/actions/runs?per_page=2",
    headers={"Authorization": f"Bearer {token}", "User-Agent": "Python", "Accept": "application/vnd.github+json"}
)

with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    runs = data.get("workflow_runs", [])
    for r in runs:
        print(f"Run ID: {r['id']}, SHA: {r['head_sha'][:8]}, Status: {r['status']}, Conclusion: {r['conclusion']}")
        jobs_req = urllib.request.Request(
            f"https://api.github.com/repos/kush1310/ProjectX/actions/runs/{r['id']}/jobs",
            headers={"Authorization": f"Bearer {token}", "User-Agent": "Python", "Accept": "application/vnd.github+json"}
        )
        with urllib.request.urlopen(jobs_req) as jresp:
            jdata = json.loads(jresp.read().decode())
            for j in jdata.get("jobs", []):
                print(f"  [{j['status']}] {j['name']}: {j['conclusion']}")
                for s in j.get("steps", []):
                    if s.get("conclusion") == "failure":
                        print(f"    FAILED: {s['name']}")
