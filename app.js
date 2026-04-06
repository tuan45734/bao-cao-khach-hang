// Khởi tạo bản đồ
let map;
let markers = [];
let currentFilterNPP = '';
let selectedEmployees = [];
let hasData = false;

// Marker icon màu sắc
function getMarkerIcon(color) {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5); transition: transform 0.2s;"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [0, -9]
    });
}

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    loadRegionFilter();
    
    // Nút xóa bộ lọc
    document.getElementById('resetFilterBtn').addEventListener('click', function() {
        resetFilters();
    });
    
    // Nút chọn tất cả
    document.getElementById('selectAllBtn').addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('#employeeCheckboxGroup input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = true;
        });
        updateSelectedEmployees();
        loadMarkers();
        updateStatsInfo();
    });
    
    // Nút bỏ chọn tất cả
    document.getElementById('unselectAllBtn').addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('#employeeCheckboxGroup input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = false;
        });
        updateSelectedEmployees();
        loadMarkers();
        updateStatsInfo();
    });
});

// Khởi tạo bản đồ
function initMap() {
    map = L.map('map').setView([21.0285, 105.8542], 11);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);
}

// Xóa tất cả markers
function clearMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
}

// Reset filters
function resetFilters() {
    currentFilterNPP = '';
    selectedEmployees = [];
    hasData = false;
    
    document.getElementById('regionFilter').value = '';
    document.getElementById('resetFilterBtn').style.display = 'none';
    document.getElementById('statsInfo').innerHTML = '';
    document.getElementById('legendSummary').style.display = 'none';
    document.getElementById('employeePanel').style.display = 'none';
    document.getElementById('welcomeMessage').style.display = 'block';
    
    clearMarkers();
    map.setView([21.0285, 105.8542], 11);
}

// Cập nhật danh sách nhân viên đã chọn
function updateSelectedEmployees() {
    const checkboxes = document.querySelectorAll('#employeeCheckboxGroup input[type="checkbox"]:checked');
    selectedEmployees = Array.from(checkboxes).map(cb => cb.value);
}

// Tạo checkbox cho nhân viên
function createEmployeeCheckboxes(npp) {
    const employees = getEmployeesByNPP(npp);
    const container = document.getElementById('employeeCheckboxGroup');
    
    container.innerHTML = '';
    
    employees.forEach(emp => {
        const count = customersData.filter(c => c.npp === npp && c.nhan_vien === emp).length;
        const color = getEmployeeColor(npp, emp);
        
        const label = document.createElement('label');
        label.className = 'employee-checkbox';
        label.style.borderLeftColor = color;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = emp;
        checkbox.checked = selectedEmployees.includes(emp);
        
        checkbox.addEventListener('change', function() {
            updateSelectedEmployees();
            loadMarkers();
            updateStatsInfo();
            updateLegendSummary();
        });
        
        const span = document.createElement('span');
        span.innerHTML = `<span class="employee-color" style="background-color: ${color};"></span>
                         <span class="employee-name">${emp}</span>
                         <span class="employee-count">(${count})</span>`;
        
        label.appendChild(checkbox);
        label.appendChild(span);
        container.appendChild(label);
    });
}

// Cập nhật thông tin thống kê
function updateStatsInfo() {
    const statsInfo = document.getElementById('statsInfo');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const legendSummary = document.getElementById('legendSummary');
    
    if (!hasData) {
        statsInfo.innerHTML = '';
        welcomeMessage.style.display = 'block';
        legendSummary.style.display = 'none';
        return;
    }
    
    welcomeMessage.style.display = 'none';
    legendSummary.style.display = 'block';
    
    const filteredCustomers = filterCustomersByBoth(currentFilterNPP, selectedEmployees);
    const totalNPP = customersData.filter(c => c.npp === currentFilterNPP).length;
    
    if (selectedEmployees.length === 0) {
        statsInfo.innerHTML = `📊 ${currentFilterNPP}: <strong>${filteredCustomers.length}</strong> / ${totalNPP} điểm bán`;
    } else if (selectedEmployees.length === 1) {
        statsInfo.innerHTML = `📊 ${currentFilterNPP} - ${selectedEmployees[0]}: <strong>${filteredCustomers.length}</strong> điểm bán`;
    } else {
        statsInfo.innerHTML = `📊 ${currentFilterNPP} - ${selectedEmployees.length} nhân viên: <strong>${filteredCustomers.length}</strong> / ${totalNPP} điểm bán`;
    }
}

