# This should be built from the root of lexicon
# ie. docker build -t codelingo-php-0-0-0 -f php/Dockerfile .

FROM php:7.1-alpine

ENV PATH="/root/.composer/vendor/bin:${PATH}" \
    COMPOSER_ALLOW_SUPERUSER=1
WORKDIR /

RUN echo '#!/bin/sh' > /usr/local/bin/apk-install \
    && echo 'apk add --update "$@" && rm -rf /var/cache/apk/*' >> /usr/local/bin/apk-install \
    && chmod +x /usr/local/bin/apk-install

RUN echo 'http://dl-4.alpinelinux.org/alpine/edge/testing' >> /etc/apk/repositories \
    && apk update \
    && apk-install \
    openssl \
    openssh \
    rsync

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

RUN /usr/bin/ssh-keygen -A
COPY shared/id_rsa /root/.ssh/id_rsa
COPY shared/id_rsa.pub /root/.ssh/authorized_keys
RUN echo "StrictHostKeyChecking no " > /root/.ssh/config

COPY codelingo/ast/php/php/composer.json /
COPY codelingo/ast/php/php/composer.lock /
RUN composer install

COPY codelingo/ast/php/php/*.php  /
COPY codelingo/ast/php/php/*.json /
COPY codelingo/ast/php/testdata   /testdata/
COPY codelingo/ast/php/server-config.yaml /server-config.yaml
COPY codelingo/ast/server/ast-server /ast-server

ENTRYPOINT /usr/sbin/sshd && /ast-server
EXPOSE 8888
EXPOSE 9999
