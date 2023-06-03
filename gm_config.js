/*
Copyright 2009+, GM_config Contributors (https://github.com/sizzlemctwizzle/GM_config)

GM_config Collaborators/Contributors:
    Mike Medley <medleymind@gmail.com>
    Joe Simmons
    Izzy Soft
    Marti Martz
    Adam Thompson-Sharpe

GM_config is distributed under the terms of the GNU Lesser General Public License.

    GM_config is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// ==UserScript==
// @exclude       *
// @author        Mike Medley <medleymind@gmail.com> (https://github.com/sizzlemctwizzle/GM_config)
// @icon          https://raw.githubusercontent.com/sizzlemctwizzle/GM_config/master/gm_config_icon_large.png

// ==UserLibrary==
// @name          GM_config
// @description   A lightweight, reusable, cross-browser graphical settings framework for inclusion in user scripts.
// @copyright     2009+, Mike Medley (https://github.com/sizzlemctwizzle)
// @license       LGPL-3.0-or-later; https://raw.githubusercontent.com/sizzlemctwizzle/GM_config/master/LICENSE

// @homepageURL   https://openuserjs.org/libs/sizzle/GM_config
// @homepageURL   https://github.com/sizzlemctwizzle/GM_config
// @supportURL    https://github.com/sizzlemctwizzle/GM_config/issues

// ==/UserScript==

// ==/UserLibrary==

/* jshint esversion: 8 */

