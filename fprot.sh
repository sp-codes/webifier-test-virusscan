#!/usr/bin/env bash

buildDeps='ca-certificates build-essential wget'
set -x
apt-get update -qq
apt-get install -yq $buildDeps libc6-i386 --no-install-recommends
set -x
echo "===> Install F-PROT..."
wget http://files.f-prot.com/files/unix-trial/fp-Linux.x86.32-ws.tar.gz -O /tmp/fp-Linux.x86.32-ws.tar.gz
tar -C /opt -zxvf /tmp/fp-Linux.x86.32-ws.tar.gz
ln -fs /opt/f-prot/fpscan /usr/local/bin/fpscan
ln -fs /opt/f-prot/fpscand /usr/local/sbin/fpscand
ln -fs /opt/f-prot/fpmon /usr/local/sbin/fpmon
cp /opt/f-prot/f-prot.conf.default /opt/f-prot/f-prot.conf
ln -fs /opt/f-prot/f-prot.conf /etc/f-prot.conf
chmod a+x /opt/f-prot/fpscan
chmod u+x /opt/f-prot/fpupdate
ln -fs /opt/f-prot/man_pages/scan-mail.pl.8 /usr/share/man/man8/
echo "===> Clean up unnecessary files..."
apt-get purge -y --auto-remove $buildDeps
apt-get clean
rm -rf /var/lib/apt/lists/* /var/cache/apt/archives /tmp/* /var/tmp/*

# Update F-PROT Definitions
/opt/f-prot/fpupdate