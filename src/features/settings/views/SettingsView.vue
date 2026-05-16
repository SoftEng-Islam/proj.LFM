<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useToast } from 'vue-toastification';
import { useConfigStore } from '@/stores/config';
import IconClose from '~icons/material-symbols/close';

const emit = defineEmits<{
	(e: 'close'): void;
}>();
const toast = useToast();
const store = useConfigStore();

const themes = [
	{ label: 'Dark', value: 'dark' },
	{ label: 'Light', value: 'light' },
	{ label: 'Rose Pine', value: 'lsrosepine' },
	{ label: 'Rose Pine Dark', value: 'lsrosepine-dark' },
	{ label: 'Gruvbox', value: 'lsgrouvbox' },
	{ label: 'Gruvbox Dark', value: 'lsgrouvbox-dark' },
	{ label: 'Nord', value: 'lsnord' },
	{ label: 'Nord Dark', value: 'lsnord-dark' },
	{ label: 'Atom One', value: 'lsatom' },
	{ label: 'Atom One Dark', value: 'lsatom-dark' },
	{ label: 'VSCode', value: 'lsvscode' },
	{ label: 'VSCode Dark', value: 'lsvscode-dark' },
	{ label: 'Cupcake', value: 'cupcake' },
	{ label: 'Cupcake Dark', value: 'cupcake-dark' },
	{ label: 'Valentine', value: 'valentine' },
	{ label: 'Valentine Dark', value: 'valentine-dark' },
	{ label: 'Coffee', value: 'coffee' },
	{ label: 'Coffee Light', value: 'coffee-light' },
];

const accentColors = [
	{ name: 'Orange', id: 'orange', hex: '#d96b26' },
	{ name: 'Yellow', id: 'yellow', hex: '#d9a026' },
	{ name: 'Green', id: 'green', hex: '#26d947' },
	{ name: 'Teal', id: 'teal', hex: '#26bed9' },
	{ name: 'Slate', id: 'slate', hex: '#2682d9' },
	{ name: 'Blue', id: 'blue', hex: '#2677d9' },
	{ name: 'Purple', id: 'purple', hex: '#ac26d9' },
	{ name: 'Pink', id: 'pink', hex: '#d9267d' },
	{ name: 'Red', id: 'red', hex: '#d9263b' },
];

const isDefaultTheme = computed(() => {
	const t = store.config.appearance.theme;
	return t === 'light' || t === 'dark';
});

function setAccent(id: string) {
	store.config.appearance.accent = id;
	store.applyLiveConfig();
}

function closeSettings() {
	emit('close');
}

onMounted(async () => {
	await store.loadConfig();
	if (store.error) {
		toast.error(store.error);
	}
});

const saveSettings = async (): Promise<void> => {
	await store.saveConfig();
	if (store.error) {
		toast.error(store.error);
		return;
	}
	toast.success(store.saveMessage || 'Settings saved');
};
</script>

<template lang="pug">
div.LFM-settings-shell
    .LFM-settings-window
      button.LFM-settings-close(type="button" @click="closeSettings" aria-label="Close settings")
        IconClose

      div.LFM-settings-page
        .LFM-settings-header
          h1 LFM Settings
          p Manage core application configuration and persistence.

        form.LFM-settings-form(@submit.prevent="saveSettings")
          fieldset.LFM-settings-group
            legend Appearance
            .LFM-control
              label(for="theme") UI Theme
              select#theme(v-model="store.config.appearance.theme" @change="store.applyLiveConfig()")
                option(v-for="t in themes" :key="t.value" :value="t.value") {{ t.label }}
            .LFM-control
              label Accent Color Palette
              .LFM-accent-list(:class="{ 'is-disabled': !isDefaultTheme }")
                .LFM-accent-item(v-for="color in accentColors" :key="color.id")
                  button.LFM-accent-btn(type="button" :style="{ background: color.hex }" :class="{ 'is-active': store.config.appearance.accent === color.id }" @click="setAccent(color.id)" :disabled="!isDefaultTheme")
                  span.LFM-accent-name {{ color.name }}
              p.LFM-settings-hint(v-if="!isDefaultTheme") Accent colors are only available for default themes.
            .LFM-control
              label(for="iconSize") Icon size
              select#iconSize(v-model="store.config.appearance.icon_size" @change="store.applyLiveConfig()")
                option(value="small") Small (16px)
                option(value="medium") Medium (24px)
                option(value="large") Large (32px)
                option(value="extra-large") Extra Large (48px)
            .LFM-control
              label(for="fontSize") Font size
              select#fontSize(v-model="store.config.appearance.font_size" @change="store.applyLiveConfig()")
                option(value="12") 12px
                option(value="14") 14px
                option(value="16") 16px
                option(value="18") 18px
            .LFM-control
              label
                input(type="checkbox" v-model="store.config.appearance.show_hidden_files" @change="store.applyLiveConfig()")
                | Show hidden files
            .LFM-control
              label
                input(type="checkbox" v-model="store.config.appearance.window_controls")
                | Show window controls (close/minimize/maximize)

          fieldset.LFM-settings-group
            legend Behavior
            .LFM-control
              label(for="defaultPath") Default path
              input#defaultPath(type="text" v-model="store.config.behavior.default_path" placeholder="/home/user")
            .LFM-control
              label
                input(type="checkbox" v-model="store.config.behavior.confirm_delete")
                | Confirm before delete
            .LFM-control
              label
                input(type="checkbox" v-model="store.config.behavior.single_click_open")
                | Single click to open files

          fieldset.LFM-settings-group
            legend Terminal
            .LFM-control
              label(for="emulator") Terminal emulator
              input#emulator(type="text" v-model="store.config.terminal.emulator" placeholder="kitty")

          button.LFM-button(type="submit" :disabled="store.isSaving || store.isLoading")
            | Save configuration
