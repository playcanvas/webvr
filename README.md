# WebVR Support for PlayCanvas

The project contains scripts to run your PlayCanvas application in VR using either a Google Cardboard-style VR headset or (when using special builds of Chrome & Firefox) Oculus Rift and HTC Vive.

## Requirements

For Cardboard VR any modern mobile device should work. For Oculus and Vive support you require a special build of [Chromium](http://webvr.info/).

## How to use

1. Make sure `input_hmd.js` loads first, which can be changed in Editor Settings "Scripts Loading Order".
2. On the Entity you wish to be your camera add `vrCamera` to script component.
3. By default `vrCamera` will start the VR mode when you click or tap the canvas.

## Options

VrCamera has a few options that are exposed on the entity in the Editor.

* enableOnClick - If disabled you must manually call `enterVr()` on the camera script to start VR rendering
* alwaysAcceptInput - If enabled HMD position tracking will be applied to the camera even if the camera is no "in VR".

## Known Issues

- Currently WebVR is a moving target, so APIs are changing often. This library now implements the WebVR 1.0 Spec.
- Please raise an issue on this project if you encounter problems

## Attribution

input_hmd.js contains a version of the [WebVR Polyfill](https://github.com/borismus/webvr-polyfill) by Boris Smus.
