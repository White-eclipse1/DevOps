/**
 * Tail consumer: forwards Cloudflare Tail batches to Axiom ingest.
 * @see https://developers.cloudflare.com/workers/observability/tail-workers/
 */

const AXIOM_INGEST_BASE = "https://api.axiom.co/v1/datasets";

function normalizeLogMessage(message) {
  if (Array.isArray(message)) return message.map(String).join(" ");
  return String(message ?? "");
}

function flattenTailEvent(ev) {
  const rows = [];
  const ts = ev.eventTimestamp
    ? new Date(ev.eventTimestamp).toISOString()
    : new Date().toISOString();
  const request = ev.event?.request;
  const base = {
    _tail: true,
    ts,
    producerScriptName: ev.scriptName,
    outcome: ev.outcome,
    cpuTimeMs: ev.cpuTime,
    wallTimeMs: ev.wallTime,
    requestUrl: request?.url ?? null,
    requestMethod: request?.method ?? null,
  };

  rows.push({ ...base, _record: "tail_summary" });

  for (const log of ev.logs ?? []) {
    rows.push({
      ...base,
      _record: "log",
      logLevel: log.level,
      logMessage: normalizeLogMessage(log.message),
      logTimestamp:
        typeof log.timestamp === "number"
          ? new Date(log.timestamp).toISOString()
          : ts,
    });
  }

  for (const ex of ev.exceptions ?? []) {
    rows.push({
      ...base,
      _record: "exception",
      exceptionName: ex.name,
      exceptionMessage: ex.message,
      exceptionTimestamp:
        typeof ex.timestamp === "number"
          ? new Date(ex.timestamp).toISOString()
          : ts,
      exceptionStack: ex.stack ?? null,
    });
  }

  return rows;
}

async function ingestToAxiom(env, rows) {
  if (!env.AXIOM_TOKEN || !env.AXIOM_DATASET) {
    console.warn("axiom-tail: missing AXIOM_TOKEN or AXIOM_DATASET");
    return;
  }
  if (!rows.length) return;

  const url = `${AXIOM_INGEST_BASE}/${encodeURIComponent(env.AXIOM_DATASET)}/ingest`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.AXIOM_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(rows),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`axiom-tail: ingest failed ${res.status} ${text}`);
  }
}

export default {
  async tail(events, env, ctx) {
    const rows = [];
    for (const ev of events) {
      rows.push(...flattenTailEvent(ev));
    }
    ctx.waitUntil(ingestToAxiom(env, rows));
  },
};
