export class SettingsStreamScheduler {
    constructor(container, settingsManager) {
        this.container = container;
        this.sm = settingsManager;
        this.sectionsQueue = [];
        this.isScheduled = false;
        this.observer = null;
    }

    register(id, factory, { defer = 'idle' } = {}) {
        this.sectionsQueue.push({ id, factory, defer });
    }

    start() {
        if (this.isScheduled) return;
        this.isScheduled = true;

        const processQueue = () => {
            if (this.sectionsQueue.length === 0) return;

            const item = this.sectionsQueue.shift();
            if (!item) return;

            if (item.defer === 'viewport' && 'IntersectionObserver' in window) {
                const skeleton = document.createElement('div');
                skeleton.className = 'tm-settings-skeleton-card';
                skeleton.dataset.sectionId = item.id;
                skeleton.style.margin = '4px 0';
                this.container.appendChild(skeleton);

                const obs = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            obs.unobserve(skeleton);
                            const sectionNode = item.factory(this.sm);
                            if (sectionNode && skeleton.parentNode) {
                                skeleton.parentNode.replaceChild(sectionNode, skeleton);
                            }
                        }
                    });
                }, { root: this.container, rootMargin: '80px 0px' });

                obs.observe(skeleton);
                this._next(processQueue);
            } else {
                const sectionNode = item.factory(this.sm);
                if (sectionNode) {
                    this.container.appendChild(sectionNode);
                }
                this._next(processQueue);
            }
        };

        this._next(processQueue);
    }

    _next(cb) {
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(cb, { timeout: 120 });
        } else {
            setTimeout(cb, 16);
        }
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.sectionsQueue = [];
        this.isScheduled = false;
    }
}
