<?php
include 'config.php';

error_reporting(E_ERROR | E_WARNING | E_PARSE | E_NOTICE);
header('Content-Type: application/jsonp', true);

$type		=	$_GET['type'];
$connection	=	null;
$data 		= 	array();
$MAX_SCORE	=	350;

function connectToDatabase() {
	global $server, $user, $password, $connection;
	
	$connection	=	mysql_connect($server, $user, $password);
	if(!$connection)
		die('Brak polaczenia z baza danych' . mysql_error());
	mysql_select_db($user, $connection);
}
connectToDatabase();

function checkSpecialChar($str) {
	return preg_match('/[\'^£$%&*()}{@#~?><>,|=_+¬-]/', $str);
}
function checkBuffer() {
	global $MAX_SCORE;
	
	$buffer = $_GET['key2'];
	$score = $_GET['score'];
	$new_buffer = ($score / 10).'i'.$_GET['nick'].$score.$_GET['flag'];
	
	if($new_buffer != $buffer || 
			$score > $MAX_SCORE)
		return false;
	if(isset($_GET['nick']) && checkSpecialChar($_GET['nick']))
		return false;
	
	return true;
}

$client_ip	=	$_SERVER['REMOTE_ADDR'];
function insert() {
	global $client_ip;
	
	if(!checkBuffer())
		return;
	$array 	=	array((string)$_GET['nick'], $_GET['score'], $client_ip, $_GET['flag']);
	mysql_query("INSERT INTO `players` (
				`nick` ,
				`score` ,
				`ip`,
				`flag`
				)
				VALUES (
				'$array[0]', '$array[1]', '$array[2]', '$array[3]'
				);");
}
function update() {
	global $client_ip;
	
	if(!checkBuffer())
		return;
	$nick = (string)$_GET['nick'];
	$score = $_GET['score'];
	$ip = $client_ip;
	
	$result = mysql_query("SELECT `score` FROM `players` WHERE `nick` = '$nick' LIMIT 1");
	$row = mysql_fetch_array($result, MYSQL_NUM);
	if(intval($score) < intval($row[0]))
		return;
	
	mysql_query("UPDATE `players` SET `score` = '$score',`ip` = '$ip' WHERE `players`.`nick` = '$nick' LIMIT 1");
}
function isAvailable() {
	$nick	=	$_GET['nick'];
	$result =	mysql_query("SELECT * FROM players WHERE nick = '$nick'");
	if(mysql_numrows($result) != 0)
		return false;
	else
		return true;
}
function putListQueryToData($str) {
	global $data;
	
	$result = mysql_query($str);
	while ($row = mysql_fetch_array($result, MYSQL_NUM)) {
		$key = $row[0];
		$data[$key] = array($row[1], $row[3]);
	}
}
function listBest() {
	putListQueryToData("SELECT * FROM `players` ORDER BY `score` DESC LIMIT 7");
}
function listLast() {
	putListQueryToData("SELECT * FROM `players` ORDER BY `id` DESC LIMIT 7");
}
function checkGETkey() {
	$str = "";
	foreach($_GET as $key => $value)
		if($key == "nick" || $key == "ip" || $key == "type" || $key == "score" || $key == "flag")
			$str = $str.$value;
	if(strcmp(md5($str),  $_GET['key']) != 0)
		die('HACK!!!');
}
checkGETkey();

switch($type) {
	case 'IS_AVAILABLE':
		$data['available'] = isAvailable();
	break;
	
	case 'INSERT':
		if(isAvailable())
			insert();
		else
			update();
	break;
	
	case 'LIST_BEST':
		listBest();
	break;
	
	case 'LIST_LAST':
		listLast();
	break;
};

print $_GET['callback'].'('.json_encode($data).')';
mysql_close();
?>
