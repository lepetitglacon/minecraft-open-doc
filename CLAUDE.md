# Claude Code - Minecraft Three Viewer

Pour comprendre ce projet, lis les fichiers suivants:

- **[CLAUDE.index.md](./CLAUDE.index.md)** - Index complet de l'architecture du projet
- **[CLAUDE.jar.md](./CLAUDE.jar.md)** - Structure des fichiers JAR de mods Minecraft et données extractibles

## Commandes rapides

```bash
# Backend (NestJS)
cd backend && npm run start:dev

# Frontend (Vue 3 + Vite)
cd frontend && npm run dev
```

## Structure principale

- `backend/` - API NestJS + MongoDB
- `frontend/` - Vue 3 + Three.js pour le rendu des icônes
- `src/` - Viewer Three.js legacy (mode construction)
