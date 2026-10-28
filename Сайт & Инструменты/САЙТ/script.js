const svg = document.getElementById("mindmap");
const infoPanel = document.getElementById("map-info");


const SVG_NS = "http://www.w3.org/2000/svg";


const mapData = window.mapData = {
  id: "root",
  title: "Экологический след ИИ",
  description:
    "Экологическое воздействие искусственного интеллекта складывается из энергопотребления, расхода воды, жизненного цикла оборудования и связанных с ними выбросов.",
  type: "root",

  children: [
    {
      id: "energy",
      title: "Энергопотребление",
      description:
        "Энергопотребление связано с обучением больших моделей, инференсом и работой инфраструктуры дата-центров.",
      type: "main",

      children: [
        {
          id: "training",
          title: "Обучение моделей",
          description:
            "Вычислительная нагрузка зависит от размера модели, количества процессоров и количества повторных экспериментов.",
          type: "child",

          children: [
            {
              id: "model-size",
              title: "Размер модели",
              description:
                "Увеличение количества параметров модели может увеличивать вычислительные требования.",
              type: "leaf"
            },

            {
              id: "processors",
              title: "Количество процессоров",
              description:
                "Обучение больших моделей требует большого количества GPU и других специализированных процессоров.",
              type: "leaf"
            },

            {
              id: "experiments",
              title: "Многократные эксперименты",
              description:
                "Повторное обучение и эксперименты увеличивают совокупную вычислительную нагрузку.",
              type: "leaf"
            }
          ]
        },

        {
          id: "inference",
          title: "Инференс",
          description:
            "После обучения модель продолжает потреблять вычислительные ресурсы во время обработки пользовательских запросов.",
          type: "child",

          children: [
            {
              id: "requests",
              title: "Постоянные запросы",
              description:
                "Постоянный поток пользовательских запросов создаёт непрерывную вычислительную нагрузку.",
              type: "leaf"
            },

            {
              id: "mass-use",
              title: "Массовое использование",
              description:
                "При большом количестве пользователей суммарная нагрузка после обучения становится значительной.",
              type: "leaf"
            }
          ]
        },

        {
          id: "datacenters",
          title: "Дата-центры",
          description:
            "AI-инфраструктура включает серверы, специализированные ускорители, системы охлаждения и другую инфраструктуру.",
          type: "child",

          children: [
            {
              id: "servers",
              title: "AI-серверы",
              description:
                "Серверное оборудование обеспечивает вычисления для обучения и инференса.",
              type: "leaf"
            },

            {
              id: "density",
              title: "Плотность энергопотребления",
              description:
                "Рост вычислительной мощности увеличивает энергетическую нагрузку на инфраструктуру.",
              type: "leaf"
            },

            {
              id: "efficiency",
              title: "Эффективность дата-центра",
              description:
                "Эффективность инфраструктуры влияет на количество ресурсов, необходимых для выполнения вычислений.",
              type: "leaf"
            }
          ]
        }
      ]
    },


    {
      id: "water",
      title: "Расход воды",
      description:
        "Водный след связан с охлаждением дата-центров, производством электроэнергии и изготовлением полупроводников.",
      type: "main",

      children: [
        {
          id: "cooling",
          title: "Охлаждение",
          description:
            "Вычислительное оборудование выделяет тепло, поэтому дата-центрам необходимы системы его отвода.",
          type: "child",

          children: [
            {
              id: "heat",
              title: "Тепловая нагрузка",
              description:
                "Чем выше вычислительная нагрузка, тем больше тепла необходимо отводить.",
              type: "leaf"
            },

            {
              id: "cooling-systems",
              title: "Системы охлаждения",
              description:
                "Разные системы охлаждения отличаются по эффективности и требованиям к ресурсам.",
              type: "leaf"
            }
          ]
        },

        {
          id: "electricity-water",
          title: "Производство электроэнергии",
          description:
            "Водный след может возникать косвенно через производство электроэнергии.",
          type: "child",

          children: [
            {
              id: "indirect-water",
              title: "Косвенный водный след",
              description:
                "Энергетическая инфраструктура также может требовать воду.",
              type: "leaf"
            },

            {
              id: "thermal-generation",
              title: "Тепловая генерация",
              description:
                "Некоторые виды тепловой генерации связаны с дополнительным потреблением воды.",
              type: "leaf"
            }
          ]
        }
      ]
    },


    {
      id: "hardware",
      title: "Жизненный цикл оборудования",
      description:
        "Воздействие оборудования начинается с добычи сырья и производства компонентов и заканчивается эксплуатацией и электронными отходами.",
      type: "main",

      children: [
        {
          id: "chips",
          title: "Микрочипы",
          description:
            "Производство полупроводников связано с использованием энергии, воды и специальных производственных процессов.",
          type: "child",

          children: [
            {
              id: "semiconductors",
              title: "Производство полупроводников",
              description:
                "Производство микрочипов требует сложной инфраструктуры и значительного количества ресурсов.",
              type: "leaf"
            },

            {
              id: "pure-water",
              title: "Сверхчистая вода",
              description:
                "Производство полупроводников использует воду высокой степени очистки.",
              type: "leaf"
            }
          ]
        },

        {
          id: "raw-materials",
          title: "Добыча сырья",
          description:
            "Производство оборудования зависит от добычи различных материалов.",
          type: "child",

          children: [
            {
              id: "rare-metals",
              title: "Редкие металлы",
              description:
                "Электронное оборудование требует различных металлов и других материалов.",
              type: "leaf"
            },

            {
              id: "soil-water",
              title: "Воздействие на почвы и воду",
              description:
                "Добывающие процессы могут воздействовать на почвы, воду и экосистемы.",
              type: "leaf"
            }
          ]
        },

        {
          id: "ewaste",
          title: "Электронные отходы",
          description:
            "После окончания эксплуатации оборудование становится частью потока электронных отходов.",
          type: "child",

          children: [
            {
              id: "recycling",
              title: "Переработка",
              description:
                "Переработка позволяет возвращать часть материалов в производственный цикл.",
              type: "leaf"
            },

            {
              id: "reuse",
              title: "Повторное использование",
              description:
                "Продление срока службы оборудования может уменьшать необходимость производства новых компонентов.",
              type: "leaf"
            }
          ]
        }
      ]
    },


    {
      id: "carbon",
      title: "Выбросы CO₂",
      description:
        "Углеродный след зависит от потребления электроэнергии, энергомикса и жизненного цикла оборудования.",
      type: "main",

      children: [
        {
          id: "energy-mix",
          title: "Энергомикс",
          description:
            "Углеродная интенсивность электроэнергии зависит от источников, используемых для её производства.",
          type: "child",

          children: [
            {
              id: "coal-gas",
              title: "Уголь и газ",
              description:
                "Использование ископаемого топлива связано с выбросами при производстве электроэнергии.",
              type: "leaf"
            },

            {
              id: "low-carbon",
              title: "Низкоуглеродная энергетика",
              description:
                "Источники с низкой углеродной интенсивностью могут уменьшать связанные с электроэнергией выбросы.",
              type: "leaf"
            }
          ]
        },

        {
          id: "lifecycle",
          title: "Жизненный цикл",
          description:
            "Выбросы связаны не только с эксплуатацией, но и с производством и транспортировкой оборудования.",
          type: "child",

          children: [
            {
              id: "production",
              title: "Производство оборудования",
              description:
                "Производство серверов и компонентов связано с энергетическими и материальными затратами.",
              type: "leaf"
            },

            {
              id: "transport",
              title: "Транспортировка",
              description:
                "Перемещение оборудования является частью его жизненного цикла.",
              type: "leaf"
            },

            {
              id: "operation",
              title: "Эксплуатация",
              description:
                "Работа серверов и другой инфраструктуры сопровождается потреблением электроэнергии.",
              type: "leaf"
            }
          ]
        }
      ]
    }
  ]
};


