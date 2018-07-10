#!/usr/bin/env bash

apt-get update -qq
apt-get install zlib1g uuid-runtime
buildDeps='ca-certificates build-essential gdebi-core libssl-dev wget'
apt-get install -yq $buildDeps
echo "===> Install Comodo..."
cd /tmp
wget https://cdn.download.comodo.com/cis/download/installs/linux/cav-linux_x86.deb
DEBIAN_FRONTEND=noninteractive gdebi -n cav-linux_x86.deb
DEBIAN_FRONTEND=noninteractive /opt/COMODO/post_setup.sh
echo "===> Clean up unnecessary files..."
apt-get purge -y --auto-remove $buildDeps
apt-get clean
rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*


# Update Comodo Definitions
curl -Ls http://download.comodo.com/av/updates58/sigs/bases/bases.cav > /opt/COMODO/scanners/bases.cav