const functions = require('@google-cloud/functions-framework');
const {BigQuery} = require('@google-cloud/bigquery');

/**
 * CORS middleware for Cloud Functions.
 * @param {Function} func The function to execute.
 * @return {Function} A function that sets CORS headers before calling the original function.
 * @see https://cloud.google.com/functions/docs/writing/http#handling_cors_requests
 */
function cors(func) {
  return (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
    } else {
      func(req, res);
    }
  };
}

functions.http('getShape', cors(async (req, res) => {
  const osm_id = req.query.osm_id || req.body.osm_id;

  if (!osm_id || !osm_id.match(/\d+/)) {
    res.status(400).send(`Must specify an integer osm_id parameter.`);
    return;
  }

  const client = new BigQuery();
  const results = await client.query({
    query: `
      SELECT ST_ASGEOJSON(geometry) AS geometry
      FROM \`osm-shape-access.views.osm_administrative_features\`
      WHERE osm_id = ?
    `,
    params: [parseInt(osm_id)]
  });

  if (results.length === 0) {
    res.status(404).send(`No boundary with ID ${osm_id} found.`);
    return;
  }

  rows = results[0]
  res.type('application/geo+json').send(rows[0].geometry);
}));

functions.http('getOsmIds', cors(async (req, res) => {
  const q = req.query.q || req.body.q;
  const lang = req.query.lang || req.body.lang || 'en';

  if (!q) {
    res.status(400).send(`Must specify a q parameter.`);
    return;
  }

  const client = new BigQuery();
  const results = await client.query({
    query: `
      SELECT osm_id, name, all_tags
      FROM \`osm-shape-access.views.osm_administrative_features\`
      WHERE name LIKE ?
      AND osm_id IS NOT NULL
      ORDER BY admin_level
      LIMIT 10
    `,
    params: [`%${q}%`]
  });

  res.type('application/json').send(results[0]);
}));
