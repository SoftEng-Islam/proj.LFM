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
div.LFM-ai-sidebar
	header.LFM-ai-header
		.LFM-ai-header-brand
			.LFM-ai-header-icon(aria-hidden="true")
				IconRobot.LFM-ai-toolbar-icon.text-blue-500.animate-pulse(:size="20")
			.LFM-ai-header-text
				h3.LFM-ai-title LFM Assistant
				p.LFM-ai-subtitle.text-blue-400 Workspace copilot
		button.LFM-ai-close(type="button" aria-label="Close assistant" @click="store.toggleAiChat")
			IconClose.LFM-ai-toolbar-icon.text-rose-500(:size="20")
	div.LFM-ai-messages(ref="messagesEl" role="log" aria-live="polite" aria-relevant="additions")
		div.LFM-chat-row(
			v-for="(chat, i) in chatHistory"
			:key="i"
			:class="chat.role === 'user' ? 'LFM-chat-row--user' : 'LFM-chat-row--assistant'"
		)
			.LFM-chat-avatar(:class="chat.role === 'user' ? 'LFM-chat-avatar--user shadow-indigo-500/20' : 'LFM-chat-avatar--bot shadow-blue-500/20'")
				IconPerson.LFM-ai-toolbar-icon.text-indigo-500(v-if="chat.role === 'user'" :size="18")
				IconRobot.LFM-ai-toolbar-icon.text-blue-500(v-else :size="18")
			.LFM-chat-bubble(:class="chat.role === 'user' ? 'LFM-chat-bubble--user' : 'LFM-chat-bubble--assistant'")
				p.LFM-chat-text {{ chat.text }}
	footer.LFM-ai-footer
		.LFM-ai-composer
			textarea.LFM-ai-textarea(
				v-model="message"
				placeholder="Ask about files, paths, or organization…"
				rows="1"
				aria-label="Message to assistant"
				@keydown="onComposerKeydown"
			)
			button.LFM-ai-send(type="button" aria-label="Send message" :disabled="!message.trim()" @click="sendMessage")
				IconSend.LFM-ai-toolbar-icon.text-white(:size="20")
		p.LFM-ai-hint
			kbd Enter
			|  to send · 
			kbd Shift
			|  + 
			kbd Enter
			|  for new line
</template>

<style lang="sass" scoped>
@reference "tailwindcss"

.LFM-ai-sidebar
	display: flex
	flex-direction: column
	height: 100%
	min-height: 0
	background: var(--LFM-ai-pane-bg)
	font-size: 12px
	color: var(--LFM-text)

.LFM-ai-toolbar-icon
	font-size: 20px
	flex-shrink: 0

.LFM-ai-header
	display: flex
	align-items: center
	justify-content: space-between
	gap: 8px
	min-height: 44px
	padding: 0 12px
	border-bottom: 1px solid var(--LFM-border)
	background: var(--LFM-ai-pane-bg)

.LFM-ai-header-brand
	display: flex
	align-items: center
	gap: 12px
	min-width: 0

.LFM-ai-header-icon
	flex-shrink: 0
	width: 34px
	height: 34px
	border-radius: 6px
	display: flex
	align-items: center
	justify-content: center
	color: var(--LFM-blue)
	background: var(--LFM-panel)
	border: 1px solid var(--LFM-border)

.LFM-ai-header-text
	min-width: 0

.LFM-ai-title
	margin: 0
	font-size: 13px
	font-weight: 600
	color: var(--LFM-text)
	line-height: 1.2

.LFM-ai-subtitle
	margin: 2px 0 0
	font-size: 11px
	font-weight: 500
	color: var(--LFM-text-muted)

.LFM-ai-close
	display: flex
	align-items: center
	justify-content: center
	width: 34px
	height: 34px
	border: none
	border-radius: 10px
	background: transparent
	color: var(--LFM-text-muted)
	cursor: pointer
	transition: background 150ms ease, color 150ms ease

	&:hover
		background: var(--LFM-active)
		color: var(--LFM-text)

	&:focus-visible
		outline: 2px solid var(--LFM-blue)
		outline-offset: 2px

	&:active
		transform: scale(0.96)

