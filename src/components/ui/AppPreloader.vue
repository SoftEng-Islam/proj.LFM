<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

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
watch(() => props.isReady, (ready) => {
	if (ready) {
		startFadeOut();
	}
});
</script>

<template lang="pug">
transition(name="preloader-fade")
	.LFM-preloader(v-if="show" :class="{ 'is-fading': fadeOut }")
		//- Glowing background gradients
		.LFM-bg-glow.glow-primary
		.LFM-bg-glow.glow-secondary
		
		//- Perspective Grid Floor
		.LFM-grid-floor
		
		.LFM-preloader-content
			//- Beautiful 3D Animation Space
			.LFM-animation-space
				//- Perspective grid/radar scanner
				.LFM-radar-circle
				
				//- Orbiting items
				.LFM-orbit-container
					//- Orbit 1: Clockwise, Inner
					.LFM-orbit.orbit-1
						.LFM-orbit-item.item-folder
							.LFM-orbit-icon.icon-folder
								svg(viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")
									path(d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8")
								span.icon-label Folders
						.LFM-orbit-item.item-database
							.LFM-orbit-icon.icon-database
								svg(viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")
									ellipse(cx="12" cy="5" rx="9" ry="3" fill="rgba(167, 139, 250, 0.2)" stroke="#a78bfa")
									path(d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" stroke="#a78bfa")
									path(d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" stroke="#a78bfa")
								span.icon-label Drives

					//- Orbit 2: Counter-Clockwise, Outer
					.LFM-orbit.orbit-2
						.LFM-orbit-item.item-code
							.LFM-orbit-icon.icon-code
								svg(viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")
									path(d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="rgba(52, 211, 153, 0.2)" stroke="#34d399")
									polyline(points="14 2 14 8 20 8" stroke="#34d399")
									polyline(points="8 13 6 15 8 17" stroke="#34d399")
									polyline(points="16 13 18 15 16 17" stroke="#34d399")
									line(x1="13" y1="13" x2="11" y2="17" stroke="#34d399")
								span.icon-label Source
						.LFM-orbit-item.item-image
							.LFM-orbit-icon.icon-image
								svg(viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")
									rect(x="3" y="3" width="18" height="18" rx="2" ry="2" fill="rgba(251, 191, 36, 0.2)" stroke="#fbbf24")
									circle(cx="8.5" cy="8.5" r="1.5" fill="#fbbf24" stroke="#fbbf24")
									polyline(points="21 15 16 10 5 21" stroke="#fbbf24")
								span.icon-label Media

				//- Central hard drive/disk stack
				.LFM-central-drive
					svg.LFM-drive-svg(viewBox="0 0 200 200" width="160" height="160")
						defs
							linearGradient#driveBody(x1="0%" y1="0%" x2="100%" y2="100%")
								stop(offset="0%" stop-color="#1e293b")
								stop(offset="100%" stop-color="#0f172a")
							linearGradient#platterGrad(x1="0%" y1="0%" x2="100%" y2="100%")
								stop(offset="0%" stop-color="#60a5fa")
								stop(offset="50%" stop-color="#2563eb")
								stop(offset="100%" stop-color="#1d4ed8")
							linearGradient#platterEdge(x1="0%" y1="0%" x2="0%" y2="100%")
								stop(offset="0%" stop-color="#2563eb")
								stop(offset="100%" stop-color="#0f172a")
							filter#neonGlow(x="-20%" y="-20%" width="140%" height="140%")
								feGaussianBlur(stdDeviation="4" result="blur")
								feComposite(in="SourceGraphic" in2="blur" operator="over")

						//- Drive Case Base (Isometric)
						path(d="M 40 140 L 100 170 L 160 140 L 160 100 L 100 70 L 40 100 Z" fill="url(#driveBody)" stroke="#3b82f6" stroke-opacity="0.4" stroke-width="1.5")
						path(d="M 40 140 L 40 150 L 100 180 L 160 150 L 160 140 L 100 170 Z" fill="#0f172a" stroke="#3b82f6" stroke-opacity="0.4" stroke-width="1.5")

						//- Platter 3 (Bottom)
						g.platter-group.bottom-platter
							path(d="M 50 120 A 50 18 0 0 0 150 120 L 150 126 A 50 18 0 0 1 50 126 Z" fill="url(#platterEdge)")
							ellipse(cx="100" cy="120" rx="50" ry="18" fill="url(#platterGrad)" stroke="#60a5fa" stroke-opacity="0.5" stroke-width="0.5")
							ellipse(cx="100" cy="120" rx="10" ry="3.6" fill="#0f172a")

						//- Platter 2 (Middle)
						g.platter-group.middle-platter
							path(d="M 50 102 A 50 18 0 0 0 150 102 L 150 108 A 50 18 0 0 1 50 108 Z" fill="url(#platterEdge)")
							ellipse(cx="100" cy="102" rx="50" ry="18" fill="url(#platterGrad)" stroke="#60a5fa" stroke-opacity="0.5" stroke-width="0.5")
							ellipse(cx="100" cy="102" rx="10" ry="3.6" fill="#0f172a")

						//- Platter 1 (Top)
						g.platter-group.top-platter
							path(d="M 50 84 A 50 18 0 0 0 150 84 L 150 90 A 50 18 0 0 1 50 90 Z" fill="url(#platterEdge)")
							ellipse(cx="100" cy="84" rx="50" ry="18" fill="url(#platterGrad)" stroke="#93c5fd" stroke-opacity="0.8" stroke-width="0.7")
							ellipse(cx="100" cy="84" rx="10" ry="3.6" fill="#0a0f1d")
							ellipse.disk-track(cx="100" cy="84" rx="40" ry="14.4" fill="none" stroke="#93c5fd" stroke-width="0.5" stroke-dasharray="10 5" opacity="0.6")
							ellipse.disk-track-fast(cx="100" cy="84" rx="28" ry="10" fill="none" stroke="#93c5fd" stroke-width="0.5" stroke-dasharray="25 8" opacity="0.8")

						//- Spindle Shaft
						path(d="M 97 75 L 103 75 L 103 130 L 97 130 Z" fill="#64748b" opacity="0.9")
						ellipse(cx="100" cy="75" rx="3" ry="1" fill="#94a3b8")

						//- Actuator Arm
						g.actuator-arm
							ellipse(cx="135" cy="74" rx="8" ry="4" fill="#475569" stroke="#64748b" stroke-width="0.5")
							ellipse(cx="135" cy="73" rx="5" ry="2.5" fill="#334155")
							path(d="M 135 73 L 102 83 L 104 86 L 137 75 Z" fill="#94a3b8" stroke="#475569" stroke-width="0.5")
							circle(cx="102" cy="83.5" r="2.5" fill="#60a5fa" filter="url(#neonGlow)" class="actuator-led")

						//- Status LEDs
						circle(cx="65" cy="150" r="2" fill="#22c55e" class="led-blink-green")
						circle(cx="73" cy="154" r="2" fill="#3b82f6" class="led-blink-blue")
						circle(cx="81" cy="158" r="2" fill="#ef4444" class="led-blink-red")

					//- Scanning beam line
					.LFM-scanner-beam

			//- Preloader Text & Progress
			.LFM-preloader-text
				h1 LFM Explorer
				.LFM-loader-bar
					.LFM-loader-progress
				p Initializing Linux Filesystem...
</template>

<style lang="sass" scoped>
@reference "tailwindcss"

$lfm-blue: #60aaef
$lfm-cyan: #38bdf8
$lfm-violet: #a78bfa
$lfm-emerald: #34d399
$lfm-ease: cubic-bezier(0.2, 1, 0.3, 1)

.LFM-preloader
	position: fixed
	inset: 0
	z-index: 9999
	background: #06080f
	display: flex
	align-items: center
	justify-content: center
	overflow: hidden
	font-family: 'Inter', 'Outfit', sans-serif

// Ambient glows
.LFM-bg-glow
	position: absolute
	border-radius: 50%
	filter: blur(120px)
	opacity: 0.15
	pointer-events: none
	z-index: 1

	&.glow-primary
		width: 400px
		height: 400px
		background: $lfm-blue
		top: -100px
		left: -100px
		animation: floatGlow 10s ease-in-out infinite alternate

	&.glow-secondary
		width: 500px
		height: 500px
		background: $lfm-violet
		bottom: -150px
		right: -150px
		animation: floatGlow 12s ease-in-out infinite alternate-reverse

@keyframes floatGlow
	0%
		transform: translate(0, 0) scale(1)
	100%
		transform: translate(50px, 40px) scale(1.1)

// Grid Floor
.LFM-grid-floor
	position: absolute
	bottom: -10%
	left: 50%
	transform: translateX(-50%) rotateX(75deg)
	width: 250%
	height: 120%
	background-image: linear-gradient(rgba($lfm-blue, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba($lfm-blue, 0.08) 1px, transparent 1px)
	background-size: 50px 50px
	background-position: center
	mask-image: radial-gradient(ellipse at center, black 10%, transparent 60%)
	opacity: 0.7
	z-index: 1
	pointer-events: none

.LFM-preloader-content
	position: relative
	z-index: 10
	display: flex
	flex-direction: column
	align-items: center
	gap: 25px
	width: 100%
	max-width: 500px
	padding: 20px

// 3D Space
.LFM-animation-space
	position: relative
	width: 320px
	height: 220px
	display: flex
	align-items: center
	justify-content: center
	transform-style: preserve-3d

.LFM-radar-circle
	position: absolute
	width: 190px
	height: 80px
	border: 1.5px solid rgba($lfm-blue, 0.25)
	border-radius: 50%
	transform: rotateX(60deg) translateY(20px)
	background: radial-gradient(circle, rgba($lfm-blue, 0.05) 0%, transparent 80%)
	animation: radarPulse 3s ease-in-out infinite
	pointer-events: none

@keyframes radarPulse
	0%, 100%
		transform: rotateX(60deg) translateY(20px) scale(0.9)
		opacity: 0.3
	50%
		transform: rotateX(60deg) translateY(20px) scale(1.1)
		opacity: 0.8

// Drive Styles
.LFM-central-drive
	position: relative
	z-index: 5
	transform-style: preserve-3d
	animation: driveFloat 2.5s ease-in-out infinite alternate

@keyframes driveFloat
	0%
		transform: translateY(0)
	100%
		transform: translateY(-8px)

.LFM-drive-svg
	filter: drop-shadow(0 15px 25px rgba(0, 0, 0, 0.6))

.disk-track
	animation: rotateTrack 4s linear infinite
	transform-origin: 100px 84px

.disk-track-fast
	animation: rotateTrackReverse 2.5s linear infinite
	transform-origin: 100px 84px

.actuator-arm
	animation: armRead 0.7s ease-in-out infinite
	transform-origin: 135px 74px

.actuator-led
	animation: ledPulse 0.25s ease-in-out infinite alternate

.led-blink-green
	animation: ledBlinkGreen 0.4s steps(2, start) infinite

.led-blink-blue
	animation: ledBlinkBlue 0.5s steps(2, start) infinite

.led-blink-red
	animation: ledBlinkRed 0.3s steps(2, start) infinite

@keyframes rotateTrack
	from
		transform: rotate(0deg)
	to
		transform: rotate(360deg)

@keyframes rotateTrackReverse
	from
		transform: rotate(360deg)
	to
		transform: rotate(0deg)

@keyframes armRead
	0%, 100%
		transform: rotate(0deg)
	25%
		transform: rotate(-2.5deg)
	50%
		transform: rotate(1deg)
	75%
		transform: rotate(-1deg)

@keyframes ledPulse
	from
		opacity: 0.6
		r: 2px
	to
		opacity: 1
		r: 3px

@keyframes ledBlinkGreen
	0%, 100%
		fill: #22c55e
		opacity: 1
	50%
		fill: #15803d
		opacity: 0.4

@keyframes ledBlinkBlue
	0%, 100%
		fill: #3b82f6
		opacity: 1
	50%
		fill: #1d4ed8
		opacity: 0.4

@keyframes ledBlinkRed
	0%, 100%
		fill: #ef4444
		opacity: 1
	50%
		fill: #991b1b
		opacity: 0.3

// Scanner Beam
.LFM-scanner-beam
	position: absolute
	width: 170px
	height: 3px
	background: linear-gradient(90deg, transparent, rgba($lfm-cyan, 0.7), transparent)
	filter: drop-shadow(0 0 6px $lfm-cyan)
	transform: rotateX(60deg) translateY(20px)
	animation: scanBeam 2.5s ease-in-out infinite
	z-index: 6
	pointer-events: none

@keyframes scanBeam
	0%, 100%
		top: 25%
		opacity: 0
	10%, 90%
		opacity: 1
	50%
		top: 65%

// Orbit Styling
.LFM-orbit-container
	position: absolute
	width: 320px
	height: 220px
	perspective: 1000px
	transform-style: preserve-3d
	pointer-events: none
	display: flex
	align-items: center
	justify-content: center
	z-index: 4

.LFM-orbit
	position: absolute
	border: 1px dashed rgba($lfm-blue, 0.15)
	border-radius: 50%
	transform-style: preserve-3d
	display: flex
	align-items: center
	justify-content: center

	&.orbit-1
		width: 180px
		height: 180px
		transform: rotateX(60deg)
		border-color: rgba($lfm-cyan, 0.2)

	&.orbit-2
		width: 270px
		height: 270px
		transform: rotateX(60deg)
		border-color: rgba($lfm-violet, 0.15)

.LFM-orbit-item
	position: absolute
	width: 50px
	height: 50px
	transform-style: preserve-3d
	display: flex
	align-items: center
	justify-content: center

	// Orbit 1 items (Folder & Database)
	&.item-folder
		animation: orbit 5s linear infinite
	&.item-database
		animation: orbit 5s linear infinite -2.5s

	// Orbit 2 items (Code & Image)
	&.item-code
		animation: orbit-reverse 7.5s linear infinite
	&.item-image
		animation: orbit-reverse 7.5s linear infinite -3.75s

.LFM-orbit-icon
	display: flex
	flex-direction: column
	align-items: center
	justify-content: center
	width: 100%
	height: 100%
	background: rgba(10, 15, 30, 0.8)
	border: 1px solid rgba($lfm-blue, 0.25)
	border-radius: 12px
	box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.05)
	backdrop-filter: blur(6px)
	padding: 5px
	transition: all 0.3s ease
	filter: drop-shadow(0 0 4px rgba($lfm-blue, 0.1))

	&.icon-folder
		border-color: rgba($lfm-cyan, 0.3)
	&.icon-database
		border-color: rgba($lfm-violet, 0.3)
	&.icon-code
		border-color: rgba($lfm-emerald, 0.3)
	&.icon-image
		border-color: rgba(#fbbf24, 0.3)

	.icon-label
		font-size: 7.5px
		color: #64748b
		margin-top: 3px
		font-weight: 700
		letter-spacing: 0.05em
		text-transform: uppercase

	// Counter rotations to keep elements billboarded and upright
	.item-folder &
		animation: counter-orbit 5s linear infinite
	.item-database &
		animation: counter-orbit 5s linear infinite -2.5s
	.item-code &
		animation: counter-orbit-reverse 7.5s linear infinite
	.item-image &
		animation: counter-orbit-reverse 7.5s linear infinite -3.75s

@keyframes orbit
	from
		transform: rotate(0deg)
	to
		transform: rotate(360deg)

@keyframes orbit-reverse
	from
		transform: rotate(360deg)
	to
		transform: rotate(0deg)

@keyframes counter-orbit
	from
		transform: rotate(0deg) rotateX(-60deg)
	to
		transform: rotate(-360deg) rotateX(-60deg)

@keyframes counter-orbit-reverse
	from
		transform: rotate(-360deg) rotateX(-60deg)
	to
		transform: rotate(0deg) rotateX(-60deg)

// Preloader Text
.LFM-preloader-text
	display: flex
	flex-direction: column
	align-items: center
	gap: 10px
	text-align: center
	z-index: 10

	h1
		font-size: 25px
		font-weight: 800
		color: white
		letter-spacing: 0.05em
		margin: 0
		text-transform: uppercase
		background: linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.7) 100%)
		-webkit-background-clip: text
		-webkit-text-fill-color: transparent
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))

	p
		font-size: 13px
		color: #64748b
		margin: 0
		font-weight: 500

.LFM-loader-bar
	width: 260px
	height: 3px
	background: rgba(255, 255, 255, 0.04)
	border-radius: 10px
	overflow: hidden
	box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.5)

.LFM-loader-progress
	width: 50%
	height: 100%
	background: linear-gradient(90deg, $lfm-blue, $lfm-cyan)
	border-radius: 10px
	animation: progressMove 1.8s infinite ease-in-out

@keyframes progressMove
	0%
		transform: translateX(-100%)
	100%
		transform: translateX(250%)

// Transitions
.preloader-fade-leave-active
	transition: all 600ms $lfm-ease
.preloader-fade-leave-to
	opacity: 0
	transform: scale(1.05)
	filter: blur(15px)

.is-fading
	pointer-events: none
</style>
