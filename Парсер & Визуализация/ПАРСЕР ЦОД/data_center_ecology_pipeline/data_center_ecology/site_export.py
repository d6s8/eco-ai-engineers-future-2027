"""Export normalized pipeline data for the existing static website."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd

from .config import Settings
from .normalization import country_label, normalize_country


DATA_CENTER_FIELDS = {
    "id": "DataCenter_ID",
    "company": "Company",
    "name": "DataCenter_Name",
    "country": "Country",
    "region": "Region",
    "city": "City_Location",
    "address": "Address",
    "latitude": "Latitude",
    "longitude": "Longitude",
    "status": "Status",
    "sourceName": "Source_Name",
    "sourceUrl": "Source_URL",
    "retrievedAt": "Retrieved_At",
    "notes": "Notes",
}

METRIC_FIELDS = {
    "id": "Metric_ID",
    "dataCenterId": "DataCenter_ID",
    "company": "Company",
    "dataCenterName": "DataCenter_Name",
    "year": "Year",
    "name": "Metric_Name",
    "value": "Value",
    "rawValue": "Raw_Value",
    "country": "Country",
    "region": "Region",
    "city": "City_Location",
    "scope": "Metric_Scope",
    "method": "Metric_Method",
    "unit": "Metric_Unit",
    "dataStatus": "Data_Status",
    "valueType": "Value_Type",
    "extractionMethod": "Extraction_Method",
    "sourceName": "Source_Name",
    "sourceUrl": "Source_URL",
    "sourceDocument": "Source_Document",
    "page": "Page_Number",
    "reportedPeriod": "Reported_Period",
    "evidence": "Evidence_Text",
    "retrievedAt": "Retrieved_At",
    "notes": "Notes",
}

SOURCE_FIELDS = {
    "id": "Source_ID",
    "name": "Source_Name",
    "url": "Source_URL",
    "type": "Source_Type",
    "document": "Source_Document",
    "retrievedAt": "Retrieved_At",
    "localPath": "Local_Path",
    "licenseNotes": "License_or_Use_Notes",
    "notes": "Notes",
}


def _json_value(value: Any) -> Any:
    """Convert pandas values to strict JSON values."""
    if pd.isna(value):
        return None
    if hasattr(value, "item"):
        return value.item()
    return value


def _read_rows(path: Path, fields: dict[str, str]) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    frame = pd.read_csv(path)
    rows = []
    for row in frame.to_dict(orient="records"):
        item = {public_name: _json_value(row.get(csv_name)) for public_name, csv_name in fields.items()}
        if "country" in item:
            item["country"] = normalize_country(item["country"])
            item["countryLabel"] = country_label(item["country"])
        rows.append(item)
    return rows


def build_site_payload(settings: Settings) -> dict[str, Any]:
    """Build a browser-safe payload from the normalized CSV files."""
    normalized = settings.normalized_dir
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "dataCenters": _read_rows(normalized / "datacenters.csv", DATA_CENTER_FIELDS),
        "metrics": _read_rows(normalized / "metrics_history.csv", METRIC_FIELDS),
        "sources": _read_rows(normalized / "sources.csv", SOURCE_FIELDS),
    }


def export_site_data(settings: Settings, output_path: Path | None = None) -> Path:
    """Write normalized data as a JavaScript global consumed by the static site."""
    target = output_path or settings.site_data_path
    target.parent.mkdir(parents=True, exist_ok=True)
    payload = build_site_payload(settings)
    serialized = json.dumps(payload, ensure_ascii=False, separators=(",", ":"), allow_nan=False).replace("<", "\\u003c")
    target.write_text("window.projectData = " + serialized + ";\n", encoding="utf-8")
    return target
