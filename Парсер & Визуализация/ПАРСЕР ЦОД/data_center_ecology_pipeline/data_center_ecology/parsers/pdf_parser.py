"""Conservative two-stage PDF extraction for environmental metrics."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Optional
import logging
import re

from ..models import MetricRecord
from ..normalization import normalize_unit, parse_number, parse_year

LOGGER = logging.getLogger(__name__)
METRIC_ALIASES = {
    "PUE": r"\bPUE\b|power\s+usage\s+effectiveness",
    "WUE": r"\bWUE\b|water\s+usage\s+effectiveness",
    "CUE": r"\bCUE\b|carbon\s+usage\s+effectiveness",
    "ENERGY": r"total\s+energy|energy\s+consumption|electricity\s+consumption",
    "WATER": r"water\s+(?:withdrawal|consumption|use)|water\s+usage",
    "GHG": r"greenhouse\s+gas|GHG\s+emissions|CO2e",
}
NUMBER_RE = re.compile(r"(?<!\w)[+-]?\d+(?:[.,]\d+)?(?!\w)")


def _detect_metric(line: str) -> Optional[str]:
    for name, pattern in METRIC_ALIASES.items():
        if re.search(pattern, line, flags=re.IGNORECASE):
            return name
    return None


def _infer_unit(text: str, metric: str) -> Optional[str]:
    lowered = text.casefold()
    if metric == "PUE" or metric in {"WUE", "CUE"} and "kwh" in lowered:
        if "l/kwh" in lowered or "litre" in lowered or "liter" in lowered:
            return "L/kWh"
        if "kgco2e/kwh" in lowered or "kg co2e/kwh" in lowered:
            return "kgCO2e/kWh"
        if "gco2e/kwh" in lowered or "g co2e/kwh" in lowered:
            return "gCO2e/kWh"
        return "ratio" if metric == "PUE" else None
    return normalize_unit("kWh" if "kwh" in lowered else None)


def _candidate_from_line(line: str, page_number: int, metadata: dict[str, Any]) -> Optional[MetricRecord]:
    metric = _detect_metric(line)
    if not metric:
        return None
    numbers = NUMBER_RE.findall(line)
    year = parse_year(line)
    value_tokens = [token for token in numbers if not (len(token.replace(",", "").replace(".", "")) == 4 and token[:2] in {"19", "20"})]
    raw_value = value_tokens[0] if len(value_tokens) == 1 else None
    value = parse_number(raw_value) if raw_value is not None else None
    status = "extracted" if value is not None and year is not None else "needs_review"
    if len(value_tokens) > 1:
        status = "needs_review"
    return MetricRecord(
        data_center_id=metadata.get("data_center_id"), company=metadata.get("company"),
        data_center_name=metadata.get("data_center_name"), year=year, metric_name=metric,
        value=value, raw_value=raw_value, metric_scope=metadata.get("metric_scope", "unknown"),
        metric_method=metadata.get("metric_method"), metric_unit=_infer_unit(line, metric),
        data_status=status, value_type=metadata.get("value_type", "unknown"),
        extraction_method="pdf_text_line_candidate", source_name=metadata.get("source_name"),
        source_url=metadata.get("source_url"), source_document=metadata.get("source_document"),
        page_number=page_number, reported_period=metadata.get("reported_period"),
        evidence_text=line[:500], retrieved_at=metadata.get("retrieved_at"),
        country=metadata.get("country"), region=metadata.get("region"), city=metadata.get("city"),
        notes="Candidate requires manual context check; tables and multi-year lines are not auto-assigned.",
    )


def extract_pdf_metrics(pdf_path: Path, source_metadata: dict[str, Any]) -> list[MetricRecord]:
    """Extract auditable candidate metrics from a text PDF.

    The parser detects candidate lines first, then accepts a value only when
    exactly one non-year number and one unambiguous year occur on that line.
    Scanned PDFs are reported in logs and return no records; OCR is intentionally
    an optional separate step.
    """
    records: list[MetricRecord] = []
    try:
        if pdf_path.read_bytes()[:5] != b"%PDF-":
            LOGGER.error("Input does not have a PDF signature: %s", pdf_path)
            return records
    except OSError as exc:
        LOGGER.error("Could not read PDF %s: %s", pdf_path, exc)
        return records
    try:
        import pdfplumber
    except ImportError as exc:
        raise RuntimeError("Install pdfplumber to parse PDF files.") from exc
    try:
        with pdfplumber.open(str(pdf_path)) as pdf:
            if not pdf.pages:
                LOGGER.warning("PDF has no pages: %s", pdf_path)
                return records
            for page_number, page in enumerate(pdf.pages, start=1):
                text = page.extract_text() or ""
                if not text.strip():
                    LOGGER.warning("Page %s has no extractable text; OCR may be required: %s", page_number, pdf_path)
                    continue
                for line in text.splitlines():
                    candidate = _candidate_from_line(line.strip(), page_number, source_metadata)
                    if candidate:
                        records.append(candidate)
    except Exception as exc:
        # pdfplumber/pdfminer expose several parser-specific exception classes;
        # all are handled here as an expected input-quality error, with details
        # retained in the log rather than silently discarded.
        LOGGER.error("Could not read PDF %s: %s", pdf_path, exc)
        return records
    return records
