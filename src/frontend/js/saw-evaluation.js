/**
 * SAW Evaluation Module
 * Menangani evaluasi metode SAW (Simple Additive Weighting)
 */

class SAWEvaluation {
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
        console.log('✅ SAW Evaluation module initialized');
    }

    bindEvents() {
        // Calculate button
        $(document).on('click', '#sawEvaluationCalculateBtn', () => {
            this.calculateEvaluation();
        });

        // Export button
        $(document).on('click', '#sawEvaluationExportBtn', () => {
            this.exportData();
        });

        // Print button
        $(document).on('click', '#sawEvaluationPrintBtn', () => {
            this.printReport();
        });

        // Weight validation
        $(document).on('input', '#sawEvaluationIpkWeight, #sawEvaluationSksWeight, #sawEvaluationDekWeight', () => {
            this.validateWeights();
        });
    }

    validateWeights() {
        const ipkWeight = parseInt($('#sawEvaluationIpkWeight').val()) || 0;
        const sksWeight = parseInt($('#sawEvaluationSksWeight').val()) || 0;
        const dekWeight = parseInt($('#sawEvaluationDekWeight').val()) || 0;
        
        const total = ipkWeight + sksWeight + dekWeight;
        
        if (total !== 100) {
            $('#sawEvaluationCalculateBtn').prop('disabled', true);
            this.showNotification('warning', 'Total bobot harus 100%', `Total bobot saat ini: ${total}%`);
        } else {
            $('#sawEvaluationCalculateBtn').prop('disabled', false);
        }
    }

    async calculateEvaluation() {
        try {
            this.showLoading(true);
            
            const weights = {
                ipk: (parseInt($('#sawEvaluationIpkWeight').val()) || 40) / 100, // Konversi dari persentase ke desimal
                sks: (parseInt($('#sawEvaluationSksWeight').val()) || 35) / 100, // Konversi dari persentase ke desimal
                dek: (parseInt($('#sawEvaluationDekWeight').val()) || 25) / 100  // Konversi dari persentase ke desimal
            };

            const testSize = parseInt($('#sawEvaluationTestSize').val()) || 30;
            const randomState = parseInt($('#sawEvaluationRandomState').val()) || 42;
            const saveToDb = $('#sawEvaluationSaveToDb').is(':checked');

            const requestData = {
                weights: weights,
                test_size: testSize / 100, // Konversi dari persentase ke desimal
                random_state: randomState,
                save_to_db: saveToDb
            };

            const response = await $.ajax({
                url: `${this.config.API_BASE_URL}${this.config.API_PREFIX}/saw/evaluate`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(requestData)
            });

            this.displayResults(response.evaluation);
            this.showNotification('success', 'Evaluasi SAW Berhasil', 'Hasil evaluasi telah dihitung dan ditampilkan');

        } catch (error) {
            console.error('Error calculating SAW evaluation:', error);
            this.showNotification('error', 'Error Evaluasi SAW', error.responseJSON?.detail || 'Terjadi kesalahan saat menghitung evaluasi');
        } finally {
            this.showLoading(false);
        }
    }

    displayResults(data) {
        console.log('Displaying evaluation data:', data); // Debug log
        
        // Update summary
        $('#sawEvaluationTotalData').text(data.total_data || '-');
        $('#sawEvaluationTrainingData').text(data.training_data || '-');
        $('#sawEvaluationTestData').text(data.test_data || '-');
        $('#sawEvaluationAccuracy').text(`${(data.accuracy * 100).toFixed(2)}%` || '-');

        // Update metrics
        $('#sawEvaluationPrecision').text(`${(data.precision * 100).toFixed(2)}%`);
        $('#sawEvaluationRecall').text(`${(data.recall * 100).toFixed(2)}%`);
        $('#sawEvaluationF1Score').text(`${(data.f1_score * 100).toFixed(2)}%`);
        $('#sawEvaluationSpecificity').text(`${(data.specificity * 100).toFixed(2)}%`);

        // Update performance analysis text
        this.updatePerformanceAnalysis(data);

        // Update confusion matrix
        this.updateConfusionMatrix(data.confusion_matrix);

        // Update results grid
        this.updateResultsGrid(data.results);

        // Update charts
        this.updateCharts(data);

        // Store data for export
        this.evaluationData = data;
    }

    updatePerformanceAnalysis(data) {
        // Update accuracy text
        const accuracyPercent = (data.accuracy * 100).toFixed(2);
        $('#sawEvaluationAccuracyText').text(`${accuracyPercent}%`);
        
        // Update precision text
        const precisionPercent = (data.precision * 100).toFixed(2);
        $('#sawEvaluationPrecisionText').text(`${precisionPercent}%`);
        
        // Update recall text
        const recallPercent = (data.recall * 100).toFixed(2);
        $('#sawEvaluationRecallText').text(`${recallPercent}%`);
        
        // Update F1-score text
        const f1Percent = (data.f1_score * 100).toFixed(2);
        $('#sawEvaluationF1Text').text(`${f1Percent}%`);
        
        // Update specificity text
        const specificityPercent = (data.specificity * 100).toFixed(2);
        $('#sawEvaluationSpecificityText').text(`${specificityPercent}%`);
        
        // Generate dynamic narratives
        this.generateAccuracyNarrative(accuracyPercent);
        this.generatePrecisionRecallNarrative(precisionPercent, recallPercent);
        this.generateF1Narrative(f1Percent);
        this.generateSpecificityNarrative(specificityPercent);
        this.generateOverallNarrative(data);
        this.generateRecommendations(data);
    }

    generateAccuracyNarrative(accuracyPercent) {
        let narrative = '';
        const accuracy = parseFloat(accuracyPercent);
        
        if (accuracy >= 80) {
            narrative = 'yang menunjukkan performa <span class="narrative-success">sangat baik</span> dalam klasifikasi. Model ini dapat dipercaya untuk prediksi yang akurat.';
        } else if (accuracy >= 70) {
            narrative = 'yang menunjukkan performa <span class="narrative-highlight">baik</span> dalam klasifikasi. Model ini cukup handal untuk digunakan.';
        } else if (accuracy >= 60) {
            narrative = 'yang menunjukkan performa <span class="narrative-warning">cukup</span> dalam klasifikasi. Perlu perbaikan untuk meningkatkan akurasi.';
        } else {
            narrative = 'yang menunjukkan performa <span class="narrative-danger">kurang optimal</span> dalam klasifikasi. Perlu evaluasi ulang model.';
        }
        
        $('#sawEvaluationAccuracyNarrative').html(narrative);
    }

    generatePrecisionRecallNarrative(precisionPercent, recallPercent) {
        let narrative = '';
        const precision = parseFloat(precisionPercent);
        const recall = parseFloat(recallPercent);
        const difference = Math.abs(precision - recall);
        
        if (difference <= 10) {
            narrative = '<span class="narrative-success">keseimbangan yang sangat baik</span> antara precision dan recall. Model menunjukkan konsistensi dalam prediksi.';
        } else if (difference <= 20) {
            narrative = '<span class="narrative-highlight">keseimbangan yang baik</span> antara precision dan recall. Model cukup seimbang dalam prediksi.';
        } else if (difference <= 30) {
            narrative = '<span class="narrative-warning">ketidakseimbangan moderat</span> antara precision dan recall. Perlu penyesuaian bobot.';
        } else {
            narrative = '<span class="narrative-danger">ketidakseimbangan yang signifikan</span> antara precision dan recall. Perlu optimasi model.';
        }
        
        $('#sawEvaluationPrecisionRecallNarrative').html(narrative);
    }

    generateF1Narrative(f1Percent) {
        let narrative = '';
        const f1 = parseFloat(f1Percent);
        
        if (f1 >= 80) {
            narrative = 'menunjukkan <span class="narrative-success">performa yang sangat baik</span> secara keseluruhan. Model sangat handal.';
        } else if (f1 >= 70) {
            narrative = 'menunjukkan <span class="narrative-highlight">performa yang baik</span> secara keseluruhan. Model dapat diandalkan.';
        } else if (f1 >= 60) {
            narrative = 'menunjukkan <span class="narrative-warning">performa yang cukup</span> secara keseluruhan. Ada ruang untuk perbaikan.';
        } else {
            narrative = 'menunjukkan <span class="narrative-danger">performa yang perlu ditingkatkan</span> secara keseluruhan. Perlu optimasi signifikan.';
        }
        
        $('#sawEvaluationF1Narrative').html(narrative);
    }

    generateSpecificityNarrative(specificityPercent) {
        let narrative = '';
        const specificity = parseFloat(specificityPercent);
        
        if (specificity >= 80) {
            narrative = '<span class="narrative-success">kemampuan yang sangat baik</span> dalam mengidentifikasi kasus negatif dengan benar.';
        } else if (specificity >= 70) {
            narrative = '<span class="narrative-highlight">kemampuan yang baik</span> dalam mengidentifikasi kasus negatif dengan benar.';
        } else if (specificity >= 60) {
            narrative = '<span class="narrative-warning">kemampuan yang cukup</span> dalam mengidentifikasi kasus negatif.';
        } else {
            narrative = '<span class="narrative-danger">kemampuan yang terbatas</span> dalam mengidentifikasi kasus negatif.';
        }
        
        $('#sawEvaluationSpecificityNarrative').html(narrative);
    }

    generateOverallNarrative(data) {
        const accuracy = parseFloat((data.accuracy * 100).toFixed(2));
        const precision = parseFloat((data.precision * 100).toFixed(2));
        const recall = parseFloat((data.recall * 100).toFixed(2));
        const f1 = parseFloat((data.f1_score * 100).toFixed(2));
        
        let overallAssessment = '';
        let performanceLevel = '';
        
        // Determine overall performance level
        const avgScore = (accuracy + precision + recall + f1) / 4;
        
        if (avgScore >= 80) {
            performanceLevel = 'sangat baik';
            overallAssessment = 'Model SAW menunjukkan performa yang sangat baik dalam mengklasifikasikan peluang lulus mahasiswa. Semua metrik evaluasi menunjukkan hasil yang konsisten dan dapat diandalkan untuk pengambilan keputusan.';
        } else if (avgScore >= 70) {
            performanceLevel = 'baik';
            overallAssessment = 'Model SAW menunjukkan performa yang baik dalam mengklasifikasikan peluang lulus mahasiswa. Model ini cukup handal untuk digunakan dalam sistem pendukung keputusan.';
        } else if (avgScore >= 60) {
            performanceLevel = 'cukup';
            overallAssessment = 'Model SAW menunjukkan performa yang cukup dalam mengklasifikasikan peluang lulus mahasiswa. Ada beberapa area yang dapat ditingkatkan untuk optimasi lebih lanjut.';
        } else {
            performanceLevel = 'perlu perbaikan';
            overallAssessment = 'Model SAW menunjukkan performa yang perlu ditingkatkan dalam mengklasifikasikan peluang lulus mahasiswa. Perlu evaluasi dan optimasi yang signifikan.';
        }
        
        const narrative = `Berdasarkan analisis komprehensif terhadap ${data.total_data} data mahasiswa dengan pembagian training (${data.training_data}) dan testing (${data.test_data}), model SAW menunjukkan performa <strong>${performanceLevel}</strong>. ${overallAssessment}`;
        
        $('#sawEvaluationOverallNarrative').html(narrative);
    }

    generateRecommendations(data) {
        const accuracy = parseFloat((data.accuracy * 100).toFixed(2));
        const precision = parseFloat((data.precision * 100).toFixed(2));
        const recall = parseFloat((data.recall * 100).toFixed(2));
        const f1 = parseFloat((data.f1_score * 100).toFixed(2));
        
        const recommendations = [];
        
        // Accuracy-based recommendations
        if (accuracy < 70) {
            recommendations.push('Pertimbangkan untuk menambah jumlah data training atau memperbaiki kualitas data');
        }
        
        // Precision-Recall balance recommendations
        const precisionRecallDiff = Math.abs(precision - recall);
        if (precisionRecallDiff > 20) {
            recommendations.push('Optimalkan bobot kriteria untuk menyeimbangkan precision dan recall');
        }
        
        // F1-score recommendations
        if (f1 < 60) {
            recommendations.push('Evaluasi ulang parameter model dan pertimbangkan teknik preprocessing data');
        }
        
        // General recommendations
        if (data.test_data < 100) {
            recommendations.push('Pertimbangkan untuk menambah ukuran dataset untuk validasi yang lebih robust');
        }
        
        // Add positive recommendation if performance is good
        if (accuracy >= 75 && f1 >= 70) {
            recommendations.push('Model dapat digunakan dalam sistem pendukung keputusan dengan monitoring berkala');
        }
        
        // Generate HTML for recommendations
        const recommendationsHtml = recommendations.map(rec => `<li>${rec}</li>`).join('');
        $('#sawEvaluationRecommendations').html(recommendationsHtml);
    }

    updateConfusionMatrix(confusionMatrix) {
        if (!confusionMatrix) return;

        const tp = confusionMatrix.tp || 0;
        const fp = confusionMatrix.fp || 0;
        const fn = confusionMatrix.fn || 0;
        const tn = confusionMatrix.tn || 0;
        const total = tp + fp + fn + tn;

        // Calculate percentages
        const tpPercent = total > 0 ? ((tp / total) * 100).toFixed(1) : 0;
        const fpPercent = total > 0 ? ((fp / total) * 100).toFixed(1) : 0;
        const fnPercent = total > 0 ? ((fn / total) * 100).toFixed(1) : 0;
        const tnPercent = total > 0 ? ((tn / total) * 100).toFixed(1) : 0;

        // Calculate accuracy metrics
        const accuracy = total > 0 ? (((tp + tn) / total) * 100).toFixed(1) : 0;
        const precision = (tp + fp) > 0 ? ((tp / (tp + fp)) * 100).toFixed(1) : 0;
        const recall = (tp + fn) > 0 ? ((tp / (tp + fn)) * 100).toFixed(1) : 0;

        const matrixHtml = `
            <div class="confusion-matrix-wrapper">
                <!-- Header dengan penjelasan -->
                <div class="confusion-matrix-header">
                    <div class="header-main">
                        <h4><i class="fas fa-table"></i> Confusion Matrix SAW</h4>
                        <p class="header-description">
                            Tabel ini menunjukkan perbandingan antara prediksi model SAW dengan kelas aktual mahasiswa. 
                            Semakin tinggi nilai pada diagonal utama (TP dan TN), semakin baik performa model.
                        </p>
                    </div>
                    <div class="matrix-overview">
                        <div class="overview-item success">
                            <div class="overview-icon">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="overview-content">
                                <div class="overview-label">Akurasi Model</div>
                                <div class="overview-value">${accuracy}%</div>
                                <div class="overview-detail">${tp + tn} dari ${total} prediksi benar</div>
                            </div>
                        </div>
                        <div class="overview-item info">
                            <div class="overview-icon">
                                <i class="fas fa-bullseye"></i>
                            </div>
                            <div class="overview-content">
                                <div class="overview-label">Presisi</div>
                                <div class="overview-value">${precision}%</div>
                                <div class="overview-detail">Dari prediksi positif, ${precision}% benar</div>
                            </div>
                        </div>
                        <div class="overview-item warning">
                            <div class="overview-icon">
                                <i class="fas fa-search"></i>
                            </div>
                            <div class="overview-content">
                                <div class="overview-label">Recall</div>
                                <div class="overview-value">${recall}%</div>
                                <div class="overview-detail">Dari kasus positif, ${recall}% terdeteksi</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Penjelasan Kategori -->
                <div class="category-explanation">
                    <div class="explanation-grid">
                        <div class="explanation-item">
                            <div class="explanation-icon positive">
                                <i class="fas fa-thumbs-up"></i>
                            </div>
                            <div class="explanation-content">
                                <h5>Kelas Positif</h5>
                                <p>Mahasiswa dengan <strong>Peluang Lulus Tinggi</strong> berdasarkan kriteria IPK, SKS, dan persentase D/E/K</p>
                            </div>
                        </div>
                        <div class="explanation-item">
                            <div class="explanation-icon negative">
                                <i class="fas fa-thumbs-down"></i>
                            </div>
                            <div class="explanation-content">
                                <h5>Kelas Negatif</h5>
                                <p>Mahasiswa dengan <strong>Peluang Lulus Sedang/Kecil</strong> berdasarkan kriteria IPK, SKS, dan persentase D/E/K</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tabel Confusion Matrix -->
                <div class="confusion-matrix-table-container">
                    <div class="table-header">
                        <h5><i class="fas fa-info-circle"></i> Detail Confusion Matrix</h5>
                        <div class="table-legend">
                            <span class="legend-item">
                                <span class="legend-color tp-color"></span>
                                <span>Benar Positif (TP)</span>
                            </span>
                            <span class="legend-item">
                                <span class="legend-color tn-color"></span>
                                <span>Benar Negatif (TN)</span>
                            </span>
                            <span class="legend-item">
                                <span class="legend-color fp-color"></span>
                                <span>Salah Positif (FP)</span>
                            </span>
                            <span class="legend-item">
                                <span class="legend-color fn-color"></span>
                                <span>Salah Negatif (FN)</span>
                            </span>
                        </div>
                    </div>
                    
                    <table class="confusion-matrix-table">
                        <thead>
                            <tr>
                                <th class="matrix-header corner-header">
                                    <i class="fas fa-exchange-alt"></i>
                                    <div>Aktual vs Prediksi</div>
                                </th>
                                <th class="matrix-header positive-header">
                                    <i class="fas fa-thumbs-up"></i>
                                    <div>Prediksi Positif</div>
                                    <small>(Peluang Lulus Tinggi)</small>
                                </th>
                                <th class="matrix-header negative-header">
                                    <i class="fas fa-thumbs-down"></i>
                                    <div>Prediksi Negatif</div>
                                    <small>(Peluang Lulus Sedang/Kecil)</small>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="matrix-label positive-label">
                                    <i class="fas fa-check-circle"></i>
                                    <div>
                                        <strong>Aktual Positif</strong>
                                        <small>(Peluang Lulus Tinggi)</small>
                                    </div>
                                </td>
                                <td class="matrix-cell tp-cell" data-toggle="tooltip" title="True Positive: Model berhasil memprediksi mahasiswa dengan peluang lulus tinggi dengan benar">
                                    <div class="cell-main">
                                        <div class="cell-value">${tp}</div>
                                        <div class="cell-percentage">${tpPercent}%</div>
                                    </div>
                                    <div class="cell-description">
                                        <i class="fas fa-check"></i>
                                        <span>Benar Positif</span>
                                    </div>
                                    <div class="cell-explanation">
                                        Model berhasil mengidentifikasi mahasiswa dengan peluang lulus tinggi
                                    </div>
                                </td>
                                <td class="matrix-cell fn-cell" data-toggle="tooltip" title="False Negative: Model gagal mengidentifikasi mahasiswa dengan peluang lulus tinggi">
                                    <div class="cell-main">
                                        <div class="cell-value">${fn}</div>
                                        <div class="cell-percentage">${fnPercent}%</div>
                                    </div>
                                    <div class="cell-description">
                                        <i class="fas fa-times"></i>
                                        <span>Salah Negatif</span>
                                    </div>
                                    <div class="cell-explanation">
                                        Model gagal mengidentifikasi mahasiswa dengan peluang lulus tinggi
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td class="matrix-label negative-label">
                                    <i class="fas fa-times-circle"></i>
                                    <div>
                                        <strong>Aktual Negatif</strong>
                                        <small>(Peluang Lulus Sedang/Kecil)</small>
                                    </div>
                                </td>
                                <td class="matrix-cell fp-cell" data-toggle="tooltip" title="False Positive: Model salah mengidentifikasi mahasiswa dengan peluang lulus rendah sebagai tinggi">
                                    <div class="cell-main">
                                        <div class="cell-value">${fp}</div>
                                        <div class="cell-percentage">${fpPercent}%</div>
                                    </div>
                                    <div class="cell-description">
                                        <i class="fas fa-exclamation-triangle"></i>
                                        <span>Salah Positif</span>
                                    </div>
                                    <div class="cell-explanation">
                                        Model salah mengidentifikasi mahasiswa dengan peluang lulus rendah sebagai tinggi
                                    </div>
                                </td>
                                <td class="matrix-cell tn-cell" data-toggle="tooltip" title="True Negative: Model berhasil mengidentifikasi mahasiswa dengan peluang lulus rendah dengan benar">
                                    <div class="cell-main">
                                        <div class="cell-value">${tn}</div>
                                        <div class="cell-percentage">${tnPercent}%</div>
                                    </div>
                                    <div class="cell-description">
                                        <i class="fas fa-check"></i>
                                        <span>Benar Negatif</span>
                                    </div>
                                    <div class="cell-explanation">
                                        Model berhasil mengidentifikasi mahasiswa dengan peluang lulus rendah
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Interpretasi Hasil -->
                <div class="matrix-interpretation">
                    <h5><i class="fas fa-lightbulb"></i> Interpretasi Hasil</h5>
                    <div class="interpretation-grid">
                        <div class="interpretation-item good">
                            <div class="interpretation-icon">
                                <i class="fas fa-star"></i>
                            </div>
                            <div class="interpretation-content">
                                <h6>Performa Baik</h6>
                                <ul>
                                    <li><strong>True Positive (${tp})</strong>: Model berhasil mengidentifikasi ${tp} mahasiswa dengan peluang lulus tinggi</li>
                                    <li><strong>True Negative (${tn})</strong>: Model berhasil mengidentifikasi ${tn} mahasiswa dengan peluang lulus rendah</li>
                                </ul>
                            </div>
                        </div>
                        <div class="interpretation-item improvement">
                            <div class="interpretation-icon">
                                <i class="fas fa-tools"></i>
                            </div>
                            <div class="interpretation-content">
                                <h6>Area Perbaikan</h6>
                                <ul>
                                    <li><strong>False Positive (${fp})</strong>: ${fp} mahasiswa dengan peluang lulus rendah salah diprediksi sebagai tinggi</li>
                                    <li><strong>False Negative (${fn})</strong>: ${fn} mahasiswa dengan peluang lulus tinggi tidak teridentifikasi</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Rekomendasi -->
                <div class="matrix-recommendations">
                    <h5><i class="fas fa-clipboard-list"></i> Rekomendasi</h5>
                    <div class="recommendations-list">
                        ${this.generateMatrixRecommendations(tp, fp, fn, tn, accuracy, precision, recall)}
                    </div>
                </div>
            </div>
        `;

        $('#sawEvaluationConfusionMatrix').html(matrixHtml);
        
        // Initialize tooltips if Bootstrap is available
        if (typeof $().tooltip === 'function') {
            $('[data-toggle="tooltip"]').tooltip();
        }
    }

    generateMatrixRecommendations(tp, fp, fn, tn, accuracy, precision, recall) {
        const total = tp + fp + fn + tn;
        const recommendations = [];

        // Accuracy recommendations
        if (accuracy >= 80) {
            recommendations.push('<li class="recommendation-item success"><i class="fas fa-check-circle"></i> Akurasi model sangat baik (≥80%). Model dapat diandalkan untuk prediksi.</li>');
        } else if (accuracy >= 70) {
            recommendations.push('<li class="recommendation-item warning"><i class="fas fa-exclamation-triangle"></i> Akurasi model baik (70-79%). Pertimbangkan untuk menyesuaikan bobot kriteria.</li>');
        } else {
            recommendations.push('<li class="recommendation-item danger"><i class="fas fa-times-circle"></i> Akurasi model perlu ditingkatkan (<70%). Evaluasi ulang kriteria dan bobot.</li>');
        }

        // Precision recommendations
        if (precision >= 80) {
            recommendations.push('<li class="recommendation-item success"><i class="fas fa-check-circle"></i> Presisi tinggi (≥80%). Model jarang memberikan false positive.</li>');
        } else if (precision >= 60) {
            recommendations.push('<li class="recommendation-item warning"><i class="fas fa-exclamation-triangle"></i> Presisi sedang (60-79%). Model masih memberikan beberapa false positive.</li>');
        } else {
            recommendations.push('<li class="recommendation-item danger"><i class="fas fa-times-circle"></i> Presisi rendah (<60%). Model sering memberikan false positive.</li>');
        }

        // Recall recommendations
        if (recall >= 80) {
            recommendations.push('<li class="recommendation-item success"><i class="fas fa-check-circle"></i> Recall tinggi (≥80%). Model berhasil mengidentifikasi sebagian besar kasus positif.</li>');
        } else if (recall >= 60) {
            recommendations.push('<li class="recommendation-item warning"><i class="fas fa-exclamation-triangle"></i> Recall sedang (60-79%). Model melewatkan beberapa kasus positif.</li>');
        } else {
            recommendations.push('<li class="recommendation-item danger"><i class="fas fa-times-circle"></i> Recall rendah (<60%). Model melewatkan banyak kasus positif.</li>');
        }

        // Specific recommendations based on matrix values
        if (fp > fn) {
            recommendations.push('<li class="recommendation-item info"><i class="fas fa-info-circle"></i> Model cenderung over-predict positif. Pertimbangkan untuk meningkatkan threshold.</li>');
        } else if (fn > fp) {
            recommendations.push('<li class="recommendation-item info"><i class="fas fa-info-circle"></i> Model cenderung under-predict positif. Pertimbangkan untuk menurunkan threshold.</li>');
        }

        if (tp === 0) {
            recommendations.push('<li class="recommendation-item danger"><i class="fas fa-exclamation-triangle"></i> Tidak ada true positive. Model gagal mengidentifikasi kasus positif.</li>');
        }

        if (tn === 0) {
            recommendations.push('<li class="recommendation-item danger"><i class="fas fa-exclamation-triangle"></i> Tidak ada true negative. Model gagal mengidentifikasi kasus negatif.</li>');
        }

        return recommendations.join('');
    }

    updateResultsGrid(results) {
        if (!results || !results.length) return;

        const grid = $('#sawEvaluationResultsGrid');
        
        const gridConfig = {
            dataSource: {
                data: results,
                schema: {
                    model: {
                        fields: {
                            nim: { type: "string" },
                            nama: { type: "string" },
                            ipk: { type: "number" },
                            sks: { type: "number" },
                            dek_percentage: { type: "number" },
                            actual_class: { type: "string" },
                            predicted_class: { type: "string" },
                            saw_score: { type: "number" },
                            is_correct: { type: "boolean" }
                        }
                    }
                }
            },
            columns: [
                { field: "nim", title: "NIM", width: 120 },
                { field: "nama", title: "Nama", width: 200 },
                { field: "ipk", title: "IPK", width: 80, format: "{0:n2}" },
                { field: "sks", title: "SKS", width: 80 },
                { field: "dek_percentage", title: "D/E/K %", width: 100, format: "{0:n1}%" },
                { field: "actual_class", title: "Kelas Aktual", width: 120 },
                { field: "predicted_class", title: "Kelas Prediksi", width: 120 },
                { field: "saw_score", title: "Skor SAW", width: 100, format: "{0:n2}" },
                { 
                    field: "is_correct", 
                    title: "Benar", 
                    width: 80,
                    template: function(dataItem) {
                        return dataItem.is_correct ? 
                            '<span class="badge badge-success"><i class="fas fa-check"></i></span>' : 
                            '<span class="badge badge-danger"><i class="fas fa-times"></i></span>';
                    }
                }
            ],
            sortable: true,
            filterable: true,
            pageable: {
                pageSize: 20
            },
            height: 400
        };

        grid.kendoGrid(gridConfig);
    }

    updateCharts(data) {
        // Classification distribution chart
        this.updateClassificationChart(data.classification_distribution);
        
        // Metrics comparison chart
        this.updateMetricsChart(data);
    }

    updateClassificationChart(distribution) {
        if (!distribution) return;

        const ctx = document.getElementById('sawEvaluationClassificationChart');
        if (!ctx) return;

        if (this.classificationChart) {
            this.classificationChart.destroy();
        }

        this.classificationChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Peluang Tinggi', 'Peluang Sedang', 'Peluang Kecil'],
                datasets: [{
                    data: [
                        distribution.tinggi || 0,
                        distribution.sedang || 0,
                        distribution.kecil || 0
                    ],
                    backgroundColor: [
                        '#28a745',
                        '#ffc107',
                        '#dc3545'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: 'Distribusi Klasifikasi SAW'
                    }
                }
            }
        });
    }

    updateMetricsChart(data) {
        const ctx = document.getElementById('sawEvaluationMetricsChart');
        if (!ctx) return;

        if (this.metricsChart) {
            this.metricsChart.destroy();
        }

        this.metricsChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'Specificity'],
                datasets: [{
                    label: 'SAW Performance',
                    data: [
                        data.accuracy * 100,
                        data.precision * 100,
                        data.recall * 100,
                        data.f1_score * 100,
                        data.specificity * 100
                    ],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
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
                    title: {
                        display: true,
                        text: 'Perbandingan Metrik SAW'
                    }
                }
            }
        });
    }

    initializeCharts() {
        // Initialize empty charts
        this.updateClassificationChart({ tinggi: 0, sedang: 0, kecil: 0 });
        this.updateMetricsChart({ 
            accuracy: 0, 
            precision: 0, 
            recall: 0, 
            f1_score: 0, 
            specificity: 0 
        });
    }

    async exportData() {
        if (!this.evaluationData) {
            this.showNotification('warning', 'Tidak Ada Data', 'Harap hitung evaluasi terlebih dahulu');
            return;
        }

        try {
            const csvContent = this.convertToCSV(this.evaluationData.results);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `saw_evaluation_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            this.showNotification('success', 'Export Berhasil', 'Data evaluasi SAW telah diexport ke CSV');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showNotification('error', 'Error Export', 'Terjadi kesalahan saat mengexport data');
        }
    }

    convertToCSV(data) {
        if (!data || !data.length) return '';

        const headers = ['NIM', 'Nama', 'IPK', 'SKS', 'D/E/K %', 'Kelas Aktual', 'Kelas Prediksi', 'Skor SAW', 'Benar'];
        const csvRows = [headers.join(',')];

        data.forEach(row => {
            const values = [
                row.nim,
                `"${row.nama}"`,
                row.ipk,
                row.sks,
                row.dek_percentage,
                row.actual_class,
                row.predicted_class,
                row.saw_score,
                row.is_correct ? 'Ya' : 'Tidak'
            ];
            csvRows.push(values.join(','));
        });

        return csvRows.join('\n');
    }

    printReport() {
        if (!this.evaluationData) {
            this.showNotification('warning', 'Tidak Ada Data', 'Harap hitung evaluasi terlebih dahulu');
            return;
        }

        const printWindow = window.open('', '_blank');
        const reportContent = this.generateReportHTML();
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Laporan Evaluasi SAW</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .section { margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .metric { margin: 10px 0; }
                </style>
            </head>
            <body>
                ${reportContent}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    }

    generateReportHTML() {
        const data = this.evaluationData;
        return `
            <div class="header">
                <h1>Laporan Evaluasi Metode SAW</h1>
                <p>Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
            </div>
            
            <div class="section">
                <h2>Ringkasan Evaluasi</h2>
                <p>Total Data: ${data.total_data}</p>
                <p>Training Data: ${data.training_data}</p>
                <p>Test Data: ${data.test_data}</p>
                <p>Akurasi: ${(data.accuracy * 100).toFixed(2)}%</p>
            </div>
            
            <div class="section">
                <h2>Metrik Evaluasi</h2>
                <div class="metric">Precision: ${(data.precision * 100).toFixed(2)}%</div>
                <div class="metric">Recall: ${(data.recall * 100).toFixed(2)}%</div>
                <div class="metric">F1-Score: ${(data.f1_score * 100).toFixed(2)}%</div>
                <div class="metric">Specificity: ${(data.specificity * 100).toFixed(2)}%</div>
            </div>
            
            <div class="section">
                <h2>Confusion Matrix</h2>
                <table>
                    <tr>
                        <th></th>
                        <th>Prediksi Positif</th>
                        <th>Prediksi Negatif</th>
                    </tr>
                    <tr>
                        <td><strong>Aktual Positif</strong></td>
                        <td>${data.confusion_matrix.tp || 0}</td>
                        <td>${data.confusion_matrix.fn || 0}</td>
                    </tr>
                    <tr>
                        <td><strong>Aktual Negatif</strong></td>
                        <td>${data.confusion_matrix.fp || 0}</td>
                        <td>${data.confusion_matrix.tn || 0}</td>
                    </tr>
                </table>
            </div>
        `;
    }

    showLoading(show) {
        if (show) {
            $('#sawEvaluationLoadingIndicator').show();
            $('#sawEvaluationCalculateBtn').prop('disabled', true);
        } else {
            $('#sawEvaluationLoadingIndicator').hide();
            $('#sawEvaluationCalculateBtn').prop('disabled', false);
        }
    }

    showNotification(type, title, message) {
        if (window.showNotification) {
            window.showNotification(type, title, message);
        } else {
            console.log(`${type.toUpperCase()}: ${title} - ${message}`);
        }
    }
}

// Initialize SAW Evaluation when DOM is ready
$(document).ready(function() {
    window.sawEvaluation = new SAWEvaluation();
});

// Export for global access
window.SAWEvaluation = SAWEvaluation; 