// js/filters/date-range-filter.js
class DateRangeFilter {
    constructor(fromElementId, toElementId, customers) {
        this.fromElement = document.getElementById(fromElementId);
        this.toElement = document.getElementById(toElementId);
        this.customers = customers;
        this.fromValue = '';
        this.toValue = '';
        this.onChangeCallback = null;
        
        this.initEvent();
        this.updateCounts();
    }
    
    initEvent() {
        if (this.fromElement) {
            this.fromElement.addEventListener('change', () => this.handleFromChange());
        }
        if (this.toElement) {
            this.toElement.addEventListener('change', () => this.handleToChange());
        }
    }
    
    handleFromChange() {
        this.fromValue = this.fromElement.value;
        this.updateCounts();
        if (this.onChangeCallback) this.onChangeCallback();
    }
    
    handleToChange() {
        this.toValue = this.toElement.value;
        this.updateCounts();
        if (this.onChangeCallback) this.onChangeCallback();
    }
    
    parseMonthToDate(monthKey) {
        if (!monthKey) return null;
        const parts = monthKey.split('-');
        const month = parseInt(parts[0], 10);
        const year = parseInt(parts[1], 10);
        const lastDay = new Date(year, month, 0).getDate();
        return { end: new Date(year, month - 1, lastDay) };
    }
    
    parseDate(dateStr) {
        if (!dateStr) return null;
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        }
        if (dateStr.includes('-')) {
            const parts = dateStr.split('-');
            return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        }
        return null;
    }
    
    getCustomersUptoMonth(monthKey) {
        if (!monthKey) return [];
        const monthDate = this.parseMonthToDate(monthKey);
        if (!monthDate) return [];
        return this.customers.filter(c => {
            if (!c.ngay_tao) return false;
            const customerDate = this.parseDate(c.ngay_tao);
            return customerDate && customerDate <= monthDate.end;
        });
    }
    
    getFromValue() { return this.fromValue; }
    getToValue() { return this.toValue; }
    
    updateCounts() {
        const fromCount = this.getCustomersUptoMonth(this.fromValue).length;
        const toCount = this.getCustomersUptoMonth(this.toValue).length;
        
        const fromSpan = document.getElementById('fromMonthCount');
        const toSpan = document.getElementById('toMonthCount');
        
        if (fromSpan) fromSpan.textContent = this.fromValue ? `${fromCount} KH` : '';
        if (toSpan) toSpan.textContent = this.toValue ? `${toCount} KH` : '';
    }
    
    reset() {
        if (this.fromElement) this.fromElement.value = '';
        if (this.toElement) this.toElement.value = '';
        this.fromValue = '';
        this.toValue = '';
        this.updateCounts();
    }
    
    setOnChangeCallback(callback) { this.onChangeCallback = callback; }
}