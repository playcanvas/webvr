# WebVR Support for PlayCanvas

This project contains a plugin for the PlayCanvas engine that allows you to create VR experiences across many platforms. Including Cardboard VR for mobile devices and Oculus Rift + HTC Vive Headsets*.

## How to use

1. On the root Entity of your PlayCanvas Pack add a script component and add the `input_hmd.js` script
2. On the Entity with your Camera Component add `vr_camera.js`
3. Call `enterVR` method of a `vr_camera.js` script on user action

## Known Issues

- Currently WebVR is a moving target, so APIs are changing often. If you encounter problems incorporating this into your PlayCanvas project please contact us on [the forums](http://forum.playcanvas.com).

* Oculus and Vive support is experimental and requires a special build of [Chrome](https://drive.google.com/folderview?id=0BzudLt22BqGRbW9WTHMtOWMzNjQ&usp=sharing#list) or [Firefox](http://mozvr.com/downloads/)
