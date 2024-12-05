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
  { osmId: '594508', name: 'Johannesburg' },
  { osmId: '207359', name: 'Los Angeles' },
  { osmId: '175905', name: 'New York City' },
  { osmId: '188022', name: 'Philadelphia' },
];

const osmId = ref('');

function handlePlaceChange() {
  console.log('Selected place:', osmId.value);

  // Update the model value
  place.value = places.find((p) => p.osmId === osmId.value);
}
</script>