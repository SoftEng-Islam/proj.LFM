<script setup lang="ts">
import { RecycleScroller } from 'vue-virtual-scroller';
import type { FileEntry } from '@/types/filesystem';

interface Props {
  files: FileEntry[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  open: [file: FileEntry];
}>();

function handleOpen(file: FileEntry) {
  emit('open', file);
}
</script>

<template>
  <RecycleScroller
    class="virtual-file-list"
    :items="props.files"
    :item-size="36"
    key-field="path"
    v-slot="{ item }"
  >
    <div
      class="file-row flex items-center px-3 py-2 cursor-pointer select-none"
      @dblclick="handleOpen(item)"
    >
      <div class="truncate w-full">
        {{ item.name }}
      </div>
    </div>
  </RecycleScroller>
</template>

<style scoped>
.virtual-file-list {
  height: 100%;
  width: 100%;
}

.file-row {
  height: 36px;
}
</style>
