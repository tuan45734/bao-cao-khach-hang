// js/filters/npp-filter.js - Bộ lọc nhà phân phối

class NPPFilter {
    constructor(elementId, customers, areaHighlight) {
        this.element = document.getElementById(elementId);
        this.customers = customers;
        this.areaHighlight = areaHighlight;
        this.currentValue = 'all';
        this.currentArea = 'all';
        this.onChangeCallback = null;
        this.onEmployeeChangeCallback = null;
        this.onResetEmployeeCallback = null; // Callback để reset employee
        
        this.initEvent();
    }
    
    initEvent() {
        if (this.element) {
            this.element.addEventListener('change', () => this.handleChange());
        }
    }
    
    handleChange() {
        const oldValue = this.currentValue;
        this.currentValue = this.element.value;
        
        // Khi đổi NPP, reset Employee (cấp thấp hơn)
        if (oldValue !== this.currentValue && this.onResetEmployeeCallback) {
            this.onResetEmployeeCallback();
        }
        
        // Highlight NPP được chọn
        if (this.areaHighlight) {
            if (this.currentValue !== 'all') {
                this.areaHighlight.highlightByNPP(this.currentValue, false);
            } else if (this.currentArea !== 'all') {
                // Nếu chọn "all" NPP nhưng vẫn còn khu vực, highlight khu vực đó
                this.areaHighlight.highlightByArea(this.currentArea, false);
            } else {
                // Hiển thị tất cả khu vực
                this.areaHighlight.showAllAreas();
            }
        }
        
        // Cập nhật Employee dropdown dựa trên NPP đã chọn
        if (this.onEmployeeChangeCallback) {
            this.onEmployeeChangeCallback(this.currentValue);
        }
        
        // Gọi filter chính để hiển thị khách hàng theo NPP
        if (this.onChangeCallback) {
            this.onChangeCallback();
        }
    }
    
    getEmployeesByNPP(npp) {
        const set = new Set();
        if (npp === 'all') {
            this.customers.forEach(c => { 
                if (c.ten_nv) set.add(c.ten_nv); 
            });
        } else {
            this.customers.forEach(c => {
                if (c.npp === npp && c.ten_nv) set.add(c.ten_nv);
            });
        }
        return Array.from(set).sort();
    }
    
    applyFilter(customers) {
        if (this.currentValue === 'all') return customers;
        return customers.filter(c => c.npp === this.currentValue);
    }
    
    getValue() {
        return this.currentValue;
    }
    
    reset() {
        if (this.element) {
            this.element.value = 'all';
            this.currentValue = 'all';
        }
    }
    
    updateOptions(npps, currentArea = null) {
        if (!this.element) return;
        
        if (currentArea !== null) {
            this.currentArea = currentArea;
        }
        
        const currentNPP = this.currentValue;
        
        this.element.innerHTML = '<option value="all">-- Chọn NPP --</option>';
        
        npps.forEach(npp => {
            const option = document.createElement('option');
            option.value = npp;
            option.textContent = npp;
            this.element.appendChild(option);
        });
        
        if (currentNPP !== 'all' && npps.includes(currentNPP)) {
            this.element.value = currentNPP;
            this.currentValue = currentNPP;
        } else {
            this.element.value = 'all';
            this.currentValue = 'all';
        }
        
        this.element.disabled = (npps.length === 0);
    }
    
    initOptions(npps = []) {
        this.updateOptions(npps);
    }
    
    setOnChangeCallback(callback) {
        this.onChangeCallback = callback;
    }
    
    setOnEmployeeChangeCallback(callback) {
        this.onEmployeeChangeCallback = callback;
    }
    
    setOnResetEmployeeCallback(callback) {
        this.onResetEmployeeCallback = callback;
    }
}