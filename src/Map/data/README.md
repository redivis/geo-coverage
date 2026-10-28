## Source data
The map's boundaries and roads are queried (in `getMapData.js`) from the
[OpenStreetMap dataset on Redivis](https://redivis.com/datasets/3s4c-0vyfq9524?v=1.0):

- `demo.open_street_map:3s4c:v1_0.admin:fr0h`: administrative boundaries
- `demo.open_street_map:3s4c:v1_0.roads:y9mg`: roads

These data are derived from the [BigQuery OSM dataset](https://console.cloud.google.com/bigquery?project=geo-coverage&p=bigquery-public-data&d=geo_openstreetmap&page=dataset).

Data transformation steps are laid out below:

## Get admin layers
```sql
CREATE OR REPLACE TABLE osm.admin
(
    id INT64,
    visible BOOLEAN,
    osm_timestamp TIMESTAMP,
    admin_level INT64,
    name STRING,
    name_en STRING,
    is_in_country STRING,
    is_in_country_code STRING,
    country_code STRING,
    all_tags ARRAY<STRUCT<key STRING, value STRING>>,
    geometry GEOGRAPHY,
    simplified_geometry GEOGRAPHY,  
)
CLUSTER BY
    admin_level,
    geometry
OPTIONS ()
AS 
    SELECT
        id,
        visible,
        osm_timestamp,
        (SELECT CAST(value AS INT64) FROM unnest(all_tags) WHERE key='admin_level') AS admin_level,
        (SELECT value FROM unnest(all_tags) WHERE key='name') AS name,
        (SELECT value FROM unnest(all_tags) WHERE key='name:en') AS name_en,
        (SELECT value FROM unnest(all_tags) WHERE key='is_in:country') AS is_in_country,
        (SELECT value FROM unnest(all_tags) WHERE key='is_in:country_code') AS is_in_country_code,
        (SELECT value FROM unnest(all_tags) WHERE key='ISO3166-1') AS country_code,
        all_tags,
        geometry,
        ST_SIMPLIFY(geometry, LEAST(ST_PERIMETER(geometry) / 10000, 100))
    FROM `bigquery-public-data.geo_openstreetmap.planet_relations`
    WHERE ('boundary', 'administrative') in (SELECT (key, value) from unnest(all_tags))
     AND (SELECT SAFE_CAST(value AS INT64) FROM unnest(all_tags) WHERE key='admin_level') < 7
```

## Get road layers
```sql
CREATE OR REPLACE TABLE osm.roads
(
    id INT64,
    version INT64,
    visible BOOL,
    osm_timestamp TIMESTAMP,   
    road_type STRING,
    road_speed INT64,
    all_tags ARRAY<STRUCT<key STRING, value STRING>>,
    geometry GEOGRAPHY,
    simplified_geometry GEOGRAPHY
)
CLUSTER BY
    road_type,
    simplified_geometry
OPTIONS ()
AS SELECT
    id, 
    version, 
    visible,
    osm_timestamp,    
    (SELECT value FROM unnest(all_tags) WHERE key='highway') AS road_type,
    (SELECT SAFE_CAST(value AS INT64) FROM unnest(all_tags) WHERE key='maxspeed') AS road_speed,
    all_tags,
    geometry,
    ST_SIMPLIFY(geometry, GREATEST(ST_LENGTH(geometry) / 100, 250))
FROM `bigquery-public-data.geo_openstreetmap.planet_ways` roads
WHERE
    (SELECT value FROM unnest(all_tags) WHERE key='highway') IN ('motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential')
```

## Get countries and provinces
```sql
SELECT
    country.name_en as country_name,
    province.name as province_name

FROM osm.admin country
         INNER JOIN (
    SELECT COALESCE(name_en, name) AS name, geometry FROM osm.admin
    WHERE name IS NOT NULL AND admin_level=4
) province ON ST_CONTAINS(country.geometry, province.geometry)

WHERE country.name IS NOT NULL AND country.admin_level=2

ORDER BY country_name ASC
```