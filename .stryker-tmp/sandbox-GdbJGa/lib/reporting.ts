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
import { Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { api } from '@/lib/api';
export function logError(error: unknown, context?: Record<string, any>) {
  if (stryMutAct_9fa48("4492")) {
    {}
  } else {
    stryCov_9fa48("4492");
    if (stryMutAct_9fa48("4494") ? false : stryMutAct_9fa48("4493") ? true : (stryCov_9fa48("4493", "4494"), __DEV__)) {
      if (stryMutAct_9fa48("4495")) {
        {}
      } else {
        stryCov_9fa48("4495");
        console.warn(stryMutAct_9fa48("4496") ? "" : (stryCov_9fa48("4496"), '[logError]'), stryMutAct_9fa48("4497") ? context?.context && 'unknown' : (stryCov_9fa48("4497"), (stryMutAct_9fa48("4498") ? context.context : (stryCov_9fa48("4498"), context?.context)) ?? (stryMutAct_9fa48("4499") ? "" : (stryCov_9fa48("4499"), 'unknown'))), error);
      }
    }
  }
}

/**
 * CulturePassAU Sydney Report System v2.0
 * Sydney safety + Kerala community moderation
 */

export type ReportTarget = 'event' | 'community' | 'profile' | 'post' | 'user' | 'business' | 'venue' | 'comment';
export interface ReportReason {
  id: string;
  label: string;
  description: string;
}
export const ReportReasons: Record<ReportTarget, ReportReason[]> = stryMutAct_9fa48("4500") ? {} : (stryCov_9fa48("4500"), {
  event: stryMutAct_9fa48("4501") ? [] : (stryCov_9fa48("4501"), [stryMutAct_9fa48("4502") ? {} : (stryCov_9fa48("4502"), {
    id: stryMutAct_9fa48("4503") ? "" : (stryCov_9fa48("4503"), 'spam'),
    label: stryMutAct_9fa48("4504") ? "" : (stryCov_9fa48("4504"), 'Spam or irrelevant'),
    description: stryMutAct_9fa48("4505") ? "" : (stryCov_9fa48("4505"), 'Event seems automated or off-topic')
  }), stryMutAct_9fa48("4506") ? {} : (stryCov_9fa48("4506"), {
    id: stryMutAct_9fa48("4507") ? "" : (stryCov_9fa48("4507"), 'inappropriate'),
    label: stryMutAct_9fa48("4508") ? "" : (stryCov_9fa48("4508"), 'Inappropriate content'),
    description: stryMutAct_9fa48("4509") ? "" : (stryCov_9fa48("4509"), 'Hate speech, violence, or explicit material')
  }), stryMutAct_9fa48("4510") ? {} : (stryCov_9fa48("4510"), {
    id: stryMutAct_9fa48("4511") ? "" : (stryCov_9fa48("4511"), 'fake'),
    label: stryMutAct_9fa48("4512") ? "" : (stryCov_9fa48("4512"), 'Fake/scam event'),
    description: stryMutAct_9fa48("4513") ? "" : (stryCov_9fa48("4513"), "Doesn't seem like a real event")
  }), stryMutAct_9fa48("4514") ? {} : (stryCov_9fa48("4514"), {
    id: stryMutAct_9fa48("4515") ? "" : (stryCov_9fa48("4515"), 'other'),
    label: stryMutAct_9fa48("4516") ? "" : (stryCov_9fa48("4516"), 'Other reason'),
    description: stryMutAct_9fa48("4517") ? "" : (stryCov_9fa48("4517"), 'Something else')
  })]),
  community: stryMutAct_9fa48("4518") ? [] : (stryCov_9fa48("4518"), [stryMutAct_9fa48("4519") ? {} : (stryCov_9fa48("4519"), {
    id: stryMutAct_9fa48("4520") ? "" : (stryCov_9fa48("4520"), 'spam'),
    label: stryMutAct_9fa48("4521") ? "" : (stryCov_9fa48("4521"), 'Spam community'),
    description: stryMutAct_9fa48("4522") ? "" : (stryCov_9fa48("4522"), 'Automated or irrelevant posts')
  }), stryMutAct_9fa48("4523") ? {} : (stryCov_9fa48("4523"), {
    id: stryMutAct_9fa48("4524") ? "" : (stryCov_9fa48("4524"), 'hate'),
    label: stryMutAct_9fa48("4525") ? "" : (stryCov_9fa48("4525"), 'Promotes hate'),
    description: stryMutAct_9fa48("4526") ? "" : (stryCov_9fa48("4526"), 'Discrimination or harmful content')
  }), stryMutAct_9fa48("4527") ? {} : (stryCov_9fa48("4527"), {
    id: stryMutAct_9fa48("4528") ? "" : (stryCov_9fa48("4528"), 'fake'),
    label: stryMutAct_9fa48("4529") ? "" : (stryCov_9fa48("4529"), 'Fake community'),
    description: stryMutAct_9fa48("4530") ? "" : (stryCov_9fa48("4530"), "Doesn't represent real group")
  }), stryMutAct_9fa48("4531") ? {} : (stryCov_9fa48("4531"), {
    id: stryMutAct_9fa48("4532") ? "" : (stryCov_9fa48("4532"), 'other'),
    label: stryMutAct_9fa48("4533") ? "" : (stryCov_9fa48("4533"), 'Other'),
    description: stryMutAct_9fa48("4534") ? "Stryker was here!" : (stryCov_9fa48("4534"), '')
  })]),
  profile: stryMutAct_9fa48("4535") ? [] : (stryCov_9fa48("4535"), [stryMutAct_9fa48("4536") ? {} : (stryCov_9fa48("4536"), {
    id: stryMutAct_9fa48("4537") ? "" : (stryCov_9fa48("4537"), 'spam'),
    label: stryMutAct_9fa48("4538") ? "" : (stryCov_9fa48("4538"), 'Spam profile'),
    description: stryMutAct_9fa48("4539") ? "" : (stryCov_9fa48("4539"), 'Suspicious activity')
  }), stryMutAct_9fa48("4540") ? {} : (stryCov_9fa48("4540"), {
    id: stryMutAct_9fa48("4541") ? "" : (stryCov_9fa48("4541"), 'fake'),
    label: stryMutAct_9fa48("4542") ? "" : (stryCov_9fa48("4542"), 'Fake profile'),
    description: stryMutAct_9fa48("4543") ? "" : (stryCov_9fa48("4543"), 'Impersonation or bot')
  }), stryMutAct_9fa48("4544") ? {} : (stryCov_9fa48("4544"), {
    id: stryMutAct_9fa48("4545") ? "" : (stryCov_9fa48("4545"), 'harassment'),
    label: stryMutAct_9fa48("4546") ? "" : (stryCov_9fa48("4546"), 'Harassment'),
    description: stryMutAct_9fa48("4547") ? "" : (stryCov_9fa48("4547"), 'Abusive behavior')
  }), stryMutAct_9fa48("4548") ? {} : (stryCov_9fa48("4548"), {
    id: stryMutAct_9fa48("4549") ? "" : (stryCov_9fa48("4549"), 'other'),
    label: stryMutAct_9fa48("4550") ? "" : (stryCov_9fa48("4550"), 'Other'),
    description: stryMutAct_9fa48("4551") ? "Stryker was here!" : (stryCov_9fa48("4551"), '')
  })]),
  post: stryMutAct_9fa48("4552") ? [] : (stryCov_9fa48("4552"), [stryMutAct_9fa48("4553") ? {} : (stryCov_9fa48("4553"), {
    id: stryMutAct_9fa48("4554") ? "" : (stryCov_9fa48("4554"), 'spam'),
    label: stryMutAct_9fa48("4555") ? "" : (stryCov_9fa48("4555"), 'Spam post'),
    description: stryMutAct_9fa48("4556") ? "" : (stryCov_9fa48("4556"), 'Automated content')
  }), stryMutAct_9fa48("4557") ? {} : (stryCov_9fa48("4557"), {
    id: stryMutAct_9fa48("4558") ? "" : (stryCov_9fa48("4558"), 'offensive'),
    label: stryMutAct_9fa48("4559") ? "" : (stryCov_9fa48("4559"), 'Offensive'),
    description: stryMutAct_9fa48("4560") ? "" : (stryCov_9fa48("4560"), 'Hate speech or abuse')
  }), stryMutAct_9fa48("4561") ? {} : (stryCov_9fa48("4561"), {
    id: stryMutAct_9fa48("4562") ? "" : (stryCov_9fa48("4562"), 'misinfo'),
    label: stryMutAct_9fa48("4563") ? "" : (stryCov_9fa48("4563"), 'Misinformation'),
    description: stryMutAct_9fa48("4564") ? "" : (stryCov_9fa48("4564"), 'False event details')
  }), stryMutAct_9fa48("4565") ? {} : (stryCov_9fa48("4565"), {
    id: stryMutAct_9fa48("4566") ? "" : (stryCov_9fa48("4566"), 'other'),
    label: stryMutAct_9fa48("4567") ? "" : (stryCov_9fa48("4567"), 'Other'),
    description: stryMutAct_9fa48("4568") ? "Stryker was here!" : (stryCov_9fa48("4568"), '')
  })]),
  user: stryMutAct_9fa48("4569") ? [] : (stryCov_9fa48("4569"), [stryMutAct_9fa48("4570") ? {} : (stryCov_9fa48("4570"), {
    id: stryMutAct_9fa48("4571") ? "" : (stryCov_9fa48("4571"), 'spam'),
    label: stryMutAct_9fa48("4572") ? "" : (stryCov_9fa48("4572"), 'Spam user'),
    description: stryMutAct_9fa48("4573") ? "" : (stryCov_9fa48("4573"), 'Suspicious messages')
  }), stryMutAct_9fa48("4574") ? {} : (stryCov_9fa48("4574"), {
    id: stryMutAct_9fa48("4575") ? "" : (stryCov_9fa48("4575"), 'harassment'),
    label: stryMutAct_9fa48("4576") ? "" : (stryCov_9fa48("4576"), 'Harassment'),
    description: stryMutAct_9fa48("4577") ? "" : (stryCov_9fa48("4577"), 'Repeated abuse')
  }), stryMutAct_9fa48("4578") ? {} : (stryCov_9fa48("4578"), {
    id: stryMutAct_9fa48("4579") ? "" : (stryCov_9fa48("4579"), 'fake'),
    label: stryMutAct_9fa48("4580") ? "" : (stryCov_9fa48("4580"), 'Fake account'),
    description: stryMutAct_9fa48("4581") ? "" : (stryCov_9fa48("4581"), 'Impersonation')
  }), stryMutAct_9fa48("4582") ? {} : (stryCov_9fa48("4582"), {
    id: stryMutAct_9fa48("4583") ? "" : (stryCov_9fa48("4583"), 'other'),
    label: stryMutAct_9fa48("4584") ? "" : (stryCov_9fa48("4584"), 'Other'),
    description: stryMutAct_9fa48("4585") ? "Stryker was here!" : (stryCov_9fa48("4585"), '')
  })]),
  business: stryMutAct_9fa48("4586") ? [] : (stryCov_9fa48("4586"), [stryMutAct_9fa48("4587") ? {} : (stryCov_9fa48("4587"), {
    id: stryMutAct_9fa48("4588") ? "" : (stryCov_9fa48("4588"), 'fake'),
    label: stryMutAct_9fa48("4589") ? "" : (stryCov_9fa48("4589"), 'Fake business'),
    description: stryMutAct_9fa48("4590") ? "" : (stryCov_9fa48("4590"), "Doesn't exist")
  }), stryMutAct_9fa48("4591") ? {} : (stryCov_9fa48("4591"), {
    id: stryMutAct_9fa48("4592") ? "" : (stryCov_9fa48("4592"), 'scam'),
    label: stryMutAct_9fa48("4593") ? "" : (stryCov_9fa48("4593"), 'Scam listing'),
    description: stryMutAct_9fa48("4594") ? "" : (stryCov_9fa48("4594"), 'Suspicious pricing/offers')
  }), stryMutAct_9fa48("4595") ? {} : (stryCov_9fa48("4595"), {
    id: stryMutAct_9fa48("4596") ? "" : (stryCov_9fa48("4596"), 'inaccurate'),
    label: stryMutAct_9fa48("4597") ? "" : (stryCov_9fa48("4597"), 'Outdated info'),
    description: stryMutAct_9fa48("4598") ? "" : (stryCov_9fa48("4598"), 'Wrong address/hours')
  }), stryMutAct_9fa48("4599") ? {} : (stryCov_9fa48("4599"), {
    id: stryMutAct_9fa48("4600") ? "" : (stryCov_9fa48("4600"), 'other'),
    label: stryMutAct_9fa48("4601") ? "" : (stryCov_9fa48("4601"), 'Other'),
    description: stryMutAct_9fa48("4602") ? "Stryker was here!" : (stryCov_9fa48("4602"), '')
  })]),
  venue: stryMutAct_9fa48("4603") ? [] : (stryCov_9fa48("4603"), [stryMutAct_9fa48("4604") ? {} : (stryCov_9fa48("4604"), {
    id: stryMutAct_9fa48("4605") ? "" : (stryCov_9fa48("4605"), 'closed'),
    label: stryMutAct_9fa48("4606") ? "" : (stryCov_9fa48("4606"), 'Venue closed'),
    description: stryMutAct_9fa48("4607") ? "" : (stryCov_9fa48("4607"), 'No longer operating')
  }), stryMutAct_9fa48("4608") ? {} : (stryCov_9fa48("4608"), {
    id: stryMutAct_9fa48("4609") ? "" : (stryCov_9fa48("4609"), 'wrong-info'),
    label: stryMutAct_9fa48("4610") ? "" : (stryCov_9fa48("4610"), 'Wrong details'),
    description: stryMutAct_9fa48("4611") ? "" : (stryCov_9fa48("4611"), 'Incorrect address/phone')
  }), stryMutAct_9fa48("4612") ? {} : (stryCov_9fa48("4612"), {
    id: stryMutAct_9fa48("4613") ? "" : (stryCov_9fa48("4613"), 'other'),
    label: stryMutAct_9fa48("4614") ? "" : (stryCov_9fa48("4614"), 'Other'),
    description: stryMutAct_9fa48("4615") ? "Stryker was here!" : (stryCov_9fa48("4615"), '')
  })]),
  comment: stryMutAct_9fa48("4616") ? [] : (stryCov_9fa48("4616"), [stryMutAct_9fa48("4617") ? {} : (stryCov_9fa48("4617"), {
    id: stryMutAct_9fa48("4618") ? "" : (stryCov_9fa48("4618"), 'spam'),
    label: stryMutAct_9fa48("4619") ? "" : (stryCov_9fa48("4619"), 'Spam comment'),
    description: stryMutAct_9fa48("4620") ? "" : (stryCov_9fa48("4620"), 'Automated/irrelevant')
  }), stryMutAct_9fa48("4621") ? {} : (stryCov_9fa48("4621"), {
    id: stryMutAct_9fa48("4622") ? "" : (stryCov_9fa48("4622"), 'abuse'),
    label: stryMutAct_9fa48("4623") ? "" : (stryCov_9fa48("4623"), 'Abusive comment'),
    description: stryMutAct_9fa48("4624") ? "" : (stryCov_9fa48("4624"), 'Personal attacks')
  }), stryMutAct_9fa48("4625") ? {} : (stryCov_9fa48("4625"), {
    id: stryMutAct_9fa48("4626") ? "" : (stryCov_9fa48("4626"), 'off-topic'),
    label: stryMutAct_9fa48("4627") ? "" : (stryCov_9fa48("4627"), 'Off-topic'),
    description: stryMutAct_9fa48("4628") ? "" : (stryCov_9fa48("4628"), 'Doesn\'t relate to event')
  }), stryMutAct_9fa48("4629") ? {} : (stryCov_9fa48("4629"), {
    id: stryMutAct_9fa48("4630") ? "" : (stryCov_9fa48("4630"), 'other'),
    label: stryMutAct_9fa48("4631") ? "" : (stryCov_9fa48("4631"), 'Other'),
    description: stryMutAct_9fa48("4632") ? "Stryker was here!" : (stryCov_9fa48("4632"), '')
  })])
});
interface ReportPayload {
  targetType: ReportTarget;
  targetId: string;
  reason: string;
  details?: string;
  userAgent?: string;
}
export async function submitReport(payload: ReportPayload): Promise<{
  id: string;
}> {
  if (stryMutAct_9fa48("4633")) {
    {}
  } else {
    stryCov_9fa48("4633");
    return api.reports.submit(payload);
  }
}
export async function submitSydneyReport(targetType: ReportTarget, targetId: string, reason: string, details = stryMutAct_9fa48("4634") ? "Stryker was here!" : (stryCov_9fa48("4634"), '')): Promise<{
  id: string;
  status: 'submitted' | 'duplicate' | 'escalated';
}> {
  if (stryMutAct_9fa48("4635")) {
    {}
  } else {
    stryCov_9fa48("4635");
    if (stryMutAct_9fa48("4638") ? Platform.OS === 'web' : stryMutAct_9fa48("4637") ? false : stryMutAct_9fa48("4636") ? true : (stryCov_9fa48("4636", "4637", "4638"), Platform.OS !== (stryMutAct_9fa48("4639") ? "" : (stryCov_9fa48("4639"), 'web')))) {
      if (stryMutAct_9fa48("4640")) {
        {}
      } else {
        stryCov_9fa48("4640");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
    try {
      if (stryMutAct_9fa48("4641")) {
        {}
      } else {
        stryCov_9fa48("4641");
        const payload: ReportPayload = stryMutAct_9fa48("4642") ? {} : (stryCov_9fa48("4642"), {
          targetType,
          targetId,
          reason,
          details,
          userAgent: (stryMutAct_9fa48("4645") ? Platform.OS !== 'web' : stryMutAct_9fa48("4644") ? false : stryMutAct_9fa48("4643") ? true : (stryCov_9fa48("4643", "4644", "4645"), Platform.OS === (stryMutAct_9fa48("4646") ? "" : (stryCov_9fa48("4646"), 'web')))) ? navigator.userAgent : stryMutAct_9fa48("4647") ? "" : (stryCov_9fa48("4647"), 'SydneyApp')
        });
        const result = await submitReport(payload);
        return stryMutAct_9fa48("4648") ? {} : (stryCov_9fa48("4648"), {
          id: result.id,
          status: stryMutAct_9fa48("4649") ? "" : (stryCov_9fa48("4649"), 'submitted')
        });
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("4650")) {
        {}
      } else {
        stryCov_9fa48("4650");
        if (stryMutAct_9fa48("4653") ? error.status !== 409 : stryMutAct_9fa48("4652") ? false : stryMutAct_9fa48("4651") ? true : (stryCov_9fa48("4651", "4652", "4653"), error.status === 409)) {
          if (stryMutAct_9fa48("4654")) {
            {}
          } else {
            stryCov_9fa48("4654");
            return stryMutAct_9fa48("4655") ? {} : (stryCov_9fa48("4655"), {
              id: stryMutAct_9fa48("4656") ? "" : (stryCov_9fa48("4656"), 'duplicate'),
              status: stryMutAct_9fa48("4657") ? "" : (stryCov_9fa48("4657"), 'duplicate')
            });
          }
        }
        if (stryMutAct_9fa48("4660") ? error.status !== 503 : stryMutAct_9fa48("4659") ? false : stryMutAct_9fa48("4658") ? true : (stryCov_9fa48("4658", "4659", "4660"), error.status === 503)) {
          if (stryMutAct_9fa48("4661")) {
            {}
          } else {
            stryCov_9fa48("4661");
            return stryMutAct_9fa48("4662") ? {} : (stryCov_9fa48("4662"), {
              id: stryMutAct_9fa48("4663") ? "" : (stryCov_9fa48("4663"), 'escalated'),
              status: stryMutAct_9fa48("4664") ? "" : (stryCov_9fa48("4664"), 'escalated')
            });
          }
        }
        logError(error, stryMutAct_9fa48("4665") ? {} : (stryCov_9fa48("4665"), {
          context: stryMutAct_9fa48("4666") ? "" : (stryCov_9fa48("4666"), 'submitSydneyReport'),
          targetType,
          targetId,
          reason
        }));
        throw error;
      }
    }
  }
}

/**
 * Sydney confirmation dialog
 * Multi-step w/ haptic feedback
 */
export function confirmAndReport(options: {
  targetType: ReportTarget;
  targetId: string;
  reason?: string;
  details?: string;
  title?: string;
  message?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  destructive?: boolean;
}) {
  if (stryMutAct_9fa48("4667")) {
    {}
  } else {
    stryCov_9fa48("4667");
    const {
      targetType,
      targetId,
      reason = ReportReasons[targetType][0].id,
      details,
      title = stryMutAct_9fa48("4668") ? "" : (stryCov_9fa48("4668"), 'Report Content'),
      message = stryMutAct_9fa48("4669") ? `` : (stryCov_9fa48("4669"), `Are you sure you want to report ${targetId}?`),
      cancelLabel = stryMutAct_9fa48("4670") ? "" : (stryCov_9fa48("4670"), 'Cancel'),
      confirmLabel = stryMutAct_9fa48("4671") ? "" : (stryCov_9fa48("4671"), 'Report'),
      destructive = stryMutAct_9fa48("4672") ? false : (stryCov_9fa48("4672"), true)
    } = options;
    Alert.alert(title, message, stryMutAct_9fa48("4673") ? [] : (stryCov_9fa48("4673"), [stryMutAct_9fa48("4674") ? {} : (stryCov_9fa48("4674"), {
      text: cancelLabel,
      style: stryMutAct_9fa48("4675") ? "" : (stryCov_9fa48("4675"), 'cancel')
    }), stryMutAct_9fa48("4676") ? {} : (stryCov_9fa48("4676"), {
      text: confirmLabel,
      style: destructive ? stryMutAct_9fa48("4677") ? "" : (stryCov_9fa48("4677"), 'destructive') : stryMutAct_9fa48("4678") ? "" : (stryCov_9fa48("4678"), 'default'),
      onPress: async () => {
        if (stryMutAct_9fa48("4679")) {
          {}
        } else {
          stryCov_9fa48("4679");
          try {
            if (stryMutAct_9fa48("4680")) {
              {}
            } else {
              stryCov_9fa48("4680");
              const result = await submitSydneyReport(targetType, targetId, reason, details);
              let message = stryMutAct_9fa48("4681") ? "" : (stryCov_9fa48("4681"), 'Thank you! Report submitted.');
              if (stryMutAct_9fa48("4684") ? result.status !== 'duplicate' : stryMutAct_9fa48("4683") ? false : stryMutAct_9fa48("4682") ? true : (stryCov_9fa48("4682", "4683", "4684"), result.status === (stryMutAct_9fa48("4685") ? "" : (stryCov_9fa48("4685"), 'duplicate')))) {
                if (stryMutAct_9fa48("4686")) {
                  {}
                } else {
                  stryCov_9fa48("4686");
                  message = stryMutAct_9fa48("4687") ? "" : (stryCov_9fa48("4687"), 'This has already been reported.');
                }
              } else if (stryMutAct_9fa48("4690") ? result.status !== 'escalated' : stryMutAct_9fa48("4689") ? false : stryMutAct_9fa48("4688") ? true : (stryCov_9fa48("4688", "4689", "4690"), result.status === (stryMutAct_9fa48("4691") ? "" : (stryCov_9fa48("4691"), 'escalated')))) {
                if (stryMutAct_9fa48("4692")) {
                  {}
                } else {
                  stryCov_9fa48("4692");
                  message = stryMutAct_9fa48("4693") ? "" : (stryCov_9fa48("4693"), 'Flagged for priority review.');
                }
              }
              Alert.alert(stryMutAct_9fa48("4694") ? "" : (stryCov_9fa48("4694"), 'Report Status'), message);
            }
          } catch (error) {
            if (stryMutAct_9fa48("4695")) {
              {}
            } else {
              stryCov_9fa48("4695");
              logError(error, stryMutAct_9fa48("4696") ? {} : (stryCov_9fa48("4696"), {
                context: stryMutAct_9fa48("4697") ? "" : (stryCov_9fa48("4697"), 'confirmAndReport.alert_on_error'),
                targetId
              }));
              Alert.alert(stryMutAct_9fa48("4698") ? "" : (stryCov_9fa48("4698"), 'Report Failed'), stryMutAct_9fa48("4699") ? "" : (stryCov_9fa48("4699"), 'Unable to submit right now. Please try again.'), stryMutAct_9fa48("4700") ? [] : (stryCov_9fa48("4700"), [stryMutAct_9fa48("4701") ? {} : (stryCov_9fa48("4701"), {
                text: stryMutAct_9fa48("4702") ? "" : (stryCov_9fa48("4702"), 'OK')
              })]));
            }
          }
        }
      }
    })]), stryMutAct_9fa48("4703") ? {} : (stryCov_9fa48("4703"), {
      cancelable: stryMutAct_9fa48("4704") ? false : (stryCov_9fa48("4704"), true)
    }));
  }
}

/**
 * Quick report (Sydney power users)
 * Single-tap w/ preset reason
 */
export function quickReport(targetType: ReportTarget, targetId: string, reasonId: string, details?: string) {
  if (stryMutAct_9fa48("4705")) {
    {}
  } else {
    stryCov_9fa48("4705");
    submitSydneyReport(targetType, targetId, reasonId, details).then(() => {
      if (stryMutAct_9fa48("4706")) {
        {}
      } else {
        stryCov_9fa48("4706");
        if (stryMutAct_9fa48("4709") ? Platform.OS === 'web' : stryMutAct_9fa48("4708") ? false : stryMutAct_9fa48("4707") ? true : (stryCov_9fa48("4707", "4708", "4709"), Platform.OS !== (stryMutAct_9fa48("4710") ? "" : (stryCov_9fa48("4710"), 'web')))) {
          if (stryMutAct_9fa48("4711")) {
            {}
          } else {
            stryCov_9fa48("4711");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
        Alert.alert(stryMutAct_9fa48("4712") ? "" : (stryCov_9fa48("4712"), 'Reported'), stryMutAct_9fa48("4713") ? "" : (stryCov_9fa48("4713"), 'Thank you for keeping our community safe.'));
      }
    }).catch(error => {
      if (stryMutAct_9fa48("4714")) {
        {}
      } else {
        stryCov_9fa48("4714");
        logError(error, stryMutAct_9fa48("4715") ? {} : (stryCov_9fa48("4715"), {
          context: stryMutAct_9fa48("4716") ? "" : (stryCov_9fa48("4716"), 'quickReport'),
          targetId,
          reasonId
        }));
        Alert.alert(stryMutAct_9fa48("4717") ? "" : (stryCov_9fa48("4717"), 'Error'), stryMutAct_9fa48("4718") ? "" : (stryCov_9fa48("4718"), 'Failed to report. Please try again.'));
      }
    });
  }
}

// Sydney moderation presets
export const SydneyReportPresets = stryMutAct_9fa48("4719") ? {} : (stryCov_9fa48("4719"), {
  spamEvent: stryMutAct_9fa48("4720") ? () => undefined : (stryCov_9fa48("4720"), (eventId: string) => quickReport(stryMutAct_9fa48("4721") ? "" : (stryCov_9fa48("4721"), 'event'), eventId, stryMutAct_9fa48("4722") ? "" : (stryCov_9fa48("4722"), 'spam'), stryMutAct_9fa48("4723") ? "" : (stryCov_9fa48("4723"), 'Automated or irrelevant event'))),
  fakeProfile: stryMutAct_9fa48("4724") ? () => undefined : (stryCov_9fa48("4724"), (userId: string) => quickReport(stryMutAct_9fa48("4725") ? "" : (stryCov_9fa48("4725"), 'profile'), userId, stryMutAct_9fa48("4726") ? "" : (stryCov_9fa48("4726"), 'fake'), stryMutAct_9fa48("4727") ? "" : (stryCov_9fa48("4727"), 'Impersonation or bot account')))
});