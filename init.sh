#!/usr/bin/env bash

apt-get -y update
apt-get install -y wget python clamav lib32ncurses5 lib32z1 libfontconfig1 libfreetype6 libglib2.0-0 libice6 libsm6 libx11-6 libxext6 libxrender1
wget https://www.securitysquad.de/repository/avg.i386.deb
dpkg -i avg.i386.deb
wget https://www.securitysquad.de/repository/libssl0.9.8_0.9.8o-7_amd64.deb
dpkg -i libssl0.9.8_0.9.8o-7_amd64.deb
wget https://www.securitysquad.de/repository/cav_x64.deb
dpkg -i cav_x64.deb
/opt/COMODO/post_setup.sh

# update scanner libs lib
freshclam
service avgd start
avgupdate
