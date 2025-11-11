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
        const ipkWeight = parseFloat($('#sawEvaluationActualIpkWeight').val()) || 0;
        const sksWeight = parseFloat($('#sawEvaluationActualSksWeight').val()) || 0;
        const dekWeight = parseFloat($('#sawEvaluationActualDekWeight').val()) || 0;
        
        const total = ipkWeight + sksWeight + dekWeight;
        
        // Allow small tolerance (±0.1) for floating point precision
        if (Math.abs(total - 100) > 0.1) {
            $('#sawEvaluationActualCalculateBtn').prop('disabled', true);
            this.showNotification('warning', 'Total bobot harus 100%', `Total bobot saat ini: ${total.toFixed(1)}%`);
        } else {
            $('#sawEvaluationActualCalculateBtn').prop('disabled', false);
        }
    }

    async calculateEvaluation() {
        try {
            this.showLoading(true);
            
            // Update button text to show loading state
            const $btn = $('#sawEvaluationActualCalculateBtn');
            const originalText = $btn.html();
            $btn.html('<i class="fas fa-spinner fa-spin"></i> Mengevaluasi...');
            $btn.prop('disabled', true);
            
            const weights = {
                ipk: (parseFloat($('#sawEvaluationActualIpkWeight').val()) || 35) / 100, // Konversi dari persentase ke desimal
                sks: (parseFloat($('#sawEvaluationActualSksWeight').val()) || 32.5) / 100, // Konversi dari persentase ke desimal
                dek: (parseFloat($('#sawEvaluationActualDekWeight').val()) || 32.5) / 100  // Konversi dari persentase ke desimal
            };

            const saveToDb = $('#sawEvaluationActualSaveToDb').is(':checked');

            // Request data tanpa test_size dan random_state
            // Backend akan otomatis menggunakan semua data yang punya status_lulus_aktual
            const requestData = {
                weights: weights,
                test_size: 1.0,  // 100% data - semua data berlabel digunakan
                random_state: 42, // Tetap ada untuk kompatibilitas, tapi tidak digunakan untuk split
                save_to_db: saveToDb
            };

            console.log('🔧 Sending SAW evaluation request with full data:', requestData);

            const response = await $.ajax({
                url: `${this.config.API_BASE_URL}${this.config.API_PREFIX}/saw/evaluate-actual`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(requestData),
                timeout: 60000 // 60 second timeout for large datasets
            });

            console.log('✅ SAW evaluation response:', response);
            console.log('📊 Evaluation type:', response.evaluation?.evaluation_info?.evaluation_type || 'N/A');
            console.log('📈 Total data evaluated:', response.evaluation?.total_data || 0);

            this.displayResults(response.evaluation);
            this.showNotification('success', 'Evaluasi SAW dengan Data Aktual Berhasil', 
                `Berhasil mengevaluasi ${response.evaluation?.total_data || 0} data mahasiswa dengan seluruh data berlabel`);

            // Restore button
            $btn.html(originalText);
            $btn.prop('disabled', false);

        } catch (error) {
            console.error('❌ Error calculating SAW evaluation with actual data:', error);
            
            // More specific error messages
            let errorMessage = 'Terjadi kesalahan saat menghitung evaluasi';
            if (error.statusText === 'timeout') {
                errorMessage = 'Request timeout. Data terlalu besar, silakan coba lagi.';
            } else if (error.status === 0) {
                errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi Anda.';
            } else if (error.responseJSON?.detail) {
                errorMessage = error.responseJSON.detail;
            }
            
            this.showNotification('error', 'Error Evaluasi SAW dengan Data Aktual', errorMessage);
            
            // Restore button
            const $btn = $('#sawEvaluationActualCalculateBtn');
            $btn.html('<i class="fas fa-calculator"></i> Mulai Evaluasi SAW dengan Data Aktual');
            $btn.prop('disabled', false);
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
        
        console.log('📊 Updating SAW Actual Results Grid with', results.length, 'records');
        
        // Destroy existing grid jika ada
        const existingGrid = $('#sawEvaluationActualResultsGrid').data('kendoGrid');
        if (existingGrid) {
            existingGrid.destroy();
        }
        
        // Clear and recreate
        $('#sawEvaluationActualResultsGrid').empty();

        // Tambahkan info box di atas grid (hapus jika sudah ada untuk mencegah duplikasi)
        $('#sawActualResultsInfo').remove();
        $('#sawEvaluationActualResultsGrid').before(`
            <div id="sawActualResultsInfo" style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                <i class="fas fa-info-circle"></i>
                <span id="sawActualResultsInfoText">Menampilkan ${results.length} data mahasiswa dengan status lulus aktual</span>
            </div>
        `);
        
        // Helper function untuk warna badge program studi
        function getProdiColorSAW(prodi) {
            if (!prodi) return { bg: '#e0e0e0', text: '#666' };

            const prodiColors = {
                'Teknik Informatika': { bg: '#e3f2fd', text: '#1565C0' },
                'Sistem Informasi': { bg: '#e8f5e9', text: '#2e7d32' },
                'Teknik Komputer': { bg: '#fff3e0', text: '#e65100' },
                'Manajemen Informatika': { bg: '#f3e5f5', text: '#6a1b9a' },
                'Komputerisasi Akuntansi': { bg: '#fff9c4', text: '#f57f17' },
                'Teknik Elektro': { bg: '#ffebee', text: '#c62828' },
                'default': { bg: '#e0e0e0', text: '#424242' }
            };

            for (const [key, color] of Object.entries(prodiColors)) {
                if (key !== 'default' && prodi.toUpperCase().includes(key.toUpperCase())) {
                    return color;
                }
            }

            return prodiColors['default'];
        }
        
        // Helper function untuk warna status badge
        function getStatusBadgeColor(status) {
            if (!status) return 'bg-secondary';
            const statusUpper = status.toUpperCase();
            if (statusUpper.includes('TINGGI')) return 'bg-success';
            if (statusUpper.includes('SEDANG')) return 'bg-warning';
            if (statusUpper.includes('KECIL')) return 'bg-danger';
            return 'bg-secondary';
        }

        function formatActualStatus(status) {
            return status ? status.replace(/_/g, ' ') : 'N/A';
        }
        
        // Helper function untuk unique values (untuk filter)
        function getUniqueProdiList(data) {
            if (!data || !Array.isArray(data)) return [];
            const uniqueProdi = [...new Set(data.map(item => item.program_studi).filter(p => p))];
            return uniqueProdi.map(prodi => ({ program_studi: prodi }));
        }
        
        $('#sawEvaluationActualResultsGrid').kendoGrid({
            dataSource: {
                data: results,
                pageSize: 20,
                schema: {
                    model: {
                        fields: {
                            nim: { type: "string" },
                            nama: { type: "string" },
                            program_studi: { type: "string" },
                            ipk: { type: "number" },
                            sks: { type: "number" },
                            persen_dek: { type: "number" },
                            predicted_class: { type: "string" },
                            actual_status: { type: "string" },
                            final_value: { type: "number" },
                            is_correct: { type: "boolean" }
                        }
                    }
                }
            },
            height: 600,
            scrollable: true,
            sortable: {
                mode: "multiple",
                allowUnsort: true
            },
            filterable: {
                mode: "row",
                extra: false
            },
            pageable: {
                refresh: true,
                pageSizes: [10, 20, 50, 100, "all"],
                buttonCount: 5,
                messages: {
                    display: "{0} - {1} dari {2} data",
                    empty: "Tidak ada data untuk ditampilkan",
                    page: "Halaman",
                    of: "dari {0}",
                    itemsPerPage: "data per halaman",
                    first: "Halaman pertama",
                    previous: "Halaman sebelumnya",
                    next: "Halaman selanjutnya",
                    last: "Halaman terakhir",
                    refresh: "Refresh"
                }
            },
            toolbar: [
                {
                    template: '<button class="k-button k-button-icontext" onclick="exportSAWActualEvaluationResults()"><span class="k-icon k-i-file-excel"></span>Export Excel</button>'
                },
                {
                    template: '<div style="margin-left: 10px; padding: 8px 15px; background: linear-gradient(135deg, \\#e3f2fd 0%, \\#bbdefb 100%); border-radius: 6px; display: inline-flex; align-items: center; gap: 8px;"><i class="fas fa-info-circle" style="color: \\#1976D2;"></i> <span style="color: \\#1565C0; font-weight: 500;">Total: <strong id="sawActualGridTotal">' + results.length + '</strong> data</span></div>'
                }
            ],
            columns: [
                { 
                    field: "nim", 
                    title: "NIM", 
                    width: 130,
                    filterable: {
                        cell: {
                            operator: "contains",
                            showOperators: false,
                            suggestionOperator: "contains"
                        }
                    },
                    template: function(dataItem) {
                        const nim = dataItem.nim || 'N/A';
                        return `<span style="font-family: monospace; font-weight: 500; color: #1976D2;">${nim}</span>`;
                    }
                },
                { 
                    field: "nama", 
                    title: "Nama", 
                    width: 200,
                    filterable: {
                        cell: {
                            operator: "contains",
                            showOperators: false,
                            suggestionOperator: "contains"
                        }
                    },
                    template: function(dataItem) {
                        const nama = dataItem.nama || 'N/A';
                        return `<span style="font-weight: 500; color: #333;">${nama}</span>`;
                    }
                },
                { 
                    field: "program_studi", 
                    title: "Program Studi", 
                    width: 250,
                    template: function(dataItem) {
                        if (!dataItem.program_studi) {
                            return '<span style="color: #999;">N/A</span>';
                        }
                        const colors = getProdiColorSAW(dataItem.program_studi);
                        return `<span style="display: inline-block; padding: 4px 10px; background: ${colors.bg}; color: ${colors.text}; border-radius: 4px; font-size: 12px; font-weight: 500;">${dataItem.program_studi}</span>`;
                    },
                    filterable: {
                        multi: true,
                        search: true,
                        dataSource: getUniqueProdiList(results),
                        checkAll: true,
                        itemTemplate: function(e) {
                            if (!e.program_studi) return '';
                            const colors = getProdiColorSAW(e.program_studi);
                            return `<span style="display: inline-block; padding: 2px 8px; margin: 2px 0; background: ${colors.bg}; color: ${colors.text}; border-radius: 4px; font-size: 11px; font-weight: 500;">${e.program_studi}</span>`;
                        }
                    }
                },
                { 
                    field: "ipk", 
                    title: "IPK", 
                    width: 100,
                    format: "{0:n2}",
                    filterable: false,
                    template: function(dataItem) {
                        const ipk = dataItem.ipk || 0;
                        let color = '#666';
                        if (ipk >= 3.5) color = '#28a745';
                        else if (ipk >= 3.0) color = '#ffc107';
                        else if (ipk >= 2.5) color = '#ff9800';
                        else color = '#dc3545';
                        return `<span style="color: ${color}; font-weight: 600;">${ipk.toFixed(2)}</span>`;
                    },
                    attributes: {
                        style: "text-align: center;"
                    },
                    headerAttributes: {
                        style: "text-align: center;"
                    }
                },
                { 
                    field: "sks", 
                    title: "SKS", 
                    width: 90,
                    filterable: false,
                    template: function(dataItem) {
                        const sks = dataItem.sks || 0;
                        let color = '#666';
                        if (sks >= 130) color = '#28a745';
                        else if (sks >= 110) color = '#ffc107';
                        else if (sks >= 90) color = '#ff9800';
                        else color = '#dc3545';
                        return `<span style="color: ${color}; font-weight: 600;">${sks}</span>`;
                    },
                    attributes: {
                        style: "text-align: center;"
                    },
                    headerAttributes: {
                        style: "text-align: center;"
                    }
                },
                { 
                    field: "persen_dek", 
                    title: "% D/E/K", 
                    width: 100,
                    format: "{0:n1}%",
                    filterable: false,
                    template: function(dataItem) {
                        const dek = dataItem.persen_dek || 0;
                        let color = '#666';
                        if (dek <= 10) color = '#28a745';
                        else if (dek <= 20) color = '#ffc107';
                        else if (dek <= 30) color = '#ff9800';
                        else color = '#dc3545';
                        return `<span style="color: ${color}; font-weight: 600;">${dek.toFixed(1)}%</span>`;
                    },
                    attributes: {
                        style: "text-align: center;"
                    },
                    headerAttributes: {
                        style: "text-align: center;"
                    }
                },
                { 
                    field: "final_value", 
                    title: "Skor SAW", 
                    width: 120,
                    format: "{0:n4}",
                    filterable: false,
                    template: function(dataItem) {
                        const score = dataItem.final_value != null ? dataItem.final_value : 0;
                        let color = '#dc3545';
                        let bgColor = '#ffebee';
                        if (score >= 0.75) {
                            color = '#28a745';
                            bgColor = '#e8f5e9';
                        } else if (score >= 0.55) {
                            color = '#ffc107';
                            bgColor = '#fff3cd';
                        }
                        return `<span style="padding: 5px 10px; background: ${bgColor}; color: ${color}; border-radius: 4px; font-weight: bold; display: inline-block; font-family: 'Fira Code', monospace;">${score.toFixed(4)}</span>`;
                    },
                    attributes: {
                        style: "text-align: center;"
                    },
                    headerAttributes: {
                        style: "text-align: center;"
                    }
                },
                { 
                    field: "predicted_class", 
                    title: "Prediksi SAW", 
                    width: 180,
                    template: function(dataItem) {
                        const badgeClass = getStatusBadgeColor(dataItem.predicted_class);
                        return `<span class="badge ${badgeClass}" style="font-size: 11px; padding: 6px 12px; font-weight: 600; white-space: nowrap;">${dataItem.predicted_class || 'N/A'}</span>`;
                    },
                    filterable: {
                        multi: true,
                        search: true,
                        dataSource: [
                            { predicted_class: 'Peluang Lulus Tinggi' },
                            { predicted_class: 'Peluang Lulus Sedang' },
                            { predicted_class: 'Peluang Lulus Kecil' }
                        ],
                        checkAll: true,
                        itemTemplate: function(e) {
                            const badgeClass = getStatusBadgeColor(e.predicted_class);
                            return `<span class="badge ${badgeClass}" style="font-size: 11px; padding: 4px 10px; font-weight: 600; white-space: nowrap;">${e.predicted_class}</span>`;
                        }
                    },
                    attributes: {
                        style: "text-align: center;"
                    },
                    headerAttributes: {
                        style: "text-align: center;"
                    }
                },
                { 
                    field: "actual_status", 
                    title: "Status Aktual", 
                    width: 180,
                    template: function(dataItem) {
                        const badgeClass = getStatusBadgeColor(dataItem.actual_status);
                        const statusText = formatActualStatus(dataItem.actual_status);
                        return `<span class="badge ${badgeClass}" style="font-size: 11px; padding: 6px 12px; font-weight: 600; white-space: nowrap;">${statusText}</span>`;
                    },
                    filterable: {
                        multi: true,
                        search: true,
                        dataSource: [
                            { actual_status: 'LULUS_TINGGI', text: 'LULUS TINGGI' },
                            { actual_status: 'LULUS_SEDANG', text: 'LULUS SEDANG' },
                            { actual_status: 'LULUS_KECIL', text: 'LULUS KECIL' }
                        ],
                        checkAll: true,
                        itemTemplate: function(e) {
                            const badgeClass = getStatusBadgeColor(e.actual_status);
                            const statusText = formatActualStatus(e.text || e.actual_status);
                            return `<span class="badge ${badgeClass}" style="font-size: 11px; padding: 4px 10px; font-weight: 600; white-space: nowrap;">${statusText}</span>`;
                        }
                    },
                    attributes: {
                        style: "text-align: center;"
                    },
                    headerAttributes: {
                        style: "text-align: center;"
                    }
                },
                { 
                    field: "is_correct", 
                    title: "Match", 
                    width: 100,
                    filterable: false,
                    template: function(dataItem) {
                        if (dataItem.is_correct) {
                            return '<div style="text-align: center;"><span style="padding: 5px 12px; background: #e8f5e9; color: #28a745; border-radius: 4px; font-weight: 600; display: inline-block;"><i class="fas fa-check-circle"></i> Benar</span></div>';
                        } else {
                            return '<div style="text-align: center;"><span style="padding: 5px 12px; background: #ffebee; color: #dc3545; border-radius: 4px; font-weight: 600; display: inline-block;"><i class="fas fa-times-circle"></i> Salah</span></div>';
                        }
                    },
                    attributes: {
                        style: "text-align: center;"
                    },
                    headerAttributes: {
                        style: "text-align: center;"
                    }
                }
            ],
            dataBound: function(e) {
                const grid = e.sender;
                const totalRecords = grid.dataSource.total();
                const totalFormatted = totalRecords.toLocaleString('id-ID');
                $('#sawActualGridTotal').text(totalFormatted);
                $('#sawActualResultsInfoText').text(`Menampilkan ${totalFormatted} data mahasiswa dengan status lulus aktual`);
            }
        });
        
        console.log('✅ SAW Actual Results Grid initialized successfully');
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
        
        // Hancurkan chart instance yang ada di canvas (menggunakan Chart.js API)
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            existingChart.destroy();
        }
        
        // Hancurkan chart instance global jika ada
        if (window.sawEvaluationActualClassificationChart && typeof window.sawEvaluationActualClassificationChart.destroy === 'function') {
            try {
                window.sawEvaluationActualClassificationChart.destroy();
            } catch (error) {
                console.warn('Error destroying global classification chart:', error);
            }
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
        
        // Hancurkan chart instance yang ada di canvas (menggunakan Chart.js API)
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            existingChart.destroy();
        }
        
        // Hancurkan chart instance global jika ada
        if (window.sawEvaluationActualMetricsChart && typeof window.sawEvaluationActualMetricsChart.destroy === 'function') {
            try {
                window.sawEvaluationActualMetricsChart.destroy();
            } catch (error) {
                console.warn('Error destroying global metrics chart:', error);
            }
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
        
        // Hancurkan chart yang sudah ada terlebih dahulu
        if (window.sawEvaluationActualClassificationChart && typeof window.sawEvaluationActualClassificationChart.destroy === 'function') {
            try {
                window.sawEvaluationActualClassificationChart.destroy();
            } catch (error) {
                console.warn('Error destroying classification chart:', error);
            }
            window.sawEvaluationActualClassificationChart = null;
        }
        if (window.sawEvaluationActualMetricsChart && typeof window.sawEvaluationActualMetricsChart.destroy === 'function') {
            try {
                window.sawEvaluationActualMetricsChart.destroy();
            } catch (error) {
                console.warn('Error destroying metrics chart:', error);
            }
            window.sawEvaluationActualMetricsChart = null;
        }
        
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

function exportSAWActualEvaluationResults() {
    try {
        const grid = $('#sawEvaluationActualResultsGrid').data('kendoGrid');
        if (!grid) {
            window.showNotification && window.showNotification('error', 'Error', 'Grid tidak ditemukan. Pastikan data sudah dimuat.');
            return;
        }

        const dataSource = grid.dataSource;
        const data = dataSource ? dataSource.data() : [];

        if (!data || data.length === 0) {
            window.showNotification && window.showNotification('warning', 'Peringatan', 'Tidak ada data untuk diekspor');
            return;
        }

        const plainData = data.map(item => ({
            nim: item.nim,
            nama: item.nama,
            program_studi: item.program_studi,
            ipk: item.ipk,
            sks: item.sks,
            persen_dek: item.persen_dek,
            skor_saw: item.final_value,
            predicted_class: item.predicted_class,
            actual_status: item.actual_status,
            is_correct: item.is_correct
        }));

        exportSAWActualEvaluationResultsCustom(plainData);
    } catch (error) {
        console.error('❌ Error exporting SAW evaluation results:', error);
        window.showNotification && window.showNotification('error', 'Error', 'Gagal mengekspor data: ' + error.message);
    }
}

function exportSAWActualEvaluationResultsCustom(fullData) {
    if (!fullData || !Array.isArray(fullData) || fullData.length === 0) {
        window.showNotification && window.showNotification('error', 'Error', 'Tidak ada data untuk diekspor');
        return;
    }

    try {
        if (typeof JSZip === 'undefined' || typeof kendo === 'undefined' || typeof kendo.ooxml === 'undefined') {
            console.warn('JSZip atau Kendo OOXML tidak tersedia, fallback ke CSV');
            exportSAWToCSV(fullData);
            return;
        }

        const exportData = fullData.map(item => ({
            'NIM': item.nim || '',
            'Nama Mahasiswa': item.nama || '',
            'Program Studi': item.program_studi || '',
            'IPK': item.ipk != null ? Number(item.ipk).toFixed(2) : '',
            'SKS': item.sks != null ? item.sks : '',
            '% D/E/K': item.persen_dek != null ? Number(item.persen_dek).toFixed(2) + '%' : '',
            'Skor SAW': item.skor_saw != null ? Number(item.skor_saw).toFixed(4) : '',
            'Prediksi SAW': item.predicted_class || '',
            'Status Aktual': item.actual_status ? item.actual_status.replace(/_/g, ' ') : '',
            'Match': item.is_correct ? 'Benar' : 'Salah'
        }));

        const workbook = new kendo.ooxml.Workbook({
            sheets: [
                {
                    name: "Data Evaluasi SAW",
                    columns: [
                        { autoWidth: true },
                        { autoWidth: true },
                        { autoWidth: true },
                        { autoWidth: true },
                        { autoWidth: true },
                        { autoWidth: true },
                        { autoWidth: true },
                        { autoWidth: true },
                        { autoWidth: true },
                        { autoWidth: true }
                    ],
                    rows: [
                        {
                            cells: [
                                {
                                    value: "Evaluasi SAW dengan Data Aktual - Data Lengkap",
                                    bold: true,
                                    fontSize: 16,
                                    color: "#1976D2",
                                    colSpan: 10,
                                    textAlign: "center"
                                }
                            ]
                        },
                        {
                            cells: [
                                {
                                    value: "Exported: " + new Date().toLocaleString('id-ID') + " | Total Data: " + fullData.length,
                                    colSpan: 10,
                                    textAlign: "center",
                                    color: "#666"
                                }
                            ]
                        },
                        { cells: [] },
                        {
                            cells: [
                                { value: "NIM", bold: true, background: "#667eea", color: "#ffffff" },
                                { value: "Nama Mahasiswa", bold: true, background: "#667eea", color: "#ffffff" },
                                { value: "Program Studi", bold: true, background: "#667eea", color: "#ffffff" },
                                { value: "IPK", bold: true, background: "#667eea", color: "#ffffff" },
                                { value: "SKS", bold: true, background: "#667eea", color: "#ffffff" },
                                { value: "% D/E/K", bold: true, background: "#667eea", color: "#ffffff" },
                                { value: "Skor SAW", bold: true, background: "#667eea", color: "#ffffff" },
                                { value: "Prediksi SAW", bold: true, background: "#667eea", color: "#ffffff" },
                                { value: "Status Aktual", bold: true, background: "#667eea", color: "#ffffff" },
                                { value: "Match", bold: true, background: "#667eea", color: "#ffffff" }
                            ]
                        }
                    ].concat(
                        exportData.map((item, index) => ({
                            cells: [
                                { value: item['NIM'], background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['Nama Mahasiswa'], background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['Program Studi'], background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['IPK'], textAlign: "center", background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['SKS'], textAlign: "center", background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['% D/E/K'], textAlign: "center", background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['Skor SAW'], textAlign: "center", background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['Prediksi SAW'], textAlign: "center", background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['Status Aktual'], textAlign: "center", background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" },
                                { value: item['Match'], textAlign: "center", background: index % 2 === 0 ? "#f8f9fa" : "#ffffff" }
                            ]
                        }))
                    )
                }
            ]
        });

        const fileName = "SAW_Evaluasi_Data_Lengkap_" + new Date().toISOString().split('T')[0] + ".xlsx";
        const dataURL = workbook.toDataURL();

        if (typeof kendo.saveAs === 'function') {
            kendo.saveAs({ dataURI: dataURL, fileName: fileName });
        } else {
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            setTimeout(function() {
                document.body.removeChild(link);
            }, 100);
        }

        window.showNotification && window.showNotification('success', 'Berhasil', 'File Excel berhasil diunduh: ' + fileName);
    } catch (error) {
        console.error('❌ Error in exportSAWActualEvaluationResultsCustom:', error);
        exportSAWToCSV(fullData);
    }
}

function exportSAWToCSV(fullData) {
    try {
        const headers = ['NIM', 'Nama Mahasiswa', 'Program Studi', 'IPK', 'SKS', '% D/E/K', 'Skor SAW', 'Prediksi SAW', 'Status Aktual', 'Match'];
        const rows = fullData.map(item => [
            item.nim || '',
            item.nama || '',
            item.program_studi || '',
            item.ipk != null ? Number(item.ipk).toFixed(2) : '',
            item.sks != null ? item.sks : '',
            item.persen_dek != null ? Number(item.persen_dek).toFixed(2) : '',
            item.skor_saw != null ? Number(item.skor_saw).toFixed(4) : '',
            item.predicted_class || '',
            item.actual_status ? item.actual_status.replace(/_/g, ' ') : '',
            item.is_correct ? 'Benar' : 'Salah'
        ]);

        const csvContent = [headers.join(','), ...rows.map(row => row.map(value => `"${value}"`).join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'SAW_Evaluasi_Data_Lengkap_' + new Date().toISOString().split('T')[0] + '.csv';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(function() {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);

        window.showNotification && window.showNotification('success', 'Berhasil', 'File CSV berhasil diunduh');
    } catch (error) {
        console.error('❌ Error exporting CSV:', error);
        window.showNotification && window.showNotification('error', 'Error', 'Gagal mengekspor CSV: ' + error.message);
    }
} 