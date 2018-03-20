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

    /**
     * Attaches the gpx field behaviour to gpx fields.
     *
     * Other callback functions that need to be in the global scope live in here.
     */
    Drupal.behaviors.gpx_field = {
        attach: function (context, settings) {

            // Load google maps script
            $.getScript(drupalSettings.gpx_field.google_map_url);

            // If charts library has been added load charts
            if(typeof google.charts !== 'undefined') {
                google.charts.load('current', {'packages':['corechart']});
                google.charts.setOnLoadCallback(Drupal.behaviors.gpx_field.initChart);
            }

        },
        initMap: function() {

            var gpxfSettings = drupalSettings.gpx_field;

            // Loop gpx map fields
            for (var field_name in gpxfSettings.fields) {
                if (gpxfSettings.fields.hasOwnProperty(field_name)) {
                    var fieldSettings = gpxfSettings.fields[field_name];
                    console.log(fieldSettings, 'fieldSettings');

                    // Add latLng objects and distance to the track data points array
                    gpxField.prepareTrackData(fieldSettings);

                    // Create the map
                    gpxField.createMap(field_name, fieldSettings);

                    // Set the bounds and zoom,
                    gpxField.setBounds(maps[field_name], fieldSettings);

                    if(fieldSettings.animatetrack) {

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
        initChart: function() {

            var gpxfSettings = drupalSettings.gpx_field;

            // Loop gpx map fields
            for (var field_name in gpxfSettings.fields) {
                if (gpxfSettings.fields.hasOwnProperty(field_name)) {
                    var fieldSettings = gpxfSettings.fields[field_name];
                    if(fieldSettings.showelechart) {
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
        createMap: function(field_name, fieldSettings) {
            maps[field_name] = new google.maps.Map(document.getElementById('map-canvas-' + field_name), {
                mapTypeId: fieldSettings.mapType
            });
        },
        prepareTrackData: function(fieldSettings) {
            var prevLatLng;
            for (var i = 0; i < fieldSettings.data.length; i++) {
                var latLng = new google.maps.LatLng(fieldSettings.data[i].lat, fieldSettings.data[i].lng);
                var distance = 0;
                if(typeof prevLatLng !== 'undefined') {
                    distance = google.maps.geometry.spherical.computeDistanceBetween (prevLatLng, latLng);
                }
                fieldSettings.data[i].latLng = latLng;
                fieldSettings.data[i].distance = distance;
                prevLatLng = latLng;
            }
        },
        setBounds: function(map, fieldSettings) {
            var bounds = new google.maps.LatLngBounds();
            for (var i = 0; i < fieldSettings.data.length; i++) {
                bounds.extend(fieldSettings.data[i].latLng);
            }
            map.fitBounds(bounds);
        },
        drawSingleTrack: function(map, fieldSettings) {

            var coordinates = [];

            for (var i = 0; i < fieldSettings.data.length; i++) {
                coordinates.push(fieldSettings.data[i].latLng);
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
        drawElevationChart: function(field_name, fieldSettings) {

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
        createInfoPane: function(field_name, fieldSettings) {

            infoPanes[field_name] = $('#info-pane-' + field_name);
            infoPanes[field_name].html('<div class="gpx-field-slider"></div>');

            var options = {
                min: 0,
                max: fieldSettings.data.length,
                slide: this.slide
            };

            infoPanes[field_name].find('.gpx-field-slider').slider(options);


        },
        slide: function(event, ui) {

            var field_name = $(this).parent().attr('id').replace('info-pane-', '');
            var fieldSettings = drupalSettings.gpx_field.fields[field_name];

            gpxField.showHideLines(ui.value, field_name, fieldSettings);

            // console.log(ui.value);
            // console.log($(this).parent().attr('id').replace('info-pane-', ''));

        },
        showHideLines: function(index, field_name, fieldSettings){
            fieldSettings.distance = 0;
            for (var i = 1; i <= fieldSettings.data.length -1; i++) {
                if(i <= index) {
                    this.showLine(i, field_name, fieldSettings);
                } else {
                    this.hideLine(i, field_name, fieldSettings);
                }
            }
        },
        showLine: function(i, field_name, fieldSettings){

            if(typeof fieldSettings.data[i].line === 'undefined') {

                fieldSettings.data[i].line = new google.maps.Polyline({
                    path: [ fieldSettings.data[i-1].latLng, fieldSettings.data[i].latLng ],
                    strokeColor: "#FF0000",
                    strokeOpacity: 1.0,
                    strokeWeight: 2,
                    map: maps[field_name]
                });
                fieldSettings.data[i].visible = true;

            }

            if(!fieldSettings.data[i].visible) {
                fieldSettings.data[i].line.setMap(maps[field_name]);
                fieldSettings.data[i].visible = true;
            }

            fieldSettings.distance += fieldSettings.data[i].distance;

        },
        hideLine: function(i, field_name, fieldSettings){

            if(typeof fieldSettings.data[i].visible !== 'undefined' && fieldSettings.data[i].visible) {
                fieldSettings.data[i].line.setMap(null);
                fieldSettings.data[i].visible = false;
            }

        },
        createCameraTrack: function(field_name, fieldSettings) {

            var distLimit = 2000;
            var cameraTrackResolution = 0.1;
            var gap = Math.round(fieldSettings.data.length * cameraTrackResolution);
            var trackLatLng, lastTrackLatLng;

            // Cut down the number of points to use
            for (var i = 0; i <= fieldSettings.data.length -1; i+=gap) {

                // make sure not too close to last marker
                trackLatLng = fieldSettings.data[i].latLng;
                if(typeof lastTrackLatLng !== 'undefined') {
                    var distance = google.maps.geometry.spherical.computeDistanceBetween(trackLatLng, lastTrackLatLng);
                    if(distance < distLimit) {
                        continue;
                    }
                }

                lastTrackLatLng = trackLatLng;

                track.push( [ gps.data[i].lat, gps.data[i].lng ] );

            }

        }
    };

})(jQuery, Drupal, drupalSettings);
