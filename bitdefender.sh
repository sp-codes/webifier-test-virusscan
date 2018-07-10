#!/usr/bin/env bash

BDKEY=""
BDVERSION="7.7-1"

BDURLPART="BitDefender_Antivirus_Scanner_for_Unices/Unix/Current/EN_FR_BR_RO/Linux/"
BDURL="https://download.bitdefender.com/SMB/Workstation_Security_and_Management/${BDURLPART}"

buildDeps="ca-certificates wget build-essential"
apt-get update -qq
apt-get install -yq $buildDeps psmisc
set -x
echo "===> Install Bitdefender..."
cd /tmp
wget -q ${BDURL}/BitDefender-Antivirus-Scanner-${BDVERSION}-linux-amd64.deb.run
chmod 755 /tmp/BitDefender-Antivirus-Scanner-${BDVERSION}-linux-amd64.deb.run
sh /tmp/BitDefender-Antivirus-Scanner-${BDVERSION}-linux-amd64.deb.run --check
echo "===> Making installer noninteractive..."
sed -i 's/^more LICENSE$/cat  LICENSE/' BitDefender-Antivirus-Scanner-${BDVERSION}-linux-amd64.deb.run
sed -i 's/^CRCsum=.*$/CRCsum="0000000000"/' BitDefender-Antivirus-Scanner-${BDVERSION}-linux-amd64.deb.run
sed -i 's/^MD5=.*$/MD5="00000000000000000000000000000000"/' BitDefender-Antivirus-Scanner-${BDVERSION}-linux-amd64.deb.run
(echo 'accept'; echo 'n') | sh /tmp/BitDefender-Antivirus-Scanner-${BDVERSION}-linux-amd64.deb.run;
  if [ "x$BDKEY" != "x" ]; then
      echo "===> Updating License...";
      oldkey='^Key =.*$';
      newkey="Key = ${BDKEY}";
      sed -i "s|$oldkey|$newkey|g" /opt/BitDefender-scanner/etc/bdscan.conf;
      cat /opt/BitDefender-scanner/etc/bdscan.conf;
  fi
echo "===> Clean up unnecessary files..."
apt-get purge -y --auto-remove $buildDeps
apt-get clean
rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Update Bitdefender definitions
echo "accept" | bdscan --update