const state = {
  activeNode: null,
  expanded: new Set([
    "energy",
    "water",
    "hardware",
    "carbon"
  ])
};


function createSvgElement(tag, attributes = {}) {
  const element = document.createElementNS(SVG_NS, tag);

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  return element;
}


function flattenTree(node, parent = null, depth = 0, result = []) {
  const item = {
    node,
    parent,
    depth
  };

  result.push(item);

  if (node.children) {
    node.children.forEach((child) => {
      flattenTree(child, node, depth + 1, result);
    });
  }

  return result;
}


const allNodes = flattenTree(mapData);


function getNode(id) {
  return allNodes.find((item) => item.node.id === id)?.node;
}


function isVisible(node) {
  if (node.id === "root") {
    return true;
  }

  const item = allNodes.find((entry) => entry.node.id === node.id);

  if (!item || !item.parent) {
    return true;
  }

  return (
    state.expanded.has(item.parent.id) &&
    isVisible(item.parent)
  );
}


function getVisibleNodes() {
  return allNodes.filter((item) => isVisible(item.node));
}


function getChildren(node) {
  return node.children || [];
}


function calculatePositions() {
  const positions = new Map();

  const rootX = 600;
  const rootY = 380;

  positions.set("root", {
    x: rootX,
    y: rootY
  });


  const mainNodes = mapData.children;

  const mainRadiusX = 310;
  const mainRadiusY = 145;


  mainNodes.forEach((node, index) => {
    const angle =
      -Math.PI / 2 +
      (index * Math.PI * 2) / mainNodes.length;

    positions.set(node.id, {
      x: rootX + Math.cos(angle) * mainRadiusX,
      y: rootY + Math.sin(angle) * mainRadiusY
    });
  });


  mainNodes.forEach((mainNode) => {

    if (!state.expanded.has(mainNode.id)) {
      return;
    }

    const children = getChildren(mainNode);

    const mainPosition = positions.get(mainNode.id);

    children.forEach((child, index) => {

      const center =
        (children.length - 1) / 2;

      const offset = index - center;

      let directionX = mainPosition.x - rootX;
      let directionY = mainPosition.y - rootY;

      const length =
        Math.sqrt(
          directionX * directionX +
          directionY * directionY
        );

      directionX /= length;
      directionY /= length;

      const perpendicularX = -directionY;
      const perpendicularY = directionX;

      const isVerticalBranch =
        Math.abs(directionY) >= Math.abs(directionX);

      const childGap =
        isVerticalBranch ? 170 : 105;


      positions.set(child.id, {
        x:
          mainPosition.x +
          directionX * 100 +
          perpendicularX * offset * childGap,

        y:
          mainPosition.y +
          directionY * 100 +
          perpendicularY * offset * childGap
      });


      if (!state.expanded.has(child.id)) {
        return;
      }


      const leaves = getChildren(child);

      const leafGap =
        isVerticalBranch ? 70 : 65;

      leaves.forEach((leaf, leafIndex) => {

        const leafCenter =
          (leaves.length - 1) / 2;

        const leafOffset =
          leafIndex - leafCenter;

        positions.set(leaf.id, {
          x:
            positions.get(child.id).x +
            directionX * 75 +
            perpendicularX * leafOffset * leafGap,

          y:
            positions.get(child.id).y +
            directionY * 75 +
            perpendicularY * leafOffset * leafGap
        });

      });

    });

  });


  return positions;
}


