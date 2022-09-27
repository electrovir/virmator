#!/bin/bash

set -e;

scriptDir=$(dirname "$(readlink -f "${BASH_SOURCE[0]}")");
repoRootDor=$(dirname "$(dirname "$scriptDir")")

npm install;
npm run compile;
export TAR_TO_INSTALL;
TAR_TO_INSTALL="${repoRootDor}/$(npm pack 2>&1 | tail -1)";

# allow mocha to fail without exiting the script
set +e;

mocha --config .mocharc.js "$@";
testResult=$?;

exit "$testResult"