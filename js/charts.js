/**
 * CHARTS.JS - Chart.js visualizations for Water Meter Reading System
 * Extended with Daily Production Output Comparison Charts
 */

class AnalyticsCharts {
    constructor() {
        this.unitsChart = null;
        this.deductionChart = null;
        this.trendChart = null;
        this.stationChart = null;
        this.dailyChart = null;
    }

    formatNumber(val) {
        return new Intl.NumberFormat('vi-VN').format(val);
    }

    /**
     * Render 12 Units Comparison Chart
     */
    renderUnitsComparisonChart(canvasId, filters = {}) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const units = window.appStore.getUnits();
        const labels = [];
        const grossData = [];
        const deductionData = [];

        units.forEach(unit => {
            labels.push(unit.name);
            const unitFilters = { ...filters, unitId: unit.id };
            const stats = window.appStore.getAggregatedMetrics(unitFilters);
            grossData.push(stats.totalGross);
            deductionData.push(stats.totalDeduction);
        });

        if (this.unitsChart) {
            this.unitsChart.destroy();
        }

        this.unitsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Sản Lượng Sản Xuất (m³)',
                        data: grossData,
                        backgroundColor: 'rgba(14, 165, 233, 0.85)',
                        borderColor: '#0284c7',
                        borderWidth: 1,
                        borderRadius: 6
                    },
                    {
                        label: 'Tổng Sản Lượng Giảm Trừ (m³)',
                        data: deductionData,
                        backgroundColor: 'rgba(239, 68, 68, 0.85)',
                        borderColor: '#dc2626',
                        borderWidth: 1,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { font: { family: 'Inter', size: 12, weight: '600' }, usePointStyle: true, padding: 15 } },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        callbacks: { label: (ctx) => `${ctx.dataset.label}: ${this.formatNumber(ctx.raw)} m³` }
                    }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(226, 232, 240, 0.6)' },
                        ticks: { callback: (val) => `${this.formatNumber(val)} m³` }
                    }
                }
            }
        });
    }

    /**
     * Render Deduction Breakdown Donut Chart
     */
    renderDeductionBreakdownChart(canvasId, filters = {}) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const metrics = window.appStore.getAggregatedMetrics(filters);

        if (this.deductionChart) {
            this.deductionChart.destroy();
        }

        const total = metrics.totalDeduction || 1;
        const pInternal = ((metrics.totalInternal / total) * 100).toFixed(1);
        const pFlushing = ((metrics.totalFlushing / total) * 100).toFixed(1);
        const pLeakage = ((metrics.totalLeakage / total) * 100).toFixed(1);

        this.deductionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [
                    `Nước dùng nội bộ / Sục rửa (${pInternal}%)`,
                    `Xả rửa ống & Sự cố (${pFlushing}%)`,
                    `Thất thoát & Rò rỉ (${pLeakage}%)`
                ],
                datasets: [{
                    data: [metrics.totalInternal, metrics.totalFlushing, metrics.totalLeakage],
                    backgroundColor: ['#3b82f6', '#f59e0b', '#ef4444'],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '68%',
                plugins: {
                    legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 12, weight: '500' }, usePointStyle: true, padding: 12 } },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        callbacks: { label: (ctx) => `${ctx.label.split('(')[0].trim()}: ${this.formatNumber(ctx.raw)} m³` }
                    }
                }
            }
        });
    }

    /**
     * Render Monthly Production Trend Chart
     */
    renderMonthlyTrendChart(canvasId, year = 2026, unitId = 'all') {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        const labels = months.map(m => `Tháng ${m}`);
        const grossTrend = [];
        const deductionTrend = [];

        months.forEach(m => {
            const stats = window.appStore.getAggregatedMetrics({ year: year, month: m, unitId: unitId });
            grossTrend.push(stats.totalGross);
            deductionTrend.push(stats.totalDeduction);
        });

        if (this.trendChart) {
            this.trendChart.destroy();
        }

        this.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Sản Lượng Sản Xuất (m³)',
                        data: grossTrend,
                        borderColor: '#0284c7',
                        backgroundColor: 'rgba(2, 132, 199, 0.08)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.35,
                        pointRadius: 4
                    },
                    {
                        label: 'Tổng Sản Lượng Giảm Trừ (m³)',
                        data: deductionTrend,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.35,
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { font: { family: 'Inter', size: 12, weight: '600' }, usePointStyle: true } },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        callbacks: { label: (ctx) => `${ctx.dataset.label}: ${this.formatNumber(ctx.raw)} m³` }
                    }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(226, 232, 240, 0.6)' },
                        ticks: { callback: (val) => `${this.formatNumber(val)} m³` }
                    }
                }
            }
        });
    }

    /**
     * Render Station Comparison Chart
     */
    renderStationComparisonChart(canvasId, unitId = 'xncn-tp1', filters = {}) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const stations = window.appStore.getStations(unitId);
        const labels = [];
        const grossData = [];
        const deductionData = [];

        stations.forEach(st => {
            labels.push(st.name);
            const stFilters = { ...filters, unitId: unitId, stationId: st.id };
            const stats = window.appStore.getAggregatedMetrics(stFilters);
            grossData.push(stats.totalGross);
            deductionData.push(stats.totalDeduction);
        });

        if (this.stationChart) {
            this.stationChart.destroy();
        }

        const unitObj = window.appStore.getUnitById(unitId);
        const titleUnitName = unitObj ? unitObj.name : 'XNCN';

        this.stationChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Sản Lượng Sản Xuất (m³)',
                        data: grossData,
                        backgroundColor: 'rgba(99, 102, 241, 0.85)',
                        borderColor: '#4f46e5',
                        borderRadius: 6
                    },
                    {
                        label: 'Sản Lượng Giảm Trừ (m³)',
                        data: deductionData,
                        backgroundColor: 'rgba(239, 68, 68, 0.85)',
                        borderColor: '#dc2626',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Phân Tích Sản Lượng Các Trạm Trực Thuộc ${titleUnitName}`,
                        font: { family: 'Inter', size: 14, weight: 'bold' },
                        color: '#1e293b',
                        padding: { bottom: 12 }
                    },
                    legend: { position: 'top', labels: { font: { family: 'Inter', size: 12, weight: '500' }, usePointStyle: true } },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        callbacks: { label: (ctx) => `${ctx.dataset.label}: ${this.formatNumber(ctx.raw)} m³` }
                    }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(226, 232, 240, 0.6)' },
                        ticks: { callback: (val) => `${this.formatNumber(val)} m³` }
                    }
                }
            }
        });
    }

    /**
     * Render Daily Production Breakdown Chart for Selected Month & Year
     */
    renderDailyProductionChart(canvasId, year = 2026, month = 8, unitId = 'all', stationId = 'all') {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const dailyData = window.appStore.getDailyProductionBreakdown(year, month, unitId, stationId);
        const labels = dailyData.map(d => `Ngày ${d.day}`);
        const grossSeries = dailyData.map(d => d.grossVolume);
        const deductionSeries = dailyData.map(d => d.totalDeduction);

        if (this.dailyChart) {
            this.dailyChart.destroy();
        }

        this.dailyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Sản Lượng Sản Xuất Bơm Bằng Ngày (m³)',
                        data: grossSeries,
                        backgroundColor: 'rgba(2, 132, 199, 0.8)',
                        borderColor: '#0284c7',
                        borderRadius: 4
                    },
                    {
                        label: 'Giảm Trừ Ngày (m³)',
                        data: deductionSeries,
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderColor: '#dc2626',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { font: { family: 'Inter', size: 12, weight: '600' }, usePointStyle: true } },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        callbacks: { label: (ctx) => `${ctx.dataset.label}: ${this.formatNumber(ctx.raw)} m³` }
                    }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(226, 232, 240, 0.6)' },
                        ticks: { callback: (val) => `${this.formatNumber(val)} m³` }
                    }
                }
            }
        });
    }

    refreshAllCharts(filters = {}) {
        this.renderUnitsComparisonChart('unitsComparisonChartCanvas', filters);
        this.renderDeductionBreakdownChart('deductionBreakdownChartCanvas', filters);

        const currentYear = filters.year && filters.year !== 'all' ? parseInt(filters.year) : 2026;
        const currentMonth = filters.month && filters.month !== 'all' ? parseInt(filters.month) : 8;
        const currentUnit = filters.unitId || 'all';
        const currentStation = filters.stationId || 'all';

        this.renderMonthlyTrendChart('monthlyTrendChartCanvas', currentYear, currentUnit);

        const stationUnit = (filters.unitId && filters.unitId !== 'all') ? filters.unitId : 'xncn-tp1';
        this.renderStationComparisonChart('stationComparisonChartCanvas', stationUnit, filters);

        this.renderDailyProductionChart('dailyProductionChartCanvas', currentYear, currentMonth, currentUnit, currentStation);
    }
}

window.appCharts = new AnalyticsCharts();
