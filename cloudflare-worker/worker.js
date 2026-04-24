export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    if (!env.BRAVE_API_KEY) {
      return new Response('Missing BRAVE_API_KEY secret', { status: 500, headers: corsHeaders });
    }

    try {
      const body = await request.json();
      const query = String(body.query || '').trim();
      const sites = Array.isArray(body.sites) ? body.sites : [];

      if (!query) {
        return Response.json({ results: [] }, { headers: corsHeaders });
      }

      const results = [];

      for (const site of sites.slice(0, 12)) {
        if (!site.id || !site.name || !site.searchUrl) continue;

        // Pour les moteurs généraux comme Google, la notion "un résultat sur le site" n'a pas vraiment de sens.
        // alwaysShow permet donc de les afficher directement si l'utilisateur les sélectionne.
        if (site.alwaysShow === true) {
          results.push({ id: site.id, name: site.name, found: true, matchTitle: 'Recherche disponible' });
          continue;
        }

        const domain = String(site.domain || '').trim();
        if (!domain) continue;

        const braveQuery = `site:${domain} ${query}`;
        const url = new URL('https://api.search.brave.com/res/v1/web/search');
        url.searchParams.set('q', braveQuery);
        url.searchParams.set('count', '1');
        url.searchParams.set('country', 'fr');
        url.searchParams.set('search_lang', 'fr');
        url.searchParams.set('safesearch', 'moderate');

        const braveResponse = await fetch(url.toString(), {
          headers: {
            'Accept': 'application/json',
            'X-Subscription-Token': env.BRAVE_API_KEY,
          },
        });

        if (!braveResponse.ok) {
          console.log('Brave error', braveResponse.status, await braveResponse.text());
          continue;
        }

        const data = await braveResponse.json();
        const firstResult = data?.web?.results?.[0];
        if (firstResult) {
          results.push({
            id: site.id,
            name: site.name,
            found: true,
            matchTitle: firstResult.title || 'Résultat détecté',
            matchUrl: firstResult.url || null,
          });
        }
      }

      return Response.json({ results }, { headers: corsHeaders });
    } catch (error) {
      return new Response(String(error?.message || error), { status: 500, headers: corsHeaders });
    }
  },
};
