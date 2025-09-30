"use strict";
// WorldEdit.js (compiled)
// Version: 1.2.0
// Constants
const w_accentColor = "#7cff62";
const w_style = {
	strokeWidth: 1,
	selectFill: "#57b64530",
	selectStroke: w_accentColor,
	selectDash: true,
	pasteFill: "#00FFFF40",
	pasteStroke: "#00FFFF",
	pastePixelColor: "#00FFFF44"
};
// Global variables
let worldEditElements = {};
let pastePreviewCanvas;
let w_state = {
	firstSelectionPos: {x: 0, y: 0},
	selection: null,
	clipboard: null,
	lastNonWorldEditElement: "unknown"
};
// Define settings
let w_settingsTab;
let w_deselectOnResetSetting;
dependOn("betterSettings.js", () => {
	w_settingsTab = new SettingsTab("WorldEdit");
	w_deselectOnResetSetting = new Setting("Deselect on reset", "deselectOnReset", settingType.BOOLEAN, false, true);
	w_settingsTab.registerSettings("Selection", w_deselectOnResetSetting);
	settingsManager.registerTab(w_settingsTab);
}, true);

// Classes
class Rect {
	constructor(x, y, w, h) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	}

	static fromCorners(start, end) {
		return new Rect(start.x, start.y, end.x - start.x, end.y - start.y);
	}

	static fromCornersXYXY(x, y, x2, y2) {
		return new Rect(x, y, x2 - x, y2 - y);
	}

	static fromGrid(grid, origin = {x: 0, y: 0}) {
		return new Rect(origin.x, origin.y, grid[0].length, grid.length);
	}

	get area() {
		return this.w * this.h;
	}

	get x2() {
		return this.x + this.w;
	}

	get y2() {
		return this.y + this.h;
	}

	set x2(val) {
		this.w = val - this.x;
	}

	set y2(val) {
		this.h = val - this.y;
	}

	copy() {
		return new Rect(this.x, this.y, this.w, this.h);
	}

	normalized() {
		return Rect.fromCornersXYXY(Math.min(this.x, this.x2), Math.min(this.y, this.y2), Math.max(this.x, this.x2), Math.max(this.y, this.y2));
	}
}

// Functions
function reverseString(str) {
	return [...str].reverse().join("");
}

function isPointInWorld(point) {
	return point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height;
}

function limitPointToWorld(point) {
	return {
		x: Math.max(0, Math.min(point.x, width)),
		y: Math.max(0, Math.min(point.y, height))
	};
}

function mousePosToWorldPos(pos) {
	const rect = canvas.getBoundingClientRect();
	let x = pos.x - rect.left;
	let y = pos.y - rect.top;
	x = Math.floor((x / canvas.clientWidth) * (width + 1));
	y = Math.floor((y / canvas.clientHeight) * (height + 1));
	return {x: x, y: y};
}

function updatePastePreviewCanvas() {
	const clipboard = w_state.clipboard;
	if (!clipboard)
		return;
	const clipboardRect = Rect.fromGrid(clipboard);
	// Create canvas
	pastePreviewCanvas = new OffscreenCanvas(clipboardRect.w, clipboardRect.h);
	const pastePreviewCtx = pastePreviewCanvas.getContext("2d");
	const imageData = pastePreviewCtx.createImageData(clipboardRect.w, clipboardRect.h);
	const buffer = new Uint32Array(imageData.data.buffer);
	buffer.fill(0x00000000);
	const pixelColorBinary = parseInt(reverseString(w_style.pastePixelColor.slice(1)), 16);
	for (let y = 0; y < clipboardRect.h; y++) {
		for (let x = 0; x < clipboardRect.w; x++) {
			if (clipboard[y][x])
				buffer[y * clipboardRect.w + x] = pixelColorBinary;
		}
	}
	pastePreviewCtx.putImageData(imageData, 0, 0);
}

function renderSelection(ctx) {
	const selection = w_state.selection;
	if (!selection)
		return;
	const isSelecting = (mouseIsDown &&
		(mouseType !== "middle" && mouseType !== "right") &&
		currentElement === "w_select");
	ctx.globalAlpha = 1.0;
	// Fill
	if (!isSelecting) {
		ctx.fillStyle = w_style.selectFill;
		ctx.fillRect(selection.x * pixelSize, selection.y * pixelSize, selection.w * pixelSize, selection.h * pixelSize);
	}
	// Dash if selection is big enough
	if (w_style.selectDash && selection.w >= 2 && selection.h >= 2)
		ctx.setLineDash([pixelSize, pixelSize]);
	// Stroke
	ctx.strokeStyle = w_style.selectStroke;
	ctx.lineWidth = w_style.strokeWidth;
	ctx.strokeRect(selection.x * pixelSize, selection.y * pixelSize, selection.w * pixelSize, selection.h * pixelSize);
	ctx.setLineDash([]);
}

