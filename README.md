# Sujuvin
Finnish taxi dispatch demo. Start with `pnpm dev` and open http://localhost:3003.

Enter a destination and choose Etsi kyyti. The demo finds a taxi after 2 seconds, the first driver declines at 9 seconds, a replacement is dispatched at 12 seconds and arrives at 30 seconds. Cancel resets the simulation; a completed trip can be replayed. Both cars are selected from different Helsinki starting locations.

The pickup is a fixed demonstration location at Mannerheimintie 1, Helsinki. No browser geolocation or real booking occurs. Destination search uses Photon after submission, followed by an OSRM driving route to the selected result. OpenStreetMap tiles need an internet connection; pickup routes use the public OSRM demo service, falling back to explicitly labelled illustrative routes if unavailable. With user approval, the submitted address is sent to Photon and selected coordinates to OSRM. Attribution remains visible on the map.

Validation: production build, TypeScript checks and HTTP preview response. Browser interaction testing was not requested. No source has been uploaded or published.

## Standalone app
Double-click `index.html` in this folder to open the app directly in your browser. React, Leaflet, icons and CSS are embedded in the file. No server or installation is needed. Internet access is still needed for OpenStreetMap tiles and OSRM routing; failed routing uses the labelled demonstration routes.

Regenerate after editing: `node scripts/build-standalone.mjs`. The old taxi fades over 2.6 seconds; the replacement enters at 2.4× scale and settles over 1.45 seconds. Reduced-motion settings disable these effects.

## Ride offers and fare receipt
Etsi kyyti now displays four illustrative fixed-fare choices (Säästö, Sujuvin, Nopea nouto, Premium). Faster regular pickup costs more, and Premium has a higher fare and vehicle class. Selecting an offer starts the existing driver-change demonstration; replacement preserves the chosen class and fare. After pickup and boarding the passenger travels on a clearly labelled local demonstration path, then a fare dialog displays the originally selected amount. Closing it permits reopening; Uusi matka resets the flow. No payment or actual booking occurs.

Destination geocoding and routing are enabled with explicit user approval. Address selection is required before choosing a ride; a failed destination lookup or route never falls back to a made-up passenger trip. Existing map tiles and fixed pickup approach routes remain unchanged.

Validated: TypeScript, standalone build, fare ordering/format checks and bundled script syntax. Browser interaction QA was not performed.

## Top-down taxi motion
The overhead taxi sprite faces its direction of travel. Movement runs on animation frames, with small rounded intersection corners and shortest-angle heading changes. Pickup and passenger-trip geometry use the available road routes, retaining the labelled fallback when routing is unavailable. Arrival scaling and the passenger label stay separate from rotation.

## Animated car replacement
At the handover, “Auto vaihtui, etsimme heti uuden” appears while the old taxi shakes, then accelerates off the map in its current direction. The replacement scales smoothly into view and blinks three times before driving, accompanied by “Uusi auto löytyi!”. Reduced-motion mode shows the replacement immediately without shaking or blinking. Cancel and replay clear the animation state.

## Supplied taxi image
The taxi uses the user-supplied Shutterstock JPEG (image 1494338876), retained in full including its attribution. Its front faces right in the source, so rendering subtracts 90 degrees from the route heading. The existing curved route motion and game-like car handover remain active.

The current marker uses the latest user-supplied Google thumbnail JPEG, facing approximately 144 degrees clockwise from north. Its checkerboard is part of the JPEG, not transparency. The marker stays compact at 44 × 44 pixels.

The active taxi asset is now taxi-transparent.png, an edited cutout with verified alpha transparency. The previous JPEG background is no longer used.

## Map follows near edges
While a taxi is approaching or carrying the passenger, the map smoothly pans toward it when it enters the outer 100 px (22% on smaller maps). Panning is throttled to avoid jitter and briefly paused during manual dragging or zooming. The departing taxi can still speed off-screen. Reduced-motion mode repositions without animation.

## Real destination routing
Enter a street address and city, press Etsi kyyti, select the matching address, then choose a ride. The destination is marked on the map. After pickup, the taxi follows the OSRM route to the nearest reachable road within 200 metres of the chosen location. The receipt shows the resolved destination. Driving time is accelerated and fares remain simulated examples. Requests have a 20-second timeout; edits cancel stale requests and search results are cached in memory.

Validated with Kaivokatu 1, Helsinki: 866.3 m route, 79 geometry points, endpoint 22.1 m from the geocoded destination. Both services permit cross-origin requests from the local HTML app. TypeScript, response/coordinate/error checks and both builds passed.
