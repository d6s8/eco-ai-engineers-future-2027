"""Normalization of text, numbers, units, countries and reporting years."""

from __future__ import annotations

import re
from typing import Optional
import unicodedata


COUNTRY_ALIASES = {
    "usa": "United States", "us": "United States", "u.s.a.": "United States",
    "uk": "United Kingdom", "u.k.": "United Kingdom", "russian federation": "Russia",
    "россия": "Russia", "китай": "China", "германия": "Germany",
    "българия": "Bulgaria", "belgië": "Belgium", "bélgica": "Belgium",
    "canadá": "Canada", "chipre": "Cyprus", "danmark": "Denmark",
    "duitsland": "Germany", "españa": "Spain", "finlandia": "Finland",
    "france": "France", "grecia": "Greece", "japón": "Japan",
    "malasia": "Malaysia", "méxico": "Mexico", "moldávia": "Moldova",
    "nederland": "Netherlands", "niederlande": "Netherlands", "noorwegen": "Norway",
    "norge": "Norway", "países bajos": "Netherlands", "polska": "Poland",
    "república dominicana": "Dominican Republic", "românia": "Romania",
    "rumanía": "Romania", "sudáfrica": "South Africa", "suomi": "Finland",
    "sverige": "Sweden", "svizzera": "Switzerland", "tailandia": "Thailand",
    "taiwán": "Taiwan", "turquía": "Turkey", "türkiye": "Turkey",
    "việt nam": "Vietnam", "vietnam": "Vietnam", "czech republic": "Czechia",
    "republic of korea": "South Korea", "south korea": "South Korea",
    "ivory coast": "Côte d'Ivoire", "cape verde": "Cabo Verde",
    "swaziland": "Eswatini", "macedonia": "North Macedonia",
}

VALID_COUNTRIES = frozenset({
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
    "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain",
    "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
    "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
    "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada",
    "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
    "Democratic Republic of the Congo", "Republic of the Congo",
    "Costa Rica", "Côte d'Ivoire", "Croatia", "Cuba", "Cyprus", "Czechia", "Denmark",
    "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador",
    "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland",
    "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada",
    "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary",
    "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
    "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait",
    "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya",
    "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia",
    "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico",
    "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique",
    "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua",
    "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan",
    "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines",
    "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis",
    "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
    "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore",
    "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea",
    "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland",
    "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo",
    "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda",
    "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay",
    "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
})

