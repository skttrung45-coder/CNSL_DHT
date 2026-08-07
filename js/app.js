/**
 * APP.JS - UI Controller, Event Listeners, Dynamic Selects, Auth System, Meter Management & Single Monthly Cutoff Enforcement
 */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // 1. Authentication System & User Session Control
    // ----------------------------------------------------
    const authOverlay = document.getElementById('authOverlay');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabLoginBtn = document.getElementById('tabLoginBtn');
    const tabRegisterBtn = document.getElementById('tabRegisterBtn');

    const displayFullName = document.getElementById('displayFullName');
    const displayRole = document.getElementById('displayRole');
    const userAvatar = document.getElementById('userAvatar');
    const adminUsersNavItem = document.getElementById('adminUsersNavItem');
    const logoutBtn = document.getElementById('logoutBtn');

    function checkAuth() {
        const currentUser = window.appStore.getCurrentUser();
        if (!currentUser) {
            authOverlay.style.display = 'flex';
        } else {
            authOverlay.style.display = 'none';
            displayFullName.innerText = currentUser.fullName;
            displayRole.innerText = currentUser.role === 'admin' ? 'QUẢN TRỊ VIÊN (ADMIN)' : 'CÁN BỘ XÍ NGHIỆP';
            userAvatar.innerText = currentUser.fullName.charAt(0).toUpperCase();

            if (currentUser.role === 'admin') {
                adminUsersNavItem.style.display = 'flex';
            } else {
                adminUsersNavItem.style.display = 'none';
            }

            updateDashboard();
        }
    }

    tabLoginBtn.addEventListener('click', () => {
        tabLoginBtn.classList.add('active');
        tabRegisterBtn.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    });

    tabRegisterBtn.addEventListener('click', () => {
        tabRegisterBtn.classList.add('active');
        tabLoginBtn.classList.remove('active');
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        const res = window.appStore.login(username, password);
        if (res.success) {
            showToast(`Chào mừng ${res.user.fullName} đã đăng nhập thành công!`, 'success');
            checkAuth();
        } else {
            showToast(res.message, 'danger');
        }
    });

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userData = {
            fullName: document.getElementById('regFullName').value,
            username: document.getElementById('regUsername').value,
            password: document.getElementById('regPassword').value,
            unitId: document.getElementById('regUnit').value
        };

        const res = window.appStore.register(userData);
        if (res.success) {
            showToast(res.message, 'success');
            registerForm.reset();
            tabLoginBtn.click();
        } else {
            showToast(res.message, 'danger');
        }
    });

    logoutBtn.addEventListener('click', () => {
        if (confirm('Bạn có muốn đăng xuất khỏi hệ thống không?')) {
            window.appStore.logout();
            showToast('Đã đăng xuất thành công.', 'info');
            checkAuth();
        }
    });

    // ----------------------------------------------------
    // 2. Change Password Modal
    // ----------------------------------------------------
    const changePasswordModal = document.getElementById('changePasswordModal');
    const btnOpenChangePasswordModal = document.getElementById('btnOpenChangePasswordModal');
    const btnCloseChangePasswordModal = document.getElementById('btnCloseChangePasswordModal');
    const btnCancelChangePasswordModal = document.getElementById('btnCancelChangePasswordModal');
    const changePasswordForm = document.getElementById('changePasswordForm');

    btnOpenChangePasswordModal.addEventListener('click', () => {
        changePasswordModal.classList.add('active');
    });

    function closeChangePasswordModal() {
        changePasswordModal.classList.remove('active');
        changePasswordForm.reset();
    }

    btnCloseChangePasswordModal.addEventListener('click', closeChangePasswordModal);
    btnCancelChangePasswordModal.addEventListener('click', closeChangePasswordModal);

    changePasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newPass = document.getElementById('newPasswordInput').value;
        const confirmPass = document.getElementById('confirmNewPasswordInput').value;

        if (newPass !== confirmPass) {
            showToast('Xác nhận mật khẩu mới không khớp!', 'danger');
            return;
        }

        const currentUser = window.appStore.getCurrentUser();
        if (currentUser) {
            window.appStore.changePassword(currentUser.id, newPass);
            showToast('Đã cập nhật mật khẩu mới thành công!', 'success');
            closeChangePasswordModal();
        }
    });

    // ----------------------------------------------------
    // 3. Navigation Tab Switching
    // ----------------------------------------------------
    const navItems = document.querySelectorAll('.nav-item');
    const pageViews = document.querySelectorAll('.page-view');
    const pageTitle = document.getElementById('pageTitle');
    const pageSubTitle = document.getElementById('pageSubTitle');

    const viewTitles = {
        'dashboard-view': { title: 'Thống Kê Sản Lượng Cấp Nước', sub: 'Tổng hợp số liệu sản lượng sản xuất và giảm trừ 12 XNCN' },
        'daily-view': { title: 'Sản Lượng Phát Theo Ngày', sub: 'Phân tích tổng sản lượng nước bơm phát ra từng ngày trong tháng' },
        'entry-view': { title: 'Nhập Chỉ Số & Sản Lượng Giảm Trừ', sub: 'Cập nhật chỉ số đồng hồ nước và chốt sản lượng giảm trừ' },
        'data-view': { title: 'Sổ Chỉ Số & Báo Cáo', sub: 'Tra cứu, lọc số liệu chi tiết và xuất báo cáo Excel' },
        'stations-view': { title: 'Quản Lý Trạm Trực Thuộc', sub: 'Quản lý trạm chốt và danh sách đồng hồ nước' },
        'users-view': { title: 'Phê Duyệt & Quản Lý Tài Khoản', sub: 'Quản trị viên phê duyệt tài khoản người dùng đăng ký mới' }
    };

    const mobileBottomNavItems = document.querySelectorAll('.mobile-nav-item');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebar = document.querySelector('.sidebar');

    function closeMobileSidebar() {
        if (sidebar) sidebar.classList.remove('mobile-open');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    }

    function openMobileSidebar() {
        if (sidebar) sidebar.classList.add('mobile-open');
        if (sidebarOverlay) sidebarOverlay.classList.add('active');
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', openMobileSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeMobileSidebar);
    }

    function switchTab(targetViewId) {
        navItems.forEach(item => {
            if (item.getAttribute('data-tab') === targetViewId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        mobileBottomNavItems.forEach(item => {
            if (item.getAttribute('data-tab') === targetViewId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        pageViews.forEach(view => {
            if (view.id === targetViewId) {
                view.classList.add('active');
            } else {
                view.classList.remove('active');
            }
        });

        if (viewTitles[targetViewId]) {
            pageTitle.innerText = viewTitles[targetViewId].title;
            pageSubTitle.innerText = viewTitles[targetViewId].sub;
        }

        closeMobileSidebar();

        if (targetViewId === 'dashboard-view') {
            updateDashboard();
        } else if (targetViewId === 'daily-view') {
            renderDailyAnalytics();
        } else if (targetViewId === 'data-view') {
            renderReadingsTable();
        } else if (targetViewId === 'stations-view') {
            renderStationsTable();
        } else if (targetViewId === 'users-view') {
            renderUsersTable();
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    mobileBottomNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('inputCutoffDate').value = today;

    // ----------------------------------------------------
    // 4. Dynamic Station & Meter Cascading Selects
    // ----------------------------------------------------
    const filterUnitSelect = document.getElementById('filterUnit');
    const filterStationSelect = document.getElementById('filterStation');

    function populateFilterStations(unitId) {
        const stations = window.appStore.getStations(unitId);
        filterStationSelect.innerHTML = '<option value="all">-- Tất cả các trạm --</option>';
        stations.forEach(st => {
            const opt = document.createElement('option');
            opt.value = st.id;
            opt.innerText = `${st.name} (${st.code})`;
            filterStationSelect.appendChild(opt);
        });
    }

    filterUnitSelect.addEventListener('change', () => {
        populateFilterStations(filterUnitSelect.value);
        updateDashboard();
    });

    document.getElementById('filterYear').addEventListener('change', updateDashboard);
    document.getElementById('filterMonth').addEventListener('change', updateDashboard);
    filterStationSelect.addEventListener('change', updateDashboard);

    // Form Unit -> Form Station -> Meter Cascade
    const inputUnitSelect = document.getElementById('inputUnit');
    const inputStationSelect = document.getElementById('inputStation');
    const inputMeterSelect = document.getElementById('inputMeterSelect');
    const inputMeterCode = document.getElementById('inputMeterCode');
    const inputDefaultCutoffDay = document.getElementById('inputDefaultCutoffDay');
    const inputOldReading = document.getElementById('inputOldReading');
    const inputNewReading = document.getElementById('inputNewReading');

    inputUnitSelect.addEventListener('change', () => {
        const unitId = inputUnitSelect.value;
        if (!unitId) {
            inputStationSelect.disabled = true;
            inputStationSelect.innerHTML = '<option value="">-- Vui lòng chọn đơn vị cấp nước trước --</option>';
            inputMeterSelect.disabled = true;
            inputMeterSelect.innerHTML = '<option value="">-- Chọn đồng hồ --</option>';
            inputMeterCode.value = '';
            inputDefaultCutoffDay.value = '';
            return;
        }

        const stations = window.appStore.getStations(unitId);
        inputStationSelect.disabled = false;

        if (stations.length === 0) {
            inputStationSelect.innerHTML = '<option value="">-- XNCN này chưa có trạm nào (Bấm "Tạo Trạm Mới") --</option>';
            inputMeterSelect.disabled = true;
            inputMeterSelect.innerHTML = '<option value="">-- Không có đồng hồ --</option>';
            inputMeterCode.value = '';
            inputDefaultCutoffDay.value = '';
        } else {
            inputStationSelect.innerHTML = '<option value="">-- Chọn trạm trực thuộc --</option>';
            stations.forEach(st => {
                const opt = document.createElement('option');
                opt.value = st.id;
                opt.innerText = `${st.name} [${st.code}] ${st.isLocked ? '(Đã Khóa)' : ''}`;
                if (st.isLocked) opt.disabled = true;
                inputStationSelect.appendChild(opt);
            });
        }
    });

    inputStationSelect.addEventListener('change', () => {
        const stationId = inputStationSelect.value;
        if (!stationId) {
            inputMeterSelect.disabled = true;
            inputMeterSelect.innerHTML = '<option value="">-- Chọn đồng hồ --</option>';
            inputMeterCode.value = '';
            inputDefaultCutoffDay.value = '';
            return;
        }

        const station = window.appStore.getStationById(stationId);
        if (station) {
            if (station.isLocked) {
                showToast('Trạm này đã bị Admin khóa. Không thể nhập chỉ số mới!', 'danger');
                inputStationSelect.value = '';
                return;
            }

            inputDefaultCutoffDay.value = `Ngày ${station.defaultCutoffDay} hàng tháng`;

            const meters = window.appStore.getMeters(stationId);
            inputMeterSelect.disabled = false;
            inputMeterSelect.innerHTML = '';

            if (meters.length === 0) {
                inputMeterSelect.innerHTML = `<option value="">Default: ${station.meterCode}</option>`;
                inputMeterCode.value = station.meterCode;
                const latest = window.appStore.getLatestReadingForStation(stationId);
                inputOldReading.value = latest ? latest.newReading : station.initialReading;
            } else {
                let autoSelectedMeterId = null;
                const activeMeter = window.appStore.getActiveMeterForStation(stationId);
                if (activeMeter) autoSelectedMeterId = activeMeter.id;

                meters.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.id;
                    const statusTag = m.status === 'active' ? '(Đang dùng)' : '(Ngừng dùng)';
                    opt.innerText = `${m.meterCode} - ${m.name} ${statusTag}`;
                    if (m.id === autoSelectedMeterId) {
                        opt.selected = true;
                    }
                    inputMeterSelect.appendChild(opt);
                });

                inputMeterSelect.dispatchEvent(new Event('change'));
            }
        }
    });

    const inputCutoffDate = document.getElementById('inputCutoffDate');

    function formatDateVN(dateStr) {
        if (!dateStr) return '';
        const norm = window.normalizeDateString ? window.normalizeDateString(dateStr) : dateStr;
        const parts = norm.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return dateStr;
    }

    function getYesterdayDateStr(dateStr) {
        if (!dateStr) return '';
        const norm = window.normalizeDateString ? window.normalizeDateString(dateStr) : dateStr;
        const parts = norm.split('-');
        if (parts.length !== 3) return '';
        let y = parseInt(parts[0], 10);
        let m = parseInt(parts[1], 10);
        let d = parseInt(parts[2], 10);
        d--;
        if (d < 1) {
            m--;
            if (m < 1) {
                m = 12;
                y--;
            }
            d = new Date(y, m, 0).getDate();
        }
        const yyyy = String(y);
        const mm = String(m).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    function updateOldReadingFromDateAndMeter() {
        const stationId = inputStationSelect.value;
        const meterId = inputMeterSelect.value;
        const cutoffDate = inputCutoffDate.value;
        if (!stationId) return;

        const selDateVN = formatDateVN(cutoffDate);
        const yestDateStr = getYesterdayDateStr(cutoffDate);
        const yestDateVN = formatDateVN(yestDateStr);

        const labelOldReading = document.getElementById('labelOldReading');
        const labelNewReading = document.getElementById('labelNewReading');
        const labelGrossVolumeTitle = document.getElementById('labelGrossVolumeTitle');
        const cutoffDateHint = document.getElementById('cutoffDateHint');

        if (labelOldReading) labelOldReading.innerHTML = `<i class="fa-solid fa-arrow-left"></i> Chỉ Số Cũ - Ngày ${yestDateVN || 'Hôm Qua'} (m³) *`;
        if (labelNewReading) labelNewReading.innerHTML = `<i class="fa-solid fa-arrow-right"></i> Chỉ Số Mới - Ngày ${selDateVN || 'Hôm Nay'} (m³) *`;
        if (labelGrossVolumeTitle) labelGrossVolumeTitle.innerText = `SẢN LƯỢNG PHÁT RA NGÀY ${selDateVN || 'HÔM NAY'} (CHỈ SỐ NGÀY ${selDateVN || 'HÔM NAY'} - CHỈ SỐ NGÀY ${yestDateVN || 'HÔM QUA'})`;
        if (cutoffDateHint) cutoffDateHint.innerHTML = `<i class="fa-solid fa-circle-info"></i> Bạn đang chọn ngày chốt chỉ số <strong>${selDateVN}</strong>. Sản lượng phát ra (chỉ số mới ngày ${selDateVN} - chỉ số cũ ngày ${yestDateVN}) sẽ được ghi nhận và tính cho <strong>ngày ${selDateVN}</strong>.`;

        const selectedMeter = window.appStore.getMeterById(meterId);
        if (selectedMeter) {
            inputMeterCode.value = selectedMeter.meterCode;
        } else {
            const station = window.appStore.getStationById(stationId);
            if (station) inputMeterCode.value = station.meterCode;
        }

        // Check if a reading already exists for this station/meter on the exact selected cutoffDate
        const existingOnDate = window.appStore.getReadingForDate(stationId, meterId, cutoffDate);
        if (existingOnDate) {
            inputOldReading.value = existingOnDate.oldReading;
            inputNewReading.value = existingOnDate.newReading;
            if (inputAdditionVolume) inputAdditionVolume.value = existingOnDate.additionVolume || 0;
            if (inputAdditionNote) inputAdditionNote.value = existingOnDate.additionNote || '';
            if (inputInternalUse) inputInternalUse.value = existingOnDate.internalUse || 0;
            if (inputInternalUseNote) inputInternalUseNote.value = existingOnDate.internalUseNote || '';
            if (inputFlushingUse) inputFlushingUse.value = existingOnDate.flushingUse || 0;
            if (inputFlushingUseNote) inputFlushingUseNote.value = existingOnDate.flushingUseNote || '';
            if (inputLeakageLoss) inputLeakageLoss.value = existingOnDate.leakageLoss || 0;
            if (inputLeakageLossNote) inputLeakageLossNote.value = existingOnDate.leakageLossNote || '';
            if (inputOtherDeduction) inputOtherDeduction.value = existingOnDate.otherDeduction || 0;
            if (inputOtherDeductionNote) inputOtherDeductionNote.value = existingOnDate.otherDeductionNote || '';
            document.getElementById('inputNotes').value = existingOnDate.notes || '';
        } else {
            // Find the latest reading strictly before cutoffDate (yesterday's index)
            const prevReading = window.appStore.getLatestReadingBeforeDate(stationId, meterId, cutoffDate);
            if (prevReading && prevReading.newReading !== undefined) {
                inputOldReading.value = prevReading.newReading;
            } else if (selectedMeter) {
                inputOldReading.value = selectedMeter.initialReading;
            } else {
                const station = window.appStore.getStationById(stationId);
                inputOldReading.value = station ? station.initialReading : 0;
            }
            inputNewReading.value = '';
        }
        calculateFormTotals();
    }

    inputCutoffDate.addEventListener('change', updateOldReadingFromDateAndMeter);
    inputMeterSelect.addEventListener('change', updateOldReadingFromDateAndMeter);

    // ----------------------------------------------------
    // 5. Form Live Calculations & Save Action
    // ----------------------------------------------------
    const inputAdditionVolume = document.getElementById('inputAdditionVolume');
    const inputAdditionNote = document.getElementById('inputAdditionNote');
    const inputInternalUse = document.getElementById('inputInternalUse');
    const inputInternalUseNote = document.getElementById('inputInternalUseNote');
    const inputFlushingUse = document.getElementById('inputFlushingUse');
    const inputFlushingUseNote = document.getElementById('inputFlushingUseNote');
    const inputLeakageLoss = document.getElementById('inputLeakageLoss');
    const inputLeakageLossNote = document.getElementById('inputLeakageLossNote');
    const inputOtherDeduction = document.getElementById('inputOtherDeduction');
    const inputOtherDeductionNote = document.getElementById('inputOtherDeductionNote');

    const calcGrossVolume = document.getElementById('calcGrossVolume');
    const calcTotalDeduction = document.getElementById('calcTotalDeduction');
    const calcLossPercent = document.getElementById('calcLossPercent');
    const calcNetVolume = document.getElementById('calcNetVolume');
    const stationTypeBadgeHint = document.getElementById('stationTypeBadgeHint');

    function calculateFormTotals() {
        const stationId = inputStationSelect.value;
        const station = stationId ? window.appStore.getStationById(stationId) : null;
        const stType = station ? (station.type || 'plus') : 'plus';

        if (stationTypeBadgeHint) {
            stationTypeBadgeHint.className = stType === 'minus' ? 'badge badge-minus' : 'badge badge-plus';
            stationTypeBadgeHint.innerText = stType === 'minus' ? '➖ Trạm Trừ (-)' : '➕ Trạm Cộng (+)';
        }

        const oldVal = parseInt(inputOldReading.value) || 0;
        const newVal = parseInt(inputNewReading.value) || 0;
        // Today's production output = today's index (newVal) - yesterday's index (oldVal)
        const rawVol = newVal - oldVal;
        const gross = stType === 'minus' ? -rawVol : rawVol;

        const addition = parseInt(inputAdditionVolume?.value) || 0;

        const internal = parseInt(inputInternalUse.value) || 0;
        const flushing = parseInt(inputFlushingUse.value) || 0;
        const leakage = parseInt(inputLeakageLoss.value) || 0;
        const otherDed = parseInt(inputOtherDeduction?.value) || 0;
        const totalDeduction = internal + flushing + leakage + otherDed;

        const netVol = gross + addition - totalDeduction;

        const baseForLoss = (gross > 0 || addition > 0) ? (Math.max(gross, 0) + addition) : 0;
        const lossPercent = baseForLoss > 0 ? ((totalDeduction / baseForLoss) * 100).toFixed(2) : '0.00';

        const fmt = new Intl.NumberFormat('vi-VN');
        calcGrossVolume.innerText = `${fmt.format(gross)} m³ ${stType === 'minus' ? '(Trạm trừ)' : '(Trạm cộng)'}`;
        calcTotalDeduction.innerText = `${fmt.format(totalDeduction)} m³`;
        calcLossPercent.innerText = `${lossPercent}%`;
        if (calcNetVolume) calcNetVolume.innerText = `${fmt.format(netVol)} m³`;
    }

    [inputOldReading, inputNewReading, inputAdditionVolume, inputInternalUse, inputFlushingUse, inputLeakageLoss, inputOtherDeduction].forEach(input => {
        if (input) input.addEventListener('input', calculateFormTotals);
    });

    function processSaveReading(isMonthlyCutoff = false) {
        const unitId = inputUnitSelect.value;
        const stationId = inputStationSelect.value;
        const meterId = inputMeterSelect.value;
        const cutoffDate = inputCutoffDate.value;
        const oldReading = parseInt(inputOldReading.value) || 0;
        const newReading = parseInt(inputNewReading.value) || 0;

        if (!stationId) {
            showToast('Vui lòng chọn trạm trực thuộc trước!', 'danger');
            return;
        }

        const station = window.appStore.getStationById(stationId);
        if (station && station.isLocked) {
            showToast('Trạm này đang ở trạng thái Khóa. Không thể ghi/chốt chỉ số!', 'danger');
            return;
        }

        if (newReading < oldReading) {
            showToast('Chỉ số mới (ngày hôm nay) phải lớn hơn hoặc bằng chỉ số cũ (ngày hôm qua)!', 'danger');
            return;
        }

        const selectedMeter = window.appStore.getMeterById(meterId);
        const meterCode = selectedMeter ? selectedMeter.meterCode : (station ? station.meterCode : '');

        const readingData = {
            unitId,
            stationId,
            meterId: meterId || null,
            meterCode: meterCode,
            cutoffDate,
            oldReading,
            newReading,
            additionVolume: parseInt(inputAdditionVolume?.value) || 0,
            additionNote: inputAdditionNote?.value || '',
            internalUse: parseInt(inputInternalUse.value) || 0,
            internalUseNote: inputInternalUseNote?.value || '',
            flushingUse: parseInt(inputFlushingUse.value) || 0,
            flushingUseNote: inputFlushingUseNote?.value || '',
            leakageLoss: parseInt(inputLeakageLoss.value) || 0,
            leakageLossNote: inputLeakageLossNote?.value || '',
            otherDeduction: parseInt(inputOtherDeduction?.value) || 0,
            otherDeductionNote: inputOtherDeductionNote?.value || '',
            isMonthlyCutoff: isMonthlyCutoff,
            status: isMonthlyCutoff ? 'locked' : 'daily',
            notes: document.getElementById('inputNotes').value
        };

        window.appStore.saveReading(readingData);

        const statusMsg = isMonthlyCutoff 
            ? 'ĐÃ ĐẶT LÀM NGÀY CHỐT THÁNG DUY NHẤT CỦA TRẠM!' 
            : 'Đã lưu chỉ số ngày thành công!';
        showToast(statusMsg, 'success');

        if (inputAdditionVolume) inputAdditionVolume.value = '0';
        if (inputAdditionNote) inputAdditionNote.value = '';
        inputInternalUse.value = '0';
        if (inputInternalUseNote) inputInternalUseNote.value = '';
        inputFlushingUse.value = '0';
        if (inputFlushingUseNote) inputFlushingUseNote.value = '';
        inputLeakageLoss.value = '0';
        if (inputLeakageLossNote) inputLeakageLossNote.value = '';
        if (inputOtherDeduction) inputOtherDeduction.value = '0';
        if (inputOtherDeductionNote) inputOtherDeductionNote.value = '';
        document.getElementById('inputNotes').value = '';

        updateOldReadingFromDateAndMeter();
        updateDashboard();
    }

    const meterReadingForm = document.getElementById('meterReadingForm');
    meterReadingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        processSaveReading(true); // Lock as monthly cutoff on form submit
    });

    document.getElementById('btnSaveDaily').addEventListener('click', () => {
        processSaveReading(false); // Save as normal daily reading
    });

    document.getElementById('btnResetForm').addEventListener('click', () => {
        meterReadingForm.reset();
        document.getElementById('inputCutoffDate').value = today;
        inputStationSelect.disabled = true;
        inputStationSelect.innerHTML = '<option value="">-- Vui lòng chọn đơn vị cấp nước trước --</option>';
        calculateFormTotals();
    });

    // ----------------------------------------------------
    // 6. Meter Management Modals (Add, Stop, Replace Meters)
    // ----------------------------------------------------
    const meterManagementModal = document.getElementById('meterManagementModal');
    const btnCloseMeterManagementModal = document.getElementById('btnCloseMeterManagementModal');
    const btnCancelMeterManagementModal = document.getElementById('btnCancelMeterManagementModal');
    const stationMetersTableBody = document.getElementById('stationMetersTableBody');
    let currentManagingStationId = null;

    function openMeterManagementModal(stationId) {
        currentManagingStationId = stationId;
        const station = window.appStore.getStationById(stationId);
        if (!station) return;

        document.getElementById('manageStationTitle').innerText = `${station.name} (${station.code})`;
        renderStationMetersList(stationId);
        meterManagementModal.classList.add('active');
    }

    function closeMeterManagementModal() {
        meterManagementModal.classList.remove('active');
        currentManagingStationId = null;
    }

    btnCloseMeterManagementModal.addEventListener('click', closeMeterManagementModal);
    btnCancelMeterManagementModal.addEventListener('click', closeMeterManagementModal);

    function renderStationMetersList(stationId) {
        const meters = window.appStore.getMeters(stationId);
        const currentUser = window.appStore.getCurrentUser();
        const isAdmin = currentUser && currentUser.role === 'admin';
        const fmt = new Intl.NumberFormat('vi-VN');
        stationMetersTableBody.innerHTML = '';

        if (meters.length === 0) {
            stationMetersTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:16px; color:var(--text-muted);">Chưa có đồng hồ riêng. Bấm "Thêm Đồng Hồ" để bắt đầu.</td></tr>`;
            return;
        }

        meters.forEach(m => {
            const tr = document.createElement('tr');
            const statusBadge = m.status === 'active' 
                ? `<span class="badge badge-success"><i class="fa-solid fa-circle-check me-1"></i> Đang Sử Dụng</span>`
                : `<span class="badge badge-danger"><i class="fa-solid fa-circle-stop me-1"></i> Ngừng Sử Dụng</span>`;

            let actionBtns = '';
            if (m.status === 'active') {
                actionBtns += `
                    <button class="btn btn-danger btn-sm stop-single-meter-btn" data-id="${m.id}" data-code="${m.meterCode}">
                        <i class="fa-solid fa-ban"></i> Ngừng
                    </button>
                `;
            }

            if (isAdmin) {
                actionBtns += `
                    <button class="btn btn-danger btn-sm delete-meter-btn" data-id="${m.id}" data-code="${m.meterCode}" title="Xóa đồng hồ vĩnh viễn" style="background:#991b1b;">
                        <i class="fa-solid fa-trash"></i> Xóa
                    </button>
                `;
            }

            if (!actionBtns) actionBtns = '-';

            tr.innerHTML = `
                <td><code>${m.meterCode}</code></td>
                <td><strong>${m.name}</strong></td>
                <td>${fmt.format(m.initialReading)} m³</td>
                <td>${m.finalReading !== null ? fmt.format(m.finalReading) + ' m³' : '-'}</td>
                <td><small>${m.startDate}</small></td>
                <td>${statusBadge}</td>
                <td><div style="display:flex; gap:4px; flex-wrap:wrap;">${actionBtns}</div></td>
            `;
            stationMetersTableBody.appendChild(tr);
        });

        document.querySelectorAll('.stop-single-meter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const code = btn.getAttribute('data-code');
                openStopMeterModal(id, code);
            });
        });

        document.querySelectorAll('.delete-meter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const code = btn.getAttribute('data-code');
                if (confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN đồng hồ "${code}"?\n\nLưu ý: Tất cả chỉ số ghi nhận liên quan đến đồng hồ này cũng sẽ bị xóa!`)) {
                    window.appStore.deleteMeter(id);
                    showToast(`Đã xóa đồng hồ "${code}" và các chỉ số liên quan!`, 'success');
                    renderStationMetersList(stationId);
                    renderStationsTable();
                    updateDashboard();
                }
            });
        });
    }

    // Add Meter Modal
    const addMeterModal = document.getElementById('addMeterModal');
    const btnOpenAddMeterModal = document.getElementById('btnOpenAddMeterModal');
    const btnCloseAddMeterModal = document.getElementById('btnCloseAddMeterModal');
    const btnCancelAddMeterModal = document.getElementById('btnCancelAddMeterModal');
    const addMeterForm = document.getElementById('addMeterForm');

    btnOpenAddMeterModal.addEventListener('click', () => {
        if (!currentManagingStationId) return;
        document.getElementById('addMeterStationId').value = currentManagingStationId;
        document.getElementById('addMeterStartDate').value = today;
        addMeterModal.classList.add('active');
    });

    function closeAddMeterModal() {
        addMeterModal.classList.remove('active');
        addMeterForm.reset();
    }

    btnCloseAddMeterModal.addEventListener('click', closeAddMeterModal);
    btnCancelAddMeterModal.addEventListener('click', closeAddMeterModal);

    addMeterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const meterData = {
            stationId: document.getElementById('addMeterStationId').value,
            meterCode: document.getElementById('addMeterCodeInput').value,
            name: document.getElementById('addMeterNameInput').value,
            initialReading: document.getElementById('addMeterInitialReading').value,
            startDate: document.getElementById('addMeterStartDate').value
        };

        window.appStore.addMeter(meterData);
        showToast('Đã thêm đồng hồ mới thành công!', 'success');
        closeAddMeterModal();
        if (currentManagingStationId) renderStationMetersList(currentManagingStationId);
        renderStationsTable();
    });

    // Stop Meter Modal
    const stopMeterModal = document.getElementById('stopMeterModal');
    const btnCloseStopMeterModal = document.getElementById('btnCloseStopMeterModal');
    const btnCancelStopMeterModal = document.getElementById('btnCancelStopMeterModal');
    const stopMeterForm = document.getElementById('stopMeterForm');

    function openStopMeterModal(meterId, meterCode) {
        document.getElementById('stopMeterId').value = meterId;
        document.getElementById('stopMeterCodeText').innerText = meterCode;
        document.getElementById('stopMeterDate').value = today;

        const latest = window.appStore.getLatestReadingForStation(currentManagingStationId, meterId);
        if (latest) {
            document.getElementById('stopMeterFinalReading').value = latest.newReading || 0;
        }

        stopMeterModal.classList.add('active');
    }

    function closeStopMeterModal() {
        stopMeterModal.classList.remove('active');
        stopMeterForm.reset();
    }

    btnCloseStopMeterModal.addEventListener('click', closeStopMeterModal);
    btnCancelStopMeterModal.addEventListener('click', closeStopMeterModal);

    stopMeterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const meterId = document.getElementById('stopMeterId').value;
        const finalReading = document.getElementById('stopMeterFinalReading').value;
        const stopDate = document.getElementById('stopMeterDate').value;

        window.appStore.stopMeter(meterId, finalReading, stopDate);
        showToast('Đã ngừng sử dụng đồng hồ!', 'info');
        closeStopMeterModal();
        if (currentManagingStationId) renderStationMetersList(currentManagingStationId);
        renderStationsTable();
    });

    // Replace Meter Modal
    const replaceMeterModal = document.getElementById('replaceMeterModal');
    const btnOpenReplaceMeterModal = document.getElementById('btnOpenReplaceMeterModal');
    const btnCloseReplaceMeterModal = document.getElementById('btnCloseReplaceMeterModal');
    const btnCancelReplaceMeterModal = document.getElementById('btnCancelReplaceMeterModal');
    const replaceMeterForm = document.getElementById('replaceMeterForm');

    btnOpenReplaceMeterModal.addEventListener('click', () => {
        if (!currentManagingStationId) return;
        const activeMeter = window.appStore.getActiveMeterForStation(currentManagingStationId);
        
        document.getElementById('replaceStationId').value = currentManagingStationId;
        document.getElementById('replaceOldMeterId').value = activeMeter ? activeMeter.id : '';
        document.getElementById('replaceOldMeterCodeText').innerText = activeMeter ? `${activeMeter.meterCode} (${activeMeter.name})` : 'Không có';
        document.getElementById('replaceDate').value = today;

        if (activeMeter) {
            const latest = window.appStore.getLatestReadingForStation(currentManagingStationId, activeMeter.id);
            document.getElementById('replaceOldFinalReading').value = latest ? latest.newReading : activeMeter.initialReading;
        }

        replaceMeterModal.classList.add('active');
    });

    function closeReplaceMeterModal() {
        replaceMeterModal.classList.remove('active');
        replaceMeterForm.reset();
    }

    btnCloseReplaceMeterModal.addEventListener('click', closeReplaceMeterModal);
    btnCancelReplaceMeterModal.addEventListener('click', closeReplaceMeterModal);

    replaceMeterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const oldMeterId = document.getElementById('replaceOldMeterId').value;
        const oldFinalReading = document.getElementById('replaceOldFinalReading').value;
        const startDate = document.getElementById('replaceDate').value;

        const newMeterData = {
            stationId: document.getElementById('replaceStationId').value,
            meterCode: document.getElementById('replaceNewMeterCode').value,
            initialReading: document.getElementById('replaceNewInitialReading').value,
            startDate: startDate
        };

        window.appStore.replaceMeter(oldMeterId, oldFinalReading, newMeterData);
        showToast('Đã thực hiện thay đồng hồ nước mới thành công!', 'success');
        closeReplaceMeterModal();
        if (currentManagingStationId) renderStationMetersList(currentManagingStationId);
        renderStationsTable();
    });

    // ----------------------------------------------------
    // 7. Station Management: Create, Edit, Lock, Delete
    // ----------------------------------------------------
    const newStationModal = document.getElementById('newStationModal');
    const btnOpenNewStationModal = document.getElementById('btnOpenNewStationModal');
    const btnOpenNewStationModalGlobal = document.getElementById('btnOpenNewStationModalGlobal');
    const btnCloseNewStationModal = document.getElementById('btnCloseNewStationModal');
    const btnCancelNewStationModal = document.getElementById('btnCancelNewStationModal');
    const newStationForm = document.getElementById('newStationForm');

    function openStationModal(preselectUnit = '') {
        if (preselectUnit) {
            document.getElementById('modalStationUnit').value = preselectUnit;
        }
        newStationModal.classList.add('active');
    }

    function closeStationModal() {
        newStationModal.classList.remove('active');
        newStationForm.reset();
    }

    btnOpenNewStationModal.addEventListener('click', () => openStationModal(inputUnitSelect.value));
    btnOpenNewStationModalGlobal.addEventListener('click', () => openStationModal());
    btnCloseNewStationModal.addEventListener('click', closeStationModal);
    btnCancelNewStationModal.addEventListener('click', closeStationModal);

    newStationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const stationData = {
            unitId: document.getElementById('modalStationUnit').value,
            type: document.getElementById('modalStationType')?.value || 'plus',
            code: document.getElementById('modalStationCode').value,
            name: document.getElementById('modalStationName').value,
            meterCode: document.getElementById('modalMeterCode').value,
            defaultCutoffDay: document.getElementById('modalDefaultCutoffDay').value,
            initialReading: document.getElementById('modalInitialReading').value
        };

        const newSt = window.appStore.addStation(stationData);
        showToast(`Đã tạo thành công trạm "${newSt.name}"!`, 'success');
        closeStationModal();

        populateFilterStations(filterUnitSelect.value);
        if (inputUnitSelect.value === newSt.unitId) {
            inputUnitSelect.dispatchEvent(new Event('change'));
        }
        renderStationsTable();
        updateDashboard();
    });

    // Edit Station Modal
    const editStationModal = document.getElementById('editStationModal');
    const btnCloseEditStationModal = document.getElementById('btnCloseEditStationModal');
    const btnCancelEditStationModal = document.getElementById('btnCancelEditStationModal');
    const editStationForm = document.getElementById('editStationForm');

    function closeEditStationModal() {
        editStationModal.classList.remove('active');
        editStationForm.reset();
    }

    btnCloseEditStationModal.addEventListener('click', closeEditStationModal);
    btnCancelEditStationModal.addEventListener('click', closeEditStationModal);

    editStationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('editStationId').value;
        const updatedData = {
            unitId: document.getElementById('editStationUnit').value,
            code: document.getElementById('editStationCode').value,
            name: document.getElementById('editStationName').value,
            meterCode: document.getElementById('editMeterCode').value,
            defaultCutoffDay: document.getElementById('editDefaultCutoffDay').value,
            initialReading: document.getElementById('editInitialReading').value
        };

        window.appStore.updateStation(id, updatedData);
        showToast('Đã cập nhật thông tin trạm thành công!', 'success');
        closeEditStationModal();
        renderStationsTable();
        updateDashboard();
    });

    function renderStationsTable() {
        const stationsTableBody = document.getElementById('stationsTableBody');
        const stations = window.appStore.getStations();
        const currentUser = window.appStore.getCurrentUser();
        const isAdmin = currentUser && currentUser.role === 'admin';
        const fmt = new Intl.NumberFormat('vi-VN');

        stationsTableBody.innerHTML = '';

        if (stations.length === 0) {
            stationsTableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:24px; color:var(--text-muted);">Chưa có trạm trực thuộc nào. Bấm nút "Tạo Trạm Mới" để bắt đầu khởi tạo.</td></tr>`;
            return;
        }

        stations.forEach(st => {
            const unit = window.appStore.getUnitById(st.unitId);
            const activeMeter = window.appStore.getActiveMeterForStation(st.id);

            const tr = document.createElement('tr');
            const lockBadge = st.isLocked 
                ? `<span class="badge badge-danger"><i class="fa-solid fa-lock me-1"></i> Đã Khóa</span>`
                : `<span class="badge badge-success"><i class="fa-solid fa-lock-open me-1"></i> Mở</span>`;

            const typeBadge = st.type === 'minus'
                ? `<span class="badge badge-minus">➖ Trừ Đi (-)</span>`
                : `<span class="badge badge-plus">➕ Cộng Vào (+)</span>`;

            const activeMeterText = activeMeter 
                ? `<strong>${activeMeter.meterCode}</strong>` 
                : `<span>${st.meterCode}</span>`;

            let actionBtns = `
                <button class="btn btn-info btn-sm manage-meters-btn" data-id="${st.id}" title="Quản lý đồng hồ trạm" style="background:#0284c7; color:#fff;">
                    <i class="fa-solid fa-gauge-high"></i> Đồng Hồ
                </button>
                <button class="btn btn-secondary btn-sm edit-station-btn" data-id="${st.id}" title="Sửa trạm">
                    <i class="fa-solid fa-pen"></i> Sửa
                </button>
            `;

            if (isAdmin) {
                actionBtns += `
                    <button class="btn ${st.isLocked ? 'btn-success' : 'btn-warning'} btn-sm lock-station-btn" data-id="${st.id}" title="${st.isLocked ? 'Mở khóa trạm' : 'Khóa trạm'}">
                        <i class="fa-solid ${st.isLocked ? 'fa-lock-open' : 'fa-lock'}"></i> ${st.isLocked ? 'Mở' : 'Khóa'}
                    </button>
                    <button class="btn btn-danger btn-sm delete-station-btn" data-id="${st.id}" title="Xóa trạm">
                        <i class="fa-solid fa-trash"></i> Xóa
                    </button>
                `;
            }

            tr.innerHTML = `
                <td><code>${st.code}</code></td>
                <td><strong>${st.name}</strong></td>
                <td>${typeBadge}</td>
                <td><span class="badge badge-info">${unit ? unit.name : st.unitId}</span></td>
                <td>${activeMeterText}</td>
                <td>Ngày ${st.defaultCutoffDay} hàng tháng</td>
                <td>${fmt.format(st.initialReading)} m³</td>
                <td>${lockBadge}</td>
                <td><div style="display:flex; gap:6px; flex-wrap:wrap;">${actionBtns}</div></td>
            `;
            stationsTableBody.appendChild(tr);
        });

        document.querySelectorAll('.manage-meters-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                openMeterManagementModal(id);
            });
        });

        document.querySelectorAll('.edit-station-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const st = window.appStore.getStationById(id);
                if (st) {
                    document.getElementById('editStationId').value = st.id;
                    document.getElementById('editStationUnit').value = st.unitId;
                    document.getElementById('editStationCode').value = st.code;
                    document.getElementById('editStationName').value = st.name;
                    document.getElementById('editMeterCode').value = st.meterCode;
                    document.getElementById('editDefaultCutoffDay').value = st.defaultCutoffDay;
                    document.getElementById('editInitialReading').value = st.initialReading;
                    editStationModal.classList.add('active');
                }
            });
        });

        document.querySelectorAll('.lock-station-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const updated = window.appStore.toggleStationLock(id);
                if (updated) {
                    showToast(`Đã ${updated.isLocked ? 'khóa' : 'mở khóa'} trạm ${updated.name}`, 'info');
                    renderStationsTable();
                }
            });
        });

        document.querySelectorAll('.delete-station-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const st = window.appStore.getStationById(id);
                if (st && confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN trạm "${st.name}"?\n\nLưu ý: Tất cả đồng hồ và chỉ số ghi nhận của trạm này cũng sẽ bị xóa!`)) {
                    window.appStore.deleteStation(id);
                    showToast(`Đã xóa trạm "${st.name}" cùng toàn bộ đồng hồ và chỉ số liên quan!`, 'success');
                    renderStationsTable();
                    populateFilterStations(filterUnitSelect.value);
                    if (inputUnitSelect.value) {
                        inputUnitSelect.dispatchEvent(new Event('change'));
                    }
                    updateDashboard();
                }
            });
        });
    }

    // ----------------------------------------------------
    // 8. Edit Readings Modal Controller
    // ----------------------------------------------------
    const editReadingModal = document.getElementById('editReadingModal');
    const btnCloseEditReadingModal = document.getElementById('btnCloseEditReadingModal');
    const btnCancelEditReadingModal = document.getElementById('btnCancelEditReadingModal');
    const editReadingForm = document.getElementById('editReadingForm');

    function closeEditReadingModal() {
        editReadingModal.classList.remove('active');
        editReadingForm.reset();
    }

    btnCloseEditReadingModal.addEventListener('click', closeEditReadingModal);
    btnCancelEditReadingModal.addEventListener('click', closeEditReadingModal);

    editReadingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('editReadingId').value;
        const currentRec = window.appStore.getReadingById(id);
        if (!currentRec) return;

        const isMonthlyCutoff = document.getElementById('editReadingStatus').value === 'locked';
        const oldReading = parseInt(document.getElementById('editOldReading').value) || 0;
        const newReading = parseInt(document.getElementById('editNewReading').value) || 0;

        if (newReading < oldReading) {
            showToast('Chỉ số mới (ngày hôm nay) phải lớn hơn hoặc bằng chỉ số cũ (ngày hôm qua)!', 'danger');
            return;
        }

        const updatedReading = {
            id: id,
            unitId: currentRec.unitId,
            stationId: currentRec.stationId,
            meterId: currentRec.meterId,
            meterCode: currentRec.meterCode,
            cutoffDate: document.getElementById('editReadingCutoffDate').value,
            oldReading: oldReading,
            newReading: newReading,
            internalUse: parseInt(document.getElementById('editInternalUse').value) || 0,
            flushingUse: parseInt(document.getElementById('editFlushingUse').value) || 0,
            leakageLoss: parseInt(document.getElementById('editLeakageLoss').value) || 0,
            isMonthlyCutoff: isMonthlyCutoff,
            status: isMonthlyCutoff ? 'locked' : 'daily',
            notes: document.getElementById('editReadingNotes').value
        };

        window.appStore.saveReading(updatedReading);
        showToast('Cập nhật chỉ số thành công!', 'success');
        closeEditReadingModal();
        renderReadingsTable();
        updateDashboard();
    });

    // ----------------------------------------------------
    // 9. Daily Production Output Analytics Controller
    // ----------------------------------------------------
    const dailyFilterYear = document.getElementById('dailyFilterYear');
    const dailyFilterMonth = document.getElementById('dailyFilterMonth');
    const dailyFilterUnit = document.getElementById('dailyFilterUnit');
    const dailyFilterStation = document.getElementById('dailyFilterStation');
    const dailyTableBody = document.getElementById('dailyTableBody');

    function populateDailyStations(unitId) {
        const stations = window.appStore.getStations(unitId);
        dailyFilterStation.innerHTML = '<option value="all">-- Tất cả các trạm --</option>';
        stations.forEach(st => {
            const opt = document.createElement('option');
            opt.value = st.id;
            opt.innerText = `${st.name} (${st.code})`;
            dailyFilterStation.appendChild(opt);
        });
    }

    dailyFilterUnit.addEventListener('change', () => {
        populateDailyStations(dailyFilterUnit.value);
        renderDailyAnalytics();
    });

    [dailyFilterYear, dailyFilterMonth, dailyFilterStation].forEach(elem => {
        elem.addEventListener('change', renderDailyAnalytics);
    });

    function renderDailyAnalytics() {
        const year = parseInt(dailyFilterYear.value) || 2026;
        const month = parseInt(dailyFilterMonth.value) || 8;
        const unitId = dailyFilterUnit.value;
        const stationId = dailyFilterStation.value;

        window.appCharts.renderDailyProductionChart('dailyProductionChartCanvas', year, month, unitId, stationId);

        const dailyData = window.appStore.getDailyProductionBreakdown(year, month, unitId, stationId);
        const fmt = new Intl.NumberFormat('vi-VN');
        dailyTableBody.innerHTML = '';

        dailyData.forEach(d => {
            const tr = document.createElement('tr');
            const lossPercent = d.grossVolume > 0 ? ((d.totalDeduction / d.grossVolume) * 100).toFixed(2) : '0.00';
            
            const statusText = d.isMonthlyCutoffDay 
                ? `<span class="badge badge-success"><i class="fa-solid fa-calendar-check me-1"></i> Ngày Chốt Tháng (${d.recordsCount})</span>` 
                : (d.recordsCount > 0 
                    ? `<span class="badge badge-info"><i class="fa-solid fa-calendar-day me-1"></i> Ghi Ngày (${d.recordsCount})</span>`
                    : `<span class="badge badge-warning">Chưa Ghi</span>`);

            tr.innerHTML = `
                <td><strong>Ngày ${d.day}</strong></td>
                <td>${d.dateStr}</td>
                <td>${d.recordsCount} Bản Ghi</td>
                <td><strong style="color:var(--primary);">${fmt.format(d.grossVolume)} m³</strong></td>
                <td><span style="color:var(--danger);">${fmt.format(d.totalDeduction)} m³</span></td>
                <td>${lossPercent}%</td>
                <td>${statusText}</td>
            `;
            dailyTableBody.appendChild(tr);
        });
    }

    // ----------------------------------------------------
    // 10. Dashboard Refresh & KPI Update
    // ----------------------------------------------------
    function getActiveFilters() {
        return {
            year: document.getElementById('filterYear').value,
            month: document.getElementById('filterMonth').value,
            unitId: document.getElementById('filterUnit').value,
            stationId: document.getElementById('filterStation').value
        };
    }

    function updateDashboard() {
        const filters = getActiveFilters();
        const metrics = window.appStore.getAggregatedMetrics(filters);
        const fmt = new Intl.NumberFormat('vi-VN');

        const kpiPlusGross = document.getElementById('kpiPlusGross');
        const kpiMinusGross = document.getElementById('kpiMinusGross');
        const kpiAdditions = document.getElementById('kpiAdditions');
        const kpiNetVolume = document.getElementById('kpiNetVolume');

        if (kpiPlusGross) kpiPlusGross.innerText = `${fmt.format(metrics.totalPlusGross)} m³`;
        if (kpiMinusGross) kpiMinusGross.innerText = `${fmt.format(metrics.totalMinusGross)} m³`;
        if (kpiAdditions) kpiAdditions.innerText = `${fmt.format(metrics.totalAdditions)} m³`;
        if (kpiNetVolume) kpiNetVolume.innerText = `${fmt.format(metrics.totalNetVolume)} m³`;

        document.getElementById('kpiDeduction').innerText = `${fmt.format(metrics.totalDeduction)} m³`;
        document.getElementById('kpiLossRate').innerText = `Tỷ lệ giảm trừ: ${metrics.overallLossPercent}%`;
        document.getElementById('kpiActiveStations').innerText = `${metrics.activeStationsCount} Trạm (12 XNCN)`;

        window.appCharts.refreshAllCharts(filters);
    }

    // ----------------------------------------------------
    // 11. Readings Table & Flexible Cutoff Date Switching
    // ----------------------------------------------------
    const tableSearchInput = document.getElementById('tableSearchInput');
    const tableFilterUnit = document.getElementById('tableFilterUnit');
    const readingsTableBody = document.getElementById('readingsTableBody');

    function renderReadingsTable() {
        const filters = {
            search: tableSearchInput.value,
            unitId: tableFilterUnit.value
        };

        const readings = window.appStore.getReadings(filters);
        readingsTableBody.innerHTML = '';

        if (readings.length === 0) {
            readingsTableBody.innerHTML = `<tr><td colspan="13" style="text-align:center; padding: 24px; color:var(--text-muted);">Không tìm thấy dữ liệu chỉ số đồng hồ phù hợp.</td></tr>`;
            return;
        }

        const fmt = new Intl.NumberFormat('vi-VN');

        readings.forEach((r, idx) => {
            const unit = window.appStore.getUnitById(r.unitId);
            const station = window.appStore.getStationById(r.stationId);
            const stType = r.stationType || (station ? station.type : 'plus') || 'plus';

            const tr = document.createElement('tr');

            let badgeClass = 'badge-success';
            if (r.lossPercent > 10) badgeClass = 'badge-danger';
            else if (r.lossPercent > 6) badgeClass = 'badge-warning';

            const typeBadge = stType === 'minus' 
                ? `<span class="badge badge-minus" style="font-size:10px;">➖ Trừ</span>` 
                : `<span class="badge badge-plus" style="font-size:10px;">➕ Cộng</span>`;

            // Build detailed note text
            let noteParts = [];
            if (r.additionVolume > 0 && r.additionNote) noteParts.push(`<b>Tăng:</b> ${r.additionNote}`);
            if (r.internalUse > 0 && r.internalUseNote) noteParts.push(`<b>Nội bộ:</b> ${r.internalUseNote}`);
            if (r.flushingUse > 0 && r.flushingUseNote) noteParts.push(`<b>Thúc xả:</b> ${r.flushingUseNote}`);
            if (r.leakageLoss > 0 && r.leakageLossNote) noteParts.push(`<b>Rò rỉ:</b> ${r.leakageLossNote}`);
            if (r.otherDeduction > 0 && r.otherDeductionNote) noteParts.push(`<b>Khác:</b> ${r.otherDeductionNote}`);
            if (r.notes) noteParts.push(`<b>Chung:</b> ${r.notes}`);
            const detailedNotes = noteParts.length > 0 ? noteParts.join('<br>') : '-';

            let setCutoffBtn = '';
            if (!r.isMonthlyCutoff) {
                setCutoffBtn = `
                    <button class="btn btn-warning btn-sm set-monthly-cutoff-btn" data-id="${r.id}" title="Đặt làm ngày chốt tháng duy nhất">
                        <i class="fa-solid fa-calendar-check"></i> Đặt Chốt Tháng
                    </button>
                `;
            }

            tr.innerHTML = `
                <td><strong>${idx + 1}</strong></td>
                <td><strong>${formatDateVN(r.cutoffDate)}</strong></td>
                <td><span class="badge badge-info">${unit ? unit.name : r.unitId}</span></td>
                <td><strong>${station ? station.name : r.stationId}</strong> ${typeBadge}</td>
                <td><code>${r.meterCode || (station ? station.meterCode : '')}</code></td>
                <td><small>${fmt.format(r.oldReading)} ➔ ${fmt.format(r.newReading)}</small></td>
                <td><strong style="color:${stType === 'minus' ? 'var(--warning)' : 'var(--primary)'};">${fmt.format(r.grossVolume)}</strong></td>
                <td><span style="color:#059669; font-weight:600;">${r.additionVolume ? '+' + fmt.format(r.additionVolume) : '0'}</span></td>
                <td><span style="color:var(--danger);">${fmt.format(r.totalDeduction)}</span></td>
                <td><strong style="color:#0284c7;">${fmt.format(r.netVolume !== undefined ? r.netVolume : (r.grossVolume + (r.additionVolume || 0) - r.totalDeduction))}</strong></td>
                <td><span class="badge ${badgeClass}">${r.lossPercent}%</span></td>
                <td><small style="font-size:11px;">${detailedNotes}</small></td>
                <td>
                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                        ${setCutoffBtn}
                        <button class="btn btn-danger btn-sm delete-reading-btn" data-id="${r.id}" title="Xóa bản ghi chỉ số">
                            <i class="fa-solid fa-trash"></i> Xóa
                        </button>
                    </div>
                </td>
            `;
            readingsTableBody.appendChild(tr);
        });

        // Set as monthly cutoff click
        document.querySelectorAll('.set-monthly-cutoff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const updated = window.appStore.setMonthlyCutoffReading(id);
                if (updated) {
                    showToast(`Đã chuyển ngày ${updated.cutoffDate} làm NGÀY CHỐT THÁNG DUY NHẤT của trạm!`, 'success');
                    renderReadingsTable();
                    updateDashboard();
                }
            });
        });

        // Edit Reading click
        document.querySelectorAll('.edit-reading-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const rec = window.appStore.getReadingById(id);
                if (rec) {
                    document.getElementById('editReadingId').value = rec.id;
                    document.getElementById('editReadingCutoffDate').value = rec.cutoffDate;
                    document.getElementById('editReadingStatus').value = rec.isMonthlyCutoff ? 'locked' : 'daily';
                    document.getElementById('editOldReading').value = rec.oldReading;
                    document.getElementById('editNewReading').value = rec.newReading;
                    document.getElementById('editInternalUse').value = rec.internalUse;
                    document.getElementById('editFlushingUse').value = rec.flushingUse;
                    document.getElementById('editLeakageLoss').value = rec.leakageLoss;
                    document.getElementById('editReadingNotes').value = rec.notes || '';
                    editReadingModal.classList.add('active');
                }
            });
        });

        // Delete Reading click
        document.querySelectorAll('.delete-reading-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (confirm('Bạn có chắc chắn muốn xóa bản ghi chỉ số này không?')) {
                    window.appStore.deleteReading(id);
                    showToast('Đã xóa bản ghi chỉ số.', 'success');
                    renderReadingsTable();
                    updateDashboard();
                }
            });
        });
    }

    tableSearchInput.addEventListener('input', renderReadingsTable);
    tableFilterUnit.addEventListener('change', renderReadingsTable);

    document.getElementById('exportExcelBtn').addEventListener('click', () => {
        const filters = {
            search: tableSearchInput.value,
            unitId: tableFilterUnit.value
        };

        const readings = window.appStore.getReadings(filters);
        if (readings.length === 0) {
            showToast('Không có dữ liệu để xuất file Excel!', 'warning');
            return;
        }

        const exportData = readings.map((r, i) => {
            const unit = window.appStore.getUnitById(r.unitId);
            const station = window.appStore.getStationById(r.stationId);
            return {
                'STT': i + 1,
                'Ngày Ghi Chỉ Số': formatDateVN(r.cutoffDate),
                'Loại Ghi Nhận': r.isMonthlyCutoff ? 'Chốt Tháng' : 'Ghi Ngày',
                'Xí Nghiệp (XNCN)': unit ? unit.name : r.unitId,
                'Trạm Trực Thuộc': station ? station.name : r.stationId,
                'Mã Đồng Hồ': r.meterCode || (station ? station.meterCode : ''),
                'Chỉ Số Cũ (m³)': r.oldReading,
                'Chỉ Số Mới (m³)': r.newReading,
                'Sản Lượng Sản Xuất (m³)': r.grossVolume,
                'Giảm Trừ Nội Bộ (m³)': r.internalUse,
                'Giảm Trừ Xả Rửa (m³)': r.flushingUse,
                'Giảm Trừ Thất Thoát (m³)': r.leakageLoss,
                'Tổng Giảm Trừ (m³)': r.totalDeduction,
                'Tỷ Lệ Giảm Trừ (%)': r.lossPercent,
                'Ghi Chú': r.notes
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "SoChiSoDongHo");

        const fileName = `So_Chi_So_Nuoc_XNCN_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        showToast('Xuất file Excel thành công!', 'success');
    });

    document.getElementById('printReportBtn').addEventListener('click', () => {
        window.print();
    });

    // ----------------------------------------------------
    // 12. Admin User Approval View
    // ----------------------------------------------------
    function renderUsersTable() {
        const usersTableBody = document.getElementById('usersTableBody');
        const users = window.appStore.getUsers();

        usersTableBody.innerHTML = '';
        users.forEach((u, idx) => {
            const unit = window.appStore.getUnitById(u.unitId);
            const tr = document.createElement('tr');

            let statusBadge = '<span class="badge badge-warning">Chờ Admin Duyệt</span>';
            if (u.status === 'approved') statusBadge = '<span class="badge badge-success">Đã Phê Duyệt</span>';
            if (u.status === 'rejected') statusBadge = '<span class="badge badge-danger">Từ Chối</span>';

            let actionBtns = '-';
            if (u.role !== 'admin') {
                actionBtns = `
                    <button class="btn btn-success btn-sm approve-user-btn" data-id="${u.id}" ${u.status === 'approved' ? 'disabled style="opacity:0.5;"' : ''}>
                        <i class="fa-solid fa-check"></i> Duyệt
                    </button>
                    <button class="btn btn-danger btn-sm reject-user-btn" data-id="${u.id}" ${u.status === 'rejected' ? 'disabled style="opacity:0.5;"' : ''}>
                        <i class="fa-solid fa-xmark"></i> Từ Chối
                    </button>
                `;
            }

            tr.innerHTML = `
                <td><strong>${idx + 1}</strong></td>
                <td><strong>${u.fullName}</strong></td>
                <td><code>${u.username}</code></td>
                <td>${unit ? unit.name : (u.unitId === 'all' ? 'Toàn Công Ty' : u.unitId)}</td>
                <td><span class="badge badge-info">${u.role.toUpperCase()}</span></td>
                <td>${statusBadge}</td>
                <td><small>${new Date(u.createdAt).toLocaleDateString('vi-VN')}</small></td>
                <td><div style="display:flex; gap:6px;">${actionBtns}</div></td>
            `;
            usersTableBody.appendChild(tr);
        });

        document.querySelectorAll('.approve-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                window.appStore.approveUser(id);
                showToast('Đã phê duyệt tài khoản người dùng!', 'success');
                renderUsersTable();
            });
        });

        document.querySelectorAll('.reject-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                window.appStore.rejectUser(id);
                showToast('Đã từ chối quyền truy cập tài khoản!', 'warning');
                renderUsersTable();
            });
        });
    }

    // ----------------------------------------------------
    // 13. Theme Toggle & Toast System
    // ----------------------------------------------------
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    let isDarkMode = false;

    themeToggleBtn.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        if (isDarkMode) {
            document.body.setAttribute('data-theme', 'dark');
            themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun" style="color:#f59e0b;"></i>';
        } else {
            document.body.removeAttribute('data-theme');
            themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        }
    });

    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'fa-info-circle';
        if (type === 'success') icon = 'fa-circle-check';
        if (type === 'danger') icon = 'fa-triangle-exclamation';
        if (type === 'warning') icon = 'fa-triangle-exclamation';

        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3500);
    }

    populateFilterStations('all');
    populateDailyStations('all');
    checkAuth();

    // ----------------------------------------------------
    // 14. Real-time Google Sheets Cloud Sync Event Listeners
    // ----------------------------------------------------
    const btnSyncNow = document.getElementById('btnSyncNow');
    if (btnSyncNow) {
        btnSyncNow.addEventListener('click', async () => {
            showToast('Đang kết nối & đồng bộ dữ liệu từ Google Sheets...', 'info');
            await window.appStore.syncFromCloud(false);
        });
    }

    window.addEventListener('cloud-synced', (e) => {
        const detail = e.detail || {};
        if (detail.hasChanged) {
            populateFilterStations(document.getElementById('filterUnit')?.value || 'all');
            populateDailyStations(document.getElementById('dailyUnit')?.value || 'all');

            const activeNav = document.querySelector('.nav-item.active');
            if (activeNav) {
                const targetTab = activeNav.getAttribute('data-tab');
                if (targetTab === 'dashboard-view') updateDashboard();
                if (targetTab === 'daily-view') renderDailyView();
                if (targetTab === 'entry-view' && typeof renderQuickHistoryTable === 'function') renderQuickHistoryTable();
                if (targetTab === 'data-view') renderDataTable();
                if (targetTab === 'stations-view') renderStationsTable();
                if (targetTab === 'users-view') renderUsersTable();
            }
        }
    });

    // ----------------------------------------------------
    // 15. Progressive Web App (PWA) Registration & Install Prompt
    // ----------------------------------------------------
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then((reg) => {
                    console.log('[PWA] Service Worker registered successfully with scope:', reg.scope);
                })
                .catch((err) => {
                    console.warn('[PWA] Service Worker registration failed:', err);
                });
        });
    }

    let deferredPWAInstallPrompt = null;
    const btnInstallPWA = document.getElementById('btnInstallPWA');

    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent default browser install banner
        e.preventDefault();
        deferredPWAInstallPrompt = e;

        if (btnInstallPWA) {
            btnInstallPWA.style.display = 'inline-flex';
        }
    });

    if (btnInstallPWA) {
        btnInstallPWA.addEventListener('click', async () => {
            if (!deferredPWAInstallPrompt) {
                showToast('Ứng dụng đã được cài đặt hoặc trình duyệt không hỗ trợ nhắc cài đặt!', 'info');
                return;
            }

            deferredPWAInstallPrompt.prompt();
            const { outcome } = await deferredPWAInstallPrompt.userChoice;

            if (outcome === 'accepted') {
                showToast('Cài đặt ứng dụng Cấp Nước Sơn La thành công!', 'success');
            } else {
                showToast('Đã hủy cài đặt ứng dụng PWA.', 'info');
            }

            deferredPWAInstallPrompt = null;
            btnInstallPWA.style.display = 'none';
        });
    }

    // ----------------------------------------------------
    // 16. Excel Bulk Reading Import Controller (stationId, meterCode, cutoffDate, newReading)
    // ----------------------------------------------------
    const batchImportModal = document.getElementById('batchImportModal');
    const btnOpenBatchImportModalEntry = document.getElementById('btnOpenBatchImportModalEntry');
    const btnOpenBatchImportModalData = document.getElementById('btnOpenBatchImportModalData');
    const btnCloseBatchImportModal = document.getElementById('btnCloseBatchImportModal');
    const btnCancelBatchImportModal = document.getElementById('btnCancelBatchImportModal');
    const btnDownloadImportTemplate = document.getElementById('btnDownloadImportTemplate');
    const batchImportFileInput = document.getElementById('batchImportFileInput');
    const batchImportResultContainer = document.getElementById('batchImportResultContainer');
    const batchImportSummary = document.getElementById('batchImportSummary');
    const batchImportErrorList = document.getElementById('batchImportErrorList');
    const btnConfirmBatchImport = document.getElementById('btnConfirmBatchImport');

    let currentParsedBatch = [];

    function openBatchImportModal() {
        if (batchImportFileInput) batchImportFileInput.value = '';
        if (batchImportResultContainer) batchImportResultContainer.style.display = 'none';
        if (batchImportSummary) batchImportSummary.innerHTML = '';
        if (batchImportErrorList) batchImportErrorList.innerHTML = '';
        if (btnConfirmBatchImport) btnConfirmBatchImport.disabled = true;
        currentParsedBatch = [];
        if (batchImportModal) batchImportModal.classList.add('active');
    }

    function closeBatchImportModal() {
        if (batchImportModal) batchImportModal.classList.remove('active');
        if (batchImportFileInput) batchImportFileInput.value = '';
        currentParsedBatch = [];
    }

    if (btnOpenBatchImportModalEntry) btnOpenBatchImportModalEntry.addEventListener('click', openBatchImportModal);
    if (btnOpenBatchImportModalData) btnOpenBatchImportModalData.addEventListener('click', openBatchImportModal);
    if (btnCloseBatchImportModal) btnCloseBatchImportModal.addEventListener('click', closeBatchImportModal);
    if (btnCancelBatchImportModal) btnCancelBatchImportModal.addEventListener('click', closeBatchImportModal);

    // Download Sample Excel Template
    if (btnDownloadImportTemplate) {
        btnDownloadImportTemplate.addEventListener('click', () => {
            const allStations = window.appStore.getStations('all');
            const sampleRows = [];

            if (allStations.length > 0) {
                allStations.slice(0, 5).forEach(st => {
                    const meters = window.appStore.getMeters(st.id);
                    const meterCode = meters.length > 0 ? meters[0].meterCode : (st.meterCode || 'DH-01');
                    sampleRows.push({
                        'stationId': st.id,
                        'meterCode': meterCode,
                        'cutoffDate': formatDateVN(new Date().toISOString().split('T')[0]),
                        'newReading': (st.initialReading || 1000) + 50
                    });
                });
            } else {
                sampleRows.push(
                    { 'stationId': 'st-xncn-tp1-01', 'meterCode': 'DH-TP1-01', 'cutoffDate': '2026-08-07', 'newReading': 1050 },
                    { 'stationId': 'st-xncn-tp1-02', 'meterCode': 'DH-TP1-02', 'cutoffDate': '2026-08-07', 'newReading': 2100 }
                );
            }

            const worksheet = XLSX.utils.json_to_sheet(sampleRows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "MauNhapChiSo");
            XLSX.writeFile(workbook, "Mau_Nhap_Chi_So_Hang_Loat.xlsx");
            showToast('Đã tải xuống file Excel mẫu thành công!', 'success');
        });
    }

    // Helper to find column value regardless of case or accents
    function findRowVal(row, keyNames) {
        for (const k of Object.keys(row)) {
            const cleanK = k.toLowerCase().trim().replace(/[_ \-]/g, '');
            for (const target of keyNames) {
                if (cleanK === target.toLowerCase().replace(/[_ \-]/g, '')) {
                    return row[k];
                }
            }
        }
        return null;
    }

    // Parse Excel File on Selection
    if (batchImportFileInput) {
        batchImportFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const rawRows = XLSX.utils.sheet_to_json(sheet, { raw: false, dateNF: 'yyyy-mm-dd' });

                    if (rawRows.length === 0) {
                        showToast('File Excel được chọn không có dữ liệu!', 'warning');
                        return;
                    }

                    const validList = [];
                    const errorMsgs = [];
                    const allStations = window.appStore.getStations('all');

                    rawRows.forEach((row, idx) => {
                        const rowNum = idx + 2; // Row number in Excel (header is row 1)
                        const stIdRaw = findRowVal(row, ['stationId', 'station_id', 'station', 'matram', 'mã trạm']);
                        const mCodeRaw = findRowVal(row, ['meterCode', 'meter_code', 'meter', 'madongho', 'mã đồng hồ']);
                        const cDateRaw = findRowVal(row, ['cutoffDate', 'cutoff_date', 'date', 'ngayghi', 'ngày ghi']);
                        const nReadingRaw = findRowVal(row, ['newReading', 'new_reading', 'reading', 'chisomoi', 'chỉ số mới']);

                        if (!stIdRaw && !mCodeRaw && !cDateRaw && !nReadingRaw) return; // Empty row

                        // 1. Resolve Station
                        const searchSt = String(stIdRaw || '').trim();
                        const station = allStations.find(s => 
                            s.id === searchSt || 
                            s.code.toLowerCase() === searchSt.toLowerCase() || 
                            s.name.toLowerCase() === searchSt.toLowerCase()
                        );

                        if (!station) {
                            errorMsgs.push(`Dòng ${rowNum}: Không tìm thấy Trạm với ID/Mã/Tên "${stIdRaw || 'bỏ trống'}".`);
                            return;
                        }

                        if (station.isLocked) {
                            errorMsgs.push(`Dòng ${rowNum}: Trạm "${station.name}" đang bị khóa.`);
                            return;
                        }

                        // 2. Resolve Cutoff Date
                        const normDate = window.normalizeDateString ? window.normalizeDateString(cDateRaw) : String(cDateRaw || '').trim();
                        if (!normDate || normDate.length < 8) {
                            errorMsgs.push(`Dòng ${rowNum}: Ngày chốt chỉ số "${cDateRaw}" không hợp lệ.`);
                            return;
                        }

                        // 3. Resolve New Reading
                        const newReading = parseInt(nReadingRaw);
                        if (isNaN(newReading) || newReading < 0) {
                            errorMsgs.push(`Dòng ${rowNum}: Chỉ số mới "${nReadingRaw}" không phải số hợp lệ.`);
                            return;
                        }

                        // 4. Resolve Meter
                        const searchMeterCode = String(mCodeRaw || '').trim();
                        const meters = window.appStore.getMeters(station.id);
                        let selectedMeter = meters.find(m => m.meterCode.toLowerCase() === searchMeterCode.toLowerCase());
                        if (!selectedMeter) {
                            selectedMeter = window.appStore.getActiveMeterForStation(station.id);
                        }
                        const meterId = selectedMeter ? selectedMeter.id : null;
                        const meterCode = selectedMeter ? selectedMeter.meterCode : (station.meterCode || searchMeterCode);

                        // 5. Lookup Old Reading
                        const prevReading = window.appStore.getLatestReadingBeforeDate(station.id, meterId, normDate);
                        let oldReading = 0;
                        if (prevReading && prevReading.newReading !== undefined) {
                            oldReading = prevReading.newReading;
                        } else if (selectedMeter) {
                            oldReading = selectedMeter.initialReading;
                        } else {
                            oldReading = station.initialReading || 0;
                        }

                        if (newReading < oldReading) {
                            errorMsgs.push(`Dòng ${rowNum} (${station.name}): Chỉ số mới (${newReading}) nhỏ hơn chỉ số cũ (${oldReading}).`);
                            return;
                        }

                        validList.push({
                            unitId: station.unitId,
                            stationId: station.id,
                            meterId: meterId,
                            meterCode: meterCode,
                            cutoffDate: normDate,
                            oldReading: oldReading,
                            newReading: newReading,
                            status: 'daily'
                        });
                    });

                    currentParsedBatch = validList;
                    batchImportResultContainer.style.display = 'block';

                    if (validList.length > 0) {
                        batchImportSummary.innerHTML = `<span style="color:#059669;"><i class="fa-solid fa-circle-check"></i> Đã xử lý hợp lệ: ${validList.length} / ${rawRows.length} dòng.</span>`;
                        btnConfirmBatchImport.disabled = false;
                    } else {
                        batchImportSummary.innerHTML = `<span style="color:#be123c;"><i class="fa-solid fa-circle-xmark"></i> Không có dòng nào hợp lệ để nhập vào hệ thống!</span>`;
                        btnConfirmBatchImport.disabled = true;
                    }

                    if (errorMsgs.length > 0) {
                        batchImportErrorList.style.display = 'block';
                        batchImportErrorList.innerHTML = `<strong>Chi tiết dòng lỗi (${errorMsgs.length}):</strong><br>` + errorMsgs.join('<br>');
                    } else {
                        batchImportErrorList.style.display = 'none';
                        batchImportErrorList.innerHTML = '';
                    }

                } catch (err) {
                    console.error('Error parsing Excel file:', err);
                    showToast('Có lỗi xảy ra khi đọc file Excel. Vui lòng kiểm tra lại định dạng file!', 'danger');
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    // Confirm Batch Import & Save
    if (btnConfirmBatchImport) {
        btnConfirmBatchImport.addEventListener('click', () => {
            if (currentParsedBatch.length === 0) return;

            const saved = window.appStore.saveBatchReadings(currentParsedBatch);
            showToast(`Đã nhập thành công ${saved.length} bản ghi chỉ số từ file Excel!`, 'success');
            closeBatchImportModal();

            updateDashboard();
            renderReadingsTable();
            if (typeof renderDailyAnalytics === 'function') renderDailyAnalytics();
        });
    }

    window.addEventListener('appinstalled', () => {
        console.log('[PWA] App installed successfully');
        showToast('Chúc mừng! Đã cài đặt ứng dụng Cấp Nước Sơn La thành công!', 'success');
        if (btnInstallPWA) btnInstallPWA.style.display = 'none';
    });
});

