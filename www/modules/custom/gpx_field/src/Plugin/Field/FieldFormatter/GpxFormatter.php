<?php

namespace Drupal\gpx_field\Plugin\Field\FieldFormatter;

use Drupal\Core\Field\FieldDefinitionInterface;
use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\FormatterBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Path\PathValidatorInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Datetime\DrupalDateTime;

/**
 * Plugin implementation of the 'gpx' formatter.
 *
 * @FieldFormatter(
 *   id = "gpx",
 *   label = @Translation("Gpx"),
 *   field_types = {
 *     "gpx"
 *   }
 * )
 */
class GpxFormatter extends FormatterBase implements ContainerFactoryPluginInterface {

    /**
     * The path validator service.
     *
     * @var \Drupal\Core\Path\PathValidatorInterface
     */
    protected $pathValidator;

    /**
     * {@inheritdoc}
     */
    public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
        return new static(
            $plugin_id,
            $plugin_definition,
            $configuration['field_definition'],
            $configuration['settings'],
            $configuration['label'],
            $configuration['view_mode'],
            $configuration['third_party_settings'],
            $container->get('path.validator')
        );
    }

    /**
     * Constructs a new GpxFormatter.
     *
     * @param string $plugin_id
     *   The plugin_id for the formatter.
     * @param mixed $plugin_definition
     *   The plugin implementation definition.
     * @param \Drupal\Core\Field\FieldDefinitionInterface $field_definition
     *   The definition of the field to which the formatter is associated.
     * @param array $settings
     *   The formatter settings.
     * @param string $label
     *   The formatter label display setting.
     * @param string $view_mode
     *   The view mode.
     * @param array $third_party_settings
     *   Third party settings.
     * @param \Drupal\Core\Path\PathValidatorInterface $path_validator
     *   The path validator service.
     */
    public function __construct($plugin_id, $plugin_definition, FieldDefinitionInterface $field_definition, array $settings, $label, $view_mode, array $third_party_settings, PathValidatorInterface $path_validator) {
        parent::__construct($plugin_id, $plugin_definition, $field_definition, $settings, $label, $view_mode, $third_party_settings);
        $this->pathValidator = $path_validator;
    }

    /**
     * {@inheritdoc}
     */
    public static function defaultSettings() {
        return [] + parent::defaultSettings();
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
    public function viewElements(FieldItemListInterface $items, $langcode) {

        $element = [
            '#type' => 'table',
            '#header' => ['Latitude', 'Longitude', 'Elevation', 'Time'],
        ];

        foreach ($items as $delta => $item) {

            $time = DrupalDateTime::createFromTimestamp($item->time);

            $element['#rows'][] = [
                'Latitude' => $item->lat,
                'Longitude' => $item->lng,
                'Elevation' => $item->ele,
                'Time' => $time->format('d/m/Y H:i:s'),
            ];

        }

        return $element;
    }


}
