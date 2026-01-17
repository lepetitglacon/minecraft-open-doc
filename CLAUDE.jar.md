# Structure d'un fichier JAR de mod Minecraft

Ce document décrit toutes les informations extractibles d'un fichier JAR de mod Minecraft et leur utilité pour la documentation.

---

## 1. Structure générale d'un JAR

```
mod.jar
├── META-INF/
│   ├── MANIFEST.MF
│   ├── mods.toml          (NeoForge/Forge - métadonnées du mod)
│   └── neoforge.mods.toml (NeoForge récent)
├── assets/
│   └── <modid>/
│       ├── blockstates/   (états des blocs)
│       ├── models/        (modèles 3D JSON)
│       ├── textures/      (images PNG)
│       ├── lang/          (traductions)
│       ├── sounds.json    (définitions des sons)
│       └── atlases/       (atlas de textures)
├── data/
│   └── <modid>/
│       ├── recipe/        (recettes de craft)
│       ├── loot_table/    (tables de loot)
│       ├── tags/          (tags d'items/blocs)
│       └── advancement/   (succès/advancements)
└── <modid>/               (classes Java compilées)
```

---

## 2. Métadonnées du mod

### Fichier: `META-INF/mods.toml` ou `META-INF/neoforge.mods.toml`

```toml
[[mods]]
modId = "mekanism"
version = "10.7.17"
displayName = "Mekanism"
description = "High-tech mod featuring..."
authors = "aidancbrady, pupnewfster"
logoFile = "logo.png"

[[dependencies.mekanism]]
modId = "minecraft"
versionRange = "[1.21.1]"
```

**Données extractibles:**
| Champ | Description | Utilité doc |
|-------|-------------|-------------|
| `modId` | Identifiant unique | Namespace pour les blocs/items |
| `version` | Version du mod | Affichage, compatibilité |
| `displayName` | Nom affiché | Titre de la documentation |
| `description` | Description | Introduction de la doc |
| `authors` | Auteurs | Crédits |
| `logoFile` | Logo du mod | Illustration |
| `dependencies` | Dépendances | Prérequis à documenter |

---

## 3. Blockstates (États des blocs)

### Fichier: `assets/<modid>/blockstates/<block>.json`

```json
{
  "variants": {
    "facing=north": { "model": "mekanism:block/crusher", "y": 0 },
    "facing=east": { "model": "mekanism:block/crusher", "y": 90 },
    "facing=south": { "model": "mekanism:block/crusher", "y": 180 },
    "facing=west": { "model": "mekanism:block/crusher", "y": 270 }
  }
}
```

**Données extractibles:**
| Champ | Description | Utilité doc |
|-------|-------------|-------------|
| `variants` | États possibles | Montrer les différentes orientations |
| `model` | Référence au modèle 3D | Lien vers le rendu |
| `y`, `x` | Rotations | Animation/preview 3D |

**Utilité pour la doc:**
- Liste de tous les blocs du mod
- Propriétés des blocs (facing, powered, lit, etc.)
- Génération des previews 3D

---

## 4. Modèles 3D (Models)

### Fichier: `assets/<modid>/models/block/<block>.json`

```json
{
  "parent": "minecraft:block/cube_all",
  "textures": {
    "all": "mekanism:block/block_steel"
  }
}
```

### Modèle complexe avec éléments:

```json
{
  "parent": "block/block",
  "textures": {
    "front": "mekanism:block/crusher_front",
    "side": "mekanism:block/crusher_side",
    "top": "mekanism:block/crusher_top"
  },
  "elements": [
    {
      "from": [0, 0, 0],
      "to": [16, 16, 16],
      "faces": {
        "north": { "uv": [0, 0, 16, 16], "texture": "#front" },
        "south": { "uv": [0, 0, 16, 16], "texture": "#side" },
        "east": { "uv": [0, 0, 16, 16], "texture": "#side" },
        "west": { "uv": [0, 0, 16, 16], "texture": "#side" },
        "up": { "uv": [0, 0, 16, 16], "texture": "#top" },
        "down": { "uv": [0, 0, 16, 16], "texture": "#top" }
      }
    }
  ]
}
```

**Données extractibles:**
| Champ | Description | Utilité doc |
|-------|-------------|-------------|
| `parent` | Modèle parent | Héritage de forme |
| `textures` | Mapping des textures | Rendu 3D |
| `elements` | Géométrie 3D | Rendu avancé |
| `display` | Transformations | Preview dans GUI/main |

