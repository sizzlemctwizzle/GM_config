// XB_config
// version        dev0
// copyright      JoeSimmons & SizzleMcTwizzle & IzzySoft

// XB_config.init located at http://gmconfig.googlecode.com/svn/trunk/xb_config.js
(function() {
    window.XB_config.open = function() {
        var that=window.XB_config;
        if(document.evaluate("//iframe[@id='window.XB_config']",document,null,9,null).singleNodeValue) return;
        // Create frame
        that.frame=that.create('iframe',{
                                       'id': 'window.XB_config',
                                       'src': 'about:blank',
                                       'style' : 'position:fixed;' +
                                                 'top:0; left:0; opacity:0;' +
                                                 'display:none; z-index:999;' +
                                                 'width:75%; height:75%;' +
                                                 'max-height:95%; max-width:95%;' +
                                                 'border:1px solid #000000;' +
                                                 'overflow:auto;'});
        document.body.appendChild(that.frame);
	that.frame.addEventListener('load', function() {
		var obj = window.XB_config,
                          obj.frameDoc = this.contentDocument,
                          frameBody = this.frameDoc.getElementsByTagName('body')[0], 
                          create=obj.create, 
                          settings=obj.settings,
                          css=obj.create('style',{
                                                   type:'text/css',
                                                   textContent:obj.css.basic + obj.css.stylish});
                obj.frameDoc.getElementsByTagName('head')[0].appendChild(css);

		// Add header and title
		frameBody.appendChild(obj.create('div', {id:'header',className:'config_header block center', textContent:obj.title}));

		// Append elements
		var anch = frameBody, secNo = 0; // anchor to append elements
		for (var i in settings) {
			var type, field = settings[i], Options = field.options, label = field.label, value = obj.values[i];
			if (field.section) {
                          anch = frameBody.appendChild(create('div', {className:'section_header_holder', id:'section_'+secNo}, 
                                                              [create('div', {className:'section_header center',innerHTML:field.section[0]})]));
				if(field.section[1]) 
                                  anch.appendChild(create('p', {className:'section_desc center',innerHTML:field.section[1]}));
				secNo++;
			}
			switch(field.type) {
				case 'textarea':
					anch.appendChild(create('div', {title:field.title||'', className: 'config_var'},
                                                                [create('span', {textContent:label, className:'field_label'}),
                                                                 create('textarea', {id:'field_'+i,innerHTML:value,cols:(field.cols?field.cols:20),rows:(field.rows?field.rows:2)})
                                                                 ]));
					break;
				case 'radio':
					var boxes = [];
					for (var j = 0,len = Options.length; j<len; j++) {
						boxes.push(create('span', {textContent:Options[j]}));
						boxes.push(create('input', {value:Options[j],type:'radio',name:i,checked:Options[j]==value?true:false}));
					}
					anch.appendChild(create('div', {title:field.title||'', className: 'config_var'},
                                                                [create('span', {textContent:label, className:'field_label'}),
                                                                 create('div', {id:'field_'+i,kids:boxes})
                                                                 ]));
					break;
				case 'select':
					var options = new Array();
					for (var j in Options) options.push(create('option',{textContent:Options[j],value:j,selected:(value?(value==j):(Options[j]==field['default']))}));
					anch.appendChild(create('div', {title:field.title||'', className: 'config_var'}, 
                                                                [create('span', {textContent:label, className:'field_label'}),
                                                                 create('select',{id:'field_'+i,kids:options})
                                                                 ]));
					break;
				case 'checkbox':
                                  anch.appendChild(create('div', {title:field.title||'', className: 'config_var'},
                                                          [create('label', {textContent:label, className:'field_label', "for":'field_'+i}),
                                                           create('input', {id:'field_'+i,type:'checkbox',value:value,checked:!value||value==''?false:true})
                                                           ]));
					break;
				case 'button':
				var tmp;
                                anch.appendChild(create('div', {className: 'config_var'}, 
                                                        [(tmp=create('input', {id:'field_'+i,type:'button',value:label,size:(field.size?field.size:25),title:field.title||''}))
                                                         ]));
					if(field.script) obj.addEvent(tmp, 'click', field.script);
					break;
				case 'hidden':
				anch.appendChild(create('div', {title:field.title||'', className: 'config_var'},
                                                        [create('input', {id:'field_'+i,type:'hidden',value:value})
                                                         ]));
					break;
				default:
                                  anch.appendChild(create('div', {title:field.title||'',  className: 'config_var'}, 
                                                          [create('span', {textContent:label, className:'field_label'}),
                                                           create('input', {id:'field_'+i,type:'text',value:value,size:(field.size?field.size:25)})
                                                           ]));
			}
		}

		// Add save and close buttons
		frameBody.appendChild(obj.create('div', {id:'buttons_holder'}, [
			obj.create('button',{id:'saveBtn',textContent:'Save',title:'Save options and close window',className:'saveclose_buttons',onclick:function(){window.XB_config.close(true)}}),
			obj.create('button',{id:'cancelBtn', textContent:'Cancel',title:'Close window',className:'saveclose_buttons',onclick:function(){window.XB_config.close(false)}}),
			obj.create('div', {className:'reset_holder block'}, 
                                   [obj.create('a',{id:'resetLink',textContent:'Restore to default',href:'#',title:'Restore settings to default configuration',className:'reset',onclick:obj.reset})
                                    ])]));

		obj.center(); // Show and center it
		window.addEventListener('resize', obj.center, false); // Center it on resize
		if (obj.onOpen) obj.onOpen(); // Call the open() callback function
		
		// Close frame on window close
		window.addEventListener('beforeunload', function(){window.XB_config.remove(this);}, false);
	}, false);
    };

    window.XB_config.close = function(save) {
        if(this.onClose) this.onClose(); //  Call the close() callback function
	if(save) {
		if(this.onSave) this.onSave(); // Call the save() callback function
		var type, fields = this.settings, isNum=/^[\d\.]+$/, typewhite=/radio|text|hidden|checkbox/;
		for(f in fields) {
			var field = this.frame.contentDocument.getElementById('field_'+f);
			if(typewhite.test(field.type)) type=field.type;
			else type=field.tagName.toLowerCase();
			switch(type) {
				case 'text':
					this.values[f] = (this.settings[f].type=='text') ? field.value : (((isNum.test(field.value||field.value=='0'))&&(this.settings[f].type=='int'||this.settings[f].type=='float'))?parseFloat(field.value):false);
					if(this.values[f]===false) {alert('Invalid type for field: '+f+'\nPlease use type: '+this.settings[f].type);return}
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
	}
	if(this.frame) this.remove(this.frame);
	this.save();
	delete this.frame;
    };

    window.XB_config.set = function(name,val) {
      this.values[name] = val;
    };

    window.XB_config.save = function() {
      localStorage.setItem('window.XB_config', this.values.toSource());
    };

    window.XB_config.reset = function(e) {
      e.preventDefault();
      var type, obj = window.XB_config, fields = obj.settings;
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
    };

    window.XB_config.css.basic = 'body {background:#FFFFFF;}\n' +
                          '.indent40 {margin-left:40%;}\n' +
                          '* {font-family: arial, tahoma, sans-serif, myriad pro;}\n' +
                          '.field_label {font-weight:bold; margin-right:6px;}\n' +
                          '.block {display:block;}\n' +
                          '.saveclose_buttons {\n' +
                          'margin:16px 10px 10px 10px;\n' +
                          'padding:2px 12px 2px 12px;\n' +
                          '}\n.reset, #buttons_holder,' + 
                          '.reset a {text-align:right; color:#000000;}\n' +
                          '.config_header {font-size:24pt; margin:0;}\n' +
                          '.config_desc, .section_desc, .reset {font-size:9pt;}\n' +
                          '.center {text-align:center;}\n' +
                          '.section_header_holder {margin-top:25px;}\n' +
                          '.config_var {margin:0 0 4px 0;}\n' +
                          '.section_header {\n' +
                          'font-size:13pt;\nbackground:#414141;\n' +
                          'color:#FFFFFF;\nborder:1px solid #000000; margin:0;}\n' +
                          '.section_desc {font-size:9pt;\nbackground:#EFEFEF;\n' +
                          'color:#575757;\nborder:1px solid #CCCCCC;\nmargin:0 0 6px 0;}\n' +
                          'input[type="radio"] {margin-right:8px;}';

    window.XB_config.center = function() {
	var node = window.XB_config.frame, 
                   style = node.style, 
                   beforeOpacity = style.opacity;
	if(style.display=='none') 
            style.opacity='0';
	style.display = '';
	style.top = Math.floor((window.innerHeight/2)-(node.offsetHeight/2)) + 'px';
	style.left = Math.floor((window.innerWidth/2)-(node.offsetWidth/2)) + 'px';
	style.opacity = '1';
    };

    window.XB_config.run = function() {
        var script=this.getAttribute('script');
        if(script && typeof script=='string' && script!='') {
            func = new Function(script);
            setTimeout(func, 0);
        }
    };

    window.XB_config.addEvent = function(el,ev,scr) { 
        el.addEventListener(ev, function() { 
                                    typeof scr == 'function' ? setTimeout(scr, 0) : eval(scr) 
                                }, false); 
    };

    window.XB_config.remove = function(el) { 
      if(el && el.parentNode) 
          el.parentNode.removeChild(el); 
    };
 })();