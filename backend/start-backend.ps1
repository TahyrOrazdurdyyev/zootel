# Load backend .env variables
$envPath = Join-Path $PSScriptRoot '.env'
if (Test-Path $envPath) {
    $envFile = Get-Content $envPath
    foreach ($line in $envFile) {
        if ($line -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, 'Process')
            Write-Host "Set $key = $value"
        }
    }
    Write-Host "
Environment variables loaded from .env"
} else {
    Write-Host "Warning: .env file not found at $envPath"
}

# Show DB_CONNECTION
Write-Host "
DB_CONNECTION = $env:DB_CONNECTION"

# Run backend
Write-Host "
Starting backend..."
go run cmd/main.go
