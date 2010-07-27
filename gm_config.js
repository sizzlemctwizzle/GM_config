// @name              GM_config
// @version           1.4.0
// @contributors      JoeSimmons & SizzleMcTwizzle & IzzySoft & MartiMartz

/* Instructions
GM_config is now cross-browser compatible.

To use it in a Greasemonkey-only user script you can just @require it.

To use it in a cross-browser user script you will need to manually
include the code at the beginning of your user script. In this case
it is also very important you change the "storage" value below to
something unique to prevent collisions between scripts. Also remember
that in this case that stored settings will only be accessible on
the same domain they were saved.

In GM_config version 1.3 or greater, you can now create multiple instances
of GM_config using the GM_configStruct constructor. You can also pass your
settings to the constructor rather than init. For compatiblity with older
usage, the GM_config variable is pre-populated with an instance of GM_config.

If you are going to use multiple instances of GM_config you need to modify the 
"storage" property so that they use seperate storage spaces and the values don't
overwrite one another. In this case you are forced to pass settings through init().
*/

function GM_configStruct() {
    // define a few properties
    this.storage = 'GM_config'; // Changed to something unique for localStorage
    this.isGM = typeof GM_getValue != 'undefined' && 
                typeof GM_getValue('a', 'b') != 'undefined';
    this.fields = {};
    this.css = {
        basic:       "#GM_config * { font-family: arial,tahoma,myriad pro,sans-serif; }"
            + '\n' + "#GM_config { background: #FFF; }"
            + '\n' + "#GM_config input[type='radio'] { margin-right: 8px; }"
            + '\n' + "#GM_config .indent40 { margin-left: 40%; }"
            + '\n' + "#GM_config .field_label { font-weight: bold; font-size: 12px; margin-right: 6px; }"
            + '\n' + "#GM_config .block { display: block; }"
            + '\n' + "#GM_config .saveclose_buttons { margin: 16px 10px 10px; padding: 2px 12px; }"
            + '\n' + "#GM_config .reset, .reset a, #GM_config_buttons_holder { text-align: right; color: #000; }"
            + '\n' + "#GM_config .config_header { font-size: 20pt; margin: 0; }"
            + '\n' + "#GM_config .config_desc, .section_desc, .reset { font-size: 9pt; }"
            + '\n' + "#GM_config .center { text-align: center; }"
            + '\n' + "#GM_config .section_header_holder { margin-top: 8px; }"
            + '\n' + "#GM_config .config_var { margin: 0 0 4px; }"
            + '\n' + "#GM_config .section_header { font-size: 13pt; background: #414141; color: #FFF;" 
            + '\n' +  "border: 1px solid #000; margin: 0; }"
            + '\n' + "#GM_config .section_desc { font-size: 9pt; background: #EFEFEF; color: #575757;"
            + '\n' + "border: 1px solid #CCC; margin: 0 0 6px; }",
        stylish: ""
    };

    // Define value storing and reading API
    if (!this.isGM) {
        this.setValue = function (name, value) {
                                       return localStorage.setItem(name, value);
                        };
        this.getValue = function(name, def){
                            var s = localStorage.getItem(name); 
                            return s == null ? def : s
                        };

        // We only support JSON parser outside GM
        this.stringify = JSON.stringify;
        this.parser = JSON.parse;
    } else {
        this.setValue = GM_setValue;
        this.getValue = GM_getValue;
        this.stringify = typeof JSON == "undefined" ? 
                             function(obj) { 
                                 return obj.toSource();
                             } : JSON.stringify;
        this.parser = typeof JSON == "undefined" ? 
                          function(jsonData) {
                              return (new Function('return ' + jsonData + ';'))(); 
                          } : JSON.parse;
    }

    // call init() if settings were passed to constructor
    if (arguments.length)
        GM_configInit(this, arguments);
}