function createCurve(start, end) {

  const dx = end.x - start.x;
  const dy = end.y - start.y;

  const distance =
    Math.sqrt(dx * dx + dy * dy);

  const curve =
    Math.min(distance * 0.45, 130);


  let controlX1 = start.x;
  let controlY1 = start.y;

  let controlX2 = end.x;
  let controlY2 = end.y;


  if (Math.abs(dx) > Math.abs(dy)) {

    controlX1 += dx > 0 ? curve : -curve;
    controlX2 -= dx > 0 ? curve : -curve;

  } else {

    controlY1 += dy > 0 ? curve : -curve;
    controlY2 -= dy > 0 ? curve : -curve;

  }


  return `
    M ${start.x} ${start.y}
    C
      ${controlX1} ${controlY1},
      ${controlX2} ${controlY2},
      ${end.x} ${end.y}
  `;
}


function addText(group, text, x, y, maxWidth) {

  const words = text.split(" ");

  const lines = [];

  let current = "";

  words.forEach((word) => {

    const test =
      current === ""
        ? word
        : `${current} ${word}`;

    if (test.length > maxWidth) {

      lines.push(current);

      current = word;

    } else {

      current = test;

    }

  });


  if (current) {
    lines.push(current);
  }


  const lineHeight = 16;

  const startY =
    y -
    ((lines.length - 1) * lineHeight) / 2;


  lines.forEach((line, index) => {

    const textElement =
      createSvgElement("text", {
        x,
        y: startY + index * lineHeight,
        "text-anchor": "middle"
      });

    textElement.textContent = line;

    group.appendChild(textElement);

  });

}


function createNode(node, position) {

  const group =
    createSvgElement("g", {
      class: `map-node ${node.type}`,
      "data-id": node.id,
      role: "button",
      tabindex: "0",
      "aria-label": node.title
    });

  const titleElement =
    createSvgElement("title");

  titleElement.textContent =
    node.title;

  group.appendChild(titleElement);


  const width =
    node.type === "root"
      ? 190
      : node.type === "main"
        ? 165
        : node.type === "child"
          ? 145
          : 135;


  const height =
    node.type === "root"
      ? 72
      : node.type === "main"
        ? 62
        : 56;


  const rect =
    createSvgElement("rect", {
      x: position.x - width / 2,
      y: position.y - height / 2,
      width,
      height,
      rx: node.type === "root" ? 36 : 14,
      ry: node.type === "root" ? 36 : 14,
      class: "map-node-shape"
    });


  group.appendChild(rect);


  addText(
    group,
    node.title,
    position.x,
    position.y,
    node.type === "root" ? 19 : 17
  );


  const hasChildren =
    node.children &&
    node.children.length > 0 &&
    node.type !== "root";

  const isOpen =
    hasChildren &&
    state.expanded.has(node.id);

  group.setAttribute(
    "aria-label",
    hasChildren
      ? `${node.title}. ${isOpen ? "Свернуть" : "Раскрыть"} ветку`
      : `${node.title}. Показать информацию`
  );


  group.addEventListener("mouseenter", () => {
    highlightBranch(node.id);
  });


  group.addEventListener("mouseleave", () => {
    clearHighlight();
  });


  group.addEventListener("click", () => {
    selectNode(node);
  });


  group.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    selectNode(node);
  });


  if (hasChildren) {
    const indicator =
      createSvgElement("circle", {
        cx: position.x + width / 2 - 14,
        cy: position.y - height / 2 + 14,
        r: 7,
        class: "map-toggle"
      });


    const indicatorText =
      createSvgElement("text", {
        x: position.x + width / 2 - 14,
        y: position.y - height / 2 + 18,
        "text-anchor": "middle",
        class: "map-toggle-text"
      });


    indicatorText.textContent =
      isOpen ? "−" : "+";


    group.appendChild(indicator);
    group.appendChild(indicatorText);

  }


  return group;
}


