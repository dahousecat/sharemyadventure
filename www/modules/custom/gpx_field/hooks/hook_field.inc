<?php
/**
 * @file
 *
 * Field hook functions.
 */


/**
 * Implements hook_field_widget_form_container_alter.
 */
function gpx_field_field_widget_form_container_alter(&$element, \Drupal\Core\Form\FormStateInterface $form_state, $context) {

    $field_definition = $context['items']->getFieldDefinition();

    if ($field_definition->getType() == 'gpx' && 0) {

        $element['#type'] = 'fieldset';
        //$element['#tree'] = TRUE;
        $element['#title'] = $element['widget']['#title'];
        $element['widget']['#title'] = t('Track parts');

        $element['gpx_field_gpx'] = [
            '#type' => 'managed_file',
            '#title' => t('GPX'),
            '#default_value' => NULL,
            '#description' => t('Allowed extensions: gpx'),
            '#upload_validators' => [
                'file_validate_extensions' => array('gpx'),
            ],
            '#weight' => 0,
        ];

        $element['gpx_field_action'] = [
            '#type' => 'radios',
            '#title' => t('Action'),
            '#default_value' => 'append',
            '#options' => [
                'append' => t('Append'),
                'replace' => t('Replace'),
            ],
            '#weight' => 1,
        ];

        $element['widget']['#weight'] = 2;

    }

}