// This is the initializer function
function GM_configInit(obj, args) {
    // loop through GM_config.init() arguments
    for (var i = 0, l = args.length, arg; i < l; ++i) {
        arg = args[i];

        // An element to use as the config window
        if (typeof arg.appendChild == "function") {
          obj.frame = arg;
          continue;
        }

        switch (typeof arg) {
        case 'object':
            for (var j in arg) { // could be a callback functions or settings object
                if (typeof arg[j] != "function") { // we are in the settings object
                    var settings = arg; // store settings object
                    break; // leave the loop
                } // otherwise we must be in the callback functions object
                switch (j) {
                case "open": // called when the frame is opened and loaded
                    obj.onOpen = arg[j];
                    break; 
                case "close": // called when frame is gone
                    obj.onClose = arg[j];
                    break;
                case "save": // called when settings have been saved
                    obj.onSave = arg[j];
                    break; // store the settings objects
                }
            }
            break;
        case 'function':
            obj.onOpen = arg;
            break; // passing a bare function is set to open callback
            // could be custom CSS or the title string
        case 'string':
            if (arg.indexOf('{') != -1 && arg.indexOf('}') != -1) 
                var css = arg;
            else 
                obj.title = arg;
            break;
        }
    }
    // if title wasn't passed through init()
    if (!obj.title) 
      obj.title = 'Settings - Anonymous Script';

    var stored = obj.read(); // read the stored settings
    // for each setting create a field object
    for (var id in settings)
      obj.fields[id] = new GM_configField(settings[id], stored[id], id);

    if (css) 
      obj.css.stylish = css; // store the custom style
}

