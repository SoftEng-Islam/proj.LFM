/**
 * usePanelResize — composable for managing the resizable right-side panels.
 *
 * Handles the details panel and AI chat panel widths, including:
 *  - Min/max constraints
 *  - Combined width reconciliation when both panels are open
 *  - Persisted widths via localStorage
 */

import { nextTick, ref, watch } from 'vue';
import { useStorage } from '@vueuse/core';

// ─── Layout constants ─────────────────────────────────────────────────────────

const NAV_WIDTH = 240;
const MIN_RIGHT_PANEL = 260;
const MAX_RIGHT_PANEL = 720;
const MIN_MAIN_CONTENT = 360;
const DEFAULT_DETAILS_PANEL_WIDTH = 360;
const DEFAULT_AI_CHAT_PANEL_WIDTH = 320;

// ─── Composable ───────────────────────────────────────────────────────────────

export function usePanelResize() {
	const detailsOpen = ref(true);
	const aiChatOpen = ref(false);

	const detailsPanelWidth = useStorage('lfm-details-panel-width', DEFAULT_DETAILS_PANEL_WIDTH);
	const aiChatPanelWidth = useStorage('lfm-ai-chat-panel-width', DEFAULT_AI_CHAT_PANEL_WIDTH);

	/** Maximum combined width for both right panels given the current viewport. */
	function maxCombinedWidth(): number {
		if (typeof window === 'undefined') return MAX_RIGHT_PANEL * 2;
		return Math.max(MIN_RIGHT_PANEL * 2, window.innerWidth - NAV_WIDTH - MIN_MAIN_CONTENT);
	}

	function setDetailsPanelWidth(next: number) {
		const cap = maxCombinedWidth();
		let w = Math.round(Math.min(MAX_RIGHT_PANEL, Math.max(MIN_RIGHT_PANEL, next)));

		if (aiChatOpen.value) {
			w = Math.min(w, cap - Math.max(MIN_RIGHT_PANEL, aiChatPanelWidth.value));
			w = Math.max(MIN_RIGHT_PANEL, w);
		} else {
			w = Math.min(w, Math.max(MIN_RIGHT_PANEL, cap));
		}

		detailsPanelWidth.value = w;
	}

	function setAiChatPanelWidth(next: number) {
		const cap = maxCombinedWidth();
		let w = Math.round(Math.min(MAX_RIGHT_PANEL, Math.max(MIN_RIGHT_PANEL, next)));

		if (detailsOpen.value) {
			w = Math.min(w, cap - Math.max(MIN_RIGHT_PANEL, detailsPanelWidth.value));
			w = Math.max(MIN_RIGHT_PANEL, w);
		} else {
			w = Math.min(w, Math.max(MIN_RIGHT_PANEL, cap));
		}

		aiChatPanelWidth.value = w;
	}

	/** Ensure the combined panel widths stay within the available viewport. */
	function reconcilePanelWidths() {
		if (!detailsOpen.value && !aiChatOpen.value) return;

		if (detailsOpen.value) setDetailsPanelWidth(detailsPanelWidth.value);
		if (aiChatOpen.value) setAiChatPanelWidth(aiChatPanelWidth.value);

		if (detailsOpen.value && aiChatOpen.value) {
			const cap = maxCombinedWidth();
			const sum = detailsPanelWidth.value + aiChatPanelWidth.value;

			if (sum > cap) {
				let over = sum - cap;
				const nextAi = Math.max(MIN_RIGHT_PANEL, aiChatPanelWidth.value - over);
				over -= aiChatPanelWidth.value - nextAi;
				aiChatPanelWidth.value = nextAi;
				if (over > 0) {
					detailsPanelWidth.value = Math.max(MIN_RIGHT_PANEL, detailsPanelWidth.value - over);
				}
			}
		}
	}

	function resetDetailsPanelWidth() {
		detailsPanelWidth.value = DEFAULT_DETAILS_PANEL_WIDTH;
		reconcilePanelWidths();
	}

	function resetAiChatPanelWidth() {
		aiChatPanelWidth.value = DEFAULT_AI_CHAT_PANEL_WIDTH;
		reconcilePanelWidths();
	}

	function toggleDetails() {
		detailsOpen.value = !detailsOpen.value;
	}

	function toggleAiChat() {
		aiChatOpen.value = !aiChatOpen.value;
	}

	// Re-reconcile widths whenever either panel opens or closes
	watch([detailsOpen, aiChatOpen], () => {
		void nextTick(() => reconcilePanelWidths());
	});

	return {
		detailsOpen,
		aiChatOpen,
		detailsPanelWidth,
		aiChatPanelWidth,
		setDetailsPanelWidth,
		setAiChatPanelWidth,
		reconcilePanelWidths,
		resetDetailsPanelWidth,
		resetAiChatPanelWidth,
		toggleDetails,
		toggleAiChat,
	};
}
