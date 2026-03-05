let dataA = [
  "Allow registering works or services tied to a contract, with details.",
  "Allow location info with road, segment, and coordinates.",
  "Allow linking a work/service to a project module.",
  "Allow automatic import of infrastructure assets.",
  "Block edits to imported assets except key fields.",
  "Allow reporting initial execution deadline.",
];

let dataB = [
  "Allow registering works/services linked to contracts with type and classification.",
  "Allow registering location via road and coordinates.",
  "Allow linking work/service to a project module or management module.",
  "Allow automatic import of infrastructure assets from the project.",
  "Block edits to imported assets, preserve integrity.",
  "Allow filtering classifications based on selected work type.",
  "Allow registering continuation between works.",
];

const docA = document.getElementById("docA");
const docB = document.getElementById("docB");
const inputA = document.getElementById("inputA");
const inputB = document.getElementById("inputB");
const filterA = document.getElementById("filterA");
const filterB = document.getElementById("filterB");
const linkCanvas = document.getElementById("linkCanvas");
const linksList = document.getElementById("linksList");
const status = document.getElementById("status");
const deleteLinkButton = document.getElementById("deleteLinkButton");
const modeSingleButton = document.getElementById("modeSingle");
const modeMultiButton = document.getElementById("modeMulti");
const linkSelectedButton = document.getElementById("linkSelected");
const syncScrollToggle = document.getElementById("syncScroll");
const links = [];
let activeLinkIndex = null;
let mode = "single";
let selectedA = null;
const selectedB = new Set();
let isSyncingScroll = false;

const parseText = (text) => {
  const trimmed = text.trim();
  if (!trimmed) return [];
  return trimmed
    .split(/\n/)
    .map((part) => part.trim())
    .filter(Boolean);
};

const setData = (side, list) => {
  if (side === "a") {
    dataA = list;
  } else {
    dataB = list;
  }
  renderAll();
};

const loadFromInput = (side) => {
  const input = side === "a" ? inputA : inputB;
  const list = parseText(input.value);
  setData(side, list);
};

const applyFilter = (items, query) => {
  const needle = query.trim().toLowerCase();
  return items
    .map((text, originalIndex) => ({ text, originalIndex }))
    .filter(({ text }) => !needle || text.toLowerCase().includes(needle));
};

const renderAll = () => {
  renderList(docA, applyFilter(dataA, filterA.value), "a");
  renderList(docB, applyFilter(dataB, filterB.value), "b");
  renderLinks();
};

const resetSelection = () => {
  selectedA = null;
  selectedB.clear();
};

const setMode = (nextMode) => {
  mode = nextMode;
  modeSingleButton.classList.toggle("active", mode === "single");
  modeMultiButton.classList.toggle("active", mode === "multi");
  linkSelectedButton.disabled = mode !== "multi";
  resetSelection();
  renderAll();
};

const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

const renderList = (container, items, prefix) => {
  container.innerHTML = "";
  items.forEach(({ text, originalIndex }) => {
    const item = document.createElement("div");
    item.className = "item drop-target";
    item.dataset.id = `${prefix}-${originalIndex}`;
    item.innerHTML = `<strong>${prefix.toUpperCase()} ${originalIndex + 1}</strong><div class="text">${text}</div>`;
    item.draggable = true;
    item.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", item.dataset.id);
      item.classList.add("dragging");
    });
    item.addEventListener("dragend", () => item.classList.remove("dragging"));
    item.addEventListener("dragover", (event) => {
      event.preventDefault();
      item.classList.add("active");
    });
    item.addEventListener("dragleave", () => item.classList.remove("active"));
    item.addEventListener("drop", (event) => {
      event.preventDefault();
      item.classList.remove("active");
      const sourceId = event.dataTransfer.getData("text/plain");
      if (!sourceId) return;
      addLink(sourceId, item.dataset.id);
    });
    item.addEventListener("click", () => {
      handleSelection(item.dataset.id, item);
    });
    if (isSelected(item.dataset.id)) {
      item.classList.add("selected");
    }
    container.appendChild(item);
  });
};

const addLink = (fromId, toId) => {
  if (fromId.split("-")[0] === toId.split("-")[0]) return;
  if (links.some((link) => link.from === fromId && link.to === toId)) return;
  links.push({ from: fromId, to: toId });
  renderLinks();
};

const isSelected = (id) => {
  if (!id) return false;
  const side = id.split("-")[0];
  if (side === "a") return selectedA === id;
  return selectedB.has(id);
};

