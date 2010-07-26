// GM_config
// version        1.3.3
// copyright      JoeSimmons & SizzleMcTwizzle & IzzySoft
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
    this.values = {};
    this.settings = {};
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
            + '\n' + "#GM_config .section_header { font-size: 13pt; background: #414141; color: #FFF; border: 1px solid #000; margin: 0; }"
            + '\n' + "#GM_config .section_desc { font-size: 9pt; background: #EFEFEF; color: #575757; border: 1px solid #CCC; margin: 0 0 6px; }",
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
    var stored = obj.read(), // read the stored settings
        passed_settings = {},
        passed_values = {};
    for (var i in settings) { // for each setting
        passed_settings[i] = settings[i];

        // if a setting was passed to init but wasn't stored then 
        //      if a default value wasn't passed through init() then use null
        //      else use the default value passed through init()
        // else use the stored value
        var value = typeof stored[i] == "undefined" ? 
                        typeof settings[i]['default'] == "undefined" ? null 
                        : settings[i]['default'] 
                    : stored[i];

        // If the value isn't stored and no default was passed through init()
        // try to predict a default value based on the type
        if (value === null) {
            switch (settings[i].type) {
            case 'radio': case 'select':
                value = settings[i].options[0];
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
        passed_values[i] = value;
    }
    obj.settings = passed_settings; // store the settings object
    obj.values = passed_values; // store the values
    if (css) 
        obj.css.stylish = css; // store the custom style
}

GM_configStruct.prototype = {
    // Support old method of initalizing
    init: function() { GM_configInit(this, arguments); },
    open: function () { // call GM_config.open() from your script to open the menu
        // Die if the menu is already open on this page
        // You can multiple instances but they can't be open at the same time
        if (document.evaluate("//iframe[@id='GM_config']", 
                               document, null, 9, null).singleNodeValue) return;
        var configObj = this;

        function buildConfigWin (body, head) {
            var obj = configObj,
                frameBody = body,
                create = obj.create,
                settings = obj.settings;

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
            var anch = frameBody,
                secNo = 0; // anchor to append elements
            for (var i in settings) { // loop through settings object
                var type, field = settings[i],
                    Options = field.options,
                    label = field.label,
                    value = obj.values[i];

                if (field.section) { // the start of a new section
                    anch = frameBody.appendChild(create('div', {
                        className: 'section_header_holder',
                        kids: [
                            create('div', {
                            className: 'section_header center',
                            innerHTML: field.section[0]
                        })],
                        id: 'GM_config_section_' + secNo
                    }));
                    if (field.section[1]) anch.appendChild(create('p', {
                        className: 'section_desc center',
                        innerHTML: field.section[1]
                    }));
                    ++secNo;
                }
                switch (field.type) {
                case 'textarea':
                    anch.appendChild(create('div', {
                        title: field.title || '',
                        kids: [
                            create('span', {
                            textContent: label,
                            className: 'field_label'
                        }),
                            create('textarea', {
                            id: 'GM_config_field_' + i,
                            innerHTML: value,
                            cols: (field.cols ? field.cols : 20),
                            rows: (field.rows ? field.rows : 2)
                        })
                            ],
                        className: 'config_var'
                    }));
                    break;
                case 'radio':
                    var boxes = [];
                    for (var j = 0, len = Options.length; j < len; j++) {
                        boxes.push(create('span', {
                            textContent: Options[j]
                        }));
                        boxes.push(create('input', {
                            value: Options[j],
                            type: 'radio',
                            name: i,
                            checked: Options[j] == value ? true : false
                        }));
                    }
                    anch.appendChild(create('div', {
                        title: field.title || '',
                        kids: [
                            create('span', {
                            textContent: label,
                            className: 'field_label'
                        }),
                            create('div', {
                            id: 'GM_config_field_' + i,
                            kids: boxes
                        })
                            ],
                        className: 'config_var'
                    }));
                    break;
                case 'select':
                    var options = new Array();
                    for (var j in Options)
                    options.push(create('option', {
                        textContent: Options[j],
                        value: j,
                        selected: Options[j] == value ? true : false
                    }));
                    anch.appendChild(create('div', {
                        title: field.title || '',
                        kids: [
                            create('span', {
                            textContent: label,
                            className: 'field_label'
                        }),
                            create('select', {
                            id: 'GM_config_field_' + i,
                            kids: options
                        })
                            ],
                        className: 'config_var'
                    }));
                    break;
                case 'checkbox':
                    anch.appendChild(create('div', {
                        title: field.title || '',
                        kids: [
                            create('label', {
                            textContent: label,
                            className: 'field_label',
                            "for": 'GM_config_field_' + i
                        }),
                            create('input', {
                            id: 'GM_config_field_' + i,
                            type: 'checkbox',
                            value: value,
                            checked: value
                        })
                            ],
                        className: 'config_var'
                    }));
                    break;
                case 'button':
                    var tmp;
                    anch.appendChild(create('div', {
                        kids: [
                            (tmp = create('input', {
                            id: 'GM_config_field_' + i,
                            type: 'button',
                            value: label,
                            size: (field.size ? field.size : 25),
                            title: field.title || ''
                        }))
                            ],
                        className: 'config_var'
                    }));
                    if (field.script) obj.addEvent(tmp, 'click', field.script);
                    break;
                case 'hidden':
                    anch.appendChild(create('div', {
                        title: field.title || '',
                        kids: [
                            create('input', {
                            id: 'GM_config_field_' + i,
                            type: 'hidden',
                            value: value
                        })
                            ],
                        className: 'config_var'
                    }));
                    break;
                default:
                    // type = text, int, or float
                    anch.appendChild(create('div', {
                        title: field.title || '',
                        kids: [
                            create('span', {
                            textContent: label,
                            className: 'field_label'
                        }),
                            create('input', {
                            id: 'GM_config_field_' + i,
                            type: 'text',
                            value: value,
                            size: (field.size ? field.size : 25)
                        })
                            ],
                        className: 'config_var'
                    }));
                }
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
                    onclick: function () {
                        obj.close(true)
                    }
                }),
                    obj.create('button', {
                    id: 'GM_config_cancelBtn',
                    textContent: 'Cancel',
                    title: 'Close window',
                    className: 'saveclose_buttons',
                    onclick: function () {
                        obj.close(false)
                    }
                }),
                    obj.create('div', {
                    className: 'reset_holder block',
                    kids: [
                        obj.create('a', {
                        id: 'GM_config_resetLink',
                        textContent: 'Restore to default',
                        href: '#',
                        title: 'Restore settings to default configuration',
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
    close: function (save) {
        if (save) {
            var type, fields = this.settings,
                isNum = /^[\d\.]+$/,
                typewhite = /radio|text|hidden|checkbox/;
            for (f in fields) {
                var doc = this.frame.contentDocument || this.frame.ownerDocument,
                    field = doc.getElementById('GM_config_field_' + f);
                if (typewhite.test(field.type)) type = field.type;
                else type = field.tagName.toLowerCase();
                switch (type) {
                case 'text':
                    this.values[f] = (this.settings[f].type == 'text') ? field.value :
                                     (((isNum.test(field.value || field.value == '0')) &&
                                     (this.settings[f].type == 'int' || this.settings[f].type 
                                      == 'float')) ? parseFloat(field.value) : false);
                    if (this.values[f] === false) {
                        alert('Invalid type for field: ' + f + '\nPlease use type: ' + 
                              this.settings[f].type);
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
                    if (radios.length > 0) 
                        for (var i = radios.length - 1; i >= 0; i--) 
                            if (radios[i].checked) 
                                this.values[f] = radios[i].value;
                    break;
                }
            }
            if (this.onSave) 
                this.onSave(); // Call the save() callback function
            this.save();
        }
        if (this.frame) 
            this.remove(this.frame);
        delete this.frame;
        if (this.onClose) 
            this.onClose(); //  Call the close() callback function
    },
    set: function (name, val) {
        this.values[name] = val;
    },
    get: function (name) {
        return this.values[name];
    },
    log: (this.isGM) ? GM_log : ((window.opera) ? opera.postError : console.log),
    save: function (store, obj) {
        try {
            this.setValue(store || this.storage, this.stringify(obj || this.values));
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
        var type, 
            obj = this,
            fields = obj.settings,
            doc = obj.frame.contentDocument || obj.frame.ownerDocument;
        for (f in fields) {
            var field = doc.getElementById('GM_config_field_' + f);
            if (field.type == 'radio' || field.type == 'text' || 
                field.type == 'checkbox') type = field.type;
            else type = field.tagName.toLowerCase();
            switch (type) {
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
                if (obj.settings[f]['default']) {
                    for (var i = field.options.length - 1; i >= 0; i--)
                        if (field.options[i].value == obj.settings[f]['default']) 
                            field.selectedIndex = i;
                } else field.selectedIndex = 0;
                break;
            case 'div':
                var radios = field.getElementsByTagName('input');
                if (radios.length > 0) 
                    for (var i = radios.length - 1; i >= 0; i--) 
                        if (radios[i].value == obj.settings[f]['default']) 
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

// Create default instance of GM_config
// If you are including this code in your script you can pass
// settings to constructor instead of calling GM_config.init()
var GM_config = new GM_configStruct();