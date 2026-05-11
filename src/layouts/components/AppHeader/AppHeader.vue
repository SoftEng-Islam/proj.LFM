<!-- The AppHeader Contains the tabs and theme controller and app Minimize, Maximize and close -->
<script setup lang="ts">
import AppHeaderButtons from './AppHeaderButtons.vue';
import AppHeaderTabStrip from './AppHeaderTabStrip.vue';
import ThemeControllerMini from '@/components/themeController/ThemeControllerMini.vue';

// The use will change this value from the settings or the configs file.
const showThemeController = false;
</script>
<template lang="pug">
header(class="w-full flex items-center justify-between")
	<AppHeaderTabStrip />
	<ThemeControllerMini v-if="showThemeController"/>
	<AppHeaderButtons/>
</template>
