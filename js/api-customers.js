// js/api-customers.js - Xử lý khách hàng thực tế từ API

class ApiCustomersManager {
    constructor() {
        this.apiUrl = 'https://jsk9x6z4-3000.asse.devtunnels.ms/api/khachhang';
        this.customers = [];
        this.filteredCustomers = [];
        this.isEnabled = false;
        this.markerLayer = null;
        this.mapHandler = null;
        this.onDataLoaded = null;
        this.onFilterChangeCallback = null;
        
        // Selected ngành hàng (dạng Set để hỗ trợ nhiều lựa chọn)
        this.selectedCategories = new Set();
        
        // Lưu giá trị hiện tại của các bộ lọc
        this.currentChannel = 'all';
        this.currentType = 'all';
        this.currentArea = 'all';
        this.currentNpp = 'all';
        
        // Mapping khu vực dựa trên NPP
        this.areaMapping = {
            'KV1': ['NPP Bảo Lâm', 'NPP Công Giang', 'NPP Cường Thịnh', 'NPP Đức Nam Tiến', 'NPP Dũng Cúc', 'NPP Lâm Hạ', 'NPP Long Liên', 'NPP Nguyên Vũ', 'NPP Thảo Nam', 'NPP Tuấn Huê', 'NPP Tuấn Yến', 'NPP Vũ Tấm'],
            'KV2': ['NPP Duy Anh', 'NPP Hùng Huệ', 'NPP Long Châm', 'NPP Ngọc Kiên', 'NPP Ngọc Thêu', 'NPP Phong Hiền', 'NPP Phương Đông', 'NPP Thành Lụa', 'NPP Tuấn Huyền'],
            'KV3': ['NPP Bảo Cường', 'NPP Tùng Phương', 'NPP Phúc Thịnh', 'NPP Hoa Việt', 'NPP Hikoji', 'NPP Long Hải', 'NPP Tân Hoa', 'NPP Tây Đô', 'NPP Thắng Lợi', 'NPP Thành Hân', 'NPP Tiến Thịnh'],
            'KV4': ['NPP Ánh Thu', 'NPP Đức Oanh', 'NPP Dương Minh', 'NPP Dũng Béo', 'NPP Hưng Thịnh', 'NPP Ngọc Phúc', 'NPP Nguyễn Đình Hân', 'NPP Tân Thúy', 'NPP Thăng Hương', 'NPP Thảo Thắng'],
            'KV5': ['NPP Đồng Lợi', 'NPP Hải Hằng', 'NPP Hiền Cường', 'NPP Hoàng Minh', 'NPP Oanh Định', 'NPP Sơn Lâm', 'NPP Thái Hoà', 'NPP Thảo Xuân', 'NPP Duy Khoa', 'NPP Tuấn Vân', 'NPP Vũ Đức Nam'],
            'KV6': ['NPP Anh Minh HT', 'NPP Hà Thanh', 'NPP Hồng Đức', 'NPP Linh Trang', 'NPP Mạnh Hà 1', 'NPP Mạnh Hà 2', 'NPP Minh Châu', 'NPP Minh Lộc', 'NPP Nhung Tùng', 'NPP Phương Hà', 'NPP Tân Bích An', 'NPP Thanh Bình', 'NPP Thành Thanh', 'NPP Thông Thơm', 'NPP Trường Hằng'],
            'KV7': ['NPP Bảo Hân', 'NPP NAKOA', 'NPP Dương Thiên Nhi', 'NPP Tường Vy', 'NPP Minh Huy', 'NPP Hiền Thuận', 'NPP Thúy Diễm', 'NPP Anh Viên', 'NPP Hoàng Gia Bảo', 'NPP Trung Nam', 'NPP Nam Khánh', 'NPP Thanh Trà']

        };
        
        // Mapping kênh từ loại
        this.typeToChannel = {
            "Đại siêu thị": "Kênh siêu thị",
            "Siêu Thị Lớn": "Kênh siêu thị",
            "Siêu thị vừa và nhỏ": "Kênh siêu thị",
            "Khách sỉ lớn": "Kênh sỉ",
            "Khách sỉ vừa và nhỏ": "Kênh sỉ",
            "Khách trường học": "Kênh trường học",
            "Cửa hàng tạp hóa": "Kênh tiêu thụ trực tiếp",
            "Khách lẻ tiêu thụ trực tiếp": "Kênh tiêu thụ trực tiếp",
            "kênh horeca": "Kênh horeca",
            "Kênh horeca": "Kênh horeca",
            "Kênh công nghiệp": "Kênh công nghiệp"
        };
        
        this.initFilters();
    }
    
