#!/usr/bin/env bash

ESCAN="7.0-20"
set -x
dpkg --add-architecture i386
apt-get update -qq
apt-get install -yq wget gdebi libc6-i386 --no-install-recommends
echo "===> Install eScan AV..."
wget -q -P /tmp http://www.microworldsystems.com/download/linux/soho/deb/escan-antivirus-wks-${ESCAN}.amd64.deb
DEBIAN_FRONTEND=noninteractive gdebi -n /tmp/escan-antivirus-wks-${ESCAN}.amd64.deb
echo "===> Clean up unnecessary files..."
apt-get remove -y gdebi
apt-get clean
rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Update eScan
escan --update