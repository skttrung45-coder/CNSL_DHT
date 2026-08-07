/**
 * STORE.JS - Data management layer using localStorage with User Auth, Station Controls, Meter Management & Single Monthly Cutoff Enforcement
 */

const STORAGE_KEYS = {
    UNITS: 'xncn_units_v5',
    STATIONS: 'xncn_stations_v5',
    METERS: 'xncn_meters_v5',
    READINGS: 'xncn_readings_v5',
    USERS: 'xncn_users_v5',
    CURRENT_USER: 'xncn_current_user_v5'
};

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzxopurfVlw8o2Z-J6Y1QZYim_WW88Yq3fB-soPI7qa-wF6zghjJ_-H_bHag7yfur5i/exec';

function normalizeDateString(dateVal) {
    if (!dateVal) return '';
    if (typeof dateVal !== 'string') dateVal = String(dateVal);
    dateVal = dateVal.trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        return dateVal;
    }

    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateVal)) {
        const p = dateVal.split('/');
        const dd = p[0].padStart(2, '0');
        const mm = p[1].padStart(2, '0');
        const yyyy = p[2];
        return `${yyyy}-${mm}-${dd}`;
    }

    if (dateVal.includes('T')) {
        const d = new Date(dateVal);
        if (!isNaN(d.getTime())) {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        }
        return dateVal.split('T')[0];
    }

    return dateVal;
}
window.normalizeDateString = normalizeDateString;

class DataStore {
    constructor() {
        this.initStorage();
        this.syncStatus = 'connecting'; // 'connected' | 'syncing' | 'offline'
        this.lastSyncedAt = null;
        this.isSyncing = false;

        // Auto initial fetch from cloud & setup background polling every 3 seconds for high-speed sync
        setTimeout(() => this.syncFromCloud(), 100);
        setInterval(() => this.syncFromCloud(true), 3000);
    }

