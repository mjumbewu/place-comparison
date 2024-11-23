<template>
  <div class="globe" />
</template>

<script setup>
import { onMounted, defineProps, watch } from 'vue';
import * as d3 from 'd3';
import * as turf from "@turf/turf";

let config = null;
let drawingIntervalId = null;

const { places } = defineProps(['places']);

watch(() => places, (newPlaces, oldPlaces) => {
  console.log('Got new places:', newPlaces);
  if (newPlaces.length > 1) {
    resetGlobes();
  }
});

async function initGlobes() {
  const globeEl = document.querySelector('.globe');
  const width = globeEl.clientWidth;
  const height = globeEl.clientHeight;

  const globe = d3.select(globeEl);

  const svg = globe.append('svg')
    .attr('width', '100%')
    .attr('height', '100%');

  const boundary1 = svg.append('path').attr('class', 'boundary1 projection1')
  const boundary2 = svg.append('path').attr('class', 'boundary2 projection2')

  const world1 = svg.append('path').attr('class', 'world1 projection1');
  const world2 = svg.append('path').attr('class', 'world2 projection2');

  config = { globe, svg, width, height, boundary1, boundary2, world1, world2 };
  return config;
}

async function resetGlobes() {
  const { svg, width, height, boundary1, boundary2, world1, world2 } = config;

  if (drawingIntervalId) {
    clearInterval(drawingIntervalId);
  }

  const worldData = await d3.json('https://gist.githubusercontent.com/d3indepth/f28e1c3a99ea6d84986f35ac8646fac7/raw/c58cede8dab4673c91a3db702d50f7447b373d98/ne_110m_land.json');

  // Get the data for each boundary.
  const boundary1Data = await d3.json(`https://us-east4-osm-shape-access.cloudfunctions.net/osm_shape?osm_id=${places[0].osmId}`);
  const boundary1Center = turf.centerOfMass(boundary1Data).geometry;
  const boundary2Data = await d3.json(`https://us-east4-osm-shape-access.cloudfunctions.net/osm_shape?osm_id=${places[1].osmId}`);
  const boundary2Center = turf.centerOfMass(boundary2Data).geometry;

  // Create projections that can be individually controlled for each boundary.
  const boundary1Projection = d3.geoOrthographic()
    .translate([width / 2, height / 2]);
  const boundary2Projection = d3.geoOrthographic()
    .translate([width / 2, height / 2]);

  // Create interpolators for the boundary globe rotation and scale.
  const boundary1Interpolator = d3.interpolateArray([0, 0, 0], [-boundary1Center.coordinates[0], -boundary1Center.coordinates[1], 0]);
  const boundary2Interpolator = d3.interpolateArray([0, 0, 0], [-boundary2Center.coordinates[0], -boundary2Center.coordinates[1], 0]);
  const scaleInterpolator = d3.interpolateNumber(width / 4, width * 64);

  // Create a function to update the projections based on the current time.
  let t = 0;
  function updateProjections() {
    const commonScale = t < 0.5 ? scaleInterpolator(0) : scaleInterpolator(d3.easeExpInOut((t-0.5)*2));
    boundary1Projection
      .scale(commonScale)
      .rotate(boundary1Interpolator(d3.easeExpInOut(t)));
    boundary2Projection
      .scale(commonScale)
      .rotate(boundary2Interpolator(d3.easeExpInOut(t)));
  }

  updateProjections();

  // Create path generators for each boundary projection.
  const boundary1MakePath = d3.geoPath().projection(boundary1Projection);
  boundary1
    .datum(boundary1Data)
    .attr('d', boundary1MakePath);

  const boundary2MakePath = d3.geoPath().projection(boundary2Projection);
  boundary2
    .datum(boundary2Data)
    .attr('d', boundary2MakePath);

  world1
    .datum(worldData)
    .attr('d', d3.geoPath().projection(boundary1Projection));
  world2
    .datum(worldData)
    .attr('d', d3.geoPath().projection(boundary2Projection));

  // Animate the globe rotation and scale.
  drawingIntervalId = setInterval(() => {
    updateProjections();

    svg.selectAll('.projection1').attr('d', boundary1MakePath);
    svg.selectAll('.projection2').attr('d', boundary2MakePath);

    if (t >= 1) {
      clearInterval(drawingIntervalId);
      return;
    }

    t += 0.01;
  }, 100);
}

onMounted(async () => {
  await initGlobes();
});
</script>

<style>
.globe {
  width: 100%;
  height: 100%;
  background-color: #fff;
}

.boundary1 {
  stroke-width: 2px;
  stroke: rgb(0 0 255);
  fill: rgb(0 0 255 / 0.1);
}

.boundary2 {
  stroke-width: 2px;
  stroke: rgb(0 128 0);
  fill: rgb(0 128 0 / 0.1);
}

.world1, .world2 {
  fill: none;
  stroke: rgba(0 0 0 / 0.5);
  stroke-width: 1px;
}
</style>