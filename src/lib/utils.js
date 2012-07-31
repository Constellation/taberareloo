// -*- coding: utf-8 -*-

// http://gist.github.com/198443
// via http://github.com/hatena/hatena-bookmark-xul/blob/master/chrome/content/common/05-HTMLDocumentCreator.js
// a little modified

function createHTML(source) {
  var doc = document.implementation.createHTMLDocument ?
    document.implementation.createHTMLDocument('TABERARELOO') :
    document.implementation.createDocument(null, 'html', null);
  var range = document.createRange();
  range.selectNodeContents(doc.documentElement);
  var fragment = range.createContextualFragment(source);
  var headChildNames = {
    title: true,
    meta: true,
    link: true,
    script: true,
    style: true,
    /*object: true,*/
    base: true
    /*, isindex: true,*/
  };
  var child,
    head = doc.getElementsByTagName('head')[0] || doc.createElement('head'),
    body = doc.getElementsByTagName('body')[0] || doc.createElement('body');
  while ((child = fragment.firstChild)) {
    if (
      (child.nodeType === doc.ELEMENT_NODE && !(child.nodeName.toLowerCase() in headChildNames)) ||
      (child.nodeType === doc.TEXT_NODE &&/\S/.test(child.nodeValue))
    )
      break;
    head.appendChild(child);
  }
  body.appendChild(fragment);
  doc.documentElement.appendChild(head);
  doc.documentElement.appendChild(body);
  return doc;
}

function createXML(str) {
  var p = new DOMParser();
  return p.parseFromString(str, "text/xml");
}

// http://gist.github.com/184276
// a little modified

