// Comparison Section Refactor: hanya update elemen yang sudah ada di index.html

// Inisialisasi Comparison Section
function initializeComparison() {
    loadComparisonData();
    setupComparisonEventListeners();
}

// Ambil data perbandingan dari API
function loadComparisonData() {
    showComparisonLoading();
    $.ajax({
        url: CONFIG.getApiUrl('/api/comparison/methods'),
        method: 'GET',
        success: function(response) {
            hideComparisonLoading();
            if (response.status === 'success') {
                // Simpan response lengkap untuk akses data
                window._comparisonResponse = response;
                window._comparisonData = response.comparison_data;
                
                updateComparisonStats(response.statistics);
                updateComparisonChart(response.fis_distribution, response.saw_distribution);
                updateComparisonTable(response.comparison_data);
            } else {
                showComparisonError("Format data tidak valid");
            }
        },
        error: function() {
            hideComparisonLoading();
            showComparisonError("Gagal memuat data perbandingan");
        }
    });
}

// Loading state: hanya update isi .comparison-container
function showComparisonLoading() {
    $(".comparison-container").find('.comparison-card, .comparison-chart-container, .table-responsive').css('opacity', 0.5);
    $(".comparison-container").append('<div class="comparison-loading" style="text-align:center;padding:30px;">' +
        '<i class="fas fa-spinner fa-spin fa-2x"></i><br>Memuat data perbandingan...</div>');
}
function hideComparisonLoading() {
    $(".comparison-loading").remove();
    $(".comparison-container").find('.comparison-card, .comparison-chart-container, .table-responsive').css('opacity', 1);
}
function showComparisonError(message) {
    $(".comparison-container").find('.comparison-card, .comparison-chart-container, .table-responsive').css('opacity', 0.5);
    $(".comparison-container").append('<div class="comparison-error" style="color:#c00;text-align:center;padding:30px;">' +
        '<i class="fas fa-exclamation-triangle"></i> ' + message + '</div>');
}

// Update statistik ke elemen yang sudah ada
function updateComparisonStats(stats) {
    // Gunakan total_mahasiswa dari response utama jika total_fis/total_saw tidak ada
    const totalMahasiswa = window._comparisonResponse?.total_mahasiswa || 0;
    
    console.log('Comparison stats update:', {
        stats: stats,
        totalMahasiswa: totalMahasiswa,
        response: window._comparisonResponse
    });
    
    $('#fisTotal').text(stats.total_fis || totalMahasiswa || 0);
    $('#fisAkurasi').text((stats.accuracy_percentage || 0) + '%');
    $('#sawTotal').text(stats.total_saw || totalMahasiswa || 0);
    $('#sawAkurasi').text((stats.accuracy_percentage || 0) + '%');
    
    // Update statistik tambahan
    $('#statConsistent').text(stats.total_consistent || 0);
    $('#statDifferent').text(stats.total_different || 0);
    $('#statCorrelation').text((stats.ranking_correlation || 0).toFixed(3));
    
    console.log('Updated elements:', {
        fisTotal: $('#fisTotal').text(),
        sawTotal: $('#sawTotal').text()
    });
}

// Update chart ke elemen yang sudah ada
function updateComparisonChart(fisDist, sawDist) {
    const categories = Object.keys(fisDist);
    const fisValues = Object.values(fisDist);
    const sawValues = Object.values(sawDist);
    $('#comparisonChart').empty();
    $('#comparisonChart').kendoChart({
        title: { text: "Perbandingan Distribusi Klasifikasi FIS vs SAW" },
        legend: { position: "bottom" },
        chartArea: { background: "" },
        series: [
            { type: "column", name: "FIS", data: fisValues, color: "#3498db" },
            { type: "column", name: "SAW", data: sawValues, color: "#e74c3c" }
        ],
        valueAxis: {
            labels: { format: "{0}" },
            line: { visible: false },
            axisCrossingValue: 0
        },
        categoryAxis: {
            categories: categories.map(cat => cat.replace("Peluang Lulus ", "")),
            line: { visible: false },
            labels: { padding: { top: 10 } }
        },
        tooltip: {
            visible: true,
            format: "{0}: {1} mahasiswa",
            template: "#= category #: #= value # mahasiswa (#= series.name #)"
        }
    });
}

// Update tabel ke <tbody id="comparisonTableBody">
function updateComparisonTable(data) {
    const tbody = $('#comparisonTableBody');
    tbody.empty();
    if (!data || data.length === 0) {
        tbody.append('<tr><td colspan="5" style="text-align:center;color:#888;">Tidak ada data</td></tr>');
        return;
    }
    data.forEach(function(item) {
        const consistentIcon = item.is_consistent ?
            '<i class="fas fa-check text-success"></i>' :
            '<i class="fas fa-times text-danger"></i>';
        const row = `<tr class="${item.is_consistent ? 'consistent' : 'different'}">
            <td>${item.nim}</td>
            <td>${item.nama}</td>
            <td><span class="result-category fis-category">${item.fis_kategori}</span> <span class="result-value">${item.fis_nilai}</span></td>
            <td><span class="result-category saw-category">${item.saw_kategori}</span> <span class="result-value">${item.saw_nilai}</span></td>
            <td><div class="selisih-cell">${consistentIcon} <span class="selisih-value">${item.nilai_selisih}</span> <span class="selisih-category">${item.selisih_category}</span></div></td>
        </tr>`;
        tbody.append(row);
    });
}

// Filter dan refresh
function setupComparisonEventListeners() {
    $('#comparisonFilter').off('change').on('change', function() {
        const filter = $(this).val();
        let data = window._comparisonData || [];
        if (filter === 'consistent') {
            data = data.filter(d => d.is_consistent);
        } else if (filter === 'different') {
            data = data.filter(d => !d.is_consistent);
        }
        updateComparisonTable(data);
    });
    $('.refresh-comparison').off('click').on('click', function() {
        loadComparisonData();
    });
}

// Inisialisasi saat section comparison ditampilkan
$(document).ready(function() {
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.id === 'comparisonSection' && mutation.target.style.display !== 'none') {
                initializeComparison();
            }
        });
    });
    const comparisonSection = document.getElementById('comparisonSection');
    if (comparisonSection) {
        observer.observe(comparisonSection, { attributes: true, attributeFilter: ['style'] });
        if (comparisonSection.style.display !== 'none') {
            initializeComparison();
        }
    }
}); 