// ==UserScript==
// @name           Userscripts Comments Fix
// @description    Packed full of features that make using Userscripts.org easier!
// @namespace      sizzlemctwizzle
// @version        2.2.0
// @require        http://sizzlemctwizzle.com/updater.php?id=24464
// @include        http://userscripts.org/forums/*/topics/*
// @include        http://userscripts.org/scripts/show/*
// @include        http://userscripts.org/scripts/edit/*
// @include        http://userscripts.org/topics/*
// @include        http://userscripts.org/guides/*
// @include        http://userscripts.org/reviews/*
// @include        http://userscripts.org/articles/*
// @include        http://userscripts.org/messages/new?*
// ==/UserScript==

// ====== Start Helper Functions =======
// GM_addStyle if not available
if (typeof GM_addStyle === 'undefined') 
  GM_addStyle = function(css) {
    var head = document.getElementsByTagName('head')[0], style = create('style', {});
    if (!head) {return}
    style.type = 'text/css';
    try {style.innerHTML = css}
    catch(x) {style.innerText = css}
    head.appendChild(style);
};
// Inject a script into the page
function addScript(js) {
  var body = document.body, script = create('script', {});
    if (!body) {return}
    script.type = 'text/javascript';
    try {script.innerHTML = js}
    catch(x) {script.innerText = js}
    body.appendChild(script);
}
// Smart XPath Function
function $x(x, t, r) {
    if (t && t.tagName) 
        var h = r, r = t, t = h;    
    var d = r ? r.ownerDocument || r : r = document, p;
    switch (t) {
    case XPathResult.NUMBER_TYPE:
        p = 'numberValue';
        break;
    case XPathResult.STRING_TYPE:
        p = 'stringValue';
        break;
    case XPathResult.BOOLEAN_TYPE:
        p = 'booleanValue';
        break;
    case XPathResult.ANY_UNORDERED_NODE_TYPE: 
    case XPathResult.FIRST_ORDERED_NODE_TYPE:
        p = 'singleNodeValue';
        break;
    default:
        return d.evaluate(x, r, null, t || XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    }
    return d.evaluate(x, r, null, t, null)[p];
}
// Optional shortcut functions I like
function $x1(x, r) { return $x(x, XPathResult.FIRST_ORDERED_NODE_TYPE , r) } 
function $xb(x, r) { return $x(x, XPathResult.BOOLEAN_TYPE, r) }
// A robust and universal forEach
function forEach(lst, cb) {
    if(!lst) 
        return;
    if (lst.snapshotItem)
        for (var i = 0, len = lst.snapshotLength, 
                 snp = lst.snapshotItem; i < len; ++i)
            cb(snp(i), i, lst);
    else if (lst.iterateNext) {
        var item, next = lst.iterateNext;
        while (item = next()) 
            cb(item, lst);
    } else if (typeof lst.length != 'undefined') 
        for (var i = 0, len = lst.length; i < len; ++i)
            cb(lst[i], i, lst);
    else if (typeof lst == "object")
        for (var i in lst) 
            cb(lst[i], i, lst);
}
// Insert an element after another
function insertAfter(node, after) { after.parentNode.insertBefore(node, after.nextSibling);}
// A really cool element creation funtion by avg and JoeSimmons, and modified by me
function create() {
    switch(arguments.length) {
        case 1:
            var A = document.createTextNode(arguments[0]);
	    break;
        default:
            var A = document.createElement(arguments[0]),
                B = arguments[1];
            for (var b in B) {
	        if (b.indexOf("on") == 0)
		    A.addEventListener(b.substring(2), B[b], false);
		else if (",style,accesskey,id,name,src,href,which".indexOf("," +
                         b.toLowerCase()) != -1)
		    A.setAttribute(b, B[b]);
		else
		    A[b] = B[b];
            }
            for(var i = 2, len = arguments.length; i < len; ++i)
	        A.appendChild(arguments[i]);
    }
    return A;
}
// Remove an element
function remove(element) { element.parentNode.removeChild(element); }
// Get element by id
function $(element) { return document.getElementById(element); }
// Get elements by classname
function $c(element, root) { return (root||document).getElementsByClassName(element); }
function xhr(url, callback, data) {
    GM_xmlhttpRequest({
          method: (data) ? 'POST' : 'GET',
	  url: url,
	  headers: {
	  'User-agent': window.navigator.userAgent,
	  'Content-type': (data) ? 'application/x-www-form-urlencoded' : null
	  },
	  data: (data) ? data : null,
	  onload: function(res) { if (res.status == 200) callback(res.responseText); }
      });
}
// ======== End Helper Functions =========

GM_addStyle("pre, code { white-space:pre-wrap !important; } a.quick_shortcut, a.quick_shortcut:visited { font-size: 14px !important; font-weight:bold !important; color: #FFFFFF !important; width: 10px !important; } a.example_link:hover { color:blue !important; }");

init();

function usoEscaper(code) {
  var correct = {'b' : 'strong', 'i' : 'em', 'u' : 'ins', 's' : 'del'};
  return code.replace(/<(code|pre)>((?:.|\s)*?)<\/\1>/gmi, 
                      function(str, tag, raw) {
                        return "<"+tag+">"+recursEscape(raw.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,'&quot;').replace(/'/g, "&#39;")).replace(/(\\)?\[url(?:(=.*?))?\]((?:.|\s)*?)\[\/url\]/gmi, function(str, $1, $2, $3){return $1 ? '[url'+$2+']'+$3+'[/url]' : '<a'+($2.length?' href="'+$2.substr(1,$2.length)+'"':'')+'>'+$3+'</a>'})+"</"+tag+">";
  }).replace(/<\/blockquote>\n/gi, "</blockquote>").replace(/<\s*(\/)?\s*(b|i|u|s)\s*>/gi, function(str, $1, $2) { return '<'+$1+correct[$2]+'>' });
//"
}

function usoUnEscaper(code) {
      return code.replace(/<(code|pre)>((?:.|\s)*?)<\/\1>/gmi, function(str, tag, raw) {
        return "<"+tag+">"+recursUnEscapeTags(recursUnEscapeBB(raw.replace(/\[url(?:=(.*?)){0,1}\]((?:.|\s)*?)\[\/url\]/gmi, function(str, m1, m2){return '\\[url'+(m1.length?'=':'')+m1+']'+m2+'[\/url]'})).replace(/<a\s*(?:[^>]+href=(".*?)")?>((?:.|\s)*?)<\/a>/gmi, function(str, $1, $2){return '[url'+($1.length?'=':'')+$1.substr(1,$1.length)+']'+$2+'[\/url]'})).replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g, "'").replace(/&amp;/g,'&')+"</"+tag+">";
        }).replace(/<\/blockquote>(?!\n)/gi, "</blockquote>\n");
}

function recursEscape(code) {
  if (/\[\s*([^\]]+)\s*[^\]]*\][^\[]*\[\s*\/\s*\1\s*\]/i.test(code)) {
    return code.replace(/(\\)?\[(sub|sup|strong|em|ins|del|b|i|u|s|big|small|h\d+)\]((?:.|\s)+?)\[\/\2\]/gmi, function(str, $1, $2, $3) { return $1 ? "["+$2+"]"+recursEscape($3)+"[/"+$2+"]" : "<"+$2+">"+recursEscape($3)+"</"+$2+">"});
  } else
    return code;
}

function recursUnEscapeBB(code) {
  if (/\[\s*([^\]]+)\s*[^\]]*\][^\[]*\[\s*\/\s*\1\s*\]/i.test(code))
    return code.replace(/\[(sub|sup|strong|em|ins|del|b|i|u|s|big|small|h\d+)\]((?:.|\s)+?)\[\/\1\]/gmi, function(reg, $1, $2) { return "\\["+$1+"]"+recursUnEscapeBB($2)+"[\/"+$1+"]" });
  else 
    return code;
}

