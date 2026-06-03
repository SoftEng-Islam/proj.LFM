<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';

import { useConfigStore } from '@/stores/config';
import { SHORTCUT_FIELD_ORDER, type ShortcutConfigKey } from '@/schemas/config.schema';
import IconClose from '~icons/material-symbols/close';
import IconPalette from '~icons/material-symbols/palette';
import IconTune from '~icons/material-symbols/tune';
import IconKeyboard from '~icons/material-symbols/keyboard';
import IconTerminal from '~icons/material-symbols/terminal';

const emit = defineEmits<{
	(e: 'close'): void;
}>();
const toast = { success: console.log, error: console.error, info: console.log, warning: console.warn };
const store = useConfigStore();

const activeTab = ref('appearance');
const tabs = [
	{ id: 'appearance', label: 'Appearance', icon: IconPalette },
	{ id: 'behavior', label: 'Behavior', icon: IconTune },
	{ id: 'shortcuts', label: 'Shortcuts', icon: IconKeyboard },
	{ id: 'system', label: 'System', icon: IconTerminal },
];

const themes = [
	{ label: 'Dark', value: 'dark' },
	{ label: 'Light', value: 'light' },
	{ label: 'Rose Pine', value: 'lsrosepine' },
	{ label: 'Rose Pine Dark', value: 'lsrosepine-dark' },
	{ label: 'Gruvbox', value: 'lsgrouvbox' },
	{ label: 'Gruvbox Dark', value: 'lsgrouvbox-dark' },
	{ label: 'Nord', value: 'lsnord' },
	{ label: 'Nord Dark', value: 'lsnord-dark' },
	{ label: 'Atom One', value: 'lsatom' },
	{ label: 'Atom One Dark', value: 'lsatom-dark' },
	{ label: 'VSCode', value: 'lsvscode' },
	{ label: 'VSCode Dark', value: 'lsvscode-dark' },
	{ label: 'Cupcake', value: 'cupcake' },
	{ label: 'Cupcake Dark', value: 'cupcake-dark' },
	{ label: 'Valentine', value: 'valentine' },
	{ label: 'Valentine Dark', value: 'valentine-dark' },
	{ label: 'Coffee', value: 'coffee' },
	{ label: 'Coffee Light', value: 'coffee-light' },
];

const accentColors = [
	{ name: 'Orange', id: 'orange', hex: '#d96b26' },
	{ name: 'Yellow', id: 'yellow', hex: '#d9a026' },
	{ name: 'Green', id: 'green', hex: '#26d947' },
	{ name: 'Teal', id: 'teal', hex: '#26bed9' },
	{ name: 'Slate', id: 'slate', hex: '#2682d9' },
	{ name: 'Blue', id: 'blue', hex: '#2677d9' },
	{ name: 'Purple', id: 'purple', hex: '#ac26d9' },
	{ name: 'Pink', id: 'pink', hex: '#d9267d' },
	{ name: 'Red', id: 'red', hex: '#d9263b' },
];

const isDefaultTheme = computed(() => {
	const t = store.config.appearance.theme;
	return t === 'light' || t === 'dark';
});

function setAccent(id: string) {
	store.config.appearance.accent = id;
	store.applyLiveConfig();
}

function closeSettings() {
	emit('close');
}

function shortcutValue(key: ShortcutConfigKey): string {
	return store.config.shortcuts[key].join(', ');
}

function updateShortcut(key: ShortcutConfigKey, value: string) {
	store.config.shortcuts[key] = value
		.split(',')
		.map((entry) => entry.trim())
		.filter(Boolean);
}

function onShortcutInput(key: ShortcutConfigKey, event: Event) {
	const target = event.target as HTMLInputElement | null;
	updateShortcut(key, target?.value ?? '');
}

onMounted(async () => {
	await store.loadConfig();
	if (store.error) {
		toast.error(store.error);
	}
});

const saveSettings = async (): Promise<void> => {
	await store.saveConfig();
	if (store.error) {
		toast.error(store.error);
		return;
	}
	toast.success(store.saveMessage || 'Settings saved');
};
</script>

