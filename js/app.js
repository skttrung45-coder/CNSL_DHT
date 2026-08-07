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

    function switchTab(targetViewId) {
        navItems.forEach(item => {
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

    inputMeterSelect.addEventListener('change', () => {
        const stationId = inputStationSelect.value;
        const meterId = inputMeterSelect.value;
        if (!stationId) return;

        const selectedMeter = window.appStore.getMeterById(meterId);
        if (selectedMeter) {
            inputMeterCode.value = selectedMeter.meterCode;
            const latest = window.appStore.getLatestReadingForStation(stationId, meterId);
            if (latest && latest.newReading !== undefined) {
                inputOldReading.value = latest.newReading;
            } else {
                inputOldReading.value = selectedMeter.initialReading;
            }
        } else {
            const station = window.appStore.getStationById(stationId);
            if (station) {
                inputMeterCode.value = station.meterCode;
                const latest = window.appStore.getLatestReadingForStation(stationId);
                inputOldReading.value = latest ? latest.newReading : station.initialReading;
            }
        }
        calculateFormTotals();
    });

    // ----------------------------------------------------
    // 5. Form Live Calculations & Save Action
    // ----------------------------------------------------
    const inputInternalUse = document.getElementById('inputInternalUse');
    const inputFlushingUse = document.getElementById('inputFlushingUse');
    const inputLeakageLoss = document.getElementById('inputLeakageLoss');

    const calcGrossVolume = document.getElementById('calcGrossVolume');
    const calcTotalDeduction = document.getElementById('calcTotalDeduction');
    const calcLossPercent = document.getElementById('calcLossPercent');

    function calculateFormTotals() {
        const oldVal = parseInt(inputOldReading.value) || 0;
        const newVal = parseInt(inputNewReading.value) || 0;
        const gross = Math.max(0, newVal - oldVal);

        const internal = parseInt(inputInternalUse.value) || 0;
        const flushing = parseInt(inputFlushingUse.value) || 0;
        const leakage = parseInt(inputLeakageLoss.value) || 0;
        const totalDeduction = internal + flushing + leakage;

        const lossPercent = gross > 0 ? ((totalDeduction / gross) * 100).toFixed(2) : '0.00';

        const fmt = new Intl.NumberFormat('vi-VN');
        calcGrossVolume.innerText = `${fmt.format(gross)} m³`;
        calcTotalDeduction.innerText = `${fmt.format(totalDeduction)} m³`;
        calcLossPercent.innerText = `${lossPercent}%`;
    }

    [inputOldReading, inputNewReading, inputInternalUse, inputFlushingUse, inputLeakageLoss].forEach(input => {
        input.addEventListener('input', calculateFormTotals);
    });

    function processSaveReading(isMonthlyCutoff = false) {
        const unitId = inputUnitSelect.value;
        const stationId = inputStationSelect.value;
        const meterId = inputMeterSelect.value;
        const cutoffDate = document.getElementById('inputCutoffDate').value;
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
            showToast('Chỉ số mới phải lớn hơn hoặc bằng chỉ số cũ!', 'danger');
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
            internalUse: parseInt(inputInternalUse.value) || 0,
            flushingUse: parseInt(inputFlushingUse.value) || 0,
            leakageLoss: parseInt(inputLeakageLoss.value) || 0,
            isMonthlyCutoff: isMonthlyCutoff,
            status: isMonthlyCutoff ? 'locked' : 'daily',
            notes: document.getElementById('inputNotes').value
        };

        window.appStore.saveReading(readingData);

        const statusMsg = isMonthlyCutoff 
            ? 'ĐÃ ĐẶT LÀM NGÀY CHỐT THÁNG DUY NHẤT CỦA TRẠM!' 
            : 'Đã lưu chỉ số ngày thành công!';
        showToast(statusMsg, 'success');

        inputNewReading.value = '';
        inputInternalUse.value = '0';
        inputFlushingUse.value = '0';
        inputLeakageLoss.value = '0';
        document.getElementById('inputNotes').value = '';

        inputOldReading.value = newReading;
        calculateFormTotals();
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
            stationsTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:var(--text-muted);">Chưa có trạm trực thuộc nào. Bấm nút "Tạo Trạm Mới" để bắt đầu khởi tạo.</td></tr>`;
            return;
        }

        stations.forEach(st => {
            const unit = window.appStore.getUnitById(st.unitId);
            const activeMeter = window.appStore.getActiveMeterForStation(st.id);

            const tr = document.createElement('tr');
            const lockBadge = st.isLocked 
                ? `<span class="badge badge-danger"><i class="fa-solid fa-lock me-1"></i> Đã Khóa</span>`
                : `<span class="badge badge-success"><i class="fa-solid fa-lock-open me-1"></i> Mở</span>`;

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

        const updatedReading = {
            id: id,
            unitId: currentRec.unitId,
            stationId: currentRec.stationId,
            meterId: currentRec.meterId,
            meterCode: currentRec.meterCode,
            cutoffDate: document.getElementById('editReadingCutoffDate').value,
            oldReading: parseInt(document.getElementById('editOldReading').value) || 0,
            newReading: parseInt(document.getElementById('editNewReading').value) || 0,
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

        document.getElementById('kpiGross').innerText = `${fmt.format(metrics.totalGross)} m³`;
        document.getElementById('kpiDeduction').innerText = `${fmt.format(metrics.totalDeduction)} m³`;
        document.getElementById('kpiLossRate').innerText = `Tỷ lệ giảm trừ: ${metrics.overallLossPercent}%`;
        document.getElementById('kpiActiveStations').innerText = `${metrics.activeStationsCount} Trạm`;
        document.getElementById('kpiActiveUnits').innerText = filters.unitId !== 'all' ? '1 XNCN' : `${metrics.activeUnitsCount || 12} XNCN`;

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
            readingsTableBody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding: 24px; color:var(--text-muted);">Không tìm thấy dữ liệu chỉ số đồng hồ phù hợp.</td></tr>`;
            return;
        }

        const fmt = new Intl.NumberFormat('vi-VN');

        readings.forEach((r, idx) => {
            const unit = window.appStore.getUnitById(r.unitId);
            const station = window.appStore.getStationById(r.stationId);

            const tr = document.createElement('tr');

            let badgeClass = 'badge-success';
            if (r.lossPercent > 10) badgeClass = 'badge-danger';
            else if (r.lossPercent > 6) badgeClass = 'badge-warning';

            const statusBadge = r.isMonthlyCutoff 
                ? `<span class="badge badge-success"><i class="fa-solid fa-calendar-check me-1"></i> Chốt Tháng</span>`
                : `<span class="badge badge-info"><i class="fa-solid fa-calendar-day me-1"></i> Ghi Ngày</span>`;

            let setCutoffBtn = '';
            if (!r.isMonthlyCutoff) {
                setCutoffBtn = `
                    <button class="btn btn-warning btn-sm set-monthly-cutoff-btn" data-id="${r.id}" title="Đặt ngày này làm ngày chốt tháng duy nhất của trạm">
                        <i class="fa-solid fa-calendar-check"></i> Đặt Chốt Tháng
                    </button>
                `;
            }

            tr.innerHTML = `
                <td><strong>${idx + 1}</strong></td>
                <td>${r.cutoffDate}</td>
                <td><span class="badge badge-info">${unit ? unit.name : r.unitId}</span></td>
                <td><strong>${station ? station.name : r.stationId}</strong></td>
                <td><code>${r.meterCode || (station ? station.meterCode : '')}</code></td>
                <td>${fmt.format(r.oldReading)}</td>
                <td>${fmt.format(r.newReading)}</td>
                <td><strong style="color:var(--primary);">${fmt.format(r.grossVolume)}</strong></td>
                <td><span style="color:var(--danger);">${fmt.format(r.totalDeduction)}</span></td>
                <td><span class="badge ${badgeClass}">${r.lossPercent}%</span></td>
                <td>${statusBadge}</td>
                <td>
                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                        ${setCutoffBtn}
                        <button class="btn btn-secondary btn-sm edit-reading-btn" data-id="${r.id}" title="Sửa chỉ số">
                            <i class="fa-solid fa-pen"></i> Sửa
                        </button>
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
                'Ngày Ghi Chỉ Số': r.cutoffDate,
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
});
