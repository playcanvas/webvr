# Oculus Rift Support for PlayCanvas

This project contains the files you'll need to convert your PlayCanvas game to run using the Oculus VR.

## Requirements

Currently you will need to install [vr.js](https://github.com/benvanik/vr.js/tree/master).

## How to use

1. On the root Entity of your PlayCanvas Pack add a script component and add the `vr.js` script and the `input_hmd.js` script (in that order)
2. On the Entity with your Camera Component add `posteffect_oculus.js` and `oculus_camera.js` (in that order)
3. Run the game

## Example

See the [Halloween VR](http://playcanvas.com/dave/halloween-vr) project

## KNOWN ISSUES

- This uses the posteffect_oculus.js (a PlayCanvas fullscreen effect) to do the distortion. Chrome/FF WebVR builds will apply the distortion for you if you get a VR context to the canvas.
- The distortion is hard-coded for Oculus Rift DK2
- pc.input.HMD doesn't get the position data from DK2
