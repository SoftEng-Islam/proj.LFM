<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getDrives } from '@/services/tauri-bridge';
import type { DriveInformation } from '@/services/tauri-bridge';
import { mapDriveInfoToCard } from '@/services/mappers';
import AppLayout from '@/layouts/AppLayout.vue';
import IconHomeStorage from '~icons/material-symbols/home-storage';
import IconHardDrive from '~icons/material-symbols/hard-drive';
import IconHardDisk from '~icons/material-symbols/hard-disk';
import IconStorage from '~icons/material-symbols/storage';
import IconUsb from '~icons/material-symbols/usb';
import IconSdCard from '~icons/material-symbols/sd-card';
import IconDns from '~icons/material-symbols/dns';

const iconComponents: Record<string, any> = {
  root: IconHomeStorage,
  internal: IconHardDrive,
  hdd: IconHardDisk,
  ssd: IconStorage,
  usb: IconUsb,
  external: IconHardDrive,
  sdcard: IconSdCard,
  network: IconDns,
  removable: IconUsb,
};

const iconColors: Record<string, string> = {
  root: 'text-teal-500',
  internal: 'text-slate-500',
  hdd: 'text-amber-600',
  ssd: 'text-emerald-500',
  usb: 'text-blue-500',
  external: 'text-violet-500',
  sdcard: 'text-pink-500',
  network: 'text-cyan-500',
  removable: 'text-blue-500',
};

function getDriveIconComponent(type: string) {
  return iconComponents[type] || IconHardDrive;
}

function getDriveIconColor(type: string) {
  return iconColors[type] || 'text-slate-500';
}

