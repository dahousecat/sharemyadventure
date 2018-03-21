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
  var cameraTracks = {};
  var cameraTrackCoords = {};

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
          gpxField.setBounds(maps[field_name], fieldSettings);

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
            gpxField.drawElevationChart(field_name, fieldSettings);
          }
        }
      }

    }
  };

  /**
   * All functions that can live in the local scope of gpx field.
   */
  var gpxField = {
    createMap: function (field_name, fieldSettings) {
      maps[field_name] = new google.maps.Map(document.getElementById('map-canvas-' + field_name), {
        mapTypeId: fieldSettings.mapType
      });
    },
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
    setBounds: function (map, fieldSettings) {
      var bounds = new google.maps.LatLngBounds();
      for (var i = 0; i < fieldSettings.data.length; i++) {
        bounds.extend(fieldSettings.data[i].LatLng);
      }
      map.fitBounds(bounds);
    },
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
    drawElevationChart: function (field_name, fieldSettings) {

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
        hAxis: {showTextEvery: Math.round(track.length / 10)},
      };

      // Instantiate and draw our chart, passing in some options.
      charts[field_name] = new google.visualization.AreaChart(document.getElementById('elevation-chart-' + field_name));
      charts[field_name].draw(data, options);

    },
    createInfoPane: function (field_name, fieldSettings) {

      infoPanes[field_name] = $('#info-pane-' + field_name);
      infoPanes[field_name].html('<div class="gpx-field-slider"></div>');

      var options = {
        min: 0,
        max: fieldSettings.data.length,
        slide: this.slide
      };

      infoPanes[field_name].find('.gpx-field-slider').slider(options);


    },
    slide: function (event, ui) {

      var field_name = $(this).parent().attr('id').replace('info-pane-', '');
      var fieldSettings = drupalSettings.gpx_field.fields[field_name];

      gpxField.showHideLines(ui.value, field_name, fieldSettings);

      // console.log(ui.value);
      // console.log($(this).parent().attr('id').replace('info-pane-', ''));

    },
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
    showLine: function (i, field_name, fieldSettings) {

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

      if (!fieldSettings.data[i].visible) {
        fieldSettings.data[i].line.setMap(maps[field_name]);
        fieldSettings.data[i].visible = true;
      }

      fieldSettings.distance += fieldSettings.data[i].distance;

    },
    hideLine: function (i, field_name, fieldSettings) {

      if (typeof fieldSettings.data[i].visible !== 'undefined' && fieldSettings.data[i].visible) {
        fieldSettings.data[i].line.setMap(null);
        fieldSettings.data[i].visible = false;
      }

    },

    createCameraTrack: function (field_name, fieldSettings) {
      console.log(fieldSettings, 'fieldSettings');

      var image = 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
      for (var i = 0; i <= fieldSettings.camera_track_points.length - 1; i++) {

        var lat = parseFloat(fieldSettings.camera_track_points[i]['lat']);
        var lng = parseFloat(fieldSettings.camera_track_points[i]['lng']);

        console.log('Create point ' + i);

        var marker = new google.maps.Marker({
          position: {lat: lat, lng: lng},
          map: maps[field_name],
          title: 'Point ' + i + '. (Lat: ' + lat + ', Lng: ' + lng + ')',
          icon: image
        });
      }

    },

    createCameraTrackOld: function (field_name, fieldSettings) {

      if (typeof cameraTracks[field_name] === 'undefined') {
        cameraTracks[field_name] = [];
      }

      var cameraTrack = cameraTracks[field_name];
      var track = fieldSettings.data;
      var distLimit = 2000;
      var cameraTrackResolution = 0.1;
      var gap = Math.round(track.length * cameraTrackResolution);
      var trackLatLng, lastTrackLatLng;

      // Cut down the number of points to use
      for (var i = 0; i <= track.length - 1; i += gap) {

        // make sure not too close to last marker
        trackLatLng = track[i].LatLng;
        if (typeof lastTrackLatLng !== 'undefined') {
          var distance = google.maps.geometry.spherical.computeDistanceBetween(trackLatLng, lastTrackLatLng);
          if (distance < distLimit) {
            continue;
          }
        }

        lastTrackLatLng = trackLatLng;

        cameraTrack.push([track[i].lat, track[i].lng]);

      }

      // make sure last track point is last gps point
      cameraTrack[cameraTrack.length - 1] = [track[track.length - 1].lat, track[track.length - 1].lng];

      var showCameraTrack = false;
      if (showCameraTrack) {

        // add markers for curve control points
        for (i = 0; i <= track.length - 1; i++) {
          var image = 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';

          if(typeof cameraTrack[i] === 'undefined') {
            continue;
          }

          var marker = new google.maps.Marker({
            position: {lat: cameraTrack[i][0], lng: cameraTrack[i][1]},
            // position: new google.maps.LatLng(track[i][0], track[i][1]),
            map: maps[field_name],
            title: 'Hello World!',
            icon: image
          });
        }
      }

      console.log(cameraTrack, 'cameraTrack');

      // create the smoothed out path
      var smoothPath = Smooth(cameraTrack, {
        // method: Smooth.METHOD_CUBIC,
        method: Smooth.METHOD_CUBIC,
        // clip: Smooth.CLIP_PERIODIC,
        // cubicTension: Smooth.CUBIC_TENSION_CATMULL_ROM
      });

      var test = [];

      // Set the camera location for every gps point
      var path_points = [];
      for (i = 0; i <= track.length; i++) {
        var path_perc = i / track.length;
        var path_res = smoothPath(track.length * path_perc);

        path_points.push({
          LatLngArr: path_res,
          LatLng: new google.maps.LatLng(path_res[0], path_res[1]),
          Lat: path_res[0],
          Lng: path_res[1]
        });

        test.push({lat: path_res[0], lng: path_res[1]});
      }

      console.log(path_points, 'path_points');

      var lastLowestDistIndex;

      // Assign each gps point a camera track location
      for (i = 0; i <= track.length -1; i++) {

        // assign point on curve closest to this marker
        var lowestDist = null;
        var lowestDistIndex = null;

        for (var x = (typeof lastLowestDistIndex === 'undefined' ? 0 : lastLowestDistIndex); x <= path_points.length -1; x++) {

          var distance = google.maps.geometry.spherical.computeDistanceBetween(track[i].LatLng, path_points[x].LatLng);

          if(lowestDist === null) {
            lowestDist = distance;
            lowestDistIndex = x;
          }
          else if(distance < lowestDist) {
            lowestDist = distance;
            lowestDistIndex = x;
          }
        }

        // Never go back - always forwards
        if(typeof lastLowestDistIndex !== 'undefined' && lowestDistIndex < lastLowestDistIndex) {
          lowestDistIndex = lastLowestDistIndex;
        }

        lastLowestDistIndex = lowestDistIndex;

        track[i].track = path_points[lowestDistIndex].LatLngArr;

        if(typeof cameraTrackCoords[field_name] === 'undefined') {
          cameraTrackCoords[field_name] = [];
        }

        cameraTrackCoords[field_name].push({lat: path_points[lowestDistIndex].Lat, lng: path_points[lowestDistIndex].Lng});

        this.drawCameraTrack(field_name, test);
      }

    },
    drawCameraTrack: function(field_name, test) {

      var cameraLine = new google.maps.Polyline({
        // path: cameraTrackCoords[field_name],
        path: test,
        geodesic: true,
        strokeColor: '#0000FF',
        strokeOpacity: 1.0,
        strokeWeight: 1
      });

      cameraLine.setMap(maps[field_name]);

    },
  };

})(jQuery, Drupal, drupalSettings);