COUNTRY_LABELS_RU = {
    "Afghanistan": "Афганистан", "Albania": "Албания", "Algeria": "Алжир", "Andorra": "Андорра",
    "Angola": "Ангола", "Antigua and Barbuda": "Антигуа и Барбуда", "Argentina": "Аргентина",
    "Armenia": "Армения", "Australia": "Австралия", "Austria": "Австрия", "Azerbaijan": "Азербайджан",
    "Bahamas": "Багамы", "Bahrain": "Бахрейн", "Bangladesh": "Бангладеш", "Barbados": "Барбадос",
    "Belarus": "Беларусь", "Belgium": "Бельгия", "Belize": "Белиз", "Benin": "Бенин",
    "Bhutan": "Бутан", "Bolivia": "Боливия", "Bosnia and Herzegovina": "Босния и Герцеговина",
    "Botswana": "Ботсвана", "Brazil": "Бразилия", "Brunei": "Бруней", "Bulgaria": "Болгария",
    "Burkina Faso": "Буркина-Фасо", "Burundi": "Бурунди", "Cabo Verde": "Кабо-Верде",
    "Cambodia": "Камбоджа", "Cameroon": "Камерун", "Canada": "Канада", "Central African Republic": "ЦАР",
    "Chad": "Чад", "Chile": "Чили", "China": "Китай", "Colombia": "Колумбия", "Comoros": "Коморы",
    "Democratic Republic of the Congo": "Демократическая Республика Конго", "Republic of the Congo": "Республика Конго",
    "Costa Rica": "Коста-Рика", "Côte d'Ivoire": "Кот-д'Ивуар", "Croatia": "Хорватия",
    "Cuba": "Куба", "Cyprus": "Кипр", "Czechia": "Чехия", "Denmark": "Дания", "Djibouti": "Джибути",
    "Dominica": "Доминика", "Dominican Republic": "Доминиканская Республика", "Ecuador": "Эквадор",
    "Egypt": "Египет", "El Salvador": "Сальвадор", "Equatorial Guinea": "Экваториальная Гвинея",
    "Eritrea": "Эритрея", "Estonia": "Эстония", "Eswatini": "Эсватини", "Ethiopia": "Эфиопия",
    "Fiji": "Фиджи", "Finland": "Финляндия", "France": "Франция", "Gabon": "Габон",
    "Gambia": "Гамбия", "Georgia": "Грузия", "Germany": "Германия", "Ghana": "Гана", "Greece": "Греция",
    "Grenada": "Гренада", "Guatemala": "Гватемала", "Guinea": "Гвинея", "Guinea-Bissau": "Гвинея-Бисау",
    "Guyana": "Гайана", "Haiti": "Гаити", "Honduras": "Гондурас", "Hungary": "Венгрия",
    "Iceland": "Исландия", "India": "Индия", "Indonesia": "Индонезия", "Iran": "Иран", "Iraq": "Ирак",
    "Ireland": "Ирландия", "Israel": "Израиль", "Italy": "Италия", "Jamaica": "Ямайка", "Japan": "Япония",
    "Jordan": "Иордания", "Kazakhstan": "Казахстан", "Kenya": "Кения", "Kiribati": "Кирибати",
    "Kuwait": "Кувейт", "Kyrgyzstan": "Кыргызстан", "Laos": "Лаос", "Latvia": "Латвия", "Lebanon": "Ливан",
    "Lesotho": "Лесото", "Liberia": "Либерия", "Libya": "Ливия", "Liechtenstein": "Лихтенштейн",
    "Lithuania": "Литва", "Luxembourg": "Люксембург", "Madagascar": "Мадагаскар", "Malawi": "Малави",
    "Malaysia": "Малайзия", "Maldives": "Мальдивы", "Mali": "Мали", "Malta": "Мальта",
    "Marshall Islands": "Маршалловы Острова", "Mauritania": "Мавритания", "Mauritius": "Маврикий",
    "Mexico": "Мексика", "Micronesia": "Микронезия", "Moldova": "Молдова", "Monaco": "Монако",
    "Mongolia": "Монголия", "Montenegro": "Черногория", "Morocco": "Марокко", "Mozambique": "Мозамбик",
    "Myanmar": "Мьянма", "Namibia": "Намибия", "Nauru": "Науру", "Nepal": "Непал", "Netherlands": "Нидерланды",
    "New Zealand": "Новая Зеландия", "Nicaragua": "Никарагуа", "Niger": "Нигер", "Nigeria": "Нигерия",
    "North Korea": "КНДР", "North Macedonia": "Северная Македония", "Norway": "Норвегия", "Oman": "Оман",
    "Pakistan": "Пакистан", "Palau": "Палау", "Palestine": "Палестина", "Panama": "Панама",
    "Papua New Guinea": "Папуа — Новая Гвинея", "Paraguay": "Парагвай", "Peru": "Перу", "Philippines": "Филиппины",
    "Poland": "Польша", "Portugal": "Португалия", "Qatar": "Катар", "Romania": "Румыния", "Russia": "Россия",
    "Rwanda": "Руанда", "Saint Kitts and Nevis": "Сент-Китс и Невис", "Saint Lucia": "Сент-Люсия",
    "Saint Vincent and the Grenadines": "Сент-Винсент и Гренадины", "Samoa": "Самоа", "San Marino": "Сан-Марино",
    "Sao Tome and Principe": "Сан-Томе и Принсипи", "Saudi Arabia": "Саудовская Аравия", "Senegal": "Сенегал",
    "Serbia": "Сербия", "Seychelles": "Сейшелы", "Sierra Leone": "Сьерра-Леоне", "Singapore": "Сингапур",
    "Slovakia": "Словакия", "Slovenia": "Словения", "Solomon Islands": "Соломоновы Острова", "Somalia": "Сомали",
    "South Africa": "Южно-Африканская Республика", "South Korea": "Республика Корея", "South Sudan": "Южный Судан",
    "Spain": "Испания", "Sri Lanka": "Шри-Ланка", "Sudan": "Судан", "Suriname": "Суринам", "Sweden": "Швеция",
    "Switzerland": "Швейцария", "Syria": "Сирия", "Taiwan": "Тайвань", "Tajikistan": "Таджикистан",
    "Tanzania": "Танзания", "Thailand": "Таиланд", "Timor-Leste": "Восточный Тимор", "Togo": "Того",
    "Tonga": "Тонга", "Trinidad and Tobago": "Тринидад и Тобаго", "Tunisia": "Тунис", "Turkey": "Турция",
    "Turkmenistan": "Туркменистан", "Tuvalu": "Тувалу", "Uganda": "Уганда", "Ukraine": "Украина",
    "United Arab Emirates": "ОАЭ", "United Kingdom": "Великобритания", "United States": "США", "Uruguay": "Уругвай",
    "Uzbekistan": "Узбекистан", "Vanuatu": "Вануату", "Vatican City": "Ватикан", "Venezuela": "Венесуэла",
    "Vietnam": "Вьетнам", "Yemen": "Йемен", "Zambia": "Замбия", "Zimbabwe": "Зимбабве",
}


