#!/usr/bin/env bash

echo `pwd`
dotnet restore "./src/lexicon.csproj"
dotnet publish -c Release -o lexicon "./src/lexicon.csproj"
