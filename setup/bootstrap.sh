#!/bin/bash

START_SECONDS="$(date +%s)"

. "/vagrant/setup/helper-functions.sh"
. "/vagrant/setup/variables.sh"

log "start of bootstrap"

##################################
#          Provisioning          #
##################################

# Don't ask for anything
export DEBIAN_FRONTEND=noninteractive

# Set MySQL root password
debconf-set-selections <<< "mysql-server-5.5 mysql-server/root_password password $DB_ROOT_PASS"
debconf-set-selections <<< "mysql-server-5.5 mysql-server/root_password_again password $DB_ROOT_PASS"


# Don't update more than one per day
if [ -f /var/log/vagrant_provision_last_update_time.log ]; then
	LAST_UPDATED=`cat /var/log/vagrant_provision_last_update_time.log`
	DAY_AGO=`date +%s --date='-1 day'`
else
	LAST_UPDATED=""
fi

if [ -z "$LAST_UPDATED" ] || [ "$LAST_UPDATED" -lt "$DAY_AGO" ]; then

	# Install packages
	cl "Install / update packages"
	log "updating packages"

	add-apt-repository ppa:ondrej/php
    apt-get update

	apt-get install -q -f -y \
      -o Dpkg::Options::='--force-confdef' -o Dpkg::Options::='--force-confold' \
      build-essential git language-pack-en-base unzip \
      apache2 \
      php7.0 php7.0-mcrypt php7.0-curl php-xdebug php7.0-mbstring php7.0-xml \
      php7.0-zip \
      libapache2-mod-php7.0 \
      mysql-server-5.7 php7.0-mysql php-mysql \
      imagemagick php-imagick \
      memcached php-memcached php-gd php7.0-gd \
      postfix mailutils

	apt-get -y remove puppet chef chef-zero puppet-common

	# Make log file to save last updated time
	date +%s > /var/log/vagrant_provision_last_update_time.log

else
	log "skipping updating packages"
	cl "Updates last ran less than a day ago so skipping"
fi

# Set timezone
echo "Australia/Melbourne" | tee /etc/timezone
dpkg-reconfigure --frontend noninteractive tzdata

# Setup apache
log "set up apache"
echo "ServerName localhost" >> /etc/apache2/apache2.conf
a2enmod php7.0
a2enmod rewrite
a2enmod ssl
a2enmod headers

ln -s /vagrant/setup/files/host.conf /etc/apache2/sites-available/host.conf

cp /vagrant/setup/files/xdebug.ini /etc/php/7.0/mods-available/xdebug.ini

# Create .my.cnf
cat > "/home/${USERNAME}/.my.cnf" << EOF
[client]
user=root
password=$DB_ROOT_PASS
EOF
cat > /root/.my.cnf << EOF
[client]
user=root
password=$DB_ROOT_PASS
EOF

# Create .my.cnf
cat > "/home/${USERNAME}/.my.cnf" << EOF
[client]
user=root
password=$DB_ROOT_PASS
EOF
cat > /root/.my.cnf << EOF
[client]
user=root
password=$DB_ROOT_PASS
EOF

# Log files should be accessible by all
sed -i 's/create 640 root adm/create 644 root adm/' /etc/logrotate.d/apache2
chmod g+rwx /var/log/apache2

# Configure PHP
log "configure php"
php-setting-update display_errors 'On'
php-setting-update error_reporting 'E_ALL | E_STRICT'
php-setting-update html_errors 'On'
php-setting-update xdebug.max_nesting_level '256'

# Make apache2 log folder readable by vagrant
sudo adduser "$USERNAME" admin

service apache2 restart

# Link repository webroot to server webroot
if [ ! -h "/var/www/$HOST_NAME" ] || [ ! -d "/var/www/$HOST_NAME" ]; then
    log "create symlink to webroot"
    ln -fs "$WEBROOT" "/var/www/$HOST_NAME"
fi


# Make sure symlinks to import and export database scripts exist
if [ ! -h "/usr/local/bin/load-db" ]; then
    log "create symlink for load-db script"
    chmod +x /vagrant/setup/scripts/load-db.sh
    ln -s /vagrant/setup/scripts/load-db.sh /usr/local/bin/load-db
fi
if [ ! -h "/usr/local/bin/save-db" ]; then
    log "create symlink for save-db script"
    chmod +x /vagrant/setup/scripts/save-db.sh
    ln -s /vagrant/setup/scripts/save-db.sh /usr/local/bin/save-db
fi

# Make drush command run as www-data user
if [ ! -f ~/.bash_aliases ]; then
    echo "alias drush='sudo -u www-data `which drush`'" >> ~/.bash_aliases
fi

# Redirect to webroot on first login
grep -q -F 'cd /vagrant/www' ~/.profile || echo 'cd /vagrant/www' >> ~/.profile

# Setup database
if ! mysql -u root -p${DB_ROOT_PASS} -e "use ${DB_NAME}" >/dev/null 2>&1; then

      cl "setting up database. Name: ""$DB_NAME"", User: ""$DB_USER"", Host: $DB_HOST"

      cat | mysql -u root -ppassword << EOF
      DROP DATABASE IF EXISTS test;
      CREATE DATABASE ${DB_NAME};
      GRANT ALL ON ${DB_NAME}.* TO '${DB_USER}'@'${DB_HOST}' identified by '${DB_PASS}';
      FLUSH PRIVILEGES;
EOF

    fi

# Install composer
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php --install-dir=/usr/local/bin --filename=composer
php -r "unlink('composer-setup.php');"

# Install Drush
su - vagrant -c "composer global require drush/drush:8.x-dev --prefer-source"

# Finally, enable the new site
a2ensite host
a2dissite 000-default

# Make sure things are up and running as they should be
log "restart apache"
service apache2 restart

# Add vendor/bin to path so we can use drush
grep -q -F 'PATH="$HOME/.composer/vendor/bin:$PATH"' "/home/$USERNAME/.profile" || echo 'PATH="$HOME/.composer/vendor/bin:$PATH"' >> "/home/$USERNAME/.profile"

# Say how long the script took to execute (with the seconds in bold yellow)
END_SECONDS="$(date +%s)"
TIME_ELAPSED=`expr $END_SECONDS - $START_SECONDS`
FORMATTED_TIME="$(date -u -d @${TIME_ELAPSED} +"%M minutes %S seconds")"
YELLOW='\033[0;33m'
BLUE='\033[1;34m'
BOLD=$(tput bold)
NORMAL=$(tput sgr0)
cl "Provisioning complete in $YELLOW$BOLD$FORMATTED_TIME$NORMAL $BLUE\n"

cl 'Access the test environment via http://localhost:9898'
cl ""

log "bootstrap finished"
