(function () {
  'use strict';

  var data = HomeServiceData.load();

  var sideLinks = document.querySelectorAll('.side-link[data-view]');
  var views = document.querySelectorAll('.admin-view');

  function switchView(name) {
    sideLinks.forEach(function (l) { l.classList.toggle('active', l.dataset.view === name); });
    views.forEach(function (v) { v.classList.toggle('active', v.id === 'view-' + name); });
    if (name === 'dashboard') renderDashboard();
    if (name === 'staff') renderStaff();
    if (name === 'bookings') renderBookings();
  }

  sideLinks.forEach(function (l) {
    l.addEventListener('click', function () { switchView(l.dataset.view); });
  });

  document.getElementById('btnResetData').addEventListener('click', function () {
    if (!confirm('确定要重置成示例数据吗？这会清空你新增/修改的所有内容。')) return;
    data = HomeServiceData.reset();
    switchView('dashboard');
  });

  // ---------- Shared helpers ----------
  function staffName(id) {
    var s = data.staff.find(function (x) { return x.id === id; });
    return s ? s.name : '（已删除人员）';
  }

  function statusLabel(s) {
    return { pending: '待确认', confirmed: '已确认', cancelled: '已取消' }[s] || s;
  }

  function staffStatusLabel(s) {
    return { available: '空闲', busy: '较忙' }[s] || s;
  }

  // ---------- Dashboard ----------
  function renderDashboard() {
    var pendingCount = data.bookings.filter(function (b) { return b.status === 'pending'; }).length;
    var confirmedCount = data.bookings.filter(function (b) { return b.status === 'confirmed'; }).length;

    var now = new Date();
    var ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    var monthRevenue = data.bookings
      .filter(function (b) { return b.status === 'confirmed' && b.date.slice(0, 7) === ym; })
      .reduce(function (sum, b) {
        var s = data.staff.find(function (x) { return x.id === b.staffId; });
        var rate = s ? s.rate : 0;
        return sum + rate * HomeServiceData.durationHours(b.startTime, b.endTime);
      }, 0);

    var stats = [
      { label: '服务人员总数', value: data.staff.length },
      { label: '待确认订单', value: pendingCount },
      { label: '已确认订单', value: confirmedCount },
      { label: '本月确认收入', value: '¥' + monthRevenue },
    ];
    document.getElementById('statGrid').innerHTML = stats.map(function (s) {
      return '<div class="stat-card"><div class="num">' + s.value + '</div><div class="label">' + s.label + '</div></div>';
    }).join('');

    var recent = data.bookings.slice().sort(function (a, b) { return b.createdAt < a.createdAt ? -1 : 1; }).slice(0, 5);
    document.getElementById('recentBookingsBody').innerHTML = recent.map(function (b) {
      return '<tr><td>' + b.customerName + '</td><td>' + staffName(b.staffId) + '</td><td>' + b.date + '</td>' +
        '<td><span class="badge ' + b.status + '">' + statusLabel(b.status) + '</span></td></tr>';
    }).join('') || '<tr><td colspan="4" style="color:var(--muted)">暂无订单</td></tr>';
  }

  // ---------- Staff ----------
  var staffModalBackdrop = document.getElementById('staffModalBackdrop');
  var staffModalTitle = document.getElementById('staffModalTitle');
  var staffModalMsg = document.getElementById('staffModalMsg');
  var staffForm = document.getElementById('staffForm');
  var staffIdInput = document.getElementById('staffIdInput');
  var staffNameInput = document.getElementById('staffNameInput');
  var staffTypeInput = document.getElementById('staffTypeInput');
  var staffRateInput = document.getElementById('staffRateInput');
  var staffSkillsInput = document.getElementById('staffSkillsInput');
  var staffStatusInput = document.getElementById('staffStatusInput');
  var staffBioInput = document.getElementById('staffBioInput');

  var PALETTE = ['linear-gradient(135deg,#19B8D4,#3ED598)', 'linear-gradient(135deg,#EC4899,#7C3AED)', 'linear-gradient(135deg,#F59E0B,#8B5CF6)', 'linear-gradient(135deg,#3ED598,#19B8D4)', 'linear-gradient(135deg,#8B5CF6,#19B8D4)'];

  function renderStaff() {
    document.getElementById('staffBody').innerHTML = data.staff.map(function (s) {
      return '<tr><td>' + s.name + '</td><td>' + s.type + '</td><td>¥' + s.rate + '/时</td>' +
        '<td>' + s.skills.map(function (t) { return '<span class="tag">' + t + '</span>'; }).join('') + '</td>' +
        '<td><span class="badge ' + s.status + '">' + staffStatusLabel(s.status) + '</span></td>' +
        '<td class="table-actions">' +
        '<button class="btn btn-sm" data-edit="' + s.id + '">编辑</button>' +
        '<button class="btn btn-sm btn-danger" data-delete="' + s.id + '">删除</button>' +
        '</td></tr>';
    }).join('') || '<tr><td colspan="6" style="color:var(--muted)">暂无服务人员</td></tr>';

    document.querySelectorAll('[data-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () { openStaffModal(btn.dataset.edit); });
    });
    document.querySelectorAll('[data-delete]').forEach(function (btn) {
      btn.addEventListener('click', function () { deleteStaff(btn.dataset.delete); });
    });
  }

  function openStaffModal(id) {
    staffModalMsg.innerHTML = '';
    staffForm.reset();
    if (id) {
      var s = data.staff.find(function (x) { return x.id === id; });
      staffModalTitle.textContent = '编辑服务人员';
      staffIdInput.value = s.id;
      staffNameInput.value = s.name;
      staffTypeInput.value = s.type;
      staffRateInput.value = s.rate;
      staffSkillsInput.value = s.skills.join(',');
      staffStatusInput.value = s.status;
      staffBioInput.value = s.bio || '';
    } else {
      staffModalTitle.textContent = '新增服务人员';
      staffIdInput.value = '';
      staffStatusInput.value = 'available';
    }
    staffModalBackdrop.classList.add('show');
  }

  document.getElementById('btnAddStaff').addEventListener('click', function () { openStaffModal(null); });
  document.getElementById('btnCloseStaffModal').addEventListener('click', function () { staffModalBackdrop.classList.remove('show'); });
  staffModalBackdrop.addEventListener('click', function (e) { if (e.target === staffModalBackdrop) staffModalBackdrop.classList.remove('show'); });

  staffForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = staffNameInput.value.trim();
    var type = staffTypeInput.value.trim();
    var rate = parseFloat(staffRateInput.value);
    var skills = staffSkillsInput.value.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
    var status = staffStatusInput.value;
    var bio = staffBioInput.value.trim();

    if (!name || !type || !(rate > 0)) {
      staffModalMsg.innerHTML = '<div class="msg error">请完整填写姓名、服务类型和时薪，时薪需大于 0。</div>';
      return;
    }

    var id = staffIdInput.value;
    if (id) {
      var s = data.staff.find(function (x) { return x.id === id; });
      s.name = name; s.type = type; s.rate = rate; s.skills = skills; s.status = status; s.bio = bio;
    } else {
      data.staff.push({
        id: HomeServiceData.uid('s'), name: name, type: type, rate: rate, skills: skills,
        status: status, bio: bio, color: PALETTE[data.staff.length % PALETTE.length],
      });
    }
    HomeServiceData.save(data);
    staffModalBackdrop.classList.remove('show');
    renderStaff();
  });

  function deleteStaff(id) {
    if (!confirm('确定删除这位服务人员吗？关联的订单记录会保留但会显示"已删除人员"。')) return;
    data.staff = data.staff.filter(function (s) { return s.id !== id; });
    HomeServiceData.save(data);
    renderStaff();
  }

  // ---------- Bookings ----------
  var currentFilter = 'all';
  document.querySelectorAll('#bookingFilters .filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      currentFilter = btn.dataset.status;
      document.querySelectorAll('#bookingFilters .filter-btn').forEach(function (b) { b.classList.toggle('active', b === btn); });
      renderBookings();
    });
  });

  function renderBookings() {
    var list = currentFilter === 'all' ? data.bookings : data.bookings.filter(function (b) { return b.status === currentFilter; });
    document.getElementById('bookingsBody').innerHTML = list.map(function (b) {
      var actions = '';
      if (b.status === 'pending') {
        actions = '<button class="btn btn-sm" data-confirm="' + b.id + '">确认</button> <button class="btn btn-sm btn-danger" data-cancel="' + b.id + '">取消</button>';
      } else if (b.status === 'confirmed') {
        actions = '<button class="btn btn-sm btn-danger" data-cancel="' + b.id + '">取消</button>';
      } else {
        actions = '<span style="color:var(--muted);font-size:12px">-</span>';
      }
      return '<tr><td>' + staffName(b.staffId) + '</td><td>' + b.customerName + '</td><td>' + b.phone + '</td><td>' + b.date + '</td>' +
        '<td>' + b.startTime + '-' + b.endTime + '</td><td>' + b.address + '</td>' +
        '<td><span class="badge ' + b.status + '">' + statusLabel(b.status) + '</span></td>' +
        '<td class="table-actions">' + actions + '</td></tr>';
    }).join('') || '<tr><td colspan="8" style="color:var(--muted)">暂无订单</td></tr>';

    document.querySelectorAll('[data-confirm]').forEach(function (btn) {
      btn.addEventListener('click', function () { setBookingStatus(btn.dataset.confirm, 'confirmed'); });
    });
    document.querySelectorAll('[data-cancel]').forEach(function (btn) {
      btn.addEventListener('click', function () { setBookingStatus(btn.dataset.cancel, 'cancelled'); });
    });
  }

  function setBookingStatus(id, status) {
    if (status === 'cancelled' && !confirm('确定要取消这个订单吗？')) return;
    var b = data.bookings.find(function (x) { return x.id === id; });
    if (!b) return;
    b.status = status;
    HomeServiceData.save(data);
    renderBookings();
  }

  switchView('dashboard');
})();
