#!/bin/bash

. "/vagrant/setup/helper-functions.sh"
. "/vagrant/setup/variables.sh"

# Loop over all $SITES, but allow for an argument to do only one site
USE_SITES="$SITES"
# Allow passing an arg for site folder name
if [ ! -z "$1" ]; then
    USE_SITES="$1"
fi

for SITE in ""$USE_SITES; do

    if [ -z "$SITE" -o "$SITE" == "default" ]; then
        SITE_DB_NAME="$DB_NAME"
    else
        SITE_DB_NAME=$DB_NAME"_"$SITE
    fi

    # Make sure DB exists
    if ! mysql -u root -p${DB_ROOT_PASS} -e "use $SITE_DB_NAME" >/dev/null 2>&1; then
        cl "Error: This script expects a database called $SITE_DB_NAME but that does not exist." -e
        log "load-db was called but $SITE_DB_NAME does not exist"
        exit
    fi


    # Find most recent dump
    # TODO: Stop this line from producing an error when a dump does not exist
    # Allow passing an arg for site folder name
    MOST_RECENT=`find "$DB_DUMP_DIR" -type f -printf '%T@ %p\n' | grep "$SITE_DB_NAME" | sort -n | tail -1 | cut -f2- -d" "`

    # Make sure there is a dump to import
    if [ ${#MOST_RECENT} == 0 ]; then
      cl "No database dumps for this project have been created yet." -e
      exit
    fi

    FILE_NAME=${MOST_RECENT##*/}

    importdb() {
        zcat $1 | mysql  "$SITE_DB_NAME"
        cl "$2 imported successfully" -s
        log "imported dump to $SITE_DB_NAME"
    }

    if [[ $* == *-y* ]]; then # check for y flag
      importdb $MOST_RECENT $FILE_NAME
    else

      # Are you sure?
      read -r -p $'\e[36m'"This will import $FILE_NAME over the top of your database. Are you sure? [y/N] "$'\e[0m' response
      case $response in
          [yY][eE][sS]|[yY])
              importdb $MOST_RECENT $FILE_NAME
              ;;
          *)
              exit
              ;;
      esac

    fi
done