    initStorage() {
        if (!localStorage.getItem(STORAGE_KEYS.UNITS)) {
            localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(window.INITIAL_DATA.units));
        }
        if (!localStorage.getItem(STORAGE_KEYS.STATIONS)) {
            localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.METERS)) {
            localStorage.setItem(STORAGE_KEYS.METERS, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.READINGS)) {
            localStorage.setItem(STORAGE_KEYS.READINGS, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(window.INITIAL_DATA.users));
        }
    }

    // --- GOOGLE SHEETS REAL-TIME DATABASE SYNC ENGINE ---
    async syncFromCloud(isBackground = false) {
        if (!GAS_URL) return;
        if (this.isSyncing && isBackground) return;
        // Don't overwrite local storage if we just performed a local write in the last 1.5 seconds
        if (this.lastWriteTime && (Date.now() - this.lastWriteTime < 1500)) return;

        this.updateSyncUI('syncing', 'Google Sheets: Đang đồng bộ...');
        this.isSyncing = true;

        try {
            const res = await fetch(GAS_URL + '?action=all');
            if (!res.ok) throw new Error('HTTP status ' + res.status);
            const data = await res.json();

            let hasChanged = false;
            let isCloudEmpty = true;
            const keysMap = {
                units: STORAGE_KEYS.UNITS,
                stations: STORAGE_KEYS.STATIONS,
                meters: STORAGE_KEYS.METERS,
                readings: STORAGE_KEYS.READINGS,
                users: STORAGE_KEYS.USERS
            };

            for (const [key, storageKey] of Object.entries(keysMap)) {
                if (data[key] && Array.isArray(data[key]) && data[key].length > 0) {
                    isCloudEmpty = false;
                    if (key === 'readings') {
                        data[key] = data[key].map(r => {
                            if (r.cutoffDate) {
                                const normDate = normalizeDateString(r.cutoffDate);
                                r.cutoffDate = normDate;
                                const parts = normDate.split('-');
                                if (parts.length === 3) {
                                    r.year = parseInt(parts[0]);
                                    r.month = parseInt(parts[1]);
                                }
                            }
                            return r;
                        });
                    }
                    const currentLocal = localStorage.getItem(storageKey);
                    const newCloudStr = JSON.stringify(data[key]);
                    if (currentLocal !== newCloudStr) {
                        localStorage.setItem(storageKey, newCloudStr);
                        hasChanged = true;
                    }
                }
            }

            // If cloud spreadsheet is completely empty (first time deployment), seed cloud from local default data
            if (isCloudEmpty) {
                await this.syncAllToCloud();
            }

            this.lastSyncedAt = new Date();
            this.updateSyncUI('connected', `Google Sheets: Đã kết nối (${this.lastSyncedAt.toLocaleTimeString()})`);

            if (hasChanged || !isBackground) {
                window.dispatchEvent(new CustomEvent('cloud-synced', { detail: { hasChanged, isBackground } }));
            }
        } catch (err) {
            console.warn('Cloud sync offline or error:', err);
            this.updateSyncUI('offline', 'Google Sheets: Ngoại tuyến (Đã lưu local)');
        } finally {
            this.isSyncing = false;
        }
    }

    async syncTableToCloud(tableName) {
        if (!GAS_URL) return;
        this.lastWriteTime = Date.now();
        this.updateSyncUI('syncing', `Đang đẩy ${tableName} lên Google Sheets...`);
        try {
            const keyUpper = tableName.toUpperCase();
            const storageKey = STORAGE_KEYS[keyUpper];
            if (!storageKey) return;
            const data = JSON.parse(localStorage.getItem(storageKey) || '[]');

            await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: 'save_table',
                    tableName: tableName,
                    data: data
                })
            });
            this.lastSyncedAt = new Date();
            this.updateSyncUI('connected', `Google Sheets: Đã đồng bộ (${this.lastSyncedAt.toLocaleTimeString()})`);
        } catch (err) {
            console.warn('Failed to sync table to cloud:', err);
            this.updateSyncUI('offline', 'Google Sheets: Lưu local (Chờ kết nối)');
        }
    }

    async syncAllToCloud() {
        if (!GAS_URL) return;
        this.lastWriteTime = Date.now();
        this.updateSyncUI('syncing', 'Đang đồng bộ tất cả lên Google Sheets...');
        try {
            const payload = {
                units: this.getUnits(),
                stations: this.getStations(),
                meters: JSON.parse(localStorage.getItem(STORAGE_KEYS.METERS) || '[]'),
                readings: JSON.parse(localStorage.getItem(STORAGE_KEYS.READINGS) || '[]'),
                users: this.getUsers()
            };

            await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: 'sync_all',
                    payload: payload
                })
            });
            this.lastSyncedAt = new Date();
            this.updateSyncUI('connected', `Google Sheets: Đã đồng bộ (${this.lastSyncedAt.toLocaleTimeString()})`);
        } catch (err) {
            console.warn('Failed syncAllToCloud:', err);
            this.updateSyncUI('offline', 'Google Sheets: Lưu local (Chờ kết nối)');
        }
    }

    updateSyncUI(status, text) {
        this.syncStatus = status;
        const badge = document.getElementById('cloudSyncBadge');
        const textElem = document.getElementById('cloudStatusText');
        if (badge && textElem) {
            badge.className = `cloud-sync-badge ${status}`;
            textElem.innerText = text;
        }
    }

    resetData() {
        localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(window.INITIAL_DATA.units));
        localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.METERS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.READINGS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(window.INITIAL_DATA.users));
        this.syncAllToCloud();
    }

    // --- AUTHENTICATION & USER MANAGEMENT ---
    getUsers() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    }

    saveUsers(users) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        this.syncTableToCloud('users');
    }

    getCurrentUser() {
        const userJson = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        return userJson ? JSON.parse(userJson) : null;
    }

    setCurrentUser(user) {
        if (user) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        } else {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        }
    }

    login(username, password) {
        const users = this.getUsers();
        const cleanUser = String(username || '').trim().toLowerCase();
        const cleanPassword = String(password || '').trim();

        const user = users.find(u => String(u.username || '').trim().toLowerCase() === cleanUser);
        if (!user) {
            return { success: false, message: 'Tên đăng nhập không tồn tại!' };
        }

        if (String(user.password || '').trim() !== cleanPassword) {
            return { success: false, message: 'Mật khẩu không chính xác!' };
        }

        const userStatus = String(user.status || 'pending').toLowerCase();

        if (userStatus === 'pending') {
            return { success: false, message: 'Tài khoản của bạn đang chờ Admin phê duyệt trước khi có thể đăng nhập!' };
        }

        if (userStatus === 'rejected') {
            return { success: false, message: 'Tài khoản của bạn đã bị từ chối đăng nhập. Vui lòng liên hệ Admin!' };
        }

        this.setCurrentUser(user);
        return { success: true, user: user };
    }

    register(userData) {
        const users = this.getUsers();
        const cleanUser = String(userData.username || '').trim().toLowerCase();

        if (users.some(u => String(u.username || '').trim().toLowerCase() === cleanUser)) {
            return { success: false, message: 'Tên đăng nhập đã được sử dụng!' };
        }

        const newUser = {
            id: 'usr-' + Date.now(),
            username: cleanUser,
            password: String(userData.password || '').trim(),
            fullName: String(userData.fullName || '').trim(),
            unitId: userData.unitId || 'all',
            role: 'staff',
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        this.saveUsers(users);
        return { success: true, message: 'Đăng ký thành công! Vui lòng chờ tài khoản Admin phê duyệt.' };
    }

    logout() {
        this.setCurrentUser(null);
    }

    approveUser(userId) {
        const users = this.getUsers();
        const targetId = String(userId);
        const index = users.findIndex(u => String(u.id) === targetId);
        if (index >= 0) {
            users[index].status = 'approved';
            this.saveUsers(users);
            return true;
        }
        return false;
    }

    rejectUser(userId) {
        const users = this.getUsers();
        const targetId = String(userId);
        const index = users.findIndex(u => String(u.id) === targetId);
        if (index >= 0) {
            users[index].status = 'rejected';
            this.saveUsers(users);
            return true;
        }
        return false;
    }

    changePassword(userId, newPassword) {
        const users = this.getUsers();
        const targetId = String(userId);
        const index = users.findIndex(u => String(u.id) === targetId);
        if (index >= 0) {
            users[index].password = String(newPassword).trim();
            this.saveUsers(users);

            const current = this.getCurrentUser();
            if (current && String(current.id) === targetId) {
                current.password = String(newPassword).trim();
                this.setCurrentUser(current);
            }
            return true;
        }
        return false;
    }

    // --- UNITS ---
    getUnits() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.UNITS) || '[]');
    }

    getUnitById(unitId) {
        const units = this.getUnits();
        return units.find(u => u.id === unitId) || null;
    }

    // --- STATIONS ---
    getStations(unitId = null) {
        const stations = JSON.parse(localStorage.getItem(STORAGE_KEYS.STATIONS) || '[]');
        if (unitId && unitId !== 'all') {
            return stations.filter(s => s.unitId === unitId);
        }
        return stations;
    }

    getStationById(stationId) {
        const stations = this.getStations();
        return stations.find(s => s.id === stationId) || null;
    }

    addStation(stationData) {
        const stations = this.getStations();
        const stationId = 'st-custom-' + Date.now();

        const newStation = {
            id: stationId,
            unitId: stationData.unitId,
            type: stationData.type || 'plus', // 'plus': Trạm sản lượng cộng (+), 'minus': Trạm sản lượng trừ (-)
            code: stationData.code.trim().toUpperCase(),
            name: stationData.name.trim(),
            meterCode: stationData.meterCode.trim(),
            defaultCutoffDay: parseInt(stationData.defaultCutoffDay) || 25,
            initialReading: parseInt(stationData.initialReading) || 0,
            isLocked: false,
            createdAt: new Date().toISOString()
        };
        stations.push(newStation);
        localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(stations));
        this.syncTableToCloud('stations');

        this.addMeter({
            stationId: stationId,
            meterCode: stationData.meterCode.trim(),
            name: `Đồng hồ ban đầu (${stationData.meterCode.trim()})`,
            initialReading: parseInt(stationData.initialReading) || 0,
            startDate: new Date().toISOString().split('T')[0]
        });

        return newStation;
    }

    updateStation(stationId, updatedData) {
        const stations = this.getStations();
        const index = stations.findIndex(s => s.id === stationId);
        if (index >= 0) {
            stations[index] = {
                ...stations[index],
                unitId: updatedData.unitId || stations[index].unitId,
                type: updatedData.type || stations[index].type || 'plus',
                code: updatedData.code ? updatedData.code.trim().toUpperCase() : stations[index].code,
                name: updatedData.name ? updatedData.name.trim() : stations[index].name,
                meterCode: updatedData.meterCode ? updatedData.meterCode.trim() : stations[index].meterCode,
                defaultCutoffDay: parseInt(updatedData.defaultCutoffDay) || stations[index].defaultCutoffDay,
                initialReading: parseInt(updatedData.initialReading) !== undefined ? parseInt(updatedData.initialReading) : stations[index].initialReading
            };
            localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(stations));
            this.syncTableToCloud('stations');
            return stations[index];
        }
        return null;
    }

    toggleStationLock(stationId) {
        const stations = this.getStations();
        const index = stations.findIndex(s => s.id === stationId);
        if (index >= 0) {
            stations[index].isLocked = !stations[index].isLocked;
            localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(stations));
            this.syncTableToCloud('stations');
            return stations[index];
        }
        return null;
    }

    deleteStation(stationId) {
        let stations = this.getStations();
        stations = stations.filter(s => s.id !== stationId);
        localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(stations));

        // Cascade: remove all meters belonging to this station
        let meters = JSON.parse(localStorage.getItem(STORAGE_KEYS.METERS) || '[]');
        meters = meters.filter(m => m.stationId !== stationId);
        localStorage.setItem(STORAGE_KEYS.METERS, JSON.stringify(meters));

        // Cascade: remove all readings belonging to this station
        let readings = JSON.parse(localStorage.getItem(STORAGE_KEYS.READINGS) || '[]');
        readings = readings.filter(r => r.stationId !== stationId);
        localStorage.setItem(STORAGE_KEYS.READINGS, JSON.stringify(readings));
        this.syncTableToCloud('stations');
        this.syncTableToCloud('meters');
        this.syncTableToCloud('readings');
    }

    // --- METERS (WATER METERS SUB-ENTITY) ---
    getMeters(stationId = null) {
        let meters = JSON.parse(localStorage.getItem(STORAGE_KEYS.METERS) || '[]');
        if (stationId) {
            meters = meters.filter(m => m.stationId === stationId);
        }
        return meters.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    getMeterById(meterId) {
        const meters = JSON.parse(localStorage.getItem(STORAGE_KEYS.METERS) || '[]');
        return meters.find(m => m.id === meterId) || null;
    }

    getActiveMeterForStation(stationId) {
        const meters = this.getMeters(stationId);
        const activeMeter = meters.find(m => m.status === 'active');
        if (activeMeter) return activeMeter;
        return meters.length > 0 ? meters[0] : null;
    }

    addMeter(meterData) {
        const meters = JSON.parse(localStorage.getItem(STORAGE_KEYS.METERS) || '[]');
        
        const newMeter = {
            id: 'mtr-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            stationId: meterData.stationId,
            meterCode: meterData.meterCode.trim().toUpperCase(),
            name: meterData.name ? meterData.name.trim() : `Đồng hồ ${meterData.meterCode.trim().toUpperCase()}`,
            initialReading: parseInt(meterData.initialReading) || 0,
            finalReading: null,
            status: 'active',
            startDate: meterData.startDate || new Date().toISOString().split('T')[0],
            stopDate: null,
            createdAt: new Date().toISOString()
        };

        meters.push(newMeter);
        localStorage.setItem(STORAGE_KEYS.METERS, JSON.stringify(meters));
        this.syncTableToCloud('meters');
        return newMeter;
    }

    stopMeter(meterId, finalReading = 0, stopDate = null) {
        const meters = JSON.parse(localStorage.getItem(STORAGE_KEYS.METERS) || '[]');
        const index = meters.findIndex(m => m.id === meterId);
        if (index >= 0) {
            meters[index].status = 'stopped';
            meters[index].finalReading = parseInt(finalReading) || meters[index].initialReading;
            meters[index].stopDate = stopDate || new Date().toISOString().split('T')[0];
            localStorage.setItem(STORAGE_KEYS.METERS, JSON.stringify(meters));
            this.syncTableToCloud('meters');
            return meters[index];
        }
        return null;
    }

    replaceMeter(oldMeterId, oldFinalReading, newMeterData) {
        const stoppedMeter = this.stopMeter(oldMeterId, oldFinalReading, newMeterData.startDate);
        
        const newMeter = this.addMeter({
            stationId: newMeterData.stationId || (stoppedMeter ? stoppedMeter.stationId : null),
            meterCode: newMeterData.meterCode,
            name: newMeterData.name || `Đồng hồ mới (${newMeterData.meterCode})`,
            initialReading: newMeterData.initialReading || 0,
            startDate: newMeterData.startDate || new Date().toISOString().split('T')[0]
        });

        if (newMeter.stationId) {
            const station = this.getStationById(newMeter.stationId);
            if (station) {
                this.updateStation(newMeter.stationId, { meterCode: newMeter.meterCode });
            }
        }

        return { stoppedMeter, newMeter };
    }

    deleteMeter(meterId) {
        let meters = JSON.parse(localStorage.getItem(STORAGE_KEYS.METERS) || '[]');
        meters = meters.filter(m => m.id !== meterId);
        localStorage.setItem(STORAGE_KEYS.METERS, JSON.stringify(meters));

        // Cascade: remove readings that reference this specific meter
        let readings = JSON.parse(localStorage.getItem(STORAGE_KEYS.READINGS) || '[]');
        readings = readings.filter(r => r.meterId !== meterId);
        localStorage.setItem(STORAGE_KEYS.READINGS, JSON.stringify(readings));
        this.syncTableToCloud('meters');
        this.syncTableToCloud('readings');
    }

    // --- READINGS & SINGLE MONTHLY CUTOFF ENFORCEMENT ---
    getReadings(filters = {}) {
        let readings = JSON.parse(localStorage.getItem(STORAGE_KEYS.READINGS) || '[]');
        readings = readings.map(r => {
            if (r.cutoffDate) {
                const normDate = normalizeDateString(r.cutoffDate);
                r.cutoffDate = normDate;
                const parts = normDate.split('-');
                if (parts.length === 3) {
                    r.year = parseInt(parts[0]);
                    r.month = parseInt(parts[1]);
                }
            }
            return r;
        });

        if (filters.year && filters.year !== 'all') {
            readings = readings.filter(r => r.year === parseInt(filters.year));
        }
        if (filters.month && filters.month !== 'all') {
            readings = readings.filter(r => r.month === parseInt(filters.month));
        }
        if (filters.unitId && filters.unitId !== 'all') {
            readings = readings.filter(r => r.unitId === filters.unitId);
        }
        if (filters.stationId && filters.stationId !== 'all') {
            readings = readings.filter(r => r.stationId === filters.stationId);
        }
        if (filters.meterId && filters.meterId !== 'all') {
            readings = readings.filter(r => r.meterId === filters.meterId);
        }
        if (filters.status && filters.status !== 'all') {
            readings = readings.filter(r => r.status === filters.status);
        }
        if (filters.search) {
            const query = filters.search.toLowerCase().trim();
            readings = readings.filter(r => {
                const unit = this.getUnitById(r.unitId);
                const station = this.getStationById(r.stationId);
                return (
                    (unit && unit.name.toLowerCase().includes(query)) ||
                    (station && station.name.toLowerCase().includes(query)) ||
                    (station && station.code.toLowerCase().includes(query)) ||
                    (r.meterCode && r.meterCode.toLowerCase().includes(query)) ||
                    (r.cutoffDate && r.cutoffDate.includes(query))
                );
            });
        }

        return readings.sort((a, b) => {
            if (b.year !== a.year) return b.year - a.year;
            if (b.month !== a.month) return b.month - a.month;
            return new Date(b.cutoffDate) - new Date(a.cutoffDate);
        });
    }

    getReadingById(readingId) {
        const readings = this.getReadings();
        return readings.find(r => r.id === readingId) || null;
    }

    getLatestReadingForStation(stationId, meterId = null) {
        let filters = { stationId };
        if (meterId) filters.meterId = meterId;

        const readings = this.getReadings(filters);
        if (readings.length > 0) {
            return readings[0];
        }

        if (meterId) {
            const meter = this.getMeterById(meterId);
            if (meter) return { newReading: meter.initialReading };
        }

        const activeMeter = this.getActiveMeterForStation(stationId);
        if (activeMeter) return { newReading: activeMeter.initialReading };

        const station = this.getStationById(stationId);
        return station ? { newReading: station.initialReading } : null;
    }

    getReadingForDate(stationId, meterId = null, cutoffDate = null) {
        if (!cutoffDate) return null;
        let filters = { stationId };
        if (meterId) filters.meterId = meterId;
        const readings = this.getReadings(filters);
        return readings.find(r => r.cutoffDate === cutoffDate) || null;
    }

    getLatestReadingBeforeDate(stationId, meterId = null, cutoffDate = null) {
        let filters = { stationId };
        if (meterId) filters.meterId = meterId;
        let readings = this.getReadings(filters);
        if (cutoffDate) {
            readings = readings.filter(r => r.cutoffDate < cutoffDate);
        }
        if (readings.length > 0) {
            return readings[0];
        }

        if (meterId) {
            const meter = this.getMeterById(meterId);
            if (meter) return { newReading: meter.initialReading };
        }

        const activeMeter = this.getActiveMeterForStation(stationId);
        if (activeMeter) return { newReading: activeMeter.initialReading };

        const station = this.getStationById(stationId);
        return station ? { newReading: station.initialReading } : null;
    }

    // Set a specific reading as the SINGLE monthly cutoff reading for its station & month
    setMonthlyCutoffReading(readingId) {
        let readings = JSON.parse(localStorage.getItem(STORAGE_KEYS.READINGS) || '[]');
        const targetIndex = readings.findIndex(r => r.id === readingId);

        if (targetIndex < 0) return null;

        const target = readings[targetIndex];
        const { stationId, year, month } = target;

        // Reset any other reading in the same month for this station to normal daily reading
        readings.forEach(r => {
            if (r.stationId === stationId && r.year === year && r.month === month) {
                r.isMonthlyCutoff = false;
                if (r.status === 'locked') r.status = 'daily';
            }
        });

        // Set target reading as official monthly cutoff
        readings[targetIndex].isMonthlyCutoff = true;
        readings[targetIndex].status = 'locked';

        localStorage.setItem(STORAGE_KEYS.READINGS, JSON.stringify(readings));
        this.syncTableToCloud('readings');
        return readings[targetIndex];
    }

    saveReading(readingData) {
        let readings = JSON.parse(localStorage.getItem(STORAGE_KEYS.READINGS) || '[]');
        
        const oldReading = parseInt(readingData.oldReading) || 0;
        const newReading = parseInt(readingData.newReading) || 0;
        // Today's output volume = Today's index (newReading) - Yesterday's index (oldReading)
        const rawVolume = newReading - oldReading;

        const station = this.getStationById(readingData.stationId);
        const stationType = station ? (station.type || 'plus') : 'plus';

        // Gross production volume: Positive for 'plus' stations, Negative for 'minus' stations
        const grossVolume = stationType === 'minus' ? -rawVolume : rawVolume;

        // Additions & Notes
        const additionVolume = parseInt(readingData.additionVolume) || 0;
        const additionNote = readingData.additionNote ? readingData.additionNote.trim() : '';

        // Deductions & Notes
        const internalUse = parseInt(readingData.internalUse) || 0;
        const internalUseNote = readingData.internalUseNote ? readingData.internalUseNote.trim() : '';
        const flushingUse = parseInt(readingData.flushingUse) || 0;
        const flushingUseNote = readingData.flushingUseNote ? readingData.flushingUseNote.trim() : '';
        const leakageLoss = parseInt(readingData.leakageLoss) || 0;
        const leakageLossNote = readingData.leakageLossNote ? readingData.leakageLossNote.trim() : '';
        const otherDeduction = parseInt(readingData.otherDeduction) || 0;
        const otherDeductionNote = readingData.otherDeductionNote ? readingData.otherDeductionNote.trim() : '';

        const totalDeduction = internalUse + flushingUse + leakageLoss + otherDeduction;
        const netVolume = grossVolume + additionVolume - totalDeduction;

        const lossPercent = (grossVolume > 0 || additionVolume > 0) 
            ? ((totalDeduction / (Math.max(grossVolume, 0) + additionVolume)) * 100).toFixed(2) 
            : '0.00';

        const normalizedCutoffDate = normalizeDateString(readingData.cutoffDate);
        const cutoffDateParts = normalizedCutoffDate.split('-');
        const year = parseInt(cutoffDateParts[0]);
        const month = parseInt(cutoffDateParts[1]);

        let recordId = readingData.id;
        if (!recordId) {
            recordId = `rd-${readingData.stationId}-${year}-${month}-${Date.now()}`;
        }

        let meterId = readingData.meterId;
        let meterCode = readingData.meterCode;

        if (!meterId && readingData.stationId) {
            const activeMeter = this.getActiveMeterForStation(readingData.stationId);
            if (activeMeter) {
                meterId = activeMeter.id;
                meterCode = activeMeter.meterCode;
            }
        }

        const isMonthlyCutoff = readingData.status === 'locked' || readingData.isMonthlyCutoff === true;

        if (isMonthlyCutoff) {
            readings.forEach(r => {
                if (r.id !== recordId && r.stationId === readingData.stationId && r.year === year && r.month === month) {
                    r.isMonthlyCutoff = false;
                    if (r.status === 'locked') r.status = 'daily';
                }
            });
        }

        const newRecord = {
            id: recordId,
            unitId: readingData.unitId,
            stationId: readingData.stationId,
            stationType: stationType,
            meterId: meterId || null,
            meterCode: meterCode || '',
            year: year,
            month: month,
            cutoffDate: normalizedCutoffDate,
            oldReading: oldReading,
            newReading: newReading,
            rawVolume: rawVolume,
            grossVolume: grossVolume,
            additionVolume: additionVolume,
            additionNote: additionNote,
            internalUse: internalUse,
            internalUseNote: internalUseNote,
            flushingUse: flushingUse,
            flushingUseNote: flushingUseNote,
            leakageLoss: leakageLoss,
            leakageLossNote: leakageLossNote,
            otherDeduction: otherDeduction,
            otherDeductionNote: otherDeductionNote,
            totalDeduction: totalDeduction,
            netVolume: netVolume,
            lossPercent: parseFloat(lossPercent),
            isMonthlyCutoff: isMonthlyCutoff,
            status: isMonthlyCutoff ? 'locked' : (readingData.status || 'daily'),
            notes: readingData.notes || '',
            createdAt: new Date().toISOString()
        };

        const index = readings.findIndex(r => r.id === recordId);
        if (index >= 0) {
            readings[index] = newRecord;
        } else {
            readings.unshift(newRecord);
        }

        localStorage.setItem(STORAGE_KEYS.READINGS, JSON.stringify(readings));
        this.syncTableToCloud('readings');
        return newRecord;
    }

    deleteReading(readingId) {
        let readings = JSON.parse(localStorage.getItem(STORAGE_KEYS.READINGS) || '[]');
        readings = readings.filter(r => r.id !== readingId);
        localStorage.setItem(STORAGE_KEYS.READINGS, JSON.stringify(readings));
        this.syncTableToCloud('readings');
    }

    // --- AGGREGATE STATS & DAILY PRODUCTION ---
    getAggregatedMetrics(filters = {}) {
        const readings = this.getReadings(filters);
        
        let totalPlusGross = 0;
        let totalMinusGross = 0;
        let totalGross = 0;
        let totalAdditions = 0;
        let totalInternal = 0;
        let totalFlushing = 0;
        let totalLeakage = 0;
        let totalOtherDeductions = 0;
        let totalDeduction = 0;
        let totalNetVolume = 0;

        const activeStationIds = new Set();
        const activeUnitIds = new Set();

        readings.forEach(r => {
            const st = this.getStationById(r.stationId);
            const stType = r.stationType || (st ? st.type : 'plus') || 'plus';
            
            const rawVol = r.rawVolume !== undefined ? r.rawVolume : (r.newReading - r.oldReading);
            if (stType === 'minus') {
                totalMinusGross += rawVol;
            } else {
                totalPlusGross += rawVol;
            }

            const addition = r.additionVolume || 0;
            totalAdditions += addition;

            const internal = r.internalUse || 0;
            const flushing = r.flushingUse || 0;
            const leakage = r.leakageLoss || 0;
            const otherDed = r.otherDeduction || 0;
            const deduction = r.totalDeduction !== undefined ? r.totalDeduction : (internal + flushing + leakage + otherDed);

            totalInternal += internal;
            totalFlushing += flushing;
            totalLeakage += leakage;
            totalOtherDeductions += otherDed;
            totalDeduction += deduction;

            const net = r.netVolume !== undefined ? r.netVolume : (r.grossVolume + addition - deduction);
            totalNetVolume += net;

            activeStationIds.add(r.stationId);
            activeUnitIds.add(r.unitId);
        });

        totalGross = totalPlusGross - totalMinusGross;
        const overallLossPercent = (totalPlusGross + totalAdditions) > 0 ? ((totalDeduction / (totalPlusGross + totalAdditions)) * 100).toFixed(2) : '0.00';

        return {
            totalPlusGross,
            totalMinusGross,
            totalGross,
            totalAdditions,
            totalInternal,
            totalFlushing,
            totalLeakage,
            totalOtherDeductions,
            totalDeduction,
            totalNetVolume,
            overallLossPercent: parseFloat(overallLossPercent),
            activeStationsCount: activeStationIds.size,
            activeUnitsCount: activeUnitIds.size,
            totalRecords: readings.length
        };
    }

    getDailyProductionBreakdown(year = 2026, month = 8, unitId = 'all', stationId = 'all') {
        const readings = this.getReadings({ year, month, unitId, stationId });
        
        const daysInMonth = new Date(year, month, 0).getDate();
        const dailyMap = {};

        for (let d = 1; d <= daysInMonth; d++) {
            const dayStr = d < 10 ? `0${d}` : `${d}`;
            const monthStr = month < 10 ? `0${month}` : `${month}`;
            const fullDate = `${year}-${monthStr}-${dayStr}`;
            dailyMap[fullDate] = {
                day: d,
                dateStr: fullDate,
                grossVolume: 0,
                additionVolume: 0,
                totalDeduction: 0,
                netVolume: 0,
                recordsCount: 0,
                isMonthlyCutoffDay: false,
                readings: []
            };
        }

        readings.forEach(r => {
            if (dailyMap[r.cutoffDate]) {
                dailyMap[r.cutoffDate].grossVolume += (r.grossVolume || 0);
                dailyMap[r.cutoffDate].additionVolume += (r.additionVolume || 0);
                dailyMap[r.cutoffDate].totalDeduction += (r.totalDeduction || 0);
                dailyMap[r.cutoffDate].netVolume += (r.netVolume !== undefined ? r.netVolume : ((r.grossVolume || 0) + (r.additionVolume || 0) - (r.totalDeduction || 0)));
                dailyMap[r.cutoffDate].recordsCount += 1;
                if (r.isMonthlyCutoff) dailyMap[r.cutoffDate].isMonthlyCutoffDay = true;
                dailyMap[r.cutoffDate].readings.push(r);
            }
        });

        return Object.values(dailyMap);
    }
}

window.appStore = new DataStore();
