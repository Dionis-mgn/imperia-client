import Utils from 'utils.js'

function getShader(name, gl) {
	var shaderScript = document.getElementById(name);
	if (!shaderScript) {
		console.log("Can not find shader script " + name);
		return null;
	}

	var str = "";
	var k = shaderScript.firstChild;
	while (k) {
		if (k.nodeType == 3) {
			str += k.textContent;
		}
		k = k.nextSibling;
	}

	var shader;
	if (shaderScript.type == "x-shader/x-fragment") {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	} else if (shaderScript.type == "x-shader/x-vertex") {
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else {
		return null;
	}

	gl.shaderSource(shader, str);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert(gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
};

class Program {
	constructor(_system, options) {
		var gl = _system.gl;

		var _program = gl.createProgram();

		for (var i in options.shaders) {
			var s = getShader(options.shaders[i], gl);
			gl.attachShader(_program, s);
		}

		gl.linkProgram(_program);

		if (!gl.getProgramParameter(_program, gl.LINK_STATUS)) {
			alert("Could not initialise shaders");
		}

		this.__objType = "Program";
		this.system = _system;

		this.program = _program;
		this.attributes = {};
		this.uniforms = {};
		this.maxAttribute = -1;

		var attribsCount = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
		for (var i = 0; i < attribsCount; i++) {
			var attributeInfo = gl.getActiveAttrib(this.program, i);
			attributeInfo.location = gl.getAttribLocation(this.program, attributeInfo.name);
			this.attributes[attributeInfo.name] = attributeInfo;

			this.maxAttribute = Math.max(this.maxAttribute, attributeInfo.location);
		}

		var uniformsCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
		for (var i = 0; i < uniformsCount; i++) {
			var uniformInfo = gl.getActiveUniform(this.program, i);
			uniformInfo.location = gl.getUniformLocation(this.program, uniformInfo.name);
			uniformInfo.bindFunction = Utils.getUniformBindFunction(uniformInfo.type, gl);
			this.uniforms[uniformInfo.name] = uniformInfo;
		}
	}

	enableAttributes() {
		var gl = this.system.gl;
		var maxAttr = this.maxAttribute;
		var sysMaxAttr = this.system.state.maxEnabledAttrib;

		if (sysMaxAttr > maxAttr) {
			for (var i = maxAttr + 1; i <= sysMaxAttr; i++) {
				gl.disableVertexAttribArray(i);
			}
		}
		else if (sysMaxAttr < maxAttr) {
			for (var i = sysMaxAttr + 1; i <= maxAttr; i++) {
				gl.enableVertexAttribArray(i);
			}
		}
		this.system.state.maxEnabledAttrib = maxAttr;
	}

	activate() {
		this.enableAttributes();
		this.system.gl.useProgram(this.program);
	}

	setUniform(name, value) {
		var uniformData = this.uniforms[name];
		if (typeof uniformData === 'undefined') {
			console.log("Can not find uniform variable called " + name + " (Is it optimised?)");
			return;
		}
		uniformData.bindFunction(uniformData.location, value);
	}
}

export default Program;
