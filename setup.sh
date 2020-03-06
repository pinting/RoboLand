#!/bin/sh

if ! [ -x "$(command -v roboland)" ]; then
    npm install
    sudo npm link
fi;

(cd ./src/res/sample && roboland pack && mv sample.roboland ../)
(cd ./src/res/default && roboland pack && mv default.roboland ../)
npm run build