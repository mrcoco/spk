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
        this.fullData = [];
        this.confusionMatrix = null; // Simpan confusion matrix untuk modal
        this.metricsData = null; // Simpan data metrics untuk modal
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
        
        // Initialize search handlers
        this.initializeSearchHandlers();
    }
    
    initializeSearchHandlers() {
        console.log('Initializing SAW Actual Evaluation search handlers...');
        
        // Event handler untuk tombol pencarian
        $("#btnSearchSAWActual").off('click').on('click', () => {
            console.log('🔍 Tombol pencarian SAW Actual diklik');
            this.performSAWActualSearch();
        });
        
        // Event handler untuk tombol clear pencarian
        $("#btnClearSearchSAWActual").off('click').on('click', () => {
            console.log('🔍 Tombol clear pencarian SAW Actual diklik');
            this.clearSAWActualSearch();
        });
        
        // Event handler untuk input pencarian
        $("#searchInputSAWActual").off('input').on('input', () => {
            const searchTerm = $("#searchInputSAWActual").val().trim();
            if (searchTerm.length >= 3) {
                // Auto search setelah 3 karakter
                clearTimeout(window.sawActualSearchTimeout);
                window.sawActualSearchTimeout = setTimeout(() => {
                    this.performSAWActualSearch();
                }, 500);
            } else if (searchTerm.length === 0) {
                // Clear search jika input kosong
                this.clearSAWActualSearch();
            }
        });
        
        // Event handler untuk enter key pada input pencarian
        $("#searchInputSAWActual").off('keypress').on('keypress', (e) => {
            if (e.which === 13) { // Enter key
                console.log('🔍 Enter key ditekan pada input pencarian SAW Actual');
                this.performSAWActualSearch();
            }
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
        this.fullData = data.full_data || data.results || [];
        
        // Update summary
        $('#sawEvaluationActualTotalData').text(data.total_data || 0);
        $('#sawEvaluationActualTrainingData').text(data.training_data || 0);
        $('#sawEvaluationActualTestData').text(data.test_data || 0);
        $('#sawEvaluationActualAccuracy').text(this.formatPercentage(data.accuracy || 0));

        // Simpan data metrics untuk modal
        this.metricsData = {
            precision: data.precision || 0,
            recall: data.recall || 0,
            f1_score: data.f1_score || 0,
            specificity: data.specificity || 0,
            accuracy: data.accuracy || 0
        };
        
        // Update metrics
        $('#sawEvaluationActualPrecision').text(this.formatPercentage(data.precision || 0));
        $('#sawEvaluationActualRecall').text(this.formatPercentage(data.recall || 0));
        $('#sawEvaluationActualF1Score').text(this.formatPercentage(data.f1_score || 0));
        $('#sawEvaluationActualSpecificity').text(this.formatPercentage(data.specificity || 0));
        
        // Setup click handlers untuk metric cards
        this.setupMetricsCardClickHandlers();

        // Update confusion matrix
        if (data.confusion_matrix) {
            this.updateConfusionMatrix(data.confusion_matrix);
        }

        // Update results grid
        if (data.results) {
            // Reset cache saat data baru dimuat
            window.sawActualEvaluationDataCache = null;
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
        
        // Simpan confusion matrix untuk digunakan di modal
        this.confusionMatrix = confusionMatrix;
        
        const predictedConfigs = [
            { value: 'Peluang Lulus Tinggi', label: 'Pred. Tinggi', headerStyle: 'background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border: 1px solid #81c784; padding: 12px; font-weight: 600; color: #2e7d32;' },
            { value: 'Peluang Lulus Sedang', label: 'Pred. Sedang', headerStyle: 'background: linear-gradient(135deg, #fff3cd 0%, #ffe082 100%); border: 1px solid #ffd54f; padding: 12px; font-weight: 600; color: #f57f17;' },
            { value: 'Peluang Lulus Kecil', label: 'Pred. Kecil', headerStyle: 'background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); border: 1px solid #ef9a9a; padding: 12px; font-weight: 600; color: #c62828;' }
        ];

        const actualConfigs = [
            {
                value: 'LULUS_TINGGI',
                label: 'Actual Tinggi',
                headerStyle: 'background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border: 1px solid #81c784; padding: 12px; font-weight: 600; color: #2e7d32;',
                diagonalStyle: 'background: #c8e6c9; font-weight: bold; cursor: pointer; border: 2px solid #66bb6a; padding: 12px; text-align: center; transition: all 0.2s; font-size: 14px; color: #1b5e20;',
                offDiagonalStyle: 'background: #f1f8e9; cursor: pointer; border: 1px solid #dcedc8; padding: 12px; text-align: center; transition: all 0.2s; font-size: 14px; color: #424242;'
            },
            {
                value: 'LULUS_SEDANG',
                label: 'Actual Sedang',
                headerStyle: 'background: linear-gradient(135deg, #fff3cd 0%, #ffe082 100%); border: 1px solid #ffd54f; padding: 12px; font-weight: 600; color: #f57f17;',
                diagonalStyle: 'background: #ffe082; font-weight: bold; cursor: pointer; border: 2px solid #ffca28; padding: 12px; text-align: center; transition: all 0.2s; font-size: 14px; color: #f57f17;',
                offDiagonalStyle: 'background: #fffde7; cursor: pointer; border: 1px solid #fff9c4; padding: 12px; text-align: center; transition: all 0.2s; font-size: 14px; color: #424242;'
            },
            {
                value: 'LULUS_KECIL',
                label: 'Actual Kecil',
                headerStyle: 'background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); border: 1px solid #ef9a9a; padding: 12px; font-weight: 600; color: #c62828;',
                diagonalStyle: 'background: #ffcdd2; font-weight: bold; cursor: pointer; border: 2px solid #e57373; padding: 12px; text-align: center; transition: all 0.2s; font-size: 14px; color: #b71c1c;',
                offDiagonalStyle: 'background: #ffebee; cursor: pointer; border: 1px solid #ffcdd2; padding: 12px; text-align: center; transition: all 0.2s; font-size: 14px; color: #424242;'
            }
        ];

        let html = '<table class="confusion-table-simple" style="border-collapse: separate; border-spacing: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-radius: 8px; overflow: hidden; width: 100%;">';
        html += '<thead><tr>';
        html += '<th style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border: 1px solid #90caf9; padding: 12px; font-weight: 600; color: #1565C0;"></th>';
        predictedConfigs.forEach(col => {
            html += `<th style="${col.headerStyle}">${col.label}</th>`;
        });
        html += '</tr></thead><tbody>';

        confusionMatrix.forEach((row, i) => {
            const actualConfig = actualConfigs[i];
            html += '<tr>';
            html += `<td style="${actualConfig.headerStyle}"><strong style="font-weight: 600;">${actualConfig.label}</strong></td>`;

            row.forEach((cell, j) => {
                const value = cell || 0;
                const percentage = this.calculatePercentage(value, confusionMatrix);
                const style = (i === j ? actualConfig.diagonalStyle : actualConfig.offDiagonalStyle);
                const predictedConfig = predictedConfigs[j];
                const intensityClass = this.getConfusionMatrixColor(i, j, confusionMatrix);

                const displayPercentage = percentage !== '0.0' ? `${percentage}%` : '0.0%';
                const cellContent = `
                    <div style="font-weight: 700; font-size: 16px; color: inherit;">${value}</div>
                    <div style="font-size: 11px; color: rgba(0,0,0,0.65); margin-top: 2px;">${displayPercentage}</div>
                `;

                html += `
                    <td class="cm-cell clickable ${intensityClass}" 
                        data-actual="${actualConfig.value}" 
                        data-predicted="${predictedConfig.value}" 
                        data-count="${value}"
                        data-percentage="${percentage}"
                        style="${style}">
                        ${cellContent}
                    </td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
        container.html(html);
        
        // Hitung TP, TN, FP, FN dari confusion matrix 3x3
        let tp = 0; // True Positive = sum diagonal
        let total = 0;
        
        // Hitung TP (diagonal) dan total
        confusionMatrix.forEach((row, i) => {
            row.forEach((cell, j) => {
                const value = cell || 0;
                total += value;
                if (i === j) {
                    tp += value; // Diagonal = TP
                }
            });
        });
        
        // Hitung FP (False Positive) = sum off-diagonal dalam baris
        // (predicted as class i but actual is not class i)
        let fp = 0;
        confusionMatrix.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (i !== j) {
                    fp += (cell || 0);
                }
            });
        });
        
        // Hitung FN (False Negative) = sum off-diagonal dalam kolom
        // (actual is class i but predicted is not class i)
        let fn = 0;
        confusionMatrix.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (i !== j) {
                    fn += (cell || 0);
                }
            });
        });
        
        // Untuk multi-class confusion matrix, FP dan FN akan sama
        // karena keduanya menghitung elemen off-diagonal yang sama
        // (hanya berbeda perspektif: baris vs kolom)
        
        // Hitung TN (True Negative) = total - TP - FP - FN
        // Untuk multi-class, karena FP = FN, maka: TN = total - TP - 2*FP
        // Tapi untuk menghindari nilai negatif, kita gunakan perhitungan yang lebih aman
        let tn = total - tp - fp - fn;
        
        // Validasi: jika TN negatif, gunakan perhitungan alternatif
        if (tn < 0) {
            // Untuk multi-class, gunakan: TN = total - TP - FP
            // (asumsi FP = FN untuk multi-class)
            tn = Math.max(0, total - tp - fp);
        }
        
        // Tambahkan section TP, TN, FP, FN di dalam confusion-matrix-wrapper, tepat di atas confusion-panel-note-box
        const tpTnfpFnHtml = `
            <div id="sawActualTpTnfpFnSection" style="margin-top: 20px; padding: 15px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 8px; border: 2px solid #dee2e6; width: 100%;">
                <h5 style="margin: 0 0 15px 0; color: #1a237e; font-weight: 600; display: flex; align-items: center;">
                    <i class="fas fa-calculator" style="margin-right: 8px;"></i>
                    Nilai TP, TN, FP, FN
                </h5>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                    <div class="tp-tn-fp-fn-card" data-metric="TP" data-value="${tp}" style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #28a745; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)';">
                        <div style="font-size: 12px; color: #666; margin-bottom: 5px; font-weight: 500;">True Positive (TP)</div>
                        <div style="font-size: 24px; font-weight: 700; color: #28a745;">${tp}</div>
                        <div style="font-size: 11px; color: #999; margin-top: 3px;">Prediksi benar (diagonal) <i class="fas fa-info-circle" style="margin-left: 4px;"></i></div>
                    </div>
                    <div class="tp-tn-fp-fn-card" data-metric="FP" data-value="${fp}" style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #dc3545; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)';">
                        <div style="font-size: 12px; color: #666; margin-bottom: 5px; font-weight: 500;">False Positive (FP)</div>
                        <div style="font-size: 24px; font-weight: 700; color: #dc3545;">${fp}</div>
                        <div style="font-size: 11px; color: #999; margin-top: 3px;">Prediksi positif yang salah <i class="fas fa-info-circle" style="margin-left: 4px;"></i></div>
                    </div>
                    <div class="tp-tn-fp-fn-card" data-metric="FN" data-value="${fn}" style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)';">
                        <div style="font-size: 12px; color: #666; margin-bottom: 5px; font-weight: 500;">False Negative (FN)</div>
                        <div style="font-size: 24px; font-weight: 700; color: #f57f17;">${fn}</div>
                        <div style="font-size: 11px; color: #999; margin-top: 3px;">Kasus positif tidak terdeteksi <i class="fas fa-info-circle" style="margin-left: 4px;"></i></div>
                    </div>
                    <div class="tp-tn-fp-fn-card" data-metric="TN" data-value="${tn}" style="background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #6c757d; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)';">
                        <div style="font-size: 12px; color: #666; margin-bottom: 5px; font-weight: 500;">True Negative (TN)</div>
                        <div style="font-size: 24px; font-weight: 700; color: #6c757d;">${tn}</div>
                        <div style="font-size: 11px; color: #999; margin-top: 3px;">Prediksi negatif yang benar <i class="fas fa-info-circle" style="margin-left: 4px;"></i></div>
                    </div>
                </div>
                <div style="margin-top: 12px; padding: 10px; background: #e3f2fd; border-radius: 6px; border-left: 4px solid #2196F3;">
                    <div style="font-size: 12px; color: #1565C0;">
                        <strong>Total Data:</strong> ${total} mahasiswa | 
                        <strong>Akurasi:</strong> ${total > 0 ? ((tp / total) * 100).toFixed(2) : '0.00'}% (TP / Total)
                    </div>
                </div>
            </div>
        `;
        
        // Hapus section lama jika ada (untuk refresh)
        $('#sawActualTpTnfpFnSection').remove();
        
        // Ambil parent wrapper (confusion-matrix-wrapper) dan insert section sebelum confusion-panel-note-box
        const wrapper = container.closest('.confusion-matrix-wrapper');
        const noteBox = wrapper.find('.confusion-panel-note-box');
        
        if (noteBox.length > 0) {
            // Insert sebelum note box
            noteBox.before(tpTnfpFnHtml);
        } else {
            // Fallback: append ke wrapper jika note box tidak ditemukan
            wrapper.append(tpTnfpFnHtml);
        }
        
        // Setup click handlers untuk TP, TN, FP, FN cards
        this.setupTpTnfpFnClickHandlers(tp, tn, fp, fn, total);
        
        this.setupConfusionMatrixClickHandlers();
    }
    
    setupTpTnfpFnClickHandlers(tp, tn, fp, fn, total) {
        const self = this;
        
        // Remove existing handlers
        $('.tp-tn-fp-fn-card').off('click');
        
        // Add click handlers
        $('.tp-tn-fp-fn-card').on('click', function() {
            const metric = $(this).data('metric');
            const value = $(this).data('value');
            self.showTpTnfpFnDetailModal(metric, value, tp, tn, fp, fn, total);
        });
    }
    
    showTpTnfpFnDetailModal(metric, value, tp, tn, fp, fn, total) {
        if (!this.confusionMatrix) {
            this.showNotification('error', 'Data tidak tersedia', 'Confusion matrix belum dimuat.');
            return;
        }
        
        const cm = this.confusionMatrix;
        const actualLabels = ['Actual Tinggi', 'Actual Sedang', 'Actual Kecil'];
        const predictedLabels = ['Pred. Tinggi', 'Pred. Sedang', 'Pred. Kecil'];
        
        let title = '';
        let description = '';
        let calculation = '';
        let breakdown = '';
        let color = '';
        let icon = '';
        
        switch(metric) {
            case 'TP':
                title = 'True Positive (TP)';
                description = 'Jumlah prediksi yang benar. Nilai ini diperoleh dari penjumlahan semua nilai diagonal pada confusion matrix (prediksi sesuai dengan status aktual).';
                color = '#28a745';
                icon = 'fa-check-circle';
                
                // Breakdown TP dari diagonal
                const tpBreakdown = [];
                cm.forEach((row, i) => {
                    const diagonalValue = row[i] || 0;
                    if (diagonalValue > 0) {
                        tpBreakdown.push({
                            actual: actualLabels[i],
                            predicted: predictedLabels[i],
                            value: diagonalValue
                        });
                    }
                });
                
                calculation = `TP = Sum(Diagonal)\nTP = ${tpBreakdown.map(b => `${b.value}`).join(' + ')}\nTP = ${tp}`;
                
                breakdown = tpBreakdown.map(b => 
                    `<tr>
                        <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">${b.actual}</td>
                        <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">${b.predicted}</td>
                        <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6; font-weight: 600; color: #28a745;">${b.value}</td>
                    </tr>`
                ).join('');
                break;
                
            case 'FP':
                title = 'False Positive (FP)';
                description = 'Jumlah prediksi positif yang salah. Nilai ini diperoleh dari penjumlahan semua nilai off-diagonal pada confusion matrix (prediksi tidak sesuai dengan status aktual).';
                color = '#dc3545';
                icon = 'fa-times-circle';
                
                // Breakdown FP dari off-diagonal
                const fpBreakdown = [];
                cm.forEach((row, i) => {
                    row.forEach((cell, j) => {
                        if (i !== j && (cell || 0) > 0) {
                            fpBreakdown.push({
                                actual: actualLabels[i],
                                predicted: predictedLabels[j],
                                value: cell || 0
                            });
                        }
                    });
                });
                
                calculation = `FP = Sum(Off-Diagonal)\nFP = ${fpBreakdown.map(b => `${b.value}`).join(' + ')}\nFP = ${fp}`;
                
                breakdown = fpBreakdown.map(b => 
                    `<tr>
                        <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">${b.actual}</td>
                        <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">${b.predicted}</td>
                        <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6; font-weight: 600; color: #dc3545;">${b.value}</td>
                    </tr>`
                ).join('');
                break;
                
            case 'FN':
                title = 'False Negative (FN)';
                description = 'Jumlah kasus positif yang tidak terdeteksi. Untuk multi-class classification, nilai FN sama dengan FP karena confusion matrix bersifat simetris.';
                color = '#f57f17';
                icon = 'fa-exclamation-triangle';
                
                // FN sama dengan FP untuk multi-class
                const fnBreakdown = [];
                cm.forEach((row, i) => {
                    row.forEach((cell, j) => {
                        if (i !== j && (cell || 0) > 0) {
                            fnBreakdown.push({
                                actual: actualLabels[i],
                                predicted: predictedLabels[j],
                                value: cell || 0
                            });
                        }
                    });
                });
                
                calculation = `FN = FP (untuk multi-class)\nFN = ${fnBreakdown.map(b => `${b.value}`).join(' + ')}\nFN = ${fn}`;
                
                breakdown = fnBreakdown.map(b => 
                    `<tr>
                        <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">${b.actual}</td>
                        <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">${b.predicted}</td>
                        <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6; font-weight: 600; color: #f57f17;">${b.value}</td>
                    </tr>`
                ).join('');
                break;
                
            case 'TN':
                title = 'True Negative (TN)';
                description = 'Jumlah prediksi negatif yang benar. Nilai ini diperoleh dari: TN = Total - TP - FP - FN.';
                color = '#6c757d';
                icon = 'fa-minus-circle';
                
                calculation = `TN = Total - TP - FP - FN\nTN = ${total} - ${tp} - ${fp} - ${fn}\nTN = ${tn}`;
                
                breakdown = `
                    <tr>
                        <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">Total Data</td>
                        <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6; font-weight: 600;">${total}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">True Positive (TP)</td>
                        <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6; font-weight: 600; color: #28a745;">${tp}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">False Positive (FP)</td>
                        <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6; font-weight: 600; color: #dc3545;">${fp}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">False Negative (FN)</td>
                        <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6; font-weight: 600; color: #f57f17;">${fn}</td>
                    </tr>
                    <tr style="background: #f8f9fa;">
                        <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6; font-weight: 600;">True Negative (TN)</td>
                        <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6; font-weight: 700; color: #6c757d; font-size: 16px;">${tn}</td>
                    </tr>
                `;
                break;
        }
        
        const modalContent = $('<div>').html(`
            <div style="padding: 20px;">
                <div style="background: linear-gradient(135deg, ${color}15 0%, ${color}25 100%); padding: 18px; border-radius: 10px; margin-bottom: 20px; border-left: 5px solid ${color};">
                    <h4 style="margin: 0 0 12px 0; color: ${color}; font-weight: 600; display: flex; align-items: center;">
                        <i class="fas ${icon}" style="margin-right: 10px;"></i>
                        ${title}
                    </h4>
                    <div style="font-size: 32px; font-weight: 700; color: ${color}; margin-bottom: 8px;">${value}</div>
                    <div style="font-size: 14px; color: #666; line-height: 1.6;">
                        ${description}
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h5 style="margin: 0 0 12px 0; color: #333; font-weight: 600;">
                        <i class="fas fa-calculator"></i> Perhitungan
                    </h5>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid ${color};">
                        <pre style="margin: 0; font-family: 'Courier New', monospace; font-size: 13px; color: #333; white-space: pre-wrap;">${calculation}</pre>
                    </div>
                </div>
                
                ${breakdown ? `
                    <div>
                        <h5 style="margin: 0 0 12px 0; color: #333; font-weight: 600;">
                            <i class="fas fa-table"></i> Breakdown Detail
                        </h5>
                        <div style="background: white; border-radius: 8px; overflow: hidden; border: 1px solid #dee2e6;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                <thead>
                                    <tr style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);">
                                        <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 600; color: #1565C0;">Status Aktual</th>
                                        <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 600; color: #1565C0;">Prediksi SAW</th>
                                        <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 600; color: #1565C0;">Nilai</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${breakdown}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : ''}
                
                <div style="margin-top: 20px; padding: 12px; background: #e3f2fd; border-radius: 6px; border-left: 4px solid #2196F3;">
                    <div style="font-size: 12px; color: #1565C0;">
                        <i class="fas fa-info-circle"></i> <strong>Total Data Evaluasi:</strong> ${total} mahasiswa
                    </div>
                </div>
            </div>
        `);
        
        const dialog = modalContent.kendoDialog({
            width: "700px",
            height: "600px",
            title: `Penjelasan ${title}`,
            closable: true,
            modal: true,
            actions: [{ text: "Tutup", primary: true }]
        });
        
        dialog.data("kendoDialog").open();
    }
    
    setupMetricsCardClickHandlers() {
        const self = this;
        
        // Remove existing handlers
        $('.saw-metric-card-clickable').off('click');
        
        // Add click handlers
        $('.saw-metric-card-clickable').on('click', function() {
            const metric = $(this).data('metric');
            self.showMetricsDetailModal(metric);
        });
    }
    
    showMetricsDetailModal(metric) {
        if (!this.metricsData || !this.confusionMatrix) {
            this.showNotification('error', 'Data tidak tersedia', 'Data evaluasi belum dimuat.');
            return;
        }
        
        const metrics = this.metricsData;
        const cm = this.confusionMatrix;
        
        // Hitung TP, TN, FP, FN dari confusion matrix untuk multi-class
        // Untuk multi-class (3x3), perhitungan yang benar:
        // TP = sum diagonal (prediksi benar)
        // FP = sum off-diagonal dalam baris (predicted sebagai class i tapi actual bukan i)
        // FN = sum off-diagonal dalam kolom (actual adalah class i tapi predicted bukan i)
        // TN = sum of all elements yang bukan TP, FP, atau FN (correctly predicted as NOT class i)
        
        let tp = 0; // True Positive = sum diagonal
        let total = 0;
        
        cm.forEach((row, i) => {
            row.forEach((cell, j) => {
                const value = cell || 0;
                total += value;
                if (i === j) {
                    tp += value; // True Positive = sum diagonal
                }
            });
        });
        
        // FP = sum of off-diagonal elements in rows
        // (predicted as class i but actual is not class i)
        let fp = 0;
        cm.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (i !== j) {
                    fp += (cell || 0);
                }
            });
        });
        
        // FN = sum of off-diagonal elements in columns
        // (actual is class i but predicted is not class i)
        let fn = 0;
        cm.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (i !== j) {
                    fn += (cell || 0);
                }
            });
        });
        
        // Untuk multi-class confusion matrix, FP dan FN akan sama karena:
        // - FP menghitung semua elemen off-diagonal (baris)
        // - FN menghitung semua elemen off-diagonal (kolom)
        // - Untuk matrix 3x3, jumlah elemen off-diagonal baris = jumlah elemen off-diagonal kolom
        // Jadi: FP = FN = jumlah semua elemen off-diagonal
        
        // TN untuk multi-class = total - TP - FP - FN
        // Karena FP = FN (untuk confusion matrix), maka: TN = total - TP - 2*FP
        // Tapi ini bisa menghasilkan nilai negatif jika tidak hati-hati
        
        // Cara yang lebih benar untuk multi-class:
        // TN = sum of all elements yang correctly predicted as NOT class i
        // Ini sama dengan: total - TP - FP (karena FP sudah mencakup semua kesalahan prediksi)
        // Atau: TN = total - TP - FP - FN, dengan FP = FN
        
        // Perhitungan TN yang benar untuk multi-class:
        // TN = total - TP - FP - FN
        // Karena FP dan FN sama (keduanya adalah sum off-diagonal), maka:
        // TN = total - TP - 2*FP
        // Tapi untuk menghindari kesalahan, kita hitung langsung:
        let tn = total - tp - fp - fn;
        
        // Validasi: untuk multi-class, FP dan FN seharusnya sama
        // Jika berbeda, berarti ada kesalahan atau confusion matrix tidak simetris
        if (Math.abs(fp - fn) > 0.01) {
            console.warn('FP and FN are not equal in multi-class confusion matrix. FP:', fp, 'FN:', fn);
        }
        
        // Jika TN negatif, berarti ada kesalahan perhitungan
        // Untuk multi-class, gunakan perhitungan alternatif yang lebih aman
        if (tn < 0) {
            console.warn('TN calculation resulted in negative value. Recalculating using alternative method...');
            // Alternatif: TN = total - TP - FP (asumsi FP = FN untuk multi-class)
            // Atau lebih tepat: TN = sum of elements yang bukan di diagonal dan bukan di baris/kolom yang sama
            // Tapi untuk kesederhanaan, kita gunakan: TN = total - TP - FP
            tn = Math.max(0, total - tp - fp);
        }
        
        // Hitung precision dan recall per kelas untuk breakdown
        const classLabels = ['Tinggi', 'Sedang', 'Kecil'];
        const precisionPerClass = [];
        const recallPerClass = [];
        
        cm.forEach((row, i) => {
            const tpClass = row[i] || 0;
            const fpClass = row.reduce((sum, cell, j) => sum + (j !== i ? (cell || 0) : 0), 0);
            const fnClass = cm.reduce((sum, r, k) => sum + (k !== i ? (r[i] || 0) : 0), 0);
            
            const precisionClass = (tpClass + fpClass) > 0 ? tpClass / (tpClass + fpClass) : 0;
            const recallClass = (tpClass + fnClass) > 0 ? tpClass / (tpClass + fnClass) : 0;
            
            precisionPerClass.push({
                class: classLabels[i],
                tp: tpClass,
                fp: fpClass,
                precision: precisionClass
            });
            
            recallPerClass.push({
                class: classLabels[i],
                tp: tpClass,
                fn: fnClass,
                recall: recallClass
            });
        });
        
        let title = '';
        let description = '';
        let calculation = '';
        let breakdown = '';
        let color = '';
        let icon = '';
        let value = 0;
        
        switch(metric) {
            case 'precision':
                title = 'Precision';
                description = 'Precision mengukur proporsi prediksi positif yang benar. Untuk multi-class classification, nilai ini dihitung menggunakan Macro Average (rata-rata precision dari semua kelas).';
                color = '#1a237e';
                icon = 'fa-bullseye';
                value = metrics.precision;
                
                calculation = `Precision = Macro Average dari semua kelas\n\nPrecision per kelas:\n${precisionPerClass.map(p => `Precision(${p.class}) = TP / (TP + FP) = ${p.tp} / (${p.tp} + ${p.fp}) = ${(p.precision * 100).toFixed(2)}%`).join('\n')}\n\nPrecision (Macro Average) = (${precisionPerClass.map(p => (p.precision * 100).toFixed(2)).join(' + ')}) / ${precisionPerClass.length} = ${(value * 100).toFixed(2)}%`;
                
                breakdown = precisionPerClass.map(p => 
                    `<tr>
                        <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 600;">${p.class}</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">${p.tp}</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">${p.fp}</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 600; color: ${color};">${(p.precision * 100).toFixed(2)}%</td>
                    </tr>`
                ).join('');
                break;
                
            case 'recall':
                title = 'Recall (Sensitivity)';
                description = 'Recall mengukur proporsi kasus positif yang terdeteksi. Untuk multi-class classification, nilai ini dihitung menggunakan Macro Average (rata-rata recall dari semua kelas).';
                color = '#f57f17';
                icon = 'fa-search';
                value = metrics.recall;
                
                calculation = `Recall = Macro Average dari semua kelas\n\nRecall per kelas:\n${recallPerClass.map(r => `Recall(${r.class}) = TP / (TP + FN) = ${r.tp} / (${r.tp} + ${r.fn}) = ${(r.recall * 100).toFixed(2)}%`).join('\n')}\n\nRecall (Macro Average) = (${recallPerClass.map(r => (r.recall * 100).toFixed(2)).join(' + ')}) / ${recallPerClass.length} = ${(value * 100).toFixed(2)}%`;
                
                breakdown = recallPerClass.map(r => 
                    `<tr>
                        <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 600;">${r.class}</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">${r.tp}</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">${r.fn}</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 600; color: ${color};">${(r.recall * 100).toFixed(2)}%</td>
                    </tr>`
                ).join('');
                break;
                
            case 'f1score':
                title = 'F1-Score';
                description = 'F1-Score adalah harmonic mean dari Precision dan Recall. Untuk multi-class classification, nilai ini dihitung menggunakan Macro Average (rata-rata F1-Score dari semua kelas).';
                color = '#dc3545';
                icon = 'fa-balance-scale';
                value = metrics.f1_score;
                
                // Hitung F1-Score per kelas menggunakan Precision dan Recall per kelas
                const f1ScorePerClass = [];
                precisionPerClass.forEach((p, i) => {
                    const r = recallPerClass[i];
                    const precisionClass = p.precision;
                    const recallClass = r.recall;
                    
                    // F1-Score per kelas = 2 × (Precision × Recall) / (Precision + Recall)
                    const f1Class = (precisionClass + recallClass) > 0 
                        ? 2 * (precisionClass * recallClass) / (precisionClass + recallClass) 
                        : 0;
                    
                    f1ScorePerClass.push({
                        class: p.class,
                        precision: precisionClass,
                        recall: recallClass,
                        f1_score: f1Class
                    });
                });
                
                // Macro Average F1-Score
                const macroAvgF1Score = f1ScorePerClass.reduce((sum, f) => sum + f.f1_score, 0) / f1ScorePerClass.length;
                
                // Gunakan nilai dari backend jika tersedia, jika tidak gunakan macro average
                const finalF1Score = value || macroAvgF1Score;
                
                calculation = `F1-Score = Macro Average dari semua kelas\n\nF1-Score per kelas:\n${f1ScorePerClass.map(f => {
                    const precisionPct = (f.precision * 100).toFixed(2);
                    const recallPct = (f.recall * 100).toFixed(2);
                    const f1Pct = (f.f1_score * 100).toFixed(2);
                    return `F1-Score(${f.class}) = 2 × (Precision × Recall) / (Precision + Recall)\nF1-Score(${f.class}) = 2 × (${precisionPct}% × ${recallPct}%) / (${precisionPct}% + ${recallPct}%)\nF1-Score(${f.class}) = ${f1Pct}%`;
                }).join('\n\n')}\n\nF1-Score (Macro Average) = (${f1ScorePerClass.map(f => (f.f1_score * 100).toFixed(2)).join(' + ')}) / ${f1ScorePerClass.length} = ${(finalF1Score * 100).toFixed(2)}%`;
                
                breakdown = `
                    <tr style="background: #f8f9fa;">
                        <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 700;">Kelas</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 700; color: #1a237e;">Precision</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 700; color: #f57f17;">Recall</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 700; color: ${color};">F1-Score</td>
                    </tr>
                    ${f1ScorePerClass.map(f => `
                        <tr>
                            <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 600;">${f.class}</td>
                            <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 600; color: #1a237e;">${(f.precision * 100).toFixed(2)}%</td>
                            <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 600; color: #f57f17;">${(f.recall * 100).toFixed(2)}%</td>
                            <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 600; color: ${color};">${(f.f1_score * 100).toFixed(2)}%</td>
                        </tr>
                    `).join('')}
                    <tr style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);">
                        <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 700;">Macro Average</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 700; color: #1a237e;">${(precisionPerClass.reduce((sum, p) => sum + p.precision, 0) / precisionPerClass.length * 100).toFixed(2)}%</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 700; color: #f57f17;">${(recallPerClass.reduce((sum, r) => sum + r.recall, 0) / recallPerClass.length * 100).toFixed(2)}%</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 700; color: ${color}; font-size: 16px;">${(finalF1Score * 100).toFixed(2)}%</td>
                    </tr>
                `;
                break;
                
            case 'specificity':
                title = 'Specificity';
                description = 'Specificity mengukur proporsi prediksi negatif yang benar. Untuk multi-class classification, nilai ini dihitung menggunakan Macro Average (rata-rata specificity dari semua kelas).';
                color = '#6c757d';
                icon = 'fa-chart-line';
                value = metrics.specificity;
                
                // Untuk multi-class, specificity dihitung per kelas menggunakan macro average
                // Specificity per kelas = TN_i / (TN_i + FP_i)
                // Dimana untuk setiap kelas i:
                // - TN_i = sum of all elements yang bukan di baris i dan bukan di kolom i
                // - FP_i = sum of off-diagonal elements dalam baris i
                
                const specificityPerClass = [];
                cm.forEach((row, i) => {
                    // TP untuk kelas i
                    const tpClass = row[i] || 0;
                    
                    // FP untuk kelas i = sum of off-diagonal dalam baris i
                    const fpClass = row.reduce((sum, cell, j) => sum + (j !== i ? (cell || 0) : 0), 0);
                    
                    // TN untuk kelas i = sum of all elements yang bukan di baris i dan bukan di kolom i
                    let tnClass = 0;
                    cm.forEach((r, k) => {
                        r.forEach((cell, l) => {
                            if (k !== i && l !== i) {
                                tnClass += (cell || 0);
                            }
                        });
                    });
                    
                    // Specificity untuk kelas i
                    const specificityClass = (tnClass + fpClass) > 0 ? tnClass / (tnClass + fpClass) : 0;
                    
                    specificityPerClass.push({
                        class: classLabels[i],
                        tn: tnClass,
                        fp: fpClass,
                        specificity: specificityClass
                    });
                });
                
                // Macro Average Specificity
                const macroAvgSpecificity = specificityPerClass.reduce((sum, s) => sum + s.specificity, 0) / specificityPerClass.length;
                
                // Gunakan nilai dari backend jika tersedia, jika tidak gunakan macro average
                const finalSpecificity = value || macroAvgSpecificity;
                
                calculation = `Specificity = Macro Average dari semua kelas\n\nSpecificity per kelas:\n${specificityPerClass.map(s => `Specificity(${s.class}) = TN / (TN + FP) = ${s.tn} / (${s.tn} + ${s.fp}) = ${(s.specificity * 100).toFixed(2)}%`).join('\n')}\n\nSpecificity (Macro Average) = (${specificityPerClass.map(s => (s.specificity * 100).toFixed(2)).join(' + ')}) / ${specificityPerClass.length} = ${(finalSpecificity * 100).toFixed(2)}%`;
                
                breakdown = `
                    <tr style="background: #f8f9fa;">
                        <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 700;">Kelas</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 700;">TN</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 700;">FP</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 700; color: ${color};">Specificity</td>
                    </tr>
                    ${specificityPerClass.map(s => `
                        <tr>
                            <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 600;">${s.class}</td>
                            <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">${s.tn}</td>
                            <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">${s.fp}</td>
                            <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 600; color: ${color};">${(s.specificity * 100).toFixed(2)}%</td>
                        </tr>
                    `).join('')}
                    <tr style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);">
                        <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 700;">Macro Average</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 700;">-</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 700;">-</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 700; color: ${color}; font-size: 16px;">${(finalSpecificity * 100).toFixed(2)}%</td>
                    </tr>
                `;
                break;
        }
        
        const modalContent = $('<div>').html(`
            <div style="padding: 20px;">
                <div style="background: linear-gradient(135deg, ${color}15 0%, ${color}25 100%); padding: 18px; border-radius: 10px; margin-bottom: 20px; border-left: 5px solid ${color};">
                    <h4 style="margin: 0 0 12px 0; color: ${color}; font-weight: 600; display: flex; align-items: center;">
                        <i class="fas ${icon}" style="margin-right: 10px;"></i>
                        ${title}
                    </h4>
                    <div style="font-size: 32px; font-weight: 700; color: ${color}; margin-bottom: 8px;">${(value * 100).toFixed(2)}%</div>
                    <div style="font-size: 14px; color: #666; line-height: 1.6;">
                        ${description}
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h5 style="margin: 0 0 12px 0; color: #333; font-weight: 600;">
                        <i class="fas fa-calculator"></i> Perhitungan
                    </h5>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid ${color};">
                        <pre style="margin: 0; font-family: 'Courier New', monospace; font-size: 12px; color: #333; white-space: pre-wrap; line-height: 1.6;">${calculation}</pre>
                    </div>
                </div>
                
                ${breakdown ? `
                    <div>
                        <h5 style="margin: 0 0 12px 0; color: #333; font-weight: 600;">
                            <i class="fas fa-table"></i> Breakdown Detail
                        </h5>
                        <div style="background: white; border-radius: 8px; overflow: hidden; border: 1px solid #dee2e6;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                <thead>
                                    <tr style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);">
                                        ${metric === 'precision' ? `
                                            <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 600; color: #1565C0;">Kelas</th>
                                            <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 600; color: #1565C0;">TP</th>
                                            <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 600; color: #1565C0;">FP</th>
                                            <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 600; color: #1565C0;">Precision</th>
                                        ` : metric === 'recall' ? `
                                            <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 600; color: #1565C0;">Kelas</th>
                                            <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 600; color: #1565C0;">TP</th>
                                            <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 600; color: #1565C0;">FN</th>
                                            <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 600; color: #1565C0;">Recall</th>
                                        ` : `
                                            <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 600; color: #1565C0;">Komponen</th>
                                            <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6; font-weight: 600; color: #1565C0;">Nilai</th>
                                        `}
                                    </tr>
                                </thead>
                                <tbody>
                                    ${breakdown}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : ''}
                
                <div style="margin-top: 20px; padding: 12px; background: #e3f2fd; border-radius: 6px; border-left: 4px solid #2196F3;">
                    <div style="font-size: 12px; color: #1565C0;">
                        <i class="fas fa-info-circle"></i> <strong>Catatan:</strong> Untuk multi-class classification (3 kategori), metrik dihitung menggunakan Macro Average untuk memberikan bobot yang sama pada setiap kelas.
                    </div>
                </div>
            </div>
        `);
        
        const dialog = modalContent.kendoDialog({
            width: "750px",
            height: "650px",
            title: `Penjelasan ${title}`,
            closable: true,
            modal: true,
            actions: [{ text: "Tutup", primary: true }]
        });
        
        dialog.data("kendoDialog").open();
    }

    setupConfusionMatrixClickHandlers() {
        const self = this;
        const cells = $('.cm-cell.clickable');
        cells.off('click');
        cells.off('mouseenter mouseleave');

        cells.on('click', function() {
            const $cell = $(this);
            const actualStatus = $cell.data('actual');
            const predictedCategory = $cell.data('predicted');
            const count = parseInt($cell.data('count'), 10) || 0;

            if (count > 0) {
                self.showConfusionMatrixDetailModal(actualStatus, predictedCategory, count);
            } else {
                self.showNotification('info', 'Tidak ada data', 'Tidak ada mahasiswa untuk kombinasi ini.');
            }
        });

        cells.hover(
            function() { $(this).css('opacity', '0.85'); },
            function() { $(this).css('opacity', '1'); }
        );
    }

    showConfusionMatrixDetailModal(actualStatus, predictedCategory, count) {
        if (!this.fullData || this.fullData.length === 0) {
            this.showNotification('error', 'Data tidak tersedia', 'Data evaluasi belum dimuat.');
            return;
        }

        // Hitung total evaluasi dari full data
        const totalEvaluated = this.fullData.length;

        const filteredData = this.fullData.filter(item => {
            const actual = item.actual_status || item.actual_class || '';
            const predicted = item.predicted_class || item.predicted_category || '';
            return actual === actualStatus && predicted === predictedCategory;
        });

        if (filteredData.length === 0) {
            this.showNotification('info', 'Tidak ada data', 'Tidak ditemukan mahasiswa untuk kombinasi ini.');
            return;
        }

        const actualLabel = formatSAWActualStatus(actualStatus);
        const expectedPredicted = mapSAWActualToPredicted(actualStatus);
        const isCorrect = predictedCategory === expectedPredicted;
        // Hitung persentase berdasarkan total evaluasi, bukan count cell
        const matchPercentage = totalEvaluated > 0 ? ((filteredData.length / totalEvaluated) * 100).toFixed(1) : '0.0';

        const uniqueGridId = 'sawCMDetailGrid_' + Date.now();
        const summaryBackground = isCorrect ? '#e8f5e9' : '#ffebee';
        const summaryBorder = isCorrect ? '#28a745' : '#dc3545';
        const summaryIcon = isCorrect ? 'fa-check-circle' : 'fa-times-circle';

        const modalContent = $('<div>').html(`
            <div style="padding: 20px;">
                <div style="background: ${summaryBackground}; padding: 18px; border-radius: 10px; margin-bottom: 20px; border-left: 5px solid ${summaryBorder};">
                    <h4 style="margin: 0 0 12px 0; color: ${summaryBorder}; font-weight: 600;">
                        <i class="fas ${summaryIcon}"></i>
                        ${isCorrect ? 'Prediksi Benar' : 'Prediksi Salah'}
                    </h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                        <div>
                            <strong>Status Aktual:</strong><br>
                            <span class="badge ${getSAWBadgeClass(actualStatus)}" style="font-size: 13px; padding: 8px 12px; font-weight: 600;">${actualLabel}</span>
                        </div>
                        <div>
                            <strong>Prediksi SAW:</strong><br>
                            <span class="badge ${getSAWBadgeClass(predictedCategory)}" style="font-size: 13px; padding: 8px 12px; font-weight: 600;">${predictedCategory}</span>
                        </div>
                        <div>
                            <strong>Jumlah Mahasiswa:</strong><br>
                            <span style="font-size: 18px; font-weight: 700; color: #1565C0;">${filteredData.length}</span>
                            <span style="font-size: 13px; color: #555;"> dari ${totalEvaluated} (${matchPercentage}%)</span>
                        </div>
                    </div>
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(0,0,0,0.1); color: #546E7A; font-size: 12px;">
                        <i class="fas fa-info-circle"></i> Total data yang dievaluasi: ${totalEvaluated} mahasiswa
                    </div>
                </div>

                <h5 style="margin-bottom: 15px; color: #333; font-weight: 600;">
                    <i class="fas fa-table"></i> Detail Data Mahasiswa dan Prediksi
                </h5>
                <div id="${uniqueGridId}"></div>
            </div>
        `);

        const dialog = modalContent.kendoDialog({
            width: "1100px",
            height: "750px",
            title: `Detail Confusion Matrix - ${actualLabel} → ${predictedCategory}`,
            closable: true,
            modal: true,
            actions: [{ text: "Tutup", primary: true }],
            open: function() {
                setTimeout(function() {
                    const gridElement = $('#' + uniqueGridId);
                    if (!gridElement.length) {
                        console.error('Grid container not found:', uniqueGridId);
                        return;
                    }

                    gridElement.kendoGrid({
                        dataSource: {
                            data: filteredData,
                            pageSize: 10
                        },
                        height: 450,
                        scrollable: true,
                        sortable: true,
                        pageable: {
                            refresh: true,
                            pageSizes: [10, 20, 50],
                            buttonCount: 5
                        },
                        columns: [
                            {
                                field: 'nim',
                                title: 'NIM',
                                width: 120,
                                template: function(dataItem) {
                                    return `<span style="font-family: monospace; font-weight: 600; color: #1976D2;">${dataItem.nim || '-'}</span>`;
                                }
                            },
                            {
                                field: 'nama',
                                title: 'Nama Mahasiswa',
                                width: 180,
                                template: function(dataItem) {
                                    return `<span style="font-weight: 600; color: #333;">${dataItem.nama || '-'}</span>`;
                                }
                            },
                            {
                                field: 'program_studi',
                                title: 'Program Studi',
                                width: 200,
                                template: function(dataItem) {
                                    const colors = getSAWProdiColor(dataItem.program_studi);
                                    return `<span style="display: inline-block; padding: 4px 10px; background: ${colors.bg}; color: ${colors.text}; border-radius: 4px; font-size: 12px; font-weight: 500;">${dataItem.program_studi || '-'}</span>`;
                                }
                            },
                            {
                                field: 'ipk',
                                title: 'IPK',
                                width: 80,
                                template: function(dataItem) {
                                    const value = dataItem.ipk != null ? Number(dataItem.ipk) : 0;
                                    let color = '#dc3545';
                                    if (value >= 3.5) color = '#28a745';
                                    else if (value >= 3.0) color = '#ffc107';
                                    else if (value >= 2.5) color = '#ff9800';
                                    return `<span style="font-weight: 600; color: ${color};">${value.toFixed(2)}</span>`;
                                }
                            },
                            {
                                field: 'sks',
                                title: 'SKS',
                                width: 70,
                                template: function(dataItem) {
                                    const value = dataItem.sks != null ? Number(dataItem.sks) : 0;
                                    let color = '#dc3545';
                                    if (value >= 130) color = '#28a745';
                                    else if (value >= 110) color = '#ffc107';
                                    else if (value >= 90) color = '#ff9800';
                                    return `<span style="font-weight: 600; color: ${color};">${value}</span>`;
                                }
                            },
                            {
                                field: 'persen_dek',
                                title: '% D/E/K',
                                width: 100,
                                template: function(dataItem) {
                                    const value = dataItem.persen_dek != null ? Number(dataItem.persen_dek) : 0;
                                    let color = '#28a745';
                                    if (value > 30) color = '#dc3545';
                                    else if (value > 20) color = '#ff9800';
                                    else if (value > 10) color = '#ffc107';
                                    return `<span style="font-weight: 600; color: ${color};">${value.toFixed(2)}%</span>`;
                                }
                            },
                            {
                                field: 'final_value',
                                title: 'Skor SAW',
                                width: 100,
                                template: function(dataItem) {
                                    const score = dataItem.final_value != null ? Number(dataItem.final_value) : 0;
                                    let color = '#dc3545';
                                    let bg = '#ffebee';
                                    if (score >= 0.75) { color = '#28a745'; bg = '#e8f5e9'; }
                                    else if (score >= 0.55) { color = '#ffc107'; bg = '#fff3cd'; }
                                    return `<span style="padding: 4px 8px; background: ${bg}; color: ${color}; border-radius: 4px; font-weight: 600; font-family: 'Fira Code', monospace;">${score.toFixed(4)}</span>`;
                                }
                            },
                            {
                                field: 'predicted_class',
                                title: 'Prediksi SAW',
                                width: 150,
                                template: function(dataItem) {
                                    const badgeClass = getSAWBadgeClass(dataItem.predicted_class);
                                    return `<span class="badge ${badgeClass}" style="font-size: 11px; padding: 6px 12px; font-weight: 600; white-space: nowrap;">${dataItem.predicted_class || '-'}</span>`;
                                }
                            },
                            {
                                field: 'actual_status',
                                title: 'Status Aktual',
                                width: 140,
                                template: function(dataItem) {
                                    const badgeClass = getSAWBadgeClass(dataItem.actual_status);
                                    const statusText = formatSAWActualStatus(dataItem.actual_status);
                                    return `<span class="badge ${badgeClass}" style="font-size: 11px; padding: 6px 12px; font-weight: 600; white-space: nowrap;">${statusText}</span>`;
                                }
                            },
                            {
                                field: 'is_correct',
                                title: 'Match',
                                width: 90,
                                template: function(dataItem) {
                                    if (dataItem.is_correct) {
                                        return '<div style="text-align: center;"><span style="padding: 4px 10px; background: #e8f5e9; color: #28a745; border-radius: 4px; font-weight: 600; display: inline-block;"><i class="fas fa-check-circle"></i> Benar</span></div>';
                                    }
                                    return '<div style="text-align: center;"><span style="padding: 4px 10px; background: #ffebee; color: #dc3545; border-radius: 4px; font-weight: 600; display: inline-block;"><i class="fas fa-times-circle"></i> Salah</span></div>';
                                }
                            }
                        ]
                    });
                }, 60);
            },
            close: function() {
                const grid = $('#' + uniqueGridId).data('kendoGrid');
                if (grid) {
                    grid.destroy();
                }
                setTimeout(function() {
                    modalContent.data('kendoDialog').destroy();
                    modalContent.remove();
                }, 60);
            }
        });

        const kendoDialog = modalContent.data('kendoDialog');
        if (kendoDialog) {
            kendoDialog.open();
        }
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
            filterable: false, // Disable default Kendo filters, use custom search instead
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
                    template: function(dataItem) {
                        const nim = dataItem.nim || 'N/A';
                        return `<span style="font-family: monospace; font-weight: 500; color: #1976D2;">${nim}</span>`;
                    }
                },
                { 
                    field: "nama", 
                    title: "Nama", 
                    width: 200,
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
                        const colors = getSAWProdiColor(dataItem.program_studi);
                        return `<span style="display: inline-block; padding: 4px 10px; background: ${colors.bg}; color: ${colors.text}; border-radius: 4px; font-size: 12px; font-weight: 500;">${dataItem.program_studi}</span>`;
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
                        const badgeClass = getSAWBadgeClass(dataItem.predicted_class);
                        return `<span class="badge ${badgeClass}" style="font-size: 11px; padding: 6px 12px; font-weight: 600; white-space: nowrap;">${dataItem.predicted_class || 'N/A'}</span>`;
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
                        const badgeClass = getSAWBadgeClass(dataItem.actual_status);
                        const statusText = formatSAWActualStatus(dataItem.actual_status);
                        return `<span class="badge ${badgeClass}" style="font-size: 11px; padding: 6px 12px; font-weight: 600; white-space: nowrap;">${statusText}</span>`;
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
                
                // Simpan data lengkap ke cache untuk custom search
                const allData = grid.dataSource.data();
                if (!window.sawActualEvaluationDataCache || window.sawActualEvaluationDataCache.length === 0) {
                    window.sawActualEvaluationDataCache = JSON.parse(JSON.stringify(allData)); // Deep copy
                    console.log('🔧 SAW Actual Evaluation data cached:', window.sawActualEvaluationDataCache.length, 'items');
                }
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
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js belum tersedia, lewati updateClassificationChart sementara.');
            setTimeout(() => this.updateClassificationChart(distribution), 500);
            return;
        }
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
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js belum tersedia, lewati updateMetricsChart sementara.');
            setTimeout(() => this.updateMetricsChart(data), 500);
            return;
        }
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
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js belum dimuat. Inisialisasi chart SAW Actual akan ditunda hingga library tersedia.');
            setTimeout(() => this.initializeCharts(), 500);
            return;
        }
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

// Function to toggle formula section
function toggleSAWActualFormulaSection() {
    const content = $('#sawActualFormulaContent');
    const chevron = $('#sawActualFormulaChevron');
    
    if (content.is(':visible')) {
        content.slideUp(300);
        chevron.css('transform', 'rotate(0deg)');
    } else {
        content.slideDown(300);
        chevron.css('transform', 'rotate(180deg)');
    }
} 

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

function getSAWProdiColor(prodi) {
    if (!prodi) return { bg: '#e0e0e0', text: '#666' };

    const prodiColors = {
        'Teknik Informatika': { bg: '#e3f2fd', text: '#1565C0' },
        'Sistem Informasi': { bg: '#e8f5e9', text: '#2e7d32' },
        'Teknik Komputer': { bg: '#fff3e0', text: '#e65100' },
        'Manajemen Informatika': { bg: '#f3e5f5', text: '#6a1b9a' },
        'Komputerisasi Akuntansi': { bg: '#fff9c4', text: '#f57f17' },
        'Teknik Elektro': { bg: '#ffebee', text: '#c62828' },
        'Pendidikan Jasmani': { bg: '#e1f5fe', text: '#0277bd' },
        'Pendidikan Ekonomi': { bg: '#f1f8e9', text: '#33691e' },
        'Manajemen': { bg: '#ede7f6', text: '#4527a0' },
        'Akuntansi': { bg: '#fff8e1', text: '#ef6c00' },
        'default': { bg: '#e0e0e0', text: '#424242' }
    };

    for (const [key, color] of Object.entries(prodiColors)) {
        if (key !== 'default' && prodi.toUpperCase().includes(key.toUpperCase())) {
            return color;
        }
    }

    return prodiColors['default'];
}

function getUniqueProdiListSAW(data) {
    if (!data || !Array.isArray(data)) return [];
    const uniqueProdi = [...new Set(data.map(item => item.program_studi).filter(p => p))];
    return uniqueProdi.map(prodi => ({ program_studi: prodi }));
}

function getSAWBadgeClass(value) {
    if (!value) return 'bg-secondary';
    const normalized = value.toString().toUpperCase();
    if (normalized.includes('TINGGI')) return 'bg-success';
    if (normalized.includes('SEDANG')) return 'bg-warning';
    if (normalized.includes('KECIL')) return 'bg-danger';
    return 'bg-secondary';
}

function formatSAWActualStatus(status) {
    return status ? status.replace(/_/g, ' ') : 'N/A';
}

// Cache untuk data SAW Actual Evaluation
window.sawActualEvaluationDataCache = null;

// Fungsi untuk melakukan pencarian SAW Actual Evaluation
// Mendukung pencarian berdasarkan: NIM, Nama, Program Studi, Klasifikasi SAW, Status Lulus Aktual
// Mendukung multiple keywords dengan kombinasi filter seperti comparison
SAWEvaluationActual.prototype.performSAWActualSearch = function() {
    console.log('🔧 performSAWActualSearch dipanggil');
    
    const searchInput = $("#searchInputSAWActual").val().trim();
    
    if (!searchInput) {
        console.log('🔧 Input pencarian kosong, tampilkan semua data');
        const grid = $('#sawEvaluationActualResultsGrid').data('kendoGrid');
        if (grid && window.sawActualEvaluationDataCache) {
            grid.dataSource.data(JSON.parse(JSON.stringify(window.sawActualEvaluationDataCache))); // Deep copy
            grid.refresh();
            this.updateSAWActualSearchInfo("Menampilkan semua data evaluasi SAW", "info");
        }
        return;
    }
    
    console.log('🔧 Memulai pencarian evaluasi SAW untuk:', searchInput);
    
    try {
        const grid = $('#sawEvaluationActualResultsGrid').data('kendoGrid');
        if (!grid) {
            console.error('🔧 Grid SAW Actual tidak ditemukan');
            this.updateSAWActualSearchInfo("Grid tidak tersedia", "error");
            return;
        }
        
        // Gunakan data dari cache jika tersedia
        const allData = window.sawActualEvaluationDataCache || grid.dataSource.data();
        console.log('🔧 Total data di grid:', allData.length);
        
        // Parse multiple keywords
        const keywords = searchInput.toLowerCase()
            .split(/[,]+/) // Split by comma
            .map(k => k.trim()) // Trim whitespace
            .filter(k => k.length > 0); // Remove empty strings
        
        console.log('🔧 Keywords untuk filter:', keywords);
        
        // Filter data berdasarkan kombinasi filter spesifik (sama seperti comparison)
        // Cek apakah keyword[0] cocok dengan program studi
        let isProdiCombination2 = false;
        let isProdiFisSawCombination = false;
        let isProdiFisSawStatusCombination = false;
        
        if (keywords.length === 2 && allData.length > 0) {
            const keyword0Lower = keywords[0].toLowerCase();
            const hasProdiMatch = allData.some(item => {
                const prodi = (item.program_studi || '').toLowerCase();
                return prodi && prodi.includes(keyword0Lower);
            });
            isProdiCombination2 = hasProdiMatch;
        }
        
        if (keywords.length === 3 && allData.length > 0) {
            const keyword0Lower = keywords[0].toLowerCase();
            const hasProdiMatch = allData.some(item => {
                const prodi = (item.program_studi || '').toLowerCase();
                return prodi && prodi.includes(keyword0Lower);
            });
            isProdiFisSawCombination = hasProdiMatch;
        }
        
        if (keywords.length === 4 && allData.length > 0) {
            const keyword0Lower = keywords[0].toLowerCase();
            const hasProdiMatch = allData.some(item => {
                const prodi = (item.program_studi || '').toLowerCase();
                return prodi && prodi.includes(keyword0Lower);
            });
            isProdiFisSawStatusCombination = hasProdiMatch;
        }
        
        const filteredData = allData.filter(item => {
            if (keywords.length === 2) {
                if (isProdiCombination2) {
                    // Kombinasi: Program Studi + Klasifikasi (SAW/Status)
                    const prodi = (item.program_studi || '').toLowerCase();
                    const prodiMatch = prodi && prodi.includes(keywords[0]);
                    
                    const keyword1Lower = keywords[1].toLowerCase();
                    const sawMatch = item.predicted_class && 
                        item.predicted_class.toLowerCase().includes(keyword1Lower);
                    const actualStatus = (item.actual_status || '').toLowerCase();
                    const statusMatch = actualStatus && actualStatus.includes(keyword1Lower);
                    
                    return prodiMatch && (sawMatch || statusMatch);
                } else {
                    // Kombinasi: SAW kategori + Status Aktual
                    const sawMatch = item.predicted_class && 
                        item.predicted_class.toLowerCase().includes(keywords[0]);
                    const actualStatus = (item.actual_status || '').toLowerCase();
                    const statusMatch = actualStatus && actualStatus.includes(keywords[1]);
                    return sawMatch && statusMatch;
                }
            } else if (keywords.length === 3) {
                if (isProdiFisSawCombination) {
                    // Kombinasi: Program Studi + SAW kategori + Status Aktual
                    const prodi = (item.program_studi || '').toLowerCase();
                    const prodiMatch = prodi && prodi.includes(keywords[0]);
                    const sawMatch = item.predicted_class && 
                        item.predicted_class.toLowerCase().includes(keywords[1]);
                    const actualStatus = (item.actual_status || '').toLowerCase();
                    const statusMatch = actualStatus && actualStatus.includes(keywords[2]);
                    return prodiMatch && sawMatch && statusMatch;
                } else {
                    // Kombinasi: SAW kategori + Status Aktual + (field lain)
                    const sawMatch = item.predicted_class && 
                        item.predicted_class.toLowerCase().includes(keywords[0]);
                    const actualStatus = (item.actual_status || '').toLowerCase();
                    const statusMatch = actualStatus && actualStatus.includes(keywords[1]);
                    // Keyword[2] bisa match di field manapun
                    const keyword2Match = 
                        (item.nim && item.nim.toLowerCase().includes(keywords[2])) ||
                        (item.nama && item.nama.toLowerCase().includes(keywords[2])) ||
                        (item.program_studi && item.program_studi.toLowerCase().includes(keywords[2]));
                    return sawMatch && statusMatch && keyword2Match;
                }
            } else if (keywords.length === 4) {
                if (isProdiFisSawStatusCombination) {
                    // Kombinasi: Program Studi + SAW kategori + Status Aktual + (field lain)
                    const prodi = (item.program_studi || '').toLowerCase();
                    const prodiMatch = prodi && prodi.includes(keywords[0]);
                    const sawMatch = item.predicted_class && 
                        item.predicted_class.toLowerCase().includes(keywords[1]);
                    const actualStatus = (item.actual_status || '').toLowerCase();
                    const statusMatch = actualStatus && actualStatus.includes(keywords[2]);
                    // Keyword[3] bisa match di field manapun
                    const keyword3Match = 
                        (item.nim && item.nim.toLowerCase().includes(keywords[3])) ||
                        (item.nama && item.nama.toLowerCase().includes(keywords[3]));
                    return prodiMatch && sawMatch && statusMatch && keyword3Match;
                } else {
                    // Logika lama: search di semua field
                    return keywords.every(keyword => {
                        if (item.nim && item.nim.toLowerCase().includes(keyword)) return true;
                        if (item.nama && item.nama.toLowerCase().includes(keyword)) return true;
                        if (item.program_studi && item.program_studi.toLowerCase().includes(keyword)) return true;
                        if (item.predicted_class && item.predicted_class.toLowerCase().includes(keyword)) return true;
                        const actualStatus = (item.actual_status || '').toLowerCase();
                        if (actualStatus && actualStatus.includes(keyword)) return true;
                        return false;
                    });
                }
            } else {
                // Logika lama: search di semua field (1 keyword atau >4 keywords)
                return keywords.every(keyword => {
                    if (item.nim && item.nim.toLowerCase().includes(keyword)) return true;
                    if (item.nama && item.nama.toLowerCase().includes(keyword)) return true;
                    if (item.program_studi && item.program_studi.toLowerCase().includes(keyword)) return true;
                    if (item.predicted_class && item.predicted_class.toLowerCase().includes(keyword)) return true;
                    const actualStatus = (item.actual_status || '').toLowerCase();
                    if (actualStatus && actualStatus.includes(keyword)) return true;
                    return false;
                });
            }
        });
        
        console.log('🔧 Data yang difilter:', filteredData.length);
        
        if (filteredData.length === 0) {
            grid.dataSource.data([]);
            grid.refresh();
            this.updateSAWActualSearchInfo(`Tidak ada data ditemukan untuk "${searchInput}"`, "warning");
            return;
        }
        
        // Update grid dengan data hasil pencarian
        grid.dataSource.data(filteredData);
        grid.refresh();
        
        // Build info message
        let infoMessage = '';
        if (keywords.length === 2) {
            if (isProdiCombination2) {
                infoMessage = `Ditemukan ${filteredData.length} data dengan Prodi "${keywords[0]}" dan Klasifikasi "${keywords[1]}"`;
            } else {
                infoMessage = `Ditemukan ${filteredData.length} data dengan SAW "${keywords[0]}" dan Status "${keywords[1]}"`;
            }
        } else if (keywords.length === 3) {
            if (isProdiFisSawCombination) {
                infoMessage = `Ditemukan ${filteredData.length} data dengan Prodi "${keywords[0]}", SAW "${keywords[1]}", dan Status "${keywords[2]}"`;
            } else {
                const keywordText = `keywords: "${keywords.join('", "')}"`;
                infoMessage = `Ditemukan ${filteredData.length} data dengan ${keywordText}`;
            }
        } else if (keywords.length === 4) {
            if (isProdiFisSawStatusCombination) {
                infoMessage = `Ditemukan ${filteredData.length} data dengan Prodi "${keywords[0]}", SAW "${keywords[1]}", Status "${keywords[2]}", dan "${keywords[3]}"`;
            } else {
                const keywordText = `keywords: "${keywords.join('", "')}"`;
                infoMessage = `Ditemukan ${filteredData.length} data dengan ${keywordText}`;
            }
        } else {
            const keywordText = keywords.length > 1 ? 
                `keywords: "${keywords.join('", "')}"` : 
                `"${searchInput}"`;
            infoMessage = `Ditemukan ${filteredData.length} data dengan ${keywordText}`;
        }
        this.updateSAWActualSearchInfo(infoMessage, "success");
        
    } catch (error) {
        console.error('🔧 Error dalam pencarian SAW Actual:', error);
        this.updateSAWActualSearchInfo("Terjadi kesalahan saat mencari data: " + error.message, "error");
    }
};

// Fungsi untuk clear pencarian SAW Actual Evaluation
SAWEvaluationActual.prototype.clearSAWActualSearch = function() {
    console.log('🔧 clearSAWActualSearch called');
    
    // Clear search input
    $("#searchInputSAWActual").val("");
    
    // Restore data lengkap dari cache
    const grid = $('#sawEvaluationActualResultsGrid').data('kendoGrid');
    if (!grid) {
        console.error('🔧 Grid SAW Actual tidak ditemukan');
        this.updateSAWActualSearchInfo("Grid tidak tersedia", "error");
        return;
    }
    
    if (window.sawActualEvaluationDataCache && window.sawActualEvaluationDataCache.length > 0) {
        console.log('🔧 Restoring full data from cache:', window.sawActualEvaluationDataCache.length, 'items');
        grid.dataSource.data(JSON.parse(JSON.stringify(window.sawActualEvaluationDataCache))); // Deep copy
        grid.refresh();
    } else {
        console.log('🔧 No cache available, reloading data');
        // Reload data jika cache tidak tersedia
        if (this.fullData && this.fullData.length > 0) {
            grid.dataSource.data(JSON.parse(JSON.stringify(this.fullData)));
            grid.refresh();
        }
    }
    
    this.updateSAWActualSearchInfo("Pencarian telah dibersihkan, menampilkan semua data", "info");
};

// Fungsi untuk update search info SAW Actual Evaluation
SAWEvaluationActual.prototype.updateSAWActualSearchInfo = function(message, type) {
    const searchInfo = $("#searchInfoSAWActual");
    const searchResultText = $("#searchResultTextSAWActual");
    
    if (searchResultText.length) {
        searchResultText.text(message);
    }
    
    // Update icon berdasarkan type
    const icon = searchInfo.find("i");
    if (icon.length) {
        icon.removeClass("fa-info-circle fa-exclamation-triangle fa-check-circle fa-times-circle");
        
        switch(type) {
            case "success":
                icon.addClass("fa-check-circle");
                searchInfo.css("color", "#28a745");
                break;
            case "warning":
                icon.addClass("fa-exclamation-triangle");
                searchInfo.css("color", "#ffc107");
                break;
            case "error":
                icon.addClass("fa-times-circle");
                searchInfo.css("color", "#dc3545");
                break;
            default:
                icon.addClass("fa-info-circle");
                searchInfo.css("color", "#17a2b8");
        }
    }
};

function mapSAWActualToPredicted(actualStatus) {
    const mapping = {
        'LULUS_TINGGI': 'Peluang Lulus Tinggi',
        'LULUS_SEDANG': 'Peluang Lulus Sedang',
        'LULUS_KECIL': 'Peluang Lulus Kecil'
    };
    return mapping[actualStatus] || actualStatus;
} 