import {vec2, vec3, vec4} from 'gl-matrix'

class Engine {

	constructor(uGL, onInit) {
		this.__objType = "Engine instance";
		this.uGL = uGL;
		this.field = null;
		this.buffers = {};

		var _this = this;

		this.getField(function(){_this.init(onInit)});
	}

	generateBuffers() {
		var buffs = {
			vertices : [
				0.0,   0.0,   0.0, 0.0,
				-0.5,   0.0,   0.0, 1.0,
				-0.25,  0.433, 0.0, 1.0,
				0.25,  0.433, 0.0, 1.0,
				0.5,   0.0,   0.0, 1.0,
				0.25, -0.433, 0.0, 1.0,
				-0.25, -0.433, 0.0, 1.0
			],

			indices : [
				1, 2, 0,
				2, 3, 0,
				3, 4, 0,
				4, 5, 0,
				5, 6, 0,
				6, 1, 0
			],
			instances : [],
			colors : [],
			scales : []
		};

		var dx = 1.5;
		var dy = 0.433;
		var ddx = 0.75;

		var start = -1 * (this.field.size / 2);
		var end = start + this.field.size;

		for (var i = start; i < end; i++) {
			for (var j = start; j < end; j++) {
				var x = dx * i;
				if (Math.abs(j) % 2 === 1) { x += ddx; }
				var y = dy * j;

				var cell = this.field.cells[i - start][j - start];

				var scale = cell.population / 1000; // Math.random() * 0.8 + 0.2;
				scale = Math.max(0.2, Math.min(1.0, scale));

				buffs.instances.push(x);
				buffs.instances.push(y);
				buffs.instances.push(0.0);

				buffs.scales.push(scale);

				var red = vec3.fromValues(1.0, 0.2, 0.2);
				var green = vec3.fromValues(0.2, 1.0, 0.2);

				var colorRate = (cell.populationDelta + 0.1) * 5.0;

				vec3.lerp(red, red, green, colorRate);

				buffs.colors.push(red[0]);
				buffs.colors.push(red[1]);
				buffs.colors.push(red[2]);
				buffs.colors.push(1.0);
			}
		}

		return buffs;
	}

	buildBuffers() {
		var _data = this.generateBuffers();

		this.buffers.vertices = this.uGL.createBuffer({data : _data.vertices, itemSize : 4});
		this.buffers.indices = this.uGL.createBuffer({type : this.uGL.gl.ELEMENT_ARRAY_BUFFER, data : _data.indices, itemSize : 1});
		this.buffers.offsets = this.uGL.createBuffer({data : _data.instances, itemSize : 3});

		this.buffers.colours = this.uGL.createBuffer({data : _data.colors, itemSize : 4, usage : this.uGL.gl.DYNAMIC_DRAW});
		this.buffers.scales = this.uGL.createBuffer({data : _data.scales, itemSize : 1, usage : this.uGL.gl.DYNAMIC_DRAW});
	}

	updateBuffers() {
		var colors = [];
		var scales = [];
		for (var i = 0; i < this.field.size; i++) {
			for (var j = 0; j < this.field.size; j++) {
				var cell = this.field.cells[i][j];

				var scale = cell.population / 1000; // Math.random() * 0.8 + 0.2;
				scale = Math.max(0.2, Math.min(1.0, scale));

				scales.push(scale);

				var red = vec3.fromValues(1.0, 0.2, 0.2);
				var green = vec3.fromValues(0.2, 1.0, 0.2);

				var colorRate = (cell.populationDelta + 0.1) * 5.0;

				vec3.lerp(red, red, green, colorRate);

				colors.push(red[0]);
				colors.push(red[1]);
				colors.push(red[2]);
				colors.push(1.0);
			}
		}

		this.buffers.colours.update(colors);
		this.buffers.scales.update(scales);
	}

