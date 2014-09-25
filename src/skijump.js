////////////////////////////// ZASOBY
var surface		=	new gCanvas(document.getElementById('main_canvas'));
var background	=	new gCanvas(document.createElement('canvas'), 
								new Rect(0, 0, surface.bounds.W * 5, surface.bounds.H * 4));
fillRect(background.ctx, background.bounds, new gColor(0, 0, 0, 1));

var content = {
	player_tile	: 	[ './content/jumper_tile_' + getRandom(0, 2) + '.png', new Vec2(32, 32) ],
	flags		: 	[ './content/flags.png', new Vec2(32, 32) ],
	map_tile	:	[ './content/map.png', new Vec2(16, 16) ],
	ground_tile	: 	[ './content/bracket.png', new Vec2(64, 32) ],
	trees		: 	[ './content/trees.png', new Vec2(25, 55) ],
	hud			: 	[ './content/hud.png', new Vec2(32, 32) ],
	people		:	[ './content/people.png', new Vec2(10, 16) ],
	// ELEMENTY MAPY
	platform	:	[ './content/platform.png', new Vec2(82, 81) ]
};
for(key in content)
	content[key][0] = ContentManager.registerImage(content[key][0]);
ContentManager.registerLoadCallback(createTiles);

////////////////////////////// CONFIGI
var jumper	=	null;
var config = {
	SCALE					:	new Vec2(2.2, 2.2),
	HUD_SCALE				:	new Vec2(1.5, 1.5),
	SPEEDING				:	.09,
	WIND_SPEEDING			:	0,
	GO_FAR_PROC				:	1.0,
	DEFAULT_CAM_MARGIN		:	new Vec2(30, 60),
	PREFERRED_CAM_MARGIN	:	new Vec2(0, 10),
	LAND_ANGLE				:	new Vec2(-10, 10),
	JURY_COUNT				:	5,
	// FAKE UEHEHEHEH NIE UZYWANEEE
	NICK					:	"",
	SCORE					:	0,
	DISTANCE_POINTS			:	-1,
	STYLE_NOTES				:	[],
	// Informacje nt. hudu
	FLAG_CHOOSER_ICON_SIZE	:	new Vec2(28, 28)
};

function Jury() {}
Jury.getDistPoints = function() {
	var INIT_DIST_POINTS		=	120;
	var ADD_POINT_SCALE			=	2.2;
	var	CONSTRUCT_POINT			=	120;
	
	var distance_points = parseInt(INIT_DIST_POINTS + (jumper.status.distance - CONSTRUCT_POINT) * ADD_POINT_SCALE);
	return distance_points < 0 ? 0 : distance_points;
}
Jury.getStyleNotes = function() {
	var score_array 	= 	[ ];
	var points			=	(jumper.getAngleMargin(jumper.status.landing_angle) * 20.0);
	
	if(parseInt(points) < points)
		points = parseInt(points) + .5;
	points = parseInt(points);
	
	if(points > 20)
		points = 20;
	if(points < 0)
		points = 0;
	
	for(var i = 0;i < config.JURY_COUNT;++i)
		score_array[i] = getRandom(-1, 1) + points;
	return score_array;
}
Jury.calcNotes = function() {
	var score = jumper.score;
	
	score.distance_points 	= 	this.getDistPoints();
	score.style_notes		= 	this.getStyleNotes();
		
	// Sumacja punktów
	score.score = score.distance_points;
	for(var i = 0; i < config.JURY_COUNT; ++i)
		score.score += score.style_notes[i];
			
	screen_shadow = true;
	jumper.score.updateOwnHash();
}

/** RENDERING */
function Cam(obj) {
	this.X	=	0;
	this.Y	=	0;
	this.W	=	500;
	this.H	=	400;
	this.margin		=	new	Vec2(0, 0);
	this.obj		=	obj;
	
	this.ctx	=	surface.ctx;
	this.update = function() {
		this.X = -this.obj.pos.X * .97 + this.margin.X;
		this.Y = -this.obj.pos.Y * .98 + this.margin.Y;
	}
	this.pushCam = function() {
		this.update();
		this.ctx.save();
		this.ctx.scale(config.SCALE.X, config.SCALE.Y);
		this.ctx.translate(this.X, this.Y);
	}
	this.popCam = function() {
		this.ctx.restore();
	}
}
var cam = null;

