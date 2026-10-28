from unittest.mock import Mock

import pytest

from data_center_ecology.sources.atlas import _normalize_atlas_city
from data_center_ecology.sources.base import HttpFetcher, SourceAccessError, parse_html_cards


def test_html_parser_requires_explicit_selectors():
    with pytest.raises(ValueError):
        parse_html_cards("<div></div>", {})
    rows = parse_html_cards('<article><a href="/x">Site</a></article>', {"card": "article", "name": "a", "url": "a"})
    assert rows == [{"name": "Site", "url": "/x"}]


def test_403_is_not_retried_or_bypassed():
    fetcher = HttpFetcher(retries=3, delay=0)
    response = Mock(status_code=403)
    fetcher.session.get = Mock(return_value=response)
    with pytest.raises(SourceAccessError):
        fetcher.get("https://example.test")
    assert fetcher.session.get.call_count == 1


def test_numeric_atlas_city_is_kept_unknown_with_warning():
    city, warning = _normalize_atlas_city("27837057171")
    assert city is None
    assert warning is not None


def test_text_atlas_city_is_preserved():
    city, warning = _normalize_atlas_city("Kampala")
    assert city == "Kampala"
    assert warning is None
