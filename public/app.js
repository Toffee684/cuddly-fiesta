const selectionStorageKey = 'weekly-startup-sourcing.sources';
const settingsStorageKey = 'weekly-startup-sourcing.settings';

const defaultSettings = {
  compactMode: false,
  showSummaries: true,
  showMatches: true,
  autoLoadDemo: true,
};

const state = {
  availableSources: [],
  hubspotCompanies: [],
  selectedIds: new Set(),
  settings: { ...defaultSettings },
  lastReport: null,
};

const sourceList = document.querySelector('#sourceList');
const hubspotList = document.querySelector('#hubspotList');
const recommendations = document.querySelector('#recommendations');
const report = document.querySelector('#report');
const totals = document.querySelector('#totals');
const recommendButton = document.querySelector('#recommendButton');
const runButton = document.querySelector('#runButton');
const loadDemoButton = document.querySelector('#loadDemoButton');
const sourceTemplate = document.querySelector('#sourceTemplate');
const settingsButton = document.querySelector('#settingsButton');
const settingsPanel = document.querySelector('#settingsPanel');
const compactModeToggle = document.querySelector('#compactModeToggle');
const showSummariesToggle = document.querySelector('#showSummariesToggle');
const showMatchesToggle = document.querySelector('#showMatchesToggle');
const autoLoadDemoToggle = document.querySelector('#autoLoadDemoToggle');

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

function saveSelections() {
  localStorage.setItem(selectionStorageKey, JSON.stringify(Array.from(state.selectedIds)));
}

function loadSelections() {
  try {
    const saved = JSON.parse(localStorage.getItem(selectionStorageKey) || '[]');
    state.selectedIds = new Set(saved);
  } catch (error) {
    state.selectedIds = new Set();
  }
}

function saveSettings() {
  localStorage.setItem(settingsStorageKey, JSON.stringify(state.settings));
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(settingsStorageKey) || '{}');
    state.settings = { ...defaultSettings, ...saved };
  } catch (error) {
    state.settings = { ...defaultSettings };
  }
}

function syncSettingsControls() {
  compactModeToggle.checked = state.settings.compactMode;
  showSummariesToggle.checked = state.settings.showSummaries;
  showMatchesToggle.checked = state.settings.showMatches;
  autoLoadDemoToggle.checked = state.settings.autoLoadDemo;
}

function applySettings() {
  document.body.classList.toggle('compact-mode', state.settings.compactMode);
  syncSettingsControls();

  if (state.lastReport) {
    renderReport(state.lastReport);
  }
}

function updateSetting(name, value) {
  state.settings[name] = value;
  saveSettings();
  applySettings();
}

function toggleSettingsMenu(forceOpen) {
  const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : settingsPanel.hidden;
  settingsPanel.hidden = !shouldOpen;
  settingsButton.setAttribute('aria-expanded', String(shouldOpen));
}

function getSelectedWebsites() {
  return state.availableSources
    .filter((source) => state.selectedIds.has(source.id))
    .map(({ id, name, url }) => ({ id, name, url }));
}

function renderSources() {
  sourceList.innerHTML = '';

  state.availableSources.forEach((source) => {
    const fragment = sourceTemplate.content.cloneNode(true);
    const card = fragment.querySelector('.source-card');
    const checkbox = fragment.querySelector('.source-toggle');
    const name = fragment.querySelector('.source-name');
    const category = fragment.querySelector('.source-category');
    const link = fragment.querySelector('.source-link');

    checkbox.checked = state.selectedIds.has(source.id);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        state.selectedIds.add(source.id);
      } else {
        state.selectedIds.delete(source.id);
      }
      saveSelections();
    });

    name.textContent = source.name;
    category.textContent = source.category;
    link.href = source.url;
    link.textContent = source.url;
    card.dataset.sourceId = source.id;
    sourceList.appendChild(fragment);
  });
}

function renderHubSpotCompanies() {
  hubspotList.innerHTML = state.hubspotCompanies
    .map(
      (company) => `
        <article class="company-card">
          <div class="company-row">
            <div>
              <strong>${company.name}</strong>
              <div class="crm-meta">${company.domain}</div>
            </div>
            <span class="pill">${company.stage}</span>
          </div>
          <p class="crm-meta"><span class="crm-owner">Owner:</span> ${company.owner}</p>
        </article>
      `,
    )
    .join('');
}

function renderRecommendations(items) {
  if (!items.length) {
    recommendations.className = 'empty-state';
    recommendations.textContent = 'No adjacent sources found yet. Try selecting more websites first.';
    return;
  }

  recommendations.className = 'recommendations-grid';
  recommendations.innerHTML = items
    .map(
      (item) => `
        <article class="recommendation-card">
          <div>
            <strong>${item.name}</strong>
            <a href="${item.url}" target="_blank" rel="noreferrer">${item.url}</a>
            <p class="recommendation-reason">${item.reason}</p>
          </div>
          <button type="button" data-add-source="${item.id}" data-url="${item.url}" data-name="${item.name}">
            Save for later
          </button>
        </article>
      `,
    )
    .join('');

  recommendations.querySelectorAll('[data-add-source]').forEach((button) => {
    button.addEventListener('click', () => {
      alert(`Recommendation saved for research: ${button.dataset.name}`);
    });
  });
}