</template>

<style scoped lang="sass">
@reference "tailwindcss";

.LFM-settings-shell
  position: fixed
  inset: 0
  z-index: 40
  display: flex
  justify-content: center
  align-items: center
  width: 100%
  height: 100%
  background: rgba(0, 0, 0, 0.5)
  pointer-events: auto

.LFM-settings-window
  pointer-events: auto
  position: relative
  width: min(100%, 760px)
  margin: 0 auto
  border: 1px solid var(--color-base-300)
  border-radius: 1.5rem
  background: var(--color-base-100)
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08)
  overflow: auto

.LFM-settings-close
  position: absolute
  top: 1rem
  right: 1rem
  width: 2.5rem
  height: 2.5rem
  border: 1px solid var(--color-base-300)
  border-radius: 999px
  background: var(--color-base-200)
  color: var(--color-base-content)
  display: inline-flex
  align-items: center
  justify-content: center
  cursor: pointer
  transition: all 150ms ease

  &:hover
    background: color-mix(in srgb, var(--color-base-content) 6%, transparent)
    border-color: var(--color-primary)

.LFM-settings-page
  display: flex
  flex-direction: column
  gap: 1.5rem
  padding: 2.5rem 2rem 2rem

.LFM-settings-header
  display: flex
  flex-direction: column
  gap: 0.5rem

.LFM-settings-header h1
  font-size: 1.5rem
  font-weight: 700

.LFM-settings-form
  display: grid
  gap: 1.25rem

.LFM-settings-group
  border: 1px solid var(--color-base-300)
  border-radius: 1rem
  padding: 1rem
  background: var(--color-base-100)

.LFM-control
  display: grid
  gap: 0.5rem
  margin-bottom: 1rem

.LFM-control label
  font-weight: 600
  color: var(--color-base-content)

.LFM-accent-list
  display: flex
  flex-wrap: wrap
  gap: 1rem
  padding: 0.5rem 0

  &.is-disabled
    opacity: 0.5
    pointer-events: none

.LFM-accent-item
  display: flex
  align-items: center
  gap: 0.5rem

.LFM-accent-btn
  width: 1.5rem
  height: 1.5rem
  border-radius: 999px
  border: 2px solid transparent
  cursor: pointer
  transition: transform 100ms ease

  &:hover
    transform: scale(1.1)

  &.is-active
    border-color: var(--color-base-content)
    box-shadow: 0 0 0 2px var(--color-base-100), 0 0 0 4px var(--color-primary)

.LFM-accent-name
  font-size: 0.875rem

.LFM-control input,
.LFM-control select
  width: 100%
  padding: 0.75rem 1rem
  border-radius: 0.75rem
  border: 1px solid var(--color-base-300)
  background: var(--color-base-200)
  color: var(--color-base-content)

.LFM-control input[type="checkbox"]
  width: auto
  margin-right: 0.5rem

.LFM-settings-hint
  font-size: 0.75rem
  color: color-mix(in srgb, var(--color-base-content) 60%, transparent)
  margin-top: -0.5rem

.LFM-button
  @apply inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed
</style>
