CONTENTS OF THIS FILE
---------------------

 * Introduction
 * Similar modules
 * Requirements
 * Installation
 * Configuration
 * Troubleshooting
 * Maintainers

INTRODUCTION
------------
This module creates a field type called GPX.
This field type allows GPX files to be uploaded, but then extracts the data and
stores it in the database.
This allows multiple GPX files to be uploaded to one field. When each new GPX
file is uploaded you have the option of appending to or replacing the existing
data.
This can be formatted as either a table, a static google map showing the route,
or an animated google map showing the progression of the route.

SIMILAR MODULES
---------------
GPX Track & Elevation (https://www.drupal.org/project/gpx_track_elevation) is a
similar module.
This module differs in the following ways:

* This modules creates a field type (GPX) instead of just a field formatter for
  the file field.
* This module stores values in the DB, as opposed to just storing the GPX file.
  This makes it easier to manipulate values, however also required more memory
  as it needs to process every row.
* This allows multiple GPX files to be merged together to create one track. Just
  be aware if you combine too many files you will start to experience out of
  memory errors.
* This module has additional formatters - one showing a table of data, and one
  that allows an static or animated map.

REQUIREMENTS
------------
This module is currently dependent on a core Drupal patch that creates
hook_field_widget_form_container_alter().
The thread with this patch can be found here:
  https://www.drupal.org/project/drupal/issues/2872162
And the patch can be found here:
  https://www.drupal.org/files/issues/2872162-field-widget-hook-3.patch

INSTALLATION
------------
First patch Drupal core with the patch shown above.
Then install the module with your preferred method, either composer, drush or
manually.
See https://www.drupal.org/docs/8/extending-drupal-8/installing-drupal-8-modules

CONFIGURATION
-------------
Global configuration for the module can be found at:
  /admin/config/content/gpx-field
Configuration specific to a field instance can be found by visiting the
"Manage display" tab and clicking the cog on the GPX field.

TROUBLESHOOTING
---------------
Refer to the module issue queue.

MAINTAINERS
-----------

Current maintainers:
* Felix Eve - https://www.drupal.org/user/1410992
