/**
 * SAW Comparison Module
 * Menangani perbandingan evaluasi SAW dengan data sintetik vs data aktual
 */
class SAWComparison {
    constructor() {
        console.log('SAWComparison: Constructor called');
        this.config = {
            API_BASE_URL: window.CONFIG?.API_BASE_URL || 'http://localhost:8000',
            API_PREFIX: window.CONFIG?.API_PREFIX || '/api'
        };
        
        this.syntheticData = null;
        this.actualData = null;
        
        this.init();
    }

    init() {
        console.log('SAWComparison: init() called');
        console.log('SAWComparison: DOM ready:', $(document).ready());
        console.log('SAWComparison: Button exists in init:', $('#sawComparisonCalculateBtn').length > 0);
        
        this.bindEvents();
        this.initializeCharts();
        console.log('✅ SAW Comparison module initialized');
    }

    bindEvents() {
        console.log('SAWComparison: Binding events...');
        
        // Test if button exists
        const button = $('#sawComparisonCalculateBtn');
        console.log('SAWComparison: Button found:', button.length > 0);
        console.log('SAWComparison: Button element:', button[0]);
        
        // Remove any existing event handlers first
        $(document).off('click', '#sawComparisonCalculateBtn');
        
        // Calculate comparison button - use both direct binding and event delegation
        $('#sawComparisonCalculateBtn').on('click', (e) => {
            console.log('SAWComparison: Calculate button clicked (direct binding)!');
            e.preventDefault();
            this.calculateComparison();
        });
        
        $(document).on('click', '#sawComparisonCalculateBtn', (e) => {
            console.log('SAWComparison: Calculate button clicked (event delegation)!');
            e.preventDefault();
            this.calculateComparison();
        });

        // Export button
        $(document).on('click', '#sawComparisonExportBtn', () => {
            this.exportResults();
        });

        // Print button
        $(document).on('click', '#sawComparisonPrintBtn', () => {
            this.printReport();
        });

        // Weight validation
        $(document).on('input', '#sawComparisonIpkWeight, #sawComparisonSksWeight, #sawComparisonDekWeight', () => {
            this.validateWeights();
        });
        
        console.log('SAWComparison: Events bound successfully');
    }

    validateWeights() {
        const ipkWeight = parseInt($('#sawComparisonIpkWeight').val()) || 0;
        const sksWeight = parseInt($('#sawComparisonSksWeight').val()) || 0;
        const dekWeight = parseInt($('#sawComparisonDekWeight').val()) || 0;
        
        const total = ipkWeight + sksWeight + dekWeight;
        
        if (total !== 100) {
            $('#sawComparisonCalculateBtn').prop('disabled', true);
            this.showNotification('warning', 'Total bobot harus 100%', `Total bobot saat ini: ${total}%`);
        } else {
            $('#sawComparisonCalculateBtn').prop('disabled', false);
        }
    }

    async calculateComparison() {
        console.log('SAWComparison: calculateComparison method called');
        try {
            this.showLoading(true);
            
            const weights = {
                ipk: (parseInt($('#sawComparisonIpkWeight').val()) || 40) / 100,
                sks: (parseInt($('#sawComparisonSksWeight').val()) || 35) / 100,
                dek: (parseInt($('#sawComparisonDekWeight').val()) || 25) / 100
            };

            const testSize = parseInt($('#sawComparisonTestSize').val()) || 30;
            const randomState = 42;

            const requestData = {
                weights: weights,
                test_size: testSize / 100,
                random_state: randomState,
                save_to_db: false
            };

            // Hitung evaluasi SAW sintetik dan aktual secara paralel
            const [syntheticResponse, actualResponse] = await Promise.all([
                this.calculateSyntheticEvaluation(requestData),
                this.calculateActualEvaluation(requestData)
            ]);

            this.syntheticData = syntheticResponse.evaluation;
            this.actualData = actualResponse.evaluation;

            this.displayComparisonResults();
            this.showNotification('success', 'Perbandingan SAW Berhasil', 'Hasil perbandingan telah dihitung dan ditampilkan');

        } catch (error) {
            console.error('Error calculating SAW comparison:', error);
            this.showNotification('error', 'Error Perbandingan SAW', error.responseJSON?.detail || 'Terjadi kesalahan saat menghitung perbandingan');
        } finally {
            this.showLoading(false);
        }
    }

