pc.script.create("oculus_camera", function (context) {
    var q = new pc.Quat();

    var OculusCamera = function (entity) {
        this.entity = entity;

        this.ready = false;
        this.enabled = true;

        this.offsetRotation = new pc.Quat();

        this.left = this.entity;
        this.right = new pc.fw.Entity();

        this.hmd = new pc.input.HMD();
        this.hmd.initialize().then(function () {
            this.ready = true;
            this.info = this.hmd.getHmdInfo();
            this.hmdInitialize();

        }.bind(this), function (err) {
            console.warn("Failed to initialize Oculus Rift");

            this.ready = true;
            this.hmd = null;
            this.info = {
                hResolution: 1280,
                vResolution: 800,
                hScreenSize: 0.14976,
                vScreenSize: 0.0936,
                interpupillaryDistance: 0.064,
                lensSeparationDistance: 0.064,
                eyeToScreenDistance: 0.041,
                distortionK : [1.0, 0.22, 0.24, 0.0],
                chromaAbCorrection: [ 0.996, -0.004, 1.014, 0.0]
            };

            this.hmdInitialize();
        }.bind(this));
    };

    OculusCamera.prototype = {
        initialize: function () {
            if (!this.left.camera) {
                console.error("OculusCamera must be attached to a camera.")
            }

            this.offsetRotation = this.entity.getRotation();
        },

        hmdInitialize: function () {
            var r = -1.0 - (4 * (this.info.hScreenSize/4 - this.info.lensSeparationDistance/2) / this.info.hScreenSize);
            var distScale = (this.info.distortionK[0] + this.info.distortionK[1] * Math.pow(r,2) + this.info.distortionK[2] * Math.pow(r,4) + this.info.distortionK[3] * Math.pow(r,6));
            var fov = 2 * Math.atan2(this.info.vScreenSize * distScale, 2 * this.info.eyeToScreenDistance) * pc.math.RAD_TO_DEG;

            this.left.camera.rect = new pc.Vec4(0, 0, 0.5, 1);
            this.left.camera.fov = fov;

            context.systems.camera.addComponent(this.right, {
                clearColor: this.left.camera.clearColor,
                rect: new pc.Vec4(0.5, 0, 0.5, 1),
                fov: fov
            });

            // Add the new right camera to the parent
            this.left.getParent().addChild(this.right);

            // Add oculus post effect
            var lOculus = new pc.posteffect.Oculus(context.graphicsDevice, this.info, true);
            var rOculus = new pc.posteffect.Oculus(context.graphicsDevice, this.info, false);

            if (this.left.camera.postEffects.setRenderTargetScale) {
                this.left.camera.postEffects.setRenderTargetScale(1.5);
                this.right.camera.postEffects.setRenderTargetScale(1.5);
            }

            this.left.camera.postEffects.addEffect(lOculus);
            this.right.camera.postEffects.addEffect(rOculus);

            // Tweak the projection matrix
            var h = 4 * (this.info.hScreenSize/4 - this.info.interpupillaryDistance/2) / this.info.hScreenSize;
            var posH = new pc.Mat4().setTranslate(h, 0, 0);
            var negH = new pc.Mat4().setTranslate(-h, 0, 0);

            var lProj = this.left.camera.camera.getProjectionMatrix();
            var rProj = this.right.camera.camera.getProjectionMatrix();

            this.left.camera.camera._projMat = posH.mul(lProj);
            this.right.camera.camera._projMat = negH.mul(lProj);
        },

        update: function () {
            if (!this.ready) {
                return;
            }

            if (this.hmd) {
                this.hmd.poll();
            }

            if (this.enabled && this.hmd) {
                this.left.setRotation(q.copy(this.offsetRotation).mul(this.hmd.rotation));
                this.right.setRotation(q.copy(this.offsetRotation).mul(this.hmd.rotation));
            } else {
                this.right.setRotation(this.left.getRotation());
            }

            var pos = this.left.getPosition();
            this.right.setPosition(pos.x + this.info.lensSeparationDistance/2, pos.y, pos.z);
        },

        setMouse: function (x, y) {
            this.offsetRotation.setFromEulerAngles(0, y, 0);
        },

        enable: function () {
            this.enabled = true;
        },

        disable: function () {
            this.enabled = false;
        }
    };

    return OculusCamera;
});
