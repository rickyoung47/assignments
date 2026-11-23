const AREA_NAMES = ["성수1가제1동", "성수1가제2동", "성수2가제1동", "성수2가제3동"];
const AREA_LABELS = {
  성수1가1동: "성수1가제1동",
  성수1가2동: "성수1가제2동",
  성수2가1동: "성수2가제1동",
  성수2가3동: "성수2가제3동",
};
const AREA_COLORS = ["#d6e8df", "#e7eee6", "#dce6ef", "#f2e4d7"];
const METRICS = {
  total: { field: "THSMON_SELNG_AMT", label: "전체 매출" },
  weekday: { field: "MDWK_SELNG_AMT", label: "주중 매출" },
  weekend: { field: "WKEND_SELNG_AMT", label: "주말 매출" },
};
const SVG_NS = "http://www.w3.org/2000/svg";

let salesRows = [];
let populationRows = [];
let populationDateLabel = "";
let selectedArea = AREA_NAMES[0];
let selectedMetric = "total";
let selectedIndustry = "";
let mapFeatures = [];

const mapSvg = document.querySelector("#neighborhood-map");
const areaList = document.querySelector("#area-list");
const industrySelect = document.querySelector("#industry-select");
const chartSvg = document.querySelector("#sales-chart");

function svgElement(tag, attributes = {}, text = "") {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  if (text) element.textContent = text;
  return element;
}

function formatWon(value) {
  const amount = Number(value) || 0;
  if (amount >= 100_000_000) return `${shortNumber(amount / 100_000_000)}억`;
  if (amount >= 10_000) return `${shortNumber(amount / 10_000)}만`;
  return `${Math.round(amount).toLocaleString("ko-KR")}원`;
}

function shortNumber(value) {
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(value);
}

function fullWon(value) {
  return `${Math.round(Number(value) || 0).toLocaleString("ko-KR")}원`;
}

function formatPeople(value) {
  return `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(Number(value) || 0)}명`;
}

function getFeatureName(feature) {
  const name = feature.properties?.ADM_NM || feature.properties?.ADSTRD_CD_NM || "";
  return AREA_LABELS[name] || name;
}

function collectCoordinates(value, output = []) {
  if (!Array.isArray(value)) return output;
  if (typeof value[0] === "number" && typeof value[1] === "number") {
    output.push(value);
    return output;
  }
  value.forEach((item) => collectCoordinates(item, output));
  return output;
}

function getPolygons(feature) {
  if (feature.geometry.type === "Polygon") return [feature.geometry.coordinates];
  if (feature.geometry.type === "MultiPolygon") return feature.geometry.coordinates;
  return [];
}

function renderMap(geojson) {
  mapFeatures = geojson.features.filter((feature) => AREA_NAMES.includes(getFeatureName(feature)));
  const positions = mapFeatures.flatMap((feature) => collectCoordinates(feature.geometry.coordinates));
  if (!positions.length) throw new Error("성수 행정동 경계를 찾을 수 없습니다.");

  const width = 860;
  const height = 350;
  const padding = 32;
  const minLon = Math.min(...positions.map(([lon]) => lon));
  const maxLon = Math.max(...positions.map(([lon]) => lon));
  const minLat = Math.min(...positions.map(([, lat]) => lat));
  const maxLat = Math.max(...positions.map(([, lat]) => lat));
  const scale = Math.min((width - padding * 2) / (maxLon - minLon), (height - padding * 2) / (maxLat - minLat));
  const offsetX = (width - (maxLon - minLon) * scale) / 2;
  const offsetY = (height - (maxLat - minLat) * scale) / 2;
  const project = ([lon, lat]) => [offsetX + (lon - minLon) * scale, height - offsetY - (lat - minLat) * scale];
  mapSvg.replaceChildren();

  mapFeatures.forEach((feature, index) => {
    const area = getFeatureName(feature);
    const polygons = getPolygons(feature);
    const pathData = polygons.flatMap((polygon) => polygon.map((ring) => {
      const points = ring.map(project);
      return `M ${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ")} Z`;
    })).join(" ");
    const path = svgElement("path", {
      d: pathData,
      class: "map-area",
      "data-area": area,
      fill: AREA_COLORS[index % AREA_COLORS.length],
      stroke: "#ffffff",
      "stroke-width": "3",
      "stroke-linejoin": "round",
      "fill-rule": "evenodd",
      tabindex: "0",
      role: "button",
      "aria-label": `${area} 선택`,
    });
    path.addEventListener("click", () => selectArea(area));
    path.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectArea(area);
      }
    });
    mapSvg.append(path);

    const outerRing = polygons[0]?.[0] || [];
    const centroid = outerRing.reduce((total, point) => {
      const [x, y] = project(point);
      return [total[0] + x / outerRing.length, total[1] + y / outerRing.length];
    }, [0, 0]);
    const label = svgElement("text", {
      x: centroid[0],
      y: centroid[1],
      class: `map-label${area.length > 7 ? " is-small" : ""}`,
      "text-anchor": "middle",
      "dominant-baseline": "middle",
    }, area.replace("제", ""));
    mapSvg.append(label);
  });

  mapSvg.hidden = false;
  document.querySelector("#map-loading").hidden = true;
  renderAreaButtons();
  syncAreaSelection();
}