function recursUnEscapeTags(code) {
  if (/<\s*([^>]+)\s*[^>]*>[^<]*<\s*\/\s*\1\s*>/i.test(code))
    return code.replace(/<(sub|sup|strong|em|ins|del|b|i|u|s|big|small|h\d+)>((?:.|\s)*?)<\/\1>/gmi, function(reg, $1, $2) { return "["+$1+"]"+recursUnEscapeTags($2)+"[\/"+$1+"]" });
  else
    return code;
}

function init()
{
	addFormsSubmissionEventListener(document);
	window.addEventListener("unload",revertTextAreas,false);
	document.addEventListener("DOMNodeInserted",function(e){addFormsSubmissionEventListener(e.relatedNode);},false);
	unsafeWindow.revertTextAreas=revertTextAreas;
}

function addFormsSubmissionEventListener(node)
{
	var array1=node.getElementsByTagName("FORM");
	for(var num1=0;num1<array1.length;num1++) 
	{
		var form1=array1[num1];
		var text1=form1.getAttribute("onsubmit");
		if (text1==null) text1="";
		if (text1.indexOf("replaceCodeBlocks")==-1) 
		{
			var text2=text1.indexOf("Ajax")!=1?"; revertTextAreas();":"";
			form1.setAttribute("onsubmit","replaceCodeBlocks(this); "+text1+text2);
		}
		

		var array2=form1.getElementsByTagName("TEXTAREA");
		
		for(var num2=0;num2<array2.length;num2++) 
		{
		  var textarea1=array2[num2];
		  if (textarea1.getAttribute('reverted')) continue;
		  if (!/\/scripts\/edit\//.test(document.URL) && !/\/(guides|reviews)\/\d+\/edit/.test(document.URL)){
		    textarea1.setAttribute('cols', '66');
		    textarea1.setAttribute('rows', '15');
		    textarea1.setAttribute('style', 'height:100%;');
		    textarea1.parentNode.setAttribute('width', '55%');
		    textarea1.parentNode.setAttribute('height', '100%');
		  }
		  textarea1.addEventListener("keydown", function(e) { 
		      if((window.navigator.userAgent.match('Macintosh')) ? e.ctrlKey : e.altKey) 
			shortcuts(e, this); } ,false);
		  if (textarea1.originalValue==null) {
		      var text2=usoUnEscaper(textarea1.value);
		      textarea1.setAttribute('reverted', 'true');
		      textarea1.value=text2;
		      textarea1.originalValue=text2;
		    }
		}
	}
}

