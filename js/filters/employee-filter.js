// js/filters/employee-filter.js - Bộ lọc nhân viên

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
            this.element.addEventListener('change', () => this.handleChange());
        }
    }
    
    handleChange() {
        this.currentValue = this.element.value;
        
        // Highlight NPP của nhân viên được chọn
        if (this.areaHighlight && this.currentValue !== 'all') {
            // Tìm NPP của nhân viên này
            const customerOfEmployee = this.customers.find(c => c.ten_nv === this.currentValue);
            if (customerOfEmployee && customerOfEmployee.npp) {
                this.areaHighlight.highlightByNPP(customerOfEmployee.npp, false);
            }
        } else if (this.areaHighlight && this.currentValue === 'all') {
            // Nếu bỏ chọn nhân viên, hiển thị lại theo khu vực hoặc NPP đã chọn
            // Sẽ được xử lý trong main.js qua updateFilters
        }
        
        // Gọi filter chính
        if (this.onChangeCallback) {
            this.onChangeCallback();
        }
    }
    
    applyFilter(customers) {
        if (this.currentValue === 'all') return customers;
        return customers.filter(c => c.ten_nv === this.currentValue);
    }
    
    // Lấy NPP của nhân viên đang chọn
    getSelectedNPP() {
        if (this.currentValue === 'all') return null;
        const customer = this.customers.find(c => c.ten_nv === this.currentValue);
        return customer ? customer.npp : null;
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
    
    updateOptions(employees) {
        if (!this.element) return;
        
        const currentEmployee = this.currentValue;
        
        this.element.innerHTML = '<option value="all">-- Chọn nhân viên --</option>';
        
        employees.forEach(emp => {
            const option = document.createElement('option');
            option.value = emp;
            option.textContent = emp;
            this.element.appendChild(option);
        });
        
        if (currentEmployee !== 'all' && employees.includes(currentEmployee)) {
            this.element.value = currentEmployee;
            this.currentValue = currentEmployee;
        } else {
            this.element.value = 'all';
            this.currentValue = 'all';
        }
        
        this.element.disabled = (employees.length === 0);
    }
    
    initOptions(employees = []) {
        this.updateOptions(employees);
    }
    
    setOnChangeCallback(callback) {
        this.onChangeCallback = callback;
    }
}