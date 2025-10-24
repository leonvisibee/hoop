#!/usr/bin/env node

// login.js
import fs from "fs";
import os from "os";
import path from "path";
import https from "https";
import http from "http";
import { URL } from "url";

// node_modules/confbox/dist/shared/confbox.DA7CpUDY.mjs
var b = /^(?:( )+|\t+)/;
var d = "space";
var h = "tab";
function g(e, t) {
  const n = /* @__PURE__ */ new Map();
  let s2 = 0, o, i;
  for (const c2 of e.split(/\n/g)) {
    if (!c2)
      continue;
    let f, a, l, p2, r;
    const y2 = c2.match(b);
    if (y2 === null)
      s2 = 0, o = "";
    else {
      if (f = y2[0].length, a = y2[1] ? d : h, t && a === d && f === 1)
        continue;
      a !== o && (s2 = 0), o = a, l = 1, p2 = 0;
      const u = f - s2;
      if (s2 = f, u === 0)
        l = 0, p2 = 1;
      else {
        const I2 = u > 0 ? u : -u;
        i = T(a, I2);
      }
      r = n.get(i), r = r === void 0 ? [1, 0] : [r[0] + l, r[1] + p2], n.set(i, r);
    }
  }
  return n;
}
function T(e, t) {
  return (e === d ? "s" : "t") + String(t);
}
function w(e) {
  const n = e[0] === "s" ? d : h, s2 = Number(e.slice(1));
  return { type: n, amount: s2 };
}
function E(e) {
  let t, n = 0, s2 = 0;
  for (const [o, [i, c2]] of e)
    (i > n || i === n && c2 > s2) && (n = i, s2 = c2, t = o);
  return t;
}
function S(e, t) {
  return (e === d ? " " : "	").repeat(t);
}
function _(e) {
  if (typeof e != "string")
    throw new TypeError("Expected a string");
  let t = g(e, true);
  t.size === 0 && (t = g(e, false));
  const n = E(t);
  let s2, o = 0, i = "";
  return n !== void 0 && ({ type: s2, amount: o } = w(n), i = S(s2, o)), { amount: o, type: s2, indent: i };
}
var m = Symbol.for("__confbox_fmt__");
var k = /^(\s+)/;
var v = /(\s+)$/;
function x(e, t = {}) {
  const n = t.indent === void 0 && t.preserveIndentation !== false && e.slice(0, t?.sampleSize || 1024), s2 = t.preserveWhitespace === false ? void 0 : { start: k.exec(e)?.[0] || "", end: v.exec(e)?.[0] || "" };
  return { sample: n, whiteSpace: s2 };
}
function N(e, t, n) {
  !t || typeof t != "object" || Object.defineProperty(t, m, { enumerable: false, configurable: true, writable: true, value: x(e, n) });
}
function C(e, t) {
  if (!e || typeof e != "object" || !(m in e))
    return { indent: t?.indent ?? 2, whitespace: { start: "", end: "" } };
  const n = e[m];
  return { indent: t?.indent || _(n.sample || "").indent, whitespace: n.whiteSpace || { start: "", end: "" } };
}

