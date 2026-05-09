<script setup lang="ts">
import { ref, onMounted } from 'vue';

const props = defineProps<{
    currentName: string;
    show: boolean;
}>();

const emit = defineEmits<{
    close: [];
    submit: [newName: string];
}>();

const newName = ref(props.currentName);
const inputRef = ref<HTMLInputElement>();

onMounted(() => {
    if (inputRef.value) {
        inputRef.value.focus();
        // Select filename without extension if possible
        const lastDot = props.currentName.lastIndexOf('.');
        if (lastDot > 0) {
            inputRef.value.setSelectionRange(0, lastDot);
        } else {
            inputRef.value.select();
        }
    }
});

function handleSubmit() {
    if (newName.value.trim() && newName.value !== props.currentName) {
        emit('submit', newName.value.trim());
    } else {
        emit('close');
    }
}
</script>

<template>
    <div v-if="show" class="LFM-modal-overlay" @click.self="emit('close')">
        <div class="LFM-modal">
            <h3 class="LFM-modal-title">Rename Item</h3>
            <div class="LFM-modal-body">
                <input 
                    ref="inputRef"
                    v-model="newName" 
                    class="LFM-modal-input" 
                    type="text" 
                    @keydown.enter="handleSubmit"
                    @keydown.esc="emit('close')"
                />
            </div>
            <div class="LFM-modal-actions">
                <button class="LFM-modal-btn LFM-modal-btn--secondary" @click="emit('close')">Cancel</button>
                <button class="LFM-modal-btn LFM-modal-btn--primary" @click="handleSubmit">Rename</button>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@reference "tailwindcss";
.LFM-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 10000;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fade-in 200ms ease-out;
}

.LFM-modal {
    background: var(--LFM-panel);
    border: 1px solid var(--LFM-border);
    border-radius: 12px;
    width: 400px;
    padding: 20px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    animation: modal-pop 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.LFM-modal-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--LFM-text);
}

.LFM-modal-input {
    width: 100%;
    background: var(--LFM-input-bg, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--LFM-border);
    border-radius: 6px;
    padding: 8px 12px;
    color: var(--LFM-text);
    font-size: 14px;
    outline: none;
    
    &:focus {
        border-color: var(--LFM-blue);
        box-shadow: 0 0 0 2px rgba(43, 124, 211, 0.2);
    }
}

.LFM-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
}

.LFM-modal-btn {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 150ms ease;
    border: none;

    &--secondary {
        background: transparent;
        color: var(--LFM-text);
        &:hover { background: var(--LFM-hover); }
    }

    &--primary {
        background: var(--LFM-blue);
        color: white;
        &:hover { opacity: 0.9; }
    }
}

@keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes modal-pop {
    from { transform: scale(0.9) translateY(20px); opacity: 0; }
    to { transform: scale(1) translateY(0); opacity: 1; }
}
</style>
