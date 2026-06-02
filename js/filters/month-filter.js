// js/filters/month-filter.js - Bộ lọc chọn tháng dữ liệu ngành hàng

class MonthFilter {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.currentValue = '';
        this.onChangeCallback = null;
        this.monthMapping = {
            '1-2026': { name: 'Tháng 1/2026', file: 'nh-1-2026.js', mapping: null },
            '2-2026': { name: 'Tháng 2/2026', file: 'nh-2-2026.js', mapping: null },
            '3-2026': { name: 'Tháng 3/2026', file: 'nh-3-2026.js', mapping: null },
            '4-2026': { name: 'Tháng 4/2026', file: 'nh-4-2026.js', mapping: null },
            '5-2026': { name: 'Tháng 5/2026', file: 'nh-5-2026.js', mapping: null },
            '6-2026': { name: 'Tháng 6/2026', file: 'nh-6-2026.js', mapping: null }
        };

        this.initEvent();
        this.initOptions();
    }

    initEvent() {
        if (this.element) {
            this.element.addEventListener('change', () => this.handleChange());
        }
    }

    async handleChange() {
        this.currentValue = this.element.value;

        if (this.currentValue) {
            await this.loadMonthData(this.currentValue);
        } else {
            window.currentCategoryMapping = {};
        }

        if (this.onChangeCallback) {
            this.onChangeCallback();
        }
    }

    async loadMonthData(monthKey) {
        const monthInfo = this.monthMapping[monthKey];
        if (!monthInfo || !monthInfo.file) return;

        if (window[`categoryMapping_${monthKey.replace('-', '_')}`]) {
            window.currentCategoryMapping = window[`categoryMapping_${monthKey.replace('-', '_')}`];
            return;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `data/${monthInfo.file}`;
            script.onload = () => {
                window.currentCategoryMapping = window[`categoryMapping_${monthKey.replace('-', '_')}`];
                resolve();
            };
            script.onerror = () => {
                reject();
            };
            document.head.appendChild(script);
        });
    }

    getCurrentCategoryMapping() {
        if (!this.currentValue) return {};
        return window[`categoryMapping_${this.currentValue.replace('-', '_')}`] || {};
    }

    getValue() {
        return this.currentValue;
    }

    reset() {
        if (this.element) {
            this.element.value = '';
            this.currentValue = '';
            window.currentCategoryMapping = {};
        }
    }

    initOptions() {
        // Options đã có sẵn trong HTML
    }

    setOnChangeCallback(callback) {
        this.onChangeCallback = callback;
    }
}
