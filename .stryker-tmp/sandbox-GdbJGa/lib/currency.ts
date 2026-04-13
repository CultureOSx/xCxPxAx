/**
 * CulturePass Global Currency Engine
 * Maps roughly 200+ countries to their local currency ISO code to support native pricing displays
 * and Stripe gateway intents worldwide.
 */
// @ts-nocheck
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
const COUNTRY_TO_CURRENCY: Record<string, string> = stryMutAct_9fa48("2449") ? {} : (stryCov_9fa48("2449"), {
  // North America
  'United States': stryMutAct_9fa48("2450") ? "" : (stryCov_9fa48("2450"), 'USD'),
  'Canada': stryMutAct_9fa48("2451") ? "" : (stryCov_9fa48("2451"), 'CAD'),
  'Mexico': stryMutAct_9fa48("2452") ? "" : (stryCov_9fa48("2452"), 'MXN'),
  // Europe (Eurozone + Others)
  'United Kingdom': stryMutAct_9fa48("2453") ? "" : (stryCov_9fa48("2453"), 'GBP'),
  'Germany': stryMutAct_9fa48("2454") ? "" : (stryCov_9fa48("2454"), 'EUR'),
  'France': stryMutAct_9fa48("2455") ? "" : (stryCov_9fa48("2455"), 'EUR'),
  'Italy': stryMutAct_9fa48("2456") ? "" : (stryCov_9fa48("2456"), 'EUR'),
  'Spain': stryMutAct_9fa48("2457") ? "" : (stryCov_9fa48("2457"), 'EUR'),
  'Netherlands': stryMutAct_9fa48("2458") ? "" : (stryCov_9fa48("2458"), 'EUR'),
  'Belgium': stryMutAct_9fa48("2459") ? "" : (stryCov_9fa48("2459"), 'EUR'),
  'Austria': stryMutAct_9fa48("2460") ? "" : (stryCov_9fa48("2460"), 'EUR'),
  'Ireland': stryMutAct_9fa48("2461") ? "" : (stryCov_9fa48("2461"), 'EUR'),
  'Portugal': stryMutAct_9fa48("2462") ? "" : (stryCov_9fa48("2462"), 'EUR'),
  'Greece': stryMutAct_9fa48("2463") ? "" : (stryCov_9fa48("2463"), 'EUR'),
  'Finland': stryMutAct_9fa48("2464") ? "" : (stryCov_9fa48("2464"), 'EUR'),
  'Slovakia': stryMutAct_9fa48("2465") ? "" : (stryCov_9fa48("2465"), 'EUR'),
  'Switzerland': stryMutAct_9fa48("2466") ? "" : (stryCov_9fa48("2466"), 'CHF'),
  'Sweden': stryMutAct_9fa48("2467") ? "" : (stryCov_9fa48("2467"), 'SEK'),
  'Norway': stryMutAct_9fa48("2468") ? "" : (stryCov_9fa48("2468"), 'NOK'),
  'Denmark': stryMutAct_9fa48("2469") ? "" : (stryCov_9fa48("2469"), 'DKK'),
  'Poland': stryMutAct_9fa48("2470") ? "" : (stryCov_9fa48("2470"), 'PLN'),
  'Czech Republic': stryMutAct_9fa48("2471") ? "" : (stryCov_9fa48("2471"), 'CZK'),
  'Hungary': stryMutAct_9fa48("2472") ? "" : (stryCov_9fa48("2472"), 'HUF'),
  'Romania': stryMutAct_9fa48("2473") ? "" : (stryCov_9fa48("2473"), 'RON'),
  'Bulgaria': stryMutAct_9fa48("2474") ? "" : (stryCov_9fa48("2474"), 'BGN'),
  'Croatia': stryMutAct_9fa48("2475") ? "" : (stryCov_9fa48("2475"), 'EUR'),
  'Russia': stryMutAct_9fa48("2476") ? "" : (stryCov_9fa48("2476"), 'RUB'),
  'Ukraine': stryMutAct_9fa48("2477") ? "" : (stryCov_9fa48("2477"), 'UAH'),
  // Oceania
  'Australia': stryMutAct_9fa48("2478") ? "" : (stryCov_9fa48("2478"), 'AUD'),
  'New Zealand': stryMutAct_9fa48("2479") ? "" : (stryCov_9fa48("2479"), 'NZD'),
  'Fiji': stryMutAct_9fa48("2480") ? "" : (stryCov_9fa48("2480"), 'FJD'),
  // Asia
  'Japan': stryMutAct_9fa48("2481") ? "" : (stryCov_9fa48("2481"), 'JPY'),
  'China': stryMutAct_9fa48("2482") ? "" : (stryCov_9fa48("2482"), 'CNY'),
  'India': stryMutAct_9fa48("2483") ? "" : (stryCov_9fa48("2483"), 'INR'),
  'South Korea': stryMutAct_9fa48("2484") ? "" : (stryCov_9fa48("2484"), 'KRW'),
  'Singapore': stryMutAct_9fa48("2485") ? "" : (stryCov_9fa48("2485"), 'SGD'),
  'Malaysia': stryMutAct_9fa48("2486") ? "" : (stryCov_9fa48("2486"), 'MYR'),
  'Indonesia': stryMutAct_9fa48("2487") ? "" : (stryCov_9fa48("2487"), 'IDR'),
  'Thailand': stryMutAct_9fa48("2488") ? "" : (stryCov_9fa48("2488"), 'THB'),
  'Vietnam': stryMutAct_9fa48("2489") ? "" : (stryCov_9fa48("2489"), 'VND'),
  'Philippines': stryMutAct_9fa48("2490") ? "" : (stryCov_9fa48("2490"), 'PHP'),
  'Taiwan': stryMutAct_9fa48("2491") ? "" : (stryCov_9fa48("2491"), 'TWD'),
  'Hong Kong': stryMutAct_9fa48("2492") ? "" : (stryCov_9fa48("2492"), 'HKD'),
  'Pakistan': stryMutAct_9fa48("2493") ? "" : (stryCov_9fa48("2493"), 'PKR'),
  'Bangladesh': stryMutAct_9fa48("2494") ? "" : (stryCov_9fa48("2494"), 'BDT'),
  'Sri Lanka': stryMutAct_9fa48("2495") ? "" : (stryCov_9fa48("2495"), 'LKR'),
  // Middle East
  'United Arab Emirates': stryMutAct_9fa48("2496") ? "" : (stryCov_9fa48("2496"), 'AED'),
  'UAE': stryMutAct_9fa48("2497") ? "" : (stryCov_9fa48("2497"), 'AED'),
  'Saudi Arabia': stryMutAct_9fa48("2498") ? "" : (stryCov_9fa48("2498"), 'SAR'),
  'Qatar': stryMutAct_9fa48("2499") ? "" : (stryCov_9fa48("2499"), 'QAR'),
  'Kuwait': stryMutAct_9fa48("2500") ? "" : (stryCov_9fa48("2500"), 'KWD'),
  'Oman': stryMutAct_9fa48("2501") ? "" : (stryCov_9fa48("2501"), 'OMR'),
  'Bahrain': stryMutAct_9fa48("2502") ? "" : (stryCov_9fa48("2502"), 'BHD'),
  'Israel': stryMutAct_9fa48("2503") ? "" : (stryCov_9fa48("2503"), 'ILS'),
  'Turkey': stryMutAct_9fa48("2504") ? "" : (stryCov_9fa48("2504"), 'TRY'),
  'Egypt': stryMutAct_9fa48("2505") ? "" : (stryCov_9fa48("2505"), 'EGP'),
  'Jordan': stryMutAct_9fa48("2506") ? "" : (stryCov_9fa48("2506"), 'JOD'),
  'Lebanon': stryMutAct_9fa48("2507") ? "" : (stryCov_9fa48("2507"), 'LBP'),
  // Africa
  'South Africa': stryMutAct_9fa48("2508") ? "" : (stryCov_9fa48("2508"), 'ZAR'),
  'Nigeria': stryMutAct_9fa48("2509") ? "" : (stryCov_9fa48("2509"), 'NGN'),
  'Kenya': stryMutAct_9fa48("2510") ? "" : (stryCov_9fa48("2510"), 'KES'),
  'Ghana': stryMutAct_9fa48("2511") ? "" : (stryCov_9fa48("2511"), 'GHS'),
  'Tanzania': stryMutAct_9fa48("2512") ? "" : (stryCov_9fa48("2512"), 'TZS'),
  'Uganda': stryMutAct_9fa48("2513") ? "" : (stryCov_9fa48("2513"), 'UGX'),
  'Morocco': stryMutAct_9fa48("2514") ? "" : (stryCov_9fa48("2514"), 'MAD'),
  'Algeria': stryMutAct_9fa48("2515") ? "" : (stryCov_9fa48("2515"), 'DZD'),
  'Tunisia': stryMutAct_9fa48("2516") ? "" : (stryCov_9fa48("2516"), 'TND'),
  // Latin America
  'Brazil': stryMutAct_9fa48("2517") ? "" : (stryCov_9fa48("2517"), 'BRL'),
  'Argentina': stryMutAct_9fa48("2518") ? "" : (stryCov_9fa48("2518"), 'ARS'),
  'Chile': stryMutAct_9fa48("2519") ? "" : (stryCov_9fa48("2519"), 'CLP'),
  'Colombia': stryMutAct_9fa48("2520") ? "" : (stryCov_9fa48("2520"), 'COP'),
  'Peru': stryMutAct_9fa48("2521") ? "" : (stryCov_9fa48("2521"), 'PEN'),
  'Uruguay': stryMutAct_9fa48("2522") ? "" : (stryCov_9fa48("2522"), 'UYU'),
  'Venezuela': stryMutAct_9fa48("2523") ? "" : (stryCov_9fa48("2523"), 'VES')
});