GM_configStruct.prototype = {
    // Support old method of initalizing
    init: function() { GM_configInit(this, arguments); },

    open: function () { // call GM_config.open() from your script to open the menu
        // Die if the menu is already open on this page
        // You can have multiple instances but they can't be open at the same time
        var match = document.getElementById('GM_config');
        if (match && (match.tagName == "IFRAME" || match.childNodes.length > 0)) return;

        var configObj = this;

        function buildConfigWin (body, head) {
            var obj = configObj,
                frameBody = body,
                create = obj.create,
                fields = obj.fields;

            // Append the style which is our default style plus the user style
            head.appendChild(
                obj.create('style', {
                type: 'text/css',
                textContent: obj.css.basic + obj.css.stylish
            }));

            // Add header and title
            frameBody.appendChild(obj.create('div', {
                id: 'GM_config_header',
                className: 'config_header block center',
                textContent: obj.title
            }));

            // Append elements
            var section = frameBody,
                secNum = 0; // Section count

            // loop through fields
            for (var i in fields) {
              var field = fields[i].settings;
              if (field.section) { // the start of a new section
                section = frameBody.appendChild(create('div', {
                  className: 'section_header_holder',
                  kids: [
                    create('div', {
                      className: 'section_header center',
                      innerHTML: field.section[0]
                  })],
                  id: 'GM_config_section_' + secNum++
                }));

                if (field.section[1]) 
                  section.appendChild(create('p', {
                    className: 'section_desc center',
                    innerHTML: field.section[1]
                  }));
              }
                
              section.appendChild(fields[i].toNode());
            }

            // Add save and close buttons
            frameBody.appendChild(obj.create('div', {
                id: 'GM_config_buttons_holder',
                kids: [
                    obj.create('button', {
                    id: 'GM_config_saveBtn',
                    textContent: 'Save',
                    title: 'Save options and close window',
                    className: 'saveclose_buttons',
                    onclick: function () { obj.save() }
                }),
                    obj.create('button', {
                    id: 'GM_config_closeBtn',
                    textContent: 'Close',
                    title: 'Close window',
                    className: 'saveclose_buttons',
                    onclick: function () { obj.close() }
                }),
                    obj.create('div', {
                    className: 'reset_holder block',
                    kids: [
                        obj.create('a', {
                        id: 'GM_config_resetLink',
                        textContent: 'Reset to defaults',
                        href: '#',
                        title: 'Reset settings to default configuration',
                        className: 'reset',
                        onclick: function(e) { obj.reset(e) }
                    })
                        ]
                })]
            }));

            obj.center(); // Show and center iframe
            window.addEventListener('resize', obj.center, false); // Center frame on resize
            if (obj.onOpen) 
                obj.onOpen(obj.frame.contentDocument || obj.frame.ownerDocument,
                           obj.frame.contentWindow || window, 
                           obj.frame); // Call the open() callback function
            // Close frame on window close
            window.addEventListener('beforeunload', function () {
                obj.remove(this);
            }, false);

            // Now that everything is loaded, make it visible
            obj.frame.style.display = "block";
        }

        // Either use the element passed to init() or create an iframe
        var defaultStyle = 'position:fixed; top:0; left:0; opacity:0; display:none; z-index:999;' +
                           'width:75%; height:75%; max-height:95%; max-width:95%;' +
                           'border:1px solid #000000; overflow:auto; bottom: auto;'
                           'right: auto; margin: 0; padding: 0;';
        if (this.frame) {
          this.frame.id = 'GM_config';
          this.frame.setAttribute('style', defaultStyle);
          buildConfigWin(this.frame, this.frame.ownerDocument.getElementsByTagName('head')[0]);
        } else {
           // Create frame
          document.body.appendChild((this.frame = this.create('iframe', {
            id: 'GM_config',
            style: defaultStyle
          })));

          this.frame.src = 'about:blank'; // In WebKit src can't be set until it is added to the page
          // we wait for the iframe to load before we can modify it
          this.frame.addEventListener('load', function(e) {
              var frame = configObj.frame;
              var body = frame.contentDocument.getElementsByTagName('body')[0];
              body.id = 'GM_config'; // Allows for prefixing styles with "#GM_config"
              buildConfigWin(body, frame.contentDocument.getElementsByTagName('head')[0]);
            }, false);
        }
    },

    save: function () {
      for (id in this.fields)
        if (!this.fields[id].toValue(this.frame.contentDocument || this.frame.ownerDocument))
          return; // invalid value encountered

      this.write();

      if (this.onSave) 
        this.onSave(); // Call the save() callback function
    },

    close: function() {
      // If frame is an iframe then remove it
      if (this.frame.contentDocument) {
        this.remove(this.frame);
        this.frame = null;
      } else { // else wipe its content
        this.frame.innerHTML = "";
        this.frame.style.display = "none";
      }

      if (this.onClose) 
        this.onClose(); //  Call the close() callback function
    },

    set: function (name, val) {
        this.fields[name].value = val;
    },

    get: function (name) {
        return this.fields[name].value;
    },

    log: (this.isGM) ? GM_log : ((window.opera) ? opera.postError : console.log),

    write: function (store, obj) {
      if (!obj) {
        var values = {};
        for (var id in this.fields)
          values[id] = this.fields[id].value;
      }

      try {
        this.setValue(store || this.storage, this.stringify(obj || values));
      } catch(e) {
        this.log("GM_config failed to save settings!");
      }
    },

    read: function (store) {
      try {
        var rval = this.parser(this.getValue(store || this.storage, '{}'));
      } catch(e) {
        this.log("GM_config failed to read saved settings!");
        var rval = {};
      }
      return rval;
    },

    reset: function (e) {
        e.preventDefault();
        var fields = this.fields,
            doc = this.frame.contentDocument || this.frame.ownerDocument,
            type;

        for (id in fields) {
            var fieldEl = doc.getElementById('GM_config_field_' + id),
                field = fields[id].settings;

            if (fieldEl.type == 'radio' || fieldEl.type == 'text' || 
                fieldEl.type == 'checkbox') 
              type = fieldEl.type;
            else 
              type = fieldEl.tagName.toLowerCase();

            switch (type) {
              case 'text':
                fieldEl.value = field['default'] || '';
                break;
              case 'hidden':
                fieldEl.value = field['default'] || '';
                break;
              case 'textarea':
                fieldEl.value = field['default'] || '';
                break;
              case 'checkbox':
                fieldEl.checked = field['default'] || false;
                break;
              case 'select':
                if (field['default']) {
                    for (var i = fieldEl.options.length - 1; i >= 0; i--)
                        if (fieldEl.options[i].value == field['default']) 
                            fieldEl.selectedIndex = i;
                } else fieldEl.selectedIndex = 0;
                break;
              case 'div':
                var radios = fieldEl.getElementsByTagName('input');
                if (radios.length > 0) 
                    for (var i = radios.length - 1; i >= 0; i--) 
                        if (radios[i].value == field['default']) 
                            radios[i].checked = true;
                break;
            }
        }
    },

    create: function (a, b) {
        var ret = window.document.createElement(a);
        if (b) for (var prop in b) {
            if (prop.indexOf('on') == 0) 
                ret.addEventListener(prop.substring(2), b[prop], false);
            else if (prop == "kids" && (prop = b[prop])) 
                for (var i = 0; i < prop.length; i++) ret.appendChild(prop[i]);
            else if (",style,accesskey,id,name,src,href,for".indexOf("," + 
                     prop.toLowerCase()) != -1) ret.setAttribute(prop, b[prop]);
            else ret[prop] = b[prop];
        }
        return ret;
    },

    center: function () {
        var node = this.frame,
            style = node.style,
            beforeOpacity = style.opacity;
        if (style.display == 'none') style.opacity = '0';
        style.display = '';
        style.top = Math.floor((window.innerHeight / 2) - (node.offsetHeight / 2)) + 'px';
        style.left = Math.floor((window.innerWidth / 2) - (node.offsetWidth / 2)) + 'px';
        style.opacity = '1';
    },

    addEvent: function (el, ev, scr) {
        el.addEventListener(ev, function () {
            typeof scr == 'function' ? setTimeout(scr, 0) : eval(scr)
        },
        false);
    },

    remove: function (el) {
        if (el && el.parentNode) el.parentNode.removeChild(el);
    }
};