function TexturePath(vertices_count, formula, textures, bounds) {
	this.formula 		= 	formula;
    this.textures 		= 	textures;
    this.vertices_count = 	vertices_count;
    this.bounds 		= 	bounds;
    
    this.tex_center     = 	null;
    this.segment_bounds =	null;
    
    this.spaces         = 	-1.0;          // odstępy między teksturami
    this.height_margin  = 	0.0;
    
    this.fit_textures   = 	true;
    this.rotation       = 	true;          // czy każdy element ma być rotatowany?
                                                                       
    var INVISIBLE_FIRST_SEGMENT	=	-1;
    
    this.prev_segment   = 	new Vec2(0, 0);
    this.before_rotate  = 	new Vec2(0, 0);
    this.segment       	= 	new Vec2(0, 0);
    
    this.draw = function(first_index, destination, start_pos) {
        for (var i = 0, l = this.textures.length; i < l; ++i)
            this.textures[i].center = this.tex_center;
        
        this.prev_segment.clear();
        this.before_rotate.clear();
        this.segment.clear();
        
        var angle = 0.0;
        
        if (this.spaces == -1)
            this.spaces = this.segment_bounds.X;
        
        for (var i = INVISIBLE_FIRST_SEGMENT + first_index; 
				i < this.vertices_count + first_index; ++i) {
            this.segment.copy(TexturePath.translatePos(start_pos, i, this.spaces, this.formula, this.bounds));
            
            if (this.rotation) {
                angle = (Math.atan2(
							this.segment.Y - this.prev_segment.Y,
							this.segment.X - this.prev_segment.X) * 180 / Math.PI);
            } else
                angle = 0.0;
            
            this.before_rotate.copy(this.prev_segment);
            this.prev_segment.copy(this.segment);
            
            if (i == INVISIBLE_FIRST_SEGMENT)
                continue;
            
            if (this.height_margin != 0) {
                var rad = toRad(angle + 90.0);
                
                this.segment.X += Math.cos(rad) * this.height_margin;
                this.segment.Y += Math.sin(rad) * this.height_margin;
            }
            
            var rotated_w = this.segment_bounds.X;
            if (this.fit_textures) {
                var a = this.segment.X - this.before_rotate.X;
                var b = this.segment.Y - this.before_rotate.Y;
                
                rotated_w = Math.sqrt(a * a + b * b);
            }
            
            if (rotated_w < this.segment_bounds.X * 2) {
				var tex = this.textures[i - parseInt(i / this.textures.length) * this.textures.length];
				
				tex.bounds.W = rotated_w;
				tex.bounds.H = this.segment_bounds.Y;
				
                drawRotatedCanvas(
							tex,
							destination,
							this.segment,
							angle,
							this.tex_center);
            }
        }
    }
    
    this.setHeightMargin = function(margin) {
        this.height_margin = margin;
        return this;
    }
    this.setSpaces = function(spaces) {
        this.spaces = spaces;
        return this;
    }
    this.enableFitTextures = function(fit_textures) {
        this.fit_textures = fit_textures;
        return this;
    }
    this.enableRotation = function(rotation) {
        this.rotation = rotation;
        return this;
    }
    this.setSegmentBounds = function(segment_bounds) {
        this.segment_bounds = segment_bounds;
        return this;
    }
    this.setTextureCenter = function(tex_center) {
        this.tex_center = tex_center;
        return this;
    }
}
TexturePath.translatePos = function(start_pos, index, spaces, formula, bounds) {
	return new Vec2(
			start_pos.X + index * spaces,
            start_pos.Y
                    + formula.getValue(1.0 - index * spaces / bounds.W) * bounds.H);
}

/** MAPA */
var	JUMPER_BOUNDS		=	new Rect(0, 0, 16, 18);
var	SKIJUMP_BOUNDS		=	new	Rect(0, 0, 600, 350);
var	GROUND_BOUNDS		=	new	Rect(SKIJUMP_BOUNDS.W, SKIJUMP_BOUNDS.H, 1360, 700);

var GROUND_MARGIN = 10;
var STATE	=	{
	ON_DESK            : 0,
	ON_SKIJUMP         : 1,
	ON_RAMP            : 2,
	ON_WIND            : 3,
	ON_GROUND          : 4,
	DEAD               : 5
};

/** Funkcje obliczające trajektorie skoku */
function SkijumpFormula() {
	this.getValue = function(x) {
		return 1.0 - Math.pow(x - .05, 2);
	}
}

