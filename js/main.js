// js/main.js
let mapHandler, areaHighlight;
let currentCustomers = [];
let dateRangeFilter, channelFilter, areaFilter, nppFilter, employeeFilter, categoryFilter;
let currentUserPermission = null;

const userPermissions = {
    'KV1ADZ': 'KV1',
    'KV2ZAC': 'KV2',
    'KV3CCC': 'KV3',
    'KV4YXY': 'KV4',
    'KV5XXZ': 'KV5',
    'KV6XBC': 'KV6',
    'ADZAD': 'ALL'
};

function setupLogin() {
    const loginBtn = document.getElementById('loginBtn');
    const loginCode = document.getElementById('loginCode');
    const loginError = document.getElementById('loginError');
    
    loginBtn.addEventListener('click', () => {
        const code = loginCode.value.trim().toUpperCase();
        
        if (userPermissions[code]) {
            currentUserPermission = userPermissions[code];
            loginError.textContent = '';
            
            document.getElementById('loginOverlay').style.display = 'none';
            document.getElementById('toggleSidebarBtn').style.display = 'block';
            document.getElementById('customerCounter').style.display = 'block';
            document.getElementById('mainContainer').style.display = 'flex';
            
            initApp();
        } else {
            loginError.textContent = '❌ Mã truy cập không hợp lệ! Vui lòng thử lại.';
            loginCode.value = '';
            loginCode.focus();
        }
    });
    
    loginCode.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loginBtn.click();
        }
    });
}

function updateCounterDisplay(fromCount, toCount, hasBothMonths, fromMonth, toMonth, totalCount = null, redCount = null, blueCount = null, yellowCount = null) {
    const counterSpan = document.getElementById('customerCount');
    if (!counterSpan) return;
    
    const getMonthLabel = (monthKey) => {
        if (!monthKey) return '';
        const parts = monthKey.split('-');
        return `T${parts[0]}`;
    };
    
    if (redCount !== null && blueCount !== null && yellowCount !== null && hasBothMonths && fromMonth && toMonth) {
        const fromLabel = getMonthLabel(fromMonth);
        const toLabel = getMonthLabel(toMonth);
        counterSpan.textContent = `${fromLabel}: ${fromCount} | ${toLabel}: ${toCount} | 🔴 ${redCount} | 🔵 ${blueCount} | 🟡 ${yellowCount}`;
    }
    else if (redCount !== null && blueCount !== null && hasBothMonths && fromMonth && toMonth) {
        const fromLabel = getMonthLabel(fromMonth);
        const toLabel = getMonthLabel(toMonth);
        counterSpan.textContent = `${fromLabel}: ${fromCount} | ${toLabel}: ${toCount} | 🔴 ${redCount} | 🔵 ${blueCount}`;
    }
    else if (hasBothMonths && fromMonth && toMonth) {
        const fromLabel = getMonthLabel(fromMonth);
        const toLabel = getMonthLabel(toMonth);
        counterSpan.textContent = `${fromLabel}: ${fromCount} | ${toLabel}: ${toCount}`;
    } else if (fromMonth && !toMonth) {
        const fromLabel = getMonthLabel(fromMonth);
        counterSpan.textContent = `${fromLabel}: ${fromCount}`;
    } else if (toMonth && !fromMonth) {
        const toLabel = getMonthLabel(toMonth);
        counterSpan.textContent = `${toLabel}: ${toCount}`;
    } else if (totalCount !== null) {
        counterSpan.textContent = `${totalCount}`;
    } else {
        counterSpan.textContent = `0`;
    }
}

