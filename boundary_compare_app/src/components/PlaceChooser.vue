<template>
  <div class="wrapper">
    <span v-if="!isQuerying" @click="handleLabelClick">{{ label }}</span>

    <input v-if="isQuerying" v-model="searchQuery" ref="searchQueryInput" @input="handleSearchQueryInput">
    <ul v-if="isQuerying" class="autocomplete-options-list">
      <li v-for="result in autocompleteResults" :key="result.osmId">
        <button @click="handleResultClick(result)">{{ autocompleteResultLabel(result) }}</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, defineEmits, defineModel, nextTick, useTemplateRef } from 'vue';
import * as _ from 'lodash';

const emit = defineEmits(['change']);
const place = defineModel();
const lang = ref('en');

const label = ref('(Click to search for a place)')
const isQuerying = ref(false);
const searchQuery = ref('');
const autocompleteResults = ref([]);

const searchQueryInput = useTemplateRef('searchQueryInput');

// const places = [
//   { osmId: '594508', name: 'Johannesburg' },
//   { osmId: '207359', name: 'Los Angeles' },
//   { osmId: '175905', name: 'New York City' },
//   { osmId: '188022', name: 'Philadelphia' },
// ];

const autocompleteURL = 'https://us-east4-osm-shape-access.cloudfunctions.net/osm_ids';

const updateQueryAutocompleteResults = _.debounce(async function (query) {
  if (query.length < 3) {
    autocompleteResults.value = [];
  }

  const response = await fetch(`${autocompleteURL}?q=${query}&lang=${lang.value}`);
  const data = await response.json();
  console.log('Autocomplete results:', data);

  autocompleteResults.value = data.map((result) => ({
    osmId: result.osm_id,
    name: result.name,
    tags: Object.fromEntries(result.all_tags.map((tag) => [tag.key, tag.value])),
  }));
}, 500, { });

function autocompleteResultLabel(result) {
  return result.name + (
    result.tags?.is_in ? ` (${result.tags.is_in})` :
    result.tags?.wikipedia ? ` (${result.tags.wikipedia})` :
    ''
  );
}

function startQuerying() {
  isQuerying.value = true;
  searchQuery.value = '';
  autocompleteResults.value = [];

  nextTick(() => searchQueryInput.value.focus());
}

function stopQuerying() {
  isQuerying.value = false;
}

function handleLabelClick() {
  startQuerying();
}

function handleSearchQueryInput() {
  autocompleteResults.value = [];
  console.log('Search query:', searchQuery.value);
  updateQueryAutocompleteResults(searchQuery.value);
}

function handleResultClick(result) {
  console.log('Result clicked:', result);

  // Update the model value
  place.value = result;

  label.value = autocompleteResultLabel(result);
  stopQuerying();
}
</script>

<style scoped>
.wrapper {
  position: relative;
}

ul {
  position: absolute;
  width: 100%;
  list-style-type: none;
  padding: 0;
  margin: 0;
  background-color: white;
}

button {
  box-sizing: border-box;
  padding: 0.5rem;
  width: 100%;
  border: none;
  border-radius: 0.25rem;
  background-color: #eee;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #ddd;
}

input {
  width: 100%;
  border-radius: 0.25rem;
  height: 2rem;
  line-height: 2rem;
  box-sizing: border-box;
}
</style>