<script setup lang="ts">
import { ref } from 'vue';
import IconSend from '~icons/material-symbols/send';
import IconRobot from '~icons/material-symbols/smart-toy';
import IconPerson from '~icons/material-symbols/person';
import IconClose from '~icons/material-symbols/close';
import { useFileManagerStore } from '@/stores/file-manager';

const store = useFileManagerStore();
const message = ref('');

const chatHistory = ref([
    { role: 'assistant', text: 'Hello! I am your LFM assistant. How can I help you manage your files today?' }
]);

function sendMessage() {
    if (!message.value.trim()) return;
    
    chatHistory.value.push({ role: 'user', text: message.value });
    const userMsg = message.value;
    message.value = '';
    
    // Simple mock response
    setTimeout(() => {
        chatHistory.value.push({ 
            role: 'assistant', 
            text: `You asked about "${userMsg}". I am still being integrated with the local filesystem, but soon I will be able to help you organize your directories!` 
        });
    }, 600);
}
</script>

<template>
    <div class="LFM-ai-sidebar">
        <header class="LFM-ai-header">
            <div class="flex items-center gap-2">
                <IconRobot class="text-blue-500 text-xl" />
                <h3 class="font-bold text-sm">LFM Assistant</h3>
            </div>
            <button class="LFM-ai-close" @click="store.toggleAiChat">
                <IconClose />
            </button>
        </header>

        <div class="LFM-ai-messages no-scrollbar">
            <div 
                v-for="(chat, i) in chatHistory" 
                :key="i"
                class="LFM-chat-bubble"
                :class="chat.role === 'user' ? 'LFM-chat-bubble--user' : 'LFM-chat-bubble--assistant'"
            >
                <div class="LFM-chat-icon">
                    <IconPerson v-if="chat.role === 'user'" />
                    <IconRobot v-else />
                </div>
                <div class="LFM-chat-text">
                    {{ chat.text }}
                </div>
            </div>
        </div>

        <footer class="LFM-ai-input-area">
            <div class="LFM-ai-input-wrapper">
                <textarea 
                    v-model="message"
                    placeholder="Ask LFM..."
                    class="LFM-ai-textarea"
                    @keydown.enter.prevent="sendMessage"
                ></textarea>
                <button class="LFM-ai-send" @click="sendMessage">
                    <IconSend />
                </button>
            </div>
        </footer>
    </div>
</template>

<style scoped lang="scss">
@reference "tailwindcss";
.LFM-ai-sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--LFM-panel);
}

.LFM-ai-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--LFM-border);
    background: var(--LFM-bg);
}

.LFM-ai-close {
    cursor: pointer;
    opacity: 0.5;
    transition: opacity 150ms;
    border: none;
    background: transparent;
    color: var(--LFM-text);
    &:hover { opacity: 1; }
}

.LFM-ai-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.LFM-chat-bubble {
    display: flex;
    gap: 10px;
    max-width: 90%;
    
    &--assistant {
        align-self: flex-start;
    }
    
    &--user {
        align-self: flex-end;
        flex-direction: row-reverse;
        
        .LFM-chat-text {
            background: var(--LFM-blue);
            color: white;
            border-bottom-right-radius: 2px;
        }
    }
}

.LFM-chat-icon {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--LFM-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 16px;
    border: 1px solid var(--LFM-border);
}

.LFM-chat-text {
    padding: 10px 14px;
    background: var(--LFM-bg);
    border-radius: 12px;
    font-size: 13px;
    line-height: 1.4;
    @apply shadow-sm;
}

.LFM-ai-input-area {
    padding: 16px;
    border-top: 1px solid var(--LFM-border);
}

.LFM-ai-input-wrapper {
    position: relative;
    background: var(--LFM-bg);
    border: 1px solid var(--LFM-border);
    border-radius: 12px;
    padding: 8px;
    @apply shadow-inner;
}

.LFM-ai-textarea {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    min-height: 40px;
    max-height: 120px;
    padding-right: 40px;
    font-size: 13px;
    color: var(--LFM-text);
}

.LFM-ai-send {
    position: absolute;
    right: 8px;
    bottom: 8px;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--LFM-blue);
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 150ms;
    
    &:hover {
        transform: scale(1.05);
    }
}

.no-scrollbar {
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
}
</style>
