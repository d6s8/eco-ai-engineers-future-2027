import json

import pandas as pd

from data_center_ecology.config import Settings
from data_center_ecology.site_export import export_site_data


def test_site_export_keeps_provenance_and_missing_values(tmp_path):
    normalized = tmp_path / "data" / "normalized"
    normalized.mkdir(parents=True)
    pd.DataFrame([{
        "DataCenter_ID": "dc-1",
        "Company": "Test",
        "DataCenter_Name": "Site",
        "Country": "Russia",
        "Region": None,
        "City_Location": "Moscow",
        "Address": None,
        "Latitude": None,
        "Longitude": None,
        "Status": None,
        "Source_Name": "Catalog",
        "Source_URL": "https://example.test/catalog",
        "Retrieved_At": "2026-10-22T00:00:00+00:00",
        "Notes": "Coordinates are not published.",
    }]).to_csv(normalized / "datacenters.csv", index=False)
    pd.DataFrame([{
        "Metric_ID": "metric-1",
        "DataCenter_ID": None,
        "Company": None,
        "DataCenter_Name": None,
        "Year": 2024,
        "Metric_Name": "PUE",
        "Value": None,
        "Raw_Value": "PUE 1.2 and 1.3",
        "Country": None,
        "Region": None,
        "City_Location": None,
        "Metric_Scope": "unknown",
        "Metric_Method": None,
        "Metric_Unit": "ratio",
        "Data_Status": "needs_review",
        "Value_Type": "reported",
        "Extraction_Method": "pdf_text_line_candidate",
        "Source_Name": "Report",
        "Source_URL": None,
        "Source_Document": "report.pdf",
        "Page_Number": 3,
        "Reported_Period": None,
        "Evidence_Text": "PUE 1.2 and 1.3",
        "Retrieved_At": "2026-10-22T00:00:00+00:00",
        "Notes": "Needs review.",
    }]).to_csv(normalized / "metrics_history.csv", index=False)
    pd.DataFrame([{
        "Source_ID": "source-1",
        "Source_Name": "Catalog",
        "Source_URL": "https://example.test/catalog",
        "Source_Type": "catalog_csv",
        "Source_Document": None,
        "Retrieved_At": "2026-10-22T00:00:00+00:00",
        "Local_Path": None,
        "License_or_Use_Notes": None,
        "Notes": None,
    }]).to_csv(normalized / "sources.csv", index=False)

    target = tmp_path / "site-data.js"
    export_site_data(Settings(root=tmp_path), target)
    payload = json.loads(target.read_text(encoding="utf-8").removeprefix("window.projectData = ").rstrip(";\n"))

    assert len(payload["dataCenters"]) == 1
    assert payload["dataCenters"][0]["address"] is None
    assert payload["dataCenters"][0]["country"] == "Russia"
    assert payload["dataCenters"][0]["countryLabel"] == "Россия"
    assert payload["metrics"][0]["dataStatus"] == "needs_review"
    assert payload["metrics"][0]["sourceDocument"] == "report.pdf"
    assert payload["sources"][0]["url"] == "https://example.test/catalog"
