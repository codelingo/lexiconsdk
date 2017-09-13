# This should be built from the root of lexicon
# ie. docker build -t codelingo-ast-csharp-0-0-0 -f ast/csharp .

FROM microsoft/dotnet:1.1.2-runtime

RUN apt-get update \
    && apt-get install -y \
    openssl \
    openssh-server \
    rsync

RUN /usr/bin/ssh-keygen -A
COPY shared/id_rsa /root/.ssh/id_rsa
COPY shared/id_rsa.pub /root/.ssh/authorized_keys
RUN echo "StrictHostKeyChecking no " > /root/.ssh/config

COPY codelingo/ast/csharp/testdata  /testdata/
COPY codelingo/ast/csharp/setup-steps.json /server/setup-steps.json
COPY codelingo/ast/csharp/list-facts.json /server/list-facts.json
COPY codelingo/ast/csharp/src/lexicon /server/lexicon
COPY codelingo/ast/csharp/server-config.yaml /server/server-config.yaml
COPY codelingo/ast/server/ast-server /server/ast-server

ENTRYPOINT service ssh start && /server/ast-server
EXPOSE 8888
EXPOSE 9999
