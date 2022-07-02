#!/usr/bin/env bash

set -x
set -e

yarn build-docs-content

if [[ ! -d "./material.github.io" ]]; then
  git clone https://github.com/ng-docs/material.github.io.git
fi

cd ./material.github.io

git pull

yarn

cp -r ../dist/docs-content-pkg/docs-content node_modules/@angular/components-examples/
./scripts/ci/deploy-cn.sh

cd -