var FLAT_PROC = .85;
function GroundFormula() {
	this.getValue = function(x) {
		var H = 1.0;
		var value = 0;
		
		x = 1.0 - x;
		if (x < 0)
			value = H;
		else if (x >= 0 && x < FLAT_PROC / 2)
			value = H * (1.0 - 2.0 * Math.pow(x / FLAT_PROC, 2));
		else if (x >= FLAT_PROC / 2.0 && x < FLAT_PROC)
			value = 2.0 * H * Math.pow(x / FLAT_PROC - 1, 2);
		
		return 1.0 - value + .04;
	}
}
function FlightPath(jumper) {
	this.jumper	=	jumper;
    this.G      = 	4.0;
    
	this.time   = 	0;
    this.v_0   	= 	new Vec2(-1.0, -1.0);
    this.s_0   	= 	new Vec2(-1.0, -1.0);
    
    this.reset = function() {
		this.time = 0;
		this.v_0 = new Vec2(-1.0, -1.0);
		this.s_0 = new Vec2(-1.0, -1.0);
	}
    this.update = function() {
        if (this.jumper == null)
            return;
        
        var angle = toRad(this.jumper.angle);
        if (this.v_0.X == -1) {
            var v = this.jumper.v * this.G;
            this.v_0 = new Vec2(Math.cos(angle) * v, 
								Math.sin(angle) * v);
            this.s_0.copy(this.jumper.pos);
            
        }
        
        this.time += .15;
        this.v_0.X += config.WIND_SPEEDING / 4 + jumper.getAngleMargin(jumper.angle) * .05;
        
        this.jumper.pos.X = this.s_0.X + 
									this.v_0.X * this.time;
        this.jumper.pos.Y = this.s_0.Y + 
									this.v_0.Y * this.time + 
									this.G / 2.0 * Math.pow(this.time, 2);
    }
}
// Przeciw hackowaniu
function JumperScore() {
	this.nick				=	"";
	this.score				=	0;
	this.distance_points	=	-1;
	this.style_notes		=	[	];
	this.old_score_hash		=	"";
	this.flag				=	6;
	
	this.reset = function() {
		this.distance_points = this.score = -1;
		this.style_notes = [ ];
	}
	this.generateNewHash = function() {
		var str = "";
		var keys = [ "nick", "score", "distance_points", "style_notes" ];
		for(i in keys)
			if (this.hasOwnProperty(keys[i]))
				str += keys[i] + this[keys[i]];
		return CryptoJS.MD5(str).toString();
	}
	this.updateOwnHash = function() {
		this.old_score_hash = this.generateNewHash();
	}
	this.isEqualWithOld = function() {
		return this.generateNewHash() == this.old_score_hash;
	}
	
	this.updateOwnHash();
};
function JumperFlightStatus(jumper) {
	this.on_ground		=	false;
	this.dead			=	false;
	this.on_wind		=	false;
	this.pause			=	false;
	
	this.ski_formula	=	new	SkijumpFormula();
	this.ground_formula	=	new GroundFormula();
	
	this.active_formula	=	this.ski_formula;
	
	this.skijump_proc	=	0.0;
	this.ground_proc	=	0.0;
	this.landing_angle	=	0.0;
	
	this.distance		=	0;
	this.ramp_speed		=	0;
	
	this.jumper			=	jumper;
	this.flight_path	=	new FlightPath(this.jumper);
	
	this.reset = function() {
		this.active_formula	=	this.ski_formula;
		
		this.on_ground =	
			this.dead =
			this.on_wind =
			this.pause = false;
	
		this.skijump_proc =
			this.ground_proc =
			this.landing_angle =
			this.distance = 
			this.ramp_speed = 0;
			
		this.flight_path.reset();
	}
	this.calcAngle = function() {
		if(!this.on_wind) {
			var new_pos = this.move(this.jumper.pos, 2, 0);
			this.move(this.jumper.pos, -2, 0);
			this.jumper.angle = Math.atan2(
									new_pos.Y - this.jumper.pos.Y, 
									new_pos.X - this.jumper.pos.X) * 180 / Math.PI;
			
		}
	}
	this.land = function() {
		if(this.jumper.flight_state == STATE.ON_GROUND || 
				this.jumper.flight_state == STATE.DEAD)
			return;
		if(this.skijump_proc >= config.GO_FAR_PROC && 
				this.jumper.pos.Y >= this.procToHeight(this.ground_formula, true)) {
			this.active_formula = this.ground_formula;
			this.distance = this.procToMeters(this.ground_proc);
			
			this.landing_angle	= this.jumper.angle;
			this.on_ground = true;
			
			this.dead = this.jumper.angle < config.LAND_ANGLE.X || 
							this.jumper.angle > config.LAND_ANGLE.Y;
			
			Jury.calcNotes();
		}
	}
	this.update = function() {
		this.on_wind	=	this.jumper.flight_state == STATE.ON_WIND;
		this.pause		=	this.jumper.flight_state == STATE.ON_DESK ||
								this.jumper.flight_state == STATE.ON_GROUND;
		this.calcAngle();
		this.land();
		
		if(this.jumper.flight_state != STATE.ON_DESK)
			this.move(this.jumper.pos, this.jumper.v, 0);
	}
	
	this.procToHeight = function(formula, on_ground) {
		var bounds = on_ground ? GROUND_BOUNDS : SKIJUMP_BOUNDS;
		return (on_ground ? SKIJUMP_BOUNDS.H : 0) + 
									formula.getValue(1.0 - (on_ground ? this.getGroundProc() : this.getSkijumpProc())) 
													* bounds.H - JUMPER_BOUNDS.H - 1;
	}
	this.getSkijumpProc = function() {
		return this.jumper.pos.X / SKIJUMP_BOUNDS.W;
	}
	this.getGroundProc = function() {
		return (this.jumper.pos.X - SKIJUMP_BOUNDS.W) / GROUND_BOUNDS.W;
	}
	this.procToMeters = function(proc) {
		return GROUND_BOUNDS.X / 2 * proc;
	}
	
	this.move = function(obj, v, proc_margin) {
		this.ground_proc = this.getGroundProc() + proc_margin;
		if(!this.on_wind) {
			obj.X += v;
			this.skijump_proc = this.getSkijumpProc() + proc_margin;
			obj.Y = this.procToHeight(this.active_formula, this.on_ground);
		} else
			this.flight_path.update();
		
		return new Vec2(this.jumper.pos.X, this.jumper.pos.Y);
	}
}
function Jumper() {
	this.status			=	null;
	this.score			=	new	JumperScore();
	this.flight_state	=	-1;
	
	this.pos			=	null;
	this.v				=	0;
	this.angle			=	0;
	this.vertical_angle	=	0;
	this.texture		=	null;
	
	this.jumped			=	false;
	
	this.reset = function() {
		this.pos 			= 	new Vec2(50, 0);
		this.v 				= 	4;
		this.angle 			= 	this.landing_angle = 0;
		this.texture		= 	null;
		this.flight_state 	= 	STATE.ON_DESK;
		this.jumped			=	false;
		
		this.score.reset();
		if(this.status == null)
			this.status = new JumperFlightStatus(this);
		else
			this.status.reset();
	}
	this.reset();
	
	this.isMaxAngle = function(v) {
		return (v > 0 && this.angle > 90) || 
					(v < 0 && this.angle < -30);
	}
	this.rotate = function(v) {
		if(this.isMaxAngle(v))
			return;
		switch(this.flight_state) {
			case STATE.ON_WIND:
				this.angle += v;
			break;
			case STATE.ON_SKIJUMP:
				this.vertical_angle += v;
			break;
		}
	}
	this.getHUDSpeed = function() {
		return this.v * 6;
	}
	this.updateState = function() {
		if(this.status.on_ground) {
			this.flight_state = this.status.dead ? STATE.DEAD : STATE.ON_GROUND
			this.v = this.status.ground_proc < .77 ? 3 : 0;
			
		} else if(this.status.skijump_proc > .85 && this.status.skijump_proc < config.GO_FAR_PROC) {
			this.flight_state = STATE.ON_RAMP;
			
		} else if(this.status.skijump_proc > config.GO_FAR_PROC) {
			this.flight_state = STATE.ON_WIND;
			this.v *= .65;
		}
		if(this.flight_state == STATE.ON_RAMP)
			this.status.ramp_speed = this.getHUDSpeed();
		
		// tekstura jest juz przeskalowana
		this.texture = content.player_tile.getImage(this.flight_state, 0);
	}
	this.goFar = function() {
		if(this.flight_state == STATE.ON_DESK) {
			this.flight_state = STATE.ON_SKIJUMP;
			this.vertical_angle = this.angle = 0;
			return;
		} else {
			if(this.jumped || 
				this.status.skijump_proc <= .85 || 
				this.status.skijump_proc >= 1.0)
				return;
			
			this.angle = this.vertical_angle;
			this.v *= 1.25;
			this.jumped = true;
		}
	}
	this.getAngleMargin = function(angle) {
		var margin = 1.0 - Math.abs(angle) / config.LAND_ANGLE.Y;
		return margin < 0 ? 0 : margin;
	}
	this.update = function() {
		if(!this.status.pause)
			this.v += (config.SPEEDING + config.WIND_SPEEDING) * 1.4 * this.getAngleMargin(this.vertical_angle);
		this.rotate(Wind.wind_speed * .85);
		this.updateState();
		this.status.update();
	}
	this.draw = function() {
		// Skoczka
		drawRotatedCanvas(
						this.texture, 
						surface, 
						this.pos, 
						this.angle, 
						new Vec2(0, JUMPER_BOUNDS.H));
		// Flaga i info					
		ctx.save();
		ctx.translate(this.pos.X, this.pos.Y);
		drawResizedCanvas(
			content.flags.getByIndex(this.score.flag), 
			surface, 
			new Vec2(0, -18),
			new Vec2(8, 8));
		printText(ctx,  10, -12, this.score.nick, 7, "white");
		if(this.flight_state != STATE.ON_DESK) {
			if(this.flight_state <= STATE.ON_SKIJUMP)
				printText(ctx,  10, -20, 
						"Prędkość: " + parseInt(this.getHUDSpeed()) + " km/h", 
						5, "white");
			else if(this.status.ground_proc > 0)
				printText(ctx,  10, -20, "Dystans: " + 
						(this.status.distance == 0 ? this.status.procToMeters(this.status.ground_proc) : this.status.distance).toFixed(1) + "m", 
						5, "white");
		}
		ctx.restore();
		
		// Strzałka wiatru
		if(this.flight_state <= STATE.ON_WIND && this.flight_state != STATE.ON_DESK) {
			ctx.save();
			ctx.translate(this.pos.X + JUMPER_BOUNDS.W, this.pos.Y + JUMPER_BOUNDS.H / 2);
			ctx.rotate(toRad(90));
			
			var angle = (this.flight_state == STATE.ON_WIND ? this.angle : this.vertical_angle);
			var tex = content.hud.getImage(3, 0);
			tex.bounds.W = 30;
			tex.bounds.H = JUMPER_BOUNDS.H * 2;
			
			var arrow_index = Math.abs(parseInt((this.getAngleMargin(angle) + 0.2) * 3));
			var arrow = content.hud.getImage(arrow_index > 2 ? 2 : arrow_index, 1);
			
			arrow.bounds.W = 16;
			arrow.bounds.H = 16;
			
			drawCanvas(
							tex, 
							surface, 
							new Vec2(15, -16));	
			drawRotatedCanvas(
							arrow, 
							surface, 
							new Vec2(9, -4), 
							angle + 90, 
							new Vec2(8, 8));
							
			ctx.restore();
		}
	}
}