<template lang="pug">
div.LFM-settings-shell
	.LFM-settings-window
		button.LFM-settings-close(type="button" @click="closeSettings" aria-label="Close settings")
			IconClose

		div.LFM-settings-page
			.LFM-settings-header
				h1 LFM Settings
				p Manage core application configuration and persistence.

			form.LFM-settings-form(@submit.prevent="saveSettings")
				div.LFM-settings-layout
					//- Sidebar Tabs
					aside.LFM-settings-sidebar
						button.LFM-sidebar-tab(
							v-for="tab in tabs"
							:key="tab.id"
							type="button"
							:class="{ 'is-active': activeTab === tab.id }"
							@click="activeTab = tab.id"
						)
							component.LFM-tab-icon(:is="tab.icon")
							span.LFM-tab-label {{ tab.label }}

					//- Content Panel
					main.LFM-settings-content
						//- Tab 1: Appearance
						div.LFM-tab-pane(v-show="activeTab === 'appearance'")
							fieldset.LFM-settings-group
								legend Appearance Settings

								.LFM-control
									label(for="theme") UI Theme
									select#theme(class="select" v-model="store.config.appearance.theme" @change="store.applyLiveConfig()")
										option(v-for="t in themes" :key="t.value" :value="t.value") {{ t.label }}

								.LFM-control
									label Accent Color Palette
									.LFM-accent-list(:class="{ 'is-disabled': !isDefaultTheme }")
										.LFM-accent-item(v-for="color in accentColors" :key="color.id")
											button.LFM-accent-btn(type="button" :style="{ background: color.hex }" :class="{ 'is-active': store.config.appearance.accent === color.id }" @click="setAccent(color.id)" :disabled="!isDefaultTheme")
											span.LFM-accent-name {{ color.name }}
									p.LFM-settings-hint(v-if="!isDefaultTheme") Accent colors are only available for default themes.

								.LFM-control
									label(for="iconSize") Icon size
									select#iconSize(class="select w-full" v-model="store.config.appearance.icon_size" @change="store.applyLiveConfig()")
										option(value="small") Small
										option(value="medium") Medium
										option(value="large") Large
										option(value="extra-large") Extra Large

								.LFM-control
									label(for="fontSize") Font size
									select#fontSize(class="select w-full" v-model="store.config.appearance.font_size" @change="store.applyLiveConfig()")
										option(value="12") 12px
										option(value="14") 14px
										option(value="16") 16px
										option(value="18") 18px
										option(value="18") 20px

								.LFM-control.LFM-checkbox-control
									label
										input(type="checkbox" v-model="store.config.appearance.show_hidden_files" @change="store.applyLiveConfig()")
										span Show hidden files

								.LFM-control
									label(for="hiddenFilesVisualStyle") Hidden files style
									select#hiddenFilesVisualStyle(class="select" v-model="store.config.appearance.hidden_files_visual_style" @change="store.applyLiveConfig()")
										option(value="dimmed") Dimmed
										option(value="normal") Normal
										option(value="blurred") Blurred

						//- Tab 2: Behavior
						div.LFM-tab-pane(v-show="activeTab === 'behavior'")
							fieldset.LFM-settings-group
								legend Behavior Settings

								.LFM-control
									label(for="defaultPath") Default path
									input#defaultPath(type="text" v-model="store.config.behavior.default_path" placeholder="/home/user")

								.LFM-control.LFM-checkbox-control
									label
										input(type="checkbox" v-model="store.config.behavior.confirm_delete")
										span Confirm before delete

								.LFM-control.LFM-checkbox-control
									label
										input(type="checkbox" v-model="store.config.behavior.single_click_open")
										span Single click to open files

								.LFM-control.LFM-checkbox-control
									label
										input(type="checkbox" v-model="store.config.explorer.show_mount_points" @change="store.applyLiveConfig()")
										span Show system mount points

						//- Tab 3: Keyboard Shortcuts
						div.LFM-tab-pane(v-show="activeTab === 'shortcuts'")
							fieldset.LFM-settings-group
								legend Keyboard Shortcuts
								p.LFM-settings-hint Use comma-separated bindings like `Ctrl+PageDown, Ctrl+Shift+ArrowRight`.

								.LFM-control(
									v-for="field in SHORTCUT_FIELD_ORDER"
									:key="field.key"
								)
									label(:for="`shortcut-${field.key}`") {{ field.label }}
									input(
										:id="`shortcut-${field.key}`"
										type="text"
										:value="shortcutValue(field.key)"
										@input="onShortcutInput(field.key, $event)"
									)

						//- Tab 4: System & Advanced
						div.LFM-tab-pane(v-show="activeTab === 'system'")
							fieldset.LFM-settings-group
								legend System Settings

							.LFM-control.LFM-checkbox-control
								label
									input(type="checkbox" v-model="store.config.appearance.window_controls")
									span Show window controls (close/minimize/maximize)

							.LFM-control
								label(for="emulator") Terminal emulator
								input#emulator(type="text" v-model="store.config.terminal.emulator" placeholder="kitty")

				//- Footer Actions
				div(class="flex justify-end border-t-2 border-solid border-(--color-base-300) bg-(--color-base-200) px-5 py-8 gap-4")
					button(type="button" class="bg-(--color-neutral) inline-flex items-center justify-center rounded-xl px-6 py-2.5 text-sm font-semibold cursor-pointer hover:opacity-50")
						span(class="") Reset
					button(type="submit" :disabled="store.isSaving || store.isLoading" class="bg-(--color-primary) inline-flex items-center justify-center rounded-xl px-6 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:opacity-50")
						span(v-if="store.isSaving") Saving...
						span(v-else) Save configuration
</template>

<style scoped>
@reference "tailwindcss";

.LFM-settings-shell {
	position: fixed;
	inset: 0;
	z-index: 40;
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 100%;
	background: rgba(0, 0, 0, 0.5);
	pointer-events: auto;
}

