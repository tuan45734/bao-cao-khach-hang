// js/main.js
let mapHandler, areaHighlight;
let currentCustomers = [];
let dateRangeFilter, channelFilter, areaFilter, nppFilter, employeeFilter, categoryFilter, productFilter;
let currentUserPermission = null;
let apiCustomersManager = null;
let showInternalCustomers = true;

const internalRegionAreas = {
    all: ['KV1', 'KV2', 'KV3', 'KV4', 'KV5', 'KV6', 'KV7'],
    north: ['KV1', 'KV2', 'KV3', 'KV4', 'KV5', 'KV6'],
    central: ['KV7'],
    south: []
};

const userPermissions = {
    'KV1ADZ': 'KV1',
    'KV2ZAC': 'KV2',
    'KV3CCC': 'KV3',
    'KV4YXY': 'KV4',
    'KV5XXZ': 'KV5',
    'KV6XBC': 'KV6',
    '99': 'ALL'
};

function getAllowedAreasForRegion(regionValue) {
    return [...(internalRegionAreas[regionValue] || internalRegionAreas.all)];
}

function getPermissionAllowedAreas() {
    if (!currentUserPermission || currentUserPermission === 'ALL') {
        return [...internalRegionAreas.all];
    }
    return [currentUserPermission];
}

function getEffectiveAllowedAreas(regionValue) {
    const regionAreas = getAllowedAreasForRegion(regionValue);
    const permissionAreas = getPermissionAllowedAreas();

    if (permissionAreas.length === internalRegionAreas.all.length) {
        return regionAreas;
    }

    return regionAreas.filter(area => permissionAreas.includes(area));
}

function getRegionByArea(areaCode) {
    if (['KV1', 'KV2', 'KV3', 'KV4', 'KV5', 'KV6'].includes(areaCode)) return 'north';
    if (areaCode === 'KV7') return 'central';
    return 'all';
}

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
            'KV2': ['NPP Duy Anh', 'NPP Hùng Huệ', 'NPP Long Châm', 'NPP Ngọc Kiên', 'NPP Ngọc Thêu', 'NPP Phong Hiền', 'NPP Phương Đông', 'NPP Thành Lụa', 'NPP Tuấn Huyền'],
            'KV3': ['NPP Bảo Cường', 'NPP Tùng Phương', 'NPP Phúc Thịnh', 'NPP Hoa Việt', 'NPP Hikoji', 'NPP Long Hải', 'NPP Tân Hoa', 'NPP Tây Đô', 'NPP Thắng Lợi', 'NPP Thành Hân', 'NPP Tiến Thịnh'],
            'KV4': ['NPP Ánh Thu', 'NPP Đức Oanh', 'NPP Dương Minh', 'NPP Dũng Béo', 'NPP Hưng Thịnh', 'NPP Ngọc Phúc', 'NPP Nguyễn Đình Hân', 'NPP Tân Thúy', 'NPP Thăng Hương', 'NPP Thảo Thắng'],
            'KV5': ['NPP Đồng Lợi', 'NPP Hải Hằng', 'NPP Hiền Cường', 'NPP Hoàng Minh', 'NPP Oanh Định', 'NPP Sơn Lâm', 'NPP Thái Hoà', 'NPP Thảo Xuân', 'NPP Duy Khoa', 'NPP Tuấn Vân', 'NPP Vũ Đức Nam'],
            'KV6': ['NPP Anh Minh HT', 'NPP Hà Thanh', 'NPP Hồng Đức', 'NPP Linh Trang', 'NPP Mạnh Hà 1', 'NPP Mạnh Hà 2', 'NPP Minh Châu', 'NPP Minh Lộc', 'NPP Nhung Tùng', 'NPP Phương Hà', 'NPP Tân Bích An', 'NPP Thanh Bình', 'NPP Thành Thanh', 'NPP Thông Thơm', 'NPP Trường Hằng'],
            'KV7': ['NPP Bảo Hân', 'NPP NAKOA', 'NPP Dương Thiên Nhi', 'NPP Tường Vy', 'NPP Minh Huy', 'NPP Hiền Thuận', 'NPP Thúy Diễm', 'NPP Anh Viên', 'NPP Hoàng Gia Bảo', 'NPP Trung Nam', 'NPP Nam Khánh', 'NPP Thanh Trà']

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
    const months = ['1-2026', '2-2026', '3-2026', '4-2026', '5-2026'];
    for (const month of months) await loadCategoryData(month);
}

