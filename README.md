# Redivis Labs geospatial coverage visualizer

> Try it out! https://labs.redivis.com/geo-coverage

## Overview
This tool was initially developed by the Redivis team to support the analysis of timely access to surgical care in resource-poor settings. Built on top of the [Redivis API](https://docs.redivis.com/api) and the [redivis-js](https://github.com/redivis/redivis-js) client library, it leverages population density information from [WorldPop](https://www.worldpop.org/focus_areas) and road network data from [OpenStreetMap](https://www.openstreetmap.org/about) to estimate the percentage of a population that is with a certain travel time from the nearest facility.

Its use cases have expanded to investigate timely access to care [in scores of countries](https://www.wfns.org/menu/62/2016-neurosurgical-capacity-and-access-by-country) across numerous research questions. We're excited to open-source this codebase and make the tool publicly available, and are excited to see the new applications you come up with!

[![Screenshot of coverage analysis tool](/assets/screenshot.png)](https://labs.redivis.com/geo-coverage)

## Usage
This tool takes tabular data of geocoded points (lat/long) to determine the population that is within a given travel time of these points (in a given region).

To get started, follow the steps below:

#### 1. Upload your data to Redivis (optional)
At the least, your table should contain one column (variable) for latitude and one for longitude. [Consult the "Creating a dataset guide" for full documentation.](https://docs.redivis.com/guides/creating-a-dataset)

You can also skip this step and visualize data in the [demo geo-coverage dataset](https://redivis.com/Demo/datasets/1913).

#### 2. Authenticate your account
Sign in to your Redivis account by clicking the "Sign in to Redivis" button at top right. Signing in is required to load the map, since road networks and administrative boundaries are queried from OpenStreetMap data on Redivis. It also lets you analyze any non-public tables you have access to.

#### 3. Specify your data 
Specify your data by providing your username, the name of the dataset you created, and the name of the relevant table. You can reference any table that you have access to, including those owned by other users/organizations or tables created in a workflow. [Read the full documentation for referencing tables on Redivis.](https://docs.redivis.com/api/referencing-resources)

Next, choose the country within which to perform the coverage analysis, optionally specifying a subregion within that country. For example, to perform an analysis of California, you should choose "United States" as the country and specify "California" as the subregion.

Finally, specify the variables in your table that correspond to the latitude/longitude of the observations in your data.

#### 4. Customize your analysis
This tool provides multiple mechanisms to further customize your analysis. You can select additional road layers for a more robust analysis, or modify the travel time to see how the population coverage changes. To highlight population centers without coverage, toggle the "Show population density" setting.

Note that highly detailed roads and/or tables with many observations may impact performance; you can toggle the visibility of roads and points to improve rendering speed. Additionally, you can modify the "resolution" of your analysis - higher resolutions may better avoid pixel rounding errors, and should be considered to be more accurate, though will be slower to render.

## Publication
### Data sources
#### OpenStreetMap
This tool utilizes OpenStreetMap (OSM) data for road networks and administrative boundaries, from the [OpenStreetMap dataset on Redivis](https://redivis.com/datasets/3s4c-0vyfq9524?v=1.0) (the [admin](https://redivis.com/datasets/3s4c-0vyfq9524/tables/fr0h-bykmzxfq4?v=1.0) and [roads](https://redivis.com/datasets/3s4c-0vyfq9524/tables/y9mg-1jvtxw3np?v=1.0) tables). These were derived from BigQuery's snapshot of OSM, documented and available [here](https://console.cloud.google.com/marketplace/details/openstreetmap/geo-openstreetmap), and represent a snapshot of the OSM database as of November 2019. See [src/Map/data/README.md](src/Map/data/README.md) for how they were derived.

Long roads and administrative boundaries have been simplified up to 250m resolution to improve performance.

#### WorldPop (2010)
Population coverage is determined based on a rasterized grid of global population density estimates, whose resolution is 1km at the equator. More information about the methodologies used to create these estimates is available at: https://www.worldpop.org/project/categories?id=18

### Citation information
This tool is free for you to use and modify as you see fit. We kindly ask that you provide the relevant citation information in any publications that derive from its use:
```
Redivis, https://redivis.com. (2021) Redivis Geospatial Coverage Visualizer. Retrieved {DATE}, from https://labs.redivis.com/geo-coverage
```
```
OpenStreetMap contributors, https://www.openstreetmap.org. (2019) Planet dump November 2019. Retrieved February 12, 2021 from https://console.cloud.google.com/marketplace/product/openstreetmap/geo-openstreetmap
```
```
WorldPop, https://www.worldpop.org. (2010) Population Density, Uconstrained individual countries (1km resolution). Retrieved October 1, 2015, from https://www.worldpop.org/project/categories?id=18.
```

### Prior publications
- [Carrillo-Villaseñor et al, 2021](https://link.springer.com/article/10.1007/s00268-021-05975-y) Access to Essential Surgical Care in Chiapas, Mexico: A System-Wide Geospatial Analysis
- [Jarman et al, 2019](https://jamanetwork.com/journals/jamasurgery/fullarticle/2738046) Validation of Zip Code–Based Estimates of Ambulance Driving Distance to Control for Access to Care in Emergency Surgery Research
- [Cartwright et al, 2018](https://www.jmir.org/2018/5/e186/) Identifying National Availability of Abortion Care and Distance From Major US Cities: Systematic Online Search
- [Punchak et al, 2018](https://www.sciencedirect.com/science/article/abs/pii/S187887501830069X) Neurosurgical Care: Availability and Access in Low-Income and Middle-Income Countries
- [Uribe-Leitz et al, 2018](https://www.journalofsurgicalresearch.com/article/S0022-4804(17)30668-6/abstract) Surgical deserts in California: an analysis of access to surgical care
- [Knowlton et al, 2017](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5463808/) A geospatial evaluation of timely access to surgical care in seven countries
- [Massenburg et al, 2017](http://gh.bmj.com/content/2/2/e000226) Assessing the Brazilian surgical system with six surgical indicators: a descriptive and modelling study
- [Esquivel et al, 2016](https://jamanetwork.com/journals/jamasurgery/fullarticle/2546329) Mapping Disparities in Access to Safe, Timely, and Essential Surgical Care in Zambia
- [Knowlton et al, 2016](https://www.journalacs.org/article/S1072-7515(16)31039-0/abstract) A Multinational Evaluation of Timely Access to Basic Surgical Services Using Geospatial Analyses
- [Ng-Kamstra et al, 2016](https://blogs.worldbank.org/opendata/measuring-surgical-systems-new-paradigm-health-systems-strengthening). Measuring surgical systems: a new paradigm for health systems strengthening


Please open an issue or [contact us](mailto:contact@redivis.com) if you'd like your publication included in this list!

## Methodology
This tool implements a standard [cost-distance algorithm](https://desktop.arcgis.com/en/arcmap/10.3/tools/spatial-analyst-toolbox/how-the-cost-distance-tools-work.htm) to efficiently compute the area within a particular travel time from the nearest facility, utilizing geospatial and road network information from OpenStreetMap. It then overlays this coverage area with rasterized population density data from WorldPop to compute the percentage of the region's population that is within this coverage area. 

If the setting "Use OSM road speeds" is turned on (the default), road speeds will first be based on the value for the `max_speed` attribute on the OSM data. However, this attribute is not always present - in these cases, or when the "Use OSM road speeds" setting is off, speed will be determined by the [road's classification](https://wiki.openstreetmap.org/wiki/Key:highway), as follows in kilometers per hour:
- trunk, motorway: 110 kph
- primary: 100 kph
- secondary: 80 kph
- tertiary: 50 kph
- residential, unclassified: 30 kph
- off-road: 15 kph
  
You can manually change these settings by running this tool locally (see "Local development" below) and modifying the `roadSpeeds` variable in `src/Map/LegacyMap/extensions/coverageAnalysis/index.js`

The cost-distance algorithm is computed over a pixel grid for each country, whose largest dimension is equivalent to the setting chosen for "resolution" (default, 1024). The implementation utilizes Javascript (ECMAScript) and canvas shaders available in the web browser to generate the visualization.

### Limitations
The outputs of this tool are estimates that utilize data that are imperfect and, in the case of the WorldPop population density data, estimates themselves. 

OpenStreetMap, while one of the most robust geospatial databases in the world, may not fully capture all road networks - some roads may be missing, and others may be inaccurately provided. 

Road speeds are estimated based upon the speed limit, when provided, or otherwise the type of road. This estimate does not take into account traffic conditions, road seasonality, or many other factors that exist in the real-world; generally, this will cause slight-overestimates in the data. We have compared travel times to those provided via Google Maps in various countries, and have generally found this tool's estimates to be within 20% of that provided by Google Maps.

Finally, the cost-distance algorithm is implemented over a grid, whose greatest dimension is equal to the setting chosen for "resolution" (default, 1024). The actual geographic size of a pixel in this grid is determined based on the total size of the region in question, divided by the resolution (e.g., a region 512km x 512km would have 500m per pixel at a resolution setting of 1024). Minor rounding errors may occur due to this pixelation, especially when analyzing larger regions.

## Contributing
### Feature requests and bugs reports
Please file an issue in this repository to report a bug or request a new feature!

### Local development
- clone this repository
- make sure [Node.js](https://nodejs.org) 22.15 or later is installed on your computer
- navigate to the cloned directory in a terminal, and run `npm install`, then `npm start`
- open http://localhost:8080/geo-coverage
- run `npm run lint` and `npm run format` before committing
- To deploy, merge changes to the `main` branch. This will automatically trigger a Github action to build assets and push to `gh-pages`
