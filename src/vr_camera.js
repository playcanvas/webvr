var VrCamera = pc.createScript('vrCamera');


VrCamera.attributes.add('enableOnClick', {
    type: 'boolean',
    default: true
});

VrCamera.attributes.add('alwaysAcceptInput', {
    type: 'boolean',
    default: true
});


VrCamera.q = new pc.Quat();
VrCamera.offset = new pc.Vec3();

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


VrCamera.prototype.initialize = function() {
    var self = this;

    this.origin = this.entity.getLocalPosition().clone();
    this.originRotation = this.entity.getLocalRotation().clone();
    this.offsetScale = 1;

    this.inVr = false;

    // if available inherit the clear color from the existing camera
    var clearColor;
    if (this.entity.camera) {
        clearColor = this.entity.camera.clearColor;
    } else {
        clearColor = new pc.Color(0.1, 0.1, 0.1);
    }

    // left camera
    this.left = new pc.fw.Entity();
    this.entity.addChild(this.left);
    this.left.addComponent("camera", {
        clearColor: clearColor,
        rect: new pc.Vec4(0.0, 0, 0.5, 1)
    });
    this.left.camera.projection = pc.PROJECTION_VR;
    this.left.enabled = false;

    // right camera
    this.right = new pc.fw.Entity();
    this.entity.addChild(this.right);
    this.right.addComponent("camera", {
        clearColor: clearColor,
        rect: new pc.Vec4(0.5, 0, 0.5, 1)
    });
    this.right.camera.projection = pc.PROJECTION_VR;
    this.right.enabled = false;

//     for debugging
//     var sphere = new pc.Entity();
//     sphere.setLocalScale(0.01,0.01,0.01);
//     sphere.rotate(-90,0,0);
//     sphere.addComponent("model", {type: "cone"});

//     this.left.addChild(sphere.clone());
//     this.right.addChild(sphere.clone());

    var hmd = new pc.Hmd(this.app);
    hmd.initialize(function (err, hmd) {
        if (err) {
            console.warn("Failed to initialize HMD");
            return;
        }

        self.hmd = hmd;

        if (hmd.display) {
            self.app.fire("vr:ready", hmd);
        } else {
            self.app.fire("vr:missing");
        }

        if (self.enableOnClick) {
            self.app.mouse.on("mouseup", self.enterVr, self);

            if (self.app.touch) {
                self.app.touch.on("touchend", function (e) {
                    self.enterVr();
                    e.event.preventDefault();
                }, self);
            }
        }
    });

    hmd.on("presentchange", this._onPresentChange, this);
};


VrCamera.prototype.enterVr = function () {
    if (this.inVr || !this.hmd)
        return;

    var self = this;

    this.hmd.requestPresent(function (err) {
        if (err) {
            // this device can't present
            return;
        }

        if (self.hmd.stereo) {
            self.entity.camera.enabled = false;

            self.right.camera.projection = pc.PROJECTION_VR;
            self.right.camera.camera._vrFov = self.hmd.rightFov;
            self.right.enabled = true;

            self.left.camera.projection = pc.PROJECTION_VR;
            self.left.camera.camera._vrFov = self.hmd.leftFov;
            self.left.enabled = true;

            self.inVr = true;
        }

        self.app.fire("vr:enter");
    });
};

VrCamera.prototype.leaveVr = function () {
    if (!this.inVr || !this.hmd)
         return;

    var self = this;

    this.hmd.exitPresent(function (err) {
        if (err) {
            return;
        }
        self._onLeave();
    });

};

VrCamera.prototype._onLeave = function () {
    this.right.enabled = false;
    this.left.enabled = false;

    if (this.entity.camera) {
        this.entity.camera.enabled = true;
    }

    this.inVr = false;

    this.app.fire("vr:leave");
};

VrCamera.prototype._onPresentChange = function (presenting) {
    // an external event has caused presenting to finish.
    if (!presenting) {
        this._onLeave();
    }
};

VrCamera.prototype._onPresentChange = function (presenting) {
    // an external event has caused presenting to finish.
    if (!presenting) {
        this._onLeave();
    }
};

VrCamera.prototype.update = function () {
    if (!this.hmd)
        return;

    this.hmd.poll();

    if (this.inVr || this.alwaysAcceptInput) {
        this.entity.setLocalRotation(VrCamera.q.copy(this.originRotation).mul(this.hmd.rotation));

        VrCamera.offset.copy(this.hmd.position).scale(this.offsetScale);
        this.originRotation.transformVector(VrCamera.offset, VrCamera.offset);
        var p = VrCamera.offset.add(this.origin);

        this.entity.setLocalPosition(p);

        if (this.hmd.stereo) {
            // get position from hmd, include left and right eye offset
           var lt = this.hmd.leftOffset;
           var rt = this.hmd.rightOffset;

           this.left.setLocalPosition(lt.x, lt.y, lt.z);
           this.right.setLocalPosition(rt.x, rt.y, rt.z);
        }
    }
};

VrCamera.prototype.activate = function () {
    this.right.enabled = true;
    this.left.enabled = true;
};

VrCamera.prototype.reset = function () {
    this.hmd.reset();
};

VrCamera.prototype.setOriginRotation = function (x, y, z) {
    this.originRotation.setFromEulerAngles(x, y, z);
};

VrCamera.prototype.setOffsetScale = function (scale) {
    this.offsetScale = scale;
};

VrCamera.prototype.setOrigin = function (x, y, z) {
    this.origin.set(x, y, z);
};