function renderPastePreview(ctx) {
	if (currentElement !== 'w_paste')
		return;
	const clipboard = w_state.clipboard;
	if (!clipboard)
		return;
	const clipboardRect = Rect.fromGrid(clipboard, mousePos);
	ctx.globalAlpha = 1.0;
	// Fill
	ctx.fillStyle = w_style.pasteFill;
	ctx.fillRect(clipboardRect.x * pixelSize, clipboardRect.y * pixelSize, clipboardRect.w * pixelSize, clipboardRect.h * pixelSize);
	// Stroke
	ctx.strokeStyle = w_style.pasteStroke;
	ctx.lineWidth = w_style.strokeWidth;
	ctx.strokeRect(clipboardRect.x * pixelSize, clipboardRect.y * pixelSize, clipboardRect.w * pixelSize, clipboardRect.h * pixelSize);
	if (pastePreviewCanvas)
		ctx.drawImage(pastePreviewCanvas, mousePos.x * pixelSize, mousePos.y * pixelSize, clipboardRect.w * pixelSize, clipboardRect.h * pixelSize);
}

function addWorldEditKeybinds() {
	keybinds.w = () => {
		selectCategory("worldEdit");
	};
	keybinds.d = () => {
		elements.w_deselect.rawOnSelect();
	};
	keybinds.a = () => {
		elements.w_select_all.rawOnSelect();
	};
	keybinds.s = () => {
		selectElement("w_select");
		selectCategory("worldEdit");
	};
	keybinds.c = () => {
		elements.w_copy.rawOnSelect();
	};
	keybinds.v = () => {
		selectElement("w_paste");
		selectCategory("worldEdit");
	};
	keybinds.x = () => {
		elements.w_cut.rawOnSelect();
	};
	keybinds.Delete = () => {
		elements.w_delete.rawOnSelect();
	};
	keybinds.g = () => {
		elements.w_fill.rawOnSelect();
	};
}

function modifySelectElement() {
	const originalSelectElement = selectElement;
	// @ts-ignore
	selectElement = (element) => {
		// Keep track of last non-worldEdit element
		if (!worldEditElements.hasOwnProperty(element))
			w_state.lastNonWorldEditElement = element;
		originalSelectElement(element);
	};
}

function addWorldEditElements(elementsToAdd) {
	for (const elementName in elementsToAdd) {
		const element = elementsToAdd[elementName];
		elements[elementName] = element;
		// Apply base settings for every worldEdit element
		element.category ?? (element.category = "worldEdit");
		element.color ?? (element.color = w_accentColor);
		element.tool ?? (element.tool = () => null);
		element.maxSize ?? (element.maxSize = 1);
		// Some elements will auto-deselect themselves
		if (!element.shouldStaySelected) {
			const originalOnSelect = element.onSelect;
			element.rawOnSelect = originalOnSelect;
			element.onSelect = function (...args) {
				originalOnSelect(...args);
				selectElement(w_state.lastNonWorldEditElement);
			};
		}
	}
}

