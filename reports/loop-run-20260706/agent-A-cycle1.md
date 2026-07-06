# Agent A — Speed & Optimization (cycle 1)

[A-1-01] P1 portal — admin trips (and invoices/quotes/clients) use listAll*() with no DB filter/sort/pagination; in-memory slice; silent 1000-row PostgREST cap = rows disappear. Fix: push filters + .range() + count into query. CANDIDATE FIX (scoped to trips/queries.ts).
[A-1-02] P2 portal — client directory fetches 7 full datasets for count badges; O(clients×records). Fix: aggregate counts. LOG (larger refactor).
[A-1-03] P2 infra — middleware getUser() network round-trip every portal request + again in render. Fix: getClaims() local verify. LOG (auth-critical change).
[A-1-04] P2 infra — xlsx high vulns (proto pollution, ReDoS), no npm fix; used write-only for CRM export. Fix: CDN-pinned build or hand-rolled CSV. CANDIDATE (evaluate).
[A-1-05] P2 public — 187MB public/; multi-MB unreferenced JPGs + byte-identical amg-custom/ mirror. Optimize (allowed under freeze). CANDIDATE after reference verification.
[A-1-06] P3 public — 6MB autoplay hero video, 13MB login intro source. Transcode → BACKLOG (asset pipeline).
[A-1-07] P3 portal — notifyAdmins / message notify loops serialized. Fix: Promise.all fan-out. CANDIDATE (small).
[A-1-08] P3 infra — material-dashboard dep unused; motion+framer-motion both present; redundant radix entries. CANDIDATE: remove unused dep only.
[A-1-09] P3 public — CSP unsafe-inline/eval documented tradeoff. Nonce CSP → BACKLOG.
