// js/filters/category-filter.js - Bộ lọc ngành hàng
class CategoryFilter {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.currentValue = '';
        this.onChangeCallback = null;
        this.initEvent();
    }
    
    initEvent() {
        if (this.element) {
            this.element.addEventListener('change', () => {
                this.currentValue = this.element.value;
                if (this.onChangeCallback) this.onChangeCallback();
            });
        }
    }
    
    getCategoryMap(monthKey) {
        if (!monthKey) return {};
        const mappingName = `categoryMapping_${monthKey.replace('-', '_')}`;
        return window[mappingName] || {};
    }
    
    getAllCategoryMap() {
        return window.categoryMapping_all || {};
    }
    
    // Lấy tất cả mã khách hàng từ 4 ngành (tổng hợp)
    getAllCustomerCodes() {
        const allMap = this.getAllCategoryMap();
        const allCodes = new Set();
        for (const category in allMap) {
            const products = allMap[category];
            if (products && typeof products === 'object') {
                for (const product in products) {
                    const codes = products[product];
                    if (Array.isArray(codes)) {
                        codes.forEach(code => allCodes.add(code));
                    }
                }
            }
        }
        return Array.from(allCodes);
    }
    
    getCustomerCodesByCategory(categoryName) {
        if (!categoryName || categoryName === 'all') return [];
        const allMap = this.getAllCategoryMap();
        const products = allMap[categoryName] || {};
        const allCodes = new Set();
        for (const product in products) {
            const codes = products[product];
            if (Array.isArray(codes)) {
                codes.forEach(code => allCodes.add(code));
            }
        }
        return Array.from(allCodes);
    }
    
    getValue() { return this.currentValue; }
    
    reset() {
        if (this.element) {
            this.element.value = '';
            this.currentValue = '';
        }
    }
    
    updateOptions(monthKey) {
        if (!this.element) return;
        const categoryMap = this.getCategoryMap(monthKey);
        const categories = Object.keys(categoryMap).sort();
        this.element.innerHTML = '<option value="">-- Tất cả ngành hàng --</option><option value="all">-- Không chọn --</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            this.element.appendChild(option);
        });
        this.element.disabled = (categories.length === 0);
        if (this.currentValue !== '' && this.currentValue !== 'all' && !categories.includes(this.currentValue)) {
            this.element.value = '';
            this.currentValue = '';
        }
    }
    
    updateOptionsWithAll() {
        if (!this.element) return;
        const categoryMap = this.getAllCategoryMap();
        const categories = Object.keys(categoryMap).sort();
        this.element.innerHTML = '<option value="">-- Tất cả ngành hàng --</option><option value="all">-- Không chọn --</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            this.element.appendChild(option);
        });
        this.element.disabled = (categories.length === 0);
        if (this.currentValue !== '' && this.currentValue !== 'all' && !categories.includes(this.currentValue)) {
            this.element.value = '';
            this.currentValue = '';
        }
    }
    
    initOptions() { this.updateOptionsWithAll(); }
    
    setOnChangeCallback(callback) { this.onChangeCallback = callback; }
}