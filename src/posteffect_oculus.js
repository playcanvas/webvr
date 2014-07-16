//--------------- POST EFFECT DEFINITION ------------------------//
pc.extend(pc.posteffect, function () {
    /**
     * @name pc.posteffect.Oculus
     */
    var Oculus = function (graphicsDevice, hmdInfo, left) {
        this.hmdInfo = hmdInfo;
        this.aspect = this.hmdInfo.hResolution / (2 * this.hmdInfo.vResolution);
        this.r = -1.0 - (4 * (this.hmdInfo.hScreenSize / 4 - this.hmdInfo.lensSeparationDistance / 2) / this.hmdInfo.hScreenSize);
        this.distScale = (this.hmdInfo.distortionK[0] + this.hmdInfo.distortionK[1] * Math.pow(this.r,2) + this.hmdInfo.distortionK[2] * Math.pow(this.r,4) + this.hmdInfo.distortionK[3] * Math.pow(this.r,6));
        this.lensShift = 4 * (this.hmdInfo.hScreenSize/4 - this.hmdInfo.lensSeparationDistance/2) / this.hmdInfo.hScreenSize;

        this.leftLensCenter = new pc.Vec2(this.lensShift, 0.0);
        this.rightLensCenter = new pc.Vec2(-this.lensShift, 0.0);
        this.scale = new pc.Vec2(1 / this.distScale, 1 * this.aspect / this.distScale);
        this.scaleIn = new pc.Vec2(1, 1 / this.aspect);

        this.left = left;

        this.shader = new pc.gfx.Shader(graphicsDevice, {
            attributes: {
                aPosition: pc.gfx.SEMANTIC_POSITION
            },
            vshader: [
                "attribute vec2 aPosition;",
                "",
                "varying vec2 vUv0;",
                "",
                "void main(void)",
                "{",
                "    gl_Position = vec4(aPosition, 0.0, 1.0);",
                "    vUv0 = (aPosition.xy + 1.0) * 0.5;",
                "}"
            ].join("\n"),

            // No Chromatic Aberration
            // fshader: [
            //     "precision " + graphicsDevice.precision + " float;",
            //     "uniform vec2 uScale;",
            //     "uniform vec2 uScaleIn;",
            //     "uniform vec2 uLensCenter;",
            //     "uniform vec4 uHmdWarpParam;",
            //     'uniform vec4 uChromAbParam;',
            //     "uniform sampler2D uTex;",
            //     "",
            //     "varying vec2 vUv0;",

            //     "void main()",
            //     "{",
            //     "  vec2 uv = (vUv0*2.0)-1.0;", // range from [0,1] to [-1,1]
            //     "  vec2 theta = (uv - uLensCenter) * uScaleIn;",
            //     "  float rSq = theta.x*theta.x + theta.y*theta.y;",
            //     "  vec2 rvector = theta * (uHmdWarpParam.x + uHmdWarpParam.y * rSq + uHmdWarpParam.z * rSq * rSq + uHmdWarpParam.w * rSq * rSq * rSq);",
            //     "  vec2 tc = (uLensCenter + uScale * rvector);",
            //     "  tc = (tc+1.0)/2.0;", // range from [-1,1] to [0,1]
            //     "  if (any(bvec2(clamp(tc, vec2(0.0,0.0), vec2(1.0,1.0))-tc)))",
            //     "    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);",
            //     "  else",
            //     "    gl_FragColor = texture2D(uTex, tc);",
            //     "}"
            // ].join("\n")

            // With Chromatic Abberation
            fshader: [
                "precision " + graphicsDevice.precision + " float;",
                "uniform vec2 uScale;",
                "uniform vec2 uScaleIn;",
                "uniform vec2 uLensCenter;",
                "uniform vec4 uHmdWarpParam;",
                'uniform vec4 uChromAbParam;',
                "uniform sampler2D uTex;",
                "",
                "varying vec2 vUv0;",
                "",
                "void main()",
                "{",
                "    vec2 uv = (vUv0 * 2.0) - 1.0;", // range from [0,1] to [-1,1]
                "    vec2 theta = (uv - uLensCenter) * uScaleIn;",
                "    float rSq = theta.x * theta.x + theta.y * theta.y;",
                "    vec2 rvector = theta * (uHmdWarpParam.x + (uHmdWarpParam.y * rSq) + (uHmdWarpParam.z * rSq * rSq) + (uHmdWarpParam.w * rSq * rSq * rSq));",
                '    vec2 rBlue = rvector * (uChromAbParam.z + uChromAbParam.w * rSq);',
                "    vec2 tcBlue = (uLensCenter + uScale * rBlue);",
                "    tcBlue = (tcBlue + 1.0) / 2.0;", // range from [-1,1] to [0,1]
                "    if (any(bvec2(clamp(tcBlue, vec2(0.0,0.0), vec2(1.0,1.0))-tcBlue))) {",
                "        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);",
                "        return;",
                "    }",
                "    vec2 tcGreen = uLensCenter + uScale * rvector;",
                "    tcGreen = (tcGreen+1.0)/2.0;", // range from [-1,1] to [0,1]
                "    vec2 rRed = rvector * (uChromAbParam.x + uChromAbParam.y * rSq);",
                "    vec2 tcRed = uLensCenter + uScale * rRed;",
                "    tcRed = (tcRed + 1.0) / 2.0;", // range from [-1,1] to [0,1]
                "    gl_FragColor = vec4(texture2D(uTex, tcRed).r, texture2D(uTex, tcGreen).g, texture2D(uTex, tcBlue).b, 1.0);",
                "}"
            ].join("\n"),
        });
    }

    Oculus = pc.inherits(Oculus, pc.posteffect.PostEffect);

    Oculus.prototype = pc.extend(Oculus.prototype, {
        render: function (inputTarget, outputTarget, rect) {
            var device = this.device;
            var scope = device.scope;

            scope.resolve("uTex").setValue(inputTarget.colorBuffer);
            scope.resolve("uScale").setValue(this.scale.data);
            scope.resolve("uScaleIn").setValue(this.scaleIn.data);
            scope.resolve("uHmdWarpParam").setValue(this.hmdInfo.distortionK);
            scope.resolve("uChromAbParam").setValue(this.hmdInfo.chromaAbCorrection);

            if (this.left) {
                scope.resolve("uLensCenter").setValue(this.leftLensCenter.data);
            } else {
                scope.resolve("uLensCenter").setValue(this.rightLensCenter.data);
            }

            pc.posteffect.drawFullscreenQuad(device, outputTarget, this.vertexBuffer, this.shader, rect);
        }
    });

    return {
        Oculus: Oculus
    };
}());
