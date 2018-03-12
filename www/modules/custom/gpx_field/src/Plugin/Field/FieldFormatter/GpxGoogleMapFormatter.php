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
 *   id = "gpx_google_map",
 *   label = @Translation("Google Map"),
 *   field_types = {
 *     "gpx"
 *   }
 * )
 */
class GpxGoogleMapFormatter extends FormatterBase implements ContainerFactoryPluginInterface
{

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
    return array(
        'trcolor' => '#006CAB',
        'epcolor' => '#006CAA',
        'trstroke' => 2,
        'maptype' => 'TERRAIN',
        'showelechart' => TRUE,
      ) + parent::defaultSettings();
  }

  /**
   * {@inheritdoc}
   */
  public function settingsForm(array $form, FormStateInterface $form_state) {
    $elements = parent::settingsForm($form, $form_state);

    $elements['trcolor'] = array(
      '#type' => 'textfield',
      '#default_value' => $this->getSetting('trcolor'),
      '#title' => t('Track color'),
      '#required' => TRUE,
      '#description' => t('Select the track color.'),
    );

    $elements['epcolor'] = array(
      '#type' => 'textfield',
      '#default_value' => $this->getSetting('epcolor'),
      '#title' => t('Elevation profile color'),
      '#required' => TRUE,
      '#description' => t('Select the track color.'),
    );

    $elements['trstroke'] = array(
      '#type' => 'textfield',
      '#default_value' => $this->getSetting('trstroke'),
      '#title' => t('Track stroke'),
      '#required' => TRUE,
      '#description' => t('Select the track stroke weight.'),
    );

    $elements['maptype'] = array(
      '#type' => 'select',
      '#default_value' => $this->getSetting('maptype'),
      '#title' => t('Map Type'),
      '#required' => TRUE,
      '#options' => array(
        'terrain' => t('Terrain'),
        'road' => t('Road'),
        'hybrid' => t('Hybrid'),
        'satellite' => t('Satellite'),
      ),
      '#description' => t('Select the map default type'),
    );

    $elements['showelechart'] = array(
      '#type' => 'checkbox',
      '#default_value' => $this->getSetting('showelechart'),
      '#title' => t('Elevation chart'),
      '#description' => t('Should the elevation chart be displayed?.'),
    );

    return $elements;
  }

  /**
   * {@inheritdoc}
   */
  public function settingsSummary() {
    $summary = [];
    $summary[] = t('Track color: @trcolor', ['@trcolor' => $this->getSetting('trcolor')]);
    $summary[] = t('Elevation profile color: @epcolor', ['@epcolor' => $this->getSetting('epcolor')]);
    $summary[] = t('Track stroke: @trstroke', ['@trstroke' => $this->getSetting('trstroke')]);
    $summary[] = t('Map Type: @maptype', ['@maptype' => $this->getSetting('maptype')]);
    $summary[] = t('Elevation chart: @showelechart', ['@showelechart' => $this->getSetting('showelechart') ? 'Yes' : 'No']);
    return $summary;
  }

  /**
   * {@inheritdoc}
   */
  public function viewElements(FieldItemListInterface $items, $langcode) {

    $field_name = $items->getName();

    $config = \Drupal::config('gpx_field.settings');

    $element = array(
      'gpx-field-container' => array(
        '#type' => 'container',
        '#attributes' => array(
          'class' => array('gpx-field-container'),
        ),
        'map-canvas' => array(
          '#type' => 'container',
          '#attributes' => array(
            'class' => array('map-canvas'),
            'id' => 'map-canvas-' . $field_name,
            'style' => 'height: 20rem',
          ),
        ),
        'elevation-canvas' => array(
          '#type' => 'container',
          '#attributes' => array(
            'class' => array('elevation-chart'),
            'id' => 'elevation-chart-' . $field_name,
          ),
        ),
      ),
    );

    $data = [];

    $lat_total = 0;
    $lng_total = 0;
    $count = 0;

    foreach ($items as $delta => $item) {

      $time = DrupalDateTime::createFromTimestamp($item->time);

      $data[] = [
        'lat' => $item->lat,
        'lng' => $item->lng,
        'ele' => $item->ele,
        'time' => $time->format('d/m/Y H:i:s'),
      ];

      $lat_total += $item->lat;
      $lng_total += $item->lng;
      $count++;

    }

    $init_map_callback = 'Drupal.behaviors.gpx_field.initMap';
    $google_map_url = $config->get('gpx_field.http') . '://maps.googleapis.com/maps/api/js?libraries=geometry&callback=' . $init_map_callback;
    if(!empty($config->get('gpx_field.google_map_key'))) {
      $google_map_url .= '&key=' . $config->get('gpx_field.google_map_key') . '&';
    }

    $element['#attached'] = [
      'library' => [
        'gpx_field/gpx_field.gpx_field',
        'gpx_field/gpx_field.jsapi',
      ],
      'drupalSettings' => [
        'gpx_field' => [
          'fields' => [
            $field_name => [
              'trColour' => $this->getSetting('trcolor'),
              'epColor' => $this->getSetting('epcolor'),
              'trStroke' => $this->getSetting('trstroke'),
              'mapType' => $this->getSetting('maptype'),
              'showelechart' => $this->getSetting('showelechart'),
              'data' => $data,
              'map_centre' => [
                'lat' => $lat_total / $count,
                'lng' => $lng_total / $count,
              ]
            ],
          ],
          'google_map_url' => $google_map_url,
        ],
      ],
    ];

    if($this->getSetting('showelechart')) {
      $element['#attached']['library'][] = 'gpx_field/gpx_field.charts';
    }

    return [$element];

  }

}
