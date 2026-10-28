"""Idempotent CSV storage and explicit summary generation."""

from __future__ import annotations

from pathlib import Path
from typing import Iterable
import logging
import pandas as pd

from .models import DATACENTER_COLUMNS, METRIC_COLUMNS, SOURCE_COLUMNS, DataCenterRecord, MetricRecord, SourceRecord
from .normalization import normalize_country

LOGGER = logging.getLogger(__name__)

RUSSIAN_COLUMNS = {
    "Metric_ID": "ID метрики", "DataCenter_ID": "ID ЦОД", "Company": "Компания", "DataCenter_Name": "Название ЦОД",
    "Country": "Страна", "Region": "Регион", "City_Location": "Город",
    "Address": "Адрес", "Latitude": "Широта", "Longitude": "Долгота", "Status": "Статус",
    "Year": "Год", "Metric_Name": "Метрика", "Value": "Значение", "Raw_Value": "Исходное значение",
    "Metric_Scope": "Охват метрики", "Metric_Method": "Методика", "Metric_Unit": "Единица",
    "Data_Status": "Статус данных", "Value_Type": "Тип значения", "Extraction_Method": "Способ извлечения",
    "Source_Name": "Название источника", "Source_URL": "Ссылка на источник", "Source_Type": "Тип источника",
    "Source_Document": "Документ источника", "Page_Number": "Страница", "Reported_Period": "Отчётный период",
    "Evidence_Text": "Фрагмент источника", "Retrieved_At": "Дата получения", "Local_Path": "Локальный файл",
    "License_or_Use_Notes": "Условия использования", "Notes": "Примечания", "Summary_Note": "Примечание сводки",
    "PUE": "PUE", "WUE": "WUE", "CUE": "CUE",
}

RUSSIAN_VALUES = {
    "Metric_Scope": {"facility": "объект", "company": "компания", "region": "регион", "fleet": "группа объектов", "industry": "отрасль", "unknown": "неизвестно"},
    "Data_Status": {"extracted": "извлечено", "needs_review": "нужна проверка"},
    "Value_Type": {"measured": "измеренное", "reported": "заявленное", "calculated": "расчётное", "estimated": "оценочное", "unknown": "неизвестно"},
    "Source_Type": {"catalog_csv": "CSV-каталог", "pdf": "PDF-отчёт"},
    "Extraction_Method": {"pdf_text_line_candidate": "кандидат из строки PDF", "pdf_text_line": "строка текста PDF"},
}

RUSSIAN_NOTES = {
    "Open snapshot; coordinates are not present in the published CSV. Use GeoJSON only when coordinate precision is acceptable.": "Открытый снимок; координаты отсутствуют в опубликованном CSV и не выдумываются.",
    "Candidate requires manual context check; tables and multi-year lines are not auto-assigned.": "Кандидат требует ручной проверки контекста; таблицы и строки с несколькими годами автоматически не распределяются.",
}


def _append_unique(path: Path, rows: list[dict], columns: list[str], key: list[str]) -> pd.DataFrame:
    path.parent.mkdir(parents=True, exist_ok=True)
    incoming = pd.DataFrame(rows, columns=columns)
    existing = pd.read_csv(path) if path.exists() else pd.DataFrame(columns=columns)
    combined = pd.concat([existing, incoming], ignore_index=True)
    if not combined.empty:
        combined = combined.drop_duplicates(subset=key, keep="last")
        combined = combined.sort_values(key, kind="stable", na_position="last").reset_index(drop=True)
    combined = combined.reindex(columns=columns)
    combined.to_csv(path, index=False, encoding="utf-8")
    return combined


def save_datacenters(records: Iterable[DataCenterRecord], path: Path) -> pd.DataFrame:
    """Append catalog records without deleting prior history."""
    return _append_unique(path, [record.to_row() for record in records], DATACENTER_COLUMNS, ["DataCenter_ID", "Source_URL"])


def save_metrics(records: Iterable[MetricRecord], path: Path) -> pd.DataFrame:
    """Append metric observations; source and method remain part of identity."""
    return _append_unique(path, [record.to_row() for record in records], METRIC_COLUMNS, ["Metric_ID"])


def save_sources(records: Iterable[SourceRecord], path: Path) -> pd.DataFrame:
    """Append source registry entries."""
    return _append_unique(path, [record.to_row() for record in records], SOURCE_COLUMNS, ["Source_ID"])