const handleSelection = (id, element) => {
  const side = id.split("-")[0];
  if (mode === "single") {
    if (side === "a") {
      selectedA = selectedA === id ? null : id;
      renderAll();
    } else {
      if (!selectedA) return;
      addLink(selectedA, id);
    }
    return;
  }
  if (side === "a") {
    selectedA = selectedA === id ? null : id;
  } else {
    if (selectedB.has(id)) {
      selectedB.delete(id);
    } else {
      selectedB.add(id);
    }
  }
  element.classList.toggle("selected", isSelected(id));
};

const linkSelected = () => {
  if (!selectedA || selectedB.size === 0) return;
  selectedB.forEach((id) => addLink(selectedA, id));
  resetSelection();
  renderAll();
};

const shouldRenderLink = (link) => {
  const fromSide = link.from.split("-")[0];
  const toSide = link.to.split("-")[0];
  const fromIndex = Number(link.from.split("-")[1]);
  const toIndex = Number(link.to.split("-")[1]);
  const fromText = fromSide === "a" ? dataA[fromIndex] : dataB[fromIndex];
  const toText = toSide === "a" ? dataA[toIndex] : dataB[toIndex];
  if (!fromText || !toText) return false;
  const filterTextA = filterA.value.trim().toLowerCase();
  const filterTextB = filterB.value.trim().toLowerCase();
  const fromMatchesA = !filterTextA || (fromSide === "a" && fromText.toLowerCase().includes(filterTextA));
  const toMatchesA = !filterTextA || (toSide === "a" && toText.toLowerCase().includes(filterTextA));
  const fromMatchesB = !filterTextB || (fromSide === "b" && fromText.toLowerCase().includes(filterTextB));
  const toMatchesB = !filterTextB || (toSide === "b" && toText.toLowerCase().includes(filterTextB));
  return (fromMatchesA || toMatchesA) && (fromMatchesB || toMatchesB);
};

const getEndpoint = (side, rect, listRect, canvasRect) => {
  let y = rect.top + rect.height / 2;
  let clamped = false;
  if (y < listRect.top) {
    y = listRect.top + 6;
    clamped = true;
  } else if (y > listRect.bottom) {
    y = listRect.bottom - 6;
    clamped = true;
  }
  const x = (side === "a" ? rect.right : rect.left) - canvasRect.left;
  return { x, y: y - canvasRect.top, clamped };
};

const removeLink = (index) => {
  links.splice(index, 1);
  activeLinkIndex = null;
  deleteLinkButton.classList.remove("visible");
  renderLinks();
};

const renderLinks = () => {
  linksList.innerHTML = "";
  linkCanvas.innerHTML = "";
  links.forEach((link, index) => {
    if (!shouldRenderLink(link)) return;
    const fromEl = document.querySelector(`[data-id="${link.from}"]`);
    const toEl = document.querySelector(`[data-id="${link.to}"]`);
    if (!fromEl || !toEl) return;
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    const canvasRect = linkCanvas.getBoundingClientRect();
    const listRectA = docA.getBoundingClientRect();
    const listRectB = docB.getBoundingClientRect();
    const fromSide = link.from.split("-")[0];
    const toSide = link.to.split("-")[0];
    const fromPoint = getEndpoint(fromSide, fromRect, fromSide === "a" ? listRectA : listRectB, canvasRect);
    const toPoint = getEndpoint(toSide, toRect, toSide === "a" ? listRectA : listRectB, canvasRect);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const dx = (toPoint.x - fromPoint.x) / 2;
    path.setAttribute(
      "d",
      `M ${fromPoint.x} ${fromPoint.y} C ${fromPoint.x + dx} ${fromPoint.y}, ${toPoint.x - dx} ${toPoint.y}, ${toPoint.x} ${toPoint.y}`
    );
    const gradientId = `link-gradient-${index}`;
    if (fromPoint.clamped || toPoint.clamped) {
      const defs = linkCanvas.querySelector("defs") || document.createElementNS("http://www.w3.org/2000/svg", "defs");
      if (!defs.parentNode) linkCanvas.appendChild(defs);
      const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
      gradient.setAttribute("id", gradientId);
      gradient.setAttribute("gradientUnits", "userSpaceOnUse");
      gradient.setAttribute("x1", fromPoint.x);
      gradient.setAttribute("y1", fromPoint.y);
      gradient.setAttribute("x2", toPoint.x);
      gradient.setAttribute("y2", toPoint.y);
      const stopStart = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      stopStart.setAttribute("offset", "0%");
      stopStart.setAttribute("stop-color", "#2563eb");
      stopStart.setAttribute("stop-opacity", fromPoint.clamped ? "0.15" : "1");
      const stopEnd = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      stopEnd.setAttribute("offset", "100%");
      stopEnd.setAttribute("stop-color", "#2563eb");
      stopEnd.setAttribute("stop-opacity", toPoint.clamped ? "0.15" : "1");
      gradient.appendChild(stopStart);
      gradient.appendChild(stopEnd);
      defs.appendChild(gradient);
      path.setAttribute("stroke", `url(#${gradientId})`);
    } else {
      path.setAttribute("stroke", "#2563eb");
    }
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    path.classList.add("link-path");
    path.addEventListener("mouseenter", () => {
      activeLinkIndex = index;
      deleteLinkButton.classList.add("visible");
      deleteLinkButton.style.left = `${(fromPoint.x + toPoint.x) / 2}px`;
      deleteLinkButton.style.top = `${(fromPoint.y + toPoint.y) / 2}px`;
    });
    path.addEventListener("mouseleave", (event) => {
      if (event.relatedTarget === deleteLinkButton) return;
      activeLinkIndex = null;
      deleteLinkButton.classList.remove("visible");
    });
    linkCanvas.appendChild(path);

    const li = document.createElement("li");
    li.className = "link-row";

    const label = document.createElement("span");
    label.className = "link-label";
    label.textContent = `${link.from.toUpperCase()} → ${link.to.toUpperCase()}`;

    const button = document.createElement("button");
    button.className = "link-delete";
    button.type = "button";
    button.textContent = "Delete";
    button.addEventListener("click", () => removeLink(index));

    li.appendChild(label);
    li.appendChild(button);
    linksList.appendChild(li);
  });
  status.textContent = `${links.length} links`;
  deleteLinkButton.classList.remove("visible");
  activeLinkIndex = null;
};