function getCustomersByMonthAndCategory(monthKey, categoryName) {
    if (!monthKey || !categoryName || categoryName === 'all') return [];
    const mappingName = `categoryMapping_${monthKey.replace('-', '_')}`;
    const categoryMap = window[mappingName] || {};
    const products = categoryMap[categoryName] || {};
    const allCodes = new Set();
    for (const product in products) {
        const codes = products[product];
        if (Array.isArray(codes)) {
            codes.forEach(code => allCodes.add(code));
        }
    }
    return Array.from(allCodes);
}

function getCustomersByMonthAndProduct(monthKey, productName) {
    if (!monthKey || !productName) return [];
    const mappingName = `categoryMapping_${monthKey.replace('-', '_')}`;
    const categoryMap = window[mappingName] || {};
    for (const category in categoryMap) {
        const products = categoryMap[category];
        if (products && products[productName]) {
            return products[productName];
        }
    }
    return [];
}

function getAllCustomerCodesFromMonth(monthKey) {
    if (!monthKey) return [];
    const mappingName = `categoryMapping_${monthKey.replace('-', '_')}`;
    const categoryMap = window[mappingName] || {};
    const allCodes = new Set();
    for (const category in categoryMap) {
        const products = categoryMap[category];
        if (products && typeof products === 'object') {
            for (const product in products) {
                const codes = products[product];
                if (Array.isArray(codes)) {
                    codes.forEach(code => allCodes.add(code));
                }
            }
        }
    }
    return Array.from(allCodes);
}

function getAllCustomerCodesFromAllCategories() {
    return categoryFilter.getAllCustomerCodes();
}

