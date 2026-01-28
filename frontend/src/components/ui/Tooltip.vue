<template>
  <TooltipProvider>
    <TooltipRoot :delay-duration="0">
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          class="z-50 bg-[#100010f0] border-2 border-t-[#5000ff] border-l-[#5000ff] border-r-[#28007f] border-b-[#28007f] text-white px-2 py-1 font-[var(--font-minecraft)] text-base shadow-[4px_4px_4px_#00000080,inset_2px_2px_0_#ffffff1a] max-w-[300px] break-words pointer-events-none"
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