unsafeWindow.replaceCodeBlocks=function(form)
{
	var array1=form.getElementsByTagName("TEXTAREA");
	
	for(var num1=0;num1<array1.length;num1++) 
	{
		var textarea1=array1[num1];
		var text1=textarea1.value;
		textarea1.originalValue=text1;
		textarea1.value=usoEscaper(text1);
		if (textarea1.getAttribute('reverted')) textarea1.removeAttribute('reverted');
	}
}

function revertTextAreas(e)
{
	var array1=document.getElementsByTagName("TEXTAREA");
	for(var num1=0;num1<array1.length;num1++) 
	{
		var textarea1=array1[num1];
		if (textarea1.originalValue) textarea1.value=textarea1.originalValue;
	}
}

function inCodeBlock(before, selected, after) {
  if (selected.match(/<\/{0,1}(code|pre)>/i))
    return false;

  var temp,
      b4Blocks = (temp=before.match(/<(code|pre)>(?:.|\s)*?<\/\1>/gmi)) ? temp.length : 0,
      b4OpenTags = (temp=before.match(/<(?:code|pre)>/gi)) ? temp.length : 0;

  if (b4OpenTags <= b4Blocks)
    return false;

  var afBlocks = (temp=after.match(/<(code|pre)>(?:.|\s)*?<\/\1>/gmi)) ? temp.length : 0,
      afCloseTags = (temp=after.match(/<\/(?:code|pre)>/gi)) ? temp.length : 0;

  return afCloseTags > afBlocks;
}

