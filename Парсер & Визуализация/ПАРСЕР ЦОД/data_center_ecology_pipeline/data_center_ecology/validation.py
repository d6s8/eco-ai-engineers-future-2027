"""Validation and quality flags; suspicious values are never corrected silently."""

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable
import pandas as pd


@dataclass(frozen=True)
class ValidationIssue:
    severity: str
    code: str
    message: str
    row_index: int | None = None


def validate_coordinates(frame: pd.DataFrame) -> list[ValidationIssue]:
    """Validate latitude and longitude ranges."""
    issues: list[ValidationIssue] = []
    for index, row in frame.iterrows():
        lat, lon = row.get("Latitude"), row.get("Longitude")
        if pd.notna(lat) and not -90 <= float(lat) <= 90:
            issues.append(ValidationIssue("error", "latitude_range", "Latitude is outside [-90, 90].", int(index)))
        if pd.notna(lon) and not -180 <= float(lon) <= 180:
            issues.append(ValidationIssue("error", "longitude_range", "Longitude is outside [-180, 180].", int(index)))
    return issues


def validate_datacenters(frame: pd.DataFrame) -> list[ValidationIssue]:
    """Check schema, coordinates, missing identities and duplicate records."""
    issues: list[ValidationIssue] = []
    required = {"DataCenter_ID", "Company", "DataCenter_Name", "Country"}
    missing = required - set(frame.columns)
    if missing:
        issues.append(ValidationIssue("error", "missing_columns", f"Missing columns: {sorted(missing)}"))
        return issues
    issues.extend(validate_coordinates(frame))
    duplicate_mask = frame.duplicated(subset=["DataCenter_ID"], keep=False)
    for index in frame.index[duplicate_mask]:
        issues.append(ValidationIssue("warning", "duplicate_datacenter", "Repeated DataCenter_ID.", int(index)))
    for index, row in frame.iterrows():
        if not row["DataCenter_ID"] or not row["DataCenter_Name"]:
            issues.append(ValidationIssue("warning", "missing_identity", "Object lacks a stable identity.", int(index)))
    return issues


def validate_metrics(frame: pd.DataFrame) -> list[ValidationIssue]:
    """Validate metric types, years, scopes, duplicates and PUE warnings."""
    issues: list[ValidationIssue] = []
    required = {"DataCenter_ID", "Year", "Metric_Name", "Value", "Metric_Scope", "Metric_Unit"}
    missing = required - set(frame.columns)
    if missing:
        issues.append(ValidationIssue("error", "missing_columns", f"Missing columns: {sorted(missing)}"))
        return issues
    valid_scopes = {"facility", "company", "region", "fleet", "industry", "unknown"}
    for index, row in frame.iterrows():
        year = row["Year"]
        if pd.notna(year) and not 1900 <= int(year) <= 2100:
            issues.append(ValidationIssue("warning", "year_range", "Year is outside 1900-2100.", int(index)))
        if row["Metric_Scope"] not in valid_scopes:
            issues.append(ValidationIssue("error", "scope_value", "Unknown Metric_Scope value.", int(index)))
        if str(row["Metric_Name"]).upper() == "PUE" and pd.notna(row["Value"]):
            if float(row["Value"]) < 1:
                issues.append(ValidationIssue("warning", "pue_below_one", "PUE is below 1; retain and review.", int(index)))
        if pd.notna(row["Value"]) and not isinstance(row["Value"], (int, float)):
            issues.append(ValidationIssue("error", "metric_type", "Metric Value is not numeric.", int(index)))
    keys = [
        "DataCenter_ID", "Year", "Metric_Name", "Metric_Scope", "Metric_Method", "Metric_Unit",
        "Source_Document", "Page_Number",
    ]
    existing = [key for key in keys if key in frame.columns]
    duplicate_mask = frame.duplicated(subset=existing, keep=False)
    for index in frame.index[duplicate_mask]:
        issues.append(ValidationIssue("warning", "metric_duplicate_or_conflict", "Same logical metric key occurs more than once.", int(index)))
    return issues


def issues_to_frame(issues: Iterable[ValidationIssue]) -> pd.DataFrame:
    """Convert validation issues to a serializable table."""
    return pd.DataFrame([issue.__dict__ for issue in issues], columns=["severity", "code", "message", "row_index"])


def validate_saved_data(datacenters_path: Path, metrics_path: Path) -> list[ValidationIssue]:
    """Validate saved CSV files without changing them.

    Missing files are warnings because a first-time checkout may not have
    downloaded or parsed any source yet. Malformed files are errors.
    """
    issues: list[ValidationIssue] = []
    datasets = (
        (datacenters_path, validate_datacenters),
        (metrics_path, validate_metrics),
    )
    for path, validator in datasets:
        if not path.exists():
            issues.append(ValidationIssue("warning", "missing_file", f"File not found: {path}"))
            continue
        try:
            frame = pd.read_csv(path)
        except (OSError, pd.errors.EmptyDataError, pd.errors.ParserError) as exc:
            issues.append(ValidationIssue("error", "unreadable_file", f"Could not read {path}: {exc}"))
            continue
        issues.extend(validator(frame))
    return issues
