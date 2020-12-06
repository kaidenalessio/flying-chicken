const LEVELS = [
	{
		DISTANCE: 500,
		NOISE_FN: Math.noise1,
		BARRIER_GAP: 400,
		SCROLL_SPEED: 5
	},
	{
		DISTANCE: 1500,
		NOISE_FN: Math.noise2,
		BARRIER_GAP: 360,
		SCROLL_SPEED: 8
	},
	{
		DISTANCE: Infinity,
		NOISE_FN: Math.noise2,
		BARRIER_GAP: 320,
		SCROLL_SPEED: 7,
		onRespawn() {
			if (Math.random() > 0.8) {
				Manager.shiftBarrierInterval(Math.PI / 3);
			}
		}
	}
];

const Global = {
	SCORE_MULTIPLIER: 0.2, // score = distance traveled * score multiplier
	ASPECT_RATIO: {
		WIDTH: 960,
		HEIGHT: 540,
		getRatio() {
			return {
				w: Stage.w / this.WIDTH,
				h: Stage.h / this.HEIGHT
			};
		}
	},
	MUTE: false,
	BLOCK_WIDTH: 40,
	CAMERA_SHAKE: true,
	OBSTACLE_HEIGHT: 140,
	PLAYER: {
		SCALE: 0.25,
		GRAVITY: 0.48,
		FLY_SPEED: -6,
		HITBOX_WIDTH: 72,
		HITBOX_HEIGHT: 30
	},
	TRAIL: {
		WIDTH: 4,
		LENGTH: 16,
		LIFETIME: 120, // in 60 fps
		INTERVAL: 6
	},
	CRASH_RING: {
		RADIUS: 100,
		SEGMENT: 4 * Math.PI
	},
	RATIO: null, // will be set to Global.ASPECT_RATIO.getRatio();
	toggleMute() {
		this.MUTE = !this.MUTE;
		if (this.MUTE) {
			Sound.stopAll();
		}
		else {
			// Sound.loop('bgm');
		}
	},
	onStart() {
		this.RATIO = this.ASPECT_RATIO.getRatio();

		for (const level in LEVELS) {
			level.DISTANCE *= this.RATIO.w;
			level.BARRIER_GAP *= this.RATIO.h;
			level.SCROLL_SPEED *= this.RATIO.w;
		}

		this.BLOCK_WIDTH *= this.RATIO.w;
		this.OBSTACLE_HEIGHT *= this.RATIO.h;

		for (const key in this.PLAYER) {
			this.PLAYER[key] *= this.RATIO.h;
		}

		this.TRAIL_LENGTH = Math.max(8, this.TRAIL_LENGTH * this.RATIO.w);
		this.TRAIL_WIDTH = this.TRAIL_LENGTH / 4;
		this.TRAIL_LIFETIME *= this.RATIO.w;
		this.TRAIL_INTERVAL = Math.max(this.TRAIL_INTERVAL, Math.floor(this.TRAIL_INTERVAL * 960 / Stage.w));

		this.CRASH_RING.RADIUS *= this.RATIO.h;
		this.CRASH_RING.SEGMENT *= this.RATIO.h;

		Font.onAll((font) => {
			font.size *= this.RATIO.h;
		});
	}
};

const createBgCanvas = () => {
	const pattern = Draw.getImage('bgPattern');
	const scale = 0.5 * Global.RATIO.H;
	const patW = pattern.width * scale;
	const patH = pattern.height * scale;
	const cols = Math.floor(Stage.w / patW) + 3;
	const rows = Math.floor(Stage.h / patH) + 1;
	return Draw.createCanvas(cols * patW, rows * patH, (w, h) => {
		for (let i = 0; i <= cols; i++) {
			for (let j = 0; j <= rows; j++) {
				Draw.image(pattern, i * patW, j * patH, scale, scale);
			}
		}
	});
};

