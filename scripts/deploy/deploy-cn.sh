#!/usr/bin/env bash

set -x
set -e

git clone https://github.com/ng-docs/material.github.io.git

cd ./material.github.io

yarn

cp -r ../dist/docs-content-pkg/docs-content node_modules/@angular/components-examples/
./scripts/ci/deploy-cn.sh

cd -
