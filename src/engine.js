Math.range = (a, b) => a + Math.random() * (b - a);
Math.noise1 = (i) => 0.5 + 0.5 * Math.sin(Math.cos(i) * Math.sin(i / 2));
Math.noise2 = (i) => 0.5 + 0.5 * Math.tan(Math.cos(i) * Math.sin(i / 2));
Math.choose = (...args) => args[Math.floor(Math.random() * args.length)];
Math.clamp = (value, min, max) => Math.min(Math.max(value, Math.min(min, max)), Math.max(min, max));
Math.map = (value, min1, max1, min2, max2) => min2 + (value - min1) / (max1 - min1) * (max2 - min2);
Math.mapClamped = (value, min1, max1, min2, max2) => Math.clamp(Math.map(value, min1, max1, min2, max2), min2, max2);
Math.angleBetween = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1);
Math.polar = (x, y, radius, angle) => {
	x += Math.cos(angle) * radius;
	y += Math.sin(angle) * radius;
	return { x, y };
};

const Events = {
	on(object, eventName, callback) {
		object.events = object.events || {};
		object.events[eventName] = object.events[eventName] || [];
		object.events[eventName].push(callback);
		return callback;
	},
	off(object, eventName, callback) {
		if (object.events) {
			const callbacks = object.events[eventName];
			if (callbacks) {
				const newCallbacks = [];
				for (const _callback of callbacks) {
					if (_callback !== callback) {
						newCallbacks.push(_callback);
					}
				}
				object.events[eventName] = newCallbacks;
			}
		}
	},
	trigger(object, eventName) {
		if (object.events) {
			const callbacks = object.events[eventName];
			if (callbacks) {
				for (const callback of callbacks) {
					callback.call(object);
				}
			}
		}
	}
};

const Time = {
	FPS: 0,
	time: 0,
	deltaTime: 0,
	activeTime: 0,
	frameCount: 0,
	clampedDeltaTime: 0,
	unscaledDeltaTime: 0,
	start(t=window.performance.now()) {
		this.time = t;
	},
	update(t=window.performance.now()) {
		this.unscaledDeltaTime = t - this.time;
		this.deltaTime = this.unscaledDeltaTime * 0.06;
		this.clampedDeltaTime = Math.min(2, this.deltaTime);
		this.time = t;
		this.activeTime += this.unscaledDeltaTime;
		this.frameCount++;
		if (this.frameCount % 20 === 0) {
			this.FPS = Math.floor(this.deltaTime * 60);
		}
	}
};

const Input = {
	SPACE: 0,
	CLICK: 1,
	TAP: 2,
	keys: [],
	position: {
		x: 0,
		y: 0,
	},
	x: 0,
	y: 0,
	canvas: null, // canvas as target element to offset mouse position to
	touchCount: 0,
	init(canvas) {
		this.keys.length = 0;
		this.keys.push(this.create()); // for space
		this.keys.push(this.create()); // for left click
		this.keys.push(this.create()); // for touch/tap
		window.addEventListener('keyup', (e) => { if (e.keyCode === 32) this.keys[this.SPACE].up(); });
		window.addEventListener('keydown', (e) => { if (e.keyCode === 32) this.keys[this.SPACE].down(); });
		window.addEventListener('mouseup', (e) => { this.updateMouse(e); if (e.button === 0) this.keys[this.CLICK].up(); });
		window.addEventListener('mousemove', (e) => { this.updateMouse(e); });
		canvas.addEventListener('mousedown', (e) => { this.updateMouse(e); if (e.button === 0) this.keys[this.CLICK].down(); });
		window.addEventListener('touchend', (e) => { this.updateTouch(e); this.keys[this.TAP].up(); });
		window.addEventListener('touchmove', (e) => { this.updateTouch(e); });
		canvas.addEventListener('touchstart', (e) => { this.updateTouch(e); this.keys[this.TAP].down(); });
		canvas.addEventListener('contextmenu', (e) => e.preventDefault());
		this.canvas = canvas;
	},
	updatePosition(x, y) {
		const b = this.canvas.getBoundingClientRect();
		this.x = this.position.x = x - b.x;
		this.y = this.position.y = y - b.y;
	},
	updateMouse(e) {
		this.updatePosition(e.clientX, e.clientY);
	},
	updateTouch(e) {
		this.touchCount = e.changedTouches.length;
		e = e.changedTouches[e.changedTouches.length - 1];
		this.updatePosition(e.clientX, e.clientY);
	},
	reset() {
		for (const key of this.keys) {
			key.reset();
		}
		this.touchCount = 0;
	},
	anyKeyHold(i) {
		if (this.touchCount > 0) {
			return this.keys[this.TAP].held;
		}
		for (const key of this.keys) {
			if (key.held) return true;
		}
		return false;
	},
	anyKeyDown(i) {
		if (this.touchCount > 0) {
			return this.keys[this.TAP].pressed;
		}
		for (const key of this.keys) {
			if (key.pressed) return true;
		}
		return false;
	},
	create() {
		return {
			held: false,
			pressed: false,
			released: false,
			repeated: false,
			up() {
				this.held = false;
				this.released = true;
			},
			down() {
				if (!this.held) {
					this.held = true;
					this.pressed = true;
				}
				this.repeated = true;
			},
			reset() {
				this.pressed = false;
				this.released = false;
				this.repeated = false;
			}
		};
	}
};

