// @name Facebook GM Framework
// @author sizzlemctwizzle

// Get the actual Facebook url
function realUrl() {
     if (window.location.hash.match(/\.php/)) {
        return 'http://'+window.location.host+window.location.hash.split('#')[1];
     } else if (window.location.href.indexOf('#') != -1) {
        return window.location.hash.split('#')[0];
     } else {
       return window.location.href;
     }
}

// Reproduce Greasemonkey @include and @exclude
// both includes or excludes can be a string or an array of strings
// Obviously remove this function if you know how to write RegExp yourself
function GM_testUrl(includes, excludes) {
     regTest = function(url) { return new RegExp(url.replace(/(\/|\?|\.|\^|\,|\+)/g, "\\\$1").replace(/\*/g, ".*")).test(realUrl()); }
     if (typeof excludes != "undefined") {
        if (typeof excludes == "string") excludes = [excludes];
        for (exclude in excludes) if (regTest(excludes[exclude])) return false;
     }
     if (typeof includes == "string") includes = [includes];
     for (include in includes) if (regTest(includes[include])) return true;
     return false;
}

function $(element) { return document.getElementById(element); }
        
// Watch for page changes
function process() {
    $('content').removeEventListener('DOMNodeInserted', process, false);
    if (!$(fbPageChangeMarker.id)) setTimeout(fbPageChanged, 0);
    $('content').appendChild(fbPageChangeMarker);
    $('content').addEventListener("DOMNodeInserted", process, false);
}

// Create a marker to see if the page has changed
var fbPageChangeMarker = document.createElement('div');
var s='', l=5;
l++;
while(--l) s+=String.fromCharCode(Math.floor(Math.random() * 75) + 48);
s = 'fbPageChangeMarker_'+s;
fbPageChangeMarker.id = s;

// Wait for the page to load before we start listening   
var checker=setInterval(function(){
    if($('content')) {
        clearInterval(checker);
        process();
    }
}, 100);