// Shortcut code inspired by avg's script: http://userscripts.org/scripts/version/34094/39469.user.js?
function shortcuts(e, box) {
  var x=box.selectionStart,y=box.selectionEnd;
  var before = (box.value).substring(0,x);
  var selected=(box.value).substring(x,y);
  var after = (box.value).substring(y, (box.value).length);
  var tag, length;
      
  // The activate key is ctrl on mac and alt on everything else
  if (inCodeBlock(before, selected, after)) {
    switch((e.keyCode)?e.keyCode:e) {
    case 66: case 'b':tag="[strong]"+selected+"[/strong]";break;
    case 73: case 'i':tag="[em]"+selected+"[/em]";break;
    case 85: case 'u':tag="[ins]"+selected+"[/ins]";break;
    case 83: case 's':tag="[del]"+selected+"[/del]";break;
    case 65: case 'a':tag="[url=]"+selected+"[/url]";break;
    case 72:tag="[h4]"+selected+"[/h4]";break;
    case 76: case 'l':if (y-x>0) tag='[url='+((h=prompt('What do you want to link "'+selected+'" to?'))?h:'')+']'+selected+'[/url]';break;
    }
  } else {
    switch((e.keyCode)?e.keyCode:e) {
    case 67: case 'c':tag="<code>"+selected+"</code>";break;
    case 80: case 'p':tag="<pre>"+selected+"</pre>";break;
    case 66: case 'b':tag="<strong>"+selected+"</strong>";break;
    case 73: case 'i':tag="<em>"+selected+"</em>";break;
    case 85: case 'u':tag="<ins>"+selected+"</ins>";break;
    case 81: case 'q':tag="<blockquote>"+selected+"</blockquote>";break;
    case 83: case 's':tag="<del>"+selected+"</del>";break;
    case 65: case 'a':tag="<a href=\"\">"+selected+"</a>";break;
    case 88: case 'x':tag="<img src=\""+selected+"\" />";break;
    case 72:tag="<h4>"+selected+"</h4>";break;
    case 76: case 'l':if (y-x>0) tag='<a href="'+((h=prompt('What do you want to link "'+selected+'" to?'))?h:'')+'">'+selected+'</a>';break;
    }
  }
  if (tag) {
    var topScroll = box.scrollTop;
    box.value = before+tag+after;
    length = (y-x == 0) ? before.length + ((tag.length - 1) / 2) : y + tag.length;
    box.setSelectionRange(length, length);
    box.focus();
    box.scrollTop = topScroll;
    if (e.keyCode) e.preventDefault();
  }
}

// One-click quoting
function quote_handle(e) {
 e.preventDefault();

 var post_hentry = $x1('./ancestor::tr[contains(@class, "post hentry")]', e.target),
     post_id = post_hentry.id.split('row-')[1],
     user = $c('fn', post_hentry)[0].getElementsByTagName('a')[0],
     userName = user.getAttribute('text'),
     userUrl = '/users/'+user.getAttribute('user_id'),
     body = $("post-body-"+post_id),
     quoted = (select=window.getSelection()) && (select.focusNode) && (isPost(select, body.id)) ? 
              selectHTML(select, body) : body.innerHTML;
  
  if ( $("reply").getAttribute('style').match("display: none;") && ($("edit").offsetHeight > 0) && $("edit_post_body") ) 
    box = $("edit_post_body");
  else {
    box = $("post_body");
    
    // Reply needs to be opened
    if ($("reply").offsetHeight == 0) {
      $("reply").style.display = "block";
      $("post_body").value = '';
      if(!$xb(".//a[@class='quick_shortcut']", $('reply'))) 
      attachElements('reply'); // diff
      lengthenPage($('reply')); // diff
    }
  }

  box.focus();
  quoted = '<blockquote><strong><a href="'+userUrl+'">'+userName+'</a></strong>&nbsp;<a href="' +
    location.pathname+location.search+'#posts-'+post_id+'">wrote</a>:\n' +
    usoUnEscaper(quoted.replace(/^(<p>\s*<\/p>)/g,'').replace(/^(\s*<br>\s*)*\s*/,'').replace(/^\s*/,'').replace(/<pre>((?:.|\s)*?)<\/pre>/gmi,function(str,p1){return'<pre>'+p1.replace(/\n/g,'<br>')+'</pre>'}).replace(/\n/g, '').replace(/<!--((?:.|\n)*)-->/, '').replace(/<br>/g, '\n').replace(/<p>/g, '').replace(/<\/p>/g, "\n").replace(/^\s+|\s+$/g, '').replace(/ {2,}/g,' ')) +
    '</blockquote>\n'; // diff

  if (box.value == '') {
    box.value = quoted;
    box.scrollTop = box.scrollHeight;
  } else {
    var x, y;
    if ( (y=box.selectionEnd) - (x=box.selectionStart) == 0 ) { // insert quote at cursor
      box.value = (box.value).substring(0, x) + quoted + '\n' + (box.value).substring(y, (box.value).length);
      var len = ((box.value).substring(0, x) + quoted).length
      box.setSelectionRange(len, len); 
    } else { // append quote
      if(/\n$/.test(box.value)) 
        box.value = box.value.replace(/\n+$/,'');
      box.value += quoted;
      box.scrollTop = box.scrollHeight;
    }
  }
}

