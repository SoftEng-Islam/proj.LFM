<script setup lang="ts">
import { Themes } from "@/utils/Themes";

const availableThemes = Themes.availableThemes;
const theme = Themes.currentTheme;

const setTheme = (newTheme: string) => {
	Themes.apply(newTheme);
};
</script>

<template lang="pug">
.dropdown
	.btn.btn-ghost(tabindex="0" role="button")
		| Theme
		svg.inline-block.size-2.fill-current.opacity-60(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048")
			path(d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z")
	
	ul.dropdown-content.bg-base-200.rounded-box.z-50.w-40.p-2.shadow-2xl.ring-1.ring-base-300(tabindex="0")
		li(v-for="t in availableThemes" :key="t.name")
			label.flex.items-center.gap-2.btn.btn-sm.btn-block.btn-ghost.justify-start(:class="{ 'btn-active': theme === t.name }")
				span(v-if="t.icon" v-html="t.icon")
				span.size-5(v-else)
				input.theme-controller.hidden(
					type="radio" 
					name="theme-dropdown" 
					:aria-label="t.name" 
					:value="t.name" 
					:checked="theme === t.name" 
					@change="setTheme(t.name)"
				)
				| {{ t.name }}
</template>

<style lang="sass" scoped>
@reference "tailwindcss"
</style>
