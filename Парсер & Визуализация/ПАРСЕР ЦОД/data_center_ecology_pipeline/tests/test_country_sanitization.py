import pandas as pd

from data_center_ecology.storage import sanitize_country_values


def test_sanitize_country_values_clears_invalid_values_and_keeps_audit_note(tmp_path):
    path = tmp_path / "datacenters.csv"
    pd.DataFrame([
        {"DataCenter_ID": "valid", "Country": "España", "Notes": ""},
        {"DataCenter_ID": "invalid", "Country": "200137", "Notes": "Existing note."},
    ]).to_csv(path, index=False)

    result = sanitize_country_values(path)

    assert result.loc[0, "Country"] == "Spain"
    assert result.loc[1, "Country"] == ""
    assert "200137" in result.loc[1, "Notes"]
