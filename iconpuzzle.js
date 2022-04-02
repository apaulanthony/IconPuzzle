/*globals iconpuzzle:true */
/* exported iconpuzzle */ 
iconpuzzle = (function() {
	var icons = [
			"❤️",
			"✨",
			"✔️",
			"⏳",
			"🔪",
			"⚔️",
			"🍒",
			"📞"
			/*
			{ className: "fas fa-anchor"},
			{ className: "fab fa-android"},
			{ className: "fab fa-apple"},
			{ className: "fas fa-bath"},
			{ className: "fas fa-bed"},
			{ className: "fas fa-beer"},
			{ className: "fas fa-birthday-cake"},
			{ className: "fas fa-bolt"},
			{ className: "fas fa-bug"},
			{ className: "fas fa-camera-retro"},
			{ className: "fas fa-chess-board"},
			{ className: "fas fa-chess-rook"},
			{ className: "fas fa-chess-queen"},
			{ className: "fas fa-cog"},
			{ className: "fas fa-cogs"},
			{ className: "fas fa-cubes"},
			{ className: "fab fa-fort-awesome"},
			{ className: "fas fa-gamepad"},
			{ className: "fas fa-music"},
			{ className: "fas fa-paper-plane"},
			{ className: "fas fa-paperclip"},
			{ className: "fas fa-paw"},
			{ className: "fas fa-puzzle-piece"},
			{ className: "fas fa-shield-alt"},
			{ className: "fas fa-star"},
			{ className: "fas fa-tree"},
			{ className: "fas fa-trophy"}
			*/
		], icon, tableParent;

	function setRandom (icon) {
		var image = icons[Math.floor(Math.random() * icons.length)];
		
		icon.innerText = typeof image === "string" ? image : "";

		if (typeof image !== "string") {
			Object.keys(image).forEach(function (k) { icon[k] = image[k]; });
		}
	}

	function selected () {
		this.classList.toggle("selected");
	}

	function convertToMap () {
		var text = window.getComputedStyle(icon, ":before"),
			tCtx = document.createElement("canvas").getContext("2d"),
			height, width, pixelData, i, x, y, luma,
			map = {hint: {x: [[0]], y: [[0]]}, mask: []};

		height = width = parseInt(window.getComputedStyle(icon).getPropertyValue("font-size")); // px equivalent of 1em or whatever icon height is

		//Prepare canvas
		tCtx.canvas.width = width;
		tCtx.canvas.height = height;
		tCtx.fillStyle = "white";
		tCtx.fillRect(0, 0, width, height);

		//Draw text icon on to canvas
		tCtx.font = text.font;
		tCtx.textAlign = "center";
		tCtx.textBaseline = "middle";
		tCtx.fillStyle = "black";
		tCtx.fillText(icon.innerText || JSON.parse(text.content), width / 2, height / 2);

		//console.log(tCtx.canvas.toDataURL());

		map.mask = new Array(height);
		map.hint.y = new Array(height);
		map.hint.x = new Array(width);

		// Convert pixel colours to grayscale and if the luma byte has
		// less than half value (i.e. towards black) then set that as the
		// accepted answer. We're effectively reducing the bit-depth to 1.
		pixelData = tCtx.getImageData(0, 0, width, height).data;
		for (i = 0; i < pixelData.length; i += 4) {
			y = Math.floor((i / 4) / width);
			x = (i / 4) % width;

			if (!map.mask[y]) {
				map.mask[y] = (new Array(width)).fill(false);
			}

			// https://en.wikipedia.org/wiki/Relative_luminance
			// https://stackoverflow.com/a/596241
			luma = (pixelData[i + 0] * 0.2126)
				+ (pixelData[i + 1] * 0.7152)
				+ (pixelData[i + 2] * 0.0722);

			map.mask[y][x] = luma < 213; // lose approx brightest 1/3

			//Count consecutive cells
			// First ensure there are appropriate arrays to increment, creating them if necessary
			if (!map.hint.x[x]) {
				map.hint.x[x] = [0];
			}

			if (!map.hint.y[y]) {
				map.hint.y[y] = [0];
			}

			if (map.mask[y][x]) {
				// For true values, simply bumpt up previous value
				map.hint.x[x][map.hint.x[x].length - 1] += 1;
				map.hint.y[y][map.hint.y[y].length - 1] += 1;
			} else {
				// For false values, add start a new count unless it's already at 0
				if (map.hint.x[x][map.hint.x[x].length - 1]) {
					map.hint.x[x].push(0);
				}

				if (map.hint.y[y][map.hint.y[y].length - 1]) {
					map.hint.y[y].push(0);
				}
			}
		}

		//Remove trailing 0 from counts
		[map.hint.x, map.hint.y].forEach(function (hint) {
			hint.forEach(function (item) {
				if (item.length > 1 && !item[item.length - 1]) {
					item.pop();
				}
			});
		});

		return map;
	}

	function buildTable (answerMap) {
		var table = document.createElement("table"),
			tr = table.appendChild(document.createElement("tr")), 
			th = tr.appendChild(document.createElement("th"));

		th.innerText = answerMap.hint.x.length + "/" + answerMap.hint.y.length;

		answerMap.hint.x.forEach(function (header) {
			var th = tr.appendChild(document.createElement("th"));
			th.innerText = header.join(", ");
		});

		answerMap.mask.forEach(function (row, y) {
			var tr = table.appendChild(document.createElement("tr")),
				th = tr.appendChild(document.createElement("th"));

			th.innerText = answerMap.hint.y[y].join(", ");

			row.forEach(function(col, x) {
				var td = tr.appendChild(document.createElement("td"));

				if (answerMap.mask[y][x]) {
					td.className = "answer";
				}

				td.addEventListener("click", selected);
			});
		});

		return table;
	}

	return {
		new: function (element, parentName) {
			icon = (typeof element === "string" && document.getElementById(element)) || element;
			tableParent = typeof parentName === "string" && document.getElementById(parentName) || parentName;

			icon.className = "";
			tableParent.classList.remove("show");

			setRandom(icon);

			tableParent.innerHTML = "";
			tableParent.appendChild(buildTable(convertToMap()));
		},
		setSize: function (value) {
			icon.style.fontSize = value;
		},
		show: function () {
			if (icon.classList.contains("show") || confirm("Are you sure?")) {
				[icon, tableParent].forEach(function(element){
					element.classList.toggle("show");
				});
			}
		}
	};
}());
