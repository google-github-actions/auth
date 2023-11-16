#!/usr/bin/env bash
set -eEuo pipefail

#
# As of Node 20, the --test parameter does not support globbing, and it does not
# support variable Windows paths. We also cannot invoke the test runner
# directly, because while it has an API, there's no way to force it to transpile
# the Typescript into JavaScript before passing it to the runner.
#
# So we're left with this solution, which shells out to Node to list all files
# that end in *.test.ts (excluding node_modules/), and then execs out to that
# process. We have to exec so the stderr/stdout and exit code is appropriately
# fed to the caller.
#

FILES="$(node -e "process.stdout.write(require('node:fs').readdirSync('./', { recursive: true }).filter((e) => {return e.endsWith('.test.ts') && !e.startsWith('node_modules');}).sort().join(' '));")"

set -x
exec node --require ts-node/register --test-reporter spec --test ${FILES}
