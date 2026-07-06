# Agent D — UI/Layout (cycle 1)

[D-1-01] P1 portal — data-table mobile card view slices to 4 columns, dropping Status/Total/Stage on phones; priority API dead. FIX: honor priority, surface badge/amount columns. CANDIDATE FIX.
[D-1-02] P2 portal — every cell wraps its own identical row link (~9 tab stops/row). Fix: single row link. LOG (structural).
[D-1-03] P2 public — text-instrument (~3.3:1) on small dark-canvas text; token text-instrument-ink exists for AA. Class swap. CANDIDATE FIX (accessibility).
[D-1-04] P2 portal — combobox missing aria-activedescendant/option ids. CANDIDATE FIX (small).
[D-1-05] P3 portal — raw #9FC5FF hex on chrome rail vs token system; needs chrome-accent token. LOG.
[D-1-06] P3 portal — FileField filename truncate dead (missing min-w-0). CANDIDATE FIX (one line).
Clean: overflow wrappers, alt text, aria-labels, focus rings, mobile tap targets all verified good.
