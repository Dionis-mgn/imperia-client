class Pass {
	constructor(_system, options) {
		this.__objType = "Pass";
		this.system = _system;

		this.program = options.program;
		this.attributesData = {};
		this.uniformsData = {};
		this.noAttributeBufs = [];
		this.indiciesBuf = null;
		this.instanced = 0;
		this.active = true;

		this.depthTest = typeof options.depthTest === 'undefined' ? true : options.depthTest;
		this.depthWrite = typeof options.depthWrite === 'undefined' ? true : options.depthWrite;

		var gl = _system.gl;

		if (typeof options.buffers !== 'undefined') {
			var buffs = options.buffers;
			for (var i in buffs) {

				if (i === "noAttribute") {
					for (var k in buffs[i]) {
						var bufData = buffs[i][k];
						this.noAttributeBufs.push(bufData);
						if (bufData.type === gl.ELEMENT_ARRAY_BUFFER) {
							if (this.indiciesBuf !== null) {
								throw new Error("Two indicies buffers in one pass");
							}
							this.indiciesBuf = bufData;
						}
					}
				}
				else {
					var bufData = buffs[i].buf || buffs[i];
					var instance = buffs[i].instance || 0;

					if (bufData.type !== gl.ARRAY_BUFFER) {
						throw new Error("Incorrect buffer type");
					}

					this.attributesData[i] = {buf : bufData, instance : instance};

					if (instance) {
						this.instanced = Math.max(bufData.length, this.instanced);
					}
				}
			}
		}

		if (typeof options.programData !== 'undefined' && typeof options.programData.uniforms !== 'undefined') {
			var uniforms = options.programData.uniforms;
			for (i in uniforms) {
				this.uniformsData[i] = {};
			}
		}
	}

	bindBuffers() {
		var gl = this.system.gl;

		for (var i in this.attributesData) {
			var data = this.attributesData[i];
			data.buf.bind();
			gl.vertexAttribPointer(this.program.attributes[i].location, data.buf.itemSize, gl.FLOAT, false, 0, 0);
			if (this.instanced) {
				this.system.instExt.vertexAttribDivisorANGLE(this.program.attributes[i].location, data.instance);
			}
		}

		for (var i in this.noAttributeBufs) {
			this.noAttributeBufs[i].bind();
		}
	}

	bindUniforms() {
		for (var i in this.uniformsData) {
			var data = this.uniformsData[i];
			var value = typeof data.field === 'undefined' ? data.obj : data.obj[data.field];
			this.program.setUniform(i, value);
		}
	}

	bindState() {
		var state = this.system.state;
		var gl = this.system.gl;
		var system = this.system;
		var setState = function (_var, value) { system.setState(_var, value); };

		if (state.depthWrite !== this.depthWrite) {
			gl.depthMask(this.depthWrite);
			state.depthWrite = this.depthWrite;
		}

		if (state.depthTest !== this.depthTest) {
			setState(gl.DEPTH_TEST, this.depthTest);
			state.depthTest = this.depthTest;
		}
	}

	setUniform(name, _obj, _field) {
		if (typeof _obj === 'undefined') {
			throw new Error("Incorrect parameters");
		}

		if (typeof this.uniformsData[name] === 'undefined') {
			this.uniformsData[name] = {};
		}
		this.uniformsData[name].obj = _obj;
		this.uniformsData[name].field = _field;
	}

	render() {
		if (!this.active) {
			return;
		}

		if (this.indiciesBuf === null) {
			throw new Error("No indicies data");
		}

		var gl = this.system.gl;
		var instExt = this.system.instExt;

		this.program.activate();
		this.bindBuffers();
		this.bindUniforms();
		this.bindState();

		if (this.instanced) {
			instExt.drawElementsInstancedANGLE(gl.TRIANGLES, this.indiciesBuf.length, gl.UNSIGNED_SHORT, 0, this.instanced);
		}
		else {
			gl.drawElements(gl.TRIANGLES, this.indiciesBuf.length, gl.UNSIGNED_SHORT, 0);
		}
	}
}

export default Pass;
