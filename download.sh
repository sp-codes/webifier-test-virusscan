#!/usr/bin/env bash

# $1 = URL
# $2 = tmp dir

httrack --get-files --keep-links=K --do-not-log --sockets=8 --robots=0 --retries=2 --depth=9999 $1 -O $2
cd $2
rm -rf hts-cache
find -maxdepth 1 -type f -delete