    initFilters() {
        this.apiChannelFilter = document.getElementById('apiChannelFilter');
        this.apiTypeFilter = document.getElementById('apiTypeFilter');
        this.apiAreaFilter = document.getElementById('apiAreaFilter');
        this.apiNppFilter = document.getElementById('apiNppFilter');
        this.resetApiBtn = document.getElementById('resetApiFiltersBtn');
        this.apiCustomerCountSpan = document.getElementById('apiCustomerCount');
        this.apiCategoryCheckboxes = document.getElementById('apiCategoryCheckboxes');
        
        if (this.resetApiBtn) {
            this.resetApiBtn.addEventListener('click', () => this.resetFilters());
        }
        
        if (this.apiAreaFilter) {
            this.apiAreaFilter.addEventListener('change', (e) => {
                this.currentArea = e.target.value;
                this.updateNppOptions();
                this.applyFiltersAndNotify();
            });
        }
        
        if (this.apiNppFilter) {
            this.apiNppFilter.addEventListener('change', (e) => {
                console.log('NPP changed to:', e.target.value);
                this.currentNpp = e.target.value;
                this.applyFiltersAndNotify();
            });
        }
        
        if (this.apiChannelFilter) {
            this.apiChannelFilter.addEventListener('change', (e) => {
                this.currentChannel = e.target.value;
                this.updateTypeOptions();
                this.applyFiltersAndNotify();
            });
        }
        
        if (this.apiTypeFilter) {
            this.apiTypeFilter.addEventListener('change', (e) => {
                this.currentType = e.target.value;
                this.applyFiltersAndNotify();
            });
        }
    }
    
    applyFiltersAndNotify() {
        this.applyFilters();
        if (this.onFilterChangeCallback) {
            this.onFilterChangeCallback();
        }
    }
    
    async loadCustomers() {
        try {
            this.showLoading(true);
            const response = await fetch(this.apiUrl);
            const result = await response.json();
            
            if (result.success && result.data) {
                this.customers = result.data.map(c => ({
                    ...c,
                    kenh: this.getChannelFromType(c.loai),
                    khu_vuc: this.getAreaFromNpp(c.npp),
                    nganh_hang_list: c.nganh_hang ? c.nganh_hang.split(',').map(item => item.trim()) : []
                }));
                console.log(`Đã tải ${this.customers.length} khách hàng từ API`);
                console.log('Danh sách NPP có trong API:', [...new Set(this.customers.map(c => c.npp))]);
            } else {
                this.customers = [];
                console.warn('Không có dữ liệu từ API');
            }
        } catch (error) {
            console.error('Lỗi khi tải API:', error);
            this.customers = [];
        } finally {
            this.showLoading(false);
            if (this.onDataLoaded) this.onDataLoaded();
            this.updateChannelOptions();
            this.updateTypeOptions();
            this.updateNppOptions();
            this.updateCategoryOptions();
            this.applyFiltersAndNotify();
        }
    }
    
    showLoading(show) {
        const existing = document.querySelector('.api-loading');
        if (existing) existing.remove();
        if (show) {
            const div = document.createElement('div');
            div.className = 'api-loading';
            div.textContent = '🔄 Đang tải khách hàng thực tế...';
            document.body.appendChild(div);
        }
    }
    
    getChannelFromType(type) {
        return this.typeToChannel[type] || 'Kênh tiêu thụ trực tiếp';
    }
    
    getAreaFromNpp(npp) {
        for (const [area, npps] of Object.entries(this.areaMapping)) {
            if (npps.includes(npp)) return area;
        }
        return null;
    }
    
    updateChannelOptions() {
        if (!this.apiChannelFilter) return;
        
        const channels = new Set();
        this.customers.forEach(c => {
            if (c.kenh) channels.add(c.kenh);
        });
        
        this.apiChannelFilter.innerHTML = '<option value="all">-- Tất cả kênh --</option>';
        Array.from(channels).sort().forEach(channel => {
            const option = document.createElement('option');
            option.value = channel;
            option.textContent = channel;
            this.apiChannelFilter.appendChild(option);
        });
        
        this.apiChannelFilter.value = this.currentChannel;
    }
    
