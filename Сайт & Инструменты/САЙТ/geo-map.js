(() => {
  const researchData = window.researchData;
  const projectData = window.projectData;
  const mapElement = document.getElementById("geo-map-canvas");
  const panel = document.getElementById("geo-map-panel");
  const summary = document.getElementById("geo-map-summary");

  if (!mapElement || !panel || !window.L) {
    if (panel) {
      panel.innerHTML = "<p>Не удалось загрузить карту. Проверь подключение к картографическому слою.</p>";
    }
    return;
  }

  const numberFormat = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
  const map = L.map(mapElement, {
    zoomControl: false,
    scrollWheelZoom: true,
    preferCanvas: true
  }).setView([30, 10], 2);
  const renderer = L.canvas({ padding: 0.5 });
  const markersLayer = L.layerGroup().addTo(map);
  const markersById = new Map();
  const researchByKey = new Map();
  const researchById = new Map();
  const catalogByKey = new Map();
  const metricsByDataCenterId = new Map();
  let selectedId = null;

  L.control.zoom({ position: "bottomright" }).addTo(map);
  const tileProviders = [
    {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      options: {
        maxZoom: 19,
        attribution: "Tiles &copy; Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP and the GIS User Community"
      }
    },
    {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      options: {
        maxZoom: 19,
        attribution: "&copy; Участники OpenStreetMap"
      }
    }
  ];
  let activeTileLayer = null;
  let tileProviderIndex = -1;
  let tileErrorCount = 0;

  function showTileNotice(text) {
    const notice = document.createElement("div");
    notice.className = "geo-map-tile-notice";
    notice.textContent = text;
    mapElement.appendChild(notice);
  }

  function attachTileProvider(index) {
    const provider = tileProviders[index];
    if (!provider) {
      showTileNotice("Картографический фон недоступен. Точки данных остаются доступны.");
      return;
    }
    tileProviderIndex = index;
    tileErrorCount = 0;
    const layer = L.tileLayer(provider.url, provider.options);
    layer.on("tileerror", () => {
      tileErrorCount += 1;
      if (tileErrorCount < 2 || layer !== activeTileLayer) return;
      map.removeLayer(layer);
      activeTileLayer = null;
      attachTileProvider(tileProviderIndex + 1);
    });
    activeTileLayer = layer.addTo(map);
  }

  attachTileProvider(0);

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const normalizeKeyPart = (value) => String(value ?? "")
    .trim()
    .toLocaleLowerCase("ru-RU")
    .replace(/\s+/g, " ");

  const recordKey = (record) => [record.name, record.company, record.country]
    .map(normalizeKeyPart)
    .join("|");

  (researchData?.dataCenters || []).forEach((site) => {
    researchById.set(site.id, site);
    researchByKey.set(
      [site.name, site.operator, site.country].map(normalizeKeyPart).join("|"),
      site
    );
  });
  (projectData?.dataCenters || []).forEach((site) => catalogByKey.set(recordKey({
    name: site.name,
    company: site.company,
    country: site.country
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
    return {
      properties,
      research,
      catalog,
      metrics: catalog ? (metricsByDataCenterId.get(catalog.id) || []) : []
    };
  }

  function getMetrics(context) {
    const metrics = [];
    if (context.research?.capacityMw != null) {
      metrics.push({
        label: "Мощность",
        value: `${numberFormat.format(context.research.capacityMw)} МВт`,
        note: context.research.capacityLabel
      });
    }
    if (context.research?.pue != null) {
      metrics.push({
        label: "PUE",
        value: numberFormat.format(context.research.pue),
        note: context.research.pueLabel
      });
    }
    context.metrics
      .filter((metric) => metric.value != null && !metrics.some((item) => item.label === metric.name))
      .slice(0, 5)
      .forEach((metric) => metrics.push({
        label: metric.name,
        value: `${numberFormat.format(metric.value)}${metric.unit ? ` ${metric.unit}` : ""}`,
        note: metric.dataStatus === "needs_review" ? "кандидат, нужна проверка" : "извлечено из источника"
      }));
    return metrics;
  }

  function formatSources(context) {
    const sourceItems = [];
    if (context.research) {
      (context.research.sources || []).forEach((id) => {
        const source = researchData?.sources?.[id];
        if (source) sourceItems.push(source);
      });
    }
    if (!sourceItems.length) {
      sourceItems.push({
        short: "ATLAS / Global Data Center Map",
        url: "https://data-center-map.com/",
        note: "Открытый каталог локаций; требуется атрибуция Ringmast4r."
      });
    }
    return sourceItems.map((source) => {
      const title = escapeHtml(source.short || source.title);
      const note = escapeHtml(source.note || "");
      return `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${title}</a><span>${note}</span></li>`;
    }).join("");
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
    summary.innerHTML = `
      <div class="geo-map-stat">
        <span>Точки ATLAS</span>
        <strong>${atlasSites.toLocaleString("ru-RU")}</strong>
      </div>
      <div class="geo-map-stat">
        <span>Площадки исследования</span>
        <strong>${researchSites.toLocaleString("ru-RU")}</strong>
      </div>
      <div class="geo-map-stat">
        <span>С показателями</span>
        <strong>${metricSites.toLocaleString("ru-RU")}</strong>
      </div>`;
  }

  function createResearchFeatures(atlasFeatures) {
    const matchedResearchIds = new Set(
      atlasFeatures
        .map((feature) => getContext(feature).research?.id)
        .filter(Boolean)
    );
    return (researchData?.dataCenters || [])
      .filter((site) => (
        Array.isArray(site.coordinates) &&
        site.coordinates.length >= 2 &&
        !matchedResearchIds.has(site.id)
      ))
      .map((site) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [site.coordinates[1], site.coordinates[0]]
        },
        properties: {
          name: site.name,
          company: site.operator,
          country: site.country,
          city: site.place,
          address: site.place,
          researchId: site.id,
          sourceType: "research"
        }
      }));
  }

  function renderPanel(feature) {
    const context = getContext(feature);
    const properties = context.properties;
    const metrics = getMetrics(context);
    const place = [properties.city, properties.state, properties.country]
      .filter(Boolean)
      .join(", ");
    const metricMarkup = metrics.length
      ? `<dl class="geo-details">${metrics.map((metric) => (
          `<div><dt>${escapeHtml(metric.label)}</dt><dd>${escapeHtml(metric.value)} — ${escapeHtml(metric.note)}</dd></div>`
        )).join("")}</dl>`
      : "<p class=\"geo-panel-copy\">Для этой площадки в подключённых наборах нет подтверждённых экологических метрик.</p>";

    panel.innerHTML =
      `<p class="geo-panel-kicker">${metrics.length ? "Есть доступные метрики" : "Только географическая запись"}</p>` +
      `<h3>${escapeHtml(properties.name || "Дата-центр без названия")}</h3>` +
      `<p class="geo-panel-place">${escapeHtml(properties.company)}${place ? ` · ${escapeHtml(place)}` : ""}</p>` +
      metricMarkup +
      `<dl class="geo-details geo-location-details">` +
        `<div><dt>Адрес</dt><dd>${escapeHtml(properties.address || "не опубликован")}</dd></div>` +
        `<div><dt>Координаты</dt><dd>${escapeHtml(feature.geometry.coordinates[1].toFixed(4))}, ${escapeHtml(feature.geometry.coordinates[0].toFixed(4))}</dd></div>` +
      `</dl>` +
      `<h4>Источники</h4><ul class="source-list">${formatSources(context)}</ul>`;
  }

  function markerStyle(feature, isSelected) {
    const hasMetrics = getMetrics(getContext(feature)).length > 0;
    const zoom = map.getZoom();
    const baseRadius = zoom >= 7 ? 9 : (zoom >= 5 ? 8 : 6);
    return {
      renderer,
      radius: isSelected ? baseRadius + 3 : baseRadius,
      color: isSelected ? "#ffffff" : "#f1f4f5",
      fillColor: hasMetrics ? "#f28a32" : "#2385a8",
      fillOpacity: 0.96,
      weight: isSelected ? 3 : 1.5
    };
  }

  function updateMarkerStyles() {
    markersById.forEach((entry, id) => entry.marker.setStyle(markerStyle(entry.feature, id === selectedId)));
  }

  map.on("zoomend", updateMarkerStyles);

  function renderMarkers(features) {
    markersLayer.clearLayers();
    markersById.clear();
    features.forEach((feature, index) => {
      const coordinates = feature.geometry?.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length < 2) return;
      const id = featureId(feature, index);
      const marker = L.circleMarker([coordinates[1], coordinates[0]], markerStyle(feature, id === selectedId));
      marker.bindTooltip(
        `<strong>${escapeHtml(feature.properties?.name || "Дата-центр")}</strong><br>${escapeHtml(feature.properties?.city || feature.properties?.country || "")}`,
        { direction: "top", offset: [0, -5] }
      );
      marker.on("click", () => {
        selectedId = id;
        renderPanel(feature);
        updateMarkerStyles();
      });
      marker.addTo(markersLayer);
      markersById.set(id, { feature, marker });
    });
  }

  function renderFeatures(features) {
    if (!features.length) throw new Error("Карта не содержит точек");

    selectedId = featureId(features[0], 0);
    renderSummary(features);
    renderMarkers(features);
    renderPanel(features[0]);
    const bounds = L.latLngBounds(features.map((feature) => [
      feature.geometry.coordinates[1],
      feature.geometry.coordinates[0]
    ]));
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 4 });
  }

  async function loadMapData() {
    try {
      let geoJson = window.geoJsonData;
      if (!geoJson) {
        if (window.location.protocol === "file:") {
          throw new Error("Локальный слой карты не найден");
        }
        const dataUrl = new URL("datacenters.geojson", document.baseURI);
        const response = await fetch(dataUrl, { cache: "no-cache" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        geoJson = await response.json();
      }
      const atlasFeatures = (geoJson.features || []).filter((feature) => (
        feature.geometry?.type === "Point" && Array.isArray(feature.geometry.coordinates)
      ));
      const features = atlasFeatures.concat(createResearchFeatures(atlasFeatures));
      renderFeatures(features);
    } catch (error) {
      if (window.location.protocol === "file:") {
        const researchFeatures = createResearchFeatures([]);
        if (researchFeatures.length) {
          renderFeatures(researchFeatures);
        }
      }
      const message = window.location.protocol === "file:"
        ? "Локальный слой ATLAS не найден. Для полного слоя запустите экспорт сайта или откройте его через HTTP-сервер."
        : `Слой ATLAS временно недоступен (${error.message}). Проверьте, что datacenters.geojson опубликован рядом с index.html.`;
      panel.innerHTML = `<p>${escapeHtml(message)}</p>`;
      if (summary && window.location.protocol !== "file:") {
        summary.innerHTML = "<div class=\"geo-map-stat\"><span>Статус слоя</span><strong>Ошибка загрузки</strong></div>";
      }
      console.error("GeoJSON map loading failed", error);
    }
  }

  loadMapData();
})();
