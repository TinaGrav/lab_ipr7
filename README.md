# Лабораторная работа №7 
Структура проекта
```
lab-7/
├── docs/screenshots/lab7
├── docker-compose.yml                  
├── todo-app/
│   └── backend/
│       ├── server.js                   
│       ├── metrics.js                 
│       ├── tracing.js                 
│       ├── package.json                
│       └── Dockerfile                  
│   └── k8s/kustomize/base/
│       └── servicemonitor.yaml         
└── observability/
    ├── prometheus.yml                 
    ├── tempo.yml                       
    └── grafana/provisioning/
        ├── datasources/datasources.yml
        └── dashboards/
            ├── dashboards.yml
            └── todo-dashboard.json    
```

Как запустить: 
```

cd lab-7     \\ Перейти в папку lab-7

docker compose up -d     \\ Запустить весь стек одной командой

docker compose ps     \\ Посмотреть статус (подождать ~20 секунд)

```

Все сервисы должны быть в статусе running или healthy

Проверить что все работает: 

```

curl http://localhost:5000/health     \\ Backend healthcheck

curl http://localhost:5000/metrics      \\ Метрики (текст Prometheus)

curl http://localhost:5000/api/todos         \\ Сгенерировать нагрузку для дашборда и трейсов
curl -X POST http://localhost:5000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"text": "Test todo for lab7", "completed": false}'  

for i in {1..10}; do curl -s http://localhost:5000/api/todos > /dev/null; done   \\ Повторить несколько раз

```

Затем открыть:   `localhost:19090` (Посмотреть статусы таргетов) и `localhost:3001` (Посмотреть dashboard)

Остановить работу: `docker compose down`

