// GM_config
// version        1.2.3
// copyright      JoeSimmons & SizzleMcTwizzle & IzzySoft

var GM_config = {
 storage: 'GM_config', // This needs to be changed to something unique
 init: function() {
	for(var i=0,l=arguments.length,arg; i<l; i++) {
		arg=arguments[i];
		switch(typeof arg) {
			case 'object': for(var j in arg) {
				if (typeof arg[j] == 'function') {
					if (j=='open') 
                                          this.onOpen=arg[j];
					else if (j=='close')
                                          this.onClose=arg[j];
					else if (j=='save') 
                                          this.onSave=arg[j];
				} else var settings = arg;
			} break;
			case 'function': this.onOpen = arg; break;
			case 'string': if(arg.indexOf('{')!=-1&&arg.indexOf('}')!=-1) var css = arg;
				else this.title = arg;
				break;
		}
	}
	if(!this.title) this.title = 'Settings - Anonymous Script';
	var stored = this.read(),
		passed_settings = {},
		passed_values = {},
		typewhite = /number|string|boolean/;
	for (var i in settings) {
		passed_settings[i] = settings[i];
		passed_values[i] = (stored[i]=='false' && settings[i]['default']===true)? false : (((typewhite.test(typeof stored[i]))?stored[i]:false)||settings[i]['default']||'');
	}
	this.settings = passed_settings;
	this.values = passed_values;
	if (css) this.css.stylish = css;
 },
 open: function() {
 var that=GM_config;
 if(document.evaluate("//iframe[@id='GM_config']",document,null,9,null).singleNodeValue) return;
	// Create frame
	document.body.appendChild((that.frame=that.create('iframe',{id:'GM_config',src:'about:blank',style:'position:fixed; top:0; left:0; opacity:0; display:none; z-index:999; width:75%; height:75%; max-height:95%; max-width:95%; border:1px solid #000000; overflow:auto;'})));
        that.frame.contentWindow.location = that.frame.src; // In WebKit src is ignored
	that.frame.addEventListener('load', function(){
		var obj = GM_config, frameBody = this.contentDocument.getElementsByTagName('body')[0], create=obj.create, settings=obj.settings;
		obj.frame.contentDocument.getElementsByTagName('head')[0].appendChild(obj.create('style',{type:'text/css',textContent:obj.css.basic+obj.css.stylish}));

		// Add header and title
		frameBody.appendChild(obj.create('div', {id:'header',className:'config_header block center', textContent:obj.title}));

		// Append elements
		var anch = frameBody, secNo = 0; // anchor to append elements
		for (var i in settings) {
			var type, field = settings[i], Options = field.options, label = field.label, value = obj.values[i];
			if (field.section) {
				anch = frameBody.appendChild(create('div', {className:'section_header_holder', kids:[
				  create('div', {className:'section_header center',innerHTML:field.section[0]})],
				  id:'section_'+secNo}));
				if(field.section[1]) anch.appendChild(create('p', {className:'section_desc center',innerHTML:field.section[1]}));
				secNo++;
			}
			switch(field.type) {
				case 'textarea':
					anch.appendChild(create('div', {title:field.title||'',kids:[
						create('span', {textContent:label, className:'field_label'}),
						create('textarea', {id:'field_'+i,innerHTML:value,cols:(field.cols?field.cols:20),rows:(field.rows?field.rows:2)})
					], className: 'config_var'}));
					break;
				case 'radio':
					var boxes = [];
					for (var j = 0,len = Options.length; j<len; j++) {
						boxes.push(create('span', {textContent:Options[j]}));
						boxes.push(create('input', {value:Options[j],type:'radio',name:i,checked:Options[j]==value?true:false}));
					}
					anch.appendChild(create('div', {title:field.title||'',kids:[
						create('span', {textContent:label, className:'field_label'}),
						create('div', {id:'field_'+i,kids:boxes})
					], className: 'config_var'}));
					break;
				case 'select':
					var options = new Array();
					for (var j in Options) options.push(create('option',{textContent:Options[j],value:j,selected:(value?(value==j):(Options[j]==field['default']))}));
					anch.appendChild(create('div', {title:field.title||'',kids:[
						create('span', {textContent:label, className:'field_label'}),
						create('select',{id:'field_'+i,kids:options})
					], className: 'config_var'}));
					break;
				case 'checkbox':
					anch.appendChild(create('div', {title:field.title||'',kids:[
						create('label', {textContent:label, className:'field_label', "for":'field_'+i}),
						create('input', {id:'field_'+i,type:'checkbox',value:value,checked:!value||value==''?false:true})
					], className: 'config_var'}));
					break;
				case 'button':
				var tmp;
					anch.appendChild(create('div', {kids:[
						(tmp=create('input', {id:'field_'+i,type:'button',value:label,size:(field.size?field.size:25),title:field.title||''}))
					], className: 'config_var'}));
					if(field.script) obj.addEvent(tmp, 'click', field.script);
					break;
				case 'hidden':
				anch.appendChild(create('div', {title:field.title||'',kids:[
						create('input', {id:'field_'+i,type:'hidden',value:value})
					], className: 'config_var'}));
					break;
				default:
					anch.appendChild(create('div', {title:field.title||'',kids:[
						create('span', {textContent:label, className:'field_label'}),
						create('input', {id:'field_'+i,type:'text',value:value,size:(field.size?field.size:25)})
					], className: 'config_var'}));
			}
		}

		// Add save and close buttons
		frameBody.appendChild(obj.create('div', {id:'buttons_holder', kids:[
			obj.create('button',{id:'saveBtn',textContent:'Save',title:'Save options and close window',className:'saveclose_buttons',onclick:function(){GM_config.close(true)}}),
			obj.create('button',{id:'cancelBtn', textContent:'Cancel',title:'Close window',className:'saveclose_buttons',onclick:function(){GM_config.close(false)}}),
			obj.create('div', {className:'reset_holder block', kids:[
			obj.create('a',{id:'resetLink',textContent:'Restore to default',href:'#',title:'Restore settings to default configuration',className:'reset',onclick:obj.reset})
		]})]}));

		obj.center(); // Show and center it
		window.addEventListener('resize', obj.center, false); // Center it on resize
		if (obj.onOpen) obj.onOpen(); // Call the open() callback function
		
		// Close frame on window close
		window.addEventListener('beforeunload', function(){GM_config.remove(this);}, false);
	}, false);
 },
 close: function(save) {
	if(save) {
		var type, fields = this.settings, isNum=/^[\d\.]+$/, typewhite=/radio|text|hidden|checkbox/;
		for(f in fields) {
			var field = this.frame.contentDocument.getElementById('field_'+f);
			if(typewhite.test(field.type)) type=field.type;
			else type=field.tagName.toLowerCase();
			switch(type) {
				case 'text':
					this.values[f] = (this.settings[f].type=='text') ? field.value : (((isNum.test(field.value||field.value=='0'))&&(this.settings[f].type=='int'||this.settings[f].type=='float'))?parseFloat(field.value):false);
					if(this.values[f]===false) {
                                          alert('Invalid type for field: '+f+'\nPlease use type: '+this.settings[f].type);
                                          return;
                                        }
					break;
				case 'hidden':
					this.values[f] = field.value.toString();
					break;
				case 'textarea':
					this.values[f] = field.value;
					break;
				case 'checkbox':
					this.values[f] = field.checked;
					break;
				case 'select':
					this.values[f] = field[field.selectedIndex].value;
					break;
				case 'div':
					var radios = field.getElementsByTagName('input');
					if(radios.length>0) for(var i=radios.length-1; i>=0; i--) {
						if(radios[i].checked) this.values[f] = radios[i].value;
					}
					break;
			}
		}
                if(this.onSave) this.onSave(); // Call the save() callback function
                this.save();
	}
	if(this.frame) this.remove(this.frame);
	delete this.frame;
        if(this.onClose) this.onClose(); //  Call the close() callback function
 },
 set: function(name,val) {
	this.values[name] = val;
 },
 get: function(name) {
	return this.values[name];
 },
 isGM: typeof GM_getValue != 'undefined' && typeof GM_getValue('a', 'b') != 'undefined',
 log: (!this.isGM) ? ((window.opera) ? opera.postError : console.log) : GM_log,
 save: function() {
    if (!this.isGM)
      var GM_setValue = function(name, value) { return localStorage.setItem(name, value) };
    var stringify = typeof JSON == 'undefined' ? uneval : JSON.stringify;
    try {
      GM_setValue(this.storage, stringify(this.values));
    } catch(e) {
      this.log("GM_config failed to save settings!");
    }
 },
 read: function() {
    if (!this.isGM) {
      var GM_getValue = function(name, defaultValue) { return localStorage.getItem(name) || defaultValue };
      var defaultValue = '{}';
    } else
      var defaultValue = '({})';
    var parse = typeof JSON == 'undefined' ? eval : JSON.parse;
    try {
      var rval = parse(GM_getValue(this.storage, defaultValue));
    } catch(e) {
      this.log("GM_config failed to read saved settings!");
      var rval = {};
    }
    return rval;
 },
 reset: function(e) {
	e.preventDefault();
	var type, obj = GM_config, fields = obj.settings;
	for(f in fields) {
		var field = obj.frame.contentDocument.getElementById('field_'+f);
		if(field.type=='radio'||field.type=='text'||field.type=='checkbox') type=field.type;
		else type=field.tagName.toLowerCase();
		switch(type) {
			case 'text':
				field.value = obj.settings[f]['default'] || '';
				break;
			case 'hidden':
				field.value = obj.settings[f]['default'] || '';
				break;
			case 'textarea':
				field.value = obj.settings[f]['default'] || '';
				break;
			case 'checkbox':
				field.checked = obj.settings[f]['default'] || false;
				break;
			case 'select':
				if(obj.settings[f]['default']) {
					for(var i=field.options.length-1; i>=0; i--)
					if(field.options[i].value==obj.settings[f]['default']) field.selectedIndex=i;
				}
				else field.selectedIndex=0;
				break;
			case 'div':
				var radios = field.getElementsByTagName('input');
				if(radios.length>0) for(var i=radios.length-1; i>=0; i--) {
					if(radios[i].value==obj.settings[f]['default']) radios[i].checked=true;
				}
				break;
		}
	}
 },
 values: {},
 settings: {},
 css: {
 basic: 'body {background:#FFFFFF;}\n' +
 '.indent40 {margin-left:40%;}\n' +
 '* {font-family: arial, tahoma, sans-serif, myriad pro;}\n' +
 '.field_label {font-weight:bold; font-size:12px; margin-right:6px;}\n' +
 '.block {display:block;}\n' +
 '.saveclose_buttons {\n' +
 'margin:16px 10px 10px 10px;\n' +
 'padding:2px 12px 2px 12px;\n' +
 '}\n' +
 '.reset, #buttons_holder, .reset a {text-align:right; color:#000000;}\n' +
 '.config_header {font-size:20pt; margin:0;}\n' +
 '.config_desc, .section_desc, .reset {font-size:9pt;}\n' +
 '.center {text-align:center;}\n' +
 '.section_header_holder {margin-top:8px;}\n' +
 '.config_var {margin:0 0 4px 0;}\n' +
 '.section_header {font-size:13pt; background:#414141; color:#FFFFFF; border:1px solid #000000; margin:0;}\n' +
 '.section_desc {font-size:9pt; background:#EFEFEF; color:#575757; border:1px solid #CCCCCC; margin:0 0 6px 0;}\n' +
 'input[type="radio"] {margin-right:8px;}',
 stylish: ''},
 create: function(a,b) {
	var ret=window.document.createElement(a);
	if(b) for(var prop in b) {
		if(prop.indexOf('on')==0) ret.addEventListener(prop.substring(2),b[prop],false);
		else if(prop=="kids" && (prop=b[prop])) for(var i=0; i<prop.length; i++) ret.appendChild(prop[i]);
		else if(",style,accesskey,id,name,src,href,for".indexOf(","+prop.toLowerCase())!=-1) ret.setAttribute(prop, b[prop]);
		else ret[prop]=b[prop];
	}
	return ret;
 },
 center: function() {
	var node = GM_config.frame, style = node.style, beforeOpacity = style.opacity;
	if(style.display=='none') style.opacity='0';
	style.display = '';
	style.top = Math.floor((window.innerHeight/2)-(node.offsetHeight/2)) + 'px';
	style.left = Math.floor((window.innerWidth/2)-(node.offsetWidth/2)) + 'px';
	style.opacity = '1';
 },
 run: function() {
    var script=this.getAttribute('script');
    if(script && typeof script=='string' && script!='') {
      func = new Function(script);
      setTimeout(func, 0);
    }
 },
 addEvent: function(el,ev,scr) { el.addEventListener(ev, function() { typeof scr == 'function' ? setTimeout(scr, 0) : eval(scr) }, false); },
 remove: function(el) { if(el && el.parentNode) el.parentNode.removeChild(el); }
};