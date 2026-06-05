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
	div(class="fixed inset-0 z-9999 bg-[#06080f] flex items-center justify-center overflow-hidden font-['Inter','Outfit',sans-serif]" v-if="show" :class="{ 'pointer-events-none': fadeOut }")
		//- Glowing background gradients
		div(class="absolute rounded-full blur-[120px] opacity-15 pointer-events-none z-1 w-100 h-100 bg-[#60aaef] -top-25 -left-25 animate-[floatGlow_10s_ease-in-out_infinite_alternate]")
		div(class="absolute rounded-full blur-[120px] opacity-15 pointer-events-none z-1 w-125 h-125 bg-[#a78bfa] -bottom-37.5 -right-37.5 animate-[floatGlow_12s_ease-in-out_infinite_alternate-reverse]")

		div(class="relative z-10 flex flex-col items-center gap-6.25 w-full max-w-125 p-5")
			//- Preloader Text & Progress
			div(class="flex flex-col items-center gap-2.5 text-center z-10")
				h1(class="text-[25px] font-extrabold text-white tracking-wider m-0 uppercase bg-[linear-gradient(135deg,#ffffff_0%,rgba(255,255,255,0.7)_100%)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]") LFM Explorer
				div(class="w-65 h-0.75 bg-[rgba(255,255,255,0.04)] rounded-[10px] overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]")
					div(class="w-[50%] h-full bg-[linear-gradient(90deg,#60aaef,#38bdf8)] rounded-[10px] animate-[progressMove_1.8s_infinite_ease-in-out]")
				p(class="text-[13px] text-slate-500 m-0 font-medium") Initializing Linux Filesystem...
</template>
