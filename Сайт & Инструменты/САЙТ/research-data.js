window.researchData = {
  sources: {
    "ghg-scope-2": {
      short: "GHG Protocol Scope 2",
      title: "GHG Protocol Scope 2 Guidance",
      publisher: "GHG Protocol",
      year: "2015",
      url: "https://ghgprotocol.org/sites/default/files/GHG%20Protocol%20Scope%202%20Guidance.pdf",
      note: "Методика для выбросов от покупаемой и потребляемой электроэнергии."
    },
    "iso-pue": {
      short: "ISO/IEC 30134-2",
      title: "Data centres KPI — Power Usage Effectiveness (PUE)",
      publisher: "ISO/IEC",
      year: "2026",
      url: "https://www.iso.org/standard/30134-2?browse=tc",
      note: "Нормативное определение PUE; полный текст стандарта может требовать доступа ISO."
    },
    "nrcan-metrics": {
      short: "NRCan metrics",
      title: "Best Practice Guide for Canadian Data Centres",
      publisher: "Natural Resources Canada",
      year: "2024",
      url: "https://oee.nrcan.gc.ca/publications/statistics/dac/2024/index.cfm",
      note: "Открытая таблица формул PUE, WUE и CUE со ссылками на ISO/IEC 30134."
    },
    "green-grid-wue": {
      short: "The Green Grid WUE",
      title: "Water Usage Effectiveness (WUE): A Green Grid Data Center Sustainability Metric",
      publisher: "The Green Grid",
      year: "2011",
      url: "https://www.thegreengrid.org/system/files/store/WUE_v1.pdf",
      note: "Первичная методика метрики WUE для операционного водопотребления ЦОД."
    },
    "iso-lca": {
      short: "ISO 14040",
      title: "Environmental management — Life cycle assessment — Principles and framework",
      publisher: "ISO",
      year: "2006",
      url: "https://www.iso.org/standard/37456.html",
      note: "Рамка оценки жизненного цикла; не заменяет инвентаризацию конкретного оборудования."
    },
    "ember-2024": {
      short: "Ember, Russia 2024",
      title: "Yearly Electricity Data",
      publisher: "Ember",
      year: "2024",
      url: "https://ember-energy.org/data/yearly-electricity-data/",
      note: "Открытый набор годовых показателей энергосистем, включая углеродную интенсивность генерации."
    },
    "minprirody-371": {
      short: "Минприроды № 371",
      title: "Приказ Минприроды России № 371: методики количественного определения выбросов парниковых газов",
      publisher: "Минприроды России",
      year: "2022",
      url: "https://faolex.fao.org/docs/pdf/rus226892.pdf",
      note: "Российская нормативная методика с коэффициентами выбросов и формулами расчёта."
    },
    "ix-mos1": {
      short: "IXcellerate MOS1",
      title: "Moscow North campus — MOS1",
      publisher: "IXcellerate",
      year: "дата обращения 2026",
      url: "https://www.ixcellerate.com/data-centers/moscow-north-campus/",
      note: "Заявлены 13,7 МВт общей мощности и проектный PUE < 1,6."
    },
    "selectel-data-centers": {
      short: "Selectel ЦОДы",
      title: "Дата-центры Selectel уровня Tier III",
      publisher: "Selectel",
      year: "дата обращения 2026",
      url: "https://selectel.ru/about/data-centers/",
      note: "Опубликованы адреса и подведённые мощности площадок в Москве и Санкт-Петербурге."
    },
    "yandex-vladimir": {
      short: "Яндекс, Владимир",
      title: "Дата-центр Яндекса во Владимире",
      publisher: "Яндекс",
      year: "дата обращения 2026",
      url: "https://yandex.ru/jobs/locations/vladimir",
      note: "Подтверждает наличие дата-центра; открытых данных о годовом энергопотреблении страница не содержит."
    },
    "google-hamina": {
      short: "Google, Hamina",
      title: "Hamina, Finland — Google Data Center Location",
      publisher: "Google",
      year: "дата обращения 2026",
      url: "https://www.datacenters.google/locations/hamina-finland/",
      note: "Подтверждает площадку и использование морской воды для охлаждения; не раскрывает годовое энергопотребление объекта."
    },
    "google-environment-2026": {
      short: "Экологический отчёт Google за 2025 год",
      title: "Google 2026 Environmental Report",
      publisher: "Google",
      year: "2026",
      url: "https://sustainability.google/files/google-2026-environmental-report.pdf",
      note: "PUE и водные показатели по площадкам за 2025 год. Водные показатели исключают морскую и солоноватую воду."
    },
    "hamina-city": {
      short: "Город Хамина",
      title: "Google and the City of Hamina have signed a significant land deal",
      publisher: "Муниципалитет Хамины",
      year: "2026",
      url: "https://www.hamina.fi/en/google-ja-haminan-kaupunki-ovat-allekirjoittaneet-merkittavan-maakaupan/",
      note: "Муниципалитет подтверждает действующие соглашения с Haminan Energia об использовании тепла."
    },
    "ix-campus-brochure": {
      short: "Каталог IXcellerate",
      title: "IXcellerate data centers",
      publisher: "IXcellerate",
      year: "2024",
      url: "https://www.ixcellerate.com/wp-content/uploads/2024/10/Data_centers_10_2024_en.pdf",
      note: "MOS1 указан как действующая площадка на севере Москвы."
    },
    "selectel-tsvetochnaya-location": {
      short: "Адрес площадки Selectel",
      title: "Конференц-холл Selectel",
      publisher: "Selectel",
      year: "дата обращения 2026",
      url: "https://selectel.ru/about/conference-hall/",
      note: "Подтверждает город и адрес дата-центра «Цветочная 2»."
    },
    "google-eemshaven": {
      short: "Google — Эмсхавен",
      title: "Eemshaven, Netherlands — Google Data Center Location",
      url: "https://www.datacenters.google/locations/eemshaven-netherlands-var/",
      note: "Действующая площадка использует повторно используемую промышленную воду."
    },
    "google-belgium": {
      short: "Google — Сен-Гилен",
      title: "St. Ghislain, Belgium — Google Data Center Location",
      url: "https://www.datacenters.google/locations/belgium/",
      note: "Действующая площадка использует воду промышленного канала для охлаждения."
    },
    "google-fredericia": {
      short: "Google — Фредерисия",
      title: "Fredericia, Denmark — Google Data Center Location",
      url: "https://www.datacenters.google/locations/fredericia-denmark/",
      note: "Страница оператора датирует открытие площадки 2020 годом."
    },
    "google-quilicura": {
      short: "Google — Киликура",
      title: "Quilicura, Chile — Google Data Center Location",
      url: "https://www.datacenters.google/locations/quilicura-chile/",
      note: "Подтверждает действующую площадку в Киликуре."
    },
    "google-site-addresses": {
      short: "Сертификат ISO 50001 Google",
      title: "Google LLC — Scope for certificate 2020-024",
      url: "https://services.google.com/fh/files/misc/google_iso50001_certificate.pdf",
      note: "Приложение перечисляет адреса площадок, включая Эмсхавен, Хамину и Дублин."
    },
    "groningen-energy": {
      short: "Провинция Гронинген, 2022",
      title: "Feiten en cijfers datacenters",
      url: "https://provinciegroningen.bestuurlijkeinformatie.nl/Document/View/e46417e4-9f93-4902-89e1-a0f74a7f2536",
      note: "Письмо от 8 марта 2022 года приводит 400 000 МВт·ч для Greenbox computing (Google). Период измерения в таблице не указан."
    },
    "groningen-permits": {
      short: "Разрешения провинции Гронинген",
      title: "Google / Green Box Computing B.V., Oostpolder 4 te Eemshaven",
      url: "https://www.provinciegroningen.nl/vergunningen/verleende-vergunningen-bedrijven/bedrijf/google-green-box-computing-bv-oostpolder-4-te-eemshaven/",
      note: "Документы относят несколько очередей строительства к одному кампусу по адресу Oostpolder 4."
    },
    "eneco-eemshaven": {
      short: "Eneco — договор с Google",
      title: "Google en Eneco werken samen aan verduurzaming stroom datacenter Eemshaven",
      url: "https://nieuws.eneco.nl/google-en-eneco-werken-samen-aan-verduurzaming-stroom-datacenter-eemshaven/",
      note: "Описывает десятилетний контракт на закупку ветровой электроэнергии у Fryslân и Kroningswind."
    },
    "rwe-eemshaven": {
      short: "RWE — Eemshaven",
      title: "Eemshaven hard coal and biomass fired powerplant",
      url: "https://benelux.rwe.com/en/locations-and-projects/eemshavencentrale/",
      note: "Подтверждает размещение угольно-биомассовой станции в Эмсхавене."
    },
    "rwe-magnum": {
      short: "RWE — Magnum",
      title: "Magnum power station",
      url: "https://benelux.rwe.com/en/locations-and-projects/magnum-power-station/",
      note: "Подтверждает размещение газовой станции Magnum в Эмсхавене."
    },
    "google-locations": {
      short: "Google locations",
      title: "Google Data Centers — locations",
      publisher: "Google",
      year: "дата обращения 2026",
      url: "https://www.datacenters.google/",
      note: "Официальный список локаций дата-центров Google."
    }
  },

  // Проверенные уточнения хранятся отдельно от выгрузки ATLAS и переживают export-site.
  catalogUpdates: {
    "67e6e6566a3e7c17c1a0": { city: "Хамина", country: "Finland", countryLabel: "Финляндия", address: "Ensontie 1, 49420 Hamina, Finland", status: "operational", sourceId: "google-site-addresses" },
    "d1437bfbabd95471c52c": { duplicateOf: "67e6e6566a3e7c17c1a0" },
    "a203b7fb0ddfcf82139d": { city: "Москва", status: "operational", sourceId: "ix-campus-brochure" },
    "494dc6a40251975f4678": { city: "Санкт-Петербург", country: "Russia", countryLabel: "Россия", sourceId: "selectel-tsvetochnaya-location" },
    "6e68bf29aac6c1911d4f": { city: "Эмсхавен", relatedTo: "e1c8f30443cb94bf1eca", sourceId: "google-eemshaven" },
    "da64cb362e1b65e193f7": { relatedTo: "e1c8f30443cb94bf1eca" },
    "e1c8f30443cb94bf1eca": { city: "Эмсхавен", address: "Oostpolder 4, 9979 XT Eemshaven, Netherlands", status: "operational", sourceId: "groningen-permits" },
    "af68d3819aa895df506a": { city: "Сен-Гилен", status: "operational", sourceId: "google-belgium" },
    "dbc54d3380987360368e": { status: "operational", sourceId: "google-belgium" },
    "950809e1e214ae0db274": { city: "Дублин", sourceId: "google-site-addresses" },
    "75404cc9e7901c7a3412": { city: "Фредерисия", status: "operational", sourceId: "google-fredericia" },
    "ce528ff9f0886885607d": { city: "Фредерисия", relatedTo: "75404cc9e7901c7a3412", sourceId: "google-fredericia" },
    "7434c112b40eb2416611": { city: "Киликура", status: "operational", sourceId: "google-quilicura" },
    "ef7e9dbb8506f3dc28cd": { status: "operational", sourceId: "google-quilicura" }
  },

  assumptions: {
    // Сценарные значения для учебных расчётов; не являются измерениями конкретных ЦОД.
    hoursPerYear: 8760,
    defaultUtilization: 0.5,
    defaultPue: 1.5,
    defaultWue: 0.4,
    defaultGridFactorRussia: 0.449,
    gridFactorYear: 2024
  },

  dataCenters: [
    {
      id: "ix-mos1",
      name: "IXcellerate MOS1",
      operator: "IXcellerate",
      place: "Север Москвы, район Алтуфьево",
      country: "Россия",
      coordinates: [55.899, 37.579],
      precision: "район; точный адрес не заявлен на странице источника",
      capacityMw: 13.7,
      capacityLabel: "общая заявленная мощность",
      scenario: { hours: 8760, pue: 1.6, wue: 0.4, gridFactor: 0.4, powerShares: [0.25, 0.5, 0.75] },
      pue: 1.6,
      pueLabel: "проектный PUE < 1,6; для консервативной сценарной оценки использовано 1,6",
      gridFactorKg: 0.449,
      gridFactorLabel: "Россия, средняя углеродная интенсивность генерации за 2024 год",
      sources: ["ix-mos1", "ember-2024"],
      status: "estimated"
    },
    {
      id: "selectel-berzarina",
      name: "Selectel — Берзарина",
      operator: "Selectel",
      place: "Москва, ул. Берзарина, 36",
      country: "Россия",
      coordinates: [55.783, 37.481],
      precision: "адрес площадки опубликован оператором; маркер округлён до района",
      capacityMw: 10,
      capacityLabel: "подведённая мощность",
      gridFactorKg: 0.449,
      gridFactorLabel: "Россия, средняя углеродная интенсивность генерации за 2024 год",
      sources: ["selectel-data-centers", "ember-2024"],
      status: "estimated"
    },
    {
      id: "selectel-tsvetochnaya-2",
      name: "Selectel — Цветочная 2",
      operator: "Selectel",
      place: "Санкт-Петербург, ул. Цветочная, 19",
      country: "Россия",
      coordinates: [59.889, 30.328],
      precision: "адрес площадки опубликован оператором; маркер округлён до района",
      capacityMw: 10,
      capacityLabel: "подведённая мощность",
      gridFactorKg: 0.449,
      gridFactorLabel: "Россия, средняя углеродная интенсивность генерации за 2024 год",
      sources: ["selectel-data-centers", "ember-2024"],
      status: "estimated"
    },
    {
      id: "yandex-vladimir",
      name: "Дата-центр Яндекса",
      operator: "Яндекс",
      place: "Владимир",
      country: "Россия",
      coordinates: [56.129, 40.407],
      precision: "город; точный адрес и ресурсные показатели не раскрыты",
      sources: ["yandex-vladimir"],
      status: "location-only"
    },
    {
      id: "google-hamina",
      name: "Google — Хамина",
      operator: "Google",
      place: "Хамина",
      city: "Хамина",
      country: "Финляндия",
      coordinates: [60.569, 27.198],
      precision: "городской уровень",
      catalogId: "67e6e6566a3e7c17c1a0",
      atlasCatalogId: "d1437bfbabd95471c52c",
      reportedMetrics: [
        { name: "PUE", value: 1.10, unit: "безразмерный", year: 2025, sourceId: "google-environment-2026" },
        { name: "Водозабор", value: 4.3, unit: "млн галлонов США", year: 2025, sourceId: "google-environment-2026", note: "Без морской и солоноватой воды" },
        { name: "Водопотребление", value: 0.4, unit: "млн галлонов США", year: 2025, sourceId: "google-environment-2026", note: "Без морской и солоноватой воды" }
      ],
      cooling: "Морская вода из Финского залива. Часть тепла передаётся в сеть Haminan Energia.",
      sources: ["google-hamina", "google-site-addresses", "google-environment-2026", "hamina-city"],
      status: "operational"
    },
    {
      id: "google-eemshaven",
      name: "Google — Эмсхавен",
      operator: "Google",
      place: "Эмсхавен",
      city: "Эмсхавен",
      country: "Нидерланды",
      coordinates: [53.438, 6.833],
      precision: "приблизительная точка ATLAS",
      catalogId: "e1c8f30443cb94bf1eca",
      reportedMetrics: [
        { name: "PUE", value: 1.07, unit: "безразмерный", year: 2025, sourceId: "google-environment-2026" },
        { name: "Водозабор", value: 532.2, unit: "млн галлонов США", year: 2025, sourceId: "google-environment-2026", note: "Без морской и солоноватой воды" },
        { name: "Водопотребление", value: 405.7, unit: "млн галлонов США", year: 2025, sourceId: "google-environment-2026", note: "Без морской и солоноватой воды" },
        { name: "Энергопотребление", value: 400000, unit: "МВт·ч", sourceId: "groningen-energy", dataStatus: "historical", reportedPeriod: "Период не указан", note: "Опубликовано провинцией в марте 2022 года. Историческая величина с неуточнённым периодом." }
      ],
      cooling: "Используется повторно используемая промышленная вода.",
      energyContext: [
        { label: "Договор закупки", text: "Eneco сообщала о контракте Google на объём около 515 ГВт·ч в год от ветропарков Fryslân и Kroningswind. Это договорной объём закупки.", sourceIds: ["eneco-eemshaven"] },
        { label: "Генерация поблизости", text: "В Эмсхавене работают газовая Magnum и угольно-биомассовая Eemshaven. Их близость даёт сведения об энергосистеме региона. Доля этих станций в снабжении ЦОДа неизвестна.", sourceIds: ["rwe-magnum", "rwe-eemshaven"] }
      ],
      sources: ["google-eemshaven", "groningen-permits", "google-environment-2026", "groningen-energy"],
      status: "operational"
    },
    {
      id: "google-saint-ghislain",
      name: "Google — Сен-Гилен",
      operator: "Google",
      place: "Сен-Гилен",
      city: "Сен-Гилен",
      country: "Бельгия",
      coordinates: [50.4653859, 3.8698114],
      precision: "приблизительная точка ATLAS",
      catalogId: "dbc54d3380987360368e",
      reportedMetrics: [
        { name: "PUE", value: 1.08, unit: "безразмерный", year: 2025, sourceId: "google-environment-2026" },
        { name: "Водозабор", value: 714.4, unit: "млн галлонов США", year: 2025, sourceId: "google-environment-2026", note: "Без морской и солоноватой воды" },
        { name: "Водопотребление", value: 450.8, unit: "млн галлонов США", year: 2025, sourceId: "google-environment-2026", note: "Без морской и солоноватой воды" }
      ],
      cooling: "Для охлаждения используется вода промышленного канала.",
      sources: ["google-belgium", "google-environment-2026"],
      status: "operational"
    },
    {
      id: "google-fredericia",
      name: "Google — Фредерисия",
      operator: "Google",
      place: "Фредерисия",
      city: "Фредерисия",
      country: "Дания",
      coordinates: [55.5566984, 9.6571632],
      precision: "приблизительная точка ATLAS",
      catalogId: "75404cc9e7901c7a3412",
      atlasCatalogId: "ce528ff9f0886885607d",
      reportedMetrics: [
        { name: "PUE", value: 1.07, unit: "безразмерный", year: 2025, sourceId: "google-environment-2026" },
        { name: "Водозабор", value: 88.8, unit: "млн галлонов США", year: 2025, sourceId: "google-environment-2026", note: "Без морской и солоноватой воды" },
        { name: "Водопотребление", value: 71.8, unit: "млн галлонов США", year: 2025, sourceId: "google-environment-2026", note: "Без морской и солоноватой воды" }
      ],
      sources: ["google-fredericia", "google-environment-2026"],
      status: "operational"
    },
    {
      id: "google-quilicura",
      name: "Google — Киликура",
      operator: "Google",
      place: "Киликура",
      city: "Киликура",
      country: "Чили",
      coordinates: [-33.3586893, -70.6999129],
      precision: "приблизительная точка ATLAS",
      catalogId: "7434c112b40eb2416611",
      atlasCatalogId: "ef7e9dbb8506f3dc28cd",
      reportedMetrics: [
        { name: "PUE", value: 1.08, unit: "безразмерный", year: 2025, sourceId: "google-environment-2026" },
        { name: "Водозабор", value: 278.2, unit: "млн галлонов США", year: 2025, sourceId: "google-environment-2026", note: "Без морской и солоноватой воды" },
        { name: "Водопотребление", value: 143.0, unit: "млн галлонов США", year: 2025, sourceId: "google-environment-2026", note: "Без морской и солоноватой воды" }
      ],
      sources: ["google-quilicura", "google-environment-2026"],
      status: "operational"
    }
  ]
};
