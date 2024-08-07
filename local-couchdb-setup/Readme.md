# Installation of CouchDB on Ubuntu 22.04 LTS with Docker in a local Network environment

Custom Setup for the LIK-Backoffice and Preiserfasser-App

## Requirements

| Resource | Definition       | Description |
| -------- | ---------------- | ----------- |
| OS       | Ubuntu 22.04 LTS |             |
| CPU      | 2 Cores          |             |
| Memory   | 4 GiB            |             |
| Disk     | > 50 GiB         |             |

For better readability of this document, maybe install a markdown viewer like `QOwnNotes`.

## Install Docker

Copy and Paste the following commands in the terminal. One line at a time. Exept the echo command, there you can copy and paste the whole block.

```bash
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# sudo apt-get update

# Install Docker and related packages
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add docker groupd if not exists
sudo groupadd docker

# Add user to docker group
sudo usermod -aG docker $USER

# Restart the server

# Test Docker
docker --version
docker ps
docker compose version
```

## Copy ZIP-Content

Exctract and copy the ZIP-Content to the /srv directory of ubuntu.
The folder structure should then look like this:

```bash
/srv
├── docker
    ├── couchdb
        ├── certs
            |── couchdb.key
            |── couchdb.pem
        ├── config
            ├── settings.ini
        ├── data
├── docker_compose
    ├── .env
    ├── couchdb.env
    ├── docker-compose.yml

```

## Change the Admin-Password

Change the password in /srv/docker_compose/couchdb.env

## Start Services

```bash
docker compose -f /srv/docker_compose/docker-compose.yml up -d
```

## Find the IP-Address of the Server

```bash
# in the terminal
ip a
# or
hostname -I
```

Check if CouchDB is running under `https://IpAddressOfTheServer:6984`

### Accept the self-signed certficate

When you open the DB for the first time in the browser there should be a warning, that its not secure. You have to click on `advanced` and then click on `Continue to the localhost (unsafe)`

Admin-Panel: `https://IpAddressOfTheServer:6984/_utils/`

## Delete Permisson

In Order to run the LIK-Apps properly delete the `admin` permission under `Databases` --> `onoffline` --> `Permissions` --> `onoffline` --> `Members` --> `Roles`

## Connect the Apps

1. First connect the Backoffice-App with `https://IpAddressOfTheServer:6984`
2. Set the Mindestversion of the Preiserfasser-App in the Settings
3. Make a Data-Import
4. Create a new User in the Backoffice-App and give him some Preismeldestellen
5. Connect the Preiserfasser-App with `https://IpAddressOfTheServer:6984`
6. Login with the User created in the Backoffice-App
