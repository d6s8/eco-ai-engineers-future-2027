import * as maplibregl from "https://unpkg.com/maplibre-gl@6.17.0/dist/maplibre-gl.mjs";

(() => {
  const researchData = window.researchData;
  const projectData = window.projectData;
  const mapElement = document.getElementById("geo-map-canvas");
  const panel = document.getElementById("geo-map-panel");
  const summary = document.getElementById("geo-map-summary");
  const countryFilter = document.getElementById("geo-map-country-filter");
  const filterReset = document.getElementById("geo-map-filter-reset");
  const siteFilter = document.getElementById("geo-map-sites");
  const metricsOnly = document.getElementById("geo-map-metrics-only");

  if (!mapElement || !panel || !maplibregl?.Map) {
    if (panel) panel.innerHTML = "<p>Не удалось загрузить карту. Проверь подключение к картографическому слою.</p>";
    return;
  }

  const numberFormat = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
  const map = new maplibregl.Map({
    container: mapElement,
    center: [10, 30],
    zoom: 2,
    minZoom: 1,
    maxZoom: 18,
    attributionControl: true,
    style: {
      version: 8,
      sources: {
        osm: {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\" rel=\"noreferrer\">OpenStreetMap contributors</a>"
        }
      },
      layers: [{ id: "osm-raster", type: "raster", source: "osm", paint: { "raster-saturation": -0.72, "raster-contrast": 0.12, "raster-brightness-min": 0.12, "raster-brightness-max": 0.78 } }]
    }
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

  const researchByKey = new Map();
  const researchById = new Map();
  const researchByAtlasKey = new Map();
  const catalogByKey = new Map();
  const catalogByAtlasKey = new Map();
  const catalogById = new Map();
  const metricsByDataCenterId = new Map();
  let selectedId = null;
  let allFeatures = [];
  let visibleFeatures = [];
  let hoverPopup = null;

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
  const normalizeKeyPart = (value) => String(value ?? "").trim().toLocaleLowerCase("ru-RU").replace(/\s+/g, " ");
  const recordKey = (record) => [record.name, record.company, record.country].map(normalizeKeyPart).join("|");
  const atlasKey = (record) => [recordKey(record), normalizeKeyPart(record.address)].join("|");
  const atlasCatalogIds = new Map((researchData?.dataCenters || [])
    .filter((site) => site.atlasCatalogId || site.catalogId)
    .map((site) => [site.atlasCatalogId || site.catalogId, site]));

  (researchData?.dataCenters || []).forEach((site) => {
    researchById.set(site.id, site);
    researchByKey.set([site.name, site.operator, site.country].map(normalizeKeyPart).join("|"), site);
  });
  (projectData?.dataCenters || []).forEach((site) => {
    const update = researchData?.catalogUpdates?.[site.id];
    const record = update ? { ...site, ...update } : site;
    catalogById.set(site.id, record);
    const key = recordKey(site);
    catalogByKey.set(key, catalogByKey.has(key) ? null : record);
    catalogByAtlasKey.set(atlasKey(site), record);
    if (atlasCatalogIds.has(site.id)) researchByAtlasKey.set(atlasKey(site), atlasCatalogIds.get(site.id));
  });
  (projectData?.metrics || []).forEach((metric) => {
    if (!metric.dataCenterId) return;
    const metrics = metricsByDataCenterId.get(metric.dataCenterId) || [];
    metrics.push(metric);
    metricsByDataCenterId.set(metric.dataCenterId, metrics);
  });

  function getContext(feature) {
    const properties = feature.properties || {};
    const key = recordKey(properties);
    const research = researchById.get(properties.researchId) || researchByAtlasKey.get(atlasKey(properties)) || researchByKey.get(key) || null;
    const catalog = catalogById.get(research?.catalogId) || catalogByAtlasKey.get(atlasKey(properties)) || catalogByKey.get(key) || null;
    return { properties, research, catalog, metrics: catalog ? (metricsByDataCenterId.get(catalog.id) || []) : [] };
  }

  function getMetrics(context) {
    const metrics = [];
    if (context.research?.capacityMw != null) metrics.push({
      label: "Мощность", value: `${numberFormat.format(context.research.capacityMw)} МВт`, note: context.research.capacityLabel
    });
    if (context.research?.pue != null) metrics.push({
      label: "PUE",
      value: context.research.id === "ix-mos1" ? "< 1,6" : numberFormat.format(context.research.pue),
      note: context.research.id === "ix-mos1"
        ? "проектное значение из описания оператора; не фактическое измерение"
        : context.research.pueLabel
    });
    (context.research?.reportedMetrics || []).forEach((metric) => {
      metrics.push({
        label: metric.name,
        value: [numberFormat.format(metric.value), metric.unit].filter(Boolean).join(" "),
        note: [metric.year ? `отчёт оператора за ${metric.year} год` : "", metric.note].filter(Boolean).join(". ")
      });
    });
    context.metrics
      .filter((metric) => metric.value != null && metric.dataStatus !== "needs_review" && !metrics.some((item) => item.label === metric.name))
      .slice(0, 5)
      .forEach((metric) => metrics.push({
        label: metric.name,
        value: `${numberFormat.format(metric.value)}${metric.unit ? ` ${metric.unit}` : ""}`,
        note: "значение из источника"
      }));
    return metrics;
  }

  function formatSources(context) {
    const sourceItems = [];
    if (context.research) (context.research.sources || []).forEach((id) => {
      const source = researchData?.sources?.[id];
      if (source) sourceItems.push(source);
    });
    if (!sourceItems.length && context.catalog?.sourceUrl) sourceItems.push({
      short: context.catalog.sourceName || "Источник каталога", url: context.catalog.sourceUrl,
      note: context.catalog.notes || "Запись каталога дата-центров."
    });
    if (!sourceItems.length) sourceItems.push({
      short: "ATLAS / Global Data Center Map", url: "https://data-center-map.com/",
      note: "Открытый каталог локаций; атрибуция: Data centers (c) Ringmast4r - Global-Data-Center-Map."
    });
    return sourceItems.map((source) => `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.short || source.title)}</a><span>${escapeHtml(source.note || "")}</span></li>`).join("");
  }

  function featureId(feature, index) {
    const coordinates = feature.geometry?.coordinates || [];
    const properties = feature.properties || {};
    return `${index}:${properties.name || ""}:${coordinates.join(",")}`;
  }

  function renderSummary(features) {
    if (!summary) return;
    const researchSites = new Set(features.map((feature) => getContext(feature).research?.id).filter(Boolean)).size;
    const metricSites = features.filter((feature) => getMetrics(getContext(feature)).length > 0).length;
    const catalogTotal = projectData?.dataCenters?.length || 0;
    summary.innerHTML = `
      <div class="geo-map-stat"><span>Записей в выгрузке ATLAS</span><strong>${catalogTotal.toLocaleString("ru-RU")}</strong></div>
      <div class="geo-map-stat"><span>Точек на карте</span><strong>${features.length.toLocaleString("ru-RU")}</strong></div>
      <div class="geo-map-stat"><span>Площадки исследования</span><strong>${researchSites.toLocaleString("ru-RU")}</strong></div>
      <div class="geo-map-stat"><span>С доступными сведениями</span><strong>${metricSites.toLocaleString("ru-RU")}</strong></div>`;
  }

  function createResearchFeatures(atlasFeatures) {
    const matchedResearchIds = new Set(atlasFeatures.map((feature) => getContext(feature).research?.id).filter(Boolean));
    return (researchData?.dataCenters || [])
      .filter((site) => Array.isArray(site.coordinates) && site.coordinates.length >= 2 && !matchedResearchIds.has(site.id))
      .map((site) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [site.coordinates[1], site.coordinates[0]] },
        properties: { name: site.name, company: site.operator, country: catalogById.get(site.catalogId)?.country || site.country, city: site.city || site.place, researchId: site.id, sourceType: "research" }
      }));
  }

  function renderScenario(site) {
    if (!site?.scenario) return "";
    const { hours, pue, wue, gridFactor, powerShares } = site.scenario;
    const rows = powerShares.map((share) => {
      const facilityMwh = site.capacityMw * share * hours;
      const itMwh = facilityMwh / pue;
      return `<tr><th scope="row">${numberFormat.format(share * 100)}%</th>
        <td>${numberFormat.format(facilityMwh / 1000)}</td>
        <td>${numberFormat.format(itMwh / 1000)}</td>
        <td>${numberFormat.format(itMwh * wue)}</td>
        <td>${numberFormat.format(facilityMwh * gridFactor)}</td></tr>`;
    }).join("");
    return `<details class="geo-scenario"><summary>Учебный сценарий для MOS1</summary>
      <p>Мощность площадки по данным оператора — ${numberFormat.format(site.capacityMw)} МВт. Для примера берём среднюю мощность в 25%, 50% и 75% от неё на протяжении ${numberFormat.format(hours)} часов. Допущения: PUE ${numberFormat.format(pue)}, WUE ${numberFormat.format(wue)} л/кВт·ч IT, вся электроэнергия из сети с условным коэффициентом ${numberFormat.format(gridFactor)} кг CO₂e/кВт·ч.</p>
      <div class="geo-scenario-table" role="region" aria-label="Результаты учебного сценария" tabindex="0"><table>
        <thead><tr><th scope="col">Доля мощности</th><th scope="col">ЦОД, ГВт·ч</th><th scope="col">IT, ГВт·ч</th><th scope="col">Вода, м³</th><th scope="col">Выбросы, т CO₂e</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div><p>Это сценарии средней электрической мощности всей площадки. Для нижней границы вычислительной загрузки нужны телеметрия или проверенная модель серверов и измерения за тот же период. <a href="#methodology">Формулы</a></p>
      </details>`;
  }

  function renderPanel(feature) {
    const context = getContext(feature);
    if (siteFilter) siteFilter.value = context.research?.id || "";
    const properties = context.properties;
    const metrics = getMetrics(context);
    const catalog = context.catalog;
    const place = [context.research?.city || properties.city || catalog?.city, properties.state || catalog?.region, catalog?.countryLabel || properties.country].filter(Boolean).join(", ");
    const energyContext = (context.research?.energyContext || []).map(({ label, text, sourceIds }) => {
      const links = sourceIds.map((id) => {
        const source = researchData.sources[id];
        return `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.short)}</a>`;
      }).join(" · ");
      return `<p class="geo-panel-copy"><strong>${escapeHtml(label)}.</strong> ${escapeHtml(text)} ${links}</p>`;
    }).join("");
    const catalogLink = catalogById.has(context.research?.catalogId)
      ? `<p class="geo-panel-copy"><a href="#data" data-catalog-id="${escapeHtml(context.research.catalogId)}">Открыть запись в каталоге</a></p>`
      : catalogById.has(catalog?.relatedTo)
        ? `<p class="geo-panel-copy">Возможная связанная запись. <a href="#data" data-catalog-id="${escapeHtml(catalog.relatedTo)}">Открыть подтверждённую карточку кампуса</a></p>`
        : "";
    const metricMarkup = metrics.length
      ? `<dl class="geo-details">${metrics.map((metric) => `<div><dt>${escapeHtml(metric.label)}</dt><dd>${escapeHtml(metric.value)}${metric.note ? ` — ${escapeHtml(metric.note)}` : ""}</dd></div>`).join("")}</dl>`
      : "<p class=\"geo-panel-copy\">Для этой площадки в подключённых наборах нет подтверждённых экологических метрик.</p>";
    panel.innerHTML =
      `<p class="geo-panel-kicker">${metrics.length ? "Есть доступные сведения" : "Только географическая запись"}</p>` +
      `<h3>${escapeHtml(context.research?.name || properties.name || "Дата-центр без названия")}</h3>` +
      `<p class="geo-panel-place">${escapeHtml(properties.company || catalog?.company || "Оператор не указан")}${place ? ` · ${escapeHtml(place)}` : ""}</p>` + metricMarkup +
      (context.research?.cooling ? `<p class="geo-panel-copy"><strong>Охлаждение и тепло.</strong> ${escapeHtml(context.research.cooling)}</p>` : "") +
      energyContext + renderScenario(context.research) +
      `<dl class="geo-details geo-location-details"><div><dt>Адрес</dt><dd>${escapeHtml((context.research && catalog?.address) || properties.address || catalog?.address || "не опубликован")}</dd></div>` +
      (catalog?.region ? `<div><dt>Регион</dt><dd>${escapeHtml(catalog.region)}</dd></div>` : "") +
      (catalog?.status ? `<div><dt>Статус</dt><dd>${escapeHtml(catalog.status === "operational" ? "Работает" : catalog.status)}</dd></div>` : "") +
      `<div><dt>Координаты</dt><dd>${escapeHtml(feature.geometry.coordinates[1].toFixed(4))}, ${escapeHtml(feature.geometry.coordinates[0].toFixed(4))}</dd></div>` +
      (context.research?.precision ? `<div><dt>Точность точки</dt><dd>${escapeHtml(context.research.precision)}</dd></div>` : "") + "</dl>" +
      catalogLink + `<h4>Источники</h4><ul class="source-list">${formatSources(context)}</ul>`;
  }

  function mapFeature(feature, index, selected = false) {
    const copy = structuredClone(feature);
    copy.id = featureId(feature, index);
    copy.properties = { ...(copy.properties || {}), _hasMetrics: getMetrics(getContext(feature)).length > 0, _selected: selected };
    return copy;
  }

  function featureCollection(features) {
    return { type: "FeatureCollection", features: features.map((feature, index) => mapFeature(feature, index, featureId(feature, index) === selectedId)) };
  }

  function syncMapData() {
    const source = map.getSource("datacenters");
    if (source) source.setData(featureCollection(visibleFeatures));
  }

  function addPointLayers() {
    if (map.getSource("datacenters")) return;
    map.addSource("datacenters", { type: "geojson", data: featureCollection(visibleFeatures) });
    map.addLayer({
      id: "datacenter-points",
      type: "circle",
      source: "datacenters",
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 3.2, 4, 5, 7, 7, 12, 9],
        "circle-color": ["case", ["get", "_hasMetrics"], "#f28a32", "#2385a8"],
        "circle-opacity": 0.9,
        "circle-stroke-color": ["case", ["get", "_selected"], "#ffffff", "#dce6eb"],
        "circle-stroke-width": ["case", ["get", "_selected"], 2.8, 0.8]
      }
    });
    map.on("click", "datacenter-points", (event) => {
      const clicked = event.features?.[0];
      if (!clicked) return;
      const index = visibleFeatures.findIndex((feature, i) => featureId(feature, i) === clicked.id);
      if (index < 0) return;
      selectedId = clicked.id;
      renderPanel(visibleFeatures[index]);
      syncMapData();
    });
    map.on("mouseenter", "datacenter-points", () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "datacenter-points", () => { map.getCanvas().style.cursor = ""; });
    map.on("mousemove", "datacenter-points", (event) => {
      const feature = event.features?.[0];
      if (!feature) return;
      const title = escapeHtml(feature.properties?.name || "Дата-центр");
      const place = escapeHtml(feature.properties?.city || feature.properties?.country || "");
      if (hoverPopup) hoverPopup.remove();
      hoverPopup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10 })
        .setLngLat(event.lngLat).setHTML(`<strong>${title}</strong><br>${place}`).addTo(map);
    });
    map.on("mouseleave", "datacenter-points", () => { if (hoverPopup) hoverPopup.remove(); });
  }

  function renderFeatures(features) {
    visibleFeatures = features;
    renderSummary(features);
    if (!features.length) {
      selectedId = null;
      if (siteFilter) siteFilter.value = "";
      panel.innerHTML = '<p class="geo-panel-copy">По выбранным фильтрам точек нет.</p>';
      syncMapData();
      return;
    }
    const firstWithMetrics = features.findIndex((feature) => getMetrics(getContext(feature)).length > 0);
    const firstIndex = Math.max(0, firstWithMetrics);
    selectedId = featureId(features[firstIndex], firstIndex);
    renderPanel(features[firstIndex]);
    syncMapData();
    if (map.isStyleLoaded()) {
      const bounds = new maplibregl.LngLatBounds();
      features.forEach((feature) => bounds.extend(feature.geometry.coordinates));
      if (bounds.isEmpty()) map.flyTo({ center: [10, 30], zoom: 2 });
      else map.fitBounds(bounds, { padding: 36, maxZoom: 4, duration: 700 });
    }
  }

  function populateCountryFilter(features) {
    if (!countryFilter) return;
    const countryLabels = new Map((projectData?.dataCenters || []).filter((site) => site.country && site.countryLabel).map((site) => [site.country, site.countryLabel]));
    const countries = [...new Set(features.map((feature) => feature.properties?.country).filter(Boolean))]
      .sort((a, b) => (countryLabels.get(a) || a).localeCompare(countryLabels.get(b) || b, "ru"));
    countryFilter.innerHTML = '<option value="">Все страны</option>' + countries.map((country) => `<option value="${escapeHtml(country)}">${escapeHtml(countryLabels.get(country) || country)}</option>`).join("");
  }

  function applyFilters() {
    const country = countryFilter?.value || "";
    const filtered = allFeatures.filter((feature) =>
      (!country || feature.properties?.country === country) &&
      (!metricsOnly?.checked || getMetrics(getContext(feature)).length > 0)
    );
    renderFeatures(filtered);
  }
  countryFilter?.addEventListener("change", applyFilters);
  metricsOnly?.addEventListener("change", applyFilters);
  filterReset?.addEventListener("click", () => {
    if (countryFilter) countryFilter.value = "";
    if (metricsOnly) metricsOnly.checked = false;
    applyFilters();
  });

  let requestedResearchId = null;
  function showRequestedSite() {
    if (!requestedResearchId || !map.getSource("datacenters")) return;
    const index = allFeatures.findIndex((feature) => getContext(feature).research?.id === requestedResearchId);
    if (index < 0) return;
    requestedResearchId = null;
    const feature = allFeatures[index];
    if (countryFilter) countryFilter.value = "";
    if (metricsOnly) metricsOnly.checked = false;
    visibleFeatures = allFeatures;
    renderSummary(allFeatures);
    selectedId = featureId(feature, index);
    renderPanel(feature);
    syncMapData();
    map.flyTo({ center: feature.geometry.coordinates, zoom: 9 });
  }

  document.querySelectorAll("[data-map-site]").forEach((link) => {
    link.addEventListener("click", () => {
      requestedResearchId = link.dataset.mapSite;
      showRequestedSite();
    });
  });
  siteFilter?.addEventListener("change", () => {
    requestedResearchId = siteFilter.value;
    showRequestedSite();
  });

  map.on("load", () => {
    addPointLayers();
    if (visibleFeatures.length) renderFeatures(visibleFeatures);
    showRequestedSite();
  });
  map.on("error", (event) => {
    if (event?.error) console.warn("MapLibre map error:", event.error.message || event.error);
  });

  async function loadMapData() {
    try {
      let geoJson = window.geoJsonData;
      if (!geoJson) {
        if (window.location.protocol === "file:") throw new Error("Локальный слой карты не найден");
        const response = await fetch(new URL("datacenters.geojson", document.baseURI), { cache: "no-cache" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        geoJson = await response.json();
      }
      const atlasFeatures = (geoJson.features || []).filter((feature) => feature.geometry?.type === "Point" && Array.isArray(feature.geometry.coordinates));
      allFeatures = atlasFeatures.concat(createResearchFeatures(atlasFeatures));
      populateCountryFilter(allFeatures);
      if (siteFilter) {
        const sites = [...new Set(allFeatures.map((feature) => getContext(feature).research).filter(Boolean))];
        sites.sort((a, b) => a.name.localeCompare(b.name, "ru"));
        siteFilter.insertAdjacentHTML("beforeend", sites.map((site) =>
          `<option value="${escapeHtml(site.id)}">${escapeHtml(site.name)} · ${escapeHtml(site.place)}</option>`
        ).join(""));
        siteFilter.disabled = sites.length === 0;
      }
      renderFeatures(allFeatures);
      showRequestedSite();
    } catch (error) {
      if (window.location.protocol === "file:") {
        const researchFeatures = createResearchFeatures([]);
        if (researchFeatures.length) renderFeatures(researchFeatures);
      }
      const message = window.location.protocol === "file:"
        ? "Локальный слой ATLAS не найден. Для полного слоя открой сайт через HTTP-сервер."
        : `Слой ATLAS временно недоступен (${error.message}). Проверь, что datacenters.geojson опубликован рядом с index.html.`;
      panel.innerHTML = `<p>${escapeHtml(message)}</p>`;
      if (summary && window.location.protocol !== "file:") summary.innerHTML = '<div class="geo-map-stat"><span>Статус слоя</span><strong>Ошибка загрузки</strong></div>';
      console.error("GeoJSON map loading failed", error);
    }
  }

  loadMapData();
})();