function Wind() {
}
Wind.wind_speed = 	0;
Wind.good_wind	=	false;
Wind.updateWind = function() {
	var v = getRandom(-10, 10) / 40;
	if(this.wind_speed + v > .8 || this.wind_speed + v < 0.0)
		v = -v;
	this.wind_speed +=  v;
	this.good_wind			=	this.wind_speed > .4;
	config.WIND_SPEEDING 	= 	this.wind_speed / 50;
}
Wind.updateWind();
setInterval(function() { Wind.updateWind(); }, 1000);

var GAME_STATE = {
	ENTER_NICK	:	0,
	MENU		:	1,
	GAME		:	2,
	SCORE		:	3
};
var	game_state	= GAME_STATE.ENTER_NICK;

var key_config = [
	"[D] Start z deski startowej",
	"[spacja] Wybicie z progu",
	"[space] Spróbuj ponownie",
	"[a/d] Obrót",
	"[F] Zaczynaj grę"
];
var ctx 			= 	surface.ctx;
var	screen_shadow	=	true;
 // bo jest niesynchroniczny przesyl do bazy
var nick_entered	=	false;
var flag_selecting 	= 	false;

// Synchronizacja bazy danych!!!
/** LUDZIE */
function AnimatedFlag(segments_count, texture, amplitude, step_height, speed) {
	this.amplitude		=	amplitude; // 0 - 5
	this.step_height	=	step_height; // max 20px
	this.speed			=	speed;
	
	this.texture		=	texture;
	this.segments_count	=	segments_count;
	this.segments		=	[	];
	
	// W środku canvas nie jest przeskalowany
	this.segment_bounds			=	new Rect(0, 0, texture.canvas.width / segments_count, texture.canvas.height);
	this.render_segment_bounds	=	new Rect(0, 0, texture.bounds.W / segments_count, texture.bounds.H);
	
	this.generateSegments = function() {
		var y_pos 		= 	getRandom(0, this.amplitude);
		var	fall		=	false;
		for(var i = 0, l = this.segments_count; i < l; ++i) {
			if(y_pos >= this.amplitude || y_pos < 0)
				fall = !fall;
			
			y_pos += fall ? this.speed : -this.speed + getRandom(0, 2);
			this.segments.push([y_pos, true]);
		}
	}
	this.updateSegments = function() {
		for(var i = 0, l = this.segments_count; i < l; ++i) {
			var seg = this.segments[i];
			
			if((seg[0] >= this.amplitude && seg[1]) || (seg[0] < 0 && !seg[1]))
				seg[1] = !seg[1];
			seg[0] += seg[1] ? this.speed : -this.speed;
		}
	}
	this.generateSegments();
	
	this.draw = function(pos, invert) {
		if(cam.X > pos.X + this.texture.bounds.W || cam.X + cam.W < pos.X)
			return;
		
		this.updateSegments();
		if(invert)
			pos.X += this.texture.bounds.W;
			
		var _pos = new Vec2(0, 0);
		for(var i = 0, l = this.segments_count; i < l; ++i) {
			_pos.X = pos.X;
			_pos.Y = pos.Y + this.segments[i][0] * this.step_height;
			drawCutCanvas(
							this.texture, 
							surface, 
							_pos, 
							this.render_segment_bounds,
							new Vec2(i * this.segment_bounds.W, 0), 
							this.segment_bounds);
			pos.X += this.render_segment_bounds.W;
		}
	}
}
function ScoreBoard(title, title_color, element_color) {
	this.title		=	title;
	this.title_color	=	title_color;
	this.element_color	=	element_color;
	
	this.last_length	=	0;	//	jeśli nie będą się zgadzały to rejestruje tweeny
	this.transparency	=	[ ];	//	i tworzy tablice przeźroczystości elementów
	
	this.reset	=	function() {
		this.last_length	=	0;
		this.transparency	=	[	];
	}
	this.registerTweens	=	function(new_length) {
		this.last_length	=	new_length;
		this.transparency	=	[	];
		
		for(var i = 0;i < new_length;++i) {
			this.transparency[i] = { alpha : 20 + i * 5 };
			Tweener.registerTween(this.transparency[i], { alpha : 0 }, 1, 1);
		}
	}
	this.draw	=	function(players, margin) {
		if(margin.X < -220 || margin.X > 400)
			return;
		
		var player_in_list = false;
		var	l	=	players.length;
		
		if(l ==0 || this.last_length != l)
			this.registerTweens(l);
		if(l - 1 < 0)
			return;
		
		this.title_color.a = 1 - this.transparency[l - 1].alpha * 5 / 100;
		printText(ctx, 16 + margin.X, 35 + margin.Y, this.title, 17, this.title_color.toString());
		
		var best = 	this.title.indexOf('best') > 0;
		for(var i = 0;i < l; ++i) {
			var str = players[i][0];
			for(var j = str.length;j < 11;++j)
				str += "-";
				
			var is_player = new String(jumper.score.nick).valueOf() == 
								new String(players[i][0]).toLowerCase().valueOf();
			if(is_player)
				player_in_list = true;
			
			this.element_color.a = 1 - this.transparency[i].alpha * 5 / 100;
			var space	=	100;
			var m		=	space * element_color.a;
			this.element_color.a -= (i % 2 == 0 ? 0.4 : 0);
			
			drawResizedCanvas(
					content.flags.getByIndex(players[i][2]), 
					surface, 
					new Vec2(margin.X + space - m + 45, 64 + margin.Y + i * 15 - 14),
					new Vec2(16, 16));
			
			var color = this.element_color.toString();
			if(is_player)
				color = new gColor(79, 70, 242, 1);
			if(best) {
				if(i == 1)
					color = "orange";
				else if(i == 0)
					color = "yellow";
			}
			printText(ctx, 
						16 + margin.X + space - m, 64 + margin.Y + i * 15, "#" + (i+1) + ".  " + str + players[i][1] + "pkt", 
						12, 
						color);
		}
		return player_in_list;
	}
}