    updateTypeOptions() {
        if (!this.apiTypeFilter) return;
        
        let types = new Set();
        
        if (this.currentChannel === 'all') {
            this.customers.forEach(c => {
                if (c.loai) types.add(c.loai);
            });
        } else {
            this.customers.forEach(c => {
                if (c.kenh === this.currentChannel && c.loai) types.add(c.loai);
            });
        }
        
        this.apiTypeFilter.innerHTML = '<option value="all">-- Tất cả loại --</option>';
        Array.from(types).sort().forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            this.apiTypeFilter.appendChild(option);
        });
        
        // Giữ nguyên giá trị cũ nếu vẫn còn trong danh sách
        if (this.currentType !== 'all' && types.has(this.currentType)) {
            this.apiTypeFilter.value = this.currentType;
        } else {
            this.apiTypeFilter.value = 'all';
            this.currentType = 'all';
        }
    }
    
    updateCategoryOptions() {
        if (!this.apiCategoryCheckboxes) return;
        
        // Lấy tất cả ngành hàng duy nhất từ dữ liệu
        const allCategories = new Set();
        this.customers.forEach(c => {
            c.nganh_hang_list.forEach(cat => {
                if (cat) allCategories.add(cat);
            });
        });
        
        // Tạo HTML cho các checkbox
        let html = '';
        Array.from(allCategories).sort().forEach(cat => {
            const isChecked = this.selectedCategories.has(cat);
            html += `
                <label style="display: flex; align-items: center; gap: 5px; background: #f3e8ff; padding: 4px 10px; border-radius: 20px; cursor: pointer;">
                    <input type="checkbox" value="${this.escapeHtml(cat)}" class="api-category-checkbox-item" ${isChecked ? 'checked' : ''} style="margin: 0;">
                    <span style="font-size: 12px;">${this.escapeHtml(cat)}</span>
                </label>
            `;
        });
        
        if (html === '') {
            html = '<div style="font-size: 12px; color: #999; padding: 5px 0;">Không có dữ liệu ngành hàng</div>';
        }
        
        this.apiCategoryCheckboxes.innerHTML = html;
        
        // Gắn sự kiện cho các checkbox
        document.querySelectorAll('.api-category-checkbox-item').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectedCategories.add(e.target.value);
                } else {
                    this.selectedCategories.delete(e.target.value);
                }
                this.applyFiltersAndNotify();
            });
        });
    }
    
    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
    
    updateNppOptions() {
        if (!this.apiNppFilter) return;
        
        let npps = new Set();
        
        if (this.currentArea === 'all') {
            // Lấy tất cả NPP từ dữ liệu customers
            this.customers.forEach(c => {
                if (c.npp) npps.add(c.npp);
            });
        } else {
            // Lấy danh sách NPP theo khu vực từ mapping
            const nppsInArea = this.areaMapping[this.currentArea] || [];
            nppsInArea.forEach(npp => {
                // Chỉ thêm NPP nếu có trong dữ liệu customers
                if (this.customers.some(c => c.npp === npp)) {
                    npps.add(npp);
                }
            });
        }
        
        const nppsArray = Array.from(npps).sort();
        
        console.log(`Cập nhật NPP cho khu vực ${this.currentArea}:`, nppsArray);
        
        this.apiNppFilter.innerHTML = '<option value="all">-- Chọn NPP --</option>';
        
        if (nppsArray.length === 0) {
            this.apiNppFilter.innerHTML = '<option value="all">-- Không có NPP --</option>';
            this.apiNppFilter.disabled = true;
        } else {
            nppsArray.forEach(npp => {
                const option = document.createElement('option');
                option.value = npp;
                const count = this.customers.filter(c => c.npp === npp).length;
                option.textContent = `${npp} (${count} KH)`;
                this.apiNppFilter.appendChild(option);
            });
            this.apiNppFilter.disabled = false;
        }
        
        // Giữ nguyên giá trị cũ nếu vẫn còn trong danh sách
        if (this.currentNpp !== 'all' && nppsArray.includes(this.currentNpp)) {
            this.apiNppFilter.value = this.currentNpp;
        } else {
            this.apiNppFilter.value = 'all';
            this.currentNpp = 'all';
        }
    }
    
    applyFilters() {
        let filtered = [...this.customers];
        
        console.log('Áp dụng bộ lọc:', {
            channel: this.currentChannel,
            type: this.currentType,
            area: this.currentArea,
            npp: this.currentNpp,
            categories: Array.from(this.selectedCategories)
        });
        
        // Lọc theo kênh
        if (this.currentChannel !== 'all') {
            filtered = filtered.filter(c => c.kenh === this.currentChannel);
        }
        
        // Lọc theo loại
        if (this.currentType !== 'all') {
            filtered = filtered.filter(c => c.loai === this.currentType);
        }
        
        // Lọc theo khu vực
        if (this.currentArea !== 'all') {
            const nppsInArea = this.areaMapping[this.currentArea] || [];
            filtered = filtered.filter(c => nppsInArea.includes(c.npp));
        }
        
        // Lọc theo NPP
        if (this.currentNpp !== 'all') {
            console.log('Lọc theo NPP:', this.currentNpp);
            filtered = filtered.filter(c => c.npp === this.currentNpp);
            console.log('Số lượng sau khi lọc NPP:', filtered.length);
        }
        
        // Lọc theo ngành hàng (nếu có chọn)
        if (this.selectedCategories.size > 0) {
            filtered = filtered.filter(c => {
                return c.nganh_hang_list.some(cat => this.selectedCategories.has(cat));
            });
        }
        
        this.filteredCustomers = filtered;
        this.updateCountDisplay();
        console.log('Tổng số sau lọc:', filtered.length);
        return this.filteredCustomers;
    }
    
    updateCountDisplay() {
        if (this.apiCustomerCountSpan) {
            this.apiCustomerCountSpan.textContent = `${this.filteredCustomers.length} KH`;
            this.apiCustomerCountSpan.style.display = this.isEnabled && this.filteredCustomers.length > 0 ? 'inline-block' : 'none';
        }
    }
    
    resetFilters() {
        this.currentChannel = 'all';
        this.currentType = 'all';
        this.currentArea = 'all';
        this.currentNpp = 'all';
        this.selectedCategories.clear();
        
        if (this.apiChannelFilter) this.apiChannelFilter.value = 'all';
        if (this.apiTypeFilter) this.apiTypeFilter.value = 'all';
        if (this.apiAreaFilter) this.apiAreaFilter.value = 'all';
        
        this.updateTypeOptions();
        this.updateNppOptions();
        this.updateCategoryOptions();
        this.applyFiltersAndNotify();
    }
    
    onFilterChange() {
        // Đã được xử lý trong applyFiltersAndNotify
    }
    
    setOnFilterChange(callback) {
        this.onFilterChangeCallback = callback;
    }
    
    getFilteredCustomers() {
        return this.filteredCustomers;
    }
    
    enable() {
        this.isEnabled = true;
        const apiSection = document.getElementById('apiFiltersSection');
        if (apiSection) apiSection.style.display = 'block';
        if (this.customers.length === 0) {
            this.loadCustomers();
        } else {
            this.applyFiltersAndNotify();
        }
    }
    
    disable() {
        this.isEnabled = false;
        const apiSection = document.getElementById('apiFiltersSection');
        if (apiSection) apiSection.style.display = 'none';
        if (this.apiCustomerCountSpan) {
            this.apiCustomerCountSpan.style.display = 'none';
        }
    }
    
    setMarkers(markerCluster, mapHandler) {
        this.markerLayer = markerCluster;
        this.mapHandler = mapHandler;
    }
    
    displayMarkers() {
        if (!this.markerLayer || !this.isEnabled) return 0;
        
        const markers = [];
        this.filteredCustomers.forEach(c => {
            const lat = parseFloat(c.vi_do);
            const lng = parseFloat(c.kinh_do);
            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                markers.push(this.mapHandler.createApiMarker(lat, lng, c, '#9b59b6'));
            }
        });
        
        if (markers.length > 0) {
            this.markerLayer.addLayers(markers);
        }
        
        console.log(`Hiển thị ${markers.length} marker API`);
        return markers.length;
    }
    
    clearMarkers() {
        if (this.markerLayer && this.markerLayer.getLayers) {
            const layers = this.markerLayer.getLayers();
            layers.forEach(layer => {
                if (layer.options && layer.options.icon && layer.options.icon.options && 
                    layer.options.icon.options.className && 
                    layer.options.icon.options.className.includes('api-marker')) {
                    this.markerLayer.removeLayer(layer);
                }
            });
        }
    }
    
    isEnabledFlag() {
        return this.isEnabled;
    }
}