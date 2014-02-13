(function (root, factory) { // UMD from https://github.com/umdjs/umd/blob/master/returnExports.js

	"use strict";

	if (typeof exports === 'object') {
		module.exports = factory();
	} else if (typeof define === 'function' && define.amd) {
		define(factory);
	} else {
		root.manip = factory();
	}

}(this, function () {
	
// Author: Matthew Forrester <matt_at_keyboardwritescode.com>
// Copyright: Matthew Forrester
// License: MIT/BSD-style

"use strict";

/**
 * ### manip()
 * 
 * The function to return.
 * 
 * #### Parameters
 * 
 * * **@param {Object} `ob`** The function to apply the Manipulation to.
 * * **@param {Object} `jsonDoc`** The manipulation.
 * * **@param {Function|undefined} `cloneObjFunc`** Function to use for cloning objects, if left null, it will do a JSON based clone.
 * * **@return {Object}** The result of applying the `jsonDoc` to `ob`.
 */
var manip = function(ob,jsonDoc,cloneFunc) {
	var k = '',
		r = null,
		_cloneFunc = function(ob) { return JSON.parse(JSON.stringify(ob)); };
	
	if (cloneFunc === undefined) {
		r = _cloneFunc(ob);
	} else {
		r = cloneFunc(ob);
	}

	for (k in jsonDoc) { if (jsonDoc.hasOwnProperty(k)) {
		if (k.substring(0,1) == '$') {
			if (!manip.fn.hasOwnProperty(k.substring(1))) {
				throw new Error('manip: Does not have manipulation function '+k.substring(1));
			}
			r = manip.fn[k.substring(1)].call(manip,r,jsonDoc[k]);
		}
	} }
	return r;
};

// Holds the functions
manip.fn = {};

/**
 * ### manip._setKey()
 * 
 * Sets an internal field of `r` at `path` to `value`.
 * 
 * #### Parameters
 * 
 * * **@param {Object} `r`** The object to set an internal path to.
 * * **@param {String} `path`** The path to change, seperated by "."'s.
 * * **@param {Var} `value`** The value to set `path` to.
 * * **@return {Object}** The result.
 */
manip._setKey = function(r,path,value) {
	var k,
		t = r,
		parsePath = path.split('.');
	
	while (parsePath.length) {
		k = parsePath.shift();
		if (parsePath.length === 0) {
			t[k] = value;
			return r;
		}
		if (!t.hasOwnProperty(k)) {
			t[k] = {};
		}
		t = t[k];
	}
	return r;
};

/**
 * ### manip._getKey()
 * 
 * Gets the value from `r` at path `path`.
 * 
 * #### Parameters
 * 
 * * **@param {Object} `r`** The object to set an internal path to.
 * * **@param {String} `path`** The path to get, seperated by "."'s.
 * * **@return {Object}** The result.
 */
manip._getKey = function(r,path) {
	var k,
		t = r,
		parsePath = path.split('.');
	
	while (parsePath.length) {
		k = parsePath.shift();
		if (parsePath.length === 0) {
			return t[k];
		}
		if (!t.hasOwnProperty(k)) {
			t[k] = {};
		}
		t = t[k];
	}
	return undefined;
};

/**
 * ### manip._remKey()
 * 
 * Removes `path` from `r`.
 * 
 * #### Parameters
 * 
 * * **@param {Object} `r`** The object to remove an internal path from.
 * * **@param {String} `path`** The path to remove, seperated by "."'s.
 * * **@return {Object}** The result
 */
manip._remKey = function(r,path) {
	var k,
		t = r,
		parsePath = path.split('.');
	
	while (parsePath.length) {
		k = parsePath.shift();
		if (parsePath.length === 0) {
			delete t[k];
			return r;
		}
		if (!t.hasOwnProperty(k)) {
			return r;
		}
		t = t[k];
	}
	return r;
};

/**
 * ### manip.addManipulation()
 * 
 * Adds a manipulation function.
 * 
 * #### Parameters
 * 
 * * **@param {String} `name`** The name of the Manipulation
 * * **@param {Function} `func`** The function that will perform the manipultion
 */
manip.addManipulation = function(name,func) {
	manip.fn[name] = func;
};

/**
 * Adds the 'set' which is similar to the MongoDB operation of the same name.
 */
manip.addManipulation('set',function(ob,jsonSnippet) {
	var k = '';
	for (k in jsonSnippet) { if (jsonSnippet.hasOwnProperty(k)) {
		ob = manip._setKey(ob,k,jsonSnippet[k]);
	} }
	return ob;
});

/**
 * Adds the 'unset' which is similar to the MongoDB operation of the same name.
 */
manip.addManipulation('unset',function(ob,jsonSnippet) {
	var k = '';
	for (k in jsonSnippet) { if (jsonSnippet.hasOwnProperty(k)) {
		ob = manip._remKey(ob,k);
	} }
	return ob;
});

/**
 * Adds the 'push' which is will add an item or items to the array.
 *
 * Note the subdocument of jsonSnippet can be a single scalar, which will just
 * be added to the array or it could be a document including any/all of "$each",
 * "$sort" and "$slice" which will act in way (somewhat) similar to how they
 * work in MongoDB 2.4.
 */
manip.addManipulation('push',function(ob,jsonSnippet) {
	
	var k, v;
	
	var subOps = {
		"scalar": function(src, val) {
			src.push(val);
			return src;
		},
		"$each": function(src, val) {
			var i, l;
			for (i=0, l=val.length; i<l; i++) {
				src.push(val[i]);
			}
			return src;
		},
		"$sort": function(src, val) {
			var tmp;
			
			if (val == '.') {
				return src.sort();
			}
			
			src.sort(function(a, b) {
				for (var k in val) {
					if (val.hasOwnProperty(k)) {
						if (!a.hasOwnProperty(k)) {
							return (val[k] > 0) ? -1 : 1;
						}
						if (!b.hasOwnProperty(k)) {
							return (val[k] > 0) ? 1 : -1;
						}
						if (a[k] == b[k]) { continue; }
						tmp = [a[k], b[k]].sort();
						if (tmp[0] === a[k]) {
							return (val[k] > 0) ? -1 : 1;
						}
						return (val[k] > 0) ? 1 : -1;
					}
				}
				return 0;
			});
			return src;
		},
		"$slice": function(src, num) {
			if (num === 0) { return []; }
			return src.slice(num);
		}
	};
	
	var processPushMods = function(v, pushMods) {
		
		var toPush = {},
			willPush = false;
		
		for (var k in pushMods) {
			if (
				pushMods.hasOwnProperty(k) &&
				(subOps.hasOwnProperty(k))
			) {
				v = subOps[k](v, pushMods[k]);
			} else {
				willPush = true;
				toPush[k] = pushMods[k];
			}
		}
		
		subOps.scalar(v, toPush);
		
		return v;
	};
	
	for (k in jsonSnippet) { if (jsonSnippet.hasOwnProperty(k)) {
	
		v = manip._getKey(ob,k);
		if (v === undefined) {
			v = [];
		}
		
		if (!ob[k] instanceof Array) {
			v = [ob[k]];
		}
		
		v = processPushMods(v, jsonSnippet[k]);
		
		ob = manip._setKey(ob,k,v);
	} }
	return ob;
});

/**
 * Adds the 'inc' which is similar to the MongoDB operation of the same name.
 */
manip.addManipulation('inc',function(ob,jsonSnippet) {
	var k = '';
	for (k in jsonSnippet) { if (jsonSnippet.hasOwnProperty(k)) {
		var x = parseInt(manip._getKey(ob,k),10);
		if (!x) { x = 0; }
		x = x + jsonSnippet[k];
		ob = manip._setKey(ob,k,x);
	} }
	return ob;
});

return manip;

}));
