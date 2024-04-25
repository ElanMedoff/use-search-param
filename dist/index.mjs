import E from "react";
function z() {
  return typeof window > "u";
}
function P(r) {
  if (r === "undefined")
    return;
  if (r === "")
    return "";
  const d = Number(r);
  if (!Number.isNaN(d))
    return d;
  try {
    return JSON.parse(r);
  } catch {
    return r;
  }
}
function s(r) {
  var d = r.searchParamKey, u = r.serverSideSearchParams, e = r.sanitize, t = r.parse, n = r.validate, a = r.buildOnError, c = r.localOnError;
  try {
    var i = void 0;
    if (z() ? typeof u == "string" ? i = u : i = null : i = window.location.search, i === null)
      return null;
    var l = new URLSearchParams(i), v = l.get(d);
    if (v === null)
      return null;
    var o = e instanceof Function ? e(v) : v, m = t(o), S = n instanceof Function ? n(m) : m;
    return S;
  } catch (f) {
    return a == null || a(f), c == null || c(f), null;
  }
}
function h(r) {
  return r === void 0 && (r = {}), function(u, e) {
    var t, n, a;
    e === void 0 && (e = {});
    var c = (n = (t = e.parse) !== null && t !== void 0 ? t : r.parse) !== null && n !== void 0 ? n : P, i = (a = e.sanitize) !== null && a !== void 0 ? a : r.sanitize, l = e.validate, v = e.serverSideSearchParams;
    return s({
      searchParamKey: u,
      serverSideSearchParams: v,
      sanitize: i,
      parse: c,
      validate: l,
      buildOnError: r.onError,
      localOnError: e.onError
    });
  };
}
var b = h();
function y(r) {
  return r === void 0 && (r = {}), function(u, e) {
    var t, n, a;
    e === void 0 && (e = {});
    var c = (n = (t = e.parse) !== null && t !== void 0 ? t : r.parse) !== null && n !== void 0 ? n : P, i = (a = e.sanitize) !== null && a !== void 0 ? a : r.sanitize, l = e.validate, v = e.serverSideSearchParams;
    E.useEffect(function() {
      var f = function() {
        var w = s({
          searchParamKey: u,
          serverSideSearchParams: v,
          sanitize: i,
          parse: c,
          validate: l,
          buildOnError: r.onError,
          localOnError: e.onError
        });
        S(w);
      };
      return window.addEventListener("popstate", f), function() {
        window.removeEventListener("popstate", f);
      };
    }, [u, v]);
    var o = E.useState(function() {
      return s({
        searchParamKey: u,
        serverSideSearchParams: v,
        sanitize: i,
        parse: c,
        validate: l,
        buildOnError: r.onError,
        localOnError: e.onError
      });
    }), m = o[0], S = o[1];
    return m;
  };
}
var g = y();
export {
  h as buildGetSearchParam,
  y as buildUseSearchParam,
  b as getSearchParam,
  g as useSearchParam
};
