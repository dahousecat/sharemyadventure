<?php

/**
 * @file
 * Contains Drupal\gpx_track_elevation\Form\GPXTrackEleForm.
 */

namespace Drupal\gpx_field\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

class ConfigurationForm extends ConfigFormBase
{

  /**
   * {@inheritdoc}.
   */
  public function getFormId() {
    return 'gpx_field_configuration_form';
  }

  /**
   * {@inheritdoc}.
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    // Form constructor
    $form = parent::buildForm($form, $form_state);
    // Default settings
    $config = $this->config('gpx_field.settings');

    $form['google_map_key'] = array(
      '#type' => 'textfield',
      '#default_value' => $config->get('gpx_field.google_map_key'),
      '#title' => t('Google Map API Key'),
      '#required' => FALSE,
      '#description' => t('Insert the Google API Key to use.'),
    );

    $form['http'] = array(
      '#type' => 'select',
      '#default_value' => $config->get('gpx_field.http'),
      '#title' => t('HTTP or HTTPS'),
      '#required' => TRUE,
      '#options' => array(
        'https' => 'https',
        'http' => 'http',
      ),
      '#description' => t('Select protocol to be used with Google Maps API'),
    );

    return $form;

  }

  /**
   * {@inheritdoc}.
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {

    $config = $this->config('gpx_field.settings');
    $config->set('gpx_field.google_map_key', $form_state->getValue('google_map_key'));
    $config->set('gpx_field.http', $form_state->getValue('http'));
    $config->save();

    parent::submitForm($form, $form_state);
  }

  /**
   * {@inheritdoc}.
   */
  protected function getEditableConfigNames() {
    return [
      'gpx_field.settings',
    ];
  }

}
