/**
 * @file
 * Javascript for gpx_field module.
 *
 */

(function ($, Drupal, drupalSettings) {
  "use strict";

  /**
   * Attaches the gpx field behaviour to gpx fields.
   *
   * Other callback functions that need to be in the global scope live in here.
   */
  Drupal.behaviors.gpx_field = {

    /**
     * Call back for page ready.
     */
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

    /**
     * Callback for when the map js is ready.
     */
    initMap: function () {

      var gpxfSettings = drupalSettings.gpx_field;

      // Loop gpx map fields
      for (var field_name in gpxfSettings.fields) {
        if (gpxfSettings.fields.hasOwnProperty(field_name)) {
          var fieldSettings = gpxfSettings.fields[field_name];
          fieldSettings.fieldName = field_name;

          // Add latLng objects and distance to the track data points array
          gpxField.prepareTrackData(fieldSettings);

          // Create the map
          gpxField.createMap(fieldSettings);

          // Set the bounds and zoom,
          gpxField.setBounds(fieldSettings);

          if (fieldSettings.animatetrack) {

            // Create the camera track
            if(gpxField.showCameraTrack) {
              gpxField.createCameraTrack(fieldSettings);
            }

            // Set up the info pane to control the animation
            gpxField.createInfoPane(fieldSettings);
          }
          else {
            // Draw one single multipoint polygon
            gpxField.drawSingleTrack(fieldSettings.map, fieldSettings);
          }
        }
      }

      // Check if gpx images is installed and needs initializing
      if(typeof Drupal.behaviors.gpx_images.init === 'function') {
        Drupal.behaviors.gpx_images.init(fieldSettings);
      }

    },

    /**
     * Callback when the chart JS has loaded.
     */
    initChart: function () {
      var gpxfSettings = drupalSettings.gpx_field;

      // Loop gpx map fields
      for (var field_name in gpxfSettings.fields) {
        if (gpxfSettings.fields.hasOwnProperty(field_name)) {
          var fieldSettings = gpxfSettings.fields[field_name];
          if (fieldSettings.showelechart) {
            gpxField.createElevationChart(fieldSettings);
          }
        }
      }

    },

    /**
     * Set the position for the slider, map and chart.
     */
    setPosition: function(index, fieldSettings) {

      if(typeof fieldSettings.index === 'undefined') {
        fieldSettings.index = 0;
      }

      // GPX field container is just a dummy object we animate so we can use
      // the step callback function to do our actual animation.

      // Set initial value to current index
      $('.gpx-field-container').css({left: fieldSettings.index});

      // And animate to the new index
      $('.gpx-field-container').animate({
        left: index
      }, {
        step: function( now, fx ) {
          var currentIndex = Math.round(now);

          gpxField.showHideLines(currentIndex, fieldSettings);
          gpxField.moveCamera(currentIndex, fieldSettings);
          fieldSettings.chart.setSelection([{'row': currentIndex, 'column': 1}]);
          fieldSettings.slider.slider('value', currentIndex);
          gpxField.updateInfoPane(currentIndex, fieldSettings);

          // Check if gpx images is installed and call slide event
          if(typeof Drupal.behaviors.gpx_images.slide === 'function') {
            Drupal.behaviors.gpx_images.slide(currentIndex, fieldSettings);
          }
        },
        complete: function(){
          fieldSettings.index = index;
        }
      });
    },

    /**
     * Set the position for the slider, map and chart.
     */
    setPositionOld: function(index, fieldSettings) {
      gpxField.showHideLines(index, fieldSettings);
      gpxField.moveCamera(index, fieldSettings);
      gpxField.updateInfoPane(index, fieldSettings);
      fieldSettings.chart.setSelection([{'row': index, 'column': 1}]);
      fieldSettings.slider.slider('value', index);

      // Check if gpx images is installed and call slide event
      if(typeof Drupal.behaviors.gpx_images.slide === 'function') {
        Drupal.behaviors.gpx_images.slide(index, fieldSettings);
      }
    },
  };

  /**
   * All functions that can live in the local scope of gpx field.
   */
  var gpxField = {

    // Set to true to draw the camera track on the map.
    showCameraTrack: false,

    /**
     * Create the Google map.
     */
    createMap: function (fieldSettings) {
      // console.log(fieldSettings, 'fieldSettings');
      fieldSettings.map = new google.maps.Map(document.getElementById('map-canvas-' + fieldSettings.fieldName), {
        mapTypeId: fieldSettings.mapType
      });

      // Add callback for when zoom changes
      google.maps.event.addListener(fieldSettings.map, 'zoom_changed', this.mapZoomChangeCallback.bind(fieldSettings));
    },

    /**
     * Callback when the Google map zoom changes.
     * Used to swap the course and fine granularity camera track.
     */
    mapZoomChangeCallback: function() {
      var fieldSettings = this;
      if(gpxField.showCameraTrack) {
        gpxField.createCameraTrack(fieldSettings);
      }
    },

    /**
     * Add a LatLng object and distance to each node.
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
     * Set zoom and position based on the track.
     */
    setBounds: function (fieldSettings) {
      var bounds = new google.maps.LatLngBounds();
      for (var i = 0; i < fieldSettings.data.length; i++) {
        bounds.extend(fieldSettings.data[i].LatLng);
      }

      // If the track is animated zoom in and centre on the start point
      if(fieldSettings.animatetrack) {
        gpxField.moveCamera(0, fieldSettings);

        var $mapDiv = $('#map-canvas-' + fieldSettings.fieldName);
        var mapDim = { height: $mapDiv.height(), width: $mapDiv.width() };
        var zoom = this.getBoundsZoomLevel(bounds, mapDim) + 2;

        fieldSettings.map.setZoom(zoom);

      }
      else {
        fieldSettings.map.fitBounds(bounds);
      }
    },

    /**
     * Get the zoom level for a given Google maps bounds object.
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
     * Draw the whole track as one line.
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
     * Build the elevation chart.
     */
    createElevationChart: function (fieldSettings) {

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
      fieldSettings.chart = new google.visualization.AreaChart(document.getElementById('elevation-chart-' + fieldSettings.fieldName));
      fieldSettings.chart.draw(data, options);

      google.visualization.events.addListener(fieldSettings.chart, 'select', this.elevationChartSelectHandler.bind(fieldSettings));
    },

    /**
     * Selection callback function for graph.
     */
    elevationChartSelectHandler: function() {
      var fieldSettings = this;
      var index = fieldSettings.chart.getSelection()[0].row;
      Drupal.behaviors.gpx_field.setPosition(index, fieldSettings);
    },

    /**
     * Create a pane with track info (distance, time, etc).
     */
    createInfoPane: function (fieldSettings) {

      // Create slider
      var options = {
        min: 0,
        max: fieldSettings.data.length - 1,
        slide: this.slide
      };

      fieldSettings.slider = $('.gpx-field-scrollbar', '#gpx-field-container-' + fieldSettings.fieldName);
      fieldSettings.slider.slider(options);
      fieldSettings.infoPanes = $('#info-pane-' + fieldSettings.fieldName);

      fieldSettings.infoPanes.html('<dl>' +
          '<dt>Distance: </dt><dd class="distance"></dd>' +
          '<dt>Time: </dt><dd class="time"></dd>' +
          '<dt>Date: </dt><dd class="date"></dd>' +
          '<dt>Speed: </dt><dd class="speed"></dd>' +
          '<dt>Elevation: </dt><dd class="elevation"></dd>' +
          '</dl>');

      this.updateInfoPane(0, fieldSettings);

    },

    /**
     * Update the info pane with the latest info.
     */
    updateInfoPane: function(index, fieldSettings) {

      var current = fieldSettings.data[index];
      fieldSettings.infoPanes.find('.distance').html(this.formatDistance(fieldSettings.distance));
      fieldSettings.infoPanes.find('.time').html(current.time);
      fieldSettings.infoPanes.find('.date').html(current.date);
      fieldSettings.infoPanes.find('.elevation').html(current.ele + ' meters');
      fieldSettings.infoPanes.find('.speed').html(this.movingAvgSpeed(index, fieldSettings));

    },

    /**
     * Calculate moving average over a maximum sample size of 10.
     */
    movingAvgSpeed: function(index, fieldSettings) {

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
     * Format distance in meters or kms.
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
     * Callback function for the slide event.
     */
    slide: function (event, ui) {
      var field_name = $(this).parents('.gpx-field-container').attr('id').replace('gpx-field-container-', '');
      var fieldSettings = drupalSettings.gpx_field.fields[field_name];
      Drupal.behaviors.gpx_field.setPosition(ui.value, fieldSettings);
    },



    /**
     * Show or hide lines based on the slider position.
     */
    showHideLines: function (index, fieldSettings) {
      fieldSettings.distance = 0;
      for (var i = 1; i <= fieldSettings.data.length - 1; i++) {
        if (i <= index) {
          this.showLine(i, fieldSettings);
        }
        else {
          this.hideLine(i, fieldSettings);
        }
      }
    },

    /**
     * Show line with index passed in.
     */
    showLine: function (i, fieldSettings) {

      // If line doesn't exist then create it
      if (typeof fieldSettings.data[i].line === 'undefined') {
        fieldSettings.data[i].line = new google.maps.Polyline({
          path: [fieldSettings.data[i - 1].LatLng, fieldSettings.data[i].LatLng],
          strokeColor: fieldSettings.trColour,
          strokeOpacity: 1.0,
          strokeWeight: fieldSettings.trStroke,
          map: fieldSettings.map
        });
        fieldSettings.data[i].visible = true;
      }

      // If line is hidden show it
      if (!fieldSettings.data[i].visible) {
        fieldSettings.data[i].line.setMap(fieldSettings.map);
        fieldSettings.data[i].visible = true;
      }

      // Update the current distance
      fieldSettings.distance += fieldSettings.data[i].distance;

    },

    /**
     * Hide line with index passed in.
     */
    hideLine: function (i, fieldSettings) {
      if (typeof fieldSettings.data[i].visible !== 'undefined' && fieldSettings.data[i].visible) {
        fieldSettings.data[i].line.setMap(null);
        fieldSettings.data[i].visible = false;
      }
    },

    /**
     * Set camera position based on current index.
     */
    moveCamera: function(i, fieldSettings) {
      var resolution = this.getCameraTrackResolution(fieldSettings);
      fieldSettings.map.setCenter(new google.maps.LatLng(fieldSettings.data[i].camera[resolution].lat, fieldSettings.data[i].camera[resolution].lng));
    },

    /**
     * Add points and a line to show the camera track.
     * Only used for debugging purposes.
     */
    createCameraTrack: function (fieldSettings) {

      var resolution = this.getCameraTrackResolution(fieldSettings);

      if(typeof fieldSettings.cameraTrack === 'undefined') {
        fieldSettings.cameraTrack = {};
      }
      if(typeof fieldSettings.cameraTrack[resolution] === 'undefined') {
        fieldSettings.cameraTrack[resolution] = {};
        fieldSettings.cameraTrack[resolution].markers = [];
      }

      if(fieldSettings.cameraTrack[resolution].markers.length === 0) {

        // Add points
        var image = 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
        for (var i = 0; i <= fieldSettings.camera_track_points[resolution].length - 1; i++) {

          var lat = parseFloat(fieldSettings.camera_track_points[resolution][i]['lat']);
          var lng = parseFloat(fieldSettings.camera_track_points[resolution][i]['lng']);

          fieldSettings.cameraTrack[resolution].markers.push(new google.maps.Marker({
            position: {lat: lat, lng: lng},
            map: fieldSettings.map,
            title: 'Point ' + i + '. (Lat: ' + lat + ', Lng: ' + lng + ')',
            icon: image
          }));
        }
      }
      else {

        for (var i = 0; i <= fieldSettings.cameraTrack[resolution].markers.length - 1; i++) {
          fieldSettings.cameraTrack[resolution].markers[i].setMap(fieldSettings.map);
        }

      }

      if(typeof fieldSettings.cameraTrack[resolution].cameraLine === 'undefined') {

        // Draw line
        var cameraTrack = [];
        for (i = 0; i <= fieldSettings.data.length - 1; i++) {
          cameraTrack.push({lat: fieldSettings.data[i].camera[resolution].lat, lng: fieldSettings.data[i].camera[resolution].lng});
        }

        fieldSettings.cameraTrack[resolution].cameraLine = new google.maps.Polyline({
          path: cameraTrack,
          geodesic: true,
          strokeColor: '#0000FF',
          strokeOpacity: 1.0,
          strokeWeight: 1
        });

        fieldSettings.cameraTrack[resolution].cameraLine.setMap(fieldSettings.map);
      }
      else {
        fieldSettings.cameraTrack[resolution].cameraLine.setMap(fieldSettings.map);
      }

      // Hide other resolutions points and lines
      var otherResolution = resolution === 'normal' ? 'fine' : 'normal';
      if(typeof fieldSettings.cameraTrack[otherResolution] !== 'undefined') {
        fieldSettings.cameraTrack[otherResolution].cameraLine.setMap(null);
        for (var i = 0; i <= fieldSettings.cameraTrack[otherResolution].markers.length - 1; i++) {
          fieldSettings.cameraTrack[otherResolution].markers[i].setMap(null);
        }
      }

    },

    /**
     * Determine the correct camera track to use based off the zoom level.
     */
    getCameraTrackResolution: function(fieldSettings) {
      var zoom = fieldSettings.map.getZoom();
      return zoom > 13 ? 'fine' : 'normal';
    }
  };

})(jQuery, Drupal, drupalSettings);
