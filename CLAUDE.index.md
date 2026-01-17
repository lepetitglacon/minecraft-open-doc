# Index du projet Minecraft Three Viewer

## 1. Architecture globale

```
minecraft-three-viewer/
├── backend/          NestJS server (MongoDB)
├── frontend/         Vue 3 + TypeScript + Vite
├── src/              Viewer Three.js legacy
├── scripts/          Scripts de parsing des mods
└── public/data/mods/ Données pré-parsées
```

**Technologies:**
- Backend: NestJS, Mongoose, Express
- Frontend: Vue 3, TypeScript, TanStack Query, Axios
- 3D: Three.js r182

---

## 2. Backend (NestJS)

### Modules principaux

| Fichier | Rôle |
|---------|------|
| `backend/src/blocks/blocks.service.ts` | Requêtes blocks + résolution textures |
| `backend/src/blocks/blocks.controller.ts` | API endpoints `/blocks` |
| `backend/src/models/models.service.ts` | Résolution héritage modèles |
| `backend/src/textures/textures.service.ts` | Récupération textures base64 |
| `backend/src/parser/parser.service.ts` | Extraction JAR des mods |
| `backend/src/parser/gif-generator.service.ts` | Génération GIF pour textures animées |

### Schémas MongoDB

| Fichier | Collection |
|---------|------------|
| `backend/src/schemas/block.schema.ts` | Blocks (registryName, namespace, displayName, models[]) |
| `backend/src/schemas/block-model.schema.ts` | Models (parent, textures, elements[]) |
| `backend/src/schemas/texture.schema.ts` | Textures (base64, animated, mcmeta) |

### Endpoints API

```
GET  /blocks?namespace=X&search=Y&page=1&limit=50&withIcons=true
GET  /blocks/namespaces
GET  /blocks/:namespace/:blockId?withIcons=true
GET  /blocks/stats

POST /parser/upload          (multipart/form-data, field: file)
POST /parser/jar             (body: { jarPath: string })
POST /textures/regenerate-gifs?namespace=X

GET  /recipes/:namespace/:blockId
GET  /recipes/stats
```

---

## 3. Frontend (Vue 3)

### Fichiers clés

| Fichier | Rôle |
|---------|------|
| `frontend/src/composables/useBlocks.ts` | Fetching + rendu icônes 3D |
| `frontend/src/services/blockIconRenderer.ts` | Rendu Three.js des icônes (64x64) |
| `frontend/src/views/NamespaceBlocks.vue` | Interface JEI-like (grille d'icônes) |
| `frontend/src/views/BlockDetail.vue` | Page de détail d'un bloc |
| `frontend/src/views/Upload.vue` | Page d'upload de mods JAR |
| `frontend/src/components/Breadcrumb.vue` | Navigation fil d'Ariane |
| `frontend/src/components/CraftingGrid.vue` | Affichage des recettes crafting |
| `frontend/src/services/api.ts` | Instance Axios |

### Composable useBlocks

```typescript
useBlocks({ namespace, search, page, limit })
// Retourne: blocks (avec renderedIcon), isLoading, renderIcons()
```

### blockIconRenderer.ts

- Singleton WebGLRenderer (évite contextes multiples)
- Caméra orthographique isométrique (45° rotation, 30° élévation)
- 3 lumières: ambient + 2 directional
- Rendu batch par 10 blocs
- Cache global des icônes

---

## 4. Viewer 3D Legacy (/src)

### Classes principales

| Fichier | Rôle |
|---------|------|
| `src/core/BlockViewer.ts` | Classe principale du viewer |
| `src/core/SceneManager.ts` | Scene Three.js + renderer |
| `src/core/CameraController.ts` | Caméra ortho + OrbitControls |
| `src/core/LightingManager.ts` | Éclairage style Minecraft |
| `src/blocks/BlockFactory.ts` | Création meshes (cube, slab, stairs) |
| `src/blocks/BlockRegistry.ts` | Registre des définitions |
| `src/blocks/TextureManager.ts` | Chargement textures |

---

## 5. Format des données

### Block

```typescript
{
  registryName: "mekanism:block_steel",
  namespace: "mekanism",
  blockId: "block_steel",
  displayName: "Steel Block",
  models: ["mekanism:block/storage/steel"],
  textures: { all: "mekanism:block/block_steel" },
  texturesBase64: { "mekanism:block/block_steel": "data:image/png;base64,..." }
}
```

### BlockModel (format Minecraft)

```typescript
{
  modelPath: "mekanism:block/ore_titanium",
  parent: "minecraft:block/cube_all",
  textures: { all: "mekanism:block/ore_titanium" },
  elements: [{
    from: [0, 0, 0],
    to: [16, 16, 16],
    faces: {
      north: { uv: [0,0,16,16], texture: "#all", cullface: "north" },
      // ... 5 autres faces
    }
  }]
}
```

---

## 6. Flux de données

```
JAR mod → ParserService → MongoDB (Block, Model, Texture)
                              ↓
API /blocks?withIcons=true → BlocksService.findAllWithIcons()
                              ↓
                    Résout modèles + textures base64
                              ↓
Frontend useBlocks → blockIconRenderer.renderBlockIconsAsync()
                              ↓
                    Grille 36x36px avec icônes 3D
```

---

## 7. Mapping textures Three.js

Ordre des faces BoxGeometry:
```
[0] +X (east)
[1] -X (west)
[2] +Y (up)
[3] -Y (down)
[4] +Z (south)
[5] -Z (north)
```

Parents standards:
- `block/cube_all` → toutes faces = `#all`
- `block/cube_column` → sides = `#side`, top/bottom = `#end`
- `block/cube` → chaque face différente

---

## 8. Système d'animation des textures

### Format Minecraft
Les textures animées utilisent une spritesheet verticale + fichier `.mcmeta`:
```json
{
  "animation": {
    "frametime": 2,        // ticks par frame (20 ticks = 1 sec)
    "interpolate": true,   // lissage entre frames
    "frames": [0, 1, 2]    // ordre des frames (optionnel)
  }
}
```

### Génération GIF (GifGeneratorService)
- Utilise `sharp` pour découper les frames de la spritesheet
- Utilise `gif-encoder-2` pour encoder le GIF
- Stocke le GIF en base64 dans `Texture.animatedGif`
- Génération automatique lors du parsing des JAR

### API
`GET /blocks?withIcons=true` retourne:
```typescript
{
  texturesBase64: { "path": "data:image/png..." },
  animatedTextures: { "path": "data:image/gif..." }, // si animé
  hasAnimatedTextures: true
}
```

---

## 9. Configuration

- Backend port: 3000
- Frontend port: 5173 (Vite)
- MongoDB: connexion via `backend/src/database/`
