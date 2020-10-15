// Function for creating map
function createMap(GeoJsonLayer, platesLayer){
    // Add multiple tile layers
    var satelliteMap = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
        tileSize: 512,
        maxZoom: 18,
        zoomOffset: -1,
        id: "mapbox/satellite-v9",
        accessToken: API_KEY
    })

    var outdoorsMap = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
        tileSize: 512,
        maxZoom: 18,
        zoomOffset: -1,
        id: "mapbox/outdoors-v11",
        accessToken: API_KEY
    })

    var grayScaleMap = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
        tileSize: 512,
        maxZoom: 18,
        zoomOffset: -1,
        id: "mapbox/light-v10",
        accessToken: API_KEY
    })

    var darkMap = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
        tileSize: 512,
        maxZoom: 18,
        zoomOffset: -1,
        id: "mapbox/dark-v10",
        accessToken: API_KEY
    })
    
    // Create a baseMaps object
    var baseMaps = {
        Satellite: satelliteMap,
        Outdoors: outdoorsMap,
        Grayscale: grayScaleMap,
        Dark: darkMap
    }

    // Create an overlayMaps object
    var overlayMaps = {
        'Fault Lines': platesLayer,
        Earthquakes: GeoJsonLayer
    }
    // Define a myMap object
    var myMap = L.map('map',{
        center:[37.0902, -95.7129],
        zoom: 5,
        layers: [satelliteMap, platesLayer, GeoJsonLayer]
    })
    
    // Pass our map layers into our layer control
    // Add the layer control to the map
    L.control.layers(baseMaps, overlayMaps, {
        collapsed: false
    }).addTo(myMap);
    
    return myMap;
}

// Function for creating GeoJSON layer
function createGeoJsonLayer(data){
    var GeoJsonLayer = L.geoJson(data,{
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, {
                radius: getRadius(feature.properties.mag),
                fillColor: getColor(feature.properties.mag),
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            });
        },
        onEachFeature: function(feature, layer){
            layer.bindPopup(`<h3>${feature.properties.place}</h3><hr><span>Magnitude: ${feature.properties.mag}</span>`)
        }
    })
    return GeoJsonLayer;
}

// Function for creating legend
function createLegend(map){
    // Create a legend
    var legend = L.control({position: 'bottomright'});

    legend.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'info legend'),
            mag = [0,1, 2, 3, 4, 5]
        div.innerHTML += "<h4>Magnitude Level</h4><hr>"
        // loop through our density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < mag.length; i++) {
            div.innerHTML +=
                '<i style="background:' + getColor(mag[i] + 1) + '"></i> ' +
                mag[i] + (mag[i + 1] ? '&ndash;' + mag[i + 1] + '<br>' : '+');
        }
        return div;
    };
    legend.addTo(map);
    // Legend source: https://leafletjs.com/examples/choropleth/
    // More on legend: https://codepen.io/haakseth/pen/KQbjdO
}



// Function to determine circle color based on the magnitude 
function getColor(magnitude){
    switch(true){
        case (magnitude <= 1):
            return '#ccff66';
            break;
        case (magnitude <= 2):
            return '#ffff66';
            break;
        case (magnitude <= 3):
            return '#ff9933';
            break;
        case (magnitude <= 4):
            return '#ff5050';
            break;
        case (magnitude <= 5):
            return '#ff0066';
            break;
        case (magnitude > 5):
            return '#990099';
            break;
        default:
            return '#cccccc';
            break;
    }
}



// Function to determine circle radius based on the magnitude 
function getRadius(magnitude){
    switch(true){
        case (magnitude <= 1):
            return 5;
            break;
        case (magnitude <= 2):
            return 7;
            break;
        case (magnitude <= 3):
            return 9;
            break;
        case (magnitude <= 4):
            return 11;
            break;
        case (magnitude <= 5):
            return 13;
            break;
        case (magnitude > 5):
            return 15;
            break;
        default:
            return 1;
            break;
    }
}  

// File path for the Data on tectonic plates
var platesJsonPath = "static/data/PB2002_plates.json"
d3.json(platesJsonPath).then(function(platesData){
    var platesLayer = L.geoJson(platesData,{
        style: function(feature) {
            return {
                color: "#F0ED0E",
                fillColor: "white",
                fillOpacity:0
            };
        },
        onEachFeature: function(feature, layer){
            layer.bindPopup(`<span>Plate: ${feature.properties.PlateName}</span>`)
        }
    })
    
    var GeoJSONUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"
    d3.json(GeoJSONUrl).then(function(earthquakeData){
        
        var GeoJsonLayer = createGeoJsonLayer(earthquakeData);
        var myMap = createMap(GeoJsonLayer,platesLayer);
        createLegend(myMap)
});
})





