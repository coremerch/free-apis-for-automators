# free-apis-for-automators

**41 free/no-key APIs curated for workflow builders and automation engineers — with live health-check status and an auto-maintenance script.**

Baseline machine-verified **2026-09-05**: `36 ok · 1 rate-limited-but-alive · 2 POST-only (404 on GET, expected) · 1 flaky (flagged)`.

## Why this dataset

Every automation project starts with the same half-hour: *"is there a free API for…?"* — then click-roulette through directory sites full of dead links and "free trial" walls. This is the pre-solved version: 41 endpoints that automation builders actually use (weather, FX, alerts, holidays, test data, cheap AI, geo-ip, archives), each with the exact idea of what to automate with it.

## The data

| | |
|---|---|
| Rows | 41 APIs |
| Columns | `name, category, base_url, key_required, auth, notes, docs, automation_idea, last_checked, http_status` |
| Formats | `data/free_apis.csv` · `data/free_apis.json` |
| License | **CC0** — public domain, no attribution required |
| Categories | weather, fx-rates, news, dev, knowledge, books, research, space, geo, calendar, time, geo-ip, email-testing, testing, media, language, fun, tv, ai, archive, reference, data, finance |

## Use it

```bash
# GitHub (no login, no checkout page)
git clone https://github.com/coremerch/free-apis-for-automators.git

# raw, straight into any script
curl -s https://raw.githubusercontent.com/coremerch/free-apis-for-automators/main/data/free_apis.csv
```

```python
# Hugging Face (upload data/free_apis.csv to a dataset repo once, then:)
from datasets import load_dataset
ds = load_dataset("SharkSkin/free-apis-for-automators", split="train")
no_key_apis = [r for r in ds if r["key_required"] == "no"]
```

## Keep it alive (the self-maintaining part)

Most API lists rot. This one ships with its own health-checker:

```bash
node tools/verify_urls.mjs     # GETs all 41, stamps last_checked + http_status, rebuilds JSON
```

Run it weekly (or as an n8n scheduled workflow — that's the point). Green rows = still free & alive. The `http_status` legend: `2xx` ok · `403/429` alive-but-bot-blocked · `404` POST-only endpoint (annotation in notes) · `ERR:*` unreachable.

---

**Free forever · CC0** — no signup, no gate, no email wall (see `PHILOSOPHY.md`).
Useful? **⚡ zap sats** to `SharkSkin@coinos.io`
Want a dataset like this for *your* niche (fintech APIs, gov portals, retail feeds)? → **DM @your-handle** — I build these for a living; this dataset is the portfolio.
