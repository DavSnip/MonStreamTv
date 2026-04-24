MonStreamTv V2 - Recherche avec résultats vérifiés

Fichiers GitHub Pages à mettre à la racine du repo :
- index.html
- style.css
- script.js
- config.json
- icons/

Backend :
- cloudflare-worker/worker.js

Important :
1. Déploie le Worker Cloudflare.
2. Ajoute le secret BRAVE_API_KEY dans Cloudflare.
3. Remplace backendUrl dans config.json par l'URL de ton Worker.
4. Commit config.json sur GitHub.

Sans backendUrl valide, le site affiche une erreur "Backend non configuré".