// Elements
worldEditElements.w_deselect = {
	onSelect: function () {
		w_state.selection = null;
		if (pixelTicks != 0)
			logMessage("Deselected area.");
	}
};
worldEditElements.w_select_all = {
	onSelect: function () {
		w_state.selection = new Rect(0, 0, width + 1, height + 1);
		logMessage("Selected everything.");
	}
};
worldEditElements.w_select = {
	onPointerDown: function (e) {
		const pos = mousePosToWorldPos({x: e.clientX, y: e.clientY});
		if (showingMenu)
			return;
		if (!isPointInWorld(pos))
			return;
		if (e.button === 1 || e.button === 2)
			return;
		w_state.firstSelectionPos = pos;
	},
	onPointerMoveAnywhere: function (e) {
		const pos = mousePosToWorldPos({x: e.clientX, y: e.clientY});
		if (!mouseIsDown)
			return;
		if (showingMenu)
			return;
		if (e.button === 1 || e.button === 2)
			return;
		if (currentElement !== "w_select")
			return;
		const rect = Rect.fromCorners(w_state.firstSelectionPos, limitPointToWorld(pos)).normalized();
		rect.x2 += 1;
		rect.y2 += 1;
		w_state.selection = rect;
	},
	shouldStaySelected: true
};
worldEditElements.w_copy = {
	onSelect: function () {
		const selection = w_state.selection;
		if (!selection) {
			logMessage("Error: Nothing is selected.");
			return;
		}
		// Copy pixels
		w_state.clipboard = [];
		let clipboard = w_state.clipboard;
		for (let y = selection.y; y < selection.y2; y++) {
			const row = [];
			for (let x = selection.x; x < selection.x2; x++) {
				row.push(structuredClone(pixelMap[x][y]));
			}
			clipboard.push(row);
		}
		updatePastePreviewCanvas();
		logMessage(`Copied ${selection.w}x${selection.h}=${selection.area} pixel area.`);
	}
};
worldEditElements.w_paste = {
	onPointerDown: function (e) {
		if (showingMenu)
			return;
		if (!isPointInWorld(mousePos))
			return;
		if (e.button === 1 || e.button === 2)
			return;
		const clipboard = w_state.clipboard;
		if (!clipboard) {
			logMessage("Error: Nothing in clipboard.");
			return;
		}
		const pasteOrigin = mousePos;
		// Paste pixels
		for (let y = 0; y < clipboard.length; y++) {
			for (let x = 0; x < clipboard[0].length; x++) {
				const clipboardPixel = clipboard[y][x];
				const dest = {x: pasteOrigin.x + x, y: pasteOrigin.y + y};
				if (!isPointInWorld(dest))
					continue; // Skip if out of bounds
				if (pixelMap[dest.x][dest.y])
					continue; // Skip if pixel already there
				if (!clipboardPixel)
					continue; // Skip if new pixel is air
				// Create pixel
				const newPixel = structuredClone(clipboardPixel);
				Object.assign(newPixel, dest);
				pixelMap[dest.x][dest.y] = newPixel;
				currentPixels.push(newPixel);
			}
		}
		const area = Rect.fromGrid(clipboard).area;
		logMessage(`Pasted ${clipboard[0].length}x${clipboard.length}=${area} pixel area.`);
	},
	shouldStaySelected: true
};
worldEditElements.w_cut = {
	onSelect: function () {
		const selection = w_state.selection;
		if (!selection) {
			logMessage("Error: Nothing is selected.");
			return;
		}
		// Cut pixels
		w_state.clipboard = [];
		let clipboard = w_state.clipboard;
		for (let y = selection.y; y < selection.y2; y++) {
			const row = [];
			for (let x = selection.x; x < selection.x2; x++) {
				row.push(structuredClone(pixelMap[x][y]));
				const pixel = pixelMap[x][y];
				const index = currentPixels.indexOf(pixel);
				if (index !== -1)
					currentPixels.splice(index, 1);
				if (pixel) {
					delete pixelMap[x][y];
				}
			}
			clipboard.push(row);
		}
		updatePastePreviewCanvas();
		logMessage(`Cut ${selection.w}x${selection.h}=${selection.area} pixel area.`);
	}
};
worldEditElements.w_delete = {
	onSelect: function () {
		const selection = w_state.selection;
		if (!selection) {
			logMessage("Error: Nothing is selected.");
			return;
		}
		// Delete pixels
		for (let y = selection.y; y < selection.y2; y++) {
			for (let x = selection.x; x < selection.x2; x++) {
				const pixel = pixelMap[x][y];
				const index = currentPixels.indexOf(pixel);
				if (index !== -1)
					currentPixels.splice(index, 1);
				if (pixel) {
					delete pixelMap[x][y];
				}
			}
		}
		logMessage(`Deleted ${selection.w}x${selection.h}=${selection.area} pixel area.`);
	}
};
worldEditElements.w_fill = {
	onSelect: function () {
		const selection = w_state.selection;
		const fillElement = w_state.lastNonWorldEditElement;
		if (!selection) {
			logMessage("Error: Nothing is selected.");
			return;
		}
		// Fill area
		for (let y = selection.y; y < selection.y2; y++) {
			for (let x = selection.x; x < selection.x2; x++) {
				if (pixelMap[x][y])
					continue;
				const placed = currentPixels.push(new Pixel(x, y, fillElement));
				if (!placed)
					continue;
				if (currentPixels.length > maxPixelCount || !fillElement) {
					currentPixels[currentPixels.length - 1].del = true;
				} else if (elements[fillElement] && elements[fillElement].onPlace !== undefined) {
					elements[fillElement].onPlace(currentPixels[currentPixels.length - 1]);
				}
			}
		}
		logMessage(`Filled in ${selection.w}x${selection.h}=${selection.area} pixel area.`);
	}
};
// Setup and hooks
modifySelectElement();
addWorldEditElements(worldEditElements);
addWorldEditKeybinds();
runAfterReset(() => {
	if (w_deselectOnResetSetting.value)
		w_state.selection = null;
});
runAfterReset(updatePastePreviewCanvas);
renderPostPixel(renderSelection);
renderPostPixel(renderPastePreview);
// Mobile support
let addedCustomEventListeners = false;
runAfterReset(() => {
	if (addedCustomEventListeners)
		return;
	gameCanvas.addEventListener("pointerdown", (e) => {
		if (elements[currentElement] && elements[currentElement].onPointerDown)
			elements[currentElement].onPointerDown(e);
	}, {passive: false});
	gameCanvas.addEventListener("pointermove", (e) => {
		if (elements[currentElement] && elements[currentElement].onPointerMove)
			elements[currentElement].onPointerMove(e);
	}, {passive: false});
	document.addEventListener("pointermove", (e) => {
		if (elements[currentElement] && elements[currentElement].onPointerMoveAnywhere)
			elements[currentElement].onPointerMoveAnywhere(e);
	});
	addedCustomEventListeners = true;
});
