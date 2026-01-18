<template>
  <TooltipProvider>
    <TooltipRoot :delay-duration="0">
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          class="minecraft-tooltip"
          :side-offset="5"
        >
          <slot name="content">{{ content }}</slot>
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>

<script setup lang="ts">
import {
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from 'reka-ui'

defineProps<{
  content?: string
}>()
</script>

<style scoped>
.minecraft-tooltip {
  z-index: 100;
  background-color: rgba(16, 0, 16, 0.94); /* Minecraft tooltip background */
  border: 2px solid;
  border-color: #5000ff #28007f #28007f #5000ff; /* Purple gradient-like border */
  color: #ffffff;
  padding: 4px 8px;
  font-family: 'Minecraft', monospace, sans-serif;
  font-size: 1rem;
  line-height: 1.2;
  text-shadow: 2px 2px #000000;
  box-shadow: 
    4px 4px 4px rgba(0, 0, 0, 0.5),
    inset 2px 2px 0 rgba(255, 255, 255, 0.1);
  pointer-events: none; /* Tooltips usually don't block interactions */
  max-width: 300px;
  word-wrap: break-word;
}
</style>
