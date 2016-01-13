var Utils = {
	getUniformBindFunction(type, gl) {
		switch (type) {
			case gl.FLOAT :
				return function (location, value) {gl.uniform1f(location, value)};
			case gl.FLOAT_VEC2 :
				return function (location, value) {gl.uniform2fv(location, value)};
			case gl.FLOAT_VEC3 :
				return function (location, value) {gl.uniform3fv(location, value)};
			case gl.FLOAT_VEC4 :
				return function (location, value) {gl.uniform4fv(location, value)};
			case gl.INT_VEC2 :
				return function (location, value) {gl.uniform2iv(location, value)};
			case gl.INT_VEC3 :
				return function (location, value) {gl.uniform3iv(location, value)};
			case gl.INT_VEC4 :
				return function (location, value) {gl.uniform4iv(location, value)};
			case gl.FLOAT_MAT2 :
				return function (location, value) {gl.uniformMatrix2fv(location, gl.FALSE, value)};
			case gl.FLOAT_MAT3 :
				return function (location, value) {gl.uniformMatrix3fv(location, gl.FALSE, value)};
			case gl.FLOAT_MAT4 :
				return function (location, value) {gl.uniformMatrix4fv(location, gl.FALSE, value);};
			case gl.BYTE :
				return function (location, value) {gl.uniform1i(location, value)};
			case gl.UNSIGNED_BYTE :
				return function (location, value) {gl.uniform1i(location, value)};
			case gl.SHORT :
				return function (location, value) {gl.uniform1i(location, value)};
			case gl.UNSIGNED_SHORT :
				return function (location, value) {gl.uniform1i(location, value)};
			case gl.INT :
				return function (location, value) {gl.uniform1i(location, value)};
			case gl.UNSIGNED_INT :
				return function (location, value) {gl.uniform1i(location, value)};
			case gl.SAMPLER_2D :
				return function (location, value) {gl.uniform1i(location, value)};
			case gl.SAMPLER_CUBE :
				return function (location, value) {gl.uniform1i(location, value)};
			case gl.BOOL :
			case gl.BOOL_VEC2 :
			case gl.BOOL_VEC3 :
			case gl.BOOL_VEC4 :
				throw new Error('Unimplemented');
			default:
				throw new Error('Unknown uniform type ' + type);
		}
	}
};

export default Utils;
