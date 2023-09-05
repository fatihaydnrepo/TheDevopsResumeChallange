--- Ubuntu 22.04 kullandım

FROM ubuntu:22.04

--- Nginx'i ve gerekli paketleri yükledim

RUN apt-get update && apt-get install -y \
nginx \
curl \
wget \
gnupg \
git \
nano

--- Uygulama dosyalarını Docker içine kopyaladım

COPY index.html /var/www/html/
COPY css/ /var/www/html/css/
COPY js/ /var/www/html/js/
RUN chown -R www-data:www-data /var/www/html
RUN chmod -R 755 /var/www/html

--- Nginx'i yapılandırdım

RUN echo "daemon off;" >> /etc/nginx/nginx.conf
RUN sed -i 's#listen\s*80#listen 8080#' /etc/nginx/sites-enabled/default

--- 8080 portunu kullandım

EXPOSE 8080

--- Nginx'i başlattım

CMD ["nginx"]
