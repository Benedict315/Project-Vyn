# Script para crear labels adicionales y aplicarlos a issues #34-#49
$ErrorActionPreference = 'Stop'
$owner='Kalebtron1'; $repo='Project-Vyn'

# Get token
$credInput = "protocol=https`nhost=github.com`n"
$credRaw = $credInput | & git credential fill
$lines = $credRaw -split "`n" | Where-Object { $_ -ne '' }
$map = @{}
foreach($l in $lines){ if($l -match '='){ $p=$l -split '='; $map[$p[0]]=$p[1] } }
$token = $map['password']
if(-not $token){ Write-Error 'No token from git credential fill'; exit 1 }
$headers = @{ Authorization = "token $token"; 'User-Agent'='vyn-deployer' }

# Labels to ensure exist
$labelsToCreate = @(
    @{ name='observability'; color='8b5cf6'; description='Logs, traces and monitoring' },
    @{ name='infra'; color='0ea5a4'; description='Infrastructure and deployment' },
    @{ name='security'; color='ef4444'; description='Security and hardening' },
    @{ name='testing'; color='084298'; description='Tests, CI and E2E' },
    @{ name='performance'; color='f97316'; description='Performance and optimization' }
)

foreach($l in $labelsToCreate){
    $body = @{ name=$l.name; color=$l.color; description=$l.description } | ConvertTo-Json -Depth 3
    try{
        Invoke-RestMethod -Method Post -Uri "https://api.github.com/repos/$owner/$repo/labels" -Headers $headers -Body $body -ContentType 'application/json' | Out-Null
        Write-Output "Label created: $($l.name)"
    } catch{
        # If already exists, ignore
        Write-Output "Label exists or error creating $($l.name): $($_.Exception.Message)"
    }
}

# Mapping issue -> labels (keep complexity labels already set)
$mapping = @{
    34 = @('backend','observability')
    35 = @('backend','observability')
    36 = @('backend','infra')
    37 = @('docs','infra')
    38 = @('contracts','security')
    39 = @('contracts','testing')
    40 = @('contracts','infra')
    41 = @('contracts','performance')
    42 = @('backend','testing','performance')
    43 = @('backend','security')
    44 = @('backend','testing')
    45 = @('backend','observability')
    46 = @('frontend','wallet')
    47 = @('frontend','wallet')
    48 = @('frontend','mobile','wallet')
    49 = @('testing','wallet')
}

foreach($issueNumber in $mapping.Keys){
    $labels = $mapping[$issueNumber]
    $body = @{ labels = $labels } | ConvertTo-Json
    try{
        Invoke-RestMethod -Method Post -Uri "https://api.github.com/repos/$owner/$repo/issues/$issueNumber/labels" -Headers $headers -Body $body -ContentType 'application/json' | Out-Null
        Write-Output "Labels applied to #${issueNumber}: $([string]::Join(', ',$labels))"
    } catch{
        Write-Error "Error applying labels to #${issueNumber}: $($_.Exception.Message)"
    }
}
Write-Output 'Done.'
