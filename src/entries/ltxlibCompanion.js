import { CrossSitePlayRouter } from '../services/CrossSitePlayRouter.js';
import { LtxLibAdapter } from '../adapters/LtxLibAdapter.js';

(function() {
    'use strict';
    if (!LtxLibAdapter.isLtxLibSite()) return;
    const notify = (msg, duration, type) => LtxLibAdapter._notify(msg, duration, type);
    CrossSitePlayRouter.setNotifier(notify);
    LtxLibAdapter.detectAndStart({ onNotify: notify });
})();
