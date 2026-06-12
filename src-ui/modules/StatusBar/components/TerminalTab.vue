<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { runTerminalCommand } from '@/services/tauri-bridge';

const props = defineProps<{ cwd: string }>();
const terminalContainer = ref<HTMLDivElement | null>(null);
let terminal: Terminal | null = null;
let inputBuffer = '';

function prompt() {
	terminal?.write('\r\n$ ');
}

function clearTerminal() {
	terminal?.clear();
}

function writeOutput(text: string) {
	if (!terminal) return;
	terminal.write(text.replace(/\n/g, '\r\n'));
}

async function executeCurrentLine() {
	const command = inputBuffer.trim();
	inputBuffer = '';

	if (!terminal) {
		return;
	}

	writeOutput('\r\n');

	if (command.length === 0) {
		prompt();
		return;
	}

	if (command === 'clear') {
		clearTerminal();
		prompt();
		return;
	}

	writeOutput(`$ ${command}\r\n`);
	try {
		const result = await runTerminalCommand(props.cwd, command);
		if (result.stdout.length > 0) {
			writeOutput(result.stdout);
		}
		if (result.stderr.length > 0) {
			writeOutput(result.stderr);
		}
	} catch (error) {
		writeOutput(`Error: ${String(error)}\r\n`);
	}

	prompt();
}

onMounted(() => {
	terminal = new Terminal({ cursorBlink: true, cursorStyle: 'bar', cursorWidth: 3, fontFamily: 'monospace', allowTransparency: true, theme: { background: 'transparent' } });

	if (terminalContainer.value) {
		terminal.open(terminalContainer.value);
	}
	terminal.focus();

	writeOutput(`Connected to ${props.cwd || 'shell'}\r\nType \"clear\" to reset the terminal.\r\n`);
	prompt();

	terminal.onKey(({ key, domEvent }: { key: string; domEvent: KeyboardEvent }) => {
		if (!terminal) return;

		const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

		if (domEvent.key === 'Enter') {
			executeCurrentLine();
			return;
		}

		if (domEvent.key === 'Backspace') {
			if (inputBuffer.length > 0) {
				inputBuffer = inputBuffer.slice(0, -1);
				terminal.write('\b \b');
			}
			return;
		}

		if (domEvent.key === 'c' && domEvent.ctrlKey) {
			inputBuffer = '';
			writeOutput('^C\r\n');
			prompt();
			return;
		}

		if (printable && key.length > 0) {
			inputBuffer += key;
			terminal.write(key);
		}
	});
});

onBeforeUnmount(() => {
	terminal?.dispose();
	terminal = null;
});
</script>

<template lang="pug">
div(class="h-full w-full text-(--color-base-content) font-mono text-sm" ref="terminalContainer")
</template>
<style>
.xterm,
.xterm .xterm-viewport {
	background: transparent !important;
}
</style>
