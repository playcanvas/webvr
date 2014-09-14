pc.extend(pc.input, function () {

    var HmdInfo = function () {
        this.hScreenSize = 0;
        this.vScreenSize = 0;
        this.hResolution = 0;
        this.vResolution = 0;

        this.eyeToScreenDistance = 0;
        this.lensSeparationDistance = 0;
        this.interpupillaryDistance = 0;

        this.distortionK = new Float32Array(4);
        this.chromaAbCorrection = new Float32Array(4);
    };

    HmdInfo.prototype = {
        _initializeFromVrjs: function () {
            var info = vr.getHmdInfo();

            this.hScreenSize = info.screenSizeHorz;
            this.vScreenSize = info.screenSizeVert;
            this.hResolution = info.resolutionHorz;
            this.vResolution = info.resolutionVert;

            this.eyeToScreenDistance = info.eyeToScreenDistance;
            this.interpupillaryDistance = info.interpupillaryDistance;
            this.lensSeparationDistance = info.lensSeparationDistance;

            this.distortionK[0] = info.distortionK[0];
            this.distortionK[1] = info.distortionK[1];
            this.distortionK[2] = info.distortionK[2];
            this.distortionK[3] = info.distortionK[3];

            this.chromaAbCorrection[0] = info.chromaAbCorrection[0];
            this.chromaAbCorrection[1] = info.chromaAbCorrection[1];
            this.chromaAbCorrection[2] = info.chromaAbCorrection[2];
            this.chromaAbCorrection[3] = info.chromaAbCorrection[3];
        },

        _initializeFromDevice: function (device) {
            // hacked in with defaults for the Oculus Rift

            // DK1
            {
                var distortionK = [1.0, 0.22, 0.24, 0.0];
                var chromaAbCorrection =  [ 0.996, -0.004, 1.014, 0.0];

                this.hScreenSize = 0.14976;
                this.vScreenSize = 0.0936;
                this.hResolution = 1280;
                this.vResolution = 800;

                this.eyeToScreenDistance = 0.041;
                this.interpupillaryDistance = 0.064;
                this.lensSeparationDistance = 0.064;
            }

            // DK2
            {
                var distortionK = [1.0, 0.22, 0.24, 0.0];
                var chromaAbCorrection = [ 0.996, -0.004, 1.014, 0.0];

                this.hScreenSize = 0.12576;
                this.vScreenSize = 0.07074;
                this.hResolution = 1920;
                this.vResolution = 1080;

                this.eyeToScreenDistance = 0.041;
                this.interpupillaryDistance = 0.0635;
                this.lensSeparationDistance = 0.0635;
            }

            this.distortionK[0] = distortionK[0];
            this.distortionK[1] = distortionK[1];
            this.distortionK[2] = distortionK[2];
            this.distortionK[3] = distortionK[3];

            this.chromaAbCorrection[0] = chromaAbCorrection[0];
            this.chromaAbCorrection[1] = chromaAbCorrection[1];
            this.chromaAbCorrection[2] = chromaAbCorrection[2];
            this.chromaAbCorrection[3] = chromaAbCorrection[3];
        }
    }

    var HMD = function () {
        this.vrstate = null;

        this._vrjs = null;

        this._device = null;
        this._sensor = null;

        this._rotation = new pc.Quat();

        this.loaded = false;
    };

    HMD.prototype = {
        initialize: function () {
            var self = this;
            var p = null;

            if (navigator.getVRDevices || navigator.mozGetVRDevices) {
                p = new pc.promise.Promise(function (resolve, reject) {
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

                })
            } else if (typeof(vr) !== "undefined") {
                self._vrjs = vr;

                // vr.js
                p = new pc.promise.Promise(function (resolve, reject) {
                    vr.load(function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            self.vrstate = new vr.State();
                            vr.pollState(self.vrstate);
                            if (self.vrstate.present) {
                                self.loaded = true;
                                resolve();
                            } else {
                                // remove embed tag
                                var el = document.querySelector("embed[type='application/x-vnd-vr']")
                                el.parentNode.removeChild(el);
                                reject("No HMD Present");
                            }
                        }
                    });
                });
            } else {
                console.log("No HMD input method found.")
            }

            return p;
        },

        poll: function () {
            if(!this.loaded) {
                console.warn("Polling HMD before initialized");
                return;
            }

            if (this._device && this._sensor) {
                this.vrstate = this._sensor.getState();
            }

            if (this._vrjs) {
                this._vrjs.pollState(this.vrstate);
            }

        },

        getHmdInfo: function () {
            if (!this.info) {
                this.info = new HmdInfo();

                if (this._vrjs) {
                    this.info._initializeFromVrjs(vr.getHmdInfo());
                } else if (this._device) {
                    this.info._initializeFromDevice(this._device);
                }

            }

            return this.info;
        }
    };

    Object.defineProperty(HMD.prototype, 'rotation', {
        get: function() {
            if (this._vrjs) {
                if (this.vrstate && this.vrstate.hmd) {
                    this._rotation.set(this.vrstate.hmd.rotation[0], this.vrstate.hmd.rotation[1], this.vrstate.hmd.rotation[2], this.vrstate.hmd.rotation[3]);
                }
            } else if (this._sensor) {
                this._rotation.set(this.vrstate.orientation.x, this.vrstate.orientation.y, this.vrstate.orientation.z, this.vrstate.orientation.w);
            }
            return this._rotation;
        }
    });

    return {
        HMD: HMD
    }
}());
