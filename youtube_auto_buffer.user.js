// ==UserScript==
// @name           YouTube Auto Buffer & Auto HD & Remove Ads
// @namespace      userscripts.org
// @description    Buffers the video without autoplaying, removes in-video ads, and puts it in hd if the option is on. For Firefox, Opera, Safari, Chrome, and Midori
// @include        http://*.youtube.com/*
// @include        http://youtube.com/*
// @copyright      JoeSimmons
// @version        1.2.5
// @license        http://creativecommons.org/licenses/by-nc-nd/3.0/us/
// @require        http://userscripts.org/scripts/source/49700.user.js
// @require        http://sizzlemctwizzle.com/updater.php?id=49366
// ==/UserScript==

// Allow non-Greasemonkey browsers to use the GM functions, re-written (from TarquinWJ)
if (typeof GM_getValue == 'undefined' || GM_getValue('a', 'b') == 'undefined') {
GM_xmlhttpRequest = XMLHttpRequest;
GM_log = (window.opera) ? opera.postError : console.log;
if (window.opera) window._content = window;
GM_setValue = (!localStorage) ? function( cookieName, cookieValue, lifeTime ) {
	if( !cookieName ) { return; }
	if( lifeTime == "delete" ) { lifeTime = -10; } else { lifeTime = 31536000; }
	document.cookie = escape( cookieName ) + "=" + escape( cookieValue ) +
		";expires=" + ( new Date( ( new Date() ).getTime() + ( 1000 * lifeTime ) ) ).toGMTString() + ";path=/";
} : function(name, value) { return localStorage.setItem(name, value) };
GM_getValue = (!localStorage) ? function( cookieName, oDefault ) {
	var cookieJar = document.cookie.split( "; " );
	for( var x = 0; x < cookieJar.length; x++ ) {
		var oneCookie = cookieJar[x].split( "=" );
		if( oneCookie[0] == escape( cookieName ) ) {
			try {
				eval('var footm = '+unescape( oneCookie[1] ));
			} catch(e) { return oDefault; }
			return footm;
		}
	}
	return oDefault;
} : function(name, defaultValue) { return localStorage.getItem('XB_config') || defaultValue };
GM_deleteValue = (!localStorage) ? function( oKey ) {
	GM_setValue( oKey, '', 'delete' );
} : function GM_deleteValue(name) { localStorage.removeItem(name) };

// non-Greasemonkey GM_config 
var GM_config = {
get : function(e) {
return eval(GM_getValue(e,"true"));
},
init:function(e){return true;},
save:function(e) {
GM_setValue("autoBuffer", $("autoBuffer").checked);
GM_setValue("autoHD", $("autoHD").checked);
GM_setValue("hideAds", $("hideAds").checked);
GM_config.close();
},
close:function(e) {
var mp=$("movie_player"), autobufferopts=$("autobufferopts");
if(mp) mp.style.visibility="visible";
if(autobufferopts) autobufferopts.style.display="none";
},
reset:function(e) {
$("autoBuffer").checked=false;
$("autoHD").checked=false;
$("hideAds").checked=false;
},
center:function(e) {
	var node = $("autobufferopts"), style = node.style, beforeOpacity = style.opacity;
	if(style.display=='none') style.opacity='0';
	style.display = '';
	style.top = Math.floor((window.innerHeight/2)-(node.offsetHeight/2)) + 'px';
	style.left = Math.floor((window.innerWidth/2)-(node.offsetWidth/2)) + 'px';
	style.opacity = '1';
},
open:function(e){
var mp=$("movie_player"), autobufferopts=$("autobufferopts");
if(mp) mp.style.visibility="hidden";
if(autobufferopts) autobufferopts.style.display="";
GM_config.center();
}
};
document.body.appendChild(create("div", {id:"autobufferopts",style:"text-align:left; background-color:#eee; position:fixed; top:50px; left:40%; width:300px; padding:10px 20px 10px 20px; color:#000000; z-index:999999; border: 3px double #666666; opacity:0; display:none;"}, new Array(
create("text", "YouTube Auto Buffer Options - Opera Version"),
create("br"),
create("br"),
create("label", {"for":"autoBuffer",textContent:"Autoplay off & Autobuffer on?"}),
create("input", {type:"checkbox",id:"autoBuffer",checked:GM_config.get("autoBuffer"),style:"margin-left:6px;"}),
create("br"),
create("label", {"for":"autoHD",textContent:"Auto HD"}),
create("input", {type:"checkbox",id:"autoHD",checked:GM_config.get("autoHD"),style:"margin-left:6px;"}),
create("br"),
create("label", {"for":"hideAds",textContent:"Hide in-video ads?"}),
create("input", {type:"checkbox",id:"hideAds",checked:GM_config.get("hideAds"),style:"margin-left:6px;"}),
create("br"),
create("br"),
create("span", {style:"display: block; text-align: right;"}, new Array(
	create("input", {type:"button",value:"Save",style:"margin-right:6px;",onclick:GM_config.save}),
	create("input", {type:"button",value:"Cancel",onclick:GM_config.close})
	)),
create("a", {textContent:"Restore to default",href:"javascript:void(0);",style:"display: block; margin-top: 8px; text-align: right;",onclick:GM_config.reset})
)));
window.addEventListener("resize", GM_config.center, false);
}

// Get ID
function $(ID,root) {return (root||document).getElementById(ID);}