/**
 * Fallback to USD if the country isn't matched exactly or omitted.
 */
export function getCurrencyForCountry(country?: string | null): string {
  if (stryMutAct_9fa48("2524")) {
    {}
  } else {
    stryCov_9fa48("2524");
    if (stryMutAct_9fa48("2527") ? false : stryMutAct_9fa48("2526") ? true : stryMutAct_9fa48("2525") ? country : (stryCov_9fa48("2525", "2526", "2527"), !country)) return stryMutAct_9fa48("2528") ? "" : (stryCov_9fa48("2528"), 'USD');
    return stryMutAct_9fa48("2531") ? COUNTRY_TO_CURRENCY[country] && 'USD' : stryMutAct_9fa48("2530") ? false : stryMutAct_9fa48("2529") ? true : (stryCov_9fa48("2529", "2530", "2531"), COUNTRY_TO_CURRENCY[country] || (stryMutAct_9fa48("2532") ? "" : (stryCov_9fa48("2532"), 'USD')));
  }
}

/**
 * Returns a strict locale (e.g. en-AU) for Intl formatting so the currency
 * renders natively (e.g. ¥ vs JPY).
 */
export function getLocaleForCountry(country?: string | null): string {
  if (stryMutAct_9fa48("2533")) {
    {}
  } else {
    stryCov_9fa48("2533");
    if (stryMutAct_9fa48("2536") ? false : stryMutAct_9fa48("2535") ? true : stryMutAct_9fa48("2534") ? country : (stryCov_9fa48("2534", "2535", "2536"), !country)) return stryMutAct_9fa48("2537") ? "" : (stryCov_9fa48("2537"), 'en-US');
    const mapping: Record<string, string> = stryMutAct_9fa48("2538") ? {} : (stryCov_9fa48("2538"), {
      'Australia': stryMutAct_9fa48("2539") ? "" : (stryCov_9fa48("2539"), 'en-AU'),
      'New Zealand': stryMutAct_9fa48("2540") ? "" : (stryCov_9fa48("2540"), 'en-NZ'),
      'United Kingdom': stryMutAct_9fa48("2541") ? "" : (stryCov_9fa48("2541"), 'en-GB'),
      'United States': stryMutAct_9fa48("2542") ? "" : (stryCov_9fa48("2542"), 'en-US'),
      'Canada': stryMutAct_9fa48("2543") ? "" : (stryCov_9fa48("2543"), 'en-CA'),
      'United Arab Emirates': stryMutAct_9fa48("2544") ? "" : (stryCov_9fa48("2544"), 'ar-AE'),
      'UAE': stryMutAct_9fa48("2545") ? "" : (stryCov_9fa48("2545"), 'ar-AE'),
      'Germany': stryMutAct_9fa48("2546") ? "" : (stryCov_9fa48("2546"), 'de-DE'),
      'France': stryMutAct_9fa48("2547") ? "" : (stryCov_9fa48("2547"), 'fr-FR'),
      'Japan': stryMutAct_9fa48("2548") ? "" : (stryCov_9fa48("2548"), 'ja-JP'),
      'India': stryMutAct_9fa48("2549") ? "" : (stryCov_9fa48("2549"), 'en-IN'),
      'China': stryMutAct_9fa48("2550") ? "" : (stryCov_9fa48("2550"), 'zh-CN')
    });
    return stryMutAct_9fa48("2553") ? mapping[country] && 'en-US' : stryMutAct_9fa48("2552") ? false : stryMutAct_9fa48("2551") ? true : (stryCov_9fa48("2551", "2552", "2553"), mapping[country] || (stryMutAct_9fa48("2554") ? "" : (stryCov_9fa48("2554"), 'en-US')));
  }
}

