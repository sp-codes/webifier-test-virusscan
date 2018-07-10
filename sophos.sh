#!/usr/bin/env bash

buildDeps='ca-certificates wget'
DEBIAN_FRONTEND=noninteractive apt-get update -qq
apt-get install -yq $buildDeps
echo "===> Install Sophos..."
cd /tmp
wget -q https://github.com/maliceio/malice-av/raw/master/sophos/sav-linux-free-9.tgz
tar xzvf sav-linux-free-9.tgz
./sophos-av/install.sh /opt/sophos --update-free --acceptlicence --autostart=False --enableOnBoot=False --automatic --ignore-existing-installation --update-source-type=s
echo "===> Update Sophos..."
/opt/sophos/update/savupdate.sh
echo "===> Clean up unnecessary files..."
apt-get remove --purge -y $buildDeps
apt-get clean
rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*