function enterNick() {
	if(jumper.score.nick.length <= 0)
		return;
	insertPlayer(jumper);
}
function downloadBestList() {
	enterNick();
	getBestPlayers();
}

var best_players_interval 	= 	-1;
var wait_for_score 			= 	false;

getLastPlayers();
getBestPlayers();

function startBestInterval() {
	downloadBestList();
	best_players_interval = window.setInterval(function() { downloadBestList(); }, 2000);
}
function stopBestInterval() {
	window.clearInterval(best_players_interval);
	best_players_interval = -1;
}

var	last_scoreboard	=	new ScoreBoard("Ostatni gracze:", 
											new gColor(255, 165, 0, 1), 
											gColor.WHITE);
var	best_scoreboard	=	new ScoreBoard("Najlepsi:", 
											new gColor(79, 70, 242, 1), 
											gColor.WHITE);
var	show_ambulance		=	true;
var	ambulance_interval	=	setInterval(function() { show_ambulance = !show_ambulance; }, 600);

function moveSlides() {
	var last = 0;
	for(var k in slides)
		last = slides[k] > last ? slides[k] : last;
	
	for(var k in slides) {
		slides[k] -= 1;
		if(slides[k] < -220) {
			slides[k] = last + 250;
		}
	}
}
function closeNickInfo() {
	clearInterval(ambulance_interval);
	best_scoreboard.reset();
}

