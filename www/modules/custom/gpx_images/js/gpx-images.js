/**
 * @file
 * Javascript for gpx_images module.
 *
 */

(function ($, Drupal, drupalSettings) {
  "use strict";

  /**
   * Attaches the gpx images behaviour to gpx images fields.
   */
  Drupal.behaviors.gpx_images = {
    attach: function (context, settings) {

    },
    init: function(fieldSettings) {
      gpxImages.initImages(fieldSettings);
    },
    slide: function(value, fieldSettings) {

      // value is the gpx point - we need to convert this to seconds
      var startTs = fieldSettings.data[0].ts;
      var currentTs = fieldSettings.data[value].ts;
      var perc = ((currentTs - startTs) / fieldSettings.totalSeconds) * -100;
      fieldSettings.$imagesWrapper.css({left: perc + '%'});
    }
  };

  /**
   * All functions that can live in the local scope of gpx field.
   */
  var gpxImages = {
    initImages: function(fieldSettings) {

      var startTs = fieldSettings.data[0].ts;
      var endTs = fieldSettings.data[fieldSettings.data.length - 1].ts;
      fieldSettings.totalSeconds = endTs - startTs;

      // TODO: Find a better way to assign this value.
      var stageWidth = 1000;

      var $gpxImages = $('.gpx-images');

      fieldSettings.$imagesWrapper = $gpxImages.find('.field__items');
      fieldSettings.$imagesWrapper.css({width: stageWidth + 'px'});

      $gpxImages.find('.field__item').each(function(){

        var image = {
          $image: $(this)
        };

        image.created = $(this).find('img').attr('data-created');
        var timeSinceStart = image.created - startTs < 0 ? 0 : image.created - startTs;
        var perc = (timeSinceStart / fieldSettings.totalSeconds) * 100;
        $(this).css({left: perc + '%'});
        gpxImages.placeMapMarker(image, fieldSettings);

        if(typeof fieldSettings.images === 'undefined') {
          fieldSettings.images = [];
        }

        fieldSettings.images.push(image);
      });

      console.log(fieldSettings, 'fieldSettings');

    },
    placeMapMarker: function(image, fieldSettings) {

      var markerImage = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
      image.nodeIndex = this.getClosestNodeIndex(image.created, fieldSettings);
      var lat = parseFloat(fieldSettings.data[image.nodeIndex]['lat']);
      var lng = parseFloat(fieldSettings.data[image.nodeIndex]['lng']);

      image.marker = new google.maps.Marker({
        position: {lat: lat, lng: lng},
        map: fieldSettings.map,
        title: '(Lat: ' + lat + ', Lng: ' + lng + ')',
        icon: markerImage
      });

      image.marker.addListener('click', this.imageMarkerClick.bind([image, fieldSettings]));

    },
    getClosestNodeIndex: function(ts, fieldSettings) {
      var currentGap, smallestGap, lastGap, nodeIndex;

      // Loop nodes to find the one with the smallest gap
      for (var i = 1; i <= fieldSettings.data.length - 1; i++) {
        currentGap = Math.abs(ts - fieldSettings.data[i].ts);
        if(typeof smallestGap === 'undefined' || currentGap < smallestGap) {
          smallestGap = currentGap;
          nodeIndex = i;
        }
        // If the gap has started getting bigger we have passed the closest point so break.
        if(typeof lastGap !== 'undefined' && currentGap > lastGap) {
          break;
        }
        lastGap = currentGap;
      }
      return nodeIndex;
    },
    imageMarkerClick: function() {
      var image = this[0];
      var fieldSettings = this[1];
      Drupal.behaviors.gpx_field.setPosition(image.nodeIndex, fieldSettings);
    }
  };

})(jQuery, Drupal, drupalSettings);
