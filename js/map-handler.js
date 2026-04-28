// js/map-handler.js
class MapHandler {
    constructor(mapElementId) {
        this.map = null;
        this.markerCluster = null;
        this.mapElementId = mapElementId;
    }

    initMap() {
        this.map = L.map(this.mapElementId, {
            zoomControl: true,
            attributionControl: false,
            maxZoom: 22
        }).setView([21.0285, 105.8542], 11);
        
        // Layer ảnh vệ tinh Google (hỗ trợ zoom lên 22)
        L.tileLayer('http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}', {
            attribution: '',
            maxZoom: 22,
            minZoom: 5
        }).addTo(this.map);
        
        // Layer hiển thị tên tỉnh, đường phố, địa danh
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
            attribution: '',
            maxZoom: 22,
            minZoom: 5,
            opacity: 0.9,
            subdomains: 'abcd'
        }).addTo(this.map);
        
        this.markerCluster = L.markerClusterGroup({
            maxClusterRadius: 100,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            disableClusteringAtZoom: 16,
            iconCreateFunction: function(cluster) {
                const count = cluster.getChildCount();
                let size = 40, fontSize = 12, bgColor = '#ff6600';
                if (count >= 100) { size = 50; fontSize = 16; bgColor = '#ff6600'; }
                else if (count >= 50) { size = 46; fontSize = 14; bgColor = '#ff6600'; }
                else if (count >= 20) { size = 44; fontSize = 13; bgColor = '#ff6600'; }
                else if (count >= 10) { size = 42; fontSize = 12; bgColor = '#ff6600'; }
                return L.divIcon({
                    html: `<div style="background-color: ${bgColor}; width: ${size}px; height: ${size}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: ${fontSize}px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${count}</div>`,
                    className: 'marker-cluster-custom',
                    iconSize: L.point(size, size)
                });
            }
        });
        
        this.markerCluster.addTo(this.map);
    }

    clearMarkers() {
        if (this.markerCluster) {
            this.markerCluster.clearLayers();
        }
    }

    createMarker(lat, lng, customerData = null, color = '#E53E3E') {
        const icon = L.divIcon({
            className: 'simple-marker',
            html: `<div style="width: 10px; height: 10px; background-color: ${color}; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 2px rgba(0,0,0,0.4);"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });
        
        const marker = L.marker([lat, lng], { icon: icon });
        
        if (customerData) {
            // Tạo nội dung popup có ảnh
            let imageHtml = '';
            if (customerData.anh && customerData.anh !== '') {
                imageHtml = `
                    <div style="margin-top: 8px; text-align: center;">
                        <img src="${customerData.anh}" 
                             style="max-width: 100%; max-height: 700px; border-radius: 8px; object-fit: cover; cursor: pointer;"
                             onclick="window.open('${customerData.anh}', '_blank')"
                             onerror="this.style.display='none'">
                        <div style="margin-top: 4px; font-size: 10px; color: #6c757d;">🔍 Click ảnh để xem lớn</div>
                    </div>
                `;
            }
            
            marker.bindPopup(`
                <div style="font-size: 12px; min-width: 200px; max-width: 260px;">
                    <strong style="font-size: 14px;">🏪 ${customerData.ma_kh || ''}</strong><br/>
                    🏢 ${customerData.npp || 'N/A'}<br/>
                    👤 ${customerData.ten_nv || 'N/A'}<br/>
                    📅 ${customerData.ngay_tao || 'N/A'}<br/>
                    📺 ${customerData.kenh || 'N/A'}<br/>
                    🏷️ ${customerData.loai || 'N/A'}
                    ${imageHtml}
                </div>
            `);
        }
        
        return marker;
    }


displayCustomersByGroups(yellowCustomers, redCustomers, blueCustomers, fromCount, toCount, hasBothMonths) {
    this.clearMarkers();
    const markers = [];
    
    const addMarkers = (customers, color) => {
        customers.forEach(c => {
            const lat = parseFloat(c.vi_do);
            const lng = parseFloat(c.kinh_do);
            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                markers.push(this.createMarker(lat, lng, c, color));
            }
        });
    };
    
    addMarkers(yellowCustomers, '#FFD700');
    addMarkers(redCustomers, '#E53E3E');
    addMarkers(blueCustomers, '#3B82F6');
    
    if (markers.length > 0) {
        this.markerCluster.addLayers(markers);
        const bounds = [];
        markers.forEach(m => { const ll = m.getLatLng(); if (ll) bounds.push(ll); });
        if (bounds.length) this.map.fitBounds(L.latLngBounds(bounds).pad(0.1));
    }
    
    // Không cập nhật counter ở đây nữa, để main.js xử lý
}

displayAllRedCustomers(customers, totalCount) {
    this.clearMarkers();
    const markers = [];
    customers.forEach(c => {
        const lat = parseFloat(c.vi_do);
        const lng = parseFloat(c.kinh_do);
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            markers.push(this.createMarker(lat, lng, c, '#E53E3E'));
        }
    });
    if (markers.length > 0) {
        this.markerCluster.addLayers(markers);
        const bounds = [];
        markers.forEach(m => { const ll = m.getLatLng(); if (ll) bounds.push(ll); });
        if (bounds.length) this.map.fitBounds(L.latLngBounds(bounds).pad(0.1));
    }
    // Không cập nhật counter ở đây nữa
}

    addMarkerStyles() {
        if (!document.querySelector('#marker-styles')) {
            const style = document.createElement('style');
            style.id = 'marker-styles';
            style.textContent = `
                .simple-marker { background: transparent !important; border: none !important; }
                .leaflet-control-attribution { display: none !important; }
                .marker-cluster-custom { background: transparent !important; }
                .marker-cluster-custom div:hover { transform: scale(1.05); transition: transform 0.2s; }
                .leaflet-popup-content {
                    min-width: 220px !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
}