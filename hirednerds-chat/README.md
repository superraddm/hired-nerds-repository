# jofdavies.com API Worker and chatbot library

The Worker behind `jofdavies.com/api/*` and `jofdavies.com/download/cv`: the "Ask about Jof" chatbot, the contact
form and the CV download notice.

```
hirednerds-chat/
  app/
    src/index.js        the Worker (routes, guard rails, chat, contact, authenticated library writes)
    src/facts.js        the fact sheet the assistant always has
    test/worker.test.mjs  offline tests, no network or Cloudflare account needed
    wrangler.jsonc      bindings: KV, Vectorize, rate limits, vars
  corpus/library.json   the chatbot's library: one record per topic
  tools/library.py      check and upload the library
```

## How the chatbot answers

1. The widget posts the question and the last few turns to `/api/chat`.
2. The Worker embeds the question and fetches the closest records from Vectorize.
3. The model is given the fact sheet, those records and the question, and told to answer only from them.
4. If the library does not cover it, the assistant says so and the widget offers the contact form.

## CV download notice

The "Download PDF" button on `/cv/` links to `/download/cv`. The Worker emails Jof through Postmark and redirects
the visitor to `/cv/Jof-Davies-CV.pdf`. The visitor fills in nothing and never waits on the email.

- The email gives the time, the town and country, the network the request came from (often a company name on an
  office connection), the page the button was on and the browser. No IP address is stored or sent.
- One notice per visitor per day, and at most `CV_NOTIFY_DAILY_CAP` notices a day (25). Both are counted in KV.
- Crawlers, link-preview fetchers, prefetches and scripts get the file without an email.
- Someone who is sent the PDF address itself, or opens it from a saved copy, is not reported.
- On a branch preview the Worker is not in front, so `public/_redirects` sends `/download/cv` straight to the PDF.

## Guard rails

- Origin allow-list (the site and its Pages previews).
- Per-IP rate limits on chat and on the contact form.
- A daily cap on chat calls across all visitors (`CHAT_DAILY_CAP`, counted in KV).
- Question, history and answer lengths are capped.
- `/api/ingest` and `/api/admin/delete` need the `INGEST_TOKEN` bearer token. With no token set, nobody can write.
- The public `workers.dev` address is off.
- `tools/library.py check` refuses wording that must never reach the chatbot: unverified statistics, age, phone
  number, private email addresses.

## Changing what the chatbot knows

1. Edit `corpus/library.json` (and `app/src/facts.js` for the always-on basics). Keep each record true, specific and
   self-contained. Nothing goes in that Jof has not approved.
2. `python tools/library.py check`
3. `python tools/library.py ingest` with `INGEST_TOKEN` set. Records are upserted by id, so re-running is safe.
4. To retire a record, delete it from the file and run `python tools/library.py delete --ids <id>`.
5. A change to `facts.js` needs `npx wrangler deploy` from `app/`.

## Tests

```
cd app
node test/worker.test.mjs        # 19 offline tests
npx wrangler deploy --dry-run    # validates the config and bundle, deploys nothing
```

## First deploy of the November 2026 rebuild

Needs a Cloudflare login (`npx wrangler login`, a browser step). From `app/`:

```
npx wrangler vectorize create jof-library-2026-11 --dimensions=1536 --metric=cosine
npx wrangler secret put INGEST_TOKEN        # a long random string; keep a copy somewhere safe, not in the repo
npx wrangler deploy
cd .. && python tools/library.py ingest     # with INGEST_TOKEN set in the shell
```

`OPENAI_API_KEY` and `POSTMARK_API_TOKEN` are existing secrets on the Worker and carry over.
The old Vectorize index `jof-master-cv` is left in place as a rollback: point `index_name` back at it and redeploy.
