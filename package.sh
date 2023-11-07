#!/bin/bash

sed -i 's/\r//g' package.json
PACKAGE_VERSION=$(grep version package.json -m 1 | sed -e 's/^\s*//' -e '/^$/d' | tr -d '",' | tr -d 'version: ')
ZIP_NAME=chat-app.deploy.$PACKAGE_VERSION.zip

echo "Packaging build $PACKAGE_VERSION into zip file $ZIP_NAME ..." >&1

rm -f ./$ZIP_NAME

cd lib
echo -e "\tadding: app.* handler.* common/* config/* maps/* models/* objects/* services/* types/*" >&1
zip -r ../$ZIP_NAME app.* handler.* common/* config/* maps/* models/* objects/* services/* types/* &>/dev/null
cd ..
echo -e "\tadding: node_modules/*" >&1
zip -r $ZIP_NAME node_modules/*  &>/dev/null

echo "Build $PACKAGE_VERSION packaged"