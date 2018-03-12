/**
 * @file
 * Javascript for gpx_field module.
 *
 */

(function ($, Drupal, drupalSettings) {
    "use strict";

    var maps = {};
    var charts = {};

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
                    gpxField.createMap(field_name, fieldSettings);
                    gpxField.drawTracks(maps[field_name], fieldSettings);
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
        drawTracks: function(map, fieldSettings) {

            var bounds = new google.maps.LatLngBounds();
            var coordinates = [];
            var track = fieldSettings.data;

            for (var i = 0; i < track.length; i++) {
                var latLng = new google.maps.LatLng(track[i].lat, track[i].lng);
                bounds.extend(latLng);
                coordinates.push(latLng);
            }

            var path = new google.maps.Polyline({
                path: coordinates,
                geodesic: true,
                strokeColor: fieldSettings.trColour,
                strokeOpacity: 1.0,
                strokeWeight: fieldSettings.trStroke
            });

            path.setMap(map);
            map.fitBounds(bounds);

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

        }
    };

})(jQuery, Drupal, drupalSettings);
