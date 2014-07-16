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
        }
    }

    var HMD = function () {
        this.vrstate = null;
        this._rotation = new pc.Quat();

        this.loaded = false;
    };

    HMD.prototype = {
        initialize: function () {
            var self = this;

            var p = new pc.promise.Promise(function (resolve, reject) {
                if (typeof(vr) === "undefined") {
                    console.error("No vr.js library found");
                    return;
                }

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

            return p;
        },

        poll: function () {
            if(!this.loaded) {
                console.warn("Polling HMD before initialized");
                return;
            }
            vr.pollState(this.vrstate);
        },

        getHmdInfo: function () {
            if (!this.info) {
                this.info = new HmdInfo();
                this.info._initializeFromVrjs(vr.getHmdInfo());
            }

            return this.info;
        }
    };

    Object.defineProperty(HMD.prototype, 'rotation', {
        get: function() {
            if (this.vrstate && this.vrstate.hmd) {
                this._rotation.set(this.vrstate.hmd.rotation[0], this.vrstate.hmd.rotation[1], this.vrstate.hmd.rotation[2], this.vrstate.hmd.rotation[3]);
            }
            return this._rotation;
        }
    });

    return {
        HMD: HMD
    }
}());
