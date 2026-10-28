"""Configuration for the data collection pipeline."""

from dataclasses import dataclass, field
from pathlib import Path
import os


@dataclass(frozen=True)
class Settings:
    """Runtime paths and conservative network limits."""

    root: Path = field(default_factory=lambda: Path(__file__).resolve().parents[1])
    request_timeout: float = float(os.getenv("DCE_REQUEST_TIMEOUT", "30"))
    request_retries: int = int(os.getenv("DCE_REQUEST_RETRIES", "2"))
    request_delay: float = float(os.getenv("DCE_REQUEST_DELAY", "1.0"))
    max_download_bytes: int = int(os.getenv("DCE_MAX_DOWNLOAD_BYTES", str(50 * 1024 * 1024)))
    user_agent: str = os.getenv(
        "DCE_USER_AGENT",
        "data-center-ecology-pipeline/0.1 (+research project; contact: local project owner)",
    )

    @property
    def data_dir(self) -> Path:
        return self.root / "data"

    @property
    def raw_dir(self) -> Path:
        return self.data_dir / "raw"

    @property
    def normalized_dir(self) -> Path:
        return self.data_dir / "normalized"

    @property
    def log_dir(self) -> Path:
        return self.data_dir / "logs"

    @property
    def site_dir(self) -> Path:
        """Directory of the existing static site receiving exported data."""
        configured = os.getenv("DCE_SITE_DIR")
        if configured:
            return Path(configured).expanduser()
        repository_site = self.root.parents[2] / "Сайт & Инструменты" / "САЙТ"
        if repository_site.exists():
            return repository_site
        return self.root.parent.parent / "SITE # SOURCE"

    @property
    def site_data_path(self) -> Path:
        """Generated browser data file consumed by the existing site."""
        return self.site_dir / "site-data.js"

    def ensure_directories(self) -> None:
        """Create configured output directories if they do not exist."""
        for directory in (self.raw_dir, self.normalized_dir, self.log_dir):
            directory.mkdir(parents=True, exist_ok=True)
