# ECO AI | Инженеры Будущего 2027

Исследовательский проект об экологическом воздействии искусственного интеллекта. В репозитории находятся статический сайт с интерактивными картами, Python-пайплайн для сбора данных о дата-центрах и материалы исследования.

## Состав

- `Сайт & Инструменты/САЙТ/` — статический сайт без сборщика. Точка входа — `index.html`.
- `Парсер & Визуализация/ПАРСЕР ЦОД/data_center_ecology_pipeline/` — Python-пайплайн: каталог дата-центров, извлечение PUE/WUE/CUE из PDF, нормализация, проверки и экспорт данных на сайт.
- `Презентации & Таблицы/` — исходные материалы исследования в PDF и XLSX.
- `Парсер & Визуализация/MindMap.excalidraw` — схема проекта.

## Пайплайн

Требуется Python 3.11+.

```powershell
cd "Парсер & Визуализация\ПАРСЕР ЦОД\data_center_ecology_pipeline"
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m pytest -q
```

Основные команды:

```powershell
python -m data_center_ecology.main atlas --limit 100
python -m data_center_ecology.main pdf "..\..\..\Презентации & Таблицы\Экологические последствия работы ЦОД.pdf" --source-name "Экологические последствия работы ЦОД" --metric-scope unknown
python -m data_center_ecology.main summary
$env:DCE_SITE_DIR = (Resolve-Path "..\..\..\Сайт & Инструменты\САЙТ").Path
python -m data_center_ecology.main export-site
```

Пайплайн не заменяет неизвестные значения нулём. Для каждого показателя сохраняются год, охват, страница PDF и фрагмент исходного текста, если они доступны.

## Сайт

Для локального просмотра запустите простой HTTP-сервер:

```powershell
cd "Сайт & Инструменты\САЙТ"
python -m http.server 8000
```

Откройте `http://localhost:8000/`. Внешние библиотеки D3 и Leaflet подключаются через CDN.

## Проверка

Тесты пайплайна не обращаются к интернету:

```powershell
cd "Парсер & Визуализация\ПАРСЕР ЦОД\data_center_ecology_pipeline"
python -m pytest -q
```

Источник каталога дата-центров: [ATLAS / Global Data Center Map](https://data-center-map.com/) и его [репозиторий с CSV](https://github.com/Ringmast4r/Global-Data-Center-Map). Требуется атрибуция автора набора данных.
