class Buffer {
	constructor(_system, _options) {
		var gl = _system.gl;

		this.__objType = "Buffer";
		this.system = _system,

		this.type = _options.type || gl.ARRAY_BUFFER;
		this.usage = _options.usage || gl.STATIC_DRAW;
		this.bufId = gl.createBuffer();
	}

	bind() {
		if (this.system.state.bindedBuffer === this)
			return;

		this.system.gl.bindBuffer(this.type, this.bufId);

		this.system.state.bindedBuffer = this;
	}

	set(_data, _itemSize) {
		if (_data.length % _itemSize !== 0) {
			throw new Error("Incorrect buffer size");
		}

		this.elements = _data.length;
		this.length = this.elements / _itemSize;
		this.itemSize = _itemSize;
		this.bind();

		var arrayType = (this.type === this.system.gl.ELEMENT_ARRAY_BUFFER) ? Uint16Array : Float32Array;
		this.data = new arrayType(_data);

		this.system.gl.bufferData(this.type, this.data, this.usage);
	}

	update(_data, _offset) {
		offset = _offset || 0;
		var startIndex = offset * this.itemSize;
		var endIndex = startIndex + _data.length;
		if ((_data.length % this.itemSize !== 0) || endIndex > this.elements) {
			throw new Error("Incorrect update array size");
		}

		this.data.set(_data, startIndex);
		var uploadData = this.data.subarray(startIndex, endIndex);

		var elementSize = (this.type === this.system.gl.ELEMENT_ARRAY_BUFFER) ? 2 : 4;

		this.bind();
		var result = this.system.gl.bufferSubData(this.type, startIndex * elementSize, uploadData);
	}
}

 export default Buffer;