function render() {

  svg.innerHTML = "";

  const positions = calculatePositions();

  const visibleNodes =
    getVisibleNodes();


  const edgesGroup =
    createSvgElement("g");


  const nodesGroup =
    createSvgElement("g");


  visibleNodes.forEach((item, index) => {

    const node = item.node;

    if (node.id === "root") {
      return;
    }

    if (!positions.has(node.id)) {
      return;
    }

    if (!positions.has(item.parent.id)) {
      return;
    }


    const start =
      positions.get(item.parent.id);

    const end =
      positions.get(node.id);


    const path =
      createSvgElement("path", {
        d: createCurve(start, end),
        class: "map-edge",
        "data-parent": item.parent.id,
        "data-child": node.id
      });

    path.style.setProperty(
      "--edge-delay",
      `${Math.min(index, 16) * 28}ms`
    );


    edgesGroup.appendChild(path);

  });


  visibleNodes.forEach((item, index) => {

    const position =
      positions.get(item.node.id);

    if (!position) {
      return;
    }


    const node =
      createNode(item.node, position);


    if (
      state.activeNode &&
      state.activeNode.id === item.node.id
    ) {

      node.classList.add("selected");

    }

    node.style.setProperty(
      "--node-delay",
      `${Math.min(index, 16) * 38}ms`
    );


    nodesGroup.appendChild(node);

  });


  svg.appendChild(edgesGroup);
  svg.appendChild(nodesGroup);

}


function selectNode(node) {

  state.activeNode = node;


  if (
    node.children &&
    node.children.length > 0 &&
    node.type !== "leaf"
  ) {

    if (state.expanded.has(node.id)) {
      state.expanded.delete(node.id);
    } else {
      state.expanded.add(node.id);
    }

  }


  showInfo(node);

  render();

}


function showInfo(node) {

  const category =
    node.type === "root"
      ? "ОСНОВНАЯ ТЕМА"
      : node.type === "main"
        ? "НАПРАВЛЕНИЕ"
        : node.type === "child"
          ? "ПОДТЕМА"
          : "ФАКТОР";


  infoPanel.innerHTML = `
    <div class="info-category">
      ${category}
    </div>

    <h3 class="info-title">
      ${node.title}
    </h3>

    <p class="info-text">
      ${node.description}
    </p>

    <button class="info-close" type="button">
      Сбросить выбор
    </button>
  `;


  const closeButton =
    infoPanel.querySelector(".info-close");


  closeButton.addEventListener("click", () => {

    state.activeNode = null;

    infoPanel.innerHTML = `
      <div class="info-placeholder">
        <span class="info-symbol">+</span>

        <p>
          Выбери любой узел карты,
          чтобы увидеть дополнительную информацию.
        </p>
      </div>
    `;

    render();

  });

}


function highlightBranch(nodeId) {

  const relatedIds =
    new Set([nodeId]);


  const item =
    allNodes.find(
      (entry) => entry.node.id === nodeId
    );


  if (!item) {
    return;
  }


  if (item.parent) {
    relatedIds.add(item.parent.id);
  }


  if (item.node.children) {

    item.node.children.forEach((child) => {
      relatedIds.add(child.id);
    });

  }


  document
    .querySelectorAll(".map-node")
    .forEach((nodeElement) => {

      const id =
        nodeElement.dataset.id;

      if (!relatedIds.has(id)) {

        nodeElement.style.opacity = "0.35";

      }

    });


  document
    .querySelectorAll(".map-edge")
    .forEach((edge) => {

      if (
        edge.dataset.parent === nodeId ||
        edge.dataset.child === nodeId
      ) {

        edge.classList.add("active");

      }

    });

}


function clearHighlight() {

  document
    .querySelectorAll(".map-node")
    .forEach((node) => {

      node.style.opacity = "";

    });


  document
    .querySelectorAll(".map-edge")
    .forEach((edge) => {

      edge.classList.remove("active");

    });

}


if (!window.d3) {
  render();
}
