#!/bin/bash

set -e;

scriptDir=$(dirname "$(readlink -f "${BASH_SOURCE[0]}")");
repoRootDir=$(dirname "$(dirname "$scriptDir")")

npm install;
npm run compile;
export TAR_TO_INSTALL;
TAR_TO_INSTALL="${repoRootDir}/$(npm pack 2>&1 | tail -1)";

echo "START OF THING";
echo "$scriptDir";
pwd
echo "$repoRootDir";
echo "$TAR_TO_INSTALL";
echo "END OF THING";

# allow mocha to fail without exiting the script
set +e;

mocha --config .mocharc.js "$@";
testResult=$?;

exit "$testResult"