def clean_text(value: object) -> Optional[str]:
    """Normalize whitespace and Unicode while keeping missing values missing."""
    if value is None:
        return None
    text = unicodedata.normalize("NFKC", str(value)).strip()
    return re.sub(r"\s+", " ", text) or None


def normalize_country(value: object) -> Optional[str]:
    """Normalize a country only when it matches the approved country registry."""
    text = clean_text(value)
    if not text:
        return None
    candidate = COUNTRY_ALIASES.get(text.casefold(), text)
    if candidate not in VALID_COUNTRIES:
        match = re.fullmatch(r"(.+?)\s+\d{3,6}", candidate)
        if match:
            candidate = COUNTRY_ALIASES.get(match.group(1).casefold(), match.group(1))
    return candidate if candidate in VALID_COUNTRIES else None


def country_label(value: object) -> Optional[str]:
    """Return the approved Russian display name for a normalized country."""
    canonical = normalize_country(value)
    return COUNTRY_LABELS_RU.get(canonical) if canonical else None


def parse_number(value: object) -> Optional[float]:
    """Parse decimal comma/dot values without silently converting invalid text."""
    if value is None:
        return None
    text = clean_text(value)
    if not text:
        return None
    text = text.replace("−", "-").replace("–", "-")
    text = re.sub(r"[^0-9,\.\-+]", "", text)
    if not text or text in {"-", "+", ".", ","}:
        return None
    if "," in text and "." in text:
        # Last separator is treated as decimal; earlier separators are thousands.
        decimal = max(text.rfind(","), text.rfind("."))
        text = text[:decimal].replace(",", "").replace(".", "") + "." + text[decimal + 1:]
    elif "," in text:
        parts = text.split(",")
        text = "".join(parts[:-1]) + "." + parts[-1] if len(parts[-1]) <= 3 else "".join(parts)
    elif text.count(".") > 1:
        parts = text.split(".")
        text = "".join(parts[:-1]) + "." + parts[-1]
    try:
        return float(text)
    except ValueError:
        return None


def normalize_unit(value: object) -> Optional[str]:
    """Canonicalize common units while preserving unknown units as text."""
    text = clean_text(value)
    if not text:
        return None
    lowered = text.casefold().replace("²", "2")
    replacements = {
        "l/kwh": "L/kWh", "litres/kwh": "L/kWh", "liters/kwh": "L/kWh",
        "kg co2e/kwh": "kgCO2e/kWh", "kgco2e/kwh": "kgCO2e/kWh",
        "g co2e/kwh": "gCO2e/kWh", "ratio": "ratio", "kwh": "kWh",
    }
    return replacements.get(lowered, text)


def parse_year(value: object) -> Optional[int]:
    """Return a year only when the supplied period is unambiguous."""
    text = clean_text(value)
    if not text:
        return None
    years = re.findall(r"(?<!\d)(?:19|20)\d{2}(?!\d)", text)
    return int(years[0]) if len(set(years)) == 1 else None
