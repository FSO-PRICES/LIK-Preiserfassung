$ErrorActionPreference = "Stop"
$progressPreference = 'silentlyContinue'

$url = $args[0]
$adminUsername = $args[1]
$secPassword = Read-Host -assecurestring "Please enter your password"
$password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secPassword))

Write-Output "URL '$url' AdminName '$adminUsername' Password '$password'"

Write-Output ""
Write-Output "Checking dbs..."

if ([string]::IsNullOrEmpty($url)) {
    Write-Output "No URL given"
    exit 1
}

if ([string]::IsNullOrEmpty($adminUsername)) {
    Write-Output "No admin user specified"
    exit 1
}

if ([string]::IsNullOrEmpty($password)) {
    Write-Output "No password specified"
    exit 1
}

$auth = "$($adminUsername):$($password)"
$encodedCredentials = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes($auth))
$headers = @{ Authorization = "Basic $encodedCredentials" }


$adminDbs = @(
    "warenkorb",
    "preiserheber",
    "preismeldestellen",
    "preiszuweisungen",
    # "orphaned_erfasste_preismeldungen",
    "preismeldungen",
    "preismeldungen_status",
    "imports",
    "exports"
)
$allDbs = (Invoke-WebRequest "$($url)/_all_dbs" -Headers $headers ).Content | ConvertFrom-Json


function CheckAndFixAdminPermissions($db) {
    $permission = (Invoke-WebRequest "$($url)/$($db)/_security" -Headers $headers).Content | ConvertFrom-Json

    if (!$permission -OR !$permission.members -OR !$permission.members.names -OR !$permission.members.names.Contains($adminUsername)) {
        Write-Output """$db"" has incorrect permission, fixing..."
        Invoke-WebRequest -Method PUT -Body "{""members"":{""names"":[""$adminUsername""]}}" "$($url)/$($db)/_security" -Headers $headers | Out-Null
    }
}

function CheckAndFixUserPermissions([String] $db) {
    $user = $db.Substring(5)
    $permission = (Invoke-WebRequest "$($url)/$($db)/_security" -Headers $headers).Content | ConvertFrom-Json

    if (!$permission -OR !$permission.members -OR !$permission.members.names -OR !$permission.members.names.Contains($user)) {
        Write-Output """$db"" has no user asigned, fixing..."
        Invoke-WebRequest -Method PUT -Body "{""members"":{""names"":[""$user""]}}" "$($url)/$($db)/_security" -Headers $headers | Out-Null
    }
}

foreach ($db in $adminDbs) {
    Write-Output "db: '$db'"
    CheckAndFixAdminPermissions $db
}

Write-Output ""

foreach ($db in $allDbs) {
    if ($db.ToString().StartsWith("user_")) {
        Write-Output "user_db: '$db'"
        CheckAndFixUserPermissions $db
    }
}
