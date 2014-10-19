# Oculus Rift Support for PlayCanvas

This project contains the files you'll need to convert your PlayCanvas game to run using the Oculus VR.

## Requirements

Currently this requires a special build of [Chrome](http://blog.tojicode.com/2014/07/bringing-vr-to-chrome.html) or [Firefox](http://blog.bitops.com/blog/2014/08/20/updated-firefox-vr-builds/)

## How to use

1. On the root Entity of your PlayCanvas Pack add a script component and add the `input_hmd.js` script.
2. On the Entity with your Camera Component add `oculus_camera.js`
3. Run the game

## Example

See the [Halloween VR](http://playcanvas.com/dave/halloween-vr) project

## KNOWN ISSUES

- Not sure separation and FOV is handled entirely correctly
- We don't currently handle input from another device (e.g. mouse) and HMD