var	slides		=	{ last2 : -260, best : 0, last : 260, best2 : 520};
var menu_flag	=	null;

function drawNickInfo() {
	moveSlides();
	
	var str = jumper.score.nick;
	if(!flag_selecting)
		for(var i = str.length; i < 10; ++i) {
			if(i > jumper.score.nick.length)
				str += '_';
			else
				str += show_ambulance? '|' : ' ';
		}
	
	printText(ctx, 20, 50, "Wpisz nick:", 19, flag_selecting ? "#575757" : "white");
	printText(ctx, 207, 50, str, 19, flag_selecting ? "gray" : "white");
	
	last_scoreboard.draw(last_players, new Vec2(slides.last2, 80));
	best_scoreboard.draw(best_players, new Vec2(slides.best, 80));
	last_scoreboard.draw(last_players, new Vec2(slides.last, 80));
	best_scoreboard.draw(best_players, new Vec2(slides.best2, 80));
}
function drawFlagInfo() {
	if(!menu_flag)
		menu_flag = new AnimatedFlag(9, content.flags.getByIndex(jumper.score.flag), 4, 1, .5);
	menu_flag.texture = content.flags.getByIndex(jumper.score.flag);
	ctx.save();
	ctx.translate(207.0, 52.0);
	ctx.scale(2.0, 2.0);
	if(!flag_selecting)
		ctx.globalAlpha = .25;
	menu_flag.draw(new Vec2(0, 0), false);
	ctx.restore();
	
	printText(ctx, 20, 84, "Kraj:", 19, flag_selecting ? "white" : "#575757");
}
function drawHelp() {
	if(game_state == GAME_STATE.MENU) {
		for(var i = 0, l = key_config.length;i < l;++i) {
			var begin_game = i == 4;
			printText(ctx, 60, 120 + i * 20, key_config[i], begin_game ? 15 : 12,  begin_game ? "orange" : "white");
		}
		printText(ctx, 115, 40, "Polish", 30, "white");
		printText(ctx, 155, 70, "Ski Jump", 19, "red");
		
		var logo = content.player_tile.getImage(3, 0);
		logo.bounds.W = logo.bounds.H = 64;
		drawCanvas(logo, surface, new Vec2(50, 10));	
		logo.bounds.copy(JUMPER_BOUNDS);
		return;
	}
	ctx.save();
	ctx.translate(0, 0);
	fillRect(ctx, 
			new Rect(-2, 0, surface.bounds.W + 4, 23), 
			"white");
	if(game_state == GAME_STATE.ENTER_NICK) {
		if(nick_entered)
			if(jumper.score.nick.length > 0) {
				closeNickInfo();
				game_state = GAME_STATE.MENU;
			} else {
				printText(ctx, 0, 20, "Pusty nick!", 13, "black", true);
				nick_entered = false;
			}
		else if(!flag_selecting)
			printText(ctx, 0, 20, "[spacja]Zatwierdź nick", 16, "black", true);
		else
			printText(ctx, 0, 20, "[a/d] Wybierz Flage [f] Zatwierdź", 14, "black", true);
	} else
		switch(jumper.flight_state) {	
			case STATE.ON_DESK:
				printText(ctx, 0, 20, key_config[0], 16, "black", true);
			break;
				
			case STATE.ON_SKIJUMP:
				printText(ctx, 0, 20, key_config[1], 16, "black", true);
			break;
			
			case STATE.ON_RAMP:
				printText(ctx, 0, 20, "Skacz!!!", 19, "black", true);
			break;
			
			case STATE.ON_WIND:
				printText(ctx, 0, 20, key_config[3], 17, "black", true);
			break;
			
			case STATE.ON_GROUND:
			case STATE.DEAD:
				if(jumper.status.dead || game_state == GAME_STATE.SCORE)
					printText(ctx, 0, 20, key_config[2], 16, "black", true);
				else
					printText(ctx, 0, 20, "Chomiki liczą punkty..", 16, "black", true);
			break;
		};
	ctx.restore();
}
function drawJuryNotes() {
	if(best_players_interval == -1)
		startBestInterval();
	
	ctx.save();
	ctx.translate(0, 30);
	printText(ctx, 6, 4, "distance points:" + jumper.score.distance_points + "p", 10, "white");
	printText(ctx, 236, 4, "style points:", 10, "white");
	for(var i = 0; i < config.JURY_COUNT; ++i) {
		printText(ctx, 286, 26 + i * 17, String(jumper.score.style_notes[i]).lpad('-', 4) + "p", 11, "white");
		drawCanvas(content.flags.getImage(0, i == 4 ? 2 : i), surface, new Vec2(265, 14 + i * 17));
	}
	
	// Podsumowanie
	printText(ctx, 266, 154, "Summary:", 13, "white");
	printText(ctx, 245, 187, jumper.score.score + "pkt", 25, "red");
		
	if(!best_scoreboard.draw(best_players, Vec2.zero))
		printText(ctx, 246, 209, "YOU LOSE!", 12, "orange");
	
	ctx.restore();
}
function drawHUD() {
	if(screen_shadow)
		fillRect(ctx, new Rect(0, 0, surface.bounds.W, surface.bounds.H), new gColor(0, 0, 0, .8));
	
	if(!wait_for_score && 
		game_state != GAME_STATE.SCORE && 
		jumper.flight_state == STATE.ON_GROUND &&
		!jumper.status.dead) {
			// Intervał pomiędzy pokazaniem punktu
			wait_for_score = true;
			show_score_interval = setTimeout(function() {
				if(jumper.status.dead || !jumper.status.on_ground)
					return;
				game_state = GAME_STATE.SCORE;
				wait_for_score = false;
			}, 3000);
	}
	/////////////////////////// RENDERING EKRANOW!!!!
	switch(game_state) {
		case GAME_STATE.ENTER_NICK:
			drawFlagInfo();
			drawNickInfo();
		break;
	};
	
	drawHelp();
	
	ctx.save();
	ctx.translate(0, 248);
	
	var dead = jumper.status.dead;
	var build_info = game_state <= GAME_STATE.MENU;
	fillRect(ctx, 
			new Rect(-2, 0, surface.bounds.W + 4, 40), 
			"black", 
			"#3B3838", 
			2);
	
	if(build_info)
		printText(ctx, 5, 15, "Autor: Mateusz Baginski   Ver.: 0.1   Inter. Prod. IT ", 8, "white");
	else if(!dead) {
		printText(ctx, 6, 14, "Wiatr:", 8, "white");
		printText(ctx, 50, 14, Wind.wind_speed.toFixed(1) + "km/h", 8, Wind.good_wind ? "green" : "#DE3A3A");
		
		printText(ctx, 125, 14, "Wybicie:", 8, "white");
		printText(ctx, 190, 14, jumper.status.ramp_speed.toFixed(1) + "km/h", 8, "#4F46F2");
		
		printText(ctx, 265, 14, "Dystans:", 8, "white");
		printText(ctx, 345, 14, jumper.status.distance.toFixed(1) + "m", 8, "white");
		
		if(game_state == GAME_STATE.SCORE)
			drawJuryNotes();
	} else
		printText(ctx, 0, 16, "Jesteś martwy, spróbuj ponownie!", 15, "red", true);
	
	ctx.restore();
	if(game_state == GAME_STATE.SCORE)
		drawJuryNotes();
}