function updateAreaCountDisplay() {
    const areaSelect = document.getElementById('areaFilter');
    const areaCountSpan = document.getElementById('areaCount');
    if (!areaSelect || !areaCountSpan) return;
    
    const selectedArea = areaSelect.value;
    let count = 0;
    
    const areaMapping = {
        'KV1': ['NPP Bảo Lâm', 'NPP Công Giang', 'NPP Cường Thịnh', 'NPP Đức Nam Tiến', 'NPP Dũng Cúc', 'NPP Lâm Hạ', 'NPP Long Liên', 'NPP Nguyên Vũ', 'NPP Thảo Nam', 'NPP Tuấn Huê', 'NPP Tuấn Yến', 'NPP Vũ Tấm'],
        'KV2': ['NPP Duy Anh', 'NPP Hoa Việt', 'NPP Hùng Huệ', 'NPP Long Châm', 'NPP Ngọc Kiên', 'NPP Ngọc Thêu', 'NPP Phong Hiền', 'NPP Phúc Thịnh', 'NPP Phương Đông', 'NPP Thành Lụa', 'NPP Tuấn Huyền'],
        'KV3': ['NPP Bảo Cường', 'NPP Hikoji', 'NPP Long Hải', 'NPP Tân Hoa', 'NPP Tây Đô', 'NPP Thắng Lợi', 'NPP Thành Hân', 'NPP Tiến Thịnh'],
        'KV4': ['NPP Ánh Thu', 'NPP Đức Oanh', 'NPP Dương Minh', 'NPP Dũng Béo', 'NPP Hưng Thịnh', 'NPP Ngọc Phúc', 'NPP Nguyễn Đình Hân', 'NPP Tân Thúy', 'NPP Thăng Hương', 'NPP Thảo Thắng', 'NPP Tùng Phương'],
        'KV5': ['NPP Đồng Lợi', 'NPP Hải Hằng', 'NPP Hiền Cường', 'NPP Hoàng Minh', 'NPP Oanh Định', 'NPP Sơn Lâm', 'NPP Thái Hoà', 'NPP Thảo Xuân', 'NPP Duy Khoa', 'NPP Tuấn Vân', 'NPP Vũ Đức Nam'],
        'KV6': ['NPP Anh Minh HT', 'NPP Hà Thanh', 'NPP Hồng Đức', 'NPP Linh Trang', 'NPP Mạnh Hà 1', 'NPP Mạnh Hà 2', 'NPP Minh Châu', 'NPP Minh Lộc', 'NPP Nhung Tùng', 'NPP Phương Hà', 'NPP Tân Bích An', 'NPP Thanh Bình', 'NPP Thành Thanh', 'NPP Thông Thơm', 'NPP Trường Hằng']
    };
    
    if (selectedArea === 'all') {
        if (currentUserPermission && currentUserPermission !== 'ALL') {
            const nppsInArea = areaMapping[currentUserPermission] || [];
            count = currentCustomers.filter(c => nppsInArea.includes(c.npp)).length;
        } else {
            count = currentCustomers.length;
        }
        areaCountSpan.textContent = `(${count} KH)`;
    } else {
        const nppsInArea = areaMapping[selectedArea] || [];
        count = currentCustomers.filter(c => nppsInArea.includes(c.npp)).length;
        areaCountSpan.textContent = `(${count} KH)`;
    }
}

async function loadCategoryData(monthKey) {
    return new Promise((resolve) => {
        const mappingName = `categoryMapping_${monthKey.replace('-', '_')}`;
        if (window[mappingName]) { resolve(); return; }
        const script = document.createElement('script');
        script.src = `data/nh-${monthKey}.js`;
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.head.appendChild(script);
    });
}

async function initCategoryData() {
    const months = ['1-2026', '2-2026', '3-2026', '4-2026'];
    for (const month of months) await loadCategoryData(month);
}

function getCustomersByMonthAndCategory(monthKey, categoryName) {
    if (!monthKey || !categoryName || categoryName === 'all') return [];
    const mappingName = `categoryMapping_${monthKey.replace('-', '_')}`;
    const categoryMap = window[mappingName] || {};
    return categoryMap[categoryName] || [];
}

