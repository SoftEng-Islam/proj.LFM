import { emit as busEmit } from '@/renderer/events/bus';
import { SHORTCUT_FIELD_ORDER, type ShortcutConfigKey } from '@/schemas/config.schema';
import { useConfigStore } from '@/stores/config';

let keydownHandler: ((event: KeyboardEvent) => void) | null = null;
let wheelHandler: ((event: WheelEvent) => void) | null = null;

type NavigationDirection = 'up' | 'down' | 'left' | 'right';

function navigationPayload(action: ShortcutConfigKey): { direction: NavigationDirection; extend: boolean; keepSelection: boolean } | null {
	switch (action) {
		case 'move_up':
			return { direction: 'up', extend: false, keepSelection: false };
		case 'move_down':
			return { direction: 'down', extend: false, keepSelection: false };
		case 'move_left':
			return { direction: 'left', extend: false, keepSelection: false };
		case 'move_right':
			return { direction: 'right', extend: false, keepSelection: false };
		case 'extend_up':
			return { direction: 'up', extend: true, keepSelection: false };
		case 'extend_down':
			return { direction: 'down', extend: true, keepSelection: false };
		case 'extend_left':
			return { direction: 'left', extend: true, keepSelection: false };
		case 'extend_right':
			return { direction: 'right', extend: true, keepSelection: false };
		case 'focus_up':
			return { direction: 'up', extend: false, keepSelection: true };
		case 'focus_down':
			return { direction: 'down', extend: false, keepSelection: true };
		case 'focus_left':
			return { direction: 'left', extend: false, keepSelection: true };
		case 'focus_right':
			return { direction: 'right', extend: false, keepSelection: true };
		default:
			return null;
	}
}

function isEditableTarget(target: EventTarget | null): boolean {
	const element = target instanceof HTMLElement ? target : null;
	if (!element) return false;
	if (element instanceof HTMLInputElement) return true;
	if (element instanceof HTMLTextAreaElement) return true;
	if (element instanceof HTMLSelectElement) return true;
	return element.isContentEditable;
}

function normalizeKey(key: string): string {
	if (key === ' ') return 'Space';
	if (key === 'Spacebar') return 'Space';
	if (key === 'Esc') return 'Escape';
	if (key.length === 1) return key.toLowerCase();
	return key;
}

function normalizeShortcutBinding(binding: string): string {
	return binding
		.split('+')
		.map((part) => normalizeKey(part.trim()))
		.filter(Boolean)
		.join('+');
}

function eventToShortcut(event: KeyboardEvent): string {
	const parts: string[] = [];
	if (event.ctrlKey) parts.push('Ctrl');
	if (event.altKey) parts.push('Alt');
	if (event.shiftKey) parts.push('Shift');
	if (event.metaKey) parts.push('Meta');
	parts.push(normalizeKey(event.key));
	return parts.join('+');
}

function dispatchShortcut(action: ShortcutConfigKey) {
	const configStore = useConfigStore();

	switch (action) {
		case 'back':
			busEmit('shortcut:back');
			return;
		case 'forward':
			busEmit('shortcut:forward');
			return;
		case 'refresh':
			busEmit('shortcut:refresh');
			return;
		case 'focus_search':
			busEmit('shortcut:focus-search');
			return;
		case 'help':
			busEmit('shortcut:help');
			return;
		case 'rename':
			busEmit('shortcut:rename');
			return;
		case 'toggle_preview':
			busEmit('shortcut:toggle-preview');
			return;
		case 'toggle_ai':
			busEmit('shortcut:toggle-ai');
			return;
		case 'goto_default_path':
			busEmit('shortcut:goto-default-path', configStore.config.behavior.default_path || '/drives');
			return;
		case 'open_settings':
			busEmit('shortcut:open-settings');
			return;
		case 'next_tab':
			busEmit('shortcut:tab-next');
			return;
		case 'previous_tab':
			busEmit('shortcut:tab-prev');
			return;
		case 'increase_icon_size':
			busEmit('shortcut:icons-increase');
			return;
		case 'decrease_icon_size':
			busEmit('shortcut:icons-decrease');
			return;
		case 'select_all':
			busEmit('shortcut:select-all');
			return;
		case 'copy':
			busEmit('shortcut:copy');
			return;
		case 'cut':
			busEmit('shortcut:cut');
			return;
		case 'paste':
			busEmit('shortcut:paste');
			return;
		case 'open_selected':
			busEmit('shortcut:open-selected');
			return;
		case 'delete_selected':
			busEmit('shortcut:delete-selected');
			return;
		case 'clear_or_close':
			busEmit('shortcut:escape');
			return;
		case 'toggle_selection':
			busEmit('shortcut:toggle-selection');
			return;
		case 'toggle_selection_focused':
			busEmit('shortcut:toggle-selection-focused');
			return;
		case 'move_up':
		case 'move_down':
		case 'move_left':
		case 'move_right':
		case 'extend_up':
		case 'extend_down':
		case 'extend_left':
		case 'extend_right':
		case 'focus_up':
		case 'focus_down':
		case 'focus_left':
		case 'focus_right':
			busEmit('shortcut:navigate', navigationPayload(action));
			return;
	}
}

function findMatchingAction(shortcut: string): ShortcutConfigKey | null {
	const shortcuts = useConfigStore().config.shortcuts;

	for (const { key } of SHORTCUT_FIELD_ORDER) {
		const bindings = shortcuts[key];
		if (bindings.some((binding) => normalizeShortcutBinding(binding) === shortcut)) {
			return key;
		}
	}

	return null;
}

export function initShortcuts() {
	if (keydownHandler) return;

	keydownHandler = (event: KeyboardEvent) => {
		if (isEditableTarget(event.target)) return;

		const shortcut = eventToShortcut(event);
		const action = findMatchingAction(shortcut);
		if (!action) return;

		event.preventDefault();
		dispatchShortcut(action);
	};

	wheelHandler = (event: WheelEvent) => {
		if (!event.ctrlKey || isEditableTarget(event.target)) return;
		event.preventDefault();
		busEmit('shortcut:icons-zoom', { deltaY: event.deltaY });
	};

	window.addEventListener('keydown', keydownHandler, { capture: true });
	window.addEventListener('wheel', wheelHandler, { passive: false, capture: true });
}

export function disposeShortcuts() {
	if (keydownHandler) {
		window.removeEventListener('keydown', keydownHandler, { capture: true } as EventListenerOptions);
		keydownHandler = null;
	}

	if (wheelHandler) {
		window.removeEventListener('wheel', wheelHandler, { capture: true } as EventListenerOptions);
		wheelHandler = null;
	}
}

export default { initShortcuts, disposeShortcuts };
