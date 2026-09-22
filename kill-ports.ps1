# kill-ports.ps1
# Mata processos nas portas do projeto

$ports = @(3000, 3001, 5435, 6379)

foreach ($port in $ports) {
  $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
  
  if ($connections) {
    $connections | ForEach-Object {
      Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
      Write-Host "🗑️  Processo na porta $port encerrado" -ForegroundColor Yellow
    }
  }
}

Write-Host "`n✅ Todas as portas liberadas!" -ForegroundColor Green