.LFM-settings-window {
	pointer-events: auto;
	position: relative;
	width: min(100%, 820px);
	height: 80vh;
	max-height: 700px;
	display: flex;
	flex-direction: column;
	margin: 0 auto;
	border: 1px solid var(--color-base-300);
	border-radius: 1.5rem;
	background: var(--color-base-100);
	box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08);
	overflow: hidden;
}

.LFM-settings-close {
	position: absolute;
	top: 1.25rem;
	right: 1.25rem;
	width: 2.5rem;
	height: 2.5rem;
	border: 1px solid var(--color-base-300);
	border-radius: 999px;
	background: var(--color-base-200);
	color: var(--color-base-content);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 150ms ease;
	z-index: 10;
}

.LFM-settings-close:hover {
	background: color-mix(in srgb, var(--color-base-content) 6%, transparent);
	border-color: var(--color-primary);
}

.LFM-settings-page {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-height: 0;
}

.LFM-settings-header {
	padding: 2rem 2rem 1.5rem;
	border-bottom: 1px solid var(--color-base-300);
}

.LFM-settings-header h1 {
	font-size: 1.5rem;
	font-weight: 700;
	margin: 0;
}

.LFM-settings-header p {
	margin: 0.5rem 0 0 0;
	color: color-mix(in srgb, var(--color-base-content) 70%, transparent);
}

.LFM-settings-form {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-height: 0;
}

.LFM-settings-layout {
	display: flex;
	flex: 1;
	min-height: 0;
}

.LFM-settings-sidebar {
	width: 220px;
	background: var(--color-base-200);
	border-right: 1px solid var(--color-base-300);
	padding: 1.5rem 1rem;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	overflow-y: auto;
}

.LFM-sidebar-tab {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.75rem 1rem;
	border-radius: 0.75rem;
	border: none;
	background: transparent;
	color: var(--color-base-content);
	font-weight: 500;
	cursor: pointer;
	transition: all 150ms ease;
	text-align: left;
}

.LFM-sidebar-tab:hover {
	background: color-mix(in srgb, var(--color-base-content) 6%, transparent);
}

.LFM-sidebar-tab.is-active {
	background: var(--color-primary);
	color: var(--color-primary-content);
}

.LFM-tab-icon {
	font-size: 1.25rem;
}

.LFM-settings-content {
	flex: 1;
	padding: 1.5rem 2rem;
	overflow-y: auto;
	background: var(--color-base-100);
}

.LFM-settings-group {
	border: 1px solid var(--color-base-300);
	border-radius: 1rem;
	padding: 1.25rem;
	margin-bottom: 1.5rem;
	background: var(--color-base-100);
}

.LFM-settings-group legend {
	font-weight: 700;
	font-size: 1.125rem;
	padding: 0 0.5rem;
	color: var(--color-base-content);
}

.LFM-control {
	display: grid;
	gap: 0.5rem;
	margin-bottom: 1.25rem;
}

.LFM-control:last-child {
	margin-bottom: 0;
}

.LFM-control label {
	font-weight: 600;
	color: var(--color-base-content);
}

.LFM-checkbox-control {
	display: flex;
	align-items: center;
	flex-direction: row;
}

.LFM-checkbox-control label {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
	font-weight: normal;
}

.LFM-checkbox-control label input[type=checkbox] {
	width: 1.25rem;
	height: 1.25rem;
	margin: 0;
	cursor: pointer;
	accent-color: var(--color-primary);
}

.LFM-accent-list {
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	padding: 0.5rem 0;
}

.LFM-accent-list.is-disabled {
	opacity: 0.5;
	pointer-events: none;
}

.LFM-accent-item {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.LFM-accent-btn {
	width: 1.5rem;
	height: 1.5rem;
	border-radius: 999px;
	border: 3px solid transparent;
	cursor: pointer;
	transition: transform 100ms ease;
}

.LFM-accent-btn:hover {
	transform: scale(1.1);
}

.LFM-accent-btn.is-active {
	border-color: var(--color-primary);
	box-shadow: 0 0 0 2px var(--color-base-100), 0 0 0 4px var(--color-primary);
}

.LFM-accent-name {
	font-size: 0.875rem;
}

.LFM-control input[type=text],
.LFM-control select:not(.select) {
	width: 100%;
	padding: 0.75rem 1rem;
	color: var(--color-base-content);
	transition: border-color 150ms ease, box-shadow 150ms ease;
}

.LFM-control input[type=text]:focus,
.LFM-control select:not(.select):focus {
	box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 30%, transparent);
}

.LFM-control input[type=text] {
	@apply rounded-full bg-(--color-primary)/20;
}

.LFM-control select.select {
	width: 100%;
	@apply rounded-full bg-(--color-primary)/20 border-2 border-dashed border-(--color-primary);
	color: var(--color-base-content);

}

.LFM-settings-hint {
	font-size: 0.75rem;
	color: color-mix(in srgb, var(--color-base-content) 60%, transparent);
	margin-top: -0.5rem;
}
</style>
