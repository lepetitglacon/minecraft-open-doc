# Plan: Sauvegarde des scènes Three.js en BD

## Contexte

Besoin de sauvegarder des scènes 3D pour les exemples du wiki avec:
- Réouverture et modification ultérieure
- Infos personnalisées par bloc
- Tooltips CSS customisables

## Approche hybride recommandée

### Structure MongoDB (ModExample enrichi)

```typescript
interface SceneBlock {
  x: number;
  y: number;
  z: number;
  blockId: string;
  properties?: Record<string, any>;  // État du bloc (facing, lit, etc.)
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
}

interface SceneAnnotation {
  id: string;
  targetBlockIndex?: number;         // Index du bloc ciblé (optionnel)
  worldPosition: [number, number, number];
  content: string;                   // HTML ou texte
  cssClass?: string;                 // Classes CSS custom
  position?: 'top' | 'bottom' | 'left' | 'right';
  style?: Record<string, string>;    // Styles inline optionnels
}

interface ModExample {
  _id: ObjectId;
  name: string;
  namespace: string;
  description?: string;

  // Source de vérité (édition)
  blocks: SceneBlock[];
  annotations: SceneAnnotation[];

  // Métadonnées de la scène
  camera?: {
    position: [number, number, number];
    target: [number, number, number];
  };
  background?: 'overworld' | 'nether' | 'end' | 'void';

  // Cache pour le wiki (lecture seule)
  gltfData?: string;                 // GLTF exporté en base64/JSON
  thumbnailBase64?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### Workflow par mode

| Mode | Source 3D | Tooltips | Performance |
|------|-----------|----------|-------------|
| **Edit** | Reconstruit depuis `blocks[]` | Overlay HTML dynamique | Plus lent, flexible |
| **Wiki** | Charge `gltfData` directement | Overlay HTML depuis `annotations[]` | Rapide, stable |

### Sauvegarde (ExampleEditor)

```
1. Extraire positions/rotations des meshes → blocks[]
2. Collecter les annotations UI → annotations[]
3. Exporter scène Three.js → gltfData (GLTFExporter)
4. Capturer canvas → thumbnailBase64
5. POST /examples
```

### Chargement Edit

```
1. GET /examples/:id
2. Pour chaque block dans blocks[]:
   - Charger le modèle depuis BlockModel
   - Créer le mesh Three.js
   - Appliquer position/rotation
3. Créer les overlays HTML depuis annotations[]
```

### Chargement Wiki (read-only)

```
1. GET /examples/:id
2. GLTFLoader.parse(gltfData)
3. Ajouter la scène au renderer
4. Créer les overlays HTML depuis annotations[]
5. Projeter les annotations: worldPos → screenPos via camera.project()
```

## Avantages de cette approche

| Aspect | Bénéfice |
|--------|----------|
| **Édition** | Données sémantiques, facile à modifier bloc par bloc |
| **Wiki** | GLTF pré-généré = chargement instantané |
| **Tooltips** | Overlay HTML = CSS complet, pas limité par WebGL |
| **Stabilité** | Wiki fonctionne même si les blocs source changent |
| **Flexibilité** | Annotations indépendantes des blocs |

## Fichiers à modifier

### Backend

- `backend/src/schemas/mod-example.schema.ts` - Enrichir le schéma
- `backend/src/app/examples/examples.service.ts` - Gestion GLTF
- `backend/src/app/examples/dto/create-example.dto.ts` - DTO enrichi

### Frontend

- `frontend/src/views/mod/SceneRenderer.ts` - Export GLTF, gestion annotations
- `frontend/src/views/mod/ExampleEditor.vue` - UI annotations
- `frontend/src/views/mod/ExampleViewer.vue` - Nouveau composant wiki read-only
- `frontend/src/views/mod/tabs/Examples.vue` - Lien vers viewer

## Notes techniques

### GLTFExporter (Three.js)

```typescript
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

const exporter = new GLTFExporter();
exporter.parse(scene, (gltf) => {
  const gltfData = JSON.stringify(gltf);
  // Sauvegarder en BD
}, { binary: false });
```

### Projection des annotations

```typescript
function updateAnnotationPositions(camera: Camera, annotations: SceneAnnotation[]) {
  annotations.forEach(ann => {
    const pos = new Vector3(...ann.worldPosition);
    pos.project(camera);

    const x = (pos.x * 0.5 + 0.5) * canvas.width;
    const y = (-pos.y * 0.5 + 0.5) * canvas.height;

    // Positionner l'élément HTML
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
  });
}
```

## TODO

- [ ] Enrichir le schéma MongoDB
- [ ] Ajouter GLTFExporter au SceneRenderer
- [ ] Créer le composant ExampleViewer (wiki)
- [ ] UI pour créer/éditer les annotations
- [ ] Système de projection des tooltips
- [ ] Migration des exemples existants
