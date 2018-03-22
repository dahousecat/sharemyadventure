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
use Drupal\gpx_field\CubicSplines;
use MathPHP\NumericalAnalysis\Interpolation\NaturalCubicSpline;
use MathPHP\NumericalAnalysis\Interpolation\ClampedCubicSpline;
use MathPHP\NumericalAnalysis\Interpolation\NewtonPolynomialForward;
use MathPHP\NumericalAnalysis\Interpolation\LagrangePolynomial;

// NewtonPolynomialForward

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
        'animatetrack' => TRUE,
        'showinfopane' => TRUE,
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
      '#title' => t('Show eslevation chart'),
      '#description' => t('Should the elevation chart be displayed?.'),
    );

    $elements['animatetrack'] = array(
      '#type' => 'checkbox',
      '#default_value' => $this->getSetting('animatetrack'),
      '#title' => t('Animate track'),
      '#description' => t('Use a slider to animate moving along the track'),
    );

    $elements['showinfopane'] = array(
      '#type' => 'checkbox',
      '#default_value' => $this->getSetting('showinfopane'),
      '#title' => t('Show info pane'),
      '#description' => t('Show the info pane with distance, time, speed etc?'),
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
    $summary[] = t('Elevation chart: @showelechart', ['@showelechart' => $this->getSetting('showelechart') ? 'Shown' : 'Hidden']);
    $summary[] = t('Animate track: @animatetrack', ['@animatetrack' => $this->getSetting('animatetrack') ? 'Yes' : 'No']);
    $summary[] = t('Show info pane: @showinfopane', ['@showinfopane' => $this->getSetting('showinfopane') ? 'Yes' : 'No']);
    return $summary;
  }

  /**
   * {@inheritdoc}
   */
  public function viewElements(FieldItemListInterface $items, $langcode) {

    $field_name = $items->getName();

    $config = \Drupal::config('gpx_field.settings');

    $element = [
      'gpx-field-container' => [
        '#type' => 'container',
        '#attributes' => [
          'class' => ['gpx-field-container'],
          'id' => 'gpx-field-container-' . $field_name,
        ],
      ],
    ];

    $element['gpx-field-container']['scrollbar'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => ['gpx-field-scrollbar'],
        'id' => 'scrollbar-' . $field_name,
      ],
    ];

    $element['gpx-field-container']['inner'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => ['gpx-field-inner'],
      ],
    ];

    if($this->getSetting('showinfopane')) {
      $element['gpx-field-container']['inner']['info-pane'] = [
        '#type' => 'container',
        '#attributes' => [
          'class' => ['gpx-field-info-pane'],
          'id' => 'info-pane-' . $field_name,
        ],
      ];
    }

    $element['gpx-field-container']['inner']['map-n-chart'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => ['gpx-field-map-n-chart'],
      ],
    ];

    $element['gpx-field-container']['inner']['map-n-chart']['map-canvas'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => ['map-canvas'],
        'id' => 'map-canvas-' . $field_name,
        'style' => 'height: 20rem',
      ],
    ];

    $element['gpx-field-container']['inner']['map-n-chart']['elevation-canvas'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => ['elevation-chart'],
        'id' => 'elevation-chart-' . $field_name,
      ],
    ];

    // Trim markers so there is not a stationary period at the start or the end
    // of the track
    $data = $this->trimPoints($items);

    $camera_track_points = $this->createCameraTrack($data);

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
              'animatetrack' => $this->getSetting('animatetrack'),
              'showinfopane' => $this->getSetting('showinfopane'),
              'data' => $data,
              'camera_track_points' => $camera_track_points,
              'distance' => 0,
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

  /**
   * GPS tracks often have lots of point at the start and the end with very
   * little movement. We want to trim these off so it does not effect the
   * animation.
   * If a point is within 200 meters of the start or the end we trim it off.
   */
  protected function trimPoints($items) {

    $trim_distance_limit = 200;

    // Set start point
    for($start_index = 1; $start_index < count($items); $start_index++) {
      $item = $items[$start_index];
      $distance = $this->haversineGreatCircleDistance($items[0]->lat,$items[0]->lng, $item->lat, $item->lng);
      if($distance > $trim_distance_limit) {
        break;
      }
    }

    // Set end point
    $last_item = $items[count($items) - 1];
    for($end_index = count($items) - 1; $end_index > 1; $end_index--) {
      $item = $items[$end_index];
      $distance = $this->haversineGreatCircleDistance($last_item->lat,$last_item->lng, $item->lat, $item->lng);
      if($distance > $trim_distance_limit) {
        break;
      }
    }

    // Build final set of points
    $data = [];
    for($index = $start_index; $index <= $end_index; $index++) {
      $item = $items[$index];
      $time = DrupalDateTime::createFromTimestamp($item->time);
      $data[] = [
        'lat'  => $item->lat,
        'lng'  => $item->lng,
        'ele'  => $item->ele,
        'date' => $time->format('d/m/Y'),
        'time' => $time->format('H:i:s'),
        'ts' => $time->format('U'),
      ];
    }

    return $data;
  }

  /**
   * Interpolate the points to create a smooth track.
   */
  protected function createCameraTrack(&$data) {
    $points = $this->createCameraTrackPoints($data);

    $lats = [];
    $lngs = [];
    foreach($points as $i => $point) {
      $lats[] = [$point['index'], $point['lat']];
      $lngs[] = [$point['index'], $point['lng']];
    }

    $latp = NaturalCubicSpline::interpolate($lats);
    $lngp = NaturalCubicSpline::interpolate($lngs);

    foreach($data as $index => &$item) {
      $item['camera'] = [
        'lat' => $latp($index),
        'lng' => $lngp($index),
      ];
    }

    return $points;
  }

  /**
   * Just select a handful of points from the entire track.
   */
  protected function createCameraTrackPoints($data) {

    //$resolution = 0.1;
    $resolution = 0.05;
    $gap = round(count($data) * $resolution);
    $points = [];

    $first = $data[0];
    $last = $data[count($data) - 1];
    $distAsCrowFlies = $this->haversineGreatCircleDistance($first['lat'], $first['lng'], $last['lat'], $last['lng']);
    $distLimit = $distAsCrowFlies / 25;

    for($i = 0; $i < count($data) - 1; $i += $gap) {

      if(isset($point)) {
        $distance = $this->haversineGreatCircleDistance($point['lat'], $point['lng'], $data[$i]['lat'], $data[$i]['lng']);
        if($distance < $distLimit) {
          continue;
        }
      }

      $point = [
        'lat'   => $data[$i]['lat'],
        'lng'   => $data[$i]['lng'],
        'index' => (int) $i,
      ];

      $points[] = $point;
    }

    // make sure last track point is last gps point
    $points[count($points) - 1] = [
      'lat'   => $last['lat'],
      'lng'   => $last['lng'],
      'index' => count($data) - 1,
    ];

    return $points;

  }

  /**
   * Calculates the great-circle distance between two points, with
   * the Haversine formula.
   * @param float $latitudeFrom Latitude of start point in [deg decimal]
   * @param float $longitudeFrom Longitude of start point in [deg decimal]
   * @param float $latitudeTo Latitude of target point in [deg decimal]
   * @param float $longitudeTo Longitude of target point in [deg decimal]
   * @param float $earthRadius Mean earth radius in [m]
   * @return float Distance between points in [m] (same as earthRadius)
   */
  protected function haversineGreatCircleDistance($latitudeFrom, $longitudeFrom, $latitudeTo, $longitudeTo, $earthRadius = 6371000) {
    // convert from degrees to radians
    $latFrom = deg2rad($latitudeFrom);
    $lonFrom = deg2rad($longitudeFrom);
    $latTo = deg2rad($latitudeTo);
    $lonTo = deg2rad($longitudeTo);

    $latDelta = $latTo - $latFrom;
    $lonDelta = $lonTo - $lonFrom;

    $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
        cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
    return $angle * $earthRadius;
  }

}
