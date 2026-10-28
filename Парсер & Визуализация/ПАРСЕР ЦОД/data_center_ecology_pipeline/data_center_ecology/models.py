"""Typed, dependency-light data models and stable schemas."""

from dataclasses import asdict, dataclass
from typing import Any, Optional
import hashlib
import json


DATACENTER_COLUMNS = [
    "DataCenter_ID", "Company", "DataCenter_Name", "Country", "Region",
    "City_Location", "Address", "Latitude", "Longitude", "Status",
    "Source_Name", "Source_URL", "Retrieved_At", "Notes",
]
METRIC_COLUMNS = [
    "Metric_ID", "DataCenter_ID", "Company", "DataCenter_Name", "Year",
    "Metric_Name", "Value", "Raw_Value", "Country", "Region", "City_Location",
    "Metric_Scope", "Metric_Method", "Metric_Unit", "Data_Status", "Value_Type",
    "Extraction_Method", "Source_Name", "Source_URL", "Source_Document",
    "Page_Number", "Reported_Period", "Evidence_Text", "Retrieved_At", "Notes",
]
SOURCE_COLUMNS = [
    "Source_ID", "Source_Name", "Source_URL", "Source_Type", "Source_Document",
    "Retrieved_At", "Local_Path", "License_or_Use_Notes", "Notes",
]


def stable_id(*parts: object) -> str:
    """Return a deterministic short identifier for a logical record."""
    payload = "|".join(str(part or "").strip().casefold() for part in parts)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:20]


@dataclass
class DataCenterRecord:
    """One catalog record; missing facts remain ``None``."""

    company: Optional[str] = None
    name: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[str] = None
    source_name: Optional[str] = None
    source_url: Optional[str] = None
    retrieved_at: Optional[str] = None
    notes: Optional[str] = None
    data_center_id: Optional[str] = None

    def __post_init__(self) -> None:
        if not self.data_center_id:
            self.data_center_id = stable_id(self.company, self.name, self.country, self.address)

    def to_row(self) -> dict[str, Any]:
        """Convert the model to the stable CSV schema."""
        return {
            "DataCenter_ID": self.data_center_id,
            "Company": self.company,
            "DataCenter_Name": self.name,
            "Country": self.country,
            "Region": self.region,
            "City_Location": self.city,
            "Address": self.address,
            "Latitude": self.latitude,
            "Longitude": self.longitude,
            "Status": self.status,
            "Source_Name": self.source_name,
            "Source_URL": self.source_url,
            "Retrieved_At": self.retrieved_at,
            "Notes": self.notes,
        }


@dataclass
class MetricRecord:
    """One metric observation with explicit scope and provenance."""

    data_center_id: Optional[str]
    company: Optional[str]
    data_center_name: Optional[str]
    year: Optional[int]
    metric_name: str
    value: Optional[float]
    raw_value: Optional[str]
    metric_scope: str = "unknown"
    metric_method: Optional[str] = None
    metric_unit: Optional[str] = None
    data_status: str = "needs_review"
    value_type: str = "unknown"
    extraction_method: str = "unknown"
    source_name: Optional[str] = None
    source_url: Optional[str] = None
    source_document: Optional[str] = None
    page_number: Optional[int] = None
    reported_period: Optional[str] = None
    evidence_text: Optional[str] = None
    retrieved_at: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    notes: Optional[str] = None

    def to_row(self) -> dict[str, Any]:
        """Convert the model to the stable CSV schema."""
        row = {
            "Metric_ID": stable_id(self.data_center_id, self.year, self.metric_name,
                                    self.value, self.metric_scope, self.metric_method,
                                    self.source_url, self.page_number),
            "DataCenter_ID": self.data_center_id,
            "Company": self.company,
            "DataCenter_Name": self.data_center_name,
            "Year": self.year,
            "Metric_Name": self.metric_name,
            "Value": self.value,
            "Raw_Value": self.raw_value,
            "Country": self.country,
            "Region": self.region,
            "City_Location": self.city,
            "Metric_Scope": self.metric_scope,
            "Metric_Method": self.metric_method,
            "Metric_Unit": self.metric_unit,
            "Data_Status": self.data_status,
            "Value_Type": self.value_type,
            "Extraction_Method": self.extraction_method,
            "Source_Name": self.source_name,
            "Source_URL": self.source_url,
            "Source_Document": self.source_document,
            "Page_Number": self.page_number,
            "Reported_Period": self.reported_period,
            "Evidence_Text": self.evidence_text,
            "Retrieved_At": self.retrieved_at,
            "Notes": self.notes,
        }
        return row


@dataclass
class SourceRecord:
    """Registry entry for a web page, dataset, or local document."""

    source_name: str
    source_url: Optional[str]
    source_type: str
    source_document: Optional[str] = None
    retrieved_at: Optional[str] = None
    local_path: Optional[str] = None
    license_or_use_notes: Optional[str] = None
    notes: Optional[str] = None

    def to_row(self) -> dict[str, Any]:
        """Convert the model to the stable CSV schema."""
        row = asdict(self)
        row["Source_ID"] = stable_id(self.source_name, self.source_url, self.source_document)
        return {"Source_ID": row.pop("Source_ID"), **{
            "Source_Name": row["source_name"], "Source_URL": row["source_url"],
            "Source_Type": row["source_type"], "Source_Document": row["source_document"],
            "Retrieved_At": row["retrieved_at"], "Local_Path": row["local_path"],
            "License_or_Use_Notes": row["license_or_use_notes"], "Notes": row["notes"],
        }}


def json_dumps(value: Any) -> str:
    """Serialize metadata without leaking secrets into logs."""
    return json.dumps(value, ensure_ascii=False, default=str)
