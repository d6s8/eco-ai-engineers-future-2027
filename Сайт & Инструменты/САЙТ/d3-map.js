(() => {
  const mapSvgElement = document.getElementById("mindmap");
  const d3InfoPanel = document.getElementById("map-info");
  const mapContainer = mapSvgElement?.closest(".map-container");

  if (!mapSvgElement || !d3InfoPanel || !window.d3 || !window.mapData) {
    return;
  }

  const chartWidth = 1200;
  const chartHeight = 1000;
  const centerX = chartWidth / 2;
  const centerY = chartHeight / 2;
  const d3State = { activeId: null, expanded: new Set() };
  let lastLayoutBounds = null;

  const d3Svg = d3.select(mapSvgElement);
  d3Svg.selectAll("*").remove();

  const d3Layer = d3Svg.append("g").attr("class", "d3-layer");
  const d3Viewport = d3Layer.append("g").attr("class", "d3-viewport");
  const d3EdgesLayer = d3Viewport.append("g").attr("class", "d3-edges-layer");
  const d3NodesLayer = d3Viewport.append("g").attr("class", "d3-nodes-layer");

  function applyZoomTransform(transform) {
    d3Layer.attr(
      "transform",
      "translate(" + centerX + "," + centerY + ") " + transform
    );
  }

  const zoom = d3.zoom()
    .scaleExtent([0.5, 2.4])
    .on("zoom", (event) => applyZoomTransform(event.transform));

  d3Svg.call(zoom).on("dblclick.zoom", null);
  mapSvgElement.addEventListener("wheel", (event) => event.preventDefault(), {
    passive: false
  });
  applyZoomTransform(d3.zoomIdentity);

  function getNodeBox(node) {
    return {
      width: node.data.type === "root" ? 200 : node.data.type === "main" ? 170 : node.data.type === "child" ? 150 : 132,
      height: node.data.type === "root" ? 72 : node.data.type === "main" ? 62 : 56
    };
  }

  function hasChildren(node) {
    return node.data.children?.length > 0 && node.data.type !== "root";
  }

  function getVisibleHierarchy() {
    return d3.hierarchy(window.mapData, (node) => {
      if (node.id === "root" || d3State.expanded.has(node.id)) {
        return node.children || [];
      }

      return null;
    });
  }

  function degreesToRadians(value) {
    return value * Math.PI / 180;
  }

  function pointOnRay(angle, radius) {
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  }

  function countLeaves(node) {
    if (!node.children?.length) {
      return 1;
    }

    return node.children.reduce((total, child) => total + countLeaves(child), 0);
  }

  // Each main branch permanently owns one sector. Every later level gets a
  // nested part of that sector, preventing crossings and layout jumps.
  function buildStableLayout(rootData) {
    const layout = new Map([[rootData.id, { x: 0, y: 0 }]]);
    const branchSectors = {
      carbon: { angle: -137, start: -176, end: -94, radius: 340 },
      energy: { angle: -43, start: -86, end: -4, radius: 340 },
      water: { angle: 43, start: 4, end: 86, radius: 340 },
      hardware: { angle: 137, start: 94, end: 176, radius: 340 }
    };

    function placeChildren(parent, startAngle, endAngle, depth) {
      const children = parent.children || [];
      const totalLeaves = children.reduce(
        (total, child) => total + countLeaves(child),
        0
      );
      let cursor = startAngle;

      children.forEach((child) => {
        const rawEnd = cursor + (endAngle - startAngle) * countLeaves(child) / totalLeaves;
        const padding = Math.min((rawEnd - cursor) * 0.12, degreesToRadians(2.4));
        const childStart = cursor + padding;
        const childEnd = rawEnd - padding;
        const radius = depth === 2 ? 515 : 760;

        layout.set(child.id, pointOnRay((childStart + childEnd) / 2, radius));

        if (child.children?.length) {
          placeChildren(child, childStart, childEnd, depth + 1);
        }

        cursor = rawEnd;
      });
    }

    rootData.children.forEach((mainNode) => {
      const sector = branchSectors[mainNode.id];

      if (!sector) {
        return;
      }

      layout.set(
        mainNode.id,
        pointOnRay(degreesToRadians(sector.angle), sector.radius)
      );
      placeChildren(
        mainNode,
        degreesToRadians(sector.start),
        degreesToRadians(sector.end),
        2
      );
    });

    return layout;
  }

  const stableLayout = buildStableLayout(window.mapData);

  function wrapTitle(selection, node) {
    const maxCharacters = node.data.type === "root" ? 20 : node.data.type === "leaf" ? 15 : 17;
    const words = node.data.title.split(" ");
    const lines = [];
    let currentLine = "";

    words.forEach((word) => {
      const nextLine = currentLine ? currentLine + " " + word : word;

      if (currentLine && nextLine.length > maxCharacters) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = nextLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    selection.selectAll("tspan").remove();
    selection.attr("x", 0).attr("y", -((lines.length - 1) * 8));
    lines.forEach((line, index) => {
      selection.append("tspan")
        .attr("x", 0)
        .attr("dy", index === 0 ? 0 : 16)
        .text(line);
    });
  }

  function getMethodology(nodeDatum) {
    const research = window.researchData;

    if (!research) {
      return null;
    }

    const key = nodeDatum
      .ancestors()
      .map((item) => item.data.id)
      .find((id) => research.nodeMethodology[id]);

    return key ? research.methodology[research.nodeMethodology[key]] : null;
  }

  function renderSourceLinks(sourceIds) {
    const sources = window.researchData?.sources || {};

    return sourceIds.map((id) => {
      const source = sources[id];

      return (
        '<li><a href="' + source.url + '" target="_blank" rel="noreferrer">' +
          source.short +
        ' ↗</a></li>'
      );
    }).join("");
  }

  function updateInfo(nodeDatum) {
    const node = nodeDatum.data;
    const category = node.type === "root"
      ? "ОСНОВНАЯ ТЕМА"
      : node.type === "main"
        ? "НАПРАВЛЕНИЕ"
        : node.type === "child"
          ? "ПОДТЕМА"
          : "ФАКТОР";

    const methodology = getMethodology(nodeDatum);
    const methodologyMarkup = methodology
      ? '<section class="info-methodology">' +
          '<p class="info-method-label">КАК ИЗМЕРЯЕМ</p>' +
          '<p class="info-definition">' + methodology.definition + '</p>' +
          '<p class="info-metric"><span>Показатель</span>' + methodology.metric + '</p>' +
          '<div class="info-formula">' + methodology.formula + '</div>' +
          '<p class="info-limit"><strong>Граница модели:</strong> ' + methodology.limitations + '</p>' +
          '<ul class="info-sources">' + renderSourceLinks(methodology.sources) + '</ul>' +
        '</section>'
      : '';

    d3InfoPanel.innerHTML =
      '<div class="info-category">' + category + '</div>' +
      '<h3 class="info-title">' + node.title + '</h3>' +
      '<p class="info-text">' + node.description + '</p>' +
      methodologyMarkup +
      '<button class="info-close" type="button">Сбросить выбор</button>';

    d3InfoPanel.querySelector(".info-close").addEventListener("click", () => {
      d3State.activeId = null;
      render();
      d3InfoPanel.innerHTML =
        '<div class="info-placeholder"><span class="info-symbol">+</span>' +
        '<p>Выбери любой узел карты, чтобы увидеть дополнительную информацию.</p></div>';
    });
  }

  function selectNode(nodeDatum) {
    const node = nodeDatum.data;
    d3State.activeId = node.id;
    const expandable = hasChildren(nodeDatum);

    if (expandable) {
      if (d3State.expanded.has(node.id)) {
        d3State.expanded.delete(node.id);
      } else {
        d3State.expanded.add(node.id);
      }
    }

    updateInfo(nodeDatum);
    render();

    if (expandable) {
      fitToView(520);
    }
  }

  function updateHighlight(nodeDatum) {
    const relatedIds = new Set(
      nodeDatum.ancestors().concat(nodeDatum.descendants()).map((item) => item.data.id)
    );

    d3Viewport.selectAll(".d3-node")
      .classed("is-dimmed", (item) => !relatedIds.has(item.data.id))
      .classed("is-related", (item) => relatedIds.has(item.data.id))
      .classed("is-hovered", (item) => item.data.id === nodeDatum.data.id);

    d3Viewport.selectAll(".d3-edge")
      .classed(
        "is-dimmed",
        (item) => !(relatedIds.has(item.source.data.id) && relatedIds.has(item.target.data.id))
      )
      .classed(
        "is-active",
        (item) => relatedIds.has(item.source.data.id) && relatedIds.has(item.target.data.id)
      );
  }

  function clearHighlight() {
    d3Viewport.selectAll(".d3-node, .d3-edge")
      .classed("is-dimmed", false)
      .classed("is-related", false)
      .classed("is-hovered", false)
      .classed("is-active", false);
  }

  function getBoundaryPoint(node, targetPoint) {
    const box = getNodeBox(node);
    const dx = targetPoint.x - node.plotX;
    const dy = targetPoint.y - node.plotY;

    if (dx === 0 && dy === 0) {
      return { x: node.plotX, y: node.plotY };
    }

    const scale = 1 / Math.max(
      Math.abs(dx) / (box.width / 2),
      Math.abs(dy) / (box.height / 2)
    );

    return { x: node.plotX + dx * scale, y: node.plotY + dy * scale };
  }

  function createLinkPath(link) {
    const sourcePoint = getBoundaryPoint(link.source, {
      x: link.target.plotX,
      y: link.target.plotY
    });
    const targetPoint = getBoundaryPoint(link.target, {
      x: link.source.plotX,
      y: link.source.plotY
    });
    const sourceRadius = Math.hypot(link.source.plotX, link.source.plotY);
    const targetRadius = Math.hypot(link.target.plotX, link.target.plotY);
    const targetAngle = Math.atan2(link.target.plotY, link.target.plotX);
    const sourceAngle = sourceRadius === 0
      ? targetAngle * 0.92
      : Math.atan2(link.source.plotY, link.source.plotX);
    const controlRadius = sourceRadius + (targetRadius - sourceRadius) * 0.54;
    const sourceControl = pointOnRay(sourceAngle, controlRadius);
    const targetControl = pointOnRay(targetAngle, controlRadius);

    return (
      "M " + sourcePoint.x + " " + sourcePoint.y +
      " C " + sourceControl.x + " " + sourceControl.y +
      ", " + targetControl.x + " " + targetControl.y +
      ", " + targetPoint.x + " " + targetPoint.y
    );
  }

  function createCollapsedLinkPath(link) {
    const point = getBoundaryPoint(link.source, {
      x: link.target.plotX,
      y: link.target.plotY
    });

    return "M " + point.x + " " + point.y +
      " C " + point.x + " " + point.y + ", " +
      point.x + " " + point.y + ", " + point.x + " " + point.y;
  }

  function calculateBounds(nodes) {
    const padding = 24;
    const bounds = nodes.reduce((current, node) => {
      const box = getNodeBox(node);

      return {
        minX: Math.min(current.minX, node.plotX - box.width / 2),
        maxX: Math.max(current.maxX, node.plotX + box.width / 2),
        minY: Math.min(current.minY, node.plotY - box.height / 2),
        maxY: Math.max(current.maxY, node.plotY + box.height / 2)
      };
    }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

    return {
      minX: bounds.minX - padding,
      maxX: bounds.maxX + padding,
      minY: bounds.minY - padding,
      maxY: bounds.maxY + padding
    };
  }

  function render() {
    d3Viewport.selectAll("*").interrupt();

    const root = getVisibleHierarchy();
    const nodes = root.descendants();
    nodes.forEach((node) => {
      const position = stableLayout.get(node.data.id) || { x: 0, y: 0 };
      node.plotX = position.x;
      node.plotY = position.y;
    });

    lastLayoutBounds = calculateBounds(nodes);
    const links = root.links();
    const edgeSelection = d3EdgesLayer.selectAll("path.d3-edge")
      .data(links, (link) => link.source.data.id + "-" + link.target.data.id);
    const edgeEnter = edgeSelection.enter()
      .append("path")
      .attr("class", "map-edge d3-edge")
      .attr("d", createCollapsedLinkPath)
      .style("opacity", 0);

    edgeSelection.transition()
      .duration(420)
      .ease(d3.easeCubicOut)
      .attr("d", createLinkPath)
      .style("opacity", 1);
    edgeEnter.transition()
      .delay((link) => Math.min(220, link.target.depth * 55))
      .duration(620)
      .ease(d3.easeCubicOut)
      .attr("d", createLinkPath)
      .style("opacity", 1);
    edgeSelection.exit().transition()
      .duration(280)
      .ease(d3.easeCubicIn)
      .attr("d", createCollapsedLinkPath)
      .style("opacity", 0)
      .remove();

    const nodeSelection = d3NodesLayer.selectAll("g.d3-node")
      .data(nodes, (node) => node.data.id);
    const nodeEnter = nodeSelection.enter()
      .append("g")
      .attr("class", (node) => "map-node d3-node " + node.data.type)
      .attr("role", "button")
      .attr("tabindex", "0")
      .on("mouseenter", (event, node) => updateHighlight(node))
      .on("mouseleave", clearHighlight)
      .on("click", (event, node) => selectNode(node))
      .on("keydown", (event, node) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectNode(node);
        }
      });

    nodeEnter.append("rect").attr("class", "map-node-shape");
    nodeEnter.append("text")
      .attr("class", "d3-node-label")
      .attr("text-anchor", "middle");
    nodeEnter.append("circle").attr("class", "map-toggle");
    nodeEnter.append("text")
      .attr("class", "map-toggle-text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle");

    const allNodes = nodeEnter.merge(nodeSelection);
    // New nodes appear at their reserved positions. Starting every sibling at
    // the parent made their cards overlap during the opening transition.
    nodeEnter
      .attr(
        "transform",
        (node) => "translate(" + node.plotX + ", " + node.plotY + ") scale(0.88)"
      )
      .style("opacity", 0);

    allNodes.each(function(node) {
      const group = d3.select(this);
      const box = getNodeBox(node);
      const expandable = hasChildren(node);

      group.attr(
        "aria-label",
        expandable
          ? node.data.title + ". " +
            (d3State.expanded.has(node.data.id) ? "Свернуть" : "Раскрыть") +
            " ветку"
          : node.data.title + ". Показать информацию"
      ).classed("selected", d3State.activeId === node.data.id);

      group.select("rect")
        .attr("x", -box.width / 2)
        .attr("y", -box.height / 2)
        .attr("width", box.width)
        .attr("height", box.height)
        .attr("rx", node.data.type === "root" ? 36 : 14)
        .attr("ry", node.data.type === "root" ? 36 : 14);
      wrapTitle(group.select(".d3-node-label"), node);
      group.select(".map-toggle")
        .style("display", expandable ? null : "none")
        .attr("cx", box.width / 2 - 14)
        .attr("cy", -box.height / 2 + 14)
        .attr("r", 8);
      group.select(".map-toggle-text")
        .style("display", expandable ? null : "none")
        .attr("x", box.width / 2 - 14)
        .attr("y", -box.height / 2 + 14)
        .text(d3State.expanded.has(node.data.id) ? "−" : "+");
    });

    nodeSelection.transition()
      .duration(360)
      .ease(d3.easeCubicOut)
      .attr("transform", (node) => "translate(" + node.plotX + ", " + node.plotY + ") scale(1)")
      .style("opacity", 1);
    nodeEnter.transition()
      .delay((node) => Math.min(220, node.depth * 55))
      .duration(620)
      .ease(d3.easeCubicOut)
      .attr("transform", (node) => "translate(" + node.plotX + ", " + node.plotY + ") scale(1)")
      .style("opacity", 1);
    nodeSelection.exit().transition()
      .duration(280)
      .ease(d3.easeCubicIn)
      .attr(
        "transform",
        (node) => "translate(" + node.plotX + ", " + node.plotY + ") scale(0.88)"
      )
      .style("opacity", 0)
      .remove();
  }

  function fitToView(duration = 450) {
    if (!lastLayoutBounds) {
      return;
    }

    const padding = 58;
    const contentWidth = lastLayoutBounds.maxX - lastLayoutBounds.minX;
    const contentHeight = lastLayoutBounds.maxY - lastLayoutBounds.minY;
    const scale = Math.min(
      1.08,
      chartWidth / (contentWidth + padding * 2),
      chartHeight / (contentHeight + padding * 2)
    );
    const contentCenterX = (lastLayoutBounds.minX + lastLayoutBounds.maxX) / 2;
    const contentCenterY = (lastLayoutBounds.minY + lastLayoutBounds.maxY) / 2;
    const transform = d3.zoomIdentity
      .translate(-contentCenterX * scale, -contentCenterY * scale)
      .scale(scale);
    const target = duration > 0 ? d3Svg.transition().duration(duration) : d3Svg;

    target.call(zoom.transform, transform);
  }

  mapContainer?.querySelector("[data-map-zoom-in]")?.addEventListener("click", () => {
    d3Svg.transition().duration(350).call(zoom.scaleBy, 1.2);
  });
  mapContainer?.querySelector("[data-map-zoom-out]")?.addEventListener("click", () => {
    d3Svg.transition().duration(350).call(zoom.scaleBy, 0.8);
  });
  mapContainer?.querySelector("[data-map-reset]")?.addEventListener("click", () => {
    fitToView();
  });

  render();
  fitToView(0);
})();
