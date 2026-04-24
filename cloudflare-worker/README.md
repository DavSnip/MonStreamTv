# Backend Cloudflare Worker pour MonStreamTv

Ce Worker sert à vérifier quels sites ont au moins un résultat avant de les afficher sur le site GitHub Pages.

## Principe

Le front GitHub Pages envoie :

```json
{
  "query": "moteur",
  "sites": [{ "name": "Leboncoin", "domain": "leboncoin.fr" }]
}
```

Le Worker interroge Brave Search API avec une requête du type :

```text
site:leboncoin.fr moteur
```

S'il trouve au moins un résultat indexé, il renvoie ce site au front.

## À faire

1. Créer un compte Cloudflare.
2. Aller dans Workers & Pages.
3. Créer un Worker.
4. Coller le contenu de `worker.js`.
5. Ajouter un secret nommé `BRAVE_API_KEY` avec ta clé Brave Search API.
6. Déployer.
7. Copier l'URL du Worker.
8. Dans `config.json`, remplacer :

```json
"backendUrl": "https://TON-WORKER.TON-SOUS-DOMAINE.workers.dev/search"
```

par ton URL Worker, en gardant `/search` à la fin si tu l'utilises.

Exemple :

```json
"backendUrl": "https://monstreamtv-search.snipdav.workers.dev/search"
```

## Limite honnête

Ce système ne lit pas directement Leboncoin, Amazon ou YouTube. Il utilise l'index Brave Search avec `site:domain`. Donc il détecte les résultats indexés par Brave, pas forcément 100% des résultats internes du site.
