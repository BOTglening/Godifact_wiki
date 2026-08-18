<script setup lang="ts">
import { computed } from 'vue'
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import { layerMetaOf } from '../layers'

const { Layout } = DefaultTheme
const { page, frontmatter } = useData()

const layer = computed(() => {
  const rel = page.value?.relativePath
  return rel ? layerMetaOf(rel) : null
})
</script>

<template>
  <DefaultTheme.Layout>
    <template #doc-before>
      <div
        v-if="layer && frontmatter.layout !== 'home'"
        class="layer-banner"
        :class="`layer-banner-${layer.className}`"
      >
        <span class="lb-tag">{{ layer.title }}</span>
        <span class="lb-desc">{{ layer.desc }}</span>
      </div>
    </template>
    <template #layout-bottom>
      <footer v-if="frontmatter.layout !== 'home'" class="wiki-footer">
        <div class="wiki-footer-inner">
          <span class="wiki-footer-title">神造物 / WORLD ARCHIVE</span>
          <span class="wiki-footer-sep">//</span>
          <span class="wiki-footer-meta">阳光之下，层层真相</span>
          <span class="wiki-footer-sep">//</span>
          <a
            class="wiki-footer-link"
            href="https://vitepress.dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            VITEPRESS
          </a>
        </div>
      </footer>
    </template>
  </DefaultTheme.Layout>
</template>
