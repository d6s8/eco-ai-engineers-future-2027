import * as maplibregl from "https://unpkg.com/maplibre-gl@6.17.0/dist/maplibre-gl.mjs";

(() => {
  const researchData = window.researchData;
  const projectData = window.projectData;
  const mapElement = document.getElementById("geo-map-canvas");
  const panel = document.getElementById("geo-map-panel");
  const summary = document.getElementById("geo-map-summary");
  const countryFilter = document.getElementById("geo-map-country-filter");
  const filterReset = document.getElementById("geo-map-filter-reset");

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
  const catalogByKey = new Map();
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

  (researchData?.dataCenters || []).forEach((site) => {
    researchById.set(site.id, site);
    researchByKey.set([site.name, site.operator, site.country].map(normalizeKeyPart).join("|"), site);
  });
  (projectData?.dataCenters || []).forEach((site) => catalogByKey.set(recordKey({
    name: site.name, company: site.company, country: site.country
  }), site));
  (projectData?.metrics || []).forEach((metric) => {
    if (!metric.dataCenterId) return;
    const metrics = metricsByDataCenterId.get(metric.dataCenterId) || [];
    metrics.push(metric);
    metricsByDataCenterId.set(metric.dataCenterId, metrics);
  });

  function getContext(feature) {
    const properties = feature.properties || {};
    const key = recordKey(properties);
    const research = researchById.get(properties.researchId) || researchByKey.get(key) || null;
    const catalog = catalogByKey.get(key) || null;
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
    const atlasSites = features.filter((feature) => feature.properties?.sourceType !== "research").length;
    const researchSites = features.filter((feature) => feature.properties?.sourceType === "research").length;
    const metricSites = features.filter((feature) => getMetrics(getContext(feature)).length > 0).length;
    const catalogTotal = projectData?.dataCenters?.length || 0;
    summary.innerHTML = `
      <div class="geo-map-stat"><span>Записей в каталоге</span><strong>${catalogTotal.toLocaleString("ru-RU")}</strong></div>
      <div class="geo-map-stat"><span>Точек на карте</span><strong>${atlasSites.toLocaleString("ru-RU")}</strong></div>
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
        properties: { name: site.name, company: site.operator, country: site.country, city: site.place, address: site.place, researchId: site.id, sourceType: "research" }
      }));
  }

  function renderPanel(feature) {
    const context = getContext(feature);
    const properties = context.properties;
    const metrics = getMetrics(context);
    const catalog = context.catalog;
    const place = [properties.city || catalog?.city, properties.state || catalog?.region, properties.country || catalog?.countryLabel || catalog?.country].filter(Boolean).join(", ");
    const metricMarkup = metrics.length
      ? `<dl class="geo-details">${metrics.map((metric) => `<div><dt>${escapeHtml(metric.label)}</dt><dd>${escapeHtml(metric.value)}${metric.note ? ` — ${escapeHtml(metric.note)}` : ""}</dd></div>`).join("")}</dl>`
      : "<p class=\"geo-panel-copy\">Для этой площадки в подключённых наборах нет подтверждённых экологических метрик.</p>";
    panel.innerHTML =
      `<p class="geo-panel-kicker">${metrics.length ? "Есть доступные сведения" : "Только географическая запись"}</p>` +
      `<h3>${escapeHtml(properties.name || "Дата-центр без названия")}</h3>` +
      `<p class="geo-panel-place">${escapeHtml(properties.company || catalog?.company || "Оператор не указан")}${place ? ` · ${escapeHtml(place)}` : ""}</p>` + metricMarkup +
      `<dl class="geo-details geo-location-details"><div><dt>Адрес</dt><dd>${escapeHtml(properties.address || catalog?.address || "не опубликован")}</dd></div>` +
      (catalog?.region ? `<div><dt>Регион</dt><dd>${escapeHtml(catalog.region)}</dd></div>` : "") +
      (catalog?.status ? `<div><dt>Статус</dt><dd>${escapeHtml(catalog.status)}</dd></div>` : "") +
      `<div><dt>Координаты</dt><dd>${escapeHtml(feature.geometry.coordinates[1].toFixed(4))}, ${escapeHtml(feature.geometry.coordinates[0].toFixed(4))}</dd></div></dl>` +
      `<h4>Источники</h4><ul class="source-list">${formatSources(context)}</ul>`;
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
      panel.innerHTML = '<p class="geo-panel-copy">Для выбранной страны в наборе нет точек с координатами.</p>';
      syncMapData();
      return;
    }
    selectedId = featureId(features[0], 0);
    renderPanel(features[0]);
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

  function applyCountryFilter() {
    const country = countryFilter?.value || "";
    renderFeatures(country ? allFeatures.filter((feature) => feature.properties?.country === country) : allFeatures);
  }
  countryFilter?.addEventListener("change", applyCountryFilter);
  filterReset?.addEventListener("click", () => { if (countryFilter) countryFilter.value = ""; applyCountryFilter(); });

  map.on("load", () => {
    addPointLayers();
    if (visibleFeatures.length) renderFeatures(visibleFeatures);
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
      renderFeatures(allFeatures);
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
