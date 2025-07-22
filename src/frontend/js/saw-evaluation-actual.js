/**
 * SAW Evaluation with Actual Data Module
 * Menangani evaluasi metode SAW (Simple Additive Weighting) dengan data aktual
 */

class SAWEvaluationActual {
    constructor() {
        this.config = window.CONFIG || {
            API_BASE_URL: 'http://localhost:8000',
            API_PREFIX: '/api',
            API_VERSION: 'v1'
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeCharts();
        console.log('✅ SAW Evaluation with Actual Data module initialized');
    }

    bindEvents() {
        // Calculate button
        $(document).on('click', '#sawEvaluationActualCalculateBtn', () => {
            this.calculateEvaluation();
        });

        // Export button
        $(document).on('click', '#sawEvaluationActualExportBtn', () => {
            this.exportData();
        });

        // Print button
        $(document).on('click', '#sawEvaluationActualPrintBtn', () => {
            this.printReport();
        });

        // Weight validation
        $(document).on('input', '#sawEvaluationActualIpkWeight, #sawEvaluationActualSksWeight, #sawEvaluationActualDekWeight', () => {
            this.validateWeights();
        });
    }

    validateWeights() {
        const ipkWeight = parseInt($('#sawEvaluationActualIpkWeight').val()) || 0;
        const sksWeight = parseInt($('#sawEvaluationActualSksWeight').val()) || 0;
        const dekWeight = parseInt($('#sawEvaluationActualDekWeight').val()) || 0;
        
        const total = ipkWeight + sksWeight + dekWeight;
        
        if (total !== 100) {
            $('#sawEvaluationActualCalculateBtn').prop('disabled', true);
            this.showNotification('warning', 'Total bobot harus 100%', `Total bobot saat ini: ${total}%`);
        } else {
            $('#sawEvaluationActualCalculateBtn').prop('disabled', false);
        }
    }

    async calculateEvaluation() {
        try {
            this.showLoading(true);
            
            const weights = {
                ipk: (parseInt($('#sawEvaluationActualIpkWeight').val()) || 40) / 100, // Konversi dari persentase ke desimal
                sks: (parseInt($('#sawEvaluationActualSksWeight').val()) || 35) / 100, // Konversi dari persentase ke desimal
                dek: (parseInt($('#sawEvaluationActualDekWeight').val()) || 25) / 100  // Konversi dari persentase ke desimal
            };

            const testSize = parseInt($('#sawEvaluationActualTestSize').val()) || 30;
            const randomState = parseInt($('#sawEvaluationActualRandomState').val()) || 42;
            const saveToDb = $('#sawEvaluationActualSaveToDb').is(':checked');

            const requestData = {
                weights: weights,
                test_size: testSize / 100, // Konversi dari persentase ke desimal
                random_state: randomState,
                save_to_db: saveToDb
            };

            const response = await $.ajax({
                url: `${this.config.API_BASE_URL}${this.config.API_PREFIX}/saw/evaluate-actual`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(requestData)
            });

            this.displayResults(response.evaluation);
            this.showNotification('success', 'Evaluasi SAW dengan Data Aktual Berhasil', 'Hasil evaluasi telah dihitung dan ditampilkan');

        } catch (error) {
            console.error('Error calculating SAW evaluation with actual data:', error);
            this.showNotification('error', 'Error Evaluasi SAW dengan Data Aktual', error.responseJSON?.detail || 'Terjadi kesalahan saat menghitung evaluasi');
        } finally {
            this.showLoading(false);
        }
    }

    displayResults(data) {
        console.log('Displaying evaluation data with actual data:', data); // Debug log
        console.log('Classification distribution:', data.classification_distribution); // Debug log
        
        // Update summary
        $('#sawEvaluationActualTotalData').text(data.total_data || 0);
        $('#sawEvaluationActualTrainingData').text(data.training_data || 0);
        $('#sawEvaluationActualTestData').text(data.test_data || 0);
        $('#sawEvaluationActualAccuracy').text(this.formatPercentage(data.accuracy || 0));

        // Update metrics
        $('#sawEvaluationActualPrecision').text(this.formatPercentage(data.precision || 0));
        $('#sawEvaluationActualRecall').text(this.formatPercentage(data.recall || 0));
        $('#sawEvaluationActualF1Score').text(this.formatPercentage(data.f1_score || 0));
        $('#sawEvaluationActualSpecificity').text(this.formatPercentage(data.specificity || 0));

        // Update confusion matrix
        if (data.confusion_matrix) {
            this.updateConfusionMatrix(data.confusion_matrix);
        }

        // Update results grid
        if (data.results) {
            this.updateResultsGrid(data.results);
        }

        // Update charts
        this.updateCharts(data);

        // Update performance analysis
        this.updatePerformanceAnalysis(data);
    }

    updatePerformanceAnalysis(data) {
        const accuracy = data.accuracy || 0;
        const precision = data.precision || 0;
        const recall = data.recall || 0;
        const f1Score = data.f1_score || 0;
        const specificity = data.specificity || 0;

        // Update accuracy narrative
        $('#sawEvaluationActualAccuracyText').text(this.formatPercentage(accuracy));
        $('#sawEvaluationActualAccuracyNarrative').text(this.generateAccuracyNarrative(accuracy));

        // Update precision-recall narrative
        $('#sawEvaluationActualPrecisionText').text(this.formatPercentage(precision));
        $('#sawEvaluationActualRecallText').text(this.formatPercentage(recall));
        $('#sawEvaluationActualPrecisionRecallNarrative').text(this.generatePrecisionRecallNarrative(precision, recall));

        // Update F1-score narrative
        $('#sawEvaluationActualF1Text').text(this.formatPercentage(f1Score));
        $('#sawEvaluationActualF1Narrative').text(this.generateF1Narrative(f1Score));

        // Update specificity narrative
        $('#sawEvaluationActualSpecificityText').text(this.formatPercentage(specificity));
        $('#sawEvaluationActualSpecificityNarrative').text(this.generateSpecificityNarrative(specificity));

        // Update overall narrative
        $('#sawEvaluationActualOverallNarrative').text(this.generateOverallNarrative(data));

        // Update recommendations
        $('#sawEvaluationActualRecommendations').html(this.generateRecommendations(data));
    }

    generateAccuracyNarrative(accuracyPercent) {
        if (accuracyPercent >= 90) {
            return "sangat tinggi, menunjukkan model SAW sangat akurat dalam memprediksi status kelulusan berdasarkan data aktual.";
        } else if (accuracyPercent >= 80) {
            return "tinggi, menunjukkan model SAW cukup akurat dalam memprediksi status kelulusan berdasarkan data aktual.";
        } else if (accuracyPercent >= 70) {
            return "cukup baik, namun masih ada ruang untuk peningkatan dalam memprediksi status kelulusan berdasarkan data aktual.";
        } else if (accuracyPercent >= 60) {
            return "sedang, model SAW perlu diperbaiki untuk meningkatkan akurasi prediksi status kelulusan berdasarkan data aktual.";
        } else {
            return "rendah, model SAW memerlukan perbaikan signifikan untuk meningkatkan akurasi prediksi status kelulusan berdasarkan data aktual.";
        }
    }

    generatePrecisionRecallNarrative(precisionPercent, recallPercent) {
        const diff = Math.abs(precisionPercent - recallPercent);
        
        if (diff <= 5) {
            return "keseimbangan yang sangat baik antara precision dan recall, menunjukkan model SAW konsisten dalam memprediksi status kelulusan berdasarkan data aktual.";
        } else if (diff <= 10) {
            return "keseimbangan yang baik antara precision dan recall, dengan sedikit perbedaan yang masih dapat diterima.";
        } else if (diff <= 15) {
            return "keseimbangan yang cukup baik, namun ada perbedaan yang perlu diperhatikan antara precision dan recall.";
        } else {
            return "ketidakseimbangan yang signifikan antara precision dan recall, menunjukkan model SAW perlu penyesuaian untuk data aktual.";
        }
    }

    generateF1Narrative(f1Percent) {
        if (f1Percent >= 90) {
            return "sangat tinggi, menunjukkan model SAW sangat baik dalam menyeimbangkan precision dan recall untuk data aktual.";
        } else if (f1Percent >= 80) {
            return "tinggi, menunjukkan model SAW baik dalam menyeimbangkan precision dan recall untuk data aktual.";
        } else if (f1Percent >= 70) {
            return "cukup baik, namun masih ada ruang untuk peningkatan dalam menyeimbangkan precision dan recall untuk data aktual.";
        } else if (f1Percent >= 60) {
            return "sedang, model SAW perlu perbaikan untuk meningkatkan keseimbangan precision dan recall untuk data aktual.";
        } else {
            return "rendah, model SAW memerlukan perbaikan signifikan untuk meningkatkan keseimbangan precision dan recall untuk data aktual.";
        }
    }

    generateSpecificityNarrative(specificityPercent) {
        if (specificityPercent >= 90) {
            return "sangat tinggi, model SAW sangat baik dalam mengidentifikasi mahasiswa yang tidak lulus berdasarkan data aktual.";
        } else if (specificityPercent >= 80) {
            return "tinggi, model SAW baik dalam mengidentifikasi mahasiswa yang tidak lulus berdasarkan data aktual.";
        } else if (specificityPercent >= 70) {
            return "cukup baik, namun masih ada ruang untuk peningkatan dalam mengidentifikasi mahasiswa yang tidak lulus berdasarkan data aktual.";
        } else if (specificityPercent >= 60) {
            return "sedang, model SAW perlu perbaikan untuk meningkatkan identifikasi mahasiswa yang tidak lulus berdasarkan data aktual.";
        } else {
            return "rendah, model SAW memerlukan perbaikan signifikan untuk meningkatkan identifikasi mahasiswa yang tidak lulus berdasarkan data aktual.";
        }
    }

    generateOverallNarrative(data) {
        const accuracy = data.accuracy || 0;
        const precision = data.precision || 0;
        const recall = data.recall || 0;
        const f1Score = data.f1_score || 0;
        
        let narrative = `Evaluasi SAW dengan data aktual menunjukkan performa yang `;
        
        const avgScore = (accuracy + precision + recall + f1Score) / 4;
        
        if (avgScore >= 85) {
            narrative += "sangat baik. Model SAW berhasil mengklasifikasikan status kelulusan mahasiswa dengan akurasi tinggi berdasarkan data historis yang sebenarnya. ";
        } else if (avgScore >= 75) {
            narrative += "baik. Model SAW menunjukkan kemampuan yang cukup dalam mengklasifikasikan status kelulusan berdasarkan data aktual. ";
        } else if (avgScore >= 65) {
            narrative += "cukup. Model SAW memiliki potensi namun masih memerlukan penyempurnaan untuk data aktual. ";
        } else {
            narrative += "perlu perbaikan. Model SAW memerlukan penyesuaian signifikan untuk meningkatkan performa pada data aktual. ";
        }
        
        narrative += `Dengan akurasi ${this.formatPercentage(accuracy)}, precision ${this.formatPercentage(precision)}, recall ${this.formatPercentage(recall)}, dan F1-score ${this.formatPercentage(f1Score)}, model ini dapat digunakan sebagai dasar pengambilan keputusan dengan mempertimbangkan konteks dan kebutuhan spesifik institusi pendidikan.`;
        
        return narrative;
    }

    generateRecommendations(data) {
        const accuracy = data.accuracy || 0;
        const precision = data.precision || 0;
        const recall = data.recall || 0;
        const f1Score = data.f1_score || 0;
        
        let recommendations = [];
        
        if (accuracy < 80) {
            recommendations.push("Pertimbangkan untuk menyesuaikan bobot kriteria (IPK, SKS, DEK) untuk meningkatkan akurasi model SAW pada data aktual.");
        }
        
        if (Math.abs(precision - recall) > 10) {
            recommendations.push("Keseimbangan precision-recall perlu diperbaiki dengan menyesuaikan threshold klasifikasi atau bobot kriteria.");
        }
        
        if (f1Score < 75) {
            recommendations.push("F1-score yang rendah menunjukkan perlunya optimasi model untuk menyeimbangkan precision dan recall pada data aktual.");
        }
        
        if (data.confusion_matrix) {
            const cm = data.confusion_matrix;
            const tp = cm[1]?.[1] || 0;
            const fp = cm[0]?.[1] || 0;
            const fn = cm[1]?.[0] || 0;
            const tn = cm[0]?.[0] || 0;
            
            if (fp > tp) {
                recommendations.push("Tingginya false positive menunjukkan model cenderung over-predict kelulusan. Pertimbangkan untuk menaikkan threshold klasifikasi.");
            }
            
            if (fn > tp) {
                recommendations.push("Tingginya false negative menunjukkan model cenderung under-predict kelulusan. Pertimbangkan untuk menurunkan threshold klasifikasi.");
            }
        }
        
        recommendations.push("Lakukan validasi cross-sectional dengan data mahasiswa dari periode yang berbeda untuk memastikan konsistensi model.");
        recommendations.push("Pertimbangkan untuk menambahkan kriteria lain yang relevan dengan status kelulusan mahasiswa.");
        recommendations.push("Lakukan monitoring berkala terhadap performa model SAW dengan data aktual terbaru.");
        
        return recommendations.map(rec => `<li>${rec}</li>`).join('');
    }

    updateConfusionMatrix(confusionMatrix) {
        const container = $('#sawEvaluationActualConfusionMatrix');
        container.empty();
        
        console.log('Received confusion matrix:', confusionMatrix);
        console.log('Type:', typeof confusionMatrix);
        console.log('Is array:', Array.isArray(confusionMatrix));
        
        // Jika confusionMatrix bukan array 2D, coba ambil dari property confusion_matrix
        if (!Array.isArray(confusionMatrix) || typeof confusionMatrix[0] === 'undefined' || !Array.isArray(confusionMatrix[0])) {
            if (confusionMatrix && Array.isArray(confusionMatrix.confusion_matrix)) {
                confusionMatrix = confusionMatrix.confusion_matrix;
            } else {
                container.html('<p class="text-danger">Format confusion matrix tidak valid</p>');
                return;
            }
        }
        
        console.log('Processed confusion matrix:', confusionMatrix);
        
        let html = '<table class="confusion-table">';
        html += '<thead><tr><th></th><th colspan="3">Predicted</th></tr>';
        html += '<tr><th>Actual</th><th>Peluang Lulus Tinggi</th><th>Peluang Lulus Sedang</th><th>Peluang Lulus Kecil</th></tr></thead>';
        html += '<tbody>';
        
        const labels = ['Peluang Lulus Tinggi', 'Peluang Lulus Sedang', 'Peluang Lulus Kecil'];
        
        confusionMatrix.forEach((row, i) => {
            html += `<tr><td><strong>${labels[i]}</strong></td>`;
            row.forEach((cell, j) => {
                const percentage = this.calculatePercentage(cell, confusionMatrix);
                const colorClass = this.getConfusionMatrixColor(i, j, confusionMatrix);
                html += `<td class="${colorClass}">${cell}<br><small>(${percentage}%)</small></td>`;
            });
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        container.html(html);
    }

    calculatePercentage(value, matrix) {
        // Gunakan reduce manual untuk menghindari flat() yang mungkin tidak support
        let total = 0;
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[i].length; j++) {
                total += matrix[i][j];
            }
        }
        return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
    }

    getConfusionMatrixColor(actual, predicted, matrix) {
        if (actual === predicted) {
            // True positive/negative
            const value = matrix[actual][predicted];
            let total = 0;
            for (let i = 0; i < matrix.length; i++) {
                for (let j = 0; j < matrix[i].length; j++) {
                    total += matrix[i][j];
                }
            }
            const percentage = (value / total) * 100;
            
            if (percentage >= 30) return 'cm-high-tp';
            if (percentage >= 20) return 'cm-medium-tp';
            return 'cm-low-tp';
        } else {
            // False positive/negative
            const value = matrix[actual][predicted];
            let total = 0;
            for (let i = 0; i < matrix.length; i++) {
                for (let j = 0; j < matrix[i].length; j++) {
                    total += matrix[i][j];
                }
            }
            const percentage = (value / total) * 100;
            
            if (percentage >= 15) return 'cm-high-fp';
            if (percentage >= 10) return 'cm-medium-fp';
            return 'cm-low-fp';
        }
    }

    generateMatrixRecommendations(tp, fp, fn, tn, accuracy, precision, recall) {
        let recommendations = [];
        
        if (fp > tp) {
            recommendations.push("Tingginya false positive menunjukkan model cenderung over-predict kelulusan. Pertimbangkan untuk menaikkan threshold klasifikasi.");
        }
        
        if (fn > tp) {
            recommendations.push("Tingginya false negative menunjukkan model cenderung under-predict kelulusan. Pertimbangkan untuk menurunkan threshold klasifikasi.");
        }
        
        if (tp === 0 && tn === 0) {
            recommendations.push("Model tidak berhasil mengklasifikasikan dengan benar. Perlu evaluasi ulang terhadap kriteria dan bobot yang digunakan.");
        }
        
        return recommendations;
    }

    updateResultsGrid(results) {
        if (!results || results.length === 0) {
            $('#sawEvaluationActualResultsGrid').html('<p class="text-muted">Data hasil evaluasi tidak tersedia</p>');
            return;
        }
        
        const grid = $('#sawEvaluationActualResultsGrid');
        grid.empty();
        
        const columns = [
            { field: 'nim', title: 'NIM', width: 120 },
            { field: 'nama', title: 'Nama', width: 200 },
            { field: 'ipk', title: 'IPK', width: 80, format: '{0:N2}' },
            { field: 'sks', title: 'SKS', width: 80 },
            { field: 'persen_dek', title: 'DEK (%)', width: 100, format: '{0:N1}%' },
            { field: 'actual_status', title: 'Status Aktual', width: 120 },
            { field: 'predicted_class', title: 'Prediksi SAW', width: 150 },
            { field: 'final_value', title: 'Nilai Akhir', width: 120, format: '{0:N3}' },
            { field: 'is_correct', title: 'Benar', width: 80, template: '#= is_correct ? "✓" : "✗" #' }
        ];
        
        grid.kendoGrid({
            dataSource: {
                data: results,
                schema: {
                    model: {
                        fields: {
                            nim: { type: 'string' },
                            nama: { type: 'string' },
                            ipk: { type: 'number' },
                            sks: { type: 'number' },
                            persen_dek: { type: 'number' },
                            actual_status: { type: 'string' },
                            predicted_class: { type: 'string' },
                            final_value: { type: 'number' },
                            is_correct: { type: 'boolean' }
                        }
                    }
                }
            },
            columns: columns,
            sortable: true,
            filterable: true,
            pageable: {
                pageSize: 20,
                pageSizes: [10, 20, 50, 100]
            },
            height: 400,
            scrollable: true,
            resizable: true
        });
    }

    updateCharts(data) {
        console.log('Updating charts with data:', data);
        
        // Update classification chart dengan classification_distribution
        if (data.classification_distribution) {
            console.log('Updating classification chart with:', data.classification_distribution);
            this.updateClassificationChart(data.classification_distribution);
        } else {
            console.warn('No classification_distribution data found');
        }
        
        // Update metrics chart
        this.updateMetricsChart(data);
    }

    updateClassificationChart(distribution) {
        const ctx = document.getElementById('sawEvaluationActualClassificationChart');
        if (!ctx) {
            console.error('Canvas element sawEvaluationActualClassificationChart not found');
            return;
        }
        
        console.log('Updating classification chart with distribution:', distribution);
        
        if (window.sawEvaluationActualClassificationChart) {
            window.sawEvaluationActualClassificationChart.destroy();
        }
        
        // Pastikan distribution ada dan valid
        if (!distribution || typeof distribution !== 'object') {
            console.error('Invalid distribution data:', distribution);
            return;
        }
        
        // Mapping label yang lebih deskriptif
        const labelMapping = {
            'tinggi': 'Peluang Lulus Tinggi',
            'sedang': 'Peluang Lulus Sedang', 
            'kecil': 'Peluang Lulus Kecil'
        };
        
        const labels = Object.keys(distribution).map(key => labelMapping[key] || key);
        const values = Object.values(distribution);
        const colors = ['#28a745', '#ffc107', '#dc3545'];
        
        console.log('Chart data:', { labels, values, colors });
        
        // Update total data display
        const total = values.reduce((sum, val) => sum + val, 0);
        const totalElement = document.getElementById('sawEvaluationActualTotalData');
        if (totalElement) {
            totalElement.textContent = total;
        }
        
        window.sawEvaluationActualClassificationChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff',
                    hoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
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
                },
                animation: {
                    animateRotate: true,
                    animateScale: true
                }
            }
        });
        
        console.log('Classification chart updated successfully');
    }

    updateMetricsChart(data) {
        const ctx = document.getElementById('sawEvaluationActualMetricsChart');
        if (!ctx) return;
        
        if (window.sawEvaluationActualMetricsChart) {
            window.sawEvaluationActualMetricsChart.destroy();
        }
        
        const metrics = [
            { label: 'Accuracy', value: data.accuracy || 0, color: '#007bff' },
            { label: 'Precision', value: data.precision || 0, color: '#28a745' },
            { label: 'Recall', value: data.recall || 0, color: '#ffc107' },
            { label: 'F1-Score', value: data.f1_score || 0, color: '#dc3545' },
            { label: 'Specificity', value: data.specificity || 0, color: '#6f42c1' }
        ];
        
        window.sawEvaluationActualMetricsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: metrics.map(m => m.label),
                datasets: [{
                    label: 'Percentage',
                    data: metrics.map(m => m.value * 100),
                    backgroundColor: metrics.map(m => m.color),
                    borderColor: metrics.map(m => m.color),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed.y.toFixed(1)}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    initializeCharts() {
        console.log('Initializing charts for SAW Evaluation with Actual Data');
        
        // Initialize empty charts
        const classificationCtx = document.getElementById('sawEvaluationActualClassificationChart');
        const metricsCtx = document.getElementById('sawEvaluationActualMetricsChart');
        
        console.log('Classification chart canvas:', classificationCtx);
        console.log('Metrics chart canvas:', metricsCtx);
        
        if (classificationCtx) {
            window.sawEvaluationActualClassificationChart = new Chart(classificationCtx, {
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
            console.log('Classification chart initialized');
        } else {
            console.error('Classification chart canvas not found');
        }
        
        if (metricsCtx) {
            window.sawEvaluationActualMetricsChart = new Chart(metricsCtx, {
                type: 'bar',
                data: { 
                    labels: ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'Specificity'], 
                    datasets: [{
                        label: 'Percentage',
                        data: [0, 0, 0, 0, 0],
                        backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1']
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    }
                }
            });
            console.log('Metrics chart initialized');
        } else {
            console.error('Metrics chart canvas not found');
        }
    }

    async exportData() {
        try {
            const response = await $.ajax({
                url: `${this.config.API_BASE_URL}${this.config.API_PREFIX}/saw/export-evaluation-actual`,
                method: 'GET'
            });
            
            if (response.data) {
                const csv = this.convertToCSV(response.data);
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `saw_evaluation_actual_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
                
                this.showNotification('success', 'Export Berhasil', 'Data evaluasi SAW dengan data aktual telah diexport');
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showNotification('error', 'Export Gagal', 'Terjadi kesalahan saat mengexport data');
        }
    }

    convertToCSV(data) {
        if (!data || data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
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
        const accuracy = $('#sawEvaluationActualAccuracy').text();
        const precision = $('#sawEvaluationActualPrecision').text();
        const recall = $('#sawEvaluationActualRecall').text();
        const f1Score = $('#sawEvaluationActualF1Score').text();
        const specificity = $('#sawEvaluationActualSpecificity').text();
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Laporan Evaluasi SAW dengan Data Aktual</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .metrics { display: flex; justify-content: space-around; margin: 20px 0; }
                    .metric { text-align: center; }
                    .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Laporan Evaluasi SAW dengan Data Aktual</h1>
                    <p>Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
                </div>
                
                <div class="metrics">
                    <div class="metric">
                        <div class="metric-value">${accuracy}</div>
                        <div>Accuracy</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${precision}</div>
                        <div>Precision</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${recall}</div>
                        <div>Recall</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${f1Score}</div>
                        <div>F1-Score</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${specificity}</div>
                        <div>Specificity</div>
                    </div>
                </div>
                
                <h2>Kesimpulan</h2>
                <p>${$('#sawEvaluationActualOverallNarrative').text()}</p>
                
                <h2>Rekomendasi</h2>
                <ul>
                    ${$('#sawEvaluationActualRecommendations li').map(function() { return '<li>' + $(this).text() + '</li>'; }).get().join('')}
                </ul>
            </body>
            </html>
        `;
    }

    showLoading(show) {
        if (show) {
            $('#sawEvaluationActualLoadingIndicator').show();
        } else {
            $('#sawEvaluationActualLoadingIndicator').hide();
        }
    }

    showNotification(type, title, message) {
        if (window.showNotification) {
            window.showNotification(type, title, message);
        } else {
            console.log(`${type.toUpperCase()}: ${title} - ${message}`);
        }
    }

    formatPercentage(value) {
        if (typeof value !== 'number' || isNaN(value)) return '0%';
        return `${(value * 100).toFixed(1)}%`;
    }
}

// Initialize the module when DOM is ready
$(document).ready(function() {
    window.sawEvaluationActual = new SAWEvaluationActual();
}); 