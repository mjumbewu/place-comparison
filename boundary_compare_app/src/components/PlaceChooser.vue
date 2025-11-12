<template>
  <div class="wrapper">
    <span v-if="!isQuerying" @click="handleLabelClick">{{ label }}</span>

    <input v-if="isQuerying" v-model="searchQuery" ref="searchQueryInput" @input="handleSearchQueryInput">
    <ul v-if="isQuerying" class="autocomplete-options-list">
      <li v-for="result in autocompleteResults" :key="result.osmId">
        <button @click="handleResultClick(result)">{{ autocompleteResultLabel(result) }}</button>
      </li>
    </ul>

    <div class="status">
      <span v-if="numActiveFetches > 0">Searching for places that match "&hellip;{{ searchQuery }}&hellip;".</span>
      <span v-else-if="isEmptyResults">No results found for "&hellip;{{ searchQuery }}&hellip;"<br>(remember that search is case-sensitive).</span>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits, defineModel, defineProps, nextTick, useTemplateRef } from 'vue';
import * as _ from 'lodash';

const emit = defineEmits(['change']);
const place = defineModel();
const {color} = defineProps(['color']);
const lang = ref('en');

console.log(color);

const label = ref('(Click to search for a place)')
const isQuerying = ref(false);
const numActiveFetches = ref(0);
const isEmptyResults = ref(false);
const searchQuery = ref('');
const autocompleteResults = ref([]);

const searchQueryInput = useTemplateRef('searchQueryInput');

const autocompleteURL = 'https://us-east4-osm-shape-access.cloudfunctions.net/osm_ids';

const updateQueryAutocompleteResults = _.debounce(async function (query) {
  if (query.length < 3) {
    autocompleteResults.value = [];
    return;
  }

  numActiveFetches.value++;
  const response = await fetch(`${autocompleteURL}?q=${query}&lang=${lang.value}`);
  const data = await response.json();
  console.log('Autocomplete results:', data);
  numActiveFetches.value--;

  autocompleteResults.value = data.map((result) => ({
    osmId: result.osm_id,
    name: result.name,
    tags: Object.fromEntries(result.all_tags.map((tag) => [tag.key, tag.value])),
  }));

  isEmptyResults.value = autocompleteResults.value.length === 0;
}, 500, { });

function autocompleteResultLabel(result) {
  return result.name +
    (result.tags?.[`name:${lang.value}`] ? ` (${lang.value}: ${result.tags[`name:${lang.value}`]})` :
     result.tags?.is_in ? ` (${result.tags.is_in})` : '') +
    (result.tags?.wikipedia ? ` (${result.tags.wikipedia})` : '');
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
  color: v-bind(color);
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