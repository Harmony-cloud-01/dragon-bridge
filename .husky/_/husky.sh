#!/bin/sh
if [ -z "$husky_skip_init" ]; then
  husky_skip_init=1
  export husky_skip_init
  sh "$0" "$@"
  exitCode=$?
  husky_skip_init=
  export husky_skip_init
  exit $exitCode
fi

