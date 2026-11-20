"""Static checks on the published site (public/, excluding the fireworks side project).

  python hirednerds-chat/tools/site_check.py

Checks every page for: internal links and assets that do not resolve, wording that must not be published
(unverified statistics, age, phone number, private email, banned buzzwords), dashes, missing title or
description, and more than one h1. Plain Python, standard library only.
"""
import io, os, re, sys, glob
from html.parser import HTMLParser

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "public"))

BANNED = [
    (r"75\s?%", "unverified 75% figure"),
    (r"\b(35|20|18)\s?%", "fabricated campaign statistic"),
    (r"99\.2\s?%", "fabricated deliverability figure"),
    (r"500k\+", "fabricated subscriber figure"),
    (r"zero data loss|data-loss", "claim without documentary basis"),
    (r"\b(spearheaded|leveraged|leveraging|pivotal|transformative|robust|stakeholders?|proactively)\b", "banned buzzword"),
    (r"\bborn\b|\b1984\b|\bage:\s*\d", "age or date of birth"),
    (r"\b0\d{4}\s?\d{6}\b", "phone number"),
    (r"@gmail\.com|@mtdcnc\.com", "private email address"),
    (r"hire me today", "old headline"),
    (r"testimonials", "link to a page that does not exist"),
    (r"Genie\.AI", "old CRM name"),
]
ALLOW = {"75 to 89%"}  # the import validator's review band


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links, self.text, self.h1, self.title, self.desc = [], [], 0, "", ""
        self._skip = 0
        self._in_title = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ("script", "style"):
            self._skip += 1
        if tag == "title":
            self._in_title = True
        if tag == "h1":
            self.h1 += 1
        if tag == "meta" and a.get("name") == "description":
            self.desc = a.get("content", "")
        for key in ("href", "src"):
            if a.get(key):
                self.links.append(a[key])

    def handle_endtag(self, tag):
        if tag in ("script", "style") and self._skip:
            self._skip -= 1
        if tag == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        if not self._skip:
            self.text.append(data)


def redirect_target(path):
    """Target of an exact-match rule in public/_redirects, or None. Wildcard rules are ignored."""
    rules = os.path.join(ROOT, "_redirects")
    if not os.path.exists(rules):
        return None
    for line in io.open(rules, encoding="utf-8"):
        parts = line.split()
        if len(parts) >= 2 and not parts[0].startswith("#") and parts[0] == path:
            return parts[1]
    return None


def resolves(link, hops=0):
    path = link.split("#")[0].split("?")[0]
    if not path or not path.startswith("/"):
        return True  # external, anchor-only or relative: not checked here
    target = redirect_target(path)
    if target and hops < 3:
        return resolves(target, hops + 1)  # a redirected address is fine if its target exists
    local = os.path.join(ROOT, path.lstrip("/").replace("/", os.sep))
    if path.endswith("/"):
        return os.path.exists(os.path.join(local, "index.html"))
    return os.path.exists(local) or os.path.exists(local + ".html")


def main():
    pages = [p for p in glob.glob(os.path.join(ROOT, "**", "*.html"), recursive=True)
             if os.sep + "fireworks" + os.sep not in p]
    problems = 0
    for p in sorted(pages):
        rel = os.path.relpath(p, ROOT).replace(os.sep, "/")
        raw = io.open(p, encoding="utf-8").read()
        page = Page()
        page.feed(raw)
        text = " ".join(page.text)
        issues = []
        for link in page.links:
            if not resolves(link):
                issues.append(f"broken link: {link}")
        scan = raw
        for ok in ALLOW:
            scan = scan.replace(ok, "")
        for pattern, why in BANNED:
            m = re.search(pattern, scan, flags=re.I)
            if m:
                issues.append(f"{why}: '{m.group(0)}'")
        if "—" in text or "–" in text:
            issues.append("en or em dash in visible text")
        if not page.title.strip():
            issues.append("no <title>")
        if not page.desc.strip() and rel != "404.html":
            issues.append("no meta description")
        if page.h1 != 1:
            issues.append(f"{page.h1} h1 elements (want exactly 1)")
        if 'id="year"' in raw or "openCvModal" in raw or "cv-modal" in raw:
            issues.append("leftover markup from the old download modal")
        status = "ok  " if not issues else "FAIL"
        print(f"{status} {rel}  ({len(page.links)} links, {len(text.split())} words)")
        for i in issues:
            print("       -", i)
        problems += len(issues)
    print(f"\n{len(pages)} pages checked, {problems} problems")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
