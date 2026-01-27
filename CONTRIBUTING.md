# Contributing to projet_eseo

Merci de contribuer ! Quelques règles simples :

- Forkez le dépôt et ouvrez une branche nommée `feature/<courte-description>` ou `fix/<courte-description>`.
- Respectez le style existant : PHP code in `backend/`, JS in `frontend/`.
- Ouvrez une Pull Request claire, décrivant les changements et comment les tester.
- Pour des changements lourds, ouvrez d'abord une issue pour discussion.

Tests et vérifications locales :

- Utilisez Docker Compose pour lancer l'environnement rapidement :

```bash
docker compose up -d
# exécuter manuellement des scripts de test si présents
```

PS ceci est un projet école et les PRs ou autres nee peuvent ne pas être lus. Désolé
