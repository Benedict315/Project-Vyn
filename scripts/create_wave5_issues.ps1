# Script to create milestones and issues for Drips Wave 5 (ASCII only)
$ErrorActionPreference = 'Stop'
$owner = 'Kalebtron1'
$repo = 'Project-Vyn'

# Get token from git credential helper
$credInput = "protocol=https`nhost=github.com`n"
$credRaw = $credInput | & git credential fill
if(-not $credRaw){ Write-Error 'No response from git credential fill.'; exit 1 }
$lines = $credRaw -split "`n" | Where-Object { $_ -ne '' }
$map = @{}
foreach($l in $lines){ if($l -match '='){ $p = $l -split '='; $map[$p[0]] = $p[1] } }
$token = $map['password']
if(-not $token){ Write-Error 'No token retrieved from git credential fill. Aborting.'; exit 1 }
$headers = @{ Authorization = "token $token"; 'User-Agent' = 'vyn-deployer' }

# Define milestones (ASCII-friendly)
$milestones = @(
    @{ title = 'Fiabilidad de scoring y prevencion de fraude'; description = 'Mejoras al scoring, validaciones y alertas para prevenir fraude y reducir falsos positivos/negativos.' },
    @{ title = 'Integracion y recuperacion de Wallets'; description = 'Abstraccion e integraciones para soportar multiples wallets, recuperacion de sesion y tests E2E.' },
    @{ title = 'Auditoria y robustez de contratos'; description = 'Auditoria de seguridad, tests y scripts de migracion para contratos en backend/contracts.' },
    @{ title = 'Observabilidad, metricas y operacion'; description = 'Logs estructurados, metricas, health checks y runbook para operacion en produccion.' }
)

$milestoneMap = @{}
foreach($m in $milestones){
    $body = @{ title = $m.title; state = 'open'; description = $m.description } | ConvertTo-Json -Depth 5
    try{
        $res = Invoke-RestMethod -Method Post -Uri "https://api.github.com/repos/$owner/$repo/milestones" -Headers $headers -Body $body -ContentType 'application/json'
        Write-Output "Milestone creado: $($res.title) -> #$($res.number)"
        $milestoneMap[$res.title] = $res.number
    } catch{
        Write-Error "Error creando milestone: $($_.Exception.Message)"
        exit 1
    }
}

