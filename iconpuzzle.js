/*globals iconpuzzle:true */
/* exported iconpuzzle */ 
iconpuzzle = (function() {
	const icons = [
			"❤️",
			"✨",
			"✔️",
			"⏳",
			"🔪",
			"⚔️",
			"🍒",
			"📞",
			"📺",
			"📱",
			"💻",
			"💡",
			"💣",
			"💎",
			"👑",
			"👻",
			"👾"
		];
	let icon, tableParent;

	const setRandom = icon => {
		const image = icons[Math.floor(Math.random() * icons.length)];
		
		icon.innerText = typeof image === "string" ? image : "";

		if (typeof image !== "string") {
			Object.keys(image).forEach(k => { icon[k] = image[k]; });
		}
	}

	const selected = () => {
		this.classList.toggle("selected");
	}

	const convertToMap = () => {
		const text = window.getComputedStyle(icon, ":before"),
			tCtx = new OffscreenCanvas(width, height).getContext("2d"),
			map = {hint: {x: [[0]], y: [[0]]}, mask: []},		
			width = parseInt(window.getComputedStyle(icon).getPropertyValue("font-size")), // px equivalent of 1em or whatever icon height is
			height = width;

		//Prepare canvas
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
		const pixelData = tCtx.getImageData(0, 0, width, height).data;

		for (let i = 0; i < pixelData.length; i += 4) {
			let y = Math.floor((i / 4) / width),
				x = (i / 4) % width;

			if (!map.mask[y]) {
				map.mask[y] = (new Array(width)).fill(false);
			}

			// https://en.wikipedia.org/wiki/Relative_luminance
			// https://stackoverflow.com/a/596241
			const luma = (pixelData[i + 0] * 0.2126)
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

	const buildTable = (answerMap) => {
		const table = document.createElement("table"),
			tr = table.appendChild(document.createElement("tr")), 
			th = tr.appendChild(document.createElement("th"));

		th.innerText = answerMap.hint.x.length + "/" + answerMap.hint.y.length;

		answerMap.hint.x.forEach(header => {
			const th = tr.appendChild(document.createElement("th"));
			th.innerText = header.join(", ");
		});

		answerMap.mask.forEach((row, y) => {
			const tr = table.appendChild(document.createElement("tr")),
				th = tr.appendChild(document.createElement("th"));

			th.innerText = answerMap.hint.y[y].join(", ");

			row.forEach((col, x) => {
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
		new: (element, parentName) => {
			icon = (typeof element === "string" && document.getElementById(element)) || element;
			tableParent = typeof parentName === "string" && document.getElementById(parentName) || parentName;

			icon.className = "";
			tableParent.classList.remove("show");

			setRandom(icon);

			tableParent.innerHTML = "";
			tableParent.appendChild(buildTable(convertToMap()));
		},
		setSize: value => {
			icon.style.fontSize = value;
		},
		show: () => {
			if (icon.classList.contains("show") || confirm("Are you sure?")) {
				[icon, tableParent].forEach(element => {
					element.classList.toggle("show");
				});
			}
		}
	};
}());
