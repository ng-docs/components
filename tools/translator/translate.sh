#!/usr/bin/env bash

nt translate --engine=google 'src/**/!(README).md'
nt translate --engine=google 'src/**/!(*.d|*.spec|*_spec).ts'
nt translate --engine=google 'guides/**/!(README).md'
