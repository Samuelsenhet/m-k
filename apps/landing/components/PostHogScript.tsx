import Script from "next/script";

/**
 * PostHog via <Script> - laddar officiella CDN-snippet istället för
 * posthog-js npm-paketet. Inga client components, ingen React
 * hydration, ingen posthog-js i Next-bundeln.
 *
 * Snippet-loadern är ~1 KB. Den skapar en stub `window.posthog` med
 * metoder som queue:ar upp calls. När `strategy="lazyOnload"` triggar
 * injectas `array.js` från assets.i.posthog.com (~25 KB gzip) async
 * och replay:ar queue:n. Allt sker EFTER att main thread är ledig.
 *
 * Click delegation sker direkt i samma snippet → alla
 * `<a data-track-source>` fångas utan behov av React.
 */

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

export function PostHogScript() {
  if (!POSTHOG_KEY) return null;

  // Officiella PostHog-snippet - byggs från posthog-js/dist/array.full.js vid behov.
  // Vi skriver init-anropet direkt efter snippet-loadern så posthog
  // har rätt konfiguration direkt.
  const initScript = `
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId captureTraceFeedback captureTraceMetric".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init('${POSTHOG_KEY}',{api_host:'${POSTHOG_HOST}',capture_pageview:'history_change',capture_pageleave:true,autocapture:false,disable_session_recording:true,persistence:'localStorage+cookie'});
document.addEventListener('click',function(e){var t=e.target&&e.target.closest&&e.target.closest('a[data-track-source]');if(t&&t.dataset&&t.dataset.trackSource){posthog.capture('landing_app_store_click',{source:t.dataset.trackSource});}},true);
`.trim();

  return (
    <Script
      id="posthog-init"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{ __html: initScript }}
    />
  );
}
