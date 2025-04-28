<template>
  <div class="globe" />
  <input type="range" min="0" max="1" step="0.01" v-model="time" @input="handleTimeOverrideChange" />
  <button @click="handleOverlapChange">
    <span v-if="overlap">Side-by-side</span>
    <span v-else>Overlap</span>
  </button>
</template>

<script async setup>
import { onMounted, defineProps, ref, watch } from 'vue';
import * as d3 from 'd3';
import * as turf from "@turf/turf";
import * as _ from 'lodash';

const { places } = defineProps(['places']);

let time = ref(0);
let overlap = ref(true);

let width = null;
let height = null;
let drawingIntervalId = null;
let initialScale = null;
let scaleInterpolator = null;
const opacityInterpolator = d3.interpolateNumber(1, 0);

let globe0 = null;
let globe1 = null;
let group0 = null;
let group1 = null;

let worldData = null;
d3.json('https://gist.githubusercontent.com/d3indepth/f28e1c3a99ea6d84986f35ac8646fac7/raw/c58cede8dab4673c91a3db702d50f7447b373d98/ne_110m_land.json')
  .then((data) => {
    worldData = data;
  });

watch(() => places, (newPlaces, oldPlaces) => {
  console.log('Got new places:', newPlaces);
  if (newPlaces.length > 1 && !_.isEqual(newPlaces, oldPlaces)) {
    console.log('New places:', newPlaces);
    console.log('Old places:', oldPlaces);
    stopAnimation();
    resetGlobes();
  }
});

class Globe {
  constructor(id, el, root, scale) {
    this.id = id;
    this.el = el;
    this.root = root;
    this.scale = scale;

    this.boundary = root.append('path').attr('class', `boundary${id} projection${id}`);
    this.world = root.append('path').attr('class', `world${id} projection${id}`);
  }

  async reset() {
    // Get the data for the boundary.
    const boundaryData = await d3.json(`https://us-east4-osm-shape-access.cloudfunctions.net/osm_shape?osm_id=${places[this.id].osmId}`);
    const boundaryCenter = turf.centerOfMass(boundaryData).geometry;

    // Create a projection that can be individually controlled for the boundary.
    this.boundaryProjection = d3.geoOrthographic()
      .translate([width / 2, height / 2])
      .scale(this.scale);

    // Determnie the width and height of the boundary, in kilometers.
    const boundaryBounds = turf.bbox(boundaryData);
    this.boundaryWidth = turf.distance([boundaryBounds[0], boundaryBounds[1]], [boundaryBounds[2], boundaryBounds[1]]);
    this.boundaryHeight = turf.distance([boundaryBounds[0], boundaryBounds[1]], [boundaryBounds[0], boundaryBounds[3]]);
    console.log(`Boundary ${this.id} width:`, this.boundaryWidth, 'height:', this.boundaryHeight);

    // Create an interpolator for the boundary globe rotation.
    this.boundaryInterpolator = d3.interpolateArray([0, 0, 0], [-boundaryCenter.coordinates[0], -boundaryCenter.coordinates[1], 0]);

    // Create a path generator for the boundary projection.
    this.boundaryMakePath = d3.geoPath().projection(this.boundaryProjection);
    this.boundary
      .datum(boundaryData)
      .attr('d', this.boundaryMakePath);

    this.world
      .datum(worldData)
      .attr('d', d3.geoPath().projection(this.boundaryProjection));
  }

  setScale(scale) {
    this.scale = scale;
    this.updateProjection();
  }

  updateProjection() {
    this.boundaryProjection
      .scale(this.scale)
      .rotate(this.boundaryInterpolator(d3.easeExpInOut(time.value)));
    this.root.selectAll(`.projection${this.id}`).attr('d', this.boundaryMakePath);
  }

  setOpacity(opacity) {
    this.world.style('opacity', opacity);
  }
}

async function initGlobes() {
  const globeEl = document.querySelector('.globe');
  const svg = d3.select(globeEl).append('svg')
    .attr('width', '100%')
    .attr('height', '100%');

  initClientSize(globeEl);

  group0 = svg.append('g').attr('class', 'globe globe0');
  group1 = svg.append('g').attr('class', 'globe globe1');

  globe0 = new Globe(0, globeEl, group0, initialScale);
  globe1 = new Globe(1, globeEl, group1, initialScale);
}

function initClientSize(el) {
  width = el.clientWidth;
  height = el.clientHeight;
  initialScale = Math.min(width, height) / 2;
}

async function resetGlobes() {
  // Stop the current animation if it's running.
  stopAnimation();

  // Reset the globe boundaries.
  await Promise.all([
    globe0.reset(),
    globe1.reset(),
  ]);

  // Create an interpolator for the globes' scale.
  updateScaleInterpolator();

  // Animate the globes' rotation and scale.
  animateGlobes();
}

function updateScaleInterpolator() {
  scaleInterpolator = d3.interpolateNumber(
    initialScale,
    Math.min(
      width / Math.max(globe0.boundaryWidth, globe1.boundaryWidth),
      height / Math.max(globe0.boundaryHeight, globe1.boundaryHeight)
    ) * 4096,  // <-- Empirically determined to be a good scale factor. Happens to be 64^2.
  );
}

function animateGlobes() {
  drawingIntervalId = setInterval(() => {
    updateView();

    if (time.value >= 1) {
      clearInterval(drawingIntervalId);
      return;
    }

    time.value += 0.01;
  }, 100);
}

function stopAnimation() {
  clearInterval(drawingIntervalId);
}

function updateView() {
  if (scaleInterpolator === null) {
    return;
  }

  const commonScale = time.value < 0.5 ? scaleInterpolator(0) : scaleInterpolator(d3.easeExpInOut((time.value-0.5)*2));
  globe0.setScale(commonScale);
  globe1.setScale(commonScale);

  const commonOpacity = time.value < 0.5 ? opacityInterpolator(0) : opacityInterpolator(d3.easeExpInOut((time.value-0.5)*2));
  globe0.setOpacity(commonOpacity);
  globe1.setOpacity(commonOpacity);
}

function updateOverlapDisplay() {
  if (overlap.value) {
    group0.style('transform', 'translateX(0)');
    group1.style('transform', 'translateX(0)');
  } else {
    group0.style('transform', 'translateX(-25%)');
    group1.style('transform', 'translateX(25%)');
  }
}

onMounted(async () => {
  await initGlobes();
});

const handleTimeOverrideChange = _.throttle(() => {
  stopAnimation();
  updateView();
}, 100, { leading: true, trailing: true });

const handleOverlapChange = () => {
  overlap.value = !overlap.value;
  updateOverlapDisplay();
};
</script>

<style>
.globe {
  width: 100%;
  height: 100%;
  background-color: #fff;
}

.boundary0, .boundary1 {
  fill: none;
  stroke-width: 2px;
}

.world0, .world1 {
  fill: none;
  stroke-width: 1px;
}

.boundary0, .world0 {
  stroke: rgb(0 0 255);
  /* fill: rgb(0 0 255 / 0.1); */
}

.boundary1, .world1 {
  stroke: rgb(0 128 0);
  /* fill: rgb(0 128 0 / 0.1); */
}

.globe {
  transition: transform 0.5s;
}
</style>