<?php

namespace Drupal\gpx_field\Plugin\Field\FieldWidget;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\WidgetBase;
use Drupal\Core\Form\FormBuilder;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Datetime\DrupalDateTime;

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
        return [
            ] + parent::defaultSettings();
    }

    /**
     * {@inheritdoc}
     */
    public function formElement(FieldItemListInterface $items, $delta, array $element, array &$form, FormStateInterface $form_state) {

        $element['lat'] = [
            '#type' => 'number',
            '#step' => 'any',
            '#title' => $this->t('Latitude'),
            '#placeholder' => '',
            '#default_value' => isset($items[$delta]->lat) ? $items[$delta]->lat : NULL,
            '#maxlength' => 20,
            '#element_validate' => [[static::class, 'validateLat']],
        ];

        $element['lng'] = [
            '#type' => 'number',
            '#step' => 'any',
            '#title' => $this->t('Longitude'),
            '#placeholder' => '',
            '#default_value' => isset($items[$delta]->lng) ? $items[$delta]->lng : NULL,
            '#maxlength' => 20,
            '#element_validate' => [[static::class, 'validateLng']],
        ];

        $element['ele'] = [
            '#type' => 'number',
            '#step' => 'any',
            '#title' => $this->t('Elevation'),
            '#placeholder' => '',
            '#default_value' => isset($items[$delta]->ele) ? $items[$delta]->ele : NULL,
            '#maxlength' => 10,
            '#element_validate' => [[static::class, 'validate']],
        ];

        $default_value = isset($items[$delta]->time) ? DrupalDateTime::createFromTimestamp($items[$delta]->time) : '';
        $element['time'] = [
            '#type' => 'datetime',
            '#timepicker' => 'timepicker',
            '#title' => $this->t('Time'),
            '#placeholder' => '',
            '#default_value' => $default_value,
        ];

        // If cardinality is 1, ensure a proper label is output for the field.
        if ($this->fieldDefinition->getFieldStorageDefinition()->getCardinality() == 1) {
            $element += [
                '#type' => 'fieldset',
            ];
        }

        return $element;
    }

    /**
     * Validate gpx field values.
     */
    public static function validate($element, FormStateInterface $form_state) {
        $value = $element['#value'];

        dpm($element, '$element');

//        ddl($element, '$element');
//        dpm($form_state, '$form_state');

    }

    public static function validateLat($element, FormStateInterface $form_state) {
        if($element['#value'] < -90 || $element['#value'] > 90) {
            $form_state->setError($element, t('Latitude must be between -90 and 90'));
        }
    }

    public static function validateLng($element, FormStateInterface $form_state) {
        if($element['#value'] < -180 || $element['#value'] > 180) {
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


        foreach ($values as &$item) {

            dpm($item, '$item');

            // @todo The structure is different whether access is denied or not, to
            //   be fixed in https://www.drupal.org/node/2326533.
            if (isset($item['time']) && $item['time'] instanceof DrupalDateTime) {
                $date = $item['time'];
            }
            elseif (isset($item['time']['object']) && $item['time']['object'] instanceof DrupalDateTime) {
                $date = $item['time']['object'];
            }
            else {
                $date = new DrupalDateTime();
            }
            $item['time'] = $date->getTimestamp();
        }

        return $values;

//        $action = $form_state->getValue('gpx_field_action');
//        $fid = $form_state->getValue('gpx_field_gpx')[0];
//        $file = \Drupal::entityTypeManager()->getStorage('file')->load($fid);
//        $uri = $file->getFileUri();
//        $xml = file_get_contents($uri);
//        $gpx = simplexml_load_string($xml);
//
//        $gpx_data = json_decode(json_encode($gpx));
//
//        $test = [];
//
//        if($action == 'replace') {
//
//        }
//
//        foreach($gpx_data->trk->trkseg->trkpt as $item) {
//            $test[] = [
//                'lat' => $item->{'@attributes'}->lat,
//                'lng' => $item->{'@attributes'}->lon,
//                'ele' => $item->ele,
//                'time' => $item->time,
//            ];
//        }
//
//        dpm($test, '$test');

        dpm($values, '$values');
        static $static;
        if(!isset($static)) {
            $static = true;
            //dpm($form_state, '$form_state');
        }

        return $values;
    }

}
