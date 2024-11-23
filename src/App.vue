<template>
  <div class="chooser">
    <place-chooser v-model="place1" />
    <place-chooser v-model="place2" />
  </div>
  <globe :places="places" />
</template>

<script setup>
import PlaceChooser from './components/PlaceChooser.vue';
import Globe from './components/Globe.vue';

import { ref, computed } from 'vue';

const place1 = ref('');
const place2 = ref('');
const places = computed(() => {
  const newPlaces = [];
  if (place1.value) newPlaces.push(place1.value);
  if (place2.value) newPlaces.push(place2.value);
  console.log('Computed places:', newPlaces);
  return newPlaces;
});
</script>

<style scoped>
.chooser {
  display: flex;
  flex-direction: row;
}
</style>
