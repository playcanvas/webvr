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
        * @returns {pc.promise.Promise} Promise that is resolved when the HMD is ready to use
        */
        initialize: function () {
            var self = this;
            var p = null;

            p = new pc.promise.Promise(function (resolve, reject) {
                if (navigator.getVRDevices || navigator.mozGetVRDevices) {
                    var enumerateVRDevices = function (devices) {
                        var i, n;

                        for(i = 0, n = devices.length; i < n; i++) {
                            if (devices[i] instanceof HMDVRDevice) {
                                self._device = devices[i];
                            }
                            if (devices[i] instanceof PositionSensorVRDevice) {
                                self._sensor = devices[i];
                            }
                        }

                        if (!self._device || !self._sensor) {
                            reject("No HMD or HMD position sensor");
                        }

                        self.loaded = true;
                        resolve();
                    };

                    if (navigator.getVRDevices) {
                        navigator.getVRDevices().then(enumerateVRDevices);
                    } else if (navigator.mozGetVRDevices) {
                        navigator.mozGetVRDevices(enumerateVRDevices);
                    }

                } else {
                    reject("No HMD found")
                }
            });

            return p;
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
        },

        exitFullscreen: function () {

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
    }
}());
