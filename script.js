(function () {
  'use strict';

  var staffGrid = document.getElementById('staffGrid');
  var modalBackdrop = document.getElementById('modalBackdrop');
  var btnCloseModal = document.getElementById('btnCloseModal');
  var modalStaffName = document.getElementById('modalStaffName');
  var modalStaffMeta = document.getElementById('modalStaffMeta');
  var busySlots = document.getElementById('busySlots');
  var modalMsg = document.getElementById('modalMsg');
  var bookingForm = document.getElementById('bookingForm');
  var customerNameInput = document.getElementById('customerNameInput');
  var phoneInput = document.getElementById('phoneInput');
  var dateInput = document.getElementById('dateInput');
  var startTimeInput = document.getElementById('startTimeInput');
  var endTimeInput = document.getElementById('endTimeInput');
  var addressInput = document.getElementById('addressInput');
  var notesInput = document.getElementById('notesInput');

  var data = HomeServiceData.load();
  var currentStaff = null;

  var STATUS_LABEL = { available: '空闲', busy: '较忙' };

  function renderGrid() {
    staffGrid.innerHTML = data.staff.map(function (s) {
      return '<div class="staff-card" data-id="' + s.id + '">' +
        '<div class="staff-card__img" style="background:' + s.color + '">' +
          '<span class="status-pill ' + s.status + '">' + STATUS_LABEL[s.status] + '</span>' +
        '</div>' +
        '<div class="staff-card__body">' +
        '<h3>' + s.name + ' · ' + s.type + '</h3>' +
        '<div class="tag-list">' + s.skills.map(function (t) { return '<span class="tag">' + t + '</span>'; }).join('') + '</div>' +
        '<p class="staff-card__bio">' + s.bio + '</p>' +
        '<div class="staff-card__price">¥' + s.rate + ' <span>/ 小时</span></div>' +
        '</div></div>';
    }).join('');

    staffGrid.querySelectorAll('.staff-card').forEach(function (card) {
      card.addEventListener('click', function () {
        openModal(card.dataset.id);
      });
    });
  }

  function confirmedBookingsFor(staffId) {
    return data.bookings.filter(function (b) {
      return b.staffId === staffId && b.status === 'confirmed';
    });
  }

  function openModal(staffId) {
    currentStaff = data.staff.find(function (s) { return s.id === staffId; });
    if (!currentStaff) return;

    modalStaffName.textContent = currentStaff.name + ' · ' + currentStaff.type;
    modalStaffMeta.textContent = '¥' + currentStaff.rate + '/小时 · ' + currentStaff.skills.join('、');

    var booked = confirmedBookingsFor(staffId).slice().sort(function (a, b) {
      return a.date === b.date ? (a.startTime < b.startTime ? -1 : 1) : (a.date < b.date ? -1 : 1);
    });
    busySlots.innerHTML = '<strong>已确认的忙碌时段：</strong> ' + (booked.length
      ? booked.map(function (b) { return b.date + ' ' + b.startTime + '-' + b.endTime; }).join('，')
      : '暂无，随时可约');

    modalMsg.innerHTML = '';
    bookingForm.reset();
    modalBackdrop.classList.add('show');
  }

  function closeModal() {
    modalBackdrop.classList.remove('show');
    currentStaff = null;
  }

  btnCloseModal.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', function (e) {
    if (e.target === modalBackdrop) closeModal();
  });

  bookingForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!currentStaff) return;

    var name = customerNameInput.value.trim();
    var phone = phoneInput.value.trim();
    var date = dateInput.value;
    var startTime = startTimeInput.value;
    var endTime = endTimeInput.value;
    var address = addressInput.value.trim();
    var notes = notesInput.value.trim();

    if (!name) return showMsg('请填写姓名。', true);
    if (!phone) return showMsg('请填写手机号。', true);
    if (!date) return showMsg('请选择服务日期。', true);
    if (!startTime || !endTime) return showMsg('请选择开始和结束时间。', true);
    if (endTime <= startTime) return showMsg('结束时间必须晚于开始时间。', true);
    if (!address) return showMsg('请填写服务地址。', true);

    var overlap = confirmedBookingsFor(currentStaff.id).some(function (b) {
      return HomeServiceData.bookingOverlap(date, startTime, endTime, b.date, b.startTime, b.endTime);
    });
    if (overlap) return showMsg('该时间段这位阿姨已经被预约，请换个时间段。', true);

    var booking = {
      id: HomeServiceData.uid('b'),
      staffId: currentStaff.id,
      customerName: name,
      phone: phone,
      date: date,
      startTime: startTime,
      endTime: endTime,
      address: address,
      notes: notes,
      status: 'pending',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    data.bookings.push(booking);
    HomeServiceData.save(data);

    showMsg('预约申请已提交（待商家确认），共 ' + HomeServiceData.durationHours(startTime, endTime) + ' 小时。', false);
    bookingForm.reset();
  });

  function showMsg(text, isError) {
    modalMsg.innerHTML = '<div class="msg ' + (isError ? 'error' : 'success') + '">' + text + '</div>';
  }

  renderGrid();
})();