document.getElementById("resetLinks").addEventListener("click", () => {
  links.length = 0;
  activeLinkIndex = null;
  deleteLinkButton.classList.remove("visible");
  renderLinks();
});

filterA.addEventListener("input", renderAll);
filterB.addEventListener("input", renderAll);
modeSingleButton.addEventListener("click", () => setMode("single"));
modeMultiButton.addEventListener("click", () => setMode("multi"));
linkSelectedButton.addEventListener("click", linkSelected);

docA.addEventListener("scroll", () => {
  if (syncScrollToggle.checked && !isSyncingScroll) {
    isSyncingScroll = true;
    docB.scrollTop = docA.scrollTop;
    isSyncingScroll = false;
  }
  renderLinks();
});

docB.addEventListener("scroll", () => {
  if (syncScrollToggle.checked && !isSyncingScroll) {
    isSyncingScroll = true;
    docA.scrollTop = docB.scrollTop;
    isSyncingScroll = false;
  }
  renderLinks();
});

const hideDeleteButton = () => {
  if (activeLinkIndex === null) {
    deleteLinkButton.classList.remove("visible");
  }
};

deleteLinkButton.addEventListener("click", () => {
  if (activeLinkIndex === null) return;
  removeLink(activeLinkIndex);
});

deleteLinkButton.addEventListener("mouseleave", () => {
  activeLinkIndex = null;
  hideDeleteButton();
});

document.getElementById("exportLinks").addEventListener("click", async () => {
  const payload = links.map((link) => {
    const fromSide = link.from.split("-")[0];
    const toSide = link.to.split("-")[0];
    const fromIndex = Number(link.from.split("-")[1]);
    const toIndex = Number(link.to.split("-")[1]);
    const fromText = fromSide === "a" ? dataA[fromIndex] : dataB[fromIndex];
    const toText = toSide === "a" ? dataA[toIndex] : dataB[toIndex];
    return {
      from: link.from,
      to: link.to,
      fromText,
      toText,
    };
  });
  await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
  status.textContent = "Copied JSON to clipboard";
  setTimeout(() => {
    status.textContent = `${links.length} links`;
  }, 2000);
});

document.getElementById("loadA").addEventListener("click", () => loadFromInput("a"));
document.getElementById("loadB").addEventListener("click", () => loadFromInput("b"));

document.getElementById("pasteA").addEventListener("click", async () => {
  const text = await navigator.clipboard.readText();
  inputA.value = text;
  loadFromInput("a");
});

document.getElementById("pasteB").addEventListener("click", async () => {
  const text = await navigator.clipboard.readText();
  inputB.value = text;
  loadFromInput("b");
});

document.getElementById("fileA").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const text = await readFile(file);
  inputA.value = text;
  loadFromInput("a");
});

document.getElementById("fileB").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const text = await readFile(file);
  inputB.value = text;
  loadFromInput("b");
});

window.addEventListener("resize", renderLinks);

setMode("single");
renderAll();