function renderTotals(summary) {
  totals.innerHTML = [
    ['Sources', summary.sources],
    ['Scraped', summary.scrapedStartups],
    ['CRM matches', summary.crmMatches],
    ['Net new', summary.netNew],
  ]
    .map(([label, value]) => `<span class="total-pill">${label}: ${value}</span>`)
    .join('');
}

function renderSummaryCopy(startup, existing = false) {
  if (existing) {
    return `Already tracked in HubSpot · ${startup.hubspotStage} · Owner: ${startup.hubspotOwner}`;
  }

  return startup.summary;
}

function renderReport(data) {
  state.lastReport = data;
  renderTotals(data.totals);

  const newStartupMarkup = data.newStartups.length
    ? data.newStartups
        .map(
          (startup) => `
            <article class="startup-card">
              <strong>${startup.name}</strong>
              <div class="meta">${startup.domain} · Source: ${startup.source}</div>
              ${
                state.settings.showSummaries
                  ? `<p class="summary-copy">${renderSummaryCopy(startup)}</p>`
                  : ''
              }
            </article>
          `,
        )
        .join('')
    : '<div class="empty-state">Every scraped startup already exists in HubSpot.</div>';

  const matchesMarkup = state.settings.showMatches
    ? `
      <section class="report-section">
        <h3>Existing HubSpot matches</h3>
        ${
          data.existingMatches.length
            ? data.existingMatches
                .map(
                  (startup) => `
                    <article class="match-card">
                      <strong>${startup.name}</strong>
                      <div class="meta">${startup.domain} · Source: ${startup.source}</div>
                      ${
                        state.settings.showSummaries
                          ? `<p class="summary-copy">${renderSummaryCopy(startup, true)}</p>`
                          : ''
                      }
                    </article>
                  `,
                )
                .join('')
            : '<div class="empty-state">No CRM matches found in this run.</div>'
        }
      </section>
    `
    : '';

  report.className = 'report-grid';
  report.innerHTML = `
    <section class="report-section">
      <h3>Net-new startups to review</h3>
      ${newStartupMarkup}
    </section>
    ${matchesMarkup}
  `;
}

async function bootstrap() {
  const config = await requestJson('/api/config');
  state.availableSources = config.availableSources;
  state.hubspotCompanies = config.hubspotCompanies;

  loadSettings();
  applySettings();
  loadSelections();

  if (!state.selectedIds.size && state.settings.autoLoadDemo) {
    ['yc', 'producthunt', 'betalist'].forEach((id) => state.selectedIds.add(id));
    saveSelections();
  }

  renderSources();
  renderHubSpotCompanies();
}

recommendButton.addEventListener('click', async () => {
  recommendButton.disabled = true;
  recommendations.className = 'empty-state';
  recommendations.textContent = 'Finding similar sources...';

  try {
    const data = await requestJson('/api/recommend-sites', {
      method: 'POST',
      body: JSON.stringify({ websites: getSelectedWebsites() }),
    });
    renderRecommendations(data.recommendations);
  } catch (error) {
    recommendations.className = 'empty-state';
    recommendations.textContent = 'Unable to load recommendations right now.';
  } finally {
    recommendButton.disabled = false;
  }
});

runButton.addEventListener('click', async () => {
  runButton.disabled = true;
  report.className = 'empty-state';
  report.textContent = 'Running weekly scrape and CRM comparison...';

  try {
    const data = await requestJson('/api/run-sourcing', {
      method: 'POST',
      body: JSON.stringify({ websites: getSelectedWebsites() }),
    });
    renderReport(data);
  } catch (error) {
    report.className = 'empty-state';
    report.textContent = 'Unable to complete the sourcing run right now.';
  } finally {
    runButton.disabled = false;
  }
});

loadDemoButton.addEventListener('click', () => {
  state.selectedIds = new Set(['yc', 'producthunt', 'wellfound', 'techstars']);
  saveSelections();
  renderSources();
});

settingsButton.addEventListener('click', () => {
  toggleSettingsMenu();
});

compactModeToggle.addEventListener('change', () => {
  updateSetting('compactMode', compactModeToggle.checked);
});

showSummariesToggle.addEventListener('change', () => {
  updateSetting('showSummaries', showSummariesToggle.checked);
});

showMatchesToggle.addEventListener('change', () => {
  updateSetting('showMatches', showMatchesToggle.checked);
});

autoLoadDemoToggle.addEventListener('change', () => {
  updateSetting('autoLoadDemo', autoLoadDemoToggle.checked);
});

document.addEventListener('click', (event) => {
  if (!settingsPanel.hidden && !event.target.closest('.settings-menu')) {
    toggleSettingsMenu(false);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    toggleSettingsMenu(false);
  }
});

bootstrap().catch(() => {
  sourceList.innerHTML = '<div class="empty-state">Unable to load startup sources.</div>';
});
