import MapConfiguration from "./MapConfiguration.js";
import MapFeature from "./MapFeature.js";

const MapApplication = (function () {
  const cache = [];

  function MapApplication(conf) {
    this.repo = conf.repository;
    this.config = new MapConfiguration(conf);
    this.features = []; // array of MapFeature objects.
    this.map = null;
    this.defaultMarkerCoordinates = this.config.mapOptions.center;
    this.defaultMarkerSize =
      this.config.mapOptions.defaultMarkerStyles.icon.scaledSize;
  }

  // Set up the maps script and initialize the map object
  // Return the Promise
  function init(fn) {

    // If any initialization functions were supplied, execute them.
    let results = !!fn ? Promise.all(fn.map((func) => { return func(this);})) : Promise.resolve("Nothing to initialize.");
    

    var apiKey = this.config.apiKey;

    if (!document.getElementById('map-script'))
    {
        var p = new Promise(function (resolve) {
        let mapElement = document.createElement("script");
        mapElement.async = true;
        mapElement.defer = true;
        mapElement.setAttribute('id', 'map-script');
        mapElement.src = "https://maps.googleapis.com/maps/api/js?key=" + apiKey;
        mapElement.onload = resolve;

        document.head.appendChild(mapElement);
        });


    var mapReady = p.then(() => {
      results.then(() => {
        this.map = new google.maps.Map(
          document.getElementById("map"),
          this.config.mapOptions
        );
      });
    });

    return mapReady;
}
else {
    return results;
}
  }

  function getCache(key) {
    return cache[key];
  }

  function setCache(key, data) {
    cache[key] = data;
  }

  // This gets called during startup
  // Loads in the data for each feature
  // Does not initialize all features, just prepares the data for each feature
  function loadFeatureData() {
    for (var MapFeature in this.features) {
      // Set up the new feature
      let feature = this.features[MapFeature];
      //load markers after data, awaiting
      feature.loadData().then(() => feature.loadMarkers());
      feature.isInitialized = true;
    }
  }

  /**
   * Set up each feature, then call loadFeatureData()
   *  to set up data for each feature
   */
  function loadFeatures(config) {
    for (var name in config) {
      // Set up the new feature
      let f = new MapFeature(config[name]);
      f.setMap(this);
      this.features.push(f);
    }
  }


  function addFeature(f) {
    f.setMap(this);
    let name = f.name;
    if(!!this.getFeature(name)) {
      this.features = this.features.filter(f => f.name != name);
    }
    this.features.push(f);
  }


  function sortFeatureData() {
    console.log(this.features);
  }

  // Google maps requires "lat" & "lng" fields
  function setLocation(lat, lng) {
    let coords = null == lng ? lat : this.toCoordinates(lat, lng);

    return {
      lat: coords.latitude,
      lng: coords.longitude,
    };
  }

  function toCoordinates(lat, lng) {
    return {
      lat: lat,
      lng: lng,
    };
  }

  // Pan will set the center point for the map
  function pan(coordinates) {
    let pos = {
      lat: coordinates.latitude,
      lng: coordinates.longitude,
    };

    // Set the new center position
    this.map.setCenter(pos);
  }

  function isVisible(feature) {
    // find the feature
    let f = this.features.find((element) => element.name == feature);

    //console.log(f); feature check
    // check its map property
    if (f.markers[0].map !== null) {
      return true;
    }
    return false;
  }



  function removeFeature(feature) {
    // Remove something from this.features.
    // Once removed renderAll and hideAll won't have any effect on it.
    // However, removing a feature should probably also "hide" it from the map.
  }

  /**
   * Render any number of map features, layers, geometry or markers.
   */
  function showFeature(name) {
    let f = this.getFeature(name);

    if (!f) {
      console.error("Could not locate Feature, ", name);
      return;
    }
    f.render(this.map);
  }
  function hideFilters() {
    document.getElementById("filters").style.display = "none";
  }
  function showFilters() {
    document.getElementById("filters").style.display = "block";
  }
  /**
   * Hide keeps the data and the feature is still yet initialized.
   */
  function hideFeature(name) {
    let f = this.getFeature(name);

    if (!f) {
      console.error("Could not locate Feature, ", name);
      return;
    }
    f.hide();
  }

  function getFeature(name) {
    return this.features.find((feature) => feature.name == name);
  }

  // Hide multiple features, i.e., all of this map's features.
  function hideFeatures() {
    // Set the map for each marker to null
    for (let i = 0; i < this.features.length; i++) {
      this.features[i].hide();
    }
  }

  function getRoot() {
    return document.getElementById(this.config.get("target"));
  }

  // This will work through an array of coordinates and recenter the map to the coordinates
  // Meant to replicate a users moving position
  function replay(positions) {
    // Set up a counter and a timer to replicate user movements
    let counter = 0;
    let replayTimer = setInterval(function () {
      // Test to see if the end of the array has been met
      if (counter == positions.length - 1) {
        // Clear the timer, console log needed messages, and exit the function
        clearInterval(replayTimer);
        console.log(counter);
        console.log("User position tracking has finished");
        return;
      }

      // Close any currently open userInfoWindows, pan to the new position
      // Console.log the counter to keep track of positions and increment the counter
      window.userInfoWindow.close();
      pan(positions[counter]);
      console.log(counter);
      counter++;
    }, 5000);
  }

  // Testing render here using new marker classes
  function render(markers) {
    markers = Array.isArray(markers) ? markers : [markers];

    for (let i = 0; i < markers.length; i++) {
      let marker = markers[i];
      if (null == marker.position.lat && null == marker.position.lng) {
        marker.setPosition(this.defaultMarkerCoordinates);
      }
      marker.setIconSize(this.defaultMarkerSize);
      marker.createMarker().setMap(this.map);
    }
  }

  var prototype = {
    init: init,
    replay: replay,
    pan: pan,
    getMap: function () {
      return this.map;
    },
    getRoot: getRoot,
    getCache: getCache,
    setCache: setCache,
    getFeature: getFeature,
    addFeature: addFeature,
    showFeature: showFeature,
    hideFeature: hideFeature,
    loadFeatureData: loadFeatureData,
    loadFeatures: loadFeatures,
    isVisible: isVisible,
    render: render,
    hideFilters: hideFilters,
    showFilters: showFilters
  };
  MapApplication.prototype = prototype;

  return MapApplication;
})();

export default MapApplication;
