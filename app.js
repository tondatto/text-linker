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
const links = [];
let activeLinkIndex = null;

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
  if (!needle) return items;
  return items.filter((text) => text.toLowerCase().includes(needle));
};

const renderAll = () => {
  renderList(docA, applyFilter(dataA, filterA.value), "a");
  renderList(docB, applyFilter(dataB, filterB.value), "b");
  renderLinks();
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
  items.forEach((text, index) => {
    const item = document.createElement("div");
    item.className = "item drop-target";
    item.dataset.id = `${prefix}-${index}`;
    item.innerHTML = `<strong>${prefix.toUpperCase()} ${index + 1}</strong><div class="text">${text}</div>`;
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
    container.appendChild(item);
  });
};

const addLink = (fromId, toId) => {
  if (fromId.split("-")[0] === toId.split("-")[0]) return;
  if (links.some((link) => link.from === fromId && link.to === toId)) return;
  links.push({ from: fromId, to: toId });
  renderLinks();
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
    const fromSide = link.from.split("-")[0];
    const toSide = link.to.split("-")[0];
    const x1 = (fromSide === "a" ? fromRect.right : fromRect.left) - canvasRect.left;
    const y1 = fromRect.top + fromRect.height / 2 - canvasRect.top;
    const x2 = (toSide === "a" ? toRect.right : toRect.left) - canvasRect.left;
    const y2 = toRect.top + toRect.height / 2 - canvasRect.top;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const dx = (x2 - x1) / 2;
    path.setAttribute("d", `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`);
    path.setAttribute("stroke", "#2563eb");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    path.classList.add("link-path");
    path.addEventListener("mouseenter", () => {
      activeLinkIndex = index;
      deleteLinkButton.classList.add("visible");
      deleteLinkButton.style.left = `${(x1 + x2) / 2}px`;
      deleteLinkButton.style.top = `${(y1 + y2) / 2}px`;
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
};

document.getElementById("resetLinks").addEventListener("click", () => {
  links.length = 0;
  activeLinkIndex = null;
  deleteLinkButton.classList.remove("visible");
  renderLinks();
});

filterA.addEventListener("input", renderAll);
filterB.addEventListener("input", renderAll);

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

renderAll();