	init(onInit) {
		this.buildBuffers();

		this.scene = this.uGL.createScene();
		this.camera = this.uGL.createCamera();
		this.camera.clearColor = vec4.fromValues(0.475, 0.465, 0.45, 0.5);
		this.camera.move(vec4.fromValues(0.0, 0.0, 7.0, 0.0));

		this.pass = this.uGL.createPass(
			{
				programData : {shaders : ["shader-fs","shader-vs"]},
				buffers : {
					aVertexPosition : this.buffers.vertices ,
					aVertexColor : {buf : this.buffers.colours, instance : 1} ,
					aOffset : {buf : this.buffers.offsets, instance : 1},
					aScale : {buf : this.buffers.scales, instance : 1},
					noAttribute : [this.buffers.indices]
				}
			}
		);

		this.pass.setUniform("uPMatrix", this.camera.perspective);
		this.pass.setUniform("uMVMatrix", this.camera.modelView);
		this.pass.setUniform("fTiming", 0);

		this.scene.addPass(10, this.pass);

		if (typeof onInit !== 'undefined') {
			onInit();
		}
	}

	getCellAtPos (x, y) {
		function getCenterCoords(x, y) {
			var rx = x * 1.5;
			var ry = y * 0.433;
			if (Math.abs(y) % 2 === 1) {
				rx += 0.75;
			}

			return vec2.fromValues(rx, ry);
		};

		var iy = Math.floor(y / 0.433);

		var ix = (Math.abs(iy) % 2 === 1) ? x - 0.75 : x;
		var ix = Math.floor(ix / 1.5);



		var p1 = {
			x : ix,
			y : iy,
			p : getCenterCoords(ix, iy)
		};

		var p2 = {
			x : ix + 1,
			y : iy,
			p : getCenterCoords(ix + 1, iy)
		};

		var p3 = {
			x : ix,
			y : iy + 1,
			p : getCenterCoords(ix, iy + 1)
		};

		var p4 = {
			x : ix + 1,
			y : iy + 1,
			p : getCenterCoords(ix + 1, iy + 1)
		};

		var result = null;
		var d = 100;

		var original = vec2.fromValues(x, y);

		function process(p) {
			var currD = vec2.squaredDistance(p.p, original);
			if (currD < d) {
				result = p;
				d = currD;
			}
		}

		process(p1);
		process(p2);
		process(p3);
		process(p4);

		var index = (result.x + (this.field.size / 2)) * this.field.size + (result.y + (this.field.size / 2));

		var index_x = Math.floor(index / this.field.size);
		var index_y = index % this.field.size;

		return {
			index : index,
			scale : this.buffers.scales.data[index],
			color : vec3.fromValues(
				this.buffers.colours.data[index * 4],
				this.buffers.colours.data[index * 4 + 1],
				this.buffers.colours.data[index * 4 + 2]
			),
			cell : this.field.cells[index_x][index_y]
		}
	}

	updateField(count, successHandler, errorHandler) {
		var data = {};
		if (typeof count != 'undefined') {
			data = {steps : count};
		}

		var _this = this;

		$.ajax(
			{
				method : "GET",
				url : "/update",
				dataType : "json",
				data : data,
				success : function(data, textStatus, jqXHR) {
					console.log("Field updated in " + data.steps + " steps. Total time: " + data.totalTime + " , average time : " + data.averageTime);
					_this.getField(function() { _this.updateBuffers(); _this.uGL.renderFrame(_this.scene, _this.camera); });
					if (typeof successHandler != 'undefined') {
						successHandler();
					}
				},
				error : function(jqXHR, textStatus, errorThrown) {
					console.log("Unable to update field");
					if (typeof errorHandler != 'undefined') {
						errorHandler();
					}
				}
			}
		);
	}

	getField(successHandler, errorHandler) {
		var _this = this;
		$.ajax(
			{
				method : "GET",
				url : "/field",
				dataType : "json",
				success : function(data, textStatus, jqXHR) {
					_this.field = data;
					successHandler(data);
				},
				error : function(jqXHR, textStatus, errorThrown) {
					console.log("Unable to get field");
					if (typeof errorHandler != 'undefined') {
						errorHandler();
					}
				}
			}
		);
	}
}

export default Engine;
