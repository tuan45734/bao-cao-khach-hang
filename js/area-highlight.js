// js/area-highlight.js

class AreaHighlight {
    constructor(map) {
        this.map = map;
        this.currentLayer = null;
        this.areaData = null;
        this.allAreasLayer = null;
    }

    async loadAreaData() {
        try {
            const response = await fetch('data/areas.geojson');
            if (!response.ok) {
                return null;
            }
            this.areaData = await response.json();
            return this.areaData;
        } catch (error) {
            return null;
        }
    }

    getNPPsInArea(areaCode) {
        const areaMapping = {
          'KV1': ['NPP Bảo Lâm', 'NPP Công Giang', 'NPP Cường Thịnh', 'NPP Đức Nam Tiến', 'NPP Dũng Cúc', 'NPP Lâm Hạ', 'NPP Long Liên', 'NPP Nguyên Vũ', 'NPP Thảo Nam', 'NPP Tuấn Huê', 'NPP Tuấn Yến', 'NPP Vũ Tấm'],
            'KV2': ['NPP Duy Anh', 'NPP Hùng Huệ', 'NPP Long Châm', 'NPP Ngọc Kiên', 'NPP Ngọc Thêu', 'NPP Phong Hiền', 'NPP Phương Đông', 'NPP Thành Lụa', 'NPP Tuấn Huyền'],
            'KV3': ['NPP Bảo Cường', 'NPP Tùng Phương', 'NPP Phúc Thịnh', 'NPP Hoa Việt', 'NPP Hikoji', 'NPP Long Hải', 'NPP Tân Hoa', 'NPP Tây Đô', 'NPP Thắng Lợi', 'NPP Thành Hân', 'NPP Tiến Thịnh'],
            'KV4': ['NPP Ánh Thu', 'NPP Đức Oanh', 'NPP Dương Minh', 'NPP Dũng Béo', 'NPP Hưng Thịnh', 'NPP Ngọc Phúc', 'NPP Nguyễn Đình Hân', 'NPP Tân Thúy', 'NPP Thăng Hương', 'NPP Thảo Thắng'],
            'KV5': ['NPP Đồng Lợi', 'NPP Hải Hằng', 'NPP Hiền Cường', 'NPP Hoàng Minh', 'NPP Oanh Định', 'NPP Sơn Lâm', 'NPP Thái Hoà', 'NPP Thảo Xuân', 'NPP Duy Khoa', 'NPP Tuấn Vân', 'NPP Vũ Đức Nam'],
            'KV6': ['NPP Anh Minh HT', 'NPP Hà Thanh', 'NPP Hồng Đức', 'NPP Linh Trang', 'NPP Mạnh Hà 1', 'NPP Mạnh Hà 2', 'NPP Minh Châu', 'NPP Minh Lộc', 'NPP Nhung Tùng', 'NPP Phương Hà', 'NPP Tân Bích An', 'NPP Thanh Bình', 'NPP Thành Thanh', 'NPP Thông Thơm', 'NPP Trường Hằng']
     };
        return areaMapping[areaCode] || [];
    }

    findFeatureByNPP(nppName) {
        if (!this.areaData || !this.areaData.features) return null;
        return this.areaData.features.find(feature => {
            return feature.properties && feature.properties.npp === nppName;
        });
    }

    findFeaturesByArea(areaCode) {
        if (!this.areaData || !this.areaData.features) return [];
        const nppsInArea = this.getNPPsInArea(areaCode);
        return this.areaData.features.filter(feature => {
            return feature.properties && nppsInArea.includes(feature.properties.npp);
        });
    }

    showAllAreas() {
        this.clearHighlight();
        
        if (!this.areaData || !this.areaData.features) {
            return false;
        }
        
        const validFeatures = this.areaData.features.filter(feature => {
            return feature.geometry && 
                   feature.geometry.coordinates && 
                   feature.geometry.coordinates.length > 0;
        });
        
        if (validFeatures.length === 0) return false;
        
        const allAreasStyle = {
            color: '#3b82f6',
            weight: 1.5,
            opacity: 0.6,
            fillOpacity: 0,
            dashArray: '4, 4'
        };
        
        this.allAreasLayer = L.geoJSON(this.areaData, {
            style: allAreasStyle,
            onEachFeature: (feature, layer) => {
                const nppName = feature.properties?.npp || 'Không xác định';
                layer.bindPopup(`<div style="font-size: 12px;"><strong>${nppName}</strong></div>`);
            }
        }).addTo(this.map);
        
        this.currentLayer = this.allAreasLayer;
        return true;
    }

    highlightByNPP(nppName, zoomToFit = true) {
        this.clearHighlight();
        
        const feature = this.findFeatureByNPP(nppName);
        if (!feature) {
            return false;
        }
        
        const selectedStyle = {
            color: '#ff4444',
            weight: 3.5,
            opacity: 1,
            fillOpacity: 0,
            dashArray: null
        };
        
        this.currentLayer = L.geoJSON(feature, {
            style: selectedStyle,
            onEachFeature: (f, layer) => {
                layer.bindPopup(`<div style="font-size: 13px; font-weight: bold; color: #c0392b;">📍 ${f.properties.npp}</div>`);
            }
        }).addTo(this.map);
        
        if (zoomToFit && this.currentLayer.getBounds().isValid()) {
            this.map.fitBounds(this.currentLayer.getBounds().pad(0.1));
        }
        
        return true;
    }

    highlightByArea(areaCode, zoomToFit = true) {
        this.clearHighlight();
        
        const features = this.findFeaturesByArea(areaCode);
        if (features.length === 0) {
            return false;
        }
        
        const areaStyle = {
            color: '#ff8800',
            weight: 3,
            opacity: 0.9,
            fillOpacity: 0,
            dashArray: null
        };
        
        const layers = [];
        features.forEach(feature => {
            if (feature.geometry && feature.geometry.coordinates && feature.geometry.coordinates.length > 0) {
                const layer = L.geoJSON(feature, {
                    style: areaStyle,
                    onEachFeature: (f, l) => {
                        l.bindPopup(`<div style="font-size: 12px;"><strong>${areaCode}</strong><br/>${f.properties.npp}</div>`);
                    }
                });
                layers.push(layer);
            }
        });
        
        if (layers.length > 0) {
            this.currentLayer = L.featureGroup(layers).addTo(this.map);
            
            if (zoomToFit && this.currentLayer.getBounds().isValid()) {
                this.map.fitBounds(this.currentLayer.getBounds().pad(0.1));
            }
            
            return true;
        }
        
        return false;
    }

    clearHighlight() {
        if (this.currentLayer) {
            this.map.removeLayer(this.currentLayer);
            this.currentLayer = null;
        }
        this.allAreasLayer = null;
    }

    isHighlighting() {
        return this.currentLayer !== null;
    }
}