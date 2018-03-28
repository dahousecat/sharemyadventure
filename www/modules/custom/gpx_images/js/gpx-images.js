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
      if(!$('.pswp').length) {
        $('body').append(settings.gpx_images.photoswipe_container);
      }
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
      var stageWidth = 937;

      var $gpxImages = $('.gpx-images');

      fieldSettings.$imagesWrapper = $gpxImages.find('.field__items');
      fieldSettings.$imagesWrapper.css({width: stageWidth + 'px'});
      fieldSettings.$imagesWrapper.attr('data-pswp-uid', fieldSettings.$imagesWrapper.index());

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

        image.$image.on('click', gpxImages.thumbnailClick.bind([image, fieldSettings]));

        fieldSettings.images.push(image);
      });

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
      Drupal.behaviors.gpx_field.animateToPosition(image.nodeIndex, fieldSettings);
    },
    thumbnailClick: function(e) {
      e = e || window.event;
      e.preventDefault ? e.preventDefault() : e.returnValue = false;

      var image = this[0];
      var fieldSettings = this[1];
      var $target = $(e.target);

      Drupal.behaviors.gpx_field.animateToPosition(image.nodeIndex, fieldSettings);

      var $gallery = $target.parents('.field__items');
      var index = $target.parents('.field__item').index();
      gpxImages.openPhotoSwipe(index, $gallery, fieldSettings);

    },
    openPhotoSwipe: function(index, $gallery, fieldSettings) {

      var images = $gallery.find('a.photoswipe');
      var items = [];
      images.each(function (index) {
        var $image = $(this);
        var size = $image.data('size') ? $image.data('size').split('x') : ['',''];
        items.push(
            {
              src : $image.attr('href'),
              w: size[0],
              h: size[1],
              title : $image.data('overlay-title')
            }
        );
      });

      // define options
      var options = {
        index: index,
        galleryUID: $gallery.data('pswp-uid'),
        bgOpacity: 0.7,
        loop: false
      };

      // Pass data to PhotoSwipe and initialize it
      var pswpElement = $('.pswp')[0];
      fieldSettings.gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
      fieldSettings.gallery.init();

      // Bind listener to the slide change event
      fieldSettings.gallery.listen('beforeChange', gpxImages.photoSwipeBeforeChange.bind(fieldSettings));
      fieldSettings.gallery.listen('beforeChange', gpxImages.photoSwipeAfterChange.bind(fieldSettings));

    },
    photoSwipeBeforeChange: function() {
      var fieldSettings = this;
      var imageIndex = fieldSettings.gallery.getCurrentIndex();
      var nodeIndex = fieldSettings.images[imageIndex].nodeIndex;

      var diff = 1;
      if(typeof fieldSettings.currentImageIndex === 'number') {
        diff = Math.abs(fieldSettings.currentImageIndex - imageIndex);
      }

      // Don't allow looping
      if(diff !== 1) {
        fieldSettings.gallery.goTo(fieldSettings.currentImageIndex);
      }
      else {
        Drupal.behaviors.gpx_field.animateToPosition(nodeIndex, fieldSettings);
      }

    },
    photoSwipeAfterChange: function() {
      var fieldSettings = this;
      var imageIndex = fieldSettings.gallery.getCurrentIndex();
      fieldSettings.currentImageIndex = imageIndex;
    }
  };

})(jQuery, Drupal, drupalSettings);