.LFM-ai-messages
	flex: 1
	min-height: 0
	overflow-y: auto
	overflow-x: hidden
	padding: 10px 8px 12px
	display: flex
	flex-direction: column
	gap: 10px
	scrollbar-gutter: stable

	&::-webkit-scrollbar
		width: 6px

	&::-webkit-scrollbar-thumb
		border-radius: 3px
		background: rgba(100, 100, 100, 0.35)

	&::-webkit-scrollbar-track
		background: transparent

	scrollbar-width: thin
	scrollbar-color: rgba(100, 100, 100, 0.35) transparent

.LFM-chat-row
	display: flex
	align-items: flex-end
	gap: 10px
	max-width: 100%

	&--assistant
		align-self: flex-start
		flex-direction: row

	&--user
		align-self: flex-end
		flex-direction: row-reverse

.LFM-chat-avatar
	flex-shrink: 0
	width: 28px
	height: 28px
	border-radius: 6px
	display: flex
	align-items: center
	justify-content: center
	border: 1px solid var(--LFM-border)
	background: var(--LFM-panel)
	color: var(--LFM-text-muted)

	&--bot
		color: var(--LFM-blue)

	&--user
		color: var(--LFM-text)
		background: var(--LFM-item-bg)

.LFM-chat-bubble
	max-width: min(100%, min(28rem, calc(100% - 2.75rem)))
	border-radius: 8px
	position: relative

	&--assistant
		background: var(--LFM-panel)
		border: 1px solid var(--LFM-border)

	&--user
		background: var(--LFM-blue)
		color: #fff
		border: 1px solid var(--LFM-blue)

.LFM-chat-text
	margin: 0
	padding: 8px 10px
	font-size: 12px
	line-height: 1.45
	font-weight: 500

.LFM-ai-footer
	padding: 8px 8px 10px
	border-top: 1px solid var(--LFM-border)
	background: var(--LFM-ai-pane-bg)

.LFM-ai-composer
	position: relative
	display: flex
	align-items: flex-end
	gap: 6px
	padding: 4px 4px 4px 10px
	background: var(--LFM-panel)
	border: 1px solid var(--LFM-border)
	border-radius: 8px
	transition: border-color 150ms ease, box-shadow 150ms ease

	&:focus-within
		border-color: var(--LFM-blue)
		box-shadow: 0 0 0 2px var(--LFM-blue-subtle)

.LFM-ai-textarea
	flex: 1
	min-width: 0
	min-height: 40px
	max-height: 120px
	padding: 8px 40px 8px 0
	background: transparent
	border: none
	outline: none
	resize: none
	font-size: 12px
	line-height: 1.45
	color: var(--LFM-text)
	font-family: inherit

	&::placeholder
		color: var(--LFM-text-muted)
		opacity: 0.75

.LFM-ai-send
	flex-shrink: 0
	align-self: flex-end
	width: 34px
	height: 34px
	margin: 2px 2px 2px 0
	border-radius: 6px
	background: var(--LFM-blue)
	color: #fff
	border: none
	cursor: pointer
	display: flex
	align-items: center
	justify-content: center
	transition: background 150ms ease, opacity 150ms ease

	&:hover:not(:disabled)
		background: color-mix(in srgb, var(--LFM-blue) 88%, #000)

	&:active:not(:disabled)
		background: color-mix(in srgb, var(--LFM-blue) 78%, #000)

	&:focus-visible
		outline: 2px solid var(--LFM-blue)
		outline-offset: 2px

	&:disabled
		opacity: 0.38
		cursor: not-allowed

.LFM-ai-hint
	margin: 6px 2px 0
	font-size: 11px
	font-weight: 500
	color: var(--LFM-text-muted)
	line-height: 1.4

	kbd
		display: inline-block
		padding: 1px 5px
		border-radius: 4px
		font-size: 9px
		font-family: ui-monospace, monospace
		background: var(--LFM-active)
		border: 1px solid var(--LFM-border)
		color: var(--LFM-text-muted)
</style>
