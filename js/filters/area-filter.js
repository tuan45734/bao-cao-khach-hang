// js/filters/area-filter.js - Bộ lọc khu vực

class AreaFilter {
    constructor(elementId, customers, areaHighlight) {
        this.element = document.getElementById(elementId);
        this.customers = customers;
        this.areaHighlight = areaHighlight;
        this.currentValue = 'all';
        this.onChangeCallback = null;
        this.onNPPChangeCallback = null;
        this.onResetLowerFilters = null; // Callback để reset cấp thấp hơn
        
        // Mapping khu vực - danh sách NPP
        this.areaMapping = {
            'KV1': ['NPP Bảo Lâm', 'NPP Công Giang', 'NPP Cường Thịnh', 'NPP Đức Nam Tiến', 'NPP Dũng Cúc', 'NPP Lâm Hạ', 'NPP Long Liên', 'NPP Nguyên Vũ', 'NPP Thảo Nam', 'NPP Tuấn Huê', 'NPP Tuấn Yến', 'NPP Vũ Tấm'],
            'KV2': ['NPP Duy Anh', 'NPP Hoa Việt', 'NPP Hùng Huệ', 'NPP Long Châm', 'NPP Ngọc Kiên', 'NPP Ngọc Thêu', 'NPP Phong Hiền', 'NPP Phúc Thịnh', 'NPP Phương Đông', 'NPP Thành Lụa', 'NPP Tuấn Huyền'],
            'KV3': ['NPP Bảo Cường', 'NPP Hikoji', 'NPP Long Hải', 'NPP Tân Hoa', 'NPP Tây Đô', 'NPP Thắng Lợi', 'NPP Thành Hân', 'NPP Tiến Thịnh'],
            'KV4': ['NPP Ánh Thu', 'NPP Đức Oanh', 'NPP Dương Minh', 'NPP Dũng Béo', 'NPP Hưng Thịnh', 'NPP Ngọc Phúc', 'NPP Nguyễn Đình Hân', 'NPP Tân Thúy', 'NPP Thăng Hương', 'NPP Thảo Thắng', 'NPP Tùng Phương'],
            'KV5': ['NPP Đồng Lợi', 'NPP Hải Hằng', 'NPP Hiền Cường', 'NPP Hoàng Minh', 'NPP Oanh Định', 'NPP Sơn Lâm', 'NPP Thái Hoà', 'NPP Thảo Xuân', 'NPP Duy Khoa', 'NPP Tuấn Vân', 'NPP Vũ Đức Nam'],
            'KV6': ['NPP Anh Minh HT', 'NPP Hà Thanh', 'NPP Hồng Đức', 'NPP Linh Trang', 'NPP Mạnh Hà 1', 'NPP Mạnh Hà 2', 'NPP Minh Châu', 'NPP Minh Lộc', 'NPP Nhung Tùng', 'NPP Phương Hà', 'NPP Tân Bích An', 'NPP Thanh Bình', 'NPP Thành Thanh', 'NPP Thông Thơm', 'NPP Trường Hằng']
        };
        
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
        
        // Khi đổi khu vực, reset NPP và Employee (cấp thấp hơn)
        if (oldValue !== this.currentValue && this.onResetLowerFilters) {
            this.onResetLowerFilters();
        }
        
        // Xử lý hiển thị polygon khu vực
        if (this.areaHighlight) {
            if (this.currentValue !== 'all') {
                this.areaHighlight.highlightByArea(this.currentValue, false);
            } else {
                this.areaHighlight.showAllAreas();
            }
        }
        
        // Cập nhật NPP dropdown dựa trên khu vực đã chọn
        if (this.onNPPChangeCallback) {
            this.onNPPChangeCallback(this.currentValue);
        }
        
        // Gọi filter chính để hiển thị khách hàng theo khu vực
        if (this.onChangeCallback) {
            this.onChangeCallback();
        }
    }
    
    getNPPsByArea(area) {
        if (area === 'all') {
            const allNPPs = new Set();
            this.customers.forEach(c => { 
                if (c.npp) allNPPs.add(c.npp); 
            });
            return Array.from(allNPPs).sort();
        }
        return this.areaMapping[area] || [];
    }
    
    applyFilter(customers) {
        if (this.currentValue === 'all') return customers;
        
        const nppsInArea = this.areaMapping[this.currentValue] || [];
        return customers.filter(c => nppsInArea.includes(c.npp));
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
    
    initOptions() {
        // Options đã có sẵn trong HTML
    }
    
    setOnChangeCallback(callback) {
        this.onChangeCallback = callback;
    }
    
    setOnNPPChangeCallback(callback) {
        this.onNPPChangeCallback = callback;
    }
    
    setOnResetLowerFilters(callback) {
        this.onResetLowerFilters = callback;
    }
}