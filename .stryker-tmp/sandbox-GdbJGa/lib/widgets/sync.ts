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
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { CultureWidgetSnapshotPayload } from './sync.types';
function formatEventDate(date?: string, time?: string): string {
  if (stryMutAct_9fa48("5167")) {
    {}
  } else {
    stryCov_9fa48("5167");
    if (stryMutAct_9fa48("5170") ? false : stryMutAct_9fa48("5169") ? true : stryMutAct_9fa48("5168") ? date : (stryCov_9fa48("5168", "5169", "5170"), !date)) return stryMutAct_9fa48("5171") ? "" : (stryCov_9fa48("5171"), 'Date TBA');
    const parsed = new Date(stryMutAct_9fa48("5172") ? `` : (stryCov_9fa48("5172"), `${date}T${(stryMutAct_9fa48("5174") ? time.trim().length : stryMutAct_9fa48("5173") ? time.length : (stryCov_9fa48("5173", "5174"), time?.trim().length)) ? stryMutAct_9fa48("5175") ? time : (stryCov_9fa48("5175"), time.trim()) : stryMutAct_9fa48("5176") ? "" : (stryCov_9fa48("5176"), '00:00')}:00`));
    if (stryMutAct_9fa48("5178") ? false : stryMutAct_9fa48("5177") ? true : (stryCov_9fa48("5177", "5178"), Number.isNaN(parsed.getTime()))) return date;
    return parsed.toLocaleString(stryMutAct_9fa48("5179") ? "" : (stryCov_9fa48("5179"), 'en-AU'), stryMutAct_9fa48("5180") ? {} : (stryCov_9fa48("5180"), {
      day: stryMutAct_9fa48("5181") ? "" : (stryCov_9fa48("5181"), 'numeric'),
      month: stryMutAct_9fa48("5182") ? "" : (stryCov_9fa48("5182"), 'short'),
      hour: stryMutAct_9fa48("5183") ? "" : (stryCov_9fa48("5183"), 'numeric'),
      minute: stryMutAct_9fa48("5184") ? "" : (stryCov_9fa48("5184"), '2-digit')
    }));
  }
}
export function syncCultureWidgetSnapshots(payload: CultureWidgetSnapshotPayload): void {
  if (stryMutAct_9fa48("5185")) {
    {}
  } else {
    stryCov_9fa48("5185");
    if (stryMutAct_9fa48("5188") ? Platform.OS !== 'web' : stryMutAct_9fa48("5187") ? false : stryMutAct_9fa48("5186") ? true : (stryCov_9fa48("5186", "5187", "5188"), Platform.OS === (stryMutAct_9fa48("5189") ? "" : (stryCov_9fa48("5189"), 'web')))) return;
    if (stryMutAct_9fa48("5192") ? Constants.executionEnvironment !== 'storeClient' : stryMutAct_9fa48("5191") ? false : stryMutAct_9fa48("5190") ? true : (stryCov_9fa48("5190", "5191", "5192"), Constants.executionEnvironment === (stryMutAct_9fa48("5193") ? "" : (stryCov_9fa48("5193"), 'storeClient')))) return;
    let widgets: typeof import('@/widgets');
    try {
      if (stryMutAct_9fa48("5194")) {
        {}
      } else {
        stryCov_9fa48("5194");
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        widgets = require('@/widgets') as typeof import('@/widgets');
      }
    } catch (error) {
      if (stryMutAct_9fa48("5195")) {
        {}
      } else {
        stryCov_9fa48("5195");
        // Expo Go and environments without ExpoUI should gracefully skip widget sync.
        if (stryMutAct_9fa48("5197") ? false : stryMutAct_9fa48("5196") ? true : (stryCov_9fa48("5196", "5197"), __DEV__)) {
          if (stryMutAct_9fa48("5198")) {
            {}
          } else {
            stryCov_9fa48("5198");
            console.warn(stryMutAct_9fa48("5199") ? "" : (stryCov_9fa48("5199"), '[widgets] Snapshot sync skipped; widget module unavailable:'), error);
          }
        }
        return;
      }
    }
    const spotlightTitle = stryMutAct_9fa48("5200") ? payload.spotlight?.title && 'CulturePass Spotlight' : (stryCov_9fa48("5200"), (stryMutAct_9fa48("5201") ? payload.spotlight.title : (stryCov_9fa48("5201"), payload.spotlight?.title)) ?? (stryMutAct_9fa48("5202") ? "" : (stryCov_9fa48("5202"), 'CulturePass Spotlight')));
    widgets.CultureSpotlightWidget.updateSnapshot(stryMutAct_9fa48("5203") ? {} : (stryCov_9fa48("5203"), {
      title: spotlightTitle,
      subtitle: stryMutAct_9fa48("5204") ? payload.spotlight?.description && 'Featured cultural event' : (stryCov_9fa48("5204"), (stryMutAct_9fa48("5205") ? payload.spotlight.description : (stryCov_9fa48("5205"), payload.spotlight?.description)) ?? (stryMutAct_9fa48("5206") ? "" : (stryCov_9fa48("5206"), 'Featured cultural event'))),
      city: stryMutAct_9fa48("5207") ? payload.spotlight?.city && payload.city : (stryCov_9fa48("5207"), (stryMutAct_9fa48("5208") ? payload.spotlight.city : (stryCov_9fa48("5208"), payload.spotlight?.city)) ?? payload.city),
      startsAt: payload.nearby[0] ? formatEventDate(payload.nearby[0].date, payload.nearby[0].time) : undefined
    }));
    widgets.CultureNearYouWidget.updateSnapshot(stryMutAct_9fa48("5209") ? {} : (stryCov_9fa48("5209"), {
      locationLabel: stryMutAct_9fa48("5212") ? [payload.city, payload.country].filter(Boolean).join(', ') && 'Your area' : stryMutAct_9fa48("5211") ? false : stryMutAct_9fa48("5210") ? true : (stryCov_9fa48("5210", "5211", "5212"), (stryMutAct_9fa48("5213") ? [payload.city, payload.country].join(', ') : (stryCov_9fa48("5213"), (stryMutAct_9fa48("5214") ? [] : (stryCov_9fa48("5214"), [payload.city, payload.country])).filter(Boolean).join(stryMutAct_9fa48("5215") ? "" : (stryCov_9fa48("5215"), ', ')))) || (stryMutAct_9fa48("5216") ? "" : (stryCov_9fa48("5216"), 'Your area'))),
      events: stryMutAct_9fa48("5217") ? payload.nearby.map(event => ({
        id: event.id,
        title: event.title,
        startsAt: formatEventDate(event.date, event.time)
      })) : (stryCov_9fa48("5217"), payload.nearby.slice(0, 3).map(stryMutAct_9fa48("5218") ? () => undefined : (stryCov_9fa48("5218"), event => stryMutAct_9fa48("5219") ? {} : (stryCov_9fa48("5219"), {
        id: event.id,
        title: event.title,
        startsAt: formatEventDate(event.date, event.time)
      }))))
    }));
    widgets.CultureIdentityQRWidget.updateSnapshot(stryMutAct_9fa48("5220") ? {} : (stryCov_9fa48("5220"), {
      displayName: stryMutAct_9fa48("5221") ? payload.displayName && 'CulturePass Member' : (stryCov_9fa48("5221"), payload.displayName ?? (stryMutAct_9fa48("5222") ? "" : (stryCov_9fa48("5222"), 'CulturePass Member'))),
      culturePassId: stryMutAct_9fa48("5223") ? (payload.culturePassId ?? payload.upcomingTicket?.ticket.cpTicketId ?? payload.upcomingTicket?.ticket.id) && 'CP-ID' : (stryCov_9fa48("5223"), (stryMutAct_9fa48("5224") ? (payload.culturePassId ?? payload.upcomingTicket?.ticket.cpTicketId) && payload.upcomingTicket?.ticket.id : (stryCov_9fa48("5224"), (stryMutAct_9fa48("5225") ? payload.culturePassId && payload.upcomingTicket?.ticket.cpTicketId : (stryCov_9fa48("5225"), payload.culturePassId ?? (stryMutAct_9fa48("5226") ? payload.upcomingTicket.ticket.cpTicketId : (stryCov_9fa48("5226"), payload.upcomingTicket?.ticket.cpTicketId)))) ?? (stryMutAct_9fa48("5227") ? payload.upcomingTicket.ticket.id : (stryCov_9fa48("5227"), payload.upcomingTicket?.ticket.id)))) ?? (stryMutAct_9fa48("5228") ? "" : (stryCov_9fa48("5228"), 'CP-ID')))
    }));
    if (stryMutAct_9fa48("5230") ? false : stryMutAct_9fa48("5229") ? true : (stryCov_9fa48("5229", "5230"), payload.upcomingTicket)) {
      if (stryMutAct_9fa48("5231")) {
        {}
      } else {
        stryCov_9fa48("5231");
        const {
          ticket,
          event: upcomingEvent,
          startsAt
        } = payload.upcomingTicket;
        const fallbackDateLabel = startsAt ? formatEventDate(startsAt.split(stryMutAct_9fa48("5232") ? "" : (stryCov_9fa48("5232"), 'T'))[0], stryMutAct_9fa48("5234") ? startsAt.split('T')[1].slice(0, 5) : stryMutAct_9fa48("5233") ? startsAt.split('T')[1] : (stryCov_9fa48("5233", "5234"), startsAt.split(stryMutAct_9fa48("5235") ? "" : (stryCov_9fa48("5235"), 'T'))[1]?.slice(0, 5))) : stryMutAct_9fa48("5236") ? "" : (stryCov_9fa48("5236"), 'Date TBA');
        widgets.CultureUpcomingTicketWidget.updateSnapshot(stryMutAct_9fa48("5237") ? {} : (stryCov_9fa48("5237"), {
          eventTitle: stryMutAct_9fa48("5238") ? (upcomingEvent?.title ?? ticket.eventTitle ?? ticket.eventName) && 'Upcoming event' : (stryCov_9fa48("5238"), (stryMutAct_9fa48("5239") ? (upcomingEvent?.title ?? ticket.eventTitle) && ticket.eventName : (stryCov_9fa48("5239"), (stryMutAct_9fa48("5240") ? upcomingEvent?.title && ticket.eventTitle : (stryCov_9fa48("5240"), (stryMutAct_9fa48("5241") ? upcomingEvent.title : (stryCov_9fa48("5241"), upcomingEvent?.title)) ?? ticket.eventTitle)) ?? ticket.eventName)) ?? (stryMutAct_9fa48("5242") ? "" : (stryCov_9fa48("5242"), 'Upcoming event'))),
          eventDate: stryMutAct_9fa48("5243") ? (upcomingEvent?.date ?? ticket.eventDate ?? ticket.date) && fallbackDateLabel : (stryCov_9fa48("5243"), (stryMutAct_9fa48("5244") ? (upcomingEvent?.date ?? ticket.eventDate) && ticket.date : (stryCov_9fa48("5244"), (stryMutAct_9fa48("5245") ? upcomingEvent?.date && ticket.eventDate : (stryCov_9fa48("5245"), (stryMutAct_9fa48("5246") ? upcomingEvent.date : (stryCov_9fa48("5246"), upcomingEvent?.date)) ?? ticket.eventDate)) ?? ticket.date)) ?? fallbackDateLabel),
          eventTime: stryMutAct_9fa48("5247") ? (upcomingEvent?.time ?? ticket.eventTime) && undefined : (stryCov_9fa48("5247"), (stryMutAct_9fa48("5248") ? upcomingEvent?.time && ticket.eventTime : (stryCov_9fa48("5248"), (stryMutAct_9fa48("5249") ? upcomingEvent.time : (stryCov_9fa48("5249"), upcomingEvent?.time)) ?? ticket.eventTime)) ?? undefined),
          venue: stryMutAct_9fa48("5250") ? (upcomingEvent?.venue ?? ticket.eventVenue) && 'Venue TBA' : (stryCov_9fa48("5250"), (stryMutAct_9fa48("5251") ? upcomingEvent?.venue && ticket.eventVenue : (stryCov_9fa48("5251"), (stryMutAct_9fa48("5252") ? upcomingEvent.venue : (stryCov_9fa48("5252"), upcomingEvent?.venue)) ?? ticket.eventVenue)) ?? (stryMutAct_9fa48("5253") ? "" : (stryCov_9fa48("5253"), 'Venue TBA'))),
          ticketCode: ticket.ticketCode,
          status: ticket.status
        }));
      }
    } else {
      if (stryMutAct_9fa48("5254")) {
        {}
      } else {
        stryCov_9fa48("5254");
        widgets.CultureUpcomingTicketWidget.updateSnapshot(stryMutAct_9fa48("5255") ? {} : (stryCov_9fa48("5255"), {
          eventTitle: stryMutAct_9fa48("5256") ? "Stryker was here!" : (stryCov_9fa48("5256"), ''),
          eventDate: stryMutAct_9fa48("5257") ? "Stryker was here!" : (stryCov_9fa48("5257"), ''),
          eventTime: undefined,
          venue: undefined,
          ticketCode: undefined,
          status: stryMutAct_9fa48("5258") ? "" : (stryCov_9fa48("5258"), 'empty')
        }));
      }
    }
  }
}