FROM nginx:alpine

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/redirects.map /etc/nginx/redirects.map
COPY public/ /usr/share/nginx/html/

EXPOSE 80