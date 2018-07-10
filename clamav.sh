#!/usr/bin/env bash

apt-get update
apt-get install -y clamav ca-certificates

# Update ClamAV Definitions
freshclam