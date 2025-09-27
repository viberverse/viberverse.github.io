// Funny Shooter 2 - Safe async no-ads patch
(function disableAds() {
    const tryPatch = () => {
        let patched = false;

        // Disable fullscreen ad functions if they exist
        if (typeof showFullscrenAd === 'function') {
            showFullscrenAd = () => {};
            patched = true;
        }

        if (typeof _ShowFullscreenAd === 'function') {
            _ShowFullscreenAd = () => {};
            patched = true;
        }

        // Ensure window.adv object exists and does nothing
        if (!window.adv) window.adv = {};
        if (typeof window.adv.show !== 'function') window.adv.show = () => {};

        // If patch applied, stop trying
        return patched;
    };

    const interval = setInterval(() => {
        if (tryPatch()) {
            clearInterval(interval);
            console.log('Funny Shooter 2: Ads disabled safely.');
        }
    }, 100); // check every 100ms until the functions exist
})();