// node_modules/confbox/dist/toml.mjs
function v2(e, n) {
  let t = e.slice(0, n).split(/\r\n|\n|\r/g);
  return [t.length, t.pop().length + 1];
}
function C2(e, n, t) {
  let l = e.split(/\r\n|\n|\r/g), r = "", i = (Math.log10(n + 1) | 0) + 1;
  for (let o = n - 1; o <= n + 1; o++) {
    let f = l[o - 1];
    f && (r += o.toString().padEnd(i, " "), r += ":  ", r += f, r += `
`, o === n && (r += " ".repeat(i + t + 2), r += `^
`));
  }
  return r;
}
var c = class extends Error {
  line;
  column;
  codeblock;
  constructor(n, t) {
    const [l, r] = v2(t.toml, t.ptr), i = C2(t.toml, l, r);
    super(`Invalid TOML document: ${n}

${i}`, t), this.line = l, this.column = r, this.codeblock = i;
  }
};
function g2(e, n = 0, t = e.length) {
  let l = e.indexOf(`
`, n);
  return e[l - 1] === "\r" && l--, l <= t ? l : -1;
}
function y(e, n) {
  for (let t = n; t < e.length; t++) {
    let l = e[t];
    if (l === `
`)
      return t;
    if (l === "\r" && e[t + 1] === `
`)
      return t + 1;
    if (l < " " && l !== "	" || l === "\x7F")
      throw new c("control characters are not allowed in comments", { toml: e, ptr: n });
  }
  return e.length;
}
function s(e, n, t, l) {
  let r;
  for (; (r = e[n]) === " " || r === "	" || !t && (r === `
` || r === "\r" && e[n + 1] === `
`); )
    n++;
  return l || r !== "#" ? n : s(e, y(e, n), t);
}
function A(e, n, t, l, r = false) {
  if (!l)
    return n = g2(e, n), n < 0 ? e.length : n;
  for (let i = n; i < e.length; i++) {
    let o = e[i];
    if (o === "#")
      i = g2(e, i);
    else {
      if (o === t)
        return i + 1;
      if (o === l)
        return i;
      if (r && (o === `
` || o === "\r" && e[i + 1] === `
`))
        return i;
    }
  }
  throw new c("cannot find end of structure", { toml: e, ptr: n });
}
function S2(e, n) {
  let t = e[n], l = t === e[n + 1] && e[n + 1] === e[n + 2] ? e.slice(n, n + 3) : t;
  n += l.length - 1;
  do
    n = e.indexOf(l, ++n);
  while (n > -1 && t !== "'" && e[n - 1] === "\\" && e[n - 2] !== "\\");
  return n > -1 && (n += l.length, l.length > 1 && (e[n] === t && n++, e[n] === t && n++)), n;
}
var R = /^(\d{4}-\d{2}-\d{2})?[T ]?(?:(\d{2}):\d{2}:\d{2}(?:\.\d+)?)?(Z|[-+]\d{2}:\d{2})?$/i;
var w2 = class _w extends Date {
  #n = false;
  #t = false;
  #e = null;
  constructor(n) {
    let t = true, l = true, r = "Z";
    if (typeof n == "string") {
      let i = n.match(R);
      i ? (i[1] || (t = false, n = `0000-01-01T${n}`), l = !!i[2], i[2] && +i[2] > 23 ? n = "" : (r = i[3] || null, n = n.toUpperCase(), !r && l && (n += "Z"))) : n = "";
    }
    super(n), isNaN(this.getTime()) || (this.#n = t, this.#t = l, this.#e = r);
  }
  isDateTime() {
    return this.#n && this.#t;
  }
  isLocal() {
    return !this.#n || !this.#t || !this.#e;
  }
  isDate() {
    return this.#n && !this.#t;
  }
  isTime() {
    return this.#t && !this.#n;
  }
  isValid() {
    return this.#n || this.#t;
  }
  toISOString() {
    let n = super.toISOString();
    if (this.isDate())
      return n.slice(0, 10);
    if (this.isTime())
      return n.slice(11, 23);
    if (this.#e === null)
      return n.slice(0, -1);
    if (this.#e === "Z")
      return n;
    let t = +this.#e.slice(1, 3) * 60 + +this.#e.slice(4, 6);
    return t = this.#e[0] === "-" ? t : -t, new Date(this.getTime() - t * 6e4).toISOString().slice(0, -1) + this.#e;
  }
  static wrapAsOffsetDateTime(n, t = "Z") {
    let l = new _w(n);
    return l.#e = t, l;
  }
  static wrapAsLocalDateTime(n) {
    let t = new _w(n);
    return t.#e = null, t;
  }
  static wrapAsLocalDate(n) {
    let t = new _w(n);
    return t.#t = false, t.#e = null, t;
  }
  static wrapAsLocalTime(n) {
    let t = new _w(n);
    return t.#n = false, t.#e = null, t;
  }
};
var M = /^((0x[0-9a-fA-F](_?[0-9a-fA-F])*)|(([+-]|0[ob])?\d(_?\d)*))$/;
var Z = /^[+-]?\d(_?\d)*(\.\d(_?\d)*)?([eE][+-]?\d(_?\d)*)?$/;
var j = /^[+-]?0[0-9_]/;
var z = /^[0-9a-f]{4,8}$/i;
var I = { b: "\b", t: "	", n: `
`, f: "\f", r: "\r", '"': '"', "\\": "\\" };
function $(e, n = 0, t = e.length) {
  let l = e[n] === "'", r = e[n++] === e[n] && e[n] === e[n + 1];
  r && (t -= 2, e[n += 2] === "\r" && n++, e[n] === `
` && n++);
  let i = 0, o, f = "", a = n;
  for (; n < t - 1; ) {
    let u = e[n++];
    if (u === `
` || u === "\r" && e[n] === `
`) {
      if (!r)
        throw new c("newlines are not allowed in strings", { toml: e, ptr: n - 1 });
    } else if (u < " " && u !== "	" || u === "\x7F")
      throw new c("control characters are not allowed in strings", { toml: e, ptr: n - 1 });
    if (o) {
      if (o = false, u === "u" || u === "U") {
        let d2 = e.slice(n, n += u === "u" ? 4 : 8);
        if (!z.test(d2))
          throw new c("invalid unicode escape", { toml: e, ptr: i });
        try {
          f += String.fromCodePoint(parseInt(d2, 16));
        } catch {
          throw new c("invalid unicode escape", { toml: e, ptr: i });
        }
      } else if (r && (u === `
` || u === " " || u === "	" || u === "\r")) {
        if (n = s(e, n - 1, true), e[n] !== `
` && e[n] !== "\r")
          throw new c("invalid escape: only line-ending whitespace may be escaped", { toml: e, ptr: i });
        n = s(e, n);
      } else if (u in I)
        f += I[u];
      else
        throw new c("unrecognized escape sequence", { toml: e, ptr: i });
      a = n;
    } else
      !l && u === "\\" && (i = n - 1, o = true, f += e.slice(a, i));
  }
  return f + e.slice(a, t - 1);
}
function F(e, n, t) {
  if (e === "true")
    return true;
  if (e === "false")
    return false;
  if (e === "-inf")
    return -1 / 0;
  if (e === "inf" || e === "+inf")
    return 1 / 0;
  if (e === "nan" || e === "+nan" || e === "-nan")
    return NaN;
  if (e === "-0")
    return 0;
  let l;
  if ((l = M.test(e)) || Z.test(e)) {
    if (j.test(e))
      throw new c("leading zeroes are not allowed", { toml: n, ptr: t });
    let i = +e.replace(/_/g, "");
    if (isNaN(i))
      throw new c("invalid number", { toml: n, ptr: t });
    if (l && !Number.isSafeInteger(i))
      throw new c("integer value cannot be represented losslessly", { toml: n, ptr: t });
    return i;
  }
  let r = new w2(e);
  if (!r.isValid())
    throw new c("invalid value", { toml: n, ptr: t });
  return r;
}
function V(e, n, t, l) {
  let r = e.slice(n, t), i = r.indexOf("#");
  i > -1 && (y(e, i), r = r.slice(0, i));
  let o = r.trimEnd();
  if (!l) {
    let f = r.indexOf(`
`, o.length);
    if (f > -1)
      throw new c("newlines are not allowed in inline tables", { toml: e, ptr: n + f });
  }
  return [o, i];
}
function b2(e, n, t, l) {
  if (l === 0)
    throw new c("document contains excessively nested structures. aborting.", { toml: e, ptr: n });
  let r = e[n];
  if (r === "[" || r === "{") {
    let [f, a] = r === "[" ? U(e, n, l) : K(e, n, l), u = A(e, a, ",", t);
    if (t === "}") {
      let d2 = g2(e, a, u);
      if (d2 > -1)
        throw new c("newlines are not allowed in inline tables", { toml: e, ptr: d2 });
    }
    return [f, u];
  }
  let i;
  if (r === '"' || r === "'") {
    i = S2(e, n);
    let f = $(e, n, i);
    if (t) {
      if (i = s(e, i, t !== "]"), e[i] && e[i] !== "," && e[i] !== t && e[i] !== `
` && e[i] !== "\r")
        throw new c("unexpected character encountered", { toml: e, ptr: i });
      i += +(e[i] === ",");
    }
    return [f, i];
  }
  i = A(e, n, ",", t);
  let o = V(e, n, i - +(e[i - 1] === ","), t === "]");
  if (!o[0])
    throw new c("incomplete key-value declaration: no value specified", { toml: e, ptr: n });
  return t && o[1] > -1 && (i = s(e, n + o[1]), i += +(e[i] === ",")), [F(o[0], e, n), i];
}
var G = /^[a-zA-Z0-9-_]+[ \t]*$/;
function x2(e, n, t = "=") {
  let l = n - 1, r = [], i = e.indexOf(t, n);
  if (i < 0)
    throw new c("incomplete key-value: cannot find end of key", { toml: e, ptr: n });
  do {
    let o = e[n = ++l];
    if (o !== " " && o !== "	")
      if (o === '"' || o === "'") {
        if (o === e[n + 1] && o === e[n + 2])
          throw new c("multiline strings are not allowed in keys", { toml: e, ptr: n });
        let f = S2(e, n);
        if (f < 0)
          throw new c("unfinished string encountered", { toml: e, ptr: n });
        l = e.indexOf(".", f);
        let a = e.slice(f, l < 0 || l > i ? i : l), u = g2(a);
        if (u > -1)
          throw new c("newlines are not allowed in keys", { toml: e, ptr: n + l + u });
        if (a.trimStart())
          throw new c("found extra tokens after the string part", { toml: e, ptr: f });
        if (i < f && (i = e.indexOf(t, f), i < 0))
          throw new c("incomplete key-value: cannot find end of key", { toml: e, ptr: n });
        r.push($(e, n, f));
      } else {
        l = e.indexOf(".", n);
        let f = e.slice(n, l < 0 || l > i ? i : l);
        if (!G.test(f))
          throw new c("only letter, numbers, dashes and underscores are allowed in keys", { toml: e, ptr: n });
        r.push(f.trimEnd());
      }
  } while (l + 1 && l < i);
  return [r, s(e, i + 1, true, true)];
}
function K(e, n, t) {
  let l = {}, r = /* @__PURE__ */ new Set(), i, o = 0;
  for (n++; (i = e[n++]) !== "}" && i; ) {
    if (i === `
`)
      throw new c("newlines are not allowed in inline tables", { toml: e, ptr: n - 1 });
    if (i === "#")
      throw new c("inline tables cannot contain comments", { toml: e, ptr: n - 1 });
    if (i === ",")
      throw new c("expected key-value, found comma", { toml: e, ptr: n - 1 });
    if (i !== " " && i !== "	") {
      let f, a = l, u = false, [d2, N2] = x2(e, n - 1);
      for (let m2 = 0; m2 < d2.length; m2++) {
        if (m2 && (a = u ? a[f] : a[f] = {}), f = d2[m2], (u = Object.hasOwn(a, f)) && (typeof a[f] != "object" || r.has(a[f])))
          throw new c("trying to redefine an already defined value", { toml: e, ptr: n });
        !u && f === "__proto__" && Object.defineProperty(a, f, { enumerable: true, configurable: true, writable: true });
      }
      if (u)
        throw new c("trying to redefine an already defined value", { toml: e, ptr: n });
      let [_2, k2] = b2(e, N2, "}", t - 1);
      r.add(_2), a[f] = _2, n = k2, o = e[n - 1] === "," ? n - 1 : 0;
    }
  }
  if (o)
    throw new c("trailing commas are not allowed in inline tables", { toml: e, ptr: o });
  if (!i)
    throw new c("unfinished table encountered", { toml: e, ptr: n });
  return [l, n];
}
function U(e, n, t) {
  let l = [], r;
  for (n++; (r = e[n++]) !== "]" && r; ) {
    if (r === ",")
      throw new c("expected value, found comma", { toml: e, ptr: n - 1 });
    if (r === "#")
      n = y(e, n);
    else if (r !== " " && r !== "	" && r !== `
` && r !== "\r") {
      let i = b2(e, n - 1, "]", t - 1);
      l.push(i[0]), n = i[1];
    }
  }
  if (!r)
    throw new c("unfinished array encountered", { toml: e, ptr: n });
  return [l, n];
}
function p(e, n, t, l) {
  let r = n, i = t, o, f = false, a;
  for (let u = 0; u < e.length; u++) {
    if (u) {
      if (r = f ? r[o] : r[o] = {}, i = (a = i[o]).c, l === 0 && (a.t === 1 || a.t === 2))
        return null;
      if (a.t === 2) {
        let d2 = r.length - 1;
        r = r[d2], i = i[d2].c;
      }
    }
    if (o = e[u], (f = Object.hasOwn(r, o)) && i[o]?.t === 0 && i[o]?.d)
      return null;
    f || (o === "__proto__" && (Object.defineProperty(r, o, { enumerable: true, configurable: true, writable: true }), Object.defineProperty(i, o, { enumerable: true, configurable: true, writable: true })), i[o] = { t: u < e.length - 1 && l === 2 ? 3 : l, d: false, i: 0, c: {} });
  }
  if (a = i[o], a.t !== l && !(l === 1 && a.t === 3) || (l === 2 && (a.d || (a.d = true, r[o] = []), r[o].push(r = {}), a.c[a.i++] = a = { t: 1, d: false, i: 0, c: {} }), a.d))
    return null;
  if (a.d = true, l === 1)
    r = f ? r[o] : r[o] = {};
  else if (l === 0 && f)
    return null;
  return [o, r, a.c];
}
function X(e, n) {
  let t = n?.maxDepth ?? 1e3, l = {}, r = {}, i = l, o = r;
  for (let f = s(e, 0); f < e.length; ) {
    if (e[f] === "[") {
      let a = e[++f] === "[", u = x2(e, f += +a, "]");
      if (a) {
        if (e[u[1] - 1] !== "]")
          throw new c("expected end of table declaration", { toml: e, ptr: u[1] - 1 });
        u[1]++;
      }
      let d2 = p(u[0], l, r, a ? 2 : 1);
      if (!d2)
        throw new c("trying to redefine an already defined table or value", { toml: e, ptr: f });
      o = d2[2], i = d2[1], f = u[1];
    } else {
      let a = x2(e, f), u = p(a[0], i, o, 0);
      if (!u)
        throw new c("trying to redefine an already defined table or value", { toml: e, ptr: f });
      let d2 = b2(e, a[1], void 0, t);
      u[1][u[0]] = d2[0], f = d2[1];
    }
    if (f = s(e, f, true), e[f] && e[f] !== `
` && e[f] !== "\r")
      throw new c("each key-value declaration must be followed by an end-of-line", { toml: e, ptr: f });
    f = s(e, f);
  }
  return l;
}
var D = /^[a-z0-9-_]+$/i;
function h2(e) {
  let n = typeof e;
  if (n === "object") {
    if (Array.isArray(e))
      return "array";
    if (e instanceof Date)
      return "date";
  }
  return n;
}
function B(e) {
  for (let n = 0; n < e.length; n++)
    if (h2(e[n]) !== "object")
      return false;
  return e.length != 0;
}
function E2(e) {
  return JSON.stringify(e).replace(/\x7f/g, "\\u007f");
}
function O(e, n, t) {
  if (t === 0)
    throw new Error("Could not stringify the object: maximum object depth exceeded");
  if (n === "number")
    return isNaN(e) ? "nan" : e === 1 / 0 ? "inf" : e === -1 / 0 ? "-inf" : e.toString();
  if (n === "bigint" || n === "boolean")
    return e.toString();
  if (n === "string")
    return E2(e);
  if (n === "date") {
    if (isNaN(e.getTime()))
      throw new TypeError("cannot serialize invalid date");
    return e.toISOString();
  }
  if (n === "object")
    return Y(e, t);
  if (n === "array")
    return q(e, t);
}
function Y(e, n) {
  let t = Object.keys(e);
  if (t.length === 0)
    return "{}";
  let l = "{ ";
  for (let r = 0; r < t.length; r++) {
    let i = t[r];
    r && (l += ", "), l += D.test(i) ? i : E2(i), l += " = ", l += O(e[i], h2(e[i]), n - 1);
  }
  return l + " }";
}
function q(e, n) {
  if (e.length === 0)
    return "[]";
  let t = "[ ";
  for (let l = 0; l < e.length; l++) {
    if (l && (t += ", "), e[l] === null || e[l] === void 0)
      throw new TypeError("arrays cannot contain null or undefined values");
    t += O(e[l], h2(e[l]), n - 1);
  }
  return t + " ]";
}
function J(e, n, t) {
  if (t === 0)
    throw new Error("Could not stringify the object: maximum object depth exceeded");
  let l = "";
  for (let r = 0; r < e.length; r++)
    l += `[[${n}]]
`, l += T2(e[r], n, t), l += `

`;
  return l;
}
function T2(e, n, t) {
  if (t === 0)
    throw new Error("Could not stringify the object: maximum object depth exceeded");
  let l = "", r = "", i = Object.keys(e);
  for (let o = 0; o < i.length; o++) {
    let f = i[o];
    if (e[f] !== null && e[f] !== void 0) {
      let a = h2(e[f]);
      if (a === "symbol" || a === "function")
        throw new TypeError(`cannot serialize values of type '${a}'`);
      let u = D.test(f) ? f : E2(f);
      if (a === "array" && B(e[f]))
        r += J(e[f], n ? `${n}.${u}` : u, t - 1);
      else if (a === "object") {
        let d2 = n ? `${n}.${u}` : u;
        r += `[${d2}]
`, r += T2(e[f], d2, t - 1), r += `

`;
      } else
        l += u, l += " = ", l += O(e[f], a, t), l += `
`;
    }
  }
  return `${l}
${r}`.trim();
}
function H(e, n) {
  if (h2(e) !== "object")
    throw new TypeError("stringify can only be called with an object");
  let t = n?.maxDepth ?? 1e3;
  return T2(e, "", t);
}
function Q(e) {
  const n = X(e);
  return N(e, n, { preserveIndentation: false }), n;
}
function W(e) {
  const n = C(e, {}), t = H(e);
  return n.whitespace.start + t + n.whitespace.end;
}

// login.js
var EMAIL = process.env.EMAIL;
var PASSWORD = process.env.PASSWORD;
var API_URL = process.env.API_URL || "https://app.hoophq.com";
var TLS_CA_B64 = process.env.TLS_CA;
function loadCA() {
  if (!TLS_CA_B64)
    return null;
  try {
    return Buffer.from(TLS_CA_B64, "base64");
  } catch (e) {
    console.error("Failed to decode TLS_CA, ignoring");
    return null;
  }
}
function httpRequest(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const isHttps = u.protocol === "https:";
    const lib = isHttps ? https : http;
    const reqOpts = {
      method: opts.method || "GET",
      headers: opts.headers || {},
      hostname: u.hostname,
      port: u.port || (isHttps ? 443 : 80),
      path: u.pathname + u.search,
      rejectUnauthorized: opts.rejectUnauthorized !== void 0 ? opts.rejectUnauthorized : true
    };
    if (opts.ca)
      reqOpts.ca = opts.ca;
    const req = lib.request(reqOpts, (res) => {
      const chunks = [];
      res.on("data", (c2) => chunks.push(c2));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        resolve({ res, body });
      });
    });
    req.on("error", reject);
    if (opts.body)
      req.write(opts.body);
    req.end();
  });
}
async function fetchAuthMethod(apiUrl, ca) {
  const url = new URL("/api/publicserverinfo", apiUrl).toString();
  const { res, body } = await httpRequest(url, { method: "GET", ca });
  if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
    try {
      const json = JSON.parse(body);
      return String(json.auth_method || "");
    } catch (e) {
      throw new Error("failed decoding publicserverinfo response: " + e.message);
    }
  }
  throw new Error(`failed fetching publicserverinfo, status=${res.statusCode}, body=${body}`);
}
async function authenticateLocally(apiUrl, email, password, ca) {
  const url = new URL("/api/localauth/login", apiUrl).toString();
  const payload = JSON.stringify({ email, password });
  const { res, body } = await httpRequest(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload).toString()
    },
    body: payload,
    ca
  });
  if (res.statusCode && res.statusCode > 299) {
    throw new Error(`authentication failed, status=${res.statusCode}, body=${body}`);
  }
  const token = res.headers["token"] || res.headers["Token"] || res.headers["Authorization"];
  if (!token) {
    throw new Error("token header not found in response");
  }
  return token;
}
function readHoopConfig() {
  const dir = path.join(os.homedir(), ".hoop");
  const file = path.join(dir, "config.toml");
  if (!fs.existsSync(file))
    return {};
  try {
    const content = fs.readFileSync(file, "utf8");
    return Q(content);
  } catch (e) {
    throw new Error(`failed parsing ${file}: ${e.message}`);
  }
}
function writeTokenToConfig(token, apiUrl) {
  const dir = path.join(os.homedir(), ".hoop");
  if (!fs.existsSync(dir))
    fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "config.toml");
  const cfg = readHoopConfig();
  if (apiUrl)
    cfg.api_url = apiUrl;
  cfg.token = token;
  const out = W(cfg);
  fs.writeFileSync(file, out, { mode: 384 });
}
function readCredentialsFromConfig() {
  try {
    const cfg = readHoopConfig();
    const email = cfg.email || cfg.username || cfg.user || "";
    const password = cfg.password || "";
    const apiUrl = cfg.api_url || cfg.apiURL || cfg.api || "";
    return { email, password, apiUrl };
  } catch (e) {
    console.error(`Warning: could not parse ~/.hoop/config.toml: ${e.message}`);
    return { email: "", password: "", apiUrl: "" };
  }
}
async function loginAndSave({ email, password, apiUrl, tlsCa } = {}) {
  const ca = tlsCa || loadCA();
  const dir = path.join(os.homedir(), ".hoop");
  const cfgFile = path.join(dir, "config.toml");
  let cfg = {};
  if (fs.existsSync(cfgFile)) {
    try {
      const content = fs.readFileSync(cfgFile, "utf8");
      cfg = Q(content);
    } catch (e) {
      try {
        const bak = `${cfgFile}.invalid.${Date.now()}`;
        fs.copyFileSync(cfgFile, bak);
        console.error(`Invalid TOML in ${cfgFile}: ${e.message}. Backed up original to ${bak} and continuing.`);
        cfg = {};
      } catch (copyErr) {
        throw new Error(`failed to backup invalid config file ${cfgFile}: ${copyErr.message}`);
      }
    }
  }
  const finalApiUrl = apiUrl || cfg.api_url || API_URL;
  if (!email || !password) {
    const cred = readCredentialsFromConfig();
    email = email || cred.email;
    password = password || cred.password;
  }
  email = email || EMAIL;
  password = password || PASSWORD;
  if (!email || !password) {
    throw new Error("no credentials provided (EMAIL/PASSWORD env or config file)");
  }
  const authMethod = await fetchAuthMethod(finalApiUrl, ca);
  if (!(authMethod && String(authMethod).toLowerCase() === "local")) {
    throw new Error("remote auth method detected (not local); this helper only supports local email/password auth");
  }
  const token = await authenticateLocally(finalApiUrl, email, password, ca);
  writeTokenToConfig(token, finalApiUrl);
  return { token, apiUrl: finalApiUrl };
}
async function main() {
  try {
    await loginAndSave();
    console.log("Login succeeded, token saved to ~/.hoop/config.toml");
  } catch (e) {
    console.error("Error:", e.message);
    process.exit(1);
  }
}
if (import.meta.main)
  await main();
/*! Bundled license information:

confbox/dist/toml.mjs:
  (*!
  * Copyright (c) Squirrel Chat et al., All rights reserved.
  * SPDX-License-Identifier: BSD-3-Clause
  *
  * Redistribution and use in source and binary forms, with or without
  * modification, are permitted provided that the following conditions are met:
  *
  * 1. Redistributions of source code must retain the above copyright notice, this
  *    list of conditions and the following disclaimer.
  * 2. Redistributions in binary form must reproduce the above copyright notice,
  *    this list of conditions and the following disclaimer in the
  *    documentation and/or other materials provided with the distribution.
  * 3. Neither the name of the copyright holder nor the names of its contributors
  *    may be used to endorse or promote products derived from this software without
  *    specific prior written permission.
  *
  * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
  * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
  * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
  * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
  * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
  * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
  * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
  * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
  * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
  * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  *)
*/