// One-click spam reporting by Avg http://userscripts.org/scripts/show/47097
function report_handle(e) {
  e.preventDefault();
  var l=$x1('.//span[@class="fn"]/a', e.target.parentNode.parentNode);
  var spammerLink = '/users/'+l.getAttribute('user_id');
  var spammer = l.getAttribute('text');
  if (!confirm("Report \""+spammer+"\" as a spammer?"))
    return;
  var post=$x1('.//a[@rel="bookmark"]', e.target.parentNode.parentNode);
  var btn=e.target;
  var ref="http://"+location.host+"/topics/9/posts";
  var comments = prompt("Any specific comments about spammer \"" + spammer + "\"?") || "";
  e.target.disabled=true;
  var report="<a href=\""+spammerLink+"\">"+spammer+"</a> is a <a href=\"" + 
             spammerLink+"/posts\">spammer</a>, most recently on topic <a href=\"" +
             location.pathname+location.search+"\">"+
             document.getElementById("topic-title").firstChild.nodeValue.replace(/\s+/g," ").replace(/^\s+|\s+$/g,"").replace(/</g,"&lt;") +
             "</a>, with <a href=\""+post.pathname+post.search+post.hash+"\">this post</a>.";
  if(!/^\s*$/g.test(comments))
    report+="\n"+comments;
  xhr(ref, 
      function() { btn.textContent="Reported!" }, 
      "authenticity_token="+encodeURIComponent(unsafeWindow.auth_token)+"&post%5Bbody%5D="+encodeURIComponent(report)+"&commit=Post+reply"
  );
}	

// One click post deleting by Avg http://userscripts.org/scripts/show/53970
function delete_handle(e) {
  e.preventDefault();
  var post = e.target.parentNode.parentNode.parentNode;
  if (confirm("Delete this post?")) 
    xhr("http://userscripts.org"+location.pathname+"/posts/"+post.id.match(/\d+/)[0],
        function() { remove(post) },
        "_method=delete&authenticity_token="+encodeURIComponent(unsafeWindow.auth_token)
    );
}


function lengthenPage(what) { if(!$('drag_reply')) document.documentElement.style.height = (window.height + what.offsetHeight - $('footer').offsetHeight) + "px"; }

function createElements() {
$('tempPreviewHolder').appendChild(
    create('input', {
        id: 'previewBtn',
        type: 'button',
        value: 'Preview',
        title: 'Inline preview',
        onclick: function (e) {
            box = e.target.parentNode.parentNode.parentNode.getElementsByTagName("textarea")[0];
            xhr('http://userscripts.org/posts/preview', function (html) {
                previewPost(html, box)
            },
	    'body=' + encodeURIComponent(usoEscaper(box.value)));
            e.preventDefault();
        }
    }));
    $('tempPreviewHolder').appendChild(create('input', {
        id: 'editBtn',
        type: 'button',
        value: 'Edit',
        title: 'Continue editing',
        onclick: function (e) {
            editPost(e.target.parentNode.parentNode.parentNode.getElementsByTagName("textarea")[0]);
            e.preventDefault();
        }
    }));
    $('tempPreviewHolder').appendChild(create("span", {
        id: 'preview_spacer',
        innerHTML: '&nbsp;'
    }));
    $('tempPreviewHolder').appendChild(create('table', {
        id: 'post_preview',
        className: 'posts',
        style: 'width:100%;background-color:#FFF;display:none;overflow-y: auto;max-height: 280px;',
    },
    create('tr', {
        className: 'post hentry',
        width: '100%'
    },
    create('td', {
        className: 'body entry-content',
        id: 'preview_body',
        width: '100%'
    }))));
}

// Toggle functions
function previewPost(html, box) {
  box.style.display = "none";
  $('post_preview').style.display = "block";
  $('preview_body').innerHTML = html.replace(/\n{2,}/g, '<br>');
  $('previewBtn').style.display = "none";
  $('editBtn').style.display = "inline";
}
function editPost(box) {
  box.style.display = "block";
  $('post_preview').style.display = "none";
  $('preview_body').innerHTML = '';
  $('editBtn').style.display = "none";
  $('previewBtn').style.display = "inline";
}