let GM_config = (function (GM) {
  // This is the initializer function
  function GM_configInit(config, args) {
    // Initialize instance variables
    if (typeof config.fields == "undefined") {
      config.fields = {};
      config.onInit = config.onInit || function() {};
      config.onOpen = config.onOpen || function() {};
      config.onSave = config.onSave || function() {};
      config.onClose = config.onClose || function() {};
      config.onReset = config.onReset || function() {};
      config.isOpen = false;
      config.title = 'User Script Settings';
      config.css = {
        basic: [
          "#GM_config * { font-family: arial,tahoma,myriad pro,sans-serif; }",
          "#GM_config { background: #FFF; }",
          "#GM_config input[type='radio'] { margin-right: 8px; }",
          "#GM_config .indent40 { margin-left: 40%; }",
          "#GM_config .field_label { font-size: 12px; font-weight: bold; margin-right: 6px; }",
          "#GM_config .radio_label { font-size: 12px; }",
          "#GM_config .block { display: block; }",
          "#GM_config .saveclose_buttons { margin: 16px 10px 10px; padding: 2px 12px; }",
          "#GM_config .reset, #GM_config .reset a," +
            " #GM_config_buttons_holder { color: #000; text-align: right; }",
          "#GM_config .config_header { font-size: 20pt; margin: 0; }",
          "#GM_config .config_desc, #GM_config .section_desc, #GM_config .reset { font-size: 9pt; }",
          "#GM_config .center { text-align: center; }",
          "#GM_config .section_header_holder { margin-top: 8px; }",
          "#GM_config .config_var { margin: 0 0 4px; }",
          "#GM_config .section_header { background: #414141; border: 1px solid #000; color: #FFF;",
          " font-size: 13pt; margin: 0; }",
          "#GM_config .section_desc { background: #EFEFEF; border: 1px solid #CCC; color: #575757;" +
            " font-size: 9pt; margin: 0 0 6px; }"
          ].join('\n') + '\n',
        basicPrefix: "GM_config",
        stylish: ""
      };
    }
    config.frameStyle = [
      'bottom: auto; border: 1px solid #000; display: none; height: 75%;',
      'left: 0; margin: 0; max-height: 95%; max-width: 95%; opacity: 0;',
      'overflow: auto; padding: 0; position: fixed; right: auto; top: 0;',
      'width: 75%; z-index: 9999;'
	].join(' ');

    var settings = null;
    if (args.length == 1 &&
      typeof args[0].id == "string" &&
      typeof args[0].appendChild != "function") settings = args[0];
    else {
      // Provide backwards-compatibility with argument style intialization
      settings = {};

      // loop through GM_config.init() arguments
      for (let i = 0, l = args.length, arg; i < l; ++i) {
        arg = args[i];

        // An element to use as the config window
        if (typeof arg.appendChild == "function") {
          settings.frame = arg;
          continue;
        }

        switch (typeof arg) {
          case 'object':
            for (let j in arg) { // could be a callback functions or settings object
              if (typeof arg[j] != "function") { // we are in the settings object
                settings.fields = arg; // store settings object
                break; // leave the loop
              } // otherwise it must be a callback function
              if (!settings.events) settings.events = {};
              settings.events[j] = arg[j];
            }
            break;
          case 'function': // passing a bare function is set to open callback
            settings.events = {onOpen: arg};
            break;
          case 'string': // could be custom CSS or the title string
            if (/\w+\s*\{\s*\w+\s*:\s*\w+[\s|\S]*\}/.test(arg))
              settings.css = arg;
            else
              settings.title = arg;
            break;
        }
      }
    }

    /* Initialize everything using the new settings object */
    // Set the id
    if (settings.id) config.id = settings.id;
    else if (typeof config.id == "undefined") config.id = 'GM_config';

    // Set the title
    if (settings.title) config.title = settings.title;

    // Set the custom css
    if (typeof settings.css === 'string') config.css.stylish = settings.css;

    // Set the frame
    if (settings.frame) config.frame = settings.frame;
	
    // Set the style attribute of the frame
    if (typeof settings.frameStyle === 'string') config.frameStyle = settings.frameStyle;

    // Set the event callbacks
    if (settings.events) {
      let events = settings.events;
      for (let e in events) {
        config["on" + e.charAt(0).toUpperCase() + e.slice(1)] = events[e];
      }
    }

    // If the id has changed we must modify the default style
    if (config.id != config.css.basicPrefix) {
      config.css.basic = config.css.basic.replace(
        new RegExp('#' + config.css.basicPrefix, 'gm'), '#' + config.id);
      config.css.basicPrefix = config.id;
    }

    // Create the fields
    config.isInit = false;
    if (settings.fields) {
      config.read(null, (stored) => { // read the stored settings
        let fields = settings.fields,
            customTypes = settings.types || {},
            configId = config.id;

        for (let id in fields) {
          let field = fields[id],
              fieldExists = false;

          if (config.fields[id]) {
            fieldExists = true;
          }

          // for each field definition create a field object
          if (field) {
            if (config.isOpen && fieldExists) {
                config.fields[id].remove();
            }

            config.fields[id] = new GM_configField(field, stored[id], id,
              customTypes[field.type], configId);

            // Add field to open frame
            if (config.isOpen) {
              config.fields[id].wrapper = config.fields[id].toNode();
              config.frameSection.appendChild(config.fields[id].wrapper);
            }
          } else if (!field && fieldExists) {
            // Remove field from open frame
            if (config.isOpen) {
              config.fields[id].remove();
            }

            delete config.fields[id];
          }
        }

        config.isInit = true;
        config.onInit.call(config);
      });
    } else {
      config.isInit = true;
      config.onInit.call(config);
    }
  }

  let construct = function () {
    // Parsing of input provided via frontends
    GM_configInit(this, arguments);
  };
  construct.prototype = {
    // Support re-initalization
    init: function() {
      GM_configInit(this, arguments);
    },

    // call GM_config.open() from your script to open the menu
    open: function () {
      // don't open before init is finished
      if (!this.isInit) {
        setTimeout(() => this.open(), 0);
        return;
      }
      // Die if the menu is already open on this page
      // You can have multiple instances but you can't open the same instance twice
      let match = document.getElementById(this.id);
      if (match && (match.tagName == "IFRAME" || match.childNodes.length > 0)) return;

      // Sometimes "this" gets overwritten so create an alias
      let config = this;

      // Function to build the mighty config window :)
      function buildConfigWin (body, head) {
        let create = config.create,
            fields = config.fields,
            configId = config.id,
            bodyWrapper = create('div', {id: configId + '_wrapper'});

        // Append the style which is our default style plus the user style
        head.appendChild(
          create('style', {
          type: 'text/css',
          textContent: config.css.basic + config.css.stylish
        }));

        // Add header and title
        bodyWrapper.appendChild(create('div', {
          id: configId + '_header',
          className: 'config_header block center'
        }, config.title));

        // Append elements
        let section = bodyWrapper,
            secNum = 0; // Section count

        // loop through fields
        for (let id in fields) {
          let field = fields[id],
              settings = field.settings;

          if (settings.section) { // the start of a new section
            section = bodyWrapper.appendChild(create('div', {
                className: 'section_header_holder',
                id: configId + '_section_' + secNum
              }));

            if (!Array.isArray(settings.section))
              settings.section = [settings.section];

            if (settings.section[0])
              section.appendChild(create('div', {
                className: 'section_header center',
                id: configId + '_section_header_' + secNum
              }, settings.section[0]));

            if (settings.section[1])
              section.appendChild(create('p', {
                className: 'section_desc center',
                id: configId + '_section_desc_' + secNum
              }, settings.section[1]));
            ++secNum;
          }
          
          if (secNum === 0) {
            section = bodyWrapper.appendChild(create('div', {
                className: 'section_header_holder',
                id: configId + '_section_' + (secNum++)
            }));
          }

          // Create field elements and append to current section
          section.appendChild((field.wrapper = field.toNode()));
        }
        
        config.frameSection = section;

        // Add save and close buttons
        bodyWrapper.appendChild(create('div',
          {id: configId + '_buttons_holder'},

          create('button', {
            id: configId + '_saveBtn',
            textContent: 'Save',
            title: 'Save settings',
            className: 'saveclose_buttons',
            onclick: function () { config.save(); }
          }),

          create('button', {
            id: configId + '_closeBtn',
            textContent: 'Close',
            title: 'Close window',
            className: 'saveclose_buttons',
            onclick: function () { config.close(); }
          }),

          create('div',
            {className: 'reset_holder block'},

            // Reset link
            create('a', {
              id: configId + '_resetLink',
              textContent: 'Reset to defaults',
              href: '#',
              title: 'Reset fields to default values',
              className: 'reset',
              onclick: function(e) { e.preventDefault(); config.reset(); }
            })
        )));

        body.appendChild(bodyWrapper); // Paint everything to window at once
        config.center(); // Show and center iframe
        window.addEventListener('resize', config.center, false); // Center frame on resize

        // Call the open() callback function
        config.onOpen(config.frame.contentDocument || config.frame.ownerDocument,
                      config.frame.contentWindow || window,
                      config.frame);

        // Close frame on window close
        window.addEventListener('beforeunload', function () {
            config.close();
        }, false);

        // Now that everything is loaded, make it visible
        config.frame.style.display = "block";
        config.isOpen = true;
      }

      // Either use the element passed to init() or create an iframe
      if (this.frame) {
        this.frame.id = this.id; // Allows for prefixing styles with the config id
        this.frame.setAttribute('style', this.frameStyle);
        buildConfigWin(this.frame, this.frame.ownerDocument.getElementsByTagName('head')[0]);
      } else {
        // Create frame
        document.body.appendChild((this.frame = this.create('iframe', {
          id: this.id,
          style: this.frameStyle
        })));

        // In WebKit src can't be set until it is added to the page
        this.frame.src = '';
        // we wait for the iframe to load before we can modify it
        let that = this;
        this.frame.addEventListener('load', function(e) {
            let frame = config.frame;
            if (!frame.contentDocument) {
              that.log("GM_config failed to initialize default settings dialog node!");
            } else {
              let body = frame.contentDocument.getElementsByTagName('body')[0];
              body.id = config.id; // Allows for prefixing styles with the config id
              buildConfigWin(body, frame.contentDocument.getElementsByTagName('head')[0]);
            }
        }, false);
      }
    },

    save: function () {
      this.write(null, null, (vals) => this.onSave(vals));
    },

    close: function() {
      // If frame is an iframe then remove it
      if (this.frame && this.frame.contentDocument) {
        this.remove(this.frame);
        this.frame = null;
      } else if (this.frame) { // else wipe its content
        this.frame.innerHTML = "";
        this.frame.style.display = "none";
      }

      // Null out all the fields so we don't leak memory
      let fields = this.fields;
      for (let id in fields) {
        let field = fields[id];
        field.wrapper = null;
        field.node = null;
      }

      this.onClose(); //  Call the close() callback function
      this.isOpen = false;
    },

    set: function (name, val) {
      this.fields[name].value = val;

      if (this.fields[name].node) {
        this.fields[name].reload();
      }
    },

    get: function (name, getLive) {
      /* Migration warning */
      if (!this.isInit) {
        this.log('GM_config: get called before init, see https://github.com/sizzlemctwizzle/GM_config/issues/113');
      }

      let field = this.fields[name],
          fieldVal = null;

      if (getLive && field.node) {
        fieldVal = field.toValue();
      }

      return fieldVal != null ? fieldVal : field.value;
    },

    write: function (store, obj, cb) {
      let forgotten = null,
          values = null;
      if (!obj) {
        let fields = this.fields;

        values = {};
        forgotten = {};

        for (let id in fields) {
          let field = fields[id];
          let value = field.toValue();

          if (field.save) {
            if (value != null) {
              values[id] = value;
              field.value = value;
            } else
              values[id] = field.value;
          } else
            forgotten[id] = value != null ? value : field.value;
        }
      }

      (async () => {
        try {
          let val = this.stringify(obj || values);
          await this.setValue(store || this.id, val);
        } catch(e) {
          this.log("GM_config failed to save settings!");
        }
        cb(forgotten);
      })();
    },

    read: function (store, cb) {
      (async () => {
        let val = await this.getValue(store || this.id, '{}');
        try {
          let rval = this.parser(val);
          cb(rval);
        } catch(e) {
          this.log("GM_config failed to read saved settings!");
          cb({});
        }
      })();
    },

    reset: function () {
      let fields = this.fields;

      // Reset all the fields
      for (let id in fields) { fields[id].reset(); }

      this.onReset(); // Call the reset() callback function
    },

    create: function () {
      let A = null,
          B = null;
      switch(arguments.length) {
        case 1:
          A = document.createTextNode(arguments[0]);
          break;
        default:
          A = document.createElement(arguments[0]);
          B = arguments[1];
          for (let b in B) {
            if (b.indexOf("on") == 0)
              A.addEventListener(b.substring(2), B[b], false);
            else if (",style,accesskey,id,name,src,href,which,for".indexOf("," +
                     b.toLowerCase()) != -1)
              A.setAttribute(b, B[b]);
            else
              A[b] = B[b];
          }
          if (typeof arguments[2] == "string")
            A.innerHTML = arguments[2];
          else
            for (let i = 2, len = arguments.length; i < len; ++i)
              A.appendChild(arguments[i]);
      }
      return A;
    },

    center: function () {
      let node = this.frame;
      if (!node) return;
      let style = node.style,
          beforeOpacity = style.opacity;
      if (style.display == 'none') style.opacity = '0';
      style.display = '';
      style.top = Math.floor((window.innerHeight / 2) - (node.offsetHeight / 2)) + 'px';
      style.left = Math.floor((window.innerWidth / 2) - (node.offsetWidth / 2)) + 'px';
      style.opacity = '1';
    },

    remove: function (el) {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
  };

  construct.prototype.name = 'GM_config';
  construct.prototype.constructor = construct;
  let isGM4 = typeof GM.getValue !== 'undefined' &&
    typeof GM.setValue !== 'undefined';
  let isGM = isGM4 || (typeof GM_getValue !== 'undefined' &&
    typeof GM_getValue('a', 'b') !== 'undefined');
  construct.prototype.isGM = isGM;

  if (!isGM4) {
    let promisify = (old) => (...args) => {
      return new Promise((resolve, reject) => {
        try {
          resolve(old.apply(this, args));
        } catch (e) {
          reject(e);
        }
      });
    };

    let getValue = isGM ? GM_getValue
      : (name, def) => {
        let s = localStorage.getItem(name);
        return s !== null ? s : def;
      };
    let setValue = isGM ? GM_setValue
      : (name, value) => localStorage.setItem(name, value);
    let log = typeof GM_log !== 'undefined' ? GM_log : console.log;

    GM.getValue = promisify(getValue);
    GM.setValue = promisify(setValue);
    GM.log = promisify(log);
  }

  construct.prototype.stringify = JSON.stringify;
  construct.prototype.parser = JSON.parse;
  construct.prototype.getValue = GM.getValue;
  construct.prototype.setValue = GM.setValue;
  construct.prototype.log = GM.log || console.log;

  // Passthrough frontends for new and old usage
  let config = function () {
    return new (config.bind.apply(construct,
      [null].concat(Array.from(arguments))));
  };
  config.prototype.constructor = config;

  // Support old method of initalizing
  config.init = function () {
    GM_config = config.apply(this, arguments);
    GM_config.init = function() {
      GM_configInit(this, arguments);
    };
  };

  config.create = construct.prototype.create;
  config.isGM = construct.prototype.isGM;
  config.setValue = construct.prototype.setValue;
  config.getValue = construct.prototype.getValue;
  config.stringify = construct.prototype.stringify;
  config.parser = construct.prototype.parser;
  config.log = construct.prototype.log;
  config.remove = construct.prototype.remove;

  return config;
}(typeof GM === 'object' ? GM : Object.create(null)));
let GM_configStruct = GM_config;

function GM_configField(settings, stored, id, customType, configId) {
  // Store the field's settings
  this.settings = settings;
  this.id = id;
  this.configId = configId;
  this.node = null;
  this.wrapper = null;
  this.save = typeof settings.save == "undefined" ? true : settings.save;

  // Buttons are static and don't have a stored value
  if (settings.type == "button") this.save = false;

  // if a default value wasn't passed through init() then
  //   if the type is custom use its default value
  //   else use default value for type
  // else use the default value passed through init()
  this['default'] = typeof settings['default'] == "undefined" ?
    customType ?
      customType['default']
      : this.defaultValue(settings.type, settings.options)
    : settings['default'];

  // Store the field's value
  this.value = typeof stored == "undefined" ? this['default'] : stored;

  // Setup methods for a custom type
  if (customType) {
    this.toNode = customType.toNode;
    this.toValue = customType.toValue;
    this.reset = customType.reset;
  }
}

GM_configField.prototype = {
  create: GM_config.create,

  defaultValue: function(type, options) {
    let value;

    if (type.indexOf('unsigned ') == 0)
      type = type.substring(9);

    switch (type) {
      case 'radio': case 'select':
        value = options[0];
        break;
      case 'checkbox':
        value = false;
        break;
      case 'int': case 'integer':
      case 'float': case 'number':
        value = 0;
        break;
      default:
        value = '';
    }

    return value;
  },

  toNode: function() {
    let field = this.settings,
        value = this.value,
        options = field.options,
        type = field.type,
        id = this.id,
        configId = this.configId,
        labelPos = field.labelPos,
        create = this.create;

    function addLabel(pos, labelEl, parentNode, beforeEl) {
      if (!beforeEl) beforeEl = parentNode.firstChild;
      switch (pos) {
        case 'right': case 'below':
          if (pos == 'below')
            parentNode.appendChild(create('br', {}));
          parentNode.appendChild(labelEl);
          break;
        default:
          if (pos == 'above')
            parentNode.insertBefore(create('br', {}), beforeEl);
          parentNode.insertBefore(labelEl, beforeEl);
      }
    }

    let retNode = create('div', { className: 'config_var',
          id: configId + '_' + id + '_var',
          title: field.title || '' }),
        firstProp;

    // Retrieve the first prop
    for (let i in field) { firstProp = i; break; }

    let label = field.label && type != "button" ?
      create('label', {
        id: configId + '_' + id + '_field_label',
        for: configId + '_field_' + id,
        className: 'field_label'
      }, field.label) : null;

    let wrap = null;
    switch (type) {
      case 'textarea':
        retNode.appendChild((this.node = create('textarea', {
          innerHTML: value,
          id: configId + '_field_' + id,
          className: 'block',
          cols: (field.cols ? field.cols : 20),
          rows: (field.rows ? field.rows : 2)
        })));
        break;
      case 'radio':
        wrap = create('div', {
          id: configId + '_field_' + id
        });
        this.node = wrap;

        for (let i = 0, len = options.length; i < len; ++i) {
          let radLabel = create('label', {
            className: 'radio_label'
          }, options[i]);

          let rad = wrap.appendChild(create('input', {
            value: options[i],
            type: 'radio',
            name: id,
            checked: options[i] == value
          }));

          let radLabelPos = labelPos &&
            (labelPos == 'left' || labelPos == 'right') ?
            labelPos : firstProp == 'options' ? 'left' : 'right';

          addLabel(radLabelPos, radLabel, wrap, rad);
        }

        retNode.appendChild(wrap);
        break;
      case 'select':
        wrap = create('select', {
          id: configId + '_field_' + id
        });
        this.node = wrap;

        for (let i = 0, len = options.length; i < len; ++i) {
          let option = options[i];
          wrap.appendChild(create('option', {
            value: option,
            selected: option == value
          }, option));
        }

        retNode.appendChild(wrap);
        break;
      default: // fields using input elements
        let props = {
          id: configId + '_field_' + id,
          type: type,
          value: type == 'button' ? field.label : value
        };

        switch (type) {
          case 'checkbox':
            props.checked = value;
            break;
          case 'button':
            props.size = field.size ? field.size : 25;
            if (field.script) field.click = field.script;
            if (field.click) props.onclick = field.click;
            break;
          case 'hidden':
            break;
          default:
            // type = text, int, or float
            props.type = 'text';
            props.size = field.size ? field.size : 25;
        }

        retNode.appendChild((this.node = create('input', props)));
    }

    if (label) {
      // If the label is passed first, insert it before the field
      // else insert it after
      if (!labelPos)
        labelPos = firstProp == "label" || type == "radio" ?
          "left" : "right";

      addLabel(labelPos, label, retNode);
    }

    return retNode;
  },

  toValue: function() {
    let node = this.node,
        field = this.settings,
        type = field.type,
        unsigned = false,
        rval = null;

    if (!node) return rval;

    if (type.indexOf('unsigned ') == 0) {
      type = type.substring(9);
      unsigned = true;
    }

    switch (type) {
      case 'checkbox':
        rval = node.checked;
        break;
      case 'select':
        rval = node[node.selectedIndex].value;
        break;
      case 'radio':
        let radios = node.getElementsByTagName('input');
        for (let i = 0, len = radios.length; i < len; ++i) {
          if (radios[i].checked)
            rval = radios[i].value;
        }
        break;
      case 'button':
        break;
      case 'int': case 'integer':
      case 'float': case 'number':
        let num = Number(node.value);
        let warn = 'Field labeled "' + field.label + '" expects a' +
          (unsigned ? ' positive ' : 'n ') + 'integer value';

        if (isNaN(num) || (type.substr(0, 3) == 'int' &&
            Math.ceil(num) != Math.floor(num)) ||
            (unsigned && num < 0)) {
          alert(warn + '.');
          return null;
        }

        if (!this._checkNumberRange(num, warn))
          return null;
        rval = num;
        break;
      default:
        rval = node.value;
        break;
    }

    return rval; // value read successfully
  },

  reset: function() {
    let node = this.node,
        field = this.settings,
        type = field.type;

    if (!node) return;

    switch (type) {
      case 'checkbox':
        node.checked = this['default'];
        break;
      case 'select':
        for (let i = 0, len = node.options.length; i < len; ++i) {
          if (node.options[i].textContent == this['default'])
            node.selectedIndex = i;
        }
        break;
      case 'radio':
        let radios = node.getElementsByTagName('input');
        for (let i = 0, len = radios.length; i < len; ++i) {
          if (radios[i].value == this['default'])
            radios[i].checked = true;
        }
        break;
      case 'button' :
        break;
      default:
        node.value = this['default'];
        break;
      }
  },

  remove: function() {
    GM_config.remove(this.wrapper);
    this.wrapper = null;
    this.node = null;
  },

  reload: function() {
    let wrapper = this.wrapper;
    if (wrapper) {
      let fieldParent = wrapper.parentNode;
      let newWrapper = this.toNode();
      fieldParent.insertBefore(newWrapper, wrapper);
      GM_config.remove(this.wrapper);
      this.wrapper = newWrapper;
    }
  },

  _checkNumberRange: function(num, warn) {
    let field = this.settings;
    if (typeof field.min == "number" && num < field.min) {
      alert(warn + ' greater than or equal to ' + field.min + '.');
      return null;
    }

    if (typeof field.max == "number" && num > field.max) {
      alert(warn + ' less than or equal to ' + field.max + '.');
      return null;
    }
    return true;
  }
};
