<template>
  <div>
    <h2>Examples for {{ namespace }}</h2>
    <p>This is where examples for the mod will be displayed. Content coming soon!</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useRoute } from 'vue-router';

export default defineComponent({
  name: 'ModExamples',
  setup() {
    const route = useRoute();
    const namespace = computed(() => route.params.namespace as string);
    return { namespace };
  }
});
</script>
