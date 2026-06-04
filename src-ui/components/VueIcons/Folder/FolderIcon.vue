<script setup lang="ts">
/**
 * FolderIcon Component
 * Dynamically renders folder icons with customizable colors and signs (tags).
 * Data is sourced from ./FolderIconData.ts which contains extracted SVG paths and colors.
 */
import { computed } from 'vue';
import { FOLDER_COLORS, FOLDER_TAGS, FOLDER_TAG_DEFS } from './FolderIconData';

interface Props {
	/** Color theme name (e.g., 'blue', 'red', 'sky') or hex color */
	color?: string;
	/** Tag name (e.g., 'music', 'book', 'android') */
	tag?: string;
	/** Icon size in pixels */
	size?: number | string;
}

const props = withDefaults(defineProps<Props>(), {
	color: 'sky',
	size: 48,
});

/** Resolves the folder color to a hex value */
const hexColor = computed(() => {
	if (props.color?.startsWith('#')) return props.color;
	if (props.color === 'orange' || !props.color) {
		return 'var(--color-primary)';
	}
	return FOLDER_COLORS[props.color as keyof typeof FOLDER_COLORS] || 'var(--color-primary)';
});

/** Retrieves the SVG markup for the tag */
const tagMarkup = computed(() => {
	if (!props.tag) return null;
	return FOLDER_TAGS[props.tag as keyof typeof FOLDER_TAGS] || null;
});

/** Retrieves unique defs needed for the tag (if any) */
const tagDefs = computed(() => {
	if (!props.tag) return null;
	return FOLDER_TAG_DEFS[props.tag as keyof typeof FOLDER_TAG_DEFS] || null;
});
</script>

<template lang="pug">
svg(
	:width="size"
	:height="size"
	viewBox="0 0 48 48"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	class="inline-block align-middle transition-all duration-200 ease-in-out drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:scale-105 hover:drop-shadow-[0_4px_8px_rgba(0,0,0,0.2)]"
)
	defs
		//- Primary Overlay Gradient (Consistent across all folders)
		linearGradient#LFM-folder-overlay(x2="1" y1=".5" y2=".5" gradientTransform="matrix(45 0 0 33.7 1.49 12.8)" gradientUnits="userSpaceOnUse")
			stop(stop-color="#50c9c3" offset="0" style="stop-color:#50c9c3;stop-opacity:0;")
			stop(stop-color="#96deda" offset="0.983" style="stop-color:#ffffff;stop-opacity:0.4;")

		//- Dynamic Tag Defs (Gradients unique to certain signs like gdrive)
		g(v-if="tagDefs" v-html="tagDefs")

	//- Folder Body (The colored background)
	path(
		:fill="hexColor"
		d="M 13.889648 11.469727 L 6.4995117 11.47998 C 5.1595131 11.47998 3.9395499 12.008864 3.0395508 12.859863 C 2.3135515 13.500863 1.5 14.819435 1.5 16.419434 L 1.5 41.519531 C 1.5 44.249529 3.7395145 46.460449 6.4995117 46.460449 L 41.500488 46.460449 C 44.260486 46.460449 46.5 44.249529 46.5 41.519531 L 46.5 21.319336 C 46.5 18.589339 44.260486 16.379883 41.500488 16.379883 L 26.271973 16.388672 C 22.849568 16.260671 20.22115 14.524367 17.519531 12.619629 C 16.620532 11.98763 14.999647 11.469727 13.889648 11.469727 z"
	)

	//- Folder Inner Shadow (Detail layer)
	path(
		fill="#000000"
		fill-opacity="0.2"
		d="m 6.5,11.48 c -1.34,0 -2.56,0.529 -3.46,1.38 -0.6998917,2.126911 0.202267,3.266682 2.23,3.54 h 21.3 C 23,16.3658 20.3,14.58 17.52,12.62 16.621,11.988 15,11.47 13.89,11.47 Z M 2.37,13.65 C 2.36167,13.6621 2.3533,13.674 2.3451,13.6862 2.35325,13.674 2.3618,13.6621 2.37,13.65 Z m -0.202,0.324 c -0.0434,0.0748 -0.085,0.15 -0.124,0.227 0.0396,-0.0785 0.0822,-0.153 0.124,-0.227 z M 1.975,14.345 C 1.9207,14.46 1.871,14.577 1.826,14.697 1.8718,14.576 1.9225,14.459 1.975,14.345 Z M 1.783,14.814 C 1.7384,14.941 1.6999,15.072 1.666,15.203 1.7008,15.07 1.7391,14.94 1.783,14.814 Z m -0.148,0.504 c -0.03,0.129 -0.0522,0.261 -0.0718,0.394 0.02,-0.133 0.0418,-0.266 0.0718,-0.394 z m -0.0981,0.563 c -0.02,0.179 -0.0322,0.361 -0.0322,0.546 -3.73e-4,-0.186 0.012,-0.368 0.0322,-0.546 z"
	)

	//- Folder Glossy Overlay (Creates the gradient look)
	path(
		fill="url(#LFM-folder-overlay)"
		d="m5.27 16.4c-2-0.266-2.92-1.39-2.23-3.54-0.726 0.641-1.54 1.96-1.54 3.56v25.1c0 2.73 2.24 4.94 5 4.94h35c2.76 0 5-2.21 5-4.94v-20.2c0-2.73-2.24-4.94-5-4.94z"
	)

	//- Tag / Sign (The icon inside the folder)
	g(v-if="tagMarkup" v-html="tagMarkup")
</template>