/**
 * Formats an integer amount (in cents/lowest denominator) to a localized, formatted string.
 */
export function formatCurrency(cents: number, country?: string | null): string {
  if (stryMutAct_9fa48("2555")) {
    {}
  } else {
    stryCov_9fa48("2555");
    const currency = getCurrencyForCountry(country);
    const locale = getLocaleForCountry(country);

    // Note: some currencies like JPY do NOT use fractional units in Stripe conventionally,
    // but we enforce / 100 for now uniformly in CulturePass for AUD/USD/GBP etc.
    const isZeroDecimal = (stryMutAct_9fa48("2556") ? [] : (stryCov_9fa48("2556"), [stryMutAct_9fa48("2557") ? "" : (stryCov_9fa48("2557"), 'JPY'), stryMutAct_9fa48("2558") ? "" : (stryCov_9fa48("2558"), 'KRW'), stryMutAct_9fa48("2559") ? "" : (stryCov_9fa48("2559"), 'VND')])).includes(currency);
    const amount = isZeroDecimal ? cents : stryMutAct_9fa48("2560") ? cents * 100 : (stryCov_9fa48("2560"), cents / 100);
    return new Intl.NumberFormat(locale, stryMutAct_9fa48("2561") ? {} : (stryCov_9fa48("2561"), {
      style: stryMutAct_9fa48("2562") ? "" : (stryCov_9fa48("2562"), 'currency'),
      currency,
      minimumFractionDigits: isZeroDecimal ? 0 : 2,
      maximumFractionDigits: isZeroDecimal ? 0 : 2
    })).format(amount);
  }
}