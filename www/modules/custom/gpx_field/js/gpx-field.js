/**
 * @file
 * Javascript for gpx_field module.
 *
 */

(function ($, Drupal, drupalSettings) {
  "use strict";

  var maps = {};
  var charts = {};
  var infoPanes = {};
  var sliders = {};

  /**
   * Attaches the gpx field behaviour to gpx fields.
   *
   * Other callback functions that need to be in the global scope live in here.
   */
  Drupal.behaviors.gpx_field = {
    attach: function (context, settings) {

      // Only attach scripts on first page load.
      if (context === document) {

        // Load google maps script
        $.getScript(drupalSettings.gpx_field.google_map_url);

        // If charts library has been added load charts
        if (typeof google.charts !== 'undefined') {
          google.charts.load('current', {'packages': ['corechart']});
          google.charts.setOnLoadCallback(Drupal.behaviors.gpx_field.initChart);
        }

      }

    },
    initMap: function () {

      var gpxfSettings = drupalSettings.gpx_field;

      // Loop gpx map fields
      for (var field_name in gpxfSettings.fields) {
        if (gpxfSettings.fields.hasOwnProperty(field_name)) {
          var fieldSettings = gpxfSettings.fields[field_name];

          // Add latLng objects and distance to the track data points array
          gpxField.prepareTrackData(fieldSettings);

          // Create the map
          gpxField.createMap(field_name, fieldSettings);

          // Set the bounds and zoom,
          gpxField.setBounds(field_name, fieldSettings);

          if (fieldSettings.animatetrack) {

            // Create the camera track
            gpxField.createCameraTrack(field_name, fieldSettings);

            // Set up the info pane to control the animation
            gpxField.createInfoPane(field_name, fieldSettings);
          }
          else {
            // Draw one single multipoint polygon
            gpxField.drawSingleTrack(maps[field_name], fieldSettings);
          }
        }
      }
    },
    initChart: function () {

      var gpxfSettings = drupalSettings.gpx_field;

      // Loop gpx map fields
      for (var field_name in gpxfSettings.fields) {
        if (gpxfSettings.fields.hasOwnProperty(field_name)) {
          var fieldSettings = gpxfSettings.fields[field_name];
          if (fieldSettings.showelechart) {
            gpxField.createElevationChart(field_name, fieldSettings);
          }
        }
      }

    }
  };

  /**
   * All functions that can live in the local scope of gpx field.
   */
  var gpxField = {

    /**
     * Create the Google map
     */
    createMap: function (field_name, fieldSettings) {
      console.log(fieldSettings, 'fieldSettings');
      maps[field_name] = new google.maps.Map(document.getElementById('map-canvas-' + field_name), {
        mapTypeId: fieldSettings.mapType
      });
    },

    /**
     * Add a LatLng object and running distance to each node
     */
    prepareTrackData: function (fieldSettings) {
      var prevLatLng;
      for (var i = 0; i < fieldSettings.data.length; i++) {

        // Cast lat lng values as floats
        fieldSettings.data[i].lat = parseFloat(fieldSettings.data[i].lat);
        fieldSettings.data[i].lng = parseFloat(fieldSettings.data[i].lng);

        var latLng = new google.maps.LatLng(fieldSettings.data[i].lat, fieldSettings.data[i].lng);
        var distance = 0;
        if (typeof prevLatLng !== 'undefined') {
          distance = google.maps.geometry.spherical.computeDistanceBetween(prevLatLng, latLng);
        }
        fieldSettings.data[i].LatLng = latLng;
        fieldSettings.data[i].distance = distance;
        prevLatLng = latLng;
      }
    },

    /**
     * Set zoom and position based on the track
     */
    setBounds: function (field_name, fieldSettings) {
      var bounds = new google.maps.LatLngBounds();
      for (var i = 0; i < fieldSettings.data.length; i++) {
        bounds.extend(fieldSettings.data[i].LatLng);
      }


      // If the track is animated zoom in and centre on the start point
      if(fieldSettings.animatetrack) {
        gpxField.moveCamera(0, field_name, fieldSettings);

        var $mapDiv = $('#map-canvas-' + field_name);
        var mapDim = { height: $mapDiv.height(), width: $mapDiv.width() };
        var zoom = this.getBoundsZoomLevel(bounds, mapDim) + 2;

        maps[field_name].setZoom(zoom);

      }
      else {
        maps[field_name].fitBounds(bounds);
      }
    },

    /**
     * Get the zoom level for a given Google maps bounds object
     */
    getBoundsZoomLevel: function(bounds, mapDim) {

      var WORLD_DIM = { height: 256, width: 256 };
      var ZOOM_MAX = 21;

      function latRad(lat) {
        var sin = Math.sin(lat * Math.PI / 180);
        var radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
        return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
      }

      function zoom(mapPx, worldPx, fraction) {
        return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
      }

      var ne = bounds.getNorthEast();
      var sw = bounds.getSouthWest();

      var latFraction = (latRad(ne.lat()) - latRad(sw.lat())) / Math.PI;

      var lngDiff = ne.lng() - sw.lng();
      var lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

      var latZoom = zoom(mapDim.height, WORLD_DIM.height, latFraction);
      var lngZoom = zoom(mapDim.width, WORLD_DIM.width, lngFraction);

      return Math.min(latZoom, lngZoom, ZOOM_MAX);

    },

    /**
     * Draw the whole track as one line
     */
    drawSingleTrack: function (map, fieldSettings) {

      var coordinates = [];

      for (var i = 0; i < fieldSettings.data.length; i++) {
        coordinates.push(fieldSettings.data[i].LatLng);
      }

      var path = new google.maps.Polyline({
        path: coordinates,
        geodesic: true,
        strokeColor: fieldSettings.trColour,
        strokeOpacity: 1.0,
        strokeWeight: fieldSettings.trStroke
      });

      path.setMap(map);

    },

    /**
     * Build the elevation chart
     */
    createElevationChart: function (field_name, fieldSettings) {

      var track = fieldSettings.data;

      var data = new google.visualization.DataTable();
      data.addColumn('string', 'Time');
      data.addColumn('number', 'Elevation');

      var chartData = [];

      for (var i = 0; i < track.length; i++) {
        chartData.push([track[i].time, parseFloat(track[i].ele)]);
      }

      data.addRows(chartData);

      // Set chart options
      var options = {
        title: 'Elevation',
        // width: 400,
        height: 300,
        legend: 'none',
        titleX: 'Time',
        titleY: 'Elevation',
        chartArea: {'width': '100%', 'height': '80%'},
        hAxis: {showTextEvery: Math.round(track.length / 10)},
      };

      // Instantiate and draw our chart, passing in some options.
      charts[field_name] = new google.visualization.AreaChart(document.getElementById('elevation-chart-' + field_name));
      charts[field_name].draw(data, options);

      google.visualization.events.addListener(charts[field_name], 'select', this.elevationChartSelectHandler.bind(field_name) );
    },

    /**
     * Selection callback function for graph
     */
    elevationChartSelectHandler: function() {
      var field_name = this;
      var index = charts[field_name].getSelection()[0].row;
      var fieldSettings = drupalSettings.gpx_field.fields[field_name];
      gpxField.setPosition(index, field_name, fieldSettings);
    },

    /**
     * Set selection on graph to index passed in
     */
    setElevationChartSelection: function(index, field_name) {
      charts[field_name].setSelection([{'row': index, 'column': 1}]);
    },

    /**
     * Create a pane with track info (distance, time, etc)
     */
    createInfoPane: function (field_name, fieldSettings) {

      // Create slider
      var options = {
        min: 0,
        max: fieldSettings.data.length - 1,
        slide: this.slide
      };

      sliders[field_name] = $('.gpx-field-scrollbar', '#gpx-field-container-' + field_name);

      sliders[field_name].slider(options);

      infoPanes[field_name] = $('#info-pane-' + field_name);

      infoPanes[field_name].html('<dl>' +
          '<dt>Distance: </dt><dd class="distance"></dd>' +
          '<dt>Time: </dt><dd class="time"></dd>' +
          '<dt>Speed: </dt><dd class="speed"></dd>' +
          '<dt>Elevation: </dt><dd class="elevation"></dd>' +
          '</dl>');

      this.updateInfoPane(0, field_name, fieldSettings);

    },

    /**
     * Update the info pane with the latest info
     */
    updateInfoPane: function(index, field_name, fieldSettings) {

      var current = fieldSettings.data[index];
      infoPanes[field_name].find('.distance').html(this.formatDistance(fieldSettings.distance));
      infoPanes[field_name].find('.time').html(current.time);
      infoPanes[field_name].find('.elevation').html(current.ele + ' meters');
      infoPanes[field_name].find('.speed').html(this.movingAvgSpeed(index, field_name, fieldSettings));

    },

    /**
     * Calculate moving average over a maximum sample size of 10
     */
    movingAvgSpeed: function(index, field_name, fieldSettings) {

      var speed = 0;
      if(typeof(fieldSettings.data[index - 1]) !== 'undefined') {
        var maxSampleSize = 10;
        var sampleSize = index - maxSampleSize >= 0 ? maxSampleSize : index;

        var distanceMeters = 0;
        for(var i = index - sampleSize; i <= index; i++) {
          distanceMeters += fieldSettings.data[i].distance;
        }
        var distanceKms = distanceMeters / 1000;

        var timeSeconds = fieldSettings.data[index].ts - fieldSettings.data[index - sampleSize].ts;
        var timeHours = timeSeconds / 3600;

        speed = (Math.round(distanceKms / timeHours * 10) / 10) + ' km/h';
      }

      return speed;

    },

    /**
     * Format distance in meters or kms
     */
    formatDistance: function (meters) {
      if(meters === 0) {
        return '0';
      }
      if(meters > 100000) {
        return Math.round(meters / 1000) + ' kms'
      }
      if(meters > 1000) {
        return Math.round(meters / 100) / 10 + ' kms'
      }
      return Math.round(meters) + ' meters'
    },

    /**
     * Callback function for the slide event
     */
    slide: function (event, ui) {
      var field_name = $(this).parents('.gpx-field-container').attr('id').replace('gpx-field-container-', '');
      var fieldSettings = drupalSettings.gpx_field.fields[field_name];
      gpxField.setPosition(ui.value, field_name, fieldSettings);
    },

    setPosition: function(index, field_name, fieldSettings) {
      gpxField.showHideLines(index, field_name, fieldSettings);
      gpxField.moveCamera(index, field_name, fieldSettings);
      gpxField.updateInfoPane(index, field_name, fieldSettings);
      gpxField.setElevationChartSelection(index, field_name);
      sliders[field_name].slider('value', index);
    },

    /**
     * Show or hide lines based on the slider position
     */
    showHideLines: function (index, field_name, fieldSettings) {
      fieldSettings.distance = 0;
      for (var i = 1; i <= fieldSettings.data.length - 1; i++) {
        if (i <= index) {
          this.showLine(i, field_name, fieldSettings);
        }
        else {
          this.hideLine(i, field_name, fieldSettings);
        }
      }
    },

    /**
     * Show all lines before current index
     */
    showLine: function (i, field_name, fieldSettings) {

      // If line doesn't exist then create it
      if (typeof fieldSettings.data[i].line === 'undefined') {
        fieldSettings.data[i].line = new google.maps.Polyline({
          path: [fieldSettings.data[i - 1].LatLng, fieldSettings.data[i].LatLng],
          strokeColor: "#FF0000",
          strokeOpacity: 1.0,
          strokeWeight: 2,
          map: maps[field_name]
        });
        fieldSettings.data[i].visible = true;
      }

      // If line is hidden show it
      if (!fieldSettings.data[i].visible) {
        fieldSettings.data[i].line.setMap(maps[field_name]);
        fieldSettings.data[i].visible = true;
      }

      // Update the current distance
      fieldSettings.distance += fieldSettings.data[i].distance;

    },

    /**
     * Hide all lines after current index
     */
    hideLine: function (i, field_name, fieldSettings) {
      if (typeof fieldSettings.data[i].visible !== 'undefined' && fieldSettings.data[i].visible) {
        fieldSettings.data[i].line.setMap(null);
        fieldSettings.data[i].visible = false;
      }
    },

    /**
     * Set camera based on current index
     */
    moveCamera: function(i, field_name, fieldSettings) {
      maps[field_name].setCenter(new google.maps.LatLng(fieldSettings.data[i].camera.lat, fieldSettings.data[i].camera.lng));
    },

    /**
     * Add points and a line to show the camera track.
     * Only used for debugging purposes.
     */
    createCameraTrack: function (field_name, fieldSettings) {

      // Add points
      var image = 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
      for (var i = 0; i <= fieldSettings.camera_track_points.length - 1; i++) {

        var lat = parseFloat(fieldSettings.camera_track_points[i]['lat']);
        var lng = parseFloat(fieldSettings.camera_track_points[i]['lng']);

        var marker = new google.maps.Marker({
          position: {lat: lat, lng: lng},
          map: maps[field_name],
          title: 'Point ' + i + '. (Lat: ' + lat + ', Lng: ' + lng + ')',
          icon: image
        });
      }

      // Draw line
      var cameraTrack = [];
      for (i = 0; i <= fieldSettings.data.length - 1; i++) {
        cameraTrack.push({lat: fieldSettings.data[i].camera.lat, lng: fieldSettings.data[i].camera.lng});
      }

      var cameraLine = new google.maps.Polyline({
        path: cameraTrack,
        geodesic: true,
        strokeColor: '#0000FF',
        strokeOpacity: 1.0,
        strokeWeight: 1
      });

      cameraLine.setMap(maps[field_name]);

    },
  };

})(jQuery, Drupal, drupalSettings);
