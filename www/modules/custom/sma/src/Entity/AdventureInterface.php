<?php

namespace Drupal\sma\Entity;

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Entity\EntityChangedInterface;
use Drupal\user\EntityOwnerInterface;

/**
 * Provides an interface for defining Adventure entities.
 *
 * @ingroup sma
 */
interface AdventureInterface extends ContentEntityInterface, EntityChangedInterface, EntityOwnerInterface {

  // Add get/set methods for your configuration properties here.

  /**
   * Gets the Adventure name.
   *
   * @return string
   *   Name of the Adventure.
   */
  public function getName();

  /**
   * Sets the Adventure name.
   *
   * @param string $name
   *   The Adventure name.
   *
   * @return \Drupal\sma\Entity\AdventureInterface
   *   The called Adventure entity.
   */
  public function setName($name);

  /**
   * Gets the Adventure creation timestamp.
   *
   * @return int
   *   Creation timestamp of the Adventure.
   */
  public function getCreatedTime();

  /**
   * Sets the Adventure creation timestamp.
   *
   * @param int $timestamp
   *   The Adventure creation timestamp.
   *
   * @return \Drupal\sma\Entity\AdventureInterface
   *   The called Adventure entity.
   */
  public function setCreatedTime($timestamp);

  /**
   * Returns the Adventure published status indicator.
   *
   * Unpublished Adventure are only visible to restricted users.
   *
   * @return bool
   *   TRUE if the Adventure is published.
   */
  public function isPublished();

  /**
   * Sets the published status of a Adventure.
   *
   * @param bool $published
   *   TRUE to set this Adventure to published, FALSE to set it to unpublished.
   *
   * @return \Drupal\sma\Entity\AdventureInterface
   *   The called Adventure entity.
   */
  public function setPublished($published);

}
