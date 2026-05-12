<script setup lang="ts">
import { ref, onMounted } from 'vue';

const props = defineProps<{
	isReady: boolean;
}>();

const show = ref(true);
const fadeOut = ref(false);

onMounted(() => {
	// Ensure preloader stays for at least a bit to avoid flickering
	setTimeout(() => {
		if (props.isReady) {
			startFadeOut();
		}
	}, 800);
});

function startFadeOut() {
	fadeOut.value = true;
	setTimeout(() => {
		show.value = false;
	}, 600);
}

// Watch for readiness
import { watch } from 'vue';
watch(() => props.isReady, (ready) => {
	if (ready) {
		startFadeOut();
	}
});
</script>

<template lang="pug">
transition(name="preloader-fade")
	.LFM-preloader(v-if="show" :class="{ 'is-fading': fadeOut }")
		.LFM-preloader-content
			.LFM-logo-wrapper
				.LFM-logo-glow
				.LFM-logo-orb
					span L
					span F
					span M
				.LFM-logo-ring
			
			.LFM-preloader-text
				h1 LFM Explorer
				.LFM-loader-bar
					.LFM-loader-progress
				p Initializing Linux Filesystem...
</template>

<style lang="sass" scoped>
$lfm-blue: #60aaef
$lfm-ease: cubic-bezier(0.2, 1, 0.3, 1)

.LFM-preloader
	position: fixed
	inset: 0
	z-index: 9999
	background: #0a0a0a
	display: flex
	align-items: center
	justify-content: center
	overflow: hidden

.LFM-preloader-content
	display: flex
	flex-direction: column
	align-items: center
	gap: 40px

.LFM-logo-wrapper
	position: relative
	width: 120px
	height: 120px
	display: flex
	align-items: center
	justify-content: center

.LFM-logo-orb
	width: 80px
	height: 80px
	background: linear-gradient(135deg, $lfm-blue 0%, #0067c0 100%)
	border-radius: 28px
	display: flex
	align-items: center
	justify-content: center
	gap: 2px
	font-weight: 900
	font-size: 20px
	color: white
	box-shadow: 0 10px 30px rgba(0, 103, 192, 0.4)
	z-index: 2
	animation: orbPulse 3s ease-in-out infinite

.LFM-logo-glow
	position: absolute
	width: 140px
	height: 140px
	background: $lfm-blue
	filter: blur(50px)
	opacity: 0.3
	border-radius: 50%
	animation: glowPulse 3s ease-in-out infinite

.LFM-logo-ring
	position: absolute
	width: 110px
	height: 110px
	border: 1px solid rgba($lfm-blue, 0.2)
	border-radius: 40px
	animation: rotate 10s linear infinite

.LFM-preloader-text
	display: flex
	flex-direction: column
	align-items: center
	gap: 12px
	text-align: center

	h1
		font-size: 24px
		font-weight: 800
		color: white
		letter-spacing: -0.02em
		margin: 0

	p
		font-size: 13px
		color: #666
		margin: 0
		font-weight: 500

.LFM-loader-bar
	width: 200px
	height: 4px
	background: rgba(255, 255, 255, 0.05)
	border-radius: 2px
	overflow: hidden

.LFM-loader-progress
	width: 40%
	height: 100%
	background: $lfm-blue
	border-radius: 2px
	animation: progressMove 2s infinite ease-in-out

@keyframes orbPulse
	0%, 100%
		transform: scale(1) translateY(0)
	50%
		transform: scale(1.05) translateY(-5px)

@keyframes glowPulse
	0%, 100%
		opacity: 0.2
		transform: scale(1)
	50%
		opacity: 0.4
		transform: scale(1.2)

@keyframes rotate
	from
		transform: rotate(0deg)
	to
		transform: rotate(360deg)

@keyframes progressMove
	0%
		transform: translateX(-100%)
	100%
		transform: translateX(250%)

.preloader-fade-leave-active
	transition: all 600ms $lfm-ease
.preloader-fade-leave-to
	opacity: 0
	transform: scale(1.1)
	filter: blur(20px)

.is-fading
	pointer-events: none
</style>
