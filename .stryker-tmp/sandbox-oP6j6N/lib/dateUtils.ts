// @ts-nocheck
// ---------------------------------------------------------------------------
// Time formatting
// ---------------------------------------------------------------------------

/**
 * Normalises a time string to 12-hour AM/PM format.
 *
 * Handles:
 *   "15:30"   → "3:30 PM"   (24-hour input)
 *   "3:30 PM" → "3:30 PM"   (already 12-hour — pass through)
 *   "00:00"   → "12:00 AM"  (midnight)
 *   "12:00"   → "12:00 PM"  (noon)
 *
 * Returns the original string unchanged when it cannot be parsed.
 */function stryNS_9fa48() {
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
export function formatEventTime(timeStr: string | null | undefined): string {
  if (stryMutAct_9fa48("2563")) {
    {}
  } else {
    stryCov_9fa48("2563");
    if (stryMutAct_9fa48("2566") ? false : stryMutAct_9fa48("2565") ? true : stryMutAct_9fa48("2564") ? timeStr : (stryCov_9fa48("2564", "2565", "2566"), !timeStr)) return stryMutAct_9fa48("2567") ? "Stryker was here!" : (stryCov_9fa48("2567"), '');

    // Already 12-hour format (e.g. "3:30 PM") — normalise case only
    const ampmMatch = timeStr.match(stryMutAct_9fa48("2575") ? /^(\d{1,2}):(\d{2})\S*(am|pm)$/i : stryMutAct_9fa48("2574") ? /^(\d{1,2}):(\d{2})\s(am|pm)$/i : stryMutAct_9fa48("2573") ? /^(\d{1,2}):(\D{2})\s*(am|pm)$/i : stryMutAct_9fa48("2572") ? /^(\d{1,2}):(\d)\s*(am|pm)$/i : stryMutAct_9fa48("2571") ? /^(\D{1,2}):(\d{2})\s*(am|pm)$/i : stryMutAct_9fa48("2570") ? /^(\d):(\d{2})\s*(am|pm)$/i : stryMutAct_9fa48("2569") ? /^(\d{1,2}):(\d{2})\s*(am|pm)/i : stryMutAct_9fa48("2568") ? /(\d{1,2}):(\d{2})\s*(am|pm)$/i : (stryCov_9fa48("2568", "2569", "2570", "2571", "2572", "2573", "2574", "2575"), /^(\d{1,2}):(\d{2})\s*(am|pm)$/i));
    if (stryMutAct_9fa48("2577") ? false : stryMutAct_9fa48("2576") ? true : (stryCov_9fa48("2576", "2577"), ampmMatch)) {
      if (stryMutAct_9fa48("2578")) {
        {}
      } else {
        stryCov_9fa48("2578");
        const [, h, m, ampm] = ampmMatch;
        return stryMutAct_9fa48("2579") ? `` : (stryCov_9fa48("2579"), `${h}:${m} ${stryMutAct_9fa48("2580") ? ampm.toLowerCase() : (stryCov_9fa48("2580"), ampm.toUpperCase())}`);
      }
    }

    // 24-hour format: HH:MM or H:MM
    const h24Match = timeStr.match(stryMutAct_9fa48("2586") ? /^(\d{1,2}):(\D{2})$/ : stryMutAct_9fa48("2585") ? /^(\d{1,2}):(\d)$/ : stryMutAct_9fa48("2584") ? /^(\D{1,2}):(\d{2})$/ : stryMutAct_9fa48("2583") ? /^(\d):(\d{2})$/ : stryMutAct_9fa48("2582") ? /^(\d{1,2}):(\d{2})/ : stryMutAct_9fa48("2581") ? /(\d{1,2}):(\d{2})$/ : (stryCov_9fa48("2581", "2582", "2583", "2584", "2585", "2586"), /^(\d{1,2}):(\d{2})$/));
    if (stryMutAct_9fa48("2588") ? false : stryMutAct_9fa48("2587") ? true : (stryCov_9fa48("2587", "2588"), h24Match)) {
      if (stryMutAct_9fa48("2589")) {
        {}
      } else {
        stryCov_9fa48("2589");
        const hours = parseInt(h24Match[1], 10);
        const mins = h24Match[2];
        if (stryMutAct_9fa48("2592") ? hours !== 0 : stryMutAct_9fa48("2591") ? false : stryMutAct_9fa48("2590") ? true : (stryCov_9fa48("2590", "2591", "2592"), hours === 0)) return stryMutAct_9fa48("2593") ? `` : (stryCov_9fa48("2593"), `12:${mins} AM`);
        if (stryMutAct_9fa48("2597") ? hours >= 12 : stryMutAct_9fa48("2596") ? hours <= 12 : stryMutAct_9fa48("2595") ? false : stryMutAct_9fa48("2594") ? true : (stryCov_9fa48("2594", "2595", "2596", "2597"), hours < 12)) return stryMutAct_9fa48("2598") ? `` : (stryCov_9fa48("2598"), `${hours}:${mins} AM`);
        if (stryMutAct_9fa48("2601") ? hours !== 12 : stryMutAct_9fa48("2600") ? false : stryMutAct_9fa48("2599") ? true : (stryCov_9fa48("2599", "2600", "2601"), hours === 12)) return stryMutAct_9fa48("2602") ? `` : (stryCov_9fa48("2602"), `12:${mins} PM`);
        return stryMutAct_9fa48("2603") ? `` : (stryCov_9fa48("2603"), `${stryMutAct_9fa48("2604") ? hours + 12 : (stryCov_9fa48("2604"), hours - 12)}:${mins} PM`);
      }
    }
    return timeStr; // unrecognised format — return unchanged
  }
}

// ---------------------------------------------------------------------------
// Locale helpers
// ---------------------------------------------------------------------------

const US_CA_COUNTRIES = stryMutAct_9fa48("2605") ? [] : (stryCov_9fa48("2605"), [stryMutAct_9fa48("2606") ? "" : (stryCov_9fa48("2606"), 'United States'), stryMutAct_9fa48("2607") ? "" : (stryCov_9fa48("2607"), 'USA'), stryMutAct_9fa48("2608") ? "" : (stryCov_9fa48("2608"), 'US'), stryMutAct_9fa48("2609") ? "" : (stryCov_9fa48("2609"), 'Canada'), stryMutAct_9fa48("2610") ? "" : (stryCov_9fa48("2610"), 'CA')]);

/**
 * Returns the BCP 47 locale string for the given country.
 * AU / NZ / UK / most of the world → en-AU (DD/MM/YYYY)
 * US / CA → en-US (MM/DD/YYYY)
 */
export function getLocaleForCountry(country?: string): string {
  if (stryMutAct_9fa48("2611")) {
    {}
  } else {
    stryCov_9fa48("2611");
    if (stryMutAct_9fa48("2614") ? false : stryMutAct_9fa48("2613") ? true : stryMutAct_9fa48("2612") ? country : (stryCov_9fa48("2612", "2613", "2614"), !country)) return stryMutAct_9fa48("2615") ? "" : (stryCov_9fa48("2615"), 'en-AU');
    if (stryMutAct_9fa48("2617") ? false : stryMutAct_9fa48("2616") ? true : (stryCov_9fa48("2616", "2617"), US_CA_COUNTRIES.includes(country))) return stryMutAct_9fa48("2618") ? "" : (stryCov_9fa48("2618"), 'en-US');
    return stryMutAct_9fa48("2619") ? "" : (stryCov_9fa48("2619"), 'en-AU');
  }
}

/**
 * Returns the ISO 4217 currency code for the given country name.
 */
export function getCurrencyForCountry(country?: string): string {
  if (stryMutAct_9fa48("2620")) {
    {}
  } else {
    stryCov_9fa48("2620");
    const map: Record<string, string> = stryMutAct_9fa48("2621") ? {} : (stryCov_9fa48("2621"), {
      'New Zealand': stryMutAct_9fa48("2622") ? "" : (stryCov_9fa48("2622"), 'NZD'),
      'United Kingdom': stryMutAct_9fa48("2623") ? "" : (stryCov_9fa48("2623"), 'GBP'),
      'United States': stryMutAct_9fa48("2624") ? "" : (stryCov_9fa48("2624"), 'USD'),
      'USA': stryMutAct_9fa48("2625") ? "" : (stryCov_9fa48("2625"), 'USD'),
      'Canada': stryMutAct_9fa48("2626") ? "" : (stryCov_9fa48("2626"), 'CAD'),
      'UAE': stryMutAct_9fa48("2627") ? "" : (stryCov_9fa48("2627"), 'AED'),
      'United Arab Emirates': stryMutAct_9fa48("2628") ? "" : (stryCov_9fa48("2628"), 'AED')
    });
    return stryMutAct_9fa48("2629") ? map[country ?? ''] && 'AUD' : (stryCov_9fa48("2629"), map[stryMutAct_9fa48("2630") ? country && '' : (stryCov_9fa48("2630"), country ?? (stryMutAct_9fa48("2631") ? "Stryker was here!" : (stryCov_9fa48("2631"), '')))] ?? (stryMutAct_9fa48("2632") ? "" : (stryCov_9fa48("2632"), 'AUD')));
  }
}

/**
 * Formats a YYYY-MM-DD date string for display, respecting country locale.
 */
export function formatDateForCountry(dateStr: string, country?: string, options?: Intl.DateTimeFormatOptions): string {
  if (stryMutAct_9fa48("2633")) {
    {}
  } else {
    stryCov_9fa48("2633");
    const d = new Date(dateStr + (stryMutAct_9fa48("2634") ? "" : (stryCov_9fa48("2634"), 'T00:00:00')));
    if (stryMutAct_9fa48("2636") ? false : stryMutAct_9fa48("2635") ? true : (stryCov_9fa48("2635", "2636"), isNaN(d.getTime()))) return dateStr;
    const locale = getLocaleForCountry(country);
    return d.toLocaleDateString(locale, stryMutAct_9fa48("2637") ? options && {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    } : (stryCov_9fa48("2637"), options ?? (stryMutAct_9fa48("2638") ? {} : (stryCov_9fa48("2638"), {
      day: stryMutAct_9fa48("2639") ? "" : (stryCov_9fa48("2639"), 'numeric'),
      month: stryMutAct_9fa48("2640") ? "" : (stryCov_9fa48("2640"), 'short'),
      year: stryMutAct_9fa48("2641") ? "" : (stryCov_9fa48("2641"), 'numeric')
    }))));
  }
}

/**
 * Formats a price in cents to a currency string for a given country.
 */
export function formatPrice(priceCents: number, country?: string): string {
  if (stryMutAct_9fa48("2642")) {
    {}
  } else {
    stryCov_9fa48("2642");
    const currency = getCurrencyForCountry(country);
    const locale = getLocaleForCountry(country);
    return new Intl.NumberFormat(locale, stryMutAct_9fa48("2643") ? {} : (stryCov_9fa48("2643"), {
      style: stryMutAct_9fa48("2644") ? "" : (stryCov_9fa48("2644"), 'currency'),
      currency,
      minimumFractionDigits: 0
    })).format(stryMutAct_9fa48("2645") ? priceCents * 100 : (stryCov_9fa48("2645"), priceCents / 100));
  }
}

// ---------------------------------------------------------------------------

function toDate(date: string | Date | null | undefined): Date | null {
  if (stryMutAct_9fa48("2646")) {
    {}
  } else {
    stryCov_9fa48("2646");
    if (stryMutAct_9fa48("2649") ? false : stryMutAct_9fa48("2648") ? true : stryMutAct_9fa48("2647") ? date : (stryCov_9fa48("2647", "2648", "2649"), !date)) return null;
    const parsed = date instanceof Date ? date : new Date(date);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
export function formatEventDateTime(date: string, time?: string, country?: string): string {
  if (stryMutAct_9fa48("2650")) {
    {}
  } else {
    stryCov_9fa48("2650");
    const day = toDate(date);
    if (stryMutAct_9fa48("2653") ? false : stryMutAct_9fa48("2652") ? true : stryMutAct_9fa48("2651") ? day : (stryCov_9fa48("2651", "2652", "2653"), !day)) return date;
    const locale = getLocaleForCountry(country);
    const dateLabel = day.toLocaleDateString(locale, stryMutAct_9fa48("2654") ? {} : (stryCov_9fa48("2654"), {
      weekday: stryMutAct_9fa48("2655") ? "" : (stryCov_9fa48("2655"), 'short'),
      day: stryMutAct_9fa48("2656") ? "" : (stryCov_9fa48("2656"), 'numeric'),
      month: stryMutAct_9fa48("2657") ? "" : (stryCov_9fa48("2657"), 'short')
    }));
    if (stryMutAct_9fa48("2660") ? false : stryMutAct_9fa48("2659") ? true : stryMutAct_9fa48("2658") ? time : (stryCov_9fa48("2658", "2659", "2660"), !time)) return dateLabel;
    return stryMutAct_9fa48("2661") ? `` : (stryCov_9fa48("2661"), `${dateLabel} • ${formatEventTime(time)}`);
  }
}
export function formatEventDateTimeBadge(date: string, time?: string, country?: string): string {
  if (stryMutAct_9fa48("2662")) {
    {}
  } else {
    stryCov_9fa48("2662");
    const day = toDate(date);
    if (stryMutAct_9fa48("2665") ? false : stryMutAct_9fa48("2664") ? true : stryMutAct_9fa48("2663") ? day : (stryCov_9fa48("2663", "2664", "2665"), !day)) return time ? stryMutAct_9fa48("2666") ? `` : (stryCov_9fa48("2666"), `${date} • ${formatEventTime(time)}`) : date;
    const locale = getLocaleForCountry(country);
    const dateLabel = day.toLocaleDateString(locale, stryMutAct_9fa48("2667") ? {} : (stryCov_9fa48("2667"), {
      day: stryMutAct_9fa48("2668") ? "" : (stryCov_9fa48("2668"), 'numeric'),
      month: stryMutAct_9fa48("2669") ? "" : (stryCov_9fa48("2669"), 'short')
    }));
    return time ? stryMutAct_9fa48("2670") ? `` : (stryCov_9fa48("2670"), `${dateLabel} • ${formatEventTime(time)}`) : dateLabel;
  }
}

/** Discover “live” badge window after scheduled start (no endTime on most events). */
export const DISCOVER_EVENT_LIVE_WINDOW_MS = stryMutAct_9fa48("2671") ? 3 * 60 * 60 / 1000 : (stryCov_9fa48("2671"), (stryMutAct_9fa48("2672") ? 3 * 60 / 60 : (stryCov_9fa48("2672"), (stryMutAct_9fa48("2673") ? 3 / 60 : (stryCov_9fa48("2673"), 3 * 60)) * 60)) * 1000);

/**
 * Parses local start time from `YYYY-MM-DD` plus optional `HH:MM` or `h:mm am/pm`.
 * Uses the device’s local timezone.
 */
export function parseEventStartMs(dateStr: string, timeStr?: string | null): number | null {
  if (stryMutAct_9fa48("2674")) {
    {}
  } else {
    stryCov_9fa48("2674");
    if (stryMutAct_9fa48("2677") ? !dateStr && typeof dateStr !== 'string' : stryMutAct_9fa48("2676") ? false : stryMutAct_9fa48("2675") ? true : (stryCov_9fa48("2675", "2676", "2677"), (stryMutAct_9fa48("2678") ? dateStr : (stryCov_9fa48("2678"), !dateStr)) || (stryMutAct_9fa48("2680") ? typeof dateStr === 'string' : stryMutAct_9fa48("2679") ? false : (stryCov_9fa48("2679", "2680"), typeof dateStr !== (stryMutAct_9fa48("2681") ? "" : (stryCov_9fa48("2681"), 'string')))))) return null;
    const t = stryMutAct_9fa48("2683") ? timeStr.trim() : stryMutAct_9fa48("2682") ? timeStr : (stryCov_9fa48("2682", "2683"), timeStr?.trim());
    if (stryMutAct_9fa48("2685") ? false : stryMutAct_9fa48("2684") ? true : (stryCov_9fa48("2684", "2685"), t)) {
      if (stryMutAct_9fa48("2686")) {
        {}
      } else {
        stryCov_9fa48("2686");
        const h24 = t.match(stryMutAct_9fa48("2692") ? /^(\d{1,2}):(\D{2})$/ : stryMutAct_9fa48("2691") ? /^(\d{1,2}):(\d)$/ : stryMutAct_9fa48("2690") ? /^(\D{1,2}):(\d{2})$/ : stryMutAct_9fa48("2689") ? /^(\d):(\d{2})$/ : stryMutAct_9fa48("2688") ? /^(\d{1,2}):(\d{2})/ : stryMutAct_9fa48("2687") ? /(\d{1,2}):(\d{2})$/ : (stryCov_9fa48("2687", "2688", "2689", "2690", "2691", "2692"), /^(\d{1,2}):(\d{2})$/));
        if (stryMutAct_9fa48("2694") ? false : stryMutAct_9fa48("2693") ? true : (stryCov_9fa48("2693", "2694"), h24)) {
          if (stryMutAct_9fa48("2695")) {
            {}
          } else {
            stryCov_9fa48("2695");
            const hh = h24[1].padStart(2, stryMutAct_9fa48("2696") ? "" : (stryCov_9fa48("2696"), '0'));
            const d = new Date(stryMutAct_9fa48("2697") ? `` : (stryCov_9fa48("2697"), `${dateStr}T${hh}:${h24[2]}:00`));
            if (stryMutAct_9fa48("2700") ? false : stryMutAct_9fa48("2699") ? true : stryMutAct_9fa48("2698") ? Number.isNaN(d.getTime()) : (stryCov_9fa48("2698", "2699", "2700"), !Number.isNaN(d.getTime()))) return d.getTime();
          }
        }
        const ampm = t.match(stryMutAct_9fa48("2708") ? /^(\d{1,2}):(\d{2})\S*(am|pm)$/i : stryMutAct_9fa48("2707") ? /^(\d{1,2}):(\d{2})\s(am|pm)$/i : stryMutAct_9fa48("2706") ? /^(\d{1,2}):(\D{2})\s*(am|pm)$/i : stryMutAct_9fa48("2705") ? /^(\d{1,2}):(\d)\s*(am|pm)$/i : stryMutAct_9fa48("2704") ? /^(\D{1,2}):(\d{2})\s*(am|pm)$/i : stryMutAct_9fa48("2703") ? /^(\d):(\d{2})\s*(am|pm)$/i : stryMutAct_9fa48("2702") ? /^(\d{1,2}):(\d{2})\s*(am|pm)/i : stryMutAct_9fa48("2701") ? /(\d{1,2}):(\d{2})\s*(am|pm)$/i : (stryCov_9fa48("2701", "2702", "2703", "2704", "2705", "2706", "2707", "2708"), /^(\d{1,2}):(\d{2})\s*(am|pm)$/i));
        if (stryMutAct_9fa48("2710") ? false : stryMutAct_9fa48("2709") ? true : (stryCov_9fa48("2709", "2710"), ampm)) {
          if (stryMutAct_9fa48("2711")) {
            {}
          } else {
            stryCov_9fa48("2711");
            let h = parseInt(ampm[1], 10);
            const m = ampm[2];
            const ap = stryMutAct_9fa48("2712") ? ampm[3].toUpperCase() : (stryCov_9fa48("2712"), ampm[3].toLowerCase());
            if (stryMutAct_9fa48("2715") ? ap === 'pm' || h !== 12 : stryMutAct_9fa48("2714") ? false : stryMutAct_9fa48("2713") ? true : (stryCov_9fa48("2713", "2714", "2715"), (stryMutAct_9fa48("2717") ? ap !== 'pm' : stryMutAct_9fa48("2716") ? true : (stryCov_9fa48("2716", "2717"), ap === (stryMutAct_9fa48("2718") ? "" : (stryCov_9fa48("2718"), 'pm')))) && (stryMutAct_9fa48("2720") ? h === 12 : stryMutAct_9fa48("2719") ? true : (stryCov_9fa48("2719", "2720"), h !== 12)))) stryMutAct_9fa48("2721") ? h -= 12 : (stryCov_9fa48("2721"), h += 12);
            if (stryMutAct_9fa48("2724") ? ap === 'am' || h === 12 : stryMutAct_9fa48("2723") ? false : stryMutAct_9fa48("2722") ? true : (stryCov_9fa48("2722", "2723", "2724"), (stryMutAct_9fa48("2726") ? ap !== 'am' : stryMutAct_9fa48("2725") ? true : (stryCov_9fa48("2725", "2726"), ap === (stryMutAct_9fa48("2727") ? "" : (stryCov_9fa48("2727"), 'am')))) && (stryMutAct_9fa48("2729") ? h !== 12 : stryMutAct_9fa48("2728") ? true : (stryCov_9fa48("2728", "2729"), h === 12)))) h = 0;
            const d = new Date(stryMutAct_9fa48("2730") ? `` : (stryCov_9fa48("2730"), `${dateStr}T${String(h).padStart(2, stryMutAct_9fa48("2731") ? "" : (stryCov_9fa48("2731"), '0'))}:${m}:00`));
            if (stryMutAct_9fa48("2734") ? false : stryMutAct_9fa48("2733") ? true : stryMutAct_9fa48("2732") ? Number.isNaN(d.getTime()) : (stryCov_9fa48("2732", "2733", "2734"), !Number.isNaN(d.getTime()))) return d.getTime();
          }
        }
      }
    }
    const d = new Date(stryMutAct_9fa48("2735") ? `` : (stryCov_9fa48("2735"), `${dateStr}T00:00:00`));
    return Number.isNaN(d.getTime()) ? null : d.getTime();
  }
}

/**
 * Human-readable countdown for “Starts in …” (e.g. `1h 05m`, `12:04`).
 */
export function formatStartsInCountdown(msUntilStart: number): string {
  if (stryMutAct_9fa48("2736")) {
    {}
  } else {
    stryCov_9fa48("2736");
    if (stryMutAct_9fa48("2740") ? msUntilStart > 0 : stryMutAct_9fa48("2739") ? msUntilStart < 0 : stryMutAct_9fa48("2738") ? false : stryMutAct_9fa48("2737") ? true : (stryCov_9fa48("2737", "2738", "2739", "2740"), msUntilStart <= 0)) return stryMutAct_9fa48("2741") ? "" : (stryCov_9fa48("2741"), '0:00');
    const totalSec = Math.ceil(stryMutAct_9fa48("2742") ? msUntilStart * 1000 : (stryCov_9fa48("2742"), msUntilStart / 1000));
    const h = Math.floor(stryMutAct_9fa48("2743") ? totalSec * 3600 : (stryCov_9fa48("2743"), totalSec / 3600));
    const m = Math.floor(stryMutAct_9fa48("2744") ? totalSec % 3600 * 60 : (stryCov_9fa48("2744"), (stryMutAct_9fa48("2745") ? totalSec * 3600 : (stryCov_9fa48("2745"), totalSec % 3600)) / 60));
    const s = stryMutAct_9fa48("2746") ? totalSec * 60 : (stryCov_9fa48("2746"), totalSec % 60);
    if (stryMutAct_9fa48("2750") ? h <= 0 : stryMutAct_9fa48("2749") ? h >= 0 : stryMutAct_9fa48("2748") ? false : stryMutAct_9fa48("2747") ? true : (stryCov_9fa48("2747", "2748", "2749", "2750"), h > 0)) return stryMutAct_9fa48("2751") ? `` : (stryCov_9fa48("2751"), `${h}h ${String(m).padStart(2, stryMutAct_9fa48("2752") ? "" : (stryCov_9fa48("2752"), '0'))}m`);
    return stryMutAct_9fa48("2753") ? `` : (stryCov_9fa48("2753"), `${m}:${String(s).padStart(2, stryMutAct_9fa48("2754") ? "" : (stryCov_9fa48("2754"), '0'))}`);
  }
}
export function isEventInDiscoverLiveWindow(startMs: number, nowMs: number = Date.now()): boolean {
  if (stryMutAct_9fa48("2755")) {
    {}
  } else {
    stryCov_9fa48("2755");
    return stryMutAct_9fa48("2758") ? startMs <= nowMs || nowMs < startMs + DISCOVER_EVENT_LIVE_WINDOW_MS : stryMutAct_9fa48("2757") ? false : stryMutAct_9fa48("2756") ? true : (stryCov_9fa48("2756", "2757", "2758"), (stryMutAct_9fa48("2761") ? startMs > nowMs : stryMutAct_9fa48("2760") ? startMs < nowMs : stryMutAct_9fa48("2759") ? true : (stryCov_9fa48("2759", "2760", "2761"), startMs <= nowMs)) && (stryMutAct_9fa48("2764") ? nowMs >= startMs + DISCOVER_EVENT_LIVE_WINDOW_MS : stryMutAct_9fa48("2763") ? nowMs <= startMs + DISCOVER_EVENT_LIVE_WINDOW_MS : stryMutAct_9fa48("2762") ? true : (stryCov_9fa48("2762", "2763", "2764"), nowMs < (stryMutAct_9fa48("2765") ? startMs - DISCOVER_EVENT_LIVE_WINDOW_MS : (stryCov_9fa48("2765"), startMs + DISCOVER_EVENT_LIVE_WINDOW_MS)))));
  }
}
export function timeAgo(date: string | Date | null | undefined): string {
  if (stryMutAct_9fa48("2766")) {
    {}
  } else {
    stryCov_9fa48("2766");
    const from = toDate(date);
    if (stryMutAct_9fa48("2769") ? false : stryMutAct_9fa48("2768") ? true : stryMutAct_9fa48("2767") ? from : (stryCov_9fa48("2767", "2768", "2769"), !from)) return stryMutAct_9fa48("2770") ? "" : (stryCov_9fa48("2770"), 'just now');
    const seconds = stryMutAct_9fa48("2771") ? Math.min(1, Math.floor((Date.now() - from.getTime()) / 1000)) : (stryCov_9fa48("2771"), Math.max(1, Math.floor(stryMutAct_9fa48("2772") ? (Date.now() - from.getTime()) * 1000 : (stryCov_9fa48("2772"), (stryMutAct_9fa48("2773") ? Date.now() + from.getTime() : (stryCov_9fa48("2773"), Date.now() - from.getTime())) / 1000))));
    if (stryMutAct_9fa48("2777") ? seconds >= 60 : stryMutAct_9fa48("2776") ? seconds <= 60 : stryMutAct_9fa48("2775") ? false : stryMutAct_9fa48("2774") ? true : (stryCov_9fa48("2774", "2775", "2776", "2777"), seconds < 60)) return stryMutAct_9fa48("2778") ? `` : (stryCov_9fa48("2778"), `${seconds}s ago`);
    const minutes = Math.floor(stryMutAct_9fa48("2779") ? seconds * 60 : (stryCov_9fa48("2779"), seconds / 60));
    if (stryMutAct_9fa48("2783") ? minutes >= 60 : stryMutAct_9fa48("2782") ? minutes <= 60 : stryMutAct_9fa48("2781") ? false : stryMutAct_9fa48("2780") ? true : (stryCov_9fa48("2780", "2781", "2782", "2783"), minutes < 60)) return stryMutAct_9fa48("2784") ? `` : (stryCov_9fa48("2784"), `${minutes}m ago`);
    const hours = Math.floor(stryMutAct_9fa48("2785") ? minutes * 60 : (stryCov_9fa48("2785"), minutes / 60));
    if (stryMutAct_9fa48("2789") ? hours >= 24 : stryMutAct_9fa48("2788") ? hours <= 24 : stryMutAct_9fa48("2787") ? false : stryMutAct_9fa48("2786") ? true : (stryCov_9fa48("2786", "2787", "2788", "2789"), hours < 24)) return stryMutAct_9fa48("2790") ? `` : (stryCov_9fa48("2790"), `${hours}h ago`);
    const days = Math.floor(stryMutAct_9fa48("2791") ? hours * 24 : (stryCov_9fa48("2791"), hours / 24));
    if (stryMutAct_9fa48("2795") ? days >= 7 : stryMutAct_9fa48("2794") ? days <= 7 : stryMutAct_9fa48("2793") ? false : stryMutAct_9fa48("2792") ? true : (stryCov_9fa48("2792", "2793", "2794", "2795"), days < 7)) return stryMutAct_9fa48("2796") ? `` : (stryCov_9fa48("2796"), `${days}d ago`);
    const weeks = Math.floor(stryMutAct_9fa48("2797") ? days * 7 : (stryCov_9fa48("2797"), days / 7));
    if (stryMutAct_9fa48("2801") ? weeks >= 5 : stryMutAct_9fa48("2800") ? weeks <= 5 : stryMutAct_9fa48("2799") ? false : stryMutAct_9fa48("2798") ? true : (stryCov_9fa48("2798", "2799", "2800", "2801"), weeks < 5)) return stryMutAct_9fa48("2802") ? `` : (stryCov_9fa48("2802"), `${weeks}w ago`);
    const months = Math.floor(stryMutAct_9fa48("2803") ? days * 30 : (stryCov_9fa48("2803"), days / 30));
    if (stryMutAct_9fa48("2807") ? months >= 12 : stryMutAct_9fa48("2806") ? months <= 12 : stryMutAct_9fa48("2805") ? false : stryMutAct_9fa48("2804") ? true : (stryCov_9fa48("2804", "2805", "2806", "2807"), months < 12)) return stryMutAct_9fa48("2808") ? `` : (stryCov_9fa48("2808"), `${months}mo ago`);
    const years = Math.floor(stryMutAct_9fa48("2809") ? days * 365 : (stryCov_9fa48("2809"), days / 365));
    return stryMutAct_9fa48("2810") ? `` : (stryCov_9fa48("2810"), `${years}y ago`);
  }
}