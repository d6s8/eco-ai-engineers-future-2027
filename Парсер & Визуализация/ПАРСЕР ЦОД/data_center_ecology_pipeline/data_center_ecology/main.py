"""Command-line entry point for the reproducible pipeline."""

from __future__ import annotations

import argparse
import logging
from datetime import datetime, timezone
from pathlib import Path

from .config import Settings
from .models import SourceRecord
from .parsers.pdf_parser import extract_pdf_metrics
from .sources.atlas import AtlasCsvAdapter, ATLAS_CSV_URL, ATLAS_SOURCE_URL
from .site_export import export_site_data
from .storage import build_summary, sanitize_country_values, save_datacenters, save_metrics, save_sources, save_russian_copy
from .validation import validate_saved_data


def configure_logging(settings: Settings) -> None:
    """Configure console and file logging without secrets."""
    settings.ensure_directories()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s",
                        handlers=[logging.StreamHandler(), logging.FileHandler(settings.log_dir / "pipeline.log", encoding="utf-8")])


def run_atlas(settings: Settings, limit: int | None = None) -> None:
    """Download ATLAS, save object history and refresh the summary."""
    adapter = AtlasCsvAdapter(settings)
    records = adapter.fetch(limit=limit)
    datacenters = save_datacenters(records, settings.normalized_dir / "datacenters.csv")
    datacenters = sanitize_country_values(settings.normalized_dir / "datacenters.csv")
    save_russian_copy(datacenters, settings.normalized_dir / "дата_центры.csv")
    sources = save_sources([SourceRecord(
        source_name=adapter.source_name, source_url=ATLAS_SOURCE_URL, source_type="catalog_csv",
        retrieved_at=datetime.now(timezone.utc).isoformat(), license_or_use_notes="Attribution required: Data centers (c) Ringmast4r - Global-Data-Center-Map.",
        notes=f"Download URL: {ATLAS_CSV_URL}; public snapshot, not a live feed.",
    )], settings.normalized_dir / "sources.csv")
    save_russian_copy(sources, settings.normalized_dir / "источники.csv")
    summary = build_summary(settings.normalized_dir / "metrics_history.csv", settings.normalized_dir / "datacenters.csv",
                            settings.normalized_dir / "datacenters_history_metrics.csv")
    save_russian_copy(summary, settings.normalized_dir / "дата_центры_сводка.csv")


def run_pdf(settings: Settings, pdf_path: Path, source_name: str, source_url: str | None, source_document: str | None,
            year: int | None, metric_scope: str) -> None:
    """Parse a local PDF and append auditable candidates."""
    metadata = {"source_name": source_name, "source_url": source_url, "source_document": source_document or pdf_path.name,
                "reported_period": str(year) if year else None, "metric_scope": metric_scope,
                "value_type": "reported", "retrieved_at": datetime.now(timezone.utc).isoformat()}
    records = extract_pdf_metrics(pdf_path, metadata)
    metrics = save_metrics(records, settings.normalized_dir / "metrics_history.csv")
    metrics = sanitize_country_values(settings.normalized_dir / "metrics_history.csv")
    save_russian_copy(metrics, settings.normalized_dir / "метрики_история.csv")
    sources = save_sources([SourceRecord(source_name=source_name, source_url=source_url, source_type="pdf",
                               source_document=source_document or pdf_path.name,
                               retrieved_at=metadata["retrieved_at"], local_path=str(pdf_path))], settings.normalized_dir / "sources.csv")
    save_russian_copy(sources, settings.normalized_dir / "источники.csv")


def run_validate(settings: Settings, strict: bool = False) -> None:
    """Check stored datasets and optionally fail on errors."""
    issues = validate_saved_data(
        settings.normalized_dir / "datacenters.csv",
        settings.normalized_dir / "metrics_history.csv",
    )
    if not issues:
        logging.getLogger(__name__).info("Validation passed: no issues found.")
        return
    for issue in issues:
        location = f" row={issue.row_index}" if issue.row_index is not None else ""
        logging.getLogger(__name__).warning("[%s] %s%s: %s", issue.code, issue.severity, location, issue.message)
    errors = sum(issue.severity == "error" for issue in issues)
    warnings = sum(issue.severity == "warning" for issue in issues)
    logging.getLogger(__name__).info("Validation summary: %s error(s), %s warning(s).", errors, warnings)
    if strict and errors:
        raise SystemExit(1)


def build_parser() -> argparse.ArgumentParser:
    """Build the CLI parser."""
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    atlas = sub.add_parser("atlas", help="download the verified ATLAS CSV snapshot")
    atlas.add_argument("--limit", type=int, default=None)
    pdf = sub.add_parser("pdf", help="extract candidate metrics from a local PDF")
    pdf.add_argument("path", type=Path)
    pdf.add_argument("--source-name", required=True)
    pdf.add_argument("--source-url")
    pdf.add_argument("--source-document")
    pdf.add_argument("--year", type=int)
    pdf.add_argument("--metric-scope", choices=["facility", "company", "region", "fleet", "industry", "unknown"], default="unknown")
    sub.add_parser("summary", help="rebuild the wide object-year summary")
    export = sub.add_parser("export-site", help="export normalized data for the existing website")
    export.add_argument("--output", type=Path, default=None)
    sub.add_parser("sanitize", help="normalize country fields in stored datasets")
    validate = sub.add_parser("validate", help="check normalized CSV files without changing them")
    validate.add_argument("--strict", action="store_true", help="return exit code 1 when errors are found")
    return parser


def main() -> None:
    """Run the requested pipeline command."""
    settings = Settings()
    configure_logging(settings)
    args = build_parser().parse_args()
    if args.command == "atlas":
        run_atlas(settings, args.limit)
    elif args.command == "pdf":
        run_pdf(settings, args.path, args.source_name, args.source_url, args.source_document, args.year, args.metric_scope)
    elif args.command == "summary":
        summary = build_summary(settings.normalized_dir / "metrics_history.csv", settings.normalized_dir / "datacenters.csv",
                                settings.normalized_dir / "datacenters_history_metrics.csv")
        save_russian_copy(summary, settings.normalized_dir / "дата_центры_сводка.csv")
    elif args.command == "export-site":
        datacenters = sanitize_country_values(settings.normalized_dir / "datacenters.csv")
        metrics = sanitize_country_values(settings.normalized_dir / "metrics_history.csv")
        if not datacenters.empty:
            save_russian_copy(datacenters, settings.normalized_dir / "дата_центры.csv")
        if not metrics.empty:
            save_russian_copy(metrics, settings.normalized_dir / "метрики_история.csv")
        output_path = export_site_data(settings, args.output)
        logging.getLogger(__name__).info("Exported website data to %s", output_path)
    elif args.command == "sanitize":
        datacenters = sanitize_country_values(settings.normalized_dir / "datacenters.csv")
        metrics = sanitize_country_values(settings.normalized_dir / "metrics_history.csv")
        if not datacenters.empty:
            save_russian_copy(datacenters, settings.normalized_dir / "дата_центры.csv")
        if not metrics.empty:
            save_russian_copy(metrics, settings.normalized_dir / "метрики_история.csv")
    elif args.command == "validate":
        run_validate(settings, args.strict)


if __name__ == "__main__":
    main()