    async calculateSyntheticEvaluation(requestData) {
        return await $.ajax({
            url: `${this.config.API_BASE_URL}${this.config.API_PREFIX}/saw/evaluate`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(requestData)
        });
    }

    async calculateActualEvaluation(requestData) {
        return await $.ajax({
            url: `${this.config.API_BASE_URL}${this.config.API_PREFIX}/saw/evaluate-actual`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(requestData)
        });
    }

    displayComparisonResults() {
        // Update summary cards
        this.updateSummaryCards();
        
        // Update metrics comparison
        this.updateMetricsComparison();
        
        // Update charts
        this.updateCharts();
        
        // Update analysis and recommendations
        this.updateAnalysis();
        
        // Show results section
        $('#sawComparisonResults').show();
    }

    updateSummaryCards() {
        // Synthetic data
        $('#sawComparisonSyntheticTotal').text(this.syntheticData.total_data || 0);
        $('#sawComparisonSyntheticTest').text(this.syntheticData.test_data || 0);
        $('#sawComparisonSyntheticAccuracy').text(this.formatPercentage(this.syntheticData.accuracy || 0));
        $('#sawComparisonSyntheticPrecision').text(this.formatPercentage(this.syntheticData.precision || 0));
        $('#sawComparisonSyntheticRecall').text(this.formatPercentage(this.syntheticData.recall || 0));
        $('#sawComparisonSyntheticF1').text(this.formatPercentage(this.syntheticData.f1_score || 0));

        // Actual data
        $('#sawComparisonActualTotal').text(this.actualData.total_data || 0);
        $('#sawComparisonActualTest').text(this.actualData.test_data || 0);
        $('#sawComparisonActualAccuracy').text(this.formatPercentage(this.actualData.accuracy || 0));
        $('#sawComparisonActualPrecision').text(this.formatPercentage(this.actualData.precision || 0));
        $('#sawComparisonActualRecall').text(this.formatPercentage(this.actualData.recall || 0));
        $('#sawComparisonActualF1').text(this.formatPercentage(this.actualData.f1_score || 0));
    }