function retry() {
	jumper.reset();
	game_state = GAME_STATE.GAME;
	screen_shadow = wait_for_score = false;
	stopBestInterval();
	
	best_scoreboard.reset();
}

function Man(pos, texture) {
	this.pos 		= 	pos;
	this.texture	=	texture;
}
function People() {
	this.people	=	[	];
	
	this.generate = function() {
		// Generowanie narciarzy na skoczni
		this.people = [ ];
		for(var i = 0;i < getRandom(1, 6);++i) {
			this.people.push(new Man(
								new Vec2(20 + i * 24, 50),
								content.people.getImage(0, 0)));
		}
	}
	this.generate();
	
	this.draw = function() {
		this.people.forEach(function(entry) {
		});
	}
}

var people 		= 	null;
var objects 	= 	null;
var	flag		=	null;

/** ŁADOWANIE */
function createObjectsList() {
	objects = {
		PLATFORM_PILLAR	:	[ true, content.platform.getImage(0, 0), new Vec2(18, 12) ],
		PLATFORM		:	[ false, content.platform.getImage(1, 0), new Vec2(18, 12) ],
		FLAG			:	[ true, content.platform.getImage(2, 0), new Vec2(38, 62) ]
	};
}
function createTiles() {
	for(key in content) {
		if(content[key][1] == null)
			continue;
		content[key] = new gTile(content[key][0], content[key][1]);
	}
	content.player_tile.resizeImages(JUMPER_BOUNDS);
	content.flags.resizeImages(new Rect(0, 0, 16, 16));
	content.hud.resizeImages(new Rect(0, 0, 16, 16));
	
	jumper 	= 	new Jumper();
	cam 	= 	new Cam(jumper);
	people 	= 	new People();
	flag	=	new AnimatedFlag(9, content.flags.getImage(getRandom(0, 3), getRandom(0, 2)), 4, 1, .5);
	
	drawBackground();
	renderLoop();
}

