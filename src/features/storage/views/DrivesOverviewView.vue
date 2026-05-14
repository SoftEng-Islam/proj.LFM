<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getDrives } from '@/services/tauri-bridge';
import type { DriveInformation } from '@/services/tauri-bridge';

const drives = ref<DriveInformation[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

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

function formatBytes(bytes: number): string {
	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	let size = bytes;
	let unitIdx = 0;
	while (size >= 1024 && unitIdx < units.length - 1) {
		size /= 1024;
		unitIdx++;
	}
	return `${size.toFixed(2)} ${units[unitIdx]}`;
}

function getUsagePercent(used: number, total: number): number {
	if (total === 0) return 0;
	return Math.round((used / total) * 100);
}

function getDriveColor(percent: number): string {
	if (percent < 50) return 'bg-emerald-500';
	if (percent < 80) return 'bg-amber-500';
	return 'bg-rose-500';
}
</script>

<template lang="pug">
div.LFM-drives-page
  .LFM-drives-header
    h1 Storage Overview
    p View available storage on all mounted partitions and drives.

  .LFM-drives-loading(v-if="loading")
    p Loading drives...

  .LFM-drives-error(v-if="error && !loading")
    p {{ error }}

  .LFM-drives-grid(v-if="!loading && !error && drives.length > 0")
    .LFM-drive-card(v-for="drive in drives" :key="drive.name")
      .LFM-drive-header
        h2.LFM-drive-name {{ drive.name || drive.mount_point }}
        p.LFM-drive-path {{ drive.mount_point }}

      .LFM-drive-info
        .LFM-info-row
          span Type:
          strong {{ drive.file_system }}
        .LFM-info-row(v-if="!drive.is_removable")
          span Status:
          strong Fixed
        .LFM-info-row(v-else)
          span Status:
          strong Removable

      .LFM-drive-usage
        .LFM-usage-label
          span.LFM-usage-used {{ formatBytes(drive.total_space - drive.available_space) }} used
          span.LFM-usage-available {{ formatBytes(drive.available_space) }} free
          span.LFM-usage-percent {{ getUsagePercent(drive.total_space - drive.available_space, drive.total_space) }}%

        .LFM-usage-bar
          .LFM-usage-bar-used(
            :style="{ width: `${getUsagePercent(drive.total_space - drive.available_space, drive.total_space)}%` }"
            :class="getDriveColor(getUsagePercent(drive.total_space - drive.available_space, drive.total_space))"
          )

        .LFM-usage-total
          span {{ formatBytes(drive.total_space) }} Total

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

  &:hover
    border-color: var(--LFM-blue)
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1)

.LFM-drive-header
  margin-bottom: 1rem
  padding-bottom: 1rem
  border-bottom: 1px solid var(--LFM-border)

.LFM-drive-name
  font-size: 1.125rem
  font-weight: 600
  margin: 0 0 0.25rem 0

.LFM-drive-path
  font-size: 0.875rem
  color: var(--LFM-text-secondary, #888)
  margin: 0

.LFM-drive-info
  display: flex
  flex-direction: column
  gap: 0.5rem
  margin-bottom: 1.5rem
  font-size: 0.875rem

.LFM-info-row
  display: flex
  justify-content: space-between
  padding: 0.25rem 0

  span
    color: var(--LFM-text-secondary, #888)

  strong
    font-weight: 600
    color: var(--LFM-text)

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
