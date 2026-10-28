"""Adapter for the verified open ATLAS/Global Data Center Map CSV snapshot."""

from __future__ import annotations

from datetime import datetime, timezone
from io import BytesIO
from typing import Iterable
import logging
import re

import pandas as pd

from ..config import Settings
from ..models import DataCenterRecord
from ..normalization import clean_text, normalize_country
from .base import HttpFetcher

LOGGER = logging.getLogger(__name__)
ATLAS_CSV_URL = "https://raw.githubusercontent.com/Ringmast4r/Global-Data-Center-Map/refs/heads/main/datacenters.csv"
ATLAS_SOURCE_URL = "https://data-center-map.com/"


def _normalize_atlas_city(raw_city: str | None) -> tuple[str | None, str | None]:
    """Return a plausible city and a warning for a corrupted numeric-only value.

    The public snapshot occasionally puts a phone number, postal fragment, or
    another numeric token into ``city``. It is safer to keep the city unknown
    than to present that token as a real place name.
    """
    city = clean_text(raw_city)
    if city and re.fullmatch(r"\d+", city):
        warning = f"Source city field rejected as numeric-only: {city}"
        return None, warning
    return city, None


class AtlasCsvAdapter:
    """Download and normalize the public CSV snapshot; no JS scraping required."""

    source_name = "ATLAS / Global Data Center Map"

    def __init__(self, settings: Settings | None = None, fetcher: HttpFetcher | None = None) -> None:
        settings = settings or Settings()
        self.fetcher = fetcher or HttpFetcher(timeout=settings.request_timeout, retries=settings.request_retries,
                                               delay=settings.request_delay, max_bytes=settings.max_download_bytes,
                                               user_agent=settings.user_agent)

    def fetch(self, limit: int | None = None) -> list[DataCenterRecord]:
        """Fetch the published snapshot and return normalized object records."""
        response = self.fetcher.get(ATLAS_CSV_URL)
        frame = pd.read_csv(BytesIO(response.content), dtype=str, keep_default_na=False)
        expected = {"name", "company", "city", "state", "country", "address"}
        missing = expected - set(frame.columns)
        if missing:
            raise ValueError(f"ATLAS CSV schema changed; missing columns: {sorted(missing)}")
        if limit is not None:
            frame = frame.head(limit)
        retrieved_at = datetime.now(timezone.utc).isoformat()
        records: list[DataCenterRecord] = []
        for row in frame.to_dict("records"):
            city, city_warning = _normalize_atlas_city(row.get("city"))
            notes = "Open snapshot; coordinates are not present in the published CSV. Use GeoJSON only when coordinate precision is acceptable."
            if city_warning:
                notes += f" {city_warning}; value moved to the audit note and city remains unknown."
            records.append(DataCenterRecord(
                company=clean_text(row.get("company")), name=clean_text(row.get("name")),
                country=normalize_country(row.get("country")), region=clean_text(row.get("state")),
                city=city, address=clean_text(row.get("address")),
                source_name=self.source_name, source_url=ATLAS_SOURCE_URL, retrieved_at=retrieved_at,
                notes=notes,
            ))
        LOGGER.info("Fetched %s ATLAS records", len(records))
        return records
