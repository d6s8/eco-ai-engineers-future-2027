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
    "google-locations": {
      short: "Google locations",
      title: "Google Data Centers — locations",
      publisher: "Google",
      year: "дата обращения 2026",
      url: "https://www.datacenters.google/",
      note: "Официальный список локаций дата-центров Google."
    }
  },

  methodology: {
    root: {
      definition: "В проекте экологический след ЦОДа — набор операционных и жизненных цикловых воздействий: энергия, связанные с ней выбросы, вода и материалы оборудования.",
      metric: "Набор показателей; не одна универсальная цифра",
      formula: "След = операционные воздействия + воздействия жизненного цикла",
      limitations: "Это рамка исследования. Для жизненного цикла нужны инвентарные данные о конкретном оборудовании и цепочке поставок.",
      sources: ["iso-lca"]
    },
    energy: {
      definition: "PUE показывает, сколько энергии потребляет весь ЦОД относительно энергии IT-оборудования за одинаковый период.",
      metric: "PUE, безразмерная величина",
      formula: "PUE = E<sub>ЦОД</sub> / E<sub>IT</sub>; E<sub>ЦОД</sub> = E<sub>IT</sub> × PUE",
      limitations: "PUE не измеряет вычислительную полезность и не заменяет фактические показания счётчиков.",
      sources: ["iso-pue", "nrcan-metrics"]
    },
    carbon: {
      definition: "Операционный углеродный след здесь — оценка косвенных выбросов от потреблённой электроэнергии (Scope 2, location-based).",
      metric: "тCO₂e/год",
      formula: "CO₂e = E<sub>ЦОД</sub> × EF<sub>сети</sub>",
      limitations: "Коэффициент сети зависит от страны, региона и года. Это не оценка локального повышения температуры и не полный жизненный цикл оборудования.",
      sources: ["ghg-scope-2", "minprirody-371", "ember-2024"]
    },
    water: {
      definition: "WUE описывает операционное водопотребление площадки на единицу энергии IT-оборудования.",
      metric: "л/кВт·ч IT-энергии; результат — м³/год",
      formula: "WUE = Water<sub>site</sub> / E<sub>IT</sub>; Water<sub>site</sub> = WUE × E<sub>IT</sub>",
      limitations: "В MVP показана вода на площадке. Вода, использованная при выработке электричества и производстве оборудования, требует отдельного учёта.",
      sources: ["green-grid-wue", "nrcan-metrics"]
    },
    hardware: {
      definition: "Воздействие оборудования оценивают через жизненный цикл: сырьё, производство, транспортировку, эксплуатацию и конец срока службы.",
      metric: "Зависит от границ исследования и инвентарных данных",
      formula: "LCA = Σ воздействий по стадиям жизненного цикла",
      limitations: "Универсальной формулы на один сервер нет; без спецификации оборудования количественная оценка здесь не показывается.",
      sources: ["iso-lca"]
    }
  },

  nodeMethodology: {
    root: "root",
    energy: "energy",
    carbon: "carbon",
    water: "water",
    hardware: "hardware"
  },

  assumptions: {
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
      name: "Google Data Center",
      operator: "Google",
      place: "Hamina, Finland",
      country: "Финляндия",
      coordinates: [60.569, 27.198],
      precision: "городской уровень; публичная страница не раскрывает годовое потребление объекта",
      sources: ["google-hamina"],
      status: "location-only"
    },
    {
      id: "google-eemshaven",
      name: "Google Data Center",
      operator: "Google",
      place: "Eemshaven, Netherlands",
      country: "Нидерланды",
      coordinates: [53.438, 6.833],
      precision: "городской уровень; в MVP нет открытых показателей ресурсоёмкости площадки",
      sources: ["google-locations"],
      status: "location-only"
    }
  ]
};
