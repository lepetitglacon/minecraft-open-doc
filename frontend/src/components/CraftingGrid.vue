<template>
  <div class="crafting-container">
    <div class="crafting-type">{{ recipeTypeLabel }}</div>

    <div class="crafting-layout">
      <!-- Grille de crafting 3x3 -->
      <div class="crafting-grid">
        <div
          v-for="(slot, index) in gridSlots"
          :key="index"
          class="crafting-slot"
          :title="slot.itemId || 'Empty'"
        >
          <img
            v-if="slot.texture"
            :src="slot.texture"
            :alt="slot.itemId"
            class="slot-icon"
          />
          <span v-else-if="slot.itemId" class="slot-placeholder">
            {{ slot.itemId.split(':').pop()?.charAt(0).toUpperCase() }}
          </span>
        </div>
      </div>

      <!-- Flèche -->
      <div class="crafting-arrow">
        <span class="arrow-icon">➜</span>
      </div>

      <!-- Résultat -->
      <div class="crafting-result">
        <div class="crafting-slot result-slot" :title="resultItem">
          <img
            v-if="resultTexture"
            :src="resultTexture"
            :alt="resultItem"
            class="slot-icon"
          />
          <span v-else class="slot-placeholder">
            {{ resultItem.split(':').pop()?.charAt(0).toUpperCase() }}
          </span>
          <span v-if="resultCount > 1" class="result-count">{{ resultCount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface RecipeIngredient {
  item?: string;
  tag?: string;
}

interface Recipe {
  type: string;
  pattern?: string[];
  key?: Record<string, RecipeIngredient>;
  ingredients?: Array<RecipeIngredient | RecipeIngredient[]>;
  result: { item: string; count?: number } | string;
}

interface GridSlot {
  itemId: string | null;
  texture: string | null;
}

const props = defineProps<{
  recipe: Recipe;
  textures?: Record<string, string>;
}>();

const recipeTypeLabel = computed(() => {
  const type = props.recipe.type;
  if (type.includes('crafting_shaped')) return 'Shaped Crafting';
  if (type.includes('crafting_shapeless')) return 'Shapeless Crafting';
  if (type.includes('smelting')) return 'Smelting';
  if (type.includes('blasting')) return 'Blasting';
  if (type.includes('smoking')) return 'Smoking';
  if (type.includes('stonecutting')) return 'Stonecutting';
  return type.split(':').pop() || 'Recipe';
});

const gridSlots = computed<GridSlot[]>(() => {
  const slots: GridSlot[] = Array(9).fill(null).map(() => ({ itemId: null, texture: null }));

  if (props.recipe.pattern && props.recipe.key) {
    // Shaped crafting
    const pattern = props.recipe.pattern;
    const key = props.recipe.key;

    for (let row = 0; row < pattern.length && row < 3; row++) {
      const line = pattern[row];
      for (let col = 0; col < line.length && col < 3; col++) {
        const char = line[col];
        if (char !== ' ' && key[char]) {
          const ingredient = key[char];
          const itemId = ingredient.item || ingredient.tag || null;
          slots[row * 3 + col] = {
            itemId,
            texture: itemId ? getTextureForItem(itemId) : null
          };
        }
      }
    }
  } else if (props.recipe.ingredients) {
    // Shapeless crafting
    props.recipe.ingredients.forEach((ingredient, index) => {
      if (index < 9) {
        const ing = Array.isArray(ingredient) ? ingredient[0] : ingredient;
        const itemId = ing?.item || ing?.tag || null;
        slots[index] = {
          itemId,
          texture: itemId ? getTextureForItem(itemId) : null
        };
      }
    });
  }

  return slots;
});

const resultItem = computed(() => {
  const result = props.recipe.result;
  if (typeof result === 'string') return result;
  return result.item;
});

const resultCount = computed(() => {
  const result = props.recipe.result;
  if (typeof result === 'string') return 1;
  return result.count || 1;
});

const resultTexture = computed(() => {
  return getTextureForItem(resultItem.value);
});

function getTextureForItem(itemId: string): string | null {
  if (!props.textures) return null;

  // Essayer de trouver une texture correspondante
  const cleanId = itemId.replace('#', '').replace('minecraft:', '').replace(/^.*:/, '');

  for (const [path, base64] of Object.entries(props.textures)) {
    if (path.includes(cleanId)) {
      return base64;
    }
  }

  return null;
}
</script>

<style scoped>
.crafting-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.crafting-type {
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.crafting-layout {
  display: flex;
  align-items: center;
  gap: 16px;
}

.crafting-grid {
  display: grid;
  grid-template-columns: repeat(3, 36px);
  grid-template-rows: repeat(3, 36px);
  gap: 2px;
  background-color: #8b8b8b;
  padding: 4px;
  border: 2px solid #555;
}

.crafting-slot {
  width: 36px;
  height: 36px;
  background-color: #8b8b8b;
  border: 1px solid #555;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.slot-icon {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
  object-fit: contain;
}

.slot-placeholder {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #666;
  color: #aaa;
  font-size: 14px;
  font-weight: bold;
}

.crafting-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
}

.arrow-icon {
  font-size: 24px;
  color: #888;
}

.crafting-result {
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-slot {
  width: 48px;
  height: 48px;
  background-color: #c6a84b;
  border: 2px solid #8b7635;
}

.result-slot .slot-icon {
  width: 40px;
  height: 40px;
}

.result-count {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 12px;
  font-weight: bold;
  color: #fff;
  text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000;
}
</style>
