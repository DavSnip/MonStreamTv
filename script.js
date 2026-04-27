const state = {
  config: null,
  sites: [],
  lastResults: []
};

const $ = (id) => document.getElementById(id);

const el = {
  pageTitle: $('pageTitle'),
  pageSubtitle: $('pageSubtitle'),
  configStatus: $('configStatus'),
  siteGrid: $('siteGrid'),
  siteTemplate: $('siteCardTemplate'),
  resultTemplate: $('resultItemTemplate'),
  selectionInfo: $('selectionInfo'),
  searchForm: $('searchForm'),
  searchInput: $('searchInput'),
  clearButton: $('clearButton'),
  selectAllBtn: $('selectAllBtn'),
  unselectAllBtn: $('unselectAllBtn'),
  themeToggle: $('themeToggle'),
  resultsPanel: $('resultsPanel'),
  resultsInfo: $('resultsInfo'),
  resultsList: $('resultsList'),
  openAllBtn: $('openAllBtn'),
  submitBtn: $('submitBtn')
};

function encodeQuery(query) {
  return encodeURIComponent(query.trim());
}

function normalizeIconPath(icon) {
  if (!icon) return "logo.png";

  if (
    icon.startsWith("http") ||
    icon.startsWith("icons/") ||
    icon.startsWith("./icons/")
  ) {
    return icon;
  }

  return `icons/${icon}`;
}

function buildSearchUrl(site, query) {
  return site.searchUrl.replace("{query}", encodeQuery(query));
}

function setStatus(text, error = false) {
  if (el.configStatus) {
    el.configStatus.textContent = text;
  }

  const dot = document.querySelector(".status-dot");
  if (dot) {
    dot.classList.toggle("error", error);
  }
}

async function loadConfig() {
  try {
    const response = await fetch(`config.json?v=${Date.now()}`);

    if (!response.ok) {
      throw new Error("config.json introuvable");
    }

    const config = await response.json();

    state.config = config;

    state.sites = (config.sites || []).map(site => ({
      ...site,
      icon: normalizeIconPath(site.icon),
      selected: !!site.selectedByDefault
    }));

    if (el.pageTitle) {
      el.pageTitle.textContent = config.appName || "Rechercher";
    }

    if (el.pageSubtitle) {
      el.pageSubtitle.textContent = config.subtitle || "";
    }

    setStatus("Config OK");
    renderSites();

  } catch (error) {
    console.error(error);
    setStatus("Erreur config", true);

    if (el.siteGrid) {
      el.siteGrid.innerHTML = `
        <p class="helper-text">
          Impossible de charger config.json. Vérifie que le fichier est bien à côté de index.html.
        </p>
      `;
    }
  }
}

function renderSites() {
  if (!el.siteGrid || !el.siteTemplate) return;

  el.siteGrid.innerHTML = "";

  state.sites.forEach(site => {
    const node = el.siteTemplate.content.cloneNode(true);

    const checkbox = node.querySelector(".site-checkbox");
    const logo = node.querySelector(".site-logo");
    const name = node.querySelector(".site-name");
    const description = node.querySelector(".site-description");
    const link = node.querySelector(".site-link");

    checkbox.checked = site.selected;

    logo.src = site.icon;
    logo.alt = site.name;
    logo.loading = "lazy";

    logo.onerror = () => {
      logo.src = "logo.png";
    };

    name.textContent = site.name || "Site";
    description.textContent = site.description || "";

    link.href = site.homeUrl || "#";
    link.addEventListener("click", event => {
      event.stopPropagation();
    });

    checkbox.addEventListener("change", () => {
      site.selected = checkbox.checked;
      updateSelectionInfo();
    });

    el.siteGrid.appendChild(node);
  });

  updateSelectionInfo();
}

function updateSelectionInfo() {
  if (!el.selectionInfo) return;

  const count = state.sites.filter(site => site.selected).length;
  el.selectionInfo.textContent = `${count} sélectionné${count > 1 ? "s" : ""}`;
}

function renderResults(results, query) {
  if (!el.resultsPanel || !el.resultsList) return;

  el.resultsPanel.classList.remove("hidden");
  el.resultsList.innerHTML = "";

  state.lastResults = results;

  if (!results.length) {
    el.resultsInfo.textContent = `Aucun site sélectionné pour « ${query} ».`;
    el.resultsList.innerHTML = `
      <p class="helper-text">
        Sélectionne au moins un site avant de rechercher.
      </p>
    `;
    return;
  }

  el.resultsInfo.textContent =
    `${results.length} recherche${results.length > 1 ? "s" : ""} prête${results.length > 1 ? "s" : ""} pour « ${query} ».`;

  results.forEach(site => {
    const node = el.resultTemplate.content.cloneNode(true);

    const logo = node.querySelector(".result-logo");
    const name = node.querySelector(".result-name");
    const url = node.querySelector(".result-url");
    const action = node.querySelector(".result-action");

    const searchUrl = buildSearchUrl(site, query);

    logo.src = site.icon;
    logo.alt = site.name;
    logo.loading = "lazy";

    logo.onerror = () => {
      logo.src = "logo.png";
    };

    name.textContent = site.name || "Site";
    url.textContent = searchUrl;

    action.href = searchUrl;
    action.target = "_blank";
    action.rel = "noopener noreferrer";
    action.textContent = "Voir les résultats";

    el.resultsList.appendChild(node);
  });
}

function searchSelectedSites(query) {
  const cleanQuery = query.trim();

  if (!cleanQuery) {
    alert("Tape une recherche avant de lancer.");
    return;
  }

  const selectedSites = state.sites.filter(site => site.selected);

  if (!selectedSites.length) {
    alert("Sélectionne au moins un site.");
    return;
  }

  renderResults(selectedSites, cleanQuery);
}

if (el.searchForm) {
  el.searchForm.addEventListener("submit", event => {
    event.preventDefault();
    searchSelectedSites(el.searchInput.value);
  });
}

if (el.clearButton) {
  el.clearButton.addEventListener("click", () => {
    el.searchInput.value = "";
    el.resultsPanel.classList.add("hidden");
    el.resultsList.innerHTML = "";
    el.resultsInfo.textContent = "";
    state.lastResults = [];
    el.searchInput.focus();
  });
}

if (el.selectAllBtn) {
  el.selectAllBtn.addEventListener("click", () => {
    state.sites.forEach(site => {
      site.selected = true;
    });

    renderSites();
  });
}

if (el.unselectAllBtn) {
  el.unselectAllBtn.addEventListener("click", () => {
    state.sites.forEach(site => {
      site.selected = false;
    });

    renderSites();
  });
}

if (el.openAllBtn) {
  el.openAllBtn.addEventListener("click", () => {
    const query = el.searchInput.value.trim();

    if (!query) {
      alert("Tape une recherche avant d’ouvrir les résultats.");
      return;
    }

    if (!state.lastResults.length) {
      alert("Lance d’abord une recherche.");
      return;
    }

    state.lastResults.forEach(site => {
      const searchUrl = buildSearchUrl(site, query);
      window.open(searchUrl, "_blank", "noopener,noreferrer");
    });
  });
}

if (el.themeToggle) {
  el.themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
    el.themeToggle.textContent = document.body.classList.contains("light") ? "☾" : "☼";
  });
}

loadConfig();