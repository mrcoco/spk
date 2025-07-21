/**
 * Enhanced Fuzzy Evaluation System
 * Sistem evaluasi fuzzy yang ditingkatkan dengan multiple methods
 * 
 * @author SPK System Team
 * @version 1.0.0
 * @date 2025-07-27
 */

class EnhancedEvaluation {
    constructor() {
        this.config = {
            apiBaseUrl: (window.CONFIG && window.CONFIG.API_BASE_URL) || 'http://localhost:8000',
            evaluationType: 'quick',
            cvFolds: 5,
            bootstrapSamples: 20,
            ensembleSize: 10,
            enablePreprocessing: true,
            enableRuleWeighting: true
        };
        
        this.results = null;
        this.charts = {};
        this.isRunning = false;
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        console.log('🔍 Initializing event listeners...');
        
        // Configuration controls
        const evaluationType = document.getElementById('evaluationType');
        if (evaluationType) {
            evaluationType.addEventListener('change', (e) => {
                this.config.evaluationType = e.target.value;
                this.updateConfigurationUI();
            });
            console.log('✅ evaluationType listener added');
        } else {
            console.error('❌ evaluationType element not found');
        }

        const cvFolds = document.getElementById('crossValidationFolds');
        if (cvFolds) {
            cvFolds.addEventListener('change', (e) => {
                this.config.cvFolds = parseInt(e.target.value);
            });
            console.log('✅ cvFolds listener added');
        } else {
            console.error('❌ cvFolds element not found');
        }

        const bootstrapSamples = document.getElementById('bootstrapSamples');
        if (bootstrapSamples) {
            bootstrapSamples.addEventListener('change', (e) => {
                this.config.bootstrapSamples = parseInt(e.target.value);
            });
            console.log('✅ bootstrapSamples listener added');
        } else {
            console.error('❌ bootstrapSamples element not found');
        }

        const ensembleSize = document.getElementById('ensembleSize');
        if (ensembleSize) {
            ensembleSize.addEventListener('change', (e) => {
                this.config.ensembleSize = parseInt(e.target.value);
            });
            console.log('✅ ensembleSize listener added');
        } else {
            console.error('❌ ensembleSize element not found');
        }

        const enablePreprocessing = document.getElementById('enablePreprocessing');
        if (enablePreprocessing) {
            enablePreprocessing.addEventListener('change', (e) => {
                this.config.enablePreprocessing = e.target.checked;
            });
            console.log('✅ enablePreprocessing listener added');
        } else {
            console.error('❌ enablePreprocessing element not found');
        }

        const enableRuleWeighting = document.getElementById('enableRuleWeighting');
        if (enableRuleWeighting) {
            enableRuleWeighting.addEventListener('change', (e) => {
                this.config.enableRuleWeighting = e.target.checked;
            });
            console.log('✅ enableRuleWeighting listener added');
        } else {
            console.error('❌ enableRuleWeighting element not found');
        }

        // Action buttons
        const runEvaluation = document.getElementById('runEvaluation');
        if (runEvaluation) {
            runEvaluation.addEventListener('click', () => {
                console.log('🔍 Run Evaluation button clicked from main listener');
                this.runEvaluation();
            });
            console.log('✅ runEvaluation listener added');
        } else {
            console.error('❌ runEvaluation element not found');
        }

        const resetConfig = document.getElementById('resetConfig');
        if (resetConfig) {
            resetConfig.addEventListener('click', () => {
                this.resetConfiguration();
            });
            console.log('✅ resetConfig listener added');
        } else {
            console.error('❌ resetConfig element not found');
        }

        const loadSampleData = document.getElementById('loadSampleData');
        if (loadSampleData) {
            loadSampleData.addEventListener('click', () => {
                this.loadSampleData();
            });
            console.log('✅ loadSampleData listener added');
        } else {
            console.error('❌ loadSampleData element not found');
        }

        // Export buttons
        const exportPDF = document.getElementById('exportPDF');
        if (exportPDF) {
            exportPDF.addEventListener('click', () => {
                this.exportResults('pdf');
            });
            console.log('✅ exportPDF listener added');
        } else {
            console.error('❌ exportPDF element not found');
        }

        const exportExcel = document.getElementById('exportExcel');
        if (exportExcel) {
            exportExcel.addEventListener('click', () => {
                this.exportResults('excel');
            });
            console.log('✅ exportExcel listener added');
        } else {
            console.error('❌ exportExcel element not found');
        }

        const exportJSON = document.getElementById('exportJSON');
        if (exportJSON) {
            exportJSON.addEventListener('click', () => {
                this.exportResults('json');
            });
            console.log('✅ exportJSON listener added');
        } else {
            console.error('❌ exportJSON element not found');
        }

        const shareResults = document.getElementById('shareResults');
        if (shareResults) {
            shareResults.addEventListener('click', () => {
                this.shareResults();
            });
            console.log('✅ shareResults listener added');
        } else {
            console.error('❌ shareResults element not found');
        }
        
        console.log('🔍 Event listeners initialization completed');
    }

    /**
     * Update configuration UI based on evaluation type
     */
    updateConfigurationUI() {
        const evaluationType = this.config.evaluationType;
        
        // Show/hide relevant configuration options
        const cvFoldsGroup = document.getElementById('crossValidationFolds')?.parentElement;
        const bootstrapGroup = document.getElementById('bootstrapSamples')?.parentElement;
        const ensembleGroup = document.getElementById('ensembleSize')?.parentElement;
        
        if (cvFoldsGroup) cvFoldsGroup.style.display = 
            ['full', 'cross_validation'].includes(evaluationType) ? 'block' : 'none';
        
        if (bootstrapGroup) bootstrapGroup.style.display = 
            ['full', 'bootstrap'].includes(evaluationType) ? 'block' : 'none';
        
        if (ensembleGroup) ensembleGroup.style.display = 
            ['full', 'ensemble'].includes(evaluationType) ? 'block' : 'none';
    }

    /**
     * Reset configuration to defaults
     */
    resetConfiguration() {
        this.config = {
            apiBaseUrl: (window.CONFIG && window.CONFIG.API_BASE_URL) || 'http://localhost:8000',
            evaluationType: 'quick',
            cvFolds: 5,
            bootstrapSamples: 20,
            ensembleSize: 10,
            enablePreprocessing: true,
            enableRuleWeighting: true
        };
        
        // Update UI
        const evaluationTypeEl = document.getElementById('evaluationType');
        const cvFoldsEl = document.getElementById('crossValidationFolds');
        const bootstrapSamplesEl = document.getElementById('bootstrapSamples');
        const ensembleSizeEl = document.getElementById('ensembleSize');
        const enablePreprocessingEl = document.getElementById('enablePreprocessing');
        const enableRuleWeightingEl = document.getElementById('enableRuleWeighting');
        
        if (evaluationTypeEl) evaluationTypeEl.value = this.config.evaluationType;
        if (cvFoldsEl) cvFoldsEl.value = this.config.cvFolds;
        if (bootstrapSamplesEl) bootstrapSamplesEl.value = this.config.bootstrapSamples;
        if (ensembleSizeEl) ensembleSizeEl.value = this.config.ensembleSize;
        if (enablePreprocessingEl) enablePreprocessingEl.checked = this.config.enablePreprocessing;
        if (enableRuleWeightingEl) enableRuleWeightingEl.checked = this.config.enableRuleWeighting;
        
        this.updateConfigurationUI();
        this.showAlert('Konfigurasi telah direset ke default', 'info');
    }

