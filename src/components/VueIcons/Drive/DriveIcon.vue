<script setup lang="ts">
/**
 * DriveIcon Component
 * Renders drive/storage icons for the sidebar with different types
 * such as internal drives, USB, external HDD, SSD, SD cards, etc.
 */
import { computed } from 'vue';
import { DRIVE_COLORS, type DriveType, type DriveColor, DRIVE_STATES } from './DriveIconData';

interface Props {
	/** Drive type (e.g., 'root', 'internal', 'usb', 'external', 'ssd', 'sdcard') */
	type?: DriveType;
	/** Custom color or color name from DRIVE_COLORS */
	color?: DriveColor;
	/** Icon size in pixels */
	size?: number | string;
	/** Mounted state indicator */
	isMounted?: boolean;
	/** Show eject button indicator */
	isEjecting?: boolean;
	/** Show error state */
	hasError?: boolean;
	/** Show transfer/activity animation */
	hasActivity?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	type: 'internal',
	size: 24,
	isMounted: true,
	isEjecting: false,
	hasError: false,
	hasActivity: false,
});

/** Resolves the color to a hex value */
const hexColor = computed(() => {
	if (props.color?.startsWith('#')) return props.color;
	// Map drive type to default color
	const typeColorMap: Record<string, string> = {
		root: 'root',
		internal: 'gray',
		usb: 'usb',
		external: 'external',
		hdd: 'hdd',
		ssd: 'ssd',
		sdcard: 'sdcard',
		network: 'network',
		removable: 'usb',
	};
	const colorKey = props.color || typeColorMap[props.type] || 'gray';
	return DRIVE_COLORS[colorKey as keyof typeof DRIVE_COLORS] || DRIVE_COLORS.gray;
});

/** Get state indicator properties */
const stateIndicator = computed(() => {
	if (props.hasError) return DRIVE_STATES.error;
	if (props.isEjecting) return DRIVE_STATES.ejecting;
	if (!props.isMounted) return DRIVE_STATES.unmounted;
	return DRIVE_STATES.mounted;
});

/** Get SVG paths based on drive type */
const drivePaths = computed(() => {
	// Base drive enclosure path
	const basePath = "M4 6h16c.55 0 1 .45 1 1v12c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1z";
	
	// Type-specific inner details
	const innerPaths: Record<string, string> = {
		root: "M8 9l4-3 4 3v6H8z M10 9v6 M10 12h4", // Root - has partition lines
		internal: "M6 10h12v4H6z", // Internal - simple rectangle
		usb: "M8 9h8v1H8z M8 11h6v1H8z M8 13h4v1H8z", // USB - stacked rectangles
		external: "M6 8h12v8H6z", // External - full enclosure
		ssd: "M8 8l1-1h6l1 1v8l-1 1H9l-1-1z M9 9v6 M9 12h6", // SSD - chip pattern
		sdcard: "M7 7h10v10H7z M9 9h1v1H9z M11 9h1v1H11z", // SD card - contact dots
		network: "M4 9c0-1.1.9-2 2-2h1l1-2h6l1 2h1c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2h-1l-1 2H9l-1-2H7c-1.1 0-2-.9-2-2V9z", // Network - globe-ish
		removable: "M7 7h10v6H7z M9 14h6", // Removable - with eject line
	};
	
	const typeKey = props.type as string;
	return innerPaths[typeKey] || innerPaths.internal;
});
</script>

<template lang="pug">
svg(
	:width="size"
	:height="size"
	viewBox="0 0 24 24"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	class="LFM-drive-icon"
)
	//- Drive enclosure
	path(
		:fill="hexColor"
		d="M4 5c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1H4z"
	)
	
	//- Inner detail/indicator
	path(
		fill="#ffffff"
		fill-opacity="0.9"
		:d="drivePaths"
	)
	
	//- LED indicator
	circle(
		:cx="18"
		:cy="16"
		r="2"
		:fill="stateIndicator.indicator"
		:fill-opacity="stateIndicator.indicatorOpacity"
		class="LFM-drive-indicator"
		:class="{ 'LFM-drive-indicator--active': hasActivity || isEjecting }"
	)

	//- Glossy highlight on top
	path(
		fill="#ffffff"
		fill-opacity="0.15"
		d="M4 6c0-.55.45-1 1-1h4V5c0-.55.45-1 1-1h1c.55 0 1 .45 1 1v1h10c.55 0 1 .45 1 1v3c0 .55-.45 1-1 1H5c-.55 0-1-.45-1-1V6z"
	)
</template>

<style lang="sass" scoped>
.LFM-drive-icon
	display: inline-block
	vertical-align: middle
	transition: transform 0.2s ease-in-out, filter 0.2s ease-in-out

.LFM-drive-indicator
	transition: fill-opacity 0.3s ease

.LFM-drive-indicator--active
	animation: LFM-drive-pulse 1s ease-in-out infinite

.LFM-drive-icon:hover
	transform: scale(1.1)
	filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))

@keyframes LFM-drive-pulse
	0%, 100%
		opacity: 0.45

	50%
		opacity: 1
</style>