# Define issues per milestone (ASCII bodies)
$issuesByMilestone = @{}
$issuesByMilestone['Fiabilidad de scoring y prevencion de fraude'] = @(
    @{ title='Mejorar algoritmo de scoring'; labels=@('complexity:high'); body = "Why: Reducir falsos positivos/negativos en concesion de credito.`nProblem: El scoring actual falla en casos limite y es sensible a entradas atipicas.`nScope: Ajustes algoritmicos, recoleccion de casos reales, tests de regresion.`nImplementation: anadir metricas, ajustar ponderaciones, retrain con dataset sintetico+real.`nAcceptance: metricas de concordancia mejoradas y tests automatizados.`nComplexity: high" },
    @{ title='Validaciones server-side para entradas criticas'; labels=@('complexity:medium'); body = "Why: Evitar manipulacion y requests invalidos que afectan scoring y fondos.`nProblem: Faltan validaciones robustas en endpoints criticos.`nScope: api/* endpoints que afectan scoring/transacciones.`nImplementation: anadir validacion y normalizacion, respuesta 400 para payloads malos.`nAcceptance: tests unit/integration bloquean payloads invalidos.`nComplexity: medium" },
    @{ title='Simulador de datos y pruebas de estres'; labels=@('complexity:medium'); body = "Why: Probar edge-cases del scoring y performance.`nProblem: No hay simulador reproducible para escenarios limite.`nScope: herramienta local para generar cargas y casos atipicos.`nImplementation: script/fixture JS que genera datasets y carga endpoints.`nAcceptance: reproducir al menos 5 casos reales y reportar metricas.`nComplexity: medium" },
    @{ title='Alertas de anomalias en scoring'; labels=@('complexity:medium'); body = "Why: Detectar cambios inesperados en produccion rapidamente.`nProblem: No hay alertas por drift o outliers.`nScope: alertas basicas sobre tasa de rechazo y distribucion del score.`nImplementation: integrar metrica (Prometheus/Datadog/Sentry) y reglas de alerta.`nAcceptance: alertas configuradas y prueba de disparo simulada.`nComplexity: medium" }
)
$issuesByMilestone['Integracion y recuperacion de Wallets'] = @(
    @{ title='Adapter universal de wallets'; labels=@('complexity:high'); body = "Why: Soportar multiples wallets sin reescribir logica.`nProblem: Codigo frontend depende de Freighter; falta abstraccion.`nScope: interfaz que unifique Freighter, WalletConnect y futuros.`nImplementation: crear WalletAdapter con metodos connect/sign/sendTx.`nAcceptance: probar 2 wallets intercambiables en E2E.`nComplexity: high" },
    @{ title='Recuperacion de sesion y state restore'; labels=@('complexity:medium'); body = "Why: Reducir friccion cuando la conexion de wallet se pierde.`nProblem: Transacciones pendientes o estado del usuario se pierde al recargar.`nScope: guardado de tx pendings, reintentos y reconciliacion.`nImplementation: persistir estado en IndexedDB/localStorage y reconciliar en reconnect.`nAcceptance: tx pendientes se reintentan y estado restaura en 90% casos.`nComplexity: medium" },
    @{ title='UX de conexion/reintentos'; labels=@('complexity:trivial'); body = "Why: Mejorar feedback al usuario en errores de wallet.`nProblem: Mensajes cripticos y sin pasos de recuperacion.`nScope: flujos de UI para errores comunes (denegacion, timeouts).`nImplementation: nuevas pantallas/alerts y microcopy.`nAcceptance: tests de usabilidad y copy revisado.`nComplexity: trivial" },
    @{ title='Tests E2E de flujo wallet (onboarding -> deposit)'; labels=@('complexity:medium'); body = "Why: Asegurar integridad del flujo wallet critico.`nProblem: Falta cobertura E2E que cubra onboarding y deposit.`nScope: Playwright/Cypress que ejecute los pasos desde login hasta deposit.`nImplementation: anadir tests usando mocks y test wallets.`nAcceptance: pipeline ejecuta E2E y pasa en CI.`nComplexity: medium" }
)
$issuesByMilestone['Auditoria y robustez de contratos'] = @(
    @{ title='Revision de seguridad de contratos'; labels=@('complexity:high'); body = "Why: Evitar vulnerabilidades en contratos que manejen activos.`nProblem: Riesgos y edge-cases no auditados en staking_pool y vinculo_lending.`nScope: checklist de seguridad + fixes criticos.`nImplementation: auditoria manual + PRs con correcciones.`nAcceptance: checklist completada y fixes aplicados.`nComplexity: high" },
    @{ title='Suite de tests para contratos (unit + fuzz)'; labels=@('complexity:high'); body = "Why: Asegurar invariantes y evitar regresiones en contratos.`nProblem: Cobertura de contratos insuficiente.`nScope: unit tests + fuzzing en CI para contratos clave.`nImplementation: usar herramientas de testing de Soroban/Cargo + fuzzer.`nAcceptance: cobertura minima y pruebas que detecten invariante rota.`nComplexity: high" },
    @{ title='Scripts de migracion/upgrade reproducibles'; labels=@('complexity:medium'); body = "Why: Permitir upgrades de contrato reproducibles en devnet/testnet.`nProblem: Migraciones manuales y propensas a error.`nScope: scripts y documentacion para deploy y rollback.`nImplementation: scripts en backend/contracts/ y checklist.`nAcceptance: ejecutar migracion en devnet de prueba sin errores.`nComplexity: medium" },
    @{ title='Benchmark de gas/cost y optimizaciones'; labels=@('complexity:medium'); body = "Why: Reducir costos operativos por tx.`nProblem: No se han medido costos por operacion.`nScope: medir coste/gas por funcion critica y proponer optimizaciones.`nImplementation: scripts de benchmarking + PRs de optimizacion.`nAcceptance: report con reduccion objetivo (ej. -15%).`nComplexity: medium" }
)
$issuesByMilestone['Observabilidad, metricas y operacion'] = @(
    @{ title='Logs estructurados y trazas'; labels=@('complexity:medium'); body = "Why: Facilitar depuracion y seguimiento de errores.`nProblem: Logs inconsistentes entre servicios.`nScope: normalizar logs de api/ y frontend (errores criticos).`nImplementation: integrar JSON logging y request IDs.`nAcceptance: logs indexables en el stack de observabilidad.`nComplexity: medium" },
    @{ title='Metricas clave (conversiones, fallos tx, latencia)'; labels=@('complexity:medium'); body = "Why: Medir impacto y salud del producto.`nProblem: Falta metricas que permitan priorizar mejoras.`nScope: instrumentar metricas basicas y dashboard.`nImplementation: instrumentar endpoints y eventos, crear dashboard.`nAcceptance: dashboard con 3 metricas clave visibles.`nComplexity: medium" },
    @{ title='Health endpoints y readiness checks'; labels=@('complexity:trivial'); body = "Why: Facilitar despliegue seguro y rollbacks automaticos.`nProblem: No existen endpoints para comprobar salud del servicio.`nScope: endpoints en api/ y checks para Vercel/CI.`nImplementation: anadir /health y /readiness con chequeos basicos.`nAcceptance: health check devuelve 200 cuando servicio ok.`nComplexity: trivial" },
    @{ title='Runbook de incidentes y rollback'; labels=@('complexity:trivial'); body = "Why: Reducir tiempo medio de recuperacion (MTTR).`nProblem: No hay runbook para incidents criticos.`nScope: playbook para despliegues, rollbacks y contacto.`nImplementation: documento en repo docs/runbook.md.`nAcceptance: runbook revisado y aprobado por team.`nComplexity: trivial" }
)

# Create issues
foreach($milestoneTitle in $issuesByMilestone.Keys){
    $mNumber = $milestoneMap[$milestoneTitle]
    if(-not $mNumber){ Write-Error "Milestone not found: $milestoneTitle"; continue }
    foreach($iss in $issuesByMilestone[$milestoneTitle]){
        $issueBody = @{ title = $iss.title; body = $iss.body; labels = $iss.labels; milestone = $mNumber } | ConvertTo-Json -Depth 6
        try{
            $r = Invoke-RestMethod -Method Post -Uri "https://api.github.com/repos/$owner/$repo/issues" -Headers $headers -Body $issueBody -ContentType 'application/json'
            Write-Output "Issue creado: #$($r.number) $($r.title) (milestone: $milestoneTitle)"
        } catch{
            Write-Error "Error creating issue '$($iss.title)': $($_.Exception.Message)"
        }
    }
}
Write-Output 'Proceso completado.'
