<template>
  <select v-model="osmId" @change="handlePlaceChange">
    <option value="">Choose a place...</option>
    <option v-for="place in places" :key="place.osmId" :value="place.osmId">
      {{ place.name }}
    </option>
  </select>
</template>

<script setup>
import { ref, defineEmits, defineModel } from 'vue';

const emit = defineEmits(['change']);
const place = defineModel();
const lang = ref('en');

const places = [
  { osmId: '188022', name: 'Philadelphia' },
  { osmId: '207359', name: 'Los Angeles' },
];

const osmId = ref('');

function handlePlaceChange() {
  console.log('Selected place:', osmId.value);

  // Update the model value
  place.value = places.find((p) => p.osmId === osmId.value);
}
</script>