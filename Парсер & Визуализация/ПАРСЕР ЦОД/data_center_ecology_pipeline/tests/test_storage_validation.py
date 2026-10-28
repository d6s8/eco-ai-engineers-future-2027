from pathlib import Path
import pandas as pd

from data_center_ecology.models import DataCenterRecord, MetricRecord, DATACENTER_COLUMNS, METRIC_COLUMNS
from data_center_ecology.storage import save_datacenters, save_metrics
from data_center_ecology.validation import validate_datacenters, validate_metrics


def test_storage_is_idempotent_and_preserves_missing(tmp_path: Path):
    record = DataCenterRecord(company="Test", name="Site", country="Germany", source_url="https://example.test")
    path = tmp_path / "datacenters.csv"
    save_datacenters([record, record], path)
    frame = pd.read_csv(path)
    assert list(frame.columns) == DATACENTER_COLUMNS
    assert len(frame) == 1
    assert pd.isna(frame.loc[0, "Latitude"])


def test_corporate_metric_is_not_facility_metric(tmp_path: Path):
    record = DataCenterRecord(company="Test", name="Site", country="Germany")
    metric = MetricRecord(record.data_center_id, "Test", "Site", 2024, "PUE", 1.2, "1.2", metric_scope="company", metric_unit="ratio")
    path = tmp_path / "metrics.csv"
    save_metrics([metric], path)
    frame = pd.read_csv(path)
    assert list(frame.columns) == METRIC_COLUMNS
    assert frame.loc[0, "Metric_Scope"] == "company"
    assert not any(issue.code == "pue_below_one" for issue in validate_metrics(frame))


def test_validation_flags_bad_coordinate_and_pue():
    datacenters = pd.DataFrame([{"DataCenter_ID": "x", "Company": "A", "DataCenter_Name": "B", "Country": "C", "Latitude": 95, "Longitude": 0}])
    assert any(issue.code == "latitude_range" for issue in validate_datacenters(datacenters))
    metrics = pd.DataFrame([{"DataCenter_ID": "x", "Year": 2024, "Metric_Name": "PUE", "Value": 0.8, "Metric_Scope": "facility", "Metric_Unit": "ratio"}])
    assert any(issue.code == "pue_below_one" for issue in validate_metrics(metrics))
