const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const sourceCatalog = [
  {
    id: 'yc',
    name: 'Y Combinator Companies',
    url: 'https://www.ycombinator.com/companies',
    category: 'accelerator',
    tags: ['b2b', 'developer-tools', 'saas', 'marketplace'],
    startups: [
      {
        name: 'SignalStack',
        domain: 'signalstack.ai',
        summary:
          'Building an AI observability layer that helps engineering teams catch production regressions before customers notice them.',
      },
      {
        name: 'LedgerLeaf',
        domain: 'ledgerleaf.com',
        summary:
          'Automates carbon accounting and sustainability reporting for mid-market manufacturers with ERP integrations.',
      },
      {
        name: 'PulsePort',
        domain: 'pulseport.health',
        summary:
          'Offers remote patient intake and follow-up workflows for specialty clinics.',
      },
    ],
  },
  {
    id: 'producthunt',
    name: 'Product Hunt',
    url: 'https://www.producthunt.com/',
    category: 'launch-platform',
    tags: ['ai', 'productivity', 'consumer', 'developer-tools'],
    startups: [
      {
        name: 'BriefBot',
        domain: 'briefbot.app',
        summary:
          'Creates daily executive digests from meetings, docs, and support tickets for startup operators.',
      },
      {
        name: 'SignalStack',
        domain: 'signalstack.ai',
        summary:
          'AI observability software that explains model and application incidents in plain English.',
      },
      {
        name: 'CohortFlow',
        domain: 'cohortflow.io',
        summary:
          'Helps revenue teams launch customer education journeys tied to product usage data.',
      },
    ],
  },
  {
    id: 'betalist',
    name: 'BetaList',
    url: 'https://betalist.com/',
    category: 'launch-platform',
    tags: ['saas', 'remote-work', 'productivity', 'operations'],
    startups: [
      {
        name: 'DeskPilot',
        domain: 'deskpilot.co',
        summary:
          'Coordinates hybrid office schedules, desk bookings, and workplace analytics for distributed teams.',
      },
      {
        name: 'LedgerLeaf',
        domain: 'ledgerleaf.com',
        summary:
          'Sustainability reporting software for finance and compliance leaders.',
      },
      {
        name: 'FoundryIQ',
        domain: 'foundryiq.com',
        summary:
          'Extracts buying signals from manufacturing procurement portals and routes them to sales teams.',
      },
    ],
  },
  {
    id: 'wellfound',
    name: 'Wellfound',
    url: 'https://wellfound.com/discover/startups',
    category: 'talent-marketplace',
    tags: ['hiring', 'b2b', 'marketplace', 'future-of-work'],
    startups: [
      {
        name: 'TalentMesh',
        domain: 'talentmesh.io',
        summary:
          'Builds AI-assisted recruiting workflows for high-growth technical teams.',
      },
      {
        name: 'CohortFlow',
        domain: 'cohortflow.io',
        summary:
          'Customer education software that turns product milestones into cohort-based courses.',
      },
      {
        name: 'HarborOS',
        domain: 'harboros.com',
        summary:
          'Back-office infrastructure for independent logistics operators.',
      },
    ],
  },
  {
    id: 'techstars',
    name: 'Techstars Portfolio',
    url: 'https://www.techstars.com/portfolio',
    category: 'accelerator',
    tags: ['b2b', 'fintech', 'healthtech', 'climatetech'],
    startups: [
      {
        name: 'PulsePort',
        domain: 'pulseport.health',
        summary:
          'Remote patient operations tooling for specialty care providers.',
      },
      {
        name: 'HarborOS',
        domain: 'harboros.com',
        summary:
          'Workflow operating system for freight brokers and fleet operators.',
      },
      {
        name: 'Northstar Ledger',
        domain: 'northstarledger.com',
        summary:
          'Embedded treasury and cash visibility software for vertical SaaS companies.',
      },
    ],
  },
  {
    id: 'indiehackers',
    name: 'Indie Hackers',
    url: 'https://www.indiehackers.com/products',
    category: 'builder-community',
    tags: ['bootstrapped', 'saas', 'productivity', 'creator-tools'],
    startups: [
      {
        name: 'BriefBot',
        domain: 'briefbot.app',
        summary:
          'Summarizes team activity and customer feedback into operator-ready updates.',
      },
      {
        name: 'OpsCanvas',
        domain: 'opscanvas.com',
        summary:
          'Transforms spreadsheet-heavy back-office workflows into lightweight internal apps.',
      },
      {
        name: 'MarketMaze',
        domain: 'marketmaze.co',
        summary:
          'Competitive intelligence dashboards for product marketing teams.',
      },
    ],
  },
];

