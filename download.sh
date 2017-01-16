#!/usr/bin/env bash

# $1 = URL
# $2 = tmp dir

httrack --mirrorlinks --keep-links=K --do-not-log --sockets=8 --robots=1 --retries=1 --depth=2 $1 -O $2
cd $2
rm -rf hts-cache
find -maxdepth 1 -type f -delete