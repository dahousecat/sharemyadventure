<?php

namespace Drupal\gpx_field\Plugin\Field\FieldWidget;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\WidgetBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Plugin implementation of the 'gpx' widget.
 *
 * @FieldWidget(
 *   id = "gpx_default",
 *   label = @Translation("Gpx"),
 *   field_types = {
 *     "gpx"
 *   }
 * )
 */
class GpxWidget extends WidgetBase {

  /**
   * {@inheritdoc}
   */
  public static function defaultSettings() {
    return [] + parent::defaultSettings();
  }

  /**
   * {@inheritdoc}
   */
  public function formElement(FieldItemListInterface $items, $delta, array $element, array &$form, FormStateInterface $form_state) {

    $form_state->set('field_name', $items->getName());

    // Putting this onto the form (even if we just hide it again) tends to cause
    // Drupal to run out of memory.
    // See gpx_field_field_widget_form_container_alter() for where the gpx file
    // upload field is added to the form.
    //    $element['lat'] = [
    //      '#type' => 'number',
    //      '#step' => 'any',
    //      '#title' => $this->t('Latitude'),
    //      '#placeholder' => '',
    //      '#default_value' => isset($items[$delta]->lat) ? $items[$delta]->lat : NULL,
    //      '#maxlength' => 20,
    //      '#element_validate' => [[static::class, 'validateLat']],
    //    ];
    //
    //    $element['lng'] = [
    //      '#type' => 'number',
    //      '#step' => 'any',
    //      '#title' => $this->t('Longitude'),
    //      '#placeholder' => '',
    //      '#default_value' => isset($items[$delta]->lng) ? $items[$delta]->lng : NULL,
    //      '#maxlength' => 20,
    //      '#element_validate' => [[static::class, 'validateLng']],
    //    ];
    //
    //    $element['ele'] = [
    //      '#type' => 'number',
    //      '#step' => 'any',
    //      '#title' => $this->t('Elevation'),
    //      '#placeholder' => '',
    //      '#default_value' => isset($items[$delta]->ele) ? $items[$delta]->ele : NULL,
    //      '#maxlength' => 10,
    //      '#element_validate' => [[static::class, 'validate']],
    //    ];
    //
    //    $default_value = isset($items[$delta]->time) ? DrupalDateTime::createFromTimestamp($items[$delta]->time) : '';
    //    $element['time'] = [
    //      '#type' => 'datetime',
    //      '#timepicker' => 'timepicker',
    //      '#title' => $this->t('Time'),
    //      '#placeholder' => '',
    //      '#default_value' => $default_value,
    //    ];
    //
    //    // If cardinality is 1, ensure a proper label is output for the field.
    //    if ($this->fieldDefinition->getFieldStorageDefinition()->getCardinality() == 1) {
    //      $element += [
    //        '#type' => 'fieldset',
    //      ];
    //    }.
    return $element;
  }

  /**
   * Validate gpx field values.
   */
  public static function validate($element, FormStateInterface $form_state) {
    $value = $element['#value'];
  }

  /**
   * Validate this is a valid latitude.
   */
  public static function validateLat($element, FormStateInterface $form_state) {
    if ($element['#value'] < -90 || $element['#value'] > 90) {
      $form_state->setError($element, t('Latitude must be between -90 and 90'));
    }
  }

  /**
   * Validate this is a valid longitude.
   */
  public static function validateLng($element, FormStateInterface $form_state) {
    if ($element['#value'] < -180 || $element['#value'] > 180) {
      $form_state->setError($element, t('Longitude must be between -180 and 180'));
    }
  }

  /**
   * {@inheritdoc}
   */
  public function settingsForm(array $form, FormStateInterface $form_state) {
    $elements = parent::settingsForm($form, $form_state);
    return $elements;
  }

  /**
   * {@inheritdoc}
   */
  public function settingsSummary() {
    $summary = [];
    return $summary;
  }

  /**
   * {@inheritdoc}
   */
  public function massageFormValues(array $values, array $form, FormStateInterface $form_state) {

    // Get action and load gpx data from file.
    $action = $form_state->getValue('gpx_field_action');
    $new_values = [];

    // If appending add all existing data to the new_values array first.
    if ($action == 'append') {
      $build_info = $form_state->getBuildInfo();
      $entity = $build_info['callback_object']->getEntity();
      $field_name = $form_state->get('field_name');

      foreach ($entity->get($field_name) as $item) {
        if (!empty($item->time)) {
          $new_values[$item->time] = [
            'lat' => $item->lat,
            'lng' => $item->lng,
            'ele' => $item->ele,
            'time' => $item->time,
          ];
        }
      }
    }

    // Fetch newly uploaded GPX file.
    $gpx_value = $form_state->getValue('gpx_field_gpx');
    $fid = isset($gpx_value[0]) ? $gpx_value[0] : NULL;
    $file = $fid ? \Drupal::entityTypeManager()->getStorage('file')->load($fid) : NULL;

    if ($file) {
      $uri = $file->getFileUri();
      $xml = file_get_contents($uri);
      $gpx = simplexml_load_string($xml);

      // Loop GPX data to add to values array.
      foreach ($gpx->trk->trkseg->trkpt as $part) {
        $timestamp = strtotime($part->time);
        $this_item = [
          'lat' => (string) $part->attributes()->lat,
          'lng' => (string) $part->attributes()->lon,
          'ele' => (string) $part->ele,
          'time' => $timestamp,
        ];
        $new_values[$timestamp] = $this_item;
      }
    }

    // Finally ensure all data is sorted according to the timestamps.
    ksort($new_values);

    return $new_values;

  }

}
