<?php

namespace Drupal\gpx_field\Plugin\Field\FieldType;

use Drupal\Component\Utility\Random;
use Drupal\Core\Field\FieldDefinitionInterface;
use Drupal\Core\Field\FieldItemBase;
use Drupal\Core\Field\FieldStorageDefinitionInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\TypedData\DataDefinition;

/**
 * Plugin implementation of the 'gpx' field type.
 *
 * @FieldType(
 *   id = "gpx",
 *   label = @Translation("Gpx"),
 *   description = @Translation("Store lat, lng, elevation and timestamp from a GPX file in the DB."),
 *   default_widget = "gpx_default",
 *   default_formatter = "gpx_table",
 * )
 */
class GpxItem extends FieldItemBase {

    /**
     * {@inheritdoc}
     */
    public static function defaultFieldSettings() {
        return [] + parent::defaultFieldSettings();
    }

    /**
     * {@inheritdoc}
     */
    public static function propertyDefinitions(FieldStorageDefinitionInterface $field_definition) {

        $properties['lat'] = DataDefinition::create('string')
            ->setLabel(t('Latitude'))
            ->setRequired(TRUE);

        $properties['lng'] = DataDefinition::create('string')
            ->setLabel(t('Longitude'))
            ->setRequired(TRUE);

        $properties['ele'] = DataDefinition::create('string')
            ->setLabel(t('Elevation'));

        $properties['time'] = DataDefinition::create('timestamp')
            ->setLabel(t('Time'))
            ->setRequired(TRUE);

        return $properties;
    }

    /**
     * {@inheritdoc}
     */
    public static function schema(FieldStorageDefinitionInterface $field_definition) {
        return [
            'columns' => [
                'lat' => [
                    'description' => 'Latitude',
                    'type' => 'varchar',
                    'length' => 18,
//                    'type' => 'numeric',
//                    'precision' => 18,
//                    'scale' => 12,
                ],
                'lng' => [
                    'description' => 'Longitude',
                    'type' => 'varchar',
                    'length' => 18,
//                    'type' => 'numeric',
//                    'precision' => 18,
//                    'scale' => 12,
                ],
                'ele' => [
                    'description' => 'Elevation',
                    'type' => 'varchar',
                    'length' => 8,
                ],
                'time' => [
                    'description' => 'Timestamp',
                    'type' => 'int',
                ],
            ],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function fieldSettingsForm(array $form, FormStateInterface $form_state) {
        $element = [];

//        dpm($form, '$form');

        return $element;
    }

    /**
     * {@inheritdoc}
     */
    public static function generateSampleValue(FieldDefinitionInterface $field_definition) {
        $accuracy = 10000000000;
        $values['lat'] = rand(-90 * $accuracy, 90 * $accuracy) / $accuracy;
        $values['lng'] = rand(-180 * $accuracy, 180 * $accuracy) / $accuracy;
        $values['ele'] = rand(0 * 2, 6000 * 2) / 2;
        $values['time'] = \Drupal::time()->getRequestTime() - mt_rand(0, 86400 * 365);
        return $values;
    }

    /**
     * {@inheritdoc}
     */
    public function isEmpty() {
        $lat = $this->get('lat')->getValue();
        $lng = $this->get('lng')->getValue();
        $time = $this->get('time')->getValue();
        return empty($lat) || empty($lng) || empty($time);
    }

}
