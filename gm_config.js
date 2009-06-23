// GM_config
// version        1.0.8
// copyright      JoeSimmons & SizzleMcTwizzle & IzzySoft

var GM_config = {
 init: function() {
	for(var arg,i=arguments.length-1; i>=0; i--) {
	arg=arguments[i];
	switch(typeof arg) {
	case 'object': for (var j in arg) {
	    if (typeof arg[j] == 'function') {
	      if (j=='open') this.onOpen=arg[j]; 
	      else if (j=='close') this.onClose=arg[j];
	      else if (j=='save') this.onSave=arg[j];
	    } else {
	      var settings = arg;
	      break;
	    }
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
		passed_values = {};
    for (var i in settings) {
      passed_settings[i] = settings[i];
      passed_values[i] = (stored[i]===false && settings[i].default===true)? false : (stored[i]||settings[i].default||'');
    }
	this.settings = passed_settings;
	this.values = passed_values;
    if (css) this.css.stylish = css;
  },
 open: function() {
    window.document.body.appendChild((this.frame=this.create('iframe',{id:this.idR(6),src:'about:blank',style:'position:fixed; top:0; left:0; opacity:0; display:none; z-index:999; width:75%; height:75%; max-height:95%; max-width:95%; border:1px solid #000000; overflow:auto;'})));
	this.frame.addEventListener('load', function(){
	var obj = GM_config, frameBody = this.contentDocument.getElementsByTagName('body')[0], create=obj.create, settings=obj.settings;
	obj.frame.contentDocument.getElementsByTagName('head')[0].appendChild(obj.create('style',{type:'text/css',innerHTML:obj.css.basic+obj.css.stylish}));

	// Add header and title
	frameBody.appendChild(obj.create('div', {id:'header',className:'config_header_holder block indent40', kids:[
	obj.create('h1', {id:'config_header',className:'config_header',innerHTML:obj.title})
	]}));

	var fields = [];
	for (var i in settings) {
	var type, field = settings[i], Options = field.options, label = field.label, value = obj.values[i];
	if (field.section) {fields.push(create('div', {className:'section_header_holder',
		  kids:[
			create('h2', {className:'section_header center',innerHTML:field.section[0]})
			]}));
	if(field.section[1]) fields[fields.length-1].appendChild(create('p', {className:'section_desc indent40',innerHTML:field.section[1]}));
	}
	  switch(field.type) {
	  case 'textarea':
	    fields.push(create('div', {className:'indent40',title:field.title||'',kids:[
					    create('span', {textContent:label, className:'field_label'}),
					    create('textarea', {id:'field_'+i,innerHTML:value,cols:(field.cols?field.cols:20),rows:(field.rows?field.rows:2)})
					    ]}));
		break;
	  case 'radio':
	    var boxes = [];
	    for (var j = 0,len = Options.length; j<len; j++) {
		boxes.push(create('span', {textContent:Options[j]}));
		boxes.push(create('input', {value:Options[j],type:'radio',name:i,checked:Options[j]==value?true:false}));
			}
	    fields.push(create('div', {className:'indent40',title:field.title||'',kids:[
					     create('span', {textContent:label, className:'field_label'}),
					     create('div', {id:'field_'+i,kids:boxes})
					     ]}));
	    break;
	  case 'select':
	    options = [];
	    for (var j = 0,len = Options.length; j<len; j++)
	      options.push(create('option',{textContent:Options[j],selected:Options[j]==value?true:false}));
	    fields.push(create('div', {className:'indent40',title:field.title||'',kids:[
					     create('span', {textContent:label, className:'field_label'}),
					     create('select',{id:'field_'+i,kids:options})
					     ]}));
	    break;
	  case 'checkbox':
	    fields.push(create('div', {className:'indent40',title:field.title||'',kids:[
					    create('span', {textContent:label, className:'field_label'}),
					    create('input', {id:'field_'+i,type:'checkbox',value:value,checked:!value||value==''?false:true})
						]}));
	    break;
		case 'button':
		  fields.push(create('div', {className:'indent40',kids:[
					    (tmp=create('input', {id:'field_'+i,type:'button',value:label,size:(field.size?field.size:25),title:field.title||''}))
					    ]}));
		if (field.callback&&typeof field.callback=='function') tmp.addEventListener('click', field.callback, false);
		break;
	  default:   
	    fields.push(create('div', {className:'indent40',title:field.title||'',kids:[
					    create('span', {textContent:label, className:'field_label'}),
					    create('input', {id:'field_'+i,type:'text',value:value,size:(field.size?field.size:25)})
					    ]}));
	  }
	}
      frameBody.appendChild(create('div', {id:'config_fields',kids:fields}));

	// Add save and close buttons
	frameBody.appendChild(obj.create('div', {id:'buttons_holder', kids:[
	obj.create('button',{id:'saveBtn',textContent:'Save',title:'Save options and close window',className:'saveclose_buttons',onclick:function(){GM_config.close(true)}}),
	obj.create('button',{id:'cancelBtn', textContent:'Cancel',title:'Close window',className:'saveclose_buttons',onclick:function(){GM_config.close(false)}}),
	obj.create('div', {className:'reset_holder block', kids:[
	obj.create('a',{id:'resetLink',textContent:'Restore to default',href:'#',title:'Restore settings to default configuration',className:'reset',onclick:obj.reset})
	]})]}));

	obj.center(); // Show and center it
	window.addEventListener('resize', obj.center, false); // Center it on resize
	if (onOpen=obj.onOpen) onOpen(); // Call the open() callback function
	}, false);
  },
 close: function(save) {
    if(save) {
	var type, fields = this.settings;
	for(f in fields) {
	var field = this.frame.contentDocument.getElementById('field_'+f);
	if(field.type=='radio'||field.type=='text'||field.type=='checkbox') type=field.type;
	else type=field.tagName.toLowerCase();
	switch(type) {
	case 'text':
	this.values[f] = (!(num=+field.value)&&(!(t=this.settings[f].type)||t=='text')) ? field.value : (((isInt=/^\d+$/.test(field.value))&&this.settings[f].type=='int')||(/^[\d\.]+$/.test(field.value)||isInt)&&this.settings[f].type=='float') ? num : false;
	if (!this.values[f]) {alert('Invalid type for field: '+f+'\nPlease use type: '+this.settings[f].type);return}
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
	this.save();
	if (onSave=this.onSave) onSave(); // Call the save() callback function
	}
	if(this.frame) this.remove(this.frame);
        delete this.frame;
        if (onClose=this.onClose) onClose(); //  Call the close() callback function
  },
 set: function(name,val) {
    this.values[name] = val;
  },
 get: function(name) {
    return this.values[name];
  },
 save: function() {
    GM_setValue('GM_config', this.values.toSource());
  },
 read: function() {
    return eval(GM_getValue('GM_config', '({})'));
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
	field.value = obj.settings[f].default || '';
break;
	case 'textarea':
	field.value = obj.settings[f].default || '';
	break;
	case 'checkbox':
	field.checked = obj.settings[f].default || false;
	break;
	case 'select':
	if(obj.settings[f].default) {
	for(var i=field.options.length-1; i>=0; i--)
	if(field.options[i].value==obj.settings[f].default) field.selectedIndex=i;
	}
	else field.selectedIndex=0;
	break;
	case 'div':
	var radios = field.getElementsByTagName('input');
	if(radios.length>0) for(var i=radios.length-1; i>=0; i--) {
	if(radios[i].value==obj.settings[f].default) radios[i].checked=true;
	}
	break;
	}
  }
  },
 values: {},
 settings: {},
 css: {
 basic: <><![CDATA[
body {background:#fff;}
.indent40 {margin-left:40%;}
* {font-family:"myriad pro" arial tahoma "sans serif";}
.field_label {font-weight:bold; margin-right:6px;}
.block {display:block;}
.saveclose_buttons {
margin:16px 10px 10px 10px;
padding:2px 12px 2px 12px;
}
.reset, #buttons_holder, .reset a {text-align:right; color:#000;}
.config_header {font-size:24pt; margin:0;}
.config_desc, .section_desc, .reset {font-size:9pt;}
.center {text-align:center;}
#config_fields div {margin-bottom:8px;}
#config_fields div div {display:inline;}
#config_fields, .section_header_holder {margin-top:25px;}
.section_header {font-size:12pt; background:#414141; color:#FFF; border:1px solid #000;}
input[type="radio"] {margin-right:8px;}
]]></>.toString(),
 stylish: ''},
 create: function(a,b) {
	var ret=window.document.createElement(a);
	if(b) for(var prop in b) {
		if(prop.indexOf('on')==0)
			ret.addEventListener(prop.substring(2),b[prop],false);
		else if(prop=="kids") {
			prop=b[prop];
			for(var i=0;i<prop.length;i++)
				ret.appendChild(prop[i]);
		}
		else if(prop=="style"||prop=="accesskey"||prop=="value") ret.setAttribute(prop, b[prop]);
		else
			ret[prop]=b[prop];
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
 idR: function(l) {
	var s='';l++;
	while(--l) s+=String.fromCharCode(Math.floor(Math.random() * 75) + 48);
	s = 'GM_config_'+s;
	if(!window.document.getElementById(s)) {return s;}
	else idR(4);
	},
 remove: function(el) { el.parentNode.removeChild(el); }
};