const C = {
	black: 'black',
	crimson: 'crimson',
	white: 'white'
};

const Align = {
	l: 'left',
	r: 'right',
	c: 'center',
	t: 'top',
	b: 'bottom',
	m: 'middle'
};

const Font = {
	bold: 'bold ',
	generate(name, size, style='', family='Lilita One, sans-serif') {
		this[name] = { size, style, family };
	},
	init() {
		this.generate('xxl', 64);
		this.generate('xl',  48);
		this.generate('l',   30);
		this.generate('ml',  24);
		this.generate('m',   20);
		this.generate('sm',  16);
		this.generate('s',   10);
		this.generate('xxlb', 64, this.bold);
		this.generate('xlb',  48, this.bold);
		this.generate('lb',   30, this.bold);
		this.generate('mlb',  24, this.bold);
		this.generate('mb',   20, this.bold);
		this.generate('smb',  16, this.bold);
		this.generate('sb',   10, this.bold);
	},
	onAll(callbackFn) {
		for (const key in this) {
			const value = this[key];
			if (typeof value === 'object') {
				if (value.size !== undefined && value.style !== undefined && value.family !== undefined) {
					callbackFn(this[key]);
				}
			}
		}
	}
};

Font.init();

const Draw = {
	ctx: null,
	images: {},
	defaultCtx: null,
	currentFont: Font.m,
	init(ctx) {
		this.ctx = this.defaultCtx = ctx;
	},
	setAlpha(n) {
		this.ctx.globalAlpha = n;
	},
	setColor(c) {
		this.ctx.strokeStyle = this.ctx.fillStyle = c;
	},
	rect(x, y, w, h, isStroke) {
		isStroke? this.ctx.strokeRect(x, y, w, h) : this.ctx.fillRect(x, y, w, h);
	},
	circle(x, y, r, isStroke) {
		this.ctx.beginPath();
		this.ctx.arc(x, y, r, 0, 2 * Math.PI);
		isStroke? this.ctx.stroke() : this.ctx.fill();
	},
	setFont(font) {
		this.ctx.font = `${font.style}${font.size}px ${font.family}, serif`;
		this.currentFont = font;
	},
	setHAlign(align) {
		this.ctx.textAlign = align;
	},
	setVAlign(align) {
		this.ctx.textBaseline = align;
	},
	setHVAlign(halign, valign) {
		this.ctx.textAlign = halign;
		this.ctx.textBaseline = valign;
	},
	text(x, y, text) {
		this.ctx.fillText(text, x, y);
	},
	addImage(name, img) {
		this.images[name] = img;
	},
	getImage(name) {
		return this.images[name];
	},
	image(name, x, y, xscale=1, yscale=1, angle=0, originX=0.5, originY=0.5) {
		if (!(name instanceof Image || name instanceof HTMLCanvasElement)) {
			name = this.images[name];
		}
		originX *= -name.width;
		originY *= -name.height;
		this.ctx.save();
		this.ctx.translate(x, y);
		this.ctx.rotate(angle);
		this.ctx.scale(xscale, yscale);
		this.ctx.drawImage(name, originX, originY);
		this.ctx.restore();
	},
	createCanvas(w, h, drawFn) {
		const canvas = document.createElement('canvas');
		canvas.width = w;
		canvas.height = h;
		this.ctx = canvas.getContext('2d');
		drawFn(w, h);
		this.ctx = this.defaultCtx;
		return canvas;
	},
	clear() {
		this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
	}
};

