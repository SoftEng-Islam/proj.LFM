<template lang="pug">
.LFM-font-preview
	.LFM-font-header
		h3.LFM-font-name {{ filename }}
		.LFM-font-info
			span.LFM-font-size {{ formatFileSize(fileSize) }}
			span.LFM-font-type {{ fontType }}

	.LFM-font-display
		.LFM-font-sample(
			:style="{ fontFamily: fontFamily }"
		)
			p.LFM-sample-text(v-for="sample in samples" :key="sample") {{ sample }}

	.LFM-font-metrics(v-if="metrics")
		.LFM-metrics-grid
			.LFM-metric-item
				.LFM-metric-label Family
				.LFM-metric-value {{ metrics.family }}
			.LFM-metric-item
				.LFM-metric-label Style
				.LFM-metric-value {{ metrics.style }}
			.LFM-metric-item
				.LFM-metric-label Weight
				.LFM-metric-value {{ metrics.weight }}
			.LFM-metric-item(v-if="metrics.ascent")
				.LFM-metric-label Ascent
				.LFM-metric-value {{ metrics.ascent }}
			.LFM-metric-item(v-if="metrics.descent")
				.LFM-metric-label Descent
				.LFM-metric-value {{ metrics.descent }}
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

interface Props {
	src: string
	filename: string
	fileSize?: number
}

const props = defineProps<Props>()

const fontFamily = ref('Arial') // fallback
const fontType = ref('')
const metrics = ref<any>(null)

const samples = [
	'The quick brown fox jumps over the lazy dog',
	'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
	'abcdefghijklmnopqrstuvwxyz',
	'0123456789',
	'!@#$%^&*()_+-=[]{}|;:,.<>?',
	'Pack my box with five dozen liquor jugs'
]

const formatFileSize = (bytes?: number) => {
	if (!bytes) return ''
	const units = ['B', 'KB', 'MB', 'GB']
	let size = bytes
	let unitIndex = 0
	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024
		unitIndex++
	}
	return `${size.toFixed(1)} ${units[unitIndex]}`
}

const parseMetrics = async () => {
	try {
		// Load font and extract metrics using CSS Font Loading API
		const fontFace = new FontFace('preview-font', `url(${props.src})`)
		await fontFace.load()

		// Create a canvas to measure font metrics
		const canvas = document.createElement('canvas')
		const ctx = canvas.getContext('2d')!
		ctx.font = '100px preview-font'

		metrics.value = {
			family: fontFace.family,
			style: fontFace.style,
			weight: fontFace.weight,
			ascent: Math.round(ctx.measureText('A').actualBoundingBoxAscent),
			descent: Math.round(ctx.measureText('A').actualBoundingBoxDescent)
		}

		fontFamily.value = 'preview-font'
		fontType.value = props.filename.split('.').pop()?.toUpperCase() || ''
	} catch (error) {
		console.warn('Failed to load font metrics:', error)
		fontType.value = props.filename.split('.').pop()?.toUpperCase() || ''
	}
}

onMounted(() => {
	parseMetrics()
})
</script>

<style lang="sass" scoped>
.LFM-font-preview
	padding: 16px

.LFM-font-header
	display: flex
	justify-content: space-between
	align-items: flex-start
	margin-bottom: 20px

.LFM-font-name
	margin: 0
	font-size: 18px
	font-weight: 600
	color: var(--color-base-content)

.LFM-font-info
	display: flex
	flex-direction: column
	align-items: flex-end
	gap: 4px

.LFM-font-size, .LFM-font-type
	font-size: 12px
	color: color-mix(in srgb, var(--color-base-content) 60%, transparent)

.LFM-font-display
	margin-bottom: 20px

.LFM-font-sample
	padding: 20px
	border: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent)
	border-radius: 8px
	background: var(--color-base-300)

.LFM-sample-text
	margin: 8px 0
	font-size: 24px
	line-height: 1.4
	color: var(--color-base-content)

.LFM-font-metrics
	padding: 16px
	border: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent)
	border-radius: 8px
	background: var(--color-base-300)

.LFM-metrics-grid
	display: grid
	grid-template-columns: repeat(auto-fit, minmax(120px, 1fr))
	gap: 12px

.LFM-metric-item
	display: flex
	flex-direction: column
	gap: 4px

.LFM-metric-label
	font-size: 11px
	font-weight: 600
	color: color-mix(in srgb, var(--color-base-content) 60%, transparent)
	text-transform: uppercase
	letter-spacing: 0.5px

.LFM-metric-value
	font-size: 14px
	font-weight: 500
	color: var(--color-base-content)
	font-family: monospace
</style>
