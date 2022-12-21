#!/usr/bin/env bash

set -x
set -e

commitSha=$(git rev-parse --short HEAD)
commitMessage=$(git log --oneline -n 1)

yarn build-docs-content

if [[ ! -d "./material.github.io" ]]; then
  git clone https://github.com/ng-docs/material.github.io.git
fi

cd ./material.github.io

git pull

yarn

cp -r ../dist/docs-content-pkg/docs-content node_modules/@angular/components-examples/

nt mark 'node_modules/@angular/components-examples/docs-content/api-docs/**/*.html'
nt mark 'node_modules/@angular/components-examples/docs-content/guides/**/*.html'
nt mark 'node_modules/@angular/components-examples/docs-content/overviews/**/*.html'

./scripts/ci/deploy-cn.sh
