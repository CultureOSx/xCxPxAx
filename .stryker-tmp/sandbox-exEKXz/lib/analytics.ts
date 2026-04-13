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
import { PostHog } from 'posthog-react-native';
const posthogClient = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ? new PostHog(process.env.EXPO_PUBLIC_POSTHOG_API_KEY, stryMutAct_9fa48("0") ? {} : (stryCov_9fa48("0"), {
  host: stryMutAct_9fa48("3") ? process.env.EXPO_PUBLIC_POSTHOG_HOST && 'https://us.i.posthog.com' : stryMutAct_9fa48("2") ? false : stryMutAct_9fa48("1") ? true : (stryCov_9fa48("1", "2", "3"), process.env.EXPO_PUBLIC_POSTHOG_HOST || (stryMutAct_9fa48("4") ? "" : (stryCov_9fa48("4"), 'https://us.i.posthog.com'))),
  enableSessionReplay: stryMutAct_9fa48("5") ? false : (stryCov_9fa48("5"), true),
  sessionReplayConfig: stryMutAct_9fa48("6") ? {} : (stryCov_9fa48("6"), {
    maskAllTextInputs: stryMutAct_9fa48("7") ? false : (stryCov_9fa48("7"), true),
    maskAllImages: stryMutAct_9fa48("8") ? true : (stryCov_9fa48("8"), false),
    captureLog: stryMutAct_9fa48("9") ? false : (stryCov_9fa48("9"), true),
    captureNetworkTelemetry: stryMutAct_9fa48("10") ? false : (stryCov_9fa48("10"), true)
  })
})) : null;
export const captureEvent = (eventName: string, properties?: Record<string, any>) => {
  if (stryMutAct_9fa48("11")) {
    {}
  } else {
    stryCov_9fa48("11");
    if (stryMutAct_9fa48("13") ? false : stryMutAct_9fa48("12") ? true : (stryCov_9fa48("12", "13"), posthogClient)) {
      if (stryMutAct_9fa48("14")) {
        {}
      } else {
        stryCov_9fa48("14");
        posthogClient.capture(eventName, properties);
      }
    } else if (stryMutAct_9fa48("16") ? false : stryMutAct_9fa48("15") ? true : (stryCov_9fa48("15", "16"), __DEV__)) {
      if (stryMutAct_9fa48("17")) {
        {}
      } else {
        stryCov_9fa48("17");
        console.log(stryMutAct_9fa48("18") ? "" : (stryCov_9fa48("18"), '[Analytics Event]:'), eventName, properties);
      }
    }
  }
};

/** Stripe success page, free in-app checkout, or return from hosted checkout — same shape as `event_detail_viewed` profile fields. */
export function captureTicketPurchaseCompleted(payload: {
  ticket_id: string;
  event_id: string;
  publisher_profile_id?: string | null;
  venue_profile_id?: string | null;
  organizer_id?: string | null;
  quantity?: number;
  total_price_cents?: number | null;
  source: 'payment_success_screen' | 'free_ticket_in_app' | 'stripe_web_checkout_return' | 'checkout_free_ticket';
}) {
  if (stryMutAct_9fa48("19")) {
    {}
  } else {
    stryCov_9fa48("19");
    captureEvent(stryMutAct_9fa48("20") ? "" : (stryCov_9fa48("20"), 'ticket_purchase_completed'), stryMutAct_9fa48("21") ? {} : (stryCov_9fa48("21"), {
      ticket_id: payload.ticket_id,
      event_id: payload.event_id,
      publisher_profile_id: stryMutAct_9fa48("22") ? payload.publisher_profile_id && null : (stryCov_9fa48("22"), payload.publisher_profile_id ?? null),
      venue_profile_id: stryMutAct_9fa48("23") ? payload.venue_profile_id && null : (stryCov_9fa48("23"), payload.venue_profile_id ?? null),
      organizer_id: stryMutAct_9fa48("24") ? payload.organizer_id && null : (stryCov_9fa48("24"), payload.organizer_id ?? null),
      quantity: stryMutAct_9fa48("25") ? payload.quantity && 1 : (stryCov_9fa48("25"), payload.quantity ?? 1),
      total_price_cents: stryMutAct_9fa48("26") ? payload.total_price_cents && null : (stryCov_9fa48("26"), payload.total_price_cents ?? null),
      source: payload.source
    }));
  }
}
export const identifyUser = (distinctId: string, properties?: Record<string, any>) => {
  if (stryMutAct_9fa48("27")) {
    {}
  } else {
    stryCov_9fa48("27");
    if (stryMutAct_9fa48("29") ? false : stryMutAct_9fa48("28") ? true : (stryCov_9fa48("28", "29"), posthogClient)) {
      if (stryMutAct_9fa48("30")) {
        {}
      } else {
        stryCov_9fa48("30");
        posthogClient.identify(distinctId, properties);
      }
    } else if (stryMutAct_9fa48("32") ? false : stryMutAct_9fa48("31") ? true : (stryCov_9fa48("31", "32"), __DEV__)) {
      if (stryMutAct_9fa48("33")) {
        {}
      } else {
        stryCov_9fa48("33");
        console.log(stryMutAct_9fa48("34") ? "" : (stryCov_9fa48("34"), '[Analytics Identify]:'), distinctId, properties);
      }
    }
  }
};
export const resetUser = () => {
  if (stryMutAct_9fa48("35")) {
    {}
  } else {
    stryCov_9fa48("35");
    if (stryMutAct_9fa48("37") ? false : stryMutAct_9fa48("36") ? true : (stryCov_9fa48("36", "37"), posthogClient)) {
      if (stryMutAct_9fa48("38")) {
        {}
      } else {
        stryCov_9fa48("38");
        posthogClient.reset();
      }
    }
  }
};
export default posthogClient;