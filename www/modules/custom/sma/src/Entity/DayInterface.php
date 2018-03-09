<?php

namespace Drupal\sma\Entity;

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Entity\EntityChangedInterface;
use Drupal\user\EntityOwnerInterface;

/**
 * Provides an interface for defining Day entities.
 *
 * @ingroup sma
 */
interface DayInterface extends ContentEntityInterface, EntityChangedInterface, EntityOwnerInterface {

  // Add get/set methods for your configuration properties here.

  /**
   * Gets the Day name.
   *
   * @return string
   *   Name of the Day.
   */
  public function getName();

  /**
   * Sets the Day name.
   *
   * @param string $name
   *   The Day name.
   *
   * @return \Drupal\sma\Entity\DayInterface
   *   The called Day entity.
   */
  public function setName($name);

  /**
   * Gets the Day creation timestamp.
   *
   * @return int
   *   Creation timestamp of the Day.
   */
  public function getCreatedTime();

  /**
   * Sets the Day creation timestamp.
   *
   * @param int $timestamp
   *   The Day creation timestamp.
   *
   * @return \Drupal\sma\Entity\DayInterface
   *   The called Day entity.
   */
  public function setCreatedTime($timestamp);

  /**
   * Returns the Day published status indicator.
   *
   * Unpublished Day are only visible to restricted users.
   *
   * @return bool
   *   TRUE if the Day is published.
   */
  public function isPublished();

  /**
   * Sets the published status of a Day.
   *
   * @param bool $published
   *   TRUE to set this Day to published, FALSE to set it to unpublished.
   *
   * @return \Drupal\sma\Entity\DayInterface
   *   The called Day entity.
   */
  public function setPublished($published);

}
