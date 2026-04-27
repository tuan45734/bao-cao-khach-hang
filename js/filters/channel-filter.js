// js/filters/channel-filter.js - Bộ lọc kênh và loại

class ChannelFilter {
    constructor(channelElementId, typeElementId, customers) {
        this.channelElement = document.getElementById(channelElementId);
        this.typeElement = document.getElementById(typeElementId);
        this.customers = customers;
        this.currentChannel = 'all';
        this.currentType = 'all';
        this.onChangeCallback = null;
        
        // Mapping kênh -> loại
        this.channelTypeMapping = {
            "Kênh siêu thị": ["Đại siêu thị", "Siêu Thị Lớn", "Siêu thị vừa và nhỏ"],
            "Kênh sỉ": ["Khách sỉ lớn", "Khách sỉ vừa và nhỏ"],
            "Kênh trường học": ["Khách trường học"],
            "Kênh tiêu thụ trực tiếp": ["Cửa hàng tạp hóa", "Khách lẻ tiêu thụ trực tiếp"],
            "Kênh horeca": ["Kênh horeca"],
            "Kênh công nghiệp": ["Kênh công nghiệp"]
        };
        
        this.initEvent();
        this.initOptions();
    }
    
    initEvent() {
        if (this.channelElement) {
            this.channelElement.addEventListener('change', () => {
                this.currentChannel = this.channelElement.value;
                this.updateTypeOptions();
                this.resetType();
                if (this.onChangeCallback) this.onChangeCallback();
            });
        }
        if (this.typeElement) {
            this.typeElement.addEventListener('change', () => {
                this.currentType = this.typeElement.value;
                if (this.onChangeCallback) this.onChangeCallback();
            });
        }
    }
    
    updateTypeOptions() {
        if (!this.typeElement) return;
        
        const types = this.channelTypeMapping[this.currentChannel] || [];
        this.typeElement.innerHTML = '<option value="all">-- Tất cả loại --</option>';
        
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            this.typeElement.appendChild(option);
        });
        
        this.typeElement.disabled = (types.length === 0);
    }
    
    resetType() {
        if (this.typeElement) {
            this.typeElement.value = 'all';
            this.currentType = 'all';
        }
    }
    
    applyFilter(customers) {
        let filtered = [...customers];
        
        if (this.currentChannel !== 'all') {
            filtered = filtered.filter(c => c.kenh === this.currentChannel);
        }
        
        if (this.currentType !== 'all') {
            filtered = filtered.filter(c => c.loai === this.currentType);
        }
        
        return filtered;
    }
    
    getChannelValue() { return this.currentChannel; }
    getTypeValue() { return this.currentType; }
    
    reset() {
        if (this.channelElement) {
            this.channelElement.value = 'all';
            this.currentChannel = 'all';
        }
        this.updateTypeOptions();
        if (this.typeElement) {
            this.typeElement.value = 'all';
            this.currentType = 'all';
        }
    }
    
    initOptions() {
        if (!this.channelElement) return;
        
        const channels = Object.keys(this.channelTypeMapping);
        this.channelElement.innerHTML = '<option value="all">-- Tất cả kênh --</option>';
        
        channels.forEach(channel => {
            const option = document.createElement('option');
            option.value = channel;
            option.textContent = channel;
            this.channelElement.appendChild(option);
        });
        
        this.updateTypeOptions();
    }
    
    setOnChangeCallback(callback) { this.onChangeCallback = callback; }
}