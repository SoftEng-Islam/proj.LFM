import { on as busOn, emit as busEmit } from '@/renderer/events/bus';
import { useConfigStore } from '@/stores/config';

let _keydownHandler: ((e: KeyboardEvent) => void) | null = null;
let _wheelHandler: ((e: WheelEvent) => void) | null = null;

function normalizeKey(e: KeyboardEvent): string {
	const parts: string[] = [];
	if (e.ctrlKey) parts.push('Ctrl');
	if (e.altKey) parts.push('Alt');
	if (e.shiftKey) parts.push('Shift');
	if (e.metaKey) parts.push('Meta');
	parts.push(e.key);
	return parts.join('+');
}

export function initShortcuts() {
	const cfg = useConfigStore();

	if (_keydownHandler) return; // already initialized

	_keydownHandler = (e: KeyboardEvent) => {
		// simple mappings required by notes
		if (e.altKey && e.key === 'ArrowLeft') {
			e.preventDefault();
			busEmit('shortcut:back');
			return;
		}
		if (e.altKey && e.key === 'ArrowRight') {
			e.preventDefault();
			busEmit('shortcut:forward');
			return;
		}

		if (e.key === 'F1') {
			e.preventDefault();
			busEmit('shortcut:help');
			return;
		}
		if (e.key === 'F2') {
			e.preventDefault();
			busEmit('shortcut:rename');
			return;
		}
		if (e.key === 'F3') {
			e.preventDefault();
			busEmit('shortcut:toggle-preview');
			return;
		}
		if (e.key === 'F4') {
			e.preventDefault();
			busEmit('shortcut:toggle-ai');
			return;
		}
		if (e.key === 'F6') {
			e.preventDefault();
			busEmit('shortcut:goto-default-path', cfg.config.behavior.default_path || '@drives');
			return;
		}
		if (e.key === 'F7') {
			e.preventDefault();
			busEmit('shortcut:open-settings');
			return;
		}

		// Tab navigation
		if ((e.ctrlKey && e.key === 'PageDown') || (e.ctrlKey && e.shiftKey && e.key === 'ArrowRight')) {
			e.preventDefault();
			busEmit('shortcut:tab-next');
			return;
		}
		if ((e.ctrlKey && e.key === 'PageUp') || (e.ctrlKey && e.shiftKey && e.key === 'ArrowLeft')) {
			e.preventDefault();
			busEmit('shortcut:tab-prev');
			return;
		}

		// Ctrl + + / - to change icon size
		if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
			e.preventDefault();
			busEmit('shortcut:icons-increase');
			return;
		}
		if (e.ctrlKey && e.key === '-') {
			e.preventDefault();
			busEmit('shortcut:icons-decrease');
			return;
		}
	};

	_wheelHandler = (e: WheelEvent) => {
		if (e.ctrlKey) {
			e.preventDefault();
			busEmit('shortcut:icons-zoom', { deltaY: e.deltaY });
		}
	};

	window.addEventListener('keydown', _keydownHandler, { capture: true });
	window.addEventListener('wheel', _wheelHandler, { passive: false, capture: true });
}

export function disposeShortcuts() {
	if (_keydownHandler) {
		window.removeEventListener('keydown', _keydownHandler, { capture: true } as any);
		_keydownHandler = null;
	}
	if (_wheelHandler) {
		window.removeEventListener('wheel', _wheelHandler as any, { capture: true } as any);
		_wheelHandler = null;
	}
}

export default { initShortcuts, disposeShortcuts };
