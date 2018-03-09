<?php

/**
 * @file
 * Contains day.page.inc.
 *
 * Page callback for Day entities.
 */

use Drupal\Core\Render\Element;

/**
 * Prepares variables for Day templates.
 *
 * Default template: day.html.twig.
 *
 * @param array $variables
 *   An associative array containing:
 *   - elements: An associative array containing the user information and any
 *   - attributes: HTML attributes for the containing element.
 */
function template_preprocess_day(array &$variables) {
  // Fetch Day Entity Object.
  $day = $variables['elements']['#day'];

  // Helpful $content variable for templates.
  foreach (Element::children($variables['elements']) as $key) {
    $variables['content'][$key] = $variables['elements'][$key];
  }
}