// Get the HTML from a selected area of a post
function selectHTML(sel, body) {
  var range = sel.getRangeAt(0),
      holder = create('div', {}),
      parent = range.commonAncestorContainer,
      tag_queue = [];

  // Build the tag creation queue
  for (var node = parent; node.id ? node.id != body.id : true; node = node.parentNode) {
    if (node.tagName && node.attributes) {
      var atts = node.attributes, 
          thisTag = [], 
          thisAtts = {}, 
          auth_link, 
          wrote_link;

      thisTag.push(node.tagName.toLowerCase());

      for(var i = 0, len=atts.length; i< len; ++i)
        thisAtts[atts[i].name] = atts[i].value;

      thisTag.push(thisAtts);

      if (node.tagName == "BLOCKQUOTE" && 
          (auth_link=$x1('./strong/a[1]', node)) && 
          (/http:\/\/userscripts\.org\/users\/[^\/]+/.test(auth_link.href))) {
            var xtra = {};
            xtra.auth = [auth_link.textContent, auth_link.pathname];

            if( (wrote_link=$x1('./a[1]', node)) && 
                (/http:\/\/userscripts\.org\/topics\/\d+.*(#posts-\d+)?/.test(wrote_link.href)) )
                  xtra.wrote = wrote_link.pathname+wrote_link.search+wrote_link.hash;

            thisTag.push(xtra);
      }

      tag_queue.push(thisTag);
    }
  }

  var lastNode = holder;

  // Build the wrapper elements
  if (tag_queue.length > 0)
    for (var i = tag_queue.length - 1; i >= 0; --i) {
      var newNode = create(tag_queue[i][0], tag_queue[i][1]), 
          xtra = tag_queue[i][2];

      if (xtra) { // Append nested quote attribution
        newNode.appendChild(create('strong', {innerHTML:'<a href="'+xtra.auth[1]+'">'+xtra.auth[0]+'</a>'}));
        newNode.innerHTML += '&nbsp;';
        newNode.appendChild(xtra.wrote ? create('a', {href:xtra.wrote, textContent:'wrote'}) : create('wrote'));
        newNode.appendChild(create(':'));
        newNode.appendChild(create('br', {}));
      }

      lastNode.appendChild(newNode);
      lastNode = newNode;
    }

  lastNode.appendChild(range.cloneContents()); // Append the actual quoted HTML

  range.detach(); // Free the range now that we're done with it
  return holder.innerHTML
}

function isPost(sel, id) {
  return sel.getRangeAt(0).commonAncestorContainer.tagName != "TBODY" && $xb('./ancestor::td[@id="'+id+'"]', sel.focusNode);
}

function attachElements(type) {
  $(type).appendChild(create('span',{className:'commentFixEditboxLoaded'}));

  var checker=setInterval(function(){
      if(type!='edit'||!$xb('./span[@class="commentFixEditboxLoaded"]', $(type))) {
	clearInterval(checker);
	
	// Preview Setup
	submit=$x1(".//input[@name='commit' and @type='submit']", $(type));
	box = $(type).getElementsByTagName("textarea")[0];
	if (!$('post_preview')) createElements();
	insertAfter($('previewBtn'), submit);
	insertAfter($('preview_spacer'), submit);
	insertAfter($('editBtn'), $('previewBtn'));	
	insertAfter($('post_preview'), box);
	editPost(box);
	// End Preview

	if ($(type).offsetHeight>0) lengthenPage($(type));
	var topTd, bottomTd, deleteBtn, cancel, span, cross;

	if (topTd=$x1('.//h5/child::text()[contains(., "Presentational HTML allowed")]/ancestor::td', $(type))) {
	  tbody=topTd.parentNode.parentNode;
	  bottomTd=tbody.getElementsByTagName("tr")[1].getElementsByTagName("td")[0];

	  if (deleteBtn=$x1('.//a[@class="utility"]/child::text()[contains(., "delete post")]', $(type))) {
	    cancel = $x1('.//a/child::text()[contains(., "cancel")]', $(type)).parentNode;
	    span = cancel.parentNode;
	    span.appendChild(document.createTextNode(" or "));
	    deleteBtn.parentNode.setAttribute('style', 'float:none;display:inline;');
	    deleteBtn.parentNode.addEventListener("click", function() { lengthenPage($('edit')); },false);
	    cancel.addEventListener("click", function() { lengthenPage($('edit')); },false);
	    span.parentNode.insertBefore(deleteBtn.parentNode, span.nextSibling);
	  }
          
          // Fucking massive block of HTML below :(
	  topTd.innerHTML = '<h5>Posting Code</h5><h5>Use <code>&lt;code&gt;</code> for inline code and <code>' +
	    '&lt;pre&gt;</code> for code blocks.</h5><h5>Shortcuts</h5><h5>Highlight text and press <code>' +
	    ((window.navigator.userAgent.match('Macintosh')) ? 'Ctrl' : 'Alt') +
	    ' +...</code><table style="font-weight:normal;font-size:11px;"><tr style="padding:0px;" valign="top">' +
	    '<td style="padding:0px;padding-right:20px;"><code><a href="#" class="quick_shortcut">c</a></code> - ' +
	    '<code style="background-color: rgb(238, 238, 238);border-top-color: rgb(51, 51, 51);border-top-style' +
	    ': none;border-top-width: 0px;color:#000;">&lt;code&gt; block</code></td><td style="padding:0px;"><co' +
	    'de><a href="#" class="quick_shortcut">p</a></code> - <pre style="padding:0px;display:inline;color:#0' +
	    '00;background-color: rgb(238, 238, 238);border-bottom-color: rgb(204, 204, 204);border-bottom-style:' +
	    ' solid;border-bottom-width: 1px;border-left-color: rgb(221, 221, 221);border-left-style: solid;borde' +
	    'r-left-width: 3px;border-top-color: rgb(204, 204, 204)">&lt;pre&gt; block</pre></td></tr><tr style="' +
	    'padding:0px;"><td style="padding:0px;"><code><a href="#" class="quick_shortcut">q</a></code> - <bloc' +
	    'kquote style="padding:0px;display:inline;background-color: rgb(238, 255, 204);border-bottom-color: r' +
	    'gb(204, 221, 170);border-bottom-style: solid;border-bottom-width: 1px;border-left-color: rgb(153, 17' +
	    '0, 119);border-left-style: solid;border-left-width: 3px;border-top-color: rgb(204, 221, 170);margin:' +
	    '0px;color:#000;">&lt;blockquote&gt;</blockquote></td><td style="padding:0px;"><code><a href="#" clas' +
	    's="quick_shortcut">b</a></code> - <strong>bold</strong></td></tr><tr style="padding:0px;"><td style=' +
	    '"padding:0px;"><code><a href="#" class="quick_shortcut">i</a></code> - <em>italics</em></td><td styl' +
	    'e="padding:0px;"><code><a href="#" class="quick_shortcut">u</a></code> - <ins>underline</ins></td></' +
	    'tr><tr style="padding:0px;"><td style="padding:0px;"><code><a href="#" class="quick_shortcut">s</a><' +
	    '/code> - <del style="color:#FFF;">strikethrough</del></td><td style="padding:0px;"><code><a href="#"' +
	    ' class="quick_shortcut">l</a></code> - <a href="javascript:void(0);" class="example_link">linking</a' +
	    '> (prompt)</td></tr><tr style="padding:0px;"><td style="padding:1px;"><code><a href="#" class="quick' +
	    '_shortcut">a</a></code> - &lt;a href=&quot;&quot;&gt;<a href="javascript:void(0);" class="example_li' +
	    'nk">link</a>&lt;/a&gt;</td><td style="padding:0px;"><code><a href="#" class="quick_shortcut">x</a></' +
	    'code> - &lt;img src=&quot;<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/' +
	    '9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAHwSURBVDjLpZM9a1RBFIafM/' +
	    'fevfcmC7uQjWEjUZKAYBHEVEb/gIWFjVVSWEj6gI0/wt8gprPQykIsTP5BQLAIhBVBzRf52Gw22bk7c8YiZslugggZppuZ55z3nf' +
	    'dICIHrrBhg+ePaa1WZPyk0s+6KWwM1khiyhDcvns4uxQAaZOHJo4nRLMtEJPpnxY6Cd10+fNl4DpwBTqymaZrJ8uoBHfZoyTqTYz' +
	    'vkSRMXlP2jnG8bFYbCXWJGePlsEq8iPQmFA2MijEBhtpis7ZCWftC0LZx3xGnK1ESd741hqqUaqgMeAChgjGDDLqXkgMPTJtZ3KJ' +
	    'zDhTZpmtK2OSO5IRB6xvQDRAhOsb5Lx1lOu5ZCHV4B6RLUExvh4s+ZntHhDJAxSqs9TCDBqsc6j0iJdqtMuTROFBkIcllCCGcSyt' +
	    'FNfm1tU8k2GRo2pOI43h9ie6tOvTJFbORyDsJFQHKD8fw+P9dWqJZ/I96TdEa5Nb1AOavjVfti0dfB+t4iXhWvyh27y9zEbRRobG' +
	    '7z6fgVeqSoKvB5oIMQEODx7FLvIJo55KS9R7b5ldrDReajpC+Z5z7GAHJFXn1exedVbG36ijwOmJgl0kS7lXtjD0DkLyqc70uPnS' +
	    'uIIwk9QCmWd+9XGnOFDzP/M5xxBInhLYBcd5z/AAZv2pOvFcS/AAAAAElFTkSuQmCC" />&quot; /&gt;</td></tr></table>' +
	    '...or just click the links above.</h5>';

	  forEach($c('quick_shortcut'), function(link) {
	      link.addEventListener("click", 
				    function(e) { 
				      var box = $x1("./ancestor::tbody//textarea", e.target);
				      shortcuts(e.target.textContent, box); 
				      e.preventDefault(); 
				    },false);
	    });

	  topTd.setAttribute('width', '45%');    
	  if (cross=$x1(".//img[@alt='Cross']/..", tbody)) remove(cross);

	  if(type=='edit') {
	    $x1('.//input[@name="commit" and @type="submit"]', 
		$('edit')).addEventListener("click", 
					    function(e) { 
					      $('edit').style.display = 'none'; 
					      lengthenPage($('edit')); 
					    }, false);
	  } else {
	    $x1('.//text()[contains(., "cancel")]/..', 
		$('reply')).parentNode.addEventListener("click", 
					     function(e) {
					       $('reply').style.display = 'none';
					       lengthenPage($('reply')); 
					       $('post_body').value = ''; 
					     },false);
	  }
	}
      }
    },10);
}
															
if ($xb("//a[contains(@class,'utility')]/child::text()[.='Reply to topic' or .='Add a comment']")) {
  forEach($x('//td[@class="author vcard"]//span[@class="role"]'), 
	  function(role) {
	    var editLink, deleteLink;
	    if (editLink=$x1(".//span[@class='edit']", role.parentNode)) {
	      
	      deleteLink = create('a', 
			    {href: '#', 
			     className: 'utility', 
			     textContent: 'Delete post', 
			     style: 'display: block; clear: both; color: #666; padding-top: 3px;', 
			     onclick: function(e) { delete_handle(e); }});
	      insertAfter(deleteLink, editLink);
	      var temp = role;
	      role = deleteLink;
	    } else {
	      insertAfter(create('a', 
			    {href: '#', 
			     className: 'utility', 
			     textContent: 'Report Spam', 
			     style: 'display: block; clear: both; padding-bottom: 3px;', 
			     onclick: function(e) { report_handle(e); }}), role);
	    }

	    insertAfter(create('a', {href: '#', 
			             className: 'utility', 
			             textContent: 'Quote', 
		                     style: 'display: block; clear: both; padding-top: 3px;'+(editLink?' color: #666;':''), 
		                     onclick: function(e) { quote_handle(e); }}), role);

	    role = (temp||role);
	    role.parentNode.style.height = "100%";
	    role.parentNode.insertBefore(create('td', {style:'width: 100%;height: 100%; vertical-align:bottom; float:left; padding-left:0px; margin-left:0px; margin-bottom:0px;padding-bottom:0px;padding-top:0px;margin-top:0px;'},
						  create('a', {href: '#header', 
							textContent: '⇑', 
							style: 'font-size:14px;align:left;'}), 
						  create(' | '),
						  create('a', {href: '#footer', 
							textContent: '⇓', 
							style: 'font-size:14px;align:left;'})), 
					 role.parentNode.firstChild);
	  });


  window.height = window.innerHeight + window.scrollMaxY;
  forEach($x('//a[contains(@class,"utility")]/child::text()[.="Edit post" or .="Reply to topic" or .="Add a comment" or .="Edit"]'), 
	  function(node) {		
	    node.parentNode.addEventListener('click',
					     function (e) { 
					       attachElements(e.target.textContent.replace(/ (to topic|post)/, '').replace(/(.*comment)/, 'reply').toLowerCase());
					       e.preventDefault(); 
					     },false);
	  });

  // A couple of style fixes for priview
  GM_addStyle("#preview_body pre  { width: 95% !important; white-space:pre-wrap !important; } #preview_body code { background-color: rgb(238, 238, 238) !important; } #preview_body blockquote  { min-width: 500px !important; margin-right: 5px !important; padding-top: 1px !important; padding-bottom: 1px !important; }");

  // Create a holder for the elements
  document.body.appendChild(create('div',{id:"tempPreviewHolder", style:"display: none;"}));

  // Put the elements in the starting position
  if(starting=$('new_topic')||$('reply')) attachElements(starting.id);
  
}