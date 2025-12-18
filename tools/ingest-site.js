import fetch from "node-fetch";
import { JSDOM } from "jsdom";

const INGEST_ENDPOINT = "https://jofdavies.com/api/ingest";

const PAGES = [
  "/about.html",

  "/cv/cv-crm-data.html",
  "/cv/cv-digital-marketing.html",
  "/cv/cv-email-marketing.html",
  "/cv/cv-video-production.html",
  "/cv/cv-web-dev.html",
  "/cv/cv-workflow-automation.html",
];

const BASE_URL = "https://jofdavies.com";
const CHUNK_SIZE = 700; // approx tokens

async function fetchPage(path) {
  const res = await fetch(BASE_URL + path);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }
  return await res.text();
}

function extractMainText(html) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Remove noise
  document.querySelectorAll("script, style, nav, footer").forEach(el => el.remove());

  const main = document.querySelector("main") || document.body;
  return main.textContent
    .replace(/\s+/g, " ")
    .trim();
}

function chunkText(text, size) {
  const words = text.split(" ");
  const chunks = [];
  let current = [];

  for (const word of words) {
    current.push(word);
    if (current.length >= size) {
      chunks.push(current.join(" "));
      current = [];
    }
  }

  if (current.length) {
    chunks.push(current.join(" "));
  }

  return chunks;
}

async function ingestChunk(id, text, metadata) {
  const res = await fetch(INGEST_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ id, text, metadata })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ingest failed: ${err}`);
  }
}

async function run() {
  for (const path of PAGES) {
    console.log(`Ingesting ${path}`);

    const html = await fetchPage(path);
    const text = extractMainText(html);
    const chunks = chunkText(text, CHUNK_SIZE);

    for (let i = 0; i < chunks.length; i++) {
      const id = `site:${path}:chunk:${i}`;
      await ingestChunk(id, chunks[i], {
        source: "site",
        page: path
      });
    }
  }

  console.log("Ingestion complete.");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