const Sound = {
	audios: {},
	addAudio(name, audio) {
		this.audios[name] = audio;
	},
	getAudio(name) {
		return this.audios[name];
	},
	play(name) {
		this.audios[name].currentTime = 0;
		this.audios[name].play();
	},
	loop(name) {
		if (!this.isPlaying(name)) {
			this.startLoop(name);
		}
	},
	stop(name) {
		if (this.isPlaying(name)) {
			this.stopLoop(name);
		}
	},
	startLoop(name) {
		this.audios[name].loop = true;
		this.audios[name].currentTime = 0;
		this.audios[name].play();
	},
	stopLoop(name) {
		this.audios[name].pause();
		this.audios[name].loop = false;
		this.audios[name].currentTime = 0;
	},
	isPlaying(name) {
		return !this.audios[name].paused;
	},
	stopAll() {
		for (const name in this.audios) {
			this.stop(name);
		}
	}
};

const Stage = {
	w: 300,
	h: 150,
	mid: {
		w: 150,
		h: 75
	},
	canvas: null,
	pixelRatio: 2,
	init(canvas, pixelRatio=this.pixelRatio) {
		this.canvas = canvas;
		const b = this.canvas.getBoundingClientRect();
		this.w = b.width;
		this.h = b.height;
		this.mid.w = this.w / 2;
		this.mid.h = this.h / 2;
		this.setPixelRatio(pixelRatio);
	},
	setPixelRatio(n) {
		this.pixelRatio = n;
		this.canvas.width = this.w * this.pixelRatio;
		this.canvas.height = this.h * this.pixelRatio;
		// this.canvas.style.width = `${this.w}px`;
		// this.canvas.style.height = `${this.h}px`;
		this.canvas.getContext('2d').resetTransform();
		this.canvas.getContext('2d').scale(this.pixelRatio, this.pixelRatio);
	}
};

const Manager = {
	restarting: false,
	init(options={}) {
		if (options.onStart) Events.on(this, 'start', options.onStart);
		if (options.onRestart) Events.on(this, 'restart', options.onRestart);
		if (options.onUpdate) Events.on(this, 'update', options.onUpdate);
		if (options.onRender) Events.on(this, 'render', options.onRender);
		if (options.methods) {
			for (const key in options.methods) {
				this[key] = options.methods[key].bind(this);
			}
		}
		if (options.onInit) options.onInit.call(this);
	},
	start() {
		Events.trigger(this, 'start');
	},
	restart() {
		Events.trigger(this, 'restart');
		this.restarting = true;
	},
	update() {
		if (!this.restarting) {
			Events.trigger(this, 'update');
		}
	},
	render() {
		if (!this.restarting) {
			Events.trigger(this, 'render');
		}
		else {
			this.restarting = false;
		}
	}
};

const Runner = {
	isRunning: false,
	start() {
		if (!this.isRunning) {
			this.isRunning = true;
			Time.start();
			this.run();
		}
	},
	stop() {
		this.isRunning = false;
		window.cancelAnimationFrame(Runner.run);
	},
	run() {
		Time.update();
		Manager.update();
		Draw.clear();
		Manager.render();
		Input.reset();
		if (Runner.isRunning) {
			window.requestAnimationFrame(Runner.run);
		}
	}
};

const startGame = (options={}) => {
	options.gameCanvasId = options.gameCanvasId || 'gameCanvas';
	if (options.addImages) {
		for (const key in options.addImages) {
			Draw.addImage(key, document.getElementById(options.addImages[key]));
		}
	}
	if (options.addAudios) {
		for (const key in options.addAudios) {
			Sound.addAudio(key, document.getElementById(options.addAudios[key]));
		}
	}
	Stage.init(document.getElementById(options.gameCanvasId));
	Input.init(Stage.canvas);
	Draw.init(Stage.canvas.getContext('2d'));
	Manager.start();
	Manager.restart();
	Runner.start();
};