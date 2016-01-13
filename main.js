import UralGL from 'ural/uralgl.js'
import Engine from './imperia.js'

import {vec4} from 'gl-matrix'

var uGL;
var engine;
var prog;

function onResize(canvas, camera) {
	var width = canvas.clientWidth;
	var height = canvas.clientHeight;
	if (canvas.width != width || canvas.height != height) {
		canvas.width = width;
		canvas.height = height;
		camera.onViewportResize(width, height);
	}
}

function start() {
	var canvas = document.getElementById("renderCanvas");

	uGL = new UralGL(canvas);

	var gl = uGL.gl;


	function doResize() {
		onResize(canvas, engine.camera);
		uGL.renderFrame(engine.scene, engine.camera); // TODO move to imperia.js
	};

	var mouseState = {};

	function onMove(event) {
		var ex = event.clientX - canvas.getBoundingClientRect().left;
		var ey = event.clientY - canvas.getBoundingClientRect().top;
		var x = ex;
		var y = ey;

		x = x / canvas.width;
		y = (canvas.height - y) / canvas.height;

		x = x * 2.0 - 1.0;
		y = y * 2.0 - 1.0;

		var res = engine.camera.unproject(x, y);

		if (mouseState.pressed) {
			var v = vec4.fromValues(mouseState.x - res[0], mouseState.y - res[1], 0.0, 0.0);
			var m = vec4.fromValues(1, 1, 0, 0);
			vec4.mul(v, v, m);

			engine.camera.move(v);

			mouseState.cx = ex;
			mouseState.cy = ey;

			uGL.renderFrame(engine.scene, engine.camera);
		}


	};

	function onMoveStart(event) {
		var ex = event.clientX - canvas.getBoundingClientRect().left;
		var ey = event.clientY - canvas.getBoundingClientRect().top;
		var x = ex;
		var y = ey;

		x = x / canvas.width;
		y = (canvas.height - y) / canvas.height;

		x = x * 2.0 - 1.0;
		y = y * 2.0 - 1.0;

		var res = engine.camera.unproject(x, y);

		mouseState.x = res[0];
		mouseState.y = res[1];
		mouseState.cx = ex;
		mouseState.cy = ey;
		mouseState.pressed = true;

		var selectedCell = engine.getCellAtPos(res[0], res[1]);

		//scalesBuf.update([Math.random() * 0.8 + 0.2], selectedCell.index);

		var newColor = [];
		newColor.push(Math.random());
		newColor.push(Math.random());
		newColor.push(Math.random());
		newColor.push(1.0);

		//colorBuf.update(newColor, selectedCell.index);

		var block = document.getElementById("colorDisplay1");
		block.style.backgroundColor = "rgb(" + Math.floor(selectedCell.color[0] * 255) + "," + Math.floor(selectedCell.color[1] * 255) + "," + Math.floor(selectedCell.color[2] * 255) + ")"
	}

	function onMouseEnd(event) {
		mouseState.pressed = false;
	};

	engine = new Engine(uGL, function() {
		doResize();
		window.addEventListener('resize', doResize);
		canvas.addEventListener('mousemove', onMove);
		canvas.addEventListener('mouseleave', onMouseEnd);
		canvas.addEventListener('mouseup', onMouseEnd);
		canvas.addEventListener('mousedown', onMoveStart);
	});
}

function updateField() {
	var valueControl = document.getElementById("updateValue");
	var updateButton = document.getElementById("updateButton");

	updateButton.disabled = true;
	engine.updateField(valueControl.value, function() { updateButton.disabled = false; }, function() { updateButton.textContent = "FAILED"; });
}

start();