// Created by avg, modified by JoeSimmons
function create(a,b,c) {
	if(a=="text") {return document.createTextNode(b);}
	var ret=document.createElement(a.toLowerCase());
	if(b) for(var prop in b) if(prop.indexOf("on")==0) ret.addEventListener(prop.substring(2),b[prop],false);
		else if(",style,accesskey,id,name,src,href".indexOf(","+prop.toLowerCase())!=-1) ret.setAttribute(prop.toLowerCase(), b[prop]);
		else ret[prop]=b[prop];
	if(c) for(var i=0,l=c.length; i<l; i++) ret.appendChild(c[i]);
	return ret;
}

// setVar by JoeSimmons
// Syntax: "autoplay=1&hq=0&ads=1".setVar("ads", "0").setVar("hq", "1");
String.prototype.setVar = function(q, v) {
var regex = new RegExp("([\&\?])?"+q+"=[^\&\#]*", "g");
return regex.test(this) ? this.replace(regex, "$1"+q+"="+v) : this+"&"+q+"="+v;
}

String.prototype.getPref = function(s, splitter) {
return this.split(s+"=")[1].split((splitter||"&"))[0];
};

function main(GM_config) {

if($("masthead-nav-main") && $("movie_player")) {
GM_config.init("YouTube Auto Buffer Options", {
autoBuffer : {label:"Autoplay off & Autobuffer on?", type:"checkbox", "default":true},
autoHD : {label:"Auto HD", type:"checkbox", "default":true},
hideAds : {label:"Hide in-video ads?", type:"checkbox", "default":true}
}, "#config_header {font-size:16pt !important;} .config_var {margin-left:20% !important;} #header {margin-bottom:30px !important;} .indent40 {margin-left:20% !important;}", {
open : function(){ var frame=GM_config.frame; frame.style.height="50%";frame.style.width="50%"; GM_config.center(); }
});
$("masthead-nav-main").appendChild(create("a", {textContent:"Autobuffer Options",href:"javascript:void(0);",onclick:function(){
if(window.opera || typeof(GM_config)=="object") GM_config.open();
	else alert("Configuration options only available on Firefox and Opera.");
}}));

var mp = $("movie_player"),
	mpC = mp.cloneNode(true),
	regex = {
			ads:/[\&\?]?(ad_|infringe|invideo|watermark)([^=]*)?=[^\&]*/gi,
			begin_end:/(^[\&\?]*)|([\&\?]*$)/g
			},
	fmt_map = unescape(mpC.getAttribute("flashvars").getPref("fmt_map"));
	fv = mpC.getAttribute("flashvars").setVar("autoplay", (GM_config.get("autoBuffer")?"0":"1")).setVar("enablejsapi", "1");
switch(GM_config.get("autoHD").toString()) {
case "false": fv = fv.setVar("vq", "0"); break;
case "true": if(fmt_map.indexOf("37/4000000/9/0/115")!=-1) fv = fv.setVar("vq", "hd1080");
			else if(fmt_map.indexOf("22/2000000/9/0/115")!=-1) fv = fv.setVar("vq", "hd720");
			else if(fmt_map.indexOf("35/640000/9/0/115")!=-1 || fmt_map.indexOf("34/0/9/0/115")!=-1 || fmt_map.indexOf("18/512000/9/0/115")!=-1) fv = fv.setVar("vq", "2");
			else fv.setVar("vq", "0"); break;
}
if(GM_config.get("hideAds")) {fv = fv.replace(regex["ads"],"")+"&invideo=false";}
mpC.setAttribute("flashvars", fv.replace(regex["begin_end"],""));
mp.parentNode.replaceChild(mpC, mp);

if(GM_config.get("autoBuffer")) {
function onYouTubePlayerReady(playerId){
g_YouTubePlayerIsReady=true;
var player=_gel("movie_player");
player.addEventListener("onStateChange","handleWatchPagePlayerStateChange");
player.addEventListener("onPlaybackQualityChange","onPlayerFormatChanged");
player.playVideo();
intv = setInterval(pauseOnStart, 50);
}
function onytplayerStateChange(){return true};
function pauseOnStart() {
try {
if(_gel("movie_player").getPlayerState()==1) {
clearTimeout(intv);
var pos=_gel("pauseOnStart"); pos.parentNode.removeChild(pos);
var mp=_gel("movie_player"), vol=mp.getVolume(), muted=mp.isMuted();
if(vol>0 && !muted) {mp.setVolume(0);}
setTimeout(function(mp, vol, muted){
mp.seekTo(0);
setTimeout(function(mp, vol, muted) {
_gel("movie_player").pauseVideo();
setTimeout(function(mp, vol, muted) {if(vol>0 && !muted) {mp.setVolume(vol);}}, 100, mp, vol, muted);
}, 100, mp, vol, muted);
}, 2500, mp, vol, muted);
}
} catch(e) {}
}
var head = document.getElementsByTagName("head")[0],
	aS = document.createElement("script");
if(!head) {return;}
aS.type = "text/javascript";
aS.id = "pauseOnStart";
try {aS.innerHTML = "var intv;\n"+onYouTubePlayerReady+"\n"+onytplayerStateChange+"\n"+pauseOnStart;}
catch(e) {aS.innerText = "var intv;\n"+onYouTubePlayerReady+"\n"+onytplayerStateChange+"\n"+pauseOnStart;}
head.appendChild(aS);
}
}

}

function waitForReady(GM_config) {
if($("masthead-nav-main") && $("movie_player")) {
clearInterval(intv);
main(GM_config);
}
sec++;
if((sec/1000)==30) {
clearInterval(intv);
}
}

var intv=setInterval(waitForReady, 100, GM_config), sec=0;