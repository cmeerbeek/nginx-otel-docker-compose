ARG NGINX_VERSION=1.25.2
FROM nginx:${NGINX_VERSION} AS BUILDER

# Add packages
RUN apt update && apt install git cmake build-essential libssl-dev zlib1g-dev libpcre3-dev pkg-config libc-ares-dev libre2-dev -y

RUN git clone https://github.com/nginx/nginx.git && cd nginx && git checkout release-${NGINX_VERSION}
RUN cd nginx && ./auto/configure --with-compat
RUN git clone https://github.com/nginxinc/nginx-otel.git && cd nginx-otel && mkdir build
RUN cd nginx-otel/build && cmake -DNGX_OTEL_NGINX_BUILD_DIR=/nginx/objs ..
RUN cd nginx-otel/build && make -j20
RUN strip --strip-debug /nginx-otel/build/ngx_otel_module.so

FROM nginx:${NGINX_VERSION}

# Add packages  
RUN apt update && apt install libc-ares2 libre2-9

# Add nginx.conf to container
COPY --chown=nginx:nginx nginx.conf /etc/nginx/nginx.conf
COPY --chown=nginx:nginx default.conf /etc/nginx/conf.d/default.conf
COPY --chown=nginx:nginx start.sh /app/start.sh
#COPY --chown=nginx:nginx ngx_otel_module.so /etc/nginx/modules/ngx_otel_module.so
COPY --from=BUILDER nginx-otel/build/ngx_otel_module.so /usr/lib/nginx/modules/ngx_otel_module.so

# set workdir
WORKDIR /app

# permissions and nginx user for tightened security
RUN chown -R nginx:nginx /app && chmod -R 755 /app && \
        chown -R nginx:nginx /var/cache/nginx && \
        chown -R nginx:nginx /var/log/nginx && \
        chmod -R 755 /var/log/nginx; \
        chown -R nginx:nginx /etc/nginx/conf.d
RUN touch /var/run/nginx.pid && chown -R nginx:nginx /var/run/nginx.pid

# # Uncomment to keep the nginx logs inside the container - Leave commented for logging to stdout and stderr
# RUN mkdir -p /var/log/nginx
# RUN unlink /var/log/nginx/access.log \
#     && unlink /var/log/nginx/error.log \
#     && touch /var/log/nginx/access.log \
#     && touch /var/log/nginx/error.log \
#     && chown nginx /var/log/nginx/*log \
#     && chmod 644 /var/log/nginx/*log

USER nginx

CMD ["nginx", "-g", "'daemon off;'"]
