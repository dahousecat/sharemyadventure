<?php

namespace Drupal\gpx_field\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Create form for module configuration.
 */
class ConfigurationForm extends ConfigFormBase {

  /**
   * Return the forms ID.
   */
  public function getFormId() {
    return 'gpx_field_configuration_form';
  }

  /**
   * Build the form.
   */
  public function buildForm(array $form, FormStateInterface $form_state) {

    $form = parent::buildForm($form, $form_state);

    $config = $this->config('gpx_field.settings');

    $form['google_map_key'] = [
      '#type' => 'textfield',
      '#default_value' => $config->get('gpx_field.google_map_key'),
      '#title' => t('Google Map API Key'),
      '#required' => FALSE,
      '#description' => t('Insert the Google API Key to use.'),
    ];

    $form['http'] = [
      '#type' => 'select',
      '#default_value' => $config->get('gpx_field.http'),
      '#title' => t('HTTP or HTTPS'),
      '#required' => TRUE,
      '#options' => [
        'https' => 'https',
        'http' => 'http',
      ],
      '#description' => t('Select protocol to be used with Google Maps API'),
    ];

    return $form;

  }

  /**
   * Submit handler for the film.
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {

    $config = $this->config('gpx_field.settings');
    $config->set('gpx_field.google_map_key', $form_state->getValue('google_map_key'));
    $config->set('gpx_field.http', $form_state->getValue('http'));
    $config->save();

    parent::submitForm($form, $form_state);
  }

  /**
   * Returns editable config names.
   */
  protected function getEditableConfigNames() {
    return [
      'gpx_field.settings',
    ];
  }

}
