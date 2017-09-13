#!/bin/bash

set -e

tag=$1
if [ -z "$tag" ]
then
    tag=latest-beta
fi

registry=gcr.io/platform-161007
image=codelingo/ast/csharp

"$GOPATH/src/github.com/codelingo/lexicon/codelingo/ast/server/build.sh"
"$GOPATH/src/github.com/codelingo/lexicon/codelingo/ast/csharp/src/build.sh"
"$GOPATH/src/github.com/codelingo/lexicon/shared/permissions.sh"

cd "$GOPATH/src/github.com/codelingo/lexicon"

docker build -f ./$image/Dockerfile -t $registry/$image .
docker tag $registry/$image $registry/$image:$tag
gcloud docker -- push $registry/$image:$tag