function drawMapObjects(is_static, target) {
	for (var obj in objects) {
		var _obj = objects[obj];
		if(_obj[0] != is_static)
			continue;
		drawCanvas(_obj[1], target, _obj[2]);
	}
}
function drawBackground() {
	createObjectsList();
	drawMapObjects(true, background);
		
	// Schodki
	new TexturePath(
				40, 
				new SkijumpFormula(),
				[ content.map_tile.getImage(2, 0) ],
				SKIJUMP_BOUNDS)
				
		.setTextureCenter(new Vec2(0.0, 0.0))
		.setSegmentBounds(new Vec2(JUMPER_BOUNDS.W / 3, 15.0))
		.setHeightMargin(-9)
		.enableFitTextures(true)
		.enableRotation(false)
		.draw(11, background, Vec2.zero);
	
	// Barierki
	new TexturePath(
				16, 
				new SkijumpFormula(),
				[ content.map_tile.getImage(3, 0) ],
				SKIJUMP_BOUNDS)
				
		.setTextureCenter(new Vec2(0.0, 0.0))
		.setSegmentBounds(new Vec2(JUMPER_BOUNDS.W, 15.0))
		.setHeightMargin(-12.0)
		.enableFitTextures(true)
		.draw(21, background, Vec2.zero);
	
	// Skocznia
	new TexturePath(
				SKIJUMP_BOUNDS.W / JUMPER_BOUNDS.W, 
				new SkijumpFormula(),
				[ content.map_tile.getImage(0, 0) ],
				SKIJUMP_BOUNDS)
				
		.setTextureCenter(new Vec2(0.0, 0.0))
		.setSegmentBounds(new Vec2(JUMPER_BOUNDS.W, 15.0))
		.setHeightMargin(-4)
		.enableFitTextures(true)
		.enableRotation(true)
		.draw(0, background, Vec2.zero);
	
	// Drzewka
	new TexturePath(
                30, 
				new GroundFormula(),
				[ 
						content.trees.getImage(0, 0),
						content.trees.getImage(1, 0), 
						content.trees.getImage(2, 0) ,
						content.trees.getImage(3, 0) ],
				GROUND_BOUNDS)
                
		.setTextureCenter(new Vec2(0.0, 0.0))
		.setSegmentBounds(new Vec2(JUMPER_BOUNDS.W * 2.5, 151.0))
		.setHeightMargin(-151)
		.enableRotation(false)
		.enableFitTextures(false)
		.setSpaces(30)
		.draw(0, background, GROUND_BOUNDS);
	
	// Ziemia
	new TexturePath(
                GROUND_BOUNDS.W / JUMPER_BOUNDS.W, 
				new GroundFormula(),
				content.ground_tile.tiles,
				GROUND_BOUNDS)
                
		.setTextureCenter(new Vec2(0.0, 0.0))
		.setSegmentBounds(new Vec2(JUMPER_BOUNDS.W, 18.0))
		.setHeightMargin(-GROUND_MARGIN)
		.enableRotation(true)
		.enableFitTextures(true)
		.draw(0, background, GROUND_BOUNDS);
}
function drawMap() {
	drawCanvas(background, surface, Vec2.zero);
	
	people.draw();
	drawMapObjects(false, surface);
	flag.draw(new Vec2(100, 65), Wind.good_wind);
	
	drawCanvas(content.hud.getImage(!Wind.good_wind, 2), surface, new Vec2(108, 102));
}

var keycodes = {
	SPACE		:	32,
	F			:	70,
	LEFT		:	65,
	RIGHT		:	68,
	BACKSPACE	:	8
};
function keyPress(event) {
	var key = event.keyCode;
	if(game_state == GAME_STATE.ENTER_NICK) {
		if(flag_selecting) {
			if(key == keycodes.F) {
				nick_entered = true;
				screen_shadow = true;
				checkNickAvailable(jumper.score.nick);
			} else if(key == keycodes.RIGHT) {	
				jumper.score.flag++;
				if(jumper.score.flag >= 12)
					jumper.score.flag = 0;
			} else if(key == keycodes.LEFT) {
				jumper.score.flag--;
				if(jumper.score.flag < 0)
					jumper.score.flag = 11;
			}
		} else if(key == keycodes.SPACE && jumper.score.nick.length > 0) {
			flag_selecting = true;
		} else if(key == keycodes.BACKSPACE && jumper.score.nick.length > 0)
			jumper.score.nick = jumper.score.nick.substr(0, jumper.score.nick.length - 1);
			
		else if(jumper.score.nick.length < 10 && (
				(key >= 48 && key <= 57) || 
				(key >= 65 && key <= 90) || 
				(key >= 97 && key <= 122)) && !flag_selecting) {
				jumper.score.nick += String.fromCharCode(key).toLowerCase();
		}
	} else
		switch(key) {
			case keycodes.SPACE:
				if(jumper.status.on_ground) {
					retry();
				} else if(jumper.flight_state >= STATE.ON_SKIJUMP)
					jumper.goFar();
			break;
			
			case keycodes.LEFT:
				jumper.rotate(4);
			break;
			
			case keycodes.RIGHT:
				if(game_state == GAME_STATE.GAME && jumper.flight_state == STATE.ON_DESK)
					jumper.goFar();
				else
					jumper.rotate(-4);
			break;
			
			case keycodes.F:
				if(game_state < GAME_STATE.GAME) {
					game_state++;
					screen_shadow = false;
				}
			break;
		};
}

function updateCamMargin() {
	if(jumper.flight_state >= STATE.ON_WIND) {
		cam.margin.Y += cam.margin.Y < 
							(jumper.flight_state == STATE.ON_WIND ? 100 : 120) ? 
								1 : 0;
	} else if(jumper.flight_state != STATE.ON_DESK 
			&& jumper.status.skijump_proc > .1)
		cam.margin.Y += (cam.margin.Y > config.PREFERRED_CAM_MARGIN ? -1 : 0);
	else
		cam.margin.copy(config.DEFAULT_CAM_MARGIN);
}
function drawSkiJump() {
	//if(game_state == GAME_STATE.GAME) {
		updateCamMargin();
		cam.pushCam();
		drawMap();
		jumper.update();
		jumper.draw();
		cam.popCam();
	//}
	
	ctx.save();
	ctx.scale(config.HUD_SCALE.X, config.HUD_SCALE.Y);
	drawHUD();
	ctx.restore();
}								
