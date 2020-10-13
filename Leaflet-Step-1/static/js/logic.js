

//Tile layer for the background of our map
var lightMap,map,layers, baseMaps;
const STARTINGLOCATION = [2, -5];  
const STARTINGZOOM = 2;

// url for background map tiles.
const LIGHTTILES = "https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/256/{z}/{x}/{y}?access_token={accessToken}";
const ATTRIBUTION = "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>";

// geoJSON file with the tectonic plate boundries.
const GEO_PLATES = "./static/Resources/PB2002_boundaries.json";  

// URL of the earthquake data
const EARTH_QUAKES = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
var earthquakeFeatures = null;
var generatedDate = null;
var quakeCount;  
var overlays;

// Gets base world map and creates background map.

// Setting up the map overlay layers.
function createBaseMap() {
  lightMap = L.tileLayer(LIGHTTILES, {
    attribution: ATTRIBUTION,
    maxZoom: 18,
    id: "mapbox.light",
    accessToken: API_KEY
  });

 // Initialize all of the required LayerGroups 
  layers = {
    MAG13: new L.layerGroup(),
    MAG35: new L.layerGroup(),
    MAG58: new L.layerGroup(),
    MAG810: new L.layerGroup()
  };

// Create the map with layers
  map = L.map("map-id", {
    center: STARTINGLOCATION,
    zoom: STARTINGZOOM,
    layers: [
      layers.MAG13,
      layers.MAG35,
      layers.MAG58,
      layers.MAG810,
    ]
  });
  
// Dictionary to track the count of each magnitude range.
  quakeCount = {
    MAG13: 0,
    MAG35: 0,
    MAG58: 0,
    MAG810: 0
  };

// Adding 'lightMap' tile layer to the map as a default map.
  lightMap.addTo(map);
}; 

// Adds the tectonic plate boundries to the map.
function createPlateBoundries() {
  d3.json(GEO_PLATES, function (platesFeature) {
    d3.json(EARTH_QUAKES, function (quakesFeature) {

      generatedDate = new Date(quakesFeature.metadata.generated);
      earthquakeFeatures = quakesFeature;
      createQuakes();
      updateLegend(generatedDate.toDateString());
    });
    L.geoJSON(platesFeature).addTo(layers["PLATES"]);

  });
};

// Function to adjust the size of the circle. 

function radiusCompensation(radius, mapLatitude) {
  let latitude = Math.abs(mapLatitude);
  let pi = Math.PI;
  
// Mercator projection calculation found on GIS and other places.
  let adjustedRadius = (radius / (2 * pi)) * Math.log(Math.tan(pi / 4 + (latitude / 2) * pi / 180));
  
// a fudge factor
  adjustedRadius = adjustedRadius * 2.7;

  return adjustedRadius.toFixed(2);
};

// Creates the circle with the appropriate size, color, and location.

function createCircle(lat, lng, level, title) {
  let circle;
  if (level >= 1 && lat <= 85 && lat >= -85) {  
    let colors = getColor(level);

// Determine radius.
    let radius = level * 70000;
    radius = radius - radiusCompensation(radius, Math.abs(lat));

    let color = colors[0];
    let fillColor = colors[1];

    circle = L.circle([lat, lng], {
      color: color,
      fillColor: fillColor,
      fillOpacity: 0.5,
      radius: radius
    });

    let popMsg = "<strong>" + title + "</strong><br>Latitude: " +
      lat + "<br> Longitude: " +
      lng + "<br>Magnitude: "
      + level;

    circle.bindPopup(popMsg);
    let mag = "MAG13";

    if (level >= 8.0) {
      mag = "MAG810";
    }
    else if (level >= 5) {
      mag = "MAG58";
    }
    else if (level >= 3) {
      mag = "MAG35";
    };
    circle.addTo(layers[mag]);
    quakeCount[mag]++;
  };
};

// Gets the assigned circle color and fillColor.

function getColor(level) {
  let color = "#81A756";
  let fillColor = "#DAF7A6";

  if (level >= 8.0) {
    color = "#900C3F";
    fillColor = "#C70039";
  }
  else if (level >= 5) {
    color = "#CC3211";
    fillColor = "#FF5733";
  }
  else if (level >= 3) {
    color = "#D1A000";
    fillColor = "#FFC300";
  };
  return [color, fillColor];
};

// Loops through the earthquake features, extracts the needed data and creates a circle for it.
function createQuakes() {
  let features = earthquakeFeatures.features;
  for (var i = 0; i < features.length; i++) {
    let mag = features[i].properties.mag;
    let lat = features[i].geometry.coordinates[0];
    let lng = features[i].geometry.coordinates[1];
    let title = features[i].properties.title;
    createCircle(lat, lng, mag, title);
  };
};

// Create an overlays object to add to the layer control

function createOverlays() {

  overlays = {
    "Plates": layers.PLATES,
    "Magnitude 1-3": layers.MAG13,
    "Magnitude 3-5": layers.MAG35,
    "Magnitude 5-8": layers.MAG58,
    "Magnitude 8 - 10": layers.MAG810,
  };
};
// Add Control and the Legend
function createControl() {

// Create a legend to display information about our map
  var info = L.control({
    position: "bottomright"
  });

// When the layer control is added, insert a div with the class of "legend"
  info.onAdd = function () {
    var div = L.DomUtil.create("div", "legend");
    return div;
  };
// Add the info legend to the map
  info.addTo(map);
};

// Creates the HTML for the legend using a table.
// generate current Time 
// returns legendTable - HTML string.
function setLegendTable(genTime) {
  var legendTable = "<table>" +
    "<caption>" + genTime + "</caption>" +
    "<tr><th>Magnitude</th><th>Count</th></tr>" +
    "<tr class='one'>  <td>1.0 - 3.0</td><td>" + quakeCount.MAG13 + "</td></tr>" +
    "<tr class='three'><td>3.0 - 5.0</td><td>" + quakeCount.MAG35 + "</td></tr>" +
    "<tr class='five'> <td>5.0 - 8.0</td><td>" + quakeCount.MAG58 + "</td></tr>" +
    "<tr class='eight'><td>8.0 - 10.0</td><td>" + quakeCount.MAG810 + "</td></tr>" +
    "</table>";
  return legendTable;
};

// Update the legend's innerHTML with the data retrieval time and quake count.
function updateLegend(genTime) {
  document.querySelector(".legend").innerHTML = [

    "<p>" + setLegendTable(genTime) + "</p>",

  ].join("");
};

// Start it all up.
createBaseMap();
createOverlays();
createPlateBoundries();
createControl();
