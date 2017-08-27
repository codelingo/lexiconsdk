# This should be built from lexiconsdk/examples/lexicons/
# ie. docker build -t codelingo-php-0-0-0 -f codelingo/ast/php/Dockerfile .

FROM php:7.1-alpine

ENV PATH="/root/.composer/vendor/bin:${PATH}" \
    COMPOSER_ALLOW_SUPERUSER=1
WORKDIR /

# Configure container for installing packages
RUN echo '#!/bin/sh' > /usr/local/bin/apk-install \
    && echo 'apk add --update "$@" && rm -rf /var/cache/apk/*' >> /usr/local/bin/apk-install \
    && chmod +x /usr/local/bin/apk-install

# Install necessary packages
RUN echo 'http://dl-4.alpinelinux.org/alpine/edge/testing' >> /etc/apk/repositories \
    && apk update \
    && apk-install \
    openssl \
    openssh \
    rsync

# Get PHP composer (a dependency manager)
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Copy across dependency specifications and fetch the dependencies
COPY codelingo/ast/php/php/composer.json /
COPY codelingo/ast/php/php/composer.lock /
RUN composer install

# Copy across local files necessary for the ast-server and PHP parser
COPY codelingo/ast/php/php/*.php  /
COPY codelingo/ast/php/php/*.json /
COPY codelingo/ast/php/testdata   /testdata/
COPY codelingo/ast/php/server-config.yaml /server-config.yaml
COPY codelingo/ast/server/ast-server /ast-server

# Execute ast-server and expose ports when run
ENTRYPOINT /ast-server
EXPOSE 8888
EXPOSE 9999