    updateMetricsComparison() {
        const syntheticAccuracy = this.syntheticData.accuracy || 0;
        const actualAccuracy = this.actualData.accuracy || 0;
        const accuracyDiff = actualAccuracy - syntheticAccuracy;

        const syntheticPrecision = this.syntheticData.precision || 0;
        const actualPrecision = this.actualData.precision || 0;
        const precisionDiff = actualPrecision - syntheticPrecision;

        const syntheticRecall = this.syntheticData.recall || 0;
        const actualRecall = this.actualData.recall || 0;
        const recallDiff = actualRecall - syntheticRecall;

        const syntheticF1 = this.syntheticData.f1_score || 0;
        const actualF1 = this.actualData.f1_score || 0;
        const f1Diff = actualF1 - syntheticF1;

        // Create metrics table HTML
        const metricsTableHTML = `
            <div class="metrics-comparison-table">
                <table class="table table-bordered table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>Metrik</th>
                            <th>Sintetik</th>
                            <th>Aktual</th>
                            <th>Selisih</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Akurasi</strong></td>
                            <td class="text-center">${this.formatPercentage(syntheticAccuracy)}</td>
                            <td class="text-center">${this.formatPercentage(actualAccuracy)}</td>
                            <td class="text-center ${accuracyDiff >= 0 ? 'text-success' : 'text-danger'}">
                                ${this.formatDifference(accuracyDiff)}
                            </td>
                        </tr>
                        <tr>
                            <td><strong>Presisi</strong></td>
                            <td class="text-center">${this.formatPercentage(syntheticPrecision)}</td>
                            <td class="text-center">${this.formatPercentage(actualPrecision)}</td>
                            <td class="text-center ${precisionDiff >= 0 ? 'text-success' : 'text-danger'}">
                                ${this.formatDifference(precisionDiff)}
                            </td>
                        </tr>
                        <tr>
                            <td><strong>Recall</strong></td>
                            <td class="text-center">${this.formatPercentage(syntheticRecall)}</td>
                            <td class="text-center">${this.formatPercentage(actualRecall)}</td>
                            <td class="text-center ${recallDiff >= 0 ? 'text-success' : 'text-danger'}">
                                ${this.formatDifference(recallDiff)}
                            </td>
                        </tr>
                        <tr>
                            <td><strong>F1-Score</strong></td>
                            <td class="text-center">${this.formatPercentage(syntheticF1)}</td>
                            <td class="text-center">${this.formatPercentage(actualF1)}</td>
                            <td class="text-center ${f1Diff >= 0 ? 'text-success' : 'text-danger'}">
                                ${this.formatDifference(f1Diff)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;

        // Update the metrics table container
        $('#sawComparisonMetricsTable').html(metricsTableHTML);

        // Also update the metrics chart if it exists
        this.updateMetricsChart();
    }

    updateMetricsChart() {
        const ctx = document.getElementById('sawComparisonMetricsChart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (window.sawComparisonMetricsChart && typeof window.sawComparisonMetricsChart.destroy === 'function') {
            window.sawComparisonMetricsChart.destroy();
        }

        const syntheticAccuracy = this.syntheticData.accuracy || 0;
        const actualAccuracy = this.actualData.accuracy || 0;
        const syntheticPrecision = this.syntheticData.precision || 0;
        const actualPrecision = this.actualData.precision || 0;
        const syntheticRecall = this.syntheticData.recall || 0;
        const actualRecall = this.actualData.recall || 0;
        const syntheticF1 = this.syntheticData.f1_score || 0;
        const actualF1 = this.actualData.f1_score || 0;

        try {
            window.sawComparisonMetricsChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Akurasi', 'Presisi', 'Recall', 'F1-Score'],
                    datasets: [
                        {
                            label: 'Sintetik',
                            data: [syntheticAccuracy, syntheticPrecision, syntheticRecall, syntheticF1],
                            backgroundColor: 'rgba(54, 162, 235, 0.8)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Aktual',
                            data: [actualAccuracy, actualPrecision, actualRecall, actualF1],
                            backgroundColor: 'rgba(255, 99, 132, 0.8)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 1,
                            ticks: {
                                callback: function(value) {
                                    return (value * 100).toFixed(0) + '%';
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + (context.parsed.y * 100).toFixed(1) + '%';
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating metrics chart:', error);
            // Fallback: just show the table without chart
            $('#sawComparisonMetricsChart').html('<div class="alert alert-warning">Grafik tidak dapat ditampilkan</div>');
        }
    }

    updateCharts() {
        // Update synthetic chart
        if (this.syntheticData.classification_distribution) {
            this.updateSyntheticChart(this.syntheticData.classification_distribution);
        }

        // Update actual chart
        if (this.actualData.classification_distribution) {
            this.updateActualChart(this.actualData.classification_distribution);
        }
    }

    updateSyntheticChart(distribution) {
        const ctx = document.getElementById('sawComparisonSyntheticChart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (window.sawComparisonSyntheticChart && typeof window.sawComparisonSyntheticChart.destroy === 'function') {
            window.sawComparisonSyntheticChart.destroy();
        }

        const labelMapping = {
            'tinggi': 'Peluang Lulus Tinggi',
            'sedang': 'Peluang Lulus Sedang',
            'kecil': 'Peluang Lulus Kecil'
        };

        const labels = Object.keys(distribution).map(key => labelMapping[key] || key);
        const values = Object.values(distribution);
        const colors = ['#28a745', '#ffc107', '#dc3545'];

        try {
            window.sawComparisonSyntheticChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: colors,
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : '0.0';
                                    return `${context.label}: ${context.parsed} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating synthetic chart:', error);
        }
    }

    updateActualChart(distribution) {
        const ctx = document.getElementById('sawComparisonActualChart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (window.sawComparisonActualChart && typeof window.sawComparisonActualChart.destroy === 'function') {
            window.sawComparisonActualChart.destroy();
        }

        const labelMapping = {
            'tinggi': 'Peluang Lulus Tinggi',
            'sedang': 'Peluang Lulus Sedang',
            'kecil': 'Peluang Lulus Kecil'
        };

        const labels = Object.keys(distribution).map(key => labelMapping[key] || key);
        const values = Object.values(distribution);
        const colors = ['#28a745', '#ffc107', '#dc3545'];

        try {
            window.sawComparisonActualChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: colors,
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : '0.0';
                                    return `${context.label}: ${context.parsed} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating actual chart:', error);
        }
    }

    updateAnalysis() {
        const analysis = this.generateAnalysis();
        const recommendations = this.generateRecommendations();

        $('#sawComparisonAnalysis').html(analysis);
        $('#sawComparisonRecommendations').html(recommendations);
    }

    generateAnalysis() {
        const syntheticAccuracy = this.syntheticData.accuracy || 0;
        const actualAccuracy = this.actualData.accuracy || 0;
        const accuracyDiff = actualAccuracy - syntheticAccuracy;

        const syntheticPrecision = this.syntheticData.precision || 0;
        const actualPrecision = this.actualData.precision || 0;
        const precisionDiff = actualPrecision - syntheticPrecision;

        const syntheticRecall = this.syntheticData.recall || 0;
        const actualRecall = this.actualData.recall || 0;
        const recallDiff = actualRecall - syntheticRecall;

        let analysis = '<div class="analysis-content">';
        
        // Overall performance analysis
        analysis += '<h5>Analisis Performa Keseluruhan</h5>';
        if (accuracyDiff > 0) {
            analysis += `<p>Model SAW menunjukkan <strong>peningkatan akurasi sebesar ${Math.abs(accuracyDiff * 100).toFixed(1)}%</strong> ketika menggunakan data aktual dibandingkan data sintetik.`;
        } else if (accuracyDiff < 0) {
            analysis += `<p>Model SAW menunjukkan <strong>penurunan akurasi sebesar ${Math.abs(accuracyDiff * 100).toFixed(1)}%</strong> ketika menggunakan data aktual dibandingkan data sintetik.`;
        } else {
            analysis += '<p>Model SAW menunjukkan <strong>performa yang sama</strong> antara data sintetik dan aktual.';
        }
        analysis += '</p>';

        // Precision analysis
        analysis += '<h5>Analisis Precision</h5>';
        if (precisionDiff > 0) {
            analysis += `<p>Precision meningkat sebesar <strong>${Math.abs(precisionDiff * 100).toFixed(1)}%</strong> dengan data aktual, menunjukkan model lebih akurat dalam memprediksi positif.`;
        } else if (precisionDiff < 0) {
            analysis += `<p>Precision menurun sebesar <strong>${Math.abs(precisionDiff * 100).toFixed(1)}%</strong> dengan data aktual, menunjukkan model kurang akurat dalam memprediksi positif.`;
        } else {
            analysis += '<p>Precision tetap sama antara kedua jenis data.';
        }
        analysis += '</p>';

        // Recall analysis
        analysis += '<h5>Analisis Recall</h5>';
        if (recallDiff > 0) {
            analysis += `<p>Recall meningkat sebesar <strong>${Math.abs(recallDiff * 100).toFixed(1)}%</strong> dengan data aktual, menunjukkan model lebih baik dalam menemukan semua kasus positif.`;
        } else if (recallDiff < 0) {
            analysis += `<p>Recall menurun sebesar <strong>${Math.abs(recallDiff * 100).toFixed(1)}%</strong> dengan data aktual, menunjukkan model kurang baik dalam menemukan semua kasus positif.`;
        } else {
            analysis += '<p>Recall tetap sama antara kedua jenis data.';
        }
        analysis += '</p>';

        analysis += '</div>';
        return analysis;
    }

    generateRecommendations() {
        const syntheticAccuracy = this.syntheticData.accuracy || 0;
        const actualAccuracy = this.actualData.accuracy || 0;
        const accuracyDiff = actualAccuracy - syntheticAccuracy;

        let recommendations = '<div class="recommendations-content">';
        recommendations += '<h5>Rekomendasi Berdasarkan Perbandingan</h5>';
        recommendations += '<ul>';

        if (accuracyDiff > 0.1) {
            recommendations += '<li><strong>Gunakan data aktual</strong> untuk evaluasi model SAW karena memberikan hasil yang lebih akurat.</li>';
        } else if (accuracyDiff < -0.1) {
            recommendations += '<li><strong>Perbaiki model SAW</strong> untuk data aktual karena performa menurun signifikan.</li>';
        } else {
            recommendations += '<li><strong>Model SAW konsisten</strong> antara data sintetik dan aktual, dapat digunakan untuk kedua jenis data.</li>';
        }

        if (this.actualData.accuracy > 0.8) {
            recommendations += '<li><strong>Model SAW sangat baik</strong> untuk prediksi kelulusan mahasiswa dengan data aktual.</li>';
        } else if (this.actualData.accuracy > 0.6) {
            recommendations += '<li><strong>Model SAW cukup baik</strong> namun masih ada ruang untuk peningkatan.</li>';
        } else {
            recommendations += '<li><strong>Model SAW perlu perbaikan</strong> untuk meningkatkan akurasi prediksi.</li>';
        }

        recommendations += '<li><strong>Lakukan validasi berkala</strong> dengan data aktual terbaru untuk memastikan performa model tetap optimal.</li>';
        recommendations += '<li><strong>Pertimbangkan penyesuaian bobot</strong> kriteria berdasarkan hasil perbandingan ini.</li>';

        recommendations += '</ul>';
        recommendations += '</div>';
        return recommendations;
    }

    async exportResults() {
        try {
            if (!this.syntheticData || !this.actualData) {
                this.showNotification('warning', 'Data Belum Tersedia', 'Silakan hitung perbandingan terlebih dahulu');
                return;
            }

            const comparisonData = {
                timestamp: new Date().toISOString(),
                synthetic_data: this.syntheticData,
                actual_data: this.actualData,
                comparison: {
                    accuracy_diff: (this.actualData.accuracy || 0) - (this.syntheticData.accuracy || 0),
                    precision_diff: (this.actualData.precision || 0) - (this.syntheticData.precision || 0),
                    recall_diff: (this.actualData.recall || 0) - (this.syntheticData.recall || 0),
                    f1_diff: (this.actualData.f1_score || 0) - (this.syntheticData.f1_score || 0)
                }
            };

            const csv = this.convertToCSV(comparisonData);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `saw_comparison_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            this.showNotification('success', 'Export Berhasil', 'Data perbandingan SAW telah diexport');
        } catch (error) {
            console.error('Error exporting results:', error);
            this.showNotification('error', 'Export Gagal', 'Terjadi kesalahan saat mengexport data');
        }
    }

    convertToCSV(data) {
        const synthetic = data.synthetic_data;
        const actual = data.actual_data;
        const comparison = data.comparison;

        const csvContent = [
            'Metric,Synthetic,Actual,Difference',
            `Accuracy,${(synthetic.accuracy * 100).toFixed(2)}%,${(actual.accuracy * 100).toFixed(2)}%,${(comparison.accuracy_diff * 100).toFixed(2)}%`,
            `Precision,${(synthetic.precision * 100).toFixed(2)}%,${(actual.precision * 100).toFixed(2)}%,${(comparison.precision_diff * 100).toFixed(2)}%`,
            `Recall,${(synthetic.recall * 100).toFixed(2)}%,${(actual.recall * 100).toFixed(2)}%,${(comparison.recall_diff * 100).toFixed(2)}%`,
            `F1-Score,${(synthetic.f1_score * 100).toFixed(2)}%,${(actual.f1_score * 100).toFixed(2)}%,${(comparison.f1_diff * 100).toFixed(2)}%`,
            '',
            'Total Data',
            `Synthetic,${synthetic.total_data}`,
            `Actual,${actual.total_data}`,
            '',
            'Test Data',
            `Synthetic,${synthetic.test_data}`,
            `Actual,${actual.test_data}`
        ].join('\n');

        return csvContent;
    }

    printReport() {
        const reportHTML = this.generateReportHTML();
        const printWindow = window.open('', '_blank');
        printWindow.document.write(reportHTML);
        printWindow.document.close();
        printWindow.print();
    }

    generateReportHTML() {
        const synthetic = this.syntheticData;
        const actual = this.actualData;
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Laporan Perbandingan Evaluasi SAW</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .comparison-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .metric { font-weight: bold; }
                    .synthetic { background-color: #e8f5e8; }
                    .actual { background-color: #e8f0f8; }
                    .difference { background-color: #fff3cd; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Laporan Perbandingan Evaluasi SAW</h1>
                    <p>Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
                </div>
                
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th>Metrik</th>
                            <th>Data Sintetik</th>
                            <th>Data Aktual</th>
                            <th>Selisih</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="metric">Accuracy</td>
                            <td class="synthetic">${(synthetic.accuracy * 100).toFixed(2)}%</td>
                            <td class="actual">${(actual.accuracy * 100).toFixed(2)}%</td>
                            <td class="difference">${((actual.accuracy - synthetic.accuracy) * 100).toFixed(2)}%</td>
                        </tr>
                        <tr>
                            <td class="metric">Precision</td>
                            <td class="synthetic">${(synthetic.precision * 100).toFixed(2)}%</td>
                            <td class="actual">${(actual.precision * 100).toFixed(2)}%</td>
                            <td class="difference">${((actual.precision - synthetic.precision) * 100).toFixed(2)}%</td>
                        </tr>
                        <tr>
                            <td class="metric">Recall</td>
                            <td class="synthetic">${(synthetic.recall * 100).toFixed(2)}%</td>
                            <td class="actual">${(actual.recall * 100).toFixed(2)}%</td>
                            <td class="difference">${((actual.recall - synthetic.recall) * 100).toFixed(2)}%</td>
                        </tr>
                        <tr>
                            <td class="metric">F1-Score</td>
                            <td class="synthetic">${(synthetic.f1_score * 100).toFixed(2)}%</td>
                            <td class="actual">${(actual.f1_score * 100).toFixed(2)}%</td>
                            <td class="difference">${((actual.f1_score - synthetic.f1_score) * 100).toFixed(2)}%</td>
                        </tr>
                    </tbody>
                </table>
            </body>
            </html>
        `;
    }

    initializeCharts() {
        // Initialize empty charts
        const syntheticCtx = document.getElementById('sawComparisonSyntheticChart');
        const actualCtx = document.getElementById('sawComparisonActualChart');
        
        if (syntheticCtx) {
            window.sawComparisonSyntheticChart = new Chart(syntheticCtx, {
                type: 'doughnut',
                data: { 
                    labels: ['Peluang Lulus Tinggi', 'Peluang Lulus Sedang', 'Peluang Lulus Kecil'], 
                    datasets: [{
                        data: [0, 0, 0],
                        backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom'
                        }
                    }
                }
            });
        }
        
        if (actualCtx) {
            window.sawComparisonActualChart = new Chart(actualCtx, {
                type: 'doughnut',
                data: { 
                    labels: ['Peluang Lulus Tinggi', 'Peluang Lulus Sedang', 'Peluang Lulus Kecil'], 
                    datasets: [{
                        data: [0, 0, 0],
                        backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }

    showLoading(show) {
        if (show) {
            $('#sawComparisonCalculateBtn').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Menghitung...');
        } else {
            $('#sawComparisonCalculateBtn').prop('disabled', false).html('<i class="fas fa-calculator"></i> Hitung Perbandingan');
        }
    }

    showNotification(type, title, message) {
        const notification = $("#notification").data("kendoNotification");
        if (notification) {
            notification.show({
                message: message,
                title: title
            }, type);
        } else {
            console.log(`${type.toUpperCase()}: ${title} - ${message}`);
        }
    }

    formatPercentage(value) {
        return `${(value * 100).toFixed(2)}%`;
    }

    formatDifference(value) {
        const sign = value >= 0 ? '+' : '';
        const color = value >= 0 ? 'text-success' : 'text-danger';
        return `<span class="${color}">${sign}${(value * 100).toFixed(2)}%</span>`;
    }
}

// Export untuk digunakan di file lain
window.SAWComparison = SAWComparison;

// Test if module is loaded
console.log('SAWComparison module loaded successfully');
console.log('SAWComparison class available:', typeof SAWComparison); 