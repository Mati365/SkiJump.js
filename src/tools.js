/** Podstawowe klasy silniczka */
function isSet(variable) {
	return typeof variable !== 'undefined'
}
function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function Vec2(X,Y) {
	this.X	=	X;
	this.Y	=	Y;
	
	this.getFromRectangle = function(rect) {
		this.X = rect.X;
		this.Y = rect.Y;
	}
	this.clear = function() {
		this.X = this.Y = 0;
	}
	this.copy = function(obj) {
		this.X = obj.X;
		this.Y = obj.Y;
	}
	this.moveTo = function(obj, v) {
		if(obj.X == this.X && obj.Y == this.Y)
			return true;
		
		this.X += (obj.X == this.X ? 0 : ((obj.X > this.X ? 1 : -1) * v));
		this.Y += (obj.Y == this.Y ? 0 : ((obj.Y > this.Y ? 1 : -1) * v));
		
		return false;
	}
}
Vec2.zero	=	new	Vec2(0, 0);

function Range(min, max) {
	this.min	=	min;
	this.max	=	max;
}

String.prototype.lpad = function(padString, length) {
    var str = this;
    while (str.length < length)
        str = padString + str;
    return str;
}
function Rect(X, Y, W, H) {
	this.X	=	X;
	this.Y	=	Y;
	this.W	=	W;
	this.H	=	H;
	
	this.copy = function(rect) {
		this.X = rect.X;
		this.Y = rect.Y;
		this.W = rect.W;
		this.H = rect.H;
	}
}
Rect.toRect	=	function(vec) {
	return new Rect(0, 0, vec.X, vec.Y);
}

function Timer(max, obj, callback) {
	this.tick		=	0;
	this.max		=	max;
	this.callback	=	callback;
	this.obj		=	obj;
	
	this.update	=	function() {
		this.tick++;
		if(this.tick > this.max) {
			if(this.obj == null)
				this.callback(this);
			else
				this.obj[callback](this);
		}
	}
}

/** Manager tweenów */
var	TWEEN	=	{
	LINEAR		:	1
};
function Tween(obj, to_obj, delay, v) {
	if(obj.length != to_obj.length)
		throw "TWEEN OBJ ERROR!!";
	
	this.obj	=	obj;
	this.to_obj	=	to_obj;
	this.type	=	TWEEN.LINEAR;
	this.timer	=	new Timer(delay, this, "updateTween");
	this.done	=	false;
	this.length	=	Object.keys(this.obj).length;
	this.v		=	v;
	
	this.updateTween	=	function(timer) {
		var	equal	=	0;
		for (var key in this.obj) {
			/** TODO: Różne typy tweenów */
			var _obj	=	this.obj[key];
			var	_to_obj	=	this.to_obj[key];
			
			switch(this.type) {
				case TWEEN.LINEAR:
				if(_obj instanceof Vec2) {
					if(_obj.moveTo(_to_obj, this.v))
						equal++;
				 } else {
					if(_obj < _to_obj - this.v)
						_obj += this.v;
					else if(_obj > _to_obj + this.v)
						_obj -= this.v;
					else
						equal++;
				}
				break;
			};
			this.obj[key]	=	_obj;
		}
		// Optymalizacja, zabijanie po skończeniu timera!!
		if(equal == this.length)
			this.done = true;
		timer.tick	=	0;
	}
	this.update	=	function() {
		this.timer.update();
	}
}

function Tweener() {
}
Tweener.tweens = [ ];
Tweener.registerTween	=	function(obj, to_obj, delay, v) {
	var	tween	=	new Tween(obj, to_obj, delay, v);
	this.tweens.push(tween);
	
	return tween;
}
Tweener.update	=	function() {
	for(var i = 0, l = this.tweens.length;i < l;) {
		var tween	=	this.tweens[i];
		tween.update();
		if(tween.done || typeof tween == "undefined")
			this.tweens.splice(i, 1)
		else
			++i;
	}
}
