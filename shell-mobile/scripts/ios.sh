#!/bin/sh
cd ../
cd src/ios
xcrun xcodebuild -quiet -list -json 1>&2 2>/dev/null
xcodebuild -workspace ./Gcalls.xcworkspace -scheme Gcalls
# fastlane test