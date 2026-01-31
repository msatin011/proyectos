function getAhora(formato) {
    var t = new Date();
    var f;
    switch (formato) {
        case 14:
            f = `${t.getFullYear()}${String(t.getMonth() + 1).padStart(2, '0')}${String(t.getDate()).padStart(2, '0')}${String(t.getHours()).padStart(2, '0')}${String(t.getMinutes()).padStart(2, '0')}${String(t.getSeconds()).padStart(2, '0')}`;
            break;
        case 12:
            f = `${t.getFullYear()}${String(t.getMonth() + 1).padStart(2, '0')}${String(t.getDate()).padStart(2, '0')}${String(t.getHours()).padStart(2, '0')}${String(t.getMinutes()).padStart(2, '0')}`;
            break;
        default:
            f = `${String(t.getDate()).padStart(2, '0')}/${String(t.getMonth() + 1).padStart(2, '0')}/${t.getFullYear()} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`;
            break;
    }
    return f;
}

function sumaMS(a, mm, ss) {
    try {
        var an = parseInt(a.substring(0, 4)).toString();
        var me = parseInt(a.substring(4, 6)).toString();
        if (me.length == 1) me = '0' + me;
        var d = parseInt(a.substring(6, 8)).toString();
        if (d.length == 1) d = '0' + d
        var h = a.substring(8, 10);
        var m = parseInt(a.substring(10, 12));
        var s = parseInt(a.substring(12, 14));

        s += parseInt(ss);
        if (s > 60) {
            m++;
            s = s - 60;
        }
        m += parseInt(mm);
        if (m > 60) {
            h++; mm
            m = m - 60
        }
        h = h.toString();
        if (h.length == 1) h = '0' + h;
        m = m.toString();
        if (m.length == 1) m = '0' + m;
        s = s.toString();
        if (s.length == 1) s = '0' + s;

        return an + me + d + h + m + s;
    }
    catch (e) { return "" }
}


function sumaHMS(a, hh, mm, ss) {
    try {
        var an = parseInt(a.substring(0, 4)).toString();
        var me = parseInt(a.substring(4, 6)).toString();
        if (me.length == 1) me = '0' + me;
        var d = parseInt(a.substring(6, 8)).toString();
        if (d.length == 1) d = '0' + d
        var h = a.substring(8, 10);
        var m = parseInt(a.substring(10, 12));
        var s = parseInt(a.substring(12, 14));

        s += parseInt(ss);
        if (s > 60) {
            m++;
            s = s - 60;
        }
        m += parseInt(mm);
        if (m > 60) {
            h++; mm
            m = m - 60
        }

        h = parseInt(h) + hh;

        if (h > 24) {
            d = parseInt(d) + 1;
            h = h - 24;
            d = d.toString();
            if (d.length == 1) d = '0' + d;
        }

        h = h.toString();
        if (h.length == 1) h = '0' + h;
        m = m.toString();
        if (m.length == 1) m = '0' + m;
        s = s.toString();
        if (s.length == 1) s = '0' + s;

        return an + me + d + h + m + s;
    }
    catch (e) { return "" }
}

function restaDias(fechaAAAAMMDD, dias) {
    const año = fechaAAAAMMDD.substring(0, 4);
    const mes = fechaAAAAMMDD.substring(4, 6);
    const dia = fechaAAAAMMDD.substring(6, 8);
    const fecha = new Date(año, mes - 1, dia);
    fecha.setDate(fecha.getDate() - dias);
    const nuevaFecha = fecha.getFullYear() +
        String(fecha.getMonth() + 1).padStart(2, '0') +
        String(fecha.getDate()).padStart(2, '0');

    return nuevaFecha;
}
function restaHMS(a, hh, mm, ss) {
    try {
        var an = parseInt(a.substring(0, 4)).toString();
        var me = parseInt(a.substring(4, 6)).toString();
        if (me.length == 1) me = '0' + me;
        var d = parseInt(a.substring(6, 8)).toString();
        if (d.length == 1) d = '0' + d
        var h = a.substring(8, 10);
        var m = parseInt(a.substring(10, 12));
        var s = parseInt(a.substring(12, 14));

        s -= parseInt(ss);
        if (s < 0) {
            m--;
            s = s + 60;
        }
        m -= parseInt(mm);
        if (m < 0) {

            h--;
            m = m + 60
        }

        h = parseInt(h) - hh;

        if (h < 0) {
            d = parseInt(d) - 1;
            h = h + 24;
            d = d.toString();
            if (d.length == 1) d = '0' + d;
        }

        h = h.toString();
        if (h.length == 1) h = '0' + h;
        m = m.toString();
        if (m.length == 1) m = '0' + m;
        s = s.toString();
        if (s.length == 1) s = '0' + s;

        return an + me + d + h + m + s;
    }
    catch (e) { return "" }
}

module.exports = {
    getAhora,
    sumaMS,
    sumaHMS,
    restaHMS,
    restaDias,
};