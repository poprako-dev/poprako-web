#!/bin/sh

DEST=/var/www/poprako-w

sudo chown -R www-data:www-data $DEST

sudo find $DEST -type d -exec chmod 755 {} +
sudo find $DEST -type f -exec chmod 644 {} +
