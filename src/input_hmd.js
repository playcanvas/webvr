pc.extend(pc.input, function () {
    /**
    * @name pc.input.Hmd
    * @description Input Device for a head mounted display
    * @param graphicsDevice The graphics device
    */
    var Hmd = function (graphicsDevice) {
        this._graphicsDevice = graphicsDevice;
        this._vrstate = null;

        this._device = null;
        this._sensor = null;

        this._rotation = new pc.Quat();
        this._position = new pc.Vec3();
    };

    Hmd.prototype = {
        /*
        * @name pc.input.Hmd#initialize
        * @description Initialize the Hmd object
        */
        initialize: function (fn) {
            var self = this;

            if (navigator.getVRDevices || navigator.mozGetVRDevices) {
                var enumerateVRDevices = function (devices) {
                    for(var i = 0; i < devices.length; i++) {
                        if (devices[i] instanceof HMDVRDevice)
                            self._device = devices[i];
                        
                        if (devices[i] instanceof PositionSensorVRDevice) {
                            self._sensor = devices[i];
                            
                            if(self._sensor.resetSensor)
                                self._sensor.resetSensor();
                            
                            if (self._sensor.zeroSensor)
                                self._sensor.zeroSensor();
                        }
                    }

                    if (! self._device || ! self._sensor)
                        return fn(new Error('No HMD or HMD position sensor'));

                    self.loaded = true;
                    fn(null);
                };

                if (navigator.getVRDevices) {
                    navigator.getVRDevices().then(enumerateVRDevices);
                } else if (navigator.mozGetVRDevices) {
                    navigator.mozGetVRDevices(enumerateVRDevices);
                }
            } else {
                fn(new Error('No HMD found'));
            }
        },

        /**
        * @name pc.input.Hmd#poll
        * @description poll to get the state of any attached HMD devices. This should be called every frame.
        */
        poll: function () {
            if (this._device && this._sensor) {
                this._vrstate = this._sensor.getState();
            }
        },

        /**
        * @name pc.input.Hmd#fullscreen
        * @description Request for the browser to enter fullscreen mode and begin renderin
        */
        enterFullscreen: function () {
            // var el = document.body;
            var el = this._graphicsDevice.canvas;

            // watchout for camelcase weirdness
            if (el.webkitRequestFullscreen) {
                el.webkitRequestFullscreen({
                    vrDisplay: this._device
                });
            } else if (el.mozRequestFullScreen) {
                el.mozRequestFullScreen({
                    vrDisplay: this._device
                });
            }
        }
    };

    /**
    * @field
    * @type pc.Quat
    * @name pc.input.Hmd#rotation
    * @description The rotation quaternion for the HMD
    */
    Object.defineProperty(Hmd.prototype, 'rotation', {
        get: function() {
            if (this._sensor) {
                var ori;
                if (this._vrstate.hasOrientation || this._vrstate.orientation) {
                    ori = this._vrstate.orientation;
                } else {
                    ori = pc.Vec4.ZERO;
                }

                this._rotation.set(ori.x, ori.y, ori.z, ori.w);
            }
            return this._rotation;
        }
    });

    /**
    * @field
    * @type pc.Vec3
    * @name pc.input.Hmd#position
    * @description The position of the HMD
    */
    Object.defineProperty(Hmd.prototype, 'position', {
        get: function () {
            if (this._sensor) {
                var pos;
                if (this._vrstate.hasPosition || this._vrstate.position) {
                    pos = this._vrstate.position;
                } else {
                    pos = pc.Vec3.ZERO;
                }
                this._position.set(pos.x, pos.y, pos.z);
            }

            return this._position;
        }
    });

    return {
        Hmd: Hmd
    };
}());
