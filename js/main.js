// js/main.js
let mapHandler, areaHighlight;
let currentCustomers = [];
let dateRangeFilter, channelFilter, areaFilter, nppFilter, employeeFilter, categoryFilter;

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

async function loadAllCategoryData() {
    return new Promise((resolve) => {
        if (window.categoryMapping_all) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'data/nh-all.js';
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.head.appendChild(script);
    });
}

async function initCategoryData() {
    const months = ['1-2026', '2-2026', '3-2026', '4-2026'];
    for (const month of months) await loadCategoryData(month);
    await loadAllCategoryData();
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
    
    const allFilteredCustomers = applyOtherFilters(currentCustomers);
    const allFilteredSet = new Set(allFilteredCustomers.map(c => c.ma_kh));
    
    // TRƯỜNG HỢP 1: Không chọn tháng nào, chỉ chọn ngành hàng
    if (!fromMonth && !toMonth) {
        if (selectedCategory !== 'all') {
            // Lấy danh sách khách hàng từ nh-all.js
            const categoryCustomerCodes = getCustomersByAllCategory(selectedCategory);
            const categoryCustomers = categoryCustomerCodes
                .map(code => currentCustomers.find(c => c.ma_kh === code))
                .filter(c => c);
            
            // Áp dụng các bộ lọc khác
            const finalCustomers = applyOtherFilters(categoryCustomers);
            
            // Hiển thị tất cả màu đỏ (vì chỉ có 1 nhóm)
            mapHandler.displayAllRedCustomers(finalCustomers, finalCustomers.length);
        } else {
            // Không chọn tháng, không chọn ngành -> hiển thị tất cả
            mapHandler.displayAllRedCustomers(allFilteredCustomers, allFilteredCustomers.length);
        }
        return;
    }
    
    // TRƯỜNG HỢP 2: Không chọn ngành hàng
    if (selectedCategory === 'all') {
        let finalCustomers = [];
        let fromCount = 0, toCount = 0;
        
        if (fromMonth && toMonth) {
            const fromCustomers = dateRangeFilter.getCustomersUptoMonth(fromMonth);
            const toCustomers = dateRangeFilter.getCustomersUptoMonth(toMonth);
            finalCustomers = fromCustomers.concat(toCustomers);
            finalCustomers = finalCustomers.filter((c, i, arr) => 
                allFilteredSet.has(c.ma_kh) && arr.findIndex(c2 => c2.ma_kh === c.ma_kh) === i
            );
            fromCount = fromCustomers.filter(c => allFilteredSet.has(c.ma_kh)).length;
            toCount = toCustomers.filter(c => allFilteredSet.has(c.ma_kh)).length;
            mapHandler.displayAllRedCustomers(finalCustomers, finalCustomers.length);
            const counterSpan = document.getElementById('customerCount');
            if (counterSpan) counterSpan.textContent = `${fromCount} | ${toCount} `;
        } else if (fromMonth) {
            finalCustomers = dateRangeFilter.getCustomersUptoMonth(fromMonth);
            finalCustomers = finalCustomers.filter(c => allFilteredSet.has(c.ma_kh));
            mapHandler.displayAllRedCustomers(finalCustomers, finalCustomers.length);
        } else if (toMonth) {
            finalCustomers = dateRangeFilter.getCustomersUptoMonth(toMonth);
            finalCustomers = finalCustomers.filter(c => allFilteredSet.has(c.ma_kh));
            mapHandler.displayAllRedCustomers(finalCustomers, finalCustomers.length);
        }
        return;
    }
    
    // TRƯỜNG HỢP 3: Có chọn tháng và có chọn ngành hàng
    let fromCustomerCodes = [];
    let toCustomerCodes = [];
    
    if (fromMonth) fromCustomerCodes = getCustomersByMonthAndCategory(fromMonth, selectedCategory);
    if (toMonth) toCustomerCodes = getCustomersByMonthAndCategory(toMonth, selectedCategory);
    
    const fromSet = new Set(fromCustomerCodes);
    const toSet = new Set(toCustomerCodes);
    
    const onlyFrom = [...fromSet].filter(code => !toSet.has(code));
    const onlyTo = [...toSet].filter(code => !fromSet.has(code));
    const both = [...fromSet].filter(code => toSet.has(code));
    
    const getCustomerByCode = (code) => currentCustomers.find(c => c.ma_kh === code);
    
    let yellowCustomers = both.map(code => getCustomerByCode(code)).filter(c => c);
    let redCustomers = onlyFrom.map(code => getCustomerByCode(code)).filter(c => c);
    let blueCustomers = onlyTo.map(code => getCustomerByCode(code)).filter(c => c);
    
    yellowCustomers = applyOtherFilters(yellowCustomers);
    redCustomers = applyOtherFilters(redCustomers);
    blueCustomers = applyOtherFilters(blueCustomers);
    
    const fromCount = redCustomers.length + yellowCustomers.length;
    const toCount = blueCustomers.length + yellowCustomers.length;
    const hasBothMonths = (fromMonth && toMonth);
    
    mapHandler.displayCustomersByGroups(
        yellowCustomers, redCustomers, blueCustomers,
        fromCount, toCount, hasBothMonths
    );
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

function resetEmployee() { if (employeeFilter) employeeFilter.reset(); }

async function init() {
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
        
        areaFilter.setOnResetLowerFilters(() => resetNPPAndEmployee());
        areaFilter.setOnNPPChangeCallback((areaValue) => {
            nppFilter.updateOptions(areaFilter.getNPPsByArea(areaValue), areaValue);
        });
        nppFilter.setOnResetEmployeeCallback(() => resetEmployee());
        nppFilter.setOnEmployeeChangeCallback((nppValue) => {
            employeeFilter.updateOptions(nppFilter.getEmployeesByNPP(nppValue));
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
        nppFilter.initOptions(areaFilter.getNPPsByArea('all'));
        employeeFilter.initOptions(nppFilter.getEmployeesByNPP('all'));
        
        if (areaHighlight) areaHighlight.showAllAreas();
        applyFilters();
        
    } catch (err) {
        console.error('Lỗi:', err);
        alert('Có lỗi xảy ra khi tải dữ liệu!');
    }
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('show'); }

document.addEventListener('DOMContentLoaded', () => {
    init();
    document.getElementById('resetBtn')?.addEventListener('click', () => {
        dateRangeFilter?.reset();
        channelFilter?.reset();
        areaFilter?.reset();
        nppFilter?.reset();
        employeeFilter?.reset();
        categoryFilter?.reset();
        nppFilter.updateOptions(areaFilter.getNPPsByArea('all'));
        employeeFilter.updateOptions(nppFilter.getEmployeesByNPP('all'));
        if (areaHighlight) areaHighlight.showAllAreas();
        applyFilters();
    });
    document.getElementById('toggleSidebarBtn')?.addEventListener('click', toggleSidebar);
});