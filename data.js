(function (global) {
  'use strict';
  var STORAGE_KEY = 'homeservice_lite_data_v1';

  function seed() {
    return {
      staff: [
        { id: 's1', name: '王阿姨', type: '保洁', rate: 45, skills: ['深度保洁', '收纳整理', '厨房清洁'], bio: '10 年家政保洁经验，做事仔细，客户复购率高。', status: 'available', color: 'linear-gradient(135deg,#19B8D4,#3ED598)' },
        { id: 's2', name: '李阿姨', type: '月嫂', rate: 80, skills: ['新生儿护理', '产后恢复', '月子餐'], bio: '持证高级月嫂，服务过 200+ 家庭，经验丰富。', status: 'available', color: 'linear-gradient(135deg,#EC4899,#7C3AED)' },
        { id: 's3', name: '张阿姨', type: '育儿嫂', rate: 55, skills: ['早教启蒙', '营养搭配', '安全看护'], bio: '幼教专业出身，擅长 0-6 岁儿童日常陪护。', status: 'available', color: 'linear-gradient(135deg,#F59E0B,#8B5CF6)' },
        { id: 's4', name: '陈师傅', type: '护工', rate: 60, skills: ['术后护理', '老年陪护', '康复辅助'], bio: '医院护工经验 8 年，持有专业护理员证书。', status: 'busy', color: 'linear-gradient(135deg,#3ED598,#19B8D4)' },
        { id: 's5', name: '刘阿姨', type: '保洁', rate: 40, skills: ['日常保洁', '擦玻璃', '家电清洁'], bio: '手脚麻利，熟悉各类家电清洁保养流程。', status: 'available', color: 'linear-gradient(135deg,#8B5CF6,#19B8D4)' },
      ],
      bookings: [
        { id: 'b1', staffId: 's1', customerName: '赵女士', phone: '13800000001', date: '2026-09-05', startTime: '09:00', endTime: '13:00', address: '朝阳区建国路 88 号', notes: '', status: 'confirmed', createdAt: '2026-08-25' },
        { id: 'b2', staffId: 's2', customerName: '孙先生', phone: '13800000002', date: '2026-09-10', startTime: '08:00', endTime: '18:00', address: '海淀区中关村南路 5 号', notes: '需要提前准备好月子餐食材清单', status: 'confirmed', createdAt: '2026-08-27' },
        { id: 'b3', staffId: 's1', customerName: '周女士', phone: '13800000003', date: '2026-08-20', startTime: '09:00', endTime: '12:00', address: '西城区西直门内大街 10 号', notes: '', status: 'confirmed', createdAt: '2026-08-10' },
        { id: 'b4', staffId: 's3', customerName: '吴女士', phone: '13800000004', date: '2026-09-15', startTime: '14:00', endTime: '18:00', address: '东城区东四十条 20 号', notes: '家里有一个 3 岁小孩', status: 'pending', createdAt: '2026-08-29' },
      ],
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        var s = seed();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
        return s;
      }
      return JSON.parse(raw);
    } catch (e) {
      return seed();
    }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function uid(prefix) {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // Time strings are zero-padded "HH:MM", so lexicographic comparison
  // matches chronological order (same trick as ISO date string comparison).
  function timeOverlap(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && bStart < aEnd;
  }

  function bookingOverlap(date, startTime, endTime, bDate, bStart, bEnd) {
    return date === bDate && timeOverlap(startTime, endTime, bStart, bEnd);
  }

  function durationHours(startTime, endTime) {
    var a = startTime.split(':');
    var b = endTime.split(':');
    var startMin = parseInt(a[0], 10) * 60 + parseInt(a[1], 10);
    var endMin = parseInt(b[0], 10) * 60 + parseInt(b[1], 10);
    return Math.max(0, (endMin - startMin) / 60);
  }

  global.HomeServiceData = {
    load: load,
    save: save,
    uid: uid,
    timeOverlap: timeOverlap,
    bookingOverlap: bookingOverlap,
    durationHours: durationHours,
    reset: function () { var s = seed(); save(s); return s; },
  };
})(window);
