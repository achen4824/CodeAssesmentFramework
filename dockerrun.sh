#!/bin/sh
sudo groupadd docker
sudo gpasswd -a $USER docker
newgrp docker
sudo service docker start
docker build .