function getCustomersByAllCategory(categoryName) {
    if (!categoryName || categoryName === 'all') return [];
    const categoryMap = window.categoryMapping_all || {};
    return categoryMap[categoryName] || [];
}

function getCustomersByArea(areaCode) {
    if (!areaCode || areaCode === 'ALL') return currentCustomers;
    
    const areaMapping = {
        'KV1': ['NPP Bảo Lâm', 'NPP Công Giang', 'NPP Cường Thịnh', 'NPP Đức Nam Tiến', 'NPP Dũng Cúc', 'NPP Lâm Hạ', 'NPP Long Liên', 'NPP Nguyên Vũ', 'NPP Thảo Nam', 'NPP Tuấn Huê', 'NPP Tuấn Yến', 'NPP Vũ Tấm'],
        'KV2': ['NPP Duy Anh', 'NPP Hoa Việt', 'NPP Hùng Huệ', 'NPP Long Châm', 'NPP Ngọc Kiên', 'NPP Ngọc Thêu', 'NPP Phong Hiền', 'NPP Phúc Thịnh', 'NPP Phương Đông', 'NPP Thành Lụa', 'NPP Tuấn Huyền'],
        'KV3': ['NPP Bảo Cường', 'NPP Hikoji', 'NPP Long Hải', 'NPP Tân Hoa', 'NPP Tây Đô', 'NPP Thắng Lợi', 'NPP Thành Hân', 'NPP Tiến Thịnh'],
        'KV4': ['NPP Ánh Thu', 'NPP Đức Oanh', 'NPP Dương Minh', 'NPP Dũng Béo', 'NPP Hưng Thịnh', 'NPP Ngọc Phúc', 'NPP Nguyễn Đình Hân', 'NPP Tân Thúy', 'NPP Thăng Hương', 'NPP Thảo Thắng', 'NPP Tùng Phương'],
        'KV5': ['NPP Đồng Lợi', 'NPP Hải Hằng', 'NPP Hiền Cường', 'NPP Hoàng Minh', 'NPP Oanh Định', 'NPP Sơn Lâm', 'NPP Thái Hoà', 'NPP Thảo Xuân', 'NPP Duy Khoa', 'NPP Tuấn Vân', 'NPP Vũ Đức Nam'],
        'KV6': ['NPP Anh Minh HT', 'NPP Hà Thanh', 'NPP Hồng Đức', 'NPP Linh Trang', 'NPP Mạnh Hà 1', 'NPP Mạnh Hà 2', 'NPP Minh Châu', 'NPP Minh Lộc', 'NPP Nhung Tùng', 'NPP Phương Hà', 'NPP Tân Bích An', 'NPP Thanh Bình', 'NPP Thành Thanh', 'NPP Thông Thơm', 'NPP Trường Hằng']
    };
    
    const nppsInArea = areaMapping[areaCode] || [];
    return currentCustomers.filter(c => nppsInArea.includes(c.npp));
}

function applyOtherFilters(customers) {
    let result = [...customers];
    const areaValue = areaFilter.getValue();
    const nppValue = nppFilter.getValue();
    const employeeValue = employeeFilter.getValue();
    const channelValue = channelFilter.getChannelValue();
    const typeValue = channelFilter.getTypeValue();
    
    if (areaValue !== 'all') result = areaFilter.applyFilter(result);
    if (nppValue !== 'all') result = nppFilter.applyFilter(result);
    if (employeeValue !== 'all') result = employeeFilter.applyFilter(result);
    if (channelValue !== 'all' || typeValue !== 'all') result = channelFilter.applyFilter(result);
    
    return result;
}