// Cross Browser $X
// XPath 式中の接頭辞のない名前テストに接頭辞 prefix を追加する
// e.g. '//body[@class = "foo"]/p' -> '//prefix:body[@class = "foo"]/prefix:p'
// http://nanto.asablo.jp/blog/2008/12/11/4003371
function addDefaultPrefix(xpath, prefix) {
  var tokenPattern = /([A-Za-z_\u00c0-\ufffd][\w\-.\u00b7-\ufffd]*|\*)\s*(::?|\()?|(".*?"|'.*?'|\d+(?:\.\d*)?|\.(?:\.|\d+)?|[\)\]])|(\/\/?|!=|[<>]=?|[\(\[|,=+-])|([@$])/g;
  var TERM = 1, OPERATOR = 2, MODIFIER = 3;
  var tokenType = OPERATOR;
  prefix += ':';
  function replacer(token, identifier, suffix, term, operator, modifier) {
    if (suffix) {
      tokenType =
        (suffix === ':' || (suffix === '::' && (identifier === 'attribute' || identifier === 'namespace')))
        ? MODIFIER : OPERATOR;
    } else if (identifier) {
      if (tokenType === OPERATOR && identifier != '*')
        token = prefix + token;
      tokenType = (tokenType === TERM) ? OPERATOR : TERM;
    } else {
      tokenType = term ? TERM : operator ? OPERATOR : MODIFIER;
    }
    return token;
  }
  return xpath.replace(tokenPattern, replacer);
}

// $X on XHTML
// @target Freifox3, Chrome3, Safari4, Opera10
// @source http://gist.github.com/184276.txt
// a little modified ver
function $X (exp, context) {
  context || (context = document);
  var _document  = context.ownerDocument || context,
  documentElement = _document.documentElement,
  isXHTML = documentElement.tagName !== 'HTML' && _document.createElement('p').tagName === 'p',
  defaultPrefix = null;
  if (isXHTML) {
    defaultPrefix = '__default__';
    exp = addDefaultPrefix(exp, defaultPrefix);
  }
  function resolver (prefix) {
    return context.lookupNamespaceURI(prefix === defaultPrefix ? null : prefix) ||
         documentElement.namespaceURI || "";
  }
  function value(node) {
    if(!node) return;

    switch(node.nodeType) {
      case Node.ELEMENT_NODE:
        return node;
      case Node.ATTRIBUTE_NODE:
      case Node.TEXT_NODE:
        return node.textContent;
    }
  }

  var result = _document.evaluate(exp, context, resolver, XPathResult.ANY_TYPE, null);
  switch (result.resultType) {
    case XPathResult.STRING_TYPE : return result.stringValue;
    case XPathResult.NUMBER_TYPE : return result.numberValue;
    case XPathResult.BOOLEAN_TYPE: return result.booleanValue;
    case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
      // not ensure the order.
      var ret = [], i = null;
      while (i = result.iterateNext()) ret.push(value(i));
      return ret;
  }
}

// Ported from Tombloo
// Public License
function joinText(txts, delm, trimTag) {
  if(!txts) return '';
  if(!delm) delm = ',';
  txts = [].concat(txts).filter(operator.truth).flatten();
  return (trimTag? txts.map(methodcaller('trimTag')) : txts).join(delm);
}

function tagName(elm) {
  return elm.tagName? elm.tagName.toLowerCase() : '';
}

/**
 * メソッドが呼ばれる前に処理を追加する。
 * より詳細なコントロールが必要な場合はaddAroundを使うこと。
 *
 * @param {Object} target 対象オブジェクト。
 * @param {String} name メソッド名。
 * @param {Function} before 前処理。
 *        対象オブジェクトをthisとして、オリジナルの引数が全て渡されて呼び出される。
 */
function addBefore(target, name, before) {
  var original = target[name];
  target[name] = function() {
    before.apply(target, arguments);
    return original.apply(target, arguments);
  };
}

/**
 * メソッドへアラウンドアドバイスを追加する。
 * 処理を置きかえ、引数の変形や、返り値の加工をできるようにする。
 *
 * @param {Object} target 対象オブジェクト。
 * @param {String || Array} methodNames
 *        メソッド名。複数指定することもできる。
 *        set*のようにワイルドカートを使ってもよい。
 * @param {Function} advice
 *        アドバイス。proceed、args、target、methodNameの4つの引数が渡される。
 *        proceedは対象オブジェクトにバインド済みのオリジナルのメソッド。
 */
function addAround(target, methodNames, advice) {
  methodNames = [].concat(methodNames);

  // ワイルドカードの展開
  for (var i=0 ; i<methodNames.length ; i++) {
    if (methodNames[i].indexOf('*') === -1) {
      continue;
    }

    var hint = methodNames.splice(i, 1)[0];
    hint = new RegExp('^' + hint.replace(/\*/g, '.*'));
    for (var prop in target) {
      if (hint.test(prop) && typeof(target[prop]) === 'function') {
        methodNames.push(prop);
      }
    }
  }

  methodNames.forEach(function(methodName) {
    var method = target[methodName];
    target[methodName] = function() {
      var self = this;
      return advice(
        function(args) {
          return method.apply(self, args);
        },
        arguments, self, methodName);
    };
    target[methodName].overwrite = (method.overwrite || 0) + 1;
  });
}

// from https://developer.mozilla.org/En/DOM/Event/UIEvent/KeyEvent
var KeyEvent = {
  'DOM_VK_CANCEL'        : 3,
  'DOM_VK_HELP'          : 6,
  'DOM_VK_BACK_SPACE'    : 8,
  'DOM_VK_TAB'           : 9,
  'DOM_VK_CLEAR'         : 12,
  'DOM_VK_RETURN'        : 13,
  'DOM_VK_ENTER'         : 14,
  'DOM_VK_SHIFT'         : 16,
  'DOM_VK_CONTROL'       : 17,
  'DOM_VK_ALT'           : 18,
  'DOM_VK_PAUSE'         : 19,
  'DOM_VK_CAPS_LOCK'     : 20,
  'DOM_VK_ESCAPE'        : 27,
  'DOM_VK_SPACE'         : 32,
  'DOM_VK_PAGE_UP'       : 33,
  'DOM_VK_PAGE_DOWN'     : 34,
  'DOM_VK_END'           : 35,
  'DOM_VK_HOME'          : 36,
  'DOM_VK_LEFT'          : 37,
  'DOM_VK_UP'            : 38,
  'DOM_VK_RIGHT'         : 39,
  'DOM_VK_DOWN'          : 40,
  'DOM_VK_PRINTSCREEN'   : 44,
  'DOM_VK_INSERT'        : 45,
  'DOM_VK_DELETE'        : 46,
  'DOM_VK_0'             : 48,
  'DOM_VK_1'             : 49,
  'DOM_VK_2'             : 50,
  'DOM_VK_3'             : 51,
  'DOM_VK_4'             : 52,
  'DOM_VK_5'             : 53,
  'DOM_VK_6'             : 54,
  'DOM_VK_7'             : 55,
  'DOM_VK_8'             : 56,
  'DOM_VK_9'             : 57,
  'DOM_VK_SEMICOLON'     : 59,
  'DOM_VK_EQUALS'        : 61,
  'DOM_VK_A'             : 65,
  'DOM_VK_B'             : 66,
  'DOM_VK_C'             : 67,
  'DOM_VK_D'             : 68,
  'DOM_VK_E'             : 69,
  'DOM_VK_F'             : 70,
  'DOM_VK_G'             : 71,
  'DOM_VK_H'             : 72,
  'DOM_VK_I'             : 73,
  'DOM_VK_J'             : 74,
  'DOM_VK_K'             : 75,
  'DOM_VK_L'             : 76,
  'DOM_VK_M'             : 77,
  'DOM_VK_N'             : 78,
  'DOM_VK_O'             : 79,
  'DOM_VK_P'             : 80,
  'DOM_VK_Q'             : 81,
  'DOM_VK_R'             : 82,
  'DOM_VK_S'             : 83,
  'DOM_VK_T'             : 84,
  'DOM_VK_U'             : 85,
  'DOM_VK_V'             : 86,
  'DOM_VK_W'             : 87,
  'DOM_VK_X'             : 88,
  'DOM_VK_Y'             : 89,
  'DOM_VK_Z'             : 90,
  'DOM_VK_CONTEXT_MENU'  : 93,
  'DOM_VK_NUMPAD0'       : 96,
  'DOM_VK_NUMPAD1'       : 97,
  'DOM_VK_NUMPAD2'       : 98,
  'DOM_VK_NUMPAD3'       : 99,
  'DOM_VK_NUMPAD4'       : 100,
  'DOM_VK_NUMPAD5'       : 101,
  'DOM_VK_NUMPAD6'       : 102,
  'DOM_VK_NUMPAD7'       : 103,
  'DOM_VK_NUMPAD8'       : 104,
  'DOM_VK_NUMPAD9'       : 105,
  'DOM_VK_MULTIPLY'      : 106,
  'DOM_VK_ADD'           : 107,
  'DOM_VK_SEPARATOR'     : 108,
  'DOM_VK_SUBTRACT'      : 109,
  'DOM_VK_DECIMAL'       : 110,
  'DOM_VK_DIVIDE'        : 111,
  'DOM_VK_F1'            : 112,
  'DOM_VK_F2'            : 113,
  'DOM_VK_F3'            : 114,
  'DOM_VK_F4'            : 115,
  'DOM_VK_F5'            : 116,
  'DOM_VK_F6'            : 117,
  'DOM_VK_F7'            : 118,
  'DOM_VK_F8'            : 119,
  'DOM_VK_F9'            : 120,
  'DOM_VK_F10'           : 121,
  'DOM_VK_F11'           : 122,
  'DOM_VK_F12'           : 123,
  'DOM_VK_F13'           : 124,
  'DOM_VK_F14'           : 125,
  'DOM_VK_F15'           : 126,
  'DOM_VK_F16'           : 127,
  'DOM_VK_F17'           : 128,
  'DOM_VK_F18'           : 129,
  'DOM_VK_F19'           : 130,
  'DOM_VK_F20'           : 131,
  'DOM_VK_F21'           : 132,
  'DOM_VK_F22'           : 133,
  'DOM_VK_F23'           : 134,
  'DOM_VK_F24'           : 135,
  'DOM_VK_NUM_LOCK'      : 144,
  'DOM_VK_SCROLL_LOCK'   : 145,
  'DOM_VK_COMMA'         : 188,
  'DOM_VK_PERIOD'        : 190,
  'DOM_VK_SLASH'         : 191,
  'DOM_VK_BACK_QUOTE'    : 192,
  'DOM_VK_OPEN_BRACKET'  : 219,
  'DOM_VK_BACK_SLASH'    : 220,
  'DOM_VK_CLOSE_BRACKET' : 221,
  'DOM_VK_QUOTE'         : 222,
  'DOM_VK_META'          : 224
};

function keyString(e) {
  // 初回呼び出し時にキーテーブルを作成する
  var table = [];
  for(var name in KeyEvent) {
    if(name.indexOf('DOM_VK_') === 0) {
      table[KeyEvent[name]] = name.substring(7);
    }
  }

  return (keyString = function keyString(e) {
    var code = e.keyCode;
    var res = [];
    (e.metaKey  || code===KeyEvent.DOM_VK_META)    && res.push('META');
    (e.ctrlKey  || code===KeyEvent.DOM_VK_CONTROL) && res.push('CTRL');
    (e.shiftKey || code===KeyEvent.DOM_VK_SHIFT)   && res.push('SHIFT');
    (e.altKey   || code===KeyEvent.DOM_VK_ALT)     && res.push('ALT');

    if ((code < KeyEvent.DOM_VK_SHIFT || KeyEvent.DOM_VK_ALT < code) && code != KeyEvent.DOM_VK_META) {
      res.push(table[code]);
    }

    return res.join(' + ');
  })(e);
}

function stop(ev) {
  ev.preventDefault();
  ev.stopPropagation();
}
var cancel = stop;

function unescapeHTML(s) {
  return s.replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function update(t, s) {
  if(s) {
    Object.keys(s).forEach(function(key) {
      t[key] = s[key];
    });
  }
  return t;
}

function maybeDeferred(d) {
  return typeof(d) === 'function' ?
    MochiKit.Async.maybeDeferred(d) :
    (d===null || !d.addCallback) ? succeed(d) : d;
}

function formContents(elm, nomultiple) {
  if (typeof(elm) === 'string') {
    elm = createHTML(elm);
  }
  if (elm.nodeType === Node.DOCUMENT_NODE) {
    elm = elm.body;
  }
  return zip.apply(null, MochiKit.DOM.formContents(elm)).reduce(function(ret, pair) {
    var name = pair[0];
    var val = pair[1];
    if (ret[name]) {
      if (nomultiple) {
        ret[name] = val;
      } else {
        if (Array.isArray(ret[name])) {
          ret[name].push(val);
        } else {
          ret[name] = [ret[name], val];
        }
      }
    } else {
      ret[name] = val;
    }
    return ret;
  }, {});
}

function isEmpty(obj) {
  for (var i in obj)
    return false;
  return true;
}

function queryString(params, question) {
  if (typeof(params) === 'string') {
    return params;
  }

  if (isEmpty(params)) {
    return '';
  }

  var qeries = [];
  for (var key in params) {
    var value = params[key];
    if (value === null) {
      continue;
    } else if (Array.isArray(value)) {
      value.forEach(function(val){
        qeries.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
      });
    } else {
      qeries.push(encodeURIComponent(key) + '='+ encodeURIComponent(value));
    }
  }
  return (question ? '?' : '') + qeries.join('&');
}

function queryHash(query) {
  var hash = { };
  query = query.replace(/^\?/, '');
  query.split(/[&;]/).forEach(function(pair) {
    pair = pair.split('=');
    if (pair.length === 2) {
      var key = pair[0];
      var val = pair[1];
      if (!hash[key]) {
        hash[key] = val;
      } else if (Array.isArray(hash[key])) {
        hash[key].push(val);
      } else {
        hash[key] = [hash[key], val];
      }
    }
  });
  return hash;
}

// others
function $A(arr) {
  return Array.prototype.slice.call(arr);
};

var $ = (function() {
  var hash = {};
  return function $(id) {
    return hash[id] || document.getElementById(id);
  };
})();

function $DF() {
  return document.createDocumentFragment();
}

function $D(elm) {
  var range = document.createRange();
  range.selectNodeContents(elm);
  range.deleteContents();
  range.detach();
};

var $N = function(name, attr, childs) {
  var ret = document.createElement(name);
  if(attr) {
    for (var k in attr) {
      if (attr.hasOwnProperty(k)) {
        ret.setAttribute(k, attr[k]);
      }
    }
  }
  switch (typeof childs) {
    case "string":
      ret.appendChild(document.createTextNode(childs));
      break;
    case "object":
      if (isArrayLike(childs)) {
        for (var i=0, len=childs.length; i<len; i++) {
          var child = childs[i];
          if (typeof child === "string") {
            ret.appendChild(document.createTextNode(child));
          } else {
            ret.appendChild(child);
          }
        }
      } else {
        ret.appendChild(childs);
      }
      break;
  }
  return ret;
};

function setStyle(element, attrs) {
  Object.keys(attrs).forEach(function(key) {
    element.style[key] = attrs[key];
  });
};

function $T(mes) {
  return document.createTextNode(mes);
};

var createURI = (function() {
  var anchor = document.createElement('a');
  return function createURI(link) {
    var a = anchor.cloneNode(false);
    a.href = link;
    return a;
  };
})();

function DeferredHash(ds) {
  var props = keys(ds);
  return new DeferredList(values(ds)).addCallback(function(results) {
    var res = {};
    for (var i = 0, len=results.length; i < len; i++) {
      res[props[i]] = results[i];
    }
    return res;
  });
}

// Code from ChromeFullFeed
// (c) id:Constellation MIT License
function resolveRelativePath(base) {
  var top = base.match(/^https?:\/\/[^\/]+/)[0];
  var current = base.replace(/\/[^\/]+$/, '/');
  return function(url) {
    if (url.match(/^https?:\/\//)) {
      return url;
    } else if (url.indexOf("/") === 0) {
      return top + url;
    } else {
      var result = current;
      if(url.indexOf(".") === 0){
        var count = 15;// 無限ループ防止用. 15回も../や./使ってるURLはさすがにないだろということで.
        while(url.indexOf(".") === 0 && !(--count === 0)){
          if(url.substring(0, 3) === "../")
            result = result.replace(/\/[^\/]+\/$/,"/");
          url = url.replace(/^\.+\/?/,"");
        }
      }
      return result + url;
    }
  };
}

// (c) id:nanto_vi
// http://nanto.asablo.jp/blog/2010/02/05/4858761
function convertToHTMLString(source, safe, hatena) {
  if (!source || (source.getRangeAt && source.isCollapsed)) return '';
  var range = source.getRangeAt ? source.getRangeAt(0) : null;
  var node = range ? range.cloneContents() : source.cloneNode(true);
  if (safe) {
    var root = range && range.commonAncestorContainer.cloneNode(false);
    if (!root || root.nodeType !== root.ELEMENT_NODE)
      root = node.ownerDocument.createElement('div');
    root.appendChild(node);
    $X('descendant::*[contains(",' +
       convertToHTMLString.UNSAFE_ELEMENTS +
       ',", concat(",", local-name(.), ","))]',
       root).forEach(removeElement);
    $X('descendant::*/@*[not(contains(",' +
       convertToHTMLString.SAFE_ATTRIBUTES +
       ',", concat(",", local-name(.), ",")))]',
       root).forEach(convertToHTMLString.removeAttributeNode);

    // resolve relative path
    $X("descendant-or-self::a", root).forEach(convertToHTMLString.resetter.href);
    $X('descendant-or-self::*[contains(" img embed ", concat(" ", local-name(.), " "))]', root).forEach(convertToHTMLString.resetter.src);
    $X("descendant-or-self::object", root).forEach(convertToHTMLString.resetter.data);

    if(hatena){
      var keyword = node.ownerDocument.createElement('span');
      keyword.setAttribute('class', 'keyword');
      $X('descendant-or-self::a[(@class="keyword") or (@class="okeyword")]', root).forEach(function(key){
        var r = keyword.cloneNode(false);
        $A(key.childNodes).forEach(function(child){ r.appendChild(child.cloneNode(true)); });
        key.parentNode.replaceChild(r, key);
      });
    }

    node = appendChildNodes($DF(), root.childNodes);
  }
  return new XMLSerializer().serializeToString(node);
}

update(convertToHTMLString, {
  UNSAFE_ELEMENTS: 'frame,script,style,frame,iframe',
  SAFE_ATTRIBUTES: 'action,cellpadding,cellspacing,checked,cite,clear,' +
                   'cols,colspan,content,coords,enctype,face,for,href,' +
                   'label,method,name,nohref,nowrap,rel,rows,rowspan,' +
                   'shape,span,src,style,title,target,type,usemap,value',
  removeAttributeNode: function removeAttributeNode(attr) {
    if (attr.ownerElement)
      attr.ownerElement.removeAttributeNode(attr);
  },
  resetter: {
    href : function(elm){
      if(elm.getAttribute("href")) elm.href = elm.href;
    },
    data : function(elm){
      if(elm.getAttribute("data")) elm.data = elm.data;
    },
    src  : function(elm){
      if(elm.getAttribute("src")) elm.src = elm.src;
    }
  }
});

function getSelectionContents(sel) {
  if(sel) {
    sel = (sel.getSelection)? sel.getSelection() : sel;
    if(sel.rangeCount && !sel.isCollapsed) {
      return sel.getRangeAt(0).cloneContents();
    }
  }
}

function createFlavoredString(src) {
  return {
    raw  : src.textContent || src.toString(),
    html : convertToHTMLString(src, true, !!TBRL.config['post']['remove_hatena_keyword'])
  };
}

function getFlavor(ps, name) {
  return (!ps.body || !ps.flavors)? ps.body :
    ps.flavors[name] || ps.body;
}

function templateExtract(template, hash) {
  var reg = /%(%|([^\s]+?[^%\s])%)/g;

  return template.replace(reg, function(m, flag, title) {
    return (flag[0] === '%')     ? '%' :
      hash.hasOwnProperty(title) ? (hash[title] || "") : "";
  });
}

function checkHttps(ps) {
  var page = ps.pageUrl,
      item = ps.itemUrl,
      pageFlag = false,
      itemFlag = false,
      m    = null;
  if (page && (m = page.match(/^https:\/\/[^/]+/))) {
    pageFlag = true;
    ps.pageUrl = m[0];
  }
  if (item && (m = item.match(/^https:\/\/[^/]+/))) {
    itemFlag = true;
    ps.itemUrl = m[0];
  }
  ps.https = {
    pageUrl: [pageFlag, page],
    itemUrl: [itemFlag, item]
  };
  return ps;
}

function getTempFile(ext) {
  ext || (ext = 'blob');
  var d = new Deferred();
  var req = window.requestFileSystem || window.webkitRequestFileSystem;
  req(TEMPORARY, 1024 * 1024, function(fs) {
    fs.root.getDirectory('tmp', {
      create: true
    }, function (dir) {
      dir.getFile(Math.random().toString(36).slice(2) + '.' + ext, {
        create: true
      }, function(file) {
        d.callback(file);
      }, function(e) {
        d.errback(e);
      });
    }, function(e) {
      d.errback(e);
    });
  });
  return d;
}

function getWriter(file) {
  var d = new Deferred();
  file.createWriter(function(writer) {
    d.callback(writer);
  });
  return d;
}

function getFileFromEntry(entry) {
  var d = new Deferred();
  entry.file(function(file) {
    d.callback(file);
  }, function onError(e) {
    d.errback(e);
  });
  return d;
}

// this is very experimental
function download(url, type, ext) {
  return request(url, {
    responseType: 'arraybuffer'
  }).addCallback(function(res) {
    var buffer = res.response;
    var mime = res.getResponseHeader('Content-Type').replace(/;.*/, '');
    type = mime || type;
    ext = getFileExtensionFromMime(mime) || ext;
    return createFileEntryFromArrayBuffer(buffer, type, ext);
  });
}

function downloadBlob(url, type) {
  return request(url, {
    responseType: 'arraybuffer'
  }).addCallback(function(res) {
    var buffer = res.response;
    var builder = getBlobBuilder();
    builder.append(buffer);
    return builder.getBlob(type);
  });
}

var getBlobBuilder = (function() {
  var builder = window.BlobBuilder || window.WebKitBlobBuilder;
  return function getBlobBuilder() {
    return new builder();
  };
})();

function createFileEntryFromArrayBuffer(buffer, type, ext) {
  var d = new Deferred();
  var builder = getBlobBuilder();
  builder.append(buffer);
  getTempFile(ext)
  .addCallback(function(entry) {
    return getWriter(entry)
    .addCallback(function(writer) {
      writer.onwrite = function onWrite(e) {
        d.callback(entry);
      };
      writer.onerror = function onError(e) {
        d.errback(e);
      };
      writer.write(builder.getBlob(type));
    })
    .addErrback(function(e) {
      d.errback(e);
    });
  });
  return d;
}

var getURLObject = (function() {
  var url = null;
  if (window.URL) {
    url = window.URL;
  } else {
    url = window.webkitURL;
  }
  return function getURLObject() {
    return url;
  };
})();

var getURLFromFile = (function() {
  var err = new Error("createObjectURL is not found");
  var get = window.createBlobURL || window.createObjectURL;
  if (get) {
    return function getURLFromFile(file) {
      return get(file);
    };
  }
  return function getURLFromFile(file) {
    return getURLObject().createObjectURL(file);
  };
})();

function revokeObjectURL(url) {
  getURLObject().revokeObjectURL(url);
}

var KEY_ACCEL = (/mac/i.test(navigator.platform))? 'META' : 'CTRL';

function request(url, opt) {
  var req = new XMLHttpRequest();
  var ret = new Deferred();
  var data;

  opt = (opt) ? update({}, opt) : {};
  var method = opt.method && opt.method.toUpperCase();

  if (opt.queryString) {
    var qs = queryString(opt.queryString, true);
    url += qs;
  }

  // construct FormData (if required)
  var multipart = false;
  if (opt.sendContent && opt.mode && (opt.mode === 'raw')) {
    // no modify, use sendContent directly
    data = opt.sendContent;
    if (!method) {
      method = 'POST';
    }
  } else if (opt.sendContent && (!method || method === 'POST')) {
    var sendContent = opt.sendContent;
    if (!method) {
      method = 'POST';
    }
    for (var key in sendContent) {
      if (sendContent[key] instanceof File) {
        multipart = true;
        break;
      }
    }
    if (multipart) {
      // using FormData is not unstable in Yahoo Model.
      // so, use it in multipart pattern only
      data = new FormData();
      for (var key in sendContent) {
        var value = sendContent[key];
        if (value === null || value === undefined) {
          continue;
        }
        data.append(key, value);
      }
    } else {
      data = queryString(sendContent, false);
    }
  }

  // construct method
  if (!method) {
    method = 'GET';
  }

  // open XHR
  if ('username' in opt) {
    req.open(method, url, true, opt.username, opt.password);
  } else {
    req.open(method, url, true);
  }

  // construct responseType
  if (opt.responseType) {
    req.responseType = opt.responseType;
  }

  // construct charset
  if (opt.charset) {
    req.overrideMimeType(opt.charset);
  }

  // construct headers
  var setHeader = true;
  if (opt.headers) {
    if (opt.headers['Content-Type']) {
      setHeader = false;
    }
    Object.keys(opt.headers).forEach(function(key) {
      req.setRequestHeader(key, opt.headers[key]);
    });
  }

  if (setHeader && opt.sendContent && !multipart) {
    req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  }

  var position = -1;
  var error = false;

  req.onprogress = function(e) {
    position = e.position;
  };

  req.onreadystatechange = function(e) {
    if (req.readyState === 4) {
      var length = 0;
      try {
        length = parseInt(req.getResponseHeader('Content-Length'), 10);
      } catch (e) {
        console.log('ERROR', e);
      }
      // 最終時のlengthと比較
      if (position !== length) {
        if (opt.denyRedirection) {
          ret.errback(req);
          error = true;
        }
      }
      if (!error) {
        if (req.status >= 200 && req.status < 300) {
          ret.callback(req);
        } else {
          req.message = chrome.i18n.getMessage('error_http' + req.status);
          ret.errback(req);
        }
      }
    }
  };

  if (data) {
    req.send(data);
  } else {
    req.send();
  }
  return ret;
}

function binaryRequest(url, opt) {
  return request(url, update({
    charset: 'text/plain; charset=x-user-defined'
  }, opt)).addCallback(function(res) {
    res.responseText = res.responseText.replace(
      /[\u0100-\uffff]/g, function(c) {
      return String.fromCharCode(c.charCodeAt(0) & 0xff);
    });
    return res;
  });
}

function getEncoding(text) {
  var matched = text.match(/<\s*meta\b[^>]*?charset\s*=\s*(["'])?([^\s"'>\/]+)\1[^>]*>/i);
  return (matched && !matched[2].match(/UTF-8/i) && matched[2]);
}

function getCharset(text) {
  var matched = text.match(/charset\s*=\s*(["'])?([^\s"'>\/]+)\1[^>]*>/i);
  return (matched && !matched[2].match(/UTF-8/i) && matched[2]);
}

function getFileExtension(path) {
  var file = path.replace(/\\/g, '/').replace(/.*\//, '');
  return (/[.]/.exec(file)) ? /[^.]+$/.exec(file)[0] : undefined;
}

function getFileExtensionFromMime(mime) {
  switch (mime) {
    case 'image/bmp' : return 'bmp';
    case 'image/gif' : return 'gif';
    case 'image/jpeg': return 'jpg';
    case 'image/png' : return 'png';
    default: return undefined;
  }
}

function getImageMimeType(path) {
  switch (getFileExtension(path)) {
    case 'bmp' : return 'image/bmp';
    case 'gif' : return 'image/gif';
    case 'jpeg': return 'image/jpeg';
    case 'jpg' : return 'image/jpeg';
    case 'png' : return 'image/png';
    default: return undefined;
  }
}

// 2回requestすることでcharset判別する.
function encodedRequest(url, opt) {
  return binaryRequest(url, opt).addCallback(function(res) {
    var binary = res.responseText;
    var charset = null;
    var header = res.getResponseHeader('Content-Type');
    if (header) {
      charset = getCharset(header);
    }
    if (!charset) {
      charset = getEncoding(binary);
      if (!charset) {
        charset = 'utf-8';
      }
    }
    return request(url, update({
      charset: 'text/html; charset=' + charset
    }, opt));
  });
}

// canvas request
function canvasRequest(url) {
  var canvas = document.createElement('canvas'),
      ret = new Deferred(),
      img = new Image();
  img.addEventListener('load', function img_load(res) {
    img.removeEventListener('load', img_load, false);
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    ret.callback({
      contentType: 'image/png',
      base64: true,
      height: img.naturalHeight,
      width: img.naturalWidth,
      binary: canvas.toDataURL('image/png', '')
    });
  }, false);
  img.src = url;
  return ret;
}

function fileToPNGDataURL(file) {
  return canvasRequest(getURLFromFile(file));
}

function fileToDataURL(file) {
  var ret = new Deferred();
  var reader = new FileReader();
  reader.onload = function(ev) {
    ret.callback(ev.target.result);
  };
  reader.onerror = function(ev) {
    ret.errback(ev);
  };
  reader.readAsDataURL(file);
  return ret;
}

function fileToBinaryString(file) {
  var ret = new Deferred();
  var reader = new FileReader();
  reader.onload = function(ev) {
    ret.callback(ev.target.result);
  };
  reader.onerror = function(e) {
    ret.errback(e);
  };
  reader.readAsBinaryString(file);
  return ret;
}

function cutBase64Header(data) {
  return data.replace(/^.*?,/, '');
}

function base64ToBlob(data, type, cutHeader) {
  if (cutHeader) {
    data = cutBase64Header(data);
  }
  var binary = window.atob(data);
  var buffer = new ArrayBuffer(binary.length);
  var view = new Uint8Array(buffer);
  for (var i = 0, len = binary.length; i < len; ++i) {
    view[i] = binary.charCodeAt(i);
  }
  var builder = getBlobBuilder();
  builder.append(buffer);
  return builder.getBlob(type);
}

function getCookies(domain, name) {
  var ret = new Deferred();
  chrome.cookies.getAll({
    domain: domain,
    name: name
  }, function(cookie) {
    ret.callback(cookie);
  });
  return ret;
}
