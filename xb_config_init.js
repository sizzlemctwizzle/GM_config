// This is the code to include in your script

window.XB_config = {
    'init' : function() {
        for(var i=0,len=arguments.length,arg; i<len; ++i) {
            arg=arguments[i];
            switch(typeof arg) {
            case 'object': 
                for(var j in arg) {
                    if (typeof arg[j] == 'function') {
                        if (j=='open')
                            this.onOpen=arg[j]; 
                        else if (j=='close')
                            this.onClose=arg[j];
                        else if (j=='save')
                            this.onSave=arg[j];
                    } else 
                        var settings = arg;
                } 
                break;
            case 'function': 
                this.onOpen = arg;
                break;
            case 'string': 
                if(arg.indexOf('{')!=-1&&arg.indexOf('}')!=-1) 
                    var css = arg;
                else 
                    this.title = arg;
                break;
            }
	}
	if(!this.title) 
            this.title = 'Script Settings';
	var stored = this.read(),
		     passed_settings = {},
		     passed_values = {},
		     typewhite = /number|string|boolean/;
	for (var i in settings) {
            passed_settings[i] = settings[i];
            passed_values[i] = (stored[i]===false && settings[i]['default']===true) 
                               ? false : 
                               (((typewhite.test(typeof stored[i]))?stored[i]:false)||settings[i]['default']||'');
	}
	this.settings = passed_settings;
	this.values = passed_values;
	if (css) 
            this.css.stylish = css;
        if (!this.open)
          this.open = function() { // function to load all the code on demand
            document.body.appendChild(create('script',{
                type:'text/javascript',
                src:'http://gmconfig.googlecode.com/svn/trunk/xb_config.js'}));
            var checker=setInterval(function(){
                if(window.XB_config.remove) {
                  clearInterval(checker);
                  window.XB_config.open(); // call the true opener
                }
              }, 200);
          };
    },
    'read' : function() {
      return JSON.parse(localStorage.getItem('XB_config') || '{}');
    },
    'get' : function(name) {
      return this.values[name];
    },
    'create' : function(A, B, C) {
        if (!B) 
            A = document.createTextNode(A);
        else {
            A = document.createElement(A);
            for (var b in B) {
                if (b.indexOf("on") == 0)
                    A.addEventListener(b.substring(2), B[b], false);
                else if (b == "style")
                    A.setAttribute(b, B[b]);
                else
                    A[b] = B[b];
            }
            if (C) 
                for(var i = 0, len = C.length; i<len; i++)
                    A.appendChild(C[i]);
        }
        return A;
    },
    'values' : {},
    'settings' : {},
    'css': {}
};