function GM_configField(settings, stored, id) {
  // Store the field's settings
  this.settings = settings;
  this.id = id;
  
  // if a setting was passed to init but wasn't stored then 
  //      if a default value wasn't passed through init() then use null
  //      else use the default value passed through init()
  // else use the stored value
  var value = typeof stored == "undefined" ? 
                typeof settings['default'] == "undefined" ? null 
                : settings['default'] 
              : stored;

  // If the value isn't stored and no default was passed through init()
  // try to predict a default value based on the type
  if (value === null) {
    switch (settings.type) {
      case 'radio': case 'select':
        value = settings.options[0];
        break;
      case 'checkbox':
        value = false;
        break;
      case 'int': case 'float':
        value = 0;
        break;
      default:
        value = '';
    }
  }

  // Store the field's value
  this.value = value;
}

GM_configField.prototype = {
  isNum: /^[\d\.]+$/,

  typewhite: /radio|text|hidden|checkbox/,

  create: GM_configStruct.prototype.create,

  toNode: function() {
    var field = this.settings,
        value = this.value,
        options = field.options,
        label = field.label,
        id = this.id;
        create = this.create;

    switch (field.type) {
      case 'textarea':
        return create('div', {
          title: field.title || '',
          kids: [
            create('span', {
              textContent: label,
              className: 'field_label'
            }),
            create('textarea', {
              id: 'GM_config_field_' + this.id,
              innerHTML: value,
              cols: (field.cols ? field.cols : 20),
              rows: (field.rows ? field.rows : 2)
            })
          ],
          className: 'config_var'
        });
        break;
      case 'radio':
        var retNode = create('div', {
          title: field.title || '',
          kids: [
            create('span', {
              textContent: label,
              className: 'field_label'
            }),
          ],
          className: 'config_var'
        });

        var wrap = create('div', {
          id: 'GM_config_field_' + id,
        });

        for (var i = 0, len = options.length; i < len; ++i) {
          wrap.appendChild(create('span', {
            textContent: options[i]
          }));
          wrap.appendChild(create('input', {
            value: options[i],
            type: 'radio',
            name: id,
            checked: options[i] == value ? true : false
          }));
        }

        retNode.appendChild(wrap);
        return retNode;
        break;
      case 'select':
        var retNode = create('div', {
          title: field.title || '',
          kids: [
            create('span', {
              textContent: label,
              className: 'field_label'
            })
          ],
          className: 'config_var'
        });

        var wrap = create('select', {
          id: 'GM_config_field_' + id,
        });

        for (var i in options)
          wrap.appendChild(create('option', {
            textContent: options[i],
            value: i,
            selected: options[i] == value ? true : false
          }));

        retNode.appendChild(wrap);
        return retNode;
        break;
      case 'checkbox':
        return create('div', {
          title: field.title || '',
          kids: [
            create('label', {
              textContent: label,
              className: 'field_label',
              'for': 'GM_config_field_' + id
            }),
            create('input', {
              id: 'GM_config_field_' + id,
              type: 'checkbox',
              value: value,
              checked: value
            })
          ],
          className: 'config_var'
        });
        break;
      case 'button':
        var tmp,
            retNode = create('div', {
          kids: [
            (tmp = create('input', {
               id: 'GM_config_field_' + id,
               type: 'button',
               value: label,
               size: (field.size ? field.size : 25),
               title: field.title || ''
            }))
          ],
          className: 'config_var'
        });

        if (field.script) 
          obj.addEvent(tmp, 'click', field.script);

        return retNode;
        break;
      case 'hidden':
        return create('div', {
          title: field.title || '',
          kids: [
            create('input', {
              id: 'GM_config_field_' + id,
              type: 'hidden',
              value: value
            })
          ],
          className: 'config_var'
        });
        break;
      default:
        // type = text, int, or float
        return create('div', {
          title: field.title || '',
          kids: [
            create('span', {
              textContent: label,
              className: 'field_label'
            }),
            create('input', {
              id: 'GM_config_field_' + id,
              type: 'text',
              value: value,
              size: (field.size ? field.size : 25)
            })
          ],
          className: 'config_var'
        });
    }
  },

  toValue: function(doc) {
    var fieldEl = doc.getElementById('GM_config_field_' + this.id),
        field = this.settings,
        type;

    if (this.typewhite.test(fieldEl.type)) 
      type = fieldEl.type;
    else 
      type = fieldEl.tagName.toLowerCase();

    switch (type) {
      case 'text':
        this.value = (field.type == 'text') ? fieldEl.value :
          (((this.isNum.test(fieldEl.value || fieldEl.value == '0')) &&
            (field.type == 'int' || field.type == 'float')) ? parseFloat(fieldEl.value) : null);

        if (fields[f].value === null) {
          alert('Invalid type for field: ' + this.id + '\nPlease use type: ' + 
                field.type);
          return false;
        }
        break;
      case 'hidden':
        this.value = fieldEl.value.toString();
        break;
      case 'textarea':
        this.value = fieldEl.value;
        break;
      case 'checkbox':
        this.value = fieldEl.checked;
        break;
      case 'select':
        this.value = fieldEl[fieldEl.selectedIndex].value;
        break;
      case 'div':
        var radios = fieldEl.getElementsByTagName('input');
        if (radios.length > 0) 
          for (var i = radios.length - 1; i >= 0; i--) 
            if (radios[i].checked) 
              this.value = radios[i].value;
        break;
    }

    return true; // value read successfully
  }
};

// Create default instance of GM_config
// If you are including this code in your script you can pass
// settings to constructor instead of calling GM_config.init()
var GM_config = new GM_configStruct();