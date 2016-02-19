# WebVR Support for PlayCanvas

This project contains the files you'll need to convert your PlayCanvas game to run using the Oculus VR.
This is very experimental code created as proof of concept and is a subject to change.
Tested with Oculus Rift DK2

## Requirements

Currently this requires a special build of [Chrome](https://drive.google.com/folderview?id=0BzudLt22BqGRbW9WTHMtOWMzNjQ&usp=sharing#list) or [Firefox](http://mozvr.com/downloads/)

## How to use

1. On the root Entity of your PlayCanvas Pack add a script component and add the `input_hmd.js` script
2. On the Entity with your Camera Component add `vr_camera.js`
3. Call `enterVR` method of a `vr_camera.js` script on user action

## Known Issues

- Currently WebVR is a moving target, so APIs are changing often. If you encounter problems incorporating this into your PlayCanvas project please contact us on [the forums](http://forum.playcanvas.com).