// Cập nhật legend summary
function updateLegendSummary() {
    const legendSummary = document.getElementById('legendSummary');
    
    if (!hasData || !currentFilterNPP) {
        legendSummary.style.display = 'none';
        return;
    }
    
    const employees = getEmployeesByNPP(currentFilterNPP);
    const filteredEmployees = selectedEmployees.length > 0 ? selectedEmployees : employees;
    
    let html = '<div class="legend-summary-inner">';
    html += '<div class="summary-group"><strong>🎨 Màu sắc theo nhân viên:</strong>';
    
    filteredEmployees.forEach(emp => {
        const color = getEmployeeColor(currentFilterNPP, emp);
        const count = customersData.filter(c => c.npp === currentFilterNPP && c.nhan_vien === emp).length;
        const isSelected = selectedEmployees.includes(emp) || selectedEmployees.length === 0;
        
        if (isSelected) {
            html += `
                <div class="summary-item" onclick="toggleEmployee('${emp}')" style="cursor: pointer;">
                    <span class="summary-color" style="background-color: ${color};"></span>
                    <span class="summary-name">${emp}</span>
                    <span class="summary-count">${count}</span>
                </div>
            `;
        }
    });
    
    html += '</div></div>';
    legendSummary.innerHTML = html;
    legendSummary.style.display = 'block';
}

// Toggle chọn nhân viên
window.toggleEmployee = function(employee) {
    const checkbox = document.querySelector(`#employeeCheckboxGroup input[value="${employee}"]`);
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
        updateSelectedEmployees();
        loadMarkers();
        updateStatsInfo();
        updateLegendSummary();
    }
};

// Load bộ lọc NPP
function loadRegionFilter() {
    const stats = getStatsByRegion();
    const filterSelect = document.getElementById('regionFilter');
    
    // Thêm các option NPP
    for (const [npp, data] of Object.entries(stats).sort()) {
        const option = document.createElement('option');
        option.value = npp;
        option.textContent = `${npp} (${data.count} điểm)`;
        filterSelect.appendChild(option);
    }
    
    filterSelect.addEventListener('change', function(e) {
        const selectedNPP = e.target.value;
        
        if (selectedNPP && selectedNPP !== '') {
            currentFilterNPP = selectedNPP;
            selectedEmployees = [];
            hasData = true;
            
            // Hiển thị panel nhân viên
            document.getElementById('employeePanel').style.display = 'block';
            createEmployeeCheckboxes(selectedNPP);
            
            loadMarkers();
            updateStatsInfo();
            updateLegendSummary();
            document.getElementById('resetFilterBtn').style.display = 'block';
        } else {
            resetFilters();
        }
    });
}

// Load markers lên bản đồ
function loadMarkers() {
    clearMarkers();
    
    if (!hasData || !currentFilterNPP) {
        return;
    }
    
    // Lọc dữ liệu
    const filteredCustomers = filterCustomersByBoth(currentFilterNPP, selectedEmployees);
    
    if (filteredCustomers.length === 0) {
        const noDataMsg = L.popup()
            .setLatLng([21.0285, 105.8542])
            .setContent('<div style="padding: 10px;">⚠️ Không có dữ liệu phù hợp với bộ lọc!</div>')
            .openOn(map);
        
        setTimeout(() => {
            map.closePopup();
        }, 2000);
        
        return;
    }
    
    // Thêm markers mới
    filteredCustomers.forEach(customer => {
        const color = getEmployeeColor(customer.npp, customer.nhan_vien);
        
        const popupContent = `
            <div class="custom-popup" style="min-width: 260px; padding: 8px;">
                <h4 style="margin: 0 0 10px 0; color: ${color}; border-left: 4px solid ${color}; padding-left: 10px;">
                    🚚 ${customer.ma_tuyen}
                </h4>
                <div style="margin-left: 10px;">
                    <p style="margin: 5px 0;">
                        <strong>🏢 NPP:</strong> 
                        <span style="font-weight: bold;">${customer.npp}</span>
                    </p>
                    <p style="margin: 5px 0;">
                        <strong>👤 Nhân viên:</strong> 
                        <span style="color: ${color}; font-weight: bold;">${customer.nhan_vien}</span>
                    </p>
                    <hr style="margin: 8px 0; border-color: #eee;">
                    <p style="margin: 5px 0; font-size: 11px; color: #999;">
                        📍 ${customer.lat.toFixed(6)}, ${customer.lng.toFixed(6)}
                    </p>
                </div>
            </div>
        `;
        
        const marker = L.marker([customer.lat, customer.lng], {
            icon: getMarkerIcon(color)
        }).bindPopup(popupContent);
        
        marker.addTo(map);
        markers.push(marker);
    });
    
    // Tự động zoom phù hợp
    if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.3));
    }
    
    console.log(`Đã load ${markers.length} markers cho NPP: ${currentFilterNPP}, Nhân viên: ${selectedEmployees.length}`);
}