#!/usr/bin/env bash

dotnet restore "$GOPATH/src/github.com/codelingo/lexicon/codelingo/ast/csharp/src/lexicon.csproj"
dotnet publish -c Release -o lexicon "$GOPATH/src/github.com/codelingo/lexicon/codelingo/ast/csharp/src/lexicon.csproj"
