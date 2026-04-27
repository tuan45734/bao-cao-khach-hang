// js/filters/date-filter.js - Bộ lọc ngày tạo khách hàng

class DateFilter {
    constructor(elementId, customers) {
        this.element = document.getElementById(elementId);
        this.customers = customers;
        this.currentValue = '';
        this.onChangeCallback = null;
        
        this.initEvent();
        this.initOptions();
    }
    
    initEvent() {
        if (this.element) {
            this.element.addEventListener('change', () => this.handleChange());
        }
    }
    
    handleChange() {
        this.currentValue = this.element.value;
        
        if (this.onChangeCallback) {
            this.onChangeCallback();
        }
    }
    
    parseDate(dateStr) {
        if (!dateStr) return null;
        
        let day, month, year;
        
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                day = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10) - 1;
                year = parseInt(parts[2], 10);
                return new Date(year, month, day);
            }
        }
        
        if (dateStr.includes('-')) {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                year = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10) - 1;
                day = parseInt(parts[2], 10);
                return new Date(year, month, day);
            }
        }
        
        return null;
    }
    
    formatDateForCompare(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    applyFilter(customers) {
        if (!this.currentValue) return customers;
        
        const selectedDate = this.parseDate(this.currentValue);
        if (!selectedDate) {
            return customers;
        }
        
        const selectedDateStr = this.formatDateForCompare(selectedDate);
        
        const filtered = customers.filter(customer => {
            if (!customer.ngay_tao) {
                return false;
            }
            
            const customerDate = this.parseDate(customer.ngay_tao);
            if (!customerDate) {
                return false;
            }
            
            const customerDateStr = this.formatDateForCompare(customerDate);
            
            return customerDateStr <= selectedDateStr;
        });
        
        return filtered;
    }
    
    getValue() {
        return this.currentValue;
    }
    
    reset() {
        if (this.element) {
            this.element.value = '';
            this.currentValue = '';
        }
    }
    
    initOptions() {
        if (!this.element) return;
        
        let minDate = null;
        let maxDate = null;
        
        this.customers.forEach(customer => {
            if (customer.ngay_tao) {
                const date = this.parseDate(customer.ngay_tao);
                if (date && !isNaN(date.getTime())) {
                    if (!minDate || date < minDate) minDate = date;
                    if (!maxDate || date > maxDate) maxDate = date;
                }
            }
        });
        
        if (minDate && !isNaN(minDate.getTime())) {
            const year = minDate.getFullYear();
            const month = String(minDate.getMonth() + 1).padStart(2, '0');
            const day = String(minDate.getDate()).padStart(2, '0');
            this.element.min = `${year}-${month}-${day}`;
        }
        
        // Set maxDate là ngày hiện tại
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
        const currentDay = String(today.getDate()).padStart(2, '0');
        this.element.max = `${currentYear}-${currentMonth}-${currentDay}`;
        
        // Set giá trị mặc định là maxDate (ngày hiện tại)
        this.element.value = `${currentYear}-${currentMonth}-${currentDay}`;
        this.currentValue = `${currentYear}-${currentMonth}-${currentDay}`;
    }
    
    setOnChangeCallback(callback) {
        this.onChangeCallback = callback;
    }
}