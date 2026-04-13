// @ts-nocheck
// Robust color alpha utility for CulturePass
// Accepts hex (3/6/8), rgb(a), named colors, returns rgba() or original on error
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
function hexToRgba(hex: string, alpha: number): string {
  if (stryMutAct_9fa48("5259")) {
    {}
  } else {
    stryCov_9fa48("5259");
    let c = hex.replace(stryMutAct_9fa48("5260") ? "" : (stryCov_9fa48("5260"), '#'), stryMutAct_9fa48("5261") ? "Stryker was here!" : (stryCov_9fa48("5261"), ''));
    if (stryMutAct_9fa48("5264") ? c.length !== 3 : stryMutAct_9fa48("5263") ? false : stryMutAct_9fa48("5262") ? true : (stryCov_9fa48("5262", "5263", "5264"), c.length === 3)) {
      if (stryMutAct_9fa48("5265")) {
        {}
      } else {
        stryCov_9fa48("5265");
        c = c.split(stryMutAct_9fa48("5266") ? "Stryker was here!" : (stryCov_9fa48("5266"), '')).map(stryMutAct_9fa48("5267") ? () => undefined : (stryCov_9fa48("5267"), x => stryMutAct_9fa48("5268") ? x - x : (stryCov_9fa48("5268"), x + x))).join(stryMutAct_9fa48("5269") ? "Stryker was here!" : (stryCov_9fa48("5269"), ''));
      }
    }
    if (stryMutAct_9fa48("5272") ? c.length !== 6 : stryMutAct_9fa48("5271") ? false : stryMutAct_9fa48("5270") ? true : (stryCov_9fa48("5270", "5271", "5272"), c.length === 6)) {
      if (stryMutAct_9fa48("5273")) {
        {}
      } else {
        stryCov_9fa48("5273");
        const r = parseInt(stryMutAct_9fa48("5274") ? c : (stryCov_9fa48("5274"), c.slice(0, 2)), 16);
        const g = parseInt(stryMutAct_9fa48("5275") ? c : (stryCov_9fa48("5275"), c.slice(2, 4)), 16);
        const b = parseInt(stryMutAct_9fa48("5276") ? c : (stryCov_9fa48("5276"), c.slice(4, 6)), 16);
        return stryMutAct_9fa48("5277") ? `` : (stryCov_9fa48("5277"), `rgba(${r},${g},${b},${alpha})`);
      }
    }
    if (stryMutAct_9fa48("5280") ? c.length !== 8 : stryMutAct_9fa48("5279") ? false : stryMutAct_9fa48("5278") ? true : (stryCov_9fa48("5278", "5279", "5280"), c.length === 8)) {
      if (stryMutAct_9fa48("5281")) {
        {}
      } else {
        stryCov_9fa48("5281");
        const r = parseInt(stryMutAct_9fa48("5282") ? c : (stryCov_9fa48("5282"), c.slice(0, 2)), 16);
        const g = parseInt(stryMutAct_9fa48("5283") ? c : (stryCov_9fa48("5283"), c.slice(2, 4)), 16);
        const b = parseInt(stryMutAct_9fa48("5284") ? c : (stryCov_9fa48("5284"), c.slice(4, 6)), 16);
        const a = stryMutAct_9fa48("5285") ? parseInt(c.slice(6, 8), 16) * 255 : (stryCov_9fa48("5285"), parseInt(stryMutAct_9fa48("5286") ? c : (stryCov_9fa48("5286"), c.slice(6, 8)), 16) / 255);
        return stryMutAct_9fa48("5287") ? `` : (stryCov_9fa48("5287"), `rgba(${r},${g},${b},${(stryMutAct_9fa48("5288") ? a / alpha : (stryCov_9fa48("5288"), a * alpha)).toFixed(3)})`);
      }
    }
    return hex; // fallback
  }
}
export function withAlpha(color: string, alpha: number): string {
  if (stryMutAct_9fa48("5289")) {
    {}
  } else {
    stryCov_9fa48("5289");
    if (stryMutAct_9fa48("5292") ? false : stryMutAct_9fa48("5291") ? true : stryMutAct_9fa48("5290") ? color : (stryCov_9fa48("5290", "5291", "5292"), !color)) return color;
    if (stryMutAct_9fa48("5295") ? color.endsWith('#') : stryMutAct_9fa48("5294") ? false : stryMutAct_9fa48("5293") ? true : (stryCov_9fa48("5293", "5294", "5295"), color.startsWith(stryMutAct_9fa48("5296") ? "" : (stryCov_9fa48("5296"), '#')))) return hexToRgba(color, alpha);
    if (stryMutAct_9fa48("5299") ? color.endsWith('rgb') : stryMutAct_9fa48("5298") ? false : stryMutAct_9fa48("5297") ? true : (stryCov_9fa48("5297", "5298", "5299"), color.startsWith(stryMutAct_9fa48("5300") ? "" : (stryCov_9fa48("5300"), 'rgb')))) {
      if (stryMutAct_9fa48("5301")) {
        {}
      } else {
        stryCov_9fa48("5301");
        // rgb or rgba
        const parts = color.match(stryMutAct_9fa48("5303") ? /\D+/g : stryMutAct_9fa48("5302") ? /\d/g : (stryCov_9fa48("5302", "5303"), /\d+/g));
        if (stryMutAct_9fa48("5306") ? false : stryMutAct_9fa48("5305") ? true : stryMutAct_9fa48("5304") ? parts : (stryCov_9fa48("5304", "5305", "5306"), !parts)) return color;
        const [r, g, b, a] = parts.map(Number);
        if (stryMutAct_9fa48("5309") ? typeof a !== 'number' : stryMutAct_9fa48("5308") ? false : stryMutAct_9fa48("5307") ? true : (stryCov_9fa48("5307", "5308", "5309"), typeof a === (stryMutAct_9fa48("5310") ? "" : (stryCov_9fa48("5310"), 'number')))) {
          if (stryMutAct_9fa48("5311")) {
            {}
          } else {
            stryCov_9fa48("5311");
            return stryMutAct_9fa48("5312") ? `` : (stryCov_9fa48("5312"), `rgba(${r},${g},${b},${(stryMutAct_9fa48("5313") ? a / alpha : (stryCov_9fa48("5313"), a * alpha)).toFixed(3)})`);
          }
        }
        return stryMutAct_9fa48("5314") ? `` : (stryCov_9fa48("5314"), `rgba(${r},${g},${b},${alpha})`);
      }
    }
    // fallback for named colors or unknown
    return color;
  }
}