/**
 * DATA.JS - Master datasets for 12 Water Supply Enterprises (XNCN)
 * Pre-populated with units and default admin account. Stations and Readings set to EMPTY as requested.
 */

const INITIAL_UNITS = [
    { id: 'xncn-tp1', name: 'XNCN TP1', fullName: 'Xí nghiệp Cấp nước Thành phố Sơn La 1', region: 'TP Sơn La' },
    { id: 'xncn-tp2', name: 'XNCN TP2', fullName: 'Xí nghiệp Cấp nước Thành phố Sơn La 2', region: 'TP Sơn La' },
    { id: 'xncn-mai-son', name: 'XNCN Mai Sơn', fullName: 'Xí nghiệp Cấp nước Mai Sơn', region: 'Huyện Mai Sơn' },
    { id: 'xncn-moc-chau', name: 'XNCN Mộc Châu', fullName: 'Xí nghiệp Cấp nước Mộc Châu', region: 'Huyện Mộc Châu' },
    { id: 'xncn-yen-chau', name: 'XNCN Yên Châu', fullName: 'Xí nghiệp Cấp nước Yên Châu', region: 'Huyện Yên Châu' },
    { id: 'xncn-phu-yen', name: 'XNCN Phù Yên', fullName: 'Xí nghiệp Cấp nước Phù Yên', region: 'Huyện Phù Yên' },
    { id: 'xncn-thuan-chau', name: 'XNCN Thuận Châu', fullName: 'Xí nghiệp Cấp nước Thuận Châu', region: 'Huyện Thuận Châu' },
    { id: 'xncn-bac-yen', name: 'XNCN Bắc Yên', fullName: 'Xí nghiệp Cấp nước Bắc Yên', region: 'Huyện Bắc Yên' },
    { id: 'xncn-song-ma', name: 'XNCN Sông Mã', fullName: 'Xí nghiệp Cấp nước Sông Mã', region: 'Huyện Sông Mã' },
    { id: 'xncn-sop-cop', name: 'XNCN Sốp Cộp', fullName: 'Xí nghiệp Cấp nước Sốp Cộp', region: 'Huyện Sốp Cộp' },
    { id: 'xncn-muong-la', name: 'XNCN Mường La', fullName: 'Xí nghiệp Cấp nước Mường La', region: 'Huyện Mường La' },
    { id: 'xncn-quynh-nhai', name: 'XNCN Quỳnh Nhai', fullName: 'Xí nghiệp Cấp nước Quỳnh Nhai', region: 'Huyện Quỳnh Nhai' }
];

// Stations list set to EMPTY as requested
const INITIAL_STATIONS = [];

// Default Admin Account
const INITIAL_USERS = [
    {
        id: 'usr-admin',
        username: 'admin',
        password: 'admin',
        fullName: 'Quản Trị Viên Hệ Thống',
        unitId: 'all',
        role: 'admin',
        status: 'approved',
        createdAt: new Date().toISOString()
    }
];

window.INITIAL_DATA = {
    units: INITIAL_UNITS,
    stations: INITIAL_STATIONS, // Empty stations list
    readings: [],               // Empty readings list
    users: INITIAL_USERS
};