const rectIntersects = (rectA, rectB) => {
	return rectA.x <= rectB.x + rectB.w && rectA.x + rectA.w >= rectB.x
		&& rectA.y <= rectB.y + rectB.h && rectA.y + rectA.h >= rectB.y;
};

const rectContainsPoint = (rect, p) => {
	return p.x >= rect.x && p.x < rect.x + rect.w
		&& p.y >= rect.y && p.y < rect.y + rect.h;
};

class Trail {
	constructor(x, y, angle) {
		this.x = x;
		this.y = y;
		this.angle = angle;
		this.end = Math.polar(this.x, this.y, Global.TRAIL_LENGTH, this.angle);
		this.life = Global.TRAIL_LIFETIME;
	}
	render() {
		if (this.life > 0) {
			// Draw.setColor(C.white); // set color before all trails rendered instead
			if (this.life < Global.TRAIL_LIFETIME / 4) {
				Draw.setAlpha(this.life / Global.TRAIL_LIFETIME * 4);
			}
			this.x -= Manager.scrollSpeed * Time.clampedDeltaTime;
			this.end.x -= Manager.scrollSpeed * Time.clampedDeltaTime;
			// Draw.ctx.lineWidth = 4; // set line width before all trails rendered instead
			Draw.ctx.beginPath();
			Draw.ctx.moveTo(this.x, this.y);
			Draw.ctx.lineTo(this.end.x, this.end.y);
			Draw.ctx.stroke();
			// Draw.ctx.lineWidth = 1; // reset line width after all trails rendered instead
			// Draw.setAlpha(1); // reset alpha after all trails rendered instead
			this.life -= Time.clampedDeltaTime;
		}
	}
}

Manager.init({
	methods: {
		inputInCanvas() {
			return Input.x >= 0 && Input.x < Stage.w
				&& Input.y >= 0 && Input.y < Stage.h;
		},
		getInputFly() {
			if (Input.keys[Input.SPACE].held) {
				return true;
			}
			return Input.anyKeyHold() && this.inputInCanvas();
		},
		getInputTap() {
			if (Input.anyKeyDown()) {
				let uiTap = false;
				for (const button of this.uiButtons) {
					if (rectContainsPoint(button, Input.position)) {
						button.click();
						uiTap = true;
						break;
					}
				}
				if (uiTap) return false;
				if (Input.keys[Input.SPACE].pressed) return true;
				if (this.inputInCanvas()) return true;
			}
			return false;
		},
		createButton(x, y, w, h, text, onClick) {
			x -= w / 2;
			y -= h / 2;
			const button = { x, y, w, h };
			button.click = onClick.bind(button);
			button.getText = null;
			if (text instanceof Function) {
				button.getText = text.bind(button);
			}
			else {
				button.getText = () => text;
			}
			this.uiButtons = this.uiButtons || [];
			this.uiButtons.push(button);
			return button;
		}
	},
	onStart() {
		this.createButton(32, 32, 100, 50, () => { Global.MUTE? 'UNMUTE' : 'MUTE' }, () => {
			Global.toggleMute();
		});
	},
	onRestart() {
	},
	onUpdate() {
	},
	onRender() {
		for (const button of this.uiButtons) {
			Draw.setColor(C.white);
			Draw.rect(button.x, button.y, button.w, button.h);
			Draw.setFont(Font.m);
			Draw.setColor(C.black);
			Draw.setHVAlign(Align.c, Align.m);
			Draw.text(button.x + button.w / 2, button.y + button.h / 2, button.getText());
		}
	}
});

window.onload = () => {
	startGame({
		// addImages: {
		// 	logo: 'logoImage',
		// 	shoe: 'shoeImage',
		// 	shoeLarge: 'shoeLargeImage',
		// 	bgPattern: 'bgPatternImage'
		// },
		// addAudios: {
		// 	fly: 'flyAudio',
		// 	bgm: 'bgmAudio',
		// 	crash: 'crashAudio'
		// }
	});
};