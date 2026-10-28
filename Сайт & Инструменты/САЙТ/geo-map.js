(() => {
  const data = window.researchData;
  const mapElement = document.getElementById("geo-map-canvas");
  const panel = document.getElementById("geo-map-panel");
  const metricControl = document.getElementById("geo-metric");
  const utilizationControl = document.getElementById("geo-utilization");
  const utilizationValue = document.getElementById("geo-utilization-value");
  const wueControl = document.getElementById("geo-wue");
  const wueValue = document.getElementById("geo-wue-value");

  if (!data || !mapElement || !panel || !metricControl || !window.L) {
    if (panel) {
      panel.innerHTML = "<p>Не удалось загрузить геокарту. Проверь подключение к картографическому слою.</p>";
    }
    return;
  }

  const numberFormat = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0
  });
  let selectedId = data.dataCenters[0]?.id || null;
  let metric = metricControl.value;
  const map = L.map(mapElement, {
    zoomControl: false,
    scrollWheelZoom: true
  }).setView([52, 30], 3);
  const markersLayer = L.layerGroup().addTo(map);

  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution: "&copy; Участники OpenStreetMap"
    }
  ).addTo(map);

  function getAssumptions() {
    return {
      utilization: Number(utilizationControl.value) / 100,
      wue: Number(wueControl.value),
      pue: data.assumptions.defaultPue,
      hoursPerYear: data.assumptions.hoursPerYear
    };
  }

  function calculate(site) {
    if (!site.capacityMw || !site.gridFactorKg) {
      return null;
    }

    const assumptions = getAssumptions();
    const facilityEnergyMWh =
      site.capacityMw * assumptions.utilization * assumptions.hoursPerYear;
    const pue = site.pue || assumptions.pue;
    const itEnergyMWh = facilityEnergyMWh / pue;
    const carbonTonnes = facilityEnergyMWh * site.gridFactorKg;
    const waterM3 = itEnergyMWh * assumptions.wue;

    return {
      facilityEnergyMWh,
      itEnergyMWh,
      pue,
      carbonTonnes,
      waterM3,
      assumptions
    };
  }

  function formatSources(ids) {
    return ids.map((id) => {
      const source = data.sources[id];

      return (
        '<li><a href="' + source.url + '" target="_blank" rel="noreferrer">' +
          source.short +
        '</a><span>' + source.note + '</span></li>'
      );
    }).join("");
  }

  function qualityLabel(site) {
    return site.status === "estimated"
      ? "Сценарная оценка"
      : "Только местоположение";
  }

  function renderPanel(site) {
    const result = calculate(site);
    const sourceMarkup = formatSources(site.sources);

    if (!result) {
      panel.innerHTML =
        '<p class="geo-panel-kicker">' + qualityLabel(site) + '</p>' +
        '<h3>' + site.name + '</h3>' +
        '<p class="geo-panel-place">' + site.place + '</p>' +
        '<p class="geo-panel-copy">Площадка подтверждена документом, но в открытых источниках из реестра MVP нет одновременно мощности/годового потребления и коэффициента сети, достаточных для расчёта.</p>' +
        '<dl class="geo-details">' +
          '<div><dt>Точность точки</dt><dd>' + site.precision + '</dd></div>' +
        '</dl>' +
        '<h4>Документы</h4><ul class="source-list">' + sourceMarkup + '</ul>';
      return;
    }

    const pueDescription = site.pue
      ? site.pueLabel
      : "В модели использовано допущение PUE = " + result.pue.toLocaleString("ru-RU") + ".";
    const activeValue = metric === "carbon"
      ? numberFormat.format(result.carbonTonnes) + " тCO₂e/год"
      : numberFormat.format(result.waterM3) + " м³/год";

    panel.innerHTML =
      '<p class="geo-panel-kicker">' + qualityLabel(site) + '</p>' +
      '<h3>' + site.name + '</h3>' +
      '<p class="geo-panel-place">' + site.place + '</p>' +
      '<div class="geo-result"><span>Текущий показатель</span><strong>' + activeValue + '</strong></div>' +
      '<dl class="geo-details">' +
        '<div><dt>Мощность</dt><dd>' + site.capacityMw.toLocaleString("ru-RU") + " МВт — " + site.capacityLabel + '</dd></div>' +
        '<div><dt>Энергия ЦОДа</dt><dd>' + numberFormat.format(result.facilityEnergyMWh) + ' МВт·ч/год</dd></div>' +
        '<div><dt>PUE</dt><dd>' + result.pue.toLocaleString("ru-RU") + " — " + pueDescription + '</dd></div>' +
        '<div><dt>Коэффициент сети</dt><dd>' + (site.gridFactorKg * 1000).toLocaleString("ru-RU") + ' гCO₂e/кВт·ч — ' + site.gridFactorLabel + '</dd></div>' +
      '</dl>' +
      '<div class="formula-block">' +
        '<strong>Расчёт</strong>' +
        '<div class="formula-line"><span>E<sub>ЦОД</sub></span><b>=</b><span>' + site.capacityMw + ' МВт × ' + Math.round(result.assumptions.utilization * 100) + '% × 8 760 ч</span></div>' +
        '<div class="formula-line"><span>CO₂e</span><b>=</b><span>E<sub>ЦОД</sub> × ' + site.gridFactorKg.toLocaleString("ru-RU") + ' тCO₂e/МВт·ч</span></div>' +
        '<div class="formula-line"><span>Вода<sub>площадка</sub></span><b>=</b><span>(E<sub>ЦОД</sub> / PUE) × ' + result.assumptions.wue.toLocaleString("ru-RU") + ' л/кВт·ч</span></div>' +
      '</div>' +
      '<p class="geo-panel-note">Это оценка годовой нагрузки при заданной загрузке. Она не является опубликованным оператором потреблением и не моделирует локальную температуру.</p>' +
      '<h4>Документы</h4><ul class="source-list">' + sourceMarkup + '</ul>';
  }

  function markerStyle(site, result) {
    if (!result) {
      return {
        radius: 7,
        color: "#9ca5aa",
        fillColor: "#3d454b",
        fillOpacity: 0.8,
        weight: 2,
        dashArray: "3 4"
      };
    }

    const value = metric === "carbon" ? result.carbonTonnes : result.waterM3;
    const radius = Math.min(22, Math.max(8, 7 + Math.log10(value + 1) * 2.7));

    return {
      radius,
      color: metric === "carbon" ? "#e9a56c" : "#77b8cf",
      fillColor: metric === "carbon" ? "#d97e3f" : "#4f9cb9",
      fillOpacity: 0.78,
      weight: site.id === selectedId ? 3 : 1.5
    };
  }

  function renderMarkers() {
    markersLayer.clearLayers();

    data.dataCenters.forEach((site) => {
      const result = calculate(site);
      const marker = L.circleMarker(site.coordinates, markerStyle(site, result));
      const markerText = result
        ? metric === "carbon"
          ? numberFormat.format(result.carbonTonnes) + " тCO₂e/год"
          : numberFormat.format(result.waterM3) + " м³/год"
        : "Есть только подтверждённое местоположение";

      marker.bindTooltip(
        "<strong>" + site.name + "</strong><br>" + site.place + "<br>" + markerText,
        { direction: "top", offset: [0, -8] }
      );
      marker.on("click", () => {
        selectedId = site.id;
        renderPanel(site);
        renderMarkers();
      });
      marker.addTo(markersLayer);
    });

    const selected = data.dataCenters.find((site) => site.id === selectedId);
    if (selected) {
      renderPanel(selected);
    }
  }

  function refreshAssumptionLabels() {
    utilizationValue.textContent = utilizationControl.value + "%";
    wueValue.textContent = Number(wueControl.value).toLocaleString("ru-RU") + " л/кВт·ч";
  }

  metricControl.addEventListener("change", () => {
    metric = metricControl.value;
    renderMarkers();
  });
  utilizationControl.addEventListener("input", () => {
    refreshAssumptionLabels();
    renderMarkers();
  });
  wueControl.addEventListener("input", () => {
    refreshAssumptionLabels();
    renderMarkers();
  });

  refreshAssumptionLabels();
  renderMarkers();
  map.fitBounds(data.dataCenters.map((site) => site.coordinates), {
    padding: [36, 36],
    maxZoom: 4
  });
})();
