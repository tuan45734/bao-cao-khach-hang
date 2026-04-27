// js/filters/category-filter.js
class CategoryFilter {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.currentValue = 'all';
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
    
    getValue() { return this.currentValue; }
    
    reset() {
        if (this.element) {
            this.element.value = 'all';
            this.currentValue = 'all';
        }
    }
    
    updateOptions(monthKey) {
        if (!this.element) return;
        const categoryMap = this.getCategoryMap(monthKey);
        const categories = Object.keys(categoryMap).sort();
        
        this.element.innerHTML = '<option value="all">-- Tất cả ngành hàng --</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            this.element.appendChild(option);
        });
        
        this.element.disabled = (categories.length === 0);
        
        if (this.currentValue !== 'all' && !categories.includes(this.currentValue)) {
            this.element.value = 'all';
            this.currentValue = 'all';
        }
    }
    
    updateOptionsWithAll() {
        if (!this.element) return;
        const categoryMap = this.getAllCategoryMap();
        const categories = Object.keys(categoryMap).sort();
        
        this.element.innerHTML = '<option value="all">-- Tất cả ngành hàng --</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            this.element.appendChild(option);
        });
        
        this.element.disabled = (categories.length === 0);
        
        if (this.currentValue !== 'all' && !categories.includes(this.currentValue)) {
            this.element.value = 'all';
            this.currentValue = 'all';
        }
    }
    
    initOptions() { this.updateOptionsWithAll(); }
    
    setOnChangeCallback(callback) { this.onChangeCallback = callback; }
}