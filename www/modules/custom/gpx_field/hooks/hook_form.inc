<?php
/**
 * @file
 *
 * Form hook functions.
 */

/**
 * Implements hook_form_alter().
 */
function gpx_field_form_alter(&$form, \Drupal\Core\Form\FormStateInterface $form_state, $form_id)
{
//  $config_factory = \Drupal::configFactory();
//  $config = $config_factory->getEditable('system.site');
//  kint($config);
//  dpm($form, $form_id);

}

/**
 * Implements hook_form_FORM_ID_alter() for field_storage_config_edit_form.
 */
function gpx_field_form_field_storage_config_edit_form_alter(&$form, \Drupal\Core\Form\FormStateInterface $form_state, $form_id)
{

  $request = \Drupal::request();
  $entity_type_id = $request->attributes->get('entity_type_id');
  $field_config = $request->attributes->get('field_config');

  $parts = explode('.', $field_config);
  $field_name = array_pop($parts);

  $field_config = \Drupal\field\Entity\FieldStorageConfig::loadByName($entity_type_id, $field_name);

  if ($field_config->getType() == 'gpx') {

    // Disable cardinality settings and force multi-cardinality.
    $form['cardinality_container']['cardinality_wrapper']['cardinality']['#value'] = -1;
    $form['cardinality_container']['cardinality_wrapper']['cardinality']['#disabled'] = TRUE;
    $form['cardinality_container']['cardinality_wrapper']['cardinality']['#description'] = t('All fields of type gpx have unlimited values.');

    // Disable reorderable setttings and disable reordering.
    $form['cardinality_container']['reorderable']['#default_value'] = FALSE;
    $form['cardinality_container']['reorderable']['#disabled'] = TRUE;
    $form['cardinality_container']['reorderable']['#description'] = t('Gpx fields are ordered automatically by the timestamp.');
  }

}