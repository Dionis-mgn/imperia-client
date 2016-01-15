import Buffer from 'buffer.js';
import Program from 'program.js';
import Pass from 'pass.js';

import { vec4, mat4 } from 'gl-matrix';

class UralGL {

	constructor(_canvas) {
		const _gl = _canvas.getContext('webgl', { antialias: true })
			|| _canvas.getContext('experimantal-webgl', { antialias: true });

		if (!_gl) {
			throw new Error('Can not init WebGL');
		}

		const _instExt = _gl.getExtension('ANGLE_instanced_arrays')
			|| _gl.getExtension('MOZ_ANGLE_instanced_arrays')
			|| _gl.getExtension('WEBKIT_ANGLE_instanced_arrays');

		if (!_instExt) {
			throw new Error('Can not init "instanced arrays" extension');
		}


		this.__objType = 'UralGL instance';
		this.gl = _gl;
		this.instExt = _instExt;
		this.canvas = _canvas;
		this.state = {
			bindedBuffer: null, // !
			maxEnabledAttrib: -1,
		};
	}

	/**************************************************************************************************
	*																							BUFFER
	*************************************************************************************************/
	/* Options: object
	*   type : gl.ARRAY_BUFFER || gl.ELEMENT_ARRAY_BUFFER
	*   data : array of data
	*   itemSize : size of array element (1 - 4)
	*   usage : gl usage (gl.STATIC_DRAW, gl.DYNAMIC_DRAW or gl.STREAM_DRAW)
	*/
	createBuffer(_options) {
		const options = _options || {};

		const buf = new Buffer(this, options);

		if (typeof options.data !== 'undefined') {
			buf.set(options.data, options.itemSize);
		}

		return buf;
	}

	/**************************************************************************************************
		*																							PROGRAM
		*************************************************************************************************/
	/* Options: object
		*   shaders (required) : array of shader's id's (in DOM)
		*/
	createProgram(_options) {
		const options = _options || {};

		if (typeof options.shaders === 'undefined') {
			throw new Error('Incorrect createProgram options');
		}

		const program = new Program(this, options);

		return program;
	}

	/**************************************************************************************************
		*																							PASS
		*************************************************************************************************/
	/* Options: object
		*   program (required) : program that used in pass
		*     OR
		*   programData : data to create a program : shaders
		*   buffers : object that binds attributes and buffers. Example : {vertPos : {buf : verticesBuffer, instance : 1}, vertCol : colourBuffer}
		*      each object is { buf : buffer, instance : instancing param (passed to vertexAttribDivisorANGLE) } or just buffer object.
		*   depthTest : boolean
		*   depthWrite : boolean
		*/
	createPass(_options) {
		const options = _options || {};

		if (typeof options.program === 'undefined' && typeof options.programData === 'undefined') {
			throw new Error('Incorrect createPass options');
		}

		if (!options.program) {
			options.program = this.createProgram({ shaders: options.programData.shaders });
		}

		const pass = new Pass(this, options);

		return pass;
	}

	/**************************************************************************************************
		*																							SCENE
		*************************************************************************************************/
	createScene() {
		return {
			__objType: 'Scene',
			system: this,

			passes: [],

			addPass(order, pass) {
				if (this.passes.indexOf(order) === -1) {
					this.passes[order] = [pass];
				} else {
					this.passes[order].push(pass);
				}
			},

			render() {
				for (const i in this.passes) {
					if (!this.passes.hasOwnProperty(i)) {
						continue;
					}
					for (const j in this.passes[i]) {
						if (!this.passes[i].hasOwnProperty(j)) {
							continue;
						}

						this.passes[i][j].render();
					}
				}
			}
		};
	}

	/**************************************************************************************************
		*																							CAMERA
		*************************************************************************************************/
	/* Options: object // TODO
		*   program (required) : program that used in pass
		*     OR
		*   programData : data to create a program : shaders, uniforms and attributes. USE BUFFERS FIELD TO PROVIDE LIST OF ATTRIBUTES. {shaders : ["vert", "frag"], uniforms: ["timer"]}
		*   buffers : object that binds attributes and buffers. Example : {vertPos : {buf : verticesBuffer, instance : 1}, vertCol : colourBuffer}
		*      each object is { buf : buffer, instance : instancing param (passed to vertexAttribDivisorANGLE) } or just buffer object.
		*/
	createCamera(_options) {
		var camera = {
			__objType : "Camera",
			system : this,

			clearColor : vec4.fromValues(0.0, 0.0, 0.0, 1.0),
			perspective : mat4.create(), // identity
			modelView : mat4.create(), // identity
			position : vec4.create(),
			ppd : 7.0, // Pixels Per Degree

			move : function(on) {
				vec4.add(this.position, this.position, on);
				mat4.translate(this.modelView, this.modelView, vec4.negate(on, on));
			},

			onViewportResize : function(width, height) {
				var fovYRad = height / (this.ppd * 180 / Math.PI);
				mat4.perspective(this.perspective, fovYRad, width / height, 1, 100.0);
				this.system.gl.viewport(0, 0, width, height);
			},

			unproject : function(x, y) {
				var invMVP = mat4.create();
				mat4.mul(invMVP, this.perspective, this.modelView);
				mat4.invert(invMVP, invMVP);

				function find(point) {
					vec4.transformMat4(point, point, invMVP);

					if (point[3] === 0.0) {
						return null;
					}
					point[0] = point[0] / point[3];
					point[1] = point[1] / point[3];
					point[2] = point[2] / point[3];

					return point;
				}


				var point = vec4.fromValues(x, y, -1.0, 1.0);
				var p1 = find(point);

				point = vec4.fromValues(x, y, 1.0, 1.0);
				var p2 = find(point);

				if (p1 === null || p2 === null) {
					return null;
				}

				point = vec4.create();

				point[0] = p2[0] - ((p2[0] - p1[0]) / (p2[2] - p1[2])) * p2[2];
				point[1] = p2[1] - ((p2[1] - p1[1]) / (p2[2] - p1[2])) * p2[2];
				point[2] = p2[2] - ((p2[2] - p1[2]) / (p2[2] - p1[2])) * p2[2];

				return point;
			}
		};

		return camera;
	}

	/**************************************************************************************************
		*																							MAIN
		*************************************************************************************************/
	renderFrame(scene, camera) {
		var cc = camera.clearColor;
		this.gl.clearColor(cc[0], cc[1], cc[2], cc[3]);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		scene.render();
	}

	/**************************************************************************************************
		*																							INNER
		*************************************************************************************************/


	setState(_var, state) {
		if (state) {
			this.gl.enable(_var);
		}
		else {
			this.gl.disable(_var);
		}
	}
}

export default UralGL;
