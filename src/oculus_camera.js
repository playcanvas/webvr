pc.script.create("oculus_camera", function (context) {
    var q = new pc.Quat();

    var OculusCamera = function (entity) {
        this.entity = entity;

        this.ready = false;

        this.offsetRotation = new pc.Quat();
        this.separation = 0;

        this.left = this.entity;
        this.right = new pc.fw.Entity();

        this.hmd = new pc.input.Hmd(context.graphicsDevice);
        this.hmd.initialize().then(function () {
            this.ready = true;
            this._hmdInitialize();
        }.bind(this), function (err) {
            console.warn("Failed to initialize HMD");
        }.bind(this));
    };

    OculusCamera.prototype = {
        initialize: function () {
            if (!this.left.camera) {
                console.error("OculusCamera must be attached to a camera.")
            }
        },

        _hmdInitialize: function () {
            this.separation = this.hmd._device.getEyeTranslation("left").x - this.hmd._device.getEyeTranslation("right").x;

            this.left.camera.rect = new pc.Vec4(0, 0, 0.5, 1);
            this.left.camera.fov = this.hmd._device.getRecommendedEyeFieldOfView("left").upDegrees;

            context.systems.camera.addComponent(this.right, {
                clearColor: this.left.camera.clearColor,
                rect: new pc.Vec4(0.5, 0, 0.5, 1),
                fov: this.hmd._device.getRecommendedEyeFieldOfView("right").upDegrees
            });

            // Add the new right camera to the parent
            this.left.getParent().addChild(this.right);

            // Tweak the projection matrix
            // var h = 4 * (this.info.hScreenSize/4 - this.info.interpupillaryDistance/2) / this.info.hScreenSize;
            // var posH = new pc.Mat4().setTranslate(h, 0, 0);
            // var negH = new pc.Mat4().setTranslate(-h, 0, 0);

            // var lProj = this.left.camera.camera.getProjectionMatrix();
            // var rProj = this.right.camera.camera.getProjectionMatrix();

            // this.left.camera.camera._projMat = posH.mul(lProj);
            // this.right.camera.camera._projMat = negH.mul(lProj);

            context.mouse.on("mousedown", function () {
                if (!document.mozFullscreenElement && !document.fullscreenElement) {
                    this.hmd.fullscreen();
                }
            }.bind(this));
        },

        update: function () {
            if (!this.ready) {
                return;
            }

            if (this.hmd) {
                this.hmd.poll();

                // var device = this.hmd._device;
                // function trim (v) {
                //     return [v.x.toFixed(2), v.y.toFixed(2), v.z.toFixed(2)];
                // }
                // pc.debug.display({
                //     sep: this.separation,
                //     pos: trim(this.hmd.position),
                //     rot: trim(this.hmd.rotation),
                //     lFov: device.getRecommendedEyeFieldOfView("left").upDegrees,
                //     rFov: device.getRecommendedEyeFieldOfView("right").downDegrees,
                //     lcFov: device.getCurrentEyeFieldOfView("left").upDegrees,
                //     rcFov: device.getCurrentEyeFieldOfView("right").downDegrees,
                //     lmFov: device.getMaximumEyeFieldOfView("left").upDegrees,
                //     rmFov: device.getMaximumEyeFieldOfView("right").downDegrees,
                //     lTrans: device.getEyeTranslation("left").x,
                //     rTrans: device.getEyeTranslation("right").x
                // });
            }

            // get position and rotation from hmd
            if (this.hmd) {
                this.left.setLocalRotation(q.copy(this.offsetRotation).mul(this.hmd.rotation));
                this.right.setLocalRotation(q.copy(this.offsetRotation).mul(this.hmd.rotation));

                this.left.setLocalPosition(this.hmd.position);
            } else {
                this.right.setRotation(this.left.getRotation());
            }

            // set right camera to be offset to the side
            var pos = this.left.getPosition();
            this.right.setPosition(pos.x + this.separation, pos.y, pos.z);
        },

        setMouse: function (x, y) {
            this.offsetRotation.setFromEulerAngles(0, y, 0);
        }
    };

    return OculusCamera;
});