function applyFilters() {
    const fromMonth = dateRangeFilter.getFromValue();
    const toMonth = dateRangeFilter.getToValue();
    const selectedCategory = categoryFilter.getValue();
    
    let baseCustomers = currentCustomers;
    if (currentUserPermission && currentUserPermission !== 'ALL') {
        baseCustomers = getCustomersByArea(currentUserPermission);
    }
    
    const allFilteredCustomers = applyOtherFilters(baseCustomers);
    const allFilteredSet = new Set(allFilteredCustomers.map(c => c.ma_kh));
    
    // Không chọn tháng nào
    if (!fromMonth && !toMonth) {
        if (selectedCategory !== 'all') {
            const categoryCustomerCodes = getCustomersByAllCategory(selectedCategory);
            const categoryCustomers = categoryCustomerCodes
                .map(code => baseCustomers.find(c => c.ma_kh === code))
                .filter(c => c);
            const finalCustomers = applyOtherFilters(categoryCustomers);
            if (finalCustomers.length > 0) {
                mapHandler.displayAllRedCustomers(finalCustomers, finalCustomers.length);
                updateCounterDisplay(null, null, false, null, null, finalCustomers.length);
            } else {
                mapHandler.clearMarkers();
                updateCounterDisplay(null, null, false, null, null, 0);
            }
        } else {
            if (allFilteredCustomers.length > 0) {
                mapHandler.displayAllRedCustomers(allFilteredCustomers, allFilteredCustomers.length);
                updateCounterDisplay(null, null, false, null, null, allFilteredCustomers.length);
            } else {
                mapHandler.clearMarkers();
                updateCounterDisplay(null, null, false, null, null, 0);
            }
        }
        updateAreaCountDisplay();
        return;
    }
    
    // Chọn 1 tháng hoặc 2 tháng
    if (fromMonth && toMonth) {
        const fromCustomers = dateRangeFilter.getCustomersUptoMonth(fromMonth);
        const toCustomers = dateRangeFilter.getCustomersUptoMonth(toMonth);
        
        let filteredFrom = fromCustomers.filter(c => allFilteredSet.has(c.ma_kh));
        let filteredTo = toCustomers.filter(c => allFilteredSet.has(c.ma_kh));
        
        const fromSet = new Set(filteredFrom.map(c => c.ma_kh));
        const toSet = new Set(filteredTo.map(c => c.ma_kh));
        
        // Phân loại khách hàng theo màu
        let yellowCustomers = [], redCustomers = [], blueCustomers = [];
        
        if (selectedCategory !== 'all') {
            // Có chọn ngành hàng: lấy theo ngành
            const fromCustomerCodes = getCustomersByMonthAndCategory(fromMonth, selectedCategory);
            const toCustomerCodes = getCustomersByMonthAndCategory(toMonth, selectedCategory);
            const fromCodeSet = new Set(fromCustomerCodes);
            const toCodeSet = new Set(toCustomerCodes);
            
            const onlyFromCodes = [...fromCodeSet].filter(code => !toCodeSet.has(code));
            const onlyToCodes = [...toCodeSet].filter(code => !fromCodeSet.has(code));
            const bothCodes = [...fromCodeSet].filter(code => toCodeSet.has(code));
            
            const getCustomerByCode = (code) => baseCustomers.find(c => c.ma_kh === code);
            
            yellowCustomers = bothCodes.map(code => getCustomerByCode(code)).filter(c => c);
            redCustomers = onlyFromCodes.map(code => getCustomerByCode(code)).filter(c => c);
            blueCustomers = onlyToCodes.map(code => getCustomerByCode(code)).filter(c => c);
            
            // Áp dụng các bộ lọc khác
            yellowCustomers = applyOtherFilters(yellowCustomers);
            redCustomers = applyOtherFilters(redCustomers);
            blueCustomers = applyOtherFilters(blueCustomers);
            
        } else {
            // Không chọn ngành hàng: lấy tất cả khách hàng theo thời gian
            redCustomers = filteredFrom.filter(c => !toSet.has(c.ma_kh));
            blueCustomers = filteredTo.filter(c => !fromSet.has(c.ma_kh));
            yellowCustomers = filteredFrom.filter(c => toSet.has(c.ma_kh));
            
            // Áp dụng các bộ lọc khác (đã áp dụng ở trên qua filteredFrom, filteredTo)
        }
        
        const fromCount = redCustomers.length + yellowCustomers.length;
        const toCount = blueCustomers.length + yellowCustomers.length;
        
        if (yellowCustomers.length === 0 && redCustomers.length === 0 && blueCustomers.length === 0) {
            mapHandler.clearMarkers();
            updateCounterDisplay(fromCount, toCount, true, fromMonth, toMonth, null, redCustomers.length, blueCustomers.length, yellowCustomers.length);
        } else {
            mapHandler.displayCustomersByGroups(yellowCustomers, redCustomers, blueCustomers, fromCount, toCount, true);
            updateCounterDisplay(fromCount, toCount, true, fromMonth, toMonth, null, redCustomers.length, blueCustomers.length, yellowCustomers.length);
        }
        
    } else if (fromMonth && !toMonth) {
        let finalCustomers = dateRangeFilter.getCustomersUptoMonth(fromMonth);
        finalCustomers = finalCustomers.filter(c => allFilteredSet.has(c.ma_kh));
        
        if (selectedCategory !== 'all') {
            const categoryCustomerCodes = getCustomersByMonthAndCategory(fromMonth, selectedCategory);
            const categorySet = new Set(categoryCustomerCodes);
            finalCustomers = finalCustomers.filter(c => categorySet.has(c.ma_kh));
        }
        
        finalCustomers = applyOtherFilters(finalCustomers);
        
        if (finalCustomers.length > 0) {
            mapHandler.displayAllRedCustomers(finalCustomers, finalCustomers.length);
            updateCounterDisplay(finalCustomers.length, 0, false, fromMonth, null, null);
        } else {
            mapHandler.clearMarkers();
            updateCounterDisplay(0, 0, false, fromMonth, null, null);
        }
        
    } else if (toMonth && !fromMonth) {
        let finalCustomers = dateRangeFilter.getCustomersUptoMonth(toMonth);
        finalCustomers = finalCustomers.filter(c => allFilteredSet.has(c.ma_kh));
        
        if (selectedCategory !== 'all') {
            const categoryCustomerCodes = getCustomersByMonthAndCategory(toMonth, selectedCategory);
            const categorySet = new Set(categoryCustomerCodes);
            finalCustomers = finalCustomers.filter(c => categorySet.has(c.ma_kh));
        }
        
        finalCustomers = applyOtherFilters(finalCustomers);
        
        if (finalCustomers.length > 0) {
            mapHandler.displayAllRedCustomers(finalCustomers, finalCustomers.length);
            updateCounterDisplay(0, finalCustomers.length, false, null, toMonth, null);
        } else {
            mapHandler.clearMarkers();
            updateCounterDisplay(0, 0, false, null, toMonth, null);
        }
    }
    
    updateAreaCountDisplay();
}

