<script setup lang="ts">
import { onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import { useConfigStore } from '@/stores/config';

const toast = useToast();
const store = useConfigStore();

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
div.LFM-settings-page
  .LFM-settings-header
    h1 LFM Settings
    p Manage core application configuration and persistence.

  form.LFM-settings-form(@submit.prevent="saveSettings")
    fieldset.LFM-settings-group
      legend Appearance
      .LFM-control
        label(for="theme") Theme
        select#theme(v-model="store.config.appearance.theme")
          option(value="dark") Dark
          option(value="light") Light
      .LFM-control
        label(for="iconSet") Icon set
        input#iconSet(type="text" v-model="store.config.appearance.icon_set" placeholder="Papirus")
      .LFM-control
        label(for="fontSize") Font size
        input#fontSize(type="number" min="10" max="24" v-model.number="store.config.appearance.font_size")
      .LFM-control
        label
          input(type="checkbox" v-model="store.config.appearance.show_hidden_files")
          | Show hidden files

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

.LFM-settings-page
  display: flex
  flex-direction: column
  gap: 1.5rem
  padding: 1.5rem

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
  border: 1px solid var(--LFM-border)
  border-radius: 1rem
  padding: 1rem
  background: var(--LFM-panel)

.LFM-control
  display: grid
  gap: 0.5rem
  margin-bottom: 1rem

.LFM-control label
  font-weight: 600
  color: var(--LFM-text)

.LFM-control input,
.LFM-control select
  width: 100%
  padding: 0.75rem 1rem
  border-radius: 0.75rem
  border: 1px solid var(--LFM-border)
  background: var(--LFM-bg)
  color: var(--LFM-text)

.LFM-control input[type="checkbox"]
  width: auto
  margin-right: 0.5rem

.LFM-button
  @apply inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed
</style>
