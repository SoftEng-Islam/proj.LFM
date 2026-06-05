<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import IconSend from '~icons/material-symbols/send';
import IconRobot from '~icons/material-symbols/smart-toy';
import IconPerson from '~icons/material-symbols/person';
import IconClose from '~icons/material-symbols/close';
import { useFileManagerStore } from '@/stores/file-manager';

const store = useFileManagerStore();
const message = ref('');
const messagesEl = ref<HTMLElement | null>(null);

type ChatMessage = { role: 'user' | 'assistant'; text: string };

/** Static onboarding copy until the assistant backend is connected. */
const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
	role: 'assistant',
	text: 'Hello! I am your LFM assistant. How can I help you manage your files today?'
};

const chatHistory = ref<ChatMessage[]>([{ ...INITIAL_ASSISTANT_MESSAGE }]);

async function scrollToBottom() {
	await nextTick();
	const el = messagesEl.value;
	if (!el) return;
	el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
}

watch(
	() => chatHistory.value.length,
	() => {
		void scrollToBottom();
	}
);

function sendMessage() {
	const text = message.value.trim();
	if (!text) return;
	chatHistory.value.push({ role: 'user', text });
	message.value = '';
}

function onComposerKeydown(e: KeyboardEvent) {
	if (e.key !== 'Enter' || e.shiftKey) return;
	e.preventDefault();
	sendMessage();
}
</script>

<template lang="pug">
div(class="flex flex-col h-full min-h-0 bg-base-300 text-[12px] text-base-content")
	header(class="flex items-center justify-between gap-2 min-h-11 px-3 border-b border-base-content/10 bg-base-300")
		div(class="flex items-center gap-3 min-w-0")
			div(class="shrink-0 w-8.5 h-8.5 rounded-md flex items-center justify-center text-primary bg-base-100 border border-base-content/10" aria-hidden="true")
				IconRobot(class="text-[20px] shrink-0 text-blue-500 animate-pulse" :size="20")
			div(class="min-w-0")
				h3(class="m-0 text-[13px] font-semibold text-base-content leading-[1.2]") LFM Assistant
				p(class="mt-0.5 text-[11px] font-medium text-blue-400") Workspace copilot
		button(class="flex items-center justify-center w-8.5 h-8.5 border-none rounded-[10px] bg-transparent text-base-content/60 cursor-pointer transition-all duration-150 hover:bg-base-content/10 hover:text-base-content focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 active:scale-95" type="button" aria-label="Close assistant" @click="store.toggleAiChat")
			IconClose(class="text-[20px] shrink-0 text-rose-500" :size="20")
	div(class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2.5 pb-3 flex flex-col gap-2.5 scrollbar-gutter-stable [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-[3px] [&::-webkit-scrollbar-thumb]:bg-[rgba(100,100,100,0.35)] [&::-webkit-scrollbar-track]:bg-transparent" ref="messagesEl" role="log" aria-live="polite" aria-relevant="additions")
		div(
			v-for="(chat, i) in chatHistory"
			:key="i"
			class="flex items-end gap-2.5 max-w-full"
			:class="chat.role === 'user' ? 'self-end flex-row-reverse' : 'self-start flex-row'"
		)
			div(class="shrink-0 w-7 h-7 rounded-md flex items-center justify-center border border-base-content/10 bg-base-100 text-base-content/60" :class="chat.role === 'user' ? 'text-base-content bg-base-100 shadow-indigo-500/20' : 'text-primary shadow-blue-500/20'")
				IconPerson(class="text-[20px] shrink-0 text-indigo-500" v-if="chat.role === 'user'" :size="18")
				IconRobot(class="text-[20px] shrink-0 text-blue-500" v-else :size="18")
			div(class="max-w-[min(100%,min(28rem,100%-2.75rem))] rounded-lg relative" :class="chat.role === 'user' ? 'bg-primary text-white border border-primary' : 'bg-base-100 border border-base-content/10'")
				p(class="m-0 py-2 px-2.5 text-[12px] leading-[1.45] font-medium") {{ chat.text }}
	footer(class="px-2 py-2 pb-2.5 border-t border-base-content/10 bg-base-300")
		div(class="relative flex items-end gap-1.5 p-1 pl-2.5 bg-base-100 border border-base-content/10 rounded-lg transition-all duration-150 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/12")
			textarea(
				class="flex-1 min-w-0 min-h-10 max-h-30 py-2 pr-10 bg-transparent border-none outline-none resize-none text-[12px] leading-[1.45] text-base-content placeholder:text-base-content/60 placeholder:opacity-75"
				v-model="message"
				placeholder="Ask about files, paths, or organization…"
				rows="1"
				aria-label="Message to assistant"
				@keydown="onComposerKeydown"
			)
			button(class="shrink-0 self-end w-8.5 h-8.5 m-0.5 mr-0 rounded-md bg-primary text-white border-none cursor-pointer flex items-center justify-center transition-all duration-150 hover:bg-[color-mix(in_srgb,var(--color-primary)_88%,#000)] active:bg-[color-mix(in_srgb,var(--color-primary)_78%,#000)] focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:opacity-38 disabled:cursor-not-allowed" type="button" aria-label="Send message" :disabled="!message.trim()" @click="sendMessage")
				IconSend(class="text-[20px] shrink-0 text-white" :size="20")
		p(class="mt-1.5 mx-0.5 text-[11px] font-medium text-base-content/60 leading-[1.4] [&>kbd]:inline-block [&>kbd]:px-1.25 [&>kbd]:py-px [&>kbd]:rounded-sm [&>kbd]:text-[9px] [&>kbd]:font-mono [&>kbd]:bg-base-content/10 [&>kbd]:border [&>kbd]:border-base-content/10 [&>kbd]:text-base-content/60")
			kbd Enter
			|  to send ·
			kbd Shift
			|  +
			kbd Enter
			|  for new line
</template>
