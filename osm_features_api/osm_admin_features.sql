CREATE OR REPLACE VIEW `osm-shape-access.views.osm_administrative_features` AS (
    SELECT
        osm_id,
        geometry,
        all_tags,
        (SELECT value FROM UNNEST(all_tags) WHERE key = 'name') AS name,
        (SELECT value FROM UNNEST(all_tags) WHERE key = 'name:en') AS name_en,
        SAFE_CAST((SELECT value FROM UNNEST(all_tags) WHERE key = 'admin_level') AS INT64) AS admin_level,
    FROM `bigquery-public-data.geo_openstreetmap.planet_features_multipolygons`
    WHERE ('boundary', 'administrative') IN (SELECT (key, value) FROM UNNEST(all_tags))
)