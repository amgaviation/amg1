#!/usr/bin/env python3
"""Initialize or validate a machine-readable web audit coverage ledger."""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


ALLOWED_STATUS = {"tested", "partial", "blocked", "not applicable", "not discovered"}
ALLOWED_SEVERITY = {"P0", "P1", "P2", "P3", "P4"}
ALLOWED_CONFIDENCE = {"confirmed", "high", "medium", "low"}
REQUIRED_FINDING_FIELDS = {
    "id",
    "title",
    "severity",
    "confidence",
    "category",
    "surface",
    "observed",
    "expected",
    "impact",
    "reproduction",
    "evidence",
    "root_cause",
    "remediation",
    "verification",
}


def blank_ledger() -> dict:
    return {
        "audit": {
            "target": "",
            "mode": "",
            "build": "",
            "started_at": datetime.now(timezone.utc).isoformat(),
            "limitations": [],
        },
        "coverage": [],
        "findings": [],
        "verification": [],
    }


def validate(data: dict) -> list[str]:
    errors: list[str] = []
    for key in ("audit", "coverage", "findings", "verification"):
        if key not in data:
            errors.append(f"missing top-level key: {key}")

    coverage = data.get("coverage", [])
    if not isinstance(coverage, list):
        errors.append("coverage must be a list")
    else:
        for index, row in enumerate(coverage):
            if not isinstance(row, dict):
                errors.append(f"coverage[{index}] must be an object")
                continue
            for field in ("surface", "status"):
                if not row.get(field):
                    errors.append(f"coverage[{index}] missing {field}")
            if row.get("status") not in ALLOWED_STATUS:
                errors.append(f"coverage[{index}] has invalid status: {row.get('status')}")
            if row.get("status") in {"partial", "blocked"} and not row.get("notes"):
                errors.append(f"coverage[{index}] requires notes for {row.get('status')} status")

    findings = data.get("findings", [])
    ids: list[str] = []
    if not isinstance(findings, list):
        errors.append("findings must be a list")
    else:
        for index, finding in enumerate(findings):
            if not isinstance(finding, dict):
                errors.append(f"findings[{index}] must be an object")
                continue
            missing = sorted(field for field in REQUIRED_FINDING_FIELDS if not finding.get(field))
            if missing:
                errors.append(f"findings[{index}] missing: {', '.join(missing)}")
            if finding.get("severity") not in ALLOWED_SEVERITY:
                errors.append(f"findings[{index}] has invalid severity: {finding.get('severity')}")
            if str(finding.get("confidence", "")).lower() not in ALLOWED_CONFIDENCE:
                errors.append(f"findings[{index}] has invalid confidence: {finding.get('confidence')}")
            if finding.get("id"):
                ids.append(str(finding["id"]))

    for finding_id, count in Counter(ids).items():
        if count > 1:
            errors.append(f"duplicate finding id: {finding_id}")
    return errors


def command_init(path: Path, force: bool) -> int:
    if path.exists() and not force:
        print(f"refusing to overwrite existing file: {path}", file=sys.stderr)
        return 2
    path.write_text(json.dumps(blank_ledger(), indent=2) + "\n", encoding="utf-8")
    print(path)
    return 0


def command_validate(path: Path) -> int:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"could not read valid JSON: {exc}", file=sys.stderr)
        return 2
    errors = validate(data)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print(
        json.dumps(
            {
                "status": "valid",
                "coverage_rows": len(data["coverage"]),
                "findings": len(data["findings"]),
                "severity": Counter(item["severity"] for item in data["findings"]),
            },
            default=dict,
            indent=2,
        )
    )
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    init_parser = subparsers.add_parser("init", help="create a blank audit ledger")
    init_parser.add_argument("path", type=Path)
    init_parser.add_argument("--force", action="store_true")
    validate_parser = subparsers.add_parser("validate", help="validate an audit ledger")
    validate_parser.add_argument("path", type=Path)
    args = parser.parse_args()
    if args.command == "init":
        return command_init(args.path, args.force)
    return command_validate(args.path)


if __name__ == "__main__":
    raise SystemExit(main())