def save_russian_copy(frame: pd.DataFrame, path: Path) -> pd.DataFrame:
    """Сохранить понятную русскую копию таблицы для просмотра человеком.

    Английская техническая таблица не изменяется и остаётся совместимой с pandas/GIS.
    """
    локальная = frame.copy()
    for колонка, замены in RUSSIAN_VALUES.items():
        if колонка in локальная.columns:
            локальная[колонка] = локальная[колонка].replace(замены)
    if "Notes" in локальная.columns:
        локальная["Notes"] = локальная["Notes"].replace(RUSSIAN_NOTES)
        локальная["Notes"] = (
            локальная["Notes"].astype("string")
            .str.replace("Source city field rejected as numeric-only:",
                         "Исходное поле города отклонено: только цифры:", regex=False)
            .str.replace("value moved to the audit note and city remains unknown.",
                         "значение сохранено в примечании для проверки, город оставлен неизвестным.", regex=False)
        )
    локальная = локальная.rename(columns=RUSSIAN_COLUMNS)
    локальная.to_csv(path, index=False, encoding="utf-8-sig")
    return локальная


def sanitize_country_values(path: Path) -> pd.DataFrame:
    """Normalize country fields and preserve rejected source values in notes."""
    if not path.exists():
        return pd.DataFrame()
    frame = pd.read_csv(path, dtype=str, keep_default_na=False)
    if "Country" not in frame.columns:
        return frame

    def normalize_row(row: pd.Series) -> str:
        original = row["Country"].strip()
        normalized = normalize_country(original)
        if original and normalized is None:
            note = f"Country value rejected during normalization: {original}"
            existing = row.get("Notes", "").strip()
            if note not in existing:
                row["Notes"] = f"{existing} {note}".strip()
        return normalized or ""

    frame["Country"] = frame.apply(normalize_row, axis=1)
    frame.to_csv(path, index=False, encoding="utf-8")
    return frame


def build_summary(metrics_path: Path, datacenters_path: Path, output_path: Path) -> pd.DataFrame:
    """Create object-year summary only for unambiguous same-scope/method/unit values.

    If multiple values exist for one object/year/metric after applying the same
    scope, method and unit, the summary leaves the cell empty and records a note.
    This prevents incompatible corporate/facility values from being merged.
    """
    metrics = pd.read_csv(metrics_path) if metrics_path.exists() else pd.DataFrame(columns=METRIC_COLUMNS)
    datacenters = pd.read_csv(datacenters_path) if datacenters_path.exists() else pd.DataFrame(columns=DATACENTER_COLUMNS)
    if metrics.empty:
        result = datacenters.copy()
        result.to_csv(output_path, index=False, encoding="utf-8")
        return result
    base_columns = ["DataCenter_ID", "Company", "DataCenter_Name", "Country", "Region", "City_Location", "Address", "Latitude", "Longitude", "Year"]
    left = datacenters.reindex(columns=[c for c in base_columns if c != "Year"]).drop_duplicates("DataCenter_ID")
    rows: list[dict] = []
    group_keys = ["DataCenter_ID", "Year", "Metric_Name", "Metric_Scope", "Metric_Method", "Metric_Unit"]
    for keys, group in metrics.groupby(group_keys, dropna=False):
        data_center_id, year, metric_name, scope, method, unit = keys
        values = group["Value"].dropna().unique()
        if len(values) == 1:
            value = values[0]
            note = None
        else:
            value = None
            note = "conflict_or_ambiguous_values; inspect metrics_history.csv"
        rows.append({"DataCenter_ID": data_center_id, "Year": year, "Metric_Name": metric_name,
                     "Metric_Scope": scope, "Metric_Method": method, "Metric_Unit": unit,
                     "Value": value, "Summary_Note": note})
    wide = pd.DataFrame(rows)
    if wide.empty:
        result = left
    else:
        # Summary has one row per object/year, but only a single explicit scope/method/unit is pivoted.
        pivot = wide.pivot_table(index=["DataCenter_ID", "Year"], columns="Metric_Name", values="Value", aggfunc="first").reset_index()
        pivot.columns.name = None
        notes = wide.groupby(["DataCenter_ID", "Year"], dropna=False)["Summary_Note"].apply(lambda s: "; ".join(sorted(set(x for x in s.dropna()))) or None).reset_index(name="Summary_Note")
        result = pivot.merge(left, on="DataCenter_ID", how="left").merge(notes, on=["DataCenter_ID", "Year"], how="left")
    for metric in ("PUE", "WUE", "CUE"):
        if metric not in result.columns:
            result[metric] = pd.NA
    result = result[[c for c in ["Company", "DataCenter_Name", "Country", "Region", "City_Location", "Address", "Latitude", "Longitude", "Year", "PUE", "WUE", "CUE", "DataCenter_ID", "Summary_Note"] if c in result.columns]]
    result.to_csv(output_path, index=False, encoding="utf-8")
    return result
