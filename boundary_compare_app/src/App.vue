<template>
  <div class="chooser">
    <place-chooser v-model="place1" :color="color1" />
    <place-chooser v-model="place2" :color="color2" />
  </div>
  <globe :places="places" :colors="colors" />
</template>

<script setup>
import PlaceChooser from './components/PlaceChooser.vue';
import Globe from './components/Globe.vue';

import { ref, computed } from 'vue';

const colors = [
  'rgb(0 0 255)',  // Globe 0 is blue
  'rgb(0 128 0)',  // Globe 1 is green
]

const place1 = ref('');
const color1 = colors[0];

const place2 = ref('');
const color2 = colors[1];

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
  gap: 1rem;
}
</style>
