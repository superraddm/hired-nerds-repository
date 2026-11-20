"""Check and upload the chatbot's library (hirednerds-chat/corpus/library.json).

  python tools/library.py check
      Validate the library: ids, lengths, and wording that must never reach the chatbot.

  python tools/library.py ingest [--base https://jofdavies.com]
      Check, then upload every record to the Worker's /api/ingest endpoint in batches.
      The bearer token is read from the INGEST_TOKEN environment variable, or from the
      file named by --token-file. It is never printed and never written to the repo.

  python tools/library.py delete --ids id1 id2 ...
      Remove records from the index by id.

Standard library only. Plain Python, no model calls: the Worker does the embedding.
"""
import argparse, io, json, os, re, sys, urllib.request, urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
LIBRARY = os.path.join(HERE, "..", "corpus", "library.json")
FACTS = os.path.join(HERE, "..", "app", "src", "facts.js")

# Things the chatbot must never be given. Each entry: (pattern, why).
BANNED = [
    (r"75\s?%\s+(conversion|of hot|hot)", "unverified hot-lead conversion figure"),
    (r"hot[- ]lead[s]? conversion", "unverified hot-lead conversion figure"),
    (r"\b(35|20|18)\s?%\s+(ctr|click|conversion|registration|increase)", "fabricated campaign statistic"),
    (r"\b(30|50)\s?%\s+open", "fabricated open-rate statistic"),
    (r"99\.2\s?%", "fabricated deliverability figure"),
    (r"500k\+?\s+subscribers", "fabricated subscriber figure"),
    (r"zero data loss", "claim without documentary basis"),
    (r"half the cost of competing", "comparison without a defensible basis"),
    (r"\b(spearheaded|leveraged|leveraging|pivotal|transformative|robust|stakeholders?|proactively)\b", "house style: banned buzzword"),
    (r"\b(born in|date of birth|aged? \d\d\b|\b19[6-9]\d was born)", "age or date of birth"),
    (r"\b1984\b", "birth year"),
    (r"\b0\d{4}\s?\d{6}\b", "phone number"),
    (r"@gmail\.com|@mtdcnc\.com", "private email address"),
    (r"\bNN\d\s?\d[A-Z]{2}\b", "home postcode"),
    (r"(£|GBP)\s?\d{2},?\d{3}\b(?! in hardware| of capital)", "salary-like figure"),
]
ALLOWED_SALARY_LIKE = ["£7,000"]

# Tools Jof has not used: they may appear only in a sentence that says so.
NOT_USED_TOOLS = r"\b(n8n|Make|Power Automate|UiPath|Workato|Kubernetes|Azure)\b"
NOT_USED_MARKER = r"\b(not used|has not used|have not used|never used)\b"


def unclaimed_tools(text):
    """Return tools from the not-used list that appear in a sentence without a 'not used' marker."""
    found = []
    for sentence in re.split(r"(?<=[.!?])\s+|\n+", text):
        for m in re.finditer(NOT_USED_TOOLS, sentence):
            word = m.group(1)
            if word == "Make" and not re.search(r"\bMake\b(,| and| or|\.com)", sentence):
                continue  # the ordinary verb, not the platform
            if not re.search(NOT_USED_MARKER, sentence, flags=re.I):
                found.append(word)
    return found


def load():
    with io.open(LIBRARY, encoding="utf-8") as f:
        data = json.load(f)
    assert isinstance(data, list) and data, "library.json must be a non-empty list"
    return data


def check(records):
    problems = []
    seen = set()
    for i, r in enumerate(records):
        rid = r.get("id", "")
        where = rid or f"record #{i}"
        if not re.fullmatch(r"[a-z0-9-]{4,64}", rid):
            problems.append(f"{where}: id must be 4-64 chars of a-z, 0-9 and hyphen")
        if rid in seen:
            problems.append(f"{where}: duplicate id")
        seen.add(rid)
        for key in ("title", "section", "text"):
            if not isinstance(r.get(key), str) or not r[key].strip():
                problems.append(f"{where}: missing {key}")
        text = r.get("text", "")
        if len(text) > 6000:
            problems.append(f"{where}: text over 6000 characters")
        if len(text) < 120:
            problems.append(f"{where}: text under 120 characters, too thin to retrieve well")
        if "—" in text or "–" in text:
            problems.append(f"{where}: contains an en or em dash (house style: plain punctuation)")
        scan = text
        for ok in ALLOWED_SALARY_LIKE:
            scan = scan.replace(ok, "")
        for pattern, why in BANNED:
            m = re.search(pattern, scan, flags=re.I)
            if m:
                problems.append(f"{where}: {why}: '{m.group(0)}'")
        for tool in unclaimed_tools(text):
            problems.append(f"{where}: '{tool}' is on the not-used list and may only appear in a sentence that says so")
    # the always-on fact sheet gets the same wording checks
    if os.path.exists(FACTS):
        facts = io.open(FACTS, encoding="utf-8").read()
        for pattern, why in BANNED:
            m = re.search(pattern, facts, flags=re.I)
            if m:
                problems.append(f"facts.js: {why}: '{m.group(0)}'")
        for tool in unclaimed_tools(facts):
            problems.append(f"facts.js: '{tool}' is on the not-used list and may only appear in a sentence that says so")
    return problems


def post(base, path, token, payload):
    req = urllib.request.Request(
        base.rstrip("/") + path,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": "Bearer " + token, "User-Agent": "library-tool/1.0"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as res:
            return res.status, json.loads(res.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        return e.code, {"error": body[:300]}


def read_token(args):
    token = os.environ.get("INGEST_TOKEN", "").strip()
    if not token and args.token_file:
        token = io.open(args.token_file, encoding="utf-8").read().strip()
    if len(token) < 24:
        sys.exit("No usable token: set INGEST_TOKEN or pass --token-file (24+ characters).")
    return token


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", choices=["check", "ingest", "delete"])
    ap.add_argument("--base", default="https://jofdavies.com")
    ap.add_argument("--token-file")
    ap.add_argument("--batch", type=int, default=20)
    ap.add_argument("--ids", nargs="*", default=[])
    args = ap.parse_args()

    records = load()
    problems = check(records)
    words = sum(len(r["text"].split()) for r in records)
    print(f"{len(records)} records, {words} words")
    if problems:
        print("\nPROBLEMS")
        for p in problems:
            print(" -", p)
        sys.exit(1)
    print("check passed")
    if args.command == "check":
        return

    token = read_token(args)
    if args.command == "delete":
        if not args.ids:
            sys.exit("--ids is required for delete")
        status, body = post(args.base, "/api/admin/delete", token, {"ids": args.ids})
        print("delete:", status, body)
        sys.exit(0 if status == 200 else 1)

    done = 0
    for i in range(0, len(records), args.batch):
        chunk = records[i:i + args.batch]
        status, body = post(args.base, "/api/ingest", token, {"items": chunk})
        if status != 200:
            print(f"batch starting at record {i} failed: {status} {body}")
            sys.exit(1)
        done += len(chunk)
        print(f"uploaded {done}/{len(records)}")
    print("ingest complete")


if __name__ == "__main__":
    main()
