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
transition(
	enter-active-class="transition-all duration-600 ease-[cubic-bezier(0.2,1,0.3,1)]"
	leave-active-class="transition-all duration-600 ease-[cubic-bezier(0.2,1,0.3,1)]"
	enter-from-class="opacity-0 scale-105 blur-[15px]"
	leave-to-class="opacity-0 scale-105 blur-[15px]"
)
	div(class="fixed inset-0 z-[9999] bg-[#06080f] flex items-center justify-center overflow-hidden font-['Inter','Outfit',sans-serif]" v-if="show" :class="{ 'pointer-events-none': fadeOut }")
		//- Glowing background gradients
		div(class="absolute rounded-full blur-[120px] opacity-15 pointer-events-none z-[1] w-[400px] h-[400px] bg-[#60aaef] -top-[100px] -left-[100px] animate-[floatGlow_10s_ease-in-out_infinite_alternate]")
		div(class="absolute rounded-full blur-[120px] opacity-15 pointer-events-none z-[1] w-[500px] h-[500px] bg-[#a78bfa] -bottom-[150px] -right-[150px] animate-[floatGlow_12s_ease-in-out_infinite_alternate-reverse]")
		
		//- Perspective Grid Floor
		div(class="absolute -bottom-[10%] left-1/2 -translate-x-1/2 w-[250%] h-[120%] bg-[linear-gradient(rgba(96,170,239,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(96,170,239,0.08)_1px,transparent_1px)] bg-[size:50px_50px] bg-center opacity-70 z-[1] pointer-events-none [transform:translateX(-50%)_rotateX(75deg)] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_60%)]")
		
		div(class="relative z-[10] flex flex-col items-center gap-[25px] w-full max-w-[500px] p-[20px]")
			//- Beautiful 3D Animation Space
			div(class="relative w-[320px] h-[220px] flex items-center justify-center [transform-style:preserve-3d]")
				//- Perspective grid/radar scanner
				div(class="absolute w-[190px] h-[80px] border-[1.5px] border-[#60aaef40] rounded-full bg-[radial-gradient(circle,rgba(96,170,239,0.05)_0%,transparent_80%)] animate-[radarPulse_3s_ease-in-out_infinite] pointer-events-none [transform:rotateX(60deg)_translateY(20px)]")
				
				//- Orbiting items
				div(class="absolute w-[320px] h-[220px] flex items-center justify-center z-[4] pointer-events-none [perspective:1000px] [transform-style:preserve-3d]")
					//- Orbit 1: Clockwise, Inner
					div(class="absolute border border-dashed rounded-full flex items-center justify-center w-[180px] h-[180px] border-[rgba(56,189,248,0.2)] [transform-style:preserve-3d] [transform:rotateX(60deg)]")
						div(class="absolute w-[50px] h-[50px] flex items-center justify-center animate-[orbit_5s_linear_infinite] [transform-style:preserve-3d]")
							div(class="flex flex-col items-center justify-center w-full h-full bg-[rgba(10,15,30,0.8)] border border-[rgba(56,189,248,0.3)] rounded-xl p-[5px] transition-all duration-300 shadow-[0_8px_16px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-[6px] drop-shadow-[0_0_4px_rgba(96,170,239,0.1)] animate-[counter-orbit_5s_linear_infinite]")
								svg(viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")
									path(d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8")
								span(class="text-[7.5px] text-slate-500 mt-[3px] font-bold tracking-[0.05em] uppercase") Folders
						div(class="absolute w-[50px] h-[50px] flex items-center justify-center animate-[orbit_5s_linear_infinite_-2.5s] [transform-style:preserve-3d]")
							div(class="flex flex-col items-center justify-center w-full h-full bg-[rgba(10,15,30,0.8)] border border-[rgba(167,139,250,0.3)] rounded-xl p-[5px] transition-all duration-300 shadow-[0_8px_16px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-[6px] drop-shadow-[0_0_4px_rgba(96,170,239,0.1)] animate-[counter-orbit_5s_linear_infinite_-2.5s]")
								svg(viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")
									ellipse(cx="12" cy="5" rx="9" ry="3" fill="rgba(167, 139, 250, 0.2)" stroke="#a78bfa")
									path(d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" stroke="#a78bfa")
									path(d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" stroke="#a78bfa")
								span(class="text-[7.5px] text-slate-500 mt-[3px] font-bold tracking-[0.05em] uppercase") Drives

					//- Orbit 2: Counter-Clockwise, Outer
					div(class="absolute border border-dashed rounded-full flex items-center justify-center w-[270px] h-[270px] border-[rgba(167,139,250,0.15)] [transform-style:preserve-3d] [transform:rotateX(60deg)]")
						div(class="absolute w-[50px] h-[50px] flex items-center justify-center animate-[orbit-reverse_7.5s_linear_infinite] [transform-style:preserve-3d]")
							div(class="flex flex-col items-center justify-center w-full h-full bg-[rgba(10,15,30,0.8)] border border-[rgba(52,211,153,0.3)] rounded-xl p-[5px] transition-all duration-300 shadow-[0_8px_16px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-[6px] drop-shadow-[0_0_4px_rgba(96,170,239,0.1)] animate-[counter-orbit-reverse_7.5s_linear_infinite]")
								svg(viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")
									path(d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="rgba(52, 211, 153, 0.2)" stroke="#34d399")
									polyline(points="14 2 14 8 20 8" stroke="#34d399")
									polyline(points="8 13 6 15 8 17" stroke="#34d399")
									polyline(points="16 13 18 15 16 17" stroke="#34d399")
									line(x1="13" y1="13" x2="11" y2="17" stroke="#34d399")
								span(class="text-[7.5px] text-slate-500 mt-[3px] font-bold tracking-[0.05em] uppercase") Source
						div(class="absolute w-[50px] h-[50px] flex items-center justify-center animate-[orbit-reverse_7.5s_linear_infinite_-3.75s] [transform-style:preserve-3d]")
							div(class="flex flex-col items-center justify-center w-full h-full bg-[rgba(10,15,30,0.8)] border border-[rgba(251,191,36,0.3)] rounded-xl p-[5px] transition-all duration-300 shadow-[0_8px_16px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-[6px] drop-shadow-[0_0_4px_rgba(96,170,239,0.1)] animate-[counter-orbit-reverse_7.5s_linear_infinite_-3.75s]")
								svg(viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")
									rect(x="3" y="3" width="18" height="18" rx="2" ry="2" fill="rgba(251, 191, 36, 0.2)" stroke="#fbbf24")
									circle(cx="8.5" cy="8.5" r="1.5" fill="#fbbf24" stroke="#fbbf24")
									polyline(points="21 15 16 10 5 21" stroke="#fbbf24")
								span(class="text-[7.5px] text-slate-500 mt-[3px] font-bold tracking-[0.05em] uppercase") Media

				//- Central hard drive/disk stack
				div(class="relative z-[5] animate-[driveFloat_2.5s_ease-in-out_infinite_alternate] [transform-style:preserve-3d]")
					svg(class="drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)]" viewBox="0 0 200 200" width="160" height="160")
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
						g
							path(d="M 50 120 A 50 18 0 0 0 150 120 L 150 126 A 50 18 0 0 1 50 126 Z" fill="url(#platterEdge)")
							ellipse(cx="100" cy="120" rx="50" ry="18" fill="url(#platterGrad)" stroke="#60a5fa" stroke-opacity="0.5" stroke-width="0.5")
							ellipse(cx="100" cy="120" rx="10" ry="3.6" fill="#0f172a")

						//- Platter 2 (Middle)
						g
							path(d="M 50 102 A 50 18 0 0 0 150 102 L 150 108 A 50 18 0 0 1 50 108 Z" fill="url(#platterEdge)")
							ellipse(cx="100" cy="102" rx="50" ry="18" fill="url(#platterGrad)" stroke="#60a5fa" stroke-opacity="0.5" stroke-width="0.5")
							ellipse(cx="100" cy="102" rx="10" ry="3.6" fill="#0f172a")

						//- Platter 1 (Top)
						g
							path(d="M 50 84 A 50 18 0 0 0 150 84 L 150 90 A 50 18 0 0 1 50 90 Z" fill="url(#platterEdge)")
							ellipse(cx="100" cy="84" rx="50" ry="18" fill="url(#platterGrad)" stroke="#93c5fd" stroke-opacity="0.8" stroke-width="0.7")
							ellipse(cx="100" cy="84" rx="10" ry="3.6" fill="#0a0f1d")
							ellipse(class="animate-[rotateTrack_4s_linear_infinite] origin-[100px_84px]" cx="100" cy="84" rx="40" ry="14.4" fill="none" stroke="#93c5fd" stroke-width="0.5" stroke-dasharray="10 5" opacity="0.6")
							ellipse(class="animate-[rotateTrackReverse_2.5s_linear_infinite] origin-[100px_84px]" cx="100" cy="84" rx="28" ry="10" fill="none" stroke="#93c5fd" stroke-width="0.5" stroke-dasharray="25 8" opacity="0.8")

						//- Spindle Shaft
						path(d="M 97 75 L 103 75 L 103 130 L 97 130 Z" fill="#64748b" opacity="0.9")
						ellipse(cx="100" cy="75" rx="3" ry="1" fill="#94a3b8")

						//- Actuator Arm
						g(class="animate-[armRead_0.7s_ease-in-out_infinite] origin-[135px_74px]")
							ellipse(cx="135" cy="74" rx="8" ry="4" fill="#475569" stroke="#64748b" stroke-width="0.5")
							ellipse(cx="135" cy="73" rx="5" ry="2.5" fill="#334155")
							path(d="M 135 73 L 102 83 L 104 86 L 137 75 Z" fill="#94a3b8" stroke="#475569" stroke-width="0.5")
							circle(cx="102" cy="83.5" r="2.5" fill="#60a5fa" filter="url(#neonGlow)" class="animate-[ledPulse_0.25s_ease-in-out_infinite_alternate]")

						//- Status LEDs
						circle(cx="65" cy="150" r="2" fill="#22c55e" class="animate-[ledBlinkGreen_0.4s_steps(2,start)_infinite]")
						circle(cx="73" cy="154" r="2" fill="#3b82f6" class="animate-[ledBlinkBlue_0.5s_steps(2,start)_infinite]")
						circle(cx="81" cy="158" r="2" fill="#ef4444" class="animate-[ledBlinkRed_0.3s_steps(2,start)_infinite]")

					//- Scanning beam line
					div(class="absolute w-[170px] h-[3px] bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.7),transparent)] drop-shadow-[0_0_6px_#38bdf8] animate-[scanBeam_2.5s_ease-in-out_infinite] z-[6] pointer-events-none [transform:rotateX(60deg)_translateY(20px)]")

			//- Preloader Text & Progress
			div(class="flex flex-col items-center gap-[10px] text-center z-[10]")
				h1(class="text-[25px] font-extrabold text-white tracking-[0.05em] m-0 uppercase bg-[linear-gradient(135deg,#ffffff_0%,rgba(255,255,255,0.7)_100%)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]") LFM Explorer
				div(class="w-[260px] h-[3px] bg-[rgba(255,255,255,0.04)] rounded-[10px] overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]")
					div(class="w-[50%] h-full bg-[linear-gradient(90deg,#60aaef,#38bdf8)] rounded-[10px] animate-[progressMove_1.8s_infinite_ease-in-out]")
				p(class="text-[13px] text-slate-500 m-0 font-medium") Initializing Linux Filesystem...
</template>