    /**
     * Load sample data for testing
     */
    async loadSampleData() {
        try {
            this.showAlert('Memuat sample data...', 'info');
            
            const response = await fetch(`${this.config.apiBaseUrl}/api/mahasiswa`);
            if (!response.ok) throw new Error('Failed to fetch sample data');
            
            const result = await response.json();
            const data = result.data || [];
            const totalData = result.total || data.length || 0;
            
            const totalDataEl = document.getElementById('totalData');
            if (totalDataEl) {
                totalDataEl.textContent = totalData.toLocaleString();
            }
            this.showAlert(`Sample data berhasil dimuat: ${totalData} records`, 'success');
            
        } catch (error) {
            console.error('Error loading sample data:', error);
            this.showAlert('Gagal memuat sample data: ' + error.message, 'danger');
        }
    }

    /**
     * Run enhanced evaluation
     */
    async runEvaluation() {
        if (this.isRunning) {
            this.showAlert('Evaluasi sedang berjalan, harap tunggu...', 'warning');
            return;
        }

        this.isRunning = true;
        this.showLoading(true);
        this.hideResults();

        try {
            console.log('🚀 Starting Enhanced Evaluation...');
            console.log('Configuration:', this.config);

            // Update loading message
            this.updateLoadingMessage('Memproses data dan menjalankan evaluasi...');

            let response;
            
            // Use appropriate endpoint based on evaluation type
            if (this.config.evaluationType === 'quick') {
                // Use quick evaluation endpoint
                const quickConfig = {
                    enable_preprocessing: this.config.enablePreprocessing,
                    enable_rule_weighting: this.config.enableRuleWeighting
                };
                
                console.log('📊 Using Quick Evaluation with config:', quickConfig);
                
                response = await fetch(`${this.config.apiBaseUrl}/api/fuzzy/evaluate-quick`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(quickConfig)
                });
            } else {
                // Use enhanced evaluation endpoint
                const evaluationConfig = {
                    evaluation_type: this.config.evaluationType,
                    cross_validation_folds: this.config.cvFolds,
                    bootstrap_samples: this.config.bootstrapSamples,
                    ensemble_size: this.config.ensembleSize,
                    enable_preprocessing: this.config.enablePreprocessing,
                    enable_rule_weighting: this.config.enableRuleWeighting
                };
                
                console.log('📊 Using Enhanced Evaluation with config:', evaluationConfig);
                
                response = await fetch(`${this.config.apiBaseUrl}/api/fuzzy/evaluate-enhanced`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(evaluationConfig)
                });
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const responseData = await response.json();
            console.log('📊 Raw response:', responseData);
            
            // Handle different response formats
            if (responseData.results && responseData.results.aggregated) {
                // Enhanced evaluation format (check this FIRST)
                console.log('🔍 Detected Enhanced Evaluation format');
                console.log('🔍 Aggregated data:', responseData.results.aggregated);
                const aggregated = responseData.results.aggregated;
                this.results = {
                    accuracy: aggregated.accuracy,
                    precision: aggregated.precision,
                    recall: aggregated.recall,
                    f1_score: aggregated.f1_score,
                    confusion_matrix: aggregated.confusion_matrix || [],
                    execution_time: responseData.evaluation_info.execution_time,
                    data_processed: responseData.evaluation_info.total_data,
                    outliers_removed: 0,
                    methods_used: responseData.evaluation_info.methods_used,
                    evaluation_type: this.config.evaluationType,
                    cross_validation: responseData.results.cross_validation,
                    bootstrap: responseData.results.bootstrap,
                    ensemble: responseData.results.ensemble
                };
                console.log('🔍 Parsed results:', this.results);
                console.log('🔍 Confusion matrix:', this.results.confusion_matrix);
            } else if (responseData.results && responseData.evaluation_info) {
                // Quick evaluation format (check this SECOND)
                console.log('🔍 Detected Quick Evaluation format');
                this.results = {
                    accuracy: responseData.results.accuracy,
                    precision: responseData.results.precision,
                    recall: responseData.results.recall,
                    f1_score: responseData.results.f1_score,
                    execution_time: responseData.evaluation_info.execution_time,
                    data_processed: responseData.evaluation_info.total_data,
                    outliers_removed: 0,
                    methods_used: [responseData.evaluation_info.method],
                    confidence_interval: responseData.results.confidence_interval,
                    evaluation_type: 'quick_enhanced'
                };
            } else {
                // Fallback format
                console.log('🔍 Detected Fallback format');
                this.results = {
                    accuracy: responseData.accuracy || 0,
                    precision: responseData.precision || 0,
                    recall: responseData.recall || 0,
                    f1_score: responseData.f1_score || 0,
                    execution_time: responseData.execution_time || 0,
                    data_processed: responseData.data_processed || 0,
                    outliers_removed: responseData.outliers_removed || 0,
                    methods_used: ['evaluation'],
                    evaluation_type: this.config.evaluationType
                };
            }
            
            // Validate results to ensure no undefined values
            console.log('🔍 Before validation:', this.results);
            
            // Only set to 0 if the value is undefined, null, or NaN
            if (this.results.accuracy === undefined || this.results.accuracy === null || isNaN(this.results.accuracy)) {
                this.results.accuracy = 0;
            }
            if (this.results.precision === undefined || this.results.precision === null || isNaN(this.results.precision)) {
                this.results.precision = 0;
            }
            if (this.results.recall === undefined || this.results.recall === null || isNaN(this.results.recall)) {
                this.results.recall = 0;
            }
            if (this.results.f1_score === undefined || this.results.f1_score === null || isNaN(this.results.f1_score)) {
                this.results.f1_score = 0;
            }
            if (this.results.execution_time === undefined || this.results.execution_time === null || isNaN(this.results.execution_time)) {
                this.results.execution_time = 0;
            }
            if (this.results.data_processed === undefined || this.results.data_processed === null || isNaN(this.results.data_processed)) {
                this.results.data_processed = 0;
            }
            if (this.results.outliers_removed === undefined || this.results.outliers_removed === null || isNaN(this.results.outliers_removed)) {
                this.results.outliers_removed = 0;
            }
            if (!this.results.methods_used || !Array.isArray(this.results.methods_used)) {
                this.results.methods_used = ['evaluation'];
            }
            if (!this.results.confidence_interval || !Array.isArray(this.results.confidence_interval)) {
                this.results.confidence_interval = [0, 0];
            }
            
            console.log('🔍 After validation:', this.results);
            
            console.log('✅ Enhanced Evaluation Results:', this.results);

            // Display results
            this.displayResults();
            this.showAlert('Enhanced evaluation berhasil diselesaikan!', 'success');

        } catch (error) {
            console.error('❌ Enhanced Evaluation Error:', error);
            
            // Provide more specific error messages
            let errorMessage = 'Gagal menjalankan enhanced evaluation';
            if (error.message.includes('500')) {
                errorMessage += ': Server error - backend sedang dalam maintenance';
            } else if (error.message.includes('404')) {
                errorMessage += ': Endpoint tidak ditemukan';
            } else if (error.message.includes('network')) {
                errorMessage += ': Koneksi jaringan bermasalah';
            } else {
                errorMessage += ': ' + error.message;
            }
            
            this.showAlert(errorMessage, 'danger');
        } finally {
            this.isRunning = false;
            this.showLoading(false);
        }
    }

    /**
     * Display evaluation results
     */
    displayResults() {
        if (!this.results) return;

        // Update main metrics
        const accuracy = (this.results.accuracy * 100).toFixed(1);
        const precision = (this.results.precision * 100).toFixed(1);
        const recall = (this.results.recall * 100).toFixed(1);
        const f1Score = (this.results.f1_score * 100).toFixed(1);

        document.getElementById('accuracyScore').textContent = accuracy + '%';
        document.getElementById('finalAccuracy').textContent = accuracy + '%';
        document.getElementById('finalPrecision').textContent = precision + '%';
        document.getElementById('finalRecall').textContent = recall + '%';
        document.getElementById('finalF1Score').textContent = f1Score + '%';

        // Update performance metrics
        document.getElementById('executionTime').textContent = this.results.execution_time + 's';
        document.getElementById('dataProcessed').textContent = this.results.data_processed + ' records';
        document.getElementById('outliersRemoved').textContent = this.results.outliers_removed + ' records';

        // Update methods used
        const methodsUsed = document.getElementById('methodsUsed');
        if (methodsUsed && this.results.methods_used) {
            methodsUsed.innerHTML = this.results.methods_used.map(method => 
                `<span class="badge bg-primary me-1">${method}</span>`
            ).join('');
        }

        // Display detailed metrics
        this.displayDetailedMetrics();

        // Create charts
        this.createCharts();

        // Create results table
        this.createResultsTable();

        // Generate recommendations
        this.generateRecommendations();

        // Generate narrative analysis
        this.generateNarrativeAnalysis();

        // Show all result sections
        this.showResults();
    }

    /**
     * Display detailed metrics
     */
    displayDetailedMetrics() {
        const detailedMetrics = document.getElementById('detailedMetrics');
        if (!detailedMetrics || !this.results) return;

        let html = '';

        // Cross-validation results
        if (this.results.cross_validation) {
            const cv = this.results.cross_validation;
            html += `
                <div class="mb-3">
                    <h6><i class="fas fa-layer-group"></i> Cross-Validation Results</h6>
                    <div class="row">
                        <div class="col-md-3">
                            <small>Accuracy</small><br>
                            <strong>${(cv.accuracy * 100).toFixed(1)}% ± ${(cv.std_accuracy * 100).toFixed(1)}%</strong>
                        </div>
                        <div class="col-md-3">
                            <small>Precision</small><br>
                            <strong>${(cv.precision * 100).toFixed(1)}%</strong>
                        </div>
                        <div class="col-md-3">
                            <small>Recall</small><br>
                            <strong>${(cv.recall * 100).toFixed(1)}%</strong>
                        </div>
                        <div class="col-md-3">
                            <small>F1-Score</small><br>
                            <strong>${(cv.f1_score * 100).toFixed(1)}%</strong>
                        </div>
                    </div>
                </div>
            `;
        }

        // Bootstrap results
        if (this.results.bootstrap) {
            const bootstrap = this.results.bootstrap;
            html += `
                <div class="mb-3">
                    <h6><i class="fas fa-random"></i> Bootstrap Results</h6>
                    <div class="row">
                        <div class="col-md-3">
                            <small>Accuracy</small><br>
                            <strong>${(bootstrap.accuracy * 100).toFixed(1)}% ± ${(bootstrap.std_accuracy * 100).toFixed(1)}%</strong>
                        </div>
                        <div class="col-md-3">
                            <small>Confidence Interval</small><br>
                            <strong>${(bootstrap.confidence_interval[0] * 100).toFixed(1)}% - ${(bootstrap.confidence_interval[1] * 100).toFixed(1)}%</strong>
                        </div>
                    </div>
                </div>
            `;
        }

        // Ensemble results
        if (this.results.ensemble) {
            const ensemble = this.results.ensemble;
            html += `
                <div class="mb-3">
                    <h6><i class="fas fa-cubes"></i> Ensemble Results</h6>
                    <div class="row">
                        <div class="col-md-3">
                            <small>Accuracy</small><br>
                            <strong>${(ensemble.accuracy * 100).toFixed(1)}%</strong>
                        </div>
                        <div class="col-md-3">
                            <small>Voting Method</small><br>
                            <strong>${ensemble.voting_method}</strong>
                        </div>
                    </div>
                </div>
            `;
        }

        detailedMetrics.innerHTML = html;
    }

    /**
     * Create visualization charts
     */
    createCharts() {
        // Accuracy comparison chart
        this.createAccuracyChart();
        
        // Confusion matrix chart
        this.createConfusionMatrixChart();
    }

    /**
     * Create accuracy comparison chart
     */
    createAccuracyChart() {
        const ctx = document.getElementById('accuracyChart');
        if (!ctx || !this.results) return;

        // Destroy existing chart
        if (this.charts.accuracy) {
            this.charts.accuracy.destroy();
        }

        const data = [];
        const labels = [];

        // Add different method results
        if (this.results.cross_validation) {
            data.push(this.results.cross_validation.accuracy * 100);
            labels.push('Cross-Validation');
        }

        if (this.results.bootstrap) {
            data.push(this.results.bootstrap.accuracy * 100);
            labels.push('Bootstrap');
        }

        if (this.results.ensemble) {
            data.push(this.results.ensemble.accuracy * 100);
            labels.push('Ensemble');
        }

        // Add final accuracy
        data.push(this.results.accuracy * 100);
        labels.push('Final');

        this.charts.accuracy = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Accuracy (%)',
                    data: data,
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(255, 99, 132, 0.8)'
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
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
                    }
                }
            }
        });
    }

    /**
     * Create confusion matrix chart
     */
    createConfusionMatrixChart() {
        const ctx = document.getElementById('confusionMatrixChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.confusionMatrix) {
            this.charts.confusionMatrix.destroy();
        }

        // Check if confusion matrix exists and is valid
        if (!this.results.confusion_matrix || !Array.isArray(this.results.confusion_matrix) || this.results.confusion_matrix.length === 0) {
            console.log('⚠️ No confusion matrix data available');
            this.createEmptyConfusionMatrixChart(ctx);
            return;
        }

        const confusionMatrix = this.results.confusion_matrix;
        console.log('📊 Creating confusion matrix heatmap with data:', confusionMatrix);
        
        // Create heatmap chart
        this.createConfusionMatrixHeatmap(ctx, confusionMatrix);
    }

    /**
     * Create empty confusion matrix chart
     */
    createEmptyConfusionMatrixChart(ctx) {
        this.charts.confusionMatrix = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['No Data'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['rgba(200, 200, 200, 0.5)'],
                    borderColor: ['rgba(200, 200, 200, 1)'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Confusion matrix data not available';
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Create confusion matrix heatmap
     */
    createConfusionMatrixHeatmap(ctx, confusionMatrix) {
        // Create table-based heatmap instead of chart
        const container = ctx.parentElement;
        const canvas = ctx;
        
        // Hide canvas and create table
        canvas.style.display = 'none';
        
        // Remove existing table if any
        const existingTable = container.querySelector('.confusion-matrix-table');
        if (existingTable) {
            existingTable.remove();
        }
        
        const labels = ['Peluang Lulus Tinggi', 'Peluang Lulus Sedang', 'Peluang Lulus Kecil'];
        const total = confusionMatrix.reduce((sum, row) => sum + row.reduce((rowSum, cell) => rowSum + cell, 0), 0);
        
        // Create table element
        const table = document.createElement('table');
        table.className = 'confusion-matrix-table table table-bordered';
        table.style.width = '100%';
        table.style.marginTop = '20px';
        
        // Create header row
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // Empty cell for top-left corner
        const emptyHeader = document.createElement('th');
        emptyHeader.style.backgroundColor = '#f8f9fa';
        emptyHeader.style.border = '1px solid #dee2e6';
        headerRow.appendChild(emptyHeader);
        
        // Predicted labels header
        labels.forEach(label => {
            const th = document.createElement('th');
            th.textContent = label;
            th.style.backgroundColor = '#e9ecef';
            th.style.border = '1px solid #dee2e6';
            th.style.padding = '10px';
            th.style.textAlign = 'center';
            th.style.fontWeight = 'bold';
            th.style.fontSize = '12px';
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create body
        const tbody = document.createElement('tbody');
        
        confusionMatrix.forEach((row, i) => {
            const tr = document.createElement('tr');
            
            // True label header
            const trueLabelHeader = document.createElement('th');
            trueLabelHeader.textContent = labels[i];
            trueLabelHeader.style.backgroundColor = '#e9ecef';
            trueLabelHeader.style.border = '1px solid #dee2e6';
            trueLabelHeader.style.padding = '10px';
            trueLabelHeader.style.textAlign = 'center';
            trueLabelHeader.style.fontWeight = 'bold';
            trueLabelHeader.style.fontSize = '12px';
            trueLabelHeader.style.verticalAlign = 'middle';
            tr.appendChild(trueLabelHeader);
            
            // Data cells
            row.forEach((value, j) => {
                const td = document.createElement('td');
                const percentage = total > 0 ? (value / total * 100).toFixed(1) : 0;
                const isCorrect = i === j;
                
                // Set background color based on correctness and intensity
                const intensity = Math.min(0.9, Math.max(0.1, value / Math.max(...row)));
                if (isCorrect) {
                    // Green for correct predictions
                    td.style.backgroundColor = `rgba(75, 192, 192, ${intensity})`;
                } else {
                    // Red for incorrect predictions
                    td.style.backgroundColor = `rgba(255, 99, 132, ${intensity})`;
                }
                
                td.style.border = '1px solid #dee2e6';
                td.style.padding = '15px';
                td.style.textAlign = 'center';
                td.style.fontWeight = 'bold';
                td.style.fontSize = '14px';
                td.style.color = intensity > 0.5 ? 'white' : 'black';
                td.style.position = 'relative';
                
                // Add content
                td.innerHTML = `
                    <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">
                        ${value.toFixed(1)}
                    </div>
                    <div style="font-size: 11px; opacity: 0.8;">
                        ${percentage}%
                    </div>
                    <div style="font-size: 10px; margin-top: 3px;">
                        ${isCorrect ? '✅' : '❌'}
                    </div>
                `;
                
                // Add tooltip
                td.title = `${labels[i]} → ${labels[j]}: ${value.toFixed(1)} (${percentage}%) - ${isCorrect ? 'Benar' : 'Salah'}`;
                
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        container.appendChild(table);
        
        // Add legend
        const legend = document.createElement('div');
        legend.className = 'confusion-matrix-legend';
        legend.style.marginTop = '15px';
        legend.style.textAlign = 'center';
        legend.style.fontSize = '12px';
        legend.innerHTML = `
            <div style="display: inline-block; margin-right: 20px;">
                <span style="display: inline-block; width: 20px; height: 20px; background-color: rgba(75, 192, 192, 0.7); border: 1px solid #dee2e6; margin-right: 5px;"></span>
                <span>✅ Prediksi Benar</span>
            </div>
            <div style="display: inline-block;">
                <span style="display: inline-block; width: 20px; height: 20px; background-color: rgba(255, 99, 132, 0.7); border: 1px solid #dee2e6; margin-right: 5px;"></span>
                <span>❌ Prediksi Salah</span>
            </div>
            <div style="margin-top: 5px; color: #6c757d;">
                Intensitas warna menunjukkan jumlah data
            </div>
        `;
        container.appendChild(legend);
        
        // Store reference to table for cleanup
        this.confusionMatrixTable = table;
        this.confusionMatrixLegend = legend;
    }

    /**
     * Create alternative confusion matrix as bar chart
     */
    createConfusionMatrixBarChart(ctx, confusionMatrix) {
        const labels = ['Peluang Lulus Tinggi', 'Peluang Lulus Sedang', 'Peluang Lulus Kecil'];
        
        // Flatten confusion matrix for bar chart
        const flatData = [];
        const flatLabels = [];
        
        for (let i = 0; i < confusionMatrix.length; i++) {
            for (let j = 0; j < confusionMatrix[i].length; j++) {
                flatData.push(confusionMatrix[i][j]);
                flatLabels.push(`${labels[i]} → ${labels[j]}`);
            }
        }

        this.charts.confusionMatrix = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: flatLabels,
                datasets: [{
                    label: 'Count',
                    data: flatData,
                    backgroundColor: flatData.map((value, index) => {
                        const row = Math.floor(index / 3);
                        const col = index % 3;
                        return row === col ? 'rgba(75, 192, 192, 0.8)' : 'rgba(255, 99, 132, 0.8)';
                    }),
                    borderColor: flatData.map((value, index) => {
                        const row = Math.floor(index / 3);
                        const col = index % 3;
                        return row === col ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)';
                    }),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Confusion Matrix Bar Chart',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Count: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Count'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'True Label → Predicted Label'
                        }
                    }
                }
            }
        });
    }

    /**
     * Create confusion matrix as doughnut chart
     */
    createConfusionMatrixDoughnutChart(ctx, confusionMatrix) {
        const labels = ['Peluang Lulus Tinggi', 'Peluang Lulus Sedang', 'Peluang Lulus Kecil'];
        
        // Flatten the confusion matrix for doughnut chart
        const flatData = confusionMatrix.flat();
        console.log('📊 Creating confusion matrix doughnut chart with data:', flatData);

        this.charts.confusionMatrix = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: flatData,
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Confusion Matrix Doughnut Chart',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Initialize confusion matrix chart toggle
     */
    initializeConfusionMatrixToggle() {
        const toggleGroup = document.getElementById('confusionMatrixToggle');
        if (!toggleGroup) return;

        // Add event listeners for radio buttons
        const radioButtons = toggleGroup.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked && this.results && this.results.confusion_matrix) {
                    this.updateConfusionMatrixChart(e.target.value);
                }
            });
        });
    }

    /**
     * Update confusion matrix chart based on selected type
     */
    updateConfusionMatrixChart(chartType) {
        const ctx = document.getElementById('confusionMatrixChart');
        if (!ctx || !this.results.confusion_matrix) return;

        // Clean up existing table if any
        if (this.confusionMatrixTable) {
            this.confusionMatrixTable.remove();
            this.confusionMatrixTable = null;
        }
        if (this.confusionMatrixLegend) {
            this.confusionMatrixLegend.remove();
            this.confusionMatrixLegend = null;
        }

        // Show canvas for chart types
        ctx.style.display = 'block';

        // Destroy existing chart
        if (this.charts.confusionMatrix) {
            this.charts.confusionMatrix.destroy();
        }

        const confusionMatrix = this.results.confusion_matrix;
        console.log(`📊 Updating confusion matrix chart to ${chartType} type`);

        switch (chartType) {
            case 'heatmap':
                this.createConfusionMatrixHeatmap(ctx, confusionMatrix);
                break;
            case 'bar':
                this.createConfusionMatrixBarChart(ctx, confusionMatrix);
                break;
            case 'doughnut':
                this.createConfusionMatrixDoughnutChart(ctx, confusionMatrix);
                break;
            default:
                this.createConfusionMatrixHeatmap(ctx, confusionMatrix);
        }
    }

    /**
     * Create results table
     */
    createResultsTable() {
        const tableBody = document.getElementById('resultsTableBody');
        if (!tableBody || !this.results) return;

        let html = '';

        // Add method results
        if (this.results.cross_validation) {
            const cv = this.results.cross_validation;
            html += `
                <tr>
                    <td><i class="fas fa-layer-group"></i> Cross-Validation</td>
                    <td>${(cv.accuracy * 100).toFixed(1)}%</td>
                    <td>${(cv.precision * 100).toFixed(1)}%</td>
                    <td>${(cv.recall * 100).toFixed(1)}%</td>
                    <td>${(cv.f1_score * 100).toFixed(1)}%</td>
                    <td>${cv.execution_time}s</td>
                </tr>
            `;
        }

        if (this.results.bootstrap) {
            const bootstrap = this.results.bootstrap;
            html += `
                <tr>
                    <td><i class="fas fa-random"></i> Bootstrap</td>
                    <td>${(bootstrap.accuracy * 100).toFixed(1)}%</td>
                    <td>${(bootstrap.precision * 100).toFixed(1)}%</td>
                    <td>${(bootstrap.recall * 100).toFixed(1)}%</td>
                    <td>${(bootstrap.f1_score * 100).toFixed(1)}%</td>
                    <td>${bootstrap.execution_time}s</td>
                </tr>
            `;
        }

        if (this.results.ensemble) {
            const ensemble = this.results.ensemble;
            html += `
                <tr>
                    <td><i class="fas fa-cubes"></i> Ensemble</td>
                    <td>${(ensemble.accuracy * 100).toFixed(1)}%</td>
                    <td>${(ensemble.precision * 100).toFixed(1)}%</td>
                    <td>${(ensemble.recall * 100).toFixed(1)}%</td>
                    <td>${(ensemble.f1_score * 100).toFixed(1)}%</td>
                    <td>${ensemble.execution_time}s</td>
                </tr>
            `;
        }

        // Add final result
        html += `
            <tr class="table-primary">
                <td><strong><i class="fas fa-star"></i> Final Result</strong></td>
                <td><strong>${(this.results.accuracy * 100).toFixed(1)}%</strong></td>
                <td><strong>${(this.results.precision * 100).toFixed(1)}%</strong></td>
                <td><strong>${(this.results.recall * 100).toFixed(1)}%</strong></td>
                <td><strong>${(this.results.f1_score * 100).toFixed(1)}%</strong></td>
                <td><strong>${this.results.execution_time}s</strong></td>
            </tr>
        `;

        tableBody.innerHTML = html;
    }

    /**
     * Generate recommendations based on results
     */
    generateRecommendations() {
        const recommendations = document.getElementById('recommendations');
        if (!recommendations || !this.results) return;

        let html = '';
        const accuracy = this.results.accuracy;

        // Accuracy-based recommendations
        if (accuracy >= 0.85) {
            html += `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle"></i> <strong>Excellent Performance!</strong>
                    Akurasi ${(accuracy * 100).toFixed(1)}% menunjukkan sistem fuzzy berjalan sangat baik.
                </div>
            `;
        } else if (accuracy >= 0.75) {
            html += `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i> <strong>Good Performance</strong>
                    Akurasi ${(accuracy * 100).toFixed(1)}% menunjukkan performa yang baik, namun masih ada ruang untuk peningkatan.
                </div>
            `;
        } else if (accuracy >= 0.65) {
            html += `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i> <strong>Moderate Performance</strong>
                    Akurasi ${(accuracy * 100).toFixed(1)}% menunjukkan performa sedang, pertimbangkan untuk mengoptimasi parameter.
                </div>
            `;
        } else {
            html += `
                <div class="alert alert-danger">
                    <i class="fas fa-times-circle"></i> <strong>Low Performance</strong>
                    Akurasi ${(accuracy * 100).toFixed(1)}% menunjukkan performa rendah, diperlukan optimasi signifikan.
                </div>
            `;
        }

        // General recommendations
        html += `
            <div class="row mt-3">
                <div class="col-md-6">
                    <h6><i class="fas fa-lightbulb"></i> Optimasi yang Disarankan:</h6>
                    <ul>
                        <li>Tingkatkan jumlah data training</li>
                        <li>Optimasi parameter fuzzy membership functions</li>
                        <li>Pertimbangkan feature engineering</li>
                        <li>Gunakan ensemble methods yang lebih kompleks</li>
                    </ul>
                </div>
                <div class="col-md-6">
                    <h6><i class="fas fa-cog"></i> Konfigurasi Optimal:</h6>
                    <ul>
                        <li>Cross-validation folds: 5-10</li>
                        <li>Bootstrap samples: 50-100</li>
                        <li>Ensemble size: 15-30</li>
                        <li>Enable preprocessing dan rule weighting</li>
                    </ul>
                </div>
            </div>
        `;

        recommendations.innerHTML = html;
    }

    /**
     * Generate narrative analysis of evaluation results
     */
    generateNarrativeAnalysis() {
        if (!this.results) return;

        const accuracy = this.results.accuracy;
        const precision = this.results.precision;
        const recall = this.results.recall;
        const f1Score = this.results.f1_score;
        const executionTime = this.results.execution_time;
        const dataProcessed = this.results.data_processed;
        const methodsUsed = this.results.methods_used || [];

        // Performance Summary
        const performanceSummary = document.getElementById('performanceSummary');
        if (performanceSummary) {
            let performanceText = '';
            
            if (accuracy >= 0.85) {
                performanceText = `
                    <p>Model fuzzy menunjukkan <span class="positive">performa yang sangat baik</span> dengan akurasi <span class="metric-value">${(accuracy * 100).toFixed(1)}%</span>. 
                    Hasil ini menunjukkan bahwa sistem fuzzy logic yang diimplementasikan sangat efektif dalam mengklasifikasikan data mahasiswa berdasarkan masa studi.</p>
                    
                    <p>Dengan precision <span class="metric-value">${(precision * 100).toFixed(1)}%</span> dan recall <span class="metric-value">${(recall * 100).toFixed(1)}%</span>, 
                    model ini memiliki <span class="highlight">keseimbangan yang sangat baik</span> antara kemampuan mendeteksi kasus positif dan menghindari false positives.</p>
                `;
            } else if (accuracy >= 0.75) {
                performanceText = `
                    <p>Model fuzzy menunjukkan <span class="positive">performa yang baik</span> dengan akurasi <span class="metric-value">${(accuracy * 100).toFixed(1)}%</span>. 
                    Sistem ini cukup handal dalam mengklasifikasikan data mahasiswa, meskipun masih ada ruang untuk peningkatan.</p>
                    
                    <p>Precision <span class="metric-value">${(precision * 100).toFixed(1)}%</span> menunjukkan bahwa ketika model memprediksi suatu kelas, 
                    kemungkinan besar prediksinya benar. Recall <span class="metric-value">${(recall * 100).toFixed(1)}%</span> menunjukkan 
                    kemampuan model dalam mendeteksi kasus yang seharusnya terdeteksi.</p>
                `;
            } else if (accuracy >= 0.65) {
                performanceText = `
                    <p>Model fuzzy menunjukkan <span class="warning">performa yang sedang</span> dengan akurasi <span class="metric-value">${(accuracy * 100).toFixed(1)}%</span>. 
                    Sistem ini masih dapat digunakan untuk klasifikasi, namun diperlukan optimasi untuk meningkatkan akurasinya.</p>
                    
                    <p>Dengan precision <span class="metric-value">${(precision * 100).toFixed(1)}%</span> dan recall <span class="metric-value">${(recall * 100).toFixed(1)}%</span>, 
                    model ini menunjukkan <span class="warning">keseimbangan yang perlu diperbaiki</span> untuk mencapai performa yang lebih optimal.</p>
                `;
            } else {
                performanceText = `
                    <p>Model fuzzy menunjukkan <span class="warning">performa yang rendah</span> dengan akurasi <span class="metric-value">${(accuracy * 100).toFixed(1)}%</span>. 
                    Sistem ini memerlukan <span class="highlight">optimasi signifikan</span> sebelum dapat digunakan secara efektif untuk klasifikasi.</p>
                    
                    <p>Precision <span class="metric-value">${(precision * 100).toFixed(1)}%</span> dan recall <span class="metric-value">${(recall * 100).toFixed(1)}%</span> 
                    menunjukkan bahwa model mengalami kesulitan dalam membuat prediksi yang akurat dan konsisten.</p>
                `;
            }

            performanceSummary.innerHTML = performanceText;
        }

        // Model Strengths
        const modelStrengths = document.getElementById('modelStrengths');
        if (modelStrengths) {
            let strengthsText = '';
            
            if (precision > 0.7) {
                strengthsText += `<p><span class="positive">✓ Precision Tinggi:</span> Model memiliki kemampuan yang baik dalam menghindari false positives.</p>`;
            }
            if (recall > 0.7) {
                strengthsText += `<p><span class="positive">✓ Recall Tinggi:</span> Model berhasil mendeteksi sebagian besar kasus positif yang ada.</p>`;
            }
            if (f1Score > 0.6) {
                strengthsText += `<p><span class="positive">✓ F1-Score Seimbang:</span> Model menunjukkan keseimbangan yang baik antara precision dan recall.</p>`;
            }
            if (executionTime < 1.0) {
                strengthsText += `<p><span class="positive">✓ Efisien:</span> Model dapat diproses dengan cepat dalam <span class="metric-value">${executionTime.toFixed(3)}s</span>.</p>`;
            }
            if (methodsUsed.length > 1) {
                strengthsText += `<p><span class="positive">✓ Multi-Method:</span> Menggunakan <span class="highlight">${methodsUsed.join(', ')}</span> untuk validasi yang komprehensif.</p>`;
            }
            if (dataProcessed > 1000) {
                strengthsText += `<p><span class="positive">✓ Data Besar:</span> Model dilatih dengan <span class="metric-value">${dataProcessed}</span> data, memberikan basis yang solid.</p>`;
            }

            if (strengthsText === '') {
                strengthsText = `<p><span class="info">Model menunjukkan performa dasar yang dapat dikembangkan lebih lanjut.</span></p>`;
            }

            modelStrengths.innerHTML = strengthsText;
        }

        // Improvement Areas
        const improvementAreas = document.getElementById('improvementAreas');
        if (improvementAreas) {
            let improvementsText = '';
            
            if (precision < 0.7) {
                improvementsText += `<p><span class="warning">⚠ Precision Rendah:</span> Model menghasilkan terlalu banyak false positives. Pertimbangkan untuk mengoptimasi threshold atau feature selection.</p>`;
            }
            if (recall < 0.7) {
                improvementsText += `<p><span class="warning">⚠ Recall Rendah:</span> Model gagal mendeteksi banyak kasus positif. Pertimbangkan untuk menambah data training atau mengubah parameter fuzzy.</p>`;
            }
            if (f1Score < 0.6) {
                improvementsText += `<p><span class="warning">⚠ F1-Score Rendah:</span> Keseimbangan antara precision dan recall perlu diperbaiki.</p>`;
            }
            if (executionTime > 2.0) {
                improvementsText += `<p><span class="warning">⚠ Lambat:</span> Waktu eksekusi <span class="metric-value">${executionTime.toFixed(3)}s</span> terlalu lama. Optimasi algoritma diperlukan.</p>`;
            }
            if (methodsUsed.length === 1) {
                improvementsText += `<p><span class="warning">⚠ Single Method:</span> Pertimbangkan untuk menggunakan multiple validation methods untuk hasil yang lebih robust.</p>`;
            }

            if (improvementsText === '') {
                improvementsText = `<p><span class="positive">Model sudah menunjukkan performa yang baik dengan sedikit ruang untuk peningkatan.</span></p>`;
            }

            improvementAreas.innerHTML = improvementsText;
        }

        // Practical Interpretation
        const practicalInterpretation = document.getElementById('practicalInterpretation');
        if (practicalInterpretation) {
            let interpretationText = '';
            
            if (accuracy >= 0.8) {
                interpretationText = `
                    <p><span class="info">Sistem dapat dipercaya</span> untuk pengambilan keputusan otomatis dalam klasifikasi masa studi mahasiswa. 
                    Akurasi <span class="metric-value">${(accuracy * 100).toFixed(1)}%</span> menunjukkan bahwa dari 100 prediksi, 
                    sekitar ${Math.round(accuracy * 100)} prediksi akan benar.</p>
                    
                    <p>Sistem ini dapat digunakan untuk <span class="highlight">monitoring otomatis</span> dan memberikan peringatan dini 
                    kepada mahasiswa yang berisiko mengalami keterlambatan studi.</p>
                `;
            } else if (accuracy >= 0.7) {
                interpretationText = `
                    <p><span class="info">Sistem dapat digunakan</span> sebagai alat bantu pengambilan keputusan dengan pengawasan manusia. 
                    Akurasi <span class="metric-value">${(accuracy * 100).toFixed(1)}%</span> menunjukkan performa yang cukup baik 
                    untuk mendukung proses pengambilan keputusan.</p>
                    
                    <p>Sistem ini dapat membantu <span class="highlight">mengidentifikasi pola</span> dan memberikan insight 
                    untuk intervensi yang tepat sasaran.</p>
                `;
            } else {
                interpretationText = `
                    <p><span class="warning">Sistem memerlukan pengawasan ketat</span> dan tidak disarankan untuk otomatisasi penuh. 
                    Akurasi <span class="metric-value">${(accuracy * 100).toFixed(1)}%</span> menunjukkan bahwa sistem masih 
                    memerlukan validasi manual sebelum digunakan.</p>
                    
                    <p>Sistem ini lebih cocok sebagai <span class="highlight">alat eksperimen</span> dan pengembangan 
                    untuk memahami pola data mahasiswa.</p>
                `;
            }

            practicalInterpretation.innerHTML = interpretationText;
        }

        // Confusion Matrix Analysis
        const confusionMatrixAnalysis = document.getElementById('confusionMatrixAnalysis');
        if (confusionMatrixAnalysis && this.results.confusion_matrix) {
            const confusionMatrix = this.results.confusion_matrix;
            const labels = ['Peluang Lulus Tinggi', 'Peluang Lulus Sedang', 'Peluang Lulus Kecil'];
            
            // Calculate metrics from confusion matrix
            const total = confusionMatrix.reduce((sum, row) => sum + row.reduce((rowSum, cell) => rowSum + cell, 0), 0);
            const diagonal = confusionMatrix.map((row, i) => row[i]);
            const correctPredictions = diagonal.reduce((sum, val) => sum + val, 0);
            const accuracyFromMatrix = total > 0 ? correctPredictions / total : 0;
            
            // Calculate per-class metrics
            const classMetrics = labels.map((label, i) => {
                const truePositives = confusionMatrix[i][i];
                const falsePositives = confusionMatrix.reduce((sum, row, j) => sum + (j !== i ? row[i] : 0), 0);
                const falseNegatives = confusionMatrix[i].reduce((sum, val, j) => sum + (j !== i ? val : 0), 0);
                
                const precision = (truePositives + falsePositives) > 0 ? truePositives / (truePositives + falsePositives) : 0;
                const recall = (truePositives + falseNegatives) > 0 ? truePositives / (truePositives + falseNegatives) : 0;
                const f1 = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
                
                return {
                    label,
                    truePositives,
                    falsePositives,
                    falseNegatives,
                    precision,
                    recall,
                    f1
                };
            });

            let confusionMatrixText = `
                <div class="confusion-matrix-narrative">
                    <h5><i class="fas fa-table"></i> Analisis Confusion Matrix</h5>
                    
                    <div class="matrix-overview">
                        <p><strong>Overview:</strong> Confusion matrix menunjukkan distribusi prediksi model terhadap kelas sebenarnya. 
                        Diagonal utama (hijau) menunjukkan prediksi yang benar, sedangkan sel off-diagonal (merah) menunjukkan kesalahan klasifikasi.</p>
                        
                        <div class="matrix-stats">
                            <div class="stat-item">
                                <span class="stat-label">Total Data:</span>
                                <span class="stat-value">${total.toFixed(1)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Prediksi Benar:</span>
                                <span class="stat-value positive">${correctPredictions.toFixed(1)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Prediksi Salah:</span>
                                <span class="stat-value warning">${(total - correctPredictions).toFixed(1)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Akurasi dari Matrix:</span>
                                <span class="stat-value">${(accuracyFromMatrix * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="class-analysis">
                        <h6><i class="fas fa-chart-pie"></i> Analisis Per-Kelas:</h6>
            `;

            // Add per-class analysis
            classMetrics.forEach((metric, index) => {
                const performanceLevel = metric.f1 >= 0.8 ? 'excellent' : 
                                       metric.f1 >= 0.6 ? 'good' : 
                                       metric.f1 >= 0.4 ? 'fair' : 'poor';
                
                const performanceText = {
                    'excellent': '<span class="positive">Sangat Baik</span>',
                    'good': '<span class="info">Baik</span>',
                    'fair': '<span class="warning">Sedang</span>',
                    'poor': '<span class="warning">Kurang</span>'
                };

                confusionMatrixText += `
                    <div class="class-metric">
                        <h6 class="class-title">${metric.label}</h6>
                        <div class="metric-details">
                            <div class="metric-row">
                                <span class="metric-label">True Positives:</span>
                                <span class="metric-value positive">${metric.truePositives.toFixed(1)}</span>
                            </div>
                            <div class="metric-row">
                                <span class="metric-label">False Positives:</span>
                                <span class="metric-value warning">${metric.falsePositives.toFixed(1)}</span>
                            </div>
                            <div class="metric-row">
                                <span class="metric-label">False Negatives:</span>
                                <span class="metric-value warning">${metric.falseNegatives.toFixed(1)}</span>
                            </div>
                            <div class="metric-row">
                                <span class="metric-label">Precision:</span>
                                <span class="metric-value">${(metric.precision * 100).toFixed(1)}%</span>
                            </div>
                            <div class="metric-row">
                                <span class="metric-label">Recall:</span>
                                <span class="metric-value">${(metric.recall * 100).toFixed(1)}%</span>
                            </div>
                            <div class="metric-row">
                                <span class="metric-label">F1-Score:</span>
                                <span class="metric-value">${(metric.f1 * 100).toFixed(1)}%</span>
                            </div>
                            <div class="metric-row">
                                <span class="metric-label">Performa:</span>
                                <span class="metric-value">${performanceText[performanceLevel]}</span>
                            </div>
                        </div>
                    </div>
                `;
            });

            // Add pattern analysis
            confusionMatrixText += `
                    </div>
                    
                    <div class="pattern-analysis">
                        <h6><i class="fas fa-search"></i> Analisis Pola Kesalahan:</h6>
            `;

            // Analyze confusion patterns
            const confusionPatterns = [];
            for (let i = 0; i < confusionMatrix.length; i++) {
                for (let j = 0; j < confusionMatrix[i].length; j++) {
                    if (i !== j && confusionMatrix[i][j] > 0) {
                        confusionPatterns.push({
                            from: labels[i],
                            to: labels[j],
                            count: confusionMatrix[i][j],
                            percentage: (confusionMatrix[i][j] / total * 100).toFixed(1)
                        });
                    }
                }
            }

            // Sort by count descending
            confusionPatterns.sort((a, b) => b.count - a.count);

            if (confusionPatterns.length > 0) {
                confusionMatrixText += `
                    <p><strong>Pola Kesalahan Klasifikasi:</strong></p>
                    <ul class="confusion-patterns">
                `;
                
                confusionPatterns.forEach(pattern => {
                    confusionMatrixText += `
                        <li><span class="pattern-item">
                            <strong>${pattern.from}</strong> → <strong>${pattern.to}</strong>: 
                            ${pattern.count.toFixed(1)} kasus (${pattern.percentage}%)
                        </span></li>
                    `;
                });
                
                confusionMatrixText += `</ul>`;
            } else {
                confusionMatrixText += `<p><span class="positive">Tidak ada kesalahan klasifikasi yang signifikan.</span></p>`;
            }

            // Add recommendations based on confusion matrix
            confusionMatrixText += `
                        <div class="matrix-recommendations">
                            <h6><i class="fas fa-lightbulb"></i> Rekomendasi Berdasarkan Confusion Matrix:</h6>
            `;

            // Generate recommendations based on confusion matrix analysis
            const recommendations = [];
            
            // Check for class imbalance
            const classTotals = confusionMatrix.map(row => row.reduce((sum, val) => sum + val, 0));
            const maxClass = Math.max(...classTotals);
            const minClass = Math.min(...classTotals);
            const imbalanceRatio = maxClass / minClass;
            
            if (imbalanceRatio > 3) {
                recommendations.push('Deteksi <strong>class imbalance</strong> yang signifikan. Pertimbangkan teknik sampling atau weighting untuk menyeimbangkan data.');
            }
            
            // Check for systematic errors
            const systematicErrors = confusionPatterns.filter(p => parseFloat(p.percentage) > 5);
            if (systematicErrors.length > 0) {
                recommendations.push('Terdapat <strong>kesalahan sistematis</strong> dalam klasifikasi. Perlu analisis lebih lanjut terhadap feature yang membedakan kelas-kelas tersebut.');
            }
            
            // Check for high precision but low recall
            const lowRecallClasses = classMetrics.filter(m => m.recall < 0.5 && m.precision > 0.7);
            if (lowRecallClasses.length > 0) {
                recommendations.push('Beberapa kelas memiliki <strong>recall rendah</strong> meskipun precision tinggi. Pertimbangkan untuk menambah data training atau mengubah threshold.');
            }
            
            // Check for high recall but low precision
            const lowPrecisionClasses = classMetrics.filter(m => m.precision < 0.5 && m.recall > 0.7);
            if (lowPrecisionClasses.length > 0) {
                recommendations.push('Beberapa kelas memiliki <strong>precision rendah</strong> meskipun recall tinggi. Pertimbangkan untuk mengoptimasi feature selection.');
            }

            if (recommendations.length > 0) {
                recommendations.forEach(rec => {
                    confusionMatrixText += `<p class="recommendation-item">• ${rec}</p>`;
                });
            } else {
                confusionMatrixText += `<p class="positive">Confusion matrix menunjukkan performa yang seimbang tanpa masalah signifikan yang perlu diperbaiki.</p>`;
            }

            confusionMatrixText += `
                        </div>
                    </div>
                </div>
            `;

            confusionMatrixAnalysis.innerHTML = confusionMatrixText;
        }

        // Evaluation Methodology
        const evaluationMethodology = document.getElementById('evaluationMethodology');
        if (evaluationMethodology) {
            let methodologyText = `
                <p>Evaluasi ini menggunakan <span class="highlight">multiple validation methods</span> untuk memastikan hasil yang robust dan reliable:</p>
                
                <ul>
                    <li><strong>Cross-Validation:</strong> Membagi data menjadi ${this.results.cross_validation ? '5' : 'N/A'} folds untuk validasi yang komprehensif</li>
                    <li><strong>Bootstrap Sampling:</strong> Menggunakan ${this.results.bootstrap ? '20' : 'N/A'} samples untuk estimasi interval kepercayaan</li>
                    <li><strong>Ensemble Methods:</strong> Mengkombinasikan ${this.results.ensemble ? '10' : 'N/A'} model untuk hasil yang lebih stabil</li>
                </ul>
                
                <p>Metodologi ini memastikan bahwa hasil evaluasi tidak bias dan dapat digeneralisasi ke data baru.</p>
            `;

            evaluationMethodology.innerHTML = methodologyText;
        }

        // Evaluation Conclusion
        const evaluationConclusion = document.getElementById('evaluationConclusion');
        if (evaluationConclusion) {
            let conclusionText = '';
            
            if (accuracy >= 0.8) {
                conclusionText = `
                    <p><span class="positive">Kesimpulan:</span> Model fuzzy logic menunjukkan <strong>performa yang sangat baik</strong> 
                    dengan akurasi <span class="metric-value">${(accuracy * 100).toFixed(1)}%</span>. 
                    Sistem ini siap untuk digunakan dalam lingkungan produksi dengan kepercayaan tinggi.</p>
                    
                    <p>Rekomendasi: Implementasikan sistem ini untuk <span class="highlight">monitoring otomatis</span> 
                    dan pertimbangkan untuk menambahkan fitur real-time alerting.</p>
                `;
            } else if (accuracy >= 0.7) {
                conclusionText = `
                    <p><span class="info">Kesimpulan:</span> Model fuzzy logic menunjukkan <strong>performa yang baik</strong> 
                    dengan akurasi <span class="metric-value">${(accuracy * 100).toFixed(1)}%</span>. 
                    Sistem ini dapat digunakan dengan pengawasan yang memadai.</p>
                    
                    <p>Rekomendasi: Implementasikan dengan <span class="highlight">validasi manual</span> dan 
                    lakukan monitoring berkala untuk memastikan performa tetap konsisten.</p>
                `;
            } else {
                conclusionText = `
                    <p><span class="warning">Kesimpulan:</span> Model fuzzy logic menunjukkan <strong>performa yang perlu ditingkatkan</strong> 
                    dengan akurasi <span class="metric-value">${(accuracy * 100).toFixed(1)}%</span>. 
                    Sistem ini memerlukan optimasi sebelum dapat digunakan secara efektif.</p>
                    
                    <p>Rekomendasi: Fokus pada <span class="highlight">optimasi parameter</span> dan 
                    pertimbangkan untuk menambah data training atau mengubah arsitektur model.</p>
                `;
            }

            evaluationConclusion.innerHTML = conclusionText;
        }
    }

    /**
     * Export results to different formats
     */
    async exportResults(format) {
        if (!this.results) {
            this.showAlert('Tidak ada hasil untuk diexport', 'warning');
            return;
        }

        try {
            let data, filename, mimeType;

            switch (format) {
                case 'json':
                    data = JSON.stringify(this.results, null, 2);
                    filename = `enhanced_evaluation_results_${new Date().toISOString().split('T')[0]}.json`;
                    mimeType = 'application/json';
                    break;
                    
                case 'excel':
                    // For Excel, we'll create a CSV-like structure
                    const csvData = this.convertToCSV();
                    data = csvData;
                    filename = `enhanced_evaluation_results_${new Date().toISOString().split('T')[0]}.csv`;
                    mimeType = 'text/csv';
                    break;
                    
                case 'pdf':
                    this.showAlert('Export PDF akan segera tersedia', 'info');
                    return;
                    
                default:
                    this.showAlert('Format export tidak didukung', 'warning');
                    return;
            }

            // Create download link
            const blob = new Blob([data], { type: mimeType });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            this.showAlert(`Hasil berhasil diexport ke ${format.toUpperCase()}`, 'success');

        } catch (error) {
            console.error('Export error:', error);
            this.showAlert('Gagal mengexport hasil: ' + error.message, 'danger');
        }
    }

    /**
     * Convert results to CSV format
     */
    convertToCSV() {
        if (!this.results) return '';

        const rows = [
            ['Enhanced Fuzzy Evaluation Results'],
            ['Generated:', new Date().toLocaleString()],
            [''],
            ['Metric', 'Value'],
            ['Accuracy', `${(this.results.accuracy * 100).toFixed(2)}%`],
            ['Precision', `${(this.results.precision * 100).toFixed(2)}%`],
            ['Recall', `${(this.results.recall * 100).toFixed(2)}%`],
            ['F1-Score', `${(this.results.f1_score * 100).toFixed(2)}%`],
            ['Execution Time', `${this.results.execution_time}s`],
            ['Data Processed', this.results.data_processed],
            ['Outliers Removed', this.results.outliers_removed]
        ];

        return rows.map(row => row.join(',')).join('\n');
    }

    /**
     * Share results
     */
    shareResults() {
        if (!this.results) {
            this.showAlert('Tidak ada hasil untuk dibagikan', 'warning');
            return;
        }

        const accuracy = (this.results.accuracy * 100).toFixed(1);
        const text = `Enhanced Fuzzy Evaluation Results: ${accuracy}% accuracy achieved! 🚀`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Enhanced Fuzzy Evaluation Results',
                text: text,
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(text).then(() => {
                this.showAlert('Hasil telah disalin ke clipboard', 'success');
            }).catch(() => {
                this.showAlert('Gagal menyalin hasil', 'danger');
            });
        }
    }

    /**
     * Show loading state
     */
    showLoading(show) {
        const loadingSection = document.getElementById('loadingSection');
        if (loadingSection) {
            loadingSection.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Update loading message
     */
    updateLoadingMessage(message) {
        const loadingMessage = document.getElementById('loadingMessage');
        if (loadingMessage) {
            loadingMessage.textContent = message;
        }
    }

    /**
     * Show results sections
     */
    showResults() {
        const sections = [
            'resultsSection',
            'chartsSection', 
            'tableSection',
            'recommendationsSection',
            'narrativeSection',
            'exportSection'
        ];

        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.style.display = 'block';
            }
        });
    }

    /**
     * Hide results sections
     */
    hideResults() {
        const sections = [
            'resultsSection',
            'chartsSection',
            'tableSection', 
            'recommendationsSection',
            'narrativeSection',
            'exportSection'
        ];

        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.style.display = 'none';
            }
        });
    }

    /**
     * Show alert message
     */
    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert-custom');
        existingAlerts.forEach(alert => alert.remove());

        // Create new alert
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-custom alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Insert at top of container
        const container = document.querySelector('.container-fluid');
        if (container) {
            container.insertBefore(alertDiv, container.firstChild);
        }

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    /**
     * Load configuration from localStorage or use defaults
     */
    loadConfiguration() {
        console.log('🔧 Loading configuration...');
        
        try {
            // Try to load from localStorage
            const savedConfig = localStorage.getItem('enhancedEvaluationConfig');
            if (savedConfig) {
                const parsedConfig = JSON.parse(savedConfig);
                this.config = { ...this.config, ...parsedConfig };
                console.log('✅ Configuration loaded from localStorage');
            } else {
                console.log('ℹ️ Using default configuration');
            }
            
            // Update UI with current configuration
            this.updateConfigurationUI();
            
        } catch (error) {
            console.error('❌ Error loading configuration:', error);
            console.log('ℹ️ Using default configuration due to error');
        }
    }

    /**
     * Save configuration to localStorage
     */
    saveConfiguration() {
        try {
            localStorage.setItem('enhancedEvaluationConfig', JSON.stringify(this.config));
            console.log('✅ Configuration saved to localStorage');
        } catch (error) {
            console.error('❌ Error saving configuration:', error);
        }
    }

    /**
     * Initialize the enhanced evaluation system
     */
    init() {
        console.log('🚀 Initializing Enhanced Evaluation...');
        
        try {
            // Initialize configuration
            this.loadConfiguration();
            
            // Initialize event listeners
            this.initializeEventListeners();
            
            // Update configuration UI
            this.updateConfigurationUI();
            
            console.log('✅ Enhanced Evaluation initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing Enhanced Evaluation:', error);
            this.showAlert('Error initializing Enhanced Evaluation: ' + error.message, 'error');
        }
    }
}

// Create global instance only if not already exists
if (typeof window.EnhancedEvaluation === 'undefined') {
    window.EnhancedEvaluation = new EnhancedEvaluation();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.EnhancedEvaluation;
}