**Parents standards:**
- `block/cube_all` - Cube simple, même texture partout
- `block/cube` - Cube avec 6 textures différentes
- `block/cube_column` - Pilier (top/bottom + sides)
- `block/orientable` - Machine orientable
- `item/generated` - Item plat

---

## 5. Textures

### Fichier: `assets/<modid>/textures/block/<texture>.png`

**Types de textures:**
| Dossier | Contenu | Utilité |
|---------|---------|---------|
| `block/` | Textures de blocs | Icônes, rendu 3D |
| `item/` | Textures d'items | Icônes d'inventaire |
| `gui/` | Interfaces | Documentation des GUIs |
| `entity/` | Entités/mobs | Documentation des mobs |
| `particle/` | Particules | Effets visuels |

### Textures animées (.mcmeta)

```json
// texture.png.mcmeta
{
  "animation": {
    "frametime": 2,
    "frames": [0, 1, 2, 3, 2, 1],
    "interpolate": true
  }
}
```

**Utilité pour la doc:**
- Icônes des blocs/items
- Rendu 3D des blocs
- Animations (fluides, portails, etc.)
- Génération de GIFs animés

---

## 6. Traductions (Lang)

### Fichier: `assets/<modid>/lang/en_us.json`

```json
{
  "block.mekanism.crusher": "Crusher",
  "block.mekanism.steel_casing": "Steel Casing",
  "item.mekanism.atomic_alloy": "Atomic Alloy",
  "tooltip.mekanism.crusher": "Crushes items into dust",
  "description.mekanism.crusher": "The Crusher grinds items...",
  "advancements.mekanism.crusher.title": "Crushing It!",
  "advancements.mekanism.crusher.description": "Craft a Crusher"
}
```

**Clés importantes:**
| Pattern | Description | Utilité doc |
|---------|-------------|-------------|
| `block.<modid>.<id>` | Nom du bloc | Titre |
| `item.<modid>.<id>` | Nom de l'item | Titre |
| `tooltip.<modid>.<id>` | Infobulle | Description courte |
| `description.<modid>.<id>` | Description longue | Contenu de doc |
| `advancements.<modid>.*` | Succès | Tutoriels/guides |
| `gui.<modid>.*` | Textes d'interface | Documentation GUI |
| `configuration.<modid>.*` | Config | Options configurables |

**Langues disponibles:** ~40+ langues généralement

---

## 7. Recettes (Recipes)

### Fichier: `data/<modid>/recipe/<recipe>.json`

### Crafting Shaped (avec pattern)
```json
{
  "type": "minecraft:crafting_shaped",
  "pattern": [
    "RCR",
    "BXB",
    "RCR"
  ],
  "key": {
    "R": { "tag": "c:dusts/redstone" },
    "C": { "tag": "c:circuits/basic" },
    "B": { "tag": "c:buckets/lava" },
    "X": { "item": "mekanism:steel_casing" }
  },
  "result": {
    "id": "mekanism:crusher",
    "count": 1
  }
}
```

### Crafting Shapeless
```json
{
  "type": "minecraft:crafting_shapeless",
  "ingredients": [
    { "item": "minecraft:coal" },
    { "item": "mekanism:bio_fuel" }
  ],
  "result": { "id": "mekanism:charcoal_dust", "count": 2 }
}
```

### Smelting
```json
{
  "type": "minecraft:smelting",
  "ingredient": { "item": "mekanism:dirty_copper_dust" },
  "result": { "id": "minecraft:copper_ingot" },
  "experience": 0.7,
  "cookingtime": 200
}
```

### Recettes custom de mod (ex: Mekanism)
```json
{
  "type": "mekanism:crushing",
  "input": { "ingredient": { "item": "minecraft:cobblestone" } },
  "output": { "id": "minecraft:gravel" }
}
```

**Types de recettes:**
| Type | Description | Affichage |
|------|-------------|-----------|
| `crafting_shaped` | Table de craft avec forme | Grille 3x3 |
| `crafting_shapeless` | Craft sans forme | Liste d'ingrédients |
| `smelting` | Four | Entrée → Sortie |
| `blasting` | Haut fourneau | Entrée → Sortie |
| `smoking` | Fumoir | Entrée → Sortie |
| `stonecutting` | Tailleur de pierre | Entrée → Options |
| `smithing_transform` | Table de forgeron | Template + Base + Addition |
| `<modid>:*` | Recettes custom | Selon le mod |

