// js/filters/employee-filter.js
class EmployeeFilter {
    constructor(elementId, customers, areaHighlight) {
        this.element = document.getElementById(elementId);
        this.customers = customers;
        this.areaHighlight = areaHighlight;
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
    
    applyFilter(customers) {
        if (this.currentValue === 'all') return customers;
        return customers.filter(c => c.ten_nv === this.currentValue);
    }
    
    getSelectedNPP() {
        if (this.currentValue === 'all') return null;
        const customer = this.customers.find(c => c.ten_nv === this.currentValue);
        return customer ? customer.npp : null;
    }
    
    getValue() { return this.currentValue; }
    reset() { if (this.element) { this.element.value = 'all'; this.currentValue = 'all'; } }
    
    updateOptions(employees) {
        if (!this.element) return;
        const currentEmployee = this.currentValue;
        this.element.innerHTML = '<option value="all">-- Chọn nhân viên --</option>';
        
        if (employees && employees.length > 0) {
            employees.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp;
                option.textContent = emp;
                this.element.appendChild(option);
            });
            this.element.disabled = false;
        } else {
            this.element.innerHTML = '<option value="all">-- Không có nhân viên --</option>';
            this.element.disabled = true;
        }
        
        if (currentEmployee !== 'all' && employees && employees.includes(currentEmployee)) {
            this.element.value = currentEmployee;
            this.currentValue = currentEmployee;
        } else {
            this.element.value = 'all';
            this.currentValue = 'all';
        }
    }
    
    initOptions(employees = []) { this.updateOptions(employees); }
    setOnChangeCallback(callback) { this.onChangeCallback = callback; }
}