function renderAreaButtons() {
  areaList.replaceChildren();
  AREA_NAMES.forEach((area, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "area-button";
    button.dataset.area = area;
    const swatch = document.createElement("span");
    swatch.className = "area-swatch";
    swatch.style.backgroundColor = AREA_COLORS[index % AREA_COLORS.length];
    const label = document.createElement("span");
    label.textContent = area;
    button.append(swatch, label);
    button.addEventListener("click", () => selectArea(area));
    areaList.append(button);
  });
}

function selectArea(area) {
  selectedArea = area;
  syncAreaSelection();
  renderTopIndustries();
  renderChart();
}

function syncAreaSelection() {
  mapSvg.querySelectorAll(".map-area").forEach((path) => {
    const active = path.dataset.area === selectedArea;
    const featureIndex = mapFeatures.findIndex((feature) => getFeatureName(feature) === path.dataset.area);
    path.style.stroke = active ? "#176452" : "#ffffff";
    path.style.strokeWidth = active ? "4" : "3";
    path.style.fill = active ? "#f1c9ad" : AREA_COLORS[Math.max(featureIndex, 0) % AREA_COLORS.length];
    path.setAttribute("aria-pressed", String(active));
  });
  areaList.querySelectorAll(".area-button").forEach((button) => {
    const active = button.dataset.area === selectedArea;
    button.classList.toggle("is-selected", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function getAreaTotal(area, field) {
  return salesRows
    .filter((row) => row.AREA_LABEL === area && row.SVC_INDUTY_CD_NM === selectedIndustry)
    .reduce((sum, row) => sum + (Number(row[field]) || 0), 0);
}

function renderTopIndustries() {
  if (!salesRows.length) return;
  const field = "THSMON_SELNG_AMT";
  const areaRows = salesRows
    .filter((row) => row.AREA_LABEL === selectedArea)
    .map((row) => ({
      industry: row.SVC_INDUTY_CD_NM,
      amount: Number(row[field]) || 0,
    }))
    .sort((a, b) => b.amount - a.amount);
  const topRows = areaRows.slice(0, 5);
  const topTotal = topRows.reduce((sum, row) => sum + row.amount, 0);
  document.querySelector("#top-area-name").textContent = selectedArea;
  document.querySelector("#top5-total").textContent = `상위 5개 합계 ${formatWon(topTotal)}`;

  const list = document.querySelector("#top-industry-list");
  list.replaceChildren();
  if (!topRows.length) {
    const empty = document.createElement("p");
    empty.className = "top-empty";
    empty.textContent = "선택한 행정동의 매출 자료가 없습니다.";
    list.append(empty);
    return;
  }

  const maxAmount = topRows[0].amount || 1;
  topRows.forEach((row, index) => {
    const item = document.createElement("div");
    item.className = "top-industry-row";
    const rank = document.createElement("span");
    rank.className = "top-rank";
    rank.textContent = String(index + 1).padStart(2, "0");
    const content = document.createElement("div");
    content.className = "top-industry-content";
    const labels = document.createElement("div");
    labels.className = "top-industry-labels";
    const name = document.createElement("strong");
    name.className = "top-industry-name";
    name.textContent = row.industry;
    const amount = document.createElement("span");
    amount.className = "top-industry-value";
    amount.textContent = fullWon(row.amount);
    labels.append(name, amount);
    const track = document.createElement("div");
    track.className = "top-bar-track";
    const bar = document.createElement("div");
    bar.className = "top-bar-fill";
    bar.style.width = `${Math.max(2, (row.amount / maxAmount) * 100)}%`;
    track.append(bar);
    content.append(labels, track);
    item.append(rank, content);
    list.append(item);
  });
}

function renderPopulation(data) {
  populationRows = data.rows || [];
  populationDateLabel = data.dateLabel || data.date || "";
  document.querySelector("#population-date").textContent = populationDateLabel;

  const hours = [...new Set(populationRows.map((row) => row.time))].sort();
  const values = hours.map((time) => ({
    time,
    total: populationRows
      .filter((row) => row.time === time)
      .reduce((sum, row) => sum + (Number(row.spop) || 0), 0),
  }));
  if (!values.length) throw new Error("생활인구 자료가 비어 있습니다.");

  const peak = values.reduce((best, point) => point.total > best.total ? point : best, values[0]);
  document.querySelector("#population-stat-label").textContent = `네 동 합계 · ${peak.time}시 최고`;
  document.querySelector("#population-stat-value").textContent = formatPeople(peak.total);
  const svg = document.querySelector("#population-chart");
  const width = 560;
  const height = 285;
  const left = 47;
  const right = 543;
  const top = 18;
  const bottom = 228;
  const plotWidth = right - left;
  const plotHeight = bottom - top;
  const maxValue = Math.ceil(Math.max(...values.map((point) => point.total)) / 10000) * 10000;
  const x = (index) => left + (index / Math.max(values.length - 1, 1)) * plotWidth;
  const y = (value) => bottom - (value / maxValue) * plotHeight;
  svg.replaceChildren();

  const defs = svgElement("defs");
  const gradient = svgElement("linearGradient", { id: "population-fill", x1: "0", x2: "0", y1: "0", y2: "1" });
  gradient.append(svgElement("stop", { offset: "0%", "stop-color": "#78ad96", "stop-opacity": ".28" }));
  gradient.append(svgElement("stop", { offset: "100%", "stop-color": "#78ad96", "stop-opacity": ".015" }));
  defs.append(gradient);
  svg.append(defs);

  for (let tick = 0; tick <= 4; tick += 1) {
    const value = (maxValue * tick) / 4;
    const yy = y(value);
    svg.append(svgElement("line", { x1: left, y1: yy, x2: right, y2: yy, class: "population-axis" }));
    svg.append(svgElement("text", { x: left - 7, y: yy + 4, class: "population-axis-label", "text-anchor": "end" }, shortNumber(value / 10000)));
  }

  const pathLine = values.map((point, index) => `${index ? "L" : "M"} ${x(index).toFixed(1)} ${y(point.total).toFixed(1)}`).join(" ");
  const areaPath = `${pathLine} L ${x(values.length - 1).toFixed(1)} ${bottom} L ${x(0).toFixed(1)} ${bottom} Z`;
  svg.append(svgElement("path", { d: areaPath, fill: "url(#population-fill)" }));
  svg.append(svgElement("path", { d: pathLine, fill: "none", stroke: "#28765d", "stroke-width": "3", "stroke-linecap": "round", "stroke-linejoin": "round" }));

  const labelHours = new Set(["00", "06", "12", "18", "23"]);
  values.forEach((point, index) => {
    if (!labelHours.has(point.time)) return;
    svg.append(svgElement("circle", { cx: x(index), cy: y(point.total), r: "4", fill: "#e87555", stroke: "#ffffff", "stroke-width": "2" }));
    svg.append(svgElement("text", { x: x(index), y: bottom + 22, class: "population-axis-label", "text-anchor": "middle" }, `${point.time}시`));
  });
  svg.append(svgElement("text", { x: left, y: 12, class: "population-axis-label" }, "만 명"));
  document.querySelector("#population-note").textContent = `${populationDateLabel} · 내국인 생활인구 합계 · 시간별 추정 인원`;
}

function renderChart() {
  if (!chartSvg || !salesRows.length || !selectedIndustry) return;
  const metric = METRICS[selectedMetric];
  const values = AREA_NAMES.map((area) => ({ area, value: getAreaTotal(area, metric.field) }));
  const total = values.reduce((sum, item) => sum + item.value, 0);
  const chosenName = selectedIndustry;
  document.querySelector("#summary-label").textContent = `${chosenName} · 네 동 ${metric.label}`;
  document.querySelector("#summary-value").textContent = fullWon(total);
  document.querySelector("#summary-caption").textContent = selectedArea
    ? `${selectedArea} ${metric.label}: ${fullWon(values.find((item) => item.area === selectedArea)?.value || 0)}`
    : "성수 네 행정동의 매출을 비교합니다.";

  const width = 860;
  const height = 350;
  const left = 162;
  const right = 760;
  const top = 22;
  const bottom = 294;
  const max = Math.max(...values.map((item) => item.value), 1);
  const chartWidth = right - left;
  const plot = svgElement("g");
  chartSvg.replaceChildren();
  chartSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  for (let tick = 0; tick <= 4; tick += 1) {
    const x = left + (chartWidth * tick) / 4;
    plot.append(svgElement("line", { x1: x, y1: top, x2: x, y2: bottom, class: "axis-line" }));
    plot.append(svgElement("text", {
      x,
      y: bottom + 25,
      class: "axis-label",
      "text-anchor": tick === 0 ? "start" : tick === 4 ? "end" : "middle",
    }, formatWon((max * tick) / 4)));
  }

  values.forEach(({ area, value }, index) => {
    const y = top + 18 + index * 60;
    const barWidth = (value / max) * chartWidth;
    const isSelected = area === selectedArea;
    plot.append(svgElement("text", {
      x: left - 14,
      y: y + 19,
      class: `bar-label${isSelected ? " is-selected" : ""}`,
      "text-anchor": "end",
      "dominant-baseline": "middle",
    }, area));
    plot.append(svgElement("rect", { x: left, y, width: chartWidth, height: 30, rx: 7, class: "bar-track" }));
    const bar = svgElement("rect", {
      x: left,
      y,
      width: Math.max(barWidth, value > 0 ? 2 : 0),
      height: 30,
      rx: 7,
      class: `bar-fill${isSelected ? " is-selected" : ""}`,
      tabindex: "0",
      role: "button",
      "aria-label": `${area} ${metric.label} ${fullWon(value)}`,
    });
    bar.addEventListener("click", () => selectArea(area));
    bar.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectArea(area);
      }
    });
    plot.append(bar);
    const valueX = Math.min(left + barWidth + 10, right + 11);
    plot.append(svgElement("text", {
      x: valueX,
      y: y + 19,
      class: "bar-value",
      "dominant-baseline": "middle",
    }, formatWon(value)));
  });

  chartSvg.append(plot);
}

function setupControls(data) {
  salesRows = data.rows;
  const industries = [...new Set(salesRows.map((row) => row.SVC_INDUTY_CD_NM).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "ko"));
  industries.forEach((industry) => {
    const option = document.createElement("option");
    option.value = industry;
    option.textContent = industry;
    industrySelect.append(option);
  });
  selectedIndustry = industries.includes("한식음식점") ? "한식음식점" : industries[0] || "";
  industrySelect.value = selectedIndustry;
  industrySelect.addEventListener("change", () => {
    selectedIndustry = industrySelect.value;
    renderChart();
  });
  document.querySelectorAll(".metric-tab").forEach((button) => {
    button.addEventListener("click", () => {
      selectedMetric = button.dataset.metric;
      document.querySelectorAll(".metric-tab").forEach((tab) => {
        const active = tab === button;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
      });
      renderChart();
    });
  });
}

async function initialize() {
  try {
    const [salesResponse, mapResponse, populationResponse] = await Promise.all([
      fetch("data/profit-2026-q1.json"),
      fetch("data/seongsu-dongs.geojson"),
      fetch("data/living-pop-2026-11-18.json"),
    ]);
    if (!salesResponse.ok || !mapResponse.ok || !populationResponse.ok) throw new Error("데이터 파일을 불러오지 못했습니다.");
    const [sales, geojson, population] = await Promise.all([
      salesResponse.json(),
      mapResponse.json(),
      populationResponse.json(),
    ]);
    setupControls(sales);
    renderMap(geojson);
    renderPopulation(population);
    renderTopIndustries();
    renderChart();
  } catch (error) {
    document.querySelector("#map-loading").textContent = "자료를 불러오지 못했습니다. 페이지를 새로고침해 주세요.";
    document.querySelector("#summary-caption").textContent = "데이터 파일을 불러오지 못했습니다.";
    console.error("성수 매출 화면 초기화 실패", error);
  }
}

initialize();
