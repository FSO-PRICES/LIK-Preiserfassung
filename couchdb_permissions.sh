#!/bin/bash

url=$1
adminUsername=$2
echo -n "Password: "
read -s password
echo
echo "Checking dbs..."

if [ -z $url ]; then
    echo "No URL given"
    exit 1
fi

if [ -z $adminUsername ]; then
    echo "No admin user specified"
    exit 2
fi
if [ -z $password ]; then
    echo "No password specified"
    exit 3
fi

auth="$adminUsername:$password"

adminDbs=(
    "warenkorb"
    "preiserheber"
    "preismeldestellen"
    "preiszuweisungen"
    # "orphaned_erfasste_preismeldungen"
    "preismeldungen"
    "preismeldungen_status"
    "imports"
    "exports"
)
erheberDbs=`curl -s --user $auth ${url}/_all_dbs | grep -o user_\[^\"\]\*`

# Functions

check_and_fix_admin_permissions() {
    db=$1
    curl -s --user $auth ${url}/$db/_security | grep "$adminUsername" > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "\"$db\" has incorrect permission, fixing..."
        curl -s --user $auth ${url}/$db/_security -H 'Content-Type: application/json' -X PUT -d "{\"members\":{\"names\":[\"$adminUsername\"]}}" > /dev/null 2>&1
    fi
}

check_and_fix_user_permissions() {
    db=$1
    user=`echo $db | sed s/user_//`
    curl -s --user $auth ${url}/$db/_security | grep "\"$user\"" > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "\"$db\" has no user asigned, fixing..."
        curl -s --user $auth ${url}/$db/_security -H 'Content-Type: application/json' -X PUT -d "{\"members\":{\"names\":[\"$user\"]}}" > /dev/null 2>&1
    fi
}

# Check and fix admin permissions

for db in "${adminDbs[@]}"; do
    check_and_fix_admin_permissions $db &
done

wait

# Check and fix user roles

for user in $erheberDbs; do
    check_and_fix_user_permissions $user &
done

wait
