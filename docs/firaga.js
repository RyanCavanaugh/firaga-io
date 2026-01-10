"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x3) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x3, {
    get: (a3, b3) => (typeof require !== "undefined" ? require : a3)[b3]
  }) : x3)(function(x3) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x3 + '" is not supported');
  });
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require2() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // node_modules/preact/dist/preact.module.js
  var preact_module_exports = {};
  __export(preact_module_exports, {
    Component: () => p,
    Fragment: () => y,
    cloneElement: () => S,
    createContext: () => q,
    createElement: () => a,
    createRef: () => h,
    h: () => a,
    hydrate: () => O,
    isValidElement: () => l,
    options: () => n,
    render: () => N,
    toChildArray: () => w
  });
  function c(n2, l3) {
    for (var u3 in l3) n2[u3] = l3[u3];
    return n2;
  }
  function s(n2) {
    var l3 = n2.parentNode;
    l3 && l3.removeChild(n2);
  }
  function a(n2, l3, u3) {
    var i3, t3, o3, r3 = arguments, f3 = {};
    for (o3 in l3) "key" == o3 ? i3 = l3[o3] : "ref" == o3 ? t3 = l3[o3] : f3[o3] = l3[o3];
    if (arguments.length > 3) for (u3 = [u3], o3 = 3; o3 < arguments.length; o3++) u3.push(r3[o3]);
    if (null != u3 && (f3.children = u3), "function" == typeof n2 && null != n2.defaultProps) for (o3 in n2.defaultProps) void 0 === f3[o3] && (f3[o3] = n2.defaultProps[o3]);
    return v(n2, f3, i3, t3, null);
  }
  function v(l3, u3, i3, t3, o3) {
    var r3 = { type: l3, props: u3, key: i3, ref: t3, __k: null, __: null, __b: 0, __e: null, __d: void 0, __c: null, __h: null, constructor: void 0, __v: null == o3 ? ++n.__v : o3 };
    return null != n.vnode && n.vnode(r3), r3;
  }
  function h() {
    return { current: null };
  }
  function y(n2) {
    return n2.children;
  }
  function p(n2, l3) {
    this.props = n2, this.context = l3;
  }
  function d(n2, l3) {
    if (null == l3) return n2.__ ? d(n2.__, n2.__.__k.indexOf(n2) + 1) : null;
    for (var u3; l3 < n2.__k.length; l3++) if (null != (u3 = n2.__k[l3]) && null != u3.__e) return u3.__e;
    return "function" == typeof n2.type ? d(n2) : null;
  }
  function _(n2) {
    var l3, u3;
    if (null != (n2 = n2.__) && null != n2.__c) {
      for (n2.__e = n2.__c.base = null, l3 = 0; l3 < n2.__k.length; l3++) if (null != (u3 = n2.__k[l3]) && null != u3.__e) {
        n2.__e = n2.__c.base = u3.__e;
        break;
      }
      return _(n2);
    }
  }
  function k(l3) {
    (!l3.__d && (l3.__d = true) && u.push(l3) && !b.__r++ || t !== n.debounceRendering) && ((t = n.debounceRendering) || i)(b);
  }
  function b() {
    for (var n2; b.__r = u.length; ) n2 = u.sort(function(n3, l3) {
      return n3.__v.__b - l3.__v.__b;
    }), u = [], n2.some(function(n3) {
      var l3, u3, i3, t3, o3, r3;
      n3.__d && (o3 = (t3 = (l3 = n3).__v).__e, (r3 = l3.__P) && (u3 = [], (i3 = c({}, t3)).__v = t3.__v + 1, I(r3, t3, i3, l3.__n, void 0 !== r3.ownerSVGElement, null != t3.__h ? [o3] : null, u3, null == o3 ? d(t3) : o3, t3.__h), T(u3, t3), t3.__e != o3 && _(t3)));
    });
  }
  function m(n2, l3, u3, i3, t3, o3, e3, c3, s3, a3) {
    var h3, p3, _2, k3, b3, m3, w3, A2 = i3 && i3.__k || f, P2 = A2.length;
    for (u3.__k = [], h3 = 0; h3 < l3.length; h3++) if (null != (k3 = u3.__k[h3] = null == (k3 = l3[h3]) || "boolean" == typeof k3 ? null : "string" == typeof k3 || "number" == typeof k3 || "bigint" == typeof k3 ? v(null, k3, null, null, k3) : Array.isArray(k3) ? v(y, { children: k3 }, null, null, null) : k3.__b > 0 ? v(k3.type, k3.props, k3.key, null, k3.__v) : k3)) {
      if (k3.__ = u3, k3.__b = u3.__b + 1, null === (_2 = A2[h3]) || _2 && k3.key == _2.key && k3.type === _2.type) A2[h3] = void 0;
      else for (p3 = 0; p3 < P2; p3++) {
        if ((_2 = A2[p3]) && k3.key == _2.key && k3.type === _2.type) {
          A2[p3] = void 0;
          break;
        }
        _2 = null;
      }
      I(n2, k3, _2 = _2 || r, t3, o3, e3, c3, s3, a3), b3 = k3.__e, (p3 = k3.ref) && _2.ref != p3 && (w3 || (w3 = []), _2.ref && w3.push(_2.ref, null, k3), w3.push(p3, k3.__c || b3, k3)), null != b3 ? (null == m3 && (m3 = b3), "function" == typeof k3.type && null != k3.__k && k3.__k === _2.__k ? k3.__d = s3 = g(k3, s3, n2) : s3 = x(n2, k3, _2, A2, b3, s3), a3 || "option" !== u3.type ? "function" == typeof u3.type && (u3.__d = s3) : n2.value = "") : s3 && _2.__e == s3 && s3.parentNode != n2 && (s3 = d(_2));
    }
    for (u3.__e = m3, h3 = P2; h3--; ) null != A2[h3] && ("function" == typeof u3.type && null != A2[h3].__e && A2[h3].__e == u3.__d && (u3.__d = d(i3, h3 + 1)), L(A2[h3], A2[h3]));
    if (w3) for (h3 = 0; h3 < w3.length; h3++) z(w3[h3], w3[++h3], w3[++h3]);
  }
  function g(n2, l3, u3) {
    var i3, t3;
    for (i3 = 0; i3 < n2.__k.length; i3++) (t3 = n2.__k[i3]) && (t3.__ = n2, l3 = "function" == typeof t3.type ? g(t3, l3, u3) : x(u3, t3, t3, n2.__k, t3.__e, l3));
    return l3;
  }
  function w(n2, l3) {
    return l3 = l3 || [], null == n2 || "boolean" == typeof n2 || (Array.isArray(n2) ? n2.some(function(n3) {
      w(n3, l3);
    }) : l3.push(n2)), l3;
  }
  function x(n2, l3, u3, i3, t3, o3) {
    var r3, f3, e3;
    if (void 0 !== l3.__d) r3 = l3.__d, l3.__d = void 0;
    else if (null == u3 || t3 != o3 || null == t3.parentNode) n: if (null == o3 || o3.parentNode !== n2) n2.appendChild(t3), r3 = null;
    else {
      for (f3 = o3, e3 = 0; (f3 = f3.nextSibling) && e3 < i3.length; e3 += 2) if (f3 == t3) break n;
      n2.insertBefore(t3, o3), r3 = o3;
    }
    return void 0 !== r3 ? r3 : t3.nextSibling;
  }
  function A(n2, l3, u3, i3, t3) {
    var o3;
    for (o3 in u3) "children" === o3 || "key" === o3 || o3 in l3 || C(n2, o3, null, u3[o3], i3);
    for (o3 in l3) t3 && "function" != typeof l3[o3] || "children" === o3 || "key" === o3 || "value" === o3 || "checked" === o3 || u3[o3] === l3[o3] || C(n2, o3, l3[o3], u3[o3], i3);
  }
  function P(n2, l3, u3) {
    "-" === l3[0] ? n2.setProperty(l3, u3) : n2[l3] = null == u3 ? "" : "number" != typeof u3 || e.test(l3) ? u3 : u3 + "px";
  }
  function C(n2, l3, u3, i3, t3) {
    var o3;
    n: if ("style" === l3) if ("string" == typeof u3) n2.style.cssText = u3;
    else {
      if ("string" == typeof i3 && (n2.style.cssText = i3 = ""), i3) for (l3 in i3) u3 && l3 in u3 || P(n2.style, l3, "");
      if (u3) for (l3 in u3) i3 && u3[l3] === i3[l3] || P(n2.style, l3, u3[l3]);
    }
    else if ("o" === l3[0] && "n" === l3[1]) o3 = l3 !== (l3 = l3.replace(/Capture$/, "")), l3 = l3.toLowerCase() in n2 ? l3.toLowerCase().slice(2) : l3.slice(2), n2.l || (n2.l = {}), n2.l[l3 + o3] = u3, u3 ? i3 || n2.addEventListener(l3, o3 ? H : $, o3) : n2.removeEventListener(l3, o3 ? H : $, o3);
    else if ("dangerouslySetInnerHTML" !== l3) {
      if (t3) l3 = l3.replace(/xlink[H:h]/, "h").replace(/sName$/, "s");
      else if ("href" !== l3 && "list" !== l3 && "form" !== l3 && "tabIndex" !== l3 && "download" !== l3 && l3 in n2) try {
        n2[l3] = null == u3 ? "" : u3;
        break n;
      } catch (n3) {
      }
      "function" == typeof u3 || (null != u3 && (false !== u3 || "a" === l3[0] && "r" === l3[1]) ? n2.setAttribute(l3, u3) : n2.removeAttribute(l3));
    }
  }
  function $(l3) {
    this.l[l3.type + false](n.event ? n.event(l3) : l3);
  }
  function H(l3) {
    this.l[l3.type + true](n.event ? n.event(l3) : l3);
  }
  function I(l3, u3, i3, t3, o3, r3, f3, e3, s3) {
    var a3, v3, h3, d3, _2, k3, b3, g3, w3, x3, A2, P2 = u3.type;
    if (void 0 !== u3.constructor) return null;
    null != i3.__h && (s3 = i3.__h, e3 = u3.__e = i3.__e, u3.__h = null, r3 = [e3]), (a3 = n.__b) && a3(u3);
    try {
      n: if ("function" == typeof P2) {
        if (g3 = u3.props, w3 = (a3 = P2.contextType) && t3[a3.__c], x3 = a3 ? w3 ? w3.props.value : a3.__ : t3, i3.__c ? b3 = (v3 = u3.__c = i3.__c).__ = v3.__E : ("prototype" in P2 && P2.prototype.render ? u3.__c = v3 = new P2(g3, x3) : (u3.__c = v3 = new p(g3, x3), v3.constructor = P2, v3.render = M), w3 && w3.sub(v3), v3.props = g3, v3.state || (v3.state = {}), v3.context = x3, v3.__n = t3, h3 = v3.__d = true, v3.__h = []), null == v3.__s && (v3.__s = v3.state), null != P2.getDerivedStateFromProps && (v3.__s == v3.state && (v3.__s = c({}, v3.__s)), c(v3.__s, P2.getDerivedStateFromProps(g3, v3.__s))), d3 = v3.props, _2 = v3.state, h3) null == P2.getDerivedStateFromProps && null != v3.componentWillMount && v3.componentWillMount(), null != v3.componentDidMount && v3.__h.push(v3.componentDidMount);
        else {
          if (null == P2.getDerivedStateFromProps && g3 !== d3 && null != v3.componentWillReceiveProps && v3.componentWillReceiveProps(g3, x3), !v3.__e && null != v3.shouldComponentUpdate && false === v3.shouldComponentUpdate(g3, v3.__s, x3) || u3.__v === i3.__v) {
            v3.props = g3, v3.state = v3.__s, u3.__v !== i3.__v && (v3.__d = false), v3.__v = u3, u3.__e = i3.__e, u3.__k = i3.__k, u3.__k.forEach(function(n2) {
              n2 && (n2.__ = u3);
            }), v3.__h.length && f3.push(v3);
            break n;
          }
          null != v3.componentWillUpdate && v3.componentWillUpdate(g3, v3.__s, x3), null != v3.componentDidUpdate && v3.__h.push(function() {
            v3.componentDidUpdate(d3, _2, k3);
          });
        }
        v3.context = x3, v3.props = g3, v3.state = v3.__s, (a3 = n.__r) && a3(u3), v3.__d = false, v3.__v = u3, v3.__P = l3, a3 = v3.render(v3.props, v3.state, v3.context), v3.state = v3.__s, null != v3.getChildContext && (t3 = c(c({}, t3), v3.getChildContext())), h3 || null == v3.getSnapshotBeforeUpdate || (k3 = v3.getSnapshotBeforeUpdate(d3, _2)), A2 = null != a3 && a3.type === y && null == a3.key ? a3.props.children : a3, m(l3, Array.isArray(A2) ? A2 : [A2], u3, i3, t3, o3, r3, f3, e3, s3), v3.base = u3.__e, u3.__h = null, v3.__h.length && f3.push(v3), b3 && (v3.__E = v3.__ = null), v3.__e = false;
      } else null == r3 && u3.__v === i3.__v ? (u3.__k = i3.__k, u3.__e = i3.__e) : u3.__e = j(i3.__e, u3, i3, t3, o3, r3, f3, s3);
      (a3 = n.diffed) && a3(u3);
    } catch (l4) {
      u3.__v = null, (s3 || null != r3) && (u3.__e = e3, u3.__h = !!s3, r3[r3.indexOf(e3)] = null), n.__e(l4, u3, i3);
    }
  }
  function T(l3, u3) {
    n.__c && n.__c(u3, l3), l3.some(function(u4) {
      try {
        l3 = u4.__h, u4.__h = [], l3.some(function(n2) {
          n2.call(u4);
        });
      } catch (l4) {
        n.__e(l4, u4.__v);
      }
    });
  }
  function j(n2, l3, u3, i3, t3, o3, e3, c3) {
    var a3, v3, h3, y3, p3 = u3.props, d3 = l3.props, _2 = l3.type, k3 = 0;
    if ("svg" === _2 && (t3 = true), null != o3) {
      for (; k3 < o3.length; k3++) if ((a3 = o3[k3]) && (a3 === n2 || (_2 ? a3.localName == _2 : 3 == a3.nodeType))) {
        n2 = a3, o3[k3] = null;
        break;
      }
    }
    if (null == n2) {
      if (null === _2) return document.createTextNode(d3);
      n2 = t3 ? document.createElementNS("http://www.w3.org/2000/svg", _2) : document.createElement(_2, d3.is && d3), o3 = null, c3 = false;
    }
    if (null === _2) p3 === d3 || c3 && n2.data === d3 || (n2.data = d3);
    else {
      if (o3 = o3 && f.slice.call(n2.childNodes), v3 = (p3 = u3.props || r).dangerouslySetInnerHTML, h3 = d3.dangerouslySetInnerHTML, !c3) {
        if (null != o3) for (p3 = {}, y3 = 0; y3 < n2.attributes.length; y3++) p3[n2.attributes[y3].name] = n2.attributes[y3].value;
        (h3 || v3) && (h3 && (v3 && h3.__html == v3.__html || h3.__html === n2.innerHTML) || (n2.innerHTML = h3 && h3.__html || ""));
      }
      if (A(n2, d3, p3, t3, c3), h3) l3.__k = [];
      else if (k3 = l3.props.children, m(n2, Array.isArray(k3) ? k3 : [k3], l3, u3, i3, t3 && "foreignObject" !== _2, o3, e3, n2.firstChild, c3), null != o3) for (k3 = o3.length; k3--; ) null != o3[k3] && s(o3[k3]);
      c3 || ("value" in d3 && void 0 !== (k3 = d3.value) && (k3 !== n2.value || "progress" === _2 && !k3) && C(n2, "value", k3, p3.value, false), "checked" in d3 && void 0 !== (k3 = d3.checked) && k3 !== n2.checked && C(n2, "checked", k3, p3.checked, false));
    }
    return n2;
  }
  function z(l3, u3, i3) {
    try {
      "function" == typeof l3 ? l3(u3) : l3.current = u3;
    } catch (l4) {
      n.__e(l4, i3);
    }
  }
  function L(l3, u3, i3) {
    var t3, o3, r3;
    if (n.unmount && n.unmount(l3), (t3 = l3.ref) && (t3.current && t3.current !== l3.__e || z(t3, null, u3)), i3 || "function" == typeof l3.type || (i3 = null != (o3 = l3.__e)), l3.__e = l3.__d = void 0, null != (t3 = l3.__c)) {
      if (t3.componentWillUnmount) try {
        t3.componentWillUnmount();
      } catch (l4) {
        n.__e(l4, u3);
      }
      t3.base = t3.__P = null;
    }
    if (t3 = l3.__k) for (r3 = 0; r3 < t3.length; r3++) t3[r3] && L(t3[r3], u3, i3);
    null != o3 && s(o3);
  }
  function M(n2, l3, u3) {
    return this.constructor(n2, u3);
  }
  function N(l3, u3, i3) {
    var t3, o3, e3;
    n.__ && n.__(l3, u3), o3 = (t3 = "function" == typeof i3) ? null : i3 && i3.__k || u3.__k, e3 = [], I(u3, l3 = (!t3 && i3 || u3).__k = a(y, null, [l3]), o3 || r, r, void 0 !== u3.ownerSVGElement, !t3 && i3 ? [i3] : o3 ? null : u3.firstChild ? f.slice.call(u3.childNodes) : null, e3, !t3 && i3 ? i3 : o3 ? o3.__e : u3.firstChild, t3), T(e3, l3);
  }
  function O(n2, l3) {
    N(n2, l3, O);
  }
  function S(n2, l3, u3) {
    var i3, t3, o3, r3 = arguments, f3 = c({}, n2.props);
    for (o3 in l3) "key" == o3 ? i3 = l3[o3] : "ref" == o3 ? t3 = l3[o3] : f3[o3] = l3[o3];
    if (arguments.length > 3) for (u3 = [u3], o3 = 3; o3 < arguments.length; o3++) u3.push(r3[o3]);
    return null != u3 && (f3.children = u3), v(n2.type, f3, i3 || n2.key, t3 || n2.ref, null);
  }
  function q(n2, l3) {
    var u3 = { __c: l3 = "__cC" + o++, __: n2, Consumer: function(n3, l4) {
      return n3.children(l4);
    }, Provider: function(n3) {
      var u4, i3;
      return this.getChildContext || (u4 = [], (i3 = {})[l3] = this, this.getChildContext = function() {
        return i3;
      }, this.shouldComponentUpdate = function(n4) {
        this.props.value !== n4.value && u4.some(k);
      }, this.sub = function(n4) {
        u4.push(n4);
        var l4 = n4.componentWillUnmount;
        n4.componentWillUnmount = function() {
          u4.splice(u4.indexOf(n4), 1), l4 && l4.call(n4);
        };
      }), n3.children;
    } };
    return u3.Provider.__ = u3.Consumer.contextType = u3;
  }
  var n, l, u, i, t, o, r, f, e;
  var init_preact_module = __esm({
    "node_modules/preact/dist/preact.module.js"() {
      r = {};
      f = [];
      e = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
      n = { __e: function(n2, l3) {
        for (var u3, i3, t3; l3 = l3.__; ) if ((u3 = l3.__c) && !u3.__) try {
          if ((i3 = u3.constructor) && null != i3.getDerivedStateFromError && (u3.setState(i3.getDerivedStateFromError(n2)), t3 = u3.__d), null != u3.componentDidCatch && (u3.componentDidCatch(n2), t3 = u3.__d), t3) return u3.__E = u3;
        } catch (l4) {
          n2 = l4;
        }
        throw n2;
      }, __v: 0 }, l = function(n2) {
        return null != n2 && void 0 === n2.constructor;
      }, p.prototype.setState = function(n2, l3) {
        var u3;
        u3 = null != this.__s && this.__s !== this.state ? this.__s : this.__s = c({}, this.state), "function" == typeof n2 && (n2 = n2(c({}, u3), this.props)), n2 && c(u3, n2), null != n2 && this.__v && (l3 && this.__h.push(l3), k(this));
      }, p.prototype.forceUpdate = function(n2) {
        this.__v && (this.__e = true, n2 && this.__h.push(n2), k(this));
      }, p.prototype.render = y, u = [], i = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, b.__r = 0, o = 0;
    }
  });

  // data/color-data-new.csv
  var require_color_data_new = __commonJS({
    "data/color-data-new.csv"(exports, module) {
      module.exports = "R,G,B,Name,Artkal Midi,Artkal Mini,Artkal Mini Starter,Artkal Midi Soft,Artkal Mini Soft,All Perler,Perler Multi Mix,Perler Mini Assorted,Perler Mini Bulk,EvoRetro,Funzbo\r\n255,255,255,White,S01,C01,C01,R01,A01,,,,,,\r\n255,163,139,Burning Sand,S02,C44,C44,R02,A44,,,,,,\r\n246,176,76,Tangerine,S03,C03,C03,R03,A03,,,,,,\r\n255,103,31,Orange,S04,C17,C17,R04,A17,,,,,,\r\n225,6,0,Tall Poppy,S05,C05,C05,R05,A05,,,,,,\r\n236,134,208,Raspberry Pink,S06,C49,,R06,A49,,,,,,\r\n155,155,155,Gray,S07,C33,C33,R07,A33,,,,,,\r\n36,222,91,Emerald,S08,,,R08,,,,,,,\r\n0,104,94,Dark Green,S09,,,R09,,,,,,,\r\n65,182,230,Baby Blue,S10,C19,C19,R10,A19,,,,,,\r\n79,159,179,Lagoon,S100,C99,,,A99,,,,,,\r\n49,150,221,Electric Blue,S101,C100,,,A100,,,,,,\r\n27,108,182,Pool Blue,S102,C101,,,A101,,,,,,\r\n8,57,128,Caribbean Blue,S103,C102,,,A102,,,,,,\r\n10,102,139,Deep Water,S104,C103,,,A103,,,,,,\r\n8,91,110,Petrol Blue,S105,C104,,,A104,,,,,,\r\n0,78,120,Wegdewood Blue,S106,C105,,,A105,,,,,,\r\n0,85,116,Pond Blue,S107,C106,,,A106,,,,,,\r\n204,190,128,Seashell Beige,S108,C107,,,A107,,,,,,\r\n164,147,80,Beige,S109,C108,,,A108,,,,,,\r\n0,51,153,Dark Blue,S11,C21,C21,R11,A21,,,,,,\r\n158,136,60,Beach Beige,S110,C109,,,A109,,,,,,\r\n118,108,43,Caffe Latt\xE9,S111,C110,,,A110,,,,,,\r\n121,95,38,Oaktree Brown,S112,C111,,,A111,,,,,,\r\n186,184,162,Khaki,S113,C112,,,A112,,,,,,\r\n114,140,84,Light Greengray,S114,C113,,,A113,,,,,,\r\n126,124,68,Mossy Green,S115,C114,,,A114,,,,,,\r\n100,105,46,Earth Green,S116,C115,,,A115,,,,,,\r\n78,88,44,Sage Green,S117,C116,,,A116,,,,,,\r\n74,94,45,Pinetree Green,S118,C117,,,A117,,,,,,\r\n113,196,182,Frosty Blue,S119,C118,,,A118,,,,,,\r\n160,94,181,Pastel Lavender,S12,C26,C26,R12,A26,,,,,,\r\n102,204,153,Polar Mint,S120,C119,,,A119,,,,,,\r\n86,154,131,Celadon Green,S121,C120,,,A120,,,,,,\r\n20,194,91,Eucalyptus,S122,C121,,,A121,,,,,,\r\n24,168,24,Clover Field,S123,C122,,,A122,,,,,,\r\n4,85,46,Pooltable Felt,S124,C123,,,A123,,,,,,\r\n19,107,90,Snake Green,S125,C124,,,A124,,,,,,\r\n5,70,65,Dark Eucalyptus,S126,C125,,,A125,,,,,,\r\n217,182,214,Marsmallow Rose,S127,C126,,,A126,,,,,,\r\n173,98,164,Light Grape,S128,C127,,,A127,,,,,,\r\n230,140,163,Rosebud Pink,S129,C128,,,A128,,,,,,\r\n0,0,0,Black,S13,C02,C02,R13,A02,,,,,,\r\n222,84,121,Fuschia,S130,C129,,,A129,,,,,,\r\n158,130,186,Candy Violet,S131,C130,,,A130,,,,,,\r\n232,65,107,Flamingo,S132,C131,,,A131,,,,,,\r\n183,56,143,Pink Plum,S133,C132,,,A132,,,,,,\r\n88,31,126,Amethyst,S134,C133,,,A133,,,,,,\r\n140,163,212,Moonlight Blue,S135,C134,,,A134,,,,,,\r\n154,154,204,Summer Rain,S136,C135,,,A135,,,,,,\r\n89,129,193,Azure Blue,S137,C136,,,A136,,,,,,\r\n65,102,176,Cornflower Blue,S138,C137,,,A137,,,,,,\r\n71,95,171,Forget Me Not,S139,C138,,,A138,,,,,,\r\n250,224,83,Sandstorm,S14,C42,C42,R14,A42,,,,,,\r\n55,69,147,Indigo,S140,C139,,,A139,,,,,,\r\n61,86,165,Horizon Blue,S141,C140,,,A140,,,,,,\r\n41,66,135,Cobalt,S142,C141,,,A141,,,,,,\r\n37,38,138,Royal Blue,S143,C142,,,A142,,,,,,\r\n26,47,111,Marine,S144,C143,,,A143,,,,,,\r\n211,201,93,Pale Yellow Moss,S145,C144,,,A144,,,,,,\r\n81,9,24,Bloodrose Red,S146,C145,,,A145,,,,,,\r\n100,179,158,Spearmint,S147,C146,,,A146,,,,,,\r\n99,67,56,Mocha,S148,C147,,,A147,,,,,,\r\n237,211,158,Creme,S149,C148,,,A148,,,,,,\r\n122,62,44,Redwood,S15,C30,,R15,A30,,,,,,\r\n105,99,171,Iris Violet,S150,C149,,,A149,,,,,,\r\n43,63,31,Forest Green,S151,C150,,,A150,,,,,,\r\n151,145,197,Lilac,S152,C151,,,A151,,,,,,\r\n184,189,224,Pale Lilac,S153,C152,,,A152,,,,,,\r\n249,200,152,Sahara Sand,S154,C153,,,A153,,,,,,\r\n195,144,105,Sunkissed Teint,S155,C154,,,A154,,,,,,\r\n90,90,90,Steel Grey,S156,C155,,,A155,,,,,,\r\n60,60,60,Iron Grey,S157,C156,,,A156,,,,,,\r\n26,26,26,Pepper,S158,C157,,,A157,,,,,,\r\n139,139,139,Oslo Gray,S159,C56,,,A56,,,,,,\r\n92,71,56,Brown,S16,C32,C32,R16,A32,,,,,,\r\n123,77,53,Light Brown,S17,C31,C31,R17,A31,,,,,,\r\n204,153,102,Sand,S18,C23,C23,R18,A23,,,,,,\r\n252,191,169,Bubble Gum,S19,C22,C22,R19,A22,,,,,,\r\n36,158,107,Green,S20,C14,,R20,A14,,,,,,\r\n135,216,57,Pastel Green,S21,C13,C13,R21,A13,,,,,,\r\n51,0,114,Purple,S22,C27,C27,R22,A27,,,,,,\r\n100,53,155,Royal Purple,S23,,,R23,,,,,,,\r\n20,123,209,True Blue,S24,C37,C37,R24,A37,,,,,,\r\n255,52,179,Hot Pink,S25,C08,,R25,A08,,,,,,\r\n219,33,82,Magenta,S26,C09,C09,R26,A09,,,,,,\r\n255,209,0,Yellow,S27,C11,,R27,A11,,,,,,\r\n234,184,228,Lily Pink,S28,,,R28,,,,,,,\r\n246,235,97,Pastel Yellow,S29,C41,,R29,A41,,,,,,\r\n153,214,234,Shadow Green,S30,C39,C39,R30,A39,,,,,,\r\n158,229,176,Sea Mist,S31,C60,C60,R31,A60,,,,,,\r\n255,231,128,Beeswax,S32,C24,,R32,A24,,,,,,\r\n197,180,227,Maverick,S33,C50,C50,R33,A50,,,,,,\r\n186,12,47,Red,S34,C06,,R34,A06,,,,,,\r\n247,206,215,Mona Lisa,S35,,,R35,,,,,,,\r\n201,128,158,Old Pink,S36,C36,,R36,A36,,,,,,\r\n113,216,191,Blue-Green,S37,,,R37,,,,,,,\r\n171,37,86,Burgundy,S38,,,R38,,,,,,,\r\n237,139,0,Yellow Orange,S39,C04,C04,R39,A04,,,,,,\r\n241,167,220,Carnation Pink,S40,C07,C07,R40,A07,,,,,,\r\n154,85,22,Metallic Gold,S41,,,R41,,,,,,,\r\n125,124,121,Metallic Silver,S42,C35,,R42,A35,,,,,,\r\n118,119,119,Dark Gray,S43,C34,C34,R43,A34,,,,,,\r\n170,220,235,Sky Blue,S44,C18,,R44,A18,,,,,,\r\n0,178,169,Medium Turquoise,S45,C54,C54,R45,A54,,,,,,\r\n115,211,60,Bright Green,S46,C53,,R46,A53,,,,,,\r\n180,126,0,Marigold,S47,C28,,R47,A28,,,,,,\r\n255,199,44,Corn,S48,C48,C48,R48,A48,,,,,,\r\n114,25,95,Mulberry Wood,S49,,,R49,,,,,,,\r\n250,170,114,Mandy's Pink,S50,,,R50,,,,,,,\r\n252,251,205,Spring Sun,S51,C51,C51,R51,A51,,,,,,\r\n242,240,161,Picasso,S52,C10,C10,R52,A10,,,,,,\r\n105,179,231,Turquoise,S53,C38,C38,R53,A38,,,,,,\r\n0,144,218,Light Blue,S54,C20,C20,R54,A20,,,,,,\r\n173,220,145,Pistachio,S55,C12,C12,R57,A12,,,,,,\r\n255,106,19,Bright Carrot,S56,C16,,R59,A16,,,,,,\r\n164,73,61,Buccaneer,S57,C29,,R63,A29,,,,,,\r\n165,0,52,Paprika,S58,C43,,R64,A43,,,,,,\r\n74,31,135,Butterfly Bush,S59,C52,C52,,A52,,,,,,\r\n167,123,202,Lavender,S60,C25,C25,R66,A25,,,,,,\r\n206,220,0,Key Lime Pie,S61,C40,,R68,A40,,,,,,\r\n0,124,88,Green Tea,S62,C15,C15,R69,A15,,,,,,\r\n88,87,53,Metallic Copper,S63,,,R70,,,,,,,\r\n5,8,73,Black Rock,S64,C58,,R55,A58,,,,,,\r\n243,234,93,Canary,S65,C46,,R58,A46,,,,,,\r\n244,99,58,Blaze Orange,S66,,,R60,,,,,,,\r\n243,207,179,Vanilla,S67,C47,C47,R61,A47,,,,,,\r\n225,192,120,Tan,S68,,,R71,,,,,,,\r\n40,40,40,Mine Shaft,S69,C69,,R72,A69,,,,,,\r\n155,188,17,Dark Algae,S70,C84,,R89,A84,,,,,,\r\n0,133,34,Jade Green,S71,C86,C86,R73,A86,,,,,,\r\n89,213,216,Light Sea Blue,S72,C79,C79,R74,A79,,,,,,\r\n72,169,197,Steel Blue,S73,C81,C81,R91,A81,,,,,,\r\n0,174,214,Azure,S74,C82,C82,R75,A82,,,,,,\r\n0,133,173,Dark Steel Blue,S75,C83,,R92,A83,,,,,,\r\n0,174,199,Sea Blue,S76,C80,,R76,A80,,,,,,\r\n239,239,239,Ghost While,S77,C87,,R77,A87,,,,,,\r\n209,209,209,Ash Grey,S78,C88,C88,R78,A88,,,,,,\r\n187,188,188,Light Gray,S79,C89,,R79,A89,,,,,,\r\n153,155,48,Dark Olive,S80,C85,,R90,A85,,,,,,\r\n205,178,119,Deer,S81,C74,,R81,A74,,,,,,\r\n181,129,80,Clay,S82,C75,,R82,A75,,,,,,\r\n184,97,37,Sienna,S83,C73,,R83,A73,,,,,,\r\n170,87,97,Deep Chestnut,S84,C77,,R84,A77,,,,,,\r\n92,19,27,Red Wine,S85,C78,C78,R85,A78,,,,,,\r\n234,170,0,Goldenrod,S86,C71,,R86,A71,,,,,,\r\n255,109,106,Coral Red,S87,C76,,R87,A76,,,,,,\r\n218,24,132,Dark Pink,S88,,,,,,,,,,\r\n77,77,77,Charcoal Gray,S89,C90,,R88,A90,,,,,,\r\n255,197,110,Pastel Orange,S90,C72,,R80,A72,,,,,,\r\n24,48,40,Brunswick Green,S91,C70,C70,R93,A70,,,,,,\r\n222,185,71,Dandelion,S92,C91,,,A91,,,,,,\r\n218,182,152,Pale Skin,S93,C92,,,A92,,,,,,\r\n244,169,153,Warm Blush,S94,C93,,,A93,,,,,,\r\n238,125,103,Salmon,S95,C94,,,A94,,,,,,\r\n240,134,97,Apricot,S96,C95,,,A95,,,,,,\r\n212,114,42,Papaya,S97,C96,,,A96,,,,,,\r\n100,172,223,Himalaya Blue,S98,C97,,,A97,,,,,,\r\n100,194,220,Waterfall,S99,C98,,,A98,,,,,,\r\n93,219,93,Spring Green,,C45,,R56,A45,,,,,,\r\n108,194,74,Confier,,C55,,,A55,,,,,,\r\n188,4,35,Fresh Red,,C57,C57,R65,A57,,,,,,\r\n83,26,35,Scarlett,,C59,,R62,A59,,,,,,\r\n241,235,156,Feta,,C61,,,A61,,,,,,\r\n252,63,63,Carnation,,C62,,,A62,,,,,,\r\n234,190,219,Pink Pearl,,C63,,,A63,,,,,,\r\n165,0,80,Rose,,C64,C64,,A64,,,,,,\r\n239,129,46,Mango Tango,,C65,,,A65,,,,,,\r\n252,108,133,Wild Watermelon,,C66,,,A66,,,,,,\r\n177,78,181,Orchid,,C67,,,A67,,,,,,\r\n105,194,238,Toothpaste Blue,,C68,C68,,A68,,,,,,\r\n255,197,110,Yolk Yellow,,,,R67,,,,,,,\r\n255,255,255,White,,,,,,1,1,,1,,\r\n190,195,191,Light Gray,,,,,,1,,,1,,\r\n150,152,156,Gray,,,,,,1,1,,1,,\r\n147,161,159,Pewter,,,,,,1,,,,,\r\n84,95,95,Charcoal,,,,,,1,,,,,\r\n86,87,92,Dark Gray,,,,,,1,,,,,\r\n0,0,0,Black,,,,,,1,1,,1,,\r\n241,229,216,Toasted Marshmallow,,,,,,1,,,1,,\r\n234,196,159,Sand,,,,,,1,,,1,,\r\n215,176,135,Fawn,,,,,,1,,,,,\r\n207,168,137,Tan,,,,,,1,1,,1,,\r\n160,78,63,Rust,,,,,,1,,,,,\r\n136,64,79,Cranapple,,,,,,1,,,,,\r\n164,123,71,Light Brown,,,,,,1,1,,1,,\r\n126,84,70,Gingerbread,,,,,,1,,,,,\r\n108,82,77,Brown,,,,,,1,1,,1,,\r\n237,231,186,Creme,,,,,,1,,,,,\r\n250,238,141,Pastel Yellow,,,,,,1,,,,,\r\n249,215,55,Yellow,,,,,,1,1,,1,,\r\n255,182,78,Cheddar,,,,,,1,1,,,,\r\n255,128,62,Orange,,,,,,1,,,1,,\r\n225,154,82,Butterscotch,,,,,,1,1,,1,,\r\n218,140,44,Honey,,,,,,1,,,,,\r\n255,97,88,Hot Coral,,,,,,1,1,,,,\r\n255,119,127,Salmon,,,,,,1,,,,,\r\n255,158,141,Blush,,,,,,1,1,,,,\r\n255,181,190,Flamingo,,,,,,1,,,,,\r\n252,198,184,Peach,,,,,,1,,,1,,\r\n245,192,213,Light Pink,,,,,,1,,,,,\r\n225,109,157,Bubblegum,,,,,,1,,,1,,\r\n230,87,148,Pink,,,,,,1,,,,,\r\n243,70,118,Magenta,,,,,,1,,,,,\r\n196,58,68,Red,,,,,,1,1,,1,,\r\n173,51,69,Cherry,,,,,,1,,,,,\r\n173,60,108,Raspberry,,,,,,1,1,,,,\r\n178,95,170,Plum,,,,,,1,1,,,,\r\n180,166,211,Lavender,,,,,,1,,,,,\r\n149,130,187,Pastel Lavender,,,,,,1,1,,1,,\r\n111,84,147,Purple,,,,,,1,1,,1,,\r\n135,167,225,Blueberry Cr\xE8me,,,,,,1,,,,,\r\n108,136,191,Periwinkle,,,,,,1,,,,,\r\n180,217,223,Robin's Egg,,,,,,1,,,,,\r\n99,169,214,Pastel Blue,,,,,,1,,,,,\r\n39,138,203,Light Blue,,,,,,1,1,,1,,\r\n0,102,179,Cobalt,,,,,,1,,,,,\r\n43,48,124,Dark Blue,,,,,,1,1,,1,,\r\n22,40,70,Midnight,,,,,,1,,,,,\r\n176,232,213,Toothpaste,,,,,,1,1,,1,,\r\n0,143,204,Turquoise,,,,,,1,1,,1,,\r\n56,199,175,Light Green,,,,,,1,,,,,\r\n0,150,138,Parrot Green,,,,,,1,1,,,,\r\n115,213,148,Pastel Green,,,,,,1,1,,,,\r\n119,202,74,Kiwi Lime,,,,,,1,1,,1,,\r\n84,177,96,Bright Green,,,,,,1,,,1,,\r\n0,150,84,Shamrock,,,,,,1,,,,,\r\n16,131,85,Dark Green,,,,,,1,1,,1,,\r\n203,215,53,Prickly Pear,,,,,,1,,,,,\r\n60,97,79,Evergreen,,,,,,1,,,,,\r\n247,209,0,Yellow,,,,,,,,,,1,\r\n255,147,0,Orange,,,,,,,,,,1,\r\n250,217,138,Cream,,,,,,,,,,1,\r\n238,0,4,Red,,,,,,,,,,1,\r\n161,171,172,Gray,,,,,,,,,,1,\r\n0,63,44,Dark Green,,,,,,,,,,1,\r\n2,18,153,Blue,,,,,,,,,,1,\r\n116,38,160,Purple,,,,,,,,,,1,\r\n0,111,223,Light Blue,,,,,,,,,,1,\r\n80,50,22,Brown,,,,,,,,,,1,\r\n80,171,110,Light Green,,,,,,,,,,1,\r\n243,0,118,Pink,,,,,,,,,,1,\r\n0,0,0,Black,,,,,,,,,,1,\r\n255,255,255,White,,,,,,,,,,1,\r\n0,0,0,Black,,,,,,,,,,,1\r\n1,78,218,Blue,,,,,,,,,,,1\r\n1,0,78,Dark Blue,,,,,,,,,,,1\r\n0,196,249,Light Blue,,,,,,,,,,,1\r\n0,40,39,Forest Green,,,,,,,,,,,1\r\n1,195,81,Green,,,,,,,,,,,1\r\n157,212,0,Light Green,,,,,,,,,,,1\r\n248,235,193,Peach,,,,,,,,,,,1\r\n239,240,244,White,,,,,,,,,,,1\r\n126,101,221,Purple,,,,,,,,,,,1\r\n116,0,160,Royal Purple,,,,,,,,,,,1\r\n170,91,0,Leather,,,,,,,,,,,1\r\n161,102,0,Brown,,,,,,,,,,,1\r\n155,158,151,Gray,,,,,,,,,,,1\r\n252,218,0,Yellow,,,,,,,,,,,1\r\n254,230,0,Light Yellow,,,,,,,,,,,1\r\n251,197,62,Light Orange,,,,,,,,,,,1\r\n255,176,224,Pink,,,,,,,,,,,1\r\n241,0,109,Deep Pink,,,,,,,,,,,1\r\n255,151,0,Orange,,,,,,,,,,,1\r\n149,0,2,Burgundy,,,,,,,,,,,1\r\n240,12,1,Red,,,,,,,,,,,1";
    }
  });

  // data/color/dmc.txt
  var require_dmc = __commonJS({
    "data/color/dmc.txt"(exports, module) {
      module.exports = "FFE2E2.3713.Salmon Very Light\r\nFFC9C9.761.Salmon Light\r\nF5ADAD.760.Salmon\r\nF18787.3712.Salmon Medium\r\nE36D6D.3328.Salmon Dark\r\nBF2D2D.347.Salmon Very Dark\r\nFED7CC.353.Peach\r\nFD9C97.352.Coral Light\r\nE96A67.351.Coral\r\nE04848.350.Coral Medium\r\nD21035.349.Coral Dark\r\nBB051F.817.Coral Red Very Dark\r\nFFCBD5.3708.Melon Light\r\nFFADBC.3706.Melon Medium\r\nFF7992.3705.Melon Dark\r\nE74967.3801.Melon Very Dark\r\nE31D42.666.Bright Red\r\nC72B3B.321.Red\r\nB71F33.304.Red Medium\r\nA7132B.498.Red Dark\r\n970B23.816.Garnet\r\n87071F.815.Garnet Medium\r\n7B001B.814.Garnet Dark\r\nFFB2BB.894.Carnation Very Light\r\nFC90A2.893.Carnation Light\r\nFF798C.892.Carnation Medium\r\nFF5773.891.Carnation Dark\r\nFFDFD9.818.Baby Pink\r\nFDB5B5.957.Geranium Pale\r\nFF9191.956.Geranium\r\n564A4A.309.Rose Dark\r\nFFD7D7.963.Dusty Rose Ultra Very Light\r\nFFBDBD.3716.Dusty Rose Medium Very Light\r\nE68A8A.962.Dusty Rose Medium\r\nCF7373.961.Dusty Rose Dark\r\nEA8699.3833.Raspberry Light\r\nDB556E.3832.Raspberry Medium\r\nB32F48.3831.Raspberry Dark\r\n913546.777.Raspberry Very Dark\r\nFFEEEB.819.Baby Pink Light\r\nFBADB4.3326.Rose Light\r\nFCB0B9.776.Pink Medium\r\nF27688.899.Rose Medium\r\nEE546E.335.Rose\r\nB33B4B.326.Rose Very Dark\r\nF0CED4.151.Dusty Rose Very Light\r\nE4A6AC.3354.Dusty Rose Light\r\nE8879B.3733.Dusty Rose\r\nDA6783.3731.Dusty Rose Very Dark\r\nBC4365.3350.Dusty Rose Ultra Dark\r\nAB0249.150.Dusty Rose Ultra Very Dark\r\nFBBFC2.3689.Mauve Light\r\nE7A9AC.3688.Mauve Medium\r\nC96B70.3687.Mauve\r\nAB3357.3803.Mauve Dark\r\n881531.3685.Mauve Very Dark\r\nFFC0CD.605.Cranberry Very Light\r\nFFB0BE.604.Cranberry Light\r\nFFA4BE.603.Cranberry\r\nE24874.602.Cranberry Medium\r\nD1286A.601.Cranberry Dark\r\nCD2F63.600.Cranberry Very Dark\r\nFF8CAE.3806.Cyclamen Pink Light\r\nF3478B.3805.Cyclamen Pink\r\nE02876.3804.Cyclamen Pink Dark\r\nF4AED5.3609.Plum Ultra Light\r\nEA9CC4.3608.Plum Very Light\r\nC54989.3607.Plum Light\r\n9C2462.718.Plum\r\n9B1359.917.Plum Medium\r\n820043.915.Plum Dark\r\nFFDFD5.225.Shell Pink Ultra Very Light\r\nEBB7AF.224.Shell Pink Very Light\r\nE2A099.152.Shell Pink Medium Light\r\nCC847C.223.Shell Pink Light\r\nBC6C64.3722.Shell Pink Medium\r\nA14B51.3721.Shell Pink Dark\r\n883E43.221.Shell Pink Very Dark\r\nDFB3BB.778.Antique Mauve Very Light\r\nDBA9B2.3727.Antique Mauve Light\r\nB7737F.316.Antique Mauve Medium\r\n9B5B66.3726.Antique Mauve Dark\r\n814952.315.Antique Mauve Medium Dark\r\n714149.3802.Antique Mauve Very Darkv\r\n822637.902.Garnet Very Dark\r\nD7CBD3.3743.Antique Violet Very Light\r\nB79DA7.3042.Antique Violet Light\r\n956F7C.3041.Antique Violet Medium\r\n785762.3740.Antique Violet Dark\r\nBA91AA.3836.Grape Light\r\n946083.3835.Grape Medium\r\n72375D.3834.Grape Dark\r\n572433.154.Grape Very Dark\r\nE3CBE3.211.Lavender Light\r\nC39FC3.210.Lavender Medium\r\nA37BA7.209.Lavender Dark\r\n835B8B.208.Lavender Very Dark\r\n6C3A6E.3837.Lavender Ultra Dark\r\n633666.327.Violet Dark\r\nE6CCD9.153.Violet Very Light\r\nDBB3CB.554.Violet Light\r\nA3638B.553.Violet\r\n803A6B.552.Violet Medium\r\n5C184E.550.Violet Very Dark\r\nD3D7ED.3747.Blue Violet Very Light\r\nB7BFDD.341.Blue Violet Light\r\nA3AED1.156.Blue Violet Medium Light\r\nADA7C7.340.Blue Violet Medium\r\n9891B6.155.Blue Violet Medium Dark\r\n776B98.3746.Blue Violet Dark\r\n5C5478.333.Blue Violet Very Dark\r\nBBC3D9.157.Cornflower Blue Very Light\r\n8F9CC1.794.Cornflower Blue Light\r\n707DA2.793.Cornflower Blue Medium\r\n60678C.3807.Cornflower Blue\r\n555B7B.792.Cornflower Blue Dark\r\n4C526E.158.Cornflower Blue Very Dark\r\n464563.791.Cornflower Blue Very Dark\r\nB0C0DA.3840.Lavender Blue Light\r\n7B8EAB.3839.Lavender Blue Medium\r\n5C7294.3838.Lavender Blue Dark\r\nC0CCDE.800.Delft Blue Pale\r\n94A8C6.809.Delft Blue\r\n748EB6.799.Delft Blue Medium\r\n466A8E.798.Delft Blue Dark\r\n13477D.797.Royal Blue\r\n11416D.796.Royal Blue Dark\r\n0E365C.820.Royal Blue Very Dark\r\nDBECF5.162.Blue Ultra Very Light\r\nBDDDED.827.Blue Very Light\r\nA1C2D7.813.Blue Light\r\n6B9EBF.826.Blue Medium\r\n4781A5.825.Blue Dark\r\n396987.824.Blue Very Dark\r\n30C2EC.996.Electric Blue Medium\r\n14AAD0.3843.Electric Blue\r\n2696B6.995.Electric Blue Dark\r\n06E3E6.3846.Turquoise Bright Light\r\n04C4CA.3845.Turquoise Bright Medium\r\n12AEBA.3844.Turquoise Bright Dark\r\nC7CAD7.159.Blue Gray Light\r\n999FB7.160.Blue Gray Medium\r\n7880A4.161.Blue Gray\r\nEEFCFC.3756.Baby Blue Ultra Very Light\r\nD9EBF1.775.Baby Blue Very Light\r\nCDDFED.3841.Baby Blue Pale\r\nB8D2E6.3325.Baby Blue Light\r\n93B4CE.3755.Baby Blue\r\n739FC1.334.Baby Blue Medium\r\n5A8FB8.322.Baby Blue Dark\r\n35668B.312.Baby Blue Very Dark\r\n2C597C.803.Baby Blue Ultra Very Dark\r\n253B73.336.Navy Blue\r\n213063.823.Navy Blue Dark\r\n1B2853.939.Navy Blue Very Dark\r\nDBE2E9.3753.Antique Blue Ultra Very Light\r\nC7D1DB.3752.Antique Blue Very Light\r\nA2B5C6.932.Antique Blue Light\r\n6A859E.931.Antique Blue Medium\r\n455C71.930.Antique Blue Dark\r\n384C5E.3750.Antique Blue Very Dark\r\nC5E8ED.828.Sky Blue Very Light\r\nACD8E2.3761.Sky Blue Light\r\n7EB1C8.519.Sky Blue\r\n4F93A7.518.Wedgewood Light\r\n3E85A2.3760.Wedgewood Medium\r\n3B768F.517.Wedgewood Dark\r\n32667C.3842.Wedgewood Very Dark\r\n1C5066.311.Wedgewood Ultra Very Dark\r\nE5FCFD.747.Peacock Blue Very Light\r\n99CFD9.3766.Peacock Blue Light\r\n64ABBA.807.Peacock Blue\r\n3D95A5.806.Peacock Blue Dark\r\n347F8C.3765.Peacock Blue Very Dark\r\nBCE3E6.3811.Turquoise Very Light\r\n90C3CC.598.Turquoise Light\r\n5BA3B3.597.Turquoise\r\n488E9A.3810.Turquoise Dark\r\n3F7C85.3809.Turquoise Vy Dark\r\n366970.3808.Turquoise Ultra Very Dark\r\nDDE3E3.928.Gray Green Very Light\r\nBDCBCB.927.Gray Green Light\r\n98AEAE.926.Gray Green Medium\r\n657F7F.3768.Gray Green Dark\r\n566A6A.924.Gray Green Vy Dark\r\n52B3A4.3849.Teal Green Light\r\n559392.3848.Teal Green Medium\r\n347D75.3847.Teal Green Dark\r\nA9E2D8.964.Sea Green Light\r\n59C7B4.959.Sea Green Medium\r\n3EB6A1.958.Sea Green Dark\r\n2F8C84.3812.Sea Green Very Dark\r\n49B3A1.3851.Green Bright Light\r\n3D9384.943.Green Bright Medium\r\n378477.3850.Green Bright Dark\r\n90C0B4.993.Aquamarine Very Light\r\n6FAE9F.992.Aquamarine Light\r\n508B7D.3814.Aquamarine\r\n477B6E.991.Aquamarine Dark\r\nB9D7C0.966.Jade Ultra Very Light\r\nA7CDAF.564.Jade Very Light\r\n8FC098.563.Jade Light\r\n53976A.562.Jade Medium\r\n338362.505.Jade Green\r\n99C3AA.3817.Celadon Green Light\r\n65A57D.3816.Celadon Green\r\n4D8361.163.Celadon Green Medium\r\n477759.3815.Celadon Green Dark\r\n2C6A45.561.Celadon Green VD\r\nC4DECC.504.Blue Green Very Light\r\nB2D4BD.3813.Blue Green Light\r\n7BAC94.503.Blue Green Medium\r\n5B9071.502.Blue Green\r\n396F52.501.Blue Green Dark\r\n044D33.500.Blue Green Very Dark\r\nA2D6AD.955.Nile Green Light\r\n88BA91.954.Nile Green\r\n6DAB77.913.Nile Green Medium\r\n1B9D6B.912.Emerald Green Light\r\n189065.911.Emerald Green Medium\r\n187E56.910.Emerald Green Dark\r\n156F49.909.Emerald Green Very Dark\r\n115A3B.3818.Emerald Green Ultra Very Dark\r\nD7EDCC.369.Pistachio Green Very Light\r\nA6C298.368.Pistachio Green Light\r\n69885A.320.Pistachio Green Medium\r\n617A52.367.Pistachio Green Dark\r\n205F2E.319.Pistachio Grn Very Dark\r\n174923.890.Pistachio Grn Ultra Very Dark\r\nC8D8B8.164.Forest Green Light\r\n8DA675.989.Forest Green\r\n738B5B.988.Forest Green Medium\r\n587141.987.Forest Green Dark\r\n405230.986.Forest Green Very Dark\r\nE4ECD4.772.Yellow Green Very Light\r\nCCD9B1.3348.Yellow Green Light\r\n71935C.3347.Yellow Green Medium\r\n406A3A.3346.Hunter Green\r\n1B5915.3345.Hunter Green Dark\r\n1B5300.895.Hunter Green Very Dark\r\n9ECF34.704.Chartreuse Bright\r\n7BB547.703.Chartreuse\r\n47A72F.702.Kelly Green\r\n3F8F29.701.Green Light\r\n07731B.700.Green Bright\r\n056517.699.Green\r\nC7E666.907.Parrot Green Light\r\n7FB335.906.Parrot Green Medium\r\n628A28.905.Parrot Green Dark\r\n557822.904.Parrot Green Very Dark\r\nD8E498.472.Avocado Green Ultra Light\r\nAEBF79.471.Avocado Grn Very Light\r\n94AB4F.470.Avocado Grn Light\r\n72843C.469.Avocado Green\r\n627133.937.Avocado Green Medium\r\n4C5826.936.Avocado Green Very Dark\r\n424D21.935.Avocado Green Dark\r\n313919.934.Avocado Grn Black\r\nABB197.523.Fern Green Light\r\n9CA482.3053.Green Gray\r\n889268.3052.Green Gray Medium\r\n5F6648.3051.Green Gray Dark\r\nC4CDAC.524.Fern Green Very Light\r\n969E7E.522.Fern Green\r\n666D4F.520.Fern Green Dark\r\n83975F.3364.Pine Green\r\n728256.3363.Pine Green Medium\r\n5E6B47.3362.Pine Green Dark\r\nEFF4A4.165.Moss Green Very Light\r\nE0E868.3819.Moss Green Light\r\nC0C840.166.Moss Green Medium Light\r\nA7AE38.581.Moss Green\r\n888D33.580.Moss Green Dark\r\nC7C077.734.Olive Green Light\r\nBCB34C.733.Olive Green Medium\r\n948C36.732.Olive Green\r\n938B37.731.Olive Green Dark\r\n827B30.730.Olive Green Very Dark\r\nB9B982.3013.Khaki Green Light\r\nA6A75D.3012.Khaki Green Medium\r\n898A58.3011.Khaki Green Dark\r\nCCB784.372.Mustard Light\r\nBFA671.371.Mustard\r\nB89D64.370.Mustard Medium\r\nDBBE7F.834.Golden Olive Very Light\r\nC8AB6C.833.Golden Olive Light\r\nBD9B51.832.Golden Olive\r\nAA8F56.831.Golden Olive Medium\r\n8D784B.830.Golden Olive Dark\r\n7E6B42.829.Golden Olive Very Dark\r\nDCC4AA.613.Drab Brown Very Light\r\nBC9A78.612.Drab Brown Light\r\n967656.611.Drab Brown\r\n796047.610.Drab Brown Dark\r\nE7D6C1.3047.Yellow Beige Light\r\nD8BC9A.3046.Yellow Beige Medium\r\nBC966A.3045.Yellow Beige Dark\r\nA77C49.167.Yellow Beige Very Dark\r\nFCFCEE.746.Off White\r\nF5ECCB.677.Old Gold Very Light\r\nC69F7B.422.Hazelnut Brown Light\r\nB78B61.3828.Hazelnut Brown\r\nA07042.420.Hazelnut Brown Dark\r\n835E39.869.Hazelnut Brown Very Dark\r\nE4B468.728.Topaz\r\nCE9124.783.Topaz Medium\r\nAE7720.782.Topaz Dark\r\nA26D20.781.Topaz Very Dark\r\n94631A.780.Topaz Ultra Very Dark\r\nE5CE97.676.Old Gold Light\r\nD0A53E.729.Old Gold Medium\r\nBC8D0E.680.Old Gold Dark\r\nA98204.3829.Old Gold Vy Dark\r\nF6DC98.3822.Straw Light\r\nF3CE75.3821.Straw\r\nDFB65F.3820.Straw Dark\r\nCD9D37.3852.Straw Very Dark\r\nFFFB8B.445.Lemon Light\r\nFDED54.307.Lemon\r\nFFE300.973.Canary Bright\r\nFFD600.444.Lemon Dark\r\nFDF9CD.3078.Golden Yellow Very Light\r\nFFF1AF.727.Topaz Very Light\r\nFDD755.726.Topaz Light\r\nFFC840.725.Topaz Medium Light\r\nFFB515.972.Canary Deep\r\nFFE9AD.745.Yellow Pale Light\r\nFFE793.744.Yellow Pale\r\nFED376.743.Yellow Medium\r\nFFBF57.742.Tangerine Light\r\nFFA32B.741.Tangerine Medium\r\nFF8B00.740.Tangerine\r\nF78B13.970.Pumpkin Light\r\nF67F00.971.Pumpkin\r\nFF7B4D.947.Burnt Orange\r\nEB6307.946.Burnt Orange Medium\r\nD15807.900.Burnt Orange Dark\r\nFFDED5.967.Apricot Very Light\r\nFECDC2.3824.Apricot Light\r\nFCAB98.3341.Apricot\r\nFF836F.3340.Apricot Medium\r\nFD5D35.608.Burnt Orange Bright\r\nFA3203.606.Orange Red Bright\r\nFFE2CF.951.Tawny Light\r\nFFD3B5.3856.Mahogany Ultra Very Light\r\nF7976F.722.Orange Spice Light\r\nF27842.721.Orange Spice Medium\r\nE55C1F.720.Orange Spice Dark\r\nFDBD96.3825.Pumpkin Pale\r\nE27323.922.Copper Light\r\nC66218.921.Copper\r\nAC5414.920.Copper Medium\r\nA64510.919.Red Copper\r\n82340A.918.Red Copper Dark\r\nFFEEE3.3770.Tawny Vy Light\r\nFBD5BB.945.Tawny\r\nF7A777.402.Mahogany Very Light\r\nCF7939.3776.Mahogany Light\r\nB35F2B.301.Mahogany Medium\r\n8F430F.400.Mahogany Dark\r\n6F2F00.300.Mahogany Very Dark\r\nFFFDE3.3823.Yellow Ultra Pale\r\nFAD396.3855.Autumn Gold Light\r\nF2AF68.3854.Autumn Gold Medium\r\nF29746.3853.Autumn Gold Dark\r\nF7BB77.3827.Golden Brown Pale\r\nDC9C56.977.Golden Brown Light\r\nC28142.976.Golden Brown Medium\r\nAD7239.3826.Golden Brown\r\n914F12.975.Golden Brown Dark\r\nFEE7DA.948.Peach Very Light\r\nF7CBBF.754.Peach Light\r\nF4BBA9.3771.Terra Cotta Ultra Very Light\r\nEEAA9B.758.Terra Cotta Very Light\r\nD98978.3778.Terra Cotta Light\r\nC56A5B.356.Terra Cotta Medium\r\nB95544.3830.Terra Cotta\r\n984436.355.Terra Cotta Dark\r\n863022.3777.Terra Cotta Very Dark\r\nF8CAC8.3779.Rosewood Ultra Very Light\r\nBA8B7C.3859.Rosewood Light\r\n964A3F.3858.Rosewood Medium\r\n68251A.3857.Rosewood Dark\r\nF3E1D7.3774.Desert Sand Very Light\r\nEED3C4.950.Desert Sand Light\r\nC48E70.3064.Desert Sand\r\nBB8161.407.Desert Sand Medium\r\nB67552.3773.Desert Sand Dark\r\nA06C50.3772.Desert Sand Very Dark\r\n875539.632.Desert Sand Ultra Very Dark\r\nD7CECB.453.Shell Gray Light\r\nC0B3AE.452.Shell Gray Medium\r\n917B73.451.Shell Gray Dark\r\nA68881.3861.Cocoa Light\r\n7D5D57.3860.Cocoa\r\n624B45.779.Cocoa Dark\r\nFFFBEF.712.Cream\r\nF8E4C8.739.Tan Ultra Very Light\r\nECCC9E.738.Tan Very Light\r\nE4BB8E.437.Tan Light\r\nCB9051.436.Tan\r\nB87748.435.Brown Very Light\r\n985E33.434.Brown Light\r\n7A451F.433.Brown Medium\r\n653919.801.Coffee Brown Dark\r\n492A13.898.Coffee Brown Very Dark\r\n361F0E.938.Coffee Brown Ultra Dark\r\n1E1108.3371.Black Brown\r\nF2E3CE.543.Beige Brown Ultra Very Light\r\nCBB69C.3864.Mocha Beige Light\r\nA4835C.3863.Mocha Beige Medium\r\n8A6E4E.3862.Mocha Beige Dark\r\n4B3C2A.3031.Mocha Brown Very Dark\r\nFFFFFF.B5200.Snow White\r\nFCFBF8.Blanc.White\r\nF9F7F1.3865.Winter White\r\nF0EADA.Ecru.Ecru\r\nE7E2D3.822.Beige Gray Light\r\nDDD8CB.644.Beige Gray Medium\r\nA49878.642.Beige Gray Dark\r\n857B61.640.Beige Gray Very Dark\r\n625D50.3787.Brown Gray Dark\r\n4F4B41.3021.Brown Gray Very Dark\r\nEBEAE7.3024.Brown Gray Very Light\r\nB1AA97.3023.Brown Gray Light\r\n8E9078.3022.Brown Gray Medium\r\n636458.535.Ash Gray Very Light\r\nE3D8CC.3033.Mocha Brown Very Light\r\nD2BCA6.3782.Mocha Brown Light\r\nB39F8B.3032.Mocha Brown Medium\r\n7F6A55.3790.Beige Gray Ultra Dark\r\n6B5743.3781.Mocha Brown Dark\r\nFAF6F0.3866.Mocha Brown Ultra Very Light\r\nD1BAA1.842.Beige Brown Very Light\r\nB69B7E.841.Beige Brown Light\r\n9A7C5C.840.Beige Brown Medium\r\n675541.839.Beige Brown Dark\r\n594937.838.Beige Brown Very Dark\r\nE6E8E8.3072.Beaver Gray Very Light\r\nBCB4AC.648.Beaver Gray Light\r\nB0A69C.647.Beaver Gray Medium\r\n877D73.646.Beaver Gray Dark\r\n6E655C.645.Beaver Gray Very Dark\r\n484848.844.Beaver Gray Ultra Dark\r\nECECEC.762.Pearl Gray Very Light\r\nD3D3D6.415.Pearl Gray\r\nABABAB.318.Steel Gray Light\r\n8C8C8C.414.Steel Gray Dark\r\nD1D1D1.168.Pewter Very Light\r\n848484.169.Pewter Light\r\n6C6C6C.317.Pewter Gray\r\n565656.413.Pewter Gray Dark\r\n424242.3799.Pewter Gray Very Dark\r\n000000.310.Black\r\nE3E3E6.1.White Tin\r\nD7D7D8.2.Tin\r\nB8B8BB.3.Tin Medium\r\nAEAEB1.4.Tin Dark\r\nE3CCBE.5.Driftwood Light\r\nDCC6B8.6.Driftwood Medium Light\r\n8F7B6E.7.Driftwood\r\n6A5046.8.Driftwood Dark\r\n55200E.9.Cocoa Very Dark\r\nEDFED9.10.Tender Green Very Light\r\nE2EDB5.11.Tender Green Light\r\nCDD99A.12.Tender Green\r\nBFF6E0.13.Nile Green Medium Light\r\nD0FBB2.14.Apple Green Pale\r\nD1EDA4.15.Apple Green\r\nC9C258.16.Chartreuse Light\r\nE5E272.17.Yellow Plum Light\r\nD9D56D.18.Yellow Plum\r\nF7C95F.19.Autumn Gold medium Light\r\nF7AF93.20.Shrimp\r\nD79982.21.Alizarin Light\r\nBC604E.22.Alizarin\r\nEDE2ED.23.Apple Blossom\r\nE0D7EE.24.White Lavender\r\nDAD2E9.25.Lavender Ultra Light\r\nD7CAE6.26.Lavender Pale\r\nF0EEF9.27.White Violet\r\n9086A9.28.Eggplant Medium Light\r\n674076.29.Eggplant\r\n7D77A5.30.Blueberry Medium Light\r\n50518D.31.Blueberry\r\n4D2E8A.32.Blueberry Dark\r\n9C599E.33.Fuschia\r\n7D3064.34.Fuschia Dark\r\n46052D.35.Fuschia Very Dark";
    }
  });

  // data/color/lego.txt
  var require_lego = __commonJS({
    "data/color/lego.txt"(exports, module) {
      module.exports = "FFFFFF.1.White\r\nDDDEDD.2.Grey\r\nD9BB7B.5.Brick Yellow\r\nD67240.18.Nougat\r\nFF0000.21.Bright Red\r\n0000FF.23.Bright Blue\r\nFFFF00.24.Bright Yellow\r\n000000.26.Black\r\n009900.28.Dark Green\r\n00CC00.37.Bright Green\r\nA83D15.38.Dark Orange\r\n478CC6.102.Medium Blue\r\nFF6600.106.Bright Orange\r\n059D9E.107.Bright Bluish Green\r\n95B90B.119.Bright Yellowish-Green\r\n990066.124.Bright Reddish Violet\r\n5E748C.135.Sand Blue\r\n8D7452.138.Sand Yellow\r\n002541.140.Earth Blue\r\n003300.141.Earth Green\r\n5F8265.151.Sand Green\r\n80081B.154.Dark Red\r\nF49B00.191.Flame Yellowish Orange\r\n5B1C0C.192.Reddish Brown\r\n9C9291.194.Medium Stone Grey\r\n4C5156.199.Dark Stone Grey\r\nE4E4DA.208.Light Stone Grey\r\n87C0EA.212.Light Royal Blue\r\nDE378B.221.Bright Purple\r\nEE9DC3.222.Light Purple\r\nFFFF99.226.Cool Yellow\r\n2C1577.268.Dark Purple\r\nF5C189.283.Light Nougat\r\n300F06.308.Dark Brown\r\nAA7D55.312.Medium Nougat\r\n469BC3.321.Dark Azure\r\n68C3E2.322.Medium Azure\r\nD3F2EA.323.Aqua\r\nA06EB9.324.Medium Lavender\r\nCDA4DE.325.Lavender\r\nF5F3D7.329.White Glow\r\nE2F99A.326.Spring Yellowish Green\r\n77774E.330.Olive Green\r\n96B93B.331.Medium-Yellowish Green";
    }
  });

  // node_modules/color-diff/lib/diff.js
  var require_diff = __commonJS({
    "node_modules/color-diff/lib/diff.js"(exports) {
      exports.ciede2000 = ciede2000;
      var sqrt = Math.sqrt;
      var pow = Math.pow;
      var cos = Math.cos;
      var atan2 = Math.atan2;
      var sin = Math.sin;
      var abs = Math.abs;
      var exp = Math.exp;
      var PI = Math.PI;
      function ciede2000(c1, c22) {
        var L1 = c1.L;
        var a1 = c1.a;
        var b1 = c1.b;
        var L2 = c22.L;
        var a22 = c22.a;
        var b22 = c22.b;
        var kL = 1;
        var kC = 1;
        var kH = 1;
        var C1 = sqrt(pow(a1, 2) + pow(b1, 2));
        var C2 = sqrt(pow(a22, 2) + pow(b22, 2));
        var a_C1_C2 = (C1 + C2) / 2;
        var G = 0.5 * (1 - sqrt(pow(a_C1_C2, 7) / (pow(a_C1_C2, 7) + pow(25, 7))));
        var a1p = (1 + G) * a1;
        var a2p = (1 + G) * a22;
        var C1p = sqrt(pow(a1p, 2) + pow(b1, 2));
        var C2p = sqrt(pow(a2p, 2) + pow(b22, 2));
        var h1p = hp_f(b1, a1p);
        var h2p = hp_f(b22, a2p);
        var dLp = L2 - L1;
        var dCp = C2p - C1p;
        var dhp = dhp_f(C1, C2, h1p, h2p);
        var dHp = 2 * sqrt(C1p * C2p) * sin(radians(dhp) / 2);
        var a_L = (L1 + L2) / 2;
        var a_Cp = (C1p + C2p) / 2;
        var a_hp = a_hp_f(C1, C2, h1p, h2p);
        var T2 = 1 - 0.17 * cos(radians(a_hp - 30)) + 0.24 * cos(radians(2 * a_hp)) + 0.32 * cos(radians(3 * a_hp + 6)) - 0.2 * cos(radians(4 * a_hp - 63));
        var d_ro = 30 * exp(-pow((a_hp - 275) / 25, 2));
        var RC = sqrt(pow(a_Cp, 7) / (pow(a_Cp, 7) + pow(25, 7)));
        var SL = 1 + 0.015 * pow(a_L - 50, 2) / sqrt(20 + pow(a_L - 50, 2));
        var SC = 1 + 0.045 * a_Cp;
        var SH = 1 + 0.015 * a_Cp * T2;
        var RT = -2 * RC * sin(radians(2 * d_ro));
        var dE = sqrt(pow(dLp / (SL * kL), 2) + pow(dCp / (SC * kC), 2) + pow(dHp / (SH * kH), 2) + RT * (dCp / (SC * kC)) * (dHp / (SH * kH)));
        return dE;
      }
      function degrees(n2) {
        return n2 * (180 / PI);
      }
      function radians(n2) {
        return n2 * (PI / 180);
      }
      function hp_f(x3, y3) {
        if (x3 === 0 && y3 === 0) return 0;
        else {
          var tmphp = degrees(atan2(x3, y3));
          if (tmphp >= 0) return tmphp;
          else return tmphp + 360;
        }
      }
      function dhp_f(C1, C2, h1p, h2p) {
        if (C1 * C2 === 0) return 0;
        else if (abs(h2p - h1p) <= 180) return h2p - h1p;
        else if (h2p - h1p > 180) return h2p - h1p - 360;
        else if (h2p - h1p < -180) return h2p - h1p + 360;
        else throw new Error();
      }
      function a_hp_f(C1, C2, h1p, h2p) {
        if (C1 * C2 === 0) return h1p + h2p;
        else if (abs(h1p - h2p) <= 180) return (h1p + h2p) / 2;
        else if (abs(h1p - h2p) > 180 && h1p + h2p < 360) return (h1p + h2p + 360) / 2;
        else if (abs(h1p - h2p) > 180 && h1p + h2p >= 360) return (h1p + h2p - 360) / 2;
        else throw new Error();
      }
    }
  });

  // node_modules/color-diff/lib/convert.js
  var require_convert = __commonJS({
    "node_modules/color-diff/lib/convert.js"(exports) {
      exports.rgb_to_lab = rgb_to_lab;
      exports.rgba_to_lab = rgba_to_lab;
      exports.normalize_rgb = normalize_rgb;
      var pow = Math.pow;
      function rgba_to_lab(c3, bc) {
        c3 = normalize_rgb(c3);
        var bc = typeof bc !== "undefined" ? normalize_rgb(bc) : { R: 255, G: 255, B: 255 };
        var new_c = {
          R: bc.R + (c3.R - bc.R) * c3.A,
          G: bc.G + (c3.G - bc.G) * c3.A,
          B: bc.B + (c3.B - bc.B) * c3.A
        };
        return rgb_to_lab(new_c);
      }
      function rgb_to_lab(c3) {
        return xyz_to_lab(rgb_to_xyz(c3));
      }
      function rgb_to_xyz(c3) {
        c3 = normalize_rgb(c3);
        var R = c3.R / 255;
        var G = c3.G / 255;
        var B = c3.B / 255;
        if (R > 0.04045) R = pow((R + 0.055) / 1.055, 2.4);
        else R = R / 12.92;
        if (G > 0.04045) G = pow((G + 0.055) / 1.055, 2.4);
        else G = G / 12.92;
        if (B > 0.04045) B = pow((B + 0.055) / 1.055, 2.4);
        else B = B / 12.92;
        R *= 100;
        G *= 100;
        B *= 100;
        var X = R * 0.4124 + G * 0.3576 + B * 0.1805;
        var Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
        var Z = R * 0.0193 + G * 0.1192 + B * 0.9505;
        return { "X": X, "Y": Y, "Z": Z };
      }
      function xyz_to_lab(c3) {
        var ref_Y = 100;
        var ref_Z = 108.883;
        var ref_X = 95.047;
        var Y = c3.Y / ref_Y;
        var Z = c3.Z / ref_Z;
        var X = c3.X / ref_X;
        if (X > 8856e-6) X = pow(X, 1 / 3);
        else X = 7.787 * X + 16 / 116;
        if (Y > 8856e-6) Y = pow(Y, 1 / 3);
        else Y = 7.787 * Y + 16 / 116;
        if (Z > 8856e-6) Z = pow(Z, 1 / 3);
        else Z = 7.787 * Z + 16 / 116;
        var L2 = 116 * Y - 16;
        var a3 = 500 * (X - Y);
        var b3 = 200 * (Y - Z);
        return { "L": L2, "a": a3, "b": b3 };
      }
      function normalize_rgb(c3) {
        var new_c = {
          R: c3.R || c3.r || 0,
          G: c3.G || c3.g || 0,
          B: c3.B || c3.b || 0
        };
        if (typeof c3.a !== "undefined" || typeof c3.A !== "undefined") {
          new_c.A = c3.A || c3.a || 0;
        }
        return new_c;
      }
    }
  });

  // node_modules/color-diff/lib/palette.js
  var require_palette = __commonJS({
    "node_modules/color-diff/lib/palette.js"(exports) {
      exports.map_palette = map_palette;
      exports.map_palette_lab = map_palette_lab;
      exports.match_palette_lab = match_palette_lab;
      exports.palette_map_key = palette_map_key;
      exports.lab_palette_map_key = lab_palette_map_key;
      var ciede2000 = require_diff().ciede2000;
      var color_convert = require_convert();
      function palette_map_key(c3) {
        c3 = color_convert.normalize_rgb(c3);
        var s3 = "R" + c3.R + "B" + c3.B + "G" + c3.G;
        if ("A" in c3) {
          s3 = s3 + "A" + c3.A;
        }
        return s3;
      }
      function lab_palette_map_key(c3) {
        return "L" + c3.L + "a" + c3.a + "b" + c3.b;
      }
      function map_palette(a3, b3, type, bc) {
        var c3 = {};
        bc = typeof bc !== "undefined" ? bc : { R: 255, G: 255, B: 255 };
        type = type || "closest";
        for (var idx1 = 0; idx1 < a3.length; idx1 += 1) {
          var color1 = a3[idx1];
          var best_color = void 0;
          var best_color_diff = void 0;
          for (var idx2 = 0; idx2 < b3.length; idx2 += 1) {
            var color2 = b3[idx2];
            var current_color_diff = diff3(color1, color2, bc);
            if (best_color == void 0 || type === "closest" && current_color_diff < best_color_diff) {
              best_color = color2;
              best_color_diff = current_color_diff;
              continue;
            }
            if (type === "furthest" && current_color_diff > best_color_diff) {
              best_color = color2;
              best_color_diff = current_color_diff;
              continue;
            }
          }
          c3[palette_map_key(color1)] = best_color;
        }
        return c3;
      }
      function match_palette_lab(target_color, palette, find_furthest) {
        var color2, current_color_diff;
        var best_color = palette[0];
        var best_color_diff = ciede2000(target_color, best_color);
        for (var idx2 = 1, l3 = palette.length; idx2 < l3; idx2 += 1) {
          color2 = palette[idx2];
          current_color_diff = ciede2000(target_color, color2);
          if (!find_furthest && current_color_diff < best_color_diff || find_furthest && current_color_diff > best_color_diff) {
            best_color = color2;
            best_color_diff = current_color_diff;
          }
        }
        return best_color;
      }
      function map_palette_lab(a3, b3, type) {
        var c3 = {};
        var find_furthest = type === "furthest";
        for (var idx1 = 0; idx1 < a3.length; idx1 += 1) {
          var color1 = a3[idx1];
          c3[lab_palette_map_key(color1)] = match_palette_lab(color1, b3, find_furthest);
        }
        return c3;
      }
      function diff3(c1, c22, bc) {
        var conv_c1 = color_convert.rgb_to_lab;
        var conv_c2 = color_convert.rgb_to_lab;
        var rgba_conv = function(x3) {
          return color_convert.rgba_to_lab(x3, bc);
        };
        if ("A" in c1) {
          conv_c1 = rgba_conv;
        }
        if ("A" in c22) {
          conv_c2 = rgba_conv;
        }
        c1 = conv_c1(c1);
        c22 = conv_c2(c22);
        return ciede2000(c1, c22);
      }
    }
  });

  // node_modules/color-diff/lib/index.js
  var require_lib = __commonJS({
    "node_modules/color-diff/lib/index.js"(exports, module) {
      "use strict";
      var diff3 = require_diff();
      var convert = require_convert();
      var palette = require_palette();
      var color = module.exports = {};
      color.diff = diff3.ciede2000;
      color.rgb_to_lab = convert.rgb_to_lab;
      color.rgba_to_lab = convert.rgba_to_lab;
      color.map_palette = palette.map_palette;
      color.palette_map_key = palette.palette_map_key;
      color.map_palette_lab = palette.map_palette_lab;
      color.lab_palette_map_key = palette.lab_palette_map_key;
      color.match_palette_lab = palette.match_palette_lab;
      color.closest = function(target, relative, bc) {
        var key = color.palette_map_key(target);
        bc = typeof bc !== "undefined" ? bc : { R: 255, G: 255, B: 255 };
        var result = color.map_palette([target], relative, "closest", bc);
        return result[key];
      };
      color.furthest = function(target, relative, bc) {
        var key = color.palette_map_key(target);
        bc = typeof bc !== "undefined" ? bc : { R: 255, G: 255, B: 255 };
        var result = color.map_palette([target], relative, "furthest", bc);
        return result[key];
      };
      color.closest_lab = function(target, relative) {
        return color.match_palette_lab(target, relative, false);
      };
      color.furthest_lab = function(target, relative) {
        return color.match_palette_lab(target, relative, true);
      };
    }
  });

  // node_modules/file-saver/dist/FileSaver.min.js
  var require_FileSaver_min = __commonJS({
    "node_modules/file-saver/dist/FileSaver.min.js"(exports, module) {
      (function(a3, b3) {
        if ("function" == typeof define && define.amd) define([], b3);
        else if ("undefined" != typeof exports) b3();
        else {
          b3(), a3.FileSaver = { exports: {} }.exports;
        }
      })(exports, function() {
        "use strict";
        function b3(a4, b4) {
          return "undefined" == typeof b4 ? b4 = { autoBom: false } : "object" != typeof b4 && (console.warn("Deprecated: Expected third argument to be a object"), b4 = { autoBom: !b4 }), b4.autoBom && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(a4.type) ? new Blob(["\uFEFF", a4], { type: a4.type }) : a4;
        }
        function c3(a4, b4, c4) {
          var d4 = new XMLHttpRequest();
          d4.open("GET", a4), d4.responseType = "blob", d4.onload = function() {
            g3(d4.response, b4, c4);
          }, d4.onerror = function() {
            console.error("could not download file");
          }, d4.send();
        }
        function d3(a4) {
          var b4 = new XMLHttpRequest();
          b4.open("HEAD", a4, false);
          try {
            b4.send();
          } catch (a5) {
          }
          return 200 <= b4.status && 299 >= b4.status;
        }
        function e3(a4) {
          try {
            a4.dispatchEvent(new MouseEvent("click"));
          } catch (c4) {
            var b4 = document.createEvent("MouseEvents");
            b4.initMouseEvent("click", true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null), a4.dispatchEvent(b4);
          }
        }
        var f3 = "object" == typeof window && window.window === window ? window : "object" == typeof self && self.self === self ? self : "object" == typeof global && global.global === global ? global : void 0, a3 = f3.navigator && /Macintosh/.test(navigator.userAgent) && /AppleWebKit/.test(navigator.userAgent) && !/Safari/.test(navigator.userAgent), g3 = f3.saveAs || ("object" != typeof window || window !== f3 ? function() {
        } : "download" in HTMLAnchorElement.prototype && !a3 ? function(b4, g4, h3) {
          var i3 = f3.URL || f3.webkitURL, j3 = document.createElement("a");
          g4 = g4 || b4.name || "download", j3.download = g4, j3.rel = "noopener", "string" == typeof b4 ? (j3.href = b4, j3.origin === location.origin ? e3(j3) : d3(j3.href) ? c3(b4, g4, h3) : e3(j3, j3.target = "_blank")) : (j3.href = i3.createObjectURL(b4), setTimeout(function() {
            i3.revokeObjectURL(j3.href);
          }, 4e4), setTimeout(function() {
            e3(j3);
          }, 0));
        } : "msSaveOrOpenBlob" in navigator ? function(f4, g4, h3) {
          if (g4 = g4 || f4.name || "download", "string" != typeof f4) navigator.msSaveOrOpenBlob(b3(f4, h3), g4);
          else if (d3(f4)) c3(f4, g4, h3);
          else {
            var i3 = document.createElement("a");
            i3.href = f4, i3.target = "_blank", setTimeout(function() {
              e3(i3);
            });
          }
        } : function(b4, d4, e4, g4) {
          if (g4 = g4 || open("", "_blank"), g4 && (g4.document.title = g4.document.body.innerText = "downloading..."), "string" == typeof b4) return c3(b4, d4, e4);
          var h3 = "application/octet-stream" === b4.type, i3 = /constructor/i.test(f3.HTMLElement) || f3.safari, j3 = /CriOS\/[\d]+/.test(navigator.userAgent);
          if ((j3 || h3 && i3 || a3) && "undefined" != typeof FileReader) {
            var k3 = new FileReader();
            k3.onloadend = function() {
              var a4 = k3.result;
              a4 = j3 ? a4 : a4.replace(/^data:[^;]*;/, "data:attachment/file;"), g4 ? g4.location.href = a4 : location = a4, g4 = null;
            }, k3.readAsDataURL(b4);
          } else {
            var l3 = f3.URL || f3.webkitURL, m3 = l3.createObjectURL(b4);
            g4 ? g4.location = m3 : location.href = m3, g4 = null, setTimeout(function() {
              l3.revokeObjectURL(m3);
            }, 4e4);
          }
        });
        f3.saveAs = g3.saveAs = g3, "undefined" != typeof module && (module.exports = g3);
      });
    }
  });

  // node_modules/jszip/dist/jszip.min.js
  var require_jszip_min = __commonJS({
    "node_modules/jszip/dist/jszip.min.js"(exports, module) {
      !(function(e3) {
        if ("object" == typeof exports && "undefined" != typeof module) module.exports = e3();
        else if ("function" == typeof define && define.amd) define([], e3);
        else {
          ("undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : this).JSZip = e3();
        }
      })(function() {
        return (function s3(a3, o3, h3) {
          function u3(r3, e4) {
            if (!o3[r3]) {
              if (!a3[r3]) {
                var t3 = "function" == typeof __require && __require;
                if (!e4 && t3) return t3(r3, true);
                if (l3) return l3(r3, true);
                var n2 = new Error("Cannot find module '" + r3 + "'");
                throw n2.code = "MODULE_NOT_FOUND", n2;
              }
              var i3 = o3[r3] = { exports: {} };
              a3[r3][0].call(i3.exports, function(e5) {
                var t4 = a3[r3][1][e5];
                return u3(t4 || e5);
              }, i3, i3.exports, s3, a3, o3, h3);
            }
            return o3[r3].exports;
          }
          for (var l3 = "function" == typeof __require && __require, e3 = 0; e3 < h3.length; e3++) u3(h3[e3]);
          return u3;
        })({ 1: [function(e3, t3, r3) {
          "use strict";
          var d3 = e3("./utils"), c3 = e3("./support"), p3 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
          r3.encode = function(e4) {
            for (var t4, r4, n2, i3, s3, a3, o3, h3 = [], u3 = 0, l3 = e4.length, f3 = l3, c4 = "string" !== d3.getTypeOf(e4); u3 < e4.length; ) f3 = l3 - u3, n2 = c4 ? (t4 = e4[u3++], r4 = u3 < l3 ? e4[u3++] : 0, u3 < l3 ? e4[u3++] : 0) : (t4 = e4.charCodeAt(u3++), r4 = u3 < l3 ? e4.charCodeAt(u3++) : 0, u3 < l3 ? e4.charCodeAt(u3++) : 0), i3 = t4 >> 2, s3 = (3 & t4) << 4 | r4 >> 4, a3 = 1 < f3 ? (15 & r4) << 2 | n2 >> 6 : 64, o3 = 2 < f3 ? 63 & n2 : 64, h3.push(p3.charAt(i3) + p3.charAt(s3) + p3.charAt(a3) + p3.charAt(o3));
            return h3.join("");
          }, r3.decode = function(e4) {
            var t4, r4, n2, i3, s3, a3, o3 = 0, h3 = 0, u3 = "data:";
            if (e4.substr(0, u3.length) === u3) throw new Error("Invalid base64 input, it looks like a data url.");
            var l3, f3 = 3 * (e4 = e4.replace(/[^A-Za-z0-9+/=]/g, "")).length / 4;
            if (e4.charAt(e4.length - 1) === p3.charAt(64) && f3--, e4.charAt(e4.length - 2) === p3.charAt(64) && f3--, f3 % 1 != 0) throw new Error("Invalid base64 input, bad content length.");
            for (l3 = c3.uint8array ? new Uint8Array(0 | f3) : new Array(0 | f3); o3 < e4.length; ) t4 = p3.indexOf(e4.charAt(o3++)) << 2 | (i3 = p3.indexOf(e4.charAt(o3++))) >> 4, r4 = (15 & i3) << 4 | (s3 = p3.indexOf(e4.charAt(o3++))) >> 2, n2 = (3 & s3) << 6 | (a3 = p3.indexOf(e4.charAt(o3++))), l3[h3++] = t4, 64 !== s3 && (l3[h3++] = r4), 64 !== a3 && (l3[h3++] = n2);
            return l3;
          };
        }, { "./support": 30, "./utils": 32 }], 2: [function(e3, t3, r3) {
          "use strict";
          var n2 = e3("./external"), i3 = e3("./stream/DataWorker"), s3 = e3("./stream/Crc32Probe"), a3 = e3("./stream/DataLengthProbe");
          function o3(e4, t4, r4, n3, i4) {
            this.compressedSize = e4, this.uncompressedSize = t4, this.crc32 = r4, this.compression = n3, this.compressedContent = i4;
          }
          o3.prototype = { getContentWorker: function() {
            var e4 = new i3(n2.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new a3("data_length")), t4 = this;
            return e4.on("end", function() {
              if (this.streamInfo.data_length !== t4.uncompressedSize) throw new Error("Bug : uncompressed data size mismatch");
            }), e4;
          }, getCompressedWorker: function() {
            return new i3(n2.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
          } }, o3.createWorkerFrom = function(e4, t4, r4) {
            return e4.pipe(new s3()).pipe(new a3("uncompressedSize")).pipe(t4.compressWorker(r4)).pipe(new a3("compressedSize")).withStreamInfo("compression", t4);
          }, t3.exports = o3;
        }, { "./external": 6, "./stream/Crc32Probe": 25, "./stream/DataLengthProbe": 26, "./stream/DataWorker": 27 }], 3: [function(e3, t3, r3) {
          "use strict";
          var n2 = e3("./stream/GenericWorker");
          r3.STORE = { magic: "\0\0", compressWorker: function() {
            return new n2("STORE compression");
          }, uncompressWorker: function() {
            return new n2("STORE decompression");
          } }, r3.DEFLATE = e3("./flate");
        }, { "./flate": 7, "./stream/GenericWorker": 28 }], 4: [function(e3, t3, r3) {
          "use strict";
          var n2 = e3("./utils");
          var o3 = (function() {
            for (var e4, t4 = [], r4 = 0; r4 < 256; r4++) {
              e4 = r4;
              for (var n3 = 0; n3 < 8; n3++) e4 = 1 & e4 ? 3988292384 ^ e4 >>> 1 : e4 >>> 1;
              t4[r4] = e4;
            }
            return t4;
          })();
          t3.exports = function(e4, t4) {
            return void 0 !== e4 && e4.length ? "string" !== n2.getTypeOf(e4) ? (function(e5, t5, r4, n3) {
              var i3 = o3, s3 = n3 + r4;
              e5 ^= -1;
              for (var a3 = n3; a3 < s3; a3++) e5 = e5 >>> 8 ^ i3[255 & (e5 ^ t5[a3])];
              return -1 ^ e5;
            })(0 | t4, e4, e4.length, 0) : (function(e5, t5, r4, n3) {
              var i3 = o3, s3 = n3 + r4;
              e5 ^= -1;
              for (var a3 = n3; a3 < s3; a3++) e5 = e5 >>> 8 ^ i3[255 & (e5 ^ t5.charCodeAt(a3))];
              return -1 ^ e5;
            })(0 | t4, e4, e4.length, 0) : 0;
          };
        }, { "./utils": 32 }], 5: [function(e3, t3, r3) {
          "use strict";
          r3.base64 = false, r3.binary = false, r3.dir = false, r3.createFolders = true, r3.date = null, r3.compression = null, r3.compressionOptions = null, r3.comment = null, r3.unixPermissions = null, r3.dosPermissions = null;
        }, {}], 6: [function(e3, t3, r3) {
          "use strict";
          var n2 = null;
          n2 = "undefined" != typeof Promise ? Promise : e3("lie"), t3.exports = { Promise: n2 };
        }, { lie: 37 }], 7: [function(e3, t3, r3) {
          "use strict";
          var n2 = "undefined" != typeof Uint8Array && "undefined" != typeof Uint16Array && "undefined" != typeof Uint32Array, i3 = e3("pako"), s3 = e3("./utils"), a3 = e3("./stream/GenericWorker"), o3 = n2 ? "uint8array" : "array";
          function h3(e4, t4) {
            a3.call(this, "FlateWorker/" + e4), this._pako = null, this._pakoAction = e4, this._pakoOptions = t4, this.meta = {};
          }
          r3.magic = "\b\0", s3.inherits(h3, a3), h3.prototype.processChunk = function(e4) {
            this.meta = e4.meta, null === this._pako && this._createPako(), this._pako.push(s3.transformTo(o3, e4.data), false);
          }, h3.prototype.flush = function() {
            a3.prototype.flush.call(this), null === this._pako && this._createPako(), this._pako.push([], true);
          }, h3.prototype.cleanUp = function() {
            a3.prototype.cleanUp.call(this), this._pako = null;
          }, h3.prototype._createPako = function() {
            this._pako = new i3[this._pakoAction]({ raw: true, level: this._pakoOptions.level || -1 });
            var t4 = this;
            this._pako.onData = function(e4) {
              t4.push({ data: e4, meta: t4.meta });
            };
          }, r3.compressWorker = function(e4) {
            return new h3("Deflate", e4);
          }, r3.uncompressWorker = function() {
            return new h3("Inflate", {});
          };
        }, { "./stream/GenericWorker": 28, "./utils": 32, pako: 38 }], 8: [function(e3, t3, r3) {
          "use strict";
          function A2(e4, t4) {
            var r4, n3 = "";
            for (r4 = 0; r4 < t4; r4++) n3 += String.fromCharCode(255 & e4), e4 >>>= 8;
            return n3;
          }
          function n2(e4, t4, r4, n3, i4, s4) {
            var a3, o3, h3 = e4.file, u3 = e4.compression, l3 = s4 !== O2.utf8encode, f3 = I2.transformTo("string", s4(h3.name)), c3 = I2.transformTo("string", O2.utf8encode(h3.name)), d3 = h3.comment, p3 = I2.transformTo("string", s4(d3)), m3 = I2.transformTo("string", O2.utf8encode(d3)), _2 = c3.length !== h3.name.length, g3 = m3.length !== d3.length, b3 = "", v3 = "", y3 = "", w3 = h3.dir, k3 = h3.date, x3 = { crc32: 0, compressedSize: 0, uncompressedSize: 0 };
            t4 && !r4 || (x3.crc32 = e4.crc32, x3.compressedSize = e4.compressedSize, x3.uncompressedSize = e4.uncompressedSize);
            var S2 = 0;
            t4 && (S2 |= 8), l3 || !_2 && !g3 || (S2 |= 2048);
            var z2 = 0, C2 = 0;
            w3 && (z2 |= 16), "UNIX" === i4 ? (C2 = 798, z2 |= (function(e5, t5) {
              var r5 = e5;
              return e5 || (r5 = t5 ? 16893 : 33204), (65535 & r5) << 16;
            })(h3.unixPermissions, w3)) : (C2 = 20, z2 |= (function(e5) {
              return 63 & (e5 || 0);
            })(h3.dosPermissions)), a3 = k3.getUTCHours(), a3 <<= 6, a3 |= k3.getUTCMinutes(), a3 <<= 5, a3 |= k3.getUTCSeconds() / 2, o3 = k3.getUTCFullYear() - 1980, o3 <<= 4, o3 |= k3.getUTCMonth() + 1, o3 <<= 5, o3 |= k3.getUTCDate(), _2 && (v3 = A2(1, 1) + A2(B(f3), 4) + c3, b3 += "up" + A2(v3.length, 2) + v3), g3 && (y3 = A2(1, 1) + A2(B(p3), 4) + m3, b3 += "uc" + A2(y3.length, 2) + y3);
            var E = "";
            return E += "\n\0", E += A2(S2, 2), E += u3.magic, E += A2(a3, 2), E += A2(o3, 2), E += A2(x3.crc32, 4), E += A2(x3.compressedSize, 4), E += A2(x3.uncompressedSize, 4), E += A2(f3.length, 2), E += A2(b3.length, 2), { fileRecord: R.LOCAL_FILE_HEADER + E + f3 + b3, dirRecord: R.CENTRAL_FILE_HEADER + A2(C2, 2) + E + A2(p3.length, 2) + "\0\0\0\0" + A2(z2, 4) + A2(n3, 4) + f3 + b3 + p3 };
          }
          var I2 = e3("../utils"), i3 = e3("../stream/GenericWorker"), O2 = e3("../utf8"), B = e3("../crc32"), R = e3("../signature");
          function s3(e4, t4, r4, n3) {
            i3.call(this, "ZipFileWorker"), this.bytesWritten = 0, this.zipComment = t4, this.zipPlatform = r4, this.encodeFileName = n3, this.streamFiles = e4, this.accumulate = false, this.contentBuffer = [], this.dirRecords = [], this.currentSourceOffset = 0, this.entriesCount = 0, this.currentFile = null, this._sources = [];
          }
          I2.inherits(s3, i3), s3.prototype.push = function(e4) {
            var t4 = e4.meta.percent || 0, r4 = this.entriesCount, n3 = this._sources.length;
            this.accumulate ? this.contentBuffer.push(e4) : (this.bytesWritten += e4.data.length, i3.prototype.push.call(this, { data: e4.data, meta: { currentFile: this.currentFile, percent: r4 ? (t4 + 100 * (r4 - n3 - 1)) / r4 : 100 } }));
          }, s3.prototype.openedSource = function(e4) {
            this.currentSourceOffset = this.bytesWritten, this.currentFile = e4.file.name;
            var t4 = this.streamFiles && !e4.file.dir;
            if (t4) {
              var r4 = n2(e4, t4, false, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
              this.push({ data: r4.fileRecord, meta: { percent: 0 } });
            } else this.accumulate = true;
          }, s3.prototype.closedSource = function(e4) {
            this.accumulate = false;
            var t4 = this.streamFiles && !e4.file.dir, r4 = n2(e4, t4, true, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
            if (this.dirRecords.push(r4.dirRecord), t4) this.push({ data: (function(e5) {
              return R.DATA_DESCRIPTOR + A2(e5.crc32, 4) + A2(e5.compressedSize, 4) + A2(e5.uncompressedSize, 4);
            })(e4), meta: { percent: 100 } });
            else for (this.push({ data: r4.fileRecord, meta: { percent: 0 } }); this.contentBuffer.length; ) this.push(this.contentBuffer.shift());
            this.currentFile = null;
          }, s3.prototype.flush = function() {
            for (var e4 = this.bytesWritten, t4 = 0; t4 < this.dirRecords.length; t4++) this.push({ data: this.dirRecords[t4], meta: { percent: 100 } });
            var r4 = this.bytesWritten - e4, n3 = (function(e5, t5, r5, n4, i4) {
              var s4 = I2.transformTo("string", i4(n4));
              return R.CENTRAL_DIRECTORY_END + "\0\0\0\0" + A2(e5, 2) + A2(e5, 2) + A2(t5, 4) + A2(r5, 4) + A2(s4.length, 2) + s4;
            })(this.dirRecords.length, r4, e4, this.zipComment, this.encodeFileName);
            this.push({ data: n3, meta: { percent: 100 } });
          }, s3.prototype.prepareNextSource = function() {
            this.previous = this._sources.shift(), this.openedSource(this.previous.streamInfo), this.isPaused ? this.previous.pause() : this.previous.resume();
          }, s3.prototype.registerPrevious = function(e4) {
            this._sources.push(e4);
            var t4 = this;
            return e4.on("data", function(e5) {
              t4.processChunk(e5);
            }), e4.on("end", function() {
              t4.closedSource(t4.previous.streamInfo), t4._sources.length ? t4.prepareNextSource() : t4.end();
            }), e4.on("error", function(e5) {
              t4.error(e5);
            }), this;
          }, s3.prototype.resume = function() {
            return !!i3.prototype.resume.call(this) && (!this.previous && this._sources.length ? (this.prepareNextSource(), true) : this.previous || this._sources.length || this.generatedError ? void 0 : (this.end(), true));
          }, s3.prototype.error = function(e4) {
            var t4 = this._sources;
            if (!i3.prototype.error.call(this, e4)) return false;
            for (var r4 = 0; r4 < t4.length; r4++) try {
              t4[r4].error(e4);
            } catch (e5) {
            }
            return true;
          }, s3.prototype.lock = function() {
            i3.prototype.lock.call(this);
            for (var e4 = this._sources, t4 = 0; t4 < e4.length; t4++) e4[t4].lock();
          }, t3.exports = s3;
        }, { "../crc32": 4, "../signature": 23, "../stream/GenericWorker": 28, "../utf8": 31, "../utils": 32 }], 9: [function(e3, t3, r3) {
          "use strict";
          var u3 = e3("../compressions"), n2 = e3("./ZipFileWorker");
          r3.generateWorker = function(e4, a3, t4) {
            var o3 = new n2(a3.streamFiles, t4, a3.platform, a3.encodeFileName), h3 = 0;
            try {
              e4.forEach(function(e5, t5) {
                h3++;
                var r4 = (function(e6, t6) {
                  var r5 = e6 || t6, n4 = u3[r5];
                  if (!n4) throw new Error(r5 + " is not a valid compression method !");
                  return n4;
                })(t5.options.compression, a3.compression), n3 = t5.options.compressionOptions || a3.compressionOptions || {}, i3 = t5.dir, s3 = t5.date;
                t5._compressWorker(r4, n3).withStreamInfo("file", { name: e5, dir: i3, date: s3, comment: t5.comment || "", unixPermissions: t5.unixPermissions, dosPermissions: t5.dosPermissions }).pipe(o3);
              }), o3.entriesCount = h3;
            } catch (e5) {
              o3.error(e5);
            }
            return o3;
          };
        }, { "../compressions": 3, "./ZipFileWorker": 8 }], 10: [function(e3, t3, r3) {
          "use strict";
          function n2() {
            if (!(this instanceof n2)) return new n2();
            if (arguments.length) throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
            this.files = /* @__PURE__ */ Object.create(null), this.comment = null, this.root = "", this.clone = function() {
              var e4 = new n2();
              for (var t4 in this) "function" != typeof this[t4] && (e4[t4] = this[t4]);
              return e4;
            };
          }
          (n2.prototype = e3("./object")).loadAsync = e3("./load"), n2.support = e3("./support"), n2.defaults = e3("./defaults"), n2.version = "3.10.1", n2.loadAsync = function(e4, t4) {
            return new n2().loadAsync(e4, t4);
          }, n2.external = e3("./external"), t3.exports = n2;
        }, { "./defaults": 5, "./external": 6, "./load": 11, "./object": 15, "./support": 30 }], 11: [function(e3, t3, r3) {
          "use strict";
          var u3 = e3("./utils"), i3 = e3("./external"), n2 = e3("./utf8"), s3 = e3("./zipEntries"), a3 = e3("./stream/Crc32Probe"), l3 = e3("./nodejsUtils");
          function f3(n3) {
            return new i3.Promise(function(e4, t4) {
              var r4 = n3.decompressed.getContentWorker().pipe(new a3());
              r4.on("error", function(e5) {
                t4(e5);
              }).on("end", function() {
                r4.streamInfo.crc32 !== n3.decompressed.crc32 ? t4(new Error("Corrupted zip : CRC32 mismatch")) : e4();
              }).resume();
            });
          }
          t3.exports = function(e4, o3) {
            var h3 = this;
            return o3 = u3.extend(o3 || {}, { base64: false, checkCRC32: false, optimizedBinaryString: false, createFolders: false, decodeFileName: n2.utf8decode }), l3.isNode && l3.isStream(e4) ? i3.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")) : u3.prepareContent("the loaded zip file", e4, true, o3.optimizedBinaryString, o3.base64).then(function(e5) {
              var t4 = new s3(o3);
              return t4.load(e5), t4;
            }).then(function(e5) {
              var t4 = [i3.Promise.resolve(e5)], r4 = e5.files;
              if (o3.checkCRC32) for (var n3 = 0; n3 < r4.length; n3++) t4.push(f3(r4[n3]));
              return i3.Promise.all(t4);
            }).then(function(e5) {
              for (var t4 = e5.shift(), r4 = t4.files, n3 = 0; n3 < r4.length; n3++) {
                var i4 = r4[n3], s4 = i4.fileNameStr, a4 = u3.resolve(i4.fileNameStr);
                h3.file(a4, i4.decompressed, { binary: true, optimizedBinaryString: true, date: i4.date, dir: i4.dir, comment: i4.fileCommentStr.length ? i4.fileCommentStr : null, unixPermissions: i4.unixPermissions, dosPermissions: i4.dosPermissions, createFolders: o3.createFolders }), i4.dir || (h3.file(a4).unsafeOriginalName = s4);
              }
              return t4.zipComment.length && (h3.comment = t4.zipComment), h3;
            });
          };
        }, { "./external": 6, "./nodejsUtils": 14, "./stream/Crc32Probe": 25, "./utf8": 31, "./utils": 32, "./zipEntries": 33 }], 12: [function(e3, t3, r3) {
          "use strict";
          var n2 = e3("../utils"), i3 = e3("../stream/GenericWorker");
          function s3(e4, t4) {
            i3.call(this, "Nodejs stream input adapter for " + e4), this._upstreamEnded = false, this._bindStream(t4);
          }
          n2.inherits(s3, i3), s3.prototype._bindStream = function(e4) {
            var t4 = this;
            (this._stream = e4).pause(), e4.on("data", function(e5) {
              t4.push({ data: e5, meta: { percent: 0 } });
            }).on("error", function(e5) {
              t4.isPaused ? this.generatedError = e5 : t4.error(e5);
            }).on("end", function() {
              t4.isPaused ? t4._upstreamEnded = true : t4.end();
            });
          }, s3.prototype.pause = function() {
            return !!i3.prototype.pause.call(this) && (this._stream.pause(), true);
          }, s3.prototype.resume = function() {
            return !!i3.prototype.resume.call(this) && (this._upstreamEnded ? this.end() : this._stream.resume(), true);
          }, t3.exports = s3;
        }, { "../stream/GenericWorker": 28, "../utils": 32 }], 13: [function(e3, t3, r3) {
          "use strict";
          var i3 = e3("readable-stream").Readable;
          function n2(e4, t4, r4) {
            i3.call(this, t4), this._helper = e4;
            var n3 = this;
            e4.on("data", function(e5, t5) {
              n3.push(e5) || n3._helper.pause(), r4 && r4(t5);
            }).on("error", function(e5) {
              n3.emit("error", e5);
            }).on("end", function() {
              n3.push(null);
            });
          }
          e3("../utils").inherits(n2, i3), n2.prototype._read = function() {
            this._helper.resume();
          }, t3.exports = n2;
        }, { "../utils": 32, "readable-stream": 16 }], 14: [function(e3, t3, r3) {
          "use strict";
          t3.exports = { isNode: "undefined" != typeof Buffer, newBufferFrom: function(e4, t4) {
            if (Buffer.from && Buffer.from !== Uint8Array.from) return Buffer.from(e4, t4);
            if ("number" == typeof e4) throw new Error('The "data" argument must not be a number');
            return new Buffer(e4, t4);
          }, allocBuffer: function(e4) {
            if (Buffer.alloc) return Buffer.alloc(e4);
            var t4 = new Buffer(e4);
            return t4.fill(0), t4;
          }, isBuffer: function(e4) {
            return Buffer.isBuffer(e4);
          }, isStream: function(e4) {
            return e4 && "function" == typeof e4.on && "function" == typeof e4.pause && "function" == typeof e4.resume;
          } };
        }, {}], 15: [function(e3, t3, r3) {
          "use strict";
          function s3(e4, t4, r4) {
            var n3, i4 = u3.getTypeOf(t4), s4 = u3.extend(r4 || {}, f3);
            s4.date = s4.date || /* @__PURE__ */ new Date(), null !== s4.compression && (s4.compression = s4.compression.toUpperCase()), "string" == typeof s4.unixPermissions && (s4.unixPermissions = parseInt(s4.unixPermissions, 8)), s4.unixPermissions && 16384 & s4.unixPermissions && (s4.dir = true), s4.dosPermissions && 16 & s4.dosPermissions && (s4.dir = true), s4.dir && (e4 = g3(e4)), s4.createFolders && (n3 = _2(e4)) && b3.call(this, n3, true);
            var a4 = "string" === i4 && false === s4.binary && false === s4.base64;
            r4 && void 0 !== r4.binary || (s4.binary = !a4), (t4 instanceof c3 && 0 === t4.uncompressedSize || s4.dir || !t4 || 0 === t4.length) && (s4.base64 = false, s4.binary = true, t4 = "", s4.compression = "STORE", i4 = "string");
            var o4 = null;
            o4 = t4 instanceof c3 || t4 instanceof l3 ? t4 : p3.isNode && p3.isStream(t4) ? new m3(e4, t4) : u3.prepareContent(e4, t4, s4.binary, s4.optimizedBinaryString, s4.base64);
            var h4 = new d3(e4, o4, s4);
            this.files[e4] = h4;
          }
          var i3 = e3("./utf8"), u3 = e3("./utils"), l3 = e3("./stream/GenericWorker"), a3 = e3("./stream/StreamHelper"), f3 = e3("./defaults"), c3 = e3("./compressedObject"), d3 = e3("./zipObject"), o3 = e3("./generate"), p3 = e3("./nodejsUtils"), m3 = e3("./nodejs/NodejsStreamInputAdapter"), _2 = function(e4) {
            "/" === e4.slice(-1) && (e4 = e4.substring(0, e4.length - 1));
            var t4 = e4.lastIndexOf("/");
            return 0 < t4 ? e4.substring(0, t4) : "";
          }, g3 = function(e4) {
            return "/" !== e4.slice(-1) && (e4 += "/"), e4;
          }, b3 = function(e4, t4) {
            return t4 = void 0 !== t4 ? t4 : f3.createFolders, e4 = g3(e4), this.files[e4] || s3.call(this, e4, null, { dir: true, createFolders: t4 }), this.files[e4];
          };
          function h3(e4) {
            return "[object RegExp]" === Object.prototype.toString.call(e4);
          }
          var n2 = { load: function() {
            throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
          }, forEach: function(e4) {
            var t4, r4, n3;
            for (t4 in this.files) n3 = this.files[t4], (r4 = t4.slice(this.root.length, t4.length)) && t4.slice(0, this.root.length) === this.root && e4(r4, n3);
          }, filter: function(r4) {
            var n3 = [];
            return this.forEach(function(e4, t4) {
              r4(e4, t4) && n3.push(t4);
            }), n3;
          }, file: function(e4, t4, r4) {
            if (1 !== arguments.length) return e4 = this.root + e4, s3.call(this, e4, t4, r4), this;
            if (h3(e4)) {
              var n3 = e4;
              return this.filter(function(e5, t5) {
                return !t5.dir && n3.test(e5);
              });
            }
            var i4 = this.files[this.root + e4];
            return i4 && !i4.dir ? i4 : null;
          }, folder: function(r4) {
            if (!r4) return this;
            if (h3(r4)) return this.filter(function(e5, t5) {
              return t5.dir && r4.test(e5);
            });
            var e4 = this.root + r4, t4 = b3.call(this, e4), n3 = this.clone();
            return n3.root = t4.name, n3;
          }, remove: function(r4) {
            r4 = this.root + r4;
            var e4 = this.files[r4];
            if (e4 || ("/" !== r4.slice(-1) && (r4 += "/"), e4 = this.files[r4]), e4 && !e4.dir) delete this.files[r4];
            else for (var t4 = this.filter(function(e5, t5) {
              return t5.name.slice(0, r4.length) === r4;
            }), n3 = 0; n3 < t4.length; n3++) delete this.files[t4[n3].name];
            return this;
          }, generate: function() {
            throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
          }, generateInternalStream: function(e4) {
            var t4, r4 = {};
            try {
              if ((r4 = u3.extend(e4 || {}, { streamFiles: false, compression: "STORE", compressionOptions: null, type: "", platform: "DOS", comment: null, mimeType: "application/zip", encodeFileName: i3.utf8encode })).type = r4.type.toLowerCase(), r4.compression = r4.compression.toUpperCase(), "binarystring" === r4.type && (r4.type = "string"), !r4.type) throw new Error("No output type specified.");
              u3.checkSupport(r4.type), "darwin" !== r4.platform && "freebsd" !== r4.platform && "linux" !== r4.platform && "sunos" !== r4.platform || (r4.platform = "UNIX"), "win32" === r4.platform && (r4.platform = "DOS");
              var n3 = r4.comment || this.comment || "";
              t4 = o3.generateWorker(this, r4, n3);
            } catch (e5) {
              (t4 = new l3("error")).error(e5);
            }
            return new a3(t4, r4.type || "string", r4.mimeType);
          }, generateAsync: function(e4, t4) {
            return this.generateInternalStream(e4).accumulate(t4);
          }, generateNodeStream: function(e4, t4) {
            return (e4 = e4 || {}).type || (e4.type = "nodebuffer"), this.generateInternalStream(e4).toNodejsStream(t4);
          } };
          t3.exports = n2;
        }, { "./compressedObject": 2, "./defaults": 5, "./generate": 9, "./nodejs/NodejsStreamInputAdapter": 12, "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31, "./utils": 32, "./zipObject": 35 }], 16: [function(e3, t3, r3) {
          "use strict";
          t3.exports = e3("stream");
        }, { stream: void 0 }], 17: [function(e3, t3, r3) {
          "use strict";
          var n2 = e3("./DataReader");
          function i3(e4) {
            n2.call(this, e4);
            for (var t4 = 0; t4 < this.data.length; t4++) e4[t4] = 255 & e4[t4];
          }
          e3("../utils").inherits(i3, n2), i3.prototype.byteAt = function(e4) {
            return this.data[this.zero + e4];
          }, i3.prototype.lastIndexOfSignature = function(e4) {
            for (var t4 = e4.charCodeAt(0), r4 = e4.charCodeAt(1), n3 = e4.charCodeAt(2), i4 = e4.charCodeAt(3), s3 = this.length - 4; 0 <= s3; --s3) if (this.data[s3] === t4 && this.data[s3 + 1] === r4 && this.data[s3 + 2] === n3 && this.data[s3 + 3] === i4) return s3 - this.zero;
            return -1;
          }, i3.prototype.readAndCheckSignature = function(e4) {
            var t4 = e4.charCodeAt(0), r4 = e4.charCodeAt(1), n3 = e4.charCodeAt(2), i4 = e4.charCodeAt(3), s3 = this.readData(4);
            return t4 === s3[0] && r4 === s3[1] && n3 === s3[2] && i4 === s3[3];
          }, i3.prototype.readData = function(e4) {
            if (this.checkOffset(e4), 0 === e4) return [];
            var t4 = this.data.slice(this.zero + this.index, this.zero + this.index + e4);
            return this.index += e4, t4;
          }, t3.exports = i3;
        }, { "../utils": 32, "./DataReader": 18 }], 18: [function(e3, t3, r3) {
          "use strict";
          var n2 = e3("../utils");
          function i3(e4) {
            this.data = e4, this.length = e4.length, this.index = 0, this.zero = 0;
          }
          i3.prototype = { checkOffset: function(e4) {
            this.checkIndex(this.index + e4);
          }, checkIndex: function(e4) {
            if (this.length < this.zero + e4 || e4 < 0) throw new Error("End of data reached (data length = " + this.length + ", asked index = " + e4 + "). Corrupted zip ?");
          }, setIndex: function(e4) {
            this.checkIndex(e4), this.index = e4;
          }, skip: function(e4) {
            this.setIndex(this.index + e4);
          }, byteAt: function() {
          }, readInt: function(e4) {
            var t4, r4 = 0;
            for (this.checkOffset(e4), t4 = this.index + e4 - 1; t4 >= this.index; t4--) r4 = (r4 << 8) + this.byteAt(t4);
            return this.index += e4, r4;
          }, readString: function(e4) {
            return n2.transformTo("string", this.readData(e4));
          }, readData: function() {
          }, lastIndexOfSignature: function() {
          }, readAndCheckSignature: function() {
          }, readDate: function() {
            var e4 = this.readInt(4);
            return new Date(Date.UTC(1980 + (e4 >> 25 & 127), (e4 >> 21 & 15) - 1, e4 >> 16 & 31, e4 >> 11 & 31, e4 >> 5 & 63, (31 & e4) << 1));
          } }, t3.exports = i3;
        }, { "../utils": 32 }], 19: [function(e3, t3, r3) {
          "use strict";
          var n2 = e3("./Uint8ArrayReader");
          function i3(e4) {
            n2.call(this, e4);
          }
          e3("../utils").inherits(i3, n2), i3.prototype.readData = function(e4) {
            this.checkOffset(e4);
            var t4 = this.data.slice(this.zero + this.index, this.zero + this.index + e4);
            return this.index += e4, t4;
          }, t3.exports = i3;
        }, { "../utils": 32, "./Uint8ArrayReader": 21 }], 20: [function(e3, t3, r3) {
          "use strict";
          var n2 = e3("./DataReader");
          function i3(e4) {
            n2.call(this, e4);
          }
          e3("../utils").inherits(i3, n2), i3.prototype.byteAt = function(e4) {
            return this.data.charCodeAt(this.zero + e4);
          }, i3.prototype.lastIndexOfSignature = function(e4) {
            return this.data.lastIndexOf(e4) - this.zero;
          }, i3.prototype.readAndCheckSignature = function(e4) {
            return e4 === this.readData(4);
          }, i3.prototype.readData = function(e4) {
            this.checkOffset(e4);
            var t4 = this.data.slice(this.zero + this.index, this.zero + this.index + e4);
            return this.index += e4, t4;
          }, t3.exports = i3;
        }, { "../utils": 32, "./DataReader": 18 }], 21: [function(e3, t3, r3) {
          "use strict";
          var n2 = e3("./ArrayReader");
          function i3(e4) {
            n2.call(this, e4);
          }
          e3("../utils").inherits(i3, n2), i3.prototype.readData = function(e4) {
            if (this.checkOffset(e4), 0 === e4) return new Uint8Array(0);
            var t4 = this.data.subarray(this.zero + this.index, this.zero + this.index + e4);
            return this.index += e4, t4;
          }, t3.exports = i3;
        }, { "../utils": 32, "./ArrayReader": 17 }], 22: [function(e3, t3, r3) {
          "use strict";
          var n2 = e3("../utils"), i3 = e3("../support"), s3 = e3("./ArrayReader"), a3 = e3("./StringReader"), o3 = e3("./NodeBufferReader"), h3 = e3("./Uint8ArrayReader");
          t3.exports = function(e4) {
            var t4 = n2.getTypeOf(e4);
            return n2.checkSupport(t4), "string" !== t4 || i3.uint8array ? "nodebuffer" === t4 ? new o3(e4) : i3.uint8array ? new h3(n2.transformTo("uint8array", e4)) : new s3(n2.transformTo("array", e4)) : new a3(e4);
          };
        }, { "../support": 30, "../utils": 32, "./ArrayReader": 17, "./NodeBufferReader": 19, "./StringReader": 20, "./Uint8ArrayReader": 21 }], 23: [function(e3, t3, r3) {
          "use strict";
          r3.LOCAL_FILE_HEADER = "PK", r3.CENTRAL_FILE_HEADER = "PK", r3.CENTRAL_DIRECTORY_END = "PK", r3.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07", r3.ZIP64_CENTRAL_DIRECTORY_END = "PK", r3.DATA_DESCRIPTOR = "PK\x07\b";
        }, {}], 24: [function(e3, t3, r3) {
          "use strict";
          var n2 = e3("./GenericWorker"), i3 = e3("../utils");
          function s3(e4) {
            n2.call(this, "ConvertWorker to " + e4), this.destType = e4;
          }
          i3.inherits(s3, n2), s3.prototype.processChunk = function(e4) {
            this.push({ data: i3.transformTo(this.destType, e4.data), meta: e4.meta });
          }, t3.exports = s3;
        }, { "../utils": 32, "./GenericWorker": 28 }], 25: [function(e3, t3, r3) {
          "use strict";
          var n2 = e3("./GenericWorker"), i3 = e3("../crc32");
          function s3() {
            n2.call(this, "Crc32Probe"), this.withStreamInfo("crc32", 0);
          }
          e3("../utils").inherits(s3, n2), s3.prototype.processChunk = function(e4) {
            this.streamInfo.crc32 = i3(e4.data, this.streamInfo.crc32 || 0), this.push(e4);
          }, t3.exports = s3;
        }, { "../crc32": 4, "../utils": 32, "./GenericWorker": 28 }], 26: [function(e3, t3, r3) {
          "use strict";
          var n2 = e3("../utils"), i3 = e3("./GenericWorker");
          function s3(e4) {
            i3.call(this, "DataLengthProbe for " + e4), this.propName = e4, this.withStreamInfo(e4, 0);
          }
          n2.inherits(s3, i3), s3.prototype.processChunk = function(e4) {
            if (e4) {
              var t4 = this.streamInfo[this.propName] || 0;
              this.streamInfo[this.propName] = t4 + e4.data.length;
            }
            i3.prototype.processChunk.call(this, e4);
          }, t3.exports = s3;
        }, { "../utils": 32, "./GenericWorker": 28 }], 27: [function(e3, t3, r3) {
          "use strict";
          var n2 = e3("../utils"), i3 = e3("./GenericWorker");
          function s3(e4) {
            i3.call(this, "DataWorker");
            var t4 = this;
            this.dataIsReady = false, this.index = 0, this.max = 0, this.data = null, this.type = "", this._tickScheduled = false, e4.then(function(e5) {
              t4.dataIsReady = true, t4.data = e5, t4.max = e5 && e5.length || 0, t4.type = n2.getTypeOf(e5), t4.isPaused || t4._tickAndRepeat();
            }, function(e5) {
              t4.error(e5);
            });
          }
          n2.inherits(s3, i3), s3.prototype.cleanUp = function() {
            i3.prototype.cleanUp.call(this), this.data = null;
          }, s3.prototype.resume = function() {
            return !!i3.prototype.resume.call(this) && (!this._tickScheduled && this.dataIsReady && (this._tickScheduled = true, n2.delay(this._tickAndRepeat, [], this)), true);
          }, s3.prototype._tickAndRepeat = function() {
            this._tickScheduled = false, this.isPaused || this.isFinished || (this._tick(), this.isFinished || (n2.delay(this._tickAndRepeat, [], this), this._tickScheduled = true));
          }, s3.prototype._tick = function() {
            if (this.isPaused || this.isFinished) return false;
            var e4 = null, t4 = Math.min(this.max, this.index + 16384);
            if (this.index >= this.max) return this.end();
            switch (this.type) {
              case "string":
                e4 = this.data.substring(this.index, t4);
                break;
              case "uint8array":
                e4 = this.data.subarray(this.index, t4);
                break;
              case "array":
              case "nodebuffer":
                e4 = this.data.slice(this.index, t4);
            }
            return this.index = t4, this.push({ data: e4, meta: { percent: this.max ? this.index / this.max * 100 : 0 } });
          }, t3.exports = s3;
        }, { "../utils": 32, "./GenericWorker": 28 }], 28: [function(e3, t3, r3) {
          "use strict";
          function n2(e4) {
            this.name = e4 || "default", this.streamInfo = {}, this.generatedError = null, this.extraStreamInfo = {}, this.isPaused = true, this.isFinished = false, this.isLocked = false, this._listeners = { data: [], end: [], error: [] }, this.previous = null;
          }
          n2.prototype = { push: function(e4) {
            this.emit("data", e4);
          }, end: function() {
            if (this.isFinished) return false;
            this.flush();
            try {
              this.emit("end"), this.cleanUp(), this.isFinished = true;
            } catch (e4) {
              this.emit("error", e4);
            }
            return true;
          }, error: function(e4) {
            return !this.isFinished && (this.isPaused ? this.generatedError = e4 : (this.isFinished = true, this.emit("error", e4), this.previous && this.previous.error(e4), this.cleanUp()), true);
          }, on: function(e4, t4) {
            return this._listeners[e4].push(t4), this;
          }, cleanUp: function() {
            this.streamInfo = this.generatedError = this.extraStreamInfo = null, this._listeners = [];
          }, emit: function(e4, t4) {
            if (this._listeners[e4]) for (var r4 = 0; r4 < this._listeners[e4].length; r4++) this._listeners[e4][r4].call(this, t4);
          }, pipe: function(e4) {
            return e4.registerPrevious(this);
          }, registerPrevious: function(e4) {
            if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
            this.streamInfo = e4.streamInfo, this.mergeStreamInfo(), this.previous = e4;
            var t4 = this;
            return e4.on("data", function(e5) {
              t4.processChunk(e5);
            }), e4.on("end", function() {
              t4.end();
            }), e4.on("error", function(e5) {
              t4.error(e5);
            }), this;
          }, pause: function() {
            return !this.isPaused && !this.isFinished && (this.isPaused = true, this.previous && this.previous.pause(), true);
          }, resume: function() {
            if (!this.isPaused || this.isFinished) return false;
            var e4 = this.isPaused = false;
            return this.generatedError && (this.error(this.generatedError), e4 = true), this.previous && this.previous.resume(), !e4;
          }, flush: function() {
          }, processChunk: function(e4) {
            this.push(e4);
          }, withStreamInfo: function(e4, t4) {
            return this.extraStreamInfo[e4] = t4, this.mergeStreamInfo(), this;
          }, mergeStreamInfo: function() {
            for (var e4 in this.extraStreamInfo) Object.prototype.hasOwnProperty.call(this.extraStreamInfo, e4) && (this.streamInfo[e4] = this.extraStreamInfo[e4]);
          }, lock: function() {
            if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
            this.isLocked = true, this.previous && this.previous.lock();
          }, toString: function() {
            var e4 = "Worker " + this.name;
            return this.previous ? this.previous + " -> " + e4 : e4;
          } }, t3.exports = n2;
        }, {}], 29: [function(e3, t3, r3) {
          "use strict";
          var h3 = e3("../utils"), i3 = e3("./ConvertWorker"), s3 = e3("./GenericWorker"), u3 = e3("../base64"), n2 = e3("../support"), a3 = e3("../external"), o3 = null;
          if (n2.nodestream) try {
            o3 = e3("../nodejs/NodejsStreamOutputAdapter");
          } catch (e4) {
          }
          function l3(e4, o4) {
            return new a3.Promise(function(t4, r4) {
              var n3 = [], i4 = e4._internalType, s4 = e4._outputType, a4 = e4._mimeType;
              e4.on("data", function(e5, t5) {
                n3.push(e5), o4 && o4(t5);
              }).on("error", function(e5) {
                n3 = [], r4(e5);
              }).on("end", function() {
                try {
                  var e5 = (function(e6, t5, r5) {
                    switch (e6) {
                      case "blob":
                        return h3.newBlob(h3.transformTo("arraybuffer", t5), r5);
                      case "base64":
                        return u3.encode(t5);
                      default:
                        return h3.transformTo(e6, t5);
                    }
                  })(s4, (function(e6, t5) {
                    var r5, n4 = 0, i5 = null, s5 = 0;
                    for (r5 = 0; r5 < t5.length; r5++) s5 += t5[r5].length;
                    switch (e6) {
                      case "string":
                        return t5.join("");
                      case "array":
                        return Array.prototype.concat.apply([], t5);
                      case "uint8array":
                        for (i5 = new Uint8Array(s5), r5 = 0; r5 < t5.length; r5++) i5.set(t5[r5], n4), n4 += t5[r5].length;
                        return i5;
                      case "nodebuffer":
                        return Buffer.concat(t5);
                      default:
                        throw new Error("concat : unsupported type '" + e6 + "'");
                    }
                  })(i4, n3), a4);
                  t4(e5);
                } catch (e6) {
                  r4(e6);
                }
                n3 = [];
              }).resume();
            });
          }
          function f3(e4, t4, r4) {
            var n3 = t4;
            switch (t4) {
              case "blob":
              case "arraybuffer":
                n3 = "uint8array";
                break;
              case "base64":
                n3 = "string";
            }
            try {
              this._internalType = n3, this._outputType = t4, this._mimeType = r4, h3.checkSupport(n3), this._worker = e4.pipe(new i3(n3)), e4.lock();
            } catch (e5) {
              this._worker = new s3("error"), this._worker.error(e5);
            }
          }
          f3.prototype = { accumulate: function(e4) {
            return l3(this, e4);
          }, on: function(e4, t4) {
            var r4 = this;
            return "data" === e4 ? this._worker.on(e4, function(e5) {
              t4.call(r4, e5.data, e5.meta);
            }) : this._worker.on(e4, function() {
              h3.delay(t4, arguments, r4);
            }), this;
          }, resume: function() {
            return h3.delay(this._worker.resume, [], this._worker), this;
          }, pause: function() {
            return this._worker.pause(), this;
          }, toNodejsStream: function(e4) {
            if (h3.checkSupport("nodestream"), "nodebuffer" !== this._outputType) throw new Error(this._outputType + " is not supported by this method");
            return new o3(this, { objectMode: "nodebuffer" !== this._outputType }, e4);
          } }, t3.exports = f3;
        }, { "../base64": 1, "../external": 6, "../nodejs/NodejsStreamOutputAdapter": 13, "../support": 30, "../utils": 32, "./ConvertWorker": 24, "./GenericWorker": 28 }], 30: [function(e3, t3, r3) {
          "use strict";
          if (r3.base64 = true, r3.array = true, r3.string = true, r3.arraybuffer = "undefined" != typeof ArrayBuffer && "undefined" != typeof Uint8Array, r3.nodebuffer = "undefined" != typeof Buffer, r3.uint8array = "undefined" != typeof Uint8Array, "undefined" == typeof ArrayBuffer) r3.blob = false;
          else {
            var n2 = new ArrayBuffer(0);
            try {
              r3.blob = 0 === new Blob([n2], { type: "application/zip" }).size;
            } catch (e4) {
              try {
                var i3 = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
                i3.append(n2), r3.blob = 0 === i3.getBlob("application/zip").size;
              } catch (e5) {
                r3.blob = false;
              }
            }
          }
          try {
            r3.nodestream = !!e3("readable-stream").Readable;
          } catch (e4) {
            r3.nodestream = false;
          }
        }, { "readable-stream": 16 }], 31: [function(e3, t3, s3) {
          "use strict";
          for (var o3 = e3("./utils"), h3 = e3("./support"), r3 = e3("./nodejsUtils"), n2 = e3("./stream/GenericWorker"), u3 = new Array(256), i3 = 0; i3 < 256; i3++) u3[i3] = 252 <= i3 ? 6 : 248 <= i3 ? 5 : 240 <= i3 ? 4 : 224 <= i3 ? 3 : 192 <= i3 ? 2 : 1;
          u3[254] = u3[254] = 1;
          function a3() {
            n2.call(this, "utf-8 decode"), this.leftOver = null;
          }
          function l3() {
            n2.call(this, "utf-8 encode");
          }
          s3.utf8encode = function(e4) {
            return h3.nodebuffer ? r3.newBufferFrom(e4, "utf-8") : (function(e5) {
              var t4, r4, n3, i4, s4, a4 = e5.length, o4 = 0;
              for (i4 = 0; i4 < a4; i4++) 55296 == (64512 & (r4 = e5.charCodeAt(i4))) && i4 + 1 < a4 && 56320 == (64512 & (n3 = e5.charCodeAt(i4 + 1))) && (r4 = 65536 + (r4 - 55296 << 10) + (n3 - 56320), i4++), o4 += r4 < 128 ? 1 : r4 < 2048 ? 2 : r4 < 65536 ? 3 : 4;
              for (t4 = h3.uint8array ? new Uint8Array(o4) : new Array(o4), i4 = s4 = 0; s4 < o4; i4++) 55296 == (64512 & (r4 = e5.charCodeAt(i4))) && i4 + 1 < a4 && 56320 == (64512 & (n3 = e5.charCodeAt(i4 + 1))) && (r4 = 65536 + (r4 - 55296 << 10) + (n3 - 56320), i4++), r4 < 128 ? t4[s4++] = r4 : (r4 < 2048 ? t4[s4++] = 192 | r4 >>> 6 : (r4 < 65536 ? t4[s4++] = 224 | r4 >>> 12 : (t4[s4++] = 240 | r4 >>> 18, t4[s4++] = 128 | r4 >>> 12 & 63), t4[s4++] = 128 | r4 >>> 6 & 63), t4[s4++] = 128 | 63 & r4);
              return t4;
            })(e4);
          }, s3.utf8decode = function(e4) {
            return h3.nodebuffer ? o3.transformTo("nodebuffer", e4).toString("utf-8") : (function(e5) {
              var t4, r4, n3, i4, s4 = e5.length, a4 = new Array(2 * s4);
              for (t4 = r4 = 0; t4 < s4; ) if ((n3 = e5[t4++]) < 128) a4[r4++] = n3;
              else if (4 < (i4 = u3[n3])) a4[r4++] = 65533, t4 += i4 - 1;
              else {
                for (n3 &= 2 === i4 ? 31 : 3 === i4 ? 15 : 7; 1 < i4 && t4 < s4; ) n3 = n3 << 6 | 63 & e5[t4++], i4--;
                1 < i4 ? a4[r4++] = 65533 : n3 < 65536 ? a4[r4++] = n3 : (n3 -= 65536, a4[r4++] = 55296 | n3 >> 10 & 1023, a4[r4++] = 56320 | 1023 & n3);
              }
              return a4.length !== r4 && (a4.subarray ? a4 = a4.subarray(0, r4) : a4.length = r4), o3.applyFromCharCode(a4);
            })(e4 = o3.transformTo(h3.uint8array ? "uint8array" : "array", e4));
          }, o3.inherits(a3, n2), a3.prototype.processChunk = function(e4) {
            var t4 = o3.transformTo(h3.uint8array ? "uint8array" : "array", e4.data);
            if (this.leftOver && this.leftOver.length) {
              if (h3.uint8array) {
                var r4 = t4;
                (t4 = new Uint8Array(r4.length + this.leftOver.length)).set(this.leftOver, 0), t4.set(r4, this.leftOver.length);
              } else t4 = this.leftOver.concat(t4);
              this.leftOver = null;
            }
            var n3 = (function(e5, t5) {
              var r5;
              for ((t5 = t5 || e5.length) > e5.length && (t5 = e5.length), r5 = t5 - 1; 0 <= r5 && 128 == (192 & e5[r5]); ) r5--;
              return r5 < 0 ? t5 : 0 === r5 ? t5 : r5 + u3[e5[r5]] > t5 ? r5 : t5;
            })(t4), i4 = t4;
            n3 !== t4.length && (h3.uint8array ? (i4 = t4.subarray(0, n3), this.leftOver = t4.subarray(n3, t4.length)) : (i4 = t4.slice(0, n3), this.leftOver = t4.slice(n3, t4.length))), this.push({ data: s3.utf8decode(i4), meta: e4.meta });
          }, a3.prototype.flush = function() {
            this.leftOver && this.leftOver.length && (this.push({ data: s3.utf8decode(this.leftOver), meta: {} }), this.leftOver = null);
          }, s3.Utf8DecodeWorker = a3, o3.inherits(l3, n2), l3.prototype.processChunk = function(e4) {
            this.push({ data: s3.utf8encode(e4.data), meta: e4.meta });
          }, s3.Utf8EncodeWorker = l3;
        }, { "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./support": 30, "./utils": 32 }], 32: [function(e3, t3, a3) {
          "use strict";
          var o3 = e3("./support"), h3 = e3("./base64"), r3 = e3("./nodejsUtils"), u3 = e3("./external");
          function n2(e4) {
            return e4;
          }
          function l3(e4, t4) {
            for (var r4 = 0; r4 < e4.length; ++r4) t4[r4] = 255 & e4.charCodeAt(r4);
            return t4;
          }
          e3("setimmediate"), a3.newBlob = function(t4, r4) {
            a3.checkSupport("blob");
            try {
              return new Blob([t4], { type: r4 });
            } catch (e4) {
              try {
                var n3 = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
                return n3.append(t4), n3.getBlob(r4);
              } catch (e5) {
                throw new Error("Bug : can't construct the Blob.");
              }
            }
          };
          var i3 = { stringifyByChunk: function(e4, t4, r4) {
            var n3 = [], i4 = 0, s4 = e4.length;
            if (s4 <= r4) return String.fromCharCode.apply(null, e4);
            for (; i4 < s4; ) "array" === t4 || "nodebuffer" === t4 ? n3.push(String.fromCharCode.apply(null, e4.slice(i4, Math.min(i4 + r4, s4)))) : n3.push(String.fromCharCode.apply(null, e4.subarray(i4, Math.min(i4 + r4, s4)))), i4 += r4;
            return n3.join("");
          }, stringifyByChar: function(e4) {
            for (var t4 = "", r4 = 0; r4 < e4.length; r4++) t4 += String.fromCharCode(e4[r4]);
            return t4;
          }, applyCanBeUsed: { uint8array: (function() {
            try {
              return o3.uint8array && 1 === String.fromCharCode.apply(null, new Uint8Array(1)).length;
            } catch (e4) {
              return false;
            }
          })(), nodebuffer: (function() {
            try {
              return o3.nodebuffer && 1 === String.fromCharCode.apply(null, r3.allocBuffer(1)).length;
            } catch (e4) {
              return false;
            }
          })() } };
          function s3(e4) {
            var t4 = 65536, r4 = a3.getTypeOf(e4), n3 = true;
            if ("uint8array" === r4 ? n3 = i3.applyCanBeUsed.uint8array : "nodebuffer" === r4 && (n3 = i3.applyCanBeUsed.nodebuffer), n3) for (; 1 < t4; ) try {
              return i3.stringifyByChunk(e4, r4, t4);
            } catch (e5) {
              t4 = Math.floor(t4 / 2);
            }
            return i3.stringifyByChar(e4);
          }
          function f3(e4, t4) {
            for (var r4 = 0; r4 < e4.length; r4++) t4[r4] = e4[r4];
            return t4;
          }
          a3.applyFromCharCode = s3;
          var c3 = {};
          c3.string = { string: n2, array: function(e4) {
            return l3(e4, new Array(e4.length));
          }, arraybuffer: function(e4) {
            return c3.string.uint8array(e4).buffer;
          }, uint8array: function(e4) {
            return l3(e4, new Uint8Array(e4.length));
          }, nodebuffer: function(e4) {
            return l3(e4, r3.allocBuffer(e4.length));
          } }, c3.array = { string: s3, array: n2, arraybuffer: function(e4) {
            return new Uint8Array(e4).buffer;
          }, uint8array: function(e4) {
            return new Uint8Array(e4);
          }, nodebuffer: function(e4) {
            return r3.newBufferFrom(e4);
          } }, c3.arraybuffer = { string: function(e4) {
            return s3(new Uint8Array(e4));
          }, array: function(e4) {
            return f3(new Uint8Array(e4), new Array(e4.byteLength));
          }, arraybuffer: n2, uint8array: function(e4) {
            return new Uint8Array(e4);
          }, nodebuffer: function(e4) {
            return r3.newBufferFrom(new Uint8Array(e4));
          } }, c3.uint8array = { string: s3, array: function(e4) {
            return f3(e4, new Array(e4.length));
          }, arraybuffer: function(e4) {
            return e4.buffer;
          }, uint8array: n2, nodebuffer: function(e4) {
            return r3.newBufferFrom(e4);
          } }, c3.nodebuffer = { string: s3, array: function(e4) {
            return f3(e4, new Array(e4.length));
          }, arraybuffer: function(e4) {
            return c3.nodebuffer.uint8array(e4).buffer;
          }, uint8array: function(e4) {
            return f3(e4, new Uint8Array(e4.length));
          }, nodebuffer: n2 }, a3.transformTo = function(e4, t4) {
            if (t4 = t4 || "", !e4) return t4;
            a3.checkSupport(e4);
            var r4 = a3.getTypeOf(t4);
            return c3[r4][e4](t4);
          }, a3.resolve = function(e4) {
            for (var t4 = e4.split("/"), r4 = [], n3 = 0; n3 < t4.length; n3++) {
              var i4 = t4[n3];
              "." === i4 || "" === i4 && 0 !== n3 && n3 !== t4.length - 1 || (".." === i4 ? r4.pop() : r4.push(i4));
            }
            return r4.join("/");
          }, a3.getTypeOf = function(e4) {
            return "string" == typeof e4 ? "string" : "[object Array]" === Object.prototype.toString.call(e4) ? "array" : o3.nodebuffer && r3.isBuffer(e4) ? "nodebuffer" : o3.uint8array && e4 instanceof Uint8Array ? "uint8array" : o3.arraybuffer && e4 instanceof ArrayBuffer ? "arraybuffer" : void 0;
          }, a3.checkSupport = function(e4) {
            if (!o3[e4.toLowerCase()]) throw new Error(e4 + " is not supported by this platform");
          }, a3.MAX_VALUE_16BITS = 65535, a3.MAX_VALUE_32BITS = -1, a3.pretty = function(e4) {
            var t4, r4, n3 = "";
            for (r4 = 0; r4 < (e4 || "").length; r4++) n3 += "\\x" + ((t4 = e4.charCodeAt(r4)) < 16 ? "0" : "") + t4.toString(16).toUpperCase();
            return n3;
          }, a3.delay = function(e4, t4, r4) {
            setImmediate(function() {
              e4.apply(r4 || null, t4 || []);
            });
          }, a3.inherits = function(e4, t4) {
            function r4() {
            }
            r4.prototype = t4.prototype, e4.prototype = new r4();
          }, a3.extend = function() {
            var e4, t4, r4 = {};
            for (e4 = 0; e4 < arguments.length; e4++) for (t4 in arguments[e4]) Object.prototype.hasOwnProperty.call(arguments[e4], t4) && void 0 === r4[t4] && (r4[t4] = arguments[e4][t4]);
            return r4;
          }, a3.prepareContent = function(r4, e4, n3, i4, s4) {
            return u3.Promise.resolve(e4).then(function(n4) {
              return o3.blob && (n4 instanceof Blob || -1 !== ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(n4))) && "undefined" != typeof FileReader ? new u3.Promise(function(t4, r5) {
                var e5 = new FileReader();
                e5.onload = function(e6) {
                  t4(e6.target.result);
                }, e5.onerror = function(e6) {
                  r5(e6.target.error);
                }, e5.readAsArrayBuffer(n4);
              }) : n4;
            }).then(function(e5) {
              var t4 = a3.getTypeOf(e5);
              return t4 ? ("arraybuffer" === t4 ? e5 = a3.transformTo("uint8array", e5) : "string" === t4 && (s4 ? e5 = h3.decode(e5) : n3 && true !== i4 && (e5 = (function(e6) {
                return l3(e6, o3.uint8array ? new Uint8Array(e6.length) : new Array(e6.length));
              })(e5))), e5) : u3.Promise.reject(new Error("Can't read the data of '" + r4 + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"));
            });
          };
        }, { "./base64": 1, "./external": 6, "./nodejsUtils": 14, "./support": 30, setimmediate: 54 }], 33: [function(e3, t3, r3) {
          "use strict";
          var n2 = e3("./reader/readerFor"), i3 = e3("./utils"), s3 = e3("./signature"), a3 = e3("./zipEntry"), o3 = e3("./support");
          function h3(e4) {
            this.files = [], this.loadOptions = e4;
          }
          h3.prototype = { checkSignature: function(e4) {
            if (!this.reader.readAndCheckSignature(e4)) {
              this.reader.index -= 4;
              var t4 = this.reader.readString(4);
              throw new Error("Corrupted zip or bug: unexpected signature (" + i3.pretty(t4) + ", expected " + i3.pretty(e4) + ")");
            }
          }, isSignature: function(e4, t4) {
            var r4 = this.reader.index;
            this.reader.setIndex(e4);
            var n3 = this.reader.readString(4) === t4;
            return this.reader.setIndex(r4), n3;
          }, readBlockEndOfCentral: function() {
            this.diskNumber = this.reader.readInt(2), this.diskWithCentralDirStart = this.reader.readInt(2), this.centralDirRecordsOnThisDisk = this.reader.readInt(2), this.centralDirRecords = this.reader.readInt(2), this.centralDirSize = this.reader.readInt(4), this.centralDirOffset = this.reader.readInt(4), this.zipCommentLength = this.reader.readInt(2);
            var e4 = this.reader.readData(this.zipCommentLength), t4 = o3.uint8array ? "uint8array" : "array", r4 = i3.transformTo(t4, e4);
            this.zipComment = this.loadOptions.decodeFileName(r4);
          }, readBlockZip64EndOfCentral: function() {
            this.zip64EndOfCentralSize = this.reader.readInt(8), this.reader.skip(4), this.diskNumber = this.reader.readInt(4), this.diskWithCentralDirStart = this.reader.readInt(4), this.centralDirRecordsOnThisDisk = this.reader.readInt(8), this.centralDirRecords = this.reader.readInt(8), this.centralDirSize = this.reader.readInt(8), this.centralDirOffset = this.reader.readInt(8), this.zip64ExtensibleData = {};
            for (var e4, t4, r4, n3 = this.zip64EndOfCentralSize - 44; 0 < n3; ) e4 = this.reader.readInt(2), t4 = this.reader.readInt(4), r4 = this.reader.readData(t4), this.zip64ExtensibleData[e4] = { id: e4, length: t4, value: r4 };
          }, readBlockZip64EndOfCentralLocator: function() {
            if (this.diskWithZip64CentralDirStart = this.reader.readInt(4), this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8), this.disksCount = this.reader.readInt(4), 1 < this.disksCount) throw new Error("Multi-volumes zip are not supported");
          }, readLocalFiles: function() {
            var e4, t4;
            for (e4 = 0; e4 < this.files.length; e4++) t4 = this.files[e4], this.reader.setIndex(t4.localHeaderOffset), this.checkSignature(s3.LOCAL_FILE_HEADER), t4.readLocalPart(this.reader), t4.handleUTF8(), t4.processAttributes();
          }, readCentralDir: function() {
            var e4;
            for (this.reader.setIndex(this.centralDirOffset); this.reader.readAndCheckSignature(s3.CENTRAL_FILE_HEADER); ) (e4 = new a3({ zip64: this.zip64 }, this.loadOptions)).readCentralPart(this.reader), this.files.push(e4);
            if (this.centralDirRecords !== this.files.length && 0 !== this.centralDirRecords && 0 === this.files.length) throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
          }, readEndOfCentral: function() {
            var e4 = this.reader.lastIndexOfSignature(s3.CENTRAL_DIRECTORY_END);
            if (e4 < 0) throw !this.isSignature(0, s3.LOCAL_FILE_HEADER) ? new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html") : new Error("Corrupted zip: can't find end of central directory");
            this.reader.setIndex(e4);
            var t4 = e4;
            if (this.checkSignature(s3.CENTRAL_DIRECTORY_END), this.readBlockEndOfCentral(), this.diskNumber === i3.MAX_VALUE_16BITS || this.diskWithCentralDirStart === i3.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === i3.MAX_VALUE_16BITS || this.centralDirRecords === i3.MAX_VALUE_16BITS || this.centralDirSize === i3.MAX_VALUE_32BITS || this.centralDirOffset === i3.MAX_VALUE_32BITS) {
              if (this.zip64 = true, (e4 = this.reader.lastIndexOfSignature(s3.ZIP64_CENTRAL_DIRECTORY_LOCATOR)) < 0) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
              if (this.reader.setIndex(e4), this.checkSignature(s3.ZIP64_CENTRAL_DIRECTORY_LOCATOR), this.readBlockZip64EndOfCentralLocator(), !this.isSignature(this.relativeOffsetEndOfZip64CentralDir, s3.ZIP64_CENTRAL_DIRECTORY_END) && (this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(s3.ZIP64_CENTRAL_DIRECTORY_END), this.relativeOffsetEndOfZip64CentralDir < 0)) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
              this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir), this.checkSignature(s3.ZIP64_CENTRAL_DIRECTORY_END), this.readBlockZip64EndOfCentral();
            }
            var r4 = this.centralDirOffset + this.centralDirSize;
            this.zip64 && (r4 += 20, r4 += 12 + this.zip64EndOfCentralSize);
            var n3 = t4 - r4;
            if (0 < n3) this.isSignature(t4, s3.CENTRAL_FILE_HEADER) || (this.reader.zero = n3);
            else if (n3 < 0) throw new Error("Corrupted zip: missing " + Math.abs(n3) + " bytes.");
          }, prepareReader: function(e4) {
            this.reader = n2(e4);
          }, load: function(e4) {
            this.prepareReader(e4), this.readEndOfCentral(), this.readCentralDir(), this.readLocalFiles();
          } }, t3.exports = h3;
        }, { "./reader/readerFor": 22, "./signature": 23, "./support": 30, "./utils": 32, "./zipEntry": 34 }], 34: [function(e3, t3, r3) {
          "use strict";
          var n2 = e3("./reader/readerFor"), s3 = e3("./utils"), i3 = e3("./compressedObject"), a3 = e3("./crc32"), o3 = e3("./utf8"), h3 = e3("./compressions"), u3 = e3("./support");
          function l3(e4, t4) {
            this.options = e4, this.loadOptions = t4;
          }
          l3.prototype = { isEncrypted: function() {
            return 1 == (1 & this.bitFlag);
          }, useUTF8: function() {
            return 2048 == (2048 & this.bitFlag);
          }, readLocalPart: function(e4) {
            var t4, r4;
            if (e4.skip(22), this.fileNameLength = e4.readInt(2), r4 = e4.readInt(2), this.fileName = e4.readData(this.fileNameLength), e4.skip(r4), -1 === this.compressedSize || -1 === this.uncompressedSize) throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");
            if (null === (t4 = (function(e5) {
              for (var t5 in h3) if (Object.prototype.hasOwnProperty.call(h3, t5) && h3[t5].magic === e5) return h3[t5];
              return null;
            })(this.compressionMethod))) throw new Error("Corrupted zip : compression " + s3.pretty(this.compressionMethod) + " unknown (inner file : " + s3.transformTo("string", this.fileName) + ")");
            this.decompressed = new i3(this.compressedSize, this.uncompressedSize, this.crc32, t4, e4.readData(this.compressedSize));
          }, readCentralPart: function(e4) {
            this.versionMadeBy = e4.readInt(2), e4.skip(2), this.bitFlag = e4.readInt(2), this.compressionMethod = e4.readString(2), this.date = e4.readDate(), this.crc32 = e4.readInt(4), this.compressedSize = e4.readInt(4), this.uncompressedSize = e4.readInt(4);
            var t4 = e4.readInt(2);
            if (this.extraFieldsLength = e4.readInt(2), this.fileCommentLength = e4.readInt(2), this.diskNumberStart = e4.readInt(2), this.internalFileAttributes = e4.readInt(2), this.externalFileAttributes = e4.readInt(4), this.localHeaderOffset = e4.readInt(4), this.isEncrypted()) throw new Error("Encrypted zip are not supported");
            e4.skip(t4), this.readExtraFields(e4), this.parseZIP64ExtraField(e4), this.fileComment = e4.readData(this.fileCommentLength);
          }, processAttributes: function() {
            this.unixPermissions = null, this.dosPermissions = null;
            var e4 = this.versionMadeBy >> 8;
            this.dir = !!(16 & this.externalFileAttributes), 0 == e4 && (this.dosPermissions = 63 & this.externalFileAttributes), 3 == e4 && (this.unixPermissions = this.externalFileAttributes >> 16 & 65535), this.dir || "/" !== this.fileNameStr.slice(-1) || (this.dir = true);
          }, parseZIP64ExtraField: function() {
            if (this.extraFields[1]) {
              var e4 = n2(this.extraFields[1].value);
              this.uncompressedSize === s3.MAX_VALUE_32BITS && (this.uncompressedSize = e4.readInt(8)), this.compressedSize === s3.MAX_VALUE_32BITS && (this.compressedSize = e4.readInt(8)), this.localHeaderOffset === s3.MAX_VALUE_32BITS && (this.localHeaderOffset = e4.readInt(8)), this.diskNumberStart === s3.MAX_VALUE_32BITS && (this.diskNumberStart = e4.readInt(4));
            }
          }, readExtraFields: function(e4) {
            var t4, r4, n3, i4 = e4.index + this.extraFieldsLength;
            for (this.extraFields || (this.extraFields = {}); e4.index + 4 < i4; ) t4 = e4.readInt(2), r4 = e4.readInt(2), n3 = e4.readData(r4), this.extraFields[t4] = { id: t4, length: r4, value: n3 };
            e4.setIndex(i4);
          }, handleUTF8: function() {
            var e4 = u3.uint8array ? "uint8array" : "array";
            if (this.useUTF8()) this.fileNameStr = o3.utf8decode(this.fileName), this.fileCommentStr = o3.utf8decode(this.fileComment);
            else {
              var t4 = this.findExtraFieldUnicodePath();
              if (null !== t4) this.fileNameStr = t4;
              else {
                var r4 = s3.transformTo(e4, this.fileName);
                this.fileNameStr = this.loadOptions.decodeFileName(r4);
              }
              var n3 = this.findExtraFieldUnicodeComment();
              if (null !== n3) this.fileCommentStr = n3;
              else {
                var i4 = s3.transformTo(e4, this.fileComment);
                this.fileCommentStr = this.loadOptions.decodeFileName(i4);
              }
            }
          }, findExtraFieldUnicodePath: function() {
            var e4 = this.extraFields[28789];
            if (e4) {
              var t4 = n2(e4.value);
              return 1 !== t4.readInt(1) ? null : a3(this.fileName) !== t4.readInt(4) ? null : o3.utf8decode(t4.readData(e4.length - 5));
            }
            return null;
          }, findExtraFieldUnicodeComment: function() {
            var e4 = this.extraFields[25461];
            if (e4) {
              var t4 = n2(e4.value);
              return 1 !== t4.readInt(1) ? null : a3(this.fileComment) !== t4.readInt(4) ? null : o3.utf8decode(t4.readData(e4.length - 5));
            }
            return null;
          } }, t3.exports = l3;
        }, { "./compressedObject": 2, "./compressions": 3, "./crc32": 4, "./reader/readerFor": 22, "./support": 30, "./utf8": 31, "./utils": 32 }], 35: [function(e3, t3, r3) {
          "use strict";
          function n2(e4, t4, r4) {
            this.name = e4, this.dir = r4.dir, this.date = r4.date, this.comment = r4.comment, this.unixPermissions = r4.unixPermissions, this.dosPermissions = r4.dosPermissions, this._data = t4, this._dataBinary = r4.binary, this.options = { compression: r4.compression, compressionOptions: r4.compressionOptions };
          }
          var s3 = e3("./stream/StreamHelper"), i3 = e3("./stream/DataWorker"), a3 = e3("./utf8"), o3 = e3("./compressedObject"), h3 = e3("./stream/GenericWorker");
          n2.prototype = { internalStream: function(e4) {
            var t4 = null, r4 = "string";
            try {
              if (!e4) throw new Error("No output type specified.");
              var n3 = "string" === (r4 = e4.toLowerCase()) || "text" === r4;
              "binarystring" !== r4 && "text" !== r4 || (r4 = "string"), t4 = this._decompressWorker();
              var i4 = !this._dataBinary;
              i4 && !n3 && (t4 = t4.pipe(new a3.Utf8EncodeWorker())), !i4 && n3 && (t4 = t4.pipe(new a3.Utf8DecodeWorker()));
            } catch (e5) {
              (t4 = new h3("error")).error(e5);
            }
            return new s3(t4, r4, "");
          }, async: function(e4, t4) {
            return this.internalStream(e4).accumulate(t4);
          }, nodeStream: function(e4, t4) {
            return this.internalStream(e4 || "nodebuffer").toNodejsStream(t4);
          }, _compressWorker: function(e4, t4) {
            if (this._data instanceof o3 && this._data.compression.magic === e4.magic) return this._data.getCompressedWorker();
            var r4 = this._decompressWorker();
            return this._dataBinary || (r4 = r4.pipe(new a3.Utf8EncodeWorker())), o3.createWorkerFrom(r4, e4, t4);
          }, _decompressWorker: function() {
            return this._data instanceof o3 ? this._data.getContentWorker() : this._data instanceof h3 ? this._data : new i3(this._data);
          } };
          for (var u3 = ["asText", "asBinary", "asNodeBuffer", "asUint8Array", "asArrayBuffer"], l3 = function() {
            throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
          }, f3 = 0; f3 < u3.length; f3++) n2.prototype[u3[f3]] = l3;
          t3.exports = n2;
        }, { "./compressedObject": 2, "./stream/DataWorker": 27, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31 }], 36: [function(e3, l3, t3) {
          (function(t4) {
            "use strict";
            var r3, n2, e4 = t4.MutationObserver || t4.WebKitMutationObserver;
            if (e4) {
              var i3 = 0, s3 = new e4(u3), a3 = t4.document.createTextNode("");
              s3.observe(a3, { characterData: true }), r3 = function() {
                a3.data = i3 = ++i3 % 2;
              };
            } else if (t4.setImmediate || void 0 === t4.MessageChannel) r3 = "document" in t4 && "onreadystatechange" in t4.document.createElement("script") ? function() {
              var e5 = t4.document.createElement("script");
              e5.onreadystatechange = function() {
                u3(), e5.onreadystatechange = null, e5.parentNode.removeChild(e5), e5 = null;
              }, t4.document.documentElement.appendChild(e5);
            } : function() {
              setTimeout(u3, 0);
            };
            else {
              var o3 = new t4.MessageChannel();
              o3.port1.onmessage = u3, r3 = function() {
                o3.port2.postMessage(0);
              };
            }
            var h3 = [];
            function u3() {
              var e5, t5;
              n2 = true;
              for (var r4 = h3.length; r4; ) {
                for (t5 = h3, h3 = [], e5 = -1; ++e5 < r4; ) t5[e5]();
                r4 = h3.length;
              }
              n2 = false;
            }
            l3.exports = function(e5) {
              1 !== h3.push(e5) || n2 || r3();
            };
          }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
        }, {}], 37: [function(e3, t3, r3) {
          "use strict";
          var i3 = e3("immediate");
          function u3() {
          }
          var l3 = {}, s3 = ["REJECTED"], a3 = ["FULFILLED"], n2 = ["PENDING"];
          function o3(e4) {
            if ("function" != typeof e4) throw new TypeError("resolver must be a function");
            this.state = n2, this.queue = [], this.outcome = void 0, e4 !== u3 && d3(this, e4);
          }
          function h3(e4, t4, r4) {
            this.promise = e4, "function" == typeof t4 && (this.onFulfilled = t4, this.callFulfilled = this.otherCallFulfilled), "function" == typeof r4 && (this.onRejected = r4, this.callRejected = this.otherCallRejected);
          }
          function f3(t4, r4, n3) {
            i3(function() {
              var e4;
              try {
                e4 = r4(n3);
              } catch (e5) {
                return l3.reject(t4, e5);
              }
              e4 === t4 ? l3.reject(t4, new TypeError("Cannot resolve promise with itself")) : l3.resolve(t4, e4);
            });
          }
          function c3(e4) {
            var t4 = e4 && e4.then;
            if (e4 && ("object" == typeof e4 || "function" == typeof e4) && "function" == typeof t4) return function() {
              t4.apply(e4, arguments);
            };
          }
          function d3(t4, e4) {
            var r4 = false;
            function n3(e5) {
              r4 || (r4 = true, l3.reject(t4, e5));
            }
            function i4(e5) {
              r4 || (r4 = true, l3.resolve(t4, e5));
            }
            var s4 = p3(function() {
              e4(i4, n3);
            });
            "error" === s4.status && n3(s4.value);
          }
          function p3(e4, t4) {
            var r4 = {};
            try {
              r4.value = e4(t4), r4.status = "success";
            } catch (e5) {
              r4.status = "error", r4.value = e5;
            }
            return r4;
          }
          (t3.exports = o3).prototype.finally = function(t4) {
            if ("function" != typeof t4) return this;
            var r4 = this.constructor;
            return this.then(function(e4) {
              return r4.resolve(t4()).then(function() {
                return e4;
              });
            }, function(e4) {
              return r4.resolve(t4()).then(function() {
                throw e4;
              });
            });
          }, o3.prototype.catch = function(e4) {
            return this.then(null, e4);
          }, o3.prototype.then = function(e4, t4) {
            if ("function" != typeof e4 && this.state === a3 || "function" != typeof t4 && this.state === s3) return this;
            var r4 = new this.constructor(u3);
            this.state !== n2 ? f3(r4, this.state === a3 ? e4 : t4, this.outcome) : this.queue.push(new h3(r4, e4, t4));
            return r4;
          }, h3.prototype.callFulfilled = function(e4) {
            l3.resolve(this.promise, e4);
          }, h3.prototype.otherCallFulfilled = function(e4) {
            f3(this.promise, this.onFulfilled, e4);
          }, h3.prototype.callRejected = function(e4) {
            l3.reject(this.promise, e4);
          }, h3.prototype.otherCallRejected = function(e4) {
            f3(this.promise, this.onRejected, e4);
          }, l3.resolve = function(e4, t4) {
            var r4 = p3(c3, t4);
            if ("error" === r4.status) return l3.reject(e4, r4.value);
            var n3 = r4.value;
            if (n3) d3(e4, n3);
            else {
              e4.state = a3, e4.outcome = t4;
              for (var i4 = -1, s4 = e4.queue.length; ++i4 < s4; ) e4.queue[i4].callFulfilled(t4);
            }
            return e4;
          }, l3.reject = function(e4, t4) {
            e4.state = s3, e4.outcome = t4;
            for (var r4 = -1, n3 = e4.queue.length; ++r4 < n3; ) e4.queue[r4].callRejected(t4);
            return e4;
          }, o3.resolve = function(e4) {
            if (e4 instanceof this) return e4;
            return l3.resolve(new this(u3), e4);
          }, o3.reject = function(e4) {
            var t4 = new this(u3);
            return l3.reject(t4, e4);
          }, o3.all = function(e4) {
            var r4 = this;
            if ("[object Array]" !== Object.prototype.toString.call(e4)) return this.reject(new TypeError("must be an array"));
            var n3 = e4.length, i4 = false;
            if (!n3) return this.resolve([]);
            var s4 = new Array(n3), a4 = 0, t4 = -1, o4 = new this(u3);
            for (; ++t4 < n3; ) h4(e4[t4], t4);
            return o4;
            function h4(e5, t5) {
              r4.resolve(e5).then(function(e6) {
                s4[t5] = e6, ++a4 !== n3 || i4 || (i4 = true, l3.resolve(o4, s4));
              }, function(e6) {
                i4 || (i4 = true, l3.reject(o4, e6));
              });
            }
          }, o3.race = function(e4) {
            var t4 = this;
            if ("[object Array]" !== Object.prototype.toString.call(e4)) return this.reject(new TypeError("must be an array"));
            var r4 = e4.length, n3 = false;
            if (!r4) return this.resolve([]);
            var i4 = -1, s4 = new this(u3);
            for (; ++i4 < r4; ) a4 = e4[i4], t4.resolve(a4).then(function(e5) {
              n3 || (n3 = true, l3.resolve(s4, e5));
            }, function(e5) {
              n3 || (n3 = true, l3.reject(s4, e5));
            });
            var a4;
            return s4;
          };
        }, { immediate: 36 }], 38: [function(e3, t3, r3) {
          "use strict";
          var n2 = {};
          (0, e3("./lib/utils/common").assign)(n2, e3("./lib/deflate"), e3("./lib/inflate"), e3("./lib/zlib/constants")), t3.exports = n2;
        }, { "./lib/deflate": 39, "./lib/inflate": 40, "./lib/utils/common": 41, "./lib/zlib/constants": 44 }], 39: [function(e3, t3, r3) {
          "use strict";
          var a3 = e3("./zlib/deflate"), o3 = e3("./utils/common"), h3 = e3("./utils/strings"), i3 = e3("./zlib/messages"), s3 = e3("./zlib/zstream"), u3 = Object.prototype.toString, l3 = 0, f3 = -1, c3 = 0, d3 = 8;
          function p3(e4) {
            if (!(this instanceof p3)) return new p3(e4);
            this.options = o3.assign({ level: f3, method: d3, chunkSize: 16384, windowBits: 15, memLevel: 8, strategy: c3, to: "" }, e4 || {});
            var t4 = this.options;
            t4.raw && 0 < t4.windowBits ? t4.windowBits = -t4.windowBits : t4.gzip && 0 < t4.windowBits && t4.windowBits < 16 && (t4.windowBits += 16), this.err = 0, this.msg = "", this.ended = false, this.chunks = [], this.strm = new s3(), this.strm.avail_out = 0;
            var r4 = a3.deflateInit2(this.strm, t4.level, t4.method, t4.windowBits, t4.memLevel, t4.strategy);
            if (r4 !== l3) throw new Error(i3[r4]);
            if (t4.header && a3.deflateSetHeader(this.strm, t4.header), t4.dictionary) {
              var n3;
              if (n3 = "string" == typeof t4.dictionary ? h3.string2buf(t4.dictionary) : "[object ArrayBuffer]" === u3.call(t4.dictionary) ? new Uint8Array(t4.dictionary) : t4.dictionary, (r4 = a3.deflateSetDictionary(this.strm, n3)) !== l3) throw new Error(i3[r4]);
              this._dict_set = true;
            }
          }
          function n2(e4, t4) {
            var r4 = new p3(t4);
            if (r4.push(e4, true), r4.err) throw r4.msg || i3[r4.err];
            return r4.result;
          }
          p3.prototype.push = function(e4, t4) {
            var r4, n3, i4 = this.strm, s4 = this.options.chunkSize;
            if (this.ended) return false;
            n3 = t4 === ~~t4 ? t4 : true === t4 ? 4 : 0, "string" == typeof e4 ? i4.input = h3.string2buf(e4) : "[object ArrayBuffer]" === u3.call(e4) ? i4.input = new Uint8Array(e4) : i4.input = e4, i4.next_in = 0, i4.avail_in = i4.input.length;
            do {
              if (0 === i4.avail_out && (i4.output = new o3.Buf8(s4), i4.next_out = 0, i4.avail_out = s4), 1 !== (r4 = a3.deflate(i4, n3)) && r4 !== l3) return this.onEnd(r4), !(this.ended = true);
              0 !== i4.avail_out && (0 !== i4.avail_in || 4 !== n3 && 2 !== n3) || ("string" === this.options.to ? this.onData(h3.buf2binstring(o3.shrinkBuf(i4.output, i4.next_out))) : this.onData(o3.shrinkBuf(i4.output, i4.next_out)));
            } while ((0 < i4.avail_in || 0 === i4.avail_out) && 1 !== r4);
            return 4 === n3 ? (r4 = a3.deflateEnd(this.strm), this.onEnd(r4), this.ended = true, r4 === l3) : 2 !== n3 || (this.onEnd(l3), !(i4.avail_out = 0));
          }, p3.prototype.onData = function(e4) {
            this.chunks.push(e4);
          }, p3.prototype.onEnd = function(e4) {
            e4 === l3 && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = o3.flattenChunks(this.chunks)), this.chunks = [], this.err = e4, this.msg = this.strm.msg;
          }, r3.Deflate = p3, r3.deflate = n2, r3.deflateRaw = function(e4, t4) {
            return (t4 = t4 || {}).raw = true, n2(e4, t4);
          }, r3.gzip = function(e4, t4) {
            return (t4 = t4 || {}).gzip = true, n2(e4, t4);
          };
        }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/deflate": 46, "./zlib/messages": 51, "./zlib/zstream": 53 }], 40: [function(e3, t3, r3) {
          "use strict";
          var c3 = e3("./zlib/inflate"), d3 = e3("./utils/common"), p3 = e3("./utils/strings"), m3 = e3("./zlib/constants"), n2 = e3("./zlib/messages"), i3 = e3("./zlib/zstream"), s3 = e3("./zlib/gzheader"), _2 = Object.prototype.toString;
          function a3(e4) {
            if (!(this instanceof a3)) return new a3(e4);
            this.options = d3.assign({ chunkSize: 16384, windowBits: 0, to: "" }, e4 || {});
            var t4 = this.options;
            t4.raw && 0 <= t4.windowBits && t4.windowBits < 16 && (t4.windowBits = -t4.windowBits, 0 === t4.windowBits && (t4.windowBits = -15)), !(0 <= t4.windowBits && t4.windowBits < 16) || e4 && e4.windowBits || (t4.windowBits += 32), 15 < t4.windowBits && t4.windowBits < 48 && 0 == (15 & t4.windowBits) && (t4.windowBits |= 15), this.err = 0, this.msg = "", this.ended = false, this.chunks = [], this.strm = new i3(), this.strm.avail_out = 0;
            var r4 = c3.inflateInit2(this.strm, t4.windowBits);
            if (r4 !== m3.Z_OK) throw new Error(n2[r4]);
            this.header = new s3(), c3.inflateGetHeader(this.strm, this.header);
          }
          function o3(e4, t4) {
            var r4 = new a3(t4);
            if (r4.push(e4, true), r4.err) throw r4.msg || n2[r4.err];
            return r4.result;
          }
          a3.prototype.push = function(e4, t4) {
            var r4, n3, i4, s4, a4, o4, h3 = this.strm, u3 = this.options.chunkSize, l3 = this.options.dictionary, f3 = false;
            if (this.ended) return false;
            n3 = t4 === ~~t4 ? t4 : true === t4 ? m3.Z_FINISH : m3.Z_NO_FLUSH, "string" == typeof e4 ? h3.input = p3.binstring2buf(e4) : "[object ArrayBuffer]" === _2.call(e4) ? h3.input = new Uint8Array(e4) : h3.input = e4, h3.next_in = 0, h3.avail_in = h3.input.length;
            do {
              if (0 === h3.avail_out && (h3.output = new d3.Buf8(u3), h3.next_out = 0, h3.avail_out = u3), (r4 = c3.inflate(h3, m3.Z_NO_FLUSH)) === m3.Z_NEED_DICT && l3 && (o4 = "string" == typeof l3 ? p3.string2buf(l3) : "[object ArrayBuffer]" === _2.call(l3) ? new Uint8Array(l3) : l3, r4 = c3.inflateSetDictionary(this.strm, o4)), r4 === m3.Z_BUF_ERROR && true === f3 && (r4 = m3.Z_OK, f3 = false), r4 !== m3.Z_STREAM_END && r4 !== m3.Z_OK) return this.onEnd(r4), !(this.ended = true);
              h3.next_out && (0 !== h3.avail_out && r4 !== m3.Z_STREAM_END && (0 !== h3.avail_in || n3 !== m3.Z_FINISH && n3 !== m3.Z_SYNC_FLUSH) || ("string" === this.options.to ? (i4 = p3.utf8border(h3.output, h3.next_out), s4 = h3.next_out - i4, a4 = p3.buf2string(h3.output, i4), h3.next_out = s4, h3.avail_out = u3 - s4, s4 && d3.arraySet(h3.output, h3.output, i4, s4, 0), this.onData(a4)) : this.onData(d3.shrinkBuf(h3.output, h3.next_out)))), 0 === h3.avail_in && 0 === h3.avail_out && (f3 = true);
            } while ((0 < h3.avail_in || 0 === h3.avail_out) && r4 !== m3.Z_STREAM_END);
            return r4 === m3.Z_STREAM_END && (n3 = m3.Z_FINISH), n3 === m3.Z_FINISH ? (r4 = c3.inflateEnd(this.strm), this.onEnd(r4), this.ended = true, r4 === m3.Z_OK) : n3 !== m3.Z_SYNC_FLUSH || (this.onEnd(m3.Z_OK), !(h3.avail_out = 0));
          }, a3.prototype.onData = function(e4) {
            this.chunks.push(e4);
          }, a3.prototype.onEnd = function(e4) {
            e4 === m3.Z_OK && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = d3.flattenChunks(this.chunks)), this.chunks = [], this.err = e4, this.msg = this.strm.msg;
          }, r3.Inflate = a3, r3.inflate = o3, r3.inflateRaw = function(e4, t4) {
            return (t4 = t4 || {}).raw = true, o3(e4, t4);
          }, r3.ungzip = o3;
        }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/constants": 44, "./zlib/gzheader": 47, "./zlib/inflate": 49, "./zlib/messages": 51, "./zlib/zstream": 53 }], 41: [function(e3, t3, r3) {
          "use strict";
          var n2 = "undefined" != typeof Uint8Array && "undefined" != typeof Uint16Array && "undefined" != typeof Int32Array;
          r3.assign = function(e4) {
            for (var t4 = Array.prototype.slice.call(arguments, 1); t4.length; ) {
              var r4 = t4.shift();
              if (r4) {
                if ("object" != typeof r4) throw new TypeError(r4 + "must be non-object");
                for (var n3 in r4) r4.hasOwnProperty(n3) && (e4[n3] = r4[n3]);
              }
            }
            return e4;
          }, r3.shrinkBuf = function(e4, t4) {
            return e4.length === t4 ? e4 : e4.subarray ? e4.subarray(0, t4) : (e4.length = t4, e4);
          };
          var i3 = { arraySet: function(e4, t4, r4, n3, i4) {
            if (t4.subarray && e4.subarray) e4.set(t4.subarray(r4, r4 + n3), i4);
            else for (var s4 = 0; s4 < n3; s4++) e4[i4 + s4] = t4[r4 + s4];
          }, flattenChunks: function(e4) {
            var t4, r4, n3, i4, s4, a3;
            for (t4 = n3 = 0, r4 = e4.length; t4 < r4; t4++) n3 += e4[t4].length;
            for (a3 = new Uint8Array(n3), t4 = i4 = 0, r4 = e4.length; t4 < r4; t4++) s4 = e4[t4], a3.set(s4, i4), i4 += s4.length;
            return a3;
          } }, s3 = { arraySet: function(e4, t4, r4, n3, i4) {
            for (var s4 = 0; s4 < n3; s4++) e4[i4 + s4] = t4[r4 + s4];
          }, flattenChunks: function(e4) {
            return [].concat.apply([], e4);
          } };
          r3.setTyped = function(e4) {
            e4 ? (r3.Buf8 = Uint8Array, r3.Buf16 = Uint16Array, r3.Buf32 = Int32Array, r3.assign(r3, i3)) : (r3.Buf8 = Array, r3.Buf16 = Array, r3.Buf32 = Array, r3.assign(r3, s3));
          }, r3.setTyped(n2);
        }, {}], 42: [function(e3, t3, r3) {
          "use strict";
          var h3 = e3("./common"), i3 = true, s3 = true;
          try {
            String.fromCharCode.apply(null, [0]);
          } catch (e4) {
            i3 = false;
          }
          try {
            String.fromCharCode.apply(null, new Uint8Array(1));
          } catch (e4) {
            s3 = false;
          }
          for (var u3 = new h3.Buf8(256), n2 = 0; n2 < 256; n2++) u3[n2] = 252 <= n2 ? 6 : 248 <= n2 ? 5 : 240 <= n2 ? 4 : 224 <= n2 ? 3 : 192 <= n2 ? 2 : 1;
          function l3(e4, t4) {
            if (t4 < 65537 && (e4.subarray && s3 || !e4.subarray && i3)) return String.fromCharCode.apply(null, h3.shrinkBuf(e4, t4));
            for (var r4 = "", n3 = 0; n3 < t4; n3++) r4 += String.fromCharCode(e4[n3]);
            return r4;
          }
          u3[254] = u3[254] = 1, r3.string2buf = function(e4) {
            var t4, r4, n3, i4, s4, a3 = e4.length, o3 = 0;
            for (i4 = 0; i4 < a3; i4++) 55296 == (64512 & (r4 = e4.charCodeAt(i4))) && i4 + 1 < a3 && 56320 == (64512 & (n3 = e4.charCodeAt(i4 + 1))) && (r4 = 65536 + (r4 - 55296 << 10) + (n3 - 56320), i4++), o3 += r4 < 128 ? 1 : r4 < 2048 ? 2 : r4 < 65536 ? 3 : 4;
            for (t4 = new h3.Buf8(o3), i4 = s4 = 0; s4 < o3; i4++) 55296 == (64512 & (r4 = e4.charCodeAt(i4))) && i4 + 1 < a3 && 56320 == (64512 & (n3 = e4.charCodeAt(i4 + 1))) && (r4 = 65536 + (r4 - 55296 << 10) + (n3 - 56320), i4++), r4 < 128 ? t4[s4++] = r4 : (r4 < 2048 ? t4[s4++] = 192 | r4 >>> 6 : (r4 < 65536 ? t4[s4++] = 224 | r4 >>> 12 : (t4[s4++] = 240 | r4 >>> 18, t4[s4++] = 128 | r4 >>> 12 & 63), t4[s4++] = 128 | r4 >>> 6 & 63), t4[s4++] = 128 | 63 & r4);
            return t4;
          }, r3.buf2binstring = function(e4) {
            return l3(e4, e4.length);
          }, r3.binstring2buf = function(e4) {
            for (var t4 = new h3.Buf8(e4.length), r4 = 0, n3 = t4.length; r4 < n3; r4++) t4[r4] = e4.charCodeAt(r4);
            return t4;
          }, r3.buf2string = function(e4, t4) {
            var r4, n3, i4, s4, a3 = t4 || e4.length, o3 = new Array(2 * a3);
            for (r4 = n3 = 0; r4 < a3; ) if ((i4 = e4[r4++]) < 128) o3[n3++] = i4;
            else if (4 < (s4 = u3[i4])) o3[n3++] = 65533, r4 += s4 - 1;
            else {
              for (i4 &= 2 === s4 ? 31 : 3 === s4 ? 15 : 7; 1 < s4 && r4 < a3; ) i4 = i4 << 6 | 63 & e4[r4++], s4--;
              1 < s4 ? o3[n3++] = 65533 : i4 < 65536 ? o3[n3++] = i4 : (i4 -= 65536, o3[n3++] = 55296 | i4 >> 10 & 1023, o3[n3++] = 56320 | 1023 & i4);
            }
            return l3(o3, n3);
          }, r3.utf8border = function(e4, t4) {
            var r4;
            for ((t4 = t4 || e4.length) > e4.length && (t4 = e4.length), r4 = t4 - 1; 0 <= r4 && 128 == (192 & e4[r4]); ) r4--;
            return r4 < 0 ? t4 : 0 === r4 ? t4 : r4 + u3[e4[r4]] > t4 ? r4 : t4;
          };
        }, { "./common": 41 }], 43: [function(e3, t3, r3) {
          "use strict";
          t3.exports = function(e4, t4, r4, n2) {
            for (var i3 = 65535 & e4 | 0, s3 = e4 >>> 16 & 65535 | 0, a3 = 0; 0 !== r4; ) {
              for (r4 -= a3 = 2e3 < r4 ? 2e3 : r4; s3 = s3 + (i3 = i3 + t4[n2++] | 0) | 0, --a3; ) ;
              i3 %= 65521, s3 %= 65521;
            }
            return i3 | s3 << 16 | 0;
          };
        }, {}], 44: [function(e3, t3, r3) {
          "use strict";
          t3.exports = { Z_NO_FLUSH: 0, Z_PARTIAL_FLUSH: 1, Z_SYNC_FLUSH: 2, Z_FULL_FLUSH: 3, Z_FINISH: 4, Z_BLOCK: 5, Z_TREES: 6, Z_OK: 0, Z_STREAM_END: 1, Z_NEED_DICT: 2, Z_ERRNO: -1, Z_STREAM_ERROR: -2, Z_DATA_ERROR: -3, Z_BUF_ERROR: -5, Z_NO_COMPRESSION: 0, Z_BEST_SPEED: 1, Z_BEST_COMPRESSION: 9, Z_DEFAULT_COMPRESSION: -1, Z_FILTERED: 1, Z_HUFFMAN_ONLY: 2, Z_RLE: 3, Z_FIXED: 4, Z_DEFAULT_STRATEGY: 0, Z_BINARY: 0, Z_TEXT: 1, Z_UNKNOWN: 2, Z_DEFLATED: 8 };
        }, {}], 45: [function(e3, t3, r3) {
          "use strict";
          var o3 = (function() {
            for (var e4, t4 = [], r4 = 0; r4 < 256; r4++) {
              e4 = r4;
              for (var n2 = 0; n2 < 8; n2++) e4 = 1 & e4 ? 3988292384 ^ e4 >>> 1 : e4 >>> 1;
              t4[r4] = e4;
            }
            return t4;
          })();
          t3.exports = function(e4, t4, r4, n2) {
            var i3 = o3, s3 = n2 + r4;
            e4 ^= -1;
            for (var a3 = n2; a3 < s3; a3++) e4 = e4 >>> 8 ^ i3[255 & (e4 ^ t4[a3])];
            return -1 ^ e4;
          };
        }, {}], 46: [function(e3, t3, r3) {
          "use strict";
          var h3, c3 = e3("../utils/common"), u3 = e3("./trees"), d3 = e3("./adler32"), p3 = e3("./crc32"), n2 = e3("./messages"), l3 = 0, f3 = 4, m3 = 0, _2 = -2, g3 = -1, b3 = 4, i3 = 2, v3 = 8, y3 = 9, s3 = 286, a3 = 30, o3 = 19, w3 = 2 * s3 + 1, k3 = 15, x3 = 3, S2 = 258, z2 = S2 + x3 + 1, C2 = 42, E = 113, A2 = 1, I2 = 2, O2 = 3, B = 4;
          function R(e4, t4) {
            return e4.msg = n2[t4], t4;
          }
          function T2(e4) {
            return (e4 << 1) - (4 < e4 ? 9 : 0);
          }
          function D(e4) {
            for (var t4 = e4.length; 0 <= --t4; ) e4[t4] = 0;
          }
          function F2(e4) {
            var t4 = e4.state, r4 = t4.pending;
            r4 > e4.avail_out && (r4 = e4.avail_out), 0 !== r4 && (c3.arraySet(e4.output, t4.pending_buf, t4.pending_out, r4, e4.next_out), e4.next_out += r4, t4.pending_out += r4, e4.total_out += r4, e4.avail_out -= r4, t4.pending -= r4, 0 === t4.pending && (t4.pending_out = 0));
          }
          function N2(e4, t4) {
            u3._tr_flush_block(e4, 0 <= e4.block_start ? e4.block_start : -1, e4.strstart - e4.block_start, t4), e4.block_start = e4.strstart, F2(e4.strm);
          }
          function U(e4, t4) {
            e4.pending_buf[e4.pending++] = t4;
          }
          function P2(e4, t4) {
            e4.pending_buf[e4.pending++] = t4 >>> 8 & 255, e4.pending_buf[e4.pending++] = 255 & t4;
          }
          function L2(e4, t4) {
            var r4, n3, i4 = e4.max_chain_length, s4 = e4.strstart, a4 = e4.prev_length, o4 = e4.nice_match, h4 = e4.strstart > e4.w_size - z2 ? e4.strstart - (e4.w_size - z2) : 0, u4 = e4.window, l4 = e4.w_mask, f4 = e4.prev, c4 = e4.strstart + S2, d4 = u4[s4 + a4 - 1], p4 = u4[s4 + a4];
            e4.prev_length >= e4.good_match && (i4 >>= 2), o4 > e4.lookahead && (o4 = e4.lookahead);
            do {
              if (u4[(r4 = t4) + a4] === p4 && u4[r4 + a4 - 1] === d4 && u4[r4] === u4[s4] && u4[++r4] === u4[s4 + 1]) {
                s4 += 2, r4++;
                do {
                } while (u4[++s4] === u4[++r4] && u4[++s4] === u4[++r4] && u4[++s4] === u4[++r4] && u4[++s4] === u4[++r4] && u4[++s4] === u4[++r4] && u4[++s4] === u4[++r4] && u4[++s4] === u4[++r4] && u4[++s4] === u4[++r4] && s4 < c4);
                if (n3 = S2 - (c4 - s4), s4 = c4 - S2, a4 < n3) {
                  if (e4.match_start = t4, o4 <= (a4 = n3)) break;
                  d4 = u4[s4 + a4 - 1], p4 = u4[s4 + a4];
                }
              }
            } while ((t4 = f4[t4 & l4]) > h4 && 0 != --i4);
            return a4 <= e4.lookahead ? a4 : e4.lookahead;
          }
          function j3(e4) {
            var t4, r4, n3, i4, s4, a4, o4, h4, u4, l4, f4 = e4.w_size;
            do {
              if (i4 = e4.window_size - e4.lookahead - e4.strstart, e4.strstart >= f4 + (f4 - z2)) {
                for (c3.arraySet(e4.window, e4.window, f4, f4, 0), e4.match_start -= f4, e4.strstart -= f4, e4.block_start -= f4, t4 = r4 = e4.hash_size; n3 = e4.head[--t4], e4.head[t4] = f4 <= n3 ? n3 - f4 : 0, --r4; ) ;
                for (t4 = r4 = f4; n3 = e4.prev[--t4], e4.prev[t4] = f4 <= n3 ? n3 - f4 : 0, --r4; ) ;
                i4 += f4;
              }
              if (0 === e4.strm.avail_in) break;
              if (a4 = e4.strm, o4 = e4.window, h4 = e4.strstart + e4.lookahead, u4 = i4, l4 = void 0, l4 = a4.avail_in, u4 < l4 && (l4 = u4), r4 = 0 === l4 ? 0 : (a4.avail_in -= l4, c3.arraySet(o4, a4.input, a4.next_in, l4, h4), 1 === a4.state.wrap ? a4.adler = d3(a4.adler, o4, l4, h4) : 2 === a4.state.wrap && (a4.adler = p3(a4.adler, o4, l4, h4)), a4.next_in += l4, a4.total_in += l4, l4), e4.lookahead += r4, e4.lookahead + e4.insert >= x3) for (s4 = e4.strstart - e4.insert, e4.ins_h = e4.window[s4], e4.ins_h = (e4.ins_h << e4.hash_shift ^ e4.window[s4 + 1]) & e4.hash_mask; e4.insert && (e4.ins_h = (e4.ins_h << e4.hash_shift ^ e4.window[s4 + x3 - 1]) & e4.hash_mask, e4.prev[s4 & e4.w_mask] = e4.head[e4.ins_h], e4.head[e4.ins_h] = s4, s4++, e4.insert--, !(e4.lookahead + e4.insert < x3)); ) ;
            } while (e4.lookahead < z2 && 0 !== e4.strm.avail_in);
          }
          function Z(e4, t4) {
            for (var r4, n3; ; ) {
              if (e4.lookahead < z2) {
                if (j3(e4), e4.lookahead < z2 && t4 === l3) return A2;
                if (0 === e4.lookahead) break;
              }
              if (r4 = 0, e4.lookahead >= x3 && (e4.ins_h = (e4.ins_h << e4.hash_shift ^ e4.window[e4.strstart + x3 - 1]) & e4.hash_mask, r4 = e4.prev[e4.strstart & e4.w_mask] = e4.head[e4.ins_h], e4.head[e4.ins_h] = e4.strstart), 0 !== r4 && e4.strstart - r4 <= e4.w_size - z2 && (e4.match_length = L2(e4, r4)), e4.match_length >= x3) if (n3 = u3._tr_tally(e4, e4.strstart - e4.match_start, e4.match_length - x3), e4.lookahead -= e4.match_length, e4.match_length <= e4.max_lazy_match && e4.lookahead >= x3) {
                for (e4.match_length--; e4.strstart++, e4.ins_h = (e4.ins_h << e4.hash_shift ^ e4.window[e4.strstart + x3 - 1]) & e4.hash_mask, r4 = e4.prev[e4.strstart & e4.w_mask] = e4.head[e4.ins_h], e4.head[e4.ins_h] = e4.strstart, 0 != --e4.match_length; ) ;
                e4.strstart++;
              } else e4.strstart += e4.match_length, e4.match_length = 0, e4.ins_h = e4.window[e4.strstart], e4.ins_h = (e4.ins_h << e4.hash_shift ^ e4.window[e4.strstart + 1]) & e4.hash_mask;
              else n3 = u3._tr_tally(e4, 0, e4.window[e4.strstart]), e4.lookahead--, e4.strstart++;
              if (n3 && (N2(e4, false), 0 === e4.strm.avail_out)) return A2;
            }
            return e4.insert = e4.strstart < x3 - 1 ? e4.strstart : x3 - 1, t4 === f3 ? (N2(e4, true), 0 === e4.strm.avail_out ? O2 : B) : e4.last_lit && (N2(e4, false), 0 === e4.strm.avail_out) ? A2 : I2;
          }
          function W(e4, t4) {
            for (var r4, n3, i4; ; ) {
              if (e4.lookahead < z2) {
                if (j3(e4), e4.lookahead < z2 && t4 === l3) return A2;
                if (0 === e4.lookahead) break;
              }
              if (r4 = 0, e4.lookahead >= x3 && (e4.ins_h = (e4.ins_h << e4.hash_shift ^ e4.window[e4.strstart + x3 - 1]) & e4.hash_mask, r4 = e4.prev[e4.strstart & e4.w_mask] = e4.head[e4.ins_h], e4.head[e4.ins_h] = e4.strstart), e4.prev_length = e4.match_length, e4.prev_match = e4.match_start, e4.match_length = x3 - 1, 0 !== r4 && e4.prev_length < e4.max_lazy_match && e4.strstart - r4 <= e4.w_size - z2 && (e4.match_length = L2(e4, r4), e4.match_length <= 5 && (1 === e4.strategy || e4.match_length === x3 && 4096 < e4.strstart - e4.match_start) && (e4.match_length = x3 - 1)), e4.prev_length >= x3 && e4.match_length <= e4.prev_length) {
                for (i4 = e4.strstart + e4.lookahead - x3, n3 = u3._tr_tally(e4, e4.strstart - 1 - e4.prev_match, e4.prev_length - x3), e4.lookahead -= e4.prev_length - 1, e4.prev_length -= 2; ++e4.strstart <= i4 && (e4.ins_h = (e4.ins_h << e4.hash_shift ^ e4.window[e4.strstart + x3 - 1]) & e4.hash_mask, r4 = e4.prev[e4.strstart & e4.w_mask] = e4.head[e4.ins_h], e4.head[e4.ins_h] = e4.strstart), 0 != --e4.prev_length; ) ;
                if (e4.match_available = 0, e4.match_length = x3 - 1, e4.strstart++, n3 && (N2(e4, false), 0 === e4.strm.avail_out)) return A2;
              } else if (e4.match_available) {
                if ((n3 = u3._tr_tally(e4, 0, e4.window[e4.strstart - 1])) && N2(e4, false), e4.strstart++, e4.lookahead--, 0 === e4.strm.avail_out) return A2;
              } else e4.match_available = 1, e4.strstart++, e4.lookahead--;
            }
            return e4.match_available && (n3 = u3._tr_tally(e4, 0, e4.window[e4.strstart - 1]), e4.match_available = 0), e4.insert = e4.strstart < x3 - 1 ? e4.strstart : x3 - 1, t4 === f3 ? (N2(e4, true), 0 === e4.strm.avail_out ? O2 : B) : e4.last_lit && (N2(e4, false), 0 === e4.strm.avail_out) ? A2 : I2;
          }
          function M2(e4, t4, r4, n3, i4) {
            this.good_length = e4, this.max_lazy = t4, this.nice_length = r4, this.max_chain = n3, this.func = i4;
          }
          function H2() {
            this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = v3, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new c3.Buf16(2 * w3), this.dyn_dtree = new c3.Buf16(2 * (2 * a3 + 1)), this.bl_tree = new c3.Buf16(2 * (2 * o3 + 1)), D(this.dyn_ltree), D(this.dyn_dtree), D(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new c3.Buf16(k3 + 1), this.heap = new c3.Buf16(2 * s3 + 1), D(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new c3.Buf16(2 * s3 + 1), D(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
          }
          function G(e4) {
            var t4;
            return e4 && e4.state ? (e4.total_in = e4.total_out = 0, e4.data_type = i3, (t4 = e4.state).pending = 0, t4.pending_out = 0, t4.wrap < 0 && (t4.wrap = -t4.wrap), t4.status = t4.wrap ? C2 : E, e4.adler = 2 === t4.wrap ? 0 : 1, t4.last_flush = l3, u3._tr_init(t4), m3) : R(e4, _2);
          }
          function K(e4) {
            var t4 = G(e4);
            return t4 === m3 && (function(e5) {
              e5.window_size = 2 * e5.w_size, D(e5.head), e5.max_lazy_match = h3[e5.level].max_lazy, e5.good_match = h3[e5.level].good_length, e5.nice_match = h3[e5.level].nice_length, e5.max_chain_length = h3[e5.level].max_chain, e5.strstart = 0, e5.block_start = 0, e5.lookahead = 0, e5.insert = 0, e5.match_length = e5.prev_length = x3 - 1, e5.match_available = 0, e5.ins_h = 0;
            })(e4.state), t4;
          }
          function Y(e4, t4, r4, n3, i4, s4) {
            if (!e4) return _2;
            var a4 = 1;
            if (t4 === g3 && (t4 = 6), n3 < 0 ? (a4 = 0, n3 = -n3) : 15 < n3 && (a4 = 2, n3 -= 16), i4 < 1 || y3 < i4 || r4 !== v3 || n3 < 8 || 15 < n3 || t4 < 0 || 9 < t4 || s4 < 0 || b3 < s4) return R(e4, _2);
            8 === n3 && (n3 = 9);
            var o4 = new H2();
            return (e4.state = o4).strm = e4, o4.wrap = a4, o4.gzhead = null, o4.w_bits = n3, o4.w_size = 1 << o4.w_bits, o4.w_mask = o4.w_size - 1, o4.hash_bits = i4 + 7, o4.hash_size = 1 << o4.hash_bits, o4.hash_mask = o4.hash_size - 1, o4.hash_shift = ~~((o4.hash_bits + x3 - 1) / x3), o4.window = new c3.Buf8(2 * o4.w_size), o4.head = new c3.Buf16(o4.hash_size), o4.prev = new c3.Buf16(o4.w_size), o4.lit_bufsize = 1 << i4 + 6, o4.pending_buf_size = 4 * o4.lit_bufsize, o4.pending_buf = new c3.Buf8(o4.pending_buf_size), o4.d_buf = 1 * o4.lit_bufsize, o4.l_buf = 3 * o4.lit_bufsize, o4.level = t4, o4.strategy = s4, o4.method = r4, K(e4);
          }
          h3 = [new M2(0, 0, 0, 0, function(e4, t4) {
            var r4 = 65535;
            for (r4 > e4.pending_buf_size - 5 && (r4 = e4.pending_buf_size - 5); ; ) {
              if (e4.lookahead <= 1) {
                if (j3(e4), 0 === e4.lookahead && t4 === l3) return A2;
                if (0 === e4.lookahead) break;
              }
              e4.strstart += e4.lookahead, e4.lookahead = 0;
              var n3 = e4.block_start + r4;
              if ((0 === e4.strstart || e4.strstart >= n3) && (e4.lookahead = e4.strstart - n3, e4.strstart = n3, N2(e4, false), 0 === e4.strm.avail_out)) return A2;
              if (e4.strstart - e4.block_start >= e4.w_size - z2 && (N2(e4, false), 0 === e4.strm.avail_out)) return A2;
            }
            return e4.insert = 0, t4 === f3 ? (N2(e4, true), 0 === e4.strm.avail_out ? O2 : B) : (e4.strstart > e4.block_start && (N2(e4, false), e4.strm.avail_out), A2);
          }), new M2(4, 4, 8, 4, Z), new M2(4, 5, 16, 8, Z), new M2(4, 6, 32, 32, Z), new M2(4, 4, 16, 16, W), new M2(8, 16, 32, 32, W), new M2(8, 16, 128, 128, W), new M2(8, 32, 128, 256, W), new M2(32, 128, 258, 1024, W), new M2(32, 258, 258, 4096, W)], r3.deflateInit = function(e4, t4) {
            return Y(e4, t4, v3, 15, 8, 0);
          }, r3.deflateInit2 = Y, r3.deflateReset = K, r3.deflateResetKeep = G, r3.deflateSetHeader = function(e4, t4) {
            return e4 && e4.state ? 2 !== e4.state.wrap ? _2 : (e4.state.gzhead = t4, m3) : _2;
          }, r3.deflate = function(e4, t4) {
            var r4, n3, i4, s4;
            if (!e4 || !e4.state || 5 < t4 || t4 < 0) return e4 ? R(e4, _2) : _2;
            if (n3 = e4.state, !e4.output || !e4.input && 0 !== e4.avail_in || 666 === n3.status && t4 !== f3) return R(e4, 0 === e4.avail_out ? -5 : _2);
            if (n3.strm = e4, r4 = n3.last_flush, n3.last_flush = t4, n3.status === C2) if (2 === n3.wrap) e4.adler = 0, U(n3, 31), U(n3, 139), U(n3, 8), n3.gzhead ? (U(n3, (n3.gzhead.text ? 1 : 0) + (n3.gzhead.hcrc ? 2 : 0) + (n3.gzhead.extra ? 4 : 0) + (n3.gzhead.name ? 8 : 0) + (n3.gzhead.comment ? 16 : 0)), U(n3, 255 & n3.gzhead.time), U(n3, n3.gzhead.time >> 8 & 255), U(n3, n3.gzhead.time >> 16 & 255), U(n3, n3.gzhead.time >> 24 & 255), U(n3, 9 === n3.level ? 2 : 2 <= n3.strategy || n3.level < 2 ? 4 : 0), U(n3, 255 & n3.gzhead.os), n3.gzhead.extra && n3.gzhead.extra.length && (U(n3, 255 & n3.gzhead.extra.length), U(n3, n3.gzhead.extra.length >> 8 & 255)), n3.gzhead.hcrc && (e4.adler = p3(e4.adler, n3.pending_buf, n3.pending, 0)), n3.gzindex = 0, n3.status = 69) : (U(n3, 0), U(n3, 0), U(n3, 0), U(n3, 0), U(n3, 0), U(n3, 9 === n3.level ? 2 : 2 <= n3.strategy || n3.level < 2 ? 4 : 0), U(n3, 3), n3.status = E);
            else {
              var a4 = v3 + (n3.w_bits - 8 << 4) << 8;
              a4 |= (2 <= n3.strategy || n3.level < 2 ? 0 : n3.level < 6 ? 1 : 6 === n3.level ? 2 : 3) << 6, 0 !== n3.strstart && (a4 |= 32), a4 += 31 - a4 % 31, n3.status = E, P2(n3, a4), 0 !== n3.strstart && (P2(n3, e4.adler >>> 16), P2(n3, 65535 & e4.adler)), e4.adler = 1;
            }
            if (69 === n3.status) if (n3.gzhead.extra) {
              for (i4 = n3.pending; n3.gzindex < (65535 & n3.gzhead.extra.length) && (n3.pending !== n3.pending_buf_size || (n3.gzhead.hcrc && n3.pending > i4 && (e4.adler = p3(e4.adler, n3.pending_buf, n3.pending - i4, i4)), F2(e4), i4 = n3.pending, n3.pending !== n3.pending_buf_size)); ) U(n3, 255 & n3.gzhead.extra[n3.gzindex]), n3.gzindex++;
              n3.gzhead.hcrc && n3.pending > i4 && (e4.adler = p3(e4.adler, n3.pending_buf, n3.pending - i4, i4)), n3.gzindex === n3.gzhead.extra.length && (n3.gzindex = 0, n3.status = 73);
            } else n3.status = 73;
            if (73 === n3.status) if (n3.gzhead.name) {
              i4 = n3.pending;
              do {
                if (n3.pending === n3.pending_buf_size && (n3.gzhead.hcrc && n3.pending > i4 && (e4.adler = p3(e4.adler, n3.pending_buf, n3.pending - i4, i4)), F2(e4), i4 = n3.pending, n3.pending === n3.pending_buf_size)) {
                  s4 = 1;
                  break;
                }
                s4 = n3.gzindex < n3.gzhead.name.length ? 255 & n3.gzhead.name.charCodeAt(n3.gzindex++) : 0, U(n3, s4);
              } while (0 !== s4);
              n3.gzhead.hcrc && n3.pending > i4 && (e4.adler = p3(e4.adler, n3.pending_buf, n3.pending - i4, i4)), 0 === s4 && (n3.gzindex = 0, n3.status = 91);
            } else n3.status = 91;
            if (91 === n3.status) if (n3.gzhead.comment) {
              i4 = n3.pending;
              do {
                if (n3.pending === n3.pending_buf_size && (n3.gzhead.hcrc && n3.pending > i4 && (e4.adler = p3(e4.adler, n3.pending_buf, n3.pending - i4, i4)), F2(e4), i4 = n3.pending, n3.pending === n3.pending_buf_size)) {
                  s4 = 1;
                  break;
                }
                s4 = n3.gzindex < n3.gzhead.comment.length ? 255 & n3.gzhead.comment.charCodeAt(n3.gzindex++) : 0, U(n3, s4);
              } while (0 !== s4);
              n3.gzhead.hcrc && n3.pending > i4 && (e4.adler = p3(e4.adler, n3.pending_buf, n3.pending - i4, i4)), 0 === s4 && (n3.status = 103);
            } else n3.status = 103;
            if (103 === n3.status && (n3.gzhead.hcrc ? (n3.pending + 2 > n3.pending_buf_size && F2(e4), n3.pending + 2 <= n3.pending_buf_size && (U(n3, 255 & e4.adler), U(n3, e4.adler >> 8 & 255), e4.adler = 0, n3.status = E)) : n3.status = E), 0 !== n3.pending) {
              if (F2(e4), 0 === e4.avail_out) return n3.last_flush = -1, m3;
            } else if (0 === e4.avail_in && T2(t4) <= T2(r4) && t4 !== f3) return R(e4, -5);
            if (666 === n3.status && 0 !== e4.avail_in) return R(e4, -5);
            if (0 !== e4.avail_in || 0 !== n3.lookahead || t4 !== l3 && 666 !== n3.status) {
              var o4 = 2 === n3.strategy ? (function(e5, t5) {
                for (var r5; ; ) {
                  if (0 === e5.lookahead && (j3(e5), 0 === e5.lookahead)) {
                    if (t5 === l3) return A2;
                    break;
                  }
                  if (e5.match_length = 0, r5 = u3._tr_tally(e5, 0, e5.window[e5.strstart]), e5.lookahead--, e5.strstart++, r5 && (N2(e5, false), 0 === e5.strm.avail_out)) return A2;
                }
                return e5.insert = 0, t5 === f3 ? (N2(e5, true), 0 === e5.strm.avail_out ? O2 : B) : e5.last_lit && (N2(e5, false), 0 === e5.strm.avail_out) ? A2 : I2;
              })(n3, t4) : 3 === n3.strategy ? (function(e5, t5) {
                for (var r5, n4, i5, s5, a5 = e5.window; ; ) {
                  if (e5.lookahead <= S2) {
                    if (j3(e5), e5.lookahead <= S2 && t5 === l3) return A2;
                    if (0 === e5.lookahead) break;
                  }
                  if (e5.match_length = 0, e5.lookahead >= x3 && 0 < e5.strstart && (n4 = a5[i5 = e5.strstart - 1]) === a5[++i5] && n4 === a5[++i5] && n4 === a5[++i5]) {
                    s5 = e5.strstart + S2;
                    do {
                    } while (n4 === a5[++i5] && n4 === a5[++i5] && n4 === a5[++i5] && n4 === a5[++i5] && n4 === a5[++i5] && n4 === a5[++i5] && n4 === a5[++i5] && n4 === a5[++i5] && i5 < s5);
                    e5.match_length = S2 - (s5 - i5), e5.match_length > e5.lookahead && (e5.match_length = e5.lookahead);
                  }
                  if (e5.match_length >= x3 ? (r5 = u3._tr_tally(e5, 1, e5.match_length - x3), e5.lookahead -= e5.match_length, e5.strstart += e5.match_length, e5.match_length = 0) : (r5 = u3._tr_tally(e5, 0, e5.window[e5.strstart]), e5.lookahead--, e5.strstart++), r5 && (N2(e5, false), 0 === e5.strm.avail_out)) return A2;
                }
                return e5.insert = 0, t5 === f3 ? (N2(e5, true), 0 === e5.strm.avail_out ? O2 : B) : e5.last_lit && (N2(e5, false), 0 === e5.strm.avail_out) ? A2 : I2;
              })(n3, t4) : h3[n3.level].func(n3, t4);
              if (o4 !== O2 && o4 !== B || (n3.status = 666), o4 === A2 || o4 === O2) return 0 === e4.avail_out && (n3.last_flush = -1), m3;
              if (o4 === I2 && (1 === t4 ? u3._tr_align(n3) : 5 !== t4 && (u3._tr_stored_block(n3, 0, 0, false), 3 === t4 && (D(n3.head), 0 === n3.lookahead && (n3.strstart = 0, n3.block_start = 0, n3.insert = 0))), F2(e4), 0 === e4.avail_out)) return n3.last_flush = -1, m3;
            }
            return t4 !== f3 ? m3 : n3.wrap <= 0 ? 1 : (2 === n3.wrap ? (U(n3, 255 & e4.adler), U(n3, e4.adler >> 8 & 255), U(n3, e4.adler >> 16 & 255), U(n3, e4.adler >> 24 & 255), U(n3, 255 & e4.total_in), U(n3, e4.total_in >> 8 & 255), U(n3, e4.total_in >> 16 & 255), U(n3, e4.total_in >> 24 & 255)) : (P2(n3, e4.adler >>> 16), P2(n3, 65535 & e4.adler)), F2(e4), 0 < n3.wrap && (n3.wrap = -n3.wrap), 0 !== n3.pending ? m3 : 1);
          }, r3.deflateEnd = function(e4) {
            var t4;
            return e4 && e4.state ? (t4 = e4.state.status) !== C2 && 69 !== t4 && 73 !== t4 && 91 !== t4 && 103 !== t4 && t4 !== E && 666 !== t4 ? R(e4, _2) : (e4.state = null, t4 === E ? R(e4, -3) : m3) : _2;
          }, r3.deflateSetDictionary = function(e4, t4) {
            var r4, n3, i4, s4, a4, o4, h4, u4, l4 = t4.length;
            if (!e4 || !e4.state) return _2;
            if (2 === (s4 = (r4 = e4.state).wrap) || 1 === s4 && r4.status !== C2 || r4.lookahead) return _2;
            for (1 === s4 && (e4.adler = d3(e4.adler, t4, l4, 0)), r4.wrap = 0, l4 >= r4.w_size && (0 === s4 && (D(r4.head), r4.strstart = 0, r4.block_start = 0, r4.insert = 0), u4 = new c3.Buf8(r4.w_size), c3.arraySet(u4, t4, l4 - r4.w_size, r4.w_size, 0), t4 = u4, l4 = r4.w_size), a4 = e4.avail_in, o4 = e4.next_in, h4 = e4.input, e4.avail_in = l4, e4.next_in = 0, e4.input = t4, j3(r4); r4.lookahead >= x3; ) {
              for (n3 = r4.strstart, i4 = r4.lookahead - (x3 - 1); r4.ins_h = (r4.ins_h << r4.hash_shift ^ r4.window[n3 + x3 - 1]) & r4.hash_mask, r4.prev[n3 & r4.w_mask] = r4.head[r4.ins_h], r4.head[r4.ins_h] = n3, n3++, --i4; ) ;
              r4.strstart = n3, r4.lookahead = x3 - 1, j3(r4);
            }
            return r4.strstart += r4.lookahead, r4.block_start = r4.strstart, r4.insert = r4.lookahead, r4.lookahead = 0, r4.match_length = r4.prev_length = x3 - 1, r4.match_available = 0, e4.next_in = o4, e4.input = h4, e4.avail_in = a4, r4.wrap = s4, m3;
          }, r3.deflateInfo = "pako deflate (from Nodeca project)";
        }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./messages": 51, "./trees": 52 }], 47: [function(e3, t3, r3) {
          "use strict";
          t3.exports = function() {
            this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = false;
          };
        }, {}], 48: [function(e3, t3, r3) {
          "use strict";
          t3.exports = function(e4, t4) {
            var r4, n2, i3, s3, a3, o3, h3, u3, l3, f3, c3, d3, p3, m3, _2, g3, b3, v3, y3, w3, k3, x3, S2, z2, C2;
            r4 = e4.state, n2 = e4.next_in, z2 = e4.input, i3 = n2 + (e4.avail_in - 5), s3 = e4.next_out, C2 = e4.output, a3 = s3 - (t4 - e4.avail_out), o3 = s3 + (e4.avail_out - 257), h3 = r4.dmax, u3 = r4.wsize, l3 = r4.whave, f3 = r4.wnext, c3 = r4.window, d3 = r4.hold, p3 = r4.bits, m3 = r4.lencode, _2 = r4.distcode, g3 = (1 << r4.lenbits) - 1, b3 = (1 << r4.distbits) - 1;
            e: do {
              p3 < 15 && (d3 += z2[n2++] << p3, p3 += 8, d3 += z2[n2++] << p3, p3 += 8), v3 = m3[d3 & g3];
              t: for (; ; ) {
                if (d3 >>>= y3 = v3 >>> 24, p3 -= y3, 0 === (y3 = v3 >>> 16 & 255)) C2[s3++] = 65535 & v3;
                else {
                  if (!(16 & y3)) {
                    if (0 == (64 & y3)) {
                      v3 = m3[(65535 & v3) + (d3 & (1 << y3) - 1)];
                      continue t;
                    }
                    if (32 & y3) {
                      r4.mode = 12;
                      break e;
                    }
                    e4.msg = "invalid literal/length code", r4.mode = 30;
                    break e;
                  }
                  w3 = 65535 & v3, (y3 &= 15) && (p3 < y3 && (d3 += z2[n2++] << p3, p3 += 8), w3 += d3 & (1 << y3) - 1, d3 >>>= y3, p3 -= y3), p3 < 15 && (d3 += z2[n2++] << p3, p3 += 8, d3 += z2[n2++] << p3, p3 += 8), v3 = _2[d3 & b3];
                  r: for (; ; ) {
                    if (d3 >>>= y3 = v3 >>> 24, p3 -= y3, !(16 & (y3 = v3 >>> 16 & 255))) {
                      if (0 == (64 & y3)) {
                        v3 = _2[(65535 & v3) + (d3 & (1 << y3) - 1)];
                        continue r;
                      }
                      e4.msg = "invalid distance code", r4.mode = 30;
                      break e;
                    }
                    if (k3 = 65535 & v3, p3 < (y3 &= 15) && (d3 += z2[n2++] << p3, (p3 += 8) < y3 && (d3 += z2[n2++] << p3, p3 += 8)), h3 < (k3 += d3 & (1 << y3) - 1)) {
                      e4.msg = "invalid distance too far back", r4.mode = 30;
                      break e;
                    }
                    if (d3 >>>= y3, p3 -= y3, (y3 = s3 - a3) < k3) {
                      if (l3 < (y3 = k3 - y3) && r4.sane) {
                        e4.msg = "invalid distance too far back", r4.mode = 30;
                        break e;
                      }
                      if (S2 = c3, (x3 = 0) === f3) {
                        if (x3 += u3 - y3, y3 < w3) {
                          for (w3 -= y3; C2[s3++] = c3[x3++], --y3; ) ;
                          x3 = s3 - k3, S2 = C2;
                        }
                      } else if (f3 < y3) {
                        if (x3 += u3 + f3 - y3, (y3 -= f3) < w3) {
                          for (w3 -= y3; C2[s3++] = c3[x3++], --y3; ) ;
                          if (x3 = 0, f3 < w3) {
                            for (w3 -= y3 = f3; C2[s3++] = c3[x3++], --y3; ) ;
                            x3 = s3 - k3, S2 = C2;
                          }
                        }
                      } else if (x3 += f3 - y3, y3 < w3) {
                        for (w3 -= y3; C2[s3++] = c3[x3++], --y3; ) ;
                        x3 = s3 - k3, S2 = C2;
                      }
                      for (; 2 < w3; ) C2[s3++] = S2[x3++], C2[s3++] = S2[x3++], C2[s3++] = S2[x3++], w3 -= 3;
                      w3 && (C2[s3++] = S2[x3++], 1 < w3 && (C2[s3++] = S2[x3++]));
                    } else {
                      for (x3 = s3 - k3; C2[s3++] = C2[x3++], C2[s3++] = C2[x3++], C2[s3++] = C2[x3++], 2 < (w3 -= 3); ) ;
                      w3 && (C2[s3++] = C2[x3++], 1 < w3 && (C2[s3++] = C2[x3++]));
                    }
                    break;
                  }
                }
                break;
              }
            } while (n2 < i3 && s3 < o3);
            n2 -= w3 = p3 >> 3, d3 &= (1 << (p3 -= w3 << 3)) - 1, e4.next_in = n2, e4.next_out = s3, e4.avail_in = n2 < i3 ? i3 - n2 + 5 : 5 - (n2 - i3), e4.avail_out = s3 < o3 ? o3 - s3 + 257 : 257 - (s3 - o3), r4.hold = d3, r4.bits = p3;
          };
        }, {}], 49: [function(e3, t3, r3) {
          "use strict";
          var I2 = e3("../utils/common"), O2 = e3("./adler32"), B = e3("./crc32"), R = e3("./inffast"), T2 = e3("./inftrees"), D = 1, F2 = 2, N2 = 0, U = -2, P2 = 1, n2 = 852, i3 = 592;
          function L2(e4) {
            return (e4 >>> 24 & 255) + (e4 >>> 8 & 65280) + ((65280 & e4) << 8) + ((255 & e4) << 24);
          }
          function s3() {
            this.mode = 0, this.last = false, this.wrap = 0, this.havedict = false, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new I2.Buf16(320), this.work = new I2.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
          }
          function a3(e4) {
            var t4;
            return e4 && e4.state ? (t4 = e4.state, e4.total_in = e4.total_out = t4.total = 0, e4.msg = "", t4.wrap && (e4.adler = 1 & t4.wrap), t4.mode = P2, t4.last = 0, t4.havedict = 0, t4.dmax = 32768, t4.head = null, t4.hold = 0, t4.bits = 0, t4.lencode = t4.lendyn = new I2.Buf32(n2), t4.distcode = t4.distdyn = new I2.Buf32(i3), t4.sane = 1, t4.back = -1, N2) : U;
          }
          function o3(e4) {
            var t4;
            return e4 && e4.state ? ((t4 = e4.state).wsize = 0, t4.whave = 0, t4.wnext = 0, a3(e4)) : U;
          }
          function h3(e4, t4) {
            var r4, n3;
            return e4 && e4.state ? (n3 = e4.state, t4 < 0 ? (r4 = 0, t4 = -t4) : (r4 = 1 + (t4 >> 4), t4 < 48 && (t4 &= 15)), t4 && (t4 < 8 || 15 < t4) ? U : (null !== n3.window && n3.wbits !== t4 && (n3.window = null), n3.wrap = r4, n3.wbits = t4, o3(e4))) : U;
          }
          function u3(e4, t4) {
            var r4, n3;
            return e4 ? (n3 = new s3(), (e4.state = n3).window = null, (r4 = h3(e4, t4)) !== N2 && (e4.state = null), r4) : U;
          }
          var l3, f3, c3 = true;
          function j3(e4) {
            if (c3) {
              var t4;
              for (l3 = new I2.Buf32(512), f3 = new I2.Buf32(32), t4 = 0; t4 < 144; ) e4.lens[t4++] = 8;
              for (; t4 < 256; ) e4.lens[t4++] = 9;
              for (; t4 < 280; ) e4.lens[t4++] = 7;
              for (; t4 < 288; ) e4.lens[t4++] = 8;
              for (T2(D, e4.lens, 0, 288, l3, 0, e4.work, { bits: 9 }), t4 = 0; t4 < 32; ) e4.lens[t4++] = 5;
              T2(F2, e4.lens, 0, 32, f3, 0, e4.work, { bits: 5 }), c3 = false;
            }
            e4.lencode = l3, e4.lenbits = 9, e4.distcode = f3, e4.distbits = 5;
          }
          function Z(e4, t4, r4, n3) {
            var i4, s4 = e4.state;
            return null === s4.window && (s4.wsize = 1 << s4.wbits, s4.wnext = 0, s4.whave = 0, s4.window = new I2.Buf8(s4.wsize)), n3 >= s4.wsize ? (I2.arraySet(s4.window, t4, r4 - s4.wsize, s4.wsize, 0), s4.wnext = 0, s4.whave = s4.wsize) : (n3 < (i4 = s4.wsize - s4.wnext) && (i4 = n3), I2.arraySet(s4.window, t4, r4 - n3, i4, s4.wnext), (n3 -= i4) ? (I2.arraySet(s4.window, t4, r4 - n3, n3, 0), s4.wnext = n3, s4.whave = s4.wsize) : (s4.wnext += i4, s4.wnext === s4.wsize && (s4.wnext = 0), s4.whave < s4.wsize && (s4.whave += i4))), 0;
          }
          r3.inflateReset = o3, r3.inflateReset2 = h3, r3.inflateResetKeep = a3, r3.inflateInit = function(e4) {
            return u3(e4, 15);
          }, r3.inflateInit2 = u3, r3.inflate = function(e4, t4) {
            var r4, n3, i4, s4, a4, o4, h4, u4, l4, f4, c4, d3, p3, m3, _2, g3, b3, v3, y3, w3, k3, x3, S2, z2, C2 = 0, E = new I2.Buf8(4), A2 = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
            if (!e4 || !e4.state || !e4.output || !e4.input && 0 !== e4.avail_in) return U;
            12 === (r4 = e4.state).mode && (r4.mode = 13), a4 = e4.next_out, i4 = e4.output, h4 = e4.avail_out, s4 = e4.next_in, n3 = e4.input, o4 = e4.avail_in, u4 = r4.hold, l4 = r4.bits, f4 = o4, c4 = h4, x3 = N2;
            e: for (; ; ) switch (r4.mode) {
              case P2:
                if (0 === r4.wrap) {
                  r4.mode = 13;
                  break;
                }
                for (; l4 < 16; ) {
                  if (0 === o4) break e;
                  o4--, u4 += n3[s4++] << l4, l4 += 8;
                }
                if (2 & r4.wrap && 35615 === u4) {
                  E[r4.check = 0] = 255 & u4, E[1] = u4 >>> 8 & 255, r4.check = B(r4.check, E, 2, 0), l4 = u4 = 0, r4.mode = 2;
                  break;
                }
                if (r4.flags = 0, r4.head && (r4.head.done = false), !(1 & r4.wrap) || (((255 & u4) << 8) + (u4 >> 8)) % 31) {
                  e4.msg = "incorrect header check", r4.mode = 30;
                  break;
                }
                if (8 != (15 & u4)) {
                  e4.msg = "unknown compression method", r4.mode = 30;
                  break;
                }
                if (l4 -= 4, k3 = 8 + (15 & (u4 >>>= 4)), 0 === r4.wbits) r4.wbits = k3;
                else if (k3 > r4.wbits) {
                  e4.msg = "invalid window size", r4.mode = 30;
                  break;
                }
                r4.dmax = 1 << k3, e4.adler = r4.check = 1, r4.mode = 512 & u4 ? 10 : 12, l4 = u4 = 0;
                break;
              case 2:
                for (; l4 < 16; ) {
                  if (0 === o4) break e;
                  o4--, u4 += n3[s4++] << l4, l4 += 8;
                }
                if (r4.flags = u4, 8 != (255 & r4.flags)) {
                  e4.msg = "unknown compression method", r4.mode = 30;
                  break;
                }
                if (57344 & r4.flags) {
                  e4.msg = "unknown header flags set", r4.mode = 30;
                  break;
                }
                r4.head && (r4.head.text = u4 >> 8 & 1), 512 & r4.flags && (E[0] = 255 & u4, E[1] = u4 >>> 8 & 255, r4.check = B(r4.check, E, 2, 0)), l4 = u4 = 0, r4.mode = 3;
              case 3:
                for (; l4 < 32; ) {
                  if (0 === o4) break e;
                  o4--, u4 += n3[s4++] << l4, l4 += 8;
                }
                r4.head && (r4.head.time = u4), 512 & r4.flags && (E[0] = 255 & u4, E[1] = u4 >>> 8 & 255, E[2] = u4 >>> 16 & 255, E[3] = u4 >>> 24 & 255, r4.check = B(r4.check, E, 4, 0)), l4 = u4 = 0, r4.mode = 4;
              case 4:
                for (; l4 < 16; ) {
                  if (0 === o4) break e;
                  o4--, u4 += n3[s4++] << l4, l4 += 8;
                }
                r4.head && (r4.head.xflags = 255 & u4, r4.head.os = u4 >> 8), 512 & r4.flags && (E[0] = 255 & u4, E[1] = u4 >>> 8 & 255, r4.check = B(r4.check, E, 2, 0)), l4 = u4 = 0, r4.mode = 5;
              case 5:
                if (1024 & r4.flags) {
                  for (; l4 < 16; ) {
                    if (0 === o4) break e;
                    o4--, u4 += n3[s4++] << l4, l4 += 8;
                  }
                  r4.length = u4, r4.head && (r4.head.extra_len = u4), 512 & r4.flags && (E[0] = 255 & u4, E[1] = u4 >>> 8 & 255, r4.check = B(r4.check, E, 2, 0)), l4 = u4 = 0;
                } else r4.head && (r4.head.extra = null);
                r4.mode = 6;
              case 6:
                if (1024 & r4.flags && (o4 < (d3 = r4.length) && (d3 = o4), d3 && (r4.head && (k3 = r4.head.extra_len - r4.length, r4.head.extra || (r4.head.extra = new Array(r4.head.extra_len)), I2.arraySet(r4.head.extra, n3, s4, d3, k3)), 512 & r4.flags && (r4.check = B(r4.check, n3, d3, s4)), o4 -= d3, s4 += d3, r4.length -= d3), r4.length)) break e;
                r4.length = 0, r4.mode = 7;
              case 7:
                if (2048 & r4.flags) {
                  if (0 === o4) break e;
                  for (d3 = 0; k3 = n3[s4 + d3++], r4.head && k3 && r4.length < 65536 && (r4.head.name += String.fromCharCode(k3)), k3 && d3 < o4; ) ;
                  if (512 & r4.flags && (r4.check = B(r4.check, n3, d3, s4)), o4 -= d3, s4 += d3, k3) break e;
                } else r4.head && (r4.head.name = null);
                r4.length = 0, r4.mode = 8;
              case 8:
                if (4096 & r4.flags) {
                  if (0 === o4) break e;
                  for (d3 = 0; k3 = n3[s4 + d3++], r4.head && k3 && r4.length < 65536 && (r4.head.comment += String.fromCharCode(k3)), k3 && d3 < o4; ) ;
                  if (512 & r4.flags && (r4.check = B(r4.check, n3, d3, s4)), o4 -= d3, s4 += d3, k3) break e;
                } else r4.head && (r4.head.comment = null);
                r4.mode = 9;
              case 9:
                if (512 & r4.flags) {
                  for (; l4 < 16; ) {
                    if (0 === o4) break e;
                    o4--, u4 += n3[s4++] << l4, l4 += 8;
                  }
                  if (u4 !== (65535 & r4.check)) {
                    e4.msg = "header crc mismatch", r4.mode = 30;
                    break;
                  }
                  l4 = u4 = 0;
                }
                r4.head && (r4.head.hcrc = r4.flags >> 9 & 1, r4.head.done = true), e4.adler = r4.check = 0, r4.mode = 12;
                break;
              case 10:
                for (; l4 < 32; ) {
                  if (0 === o4) break e;
                  o4--, u4 += n3[s4++] << l4, l4 += 8;
                }
                e4.adler = r4.check = L2(u4), l4 = u4 = 0, r4.mode = 11;
              case 11:
                if (0 === r4.havedict) return e4.next_out = a4, e4.avail_out = h4, e4.next_in = s4, e4.avail_in = o4, r4.hold = u4, r4.bits = l4, 2;
                e4.adler = r4.check = 1, r4.mode = 12;
              case 12:
                if (5 === t4 || 6 === t4) break e;
              case 13:
                if (r4.last) {
                  u4 >>>= 7 & l4, l4 -= 7 & l4, r4.mode = 27;
                  break;
                }
                for (; l4 < 3; ) {
                  if (0 === o4) break e;
                  o4--, u4 += n3[s4++] << l4, l4 += 8;
                }
                switch (r4.last = 1 & u4, l4 -= 1, 3 & (u4 >>>= 1)) {
                  case 0:
                    r4.mode = 14;
                    break;
                  case 1:
                    if (j3(r4), r4.mode = 20, 6 !== t4) break;
                    u4 >>>= 2, l4 -= 2;
                    break e;
                  case 2:
                    r4.mode = 17;
                    break;
                  case 3:
                    e4.msg = "invalid block type", r4.mode = 30;
                }
                u4 >>>= 2, l4 -= 2;
                break;
              case 14:
                for (u4 >>>= 7 & l4, l4 -= 7 & l4; l4 < 32; ) {
                  if (0 === o4) break e;
                  o4--, u4 += n3[s4++] << l4, l4 += 8;
                }
                if ((65535 & u4) != (u4 >>> 16 ^ 65535)) {
                  e4.msg = "invalid stored block lengths", r4.mode = 30;
                  break;
                }
                if (r4.length = 65535 & u4, l4 = u4 = 0, r4.mode = 15, 6 === t4) break e;
              case 15:
                r4.mode = 16;
              case 16:
                if (d3 = r4.length) {
                  if (o4 < d3 && (d3 = o4), h4 < d3 && (d3 = h4), 0 === d3) break e;
                  I2.arraySet(i4, n3, s4, d3, a4), o4 -= d3, s4 += d3, h4 -= d3, a4 += d3, r4.length -= d3;
                  break;
                }
                r4.mode = 12;
                break;
              case 17:
                for (; l4 < 14; ) {
                  if (0 === o4) break e;
                  o4--, u4 += n3[s4++] << l4, l4 += 8;
                }
                if (r4.nlen = 257 + (31 & u4), u4 >>>= 5, l4 -= 5, r4.ndist = 1 + (31 & u4), u4 >>>= 5, l4 -= 5, r4.ncode = 4 + (15 & u4), u4 >>>= 4, l4 -= 4, 286 < r4.nlen || 30 < r4.ndist) {
                  e4.msg = "too many length or distance symbols", r4.mode = 30;
                  break;
                }
                r4.have = 0, r4.mode = 18;
              case 18:
                for (; r4.have < r4.ncode; ) {
                  for (; l4 < 3; ) {
                    if (0 === o4) break e;
                    o4--, u4 += n3[s4++] << l4, l4 += 8;
                  }
                  r4.lens[A2[r4.have++]] = 7 & u4, u4 >>>= 3, l4 -= 3;
                }
                for (; r4.have < 19; ) r4.lens[A2[r4.have++]] = 0;
                if (r4.lencode = r4.lendyn, r4.lenbits = 7, S2 = { bits: r4.lenbits }, x3 = T2(0, r4.lens, 0, 19, r4.lencode, 0, r4.work, S2), r4.lenbits = S2.bits, x3) {
                  e4.msg = "invalid code lengths set", r4.mode = 30;
                  break;
                }
                r4.have = 0, r4.mode = 19;
              case 19:
                for (; r4.have < r4.nlen + r4.ndist; ) {
                  for (; g3 = (C2 = r4.lencode[u4 & (1 << r4.lenbits) - 1]) >>> 16 & 255, b3 = 65535 & C2, !((_2 = C2 >>> 24) <= l4); ) {
                    if (0 === o4) break e;
                    o4--, u4 += n3[s4++] << l4, l4 += 8;
                  }
                  if (b3 < 16) u4 >>>= _2, l4 -= _2, r4.lens[r4.have++] = b3;
                  else {
                    if (16 === b3) {
                      for (z2 = _2 + 2; l4 < z2; ) {
                        if (0 === o4) break e;
                        o4--, u4 += n3[s4++] << l4, l4 += 8;
                      }
                      if (u4 >>>= _2, l4 -= _2, 0 === r4.have) {
                        e4.msg = "invalid bit length repeat", r4.mode = 30;
                        break;
                      }
                      k3 = r4.lens[r4.have - 1], d3 = 3 + (3 & u4), u4 >>>= 2, l4 -= 2;
                    } else if (17 === b3) {
                      for (z2 = _2 + 3; l4 < z2; ) {
                        if (0 === o4) break e;
                        o4--, u4 += n3[s4++] << l4, l4 += 8;
                      }
                      l4 -= _2, k3 = 0, d3 = 3 + (7 & (u4 >>>= _2)), u4 >>>= 3, l4 -= 3;
                    } else {
                      for (z2 = _2 + 7; l4 < z2; ) {
                        if (0 === o4) break e;
                        o4--, u4 += n3[s4++] << l4, l4 += 8;
                      }
                      l4 -= _2, k3 = 0, d3 = 11 + (127 & (u4 >>>= _2)), u4 >>>= 7, l4 -= 7;
                    }
                    if (r4.have + d3 > r4.nlen + r4.ndist) {
                      e4.msg = "invalid bit length repeat", r4.mode = 30;
                      break;
                    }
                    for (; d3--; ) r4.lens[r4.have++] = k3;
                  }
                }
                if (30 === r4.mode) break;
                if (0 === r4.lens[256]) {
                  e4.msg = "invalid code -- missing end-of-block", r4.mode = 30;
                  break;
                }
                if (r4.lenbits = 9, S2 = { bits: r4.lenbits }, x3 = T2(D, r4.lens, 0, r4.nlen, r4.lencode, 0, r4.work, S2), r4.lenbits = S2.bits, x3) {
                  e4.msg = "invalid literal/lengths set", r4.mode = 30;
                  break;
                }
                if (r4.distbits = 6, r4.distcode = r4.distdyn, S2 = { bits: r4.distbits }, x3 = T2(F2, r4.lens, r4.nlen, r4.ndist, r4.distcode, 0, r4.work, S2), r4.distbits = S2.bits, x3) {
                  e4.msg = "invalid distances set", r4.mode = 30;
                  break;
                }
                if (r4.mode = 20, 6 === t4) break e;
              case 20:
                r4.mode = 21;
              case 21:
                if (6 <= o4 && 258 <= h4) {
                  e4.next_out = a4, e4.avail_out = h4, e4.next_in = s4, e4.avail_in = o4, r4.hold = u4, r4.bits = l4, R(e4, c4), a4 = e4.next_out, i4 = e4.output, h4 = e4.avail_out, s4 = e4.next_in, n3 = e4.input, o4 = e4.avail_in, u4 = r4.hold, l4 = r4.bits, 12 === r4.mode && (r4.back = -1);
                  break;
                }
                for (r4.back = 0; g3 = (C2 = r4.lencode[u4 & (1 << r4.lenbits) - 1]) >>> 16 & 255, b3 = 65535 & C2, !((_2 = C2 >>> 24) <= l4); ) {
                  if (0 === o4) break e;
                  o4--, u4 += n3[s4++] << l4, l4 += 8;
                }
                if (g3 && 0 == (240 & g3)) {
                  for (v3 = _2, y3 = g3, w3 = b3; g3 = (C2 = r4.lencode[w3 + ((u4 & (1 << v3 + y3) - 1) >> v3)]) >>> 16 & 255, b3 = 65535 & C2, !(v3 + (_2 = C2 >>> 24) <= l4); ) {
                    if (0 === o4) break e;
                    o4--, u4 += n3[s4++] << l4, l4 += 8;
                  }
                  u4 >>>= v3, l4 -= v3, r4.back += v3;
                }
                if (u4 >>>= _2, l4 -= _2, r4.back += _2, r4.length = b3, 0 === g3) {
                  r4.mode = 26;
                  break;
                }
                if (32 & g3) {
                  r4.back = -1, r4.mode = 12;
                  break;
                }
                if (64 & g3) {
                  e4.msg = "invalid literal/length code", r4.mode = 30;
                  break;
                }
                r4.extra = 15 & g3, r4.mode = 22;
              case 22:
                if (r4.extra) {
                  for (z2 = r4.extra; l4 < z2; ) {
                    if (0 === o4) break e;
                    o4--, u4 += n3[s4++] << l4, l4 += 8;
                  }
                  r4.length += u4 & (1 << r4.extra) - 1, u4 >>>= r4.extra, l4 -= r4.extra, r4.back += r4.extra;
                }
                r4.was = r4.length, r4.mode = 23;
              case 23:
                for (; g3 = (C2 = r4.distcode[u4 & (1 << r4.distbits) - 1]) >>> 16 & 255, b3 = 65535 & C2, !((_2 = C2 >>> 24) <= l4); ) {
                  if (0 === o4) break e;
                  o4--, u4 += n3[s4++] << l4, l4 += 8;
                }
                if (0 == (240 & g3)) {
                  for (v3 = _2, y3 = g3, w3 = b3; g3 = (C2 = r4.distcode[w3 + ((u4 & (1 << v3 + y3) - 1) >> v3)]) >>> 16 & 255, b3 = 65535 & C2, !(v3 + (_2 = C2 >>> 24) <= l4); ) {
                    if (0 === o4) break e;
                    o4--, u4 += n3[s4++] << l4, l4 += 8;
                  }
                  u4 >>>= v3, l4 -= v3, r4.back += v3;
                }
                if (u4 >>>= _2, l4 -= _2, r4.back += _2, 64 & g3) {
                  e4.msg = "invalid distance code", r4.mode = 30;
                  break;
                }
                r4.offset = b3, r4.extra = 15 & g3, r4.mode = 24;
              case 24:
                if (r4.extra) {
                  for (z2 = r4.extra; l4 < z2; ) {
                    if (0 === o4) break e;
                    o4--, u4 += n3[s4++] << l4, l4 += 8;
                  }
                  r4.offset += u4 & (1 << r4.extra) - 1, u4 >>>= r4.extra, l4 -= r4.extra, r4.back += r4.extra;
                }
                if (r4.offset > r4.dmax) {
                  e4.msg = "invalid distance too far back", r4.mode = 30;
                  break;
                }
                r4.mode = 25;
              case 25:
                if (0 === h4) break e;
                if (d3 = c4 - h4, r4.offset > d3) {
                  if ((d3 = r4.offset - d3) > r4.whave && r4.sane) {
                    e4.msg = "invalid distance too far back", r4.mode = 30;
                    break;
                  }
                  p3 = d3 > r4.wnext ? (d3 -= r4.wnext, r4.wsize - d3) : r4.wnext - d3, d3 > r4.length && (d3 = r4.length), m3 = r4.window;
                } else m3 = i4, p3 = a4 - r4.offset, d3 = r4.length;
                for (h4 < d3 && (d3 = h4), h4 -= d3, r4.length -= d3; i4[a4++] = m3[p3++], --d3; ) ;
                0 === r4.length && (r4.mode = 21);
                break;
              case 26:
                if (0 === h4) break e;
                i4[a4++] = r4.length, h4--, r4.mode = 21;
                break;
              case 27:
                if (r4.wrap) {
                  for (; l4 < 32; ) {
                    if (0 === o4) break e;
                    o4--, u4 |= n3[s4++] << l4, l4 += 8;
                  }
                  if (c4 -= h4, e4.total_out += c4, r4.total += c4, c4 && (e4.adler = r4.check = r4.flags ? B(r4.check, i4, c4, a4 - c4) : O2(r4.check, i4, c4, a4 - c4)), c4 = h4, (r4.flags ? u4 : L2(u4)) !== r4.check) {
                    e4.msg = "incorrect data check", r4.mode = 30;
                    break;
                  }
                  l4 = u4 = 0;
                }
                r4.mode = 28;
              case 28:
                if (r4.wrap && r4.flags) {
                  for (; l4 < 32; ) {
                    if (0 === o4) break e;
                    o4--, u4 += n3[s4++] << l4, l4 += 8;
                  }
                  if (u4 !== (4294967295 & r4.total)) {
                    e4.msg = "incorrect length check", r4.mode = 30;
                    break;
                  }
                  l4 = u4 = 0;
                }
                r4.mode = 29;
              case 29:
                x3 = 1;
                break e;
              case 30:
                x3 = -3;
                break e;
              case 31:
                return -4;
              case 32:
              default:
                return U;
            }
            return e4.next_out = a4, e4.avail_out = h4, e4.next_in = s4, e4.avail_in = o4, r4.hold = u4, r4.bits = l4, (r4.wsize || c4 !== e4.avail_out && r4.mode < 30 && (r4.mode < 27 || 4 !== t4)) && Z(e4, e4.output, e4.next_out, c4 - e4.avail_out) ? (r4.mode = 31, -4) : (f4 -= e4.avail_in, c4 -= e4.avail_out, e4.total_in += f4, e4.total_out += c4, r4.total += c4, r4.wrap && c4 && (e4.adler = r4.check = r4.flags ? B(r4.check, i4, c4, e4.next_out - c4) : O2(r4.check, i4, c4, e4.next_out - c4)), e4.data_type = r4.bits + (r4.last ? 64 : 0) + (12 === r4.mode ? 128 : 0) + (20 === r4.mode || 15 === r4.mode ? 256 : 0), (0 == f4 && 0 === c4 || 4 === t4) && x3 === N2 && (x3 = -5), x3);
          }, r3.inflateEnd = function(e4) {
            if (!e4 || !e4.state) return U;
            var t4 = e4.state;
            return t4.window && (t4.window = null), e4.state = null, N2;
          }, r3.inflateGetHeader = function(e4, t4) {
            var r4;
            return e4 && e4.state ? 0 == (2 & (r4 = e4.state).wrap) ? U : ((r4.head = t4).done = false, N2) : U;
          }, r3.inflateSetDictionary = function(e4, t4) {
            var r4, n3 = t4.length;
            return e4 && e4.state ? 0 !== (r4 = e4.state).wrap && 11 !== r4.mode ? U : 11 === r4.mode && O2(1, t4, n3, 0) !== r4.check ? -3 : Z(e4, t4, n3, n3) ? (r4.mode = 31, -4) : (r4.havedict = 1, N2) : U;
          }, r3.inflateInfo = "pako inflate (from Nodeca project)";
        }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./inffast": 48, "./inftrees": 50 }], 50: [function(e3, t3, r3) {
          "use strict";
          var D = e3("../utils/common"), F2 = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0], N2 = [16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78], U = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0], P2 = [16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64];
          t3.exports = function(e4, t4, r4, n2, i3, s3, a3, o3) {
            var h3, u3, l3, f3, c3, d3, p3, m3, _2, g3 = o3.bits, b3 = 0, v3 = 0, y3 = 0, w3 = 0, k3 = 0, x3 = 0, S2 = 0, z2 = 0, C2 = 0, E = 0, A2 = null, I2 = 0, O2 = new D.Buf16(16), B = new D.Buf16(16), R = null, T2 = 0;
            for (b3 = 0; b3 <= 15; b3++) O2[b3] = 0;
            for (v3 = 0; v3 < n2; v3++) O2[t4[r4 + v3]]++;
            for (k3 = g3, w3 = 15; 1 <= w3 && 0 === O2[w3]; w3--) ;
            if (w3 < k3 && (k3 = w3), 0 === w3) return i3[s3++] = 20971520, i3[s3++] = 20971520, o3.bits = 1, 0;
            for (y3 = 1; y3 < w3 && 0 === O2[y3]; y3++) ;
            for (k3 < y3 && (k3 = y3), b3 = z2 = 1; b3 <= 15; b3++) if (z2 <<= 1, (z2 -= O2[b3]) < 0) return -1;
            if (0 < z2 && (0 === e4 || 1 !== w3)) return -1;
            for (B[1] = 0, b3 = 1; b3 < 15; b3++) B[b3 + 1] = B[b3] + O2[b3];
            for (v3 = 0; v3 < n2; v3++) 0 !== t4[r4 + v3] && (a3[B[t4[r4 + v3]]++] = v3);
            if (d3 = 0 === e4 ? (A2 = R = a3, 19) : 1 === e4 ? (A2 = F2, I2 -= 257, R = N2, T2 -= 257, 256) : (A2 = U, R = P2, -1), b3 = y3, c3 = s3, S2 = v3 = E = 0, l3 = -1, f3 = (C2 = 1 << (x3 = k3)) - 1, 1 === e4 && 852 < C2 || 2 === e4 && 592 < C2) return 1;
            for (; ; ) {
              for (p3 = b3 - S2, _2 = a3[v3] < d3 ? (m3 = 0, a3[v3]) : a3[v3] > d3 ? (m3 = R[T2 + a3[v3]], A2[I2 + a3[v3]]) : (m3 = 96, 0), h3 = 1 << b3 - S2, y3 = u3 = 1 << x3; i3[c3 + (E >> S2) + (u3 -= h3)] = p3 << 24 | m3 << 16 | _2 | 0, 0 !== u3; ) ;
              for (h3 = 1 << b3 - 1; E & h3; ) h3 >>= 1;
              if (0 !== h3 ? (E &= h3 - 1, E += h3) : E = 0, v3++, 0 == --O2[b3]) {
                if (b3 === w3) break;
                b3 = t4[r4 + a3[v3]];
              }
              if (k3 < b3 && (E & f3) !== l3) {
                for (0 === S2 && (S2 = k3), c3 += y3, z2 = 1 << (x3 = b3 - S2); x3 + S2 < w3 && !((z2 -= O2[x3 + S2]) <= 0); ) x3++, z2 <<= 1;
                if (C2 += 1 << x3, 1 === e4 && 852 < C2 || 2 === e4 && 592 < C2) return 1;
                i3[l3 = E & f3] = k3 << 24 | x3 << 16 | c3 - s3 | 0;
              }
            }
            return 0 !== E && (i3[c3 + E] = b3 - S2 << 24 | 64 << 16 | 0), o3.bits = k3, 0;
          };
        }, { "../utils/common": 41 }], 51: [function(e3, t3, r3) {
          "use strict";
          t3.exports = { 2: "need dictionary", 1: "stream end", 0: "", "-1": "file error", "-2": "stream error", "-3": "data error", "-4": "insufficient memory", "-5": "buffer error", "-6": "incompatible version" };
        }, {}], 52: [function(e3, t3, r3) {
          "use strict";
          var i3 = e3("../utils/common"), o3 = 0, h3 = 1;
          function n2(e4) {
            for (var t4 = e4.length; 0 <= --t4; ) e4[t4] = 0;
          }
          var s3 = 0, a3 = 29, u3 = 256, l3 = u3 + 1 + a3, f3 = 30, c3 = 19, _2 = 2 * l3 + 1, g3 = 15, d3 = 16, p3 = 7, m3 = 256, b3 = 16, v3 = 17, y3 = 18, w3 = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0], k3 = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13], x3 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7], S2 = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], z2 = new Array(2 * (l3 + 2));
          n2(z2);
          var C2 = new Array(2 * f3);
          n2(C2);
          var E = new Array(512);
          n2(E);
          var A2 = new Array(256);
          n2(A2);
          var I2 = new Array(a3);
          n2(I2);
          var O2, B, R, T2 = new Array(f3);
          function D(e4, t4, r4, n3, i4) {
            this.static_tree = e4, this.extra_bits = t4, this.extra_base = r4, this.elems = n3, this.max_length = i4, this.has_stree = e4 && e4.length;
          }
          function F2(e4, t4) {
            this.dyn_tree = e4, this.max_code = 0, this.stat_desc = t4;
          }
          function N2(e4) {
            return e4 < 256 ? E[e4] : E[256 + (e4 >>> 7)];
          }
          function U(e4, t4) {
            e4.pending_buf[e4.pending++] = 255 & t4, e4.pending_buf[e4.pending++] = t4 >>> 8 & 255;
          }
          function P2(e4, t4, r4) {
            e4.bi_valid > d3 - r4 ? (e4.bi_buf |= t4 << e4.bi_valid & 65535, U(e4, e4.bi_buf), e4.bi_buf = t4 >> d3 - e4.bi_valid, e4.bi_valid += r4 - d3) : (e4.bi_buf |= t4 << e4.bi_valid & 65535, e4.bi_valid += r4);
          }
          function L2(e4, t4, r4) {
            P2(e4, r4[2 * t4], r4[2 * t4 + 1]);
          }
          function j3(e4, t4) {
            for (var r4 = 0; r4 |= 1 & e4, e4 >>>= 1, r4 <<= 1, 0 < --t4; ) ;
            return r4 >>> 1;
          }
          function Z(e4, t4, r4) {
            var n3, i4, s4 = new Array(g3 + 1), a4 = 0;
            for (n3 = 1; n3 <= g3; n3++) s4[n3] = a4 = a4 + r4[n3 - 1] << 1;
            for (i4 = 0; i4 <= t4; i4++) {
              var o4 = e4[2 * i4 + 1];
              0 !== o4 && (e4[2 * i4] = j3(s4[o4]++, o4));
            }
          }
          function W(e4) {
            var t4;
            for (t4 = 0; t4 < l3; t4++) e4.dyn_ltree[2 * t4] = 0;
            for (t4 = 0; t4 < f3; t4++) e4.dyn_dtree[2 * t4] = 0;
            for (t4 = 0; t4 < c3; t4++) e4.bl_tree[2 * t4] = 0;
            e4.dyn_ltree[2 * m3] = 1, e4.opt_len = e4.static_len = 0, e4.last_lit = e4.matches = 0;
          }
          function M2(e4) {
            8 < e4.bi_valid ? U(e4, e4.bi_buf) : 0 < e4.bi_valid && (e4.pending_buf[e4.pending++] = e4.bi_buf), e4.bi_buf = 0, e4.bi_valid = 0;
          }
          function H2(e4, t4, r4, n3) {
            var i4 = 2 * t4, s4 = 2 * r4;
            return e4[i4] < e4[s4] || e4[i4] === e4[s4] && n3[t4] <= n3[r4];
          }
          function G(e4, t4, r4) {
            for (var n3 = e4.heap[r4], i4 = r4 << 1; i4 <= e4.heap_len && (i4 < e4.heap_len && H2(t4, e4.heap[i4 + 1], e4.heap[i4], e4.depth) && i4++, !H2(t4, n3, e4.heap[i4], e4.depth)); ) e4.heap[r4] = e4.heap[i4], r4 = i4, i4 <<= 1;
            e4.heap[r4] = n3;
          }
          function K(e4, t4, r4) {
            var n3, i4, s4, a4, o4 = 0;
            if (0 !== e4.last_lit) for (; n3 = e4.pending_buf[e4.d_buf + 2 * o4] << 8 | e4.pending_buf[e4.d_buf + 2 * o4 + 1], i4 = e4.pending_buf[e4.l_buf + o4], o4++, 0 === n3 ? L2(e4, i4, t4) : (L2(e4, (s4 = A2[i4]) + u3 + 1, t4), 0 !== (a4 = w3[s4]) && P2(e4, i4 -= I2[s4], a4), L2(e4, s4 = N2(--n3), r4), 0 !== (a4 = k3[s4]) && P2(e4, n3 -= T2[s4], a4)), o4 < e4.last_lit; ) ;
            L2(e4, m3, t4);
          }
          function Y(e4, t4) {
            var r4, n3, i4, s4 = t4.dyn_tree, a4 = t4.stat_desc.static_tree, o4 = t4.stat_desc.has_stree, h4 = t4.stat_desc.elems, u4 = -1;
            for (e4.heap_len = 0, e4.heap_max = _2, r4 = 0; r4 < h4; r4++) 0 !== s4[2 * r4] ? (e4.heap[++e4.heap_len] = u4 = r4, e4.depth[r4] = 0) : s4[2 * r4 + 1] = 0;
            for (; e4.heap_len < 2; ) s4[2 * (i4 = e4.heap[++e4.heap_len] = u4 < 2 ? ++u4 : 0)] = 1, e4.depth[i4] = 0, e4.opt_len--, o4 && (e4.static_len -= a4[2 * i4 + 1]);
            for (t4.max_code = u4, r4 = e4.heap_len >> 1; 1 <= r4; r4--) G(e4, s4, r4);
            for (i4 = h4; r4 = e4.heap[1], e4.heap[1] = e4.heap[e4.heap_len--], G(e4, s4, 1), n3 = e4.heap[1], e4.heap[--e4.heap_max] = r4, e4.heap[--e4.heap_max] = n3, s4[2 * i4] = s4[2 * r4] + s4[2 * n3], e4.depth[i4] = (e4.depth[r4] >= e4.depth[n3] ? e4.depth[r4] : e4.depth[n3]) + 1, s4[2 * r4 + 1] = s4[2 * n3 + 1] = i4, e4.heap[1] = i4++, G(e4, s4, 1), 2 <= e4.heap_len; ) ;
            e4.heap[--e4.heap_max] = e4.heap[1], (function(e5, t5) {
              var r5, n4, i5, s5, a5, o5, h5 = t5.dyn_tree, u5 = t5.max_code, l4 = t5.stat_desc.static_tree, f4 = t5.stat_desc.has_stree, c4 = t5.stat_desc.extra_bits, d4 = t5.stat_desc.extra_base, p4 = t5.stat_desc.max_length, m4 = 0;
              for (s5 = 0; s5 <= g3; s5++) e5.bl_count[s5] = 0;
              for (h5[2 * e5.heap[e5.heap_max] + 1] = 0, r5 = e5.heap_max + 1; r5 < _2; r5++) p4 < (s5 = h5[2 * h5[2 * (n4 = e5.heap[r5]) + 1] + 1] + 1) && (s5 = p4, m4++), h5[2 * n4 + 1] = s5, u5 < n4 || (e5.bl_count[s5]++, a5 = 0, d4 <= n4 && (a5 = c4[n4 - d4]), o5 = h5[2 * n4], e5.opt_len += o5 * (s5 + a5), f4 && (e5.static_len += o5 * (l4[2 * n4 + 1] + a5)));
              if (0 !== m4) {
                do {
                  for (s5 = p4 - 1; 0 === e5.bl_count[s5]; ) s5--;
                  e5.bl_count[s5]--, e5.bl_count[s5 + 1] += 2, e5.bl_count[p4]--, m4 -= 2;
                } while (0 < m4);
                for (s5 = p4; 0 !== s5; s5--) for (n4 = e5.bl_count[s5]; 0 !== n4; ) u5 < (i5 = e5.heap[--r5]) || (h5[2 * i5 + 1] !== s5 && (e5.opt_len += (s5 - h5[2 * i5 + 1]) * h5[2 * i5], h5[2 * i5 + 1] = s5), n4--);
              }
            })(e4, t4), Z(s4, u4, e4.bl_count);
          }
          function X(e4, t4, r4) {
            var n3, i4, s4 = -1, a4 = t4[1], o4 = 0, h4 = 7, u4 = 4;
            for (0 === a4 && (h4 = 138, u4 = 3), t4[2 * (r4 + 1) + 1] = 65535, n3 = 0; n3 <= r4; n3++) i4 = a4, a4 = t4[2 * (n3 + 1) + 1], ++o4 < h4 && i4 === a4 || (o4 < u4 ? e4.bl_tree[2 * i4] += o4 : 0 !== i4 ? (i4 !== s4 && e4.bl_tree[2 * i4]++, e4.bl_tree[2 * b3]++) : o4 <= 10 ? e4.bl_tree[2 * v3]++ : e4.bl_tree[2 * y3]++, s4 = i4, u4 = (o4 = 0) === a4 ? (h4 = 138, 3) : i4 === a4 ? (h4 = 6, 3) : (h4 = 7, 4));
          }
          function V(e4, t4, r4) {
            var n3, i4, s4 = -1, a4 = t4[1], o4 = 0, h4 = 7, u4 = 4;
            for (0 === a4 && (h4 = 138, u4 = 3), n3 = 0; n3 <= r4; n3++) if (i4 = a4, a4 = t4[2 * (n3 + 1) + 1], !(++o4 < h4 && i4 === a4)) {
              if (o4 < u4) for (; L2(e4, i4, e4.bl_tree), 0 != --o4; ) ;
              else 0 !== i4 ? (i4 !== s4 && (L2(e4, i4, e4.bl_tree), o4--), L2(e4, b3, e4.bl_tree), P2(e4, o4 - 3, 2)) : o4 <= 10 ? (L2(e4, v3, e4.bl_tree), P2(e4, o4 - 3, 3)) : (L2(e4, y3, e4.bl_tree), P2(e4, o4 - 11, 7));
              s4 = i4, u4 = (o4 = 0) === a4 ? (h4 = 138, 3) : i4 === a4 ? (h4 = 6, 3) : (h4 = 7, 4);
            }
          }
          n2(T2);
          var q2 = false;
          function J(e4, t4, r4, n3) {
            P2(e4, (s3 << 1) + (n3 ? 1 : 0), 3), (function(e5, t5, r5, n4) {
              M2(e5), n4 && (U(e5, r5), U(e5, ~r5)), i3.arraySet(e5.pending_buf, e5.window, t5, r5, e5.pending), e5.pending += r5;
            })(e4, t4, r4, true);
          }
          r3._tr_init = function(e4) {
            q2 || ((function() {
              var e5, t4, r4, n3, i4, s4 = new Array(g3 + 1);
              for (n3 = r4 = 0; n3 < a3 - 1; n3++) for (I2[n3] = r4, e5 = 0; e5 < 1 << w3[n3]; e5++) A2[r4++] = n3;
              for (A2[r4 - 1] = n3, n3 = i4 = 0; n3 < 16; n3++) for (T2[n3] = i4, e5 = 0; e5 < 1 << k3[n3]; e5++) E[i4++] = n3;
              for (i4 >>= 7; n3 < f3; n3++) for (T2[n3] = i4 << 7, e5 = 0; e5 < 1 << k3[n3] - 7; e5++) E[256 + i4++] = n3;
              for (t4 = 0; t4 <= g3; t4++) s4[t4] = 0;
              for (e5 = 0; e5 <= 143; ) z2[2 * e5 + 1] = 8, e5++, s4[8]++;
              for (; e5 <= 255; ) z2[2 * e5 + 1] = 9, e5++, s4[9]++;
              for (; e5 <= 279; ) z2[2 * e5 + 1] = 7, e5++, s4[7]++;
              for (; e5 <= 287; ) z2[2 * e5 + 1] = 8, e5++, s4[8]++;
              for (Z(z2, l3 + 1, s4), e5 = 0; e5 < f3; e5++) C2[2 * e5 + 1] = 5, C2[2 * e5] = j3(e5, 5);
              O2 = new D(z2, w3, u3 + 1, l3, g3), B = new D(C2, k3, 0, f3, g3), R = new D(new Array(0), x3, 0, c3, p3);
            })(), q2 = true), e4.l_desc = new F2(e4.dyn_ltree, O2), e4.d_desc = new F2(e4.dyn_dtree, B), e4.bl_desc = new F2(e4.bl_tree, R), e4.bi_buf = 0, e4.bi_valid = 0, W(e4);
          }, r3._tr_stored_block = J, r3._tr_flush_block = function(e4, t4, r4, n3) {
            var i4, s4, a4 = 0;
            0 < e4.level ? (2 === e4.strm.data_type && (e4.strm.data_type = (function(e5) {
              var t5, r5 = 4093624447;
              for (t5 = 0; t5 <= 31; t5++, r5 >>>= 1) if (1 & r5 && 0 !== e5.dyn_ltree[2 * t5]) return o3;
              if (0 !== e5.dyn_ltree[18] || 0 !== e5.dyn_ltree[20] || 0 !== e5.dyn_ltree[26]) return h3;
              for (t5 = 32; t5 < u3; t5++) if (0 !== e5.dyn_ltree[2 * t5]) return h3;
              return o3;
            })(e4)), Y(e4, e4.l_desc), Y(e4, e4.d_desc), a4 = (function(e5) {
              var t5;
              for (X(e5, e5.dyn_ltree, e5.l_desc.max_code), X(e5, e5.dyn_dtree, e5.d_desc.max_code), Y(e5, e5.bl_desc), t5 = c3 - 1; 3 <= t5 && 0 === e5.bl_tree[2 * S2[t5] + 1]; t5--) ;
              return e5.opt_len += 3 * (t5 + 1) + 5 + 5 + 4, t5;
            })(e4), i4 = e4.opt_len + 3 + 7 >>> 3, (s4 = e4.static_len + 3 + 7 >>> 3) <= i4 && (i4 = s4)) : i4 = s4 = r4 + 5, r4 + 4 <= i4 && -1 !== t4 ? J(e4, t4, r4, n3) : 4 === e4.strategy || s4 === i4 ? (P2(e4, 2 + (n3 ? 1 : 0), 3), K(e4, z2, C2)) : (P2(e4, 4 + (n3 ? 1 : 0), 3), (function(e5, t5, r5, n4) {
              var i5;
              for (P2(e5, t5 - 257, 5), P2(e5, r5 - 1, 5), P2(e5, n4 - 4, 4), i5 = 0; i5 < n4; i5++) P2(e5, e5.bl_tree[2 * S2[i5] + 1], 3);
              V(e5, e5.dyn_ltree, t5 - 1), V(e5, e5.dyn_dtree, r5 - 1);
            })(e4, e4.l_desc.max_code + 1, e4.d_desc.max_code + 1, a4 + 1), K(e4, e4.dyn_ltree, e4.dyn_dtree)), W(e4), n3 && M2(e4);
          }, r3._tr_tally = function(e4, t4, r4) {
            return e4.pending_buf[e4.d_buf + 2 * e4.last_lit] = t4 >>> 8 & 255, e4.pending_buf[e4.d_buf + 2 * e4.last_lit + 1] = 255 & t4, e4.pending_buf[e4.l_buf + e4.last_lit] = 255 & r4, e4.last_lit++, 0 === t4 ? e4.dyn_ltree[2 * r4]++ : (e4.matches++, t4--, e4.dyn_ltree[2 * (A2[r4] + u3 + 1)]++, e4.dyn_dtree[2 * N2(t4)]++), e4.last_lit === e4.lit_bufsize - 1;
          }, r3._tr_align = function(e4) {
            P2(e4, 2, 3), L2(e4, m3, z2), (function(e5) {
              16 === e5.bi_valid ? (U(e5, e5.bi_buf), e5.bi_buf = 0, e5.bi_valid = 0) : 8 <= e5.bi_valid && (e5.pending_buf[e5.pending++] = 255 & e5.bi_buf, e5.bi_buf >>= 8, e5.bi_valid -= 8);
            })(e4);
          };
        }, { "../utils/common": 41 }], 53: [function(e3, t3, r3) {
          "use strict";
          t3.exports = function() {
            this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
          };
        }, {}], 54: [function(e3, t3, r3) {
          (function(e4) {
            !(function(r4, n2) {
              "use strict";
              if (!r4.setImmediate) {
                var i3, s3, t4, a3, o3 = 1, h3 = {}, u3 = false, l3 = r4.document, e5 = Object.getPrototypeOf && Object.getPrototypeOf(r4);
                e5 = e5 && e5.setTimeout ? e5 : r4, i3 = "[object process]" === {}.toString.call(r4.process) ? function(e6) {
                  process.nextTick(function() {
                    c3(e6);
                  });
                } : (function() {
                  if (r4.postMessage && !r4.importScripts) {
                    var e6 = true, t5 = r4.onmessage;
                    return r4.onmessage = function() {
                      e6 = false;
                    }, r4.postMessage("", "*"), r4.onmessage = t5, e6;
                  }
                })() ? (a3 = "setImmediate$" + Math.random() + "$", r4.addEventListener ? r4.addEventListener("message", d3, false) : r4.attachEvent("onmessage", d3), function(e6) {
                  r4.postMessage(a3 + e6, "*");
                }) : r4.MessageChannel ? ((t4 = new MessageChannel()).port1.onmessage = function(e6) {
                  c3(e6.data);
                }, function(e6) {
                  t4.port2.postMessage(e6);
                }) : l3 && "onreadystatechange" in l3.createElement("script") ? (s3 = l3.documentElement, function(e6) {
                  var t5 = l3.createElement("script");
                  t5.onreadystatechange = function() {
                    c3(e6), t5.onreadystatechange = null, s3.removeChild(t5), t5 = null;
                  }, s3.appendChild(t5);
                }) : function(e6) {
                  setTimeout(c3, 0, e6);
                }, e5.setImmediate = function(e6) {
                  "function" != typeof e6 && (e6 = new Function("" + e6));
                  for (var t5 = new Array(arguments.length - 1), r5 = 0; r5 < t5.length; r5++) t5[r5] = arguments[r5 + 1];
                  var n3 = { callback: e6, args: t5 };
                  return h3[o3] = n3, i3(o3), o3++;
                }, e5.clearImmediate = f3;
              }
              function f3(e6) {
                delete h3[e6];
              }
              function c3(e6) {
                if (u3) setTimeout(c3, 0, e6);
                else {
                  var t5 = h3[e6];
                  if (t5) {
                    u3 = true;
                    try {
                      !(function(e7) {
                        var t6 = e7.callback, r5 = e7.args;
                        switch (r5.length) {
                          case 0:
                            t6();
                            break;
                          case 1:
                            t6(r5[0]);
                            break;
                          case 2:
                            t6(r5[0], r5[1]);
                            break;
                          case 3:
                            t6(r5[0], r5[1], r5[2]);
                            break;
                          default:
                            t6.apply(n2, r5);
                        }
                      })(t5);
                    } finally {
                      f3(e6), u3 = false;
                    }
                  }
                }
              }
              function d3(e6) {
                e6.source === r4 && "string" == typeof e6.data && 0 === e6.data.indexOf(a3) && c3(+e6.data.slice(a3.length));
              }
            })("undefined" == typeof self ? void 0 === e4 ? this : e4 : self);
          }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
        }, {}] }, {}, [10])(10);
      });
    }
  });

  // src/components/svg.css
  var require_svg = __commonJS({
    "src/components/svg.css"(exports, module) {
      module.exports = "line.gridmajor {\r\n    stroke-width: 2px;\r\n    stroke: rgba(0, 0, 0, 0.5);\r\n    filter: drop-shadow(0px 0px 3px rgba(255, 255, 255, .3));\r\n    pointer-events: none;\r\n}\r\n\r\nline.gridminor {\r\n    stroke-width: 1px;\r\n    stroke: rgba(0, 0, 0, 0.2);\r\n    pointer-events: none;\r\n}\r\n\r\ntext {\r\n    font-family: 'Courier New', Courier, monospace;\r\n    font-weight: bold;\r\n    font-size: 31px;\r\n    fill: black;\r\n    pointer-events: none;\r\n}\r\n\r\nuse.dark text,\r\ntext.dark {\r\n    fill: white;\r\n}\r\n\r\nuse.light text,\r\ntext.light {\r\n    fill: black;\r\n}\r\n";
    }
  });

  // src/app.tsx
  init_preact_module();

  // node_modules/preact/hooks/dist/hooks.module.js
  init_preact_module();
  var t2;
  var u2;
  var r2;
  var o2 = 0;
  var i2 = [];
  var c2 = n.__b;
  var f2 = n.__r;
  var e2 = n.diffed;
  var a2 = n.__c;
  var v2 = n.unmount;
  function m2(t3, r3) {
    n.__h && n.__h(u2, t3, o2 || r3), o2 = 0;
    var i3 = u2.__H || (u2.__H = { __: [], __h: [] });
    return t3 >= i3.__.length && i3.__.push({}), i3.__[t3];
  }
  function l2(n2) {
    return o2 = 1, p2(w2, n2);
  }
  function p2(n2, r3, o3) {
    var i3 = m2(t2++, 2);
    return i3.t = n2, i3.__c || (i3.__ = [o3 ? o3(r3) : w2(void 0, r3), function(n3) {
      var t3 = i3.t(i3.__[0], n3);
      i3.__[0] !== t3 && (i3.__ = [t3, i3.__[1]], i3.__c.setState({}));
    }], i3.__c = u2), i3.__;
  }
  function y2(r3, o3) {
    var i3 = m2(t2++, 3);
    !n.__s && k2(i3.__H, o3) && (i3.__ = r3, i3.__H = o3, u2.__H.__h.push(i3));
  }
  function h2(r3, o3) {
    var i3 = m2(t2++, 4);
    !n.__s && k2(i3.__H, o3) && (i3.__ = r3, i3.__H = o3, u2.__h.push(i3));
  }
  function s2(n2) {
    return o2 = 5, d2(function() {
      return { current: n2 };
    }, []);
  }
  function d2(n2, u3) {
    var r3 = m2(t2++, 7);
    return k2(r3.__H, u3) && (r3.__ = n2(), r3.__H = u3, r3.__h = n2), r3.__;
  }
  function F(n2) {
    var r3 = u2.context[n2.__c], o3 = m2(t2++, 9);
    return o3.__c = n2, r3 ? (null == o3.__ && (o3.__ = true, r3.sub(u2)), r3.props.value) : n2.__;
  }
  function x2() {
    i2.forEach(function(t3) {
      if (t3.__P) try {
        t3.__H.__h.forEach(g2), t3.__H.__h.forEach(j2), t3.__H.__h = [];
      } catch (u3) {
        t3.__H.__h = [], n.__e(u3, t3.__v);
      }
    }), i2 = [];
  }
  n.__b = function(n2) {
    u2 = null, c2 && c2(n2);
  }, n.__r = function(n2) {
    f2 && f2(n2), t2 = 0;
    var r3 = (u2 = n2.__c).__H;
    r3 && (r3.__h.forEach(g2), r3.__h.forEach(j2), r3.__h = []);
  }, n.diffed = function(t3) {
    e2 && e2(t3);
    var o3 = t3.__c;
    o3 && o3.__H && o3.__H.__h.length && (1 !== i2.push(o3) && r2 === n.requestAnimationFrame || ((r2 = n.requestAnimationFrame) || function(n2) {
      var t4, u3 = function() {
        clearTimeout(r3), b2 && cancelAnimationFrame(t4), setTimeout(n2);
      }, r3 = setTimeout(u3, 100);
      b2 && (t4 = requestAnimationFrame(u3));
    })(x2)), u2 = void 0;
  }, n.__c = function(t3, u3) {
    u3.some(function(t4) {
      try {
        t4.__h.forEach(g2), t4.__h = t4.__h.filter(function(n2) {
          return !n2.__ || j2(n2);
        });
      } catch (r3) {
        u3.some(function(n2) {
          n2.__h && (n2.__h = []);
        }), u3 = [], n.__e(r3, t4.__v);
      }
    }), a2 && a2(t3, u3);
  }, n.unmount = function(t3) {
    v2 && v2(t3);
    var u3 = t3.__c;
    if (u3 && u3.__H) try {
      u3.__H.__.forEach(g2);
    } catch (t4) {
      n.__e(t4, u3.__v);
    }
  };
  var b2 = "function" == typeof requestAnimationFrame;
  function g2(n2) {
    var t3 = u2;
    "function" == typeof n2.__c && n2.__c(), u2 = t3;
  }
  function j2(n2) {
    var t3 = u2;
    n2.__c = n2.__(), u2 = t3;
  }
  function k2(n2, t3) {
    return !n2 || n2.length !== t3.length || t3.some(function(t4, u3) {
      return t4 !== n2[u3];
    });
  }
  function w2(n2, t3) {
    return "function" == typeof t3 ? t3(n2) : t3;
  }

  // src/gallery.tsx
  var preact = (init_preact_module(), __toCommonJS(preact_module_exports));
  function Gallery(props) {
    const storage = props.gallery;
    const cells = storage.map(([name, uri], index) => {
      return /* @__PURE__ */ preact.h(
        GalleryCell,
        {
          key: name + "." + uri,
          alt: `${name}`,
          src: `${uri}`,
          onClick: () => props.load(name, uri),
          onDeleteClick: () => props.requestDelete(uri)
        }
      );
    });
    return /* @__PURE__ */ preact.h("div", { className: "gallery-list" }, cells);
  }
  function GalleryCell(props) {
    return /* @__PURE__ */ preact.h(
      "div",
      {
        className: "gallery-entry",
        title: props.alt,
        onClick: props.onClick
      },
      /* @__PURE__ */ preact.h("img", { src: props.src }),
      /* @__PURE__ */ preact.h("div", { className: "gallery-delete", onClick: (e3) => {
        e3.preventDefault();
        e3.stopPropagation();
        props.onDeleteClick();
      } }, "\u274C")
    );
  }

  // src/csv.ts
  function parseCsv(content) {
    const lines = content.split(/\r?\n/g);
    const result = {
      headers: lines[0].split(/,/g),
      rows: lines.slice(1).map((s3) => s3.split(/,/g))
    };
    for (const r3 of result.rows) {
      if (r3.length !== result.headers.length) {
        throw new Error(`Malformed line: ${JSON.stringify(r3)} length doesn't match header size (${result.headers.length})`);
      }
    }
    return result;
  }

  // src/color-data.ts
  function parseColorFile(name, s3) {
    const res = {
      name,
      colors: []
    };
    const rgx1 = /^(\S\S)(\S\S)(\S\S)\.([^.]+)\.(.*)$/gm;
    let m3;
    while (m3 = rgx1.exec(s3)) {
      res.colors.push({
        r: parseInt(m3[1], 16),
        g: parseInt(m3[2], 16),
        b: parseInt(m3[3], 16),
        code: m3[4],
        name: m3[5]
      });
    }
    if (res.colors.length) {
      return res;
    }
    const rgx2 = /^(\S\S)(\S\S)(\S\S)(.*)$/gm;
    while (m3 = rgx2.exec(s3)) {
      res.colors.push({
        r: parseInt(m3[1], 16),
        g: parseInt(m3[2], 16),
        b: parseInt(m3[3], 16),
        name: m3[4]
      });
    }
    return res;
  }
  function loadColorData() {
    const colorDataRaw = parseCsv(require_color_data_new());
    console.assert(colorDataRaw.headers[0] === "R", "R");
    console.assert(colorDataRaw.headers[1] === "G", "G");
    console.assert(colorDataRaw.headers[2] === "B", "B");
    console.assert(colorDataRaw.headers[3] === "Name", "Name");
    const sets = [];
    for (let i3 = 4; i3 < colorDataRaw.headers.length; i3++) {
      sets.push({
        name: colorDataRaw.headers[i3],
        colors: []
      });
    }
    for (const r3 of colorDataRaw.rows) {
      for (let i3 = 4; i3 < r3.length; i3++) {
        const codeInThisSet = r3[i3];
        if (codeInThisSet.length) {
          const entry = {
            r: parseInt(r3[0]),
            g: parseInt(r3[1]),
            b: parseInt(r3[2]),
            name: r3[3]
          };
          if (codeInThisSet !== "1") {
            entry.code = r3[i3];
          }
          sets[i3 - 4].colors.push(entry);
        }
      }
    }
    sets.push(parseColorFile("dmc", require_dmc()));
    sets.push(parseColorFile("lego", require_lego()));
    return { sets };
  }

  // src/ictcp.ts
  var m1 = 2610 / 16384;
  function PQ(L2, M2, S2) {
    return [PQf(L2), PQf(M2), PQf(S2)];
  }
  function PQf(n2) {
    let num = 3424 / 4096 + 2413 / 128 * Math.pow(n2 / 1e4, m1);
    let denom = 1 + 2392 / 128 * Math.pow(n2 / 1e4, m1);
    return Math.pow(
      (3424 / 4096 + 2413 / 128 * Math.pow(n2 / 1e4, m1)) / (1 + 2392 / 128 * Math.pow(n2 / 1e4, m1)),
      2523 / 32
    );
  }
  function rgbToXyz(r3, g3, b3) {
    r3 = sRGBtoLinearRGB(r3 / 255);
    g3 = sRGBtoLinearRGB(g3 / 255);
    b3 = sRGBtoLinearRGB(b3 / 255);
    const X = 0.4124 * r3 + 0.3576 * g3 + 0.1805 * b3;
    const Y = 0.2126 * r3 + 0.7152 * g3 + 0.0722 * b3;
    const Z = 0.0193 * r3 + 0.1192 * g3 + 0.9505 * b3;
    return [X, Y, Z];
  }
  function xyzToXYZa(xyz) {
    return xyz.map((n2) => Math.max(n2 * 203, 0));
  }
  function sRGBtoLinearRGB(color) {
    if (color <= 0.04045) {
      return color / 12.92;
    }
    return Math.pow((color + 0.055) / 1.055, 2.4);
  }
  function rgbToICtCp(arg) {
    const xyz = rgbToXyz(arg.r, arg.g, arg.b);
    const xyza = xyzToXYZa(xyz);
    const [R, G, B] = xyza;
    const L2 = 0.3592 * R + 0.6976 * G - 0.0358 * B;
    const M2 = -0.1922 * R + 1.1004 * G + 0.0755 * B;
    const S2 = 7e-3 * R + 0.0749 * G + 0.8434 * B;
    const [Lp, Mp, Sp] = PQ(L2, M2, S2);
    const I2 = 0.5 * Lp + 0.5 * Mp;
    const Ct = (6610 * Lp - 13613 * Mp + 7003 * Sp) / 4096;
    const Cp = (17933 * Lp - 17390 * Mp - 543 * Sp) / 4096;
    return [I2, Ct, Cp];
  }

  // src/utils.tsx
  var preact2 = (init_preact_module(), __toCommonJS(preact_module_exports));
  var diff = require_lib();
  var symbolAlphabet = "ABCDEFGHJKLMNPQRSTVXZ\u03B1\u03B2\u0394\u03B8\u03BB\u03C0\u03A6\u03A8\u03A9abcdefghijklmnopqrstuvwxyz0123456789";
  var GridFormats = {
    "perler": {
      size: [29, 29],
      pitch: 139.75 / (29 - 1)
    },
    "artkal-mini": {
      size: [50, 50],
      pitch: 137.8 / (50 - 1)
    },
    "perler-mini": {
      size: [56, 56],
      pitch: 147.9 / (56 - 1)
    },
    "16 ct": {
      size: [16, 16],
      pitch: 25.4 / 16
    },
    "30 ct": {
      size: [30, 30],
      pitch: 25.4 / 30
    },
    // https://orionrobots.co.uk/wiki/lego_specifications.html
    "lego": {
      size: [32, 32],
      pitch: 8
    },
    "funzbo": {
      size: [29, 29],
      pitch: 139.1 / (29 - 1)
    },
    "evoretro": {
      size: [29, 29],
      pitch: 139.3 / (29 - 1)
    }
  };
  function getPitch(size) {
    return GridFormats[size].pitch;
  }
  function getGridSize(size) {
    return GridFormats[size].size;
  }
  function colorEntryToHtml(c3) {
    return "rgb(" + c3.r + "," + c3.g + "," + c3.b + ")";
  }
  function colorEntryToHex(c3) {
    return "#" + hx(c3.r) + hx(c3.g) + hx(c3.b);
  }
  function hx(n2) {
    if (n2 === void 0) return "";
    if (n2 === 0) return "00";
    if (n2 < 16) return "0" + n2.toString(16);
    return n2.toString(16);
  }
  function isBright(i3) {
    return i3.r + i3.g * 1.4 + i3.b > 460;
  }
  function timer() {
    let last = Date.now();
    return { mark };
    function mark(event) {
      if (window.location.hostname === "localhost" || window.location.search === "?dev") {
        const n2 = Date.now();
        console.log(`PERF: '${event}' finished in ${n2 - last}ms`);
        last = n2;
      }
    }
  }
  function carveImageFast(image, carveSize) {
    const rowOccupancyMatrix = [];
    for (let y3 = 0; y3 < image.height; y3++) {
      rowOccupancyMatrix[y3] = [];
      let counter = 0;
      for (let x3 = image.width - 1; x3 >= -carveSize; x3--) {
        const px = image.pixels[y3][x3];
        if (x3 < 0 || (px === void 0 || px === -1)) {
          if (counter > 0) counter--;
        } else {
          counter = carveSize;
        }
        rowOccupancyMatrix[y3][x3 + carveSize] = counter !== 0;
      }
    }
    const occupancyMatrix = [];
    for (let x3 = 0; x3 < image.width + carveSize; x3++) {
      occupancyMatrix[x3] = [];
      let counter = 0;
      for (let y3 = image.height - 1; y3 >= -carveSize; y3--) {
        if (y3 >= 0 && rowOccupancyMatrix[y3][x3]) {
          counter = carveSize;
        } else {
          if (counter > 0) counter--;
        }
        occupancyMatrix[x3][y3 + carveSize] = counter > 0;
      }
    }
    let xOffset = 0;
    let yOffset = 0;
    let bestCount = Infinity;
    for (let y3 = 0; y3 < carveSize; y3++) {
      for (let x3 = 0; x3 < carveSize; x3++) {
        let occCount = 0;
        for (let oy = y3; oy < image.height + carveSize; oy += carveSize) {
          for (let ox = x3; ox < image.width + carveSize; ox += carveSize) {
            if (occupancyMatrix[ox][oy]) occCount++;
          }
        }
        if (occCount < bestCount) {
          xOffset = x3;
          yOffset = y3;
          bestCount = occCount;
        }
      }
    }
    return { xOffset, yOffset };
  }
  function carve(width, height, xSize, ySize) {
    const res = [];
    const xa = carveAxis(width, xSize);
    const ya = carveAxis(height, ySize);
    let cy = 0;
    let row = 0;
    for (const y3 of ya) {
      let cx = 0;
      let col = 0;
      row++;
      for (const x3 of xa) {
        col++;
        res.push({
          x: cx,
          y: cy,
          row,
          col,
          width: x3,
          height: y3
        });
        cx += x3;
      }
      cy += y3;
    }
    return res;
  }
  function carveAxis(width, size) {
    if (width <= size) return [width];
    if (width <= size * 2) {
      return [Math.ceil(width / 2), Math.floor(width / 2)];
    }
    const remainder = width % size;
    let res = [remainder];
    let remaining = width - res[0];
    while (remaining > size) {
      res.push(size);
      remaining -= size;
    }
    res.push(remaining);
    return res;
  }
  function assertNever(n2, message) {
    throw new Error(`Invalid ${n2} - ${message}`);
  }
  function nameOfColor(color) {
    if (color.code === void 0) {
      return color.name;
    }
    return `${color.code} (${color.name})`;
  }
  function dollars(amt) {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return formatter.format(amt);
  }
  function feetInches(mm) {
    const inches = mm / 25.4;
    if (inches < 12) {
      return `${inches.toFixed(1)}\u2033`;
    }
    return `${Math.floor(inches / 12)}\u2032${String.fromCharCode(8201)}${Math.round(inches % 12)}\u2033`;
  }
  function timeAmount(seconds) {
    const minutes = Math.ceil(seconds / 60);
    if (minutes < 1) {
      return `1 minute`;
    } else if (minutes < 60) {
      return `${minutes} minutes`;
    } else if (minutes < 120) {
      return `${Math.floor(minutes / 60)}:${Math.floor(minutes % 60)}`;
    }
    return `${Math.ceil(minutes / 60)} hours`;
  }

  // src/palettizer.ts
  var diff2 = require_lib();
  function palettize(rgbaArray, palette) {
    const pixels = [];
    const colorLookup = /* @__PURE__ */ new Map();
    for (const p3 of palette) {
      colorLookup.set(p3.color, p3.target);
    }
    for (let y3 = 0; y3 < rgbaArray.height; y3++) {
      const row = [];
      for (let x3 = 0; x3 < rgbaArray.width; x3++) {
        if (rgbaArray.pixels[y3][x3] === -1) {
          row.push(void 0);
        } else {
          row.push(colorLookup.get(rgbaArray.pixels[y3][x3]));
        }
      }
      pixels.push(row);
    }
    return {
      pixels,
      width: rgbaArray.width,
      height: rgbaArray.height
    };
  }
  function surveyColors(rgbaArray) {
    const perf = timer();
    const inputColors = [];
    const colorToColor = /* @__PURE__ */ new Map();
    for (let y3 = 0; y3 < rgbaArray.height; y3++) {
      for (let x3 = 0; x3 < rgbaArray.width; x3++) {
        const color = rgbaArray.pixels[y3][x3];
        if (color === -1) continue;
        if (colorToColor.has(color)) {
          colorToColor.get(color).count++;
        } else {
          const entry = {
            color,
            count: 1,
            r: color & 255,
            g: color >> 8 & 255,
            b: color >> 16 & 255
          };
          inputColors.push(entry);
          colorToColor.set(color, entry);
        }
      }
    }
    perf.mark(`Palette: Survey colors (${inputColors.length}) and counts`);
    return inputColors;
  }
  function makePalette(inputColors, allowedColors, settings) {
    const perf = timer();
    const noDuplicates = settings.nodupes && (!allowedColors || inputColors.length < allowedColors.length);
    const tempAssignments = [];
    inputColors.sort((a3, b3) => b3.count - a3.count);
    const diff3 = colorDiff[settings.colorMatch];
    for (const inColor of inputColors) {
      if (allowedColors === void 0) {
        const { r: r3, g: g3, b: b3 } = inColor;
        tempAssignments.push({
          color: inColor.color,
          target: {
            r: r3,
            g: g3,
            b: b3,
            name: colorEntryToHex({ r: r3, g: g3, b: b3 }),
            code: ""
          },
          count: inColor.count
        });
      } else {
        let targetColor = inColor;
        if (settings.matchBlackAndWhite && (inColor.r === inColor.g && inColor.g === inColor.b)) {
          let rgb;
          if (inColor.r > 208) {
            rgb = 255 - (255 - inColor.r) * 0.5;
          } else if (inColor.r < 41) {
            rgb = inColor.r * 0.3;
          } else {
            rgb = inColor.r;
          }
          targetColor = {
            ...inColor,
            r: rgb,
            b: rgb,
            g: rgb
          };
        }
        let bestTarget = void 0;
        let bestScore = Infinity;
        for (const c3 of allowedColors) {
          if (noDuplicates) {
            if (tempAssignments.some((t3) => t3.target === c3)) continue;
          }
          const score = diff3(targetColor, c3);
          if (score < bestScore) {
            bestTarget = c3;
            bestScore = score;
          }
        }
        if (bestTarget === void 0) throw new Error("impossible");
        tempAssignments.push({
          color: inColor.color,
          target: bestTarget,
          count: inColor.count
        });
      }
    }
    perf.mark("Palette: Assign color entries");
    return tempAssignments;
  }
  var colorDiff = {
    rgb: (lhs, rhs) => {
      return Math.pow(lhs.r - rhs.r, 2) * 3 + Math.pow(lhs.g - rhs.g, 2) * 4 + Math.pow(lhs.b - rhs.b, 2) * 2;
    },
    rgb2: (r3, g3, b3, rhs) => {
      return Math.pow(r3 - rhs.r, 2) * 3 + Math.pow(g3 - rhs.g, 2) * 4 + Math.pow(b3 - rhs.b, 2) * 2;
    },
    "ciede2000": (lhs, rhs) => {
      return diff2.diff(rgbToLabCached(lhs), rgbToLabCached(rhs));
    },
    "ictcp": (lhs, rhs) => {
      const a3 = rgbToICtCp(lhs), b3 = rgbToICtCp(rhs);
      const di = a3[0] - b3[0], dct = (a3[1] - b3[1]) / 2, dcp = a3[2] - b3[2];
      return di * di + dct * dct + dcp * dcp;
    }
  };
  function rgbToLabCached(rgb) {
    if ("_lab" in rgb) {
      return rgb["_lab"];
    }
    return rgb["_lab"] = diff2.rgb_to_lab({ R: rgb.r, G: rgb.g, B: rgb.b });
  }

  // src/image-utils.tsx
  var colorData = loadColorData();
  function imageDataToRgbaArray(imageData) {
    const raw = [];
    for (let y3 = 0; y3 < imageData.height; y3++) {
      const row = [];
      for (let x3 = 0; x3 < imageData.width; x3++) {
        const b3 = 4 * (y3 * imageData.width + x3);
        if (imageData.data[b3 + 3] === 255) {
          row.push((imageData.data[b3 + 2] << 16) + (imageData.data[b3 + 1] << 8) + imageData.data[b3]);
        } else {
          row.push(-1);
        }
      }
      raw.push(row);
    }
    return {
      pixels: raw,
      width: imageData.width,
      height: imageData.height
    };
  }
  function applyImageAdjustments(image, brightnessPct, contrastPct, saturationPct, flip, mirror) {
    const srcCanvas = document.createElement("canvas");
    srcCanvas.width = image.width;
    srcCanvas.height = image.height;
    const srcContext = srcCanvas.getContext("2d");
    srcContext.putImageData(image, 0, 0);
    const dstCanvas = document.createElement("canvas");
    dstCanvas.width = image.width;
    dstCanvas.height = image.height;
    const dstContext = dstCanvas.getContext("2d");
    dstContext.filter = `saturate(${saturationPct}%) brightness(${brightnessPct}%) contrast(${contrastPct}%)`;
    if (flip) {
      dstContext.scale(1, -1);
      dstContext.translate(0, -image.height);
    }
    if (mirror) {
      dstContext.scale(-1, 1);
      dstContext.translate(-image.width, 0);
    }
    dstContext.drawImage(srcCanvas, 0, 0);
    return dstContext.getImageData(0, 0, image.width, image.height);
  }
  function descale(imageData) {
    const { mark } = timer();
    const { data, width, height } = imageData;
    for (const scaleChk of [8, 7, 6, 5, 4, 3, 2]) {
      for (let xOffset = 0; xOffset < scaleChk; xOffset++) {
        for (let yOffset = 0; yOffset < scaleChk; yOffset++) {
          let match = true;
          for (let x3 = xOffset; x3 < width; x3 += scaleChk) {
            for (let y3 = yOffset; y3 < height; y3 += scaleChk) {
              for (let xi = 1; xi < scaleChk; xi++) {
                for (let yi = 1; yi < scaleChk; yi++) {
                  if (!areSame(x3 + xi, y3 + yi, x3, y3)) {
                    match = false;
                    break;
                  }
                }
                if (!match) break;
              }
              if (!match) break;
            }
            if (!match) break;
          }
          if (match) {
            const newData = new ImageData(Math.floor((width - xOffset) / scaleChk), Math.floor((height - yOffset) / scaleChk));
            let c3 = 0;
            for (let y3 = 0; y3 < newData.height; y3++) {
              for (let x3 = 0; x3 < newData.width; x3++) {
                const src = ((y3 * scaleChk + yOffset) * width + x3 * scaleChk + xOffset) * 4;
                const dst = (y3 * newData.width + x3) * 4;
                newData.data[dst] = data[src];
                newData.data[dst + 1] = data[src + 1];
                newData.data[dst + 2] = data[src + 2];
                newData.data[dst + 3] = data[src + 3];
              }
            }
            mark(`Descale with match ${width}x${height} (${scaleChk} ${xOffset} ${yOffset}) -> ${newData.width}x${newData.height}`);
            return newData;
          }
        }
      }
    }
    mark("Descale with no match");
    return imageData;
    function areSame(x0, y0, x1, y1) {
      if (x0 >= imageData.width || y0 >= imageData.height) return true;
      const c0 = (y0 * imageData.width + x0) * 4;
      const c1 = (y1 * imageData.width + x1) * 4;
      return data[c0] === data[c1] && data[c0 + 1] === data[c1 + 1] && data[c0 + 2] === data[c1 + 2] && data[c0 + 3] === data[c1 + 3];
    }
  }
  function applyTransparencyAndCrop(imageData, transparentValue, keepOutline) {
    const keepArray = new Array(imageData.width * imageData.height);
    let minY = Infinity, maxY = -Infinity;
    let minX = Infinity, maxX = -Infinity;
    if (isNaN(transparentValue)) {
      minX = minY = 0;
      maxX = imageData.width - 1;
      maxY = imageData.height - 1;
      keepArray.fill(true, 0, keepArray.length);
    } else {
      keepArray.fill(false, 0, keepArray.length);
      for (let y3 = 0; y3 < imageData.height; y3++) {
        for (let x3 = 0; x3 < imageData.width; x3++) {
          const keep = !isTransparent(colorAt(imageData, x3, y3));
          if (keep) {
            minX = Math.min(minX, x3);
            maxX = Math.max(maxX, x3);
            minY = Math.min(minY, y3);
            maxY = Math.max(maxY, y3);
            keepArray[y3 * imageData.width + x3] = true;
            if (keepOutline) {
              if (x3 !== 0) keepArray[y3 * imageData.width + (x3 - 1)] = true;
              if (y3 !== 0) keepArray[(y3 - 1) * imageData.width + x3] = true;
              if (x3 !== imageData.width - 1) keepArray[y3 * imageData.width + (x3 + 1)] = true;
              if (y3 !== imageData.height - 1) keepArray[(y3 + 1) * imageData.width + x3] = true;
            }
          }
        }
      }
      if (keepOutline) {
        if (minX !== 0) minX--;
        if (minY !== 0) minY--;
        if (maxX !== imageData.width - 1) maxX++;
        if (maxY !== imageData.height - 1) maxY++;
      }
    }
    const newImage = new ImageData(maxX - minX + 1, maxY - minY + 1);
    for (let y3 = 0; y3 < newImage.height; y3++)
      for (let x3 = 0; x3 < newImage.width; x3++)
        newImage.data[(y3 * newImage.width + x3) * 4 + 3] = 0;
    for (let y3 = minY; y3 <= maxY; y3++) {
      for (let x3 = minX; x3 <= maxX; x3++) {
        const color = colorAt(imageData, x3, y3);
        const c3 = ((y3 - minY) * newImage.width + (x3 - minX)) * 4;
        if (keepArray[y3 * imageData.width + x3]) {
          newImage.data[c3 + 0] = color >> 0 & 255;
          newImage.data[c3 + 1] = color >> 8 & 255;
          newImage.data[c3 + 2] = color >> 16 & 255;
          newImage.data[c3 + 3] = 255;
        }
      }
    }
    return newImage;
    function isTransparent(n2) {
      if (isNaN(transparentValue)) return false;
      if (transparentValue === 0) {
        return (n2 >> 24) * 255 === 0;
      }
      return (n2 & 16777215) === (transparentValue & 16777215);
    }
  }
  function getImageData(img) {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, img.width, img.height);
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    return imageData;
  }
  function inferTransparencyValue(imageData) {
    let hasEdgeMagenta = false;
    for (let y3 = 0; y3 < imageData.height; y3++) {
      const isYedge = y3 === 0 || y3 === imageData.height - 1;
      for (let x3 = 0; x3 < imageData.width; x3++) {
        const c3 = 4 * (y3 * imageData.width + x3);
        if (imageData.data[c3 + 3] === 0) {
          return 0;
        }
        if (isYedge || x3 === 0 || x3 === imageData.width - 1) {
          if (imageData.data[c3 + 0] === 255 && imageData.data[c3 + 1] === 0 && imageData.data[c3 + 2] === 255) {
            hasEdgeMagenta = true;
          }
        }
      }
    }
    if (hasEdgeMagenta) return 16711935;
    return getCornerTransparency(imageData);
  }
  function getCornerTransparency(rgbaArray) {
    const arr = [
      colorAt(rgbaArray, 0, 0),
      colorAt(rgbaArray, 0, rgbaArray.height - 1),
      colorAt(rgbaArray, rgbaArray.width - 1, 0),
      colorAt(rgbaArray, rgbaArray.width - 1, rgbaArray.height)
    ];
    arr.sort();
    if (arr[1] === arr[2]) {
      return arr[1];
    }
    return 0;
  }
  function colorAt(img, x3, y3) {
    const c3 = (y3 * img.width + x3) * 4;
    return img.data[c3 + 0] << 0 | img.data[c3 + 1] << 8 | img.data[c3 + 2] << 16 | img.data[c3 + 3] << 24;
  }
  function adjustImage(imageData, imageSettings) {
    const { mark } = timer();
    mark("Image -> RGBA");
    let transparency;
    switch (imageSettings.transparency) {
      case "auto":
        mark("Infer transparency");
        transparency = inferTransparencyValue(imageData);
        break;
      case "alpha":
        transparency = 0;
        break;
      case "none":
        transparency = NaN;
        break;
      case "magenta":
        transparency = 4294902015;
        break;
      case "corners":
        transparency = getCornerTransparency(imageData);
        break;
    }
    const descaledImageData = imageSettings.descale ? descale(imageData) : imageData;
    const croppedImageData = applyTransparencyAndCrop(descaledImageData, transparency, imageSettings.keepOutline);
    mark("Apply transparency & crop");
    const originalSize = [croppedImageData.width, croppedImageData.height];
    const maxSize = isTrueColorImage(croppedImageData, 256) ? 96 : 480;
    const downsize = maxDimension(originalSize, maxSize);
    const rescaledImageData = downsize === originalSize ? croppedImageData : resizeImage(croppedImageData, downsize);
    const adjustedImageData = applyImageAdjustments(
      rescaledImageData,
      imageSettings.brightness * 10 + 100,
      imageSettings.contrast * 10 + 100,
      imageSettings.saturation * 10 + 100,
      imageSettings.flip,
      imageSettings.mirror
    );
    mark("Adjust image");
    return adjustedImageData;
  }
  function maxDimension(size, max) {
    if (size[0] <= max && size[1] <= max) return size;
    const scale = Math.max(size[0] / max, size[1] / max);
    return [Math.round(size[0] / scale), Math.round(size[1] / scale)];
  }
  function palettizeImage(rgbaArray, materialSettings, imageProps) {
    const { mark } = timer();
    let allowedColors;
    switch (materialSettings.palette) {
      case "dmc":
        allowedColors = colorData.sets.filter((f3) => f3.name === "dmc")[0].colors;
        break;
      case "lego":
        allowedColors = colorData.sets.filter((f3) => f3.name === "lego")[0].colors;
        break;
      case "artkal-all-mini":
        allowedColors = colorData.sets.filter((f3) => f3.name === "Artkal Mini")[0].colors;
        break;
      case "artkal-mini-starter":
        allowedColors = colorData.sets.filter((f3) => f3.name === "Artkal Mini Starter")[0].colors;
        break;
      case "perler-all":
        allowedColors = colorData.sets.filter((f3) => f3.name === "All Perler")[0].colors;
        break;
      case "perler-multimix":
        allowedColors = colorData.sets.filter((f3) => f3.name === "Perler Multi Mix")[0].colors;
        break;
      case "evoretro":
        allowedColors = colorData.sets.filter((f3) => f3.name === "EvoRetro")[0].colors;
        break;
      case "funzbo":
        allowedColors = colorData.sets.filter((f3) => f3.name === "Funzbo")[0].colors;
        break;
      case "all":
        allowedColors = void 0;
        break;
      default:
        assertNever(materialSettings.palette, "Unknown palette");
    }
    const survey = surveyColors(rgbaArray);
    let doDither;
    if (allowedColors === void 0) {
      doDither = false;
    } else if (imageProps.dithering === "auto") {
      doDither = survey.length > 256;
    } else {
      doDither = imageProps.dithering === "on";
    }
    let quantized;
    if (doDither) {
      quantized = dither(rgbaArray, allowedColors);
    } else {
      const palette = makePalette(survey, allowedColors, materialSettings);
      mark("Create palette");
      quantized = palettize(rgbaArray, palette);
      mark("Apply palette");
    }
    return {
      /*palette,*/
      rgbaArray,
      quantized
    };
  }
  function createPartListImage(quantized) {
    const partList = getPartList(quantized);
    const res = new Array(quantized.height);
    const lookup = /* @__PURE__ */ new Map();
    for (let i3 = 0; i3 < partList.length; i3++) {
      lookup.set(partList[i3].target, i3);
    }
    for (let y3 = 0; y3 < quantized.height; y3++) {
      res[y3] = new Array(quantized.width);
      for (let x3 = 0; x3 < quantized.width; x3++) {
        const px = quantized.pixels[y3][x3];
        if (px === void 0) {
          res[y3][x3] = -1;
        } else {
          res[y3][x3] = lookup.get(px);
        }
      }
    }
    return {
      pixels: res,
      width: quantized.width,
      height: quantized.height,
      partList
    };
  }
  function getPartList(quantized) {
    const lookup = /* @__PURE__ */ new Map();
    for (let y3 = 0; y3 < quantized.height; y3++) {
      for (let x3 = 0; x3 < quantized.width; x3++) {
        const c3 = quantized.pixels[y3][x3];
        if (c3 === void 0) continue;
        const entry = lookup.get(c3);
        if (entry === void 0) {
          lookup.set(c3, { count: 1, target: c3, symbol: "#" });
        } else {
          entry.count++;
        }
      }
    }
    const res = [];
    for (const entry of lookup.entries()) {
      res.push(entry[1]);
    }
    res.sort((a3, b3) => b3.count - a3.count);
    for (let i3 = 0; i3 < res.length; i3++) {
      res[i3].symbol = symbolAlphabet[i3];
    }
    return res;
  }
  function getImageStats(image) {
    return {
      pixels: image.partList.reduce((a3, b3) => a3 + b3.count, 0)
    };
  }
  function renderPartListImageToDataURL(image, maxPartFrame = Infinity) {
    const buffer = new Uint8ClampedArray(image.width * image.height * 4);
    const partList = image.partList.map((p3) => p3.target);
    for (let x3 = 0; x3 < image.width; x3++) {
      for (let y3 = 0; y3 < image.height; y3++) {
        const c3 = (y3 * image.width + x3) * 4;
        const px = image.pixels[y3][x3];
        if (px !== -1 && px < maxPartFrame) {
          const color = image.partList[px];
          buffer[c3 + 0] = color.target.r;
          buffer[c3 + 1] = color.target.g;
          buffer[c3 + 2] = color.target.b;
          buffer[c3 + 3] = 255;
        } else {
          buffer[c3 + 3] = 0;
        }
      }
    }
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    const data = ctx.createImageData(image.width, image.height);
    data.data.set(buffer);
    ctx.putImageData(data, 0, 0);
    return canvas.toDataURL();
  }
  function resizeImage(imageData, downsize) {
    const src = document.createElement("canvas");
    src.width = imageData.width;
    src.height = imageData.height;
    src.getContext("2d").putImageData(imageData, 0, 0);
    const dst = document.createElement("canvas");
    [dst.width, dst.height] = downsize;
    const context = dst.getContext("2d");
    context.scale(downsize[0] / imageData.width, downsize[1] / imageData.height);
    context.drawImage(src, 0, 0);
    return context.getImageData(0, 0, downsize[0], downsize[1]);
  }
  function dither(image, allowedColors) {
    const perf = timer();
    const chR = image.pixels.map((line) => line.map((e3) => e3 & 255));
    const chG = image.pixels.map((line) => line.map((e3) => e3 >> 8 & 255));
    const chB = image.pixels.map((line) => line.map((e3) => e3 >> 16 & 255));
    perf.mark("Create channel arrays");
    const pixels = new Array(image.height);
    for (let y3 = 0; y3 < image.height; y3++) {
      pixels[y3] = new Array(image.width);
      if (y3 % 2 === 0) {
        for (let x3 = 0; x3 < image.width; x3++) {
          quantize(x3, y3, true);
        }
      } else {
        for (let x3 = image.width - 1; x3 >= 0; x3--) {
          quantize(x3, y3, false);
        }
      }
    }
    perf.mark("Dither");
    console.trace();
    return {
      pixels,
      width: image.width,
      height: image.height
    };
    function quantize(x3, y3, rightScanning) {
      if (image.pixels[y3][x3] === -1) {
        pixels[y3][x3] = void 0;
      } else {
        let bestError = Infinity;
        let bestColor = void 0;
        for (const c3 of allowedColors) {
          const e3 = colorDiff.rgb2(chR[y3][x3], chG[y3][x3], chB[y3][x3], c3);
          if (e3 < bestError) {
            bestColor = c3;
            bestError = e3;
          }
        }
        pixels[y3][x3] = bestColor;
        const er = bestColor.r - chR[y3][x3], eg = bestColor.g - chG[y3][x3], eb = bestColor.b - chB[y3][x3];
        if (rightScanning) {
          applyError(x3 + 1, y3 + 0, er, eg, eb, 7 / 16);
          applyError(x3 - 1, y3 + 1, er, eg, eb, 3 / 16);
          applyError(x3 + 0, y3 + 1, er, eg, eb, 5 / 16);
          applyError(x3 + 1, y3 + 1, er, eg, eb, 1 / 16);
        } else {
          applyError(x3 - 1, y3 + 0, er, eg, eb, 7 / 16);
          applyError(x3 + 1, y3 + 1, er, eg, eb, 3 / 16);
          applyError(x3 + 0, y3 + 1, er, eg, eb, 5 / 16);
          applyError(x3 - 1, y3 + 1, er, eg, eb, 1 / 16);
        }
      }
    }
    function applyError(x3, y3, r3, g3, b3, f3) {
      if (x3 < 0 || x3 >= image.width) return;
      if (y3 < 0 || y3 >= image.height) return;
      chR[y3][x3] -= r3 * f3;
      chG[y3][x3] -= g3 * f3;
      chB[y3][x3] -= b3 * f3;
    }
  }
  function isTrueColorImage(img, threshold) {
    const set = /* @__PURE__ */ new Set();
    let c3 = 0;
    for (let y3 = 0; y3 < img.height; y3++) {
      for (let x3 = 0; x3 < img.width; x3++) {
        set.add(
          img.data[c3 + 0] << 0 | img.data[c3 + 1] << 8 | img.data[c3 + 2] << 16 | img.data[c3 + 3] << 24
        );
        c3 += 4;
      }
      if (set.size > threshold) return true;
    }
    return false;
  }

  // src/types.tsx
  init_preact_module();
  var BuyLink = ({ code }) => {
    return /* @__PURE__ */ a("a", { href: "https://amzn.to/" + code, rel: "noreferrer", target: "_blank", title: "Buy" }, "\u{1F6D2}");
  };
  var MaterialSettings = {
    palette: [
      ["artkal-mini-starter", /* @__PURE__ */ a("span", null, "Artkal Mini Starter ", /* @__PURE__ */ a(BuyLink, { code: "3wThLo8" }))],
      ["artkal-all-mini", "All Artkal Mini"],
      ["perler-multimix", /* @__PURE__ */ a("span", null, "Perler Multi Mix ", /* @__PURE__ */ a(BuyLink, { code: "2WjPiLU" }))],
      ["perler-all", /* @__PURE__ */ a("span", null, "All Perler ", /* @__PURE__ */ a(BuyLink, { code: "3kPFwL9" }))],
      ["evoretro", /* @__PURE__ */ a("span", null, "Evoretro ", /* @__PURE__ */ a(BuyLink, { code: "39Lp3kO" }))],
      ["funzbo", /* @__PURE__ */ a("span", null, "Funzbo ", /* @__PURE__ */ a(BuyLink, { code: "3GDH7N3" }))],
      ["lego", /* @__PURE__ */ a("span", null, "LEGO ", /* @__PURE__ */ a(BuyLink, { code: "3omMszN" }))],
      ["dmc", /* @__PURE__ */ a("span", null, "DMC ", /* @__PURE__ */ a(BuyLink, { code: "3D4PRtf" }))],
      ["all", "All Colors"]
    ],
    size: [
      ["artkal-mini", /* @__PURE__ */ a("span", null, "Artkal Mini", /* @__PURE__ */ a(BuyLink, { code: "3eNjvcm" }))],
      ["perler-mini", /* @__PURE__ */ a("span", null, "Perler Mini", /* @__PURE__ */ a(BuyLink, { code: "2WcXJIH" }))],
      ["perler", /* @__PURE__ */ a("span", null, "Perler", /* @__PURE__ */ a(BuyLink, { code: "36U2tov" }))],
      ["evoretro", /* @__PURE__ */ a("span", null, "Evoretro", /* @__PURE__ */ a(BuyLink, { code: "39Lp3kO" }))],
      ["funzbo", /* @__PURE__ */ a("span", null, "Funzbo", /* @__PURE__ */ a(BuyLink, { code: "3GDH7N3" }))],
      ["16 ct", /* @__PURE__ */ a("span", { title: "16 threads per inch (cross-stitch)" }, "16 ct")],
      ["30 ct", /* @__PURE__ */ a("span", { title: "30 threads per inch (cross-stitch)" }, "30 ct")],
      ["lego", "LEGO \u2122"]
    ],
    colorMatch: [
      ["ciede2000", "CIEDE2000"],
      ["ictcp", "ICtCp"],
      ["rgb", "RGB"]
    ]
  };
  var ImageSettings = {
    transparency: [
      ["auto", "Auto"],
      ["alpha", "Alpha Channel"],
      ["magenta", "Magenta"],
      ["corners", "Corners"],
      ["none", "None"]
    ],
    dithering: [
      ["auto", "Auto"],
      ["on", "On"],
      ["off", "Off"]
    ]
  };
  var DisplaySettings = {
    planStyle: [
      ["symbolspans", "Symbols + Spans"],
      ["spans", "Spans"],
      ["symbols", "Symbols"],
      ["none", "None"]
    ],
    grid: [
      ["auto", "Auto"],
      ["50", "50"],
      ["25", "25"],
      ["10", "10"],
      ["none", "None"]
    ],
    background: [
      ["#777", "Grey"],
      ["#000", "Black"],
      ["#FFF", "White"],
      ["url(#checkPattern)", "Checker"],
      ["transparent", "Transparent"],
      ["url(#wood)", "Wood"]
    ],
    /*
    shaping: [
        ["melted", "Melted"],
        ["square", "Square"],
        ["circle", "Circle"],
        ["none", "None"]
    ],
    */
    refobj: [
      ["none", "None"],
      ["quarter", "Quarter"],
      ["dollar", "Dollar"],
      ["credit", "Bank Card"]
    ]
  };

  // src/components/context.ts
  init_preact_module();
  var PropContext = q(null);

  // src/components/print-dialog.tsx
  init_preact_module();

  // src/pdf-generator.ts
  async function makePdf(image, settings) {
    loadPdfAnd(() => makePdfWorker(image, settings));
  }
  async function loadPdfAnd(func) {
    const tagName = "pdf-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
      const tag1 = document.createElement("script");
      tag1.id = tagName;
      tag1.onload = () => {
        func();
      };
      tag1.src = "https://github.com/foliojs/pdfkit/releases/download/v0.12.1/pdfkit.standalone.js";
      document.head.appendChild(tag1);
    } else {
      func();
    }
  }
  function makePdfWorker(image, settings) {
    const pageMarginPts = inchesToPoints(1 / 3);
    const doc = new PDFDocument({
      size: settings.paperSize
    });
    const stream = doc.pipe(blobStream());
    if (settings.style === "legend") {
      drawLegend(doc, image);
    }
    const paperWidthPts = doc.page.width;
    const paperHeightPts = doc.page.height;
    const printableWidthPts = paperWidthPts - pageMarginPts * 2;
    const printableHeightPts = paperHeightPts - pageMarginPts * 2;
    const cellHeaderHeightPts = doc.heightOfString("Testing");
    let pitchPts;
    if (settings.imageSize === "actual") {
      pitchPts = mmToPoints(settings.pitch);
    } else if (settings.imageSize === "legible") {
      if (settings.breakStrategy === "grid") {
        pitchPts = 0.99 * Math.min((printableWidthPts - cellHeaderHeightPts) / settings.carveSize[0], (printableHeightPts - cellHeaderHeightPts) / settings.carveSize[1]);
      } else {
        pitchPts = mmToPoints(4);
      }
    } else {
      if (image.width >= image.height) {
        pitchPts = Math.min((printableWidthPts - cellHeaderHeightPts) / image.height, (printableHeightPts - cellHeaderHeightPts) / image.width);
      } else {
        pitchPts = Math.min((printableWidthPts - cellHeaderHeightPts) / image.width, (printableHeightPts - cellHeaderHeightPts) / image.height);
      }
    }
    let carveSize;
    if (settings.imageSize === "single-page") {
      carveSize = [Infinity, Infinity];
    } else if (settings.breakStrategy === "grid") {
      carveSize = settings.carveSize;
    } else {
      carveSize = [Math.floor((printableWidthPts - cellHeaderHeightPts) / pitchPts), Math.floor((printableHeightPts - cellHeaderHeightPts) / pitchPts)];
    }
    const slices = generateImageSlices(image, carveSize);
    const sliceWidth = Math.max.apply(Math.max, slices.map((s3) => s3.width));
    const sliceHeight = Math.max.apply(Math.max, slices.map((s3) => s3.height));
    const gridSizePts = {
      width: pitchPts * sliceWidth,
      height: pitchPts * sliceHeight
    };
    const textPlacement = gridSizePts.width * 1.2 > gridSizePts.height ? "top" : "side";
    const imageCellSizePts = {
      width: gridSizePts.width + (textPlacement === "side" ? cellHeaderHeightPts : 0),
      height: gridSizePts.height + (textPlacement === "top" ? cellHeaderHeightPts : 0)
    };
    if (settings.debug) {
      doc.rect(pageMarginPts, pageMarginPts, paperWidthPts - pageMarginPts * 2, paperHeightPts - pageMarginPts * 2);
      doc.stroke("red");
    }
    if (settings.style === "step-by-step") {
      const slicesToPrint = [];
      for (const slice of slices) {
        const doneMap = [];
        for (let y3 = 0; y3 < slice.height; y3++) {
          doneMap[y3] = [];
          for (let x3 = 0; x3 < slice.width; x3++) {
            doneMap[y3][x3] = false;
          }
        }
        for (let i3 = 0; i3 < image.partList.length; i3++) {
          if (isAnyPixel(slice, (p3) => p3 === image.partList[i3])) {
            slicesToPrint.push({ partIndex: i3, slice });
          }
        }
      }
      const layout = getLayout(slicesToPrint.length, paperWidthPts, paperHeightPts, pageMarginPts, imageCellSizePts.width, imageCellSizePts.height);
      const multipleSlices = slices.length > 1;
      for (const stp of slicesToPrint) {
        const pos = layout.shift();
        const done = pos.next(doc, stp.slice.width * pitchPts, stp.slice.height * pitchPts);
        printSteppedSlice({
          doc,
          image,
          partIndex: stp.partIndex,
          slice: stp.slice,
          pitch: pitchPts,
          textPlacement,
          cellHeaderHeightPts,
          multipleSlices,
          debug: settings.debug
        });
        done();
      }
    } else if (settings.style === "color") {
      const layout = getLayout(slices.length, paperWidthPts, paperHeightPts, pageMarginPts, imageCellSizePts.width, imageCellSizePts.height);
      for (const slice of slices) {
        const pos = layout.shift();
        const done = pos.next(doc, slice.width * pitchPts, slice.height * pitchPts);
        if (settings.debug) {
          doc.rect(0, 0, slice.width * pitchPts, slice.height * pitchPts);
          doc.stroke("blue");
        }
        for (let i3 = 0; i3 < image.partList.length; i3++) {
          for (let y3 = slice.y; y3 < slice.y + slice.height; y3++) {
            const cy = y3 - slice.y;
            for (let x3 = slice.x; x3 < slice.x + slice.width; x3++) {
              const cx = x3 - slice.x;
              if (image.pixels[y3][x3] === i3) {
                doc.rect(cx * pitchPts, cy * pitchPts, pitchPts, pitchPts);
              }
            }
          }
          const color = image.partList[i3].target;
          doc.fill([color.r, color.g, color.b]);
        }
        done();
      }
    } else if (settings.style === "legend") {
      const layout = getLayout(slices.length, paperWidthPts, paperHeightPts, pageMarginPts, imageCellSizePts.width, imageCellSizePts.height);
      for (const slice of slices) {
        const pos = layout.shift();
        const done = pos.next(doc, slice.width * pitchPts, slice.height * pitchPts);
        doc.fontSize(pitchPts);
        doc.font("Courier");
        for (let y3 = slice.y; y3 < slice.y + slice.height; y3++) {
          const cy = y3 - slice.y;
          for (let x3 = slice.x; x3 < slice.x + slice.width; x3++) {
            const cx = x3 - slice.x;
            const px = image.pixels[y3][x3];
            if (px === -1) continue;
            doc.text(image.partList[px].symbol, cx * pitchPts, cy * pitchPts, { align: "center", baseline: "middle", height: pitchPts, width: pitchPts });
          }
        }
        done();
      }
    }
    stream.on("finish", () => {
      window.open(stream.toBlobURL("application/pdf"), "_blank");
    });
    doc.end();
  }
  function drawLegend(doc, image) {
    doc.save();
    doc.fontSize(16);
    const symbolColumnWidth = 5 + Math.max.apply(Math, image.partList.map((p3) => doc.widthOfString(p3.symbol)));
    const codeColumnWidth = 5 + Math.max.apply(Math, image.partList.map((p3) => doc.widthOfString(p3.target.code ?? "")));
    const countColumnWidth = 5 + Math.max.apply(Math, image.partList.map((p3) => doc.widthOfString(p3.count.toLocaleString())));
    const swatchColumnWidth = 32;
    const nameColumnWidth = 5 + Math.max.apply(Math, image.partList.map((p3) => doc.widthOfString(p3.target.name)));
    const lineMargin = 2;
    const lineHeight = lineMargin * 2 + doc.heightOfString("I like you, person reading this code");
    doc.translate(inchesToPoints(1), inchesToPoints(1));
    let x3 = 0;
    let y3 = 0;
    for (let i3 = 0; i3 < image.partList.length; i3++) {
      x3 = 0;
      doc.text(image.partList[i3].symbol, x3, y3 + lineMargin, { width: symbolColumnWidth, height: lineHeight, align: "center" });
      x3 += symbolColumnWidth;
      doc.rect(x3, y3 + lineMargin, swatchColumnWidth - 5, lineHeight - lineMargin * 2);
      doc.fill([image.partList[i3].target.r, image.partList[i3].target.g, image.partList[i3].target.b]);
      doc.fillColor("black");
      x3 += swatchColumnWidth;
      doc.text(image.partList[i3].count.toLocaleString(), x3, y3 + lineMargin, { width: countColumnWidth - 5, align: "right" });
      x3 += countColumnWidth;
      const code = image.partList[i3].target.code;
      if (code !== void 0) {
        doc.text(code, x3, y3 + lineMargin, { width: codeColumnWidth });
        x3 += codeColumnWidth;
      }
      doc.text(image.partList[i3].target.name, x3, y3 + lineMargin, { width: nameColumnWidth });
      x3 += nameColumnWidth;
      doc.moveTo(0, y3);
      doc.lineTo(x3, y3);
      doc.stroke("grey");
      y3 += lineHeight;
    }
    doc.restore();
    doc.addPage();
  }
  function generateImageSlices(image, size) {
    const carves1 = carve(image.width, image.height, size[0], size[1]);
    const carves2 = carve(image.width, image.height, size[1], size[0]);
    const carves = carves1.length <= carves2.length ? carves1 : carves2;
    return carves.map((c3) => ({
      image,
      width: c3.width,
      height: c3.height,
      x: c3.x,
      y: c3.y,
      row: c3.row,
      col: c3.col,
      forEach: makeForEach(image, c3.x, c3.y, c3.width, c3.height)
    })).filter((slice) => isAnyPixel(slice, (p3) => !!p3));
  }
  function isAnyPixel(slice, test) {
    for (let x3 = slice.x; x3 < slice.x + slice.width; x3++) {
      for (let y3 = slice.y; y3 < slice.y + slice.height; y3++) {
        if (test(slice.image.partList[slice.image.pixels[y3][x3]])) return true;
      }
    }
    return false;
  }
  function makeForEach(image, x0, y0, width, height, test) {
    return function(callback) {
      for (let x3 = x0; x3 < x0 + width; x3++) {
        for (let y3 = y0; y3 < y0 + height; y3++) {
          const p3 = image.pixels[y3][x3];
          const color = image.partList[p3];
          if (color && (!test || test(color))) {
            callback(x3 - x0, y3 - y0, color);
          }
        }
      }
    };
  }
  function printSteppedSlice(opts) {
    const {
      image,
      partIndex,
      doc,
      slice,
      pitch
    } = opts;
    const gridSizePts = {
      width: slice.width * pitch,
      height: slice.height * pitch
    };
    const text = opts.multipleSlices ? `${nameOfColor(image.partList[partIndex].target)} Row ${slice.row} Col ${slice.col}` : `${nameOfColor(image.partList[partIndex].target)}`;
    if (opts.textPlacement === "side") {
      if (opts.debug) {
        doc.rect(0, 0, gridSizePts.width + opts.cellHeaderHeightPts, gridSizePts.height);
        doc.stroke("blue");
      }
      doc.translate(opts.cellHeaderHeightPts, 0);
      doc.save();
      doc.rotate(-90);
      doc.translate(-gridSizePts.height, 0);
      doc.text(text, 0, 0, { baseline: "bottom", align: "center", width: gridSizePts.height, ellipsis: true });
      doc.restore();
    } else {
      if (opts.debug) {
        doc.rect(0, 0, gridSizePts.width, gridSizePts.height + opts.cellHeaderHeightPts);
        doc.stroke("blue");
      }
      doc.translate(0, opts.cellHeaderHeightPts);
      doc.text(text, 0, 0, { baseline: "bottom", align: "center", width: gridSizePts.width, ellipsis: true });
    }
    doc.rect(0, 0, gridSizePts.width, gridSizePts.height);
    doc.lineWidth(1);
    doc.stroke("grey");
    traceOwnPixels();
    doc.fill("black");
    tracePriorPixels();
    doc.lineWidth(1.3);
    doc.stroke("grey");
    function traceOwnPixels() {
      for (let y3 = slice.y; y3 < slice.y + slice.height; y3++) {
        const cyPts = (y3 - slice.y + 0.5) * pitch;
        for (let x3 = slice.x; x3 < slice.x + slice.width; x3++) {
          if (image.pixels[y3][x3] === partIndex) {
            const cxPts = (x3 - slice.x + 0.5) * pitch;
            doc.circle(cxPts, cyPts, pitch / 2.5);
          }
        }
      }
    }
    function tracePriorPixels() {
      const alreadyPlotted = /* @__PURE__ */ new Map();
      for (let y3 = slice.y; y3 < slice.y + slice.height; y3++) {
        outline(slice.x, slice.x + slice.width, (x3) => isPrior(x3, y3), (x3) => plot(x3, y3));
      }
      for (let x3 = slice.x; x3 < slice.x + slice.width; x3++) {
        outline(slice.y, slice.y + slice.height, (y3) => isPrior(x3, y3), (y3) => plot(x3, y3));
      }
      function plot(x3, y3) {
        const s3 = x3 + "-" + y3;
        if (alreadyPlotted.has(s3)) return;
        alreadyPlotted.set(s3, true);
        const cxPts = (x3 - slice.x) * pitch;
        const cyPts = (y3 - slice.y) * pitch;
        doc.moveTo(cxPts + pitch * 0.3, cyPts + pitch * 0.3);
        doc.lineTo(cxPts + pitch * 0.7, cyPts + pitch * 0.7);
        doc.moveTo(cxPts + pitch * 0.3, cyPts + pitch * 0.7);
        doc.lineTo(cxPts + pitch * 0.7, cyPts + pitch * 0.3);
      }
      function isPrior(x3, y3) {
        const px = image.pixels[y3][x3];
        if (px < partIndex && px !== -1) {
          return true;
        }
        return false;
      }
      function outline(startInclusive, endEnclusive, callback, plotter) {
        let inside = false;
        for (let i3 = startInclusive; i3 < endEnclusive; i3++) {
          if (callback(i3)) {
            if (!inside) plotter(i3);
            inside = true;
          } else {
            if (inside) plotter(i3 - 1);
            inside = false;
          }
        }
        if (inside) plotter(endEnclusive - 1);
      }
    }
  }
  function getLayout(cellCount, pageWidthPts, pageHeightPts, pageMarginPts, cellWidthPts, cellHeightPts) {
    const cellMarginPts = mmToPoints(9);
    const result = [];
    const printableWidthPts = pageWidthPts - pageMarginPts * 2;
    const printableHeightPts = pageHeightPts - pageMarginPts * 2;
    const densestUnrotatedLayout = {
      maxCols: Math.floor((cellMarginPts + printableWidthPts) / (cellMarginPts + cellWidthPts)),
      maxRows: Math.floor((cellMarginPts + printableHeightPts) / (cellMarginPts + cellHeightPts))
    };
    const densestRotatedLayout = {
      maxCols: Math.floor((cellMarginPts + printableWidthPts) / (cellMarginPts + cellHeightPts)),
      maxRows: Math.floor((cellMarginPts + printableHeightPts) / (cellMarginPts + cellWidthPts))
    };
    const isRotated = densestRotatedLayout.maxRows * densestRotatedLayout.maxCols > densestUnrotatedLayout.maxRows * densestUnrotatedLayout.maxCols && densestUnrotatedLayout.maxRows * densestUnrotatedLayout.maxCols < cellCount;
    const densestLayout = isRotated ? densestRotatedLayout : densestUnrotatedLayout;
    if (densestLayout.maxRows * densestLayout.maxCols === 0) {
      throw new Error("Can't do this layout");
    }
    while (true) {
      if (densestLayout.maxCols >= densestLayout.maxRows) {
        if ((densestLayout.maxCols - 1) * densestLayout.maxRows >= cellCount) {
          densestLayout.maxCols--;
          continue;
        }
        if ((densestLayout.maxRows - 1) * densestLayout.maxCols >= cellCount) {
          densestLayout.maxRows--;
          continue;
        }
      } else {
        if ((densestLayout.maxRows - 1) * densestLayout.maxCols >= cellCount) {
          densestLayout.maxRows--;
          continue;
        }
        if ((densestLayout.maxCols - 1) * densestLayout.maxRows >= cellCount) {
          densestLayout.maxCols--;
          continue;
        }
      }
      break;
    }
    const layoutXsize = isRotated ? cellHeightPts : cellWidthPts;
    const layoutYsize = isRotated ? cellWidthPts : cellHeightPts;
    const unallocatedX = pageWidthPts - pageMarginPts * 2 - densestLayout.maxCols * layoutXsize;
    const unallocatedY = pageHeightPts - pageMarginPts * 2 - densestLayout.maxRows * layoutYsize;
    const xJustification = unallocatedX / (densestLayout.maxCols + 1);
    const yJustification = unallocatedY / (densestLayout.maxRows + 1);
    const xInterval = layoutXsize + xJustification;
    const yInterval = layoutYsize + yJustification;
    console.log(JSON.stringify({
      pageWidthPts,
      pageHeightPts,
      cellWidthPts,
      cellHeightPts,
      densestUnrotatedLayout,
      densestRotatedLayout,
      isRotated,
      densestLayout,
      unallocatedX,
      unallocatedY,
      xInterval,
      yInterval,
      xJustification,
      yJustification
    }, void 0, 2));
    let firstPage = true;
    while (true) {
      let first = true;
      if (isRotated) {
        for (let x3 = densestLayout.maxCols - 1; x3 >= 0; x3--) {
          for (let y3 = 0; y3 < densestLayout.maxRows; y3++) {
            if (iter(x3, y3, first)) {
              return result;
            }
            first = false;
          }
        }
      } else {
        for (let y3 = 0; y3 < densestLayout.maxRows; y3++) {
          for (let x3 = 0; x3 < densestLayout.maxCols; x3++) {
            if (iter(x3, y3, first)) {
              return result;
            }
            first = false;
          }
        }
      }
      firstPage = false;
    }
    function iter(x3, y3, first) {
      const newPage = first && !firstPage;
      addCell(
        newPage,
        pageMarginPts + xJustification + x3 * xInterval,
        pageMarginPts + yJustification + y3 * yInterval
      );
      if (result.length === cellCount) {
        return true;
      }
    }
    function addCell(newPage, translateX, translateY) {
      result.push({
        next(doc, actualWidthPts, actualHeightPts) {
          if (newPage) {
            doc.addPage();
          }
          const spareX = layoutXsize - (isRotated ? actualHeightPts : actualWidthPts);
          const spareY = layoutYsize - (isRotated ? actualWidthPts : actualHeightPts);
          doc.save();
          doc.translate(translateX + spareX / 2, translateY + spareY / 2);
          if (isRotated) {
            doc.rotate(90);
            doc.translate(0, -layoutXsize);
          }
          return () => {
            doc.restore();
          };
        }
      });
    }
  }
  function inchesToPoints(inches) {
    return inches * 72;
  }
  function mmToPoints(mm) {
    return mm / 25.4 * 72;
  }

  // src/components/print-dialog.tsx
  function PrintDialog(props) {
    const updateProp = F(PropContext);
    return /* @__PURE__ */ a("div", { class: "print-dialog" }, /* @__PURE__ */ a("div", { class: "print-options" }, /* @__PURE__ */ a(FormatGroup, { ...props }), /* @__PURE__ */ a(PaperSizeGroup, { ...props }), /* @__PURE__ */ a(ImageSizeGroup, { ...props }), /* @__PURE__ */ a(PageBreakingGroup, { ...props })), /* @__PURE__ */ a("div", { class: "print-buttons" }, /* @__PURE__ */ a("button", { class: "cancel", onClick: () => updateProp("ui", "isPrintOpen", false) }, "Cancel"), /* @__PURE__ */ a("button", { class: "print", onClick: () => print() }, "Print\xA0", /* @__PURE__ */ a("img", { class: "pdf-logo", src: "./pdf-logo.png" }))));
    function print() {
      const settings = {
        style: props.settings.format,
        paperSize: props.settings.paperSize,
        breakStrategy: props.settings.breakStrategy,
        imageSize: props.settings.imageSize,
        carveSize: getGridSize(props.gridSize),
        pitch: getPitch(props.gridSize),
        filename: props.filename.replace(".png", ""),
        debug: window.location.host.indexOf("localhost") === 0
        // perspective: props.settings.perpsective,
      };
      window.clarity?.("event", "print");
      makePdf(props.image, settings);
    }
  }
  var FormatGroup = makeRadioGroup(({ image }) => ({
    title: "Format",
    key: "format",
    values: [
      {
        value: "step-by-step",
        title: "Single Color",
        description: "Print one black-and-white grid per color. Best for laser printers or when colors are difficult to tell apart.",
        icon: /* @__PURE__ */ a(StepByStepPreviewer, { image })
      },
      {
        value: "color",
        title: "Color Image",
        description: "Print a single color image. Best for color printers and images with fewer colors.",
        icon: /* @__PURE__ */ a(ColorImagePreviewer, { image })
      },
      {
        value: "legend",
        title: "Legend",
        description: "Print a grid of letters corresponding to the legend",
        icon: /* @__PURE__ */ a(SinglePlanPreviewer, { image })
      }
    ]
  }));
  var PaperSizeGroup = makeRadioGroup(() => ({
    key: "paperSize",
    title: "Paper Size",
    values: [
      {
        title: "Letter",
        value: "letter",
        description: '8.5" x 11"',
        icon: /* @__PURE__ */ a("span", { class: "letter-icon" })
      },
      {
        title: "A4",
        value: "a4",
        description: "210mm x 297mm",
        icon: /* @__PURE__ */ a("span", { class: "a4-icon" })
      }
    ]
  }));
  var ImageSizeGroup = makeRadioGroup(() => ({
    key: "imageSize",
    title: "Image Size",
    values: [
      {
        title: "Page",
        value: "single-page",
        description: "Scale the image to fit a single page",
        icon: /* @__PURE__ */ a("span", { class: "size-stretch" }, "\u26F6")
      },
      {
        title: "Actual",
        value: "actual",
        description: "Print at actual size. Multiple pages will be generated if necessary",
        icon: /* @__PURE__ */ a("span", { class: "size-actual" }, "1:1")
      },
      {
        title: "Legible",
        value: "legible",
        description: "Print at a legible size. Multiple pages will be generated if necessary",
        icon: /* @__PURE__ */ a("span", { class: "size-legible" }, "\u{1F441}")
      }
    ]
  }));
  var PageBreakingGroup = makeRadioGroup(() => ({
    key: "breakStrategy",
    title: "Page Breaking",
    values: [
      {
        title: "Grid",
        value: "grid",
        description: "Split large images based on the pegboard grid size",
        icon: /* @__PURE__ */ a("span", { class: "break-grid" }, "\u{1F533}")
      },
      {
        title: "Page",
        value: "page",
        description: "Split large images based on the page size",
        icon: /* @__PURE__ */ a("span", { class: "break-paper" }, "\u{1F4C4}")
      }
    ]
  }));
  function StepByStepPreviewer(props) {
    const [frame, setFrame] = l2(0);
    const imgRef = s2();
    y2(() => {
      drawNextFrame();
      const id = window.setInterval(incrementFrame, 600);
      return () => {
        window.clearInterval(id);
      };
    });
    return /* @__PURE__ */ a("img", { class: "step-by-step-preview", ref: imgRef });
    function incrementFrame() {
      setFrame((frame + 1) % (props.image.partList.length + 3));
    }
    function drawNextFrame() {
      imgRef.current.src = renderPartListImageToDataURL(props.image, frame);
    }
  }
  function ColorImagePreviewer(props) {
    return /* @__PURE__ */ a("img", { src: renderPartListImageToDataURL(props.image) });
  }
  function SinglePlanPreviewer(props) {
    const width = 5;
    const height = 4;
    const startX = Math.floor(props.image.width / 2) - Math.floor(width / 2);
    const startY = Math.floor(props.image.height / 2) - Math.floor(height / 2);
    const lines = [];
    for (let y3 = Math.max(startY, 0); y3 < Math.min(props.image.height, startY + height); y3++) {
      let s3 = "";
      for (let x3 = Math.max(startX, 0); x3 < Math.min(props.image.width, startX + width); x3++) {
        const px = props.image.partList[props.image.pixels[y3][x3]];
        s3 = s3 + (px?.symbol ?? " ");
      }
      lines.push(s3);
    }
    return /* @__PURE__ */ a("span", null, /* @__PURE__ */ a("pre", null, lines.join("\n")));
  }
  function makeRadioGroup(factory) {
    return function(props) {
      const updateProp = F(PropContext);
      const p3 = factory(props);
      return /* @__PURE__ */ a("div", { class: "print-setting-group" }, /* @__PURE__ */ a("h1", null, p3.title), /* @__PURE__ */ a("div", { class: "print-setting-group-options" }, p3.values.map((v3) => /* @__PURE__ */ a("label", null, /* @__PURE__ */ a(
        "input",
        {
          type: "radio",
          name: p3.key,
          checked: v3.value === props.settings[p3.key],
          onChange: () => {
            updateProp("print", p3.key, v3.value);
          }
        }
      ), /* @__PURE__ */ a("div", { class: "option" }, /* @__PURE__ */ a("h3", null, v3.title), v3.icon)))), /* @__PURE__ */ a("span", { class: "description" }, p3.values.filter((v3) => v3.value === props.settings[p3.key])[0]?.description));
    };
  }

  // src/components/3d-dialog.tsx
  init_preact_module();

  // src/3d-generator-3mf.ts
  var import_file_saver = __toESM(require_FileSaver_min());
  function generate3MF(image, filename) {
    const xml = build3MFContent(image);
    const blob = new Blob([xml], { type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml" });
    (0, import_file_saver.saveAs)(blob, `${filename}.3mf`);
  }
  function build3MFContent(image) {
    const voxelHeight = 1;
    const voxelWidth = 1;
    const voxelDepth = 1;
    let vertices = [];
    let triangles = [];
    let vertexIndex = 0;
    let objectId = 1;
    let objects = [];
    let components = [];
    for (let colorIdx = 0; colorIdx < image.partList.length; colorIdx++) {
      const color = image.partList[colorIdx];
      vertices = [];
      triangles = [];
      vertexIndex = 0;
      for (let y3 = 0; y3 < image.height; y3++) {
        for (let x3 = 0; x3 < image.width; x3++) {
          if (image.pixels[y3][x3] === colorIdx) {
            const x0 = x3 * voxelWidth;
            const y0 = y3 * voxelDepth;
            const z0 = 0;
            const x1 = x0 + voxelWidth;
            const y1 = y0 + voxelDepth;
            const z1 = z0 + voxelHeight;
            const startIdx = vertexIndex;
            vertices.push(`<vertex x="${x0}" y="${y0}" z="${z0}"/>`);
            vertices.push(`<vertex x="${x1}" y="${y0}" z="${z0}"/>`);
            vertices.push(`<vertex x="${x1}" y="${y1}" z="${z0}"/>`);
            vertices.push(`<vertex x="${x0}" y="${y1}" z="${z0}"/>`);
            vertices.push(`<vertex x="${x0}" y="${y0}" z="${z1}"/>`);
            vertices.push(`<vertex x="${x1}" y="${y0}" z="${z1}"/>`);
            vertices.push(`<vertex x="${x1}" y="${y1}" z="${z1}"/>`);
            vertices.push(`<vertex x="${x0}" y="${y1}" z="${z1}"/>`);
            triangles.push(`<triangle v1="${startIdx + 0}" v2="${startIdx + 1}" v3="${startIdx + 2}"/>`);
            triangles.push(`<triangle v1="${startIdx + 0}" v2="${startIdx + 2}" v3="${startIdx + 3}"/>`);
            triangles.push(`<triangle v1="${startIdx + 4}" v2="${startIdx + 6}" v3="${startIdx + 5}"/>`);
            triangles.push(`<triangle v1="${startIdx + 4}" v2="${startIdx + 7}" v3="${startIdx + 6}"/>`);
            triangles.push(`<triangle v1="${startIdx + 0}" v2="${startIdx + 5}" v3="${startIdx + 1}"/>`);
            triangles.push(`<triangle v1="${startIdx + 0}" v2="${startIdx + 4}" v3="${startIdx + 5}"/>`);
            triangles.push(`<triangle v1="${startIdx + 2}" v2="${startIdx + 7}" v3="${startIdx + 3}"/>`);
            triangles.push(`<triangle v1="${startIdx + 2}" v2="${startIdx + 6}" v3="${startIdx + 7}"/>`);
            triangles.push(`<triangle v1="${startIdx + 0}" v2="${startIdx + 3}" v3="${startIdx + 7}"/>`);
            triangles.push(`<triangle v1="${startIdx + 0}" v2="${startIdx + 7}" v3="${startIdx + 4}"/>`);
            triangles.push(`<triangle v1="${startIdx + 1}" v2="${startIdx + 6}" v3="${startIdx + 2}"/>`);
            triangles.push(`<triangle v1="${startIdx + 1}" v2="${startIdx + 5}" v3="${startIdx + 6}"/>`);
            vertexIndex += 8;
          }
        }
      }
      if (vertices.length > 0) {
        const colorHex = rgbToHex(color.target.r, color.target.g, color.target.b);
        objects.push(`
    <object id="${objectId}" type="model">
      <mesh>
        <vertices>
${vertices.join("\n")}
        </vertices>
        <triangles>
${triangles.join("\n")}
        </triangles>
      </mesh>
    </object>`);
        components.push(`<component objectid="${objectId}" transform="1 0 0 0 1 0 0 0 1 0 0 0"/>`);
        objectId++;
      }
    }
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
${objects.join("\n")}
    <object id="${objectId}" type="model">
      <components>
${components.join("\n")}
      </components>
    </object>
  </resources>
  <build>
    <item objectid="${objectId}" transform="1 0 0 0 1 0 0 0 1 0 0 0"/>
  </build>
</model>`;
    return xml;
  }
  function rgbToHex(r3, g3, b3) {
    return "#" + [r3, g3, b3].map((x3) => {
      const hex = x3.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }

  // src/3d-generator-openscad.ts
  var import_file_saver2 = __toESM(require_FileSaver_min());
  var import_jszip = __toESM(require_jszip_min());
  async function generateOpenSCADMasks(image, filename) {
    const zip = new import_jszip.default();
    const maskPromises = image.partList.map(async (color, colorIdx) => {
      const maskData = createMaskForColor(image, colorIdx);
      const blob = await canvasToBlob(maskData);
      zip.file(`mask_${colorIdx}_${sanitizeFilename(color.target.name)}.png`, blob);
    });
    await Promise.all(maskPromises);
    const scadContent = generateOpenSCADFile(image);
    zip.file(`${filename}.scad`, scadContent);
    const zipBlob = await zip.generateAsync({ type: "blob" });
    (0, import_file_saver2.saveAs)(zipBlob, `${filename}_openscad.zip`);
  }
  function createMaskForColor(image, colorIdx) {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(image.width, image.height);
    for (let y3 = 0; y3 < image.height; y3++) {
      for (let x3 = 0; x3 < image.width; x3++) {
        const idx = (y3 * image.width + x3) * 4;
        const pixelColorIdx = image.pixels[y3][x3];
        if (pixelColorIdx === colorIdx) {
          imageData.data[idx] = 255;
          imageData.data[idx + 1] = 255;
          imageData.data[idx + 2] = 255;
          imageData.data[idx + 3] = 255;
        } else {
          imageData.data[idx] = 0;
          imageData.data[idx + 1] = 0;
          imageData.data[idx + 2] = 0;
          imageData.data[idx + 3] = 255;
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to convert canvas to blob"));
        }
      }, "image/png");
    });
  }
  function generateOpenSCADFile(image) {
    const voxelSize = 1;
    const layerHeight = 1;
    let scadContent = `// OpenSCAD file for visualizing color masks
// Generated from image: ${image.width}x${image.height} pixels
// Total colors: ${image.partList.length}

// Parameters
voxel_size = ${voxelSize};
layer_height = ${layerHeight};
image_width = ${image.width};
image_height = ${image.height};

// Combine all color layers
union() {
`;
    image.partList.forEach((color, colorIdx) => {
      const colorName = sanitizeFilename(color.target.name);
      const r3 = color.target.r / 255;
      const g3 = color.target.g / 255;
      const b3 = color.target.b / 255;
      scadContent += `    // Layer ${colorIdx}: ${color.target.name} (${color.count} pixels)
    color([${r3.toFixed(3)}, ${g3.toFixed(3)}, ${b3.toFixed(3)}])
    translate([0, 0, ${colorIdx * layerHeight}])
    scale([voxel_size, voxel_size, layer_height])
    surface(file = "mask_${colorIdx}_${colorName}.png", center = false, invert = true);
    
`;
    });
    scadContent += `}

// Alternative: View layers stacked vertically with separation
// Uncomment to use this view instead
/*
union() {
`;
    image.partList.forEach((color, colorIdx) => {
      const colorName = sanitizeFilename(color.target.name);
      const r3 = color.target.r / 255;
      const g3 = color.target.g / 255;
      const b3 = color.target.b / 255;
      const separation = 5;
      scadContent += `    color([${r3.toFixed(3)}, ${g3.toFixed(3)}, ${b3.toFixed(3)}])
    translate([0, ${colorIdx * (image.height * voxelSize + separation)}, 0])
    scale([voxel_size, voxel_size, layer_height])
    surface(file = "mask_${colorIdx}_${colorName}.png", center = false, invert = true);
    
`;
    });
    scadContent += `}
*/
`;
    return scadContent;
  }
  function sanitizeFilename(name) {
    return name.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_");
  }

  // src/components/3d-dialog.tsx
  function ThreeDDialog(props) {
    const updateProp = F(PropContext);
    return /* @__PURE__ */ a("div", { class: "print-dialog" }, /* @__PURE__ */ a("div", { class: "print-options" }, /* @__PURE__ */ a(FormatGroup2, { ...props })), /* @__PURE__ */ a("div", { class: "print-buttons" }, /* @__PURE__ */ a("button", { class: "cancel", onClick: () => updateProp("ui", "is3DOpen", false) }, "Cancel"), /* @__PURE__ */ a("button", { class: "print", onClick: () => exportModel() }, "Export")));
    function exportModel() {
      window.clarity?.("event", "3d-export");
      if (props.settings.format === "3mf") {
        generate3MF(props.image, props.filename.replace(".png", ""));
      } else if (props.settings.format === "openscad") {
        generateOpenSCADMasks(props.image, props.filename.replace(".png", ""));
      }
    }
  }
  var FormatGroup2 = makeRadioGroup2(({ image }) => ({
    title: "Format",
    key: "format",
    values: [
      {
        value: "3mf",
        title: "3MF Mesh",
        description: "Export as 3MF triangle mesh with separate material shapes for each color. Standard industry format compatible with most 3D software.",
        icon: /* @__PURE__ */ a("span", { class: "format-icon" }, "\u{1F4D0}")
      },
      {
        value: "openscad",
        title: "OpenSCAD Masks",
        description: "Export as a ZIP file containing monochrome masks (one per color) and an OpenSCAD file that combines them into a 3D display.",
        icon: /* @__PURE__ */ a("span", { class: "format-icon" }, "\u{1F3AD}")
      }
    ]
  }));
  function makeRadioGroup2(factory) {
    return function(props) {
      const updateProp = F(PropContext);
      const p3 = factory(props);
      return /* @__PURE__ */ a("div", { class: "print-setting-group" }, /* @__PURE__ */ a("h1", null, p3.title), /* @__PURE__ */ a("div", { class: "print-setting-group-options" }, p3.values.map((v3) => /* @__PURE__ */ a("label", null, /* @__PURE__ */ a(
        "input",
        {
          type: "radio",
          name: p3.key,
          checked: v3.value === props.settings[p3.key],
          onChange: () => {
            updateProp("threeDExport", p3.key, v3.value);
          }
        }
      ), /* @__PURE__ */ a("div", { class: "option" }, /* @__PURE__ */ a("h3", null, v3.title), v3.icon)))), /* @__PURE__ */ a("span", { class: "description" }, p3.values.filter((v3) => v3.value === props.settings[p3.key])[0]?.description));
    };
  }

  // src/components/plan-display.tsx
  init_preact_module();
  var svgns = "http://www.w3.org/2000/svg";
  var svgCss = require_svg();
  var refObjs = {
    quarter: {
      url: "https://upload.wikimedia.org/wikipedia/commons/4/44/2014_ATB_Quarter_Obv.png",
      width: 24.26,
      height: 24.26
    },
    dollar: {
      url: "https://upload.wikimedia.org/wikipedia/commons/2/23/US_one_dollar_bill%2C_obverse%2C_series_2009.jpg",
      width: 156.1,
      height: 66.3
    },
    credit: {
      url: "https://upload.wikimedia.org/wikipedia/commons/2/23/CIDSampleAmex.png",
      width: 85.6,
      height: 53.98
    }
  };
  function PlanSvg(props) {
    const {
      image,
      displaySettings
    } = props;
    const {
      planStyle
    } = displaySettings;
    const isBackgroundDark = displaySettings.background === "#000" || displaySettings.background === "#777";
    return /* @__PURE__ */ a(
      "svg",
      {
        class: "plan",
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: `-16 -16 ${(image.width + 1) * 32} ${(image.height + 1) * 32}`,
        preserveAspectRatio: "xMidYMid meet"
      },
      /* @__PURE__ */ a("style", null, svgCss),
      /* @__PURE__ */ a("defs", null, /* @__PURE__ */ a("rect", { id: "melted", width: "32", height: "32", rx: "7", ry: "7" }), /* @__PURE__ */ a("rect", { id: "square", width: "32", height: "32" }), /* @__PURE__ */ a("rect", { id: "circle", width: "32", height: "32", rx: "16", ry: "16" }), /* @__PURE__ */ a("pattern", { id: "wood", patternUnits: "userSpaceOnUse", width: "400", height: "400" }, /* @__PURE__ */ a(
        "image",
        {
          href: "https://upload.wikimedia.org/wikipedia/commons/5/50/Mahag%C3%B3ni_001.jpg",
          x: "0",
          y: "0",
          width: "400",
          height: "400"
        }
      )), /* @__PURE__ */ a("filter", { id: "blurFilter" }, /* @__PURE__ */ a("feGaussianBlur", { in: "SourceGraphic", stdDeviation: "4" })), /* @__PURE__ */ a("pattern", { id: "checkPattern", viewBox: "0 0 32 32", width: "32", height: "32", patternUnits: "userSpaceOnUse" }, /* @__PURE__ */ a("rect", { x: "0", y: "0", width: "16", height: "16", fill: "#DDDDDD" }), /* @__PURE__ */ a("rect", { x: "0", y: "16", width: "16", height: "16", fill: "#999999" }), /* @__PURE__ */ a("rect", { x: "16", y: "0", width: "16", height: "16", fill: "#999999" }), /* @__PURE__ */ a("rect", { x: "16", y: "16", width: "16", height: "16", fill: "#DDDDDD" }))),
      /* @__PURE__ */ a(BackgroundLayer, { image, bg: displaySettings.background }),
      /* @__PURE__ */ a(ColorLayer, { image }),
      /* @__PURE__ */ a(GridLayer, { image, grid: displaySettings.grid, boardSize: props.gridSize, nudgeGrid: displaySettings.nudgeGrid }),
      /* @__PURE__ */ a(TextLayer, { image, planStyle: props.displaySettings.planStyle, isBackgroundDark }),
      /* @__PURE__ */ a(RefObjLayer, { pitch: props.pitch, name: displaySettings.refobj })
    );
  }
  function BackgroundLayer(props) {
    return /* @__PURE__ */ a(
      "rect",
      {
        x: -16,
        y: -16,
        width: (props.image.width + 1) * 32,
        height: (props.image.height + 1) * 32,
        fill: props.bg,
        filter: props.bg === "url(#checkPattern)" ? "url(#blurFilter)" : ""
      }
    );
  }
  function TextLayer(props) {
    const { image, planStyle, isBackgroundDark } = props;
    const textLayer = s2(null);
    y2(() => {
      renderSpans();
    }, [image, planStyle, isBackgroundDark]);
    return /* @__PURE__ */ a("g", { ref: textLayer });
    function renderSpans() {
      clearChildren(textLayer.current);
      const target = textLayer.current;
      if (planStyle === "symbols") {
        for (let y3 = 0; y3 < image.height; y3++) {
          for (let x3 = 0; x3 < image.width; x3++) {
            const px = image.partList[image.pixels[y3][x3]];
            if (px === void 0) continue;
            const t3 = document.createElementNS(svgns, "text");
            t3.innerHTML = px.symbol;
            t3.setAttribute("x", (x3 + 0.5) * 32);
            t3.setAttribute("y", (y3 + 0.8) * 32);
            t3.setAttribute("text-anchor", "middle");
            if (isBright(px.target)) {
              t3.setAttribute("class", "bright");
            } else {
              t3.setAttribute("class", "dark");
            }
            target.appendChild(t3);
          }
        }
      }
      if (planStyle === "spans" || planStyle === "symbolspans") {
        let addAt2 = function(px, runCount, endX, y3) {
          if (planStyle === "spans") {
            if (runCount < 2) return;
          } else {
            if (px === void 0 && runCount < 3) return;
          }
          const t3 = document.createElementNS(svgns, "text");
          if (planStyle === "spans") {
            t3.innerHTML = runCount.toString();
          } else {
            const sym = px?.symbol;
            if (sym === void 0) {
              t3.innerHTML = runCount.toString();
            } else if (runCount === 1) {
              t3.innerHTML = sym;
            } else if (runCount === 2) {
              t3.innerHTML = `${sym}`;
            } else {
              t3.innerHTML = `${sym}\xD7${runCount.toString()}`;
            }
          }
          t3.setAttribute("x", ((endX - runCount / 2) * 32).toString());
          t3.setAttribute("y", ((y3 + 0.8) * 32).toString());
          t3.setAttribute("text-anchor", "middle");
          if (px === void 0 ? !props.isBackgroundDark : isBright(px.target)) {
            t3.setAttribute("class", "bright");
          } else {
            t3.setAttribute("class", "dark");
          }
          target.appendChild(t3);
        };
        var addAt = addAt2;
        for (let y3 = 0; y3 < image.height; y3++) {
          let nowColor = void 0;
          let runCount = 0;
          for (let x3 = 0; x3 <= image.width; x3++) {
            if (x3 === image.width) {
              addAt2(nowColor, runCount, x3, y3);
              break;
            }
            const px = image.partList[image.pixels[y3][x3]];
            if (nowColor === px) {
              runCount++;
            } else {
              if (runCount > 0) {
                addAt2(nowColor, runCount, x3, y3);
              }
              nowColor = px;
              runCount = 1;
            }
          }
        }
      }
    }
  }
  function GridLayer(props) {
    const { image, grid, nudgeGrid } = props;
    const gridLayer = s2(null);
    y2(() => {
      renderGrid();
    }, [image, grid, nudgeGrid]);
    return /* @__PURE__ */ a("g", { ref: gridLayer });
    function renderGrid() {
      clearChildren(gridLayer.current);
      const target = gridLayer.current;
      if (grid !== "none") {
        let gridInterval;
        if (grid === "auto") {
          gridInterval = getGridSize(props.boardSize)[0];
        } else {
          gridInterval = parseInt(grid);
        }
        const gridOffset = props.nudgeGrid ? carveImageFast(image, gridInterval) : { xOffset: 0, yOffset: 0 };
        for (let y3 = 0; y3 <= image.height; y3++) {
          const line = document.createElementNS(svgns, "line");
          line.classList.add("gridline");
          line.classList.add(gridInterval < image.height && y3 % gridInterval === gridOffset.yOffset ? "gridmajor" : "gridminor");
          line.setAttribute("x1", -16);
          line.setAttribute("x2", image.width * 32 + 16);
          line.setAttribute("y1", y3 * 32);
          line.setAttribute("y2", y3 * 32);
          target.appendChild(line);
        }
        for (let x3 = 0; x3 <= image.width; x3++) {
          const line = document.createElementNS(svgns, "line");
          line.classList.add(gridInterval < image.width && x3 % gridInterval === gridOffset.xOffset ? "gridmajor" : "gridminor");
          line.setAttribute("x1", x3 * 32);
          line.setAttribute("x2", x3 * 32);
          line.setAttribute("y1", -16);
          line.setAttribute("y2", image.height * 32 + 16);
          target.appendChild(line);
        }
      }
    }
  }
  function ColorLayer(props) {
    const colorsLayer = s2(null);
    const { image } = props;
    y2(() => {
      clearChildren(colorsLayer.current);
      renderColors(colorsLayer.current);
    }, [props.image]);
    return /* @__PURE__ */ a("g", { ref: colorsLayer });
    function renderColors(colorLayer) {
      const { mark } = timer();
      for (let i3 = 0; i3 < image.partList.length; i3++) {
        const parts = [];
        for (let y3 = 0; y3 < image.height; y3++) {
          for (let x3 = 0; x3 < image.width; x3++) {
            if (image.pixels[y3][x3] === i3) {
              parts.push(`M ${x3 * 32} ${y3 * 32} l 32 0 l 0 32 l -32 0 l 0 -32 z`);
            }
          }
        }
        const r3 = document.createElementNS(svgns, "path");
        r3.setAttribute("d", parts.join(" "));
        r3.setAttribute("fill", colorEntryToHtml(image.partList[i3].target));
        r3.setAttribute("stroke-width", "1px");
        const title = document.createElementNS(svgns, "title");
        title.innerHTML = nameOfColor(image.partList[i3].target);
        r3.appendChild(title);
        colorLayer.appendChild(r3);
      }
      mark("Render colors");
    }
  }
  function RefObjLayer(props) {
    if (props.name === "none") {
      return /* @__PURE__ */ a("g", null);
    }
    const refObj = refObjs[props.name];
    const factor = 32 / props.pitch;
    return /* @__PURE__ */ a("g", null, /* @__PURE__ */ a(
      "image",
      {
        href: refObj.url,
        width: refObj.width * factor,
        height: refObj.height * factor,
        opacity: 0.8,
        x: 0,
        y: 0
      }
    ));
  }
  function clearChildren(el) {
    if (el) {
      el.innerHTML = "";
    }
  }

  // src/components/welcome-screen.tsx
  init_preact_module();
  function WelcomeScreen() {
    const updateProp = F(PropContext);
    return /* @__PURE__ */ a("div", { class: "welcome-screen" }, /* @__PURE__ */ a("h1", null, "Welcome to firaga.io!"), /* @__PURE__ */ a("p", null, /* @__PURE__ */ a("b", null, "firaga"), " is an online tool to help you plan and create pixel art crafts using materials like Perler beads, cross-stitching, LEGO, or just regular old paint."), /* @__PURE__ */ a("p", null, /* @__PURE__ */ a("b", null, "firaga"), " comes preconfigured with color palettes corresponding to many popular crafting products, and uses an ", /* @__PURE__ */ a("b", null, "advanced color-matching"), " formula to produce the most accurate results."), /* @__PURE__ */ a("p", null, /* @__PURE__ */ a("b", null, "firaga"), " also makes high-quality, actual-size ", /* @__PURE__ */ a("b", null, "printable plans"), " for both color and black-and-white printers. Placing one of these plans under a transparent pegboard makes for quick and easy crafting."), /* @__PURE__ */ a("p", null, "For more info, read ", /* @__PURE__ */ a("a", { href: "https://firaga.io/help" }, "the documentation"), ", or talk to us on ", /* @__PURE__ */ a("a", { href: "https://twitter.com/firaga_io" }, "Twitter"), " or ", /* @__PURE__ */ a("a", { href: "https://github.com/SeaRyanC/firaga-io" }, "GitHub"), ". Happy making!"), /* @__PURE__ */ a("button", { class: "cancel", onClick: () => updateProp("ui", "isWelcomeOpen", false) }, "Let's go!"));
  }

  // src/app.tsx
  var memoized = {
    adjustImage: memoize(adjustImage),
    palettizeImage: memoize(palettizeImage),
    createPartListImage: memoize(createPartListImage),
    imageDataToRgbaArray: memoize(imageDataToRgbaArray)
  };
  function createApp(initProps, galleryStorage2, renderTarget) {
    let _props = initProps;
    selectImage(_props.source.displayName, _props.source.uri);
    function updateProp(parent, name, value, skipRender = false) {
      _props = { ..._props, [parent]: { ..._props[parent], [name]: value } };
      if (!skipRender) {
        N(/* @__PURE__ */ a(App, { ..._props }), renderTarget);
        window.localStorage.setItem("props", JSON.stringify(_props, (name2, val) => name2.startsWith("_") ? void 0 : val));
        setTimeout(() => document.body.className = "", 1e3);
      }
    }
    function toggleProp(parent, name) {
      updateProp(parent, name, !_props[parent][name]);
    }
    function acceptUserImage(displayName, uri) {
      galleryStorage2.add(displayName, uri);
      selectImage(displayName, uri);
    }
    function selectImage(displayName, uri) {
      getImageDataFromName(uri, (data) => {
        updateProp("source", "uri", uri, true);
        updateProp("source", "displayName", displayName, true);
        updateProp("source", "_decoded", data, true);
        updateProp("ui", "isUploadOpen", false);
      });
    }
    function App(props) {
      h2(() => {
        window.addEventListener("paste", function(evt) {
          const e3 = evt;
          for (const item of e3.clipboardData?.items ?? []) {
            if (item.type.indexOf("image") !== -1) {
              const blob = item.getAsFile();
              if (!blob) continue;
              const reader = new FileReader();
              reader.onload = (img) => {
                const uri = img.target.result;
                acceptUserImage(blob.name, uri);
              };
              reader.readAsDataURL(blob);
            }
          }
        });
        window.addEventListener("keydown", (evt) => {
          if (evt.ctrlKey) {
            switch (evt.key) {
              case "o":
                window.clarity?.("event", "toggle-upload");
                toggleProp("ui", "isUploadOpen");
                break;
              case "p":
                window.clarity?.("event", "toggle-print");
                toggleProp("ui", "isPrintOpen");
                break;
              case "d":
                window.clarity?.("event", "toggle-3d");
                toggleProp("ui", "is3DOpen");
                break;
              case "l":
                window.clarity?.("event", "toggle-legend");
                toggleProp("ui", "showLegend");
                break;
              case "e":
                window.clarity?.("event", "toggle-settings");
                toggleProp("ui", "showSettings");
                break;
              default:
                return;
            }
            evt.preventDefault();
          } else {
            switch (evt.key) {
              case "Escape":
                updateProp("ui", "isPrintOpen", false);
                updateProp("ui", "isUploadOpen", false);
                updateProp("ui", "is3DOpen", false);
                break;
            }
          }
        });
      }, []);
      const none = {};
      const imageData = props.source._decoded;
      const adjustedImageData = imageData && memoized.adjustImage(imageData, props.image);
      const processedRgbaArray = adjustedImageData && memoized.imageDataToRgbaArray(adjustedImageData);
      const { quantized } = processedRgbaArray ? memoized.palettizeImage(processedRgbaArray, props.material, props.image) : none;
      const image = quantized ? memoized.createPartListImage(quantized) : void 0;
      const pitch = getPitch(props.material.size);
      return /* @__PURE__ */ a("div", { class: "app-top" }, /* @__PURE__ */ a(PropContext.Provider, { value: updateProp }, props.ui.isWelcomeOpen && /* @__PURE__ */ a(WelcomeScreen, null), /* @__PURE__ */ a("div", { class: "toolbar" }, /* @__PURE__ */ a("button", { title: "Open...", class: `toolbar-button ${props.ui.isUploadOpen ? "on" : "off"} text`, onClick: () => toggleProp("ui", "isUploadOpen") }, "\u{1F4C2}", /* @__PURE__ */ a("span", { class: "extended-label" }, "Open")), /* @__PURE__ */ a("button", { title: "Print...", class: `toolbar-button ${props.ui.isPrintOpen ? "on" : "off"} text`, onClick: () => toggleProp("ui", "isPrintOpen") }, "\u{1F5A8}\uFE0F", /* @__PURE__ */ a("span", { class: "extended-label" }, "Print")), /* @__PURE__ */ a("button", { title: "3D Export...", class: `toolbar-button ${props.ui.is3DOpen ? "on" : "off"} text`, onClick: () => toggleProp("ui", "is3DOpen") }, "\u{1F4E6}", /* @__PURE__ */ a("span", { class: "extended-label" }, "3D")), /* @__PURE__ */ a("span", { class: "toolbar-divider" }), /* @__PURE__ */ a("button", { title: "Settings", class: `toolbar-button ${props.ui.showSettings ? "on" : "off"} text`, onClick: () => toggleProp("ui", "showSettings") }, "\u2699\uFE0F", /* @__PURE__ */ a("span", { class: "extended-label" }, "Settings")), /* @__PURE__ */ a("button", { title: "Legend", class: `toolbar-button ${props.ui.showLegend ? "on" : "off"} text`, onClick: () => toggleProp("ui", "showLegend") }, "\u{1F511}", /* @__PURE__ */ a("span", { class: "extended-label" }, "Legend")), /* @__PURE__ */ a("span", { class: "toolbar-divider" }), /* @__PURE__ */ a("button", { title: "Help", class: `toolbar-button ${props.ui.isWelcomeOpen ? "on" : "off"} text`, onClick: () => toggleProp("ui", "isWelcomeOpen") }, "\u2754", /* @__PURE__ */ a("span", { class: "extended-label" }, "Help")), /* @__PURE__ */ a("a", { class: `toolbar-button off`, title: "GitHub", href: "https://github.com/SeaRyanC/firaga-io" }, "\u{1F468}\u200D\u{1F4BB}", /* @__PURE__ */ a("span", { class: "extended-label" }, "Code")), /* @__PURE__ */ a("a", { class: `toolbar-button off`, title: "Twitter", href: "https://twitter.com/firaga_io" }, "\u{1F4AC}", /* @__PURE__ */ a("span", { class: "extended-label" }, "Twitter"))), /* @__PURE__ */ a("div", { class: "app-main" }, props.ui.showSettings && /* @__PURE__ */ a("div", { class: "settings" }, /* @__PURE__ */ a("div", { class: "settings-header" }, "Settings", /* @__PURE__ */ a("div", { class: "close-button", onClick: () => updateProp("ui", "showSettings", false) }, "\u2716")), /* @__PURE__ */ a("div", { class: "settings-list" }, /* @__PURE__ */ a(MaterialSettingsRow, { ...props.material }), /* @__PURE__ */ a(ImageSettingsRow, { ...props.image }), /* @__PURE__ */ a(DisplaySettingsRow, { ...props.display }))), image ? /* @__PURE__ */ a(PlanSvg, { image, pitch, displaySettings: props.display, gridSize: props.material.size }) : /* @__PURE__ */ a("div", null, "Loading..."), props.ui.showLegend && image && /* @__PURE__ */ a(Legend, { partList: image.partList, image, pitch: getPitch(props.material.size) })), props.ui.isUploadOpen && /* @__PURE__ */ a(
        GalleryContainer,
        {
          gallery: galleryStorage2.current,
          load: (name, uri) => {
            selectImage(name, uri);
          },
          requestDelete: (uri) => {
            galleryStorage2.remove(uri);
            N(/* @__PURE__ */ a(App, { ..._props }), renderTarget);
          }
        }
      ), props.ui.isPrintOpen && image && /* @__PURE__ */ a(
        PrintDialog,
        {
          image,
          settings: props.print,
          gridSize: props.material.size,
          filename: props.source.displayName
        }
      ), props.ui.is3DOpen && image && /* @__PURE__ */ a(
        ThreeDDialog,
        {
          image,
          settings: props.threeDExport,
          filename: props.source.displayName
        }
      )), /* @__PURE__ */ a("datalist", { id: "image-ticks" }, /* @__PURE__ */ a("option", { value: "0", label: "0" })));
    }
    function ImageSettingsRow(props) {
      return /* @__PURE__ */ a("div", { class: "settings-row" }, /* @__PURE__ */ a("h1", null, "Image"), /* @__PURE__ */ a(
        "div",
        { class: "options-row" },
        /* @__PURE__ */ a("div", { class: "options-group" }, /* @__PURE__ */ a("span", { class: "header" }, "Transparency"), getRadioGroup(props, "image", "transparency", ImageSettings.transparency), getCheckbox(props, "image", "keepOutline", "Keep Outline")),
        // All current Safari implementations do not support the Canvas2d.filter property yet
        navigator.vendor !== "Apple Computer, Inc." && /* @__PURE__ */ a("div", { class: "options-group" }, /* @__PURE__ */ a("span", { class: "header" }, "Color Adjust"), getSlider(props, "image", "brightness", "Brightness"), getSlider(props, "image", "contrast", "Contrast"), getSlider(props, "image", "saturation", "Saturation")),
        /* @__PURE__ */ a("div", { class: "options-group" }, /* @__PURE__ */ a("span", { class: "header" }, "Dithering"), getRadioGroup(props, "image", "dithering", ImageSettings.dithering)),
        /* @__PURE__ */ a("div", { class: "options-group" }, /* @__PURE__ */ a("span", { class: "header" }, "Transforms"), getCheckbox(props, "image", "flip", "Flip"), getCheckbox(props, "image", "mirror", "Mirror"), getCheckbox(props, "image", "descale", "Undo Upscaling"))
      ));
    }
    function MaterialSettingsRow(props) {
      return /* @__PURE__ */ a("div", { class: "settings-row" }, /* @__PURE__ */ a("h1", null, "Material"), /* @__PURE__ */ a("div", { class: "options-row" }, /* @__PURE__ */ a("div", { class: "options-group" }, /* @__PURE__ */ a("span", { class: "header" }, "Color Matching"), getRadioGroup(props, "material", "colorMatch", MaterialSettings.colorMatch), getCheckbox(props, "material", "nodupes", "No Duplicates"), getCheckbox(props, "material", "matchBlackAndWhite", "Improve Black/White")), /* @__PURE__ */ a("div", { class: "options-group" }, /* @__PURE__ */ a("span", { class: "header" }, "Palette"), getRadioGroup(props, "material", "palette", MaterialSettings.palette)), /* @__PURE__ */ a("div", { class: "options-group" }, /* @__PURE__ */ a("span", { class: "header" }, "Size"), getRadioGroup(props, "material", "size", MaterialSettings.size))));
    }
    function Legend({ partList, image, pitch }) {
      return /* @__PURE__ */ a("div", { class: "part-list-container" }, /* @__PURE__ */ a("table", { class: "part-list" }, /* @__PURE__ */ a("thead", null, /* @__PURE__ */ a("tr", null, /* @__PURE__ */ a("th", { colSpan: 5, class: "top-header" }, "Legend"))), /* @__PURE__ */ a("tbody", null, partList.map((ent) => {
        return /* @__PURE__ */ a("tr", { key: ent.symbol + ent.count + ent.target.name }, /* @__PURE__ */ a("td", { class: "legend-symbol" }, ent.symbol), /* @__PURE__ */ a("td", { class: "part-count" }, ent.count.toLocaleString()), ent.target.code && /* @__PURE__ */ a("td", { class: "color-code" }, ent.target.code), /* @__PURE__ */ a("td", { class: "color-swatch", style: { color: colorEntryToHex(ent.target) } }, "\u2B24"), /* @__PURE__ */ a("td", { class: "color-name" }, /* @__PURE__ */ a("span", { class: "colorName" }, ent.target.name)));
      }))), /* @__PURE__ */ a(Stats, { image, pitch }));
    }
    function Stats({ image, pitch }) {
      const pixelCount = getImageStats(image).pixels;
      return /* @__PURE__ */ a("table", { class: "plan-stats" }, /* @__PURE__ */ a("thead", null, /* @__PURE__ */ a("tr", null, /* @__PURE__ */ a("th", { colSpan: 4, class: "top-header" }, "Statistics"))), /* @__PURE__ */ a("tbody", null, /* @__PURE__ */ a("tr", null, /* @__PURE__ */ a("td", { class: "stat-label", rowSpan: 3 }, "Size"), /* @__PURE__ */ a("td", { class: "stat-value" }, image.width.toLocaleString(), "\xD7", image.height.toLocaleString(), "px")), /* @__PURE__ */ a("tr", null, /* @__PURE__ */ a("td", { class: "stat-value" }, feetInches(image.width * pitch), "\xD7", feetInches(image.height * pitch))), /* @__PURE__ */ a("tr", null, /* @__PURE__ */ a("td", { class: "stat-value" }, fmt(image.width * pitch / 10), "\xD7", fmt(image.height * pitch / 10), "cm")), /* @__PURE__ */ a("tr", null, /* @__PURE__ */ a("td", { class: "stat-label" }, "Pixels"), /* @__PURE__ */ a("td", { colSpan: 4, class: "stat-value" }, pixelCount.toLocaleString())), /* @__PURE__ */ a("tr", null, /* @__PURE__ */ a("td", { class: "stat-label" }, "Cost (USD)"), /* @__PURE__ */ a("td", { colSpan: 4, class: "stat-value" }, dollars(pixelCount * 2e-3))), /* @__PURE__ */ a("tr", null, /* @__PURE__ */ a("td", { class: "stat-label" }, "Time"), /* @__PURE__ */ a("td", { colSpan: 4, class: "stat-value" }, timeAmount(pixelCount * 4)))));
      function fmt(n2) {
        return n2.toFixed(1);
      }
    }
    function DisplaySettingsRow(props) {
      return /* @__PURE__ */ a("div", { class: "settings-row" }, /* @__PURE__ */ a("h1", null, "Plan"), /* @__PURE__ */ a("div", { class: "options-row" }, /* @__PURE__ */ a("div", { class: "options-group" }, /* @__PURE__ */ a("span", { class: "header" }, "Legend"), getRadioGroup(props, "display", "planStyle", DisplaySettings.planStyle)), /* @__PURE__ */ a("div", { class: "options-group" }, /* @__PURE__ */ a("span", { class: "header" }, "Grid"), getRadioGroup(props, "display", "grid", DisplaySettings.grid), getCheckbox(props, "display", "nudgeGrid", "Nudge Grid")), /* @__PURE__ */ a("div", { class: "options-group" }, /* @__PURE__ */ a("span", { class: "header" }, "Background"), getRadioGroup(props, "display", "background", DisplaySettings.background)), /* @__PURE__ */ a("div", { class: "options-group" }, /* @__PURE__ */ a("span", { class: "header" }, "Comparison"), getRadioGroup(props, "display", "refobj", DisplaySettings.refobj))));
    }
    function GalleryContainer(props) {
      const fileInputRef = s2();
      const dropBoxRef = s2();
      y2(() => {
        const db = dropBoxRef.current;
        db.addEventListener("dragenter", (e3) => (e3.stopPropagation(), e3.preventDefault()), false);
        db.addEventListener("dragover", (e3) => (e3.stopPropagation(), e3.preventDefault()), false);
        db.addEventListener("drop", function(e3) {
          e3.stopPropagation();
          e3.preventDefault();
          const files = e3.dataTransfer?.files;
          if (!files) return;
          for (let i3 = 0; i3 < files.length; i3++) {
            const file = files[i3];
            if (!file.type.startsWith("image/"))
              continue;
            const reader = new FileReader();
            reader.onload = (img) => {
              const name = file.name;
              const uri = img.target.result;
              acceptUserImage(name, uri);
            };
            reader.readAsDataURL(file);
          }
        }, false);
      }, []);
      return /* @__PURE__ */ a("div", { class: "gallery" }, /* @__PURE__ */ a("div", { class: "close-button", onClick: () => updateProp("ui", "isUploadOpen", false) }, "\u2716"), /* @__PURE__ */ a("h2", null, "Pick Image"), /* @__PURE__ */ a("div", { ref: dropBoxRef, class: "dropbox" }, /* @__PURE__ */ a(
        "label",
        {
          for: "upload-image-button",
          style: "display: inline",
          class: "download-button-label"
        },
        "Upload"
      ), /* @__PURE__ */ a(
        "input",
        {
          id: "upload-image-button",
          style: "display: none;",
          type: "file",
          accept: "image/png, image/jpeg",
          ref: fileInputRef,
          onChange: fileInputChanged,
          value: "Choose..."
        }
      ), ", Paste, or Drag & Drop here"), /* @__PURE__ */ a("h2", null, "Gallery"), /* @__PURE__ */ a("div", { class: "gallery-list-container" }, /* @__PURE__ */ a(Gallery, { ...props })));
      function fileInputChanged() {
        if (!fileInputRef.current) return;
        if (!fileInputRef.current.files) return;
        const files = fileInputRef.current.files;
        for (let i3 = 0; i3 < files.length; i3++) {
          const file = files[i3];
          const reader = new FileReader();
          reader.onload = (img) => {
            acceptUserImage(file.name, img.target.result);
          };
          reader.readAsDataURL(file);
        }
      }
    }
    function getCheckbox(props, subKey, valueKey, label) {
      return /* @__PURE__ */ a("label", null, /* @__PURE__ */ a(
        "input",
        {
          type: "checkbox",
          checked: props[valueKey],
          onChange: (arg) => {
            updateProp(subKey, valueKey, !props[valueKey]);
          }
        }
      ), label);
    }
    function getSlider(props, parentKey, key, label) {
      return /* @__PURE__ */ a("div", { class: "slider-caption" }, /* @__PURE__ */ a("input", { type: "range", list: "image-ticks", class: "slider", onChange: changed, min: "-10", max: "10", step: "1", value: props[key] }), /* @__PURE__ */ a("span", null, label));
      function changed(e3) {
        updateProp(parentKey, key, e3.target.value);
      }
    }
    function getRadioGroup(props, parentProp, key, settings) {
      return radioGroup(key, (k3, v3) => updateProp(parentProp, k3, v3), props[key], settings);
    }
  }
  function radioGroup(name, changed, defaultValue, values) {
    return /* @__PURE__ */ a(y, null, ...values.map(
      ([value, caption]) => {
        return /* @__PURE__ */ a("label", { key: value }, /* @__PURE__ */ a("input", { type: "radio", onChange: fireChanged, name, value, checked: value === defaultValue }), caption);
        function fireChanged() {
          changed(name, value);
        }
      }
    ));
  }
  function getImageDataFromName(name, callback) {
    const img = new Image();
    img.addEventListener("load", () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d")?.drawImage(img, 0, 0);
      callback(getImageData(img));
    });
    img.src = name;
  }
  function memoize(func) {
    const calls = [];
    return function(...args) {
      for (let i3 = 0; i3 < calls.length; i3++) {
        if (calls[i3][0].length === args.length) {
          let match = true;
          for (let j3 = 0; j3 < args.length; j3++) {
            if (calls[i3][0][j3] !== args[j3]) {
              match = false;
              break;
            }
          }
          if (match) {
            return calls[i3][1];
          }
        }
      }
      const r3 = func.apply(void 0, args);
      calls.push([args, r3]);
      if (calls.length > 20) {
        calls.splice(0, 20);
      }
      return r3;
    };
  }

  // src/user-gallery.ts
  var defaultGallery = [
    ["Eevee", "eevee"],
    ["Mario 3", "mario-3"],
    ["Megaman X", "megaman_x"],
    ["Earthbound", "earthbound"],
    ["Kirby", "kirby"],
    ["Mushrom", "mushroom"],
    ["Crono", "crono"],
    ["Ghost", "ghost-smw"],
    ["Mew", "mew"],
    ["Caped Mario", "mario-cape"],
    ["Link (NES)", "link-nes"],
    ["Pac-man Ghost", "ghost"],
    ["Link (SNES)", "link"],
    ["Mario (NES)", "mario-1"],
    ["Gannon", "gannon"],
    ["Ken", "ken"],
    ["Shyguy", "shyguy"],
    ["Squirtle", "squirtle"],
    ["Brachiosaur", "brachiosaur"],
    ["Sonic", "sonic"],
    ["Piranha Plant", "smw-plant"]
  ];
  var keyname = "user-gallery";
  function createGallery() {
    let current = defaultGallery.map(([name, uri]) => [name, `./gallery/${uri}.png`]);
    const s3 = window.localStorage.getItem(keyname);
    if (s3 !== null) {
      current = JSON.parse(s3);
    }
    function add(name, uri) {
      for (let i3 = 0; i3 < current.length; i3++) {
        if (current[i3][1] === uri) {
          return;
        }
      }
      current = [[name, uri], ...current];
      window.setTimeout(save, 250);
      window.clarity?.("event", "add-user-image");
    }
    function remove(uri) {
      for (let i3 = 0; i3 < current.length; i3++) {
        if (current[i3][1] === uri) {
          current.splice(i3, 1);
          current = [...current];
        }
      }
    }
    function save() {
      window.localStorage.setItem(keyname, JSON.stringify(current));
    }
    return {
      add,
      remove,
      get current() {
        return current;
      }
    };
  }

  // src/firaga.tsx
  var galleryStorage = createGallery();
  var DefaultAppProps = {
    display: {
      background: "url(#checkPattern)",
      grid: "auto",
      nudgeGrid: true,
      planStyle: "none",
      refobj: "none"
    },
    image: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      flip: false,
      mirror: false,
      descale: true,
      dithering: "auto",
      transparency: "auto",
      keepOutline: false
    },
    material: {
      colorMatch: "ictcp",
      nodupes: false,
      palette: "perler-multimix",
      size: "perler",
      matchBlackAndWhite: true
    },
    print: {
      paperSize: "letter",
      format: "step-by-step",
      imageSize: "actual",
      breakStrategy: "page"
    },
    threeDExport: {
      format: "3mf"
    },
    source: {
      displayName: galleryStorage.current[0][0],
      uri: galleryStorage.current[0][1],
      _decoded: void 0
    },
    ui: {
      isUploadOpen: false,
      isPrintOpen: false,
      is3DOpen: false,
      isWelcomeOpen: true,
      showLegend: false,
      showSettings: false,
      tourStage: void 0,
      helpTopic: void 0
    }
  };
  window.addEventListener("DOMContentLoaded", function() {
    const s3 = window.localStorage.getItem("props");
    let props;
    if (s3 === null) {
      props = DefaultAppProps;
    } else {
      props = JSON.parse(s3);
    }
    try {
      createApp(props, galleryStorage, document.body);
    } catch (e3) {
      window.localStorage.clear();
      console.error(e3);
      props = DefaultAppProps;
      createApp(props, galleryStorage, document.body);
    }
  });
})();
/*! Bundled license information:

color-diff/lib/diff.js:
color-diff/lib/convert.js:
color-diff/lib/palette.js:
  (**
   * @author Markus Ekholm
   * @copyright 2012-2016 (c) Markus Ekholm <markus at botten dot org >
   * @license Copyright (c) 2012-2016, Markus Ekholm
   * All rights reserved.
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *    * Redistributions of source code must retain the above copyright
   *      notice, this list of conditions and the following disclaimer.
   *    * Redistributions in binary form must reproduce the above copyright
   *      notice, this list of conditions and the following disclaimer in the
   *      documentation and/or other materials provided with the distribution.
   *    * Neither the name of the author nor the
   *      names of its contributors may be used to endorse or promote products
   *      derived from this software without specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL MARKUS EKHOLM BE LIABLE FOR ANY
   * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
   * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
   * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
   * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
   * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
   * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)

jszip/dist/jszip.min.js:
  (*!
  
  JSZip v3.10.1 - A JavaScript class for generating and reading zip files
  <http://stuartk.com/jszip>
  
  (c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
  Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/main/LICENSE.markdown.
  
  JSZip uses the library pako released under the MIT license :
  https://github.com/nodeca/pako/blob/main/LICENSE
  *)
*/
