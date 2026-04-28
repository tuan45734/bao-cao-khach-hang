// js/filters/npp-filter.js
class NPPFilter {
    constructor(elementId, customers, areaHighlight) {
        this.element = document.getElementById(elementId);
        this.customers = customers;
        this.areaHighlight = areaHighlight;
        this.currentValue = 'all';
        this.currentArea = 'all';
        this.onChangeCallback = null;
        this.onEmployeeChangeCallback = null;
        this.onResetEmployeeCallback = null;
        this.initEvent();
    }
    
    initEvent() {
        if (this.element) {
            this.element.addEventListener('change', () => {
                const oldValue = this.currentValue;
                this.currentValue = this.element.value;
                if (oldValue !== this.currentValue && this.onResetEmployeeCallback) this.onResetEmployeeCallback();
                
                if (this.areaHighlight) {
                    if (this.currentValue !== 'all') this.areaHighlight.highlightByNPP(this.currentValue, false);
                    else if (this.currentArea !== 'all') this.areaHighlight.highlightByArea(this.currentArea, false);
                    else this.areaHighlight.showAllAreas();
                }
                
                if (this.onEmployeeChangeCallback) this.onEmployeeChangeCallback(this.currentValue);
                if (this.onChangeCallback) this.onChangeCallback();
            });
        }
    }
    
    getEmployeesByNPP(npp) {
        const set = new Set();
        if (npp === 'all') {
            this.customers.forEach(c => { if (c.ten_nv) set.add(c.ten_nv); });
        } else {
            this.customers.forEach(c => { if (c.npp === npp && c.ten_nv) set.add(c.ten_nv); });
        }
        return Array.from(set).sort();
    }
    
    getCustomerCountByNPP(npp) {
        if (!npp || npp === 'all') return 0;
        return this.customers.filter(c => c.npp === npp).length;
    }
    
    applyFilter(customers) {
        if (this.currentValue === 'all') return customers;
        return customers.filter(c => c.npp === this.currentValue);
    }
    
    getValue() { return this.currentValue; }
    reset() { if (this.element) { this.element.value = 'all'; this.currentValue = 'all'; } }
    
    updateOptions(npps, currentArea = null) {
        if (!this.element) return;
        if (currentArea !== null) this.currentArea = currentArea;
        
        const currentNPP = this.currentValue;
        this.element.innerHTML = '<option value="all">-- Chọn NPP --</option>';
        
        if (npps && npps.length > 0) {
            npps.forEach(npp => {
                const option = document.createElement('option');
                option.value = npp;
                const customerCount = this.getCustomerCountByNPP(npp);
                option.textContent = `${npp} (${customerCount} KH)`;
                this.element.appendChild(option);
            });
            this.element.disabled = false;
        } else {
            this.element.innerHTML = '<option value="all">-- Không có NPP --</option>';
            this.element.disabled = true;
        }
        
        if (currentNPP !== 'all' && npps && npps.includes(currentNPP)) {
            this.element.value = currentNPP;
            this.currentValue = currentNPP;
        } else {
            this.element.value = 'all';
            this.currentValue = 'all';
        }
    }
    
    initOptions(npps = []) { this.updateOptions(npps); }
    setOnChangeCallback(callback) { this.onChangeCallback = callback; }
    setOnEmployeeChangeCallback(callback) { this.onEmployeeChangeCallback = callback; }
    setOnResetEmployeeCallback(callback) { this.onResetEmployeeCallback = callback; }
}