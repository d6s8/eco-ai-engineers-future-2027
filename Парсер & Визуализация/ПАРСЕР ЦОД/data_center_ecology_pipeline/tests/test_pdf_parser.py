from pathlib import Path
from unittest.mock import patch

from data_center_ecology.parsers.pdf_parser import _candidate_from_line, extract_pdf_metrics


def test_metric_candidate_keeps_context_and_page():
    record = _candidate_from_line("Average PUE was 1,12 in 2024; global operations.", 7, {"source_name": "Test"})
    assert record is not None
    assert record.metric_name == "PUE"
    assert record.value == 1.12
    assert record.year == 2024
    assert record.page_number == 7
    assert record.evidence_text.startswith("Average PUE")


def test_ambiguous_pdf_line_requires_review():
    record = _candidate_from_line("WUE 0.30 and 0.31 L/kWh, 2024", 2, {"source_name": "Test"})
    assert record is not None
    assert record.value is None
    assert record.data_status == "needs_review"


def test_invalid_pdf_returns_no_records(tmp_path: Path):
    invalid = tmp_path / "invalid.pdf"
    invalid.write_bytes(b"not a PDF")
    assert extract_pdf_metrics(invalid, {"source_name": "Test"}) == []
