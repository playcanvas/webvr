pc.extend(pc, function () {
    /**
    * @name pc.Hmd
    * @description Input Device for a head mounted display
    * @param graphicsDevice The graphics device
    */
    var Hmd = function (graphicsDevice) {
        this._graphicsDevice = graphicsDevice;
        this._vrstate = null;

        this.device = null;
        this.sensor = null;

        this._rotation = new pc.Quat();
        this._position = new pc.Vec3();

        this._stereo = false;
        this.zeroMissingPosition = false;
    };

    Hmd.prototype = {
        /*
        * @name pc.Hmd#initialize
        * @description Initialize the Hmd object
        */
        initialize: function (fn) {
            var self = this;

            if (navigator.getVRDevices || navigator.mozGetVRDevices) {
                var enumerateVRDevices = function (devices) {
                    for(var i = 0; i < devices.length; i++) {
                        if (devices[i] instanceof HMDVRDevice) {
                            self.device = devices[i];
                            self._stereo = true;
                        }


                        if (devices[i] instanceof PositionSensorVRDevice) {
                            self.sensor = devices[i];

                            try {
                                if(self.sensor.resetSensor && !(self.sensor instanceof MouseKeyboardPositionSensorVRDevice))
                                    self.sensor.resetSensor();

                                if (self.sensor.zeroSensor)
                                    self.sensor.zeroSensor();
                            } catch (e) {

                            }
                        }
                    }

                    fn(null, self);
                };

                if (navigator.getVRDevices) {
                    navigator.getVRDevices().then(enumerateVRDevices);
                } else if (navigator.mozGetVRDevices) {
                    navigator.mozGetVRDevices(enumerateVRDevices);
                }
            } else {
                fn(new Error('WebVR not supported'));
            }
        },

        /**
        * @name pc.Hmd#poll
        * @description poll to get the state of any attached HMD devices. This should be called every frame.
        */
        poll: function () {
            if (this.sensor) {
                this._vrstate = this.sensor.getState();
            }
        },

        /**
        * @name pc.input.Hmd#fullscreen
        * @description Request for the browser to enter fullscreen mode and begin renderin
        */
        enterFullscreen: function () {
            var el = document.body;
//            var el = this._graphicsDevice.canvas;

            // watchout for camelcase weirdness
            if (el.webkitRequestFullscreen) {
                el.webkitRequestFullscreen({
                    vrDisplay: this.device
                });
            } else if (el.mozRequestFullScreen) {
                el.mozRequestFullScreen({
                    vrDisplay: this.device
                });
            }
        },

        reset: function () {
            if (this.sensor) {
                this.sensor.resetSensor();
            }
        }
    };

    /**
    * @field
    * @type pc.Quat
    * @name pc.Hmd#rotation
    * @description The rotation quaternion for the HMD
    */
    Object.defineProperty(Hmd.prototype, 'rotation', {
        get: function() {
            if (this.sensor) {
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
    * @name pc.Hmd#position
    * @description The position of the HMD
    */
    Object.defineProperty(Hmd.prototype, 'position', {
        get: function () {
            if (this.sensor) {
                var pos;
                if (this._vrstate.hasPosition || this._vrstate.position) {
                    pos = this._vrstate.position;
                    this._position.set(pos.x, pos.y, pos.z);
                } else {
                    if (this.zeroMissingPosition) {
                        this._position.set(0, 0, 0);
                    }
                }
            }

            return this._position;
        }
    });

    /**
     * @field
     * @read-only
     * @type bool
     * @name pc.Hmd#stereo
     * @description Returns true if the HMD supports stereo rendering
     */
    Object.defineProperty(Hmd.prototype, 'stereo', {
        get: function () {
            return this._stereo;
        }
    });

    return {
        Hmd: Hmd
    };
}());
