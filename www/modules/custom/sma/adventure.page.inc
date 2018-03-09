<?php

/**
 * @file
 * Contains adventure.page.inc.
 *
 * Page callback for Adventure entities.
 */

use Drupal\Core\Render\Element;

/**
 * Prepares variables for Adventure templates.
 *
 * Default template: adventure.html.twig.
 *
 * @param array $variables
 *   An associative array containing:
 *   - elements: An associative array containing the user information and any
 *   - attributes: HTML attributes for the containing element.
 */
function template_preprocess_adventure(array &$variables) {
  // Fetch Adventure Entity Object.
  $adventure = $variables['elements']['#adventure'];

  // Helpful $content variable for templates.
  foreach (Element::children($variables['elements']) as $key) {
    $variables['content'][$key] = $variables['elements'][$key];
  }
}