function getCustomersByArea(areaCode) {
    if (!areaCode || areaCode === 'ALL') return currentCustomers;
    
    const areaMapping = {
      'KV1': ['NPP Bảo Lâm', 'NPP Công Giang', 'NPP Cường Thịnh', 'NPP Đức Nam Tiến', 'NPP Dũng Cúc', 'NPP Lâm Hạ', 'NPP Long Liên', 'NPP Nguyên Vũ', 'NPP Thảo Nam', 'NPP Tuấn Huê', 'NPP Tuấn Yến', 'NPP Vũ Tấm'],
            'KV2': ['NPP Duy Anh', 'NPP Hùng Huệ', 'NPP Long Châm', 'NPP Ngọc Kiên', 'NPP Ngọc Thêu', 'NPP Phong Hiền', 'NPP Phương Đông', 'NPP Thành Lụa', 'NPP Tuấn Huyền'],
            'KV3': ['NPP Bảo Cường', 'NPP Tùng Phương', 'NPP Phúc Thịnh', 'NPP Hoa Việt', 'NPP Hikoji', 'NPP Long Hải', 'NPP Tân Hoa', 'NPP Tây Đô', 'NPP Thắng Lợi', 'NPP Thành Hân', 'NPP Tiến Thịnh'],
            'KV4': ['NPP Ánh Thu', 'NPP Đức Oanh', 'NPP Dương Minh', 'NPP Dũng Béo', 'NPP Hưng Thịnh', 'NPP Ngọc Phúc', 'NPP Nguyễn Đình Hân', 'NPP Tân Thúy', 'NPP Thăng Hương', 'NPP Thảo Thắng'],
            'KV5': ['NPP Đồng Lợi', 'NPP Hải Hằng', 'NPP Hiền Cường', 'NPP Hoàng Minh', 'NPP Oanh Định', 'NPP Sơn Lâm', 'NPP Thái Hoà', 'NPP Thảo Xuân', 'NPP Duy Khoa', 'NPP Tuấn Vân', 'NPP Vũ Đức Nam'],
            'KV6': ['NPP Anh Minh HT', 'NPP Hà Thanh', 'NPP Hồng Đức', 'NPP Linh Trang', 'NPP Mạnh Hà 1', 'NPP Mạnh Hà 2', 'NPP Minh Châu', 'NPP Minh Lộc', 'NPP Nhung Tùng', 'NPP Phương Hà', 'NPP Tân Bích An', 'NPP Thanh Bình', 'NPP Thành Thanh', 'NPP Thông Thơm', 'NPP Trường Hằng'],
            'KV7': ['NPP Bảo Hân', 'NPP NAKOA', 'NPP Dương Thiên Nhi', 'NPP Tường Vy', 'NPP Minh Huy', 'NPP Hiền Thuận', 'NPP Thúy Diễm', 'NPP Anh Viên', 'NPP Hoàng Gia Bảo', 'NPP Trung Nam', 'NPP Nam Khánh', 'NPP Thanh Trà']

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
    const allowedAreas = areaFilter?.getAllowedAreas?.() || [];
    const isRegionRestricted = allowedAreas.length !== areaFilter.getAllAreas().length;
    
    if (areaValue !== 'all' || isRegionRestricted) result = areaFilter.applyFilter(result);
    if (nppValue !== 'all') result = nppFilter.applyFilter(result);
    if (employeeValue !== 'all') result = employeeFilter.applyFilter(result);
    if (channelValue !== 'all' || typeValue !== 'all') result = channelFilter.applyFilter(result);
    
    return result;
}

function getFilteredInternalCustomers() {
    const fromMonth = dateRangeFilter.getFromValue();
    const toMonth = dateRangeFilter.getToValue();
    const selectedCategory = categoryFilter.getValue();
    const selectedProduct = productFilter ? productFilter.getValue() : '';
    
    let baseCustomers = currentCustomers;
    if (currentUserPermission && currentUserPermission !== 'ALL') {
        baseCustomers = getCustomersByArea(currentUserPermission);
    }
    
    const allFilteredCustomers = applyOtherFilters(baseCustomers);
    const allFilteredSet = new Set(allFilteredCustomers.map(c => c.ma_kh));
    
    const filterByCategoryAndProduct = (customers, month) => {
        let filtered = [...customers];
        
        if (selectedProduct && selectedProduct !== '') {
            const productCustomers = getCustomersByMonthAndProduct(month, selectedProduct);
            const productSet = new Set(productCustomers);
            filtered = filtered.filter(c => productSet.has(c.ma_kh));
        } else if (selectedCategory === 'all') {
            // Tất cả ngành hàng: giữ nguyên
        } else if (selectedCategory === '') {
            // Dùng dữ liệu của tháng đã chọn, không dùng categoryMapping_all
            const allCategoryCodes = getAllCustomerCodesFromMonth(month);
            const categorySet = new Set(allCategoryCodes);
            filtered = filtered.filter(c => categorySet.has(c.ma_kh));
        } else {
            const categoryCustomers = getCustomersByMonthAndCategory(month, selectedCategory);
            const categorySet = new Set(categoryCustomers);
            filtered = filtered.filter(c => categorySet.has(c.ma_kh));
        }
        
        return filtered;
    };
    
    if (!fromMonth && !toMonth) {
        let result = [...allFilteredCustomers];
        
        if (selectedProduct && selectedProduct !== '') {
            const productCustomers = productFilter.getCustomersByProduct(selectedProduct);
            const productSet = new Set(productCustomers);
            result = result.filter(c => productSet.has(c.ma_kh));
        } else if (selectedCategory === '') {
            const allCategoryCodes = getAllCustomerCodesFromAllCategories();
            const categorySet = new Set(allCategoryCodes);
            result = result.filter(c => categorySet.has(c.ma_kh));
        } else if (selectedCategory !== 'all' && selectedCategory !== '') {
            const categoryCustomers = categoryFilter.getCustomerCodesByCategory(selectedCategory);
            const categorySet = new Set(categoryCustomers);
            result = result.filter(c => categorySet.has(c.ma_kh));
        }
        
        result = applyOtherFilters(result);
        return result;
    }
    else if (fromMonth && !toMonth) {
        let result = dateRangeFilter.getCustomersUptoMonth(fromMonth);
        result = result.filter(c => allFilteredSet.has(c.ma_kh));
        result = filterByCategoryAndProduct(result, fromMonth);
        result = applyOtherFilters(result);
        return result;
    }
    else if (toMonth && !fromMonth) {
        let result = dateRangeFilter.getCustomersUptoMonth(toMonth);
        result = result.filter(c => allFilteredSet.has(c.ma_kh));
        result = filterByCategoryAndProduct(result, toMonth);
        result = applyOtherFilters(result);
        return result;
    }
    else if (fromMonth && toMonth) {
        const fromCustomers = dateRangeFilter.getCustomersUptoMonth(fromMonth);
        const toCustomers = dateRangeFilter.getCustomersUptoMonth(toMonth);
        
        let filteredFrom = fromCustomers.filter(c => allFilteredSet.has(c.ma_kh));
        let filteredTo = toCustomers.filter(c => allFilteredSet.has(c.ma_kh));
        
        filteredFrom = filterByCategoryAndProduct(filteredFrom, fromMonth);
        filteredTo = filterByCategoryAndProduct(filteredTo, toMonth);
        
        const fromSet = new Set(filteredFrom.map(c => c.ma_kh));
        const toSet = new Set(filteredTo.map(c => c.ma_kh));
        
        const redRaw = filteredFrom.filter(c => !toSet.has(c.ma_kh));
        const blueRaw = filteredTo.filter(c => !fromSet.has(c.ma_kh));
        const yellowRaw = filteredFrom.filter(c => toSet.has(c.ma_kh));
        
        return { yellow: yellowRaw, red: redRaw, blue: blueRaw, fromCount: filteredFrom.length, toCount: filteredTo.length };
    }
    
    return [];
}

function applyFilters() {
    mapHandler.clearMarkers();
    
    let internalCount = 0;
    let apiCount = 0;
    
    const fromMonth = dateRangeFilter.getFromValue();
    const toMonth = dateRangeFilter.getToValue();
    
    // Hiển thị khách hàng nội bộ nếu được bật
    if (showInternalCustomers) {
        const internalResult = getFilteredInternalCustomers();
        
        if (internalResult.yellow !== undefined) {
            if (internalResult.yellow.length > 0 || internalResult.red.length > 0 || internalResult.blue.length > 0) {
                mapHandler.displayCustomersByGroups(internalResult.yellow, internalResult.red, internalResult.blue, 
                    internalResult.fromCount, internalResult.toCount, true);
            }
            internalCount = internalResult.fromCount + internalResult.toCount;
            
            updateCounterDisplay(
                internalResult.fromCount, 
                internalResult.toCount, 
                true, 
                fromMonth, 
                toMonth, 
                null,
                internalResult.red.length,
                internalResult.blue.length,
                internalResult.yellow.length
            );
        } else if (Array.isArray(internalResult)) {
            if (internalResult.length > 0) {
                mapHandler.displayAllRedCustomers(internalResult, internalResult.length);
                internalCount = internalResult.length;
            }
            
            if (fromMonth && !toMonth) {
                updateCounterDisplay(internalResult.length, 0, false, fromMonth, null, null);
            } else if (toMonth && !fromMonth) {
                updateCounterDisplay(0, internalResult.length, false, null, toMonth, null);
            } else {
                updateCounterDisplay(null, null, false, null, null, internalResult.length);
            }
        }
        
        const internalBadge = document.getElementById('internalCustomerCount');
        if (internalBadge) {
            internalBadge.textContent = `${internalCount} KH`;
        }
    } else {
        updateCounterDisplay(null, null, false, null, null, 0);
    }
    
    // Hiển thị khách hàng API nếu được bật
    if (apiCustomersManager && apiCustomersManager.isEnabledFlag()) {
        apiCustomersManager.applyFilters();
        apiCount = apiCustomersManager.displayMarkers();
        
        const apiBadge = document.getElementById('apiCustomerCount');
        if (apiBadge && apiCount > 0) {
            apiBadge.textContent = `${apiCount} KH`;
            apiBadge.style.display = 'inline-block';
        } else if (apiBadge) {
            apiBadge.style.display = 'none';
        }
        
        // Cập nhật thêm thông tin API vào counter nếu internal đang hiển thị
        if (showInternalCustomers) {
            const counterSpan = document.getElementById('customerCount');
            if (counterSpan && counterSpan.textContent) {
                counterSpan.textContent += ` | 🌐 API: ${apiCount}`;
            }
        } else {
            const counterSpan = document.getElementById('customerCount');
            if (counterSpan) {
                counterSpan.textContent = `🌐 API: ${apiCount}`;
            }
        }
    }
    
    updateInternalAreaCountDisplay();
}

function updateInternalAreaCountDisplay() {
    const areaSelect = document.getElementById('areaFilter');
    const areaCountSpan = document.getElementById('areaCount');
    if (!areaSelect || !areaCountSpan || !areaFilter) return;

    const selectedArea = areaSelect.value;
    const allowedAreas = areaFilter.getAllowedAreas();
    let count = 0;

    if (selectedArea === 'all') {
        const allowedNpps = new Set();
        allowedAreas.forEach(area => {
            const npps = areaFilter.areaMapping[area] || [];
            npps.forEach(npp => allowedNpps.add(npp));
        });
        count = currentCustomers.filter(c => allowedNpps.has(c.npp)).length;
    } else if (allowedAreas.includes(selectedArea)) {
        const nppsInArea = areaFilter.areaMapping[selectedArea] || [];
        count = currentCustomers.filter(c => nppsInArea.includes(c.npp)).length;
    }

    areaCountSpan.textContent = `(${count} KH)`;
}

function applyPermissionToAreaFilter() {
    if (!areaFilter) return;
    
    const areaSelect = document.getElementById('areaFilter');
    const regionSelect = document.getElementById('regionFilter');
    if (!areaSelect) return;

    if (currentUserPermission && currentUserPermission !== 'ALL') {
        const region = getRegionByArea(currentUserPermission);
        if (regionSelect) {
            regionSelect.value = region;
            regionSelect.disabled = true;
        }
    } else if (regionSelect) {
        regionSelect.value = 'all';
        regionSelect.disabled = false;
    }

    syncInternalAreaScope();
    updateInternalAreaCountDisplay();
}

function syncInternalAreaScope() {
    if (!areaFilter || !nppFilter || !employeeFilter) return;

    const regionSelect = document.getElementById('regionFilter');
    const regionValue = regionSelect ? regionSelect.value : 'all';
    const effectiveAreas = getEffectiveAllowedAreas(regionValue);

    areaFilter.setAllowedAreas(effectiveAreas);

    const currentArea = areaFilter.getValue();
    if (areaHighlight) {
        if (currentArea !== 'all') areaHighlight.highlightByArea(currentArea, false);
        else areaHighlight.showAllAreas();
    }

    const nppsInArea = areaFilter.getNPPsByArea(currentArea);
    nppFilter.updateOptions(nppsInArea, currentArea);

    const currentNpp = nppFilter.getValue();
    const employees = nppFilter.getEmployeesByNPP(currentNpp);
    employeeFilter.updateOptions(employees);
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
        
        // Khởi tạo API Customers Manager
        apiCustomersManager = new ApiCustomersManager();
        apiCustomersManager.setMarkers(mapHandler.markerCluster, mapHandler);
        apiCustomersManager.setOnFilterChange(() => {
            if (apiCustomersManager.isEnabledFlag()) {
                mapHandler.clearMarkers();
                applyFilters();
            }
        });
        
        // Khởi tạo các bộ lọc
        dateRangeFilter = new DateRangeFilter('fromMonthFilter', 'toMonthFilter', currentCustomers);
        channelFilter = new ChannelFilter('channelFilter', 'typeFilter', currentCustomers);
        areaFilter = new AreaFilter('areaFilter', currentCustomers, areaHighlight);
        nppFilter = new NPPFilter('nppFilter', currentCustomers, areaHighlight);
        employeeFilter = new EmployeeFilter('employeeFilter', currentCustomers, areaHighlight);
        categoryFilter = new CategoryFilter('categoryFilter');
        productFilter = new ProductFilter('productFilter');
        
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
        
        categoryFilter.setOnChangeCallback(() => {
            const selectedCategory = categoryFilter.getValue();
            productFilter.updateOptionsByCategory(selectedCategory);
            applyFilters();
        });
        
        productFilter.setOnChangeCallback(() => applyFilters());
        channelFilter.setOnChangeCallback(() => applyFilters());
        areaFilter.setOnChangeCallback(() => applyFilters());
        nppFilter.setOnChangeCallback(() => applyFilters());
        employeeFilter.setOnChangeCallback(() => applyFilters());

        const regionFilter = document.getElementById('regionFilter');
        if (regionFilter) {
            regionFilter.addEventListener('change', () => {
                syncInternalAreaScope();
                resetNPPAndEmployee();
                applyFilters();
            });
        }
        
        categoryFilter.initOptions();
        productFilter.initOptions();
        
        syncInternalAreaScope();
        
        if (areaHighlight) areaHighlight.showAllAreas();
        
        // Xử lý checkbox hiển thị khách hàng nội bộ
        const showInternalCheckbox = document.getElementById('showInternalCustomers');
        const internalFiltersSection = document.getElementById('internalFiltersSection');
        
        if (showInternalCheckbox) {
            showInternalCheckbox.checked = true;
            showInternalCustomers = true;
            if (internalFiltersSection) internalFiltersSection.style.display = 'block';
            
            showInternalCheckbox.addEventListener('change', (e) => {
                showInternalCustomers = e.target.checked;
                if (internalFiltersSection) {
                    internalFiltersSection.style.display = showInternalCustomers ? 'block' : 'none';
                }
                mapHandler.clearMarkers();
                applyFilters();
            });
        }
        
        // Xử lý checkbox hiển thị API
        const showApiCheckbox = document.getElementById('showApiCustomers');
        if (showApiCheckbox) {
            showApiCheckbox.addEventListener('change', async (e) => {
                if (e.target.checked) {
                    apiCustomersManager.enable();
                    if (apiCustomersManager.customers.length === 0) {
                        await apiCustomersManager.loadCustomers();
                    } else {
                        apiCustomersManager.applyFilters();
                    }
                    mapHandler.clearMarkers();
                    applyFilters();
                } else {
                    apiCustomersManager.disable();
                    apiCustomersManager.clearMarkers();
                    mapHandler.clearMarkers();
                    applyFilters();
                }
            });
        }
        
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
        productFilter?.reset();

        applyPermissionToAreaFilter();
        if (areaHighlight) areaHighlight.showAllAreas();
        applyFilters();
    });
    
    document.getElementById('toggleSidebarBtn')?.addEventListener('click', toggleSidebar);
});
