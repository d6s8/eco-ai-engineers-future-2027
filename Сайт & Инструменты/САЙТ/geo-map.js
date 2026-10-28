(() => {
  const data = window.researchData;
  const mapElement = document.getElementById("geo-map-canvas");
  const panel = document.getElementById("geo-map-panel");
  const summary = document.getElementById("geo-map-summary");

  if (!data || !mapElement || !panel || !window.L) {
    if (panel) {
      panel.innerHTML = "<p>Не удалось загрузить карту. Проверь подключение к картографическому слою.</p>";
    }
    return;
  }

  const sites = (data.dataCenters || []).filter((site) => (
    Array.isArray(site.coordinates) && site.coordinates.length === 2
  ));
  const numberFormat = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
  let selectedId = sites[0]?.id || null;

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const map = L.map(mapElement, {
    zoomControl: false,
    scrollWheelZoom: true
  }).setView([56, 30], 3);
  const markersLayer = L.layerGroup().addTo(map);

  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution: "&copy; Участники OpenStreetMap"
    }
  ).addTo(map);

  function getMetrics(site) {
    const metrics = [];
    if (site.capacityMw != null) {
      metrics.push({
        label: "Мощность",
        value: `${numberFormat.format(site.capacityMw)} МВт`,
        note: site.capacityLabel
      });
    }
    if (site.pue != null) {
      metrics.push({
        label: "PUE",
        value: numberFormat.format(site.pue),
        note: site.pueLabel
      });
    }
    return metrics;
  }

  function formatSources(ids) {
    return (ids || []).map((id) => {
      const source = data.sources?.[id];
      if (!source) return "";
      const title = escapeHtml(source.short || source.title || id);
      const note = escapeHtml(source.note || "");
      const link = source.url
        ? `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${title}</a>`
        : `<span>${title}</span>`;
      return `<li>${link}<span>${note}</span></li>`;
    }).join("");
  }

  function renderSummary() {
    if (!summary) return;
    const metricSites = sites.filter((site) => getMetrics(site).length > 0).length;
    summary.innerHTML = `
      <div class="geo-map-stat">
        <span>Точки на карте</span>
        <strong>${sites.length}</strong>
      </div>
      <div class="geo-map-stat">
        <span>С опубликованными метриками</span>
        <strong>${metricSites}</strong>
      </div>`;
  }

  function renderPanel(site) {
    const metrics = getMetrics(site);
    const status = metrics.length > 0
      ? "Есть опубликованные показатели"
      : "Только подтверждённое местоположение";
    const metricMarkup = metrics.length
      ? `<dl class="geo-details">${metrics.map((metric) => (
          `<div><dt>${escapeHtml(metric.label)}</dt><dd>${escapeHtml(metric.value)} — ${escapeHtml(metric.note)}</dd></div>`
        )).join("")}</dl>`
      : "<p class=\"geo-panel-copy\">В доступных источниках нет подтверждённых ресурсных показателей для этой площадки.</p>";

    panel.innerHTML =
      `<p class="geo-panel-kicker">${escapeHtml(status)}</p>` +
      `<h3>${escapeHtml(site.name)}</h3>` +
      `<p class="geo-panel-place">${escapeHtml(site.operator)} · ${escapeHtml(site.place)}</p>` +
      metricMarkup +
      `<dl class="geo-details geo-location-details">` +
        `<div><dt>Страна</dt><dd>${escapeHtml(site.country)}</dd></div>` +
        `<div><dt>Точность точки</dt><dd>${escapeHtml(site.precision)}</dd></div>` +
      `</dl>` +
      `<h4>Источники</h4><ul class="source-list">${formatSources(site.sources)}</ul>`;
  }

  function markerStyle(site) {
    const hasMetrics = getMetrics(site).length > 0;
    return {
      radius: site.id === selectedId ? 10 : 8,
      color: site.id === selectedId ? "#f1f4f5" : (hasMetrics ? "#e9a56c" : "#9ca5aa"),
      fillColor: hasMetrics ? "#d97e3f" : "#596269",
      fillOpacity: 0.86,
      weight: site.id === selectedId ? 3 : 1.5
    };
  }

  function renderMarkers() {
    markersLayer.clearLayers();
    sites.forEach((site) => {
      const marker = L.circleMarker(site.coordinates, markerStyle(site));
      marker.bindTooltip(
        `<strong>${escapeHtml(site.name)}</strong><br>${escapeHtml(site.place)}`,
        { direction: "top", offset: [0, -8] }
      );
      marker.on("click", () => {
        selectedId = site.id;
        renderPanel(site);
        renderMarkers();
      });
      marker.addTo(markersLayer);
    });

    const selected = sites.find((site) => site.id === selectedId);
    if (selected) renderPanel(selected);
  }

  if (!sites.length) {
    panel.innerHTML = "<p>В текущем наборе нет площадок с координатами для отображения на карте.</p>";
    renderSummary();
    return;
  }

  renderSummary();
  renderMarkers();
  map.fitBounds(sites.map((site) => site.coordinates), {
    padding: [36, 36],
    maxZoom: 4
  });
})();
