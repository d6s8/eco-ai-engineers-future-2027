"""Conservative HTTP utilities and a BeautifulSoup card-adapter template."""

from __future__ import annotations

from dataclasses import dataclass
from time import monotonic, sleep
from typing import Any
import logging

import requests
from bs4 import BeautifulSoup

LOGGER = logging.getLogger(__name__)


class SourceAccessError(RuntimeError):
    """Raised when a source cannot be fetched within configured limits."""


@dataclass
class HttpFetcher:
    """One-session fetcher with bounded retries and no access-control bypass."""

    timeout: float = 30.0
    retries: int = 2
    delay: float = 1.0
    max_bytes: int = 50 * 1024 * 1024
    user_agent: str = "data-center-ecology-pipeline/0.1"

    def __post_init__(self) -> None:
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": self.user_agent})
        self._last_request = 0.0

    def get(self, url: str) -> requests.Response:
        """GET a URL with status checks and exponential retry for transient errors."""
        for attempt in range(self.retries + 1):
            wait = self.delay - (monotonic() - self._last_request)
            if wait > 0:
                sleep(wait)
            try:
                response = self.session.get(url, timeout=self.timeout, stream=True)
                self._last_request = monotonic()
                if response.status_code in {403, 429}:
                    raise SourceAccessError(f"Access restricted by source: HTTP {response.status_code}")
                response.raise_for_status()
                content_length = response.headers.get("Content-Length")
                if content_length and int(content_length) > self.max_bytes:
                    raise SourceAccessError("Download exceeds configured size limit")
                content = response.content
                if len(content) > self.max_bytes:
                    raise SourceAccessError("Download exceeds configured size limit")
                response._content = content
                return response
            except (requests.RequestException, SourceAccessError) as exc:
                if isinstance(exc, SourceAccessError) and "HTTP 403" in str(exc):
                    raise
                if attempt >= self.retries:
                    raise SourceAccessError(f"Failed to fetch {url}: {exc}") from exc
                sleep(self.delay * (2 ** attempt))
        raise SourceAccessError(f"Failed to fetch {url}")


def parse_html_cards(html: str, selectors: dict[str, str]) -> list[dict[str, Any]]:
    """Parse configured HTML cards; selectors must be verified per source.

    This helper deliberately has no default selectors: a site-specific adapter
    must document and test them against real HTML before use.
    """
    soup = BeautifulSoup(html, "html.parser")
    card_selector = selectors.get("card")
    if not card_selector:
        raise ValueError("A verified 'card' CSS selector is required")
    rows: list[dict[str, Any]] = []
    for card in soup.select(card_selector):
        row: dict[str, Any] = {}
        for field, selector in selectors.items():
            if field == "card":
                continue
            node = card.select_one(selector)
            row[field] = node.get_text(" ", strip=True) if node else None
            if field == "url" and node:
                row[field] = node.get("href")
        rows.append(row)
    return rows
