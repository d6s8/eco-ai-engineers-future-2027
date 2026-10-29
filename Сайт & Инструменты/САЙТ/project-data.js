(() => {
  const data = window.projectData;
  const kindControl = document.getElementById("data-kind");
  const searchControl = document.getElementById("data-search");
  const sortControl = document.getElementById("data-sort");
  const countryControl = document.getElementById("data-country");
  const statusControl = document.getElementById("data-status");
  const countryLabel = document.getElementById("data-country-control");
  const statusLabel = document.getElementById("data-status-control");
  const filterControls = {
    source: {
      label: document.getElementById("data-source-control"),
      select: document.getElementById("data-source"),
      empty: "Все источники"
    },
    region: {
      label: document.getElementById("data-region-control"),
      select: document.getElementById("data-region"),
      empty: "Все регионы"
    },
    metric: {
      label: document.getElementById("data-metric-control"),
      select: document.getElementById("data-metric"),
      empty: "Все метрики"
    },
    year: {
      label: document.getElementById("data-year-control"),
      select: document.getElementById("data-year"),
      empty: "Все годы"
    },
    sourceType: {
      label: document.getElementById("data-type-control"),
      select: document.getElementById("data-type"),
      empty: "Все типы источника"
    }
  };
  const resetButton = document.getElementById("data-reset");
  const summary = document.getElementById("data-summary");
  const message = document.getElementById("data-message");
  const tableHead = document.getElementById("data-table-head");
  const tableBody = document.getElementById("data-table-body");
  const pagination = document.getElementById("data-pagination");
  const detail = document.getElementById("data-detail");
  const disclaimer = document.getElementById("data-disclaimer");

  if (!kindControl || !searchControl || !sortControl || !countryControl || !statusControl || !summary || !tableBody || !detail) {
    return;
  }

  if (!data || !Array.isArray(data.dataCenters) || !Array.isArray(data.metrics) || !Array.isArray(data.sources)) {
    summary.textContent = "Данные пайплайна пока недоступны.";
    message.textContent = "Сначала выполните экспорт нормализованных данных командой export-site.";
    return;
  }

  const PAGE_SIZE = 12;
  const state = {
    kind: kindControl.value,
    search: "",
    sort: "default",
    country: "",
    status: "",
    extra: {},
    page: 1,
    selectedId: null
  };

  const configurations = {
    dataCenters: {
      columns: [
        ["company", "Компания"],
        ["name", "Дата-центр"],
        ["country", "Страна"],
        ["city", "Город"],
        ["status", "Статус"]
      ],
      searchFields: ["company", "name", "country", "region", "city", "address"],
      countryField: "country",
      statusField: "status",
      searchPlaceholder: "Компания, страна или название",
      extraFilters: [
        ["source", "sourceName", "Источник"],
        ["region", "region", "Регион"]
      ],
      statusLabels: {
        open: "Открытый",
        operational: "Работает",
        planned: "Планируется",
        closed: "Закрыт",
        estimated: "Сценарная оценка",
        "location-only": "Только местоположение"
      }
    },
    countries: {
      columns: [
        ["countryLabel", "Страна"],
        ["count", "Дата-центров"]
      ],
      searchFields: ["countryLabel", "country"],
      countryField: null,
      statusField: null,
      searchPlaceholder: "Название страны",
      extraFilters: [],
      statusLabels: {}
    },
    metrics: {
      columns: [
        ["name", "Метрика"],
        ["value", "Значение"],
        ["unit", "Единица"],
        ["scope", "Охват"],
        ["dataStatus", "Статус данных"]
      ],
      searchFields: ["name", "company", "dataCenterName", "country", "countryLabel", "sourceName", "sourceDocument", "evidence"],
      countryField: "country",
      statusField: "dataStatus",
      searchPlaceholder: "Метрика, источник или документ",
      extraFilters: [
        ["source", "sourceName", "Источник"],
        ["metric", "name", "Метрика"],
        ["year", "year", "Год"]
      ],
      statusLabels: {
        extracted: "Извлечено",
        needs_review: "Нужна проверка"
      }
    },
    sources: {
      columns: [
        ["name", "Источник"],
        ["type", "Тип"],
        ["document", "Документ"],
        ["retrievedAt", "Получен"]
      ],
      searchFields: ["name", "type", "document", "url", "notes", "licenseNotes"],
      countryField: null,
      statusField: null,
      searchPlaceholder: "Название или документ",
      extraFilters: [["sourceType", "type", "Тип источника"]],
      statusLabels: {}
    }
  };

  const labels = {
    unknown: "Не указано",
    facility: "Объект",
    company: "Компания",
    region: "Регион",
    fleet: "Группа объектов",
    industry: "Отрасль",
    reported: "Заявленное",
    measured: "Измеренное",
    calculated: "Расчётное",
    estimated: "Оценочное"
  };

  function valueOrFallback(value) {
    return value === null || value === undefined || value === "" ? "Не указано" : String(value);
  }

  function labelFor(value, dictionary = labels) {
    return dictionary[value] || labels[value] || valueOrFallback(value);
  }

  function formatDate(value) {
    if (!value) {
      return "Не указано";
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("ru-RU");
  }

  function formatValue(record, key) {
    const value = record[key];
    if (key === "country") {
      return valueOrFallback(record.countryLabel);
    }
    if (key === "status" || key === "dataStatus" || key === "scope" || key === "valueType") {
      return labelFor(value, configurations[state.kind].statusLabels);
    }
    if (key === "retrievedAt") {
      return formatDate(value);
    }
    if (key === "value" && typeof value === "number") {
      return value.toLocaleString("ru-RU", { maximumFractionDigits: 4 });
    }
    return valueOrFallback(value);
  }

  function createElement(tag, text, className) {
    const element = document.createElement(tag);
    if (text !== undefined) {
      element.textContent = text;
    }
    if (className) {
      element.className = className;
    }
    return element;
  }

  function currentRecords() {
    if (state.kind === "countries") {
      const grouped = new Map();
      data.dataCenters.forEach((record) => {
        if (!record.country || !record.countryLabel) {
          return;
        }
        const current = grouped.get(record.country) || {
          id: "country-" + record.country,
          country: record.country,
          countryLabel: record.countryLabel,
          count: 0
        };
        current.count += 1;
        grouped.set(record.country, current);
      });
      return [...grouped.values()].sort((a, b) => a.countryLabel.localeCompare(b.countryLabel, "ru"));
    }
    return data[state.kind] || [];
  }

  function filteredRecords() {
    const configuration = configurations[state.kind];
    const search = state.search.trim().toLocaleLowerCase("ru-RU");
    const records = currentRecords().filter((record) => {
      const matchesSearch = !search || configuration.searchFields.some((field) =>
        valueOrFallback(record[field]).toLocaleLowerCase("ru-RU").includes(search)
      );
      const matchesCountry = !state.country || record[configuration.countryField] === state.country;
      const matchesStatus = !state.status || record[configuration.statusField] === state.status;
      const matchesExtra = configuration.extraFilters.every(([key, field]) => {
        const selected = state.extra[key];
        return !selected || String(record[field]) === String(selected);
      });
      return matchesSearch && matchesCountry && matchesStatus && matchesExtra;
    });
    if (state.sort === "default") {
      return records;
    }
    const direction = state.sort === "name-desc" ? -1 : 1;
    return records.sort((left, right) => {
      const leftValue = valueOrFallback(left.countryLabel || left.name || left.dataCenterName || left.company).toLocaleLowerCase("ru-RU");
      const rightValue = valueOrFallback(right.countryLabel || right.name || right.dataCenterName || right.company).toLocaleLowerCase("ru-RU");
      return direction * leftValue.localeCompare(rightValue, "ru");
    });
  }

  function setOptions(select, values, defaultText, dictionary = {}) {
    select.replaceChildren(createElement("option", defaultText));
    values.forEach((value) => {
      const option = createElement("option", labelFor(value, dictionary));
      option.value = value;
      select.appendChild(option);
    });
  }

  function updateFilters() {
    const configuration = configurations[state.kind];
    const records = currentRecords();
    const countryNames = new Map();
    records.forEach((record) => {
      if (record.country && record.countryLabel) {
        countryNames.set(record.country, record.countryLabel);
      }
    });
    const countries = [...countryNames.keys()].sort((a, b) => countryNames.get(a).localeCompare(countryNames.get(b), "ru"));
    const statuses = configuration.statusField
      ? [...new Set(records.map((record) => record[configuration.statusField]).filter(Boolean))].sort()
      : [];

    countryLabel.hidden = !configuration.countryField || countries.length === 0;
    statusLabel.hidden = !configuration.statusField || statuses.length === 0;
    setOptions(countryControl, countries, "Все страны", Object.fromEntries(countryNames));
    setOptions(statusControl, statuses, "Все статусы", configuration.statusLabels);
    countryControl.value = countries.includes(state.country) ? state.country : "";
    statusControl.value = statuses.includes(state.status) ? state.status : "";
    state.country = countryControl.value;
    state.status = statusControl.value;

    const activeFilterKeys = new Set(configuration.extraFilters.map(([key]) => key));
    Object.entries(filterControls).forEach(([key, control]) => {
      if (!control.label || !control.select) {
        return;
      }
      const filter = configuration.extraFilters.find(([filterKey]) => filterKey === key);
      if (!filter) {
        control.label.hidden = true;
        control.select.replaceChildren(createElement("option", control.empty));
        control.select.value = "";
        state.extra[key] = "";
        return;
      }
      const [, field] = filter;
      const values = [...new Set(records.map((record) => record[field]).filter((value) => value !== null && value !== undefined && value !== ""))]
        .sort((a, b) => String(a).localeCompare(String(b), "ru", { numeric: true }));
      control.label.hidden = values.length < 2;
      setOptions(control.select, values, control.empty);
      control.select.value = values.map(String).includes(String(state.extra[key])) ? state.extra[key] : "";
      state.extra[key] = control.select.value;
    });
    Object.keys(state.extra).forEach((key) => {
      if (!activeFilterKeys.has(key)) {
        state.extra[key] = "";
      }
    });
  }

  function renderSummary() {
    summary.replaceChildren();
    const cards = [
      ["Дата-центры", data.dataCenters.length],
      ["Метрики", data.metrics.length],
      ["Источники", data.sources.length]
    ];
    cards.forEach(([title, count]) => {
      const card = createElement("div", undefined, "data-summary-card");
      card.append(createElement("strong", count.toLocaleString("ru-RU")), createElement("span", title));
      summary.appendChild(card);
    });
  }

  function renderTable(records) {
    const configuration = configurations[state.kind];
    table.className = `data-table data-table-${state.kind}`;
    tableHead.replaceChildren();
    tableBody.replaceChildren();
    const headerRow = createElement("tr");
    configuration.columns.forEach(([, title]) => headerRow.appendChild(createElement("th", title)));
    tableHead.appendChild(headerRow);

    const start = (state.page - 1) * PAGE_SIZE;
    records.slice(start, start + PAGE_SIZE).forEach((record) => {
      const row = createElement("tr");
      row.tabIndex = 0;
      row.className = record.id === state.selectedId ? "is-selected" : "";
      configuration.columns.forEach(([key]) => row.appendChild(createElement("td", formatValue(record, key))));
      const selectRecord = () => {
        state.selectedId = record.id;
        renderDetail(record);
        renderTable(records);
      };
      row.addEventListener("click", selectRecord);
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectRecord();
        }
      });
      tableBody.appendChild(row);
    });
  }

  function renderPagination(total) {
    pagination.replaceChildren();
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    state.page = Math.min(state.page, totalPages);
    if (totalPages <= 1) {
      return;
    }

    const previous = createElement("button", "← Назад");
    previous.type = "button";
    previous.disabled = state.page === 1;
    previous.addEventListener("click", () => {
      state.page -= 1;
      render();
    });

    const pageLabel = createElement("span", `Страница ${state.page} из ${totalPages}`);
    const next = createElement("button", "Вперёд →");
    next.type = "button";
    next.disabled = state.page === totalPages;
    next.addEventListener("click", () => {
      state.page += 1;
      render();
    });
    pagination.append(previous, pageLabel, next);
  }

  function appendDetailField(container, title, value) {
    const wrapper = createElement("div", undefined, "data-detail-field");
    wrapper.append(createElement("dt", title), createElement("dd", valueOrFallback(value)));
    container.appendChild(wrapper);
  }

  function appendLink(container, title, url) {
    if (!url || !/^https?:\/\//i.test(url)) {
      return;
    }
    const paragraph = createElement("p", undefined, "data-source-link");
    paragraph.append(createElement("strong", title + ": "));
    const link = createElement("a", url);
    link.href = url;
    link.target = "_blank";
    link.rel = "noreferrer";
    paragraph.appendChild(link);
    container.appendChild(paragraph);
  }

  function renderDetail(record) {
    detail.replaceChildren();
    const title = record.name || record.dataCenterName || record.countryLabel || record.company || record.document || "Запись";
    const kicker = state.kind === "metrics"
      ? "МЕТРИКА"
      : state.kind === "sources"
        ? "ИСТОЧНИК"
        : state.kind === "countries"
          ? "СТРАНА"
          : "ДАТА-ЦЕНТР";
    detail.appendChild(createElement("p", kicker, "data-detail-kicker"));
    detail.appendChild(createElement("h3", title));
    const fields = createElement("dl", undefined, "data-detail-fields");

    if (state.kind === "dataCenters") {
      appendDetailField(fields, "Компания", record.company);
      appendDetailField(fields, "Источник данных", record.sourceName);
      appendDetailField(fields, "Страна", record.countryLabel);
      appendDetailField(fields, "Регион / город", [record.region, record.city].filter(Boolean).join(" / "));
      appendDetailField(fields, "Адрес", record.address);
      appendDetailField(fields, "Статус", labelFor(record.status, configurations.dataCenters.statusLabels));
      appendDetailField(fields, "Дата получения", formatDate(record.retrievedAt));
      appendDetailField(fields, "Примечание", record.notes);
      appendLink(detail, "Источник", record.sourceUrl);
    } else if (state.kind === "metrics") {
      appendDetailField(fields, "Значение", formatValue(record, "value") + " " + valueOrFallback(record.unit));
      appendDetailField(fields, "Источник данных", record.sourceName);
      appendDetailField(fields, "Охват", labelFor(record.scope));
      appendDetailField(fields, "Тип значения", labelFor(record.valueType));
      appendDetailField(fields, "Статус", labelFor(record.dataStatus, configurations.metrics.statusLabels));
      appendDetailField(fields, "Период", record.reportedPeriod || record.year);
      appendDetailField(fields, "Документ / страница", [record.sourceDocument, record.page].filter(Boolean).join(" / "));
      appendDetailField(fields, "Примечание", record.notes);
      appendLink(detail, "Источник", record.sourceUrl);
      if (record.evidence) {
        const evidence = createElement("blockquote", record.evidence, "data-evidence");
        detail.append(createElement("h4", "Фрагмент первоисточника"), evidence);
      }
    } else if (state.kind === "sources") {
      appendDetailField(fields, "Тип", record.type);
      appendDetailField(fields, "Документ", record.document);
      appendDetailField(fields, "Дата получения", formatDate(record.retrievedAt));
      appendDetailField(fields, "Условия использования", record.licenseNotes);
      appendDetailField(fields, "Примечание", record.notes);
      appendLink(detail, "Оригинал", record.url);
    } else {
      appendDetailField(fields, "Нормализованное название", record.country);
      appendDetailField(fields, "Дата-центров в каталоге", record.count);
    }

    detail.insertBefore(fields, detail.querySelector(".data-source-link, h4, blockquote"));
  }

  function render() {
    const records = filteredRecords();
    const total = records.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    state.page = Math.min(state.page, totalPages);
    message.textContent = total
      ? `Показаны записи ${((state.page - 1) * PAGE_SIZE + 1).toLocaleString("ru-RU")}–${Math.min(state.page * PAGE_SIZE, total).toLocaleString("ru-RU")} из ${total.toLocaleString("ru-RU")}.`
      : "По заданным условиям ничего не найдено.";
    renderTable(records);
    renderPagination(total);
  }

  function changeKind() {
    state.kind = kindControl.value;
    state.search = "";
    state.sort = "default";
    state.country = "";
    state.status = "";
    state.extra = {};
    state.page = 1;
    state.selectedId = null;
    searchControl.value = "";
    searchControl.placeholder = configurations[state.kind].searchPlaceholder;
    sortControl.value = "default";
    detail.replaceChildren(createElement("p", "Выберите строку, чтобы увидеть подробности и источник.", "data-detail-placeholder"));
    updateFilters();
    render();
  }

  kindControl.addEventListener("change", changeKind);
  searchControl.addEventListener("input", () => {
    state.search = searchControl.value;
    state.page = 1;
    render();
  });
  sortControl.addEventListener("change", () => {
    state.sort = sortControl.value;
    state.page = 1;
    render();
  });
  countryControl.addEventListener("change", () => {
    state.country = countryControl.value;
    state.page = 1;
    render();
  });
  statusControl.addEventListener("change", () => {
    state.status = statusControl.value;
    state.page = 1;
    render();
  });
  Object.entries(filterControls).forEach(([key, control]) => {
    if (!control.select) {
      return;
    }
    control.select.addEventListener("change", () => {
      state.extra[key] = control.select.value;
      state.page = 1;
      render();
    });
  });
  resetButton.addEventListener("click", () => {
    state.search = "";
    state.sort = "default";
    state.country = "";
    state.status = "";
    state.extra = {};
    state.page = 1;
    searchControl.value = "";
    sortControl.value = "default";
    updateFilters();
    render();
  });

  renderSummary();
  searchControl.placeholder = configurations[state.kind].searchPlaceholder;
  disclaimer.textContent = data.generatedAt
    ? "Дата обновления выгрузки: " + formatDate(data.generatedAt) + ". Метрики с пометкой «Нужна проверка» нельзя считать подтверждёнными характеристиками конкретного дата-центра."
    : "Метрики с пометкой «Нужна проверка» нельзя считать подтверждёнными характеристиками конкретного дата-центра.";
  updateFilters();
  render();
})();
