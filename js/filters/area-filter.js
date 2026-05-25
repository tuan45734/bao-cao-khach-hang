// js/filters/area-filter.js

class AreaFilter {
    constructor(elementId, customers, areaHighlight) {
        this.element = document.getElementById(elementId);
        this.customers = customers;
        this.areaHighlight = areaHighlight;
        this.currentValue = 'all';
        this.allowedAreas = [];
        this.onChangeCallback = null;
        this.onNPPChangeCallback = null;
        this.onResetLowerFilters = null;

        this.areaMapping = {
            KV1: ['NPP Bảo Lâm', 'NPP Công Giang', 'NPP Cường Thịnh', 'NPP Đức Nam Tiến', 'NPP Dũng Cúc', 'NPP Lâm Hạ', 'NPP Long Liên', 'NPP Nguyên Vũ', 'NPP Thảo Nam', 'NPP Tuấn Huê', 'NPP Tuấn Yến', 'NPP Vũ Tấm'],
            KV2: ['NPP Duy Anh', 'NPP Hùng Huệ', 'NPP Long Châm', 'NPP Ngọc Kiên', 'NPP Ngọc Thêu', 'NPP Phong Hiền', 'NPP Phương Đông', 'NPP Thành Lụa', 'NPP Tuấn Huyền'],
            KV3: ['NPP Bảo Cường', 'NPP Tùng Phương', 'NPP Phúc Thịnh', 'NPP Hoa Việt', 'NPP Hikoji', 'NPP Long Hải', 'NPP Tân Hoa', 'NPP Tây Đô', 'NPP Thắng Lợi', 'NPP Thành Hân', 'NPP Tiến Thịnh'],
            KV4: ['NPP Ánh Thu', 'NPP Đức Oanh', 'NPP Dương Minh', 'NPP Dũng Béo', 'NPP Hưng Thịnh', 'NPP Ngọc Phúc', 'NPP Nguyễn Đình Hân', 'NPP Tân Thúy', 'NPP Thăng Hương', 'NPP Thảo Thắng'],
            KV5: ['NPP Đồng Lợi', 'NPP Hải Hằng', 'NPP Hiền Cường', 'NPP Hoàng Minh', 'NPP Oanh Định', 'NPP Sơn Lâm', 'NPP Thái Hoà', 'NPP Thảo Xuân', 'NPP Duy Khoa', 'NPP Tuấn Vân', 'NPP Vũ Đức Nam'],
            KV6: ['NPP Anh Minh HT', 'NPP Hà Thanh', 'NPP Hồng Đức', 'NPP Linh Trang', 'NPP Mạnh Hà 1', 'NPP Mạnh Hà 2', 'NPP Minh Châu', 'NPP Minh Lộc', 'NPP Nhung Tùng', 'NPP Phương Hà', 'NPP Tân Bích An', 'NPP Thanh Bình', 'NPP Thành Thanh', 'NPP Thông Thơm', 'NPP Trường Hằng'],
            KV7: ['NPP Tâm Bảo Hân', 'NPP NAKOA', 'NPP Dương Thiên Nhi', 'NPP Tường Vy', 'NPP Minh Huy', 'NPP Hiền Thuận', 'NPP Thúy Diễm', 'NPP Anh Viên', 'NPP Hoàng Gia Bảo', 'NPP Trung Nam', 'NPP Nam Khánh', 'NPP Thanh Trà']
        };

        this.regionMapping = {
            north: ['KV1', 'KV2', 'KV3', 'KV4', 'KV5', 'KV6'],
            central: ['KV7'],
            south: []
        };

        this.allAreas = Object.keys(this.areaMapping);
        this.allowedAreas = [...this.allAreas];
        this.initEvent();
        this.renderOptions();
    }

    initEvent() {
        if (this.element) {
            this.element.addEventListener('change', () => this.handleChange());
        }
    }

    getAllAreas() {
        return [...this.allAreas];
    }

    getAllowedAreas() {
        return [...this.allowedAreas];
    }

    getAreasByRegion(region) {
        if (region === 'all') {
            return this.getAllAreas();
        }
        return [...(this.regionMapping[region] || [])];
    }

    setAllowedAreas(areas) {
        const normalized = Array.isArray(areas)
            ? areas.filter(area => this.allAreas.includes(area))
            : [...this.allAreas];

        this.allowedAreas = normalized;
        this.renderOptions();
    }

    renderOptions() {
        if (!this.element) return;

        const currentValue = this.currentValue;
        this.element.innerHTML = '';

        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = '-- Tất cả khu vực --';
        this.element.appendChild(allOption);

        if (this.allowedAreas.length > 0) {
            this.allowedAreas.forEach(area => {
                const option = document.createElement('option');
                option.value = area;
                option.textContent = area;
                this.element.appendChild(option);
            });
            this.element.disabled = false;
        } else {
            const emptyOption = document.createElement('option');
            emptyOption.value = '__empty__';
            emptyOption.textContent = '-- Không có khu vực --';
            this.element.appendChild(emptyOption);
            this.element.disabled = true;
        }

        if (currentValue !== 'all' && this.allowedAreas.includes(currentValue)) {
            this.element.value = currentValue;
        } else if (this.allowedAreas.length === 0) {
            this.currentValue = 'all';
            this.element.value = '__empty__';
        } else {
            this.currentValue = 'all';
            this.element.value = 'all';
        }
    }

    handleChange() {
        const oldValue = this.currentValue;
        this.currentValue = this.element.value;

        if (oldValue !== this.currentValue && this.onResetLowerFilters) {
            this.onResetLowerFilters();
        }

        if (this.areaHighlight) {
            if (this.currentValue !== 'all') {
                this.areaHighlight.highlightByArea(this.currentValue, false);
            } else {
                this.areaHighlight.showAllAreas();
            }
        }

        if (this.onNPPChangeCallback) {
            this.onNPPChangeCallback(this.currentValue);
        }

        if (this.onChangeCallback) {
            this.onChangeCallback();
        }
    }

    getNPPsByArea(area) {
        if (area === 'all') {
            const areas = this.allowedAreas.length > 0 ? this.allowedAreas : [];
            const allNPPs = new Set();

            areas.forEach(areaCode => {
                const npps = this.areaMapping[areaCode] || [];
                npps.forEach(npp => allNPPs.add(npp));
            });

            return Array.from(allNPPs).sort();
        }

        if (!this.allowedAreas.includes(area)) {
            return [];
        }

        return this.areaMapping[area] || [];
    }

    applyFilter(customers) {
        let result = [...customers];

        if (this.allowedAreas.length > 0) {
            const allowedNpps = new Set();
            this.allowedAreas.forEach(areaCode => {
                const npps = this.areaMapping[areaCode] || [];
                npps.forEach(npp => allowedNpps.add(npp));
            });
            result = result.filter(c => allowedNpps.has(c.npp));
        } else {
            return [];
        }

        if (this.currentValue === 'all') {
            return result;
        }

        return result.filter(c => this.areaMapping[this.currentValue]?.includes(c.npp));
    }

    getValue() {
        return this.currentValue;
    }

    reset() {
        if (this.element) {
            this.element.value = 'all';
        }
        this.currentValue = 'all';
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
