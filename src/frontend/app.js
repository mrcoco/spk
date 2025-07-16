// Definisi routes
const routes = {
    '#dashboard': 'dashboardSection',
    '#mahasiswa': 'mahasiswaSection',
    '#nilai': 'nilaiSection',
    '#fis': 'fisSection',
    '#saw': 'sawSection',
    '#comparison': 'comparisonSection'
};

// Inisialisasi aplikasi
$(document).ready(function() {
    // Inisialisasi notifikasi
    $("#notification").kendoNotification({
        position: {
            pinned: true,
            top: 30,
            right: 30
        },
        autoHideAfter: 3000,
        stacking: "down",
        templates: [
            {
                type: "success",
                template: "<div class='notification-success'><span class='k-icon k-i-check'></span><h4>#= title #</h4><p>#= message #</p></div>"
            },
            {
                type: "error",
                template: "<div class='notification-error'><span class='k-icon k-i-close'></span><h4>#= title #</h4><p>#= message #</p></div>"
            },
            {
                type: "warning",
                template: "<div class='notification-warning'><span class='k-icon k-i-warning'></span><h4>#= title #</h4><p>#= message #</p></div>"
            },
            {
                type: "info",
                template: "<div class='notification-info'><span class='k-icon k-i-info'></span><h4>#= title #</h4><p>#= message #</p></div>"
            }
        ]
    });

    // Inisialisasi router
    const router = new Router(routes);

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
        
        if ($menuItem.hasClass('has-submenu')) {
            e.preventDefault();
            e.stopPropagation();
            $menuItem.toggleClass('expanded');
            $menuItem.find('.submenu').slideToggle(300);
            
            // Tutup submenu lain yang terbuka
            $('.has-submenu').not($menuItem).removeClass('expanded')
                .find('.submenu').slideUp(300);
        } else {
            const route = $link.attr('href');
            if (route && route.startsWith('#')) {
                e.preventDefault();
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

    // Inisialisasi komponen dashboard
    if (typeof initializeDashboardStats === 'function') {
        initializeDashboardStats();
    }
});

// Fungsi untuk menampilkan notifikasi
function showNotification(title, message, type) {
    $("#notification").data("kendoNotification").show({
        title: title,
        message: message
    }, type);
}

// Fungsi untuk refresh data grid
function refreshGrid(gridId) {
    $(gridId).data("kendoGrid").dataSource.read();
}