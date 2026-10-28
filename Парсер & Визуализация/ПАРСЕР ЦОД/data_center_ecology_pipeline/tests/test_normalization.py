from data_center_ecology.normalization import country_label, normalize_country, normalize_unit, parse_number, parse_year


def test_parse_number_decimal_comma_and_thousands():
    assert parse_number("1,25") == 1.25
    assert parse_number("1.234,56") == 1234.56


def test_units_and_years_are_conservative():
    assert normalize_unit("kg CO2e/kWh") == "kgCO2e/kWh"
    assert parse_year("FY2024") == 2024
    assert parse_year("2023–2024") is None
    assert normalize_country("USA") == "United States"


def test_country_normalization_rejects_addresses_and_localizes_valid_names():
    assert normalize_country("Taiwán 114") == "Taiwan"
    assert normalize_country("200137") is None
    assert normalize_country("1 Chome−26−3 京阪神西心斎橋ビル") is None
    assert country_label("Germany") == "Германия"
