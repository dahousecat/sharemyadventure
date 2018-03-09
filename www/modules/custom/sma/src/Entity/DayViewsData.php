<?php

namespace Drupal\sma\Entity;

use Drupal\views\EntityViewsData;

/**
 * Provides Views data for Day entities.
 */
class DayViewsData extends EntityViewsData {

  /**
   * {@inheritdoc}
   */
  public function getViewsData() {
    $data = parent::getViewsData();

    // Additional information for Views integration, such as table joins, can be
    // put here.

    return $data;
  }

}
