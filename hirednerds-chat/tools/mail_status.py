"""Ask the live Worker what Postmark did with the last few emails (contact form and CV download notices).

  python hirednerds-chat/tools/mail_status.py [--token-file FILE] [--base https://jofdavies.com]

Read-only. The bearer token is read from the INGEST_TOKEN environment variable or from --token-file and is
never printed. Standard library only.
"""
import argparse, json, os, sys, urllib.request, urllib.error

ap = argparse.ArgumentParser()
ap.add_argument("--base", default="https://jofdavies.com")
ap.add_argument("--token-file")
ap.add_argument("--id", help="look up one Postmark message id")
ap.add_argument("--send-test", action="store_true", help="send Jof one test email first and show Postmark's reply")
args = ap.parse_args()
token = os.environ.get("INGEST_TOKEN", "")
if args.token_file:
    token = open(args.token_file, encoding="utf-8").read().strip()
if not token:
    sys.exit("Set INGEST_TOKEN or pass --token-file.")

if args.send_test:
    treq = urllib.request.Request(args.base + "/api/admin/mail-test", data=b"{}", method="POST", headers={
        "Authorization": "Bearer " + token, "Content-Type": "application/json", "User-Agent": "jofdavies-site-tools"})
    try:
        with urllib.request.urlopen(treq, timeout=60) as res:
            print("Test send:", res.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        sys.exit(f"Test send failed, HTTP {err.code}: {err.read().decode('utf-8', 'replace')[:300]}")

req = urllib.request.Request(args.base + "/api/admin/mail-status" + ("?id=" + args.id if args.id else ""), headers={
    "Authorization": "Bearer " + token, "User-Agent": "jofdavies-site-tools"})
try:
    with urllib.request.urlopen(req, timeout=90) as res:
        data = json.loads(res.read().decode("utf-8"))
except urllib.error.HTTPError as err:
    sys.exit(f"HTTP {err.code}: {err.read().decode('utf-8', 'replace')[:300]}")

if args.id:
    print(json.dumps(data, indent=2))
    sys.exit(0)
srv = data["server"]
print(f"Postmark server: {srv.get('name')}  delivery type: {srv.get('deliveryType')}  (HTTP {srv.get('httpStatus')}) {srv.get('error') or ''}")
sent = data["sent"]
print(f"Sent messages on record: {sent.get('total')} (HTTP {sent.get('httpStatus')}) {sent.get('error') or ''}")
for m in sent["messages"]:
    print(f"  {m.get('receivedAt')}  {m.get('status')}  to {', '.join(m.get('to') or [])}  | {m.get('subject')}")
    for e in m.get("events") or []:
        print(f"      {e.get('type')} at {e.get('at')}: {json.dumps(e.get('details'))[:260]}")
st = data.get("stats") or {}
print(f"Outbound totals: sent {st.get('sent')}, bounced {st.get('bounced')} (HTTP {st.get('httpStatus')}) {st.get('error') or ''}")
td = data.get("today") or {}
print(f"Today ({td.get('date')}): sent {td.get('sent')}, bounced {td.get('bounced')}")
print("Days with real sends:", ", ".join(f"{d.get('Date', '')[:10]} x{d.get('Sent')}" for d in data.get("sendDays") or []) or "none")
print("Streams:", ", ".join(f"{x.get('id')} ({x.get('type')}{', archived' if x.get('archivedAt') else ''})" for x in (data.get("streams") or {}).get("list", [])))
b = data["bounces"]
print(f"Bounces on record: {b.get('total')} (HTTP {b.get('httpStatus')})")
for x in b["recent"]:
    print(f"  {x.get('at')}  {x.get('type')}  {x.get('email')}  inactive={x.get('inactive')}  | {x.get('description')} | {str(x.get('details'))[:200]}")
sup = data["suppressions"]
print(f"Suppressed recipients (HTTP {sup.get('httpStatus')}): {len(sup['list'])}")
for x in sup["list"]:
    print(f"  {x.get('EmailAddress')}  {x.get('SuppressionReason')}  {x.get('CreatedAt')}")
