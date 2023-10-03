# Application to serve a Flask app via NGINX with tracing

## NGINX Reverse Proxy -> WSGI -> Python/Flask Backend

Project structure:

```text
.
├── docker-compose.yml
├── otel-collector-config.yml
├── splunk.yml
├── README.md
├── flask
│   ├── app.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── wsgi.py
└── nginx
    ├── default.conf
    ├── Dockerfile
    ├── nginx.conf
    └── start.sh
```

[_docker-compose.yaml_](docker-compose.yaml)

```yml
services:
  nginx-proxy:
    build: nginx
    ports:
    - 80:80
  flask-app:
    build: flask
    ...
```

The compose file defines an application with two services `nginx-proxy` and `flask-app`.
When deploying the application, docker compose maps port 80 of the web service container to port 80 of the host as specified in the file.

Make sure port 80 on the host is not being used by another container, otherwise the port should be changed.

## Deploy with docker compose

```bash
$ docker compose up -d
Creating network "nginx-wsgi-flask_default" with the default driver
Building flask-app
...
Building nginx-proxy
...
Creating nginx-wsgi-flask_flask-app_1 ... done
Creating nginx-wsgi-flask_nginx-proxy_1 ... done
```

## Expected result

Listing containers must show two containers running and the port mapping as below:

```bash
$ docker ps
CONTAINER ID   IMAGE                    COMMAND                  CREATED              STATUS                        PORTS
bde3f29cf571   ...nginx-proxy           "/docker-entrypoint.…"   About a minute ago   Up About a minute (healthy)   0.0.0.0:80->80/tcp
86c44470b547   ...flask-app             "gunicorn -w 3 -t 60…"   About a minute ago   Up About a minute (healthy)   5000/tcp, 0.0.0.0:8000->8000/tcp
4fe34d9d1ff4   ...all-in-one:latest     "/go/bin/all-in-one"     About a minute ago   Up About a minute (healthy)   16686/tcp, 0.0.0.0:4317-4318->4317-4318/tcp
```

After the application starts, navigate to `http://localhost:80` in your web browser or run:

```bash
$ curl localhost:80
Hello World!
```

When you've made some requests, navigate to `http://localhost:16686` in your web browser and view the traces in Jaeger.

Stop and remove the containers

```bash
$ docker compose down
V nginx-otel-docker-compose-nginx-proxy_1     Removed
V nginx-otel-docker-compose-flask-app_1       Removed
V nginx-otel-docker-compose-jager_tracing_1   Removed
V Network nginx-otel-docker-compose_default   Removed
```

## About

By following the steps above, you will have an NGINX Reverse Proxy and a Flask backend. The general traffic flow will look like the following:

`Client -> NGINX -> WSGI -> Flask`

### NGINX

With this deployment model, we use NGINX to proxy and handle all requests to our Flask backend. This is a powerful deployment model as we can use NGINX to cache responses or even act as an application load balancer between multiple Flask backends. You could also integrate a Web Application Firewall into NGINX to protect your Flask backend from attacks.

### WSGI

WSGI (Web Server Gateway Interface) is the interface that sits in between our NGINX proxy and Flask backend. It is used to handle requests and interface with our backend. WSGI allows you to handle thousands of requests at a time and is highly scalable. In this `docker-compose` sample, we use Gunicorn for our WSGI.

### Flask

Flask is a web development framework written in Python. It is the "backend" which processes requests.

A couple of sample endpoints are provided in this `docker-compose` example:

* `/` - Returns a "Hello World!" string.
* `/cache-me` - Returns a string which is cached by the NGINX reverse proxy. This demonstrates an intermediary cache implementation.
* `/info` - Returns informational headers about the request. Some are passed from NGINX for added client visibility.
