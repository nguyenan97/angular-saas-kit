<script setup lang="ts">
/**
 * Draws a ```mermaid block in the browser.
 *
 * The page is built to static HTML, so at build time (and with JavaScript off)
 * the reader gets the diagram's source; once the page is running, Mermaid is
 * loaded on demand and replaces it. Wide diagrams are shown fitted to the
 * column, with a button that opens them at full size.
 */
import { useData } from 'vitepress';
import { computed, nextTick, onMounted, ref, watch } from 'vue';

const props = defineProps<{ code: string }>();

const source = computed(() => decodeURIComponent(props.code));
const title = computed(
  () => /^\s*title\s+(.+)$/m.exec(source.value)?.[1] ?? 'Diagram',
);

const { isDark } = useData();
const svg = ref('');
const failed = ref(false);
const dialog = ref<HTMLDialogElement | null>(null);
const expanded = ref(false);

let counter = 0;
const uid = Math.random().toString(36).slice(2, 8);

async function draw(): Promise<void> {
  try {
    const { default: mermaid } = await import('mermaid');
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: isDark.value ? 'dark' : 'default',
    });
    const result = await mermaid.render(
      `mermaid-${uid}-${counter++}`,
      source.value,
    );
    svg.value = result.svg;
    failed.value = false;
  } catch (error) {
    failed.value = true;
    console.error('Could not draw a Mermaid diagram', error);
  }
}

/** The same drawing at its natural size, for the full-size view. */
const fullSize = computed(() => {
  const box = /viewBox="[-\d.]+ [-\d.]+ ([\d.]+) ([\d.]+)"/.exec(svg.value);
  if (!box) return svg.value;
  return svg.value
    .replace(' width="100%"', ` width="${box[1]}" height="${box[2]}"`)
    .replace(/style="max-width:[^"]*"/, 'style="max-width:none"');
});

async function expand(): Promise<void> {
  expanded.value = true;
  await nextTick();
  dialog.value?.showModal();
}

function collapse(): void {
  dialog.value?.close();
}

onMounted(draw);
watch(isDark, draw);
</script>

<template>
  <figure class="mermaid-diagram" role="group" :aria-label="title">
    <div v-if="svg" class="mermaid-canvas" v-html="svg" />
    <pre v-else :class="{ failed }"><code>{{ source }}</code></pre>

    <button v-if="svg" type="button" class="mermaid-expand" @click="expand">
      View full size
    </button>

    <dialog
      v-if="expanded"
      ref="dialog"
      class="mermaid-dialog"
      :aria-label="title"
      @close="expanded = false"
      @click.self="collapse"
    >
      <button type="button" class="mermaid-close" @click="collapse">
        Close
      </button>
      <div class="mermaid-scroller" v-html="fullSize" />
    </dialog>
  </figure>
</template>