const drives = ref<DriveInformation[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const driveCards = computed(() => drives.value.map(mapDriveInfoToCard));

onMounted(async () => {
  loading.value = true;
  error.value = null;
  try {
    const result = await getDrives();
    drives.value = result.array_of_drives;
  } catch (err) {
    error.value = String(err ?? 'Failed to load drives');
  } finally {
    loading.value = false;
  }
});

function getDriveColor(percent: number): string {
  if (percent < 50) return 'bg-emerald-500';
  if (percent < 80) return 'bg-amber-500';
  return 'bg-rose-500';
}

function getDriveHealth(percent: number): string {
  if (percent < 70) return 'Healthy';
  if (percent < 90) return 'Limited space';
  return 'Critical space';
}
</script>

<template lang="pug">
AppLayout
  div.LFM-drives-page
    .LFM-drives-header
      h1 Storage Overview
      p View available storage on all mounted partitions and drives.

    .LFM-drives-loading(v-if="loading")
      p Loading drives...

    .LFM-drives-error(v-if="error && !loading")
      p {{ error }}

    .LFM-drives-grid(v-if="!loading && !error && driveCards.length > 0")
      RouterLink.LFM-drive-card(v-for="drive in driveCards" :key="drive.id" :to="drive.id")
        .LFM-drive-header
          span.LFM-drive-icon
            component(:is="getDriveIconComponent(drive.driveType)" :class="getDriveIconColor(drive.driveType)")
          .LFM-drive-title
            h2.LFM-drive-name {{ drive.mountName }}
            p.LFM-drive-path {{ drive.devicePath }}
          span.LFM-drive-state(:class="getDriveColor(drive.usedPercent)") {{ getDriveHealth(drive.usedPercent) }}

        .LFM-drive-info
          .LFM-info-row
            span Identifier
            strong {{ drive.id }}
          .LFM-info-row
            span Filesystem
            strong {{ drive.filesystem }}
          .LFM-info-row
            span Mount
            strong {{ drive.isRemovable ? 'Removable' : 'Fixed' }}

        .LFM-drive-usage
          .LFM-usage-label
            span.LFM-usage-used {{ drive.usedLabel }}
            span.LFM-usage-available {{ drive.freeLabel }}
            span.LFM-usage-percent {{ drive.usedPercent }}%

          .LFM-usage-bar
            .LFM-usage-bar-used(
              :style="{ width: `${drive.usedPercent}%` }"
              :class="getDriveColor(drive.usedPercent)"
            )

          .LFM-usage-total
            span {{ drive.capacityLabel }}

    .LFM-drives-empty(v-if="!loading && drives.length === 0 && !error")
      p No drives detected.
</template>

<style scoped lang="sass">
@reference "tailwindcss"

.LFM-drives-page
  display: flex
  flex-direction: column
  gap: 2rem
  padding: 2rem

.LFM-drives-header
  display: flex
  flex-direction: column
  gap: 0.5rem

.LFM-drives-header h1
  font-size: 1.875rem
  font-weight: 700

.LFM-drives-header p
  color: var(--LFM-text-secondary, #888)

.LFM-drives-loading,
.LFM-drives-error,
.LFM-drives-empty
  display: flex
  align-items: center
  justify-content: center
  min-height: 200px
  color: var(--LFM-text-secondary, #888)

.LFM-drives-error
  background: var(--LFM-bg)
  border-radius: 1rem
  color: var(--LFM-error, #d97706)

.LFM-drives-grid
  display: grid
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))
  gap: 1.5rem

.LFM-drive-card
  border: 1px solid var(--LFM-border)
  border-radius: 1rem
  padding: 1.5rem
  background: var(--LFM-panel)
  transition: all 150ms ease
  cursor: pointer

  &:hover
    border-color: var(--LFM-blue)
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1)

.LFM-drive-header
  display: grid
  grid-template-columns: auto minmax(0, 1fr) auto
  align-items: center
  gap: 0.875rem
  margin-bottom: 1rem
  padding-bottom: 1rem
  border-bottom: 1px solid var(--LFM-border)

.LFM-drive-icon
  display: flex
  align-items: center
  justify-content: center
  width: 40px
  height: 40px
  font-size: 28px

.LFM-drive-title
  min-width: 0

.LFM-drive-name
  font-size: 1.125rem
  font-weight: 600
  margin: 0 0 0.25rem 0
  overflow: hidden
  text-overflow: ellipsis
  white-space: nowrap

.LFM-drive-path
  font-size: 0.875rem
  color: var(--LFM-text-secondary, #888)
  margin: 0
  overflow: hidden
  text-overflow: ellipsis
  white-space: nowrap

.LFM-drive-state
  align-self: start
  border-radius: 999px
  color: white
  font-size: 0.6875rem
  font-weight: 700
  line-height: 1
  padding: 0.35rem 0.5rem
  white-space: nowrap

.LFM-drive-info
  display: flex
  flex-direction: column
  gap: 0.5rem
  margin-bottom: 1.5rem
  font-size: 0.875rem

.LFM-info-row
  display: flex
  justify-content: space-between
  gap: 1rem
  padding: 0.25rem 0

  span
    color: var(--LFM-text-secondary, #888)

  strong
    font-weight: 600
    color: var(--LFM-text)
    overflow: hidden
    text-align: right
    text-overflow: ellipsis
    white-space: nowrap

.LFM-drive-usage
  display: flex
  flex-direction: column
  gap: 0.75rem

.LFM-usage-label
  display: flex
  justify-content: space-between
  align-items: center
  font-size: 0.75rem
  color: var(--LFM-text-secondary, #888)

.LFM-usage-used
  font-weight: 600
  color: var(--LFM-text)

.LFM-usage-available
  font-weight: 600
  color: var(--LFM-text)

.LFM-usage-percent
  font-weight: 700
  font-size: 0.875rem

.LFM-usage-bar
  width: 100%
  height: 8px
  background: var(--LFM-bg)
  border-radius: 4px
  overflow: hidden

.LFM-usage-bar-used
  height: 100%
  border-radius: 4px
  transition: width 300ms ease

.LFM-usage-total
  display: flex
  justify-content: center
  font-size: 0.875rem
  font-weight: 600
  color: var(--LFM-text)
</style>
