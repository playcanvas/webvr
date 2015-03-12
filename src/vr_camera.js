pc.script.create("vr_camera", function (context) {
    var q = new pc.Quat();

    pc.PROJECTION_VR = 2;

    // Create projection matrix from VRFieldOfView object
    var fieldOfViewToProjectionMatrix = function (out, fov, zNear, zFar) {
        var upTan = Math.tan(fov.upDegrees * Math.PI/180.0);
        var downTan = Math.tan(fov.downDegrees * Math.PI/180.0);
        var leftTan = Math.tan(fov.leftDegrees * Math.PI/180.0);
        var rightTan = Math.tan(fov.rightDegrees * Math.PI/180.0);
        var xScale = 2.0 / (leftTan + rightTan);
        var yScale = 2.0 / (upTan + downTan);

        out[0] = xScale;
        out[1] = 0.0;
        out[2] = 0.0;
        out[3] = 0.0;
        out[4] = 0.0;
        out[5] = yScale;
        out[6] = 0.0;
        out[7] = 0.0;
        out[8] = -((leftTan - rightTan) * xScale * 0.5);
        out[9] = ((upTan - downTan) * yScale * 0.5);
        out[10] = -(zNear + zFar) / (zFar - zNear);
        out[11] = -1.0;
        out[12] = 0.0;
        out[13] = 0.0;
        out[14] = -(2.0 * zFar * zNear) / (zFar - zNear);
        out[15] = 0.0;

        return out;
    };

    // patch camera getProjectionMatrix method
    pc.Camera.prototype.getProjectionMatrix = function () {
        if (this._projMatDirty) {
            if (this._projection === pc.PROJECTION_PERSPECTIVE) {
                this._projMat.setPerspective(this._fov, this._aspect, this._nearClip, this._farClip);
            } else if (this._projection === pc.PROJECTION_VR) {
                fieldOfViewToProjectionMatrix(this._projMat.data, this._vrFov, this._nearClip, this._farClip);
            } else {
                var y = this._orthoHeight;
                var x = y * this._aspect;
                this._projMat.setOrtho(-x, x, -y, y, this._nearClip, this._farClip);
            }

            this._projMatDirty = false;
        }
        return this._projMat;
    };

    var VrCamera = function (entity) {
        this.entity = entity;

        this.ready = false;
        this.enabled = true;

        this.offsetRotation = new pc.Quat();
        this._separation = 0;

        this.inVR = false;

        // left camera (entity this script is attached to)
        this.left = this.entity;
        // right camera (new entity created by this script)
        this.right = new pc.fw.Entity();
        // Add the new right camera to the parent
        this.left.getParent().addChild(this.right);

        this.hmd = new pc.input.Hmd(context.graphicsDevice);
        this.hmd.initialize().then(function () {
            this.ready = true;
            this.hmdInitialize();
        }.bind(this), function (err) {
            console.warn("Failed to initialize HMD");
        }.bind(this));
    };

    VrCamera.prototype = {
        initialize: function () {
            if (!this.left.camera) {
                console.error("VR Camera must be attached to a camera.")
            }
        },

        hmdInitialize: function () {
            this._separation = this.hmd._device.getEyeTranslation("left").x - this.hmd._device.getEyeTranslation("right").x;
        },

        enterVR: function () {
            if (true) {
                var onFSChange = function () {
                    if (!document.mozFullScreenElement && !document.fullscreenElement ) {
                        this.leaveVR();
                    }
                }.bind(this);

                this.hmd.enterFullscreen();

                document.addEventListener( "fullscreenchange", onFSChange, false);

                // using old format for the moment until Seemore updated
                if (!this.right.camera) {
                    context.systems.camera.addComponent(this.right, {
                        clearColor: this.left.camera.clearColor,
                        rect: new pc.Vec4(0.5, 0, 0.5, 1),
                        projection: pc.PROJECTION_VR
                    });
                    // hack to store VR FOV on camera object
                    this.right.camera.camera._vrFov = this.hmd._device.getRecommendedEyeFieldOfView("right");
                }
                this.right.camera.enabled = true;

                // set left camera to VR mode
                this.left.camera.rect = new pc.Vec4(0, 0, 0.5, 1);
                this.left.camera.projection = pc.PROJECTION_VR;
                this.left.camera.camera._vrFov = this.hmd._device.getRecommendedEyeFieldOfView("left");

                this.inVR = true;
            }
        },

        leaveVR: function () {
            this.hmd.exitFullscreen();

            // using old format for the moment until Seemore updated
            // context.systems.camera.removeComponent(this.right);
            this.right.camera.enabled = false;

            // set left/right viewport
            this.left.camera.rect = new pc.Vec4(0, 0, 1, 1);
            this.left.camera.projection = pc.PROJECTION_PERSPECTIVE;

            this.inVR = false;
        },

        update: function () {
            if (!this.ready) {
                return;
            }

            if (this.hmd) {
                this.hmd.poll();
            }

            if (this.enabled && this.hmd && this.inVR) {
                // this.left.getParent().setLocalEulerAngles(0,0,0);

                // console.log(this.hmd.rotation);

                // get rotation from hmd
                this.left.setLocalRotation(q.copy(this.offsetRotation).mul(this.hmd.rotation));
                this.right.setLocalRotation(q.copy(this.offsetRotation).mul(this.hmd.rotation));

                var x = this.hmd.position.x;
                var y = this.hmd.position.y;
                var z = this.hmd.position.z;

                // get position from hmd, include left and right eye offset
                var lt = this.hmd._device.getEyeTranslation("left");
                var rt = this.hmd._device.getEyeTranslation("right");

                this.left.setLocalPosition(x + lt.x, 1 + y, z);
                this.right.setLocalPosition(x + rt.x, 1 + y, z);


            } else {
                this.right.setLocalRotation(this.left.getLocalRotation());
            }

            // DEBUG RENDERING

            // function trim (v) {
            //     return [v.x.toFixed(2), v.y.toFixed(2), v.z.toFixed(2)];
            // }

            // var device = this.hmd._device;
            // pc.debug.display({
            //     sep: this._separation,
            //     pos: trim(this.hmd.position),
            //     rot: trim(this.hmd.rotation),
            //     lFov: device.getRecommendedEyeFieldOfView("left").upDegrees,
            //     rFov: device.getRecommendedEyeFieldOfView("right").upDegrees,
            //     lTrans: device.getEyeTranslation("left").x,
            //     rTrans: device.getEyeTranslation("right").x
            // });
        },

        setRotationOffset: function (x, y, z) {
            this.offsetRotation.setFromEulerAngles(x, y, z);
        },

        // setMouse: function (x, y) {
        //     this.offsetRotation.setFromEulerAngles(0, y, 0);
        // },

        enable: function () {
            this.enabled = true;
        },

        disable: function () {
            this.enabled = false;
        },

        fullscreen: function () {

        }
    };

    return VrCamera;
});
