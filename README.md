# WebVR Support for PlayCanvas

The project contains scripts to run your PlayCanvas application in VR using either a Google Cardboard-style VR headset or (when using special builds of Chrome & Firefox) Oculus Rift and HTC Vive.

## Requirements

For Oculus and Vive support you this requires a special builds [Chrome and Firefox](http://mozvr.com/#start)

## How to use

1. Add `input_hmd.js` into your Script Priorities to load it before the application starts.
2. On the Entity you wish to be your camera add `vr_camera.js`.
3. By default `vrCamera` will start the VR mode when you click or tap the canvas.

## Options

VrCamera has a few options that are exposed on the entity in the Editor.

* enableOnClick - If disabled you must manually call `enterVr()` on the camera script to start VR rendering
* alwaysAcceptInput - If enabled HMD position tracking will be applied to the camera even if the camera is no "in VR".
* useFullscreen - If disabled the camera will not request to go fullscreen when VR mode is enabled

## Known Issues

- Currently WebVR is a moving target, so APIs are changing often. This library does not implement the new 1.0 spec, though it be upgradable with no breaking changes. If you encounter problems incorporating this into your PlayCanvas project please contact us on [the forums](http://forum.playcanvas.com).

## Attribution

input_hmd.js contains an modified version of the WebVR Polyfill by Boris Smus. [Modified Version](https://github.com/playcanvas/webvr-polyfill/). [Original Version](https://github.com/borismus/webvr-polyfill).
