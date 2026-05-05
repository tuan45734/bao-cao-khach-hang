// js/filters/product-filter.js - Bộ lọc sản phẩm
class ProductFilter {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.currentValue = '';
        this.onChangeCallback = null;
        this.initEvent();
        this.initOptions();
    }
    
    initEvent() {
        if (this.element) {
            this.element.addEventListener('change', () => {
                this.currentValue = this.element.value;
                if (this.onChangeCallback) this.onChangeCallback();
            });
        }
    }
    
    getCustomersByProduct(productName) {
        if (!productName) return [];
        const categoryMap = window.categoryMapping_all || {};
        for (const category in categoryMap) {
            const products = categoryMap[category];
            if (products && products[productName]) {
                return products[productName];
            }
        }
        return [];
    }
    
    getProductsByCategory(categoryName) {
        if (!categoryName) return [];
        const categoryMap = window.categoryMapping_all || {};
        const products = categoryMap[categoryName] || {};
        return Object.keys(products);
    }
    
    getAllProducts() {
        const allProducts = [];
        const categoryMap = window.categoryMapping_all || {};
        for (const category in categoryMap) {
            const products = categoryMap[category];
            if (products && typeof products === 'object') {
                for (const product in products) {
                    if (!allProducts.includes(product)) allProducts.push(product);
                }
            }
        }
        return allProducts.sort();
    }
    
    getValue() { return this.currentValue; }
    
    reset() {
        if (this.element) {
            this.element.value = '';
            this.currentValue = '';
        }
    }
    
    initOptions() {
        if (!this.element) return;
        const products = this.getAllProducts();
        this.element.innerHTML = '<option value="">-- Không chọn sản phẩm --</option>';
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product;
            option.textContent = product;
            this.element.appendChild(option);
        });
    }
    
    updateOptionsByCategory(categoryName) {
        if (!this.element) return;
        let products = [];
        if (categoryName && categoryName !== 'all' && categoryName !== '') {
            products = this.getProductsByCategory(categoryName);
        } else {
            products = this.getAllProducts();
        }
        const currentProduct = this.currentValue;
        this.element.innerHTML = '<option value="">-- Không chọn sản phẩm --</option>';
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product;
            option.textContent = product;
            this.element.appendChild(option);
        });
        if (currentProduct && products.includes(currentProduct)) {
            this.element.value = currentProduct;
            this.currentValue = currentProduct;
        } else {
            this.element.value = '';
            this.currentValue = '';
        }
    }
    
    setOnChangeCallback(callback) { this.onChangeCallback = callback; }
}