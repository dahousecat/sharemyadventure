<?php

namespace Drupal\sma;

use Drupal\Core\Entity\EntityAccessControlHandler;
use Drupal\Core\Entity\EntityInterface;
use Drupal\Core\Session\AccountInterface;
use Drupal\Core\Access\AccessResult;

/**
 * Access controller for the Day entity.
 *
 * @see \Drupal\sma\Entity\Day.
 */
class DayAccessControlHandler extends EntityAccessControlHandler {

  /**
   * {@inheritdoc}
   */
  protected function checkAccess(EntityInterface $entity, $operation, AccountInterface $account) {
    /** @var \Drupal\sma\Entity\DayInterface $entity */
    switch ($operation) {
      case 'view':
        if (!$entity->isPublished()) {
          return AccessResult::allowedIfHasPermission($account, 'view unpublished day entities');
        }
        return AccessResult::allowedIfHasPermission($account, 'view published day entities');

      case 'update':
        return AccessResult::allowedIfHasPermission($account, 'edit day entities');

      case 'delete':
        return AccessResult::allowedIfHasPermission($account, 'delete day entities');
    }

    // Unknown operation, no opinion.
    return AccessResult::neutral();
  }

  /**
   * {@inheritdoc}
   */
  protected function checkCreateAccess(AccountInterface $account, array $context, $entity_bundle = NULL) {
    return AccessResult::allowedIfHasPermission($account, 'add day entities');
  }

}
