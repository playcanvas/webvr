# Oculus Rift Support for PlayCanvas

This project contains the files you'll need to convert your PlayCanvas game to run using the Oculus VR.

## Requirements

Currently you will need to install [vr.js][https://github.com/benvanik/vr.js/tree/master].

## How to use

1. On the root Entity of your PlayCanvas Pack add a script component and add the `vr.js` script and the `input_hmd.js` script (in that order)
2. On the Entity with your Camera Component add `posteffect_oculus.js` and `oculus_camera.js` (in that order)
3. Run the game

## Example

See the [Halloween VR][http://playcanvas.com/dave/halloween-vr] project

## TODO:

* Support [Firefox VR][http://blog.bitops.com/blog/2014/06/26/first-steps-for-vr-on-the-web/] & [Chrome VR][http://blog.tojicode.com/2014/07/bringing-vr-to-chrome.html] builds
