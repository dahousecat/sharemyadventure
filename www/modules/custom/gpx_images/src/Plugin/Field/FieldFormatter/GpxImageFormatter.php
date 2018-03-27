<?php

namespace Drupal\gpx_images\Plugin\Field\FieldFormatter;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\image\Plugin\Field\FieldFormatter\ImageFormatter;
use Drupal\Core\Link;
use Drupal\Core\Url;
use Drupal\Core\Cache\Cache;
use Drupal\image\Entity\ImageStyle;

/**
 * Plugin implementation of the 'gpx images' formatter.
 *
 * @FieldFormatter(
 *   id = "gpx_images",
 *   label = @Translation("GPX images"),
 *   field_types = {
 *     "image"
 *   },
 *   quickedit = {
 *     "editor" = "image"
 *   }
 * )
 */
class GpxImageFormatter extends ImageFormatter {

  const IPTC_CREATED_DATE = '2#055';
  const IPTC_CREATED_TIME = '2#060';

  public static function defaultSettings() {
    return [
        'image_style' => '',
        'thumbnail_style' => 'thumbnail',
      ] + parent::defaultSettings();
  }

  public function settingsForm(array $form, FormStateInterface $form_state) {

    $image_styles = image_style_options(FALSE);
    $description_link = Link::fromTextAndUrl(
      $this->t('Configure Image Styles'),
      Url::fromRoute('entity.image_style.collection')
    );
    $element['image_style'] = [
      '#title' => t('Image style'),
      '#type' => 'select',
      '#default_value' => $this->getSetting('image_style'),
      '#empty_option' => t('None (original image)'),
      '#options' => $image_styles,
      '#description' => $description_link->toRenderable() + [
          '#access' => $this->currentUser->hasPermission('administer image styles')
        ],
    ];

    $element['thumbnail_style'] = [
      '#title' => t('Thumbnail style'),
      '#type' => 'select',
      '#default_value' => $this->getSetting('thumbnail_style'),
      '#empty_option' => t('None (original image)'),
      '#options' => $image_styles,
      '#description' => $description_link->toRenderable() + [
          '#access' => $this->currentUser->hasPermission('administer image styles')
        ],
    ];

    return $element;
  }

  public function settingsSummary() {
    $summary = [];

    $image_styles = image_style_options(FALSE);
    // Unset possible 'No defined styles' option.
    unset($image_styles['']);
    // Styles could be lost because of enabled/disabled modules that defines
    // their styles in code.
    $image_style_setting = $this->getSetting('image_style');
    if (isset($image_styles[$image_style_setting])) {
      $summary[] = t('Image style: @style', ['@style' => $image_styles[$image_style_setting]]);
    }
    else {
      $summary[] = t('Image style: Original image');
    }

    $thumbnail_style_setting = $this->getSetting('thumbnail_style');
    if (isset($image_styles[$thumbnail_style_setting])) {
      $summary[] = t('Thumbnail style: @style', ['@style' => $image_styles[$thumbnail_style_setting]]);
    }
    else {
      $summary[] = t('Thumbnail style: Original image');
    }

    return $summary;
  }

  public function viewElements(FieldItemListInterface $items, $langcode) {

    $elements = [];
    $files = $this->getEntitiesToView($items, $langcode);

    // Early opt-out if the field is empty.
    if (empty($files)) {
      return $elements;
    }

    $image_style_setting = $this->getSetting('image_style');
    $thumbnail_style_setting = $this->getSetting('thumbnail_style');

    // Collect cache tags to be added for each item in the field.
    $base_cache_tags = [];
    if (!empty($thumbnail_style_setting)) {
      $image_style = $this->imageStyleStorage->load($thumbnail_style_setting);
      $base_cache_tags = $image_style->getCacheTags();
    }

    foreach ($files as $delta => $file) {
      $cache_contexts = [];
      $cache_tags = Cache::mergeTags($base_cache_tags, $file->getCacheTags());

      // Extract field item attributes for the theme function, and unset them
      // from the $item so that the field template does not re-render them.
      $item = $file->_referringItem;
      $item_attributes = $item->_attributes;
      unset($item->_attributes);

      $image_uri = $file->getFileUri();

      $created = $this->getImageCreatedDate($image_uri);

      // If we can't get the created date of this image there is no way to
      // place it on the map so skip it
      if(empty($created)) {
        continue;
      }

      $item_attributes['data-created'] = $created;

      if (!empty($image_style_setting)) {
        $url = ImageStyle::load($image_style_setting)->buildUrl($image_uri);
      }
      else {
        $url = Url::fromUri(file_create_url($image_uri));
      }

      $elements[$delta] = [
        '#theme' => 'image_formatter',
        '#item' => $item,
        '#item_attributes' => $item_attributes,
        '#url' => $url,
        '#image_style' => $thumbnail_style_setting,
        '#cache' => [
          'tags' => $cache_tags,
          'contexts' => $cache_contexts,
        ],
      ];
    }

    return $elements;

  }

  protected function getImageCreatedDate($image_uri) {
    $image_url = file_create_url($image_uri);
    $info = NULL;
    getimagesize($image_url, $info);

    if(isset($info['APP13'])) {
      $iptc = iptcparse($info['APP13']);

      if(isset($iptc[self::IPTC_CREATED_DATE]) && isset($iptc[self::IPTC_CREATED_TIME])) {
        $date = $iptc[self::IPTC_CREATED_DATE][0];
        $time = $iptc[self::IPTC_CREATED_TIME][0];
        $year = substr($date, 0, 4);
        $month = substr($date, 4, 2);
        $day = substr($date, 6, 2);
        $hour = substr($time, 0, 2);
        $min = substr($time, 2, 2);
        $sec = substr($time, 4, 2);
        return mktime($hour, $min, $sec, $month, $day, $year);
      }
    }
  }

}