---

## 8. Tags

### Fichier: `data/<modid>/tags/block/<tag>.json`

```json
{
  "replace": false,
  "values": [
    "mekanism:block_steel",
    "mekanism:block_bronze",
    "#c:storage_blocks/metal"
  ]
}
```

**Utilité:**
- Regroupement logique (tous les minerais, tous les blocs de stockage)
- Compatibilité entre mods (tags `c:` communs)
- Documentation des catégories

---

## 9. Tables de loot

### Fichier: `data/<modid>/loot_table/blocks/<block>.json`

```json
{
  "type": "minecraft:block",
  "pools": [
    {
      "rolls": 1,
      "entries": [
        {
          "type": "minecraft:item",
          "name": "mekanism:crusher"
        }
      ],
      "conditions": [
        { "condition": "minecraft:survives_explosion" }
      ]
    }
  ]
}
```

**Utilité pour la doc:**
- Drops des blocs cassés
- Silk touch vs normal
- Fortune/enchantements

---

## 10. Multiblocs

Les multiblocs sont généralement définis **en code Java**, pas en JSON.

**Informations à documenter manuellement:**
- Dimensions (ex: 3x3x3, 5x5x5)
- Blocs requis (casing, valves, ports)
- Disposition des blocs
- Schémas visuels

**Sources possibles:**
- Wiki du mod
- Code source (classes `*MultiblockData.java`)
- Patchouli/guide books inclus

### Intégration JEI/EMI

Certains mods incluent des données pour JEI/EMI:

```
assets/emi/recipe/defaults/<modid>.json
assets/jei/info/<modid>/*.json
```

---

## 11. Advancements (Succès)

### Fichier: `data/<modid>/advancement/<advancement>.json`

```json
{
  "display": {
    "icon": { "id": "mekanism:crusher" },
    "title": { "translate": "advancements.mekanism.crusher.title" },
    "description": { "translate": "advancements.mekanism.crusher.description" }
  },
  "parent": "mekanism:root",
  "criteria": {
    "has_crusher": {
      "trigger": "minecraft:inventory_changed",
      "conditions": {
        "items": [{ "items": "mekanism:crusher" }]
      }
    }
  }
}
```

**Utilité pour la doc:**
- Arbre de progression
- Tutoriels guidés
- Objectifs du mod

---

## 12. Résumé des données extractibles

| Donnée | Source | Extraction | Utilité |
|--------|--------|------------|---------|
| Nom du mod | `mods.toml` | ✅ Implémenté | Titre |
| Version | `mods.toml` | ✅ Implémenté | Compatibilité |
| Liste des blocs | `blockstates/` | ✅ Implémenté | Index |
| Noms traduits | `lang/en_us.json` | ✅ Implémenté | Affichage |
| Textures | `textures/` | ✅ Implémenté | Icônes |
| Modèles 3D | `models/` | ✅ Implémenté | Rendu 3D |
| Textures animées | `.mcmeta` | ✅ Implémenté | GIFs |
| Recettes craft | `data/recipe/` | ⏳ À implémenter | Guides craft |
| Tags | `data/tags/` | ⏳ À implémenter | Catégories |
| Loot tables | `data/loot_table/` | ⏳ À implémenter | Drops |
| Advancements | `data/advancement/` | ⏳ À implémenter | Progression |
| Multiblocs | Code Java | ❌ Manuel | Schémas |
| GUI textures | `textures/gui/` | ⏳ À implémenter | Doc interfaces |

---

## 13. Priorités d'implémentation

### Phase 1 (fait)
- [x] Métadonnées du mod
- [x] Blockstates
- [x] Modèles 3D
- [x] Textures + animations
- [x] Traductions

### Phase 2 (à faire)
- [ ] Recettes (crafting, smelting, custom)
- [ ] Tags (catégories)
- [ ] Items (pas que les blocs)

### Phase 3 (futur)
- [ ] Loot tables
- [ ] Advancements
- [ ] GUI documentation
- [ ] Intégration JEI/EMI data

### Phase 4 (manuel/avancé)
- [ ] Multiblocs (schémas)
- [ ] Tutoriels guidés
- [ ] Compatibilités entre mods
