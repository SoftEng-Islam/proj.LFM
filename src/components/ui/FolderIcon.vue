<script setup lang="ts">
defineProps<{
	size?: number;
	open?: boolean;
}>();
</script>

<template>
	<svg
		:width="size ?? 64"
		:height="size ?? 64"
		viewBox="0 0 64 64"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
	>
		<!-- Back panel -->
		<rect x="4" y="18" width="56" height="38" rx="4" fill="#E3A416" />
		<!-- Front panel -->
		<rect x="4" y="24" width="56" height="32" rx="4" fill="#FFC83D" />
		<!-- Top tab -->
		<path d="M4 22C4 19.8 5.8 18 8 18h16l4 6H4V22z" fill="#E3A416" />
		<!-- Highlight stripe -->
		<rect x="4" y="24" width="56" height="6" rx="2" fill="#FFD966" opacity="0.5" />
	</svg>
</template>