const recommendationPool = [
  {
    id: '500global',
    name: '500 Global Portfolio',
    url: 'https://500.co/companies',
    reason: 'Another accelerator portfolio with broad early-stage coverage and strong B2B SaaS overlap.',
    tags: ['accelerator', 'b2b', 'saas'],
  },
  {
    id: 'f6s',
    name: 'F6S Startups',
    url: 'https://www.f6s.com/companies',
    reason: 'Useful for discovering very early startups before they hit larger launch platforms.',
    tags: ['directory', 'startup-community', 'saas'],
  },
  {
    id: 'openvc',
    name: 'OpenVC Startup Database',
    url: 'https://www.openvc.app/startups',
    reason: 'Pairs well with accelerator lists when you want a broader VC-backed sourcing net.',
    tags: ['funding', 'b2b', 'marketplace'],
  },
  {
    id: 'appsumo',
    name: 'AppSumo Marketplace',
    url: 'https://appsumo.com/',
    reason: 'Good adjacent source for newly launched SaaS products and GTM-ready tools.',
    tags: ['launch-platform', 'productivity', 'saas'],
  },
  {
    id: 'uneed',
    name: 'Uneed',
    url: 'https://www.uneed.best/',
    reason: 'Community-curated launches that surface emerging AI and productivity startups quickly.',
    tags: ['launch-platform', 'ai', 'productivity'],
  },
];

const hubspotCompanies = [
  { name: 'SignalStack', domain: 'signalstack.ai', owner: 'A. Chen', stage: 'Discovery' },
  { name: 'TalentMesh', domain: 'talentmesh.io', owner: 'L. Patel', stage: 'Qualified' },
  { name: 'Northstar Ledger', domain: 'northstarledger.com', owner: 'R. Gomez', stage: 'Customer' },
  { name: 'DeskPilot', domain: 'deskpilot.co', owner: 'J. Brooks', stage: 'Prospect' },
];

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
}

function getSelectedSources(websites = []) {
  const allowedIds = new Set(websites.map((website) => website.id));
  return sourceCatalog.filter((source) => allowedIds.has(source.id));
}

function recommendSources(websites = []) {
  const selected = getSelectedSources(websites);
  const selectedIds = new Set(selected.map((source) => source.id));
  const selectedTags = new Set(selected.flatMap((source) => source.tags.concat(source.category)));

  const scored = recommendationPool
    .filter((candidate) => !selectedIds.has(candidate.id))
    .map((candidate) => {
      const overlap = candidate.tags.filter((tag) => selectedTags.has(tag)).length;
      return {
        ...candidate,
        overlapScore: overlap,
      };
    })
    .sort((left, right) => right.overlapScore - left.overlapScore || left.name.localeCompare(right.name));

  return scored.slice(0, 4).map(({ overlapScore, ...candidate }) => candidate);
}

function buildSourcingReport(websites = []) {
  const selectedSources = getSelectedSources(websites);
  const crmByDomain = new Map(hubspotCompanies.map((company) => [normalize(company.domain), company]));
  const crmByName = new Map(hubspotCompanies.map((company) => [normalize(company.name), company]));

  const encountered = new Set();
  const newStartups = [];
  const existingMatches = [];

  selectedSources.forEach((source) => {
    source.startups.forEach((startup) => {
      const dedupeKey = `${normalize(startup.name)}|${normalize(startup.domain)}`;
      if (encountered.has(dedupeKey)) {
        return;
      }

      encountered.add(dedupeKey);
      const crmMatch = crmByDomain.get(normalize(startup.domain)) || crmByName.get(normalize(startup.name));
      if (crmMatch) {
        existingMatches.push({
          ...startup,
          source: source.name,
          hubspotOwner: crmMatch.owner,
          hubspotStage: crmMatch.stage,
        });
        return;
      }

      newStartups.push({
        ...startup,
        source: source.name,
        status: 'Net new',
      });
    });
  });

  return {
    cadence: 'Weekly',
    selectedSources: selectedSources.map(({ startups, tags, ...source }) => source),
    existingMatches,
    newStartups,
    totals: {
      sources: selectedSources.length,
      scrapedStartups: encountered.size,
      crmMatches: existingMatches.length,
      netNew: newStartups.length,
    },
  };
}

function serveStaticFile(req, res, pathname) {
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(PUBLIC_DIR, requestedPath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(res, 404, { error: 'Not found' });
      return;
    }

    const extension = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
    };

    res.writeHead(200, { 'Content-Type': mimeTypes[extension] || 'text/plain; charset=utf-8' });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = requestUrl;

  if (req.method === 'GET' && pathname === '/api/config') {
    sendJson(res, 200, {
      availableSources: sourceCatalog.map(({ startups, tags, ...source }) => source),
      hubspotCompanies,
    });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/recommend-sites') {
    try {
      const body = await readJsonBody(req);
      sendJson(res, 200, {
        recommendations: recommendSources(body.websites || []),
      });
    } catch (error) {
      sendJson(res, 400, { error: 'Invalid JSON body' });
    }
    return;
  }

  if (req.method === 'POST' && pathname === '/api/run-sourcing') {
    try {
      const body = await readJsonBody(req);
      sendJson(res, 200, buildSourcingReport(body.websites || []));
    } catch (error) {
      sendJson(res, 400, { error: 'Invalid JSON body' });
    }
    return;
  }

  if (req.method === 'GET') {
    serveStaticFile(req, res, pathname);
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed' });
});

server.listen(PORT, () => {
  console.log(`Weekly startup sourcing tool available at http://localhost:${PORT}`);
});
