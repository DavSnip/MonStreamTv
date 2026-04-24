const state = { config: null, sites: [], lastResults: [], loading: false };
const $ = (id) => document.getElementById(id);

const el = {
  pageTitle: $('pageTitle'), pageSubtitle: $('pageSubtitle'), configStatus: $('configStatus'),
  siteGrid: $('siteGrid'), siteTemplate: $('siteCardTemplate'), resultTemplate: $('resultItemTemplate'),
  selectionInfo: $('selectionInfo'), searchForm: $('searchForm'), searchInput: $('searchInput'),
  clearButton: $('clearButton'), selectAllBtn: $('selectAllBtn'), unselectAllBtn: $('unselectAllBtn'),
  themeToggle: $('themeToggle'), resultsPanel: $('resultsPanel'), resultsInfo: $('resultsInfo'),
  resultsList: $('resultsList'), openAllBtn: $('openAllBtn'), submitBtn: $('submitBtn')
};

function encodeQuery(query) { return encodeURIComponent(query.trim()); }
function buildSearchUrl(site, query) { return site.searchUrl.replace('{query}', encodeQuery(query)); }

function setStatus(text, error = false) {
  el.configStatus.textContent = text;
  document.querySelector('.status-dot')?.classList.toggle('error', error);
}

async function loadConfig() {
  try {
    const response = await fetch(`config.json?v=${Date.now()}`);
    if (!response.ok) throw new Error('config.json introuvable');
    const config = await response.json();
    state.config = config;
    state.sites = (config.sites || []).map(site => ({ ...site, selected: !!site.selectedByDefault }));
    el.pageTitle.textContent = config.appName || 'Rechercher';
    el.pageSubtitle.textContent = config.subtitle || '';
    setStatus('Config OK');
    renderSites();
  } catch (error) {
    console.error(error);
    setStatus('Erreur config', true);
    el.siteGrid.innerHTML = '<p class="helper-text">Impossible de charger config.json.</p>';
  }
}

function renderSites() {
  el.siteGrid.innerHTML = '';
  state.sites.forEach(site => {
    const node = el.siteTemplate.content.cloneNode(true);
    const label = node.querySelector('.site-card');
    const checkbox = node.querySelector('.site-checkbox');
    const logo = node.querySelector('.site-logo');
    const name = node.querySelector('.site-name');
    const description = node.querySelector('.site-description');
    const link = node.querySelector('.site-link');

    checkbox.checked = site.selected;
    logo.style.backgroundImage = `url('${site.icon}')`;
    logo.style.backgroundSize = 'contain';
    logo.style.backgroundPosition = 'center';
    logo.style.backgroundRepeat = 'no-repeat';
    name.textContent = site.name;
    description.textContent = site.description || '';
    link.href = site.homeUrl || '#';
    link.addEventListener('click', e => e.stopPropagation());
    checkbox.addEventListener('change', () => {
      site.selected = checkbox.checked;
      updateSelectionInfo();
    });
    el.siteGrid.appendChild(node);
  });
  updateSelectionInfo();
}

function updateSelectionInfo() {
  const count = state.sites.filter(s => s.selected).length;
  el.selectionInfo.textContent = `${count} sélectionné${count > 1 ? 's' : ''}`;
}

function renderResults(results, query) {
  el.resultsPanel.classList.remove('hidden');
  el.resultsList.innerHTML = '';
  state.lastResults = results;

  if (!results.length) {
    el.resultsInfo.textContent = `Aucun résultat détecté pour « ${query} ».`;
    el.resultsList.innerHTML = '<p class="helper-text">Essaie un autre mot-clé ou sélectionne d’autres sites.</p>';
    return;
  }

  el.resultsInfo.textContent = `${results.length} site${results.length > 1 ? 's' : ''} avec résultat détecté pour « ${query} ».`;
  results.forEach(result => {
    const site = state.sites.find(s => s.id === result.id) || result;
    const node = el.resultTemplate.content.cloneNode(true);
    const logo = node.querySelector('.result-logo');
    const name = node.querySelector('.result-name');
    const url = node.querySelector('.result-url');
    const action = node.querySelector('.result-action');
    const searchUrl = buildSearchUrl(site, query);

    logo.src = site.icon;
    name.textContent = site.name;
    url.textContent = result.matchTitle ? `Trouvé : ${result.matchTitle}` : searchUrl;
    action.href = searchUrl;
    el.resultsList.appendChild(node);
  });
}

async function verifyResults(query) {
  const selectedSites = state.sites.filter(s => s.selected);
  if (!query.trim()) return alert('Tape une recherche avant de lancer.');
  if (!selectedSites.length) return alert('Sélectionne au moins un site.');
  if (!state.config.backendUrl || state.config.backendUrl.includes('TON-WORKER')) {
    el.resultsPanel.classList.remove('hidden');
    el.resultsInfo.textContent = 'Backend non configuré.';
    el.resultsList.innerHTML = '<p class="helper-text">Remplace backendUrl dans config.json par l’URL de ton Cloudflare Worker.</p>';
    return;
  }

  state.loading = true;
  el.submitBtn.disabled = true;
  el.submitBtn.textContent = 'Vérification…';
  el.resultsPanel.classList.remove('hidden');
  el.resultsInfo.textContent = 'Recherche en cours…';
  el.resultsList.innerHTML = '<p class="helper-text">Je vérifie les sites sélectionnés.</p>';

  try {
    const response = await fetch(state.config.backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, sites: selectedSites })
    });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    renderResults(data.results || [], query);
  } catch (error) {
    console.error(error);
    el.resultsInfo.textContent = 'Erreur pendant la vérification.';
    el.resultsList.innerHTML = '<p class="helper-text">Vérifie l’URL du Worker, la clé API Brave et les réglages CORS.</p>';
  } finally {
    state.loading = false;
    el.submitBtn.disabled = false;
    el.submitBtn.textContent = 'Vérifier';
  }
}

el.searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  verifyResults(el.searchInput.value.trim());
});
el.clearButton.addEventListener('click', () => { el.searchInput.value = ''; el.resultsPanel.classList.add('hidden'); el.searchInput.focus(); });
el.selectAllBtn.addEventListener('click', () => { state.sites.forEach(s => s.selected = true); renderSites(); });
el.unselectAllBtn.addEventListener('click', () => { state.sites.forEach(s => s.selected = false); renderSites(); });
el.openAllBtn.addEventListener('click', () => {
  const query = el.searchInput.value.trim();
  state.lastResults.forEach(result => {
    const site = state.sites.find(s => s.id === result.id) || result;
    window.open(buildSearchUrl(site, query), '_blank', 'noopener,noreferrer');
  });
});
el.themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light');
  el.themeToggle.textContent = document.body.classList.contains('light') ? '☾' : '☼';
});

loadConfig();
