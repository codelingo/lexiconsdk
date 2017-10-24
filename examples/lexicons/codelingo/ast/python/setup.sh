#!/usr/bin/env bash

cd "$(dirname "$0")"

sudo cp -R testdata/ /testdata/
sudo cp -R python/ /server/
sudo cp server-config.yaml /server/
sudo mkdir -p /setup/
sudo cp setup.json /setup/

user="$(whoami)"
sudo chown -R $user:$user /testdata /server /setup
