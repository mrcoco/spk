// Definisi routes
const routes = {
    '#dashboard': 'dashboardSection',
    '#mahasiswa': 'mahasiswaSection',
    '#nilai': 'nilaiSection',
    '#program-studi': 'programStudiSection',
    '#fis': 'fisSection',
    '#saw': 'sawSection',
    '#saw-evaluation': 'sawEvaluationSection',
    '#evaluation': 'evaluationSection',
    '#enhanced-evaluation': 'enhancedEvaluationSection',
    '#comparison': 'comparisonSection',
    '#user-guide': 'userGuideSection',
    '#about': 'aboutSection',
    '#users': 'usersSection'
};

// Inisialisasi aplikasi
$(document).ready(function() {
    // Inisialisasi notifikasi dengan error handling
    try {
        if ($("#notification").length > 0) {
            $("#notification").kendoNotification({
                position: {
                    pinned: true,
                    top: 20,
                    right: 20
                },
                autoHideAfter: 5000,
                stacking: "down",
                templates: [
                    {
                        type: "success",
                        template: $("#successTemplate").html()
                    },
                    {
                        type: "error",
                        template: $("#errorTemplate").html()
                    },
                    {
                        type: "warning",
                        template: $("#warningTemplate").html()
                    },
                    {
                        type: "info",
                        template: $("#infoTemplate").html()
                    }
                ]
            });
            console.log("Kendo Notification berhasil diinisialisasi");
        } else {
            console.error("Elemen #notification tidak ditemukan");
        }
    } catch (error) {
        console.error("Error saat inisialisasi Kendo Notification:", error);
    }

    // Inisialisasi router
    const router = new Router(routes);

    // Inisialisasi SAW Evaluation module
    try {
        if (typeof SAWEvaluation !== 'undefined') {
            window.sawEvaluation = new SAWEvaluation();
            console.log('SAW Evaluation module initialized successfully');
        } else {
            console.warn('SAW Evaluation module not found');
        }
    } catch (error) {
        console.error('Error initializing SAW Evaluation module:', error);
    }

    // Toggle menu
    $('#toggleMenu').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        $('body').toggleClass('drawer-expanded');
    });

    // Handle menu clicks
    $('.nav-link').click(function(e) {
        const $link = $(this);
        const $menuItem = $link.parent('.nav-item');
        
        console.log('Menu clicked:', $link.attr('href'), 'Parent has submenu:', $menuItem.hasClass('has-submenu'));
        
        if ($menuItem.hasClass('has-submenu')) {
            e.preventDefault();
            e.stopPropagation();
            $menuItem.toggleClass('expanded');
            $menuItem.find('.submenu').slideToggle(300);
            
            console.log('Submenu toggled. Expanded:', $menuItem.hasClass('expanded'), 'Submenu visible:', $menuItem.find('.submenu').is(':visible'));
            
            // Tutup submenu lain yang terbuka
            $('.has-submenu').not($menuItem).removeClass('expanded')
                .find('.submenu').slideUp(300);
        } else {
            const route = $link.attr('href');
            if (route && route.startsWith('#')) {
                e.preventDefault();
                console.log('Navigating to route:', route);
                
                // Jika di mobile, tutup drawer setelah item menu diklik
                if ($(window).width() <= 768) {
                    $('body').removeClass('drawer-expanded');
                }
                
                // Navigate to route
                router.navigateTo(route.slice(1)); // Remove # from route
            }
        }
    });

    // Handle click pada overlay dan outside drawer di mobile
    $('.drawer-overlay, .content-wrapper').click(function(e) {
        if ($(window).width() <= 768 && $('body').hasClass('drawer-expanded')) {
            $('body').removeClass('drawer-expanded');
        }
    });

    // Inisialisasi komponen dashboard dengan delay untuk memastikan Kendo Notification siap
    setTimeout(() => {
        if (typeof initializeDashboardStats === 'function') {
            initializeDashboardStats();
        }
    }, 100); // Delay 100ms untuk memastikan Kendo Notification sudah diinisialisasi
});

// Fungsi untuk menampilkan notifikasi dengan retry mechanism
function showNotification(title, message, type) {
    const notification = $("#notification").data("kendoNotification");
    if (notification) {
        notification.show({
            title: title,
            message: message
        }, type);
    } else {
        // Retry mechanism - tunggu sebentar dan coba lagi
        setTimeout(() => {
            const retryNotification = $("#notification").data("kendoNotification");
            if (retryNotification) {
                retryNotification.show({
                    title: title,
                    message: message
                }, type);
            } else {
                // Fallback jika Kendo Notification belum siap setelah retry
                console.warn("Kendo Notification belum diinisialisasi setelah retry, menggunakan alert sebagai fallback");
                alert(`${title}: ${message}`);
            }
        }, 50); // Retry setelah 50ms
    }
}

// Fungsi untuk refresh data grid
function refreshGrid(gridId) {
    $(gridId).data("kendoGrid").dataSource.read();
}

// Fungsi untuk menutup toast notification
function closeToast(toastElement) {
    if (toastElement && toastElement.classList.contains('toast-notification')) {
        toastElement.style.animation = 'toastSlideOut 0.3s ease-in forwards';
        setTimeout(() => {
            if (toastElement.parentNode) {
                toastElement.parentNode.removeChild(toastElement);
            }
        }, 300);
    }
}