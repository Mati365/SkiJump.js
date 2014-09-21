var nick_available;
var	best_players	=	[ ];
var last_players	=	[ ];

function jsonToServer(_data, _callback) {
	var text = "";
	for(obj in _data)
		if(obj != "key2" && obj != "key")
			text += new String(_data[obj]);	
	_data['key'] = new String(CryptoJS.MD5(text));
	$.ajax({
		type: "GET",
		url: "http://syf.bl.ee/POLISH_SKIJUMP/skijump_server.php?callback=?",
		async: false,
		data: _data,
		dataType: "jsonp",
		success : function(obj) {
			_callback(obj);
		}
	});
}
function checkNickAvailable(_nick) {
	jsonToServer({ type: "IS_AVAILABLE", nick: _nick }, function(obj) {
		nick_available = obj.available;
	});
}
function insertPlayer(_score) {
	var __nick 	= _score.score.nick;
	var __score = _score.score.score;
	
	if(!jumper.score.isEqualWithOld())
		return;
	
	var all 	= new String(__score / 10) + "i" + new String(__nick) + new String(__score) + new String(_score.score.flag);
	var key 	= all;
	jsonToServer({ type: "INSERT", nick: __nick, score: __score, ip: "192.168.1.1", flag: _score.score.flag, key2: key }, function(obj) {
	});
}
function putPlayerQuery(obj) {
	var array = [ ];
	for(key in obj)
		array.push([ key, obj[key][0], obj[key][1] ]);
	return array;
}
function getBestPlayers() {
	jsonToServer({ type: "LIST_BEST" }, function(obj) {
		best_players = putPlayerQuery(obj);
	});
}
function getLastPlayers() {
	jsonToServer({ type: "LIST_LAST" }, function(obj) {
		last_players = putPlayerQuery(obj);
	});
}