function applyPermissionToAreaFilter() {
    if (!areaFilter) return;
    
    const areaSelect = document.getElementById('areaFilter');
    if (!areaSelect) return;
    
    if (currentUserPermission && currentUserPermission !== 'ALL') {
        for (let i = 0; i < areaSelect.options.length; i++) {
            const option = areaSelect.options[i];
            if (option.value !== currentUserPermission && option.value !== 'all') {
                option.style.display = 'none';
                option.disabled = true;
            }
        }
        areaSelect.value = currentUserPermission;
        const event = new Event('change');
        areaSelect.dispatchEvent(event);
    } else {
        areaSelect.value = 'all';
    }
    updateAreaCountDisplay();
}

function resetNPPAndEmployee() {
    if (nppFilter) {
        nppFilter.reset();
        const areaValue = areaFilter.getValue();
        if (areaValue !== 'all' && areaHighlight) areaHighlight.highlightByArea(areaValue, false);
        else if (areaHighlight) areaHighlight.showAllAreas();
    }
    if (employeeFilter) employeeFilter.reset();
}

function resetEmployee() { 
    if (employeeFilter) employeeFilter.reset(); 
}

async function initApp() {
    try {
        mapHandler = new MapHandler('map');
        mapHandler.initMap();
        mapHandler.addMarkerStyles();
        
        areaHighlight = new AreaHighlight(mapHandler.map);
        await areaHighlight.loadAreaData();
        
        currentCustomers = window.customersData || [];
        await initCategoryData();
        
        dateRangeFilter = new DateRangeFilter('fromMonthFilter', 'toMonthFilter', currentCustomers);
        channelFilter = new ChannelFilter('channelFilter', 'typeFilter', currentCustomers);
        areaFilter = new AreaFilter('areaFilter', currentCustomers, areaHighlight);
        nppFilter = new NPPFilter('nppFilter', currentCustomers, areaHighlight);
        employeeFilter = new EmployeeFilter('employeeFilter', currentCustomers, areaHighlight);
        categoryFilter = new CategoryFilter('categoryFilter');
        
        applyPermissionToAreaFilter();
        
        areaFilter.setOnResetLowerFilters(() => resetNPPAndEmployee());
        areaFilter.setOnNPPChangeCallback((areaValue) => {
            const nppsInArea = areaFilter.getNPPsByArea(areaValue);
            nppFilter.updateOptions(nppsInArea, areaValue);
        });
        
        nppFilter.setOnResetEmployeeCallback(() => resetEmployee());
        nppFilter.setOnEmployeeChangeCallback((nppValue) => {
            const employees = nppFilter.getEmployeesByNPP(nppValue);
            employeeFilter.updateOptions(employees);
        });
        
        dateRangeFilter.setOnChangeCallback(() => {
            const fromMonth = dateRangeFilter.getFromValue();
            const toMonth = dateRangeFilter.getToValue();
            if (fromMonth) categoryFilter.updateOptions(fromMonth);
            else if (toMonth) categoryFilter.updateOptions(toMonth);
            else categoryFilter.updateOptionsWithAll();
            applyFilters();
        });
        
        channelFilter.setOnChangeCallback(() => applyFilters());
        areaFilter.setOnChangeCallback(() => applyFilters());
        nppFilter.setOnChangeCallback(() => applyFilters());
        employeeFilter.setOnChangeCallback(() => applyFilters());
        categoryFilter.setOnChangeCallback(() => applyFilters());
        
        categoryFilter.initOptions();
        
        const initialArea = areaFilter.getValue();
        const initialNPPs = areaFilter.getNPPsByArea(initialArea);
        nppFilter.initOptions(initialNPPs);
        
        const initialEmployees = nppFilter.getEmployeesByNPP('all');
        employeeFilter.initOptions(initialEmployees);
        
        if (areaHighlight) areaHighlight.showAllAreas();
        
        applyFilters();
        
    } catch (err) {
        console.error('Lỗi:', err);
        alert('Có lỗi xảy ra khi tải dữ liệu!');
    }
}

function toggleSidebar() { 
    document.getElementById('sidebar').classList.toggle('show'); 
}

document.addEventListener('DOMContentLoaded', () => {
    setupLogin();
    
    document.getElementById('resetBtn')?.addEventListener('click', () => {
        dateRangeFilter?.reset();
        channelFilter?.reset();
        areaFilter?.reset();
        nppFilter?.reset();
        employeeFilter?.reset();
        categoryFilter?.reset();
        
        const currentArea = areaFilter.getValue();
        const nppsInArea = areaFilter.getNPPsByArea(currentArea);
        nppFilter.updateOptions(nppsInArea);
        employeeFilter.updateOptions([]);
        
        if (areaHighlight) areaHighlight.showAllAreas();
        applyFilters();
    });
    
    document.getElementById('toggleSidebarBtn')?.addEventListener('click', toggleSidebar);
});