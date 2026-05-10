# Lab 5

Структура проекта:

 <pre>
    .
    ├── lab-5            
    │   ├── backend/                              
    |   │   ├── server.js                    
    |   │   ├── package.json                        
    |   │   ├── Dockerfile
    |   │   ├── .dockerignore                       
    |   │   ├── .env       
    │   ├── frontend/                              
    |   │   ├── public/          
    |   |   │   ├── index.html   
    |   │   ├── src/          
    |   |   │   ├── App.css   
    |   |   │   ├── App.js 
    |   |   │   ├── index.js      
    |   │   ├── .dockerignore                        
    |   │   ├── .env          
    |   │   ├── Dockerfile                       
    |   │   ├── nginx.conf      
    |   │   ├── package.json  
    │   ├── k8s/
    |   │   ├── backend-deployment.yml                    
    |   │   ├── backend-service.yml                         
    |   │   ├── frontend-deployment.yml                    
    |   │   ├── frontend-service.yml   
    |   │   ├── mongodb.yml                                   
    │   ├── .gitignore                         
    │   ├── docker-compose.yml           
    │   ├── .gitlab-ci.yml   
    │   ├── README.md                          
                                               
</pre>


## Инструкция к запуску
Склонируйте репозиторий 

```git clone https://gitlab.mai.ru/idt-lw/m8o-101bv-25/personal/EAKardanova/lab-5 ```

Убедитесь в том, что kubernets работает (для этого необходимо подключить его в DockerDesktop)
```kubectl get nodes ```

Собирите backend

```cd backend ```
```docker build -t tinagrav/lab-5-backend:latest .```
```cd .. ```

Собирите frontend

```cd frontend ```
```docker build -t tinagrav/lab-5-frontend:latest .```
```cd .. ```

Создайте пространство 

```kubectl create namespace my-app```
```kubectl apply -f k8s/```

Проверьте, что всё запустилось 

```kubectl get pods -n my-app```

Запустить

```kubectl port-forward -n my-app svc/frontend 3000:80```

Открыть браузер: http://localhost:3000